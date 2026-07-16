/* ═══════════════════════════════════════════════════════════
   BioMaster — Landing (EN) · assets/js/landing-en.js
   Standalone JS for the English landing page. Does NOT load the
   Supabase SDK or the app code: the app lives at /en/app (en/app.html).
   Ported from the en/index.html monolith (F1 landing/app split).
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict'

/* App route. Production (Vercel cleanUrls) = "/en/app".
   Locally (Live Server, file://, localhost) there are no clean URLs, so we use
   "app.html" (relative to /en/) to allow testing. Hostname-based detection. */
var _isLocal = location.protocol === 'file:' ||
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname) ||
  location.hostname === ''
var APP_URL = _isLocal ? 'app.html' : '/en/app'

/* ── Existing session → CTAs go straight to the app ──────── */
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
    b.textContent = 'Open the app →'
  })
}

/* ── Plan buttons (data-plan-cta) → PayPal modal ──────────── */
document.querySelectorAll('[data-plan-cta]').forEach(function(btn){
  btn.addEventListener('click', function(){
    window._openPayPalModal(btn.dataset.planCta)
  })
})

/* ── PayPal modal (official hosted buttons) ────────────────
   Copied from the app flow; on the landing there is no loaded
   session, so the email note is generic. Amounts/buttonIds untouched. */
window._openPayPalModal = function(plan){
  var cfg = (window.PAYPAL_PLANS || {})[plan] || (window.PAYPAL_PLANS || {}).semestre
  if (!cfg) return
  var modal = document.getElementById('pricingModal')
  var content = document.getElementById('pmContent')
  if (!modal || !content) return
  var emailNote = '<p class="pm-email-note">Make sure to use the same email you used to register (or will register with) on BioMaster when completing the payment.</p>'
  var sinpeSubject = encodeURIComponent('Payment receipt SINPE — ' + cfg.label)
  var sinpeBody = encodeURIComponent('Hello BioMaster team,\n\nI am attaching my SINPE Móvil receipt to activate my plan.\n\nPlan: ' + cfg.label + ' (' + cfg.price + ')\nEmail registered on BioMaster: (fill in)\n\n(Attached: screenshot of the confirmation SMS.)\n\nThank you.')
  content.innerHTML =
    '<h3 style="margin:0 0 .5rem;font-size:1.2rem">💳 Pay with PayPal</h3>' +
    '<div class="pm-plan-badge">' +
      '<span class="pm-plan-name">' + cfg.label + '</span>' +
      '<span class="pm-plan-price">' + cfg.price + '</span>' +
      '<span class="pm-plan-dur">' + cfg.duration + '</span>' +
    '</div>' +
    emailNote +
    '<div class="pm-paypal-wrap">' +
      '<button class="_pp-pay-btn" type="button" style="background:none;border:none;cursor:pointer;display:block;margin:0 auto;padding:0">' +
        '<img src="https://www.paypalobjects.com/es_XC/i/btn/btn_buynowCC_LG.gif" alt="Pay with PayPal" title="PayPal — a safe and easy way to pay online." style="display:block" />' +
      '</button>' +
      '<p class="_pp-msg" style="display:none;text-align:center;margin:.6rem 0 0;font-size:.85rem;color:var(--muted)">Redirecting to PayPal…</p>' +
      '<p class="pm-paypal-note">PayPal opens in the same tab. You can pay by card without a PayPal account.</p>' +
    '</div>' +
    '<details class="pm-sinpe-alt">' +
      '<summary>Prefer to pay by SINPE Móvil? <small>(Costa Rica only)</small></summary>' +
      '<div class="pm-sinpe-body">' +
        '<ol style="padding-left:1.1rem;font-size:.86rem;line-height:1.7;margin:.5rem 0">' +
          '<li>Send the SINPE Móvil payment to <strong>8713 7782</strong>.</li>' +
          '<li>Send the receipt (SMS) to <strong>Biomaster.oficial@gmail.com</strong> with your BioMaster email.</li>' +
          '<li>We will activate your access within 24 h.</li>' +
        '</ol>' +
        '<a href="mailto:Biomaster.oficial@gmail.com?subject=' + sinpeSubject + '&body=' + sinpeBody + '" style="display:inline-block;font-size:.83rem;color:var(--green);font-weight:700;text-decoration:underline;text-underline-offset:2px">Send receipt →</a>' +
      '</div>' +
    '</details>' +
    '<button onclick="document.getElementById(\'pricingModal\').classList.remove(\'show\')" style="display:block;width:100%;margin-top:.8rem;background:none;border:none;color:var(--muted);font-size:.82rem;cursor:pointer;padding:.3rem;text-decoration:underline;text-underline-offset:2px">Cancel</button>'
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
        if (msg) msg.innerHTML = '⚠️ Could not redirect automatically. <a href="' + url + '" target="_blank" rel="noopener" style="color:var(--green);font-weight:700;text-decoration:underline">Open PayPal here →</a>'
        if (img) img.style.opacity = '1'
        ppBtn.disabled = false
      }, 5000)
      window.location.href = url
    }, { once: true })
  }
  modal.classList.add('show')
  if (window.Analytics && window.Analytics.trackPaymentStarted) window.Analytics.trackPaymentStarted(plan)
}

/* ── Payment result overlay (PayPal return) ────────────────
   PayPal's global return URL points to the root landing; if a buyer
   lands here with the hash, show the overlay directly. */
;(function(){
  var h = window.location.hash
  if (h !== '#pago-confirmado' && h !== '#pago-cancelado') return
  function showOverlay(){
    var ov = document.getElementById('payResultOverlay')
    if (!ov) return
    var confirmed = (h === '#pago-confirmado')
    document.getElementById('payResultConfirmado').style.display = confirmed ? '' : 'none'
    document.getElementById('payResultCancelado').style.display = confirmed ? 'none' : ''
    ov.classList.add('show')
    if (confirmed && window.Analytics && window.Analytics.trackPaymentCompleted) window.Analytics.trackPaymentCompleted(null)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showOverlay)
  else showOverlay()
})()

/* ── LEGAL MODAL: privacy / terms / refunds / contact ────── */
window.openLegal = function(seccion){
  var modal = document.getElementById('legalModal')
  var titleEl = document.getElementById('legalTitle')
  var contentEl = document.getElementById('legalContent')
  if (!modal || !titleEl || !contentEl) return
  var today = new Date().toISOString().slice(0,10)
  var docs = {
    privacidad: {
      title: '🔒 Privacy Policy',
      html: '<p style="margin-bottom:.8rem"><small><em>Last updated: ' + today + '</em></small></p>' +
        '<p><strong>1. Who we are</strong></p>' +
        '<p>BioMaster is an independent study tool operated personally in Costa Rica. <strong>It is not an official product of the Tecnológico de Costa Rica (TEC)</strong> nor is it institutionally affiliated with TEC.</p>' +
        '<p style="margin-top:.8rem"><strong>2. What data we collect</strong></p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li><strong>Account data:</strong> email, name you enter when registering, and a password we store encrypted (never in plain text).</li>' +
          '<li><strong>Usage data:</strong> your academic progress, mock exam attempts, minigame results, accumulated XP, and feedback messages.</li>' +
          '<li><strong>Payment data:</strong> if you pay by SINPE Móvil, we manually record the plan purchased, amount, date, and an internal note. We do not store card numbers.</li>' +
        '</ul>' +
        '<p style="margin-top:.8rem"><strong>3. How we use your data</strong></p>' +
        '<p>Solely to operate the platform: save your progress, validate your active plan, contact you if you send feedback, and process manual payments.</p>' +
        '<p style="margin-top:.8rem"><strong>4. Who we share it with</strong></p>' +
        '<p>We do not sell or share your data with third parties for commercial purposes. Data is stored on Supabase infrastructure (servers in the United States) and Vercel, with encryption in transit (HTTPS) and at rest.</p>' +
        '<p style="margin-top:.8rem"><strong>5. Your rights (Law 8968 Costa Rica)</strong></p>' +
        '<p>You may request at any time access, rectification, deletion, or portability of your personal data by writing to <strong>Biomaster.oficial@gmail.com</strong>. We process requests within a maximum of 5 business days.</p>' +
        '<p style="margin-top:.8rem"><strong>6. Cookies and tracking</strong></p>' +
        '<p>We use browser local storage (localStorage) to keep your session active. We do not use advertising cookies or third-party trackers.</p>' +
        '<p style="margin-top:.8rem"><strong>7. Minors</strong></p>' +
        '<p>BioMaster is aimed at students of the General Biology course at TEC, who are mostly adults. If you are under 18, you require consent from your legal guardian.</p>'
    },
    terminos: {
      title: '📋 Terms of Use',
      html: '<p style="margin-bottom:.8rem"><small><em>Last updated: ' + today + '</em></small></p>' +
        '<p><strong>1. Nature of the service</strong></p>' +
        '<p>BioMaster is an <strong>independent study tool</strong>, not officially affiliated with TEC. The content is for reference purposes, based on the General Biology course syllabus and past released exams.</p>' +
        '<p style="margin-top:.8rem"><strong>2. Academic results</strong></p>' +
        '<p style="background:var(--soft);padding:.6rem .8rem;border-radius:8px;border-left:3px solid var(--green)"><strong>BioMaster does NOT guarantee passing any exam, unit, or the course.</strong> Academic results depend solely on each student\'s effort, preparation, and individual performance on exam day. The platform is a complementary study aid, not a substitute for personal study or course classes.</p>' +
        '<p style="margin-top:.8rem"><strong>3. Acceptable use</strong></p>' +
        '<p>You agree to use BioMaster for personal educational purposes. The following are not permitted: sharing your account, redistributing the content, using it for unauthorized commercial purposes, or attempting to breach the platform\'s security.</p>' +
        '<p style="margin-top:.8rem"><strong>4. Content</strong></p>' +
        '<p>The content (summaries, questions, mock exams, games) is for internal use of the platform. Intellectual authorship is reserved. The base syllabus is academic property of TEC.</p>' +
        '<p style="margin-top:.8rem"><strong>5. Payments and plans</strong></p>' +
        '<p>Plans are personal and non-transferable. They have a specific duration from the activation date and are automatically deactivated upon expiry.</p>' +
        '<p style="margin-top:.8rem"><strong>6. Availability</strong></p>' +
        '<p>We do our best to keep the platform available 24/7, but we do not guarantee uninterrupted availability. Maintenance windows or technical outages may occur.</p>' +
        '<p style="margin-top:.8rem"><strong>7. Changes</strong></p>' +
        '<p>We may update these terms. If there are significant changes, we will notify you by email or from the platform.</p>' +
        '<p style="margin-top:.8rem"><strong>8. Limitation of liability</strong></p>' +
        '<p>BioMaster is offered "as is." We are not responsible for: errors in content derived from the base syllabus, loss of progress due to technical failures beyond our control, academic decisions you make based on the material, or indirect consequences of using the platform.</p>'
    },
    reembolsos: {
      title: '💰 Refund Policy',
      html: '<p style="margin-bottom:.8rem"><small><em>Last updated: ' + today + '</em></small></p>' +
        '<p><strong>1. Refund period</strong></p>' +
        '<p>You have <strong>7 calendar days</strong> from your plan activation to request a refund, provided you have not used more than <strong>20% of the paid content</strong> (measured by mock exams completed, games finished, premium sections accessed, and diagnostic/study plan used).</p>' +
        '<p style="margin-top:.8rem"><strong>2. How to request it</strong></p>' +
        '<p>Write to our official email <strong>Biomaster.oficial@gmail.com</strong> indicating:</p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li>Your email registered in BioMaster.</li>' +
          '<li>Plan purchased and approximate date of payment.</li>' +
          '<li>Reason for the refund.</li>' +
        '</ul>' +
        '<p style="margin-top:.8rem"><strong>3. Processing</strong></p>' +
        '<p>Payments by SINPE Móvil: we return the amount to the same number from which you paid, within a maximum of 3 business days.</p>' +
        '<p style="margin-top:.8rem"><strong>4. Non-refundable</strong></p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li>Requests after 7 days.</li>' +
          '<li>Accounts with usage above 20%.</li>' +
          '<li>Plans activated as a courtesy or scholarship (that were not paid for).</li>' +
          '<li>Monthly plan renewals after the first one (renewals are cancelled going forward, not refunded).</li>' +
        '</ul>' +
        '<p style="margin-top:.8rem"><strong>5. Progress record and validation</strong></p>' +
        '<p style="background:var(--soft);padding:.6rem .8rem;border-radius:8px;border-left:3px solid var(--green);font-size:.9rem"><strong>Important:</strong> BioMaster maintains an administrative record of the maximum progress reached by each account. This record is used solely to validate refunds and is preserved even if the user resets their visible progress from "Delete my progress." <strong>Resetting your playable progress does NOT delete or modify the administrative progress record or cancel the 20% already reached.</strong> This ensures transparency and prevents disputes.</p>' +
        '<p style="margin-top:.8rem"><strong>6. Resolution</strong></p>' +
        '<p>We approve legitimate refunds without question. If there is a dispute over usage, we share the administrative activity record of your account as evidence.</p>'
    },
    contacto: {
      title: '📞 Contact & Support',
      html: '<p>We are here to help. Typical response time: <strong>less than 24 hours</strong> on business days.</p>' +
        '<div style="margin-top:1rem;padding:1rem;background:var(--soft);border-radius:10px">' +
          '<p><strong>📱 WhatsApp (preferred)</strong><br><a href="https://wa.me/50687137782?text=Hola%2C%20necesito%20ayuda%20con%20BioMaster" target="_blank" rel="noopener" style="color:var(--green);font-weight:700;font-size:1.05rem">8713 7782</a></p>' +
          '<p style="margin-top:.6rem"><strong>💬 From the platform</strong><br>If you already have an account, you can write to us from the <em>Feedback</em> section within the app. We receive all messages and respond.</p>' +
        '</div>' +
        '<p style="margin-top:1rem"><strong>We operate from:</strong> Costa Rica 🇨🇷</p>' +
        '<p style="margin-top:.6rem"><strong>What you can contact us about:</strong></p>' +
        '<ul style="padding-left:1.2rem">' +
          '<li>SINPE Móvil payment confirmation.</li>' +
          '<li>Activation or issues with your plan.</li>' +
          '<li>Refunds.</li>' +
          '<li>Bug reports or suggestions.</li>' +
          '<li>Scholarships and discounts for special cases.</li>' +
        '</ul>'
    }
  }
  var doc = docs[seccion] || docs.privacidad
  titleEl.textContent = doc.title
  contentEl.innerHTML = doc.html
  modal.style.display = 'flex'
  contentEl.scrollTop = 0
}

/* ── PUBLIC TESTIMONIALS via REST (no Supabase SDK) ──────── */
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
      var fullName = ((f.profiles && f.profiles.name) || '').trim() || 'BioMaster Student'
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
          '<div class="lp-test-role">BioMaster Student</div></div>' +
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
        .catch(function(e){ console.warn('[testimonials]', e) })
    })
}
loadPublicTestimonials()

/* ── Dynamic year in footer ── */
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

/* ── Biological particles in hero ── */
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

/* ── Global biological canvas (whole-landing atmosphere) ── */
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

/* ── "How it works" biological path ── */
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
