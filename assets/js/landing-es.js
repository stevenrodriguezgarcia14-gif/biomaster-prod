/* ═══════════════════════════════════════════════════════════
   BioMaster — Landing (ES) · assets/js/landing-es.js
   JS autónomo de la landing page. NO carga Supabase SDK ni el
   código de la app: la app vive en /app (app.html).
   Portado del monolito index.html (F1 de la separación landing/app).
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict'

/* Ruta de la app. En producción (Vercel cleanUrls) es "/app".
   En local (Live Server, file://, localhost) no hay clean URLs, así que
   usamos "app.html" (relativo) para poder probar. Detección por hostname. */
var _isLocal = location.protocol === 'file:' ||
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname) ||
  location.hostname === ''
var APP_URL = _isLocal ? 'app.html' : '/app'

/* ── Sesión existente → los CTAs llevan directo a la app ────
   Detecta el token de Supabase en localStorage (clave sb-*-auth-token)
   sin cargar el SDK. Si hay sesión, el botón "Iniciar sesión" pasa a
   "Abrir la app". Los handlers siempre navegan a /app; la app decide. */
function hasStoredSession(){
  try {
    for (var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i)
      if (/^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true
    }
  } catch(e){}
  return false
}

window.openAuthFromLanding = function(tab){
  location.href = APP_URL + (tab === 'register' ? '#register' : '#login')
}
window.enterAsGuestFromLanding = function(){
  location.href = APP_URL + '#guest'
}
window.openPricingModal = function(){
  var el = document.getElementById('lp-precio')
  if (el) el.scrollIntoView({ behavior:'smooth' })
}

if (hasStoredSession()){
  document.querySelectorAll('button[onclick*="openAuthFromLanding(\'login\')"]').forEach(function(b){
    b.textContent = 'Abrir la app →'
  })
}

/* ── Botones de plan (data-plan-cta) → modal PayPal ───────── */
document.querySelectorAll('[data-plan-cta]').forEach(function(btn){
  btn.addEventListener('click', function(){
    window._openPayPalModal(btn.dataset.planCta)
  })
})

/* ── Modal PayPal (hosted buttons oficiales) ────────────────
   Copia del flujo de la app; en la landing no hay sesión cargada,
   así que la nota de correo es genérica. NO modifica montos ni buttonIds. */
window._openPayPalModal = function(plan){
  var cfg = (window.PAYPAL_PLANS || {})[plan] || (window.PAYPAL_PLANS || {}).semestre
  if (!cfg) return
  var modal = document.getElementById('pricingModal')
  var content = document.getElementById('pmContent')
  if (!modal || !content) return
  var emailNote = '<p class="pm-email-note">Asegurate de usar el mismo correo con el que te registraste (o te vas a registrar) en BioMaster al completar el pago.</p>'
  var sinpeSubject = encodeURIComponent('Comprobante SINPE — ' + cfg.label)
  var sinpeBody = encodeURIComponent('Hola equipo BioMaster,\n\nAdjunto comprobante SINPE Móvil para activar mi plan.\n\nPlan: ' + cfg.label + ' (' + cfg.price + ')\nEmail registrado en BioMaster: (completar)\n\n(Adjunto captura del SMS de confirmación.)\n\nGracias.')
  content.innerHTML =
    '<h3 style="margin:0 0 .5rem;font-size:1.2rem">💳 Pagar con PayPal</h3>' +
    '<div class="pm-plan-badge">' +
      '<span class="pm-plan-name">' + cfg.label + '</span>' +
      '<span class="pm-plan-price">' + cfg.price + '</span>' +
      '<span class="pm-plan-dur">' + cfg.duration + '</span>' +
    '</div>' +
    emailNote +
    '<div class="pm-paypal-wrap">' +
      '<button class="_pp-pay-btn" type="button" style="background:none;border:none;cursor:pointer;display:block;margin:0 auto;padding:0">' +
        '<img src="https://www.paypalobjects.com/es_XC/i/btn/btn_buynowCC_LG.gif" alt="Pagar con PayPal" title="PayPal — forma segura y fácil de pagar en línea." style="display:block" />' +
      '</button>' +
      '<p class="_pp-msg" style="display:none;text-align:center;margin:.6rem 0 0;font-size:.85rem;color:var(--muted)">Redirigiendo a PayPal…</p>' +
      '<p class="pm-paypal-note">Se abre PayPal en la misma pestaña. Podés pagar con tarjeta sin cuenta PayPal.</p>' +
    '</div>' +
    '<details class="pm-sinpe-alt">' +
      '<summary>¿Preferís pagar por SINPE Móvil? <small>(solo Costa Rica)</small></summary>' +
      '<div class="pm-sinpe-body">' +
        '<ol style="padding-left:1.1rem;font-size:.86rem;line-height:1.7;margin:.5rem 0">' +
          '<li>Realizá el SINPE Móvil al número <strong>8713 7782</strong>.</li>' +
          '<li>Enviá el comprobante (SMS) a <strong>Biomaster.oficial@gmail.com</strong> con tu correo de BioMaster.</li>' +
          '<li>Activamos tu acceso en menos de 24 h.</li>' +
        '</ol>' +
        '<a href="mailto:Biomaster.oficial@gmail.com?subject=' + sinpeSubject + '&body=' + sinpeBody + '" style="display:inline-block;font-size:.83rem;color:var(--green);font-weight:700;text-decoration:underline;text-underline-offset:2px">Enviar comprobante →</a>' +
      '</div>' +
    '</details>' +
    '<button onclick="document.getElementById(\'pricingModal\').classList.remove(\'show\')" style="display:block;width:100%;margin-top:.8rem;background:none;border:none;color:var(--muted);font-size:.82rem;cursor:pointer;padding:.3rem;text-decoration:underline;text-underline-offset:2px">Cancelar</button>'
  var ppBtn = content.querySelector('._pp-pay-btn')
  if (ppBtn){
    ppBtn.addEventListener('click', function(){
      var img = ppBtn.querySelector('img')
      var msg = content.querySelector('._pp-msg')
      if (img){ img.style.opacity = '.4'; img.style.pointerEvents = 'none' }
      if (msg) msg.style.display = 'block'
      ppBtn.disabled = true
      var url = 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=' + cfg.buttonId +
        '&return=' + encodeURIComponent('https://biomaster.app/#pago-confirmado') +
        '&cancel_return=' + encodeURIComponent('https://biomaster.app/#pago-cancelado')
      setTimeout(function(){
        if (!document.querySelector('._pp-pay-btn')) return
        if (msg) msg.innerHTML = '⚠️ No se pudo redirigir automáticamente. <a href="' + url + '" target="_blank" rel="noopener" style="color:var(--green);font-weight:700;text-decoration:underline">Abrí PayPal acá →</a>'
        if (img) img.style.opacity = '1'
        ppBtn.disabled = false
      }, 5000)
      window.location.href = url
    }, { once: true })
  }
  modal.classList.add('show')
  if (window.Analytics && window.Analytics.trackPaymentStarted) window.Analytics.trackPaymentStarted(plan)
}

/* ── Overlay de resultado de pago (retorno de PayPal) ───────
   PayPal redirige a https://biomaster.app/#pago-confirmado|#pago-cancelado.
   La landing muestra el overlay directamente (el comprador puede no
   tener cuenta todavía). El mismo overlay existe también en /app. */
;(function(){
  var h = window.location.hash
  if (h !== '#pago-confirmado' && h !== '#pago-cancelado') return
  function mostrarOverlay(){
    var ov = document.getElementById('payResultOverlay')
    if (!ov) return
    var esConfirmado = (h === '#pago-confirmado')
    document.getElementById('payResultConfirmado').style.display = esConfirmado ? '' : 'none'
    document.getElementById('payResultCancelado').style.display = esConfirmado ? 'none' : ''
    ov.classList.add('show')
    if (esConfirmado && window.Analytics && window.Analytics.trackPaymentCompleted) window.Analytics.trackPaymentCompleted(null)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrarOverlay)
  else mostrarOverlay()
})()

/* ── MODAL LEGAL: privacidad / términos / reembolsos / contacto ── */
window.openLegal = function(seccion){
  var modal = document.getElementById('legalModal')
  var titleEl = document.getElementById('legalTitle')
  var contentEl = document.getElementById('legalContent')
  if (!modal || !titleEl || !contentEl) return
  var today = new Date().toISOString().slice(0,10)
  var docs = {
    privacidad: {
      title: '🔒 Política de privacidad',
      html: '<p style="margin-bottom:.8rem"><small><em>Última actualización: ' + today + '</em></small></p>' +
        '<p><strong>1. Quiénes somos</strong></p>' +
        '<p>BioMaster es una herramienta de estudio independiente operada de forma personal en Costa Rica. <strong>No es producto oficial del Tecnológico de Costa Rica (TEC)</strong> ni está afiliada institucionalmente al TEC.</p>' +
        '<p style="margin-top:.8rem"><strong>2. Qué datos recolectamos</strong></p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li><strong>Datos de cuenta:</strong> email, nombre que ingresás al registrarte y una contraseña que guardamos cifrada (nunca en texto plano).</li>' +
          '<li><strong>Datos de uso:</strong> tu progreso académico, intentos de simulacros, resultados de minijuegos, XP acumulada y mensajes de feedback.</li>' +
          '<li><strong>Datos de pago:</strong> si pagás por SINPE Móvil, registramos manualmente plan adquirido, monto, fecha y nota interna. No almacenamos números de tarjeta.</li>' +
        '</ul>' +
        '<p style="margin-top:.8rem"><strong>3. Para qué usamos tus datos</strong></p>' +
        '<p>Únicamente para hacer funcionar la plataforma: guardar tu progreso, validar tu plan activo, contactarte si nos enviás feedback, y procesar pagos manuales.</p>' +
        '<p style="margin-top:.8rem"><strong>4. Con quién los compartimos</strong></p>' +
        '<p>No vendemos ni compartimos tus datos con terceros con fines comerciales. Los datos se almacenan en infraestructura de Supabase (servidores en Estados Unidos) y Vercel, con cifrado en tránsito (HTTPS) y en reposo.</p>' +
        '<p style="margin-top:.8rem"><strong>5. Tus derechos (Ley 8968 Costa Rica)</strong></p>' +
        '<p>Podés solicitar en cualquier momento acceso, rectificación, eliminación o portabilidad de tus datos personales escribiéndonos a <strong>Biomaster.oficial@gmail.com</strong>. Procesamos solicitudes en máximo 5 días hábiles.</p>' +
        '<p style="margin-top:.8rem"><strong>6. Cookies y rastreo</strong></p>' +
        '<p>Usamos almacenamiento local del navegador (localStorage) para mantener tu sesión activa. No usamos cookies de publicidad ni rastreadores de terceros.</p>' +
        '<p style="margin-top:.8rem"><strong>7. Menores de edad</strong></p>' +
        '<p>BioMaster está dirigida a estudiantes del curso Biología General del TEC, mayoritariamente mayores de edad. Si sos menor de 18 años, requerís consentimiento de tu representante legal.</p>'
    },
    terminos: {
      title: '📋 Términos de uso',
      html: '<p style="margin-bottom:.8rem"><small><em>Última actualización: ' + today + '</em></small></p>' +
        '<p><strong>1. Naturaleza del servicio</strong></p>' +
        '<p>BioMaster es una <strong>herramienta de estudio independiente</strong>, no oficial del TEC. El contenido es referencial, basado en el temario del curso Biología General y en exámenes liberados de años anteriores.</p>' +
        '<p style="margin-top:.8rem"><strong>2. Sobre los resultados académicos</strong></p>' +
        '<p style="background:var(--soft);padding:.6rem .8rem;border-radius:8px;border-left:3px solid var(--green)"><strong>BioMaster NO garantiza la aprobación de ningún examen, parcial ni del curso.</strong> Los resultados académicos dependen exclusivamente del esfuerzo, preparación y desempeño individual de cada estudiante el día del examen. La plataforma es una ayuda complementaria al estudio, no un sustituto del trabajo personal ni de las clases del curso.</p>' +
        '<p style="margin-top:.8rem"><strong>3. Uso aceptable</strong></p>' +
        '<p>Te comprometés a usar BioMaster con fines educativos personales. No está permitido: compartir tu cuenta, redistribuir el contenido, usarlo con fines comerciales no autorizados, ni intentar vulnerar la seguridad de la plataforma.</p>' +
        '<p style="margin-top:.8rem"><strong>4. Contenido</strong></p>' +
        '<p>El contenido (resúmenes, preguntas, simulacros, juegos) es de uso interno de la plataforma. La autoría intelectual queda reservada. El temario base es propiedad académica del TEC.</p>' +
        '<p style="margin-top:.8rem"><strong>5. Pagos y planes</strong></p>' +
        '<p>Los planes son personales e intransferibles. Tienen una duración específica desde la fecha de activación y se desactivan automáticamente al vencer.</p>' +
        '<p style="margin-top:.8rem"><strong>6. Disponibilidad</strong></p>' +
        '<p>Hacemos lo posible por mantener la plataforma disponible 24/7, pero no garantizamos disponibilidad ininterrumpida. Pueden ocurrir mantenimientos o caídas técnicas.</p>' +
        '<p style="margin-top:.8rem"><strong>7. Cambios</strong></p>' +
        '<p>Podemos actualizar estos términos. Si hay cambios significativos, te avisaremos por correo o desde la plataforma.</p>' +
        '<p style="margin-top:.8rem"><strong>8. Limitación de responsabilidad</strong></p>' +
        '<p>BioMaster se ofrece "tal cual está". No nos hacemos responsables por: errores en el contenido derivados del temario base, pérdida de progreso por fallas técnicas más allá de nuestro control, decisiones académicas que tomes en base al material, o consecuencias indirectas del uso de la plataforma.</p>'
    },
    reembolsos: {
      title: '💰 Política de reembolsos',
      html: '<p style="margin-bottom:.8rem"><small><em>Última actualización: ' + today + '</em></small></p>' +
        '<p><strong>1. Período de reembolso</strong></p>' +
        '<p>Tenés <strong>7 días calendario</strong> desde la activación de tu plan para solicitar un reembolso, siempre que no hayás usado más del <strong>20% del contenido pago</strong> (medido por simulacros completados, juegos terminados, secciones premium accedidas y diagnóstico/plan utilizados).</p>' +
        '<p style="margin-top:.8rem"><strong>2. Cómo solicitarlo</strong></p>' +
        '<p>Escribinos al correo oficial <strong>Biomaster.oficial@gmail.com</strong> indicando:</p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li>Tu email registrado en BioMaster.</li>' +
          '<li>Plan adquirido y fecha aproximada del pago.</li>' +
          '<li>Razón del reembolso.</li>' +
        '</ul>' +
        '<p style="margin-top:.8rem"><strong>3. Procesamiento</strong></p>' +
        '<p>Pagos por SINPE Móvil: te devolvemos el monto al mismo número desde el cual pagaste, en máximo 3 días hábiles.</p>' +
        '<p style="margin-top:.8rem"><strong>4. No reembolsable</strong></p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li>Solicitudes después de los 7 días.</li>' +
          '<li>Cuentas con uso superior al 20%.</li>' +
          '<li>Planes activados como cortesía o beca (que no fueron pagados).</li>' +
          '<li>Renovaciones del plan mensual posteriores a la primera (las renovaciones se cancelan hacia adelante, no se reembolsan).</li>' +
        '</ul>' +
        '<p style="margin-top:.8rem"><strong>5. Registro de avance y validación</strong></p>' +
        '<p style="background:var(--soft);padding:.6rem .8rem;border-radius:8px;border-left:3px solid var(--green);font-size:.9rem"><strong>Importante:</strong> BioMaster mantiene un registro administrativo del progreso máximo alcanzado por cada cuenta. Este registro se utiliza únicamente para validar reembolsos y se conserva aunque el usuario reinicie su progreso visible desde "Borrar mi progreso". <strong>Reiniciar tu progreso jugable NO borra ni modifica el registro administrativo de avance ni anula el 20% ya alcanzado.</strong> Así garantizamos transparencia y evitamos disputas.</p>' +
        '<p style="margin-top:.8rem"><strong>6. Resolución</strong></p>' +
        '<p>Aprobamos reembolsos legítimos sin discusión. Si hay desacuerdo sobre el uso, compartimos contigo el registro administrativo de actividad de tu cuenta como evidencia.</p>'
    },
    contacto: {
      title: '📞 Contacto y soporte',
      html: '<p>Estamos para ayudarte. Tiempo típico de respuesta: <strong>menos de 24 horas</strong> en días hábiles.</p>' +
        '<div style="margin-top:1rem;padding:1rem;background:var(--soft);border-radius:10px">' +
          '<p><strong>📱 WhatsApp (preferido)</strong><br><a href="https://wa.me/50687137782?text=Hola%2C%20necesito%20ayuda%20con%20BioMaster" target="_blank" rel="noopener" style="color:var(--green);font-weight:700;font-size:1.05rem">8713 7782</a></p>' +
          '<p style="margin-top:.6rem"><strong>💬 Desde la plataforma</strong><br>Si ya tenés cuenta, podés escribirnos desde la sección <em>Feedback</em> dentro de la app. Recibimos todos los mensajes y respondemos.</p>' +
        '</div>' +
        '<p style="margin-top:1rem"><strong>Operamos desde:</strong> Costa Rica 🇨🇷</p>' +
        '<p style="margin-top:.6rem"><strong>Para qué podés escribirnos:</strong></p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li>Confirmación de pago SINPE Móvil.</li>' +
          '<li>Activación o problemas con tu plan.</li>' +
          '<li>Reembolsos.</li>' +
          '<li>Reportes de errores o sugerencias.</li>' +
          '<li>Becas y descuentos para casos especiales.</li>' +
        '</ul>'
    }
  }
  var doc = docs[seccion] || docs.privacidad
  titleEl.textContent = doc.title
  contentEl.innerHTML = doc.html
  modal.style.display = 'flex'
  contentEl.scrollTop = 0
}

/* ── TESTIMONIOS PÚBLICOS via REST (sin SDK de Supabase) ────
   Lee feedback con is_public=true. La anon key es pública por diseño
   (igual que en la app); RLS limita el SELECT anónimo. */
function loadPublicTestimonials(){
  var grid = document.getElementById('lpTestimonialsGrid')
  var cfg = window.BIOMASTER_CONFIG
  if (!grid || !cfg) return
  var headers = { apikey: cfg.SUPABASE_ANON, Authorization: 'Bearer ' + cfg.SUPABASE_ANON }
  var base = cfg.SUPABASE_URL + '/rest/v1/feedback'
  var qJoin = base + '?select=id,text,experience_text,type,created_at,rating,profiles(name)&is_public=eq.true&order=created_at.desc&limit=6'
  var qPlain = base + '?select=id,text,experience_text,type,created_at,rating&is_public=eq.true&order=created_at.desc&limit=6'
  function render(data){
    if (!data || !data.length) return
    var safe = function(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] }) }
    var cards = data.map(function(f){
      var fullName = ((f.profiles && f.profiles.name) || '').trim() || 'Estudiante BioMaster'
      var firstName = fullName.split(/\s+/)[0]
      var initial = (fullName[0] || 'B').toUpperCase()
      var txt = (f.experience_text || f.text || '').trim()
      if (!txt) return ''
      var display = txt.length > 450 ? txt.slice(0, 447) + '…' : txt
      var r = (f.rating >= 1 && f.rating <= 5) ? f.rating : 5
      var starsHtml = '<span style="color:#f5b417">' + '★'.repeat(r) + '</span>' +
        '<span style="color:#ccc">' + '★'.repeat(5 - r) + '</span>'
      return '<div class="lp-test" data-feedback-id="' + f.id + '">' +
        '<div class="lp-test-stars">' + starsHtml + '</div>' +
        '<p class="lp-test-text">"' + safe(display) + '"</p>' +
        '<div class="lp-test-author">' +
          '<div class="lp-test-avatar">' + safe(initial) + '</div>' +
          '<div><div class="lp-test-name">' + safe(firstName) + '</div>' +
          '<div class="lp-test-role">Estudiante BioMaster</div></div>' +
        '</div></div>'
    }).filter(Boolean)
    if (cards.length) grid.innerHTML = cards.slice(0, 6).join('')
  }
  fetch(qJoin, { headers: headers })
    .then(function(r){ if (!r.ok) throw new Error('join query ' + r.status); return r.json() })
    .then(render)
    .catch(function(){
      fetch(qPlain, { headers: headers })
        .then(function(r){ return r.ok ? r.json() : [] })
        .then(render)
        .catch(function(e){ console.warn('[testimonios]', e) })
    })
}
loadPublicTestimonials()

/* ── Año dinámico en footer ── */
var yearEl = document.getElementById('lpYear')
if (yearEl) yearEl.textContent = new Date().getFullYear()

/* ── Scroll-reveal ── */
;(function(){
  var lp = document.getElementById('landingPage')
  if (!lp || !('IntersectionObserver' in window)) return
  var jsTargets = lp.querySelectorAll('.lp-section,.lp-feat,.lp-plan,.lp-step,.lp-test,.lp-prob-col,.lp-pago-card,.lp-compare-item,.lp-faq details')
  jsTargets.forEach(function(el, i){
    el.classList.add('lp-reveal')
    if (i % 3 === 1) el.classList.add('lp-reveal-delay-1')
    if (i % 3 === 2) el.classList.add('lp-reveal-delay-2')
  })
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('lp-visible'); io.unobserve(e.target) }
    })
  }, { threshold: 0, rootMargin: '0px 0px 80px 0px' })
  lp.querySelectorAll('.lp-reveal').forEach(function(el){ io.observe(el) })
  requestAnimationFrame(function(){
    lp.querySelectorAll('.lp-reveal:not(.lp-visible)').forEach(function(el){
      var r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0){ el.classList.add('lp-visible'); io.unobserve(el) }
    })
  })
})()

/* ── Partículas biológicas en hero ── */
;(function(){
  var canvas = document.getElementById('bioCanvas')
  if (!canvas || !canvas.getContext) return
  var ctx = canvas.getContext('2d')
  var W, H, raf = null
  var N = 65, CONNECT = 130
  var particles = []
  function Particle(){
    this.x = Math.random() * W
    this.y = Math.random() * H
    this.r = Math.random() * 2.2 + 0.8
    this.vx = (Math.random() - .5) * .38
    this.vy = (Math.random() - .5) * .38
    this.alpha = Math.random() * .4 + .18
    this.pulse = Math.random() * Math.PI * 2
    this.isCell = Math.random() > .7
  }
  function resize(){
    W = canvas.width = canvas.offsetWidth || window.innerWidth
    H = canvas.height = canvas.offsetHeight || 600
  }
  function init(){
    resize()
    particles.length = 0
    for (var i = 0; i < N; i++) particles.push(new Particle())
  }
  function frame(){
    ctx.clearRect(0, 0, W, H)
    for (var i = 0; i < N; i++){
      for (var j = i + 1; j < N; j++){
        var dx = particles[i].x - particles[j].x
        var dy = particles[i].y - particles[j].y
        var d2 = dx*dx + dy*dy
        if (d2 < CONNECT * CONNECT){
          var d = Math.sqrt(d2)
          ctx.beginPath()
          ctx.strokeStyle = 'rgba(74,222,128,' + (.2 * (1 - d / CONNECT)).toFixed(3) + ')'
          ctx.lineWidth = .6
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }
    for (var k = 0; k < N; k++){
      var p = particles[k]
      p.pulse += .019
      var r = p.r + Math.sin(p.pulse) * .55
      if (p.isCell){
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 3.8, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(74,222,128,' + (p.alpha * .42).toFixed(3) + ')'
        ctx.lineWidth = 1.1
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(47,200,100,' + (p.alpha * .18).toFixed(3) + ')'
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(74,222,128,' + p.alpha.toFixed(3) + ')'
        ctx.fill()
      }
      p.x += p.vx; p.y += p.vy
      if (p.x < -35) p.x = W + 35
      else if (p.x > W + 35) p.x = -35
      if (p.y < -35) p.y = H + 35
      else if (p.y > H + 35) p.y = -35
    }
    raf = requestAnimationFrame(frame)
  }
  var hero = document.querySelector('.lp-hero')
  if (hero && 'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ if (!raf) frame() }
        else { if (raf){ cancelAnimationFrame(raf); raf = null } }
      })
    }).observe(hero)
  } else {
    frame()
  }
  window.addEventListener('resize', function(){
    resize()
    particles.forEach(function(p){ p.x = Math.random() * W; p.y = Math.random() * H })
  })
  init()
})()

/* ── Canvas biológico global (atmósfera de toda la landing) ── */
;(function(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return
  var canvas = document.getElementById('bioLandingBg')
  if (!canvas || !canvas.getContext) return
  var ctx = canvas.getContext('2d')
  var lp = document.getElementById('landingPage')
  if (!lp) return
  var W = 0, H = 0, raf = null
  var N = 22
  var pts = []
  function Pt(){
    this.x = Math.random() * W
    this.y = Math.random() * H
    this.vx = (Math.random() - .5) * .16
    this.vy = (Math.random() - .5) * .16
    this.r = Math.random() * 1.8 + .4
    this.a = Math.random() * .08 + .03
    this.isCell = Math.random() > .72
    this.pulse = Math.random() * Math.PI * 2
  }
  function resize(){
    W = canvas.width = lp.offsetWidth || window.innerWidth
    H = canvas.height = lp.scrollHeight || 4000
  }
  function init(){ resize(); pts.length = 0; for (var i=0;i<N;i++) pts.push(new Pt()) }
  function frame(){
    ctx.clearRect(0, 0, W, H)
    for (var i = 0; i < N; i++){
      var p = pts[i]
      p.pulse += .009
      var r = p.r + Math.sin(p.pulse) * .3
      if (p.isCell){
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 4.5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(74,222,128,' + (p.a * .25).toFixed(3) + ')'
        ctx.lineWidth = .7
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(74,222,128,' + p.a.toFixed(3) + ')'
      ctx.fill()
      p.x += p.vx; p.y += p.vy
      if (p.x < -60) p.x = W + 60; else if (p.x > W + 60) p.x = -60
      if (p.y < -60) p.y = H + 60; else if (p.y > H + 60) p.y = -60
    }
    raf = requestAnimationFrame(frame)
  }
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ if (!raf){ if (!pts.length) init(); frame() } }
        else { if (raf){ cancelAnimationFrame(raf); raf = null } }
      })
    }, { threshold: 0 }).observe(lp)
  }
  init(); frame()
  window.addEventListener('resize', function(){
    resize()
    pts.forEach(function(p){ p.x = Math.random() * W; p.y = Math.random() * H })
  })
})()

/* ── Ruta biológica "Cómo funciona" ── */
;(function(){
  if (!('IntersectionObserver' in window)) return
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return
  var sec = document.getElementById('lp-howit-sec')
  if (!sec) return
  var triggered = false
  new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting && !triggered){
        triggered = true
        var line = sec.querySelector('.lp-path-line')
        if (line) line.classList.add('drawn')
        sec.querySelectorAll('.lp-path-node').forEach(function(n, i){
          n.style.transition = 'opacity .4s ease'
          setTimeout(function(){ n.style.opacity = '.9' }, 500 + i * 350)
        })
      }
    })
  }, { threshold: 0.25 }).observe(sec)
})()

})()
