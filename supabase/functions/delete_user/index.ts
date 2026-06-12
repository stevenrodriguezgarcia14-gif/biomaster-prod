// supabase/functions/delete_user/index.ts
//
// Edge Function que borra un usuario COMPLETO de Supabase (auth + tablas).
// Solo puede invocarla un usuario con role='admin' en la tabla profiles.
//
// Requiere que las siguientes variables estén disponibles en el entorno de la
// Edge Function (Supabase las inyecta automáticamente si las configuras):
//   - SUPABASE_URL              (lo da Supabase)
//   - SUPABASE_ANON_KEY         (lo da Supabase)
//   - SUPABASE_SERVICE_ROLE_KEY (LO TIENES QUE CONFIGURAR TÚ, ver pasos abajo)
//
// Despliegue desde tu máquina:
//   supabase functions deploy delete_user
//
// Cómo la invoca el frontend (ya está integrado en index.html):
//   await sb.functions.invoke('delete_user', { body: { target_email: 'x@y.com' } })

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Orígenes permitidos. En preview/staging Vercel el origen varía,
// pero la protección real es el JWT de Supabase (no CORS).
const ALLOWED_ORIGINS = [
  "https://biomaster.app",
  "https://www.biomaster.app",
];

function getCors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const CORS = getCors(origin);

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Preflight CORS
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      { error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en la Edge Function." },
      500,
    );
  }

  // Cliente con el JWT del usuario que invoca (para verificar quién es)
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // 1. Verificar que quien invoca está autenticado
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "No autenticado" }, 401);
  }
  const callerId = userData.user.id;

  // 2. Verificar que el invocador es admin (consultando profiles con su propio JWT)
  const { data: callerProfile, error: profErr } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", callerId)
    .maybeSingle();
  if (profErr || !callerProfile || callerProfile.role !== "admin") {
    return json({ error: "Solo administradores pueden borrar usuarios" }, 403);
  }

  // 3. Leer correo objetivo del body
  let target_email: string | undefined;
  try {
    const body = await req.json();
    target_email = body?.target_email?.trim?.();
  } catch {
    return json({ error: "Body inválido (se espera JSON con target_email)" }, 400);
  }
  if (!target_email) return json({ error: "Falta target_email" }, 400);

  // 4. Cliente admin con service_role (puede tocar auth.users)
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 5. Buscar el id en profiles (case-insensitive)
  const { data: targetProf, error: searchErr } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", target_email)
    .maybeSingle();
  if (searchErr) {
    return json({ error: "Error buscando el perfil: " + searchErr.message }, 500);
  }
  if (!targetProf) {
    return json({ error: "Usuario no encontrado en profiles" }, 404);
  }

  // 6. No permitir que un admin se borre a sí mismo accidentalmente
  if (targetProf.id === callerId) {
    return json({ error: "No puedes borrar tu propia cuenta desde aquí" }, 400);
  }

  const targetId = targetProf.id as string;
  const errors: Record<string, string> = {};

  // 7. Borrar de las tablas públicas (orden importa por FKs)
  const tables = [
    { name: "user_progress", col: "user_id" },
    { name: "feedback", col: "user_id" },
    { name: "payments_log", col: "user_id" },
    { name: "game_scores", col: "user_id" },
  ];
  for (const t of tables) {
    const { error } = await admin.from(t.name).delete().eq(t.col, targetId);
    if (error) errors[t.name] = error.message;
  }
  // profiles al final porque otras tablas suelen referenciarla
  {
    const { error } = await admin.from("profiles").delete().eq("id", targetId);
    if (error) errors["profiles"] = error.message;
  }

  // 8. Borrar de auth.users (esto es lo que ningún cliente puede hacer)
  const { error: authErr } = await admin.auth.admin.deleteUser(targetId);
  if (authErr) errors["auth.users"] = authErr.message;

  if (Object.keys(errors).length === 0) {
    return json({ ok: true, deleted: target_email });
  }
  return json(
    {
      error: "Borrado parcial",
      deleted_partial: true,
      details: errors,
    },
    207,
  );
});
