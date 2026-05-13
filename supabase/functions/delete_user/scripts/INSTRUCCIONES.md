# INSTRUCCIONES PASO A PASO

Esto está escrito como si nunca antes hubieras hecho nada de esto. Si en algún paso te pierdes, parate ahí y pregúntame el número exacto del paso.

Hay 3 etapas:
- **ETAPA 1:** Probar el archivo nuevo en tu computadora (15 minutos)
- **ETAPA 2:** Activar el borrado completo de usuarios en Supabase (30-40 minutos, una sola vez)
- **ETAPA 3:** Subir los cambios a GitHub para que Vercel publique (5 minutos)

No saltes etapas. Hacelas en orden.

---

# ETAPA 1 — PROBAR EL ARCHIVO NUEVO EN TU COMPUTADORA

## Paso 1.1 — Abrir tu carpeta de proyecto

1. Abrí Visual Studio Code (VS Code).
2. Arriba a la izquierda hacé clic en **"File"** (o **"Archivo"** si está en español).
3. Hacé clic en **"Open Folder..."** (o **"Abrir carpeta..."**).
4. Buscá la carpeta donde tenés tu proyecto (donde está tu `index.html` viejo).
5. Hacé clic en **"Select Folder"** (o **"Seleccionar carpeta"**).

Ahora a la izquierda de VS Code vas a ver la lista de archivos de tu proyecto.

## Paso 1.2 — Hacer copia de seguridad de tu archivo viejo

**No saltes este paso. Es tu seguro por si algo sale mal.**

1. En VS Code, a la izquierda, buscá tu archivo `index.html`.
2. Hacé clic derecho sobre `index.html`.
3. Hacé clic en **"Rename"** (o **"Cambiar nombre"**).
4. Cambiale el nombre a: `index_VIEJO.html`
5. Apretá Enter.

## Paso 1.3 — Poner el archivo nuevo en su lugar

1. En este chat, descargá el archivo `index.html` que te entregué.
2. Va a quedar en tu carpeta **"Descargas"** (o **"Downloads"**) de tu computadora.
3. Abrí el explorador de archivos de tu computadora (Finder en Mac, Explorador en Windows).
4. Andá a Descargas.
5. Hacé clic derecho sobre `index.html` → **"Copiar"** (o `Ctrl+C` en Windows, `Cmd+C` en Mac).
6. Andá a tu carpeta de proyecto.
7. Adentro de la carpeta, hacé clic derecho en un espacio vacío → **"Pegar"** (o `Ctrl+V` / `Cmd+V`).

Ahora en tu carpeta tenés:
- `index_VIEJO.html` (tu archivo viejo, por seguridad)
- `index.html` (el nuevo)

## Paso 1.4 — Abrir el archivo nuevo con Live Server

**Necesitás una extensión de VS Code llamada "Live Server".** Si no la tenés instalada:

1. En VS Code, a la izquierda hay un ícono de cuatro cuadraditos (es "Extensions"). Hacé clic ahí.
2. Arriba aparece una barra de búsqueda. Escribí: `Live Server`
3. Buscá el que dice **"Live Server"** del autor **"Ritwick Dey"** (es el primero, tiene muchas descargas).
4. Hacé clic en el botón verde **"Install"**.
5. Esperá a que termine.

Una vez instalada:

1. Volvé a la lista de archivos (ícono de carpeta arriba a la izquierda).
2. Hacé doble clic en `index.html` (el nuevo).
3. Hacé clic derecho en cualquier parte del código abierto.
4. Hacé clic en **"Open with Live Server"**.
5. Se abre tu navegador con la app cargada.

## Paso 1.5 — Probar que todo funciona

Hacé estas 4 pruebas, una por una.

### Prueba A: Validación de correo

1. Andá a la pantalla de registro.
2. Intentá registrarte con: `vgh@ma.c ` (con un espacio al final, importante).
3. **Debe salir un mensaje rojo** que diga algo como "Tu correo tiene espacios al inicio o al final".
4. Probá con: `vgh@ma.c` (sin espacio, pero con dominio falso de 1 letra).
5. **Debe salir mensaje rojo** que diga "El correo no tiene un formato válido".
6. Probá con uno válido como `prueba@gmail.com` → debe continuar normal.

### Prueba B: Paywall

1. Cerrá sesión si estabas logueado.
2. Registrate con un usuario de prueba (uno nuevo, sin pagar).
3. Andá al resumen del Parcial 1.
4. **Debe verse:** el primer tema con su primer subtema visible; todo el resto bloqueado con una tarjeta verde "🔒 Pro" centrada.
5. Hacé lo mismo en Parcial 2 y Parcial 3.

### Prueba C: Botones del panel

1. En el panel del costado (donde están los enlaces a "Resumen", "Cobertura", etc.).
2. Asegurate de estar viendo el Parcial 1.
3. Hacé clic en **"Resumen"** del Parcial 3.
4. **Debe cambiar automáticamente al Parcial 3** y hacer scroll a la sección de resumen.

### Prueba D: BioVisuales

1. Andá a la sección BioVisual.
2. Buscá el control de velocidad (un slider).
3. Movelo al mínimo (más a la izquierda).
4. **Debe verse muy lento.**
5. Probá cada visualizador: Ciclo Celular, Enzimas, ADN, Fotosíntesis, Respiración Celular.
6. **Cada uno debe mostrar etiquetas** ("Helicasa", "Polimerasa", "Tilacoides", "Krebs", etc.) y un banner arriba con el nombre de la fase actual.

Si las 4 pruebas pasaron → seguí con la Etapa 2.
Si alguna falla → escribime cuál y qué pasó.

---

# ETAPA 2 — ACTIVAR EL BORRADO COMPLETO DE USUARIOS EN SUPABASE

Esta etapa parece larga pero es **una sola vez en la vida del proyecto**. Una vez que está lista, no la tocás más.

Vamos a:
- Instalar una herramienta en tu computadora (el "CLI de Supabase").
- Subir un archivo de código a Supabase (la "Edge Function").
- Guardar una clave secreta en Supabase.

**Antes de empezar:** tené tu proyecto de Supabase ya creado y a mano tu correo y contraseña de Supabase.

---

## Paso 2.1 — Verificar que tu computadora tiene los archivos necesarios

1. En el chat, descargá el archivo `index.ts` que está dentro de `supabase/functions/delete_user/`.
2. **Importante:** este archivo se tiene que llamar exactamente `index.ts`. Si tu computadora le agregó un número como `index (1).ts`, renombralo a `index.ts`.

## Paso 2.2 — Ubicar este archivo en tu carpeta de proyecto

1. Abrí tu carpeta de proyecto (la misma que abriste en la Etapa 1).
2. Dentro, creá una carpeta nueva llamada exactamente: `supabase`
   - **En Windows:** clic derecho en un espacio vacío → "Nuevo" → "Carpeta" → escribí `supabase` y Enter.
   - **En Mac:** clic derecho → "Nueva carpeta" → escribí `supabase` y Enter.
3. Adentro de la carpeta `supabase`, creá otra carpeta llamada: `functions`
4. Adentro de `functions`, creá otra llamada: `delete_user`
5. Movele el archivo `index.ts` que descargaste a esa carpeta `delete_user`.

Te tiene que quedar esta estructura:

```
tu-proyecto/
├── index.html
├── index_VIEJO.html
└── supabase/
    └── functions/
        └── delete_user/
            └── index.ts
```

## Paso 2.3 — Instalar el CLI de Supabase

Un "CLI" es una herramienta que se usa escribiendo comandos en una ventana negra (la "terminal"). No te asustes, vas a usar 3 comandos en total. Te los doy a copiar y pegar.

### Si usás Windows:

1. Apretá la tecla `Windows` y escribí: `PowerShell`
2. Cuando aparezca el ícono azul que dice "Windows PowerShell", hacé **clic derecho** y elegí **"Ejecutar como administrador"**.
3. Cuando te pregunte si querés permitir cambios, hacé clic en **"Sí"**.
4. Se abre una ventana azul oscura con texto blanco.
5. Pegá este comando completo (clic derecho dentro de la ventana = pegar):

   ```
   irm get.scoop.sh | iex
   ```
6. Apretá Enter. Esperá a que termine (1-2 minutos). Te va a instalar una herramienta llamada "Scoop".
7. Cuando termine, pegá este otro comando:

   ```
   scoop install supabase
   ```
8. Apretá Enter. Esperá a que termine.
9. Para verificar que se instaló, pegá:

   ```
   supabase --version
   ```
10. Si te muestra un número de versión (algo como `1.x.x` o `2.x.x`), está instalado. **Si no**, mandame captura de lo que aparece.

### Si usás Mac:

1. Apretá `Cmd + Espacio` y escribí: `Terminal`
2. Abrí la Terminal (ícono con un cuadradito negro).
3. Pegá este comando:

   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
4. Apretá Enter. Te va a pedir tu contraseña de Mac → escribila (no se ve mientras escribís, es normal). Apretá Enter.
5. Esperá a que termine de instalar "Homebrew" (puede tardar 5-10 minutos).
6. Cuando termine, pegá este otro comando:

   ```
   brew install supabase/tap/supabase
   ```
7. Apretá Enter. Esperá.
8. Para verificar:

   ```
   supabase --version
   ```
9. Si te muestra un número de versión, está instalado.

### Si usás Linux:

1. Abrí la terminal (`Ctrl + Alt + T` en Ubuntu).
2. Pegá:

   ```
   curl -fsSL https://supabase.com/install.sh | sh
   ```
3. Apretá Enter. Esperá.
4. Verificá con:

   ```
   supabase --version
   ```

## Paso 2.4 — Iniciar sesión en Supabase desde la terminal

1. En la misma terminal/PowerShell que dejaste abierta, escribí:

   ```
   supabase login
   ```
2. Apretá Enter.
3. Se va a abrir tu navegador en una página de Supabase pidiendo permiso.
4. Hacé clic en **"Authorize"** o **"Autorizar"**.
5. Volvé a la terminal. Debe aparecer un mensaje verde tipo "You are now logged in".

## Paso 2.5 — Conseguir el "Reference ID" de tu proyecto

Es como el número de identificación de tu proyecto en Supabase.

1. En tu navegador, andá a **https://supabase.com**.
2. Iniciá sesión.
3. Hacé clic en tu proyecto.
4. En el menú de la izquierda, abajo, hacé clic en el ícono de engranaje **⚙ "Project Settings"** (o "Configuración del proyecto").
5. En el menú que aparece a la izquierda, hacé clic en **"General"**.
6. Buscá una sección que diga **"Reference ID"** (suele estar arriba).
7. Vas a ver un código de 20 letras tipo `abcdefghijklmnop1234`.
8. Hacé clic en el ícono de copiar (📋) al lado.
9. **Guardá ese código en algún lado** (Bloc de Notas, post-it digital, lo que sea). Lo vas a usar en el siguiente paso.

## Paso 2.6 — Vincular tu carpeta local con el proyecto en Supabase

1. En la terminal, primero tenés que estar "ubicado" en tu carpeta de proyecto. Para eso usá el comando `cd` (cambiar directorio).

   **Si tu proyecto está en el Escritorio:**
   - Windows: `cd Desktop\nombre-de-tu-carpeta`
   - Mac/Linux: `cd ~/Desktop/nombre-de-tu-carpeta`

   **Si está en otro lado:** abrí tu carpeta en el explorador, copiá la ruta de la barra de arriba, y escribí `cd "ruta-pegada"` (con comillas si tiene espacios).

   Para verificar que estás en el lugar correcto, escribí:
   - Windows: `dir`
   - Mac/Linux: `ls`

   **Debe aparecer en la lista** `index.html` y la carpeta `supabase`.

2. Ahora escribí (reemplazando `TU_CODIGO_AQUI` por el Reference ID que copiaste en el paso 2.5):

   ```
   supabase link --project-ref TU_CODIGO_AQUI
   ```

3. Apretá Enter.
4. Te va a pedir la **contraseña de tu base de datos**. Si no la sabés:
   - Andá a Supabase Dashboard → tu proyecto → **⚙ Settings** → **Database**.
   - Buscá **"Database password"**. Si no la recordás, hacé clic en **"Reset database password"** para crear una nueva y copiala.
5. Pegá la contraseña en la terminal (no se ve mientras la pegás, es normal).
6. Apretá Enter.
7. Debe aparecer un mensaje verde tipo "Finished supabase link".

## Paso 2.7 — Conseguir la SERVICE_ROLE_KEY (clave maestra)

Esta es una clave súper poderosa. **Nunca la pongas en el HTML ni la subas a GitHub.** Solo va a vivir dentro de Supabase como secreto.

1. En tu navegador, en Supabase → tu proyecto → **⚙ Settings** → **API**.
2. Bajá hasta la sección **"Project API keys"**.
3. Vas a ver dos claves: `anon` `public` y `service_role` `secret`.
4. **Clic en "Reveal"** al lado de la `service_role`.
5. Hacé clic en el ícono de copiar (📋).
6. **Guardala en un lugar seguro temporalmente** (Bloc de Notas). Después de usarla en el paso 2.8 podés borrarla del Bloc de Notas.

## Paso 2.8 — Guardar la SERVICE_ROLE_KEY como secreto en Supabase

1. Volvé a la terminal (la misma de antes, que ya está logueada y vinculada al proyecto).
2. Escribí esto (reemplazando `PEGA_LA_CLAVE_AQUI` por la clave que copiaste):

   ```
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=PEGA_LA_CLAVE_AQUI
   ```

   Va a quedar algo así de largo:
   ```
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi...
   ```
3. Apretá Enter.
4. Debe aparecer un mensaje tipo "Finished supabase secrets set".

## Paso 2.9 — Desplegar la Edge Function

Este es el paso que sube el archivo `index.ts` a Supabase.

1. En la misma terminal, escribí:

   ```
   supabase functions deploy delete_user
   ```
2. Apretá Enter.
3. Esperá 30 segundos a 1 minuto.
4. Debe aparecer un mensaje verde tipo "Deployed Function delete_user".

## Paso 2.10 — Verificar que la Edge Function quedó activa

1. En tu navegador, andá a Supabase → tu proyecto.
2. En el menú de la izquierda buscá **"Edge Functions"** (ícono de rayito ⚡).
3. Hacé clic.
4. Debe aparecer una función llamada **`delete_user`** con estado **"Active"** en verde.

## Paso 2.11 — Probar el borrado completo desde tu app

1. Volvé a tu app (la que abriste con Live Server).
2. Cerrá sesión y volvé a iniciar como **administrador**.
3. Andá al panel de administrador.
4. Intentá borrar un usuario de prueba (creá uno antes si no tenés).
5. **Debe aparecer mensaje verde** que diga: "X eliminado completamente (incluida cuenta de auth)".
6. Para confirmar: andá a Supabase → **Authentication** → **Users**. El correo ya **no debe aparecer**.

Si funcionó → **Etapa 2 completa**. Esto que hiciste no lo vas a repetir nunca más. El borrado funciona para siempre.

---

# ETAPA 3 — SUBIR LOS CAMBIOS A GITHUB

Para que tu app actualizada llegue a Vercel, tenés que subir los cambios a GitHub. Vercel se entera solo y publica automáticamente.

## Paso 3.1 — Abrir tu repositorio en GitHub

1. En tu navegador andá a **https://github.com**.
2. Iniciá sesión si no lo estás.
3. Arriba a la izquierda hacé clic en tu nombre/avatar.
4. Hacé clic en el repositorio de tu proyecto.

## Paso 3.2 — Reemplazar el `index.html` viejo por el nuevo

1. En la página principal del repo, hacé clic sobre el archivo `index.html`.
2. Arriba a la derecha del archivo abierto hay un ícono de **lápiz** ("Edit this file"). Hacé clic.
3. Vas a ver todo el código del archivo viejo en un editor.
4. Hacé clic dentro del editor.
5. Seleccioná TODO (`Ctrl+A` en Windows, `Cmd+A` en Mac).
6. Borralo (tecla Delete).
7. Abrí el `index.html` nuevo en tu computadora (el de tu carpeta local) con VS Code.
8. Seleccioná TODO (`Ctrl+A` / `Cmd+A`) y copialo (`Ctrl+C` / `Cmd+C`).
9. Volvé a GitHub al editor vacío.
10. Pegá todo (`Ctrl+V` / `Cmd+V`).
11. Bajá hasta el final de la página.
12. En la caja **"Commit changes"** escribí un mensaje corto, por ejemplo: `Actualización: paywall, validaciones, BioVisuales y deleteUser`
13. Dejá seleccionado **"Commit directly to the main branch"**.
14. Hacé clic en el botón verde **"Commit changes"**.

## Paso 3.3 — Subir los archivos nuevos a GitHub

Tenés que subir 3 archivos más:

- `supabase/functions/delete_user/index.ts`
- `scripts/check_html.py`
- `INSTRUCCIONES.md` (este mismo archivo)

**Para cada archivo:**

1. En GitHub, en la página principal de tu repo, arriba a la derecha hacé clic en **"Add file"** → **"Create new file"**.
2. En el campo del nombre del archivo, escribí la **ruta completa con barras**. Por ejemplo:
   - Para el primero: `supabase/functions/delete_user/index.ts`
   - Para el segundo: `scripts/check_html.py`
   - Para el tercero: `INSTRUCCIONES.md`
3. Las barras `/` hacen que GitHub cree las carpetas automáticamente.
4. Abajo, en el editor grande, pegá el contenido del archivo (descargado de este chat, abierto con cualquier editor).
5. Bajá al final de la página.
6. Escribí un mensaje tipo: `Agrega Edge Function delete_user` (o lo que corresponda).
7. Clic en **"Commit new file"**.

Repetí el proceso para los 3 archivos.

## Paso 3.4 — Verificar que Vercel actualizó tu app

1. Andá a **https://vercel.com**.
2. Iniciá sesión.
3. Hacé clic en tu proyecto.
4. Vas a ver una sección **"Deployments"**.
5. Debería aparecer un deployment nuevo en estado **"Building"**.
6. Esperá 1-2 minutos hasta que pase a **"Ready"**.
7. Hacé clic en el botón **"Visit"** arriba a la derecha.
8. Tu app está actualizada en producción.

---

# ¿QUÉ HACER SI ALGO SALE MAL?

## El archivo no se actualiza en el navegador
- **Windows:** apretá `Ctrl + F5` (recarga forzada).
- **Mac:** apretá `Cmd + Shift + R`.

## Live Server no abre nada
- Verificá que tengas instalada la extensión "Live Server" de Ritwick Dey.
- Cerrá VS Code y abrilo de nuevo.

## `supabase --version` no funciona / "command not found"
- En Windows: cerrá PowerShell y abrilo de nuevo (como administrador).
- En Mac: cerrá Terminal y abrilo de nuevo.
- Si sigue sin funcionar, mandame captura.

## `supabase login` no abre el navegador
- Copiá el enlace que aparece en la terminal y pegalo manualmente en tu navegador.

## `supabase link` me da error
- Verificá que el Reference ID está bien copiado (sin espacios al inicio o final).
- Verificá que la contraseña de la base de datos es correcta.

## `supabase functions deploy delete_user` me da error
- Verificá que estás en la carpeta correcta (con `ls` o `dir` debe aparecer la carpeta `supabase`).
- Verificá que el archivo está exactamente en `supabase/functions/delete_user/index.ts`.

## La Edge Function aparece en Supabase pero el borrado da error
1. Abrí tu app.
2. Apretá `F12` → se abre DevTools del navegador.
3. Arriba en DevTools hacé clic en **"Console"**.
4. Intentá borrar el usuario otra vez.
5. Sacame captura de TODO lo que aparezca en rojo/naranja en la Console.

## Vercel dice que el deploy falló
1. En Vercel, hacé clic en el deployment que falló.
2. Vas a ver un log con texto rojo.
3. Copiá las últimas 20 líneas y mandámelas.

---

# RESUMEN VISUAL

```
┌─────────────────────────────────────┐
│  ETAPA 1 — Tu computadora           │
│  ✓ Renombrar index.html viejo       │
│  ✓ Poner index.html nuevo           │
│  ✓ Probar con Live Server           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  ETAPA 2 — Supabase + Terminal      │
│  ✓ Instalar CLI de Supabase         │
│  ✓ supabase login                   │
│  ✓ supabase link                    │
│  ✓ Guardar SERVICE_ROLE_KEY         │
│  ✓ supabase functions deploy        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  ETAPA 3 — GitHub (en la web)       │
│  ✓ Reemplazar index.html en repo    │
│  ✓ Subir index.ts, check_html.py    │
│  ✓ Esperar deploy de Vercel         │
└─────────────────────────────────────┘
              ↓
       ✅ App actualizada
```

---

# CHECKLIST FINAL

**Etapa 1:**
- [ ] Renombré mi `index.html` viejo a `index_VIEJO.html`
- [ ] Puse el `index.html` nuevo en la carpeta
- [ ] Lo abrí con Live Server
- [ ] Probé rechazo de correos mal escritos
- [ ] Probé paywall en P1, P2 y P3
- [ ] Probé botones del panel
- [ ] Probé BioVisuales

**Etapa 2:**
- [ ] Creé la estructura de carpetas `supabase/functions/delete_user/`
- [ ] Puse el archivo `index.ts` ahí
- [ ] Instalé el CLI de Supabase
- [ ] `supabase --version` me funcionó
- [ ] `supabase login` me funcionó
- [ ] Copié el Reference ID de mi proyecto
- [ ] `supabase link` me funcionó
- [ ] Copié la SERVICE_ROLE_KEY
- [ ] `supabase secrets set` me funcionó
- [ ] `supabase functions deploy delete_user` me funcionó
- [ ] La función aparece como "Active" en Supabase
- [ ] Borré un usuario de prueba desde mi app → "eliminado completamente"

**Etapa 3:**
- [ ] Reemplacé `index.html` en GitHub
- [ ] Subí `supabase/functions/delete_user/index.ts`
- [ ] Subí `scripts/check_html.py`
- [ ] Subí `INSTRUCCIONES.md`
- [ ] Vercel hizo deploy → "Ready"
- [ ] Visité la app y veo todo actualizado

Cuando todo esté marcado → **terminamos**. Tu app está actualizada, los usuarios borrados se eliminan completamente, y tenés todo respaldado en GitHub.

