// ═══════════════════════════════════════════════════════════
//  juegos.js — 28 minijuegos cinematográficos de BioMaster
//
//  Cada juego es independiente, vive en una función renderer.
//  El framework común se encarga de: gating premium, ranking
//  via game_scores, XP, persistencia de mejores scores, UI shell.
//
//  Dependencias (inyectadas desde index.html en window._BM_DEPS):
//    sb              — cliente Supabase
//    S               — estado del usuario (XP, stats)
//    currentSession  — { user, profile }
//    persist()       — guardar S a localStorage
//    toast(msg,err)  — notificación
//    escapeHtml(s)   — sanitizador
//    isPro()         — bool
//    getEffectivePlan() — { p1, p2, full }
//    showPaywall(ctx,msg) — abre modal premium
//    showXpFloat(n)  — animación XP
//    renderHero()    — refrescar topbar
// ═══════════════════════════════════════════════════════════

const D = () => window._BM_DEPS || {}

// ─────────── CATÁLOGO COMPLETO DE LOS 28 JUEGOS ───────────
export const MINIGAMES = [
  // PARCIAL 1 — Introducción
  { id:'levels_of_life', emoji:'🌌', title:'Construcción de la vida', desc:'Ordená los 11 niveles desde átomo hasta biósfera con escena cósmica.', parcial:'p1', cat:'p1', xp:30, demo:true },
  { id:'method_path',    emoji:'🔬', title:'Método científico', desc:'5 decisiones clave en una investigación real con feedback narrativo.', parcial:'p1', cat:'p1', xp:40, demo:false },
  // PARCIAL 1 — Biomoléculas
  { id:'molecules_3d',   emoji:'⚛️', title:'Moléculas en 3D', desc:'Identificá agua, glucosa, ácido graso y aminoácido en rotación.', parcial:'p1', cat:'bio', xp:35, demo:false },
  { id:'water_props',    emoji:'💧', title:'Propiedades del agua', desc:'6 escenarios animados: cohesión, adhesión, tensión y más.', parcial:'p1', cat:'bio', xp:25, demo:false },
  { id:'ph_lab',         emoji:'🧫', title:'Laboratorio de pH', desc:'Beaker animado: equilibrá soluciones agregando ácido o base.', parcial:'p1', cat:'bio', xp:30, demo:false },
  { id:'biomolecule_class', emoji:'🧪', title:'Clasificá biomoléculas', desc:'12 moléculas a 4 categorías. Trampas comunes incluidas.', parcial:'p1', cat:'bio', xp:30, demo:true },
  // PARCIAL 1 — Célula
  { id:'pro_vs_eu',      emoji:'🦠', title:'Procariota vs Eucariota', desc:'12 estructuras a su tipo celular correcto.', parcial:'p1', cat:'cel', xp:30, demo:false },
  { id:'cell_explorer',  emoji:'🔭', title:'Exploración celular 3D', desc:'Navegá dentro de una célula eucariota y identificá organelas.', parcial:'p1', cat:'cel', xp:40, demo:false },
  { id:'membrane_dyn',   emoji:'🚪', title:'Membrana celular dinámica', desc:'Moléculas atravesando bicapa con animación contínua.', parcial:'p1', cat:'cel', xp:30, demo:false },
  { id:'membrane_traffic', emoji:'🔀', title:'Tráfico de membrana', desc:'6 escenarios para identificar el tipo de transporte.', parcial:'p1', cat:'cel', xp:25, demo:false },
  { id:'osmosis_lab',    emoji:'🌊', title:'Ósmosis en acción', desc:'Célula 3D que se hincha o encoge según la solución.', parcial:'p1', cat:'cel', xp:30, demo:false },
  // PARCIAL 1 — Metabolismo
  { id:'energy_flow',    emoji:'⚡', title:'Flujo de energía', desc:'Clasificá 8 reacciones endergónicas vs exergónicas.', parcial:'p1', cat:'met', xp:25, demo:false },
  { id:'atp_action',     emoji:'🔋', title:'ATP en acción', desc:'8 procesos: decidí si usan ATP o no.', parcial:'p1', cat:'met', xp:25, demo:false },
  // PARCIAL 1 — Energía
  { id:'chloroplast_3d', emoji:'🌿', title:'Cloroplasto 3D', desc:'Explorá tilacoides y estroma con cámara cinematográfica.', parcial:'p1', cat:'ene', xp:35, demo:false },
  { id:'photo_path',     emoji:'☀️', title:'Ruta de la fotosíntesis', desc:'Ordená 8 etapas desde captura de luz hasta glucosa.', parcial:'p1', cat:'ene', xp:35, demo:false },
  { id:'cell_resp',      emoji:'🔥', title:'Respiración celular', desc:'Ordená las 9 etapas de glucosa hasta ~30 ATP.', parcial:'p1', cat:'ene', xp:35, demo:false },
  { id:'etc_pump',       emoji:'⚙️', title:'Cadena de transporte', desc:'Bombeá H+ a través de la membrana mitocondrial. Animado.', parcial:'p1', cat:'ene', xp:35, demo:false },
  // PARCIAL 2 — Genética
  { id:'dna_packaging',  emoji:'🧬', title:'Empaquetamiento del ADN', desc:'De doble hélice a cromosoma, paso a paso con visualización.', parcial:'p2', cat:'gen', xp:30, demo:true },
  { id:'cell_cycle',     emoji:'🔄', title:'Control del ciclo celular', desc:'Decidí en cada checkpoint: continuar, detener o apoptosis.', parcial:'p2', cat:'gen', xp:35, demo:false },
  { id:'mitosis_meiosis', emoji:'🧫', title:'Mitosis vs Meiosis', desc:'Identificá fases y diferencias clave en escenas comparadas.', parcial:'p2', cat:'gen', xp:35, demo:false },
  { id:'punnett_pro',    emoji:'🌱', title:'Tablero de Punnett', desc:'Predecí descendencia en 3 cruces con feedback inmediato.', parcial:'p2', cat:'gen', xp:35, demo:false },
  { id:'dna_replication', emoji:'🔁', title:'Replicación del ADN', desc:'Pareá bases A-T y G-C en 5 plantillas con animación.', parcial:'p2', cat:'gen', xp:30, demo:false },
  { id:'codon_translator', emoji:'📜', title:'De ADN a proteína', desc:'Traducí codones a aminoácidos con tabla genética animada.', parcial:'p2', cat:'gen', xp:35, demo:false },
  { id:'genetic_eng',    emoji:'✂️', title:'Ingeniería genética', desc:'Cortá con enzimas de restricción e insertá un gen.', parcial:'p2', cat:'gen', xp:40, demo:false },
  // PARCIAL 2 — Evolución
  { id:'natural_select', emoji:'🐦', title:'Selección natural', desc:'Simulación viva: presión ambiental cambia frecuencia génica.', parcial:'p2', cat:'evo', xp:40, demo:false },
  { id:'hardy_weinberg', emoji:'⚖️', title:'Hardy-Weinberg', desc:'Sliders en vivo de mutación, migración y selección.', parcial:'p2', cat:'evo', xp:30, demo:false },
  { id:'isolation',      emoji:'🏝️', title:'Aislamiento reproductivo', desc:'Identificá barreras: geográfica, temporal o conductual.', parcial:'p2', cat:'evo', xp:30, demo:false },
  // PARCIAL 2 — Origen de la vida
  { id:'chem_evo',       emoji:'🌋', title:'Evolución química', desc:'Combiná moléculas en la sopa primitiva con escena 3D.', parcial:'p2', cat:'ori', xp:35, demo:false }
]

// ─────────── ESTADO DEL HUB ───────────
let _mgFilter = 'all'
const _mgBests = {} // {gameId: bestScore}

// ─────────── ACCESO POR JUEGO ───────────
export function mgCanPlay(game){
  if (game.demo) return { allowed:true, demo:true }
  const eff = D().getEffectivePlan ? D().getEffectivePlan() : { p1:false, p2:false, full:false }
  if (eff.full) return { allowed:true }
  if (game.parcial === 'p1' && eff.p1) return { allowed:true }
  if (game.parcial === 'p2' && eff.p2) return { allowed:true }
  return { allowed:false }
}

// ─────────── HUB: render del grid de cards ───────────
export function renderMinigamesGrid(){
  const grid = document.getElementById('mgGrid')
  if (!grid) return
  const esc = D().escapeHtml || (s => String(s||''))
  const filtered = MINIGAMES.filter(g => {
    if (_mgFilter === 'all') return true
    if (_mgFilter === 'p1' || _mgFilter === 'p2') return g.parcial === _mgFilter
    return g.cat === _mgFilter
  })
  if (!filtered.length){ grid.innerHTML = '<div class="muted" style="padding:1rem;text-align:center">Sin juegos en esta categoría.</div>'; return }
  grid.innerHTML = filtered.map(g => {
    const acc = mgCanPlay(g)
    const best = _mgBests[g.id]
    const tag = `<span class="mg-tag ${g.parcial}">${g.parcial.toUpperCase()}</span>`
    const demoTag = acc.demo ? '<span class="mg-tag demo">DEMO</span>' : ''
    return `<div class="mg-card ${acc.allowed?'':'locked'}" data-mg-id="${g.id}">
      <div class="mg-emoji">${g.emoji}</div>
      <div class="mg-title">${esc(g.title)}${demoTag}</div>
      <div class="mg-desc">${esc(g.desc)}</div>
      <div class="mg-meta">
        <span>${tag} +${g.xp} XP</span>
        ${best ? `<span class="mg-best">🏅 ${best}</span>` : '<span style="opacity:.4">—</span>'}
      </div>
    </div>`
  }).join('')
  // Enlazar clicks (delegación robusta)
  grid.querySelectorAll('.mg-card').forEach(c => {
    c.addEventListener('click', () => mgStart(c.dataset.mgId))
  })
}

// ─────────── CARGAR MEJORES SCORES DEL USUARIO ───────────
export async function mgLoadBests(){
  const dep = D()
  if (!dep.currentSession?.user?.id) return
  try {
    const { data } = await dep.sb.from('game_scores')
      .select('game,score')
      .eq('user_id', dep.currentSession.user.id)
      .in('game', MINIGAMES.map(m => m.id))
    if (data){
      data.forEach(r => {
        if (!_mgBests[r.game] || r.score > _mgBests[r.game]) _mgBests[r.game] = r.score
      })
      renderMinigamesGrid()
    }
  } catch(e){ /* silent */ }
}

// ─────────── FILTROS ───────────
function bindFilters(){
  document.querySelectorAll('.mg-filter').forEach(b => {
    b.addEventListener('click', () => {
      _mgFilter = b.dataset.mgFilter
      document.querySelectorAll('.mg-filter').forEach(x => x.classList.toggle('active', x === b))
      renderMinigamesGrid()
    })
  })
}

// ─────────── FINISH: subir score + XP ───────────
export async function mgFinishGame(gameId, score, durationSec){
  const dep = D()
  const game = MINIGAMES.find(g => g.id === gameId)
  if (!game) return
  if (!_mgBests[gameId] || score > _mgBests[gameId]) _mgBests[gameId] = score
  // XP local (proporcional al score)
  const xpEarned = Math.round(game.xp * (score/100))
  if (dep.S){
    dep.S.stats = dep.S.stats || {}
    dep.S.stats.xp = (dep.S.stats.xp || 0) + xpEarned
    dep.persist && dep.persist()
    dep.renderHero && dep.renderHero()
    dep.showXpFloat && dep.showXpFloat(xpEarned)
  }
  // Subir al ranking
  if (dep.currentSession?.user?.id){
    try {
      await dep.sb.from('game_scores').insert({
        user_id: dep.currentSession.user.id,
        display_name: dep.currentSession.profile?.name || 'Jugador',
        game: gameId,
        parcial: game.parcial || 'common',
        score,
        duration_seconds: Math.round(durationSec || 0)
      })
    } catch(e){ /* falla silenciosa */ }
  }
  renderMinigamesGrid()
}

// ─────────── ARRANQUE DE UN JUEGO ───────────
export function mgStart(gameId){
  const dep = D()
  const game = MINIGAMES.find(g => g.id === gameId)
  if (!game) return
  const acc = mgCanPlay(game)
  if (!acc.allowed){
    const parcialLabel = game.parcial === 'p1' ? 'primer parcial' : 'segundo parcial'
    dep.showPaywall && dep.showPaywall('juegos',
      `Este minijuego forma parte del ${parcialLabel}. Activá un Pase (P1, P2 o Semestre) para acceder.`)
    return
  }
  const area = document.getElementById('mgPlayArea')
  if (!area) return
  area.scrollIntoView({behavior:'smooth', block:'start'})
  const renderer = MG_RENDERERS[gameId]
  if (renderer) renderer(area, game)
  else area.innerHTML = `<div class="mg-play"><h3>${game.emoji} ${game.title}</h3><p>Renderer no encontrado.</p></div>`
}

// ─────────── SHELL VISUAL ───────────
export function _mgShell(area, game, contentHTML, instructions){
  const esc = D().escapeHtml || (s => String(s||''))
  area.innerHTML = `<div class="mg-play">
    <h3>${game.emoji} ${esc(game.title)} <span class="mg-tag ${game.parcial}">${game.parcial.toUpperCase()}</span></h3>
    <div class="mg-instructions">${instructions}</div>
    <div id="mgGameContent">${contentHTML}</div>
    <div id="mgGameResult"></div>
  </div>`
}

export function _mgShowResult(scoreOut100, gameId, extra){
  const result = document.getElementById('mgGameResult')
  if (!result) return
  const stars = scoreOut100 >= 90 ? '🌟🌟🌟' : scoreOut100 >= 70 ? '🌟🌟' : scoreOut100 >= 40 ? '🌟' : '💔'
  result.innerHTML = `<div class="mg-result">
    <h4>${stars} ${scoreOut100}/100</h4>
    <p style="font-size:.9rem;margin:.4rem 0">${extra || ''}</p>
    <div style="margin-top:.7rem;display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
      <button class="btn primary" data-mg-replay="${gameId}">↺ Volver a jugar</button>
      <button class="btn" data-mg-back="1">← Otros juegos</button>
    </div>
  </div>`
  result.querySelector('[data-mg-replay]').addEventListener('click', () => mgStart(gameId))
  result.querySelector('[data-mg-back]').addEventListener('click', () => {
    document.getElementById('mgPlayArea').innerHTML = ''
    document.getElementById('mgGrid').scrollIntoView({behavior:'smooth'})
  })
}

// ─────────── HELPERS DRAG&DROP ───────────
export function makeDraggable(el, name){
  el.draggable = true
  el.dataset.dragName = name
  el.addEventListener('dragstart', e => { el.classList.add('dragging'); e.dataTransfer.setData('text', name) })
  el.addEventListener('dragend', () => el.classList.remove('dragging'))
}
export function makeDropTarget(el, onDrop){
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover') })
  el.addEventListener('dragleave', () => el.classList.remove('dragover'))
  el.addEventListener('drop', e => {
    e.preventDefault(); el.classList.remove('dragover')
    const name = e.dataTransfer.getData('text')
    onDrop(name, e)
  })
}

// ─────────── REGISTRY DE RENDERERS (las funciones se registran en juegos-renderers.js) ───────────
export const MG_RENDERERS = {}

// ─────────── INICIALIZACIÓN ───────────
export async function initJuegos(){
  // Cargar renderers (módulo separado)
  try {
    await import('./juegos-renderers.js').then(m => {
      if (m && m.registerAll) m.registerAll(MG_RENDERERS, { _mgShell, _mgShowResult, mgFinishGame, mgStart, makeDraggable, makeDropTarget, D })
    })
  } catch(e){ console.warn('[juegos-renderers] no se pudo cargar:', e.message) }
  bindFilters()
  renderMinigamesGrid()
  await mgLoadBests()
  // Exponer para debugging
  window.MG_RENDERERS = MG_RENDERERS
  window.mgStart = mgStart
}
