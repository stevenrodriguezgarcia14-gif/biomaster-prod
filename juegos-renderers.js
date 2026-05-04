// ═══════════════════════════════════════════════════════════
//  juegos-renderers.js — los 28 renderers de minijuegos
//
//  Cada renderer recibe:
//    area  — el contenedor donde dibujar
//    game  — el objeto del catálogo {id,emoji,title,parcial,xp,...}
//    ctx   — utilidades del framework: { _mgShell, _mgShowResult,
//            mgFinishGame, mgStart, makeDraggable, makeDropTarget, D }
//
//  Patrón consistente:
//    1. _mgShell(area, game, contentHTML, instructions)
//    2. Lógica del juego con eventos
//    3. Al terminar → _mgShowResult + mgFinishGame
// ═══════════════════════════════════════════════════════════

export function registerAll(R, ctx){
  const { _mgShell, _mgShowResult, mgFinishGame, makeDraggable, makeDropTarget, D } = ctx
  const esc = D().escapeHtml || (s => String(s||''))

  // ═══════════════ HELPERS LOCALES ═══════════════

  // Drag-and-drop a categorías reusable
  function dragdropToBins(area, game, items, cats, instructions){
    const startedAt = Date.now()
    const shuffled = [...items].sort(() => Math.random()-0.5)
    _mgShell(area, game, `
      <div class="mg-pool" id="ddPool"></div>
      <div class="mg-bins" id="ddBins"></div>
      <div class="mg-actions">
        <button class="btn primary" id="ddCheck">✓ Verificar</button>
        <button class="btn" id="ddReset">↺ Reiniciar</button>
      </div>
    `, instructions)
    const pool = area.querySelector('#ddPool')
    const bins = area.querySelector('#ddBins')
    shuffled.forEach(item => {
      const p = document.createElement('div')
      p.className = 'mg-piece'
      p.textContent = item.n
      p.dataset.cat = item.c
      p.dataset.name = item.n
      makeDraggable(p, item.n)
      pool.appendChild(p)
    })
    Object.entries(cats).forEach(([k, label]) => {
      const bin = document.createElement('div')
      bin.className = 'mg-bin'
      bin.dataset.cat = k
      bin.innerHTML = `<h5>${label}</h5>`
      makeDropTarget(bin, (name) => {
        const piece = area.querySelector(`.mg-piece[data-name="${CSS.escape(name)}"]`)
        if (piece){ bin.appendChild(piece); piece.classList.add('placed'); piece.dataset.placedIn = k }
      })
      bins.appendChild(bin)
    })
    area.querySelector('#ddCheck').addEventListener('click', () => {
      let ok = 0
      area.querySelectorAll('#ddBins .mg-piece').forEach(p => {
        if (p.dataset.cat === p.dataset.placedIn){ ok++; p.style.background='var(--greenSoft)'; p.style.borderColor='var(--green)' }
        else p.style.background='var(--redSoft)'
      })
      const score = Math.round(ok/items.length*100)
      _mgShowResult(score, game.id, `Acertaste ${ok} de ${items.length}.`)
      mgFinishGame(game.id, score, (Date.now()-startedAt)/1000)
    })
    area.querySelector('#ddReset').addEventListener('click', () => ctx.mgStart(game.id))
  }

  // Ordenar secuencia (drop en slots numerados)
  function orderSequence(area, game, correctOrder, instructions){
    const startedAt = Date.now()
    const shuffled = [...correctOrder].sort(() => Math.random()-0.5)
    _mgShell(area, game, `
      <div class="mg-pool" id="osPool"></div>
      <strong style="font-size:.85rem;display:block;margin:.6rem 0">Orden correcto (1 = primero):</strong>
      <div id="osSlots" style="display:flex;flex-direction:column;gap:.35rem"></div>
      <div class="mg-actions">
        <button class="btn primary" id="osCheck">✓ Verificar orden</button>
        <button class="btn" id="osReset">↺ Reiniciar</button>
      </div>
    `, instructions)
    const pool = area.querySelector('#osPool')
    const slots = area.querySelector('#osSlots')
    shuffled.forEach(n => {
      const p = document.createElement('div')
      p.className = 'mg-piece'; p.textContent = n; p.dataset.name = n
      makeDraggable(p, n)
      pool.appendChild(p)
    })
    for (let i = 0; i < correctOrder.length; i++){
      const slot = document.createElement('div')
      slot.className = 'mg-bin'; slot.style.minHeight = '52px'
      slot.innerHTML = `<small style="opacity:.5;font-weight:800">${i+1}.</small>`
      makeDropTarget(slot, (name) => {
        const piece = area.querySelector(`.mg-piece[data-name="${CSS.escape(name)}"]`)
        if (piece && slot.children.length <= 1){
          slot.appendChild(piece); piece.classList.add('placed'); piece.draggable = false
        }
      })
      slots.appendChild(slot)
    }
    area.querySelector('#osCheck').addEventListener('click', () => {
      let ok = 0
      slots.querySelectorAll('.mg-bin').forEach((slot, i) => {
        const piece = slot.querySelector('.mg-piece')
        if (piece && piece.dataset.name === correctOrder[i]){
          ok++; slot.style.borderColor='var(--green)'; slot.style.background='var(--greenSoft)'
        } else { slot.style.borderColor='var(--red)'; slot.style.background='var(--redSoft)' }
      })
      const score = Math.round(ok/correctOrder.length*100)
      _mgShowResult(score, game.id, `Acertaste ${ok} de ${correctOrder.length} posiciones.`)
      mgFinishGame(game.id, score, (Date.now()-startedAt)/1000)
    })
    area.querySelector('#osReset').addEventListener('click', () => ctx.mgStart(game.id))
  }

  // Quiz de opciones múltiples reusable
  function multiChoiceQuiz(area, game, questions, instructions){
    const startedAt = Date.now()
    let idx = 0, ok = 0
    _mgShell(area, game, '', instructions)
    function renderQ(){
      if (idx >= questions.length){
        const score = Math.round(ok/questions.length*100)
        _mgShowResult(score, game.id, `Acertaste ${ok} de ${questions.length}.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000)
        return
      }
      const q = questions[idx]
      const c = area.querySelector('#mgGameContent')
      const progressBars = questions.map((_,i) =>
        `<span class="${i<idx?'done':i===idx?'active':''}"></span>`).join('')
      c.innerHTML = `
        <div class="quiz-progress">${progressBars}</div>
        <div class="quiz-stage">${esc(q.q)}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.55rem" id="qOpts"></div>
        <div style="text-align:center;margin-top:.6rem;font-size:.8rem;color:var(--muted)">Pregunta ${idx+1}/${questions.length} · Aciertos ${ok}</div>
      `
      const optsDiv = c.querySelector('#qOpts')
      q.ops.forEach((opt, i) => {
        const b = document.createElement('button')
        b.className = 'btn'
        b.textContent = opt.t || opt
        b.style.padding = '.7rem 1rem'
        b.style.textAlign = 'left'
        b.addEventListener('click', () => {
          const isCorrect = (typeof opt === 'object' ? opt.ok : i === q.a)
          if (isCorrect){ ok++; b.style.background='var(--greenSoft)'; b.style.borderColor='var(--green)' }
          else b.style.background='var(--redSoft)'
          [...optsDiv.children].forEach(x => x.disabled = true)
          if (q.exp || (typeof opt === 'object' && opt.exp)){
            const exp = document.createElement('div')
            exp.style.cssText = `margin-top:.6rem;padding:.7rem;background:${isCorrect?'var(--greenSoft)':'var(--redSoft)'};border-radius:8px;font-size:.85rem`
            exp.textContent = (isCorrect?'✓ ':'✘ ') + ((typeof opt === 'object' && opt.exp) || q.exp || '')
            c.appendChild(exp)
          }
          setTimeout(() => { idx++; renderQ() }, 1100)
        })
        optsDiv.appendChild(b)
      })
    }
    renderQ()
  }

  // ════════════════════════════════════════════════════════
  //  1. CONSTRUCCIÓN DE LA VIDA — escena cósmica + drag&drop
  // ════════════════════════════════════════════════════════
  R.levels_of_life = (area, game) => {
    const correct = ['Átomo','Molécula','Célula','Tejido','Órgano','Sistema de órganos','Organismo','Población','Comunidad','Ecosistema','Biósfera']
    const startedAt = Date.now()
    const shuffled = [...correct].sort(() => Math.random()-0.5)
    _mgShell(area, game, `
      <div class="scene-3d" style="margin-bottom:1rem;height:120px;display:flex;align-items:center;justify-content:center">
        <div class="stars"></div>
        <div class="glow" style="left:30%;top:20%"></div>
        <div class="glow" style="right:25%;bottom:20%;animation-delay:1.5s"></div>
        <h2 style="position:relative;color:#a4e0c0;font-family:Merriweather,serif;font-size:1.4rem;text-shadow:0 0 20px rgba(47,139,77,.6);text-align:center">Del átomo a la biósfera</h2>
      </div>
      <div class="mg-pool" id="lvlPool"></div>
      <strong style="font-size:.85rem;display:block;margin:.6rem 0">Ordená de menor a mayor complejidad:</strong>
      <div id="lvlSlots" style="display:flex;flex-direction:column;gap:.35rem"></div>
      <div class="mg-actions">
        <button class="btn primary" id="lvlCheck">✓ Verificar orden</button>
        <button class="btn" id="lvlReset">↺ Reiniciar</button>
      </div>
    `, 'Arrastrá los 11 niveles desde la nube cósmica al orden correcto, de menor a mayor complejidad. La célula es el primer nivel donde aparece la vida.')
    const pool = area.querySelector('#lvlPool')
    const slots = area.querySelector('#lvlSlots')
    shuffled.forEach(n => { const p = document.createElement('div'); p.className='mg-piece'; p.textContent=n; p.dataset.name=n; makeDraggable(p,n); pool.appendChild(p) })
    for (let i = 0; i < correct.length; i++){
      const slot = document.createElement('div')
      slot.className = 'mg-bin'; slot.style.minHeight = '50px'
      slot.innerHTML = `<small style="opacity:.5;font-weight:800">${i+1}.</small>`
      makeDropTarget(slot, (name) => {
        const piece = area.querySelector(`.mg-piece[data-name="${CSS.escape(name)}"]`)
        if (piece && slot.children.length <= 1){ slot.appendChild(piece); piece.classList.add('placed'); piece.draggable = false }
      })
      slots.appendChild(slot)
    }
    area.querySelector('#lvlCheck').addEventListener('click', () => {
      let ok = 0
      slots.querySelectorAll('.mg-bin').forEach((slot, i) => {
        const piece = slot.querySelector('.mg-piece')
        if (piece && piece.dataset.name === correct[i]){ ok++; slot.style.borderColor='var(--green)'; slot.style.background='var(--greenSoft)' }
        else { slot.style.borderColor='var(--red)'; slot.style.background='var(--redSoft)' }
      })
      const score = Math.round(ok/correct.length*100)
      _mgShowResult(score, game.id, `Acertaste ${ok} de ${correct.length} niveles.`)
      mgFinishGame(game.id, score, (Date.now()-startedAt)/1000)
    })
    area.querySelector('#lvlReset').addEventListener('click', () => ctx.mgStart(game.id))
  }

  // ════════════════════════════════════════════════════════
  //  2. MÉTODO CIENTÍFICO
  // ════════════════════════════════════════════════════════
  R.method_path = (area, game) => multiChoiceQuiz(area, game, [
    { q:'Observás que las plantas cerca de la ventana crecen más rápido. ¿Qué hacés primero?', ops:[
      {t:'Anuncio mi conclusión', ok:false, exp:'Sin datos no hay conclusión.'},
      {t:'Formulo una pregunta clara', ok:true, exp:'Correcto: la pregunta surge de la observación.'},
      {t:'Compro fertilizante', ok:false, exp:'Eso es acción, no método.'},
      {t:'Olvido el tema', ok:false, exp:'Perdiste la oportunidad de investigar.'}
    ]},
    { q:'¿Cuál es una hipótesis adecuada (testeable y falsable)?', ops:[
      {t:'Las plantas son verdes', ok:false, exp:'Es una observación, no falsable.'},
      {t:'Más luz solar produce mayor crecimiento', ok:true, exp:'Sí: predice una relación testeable.'},
      {t:'Las plantas tienen alma', ok:false, exp:'No es ciencia.'},
      {t:'No sé', ok:false, exp:'No es una hipótesis.'}
    ]},
    { q:'¿Qué experimento testea mejor tu hipótesis?', ops:[
      {t:'Comparo plantas con poca y mucha luz, mismo riego y suelo', ok:true, exp:'Variable controlada: solo la luz cambia.'},
      {t:'Riego unas más que otras', ok:false, exp:'Cambia otra variable.'},
      {t:'Solo observo unos meses sin manipular', ok:false, exp:'Sin grupo control no concluís.'},
      {t:'Le pregunto a expertos', ok:false, exp:'No es experimento.'}
    ]},
    { q:'¿Cuál es la variable independiente?', ops:[
      {t:'El tamaño final de la planta', ok:false, exp:'Esa es la dependiente.'},
      {t:'La cantidad de luz que recibe', ok:true, exp:'Es la que vos manipulás.'},
      {t:'El tipo de planta', ok:false, exp:'En este caso lo controlás como constante.'},
      {t:'El agua', ok:false, exp:'También constante.'}
    ]},
    { q:'Tras los datos, ¿cuál es la conclusión más correcta?', ops:[
      {t:'Las plantas con más luz crecieron más → apoya la hipótesis', ok:true, exp:'Apoya, no comprueba absolutamente.'},
      {t:'Quedó comprobado para siempre', ok:false, exp:'La ciencia no comprueba absolutamente.'},
      {t:'No se puede concluir nada', ok:false, exp:'Con datos consistentes sí podés.'},
      {t:'Hay que probar con animales', ok:false, exp:'No responde la pregunta original.'}
    ]}
  ], 'Resolvé un caso real aplicando los pasos del método científico. 5 decisiones.')

  // ════════════════════════════════════════════════════════
  //  3. MOLÉCULAS EN 3D — canvas con rotación
  // ════════════════════════════════════════════════════════
  R.molecules_3d = (area, game) => {
    const molecules = [
      { name:'Agua (H₂O)', atoms:[
        {x:0,y:0,z:0,r:14,c:'#e74c3c',label:'O'},
        {x:-22,y:18,z:0,r:9,c:'#ecf0f1',label:'H'},
        {x:22,y:18,z:0,r:9,c:'#ecf0f1',label:'H'}
      ], bonds:[[0,1],[0,2]] },
      { name:'Glucosa (C₆H₁₂O₆)', atoms:Array.from({length:6},(_,i) => {
        const a = (i/6)*Math.PI*2
        return {x:Math.cos(a)*30,y:Math.sin(a)*30,z:i%2===0?5:-5,r:10,c:'#34495e',label:'C'}
      }).concat([
        {x:0,y:-45,z:0,r:13,c:'#e74c3c',label:'O'},
        {x:42,y:-15,z:0,r:13,c:'#e74c3c',label:'O'}
      ]), bonds:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[3,7]] },
      { name:'Ácido graso', atoms:Array.from({length:8},(_,i) => ({
        x:-50+i*14, y:i%2===0?-3:3, z:0, r:9, c:'#34495e', label:'C'
      })).concat([
        {x:62,y:-3,z:0,r:13,c:'#e74c3c',label:'O'},
        {x:62,y:9,z:0,r:13,c:'#e74c3c',label:'O'}
      ]), bonds:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[7,9]] },
      { name:'Aminoácido (alanina)', atoms:[
        {x:0,y:0,z:0,r:11,c:'#34495e',label:'C'},
        {x:-28,y:0,z:0,r:13,c:'#3498db',label:'N'},
        {x:28,y:-12,z:0,r:13,c:'#34495e',label:'C'},
        {x:50,y:-2,z:0,r:13,c:'#e74c3c',label:'O'},
        {x:28,y:14,z:0,r:13,c:'#e74c3c',label:'O'},
        {x:0,y:24,z:0,r:11,c:'#34495e',label:'C'}
      ], bonds:[[0,1],[0,2],[2,3],[2,4],[0,5]] }
    ]
    let curMol = 0, ok = 0
    const startedAt = Date.now()
    _mgShell(area, game, `
      <div class="organelle-frame" style="aspect-ratio:16/10">
        <canvas id="mol3dCanvas"></canvas>
        <div class="organelle-label" style="top:.6rem;left:.6rem" id="molTitle">—</div>
      </div>
      <p style="text-align:center;margin:1rem 0 .4rem">¿Qué molécula es?</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem;max-width:480px;margin:0 auto" id="molOpts"></div>
      <div style="text-align:center;font-size:.82rem;color:var(--muted);margin-top:.5rem">Molécula <span id="molIdx">1</span>/${molecules.length} · Aciertos: <span id="molOk">0</span></div>
    `, 'Identificá cada molécula en rotación 3D. Usá las pistas: O (rojo), H (blanco), C (gris), N (azul).')
    const cv = area.querySelector('#mol3dCanvas')
    const W = cv.width = 560, H = cv.height = 280
    const g = cv.getContext('2d')
    let angle = 0, raf
    function draw(){
      const mol = molecules[curMol]
      g.fillStyle = '#0a1810'; g.fillRect(0,0,W,H)
      // Glow background
      const grd = g.createRadialGradient(W/2, H/2, 30, W/2, H/2, 200)
      grd.addColorStop(0, 'rgba(47,139,77,.18)')
      grd.addColorStop(1, 'transparent')
      g.fillStyle = grd; g.fillRect(0,0,W,H)
      const cx = W/2, cy = H/2
      // Rotar átomos en Y
      const rotated = mol.atoms.map(a => {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const rx = a.x * cosA - a.z * sinA
        const rz = a.x * sinA + a.z * cosA
        return { ...a, sx: cx + rx*1.8, sy: cy + a.y*1.8, sz: rz }
      })
      // Sort por Z (pintar atrás primero)
      const sorted = [...rotated].sort((a,b) => a.sz - b.sz)
      // Bonds primero (entre los rotated originales por índice)
      g.strokeStyle = 'rgba(180,200,180,.5)'; g.lineWidth = 3
      mol.bonds.forEach(([i,j]) => {
        g.beginPath(); g.moveTo(rotated[i].sx, rotated[i].sy); g.lineTo(rotated[j].sx, rotated[j].sy); g.stroke()
      })
      // Átomos
      sorted.forEach(a => {
        const scale = 1 + a.sz/200
        const r = a.r * scale * 1.4
        const grad = g.createRadialGradient(a.sx-r/3, a.sy-r/3, 1, a.sx, a.sy, r)
        grad.addColorStop(0, '#fff')
        grad.addColorStop(.4, a.c)
        grad.addColorStop(1, '#000')
        g.fillStyle = grad
        g.beginPath(); g.arc(a.sx, a.sy, r, 0, Math.PI*2); g.fill()
        g.fillStyle = '#fff'; g.font = `bold ${Math.max(9, r*.7)}px sans-serif`
        g.textAlign='center'; g.textBaseline='middle'
        g.fillText(a.label, a.sx, a.sy)
      })
      angle += 0.012
      raf = requestAnimationFrame(draw)
    }
    function loadMol(){
      area.querySelector('#molTitle').textContent = `Molécula ${curMol+1}/${molecules.length}`
      area.querySelector('#molIdx').textContent = curMol+1
      const opts = molecules.map(m => m.name).sort(() => Math.random()-0.5)
      const optsDiv = area.querySelector('#molOpts')
      optsDiv.innerHTML = ''
      opts.forEach(n => {
        const b = document.createElement('button')
        b.className = 'btn'; b.textContent = n
        b.addEventListener('click', () => {
          const correct = molecules[curMol].name
          if (n === correct){ ok++; b.style.background='var(--greenSoft)'; b.style.borderColor='var(--green)'; area.querySelector('#molOk').textContent = ok }
          else b.style.background='var(--redSoft)'
          ;[...optsDiv.children].forEach(x => x.disabled = true)
          setTimeout(() => {
            curMol++
            if (curMol >= molecules.length){
              cancelAnimationFrame(raf)
              const score = Math.round(ok/molecules.length*100)
              _mgShowResult(score, game.id, `Acertaste ${ok} de ${molecules.length} moléculas.`)
              mgFinishGame(game.id, score, (Date.now()-startedAt)/1000)
            } else loadMol()
          }, 900)
        })
        optsDiv.appendChild(b)
      })
    }
    loadMol(); draw()
  }

  // ════════════════════════════════════════════════════════
  //  4. PROPIEDADES DEL AGUA
  // ════════════════════════════════════════════════════════
  R.water_props = (area, game) => multiChoiceQuiz(area, game, [
    { q:'💧 Las moléculas de agua se atraen entre sí formando gotas redondas.', ops:[
      {t:'Cohesión', ok:true, exp:'Sí: atracción agua-agua por puentes de H.'},
      {t:'Adhesión', ok:false, exp:'Esa es agua-otra superficie.'},
      {t:'Tensión superficial', ok:false, exp:'Es consecuencia, no la propiedad raíz.'},
      {t:'Calor específico', ok:false}
    ]},
    { q:'🌱 El agua sube por los capilares de un tallo hasta las hojas.', ops:[
      {t:'Cohesión', ok:false},
      {t:'Adhesión + cohesión (capilaridad)', ok:true, exp:'Adhesión a las paredes + cohesión entre moléculas.'},
      {t:'Densidad', ok:false},
      {t:'Calor de vaporización', ok:false}
    ]},
    { q:'🦟 Un mosquito se mantiene parado sobre el agua sin hundirse.', ops:[
      {t:'Tensión superficial', ok:true, exp:'La cohesión genera una "membrana" en superficie.'},
      {t:'Adhesión', ok:false},
      {t:'Densidad anómala', ok:false},
      {t:'pH neutro', ok:false}
    ]},
    { q:'🌊 Los océanos amortiguan los cambios de temperatura del planeta.', ops:[
      {t:'Densidad anómala', ok:false},
      {t:'Alto calor específico', ok:true, exp:'El agua absorbe mucho calor antes de subir su temperatura.'},
      {t:'Tensión superficial', ok:false},
      {t:'Cohesión', ok:false}
    ]},
    { q:'🧊 El hielo flota sobre el agua líquida.', ops:[
      {t:'Densidad anómala', ok:true, exp:'El hielo es menos denso que el agua líquida.'},
      {t:'Calor específico', ok:false},
      {t:'Adhesión', ok:false},
      {t:'Cohesión', ok:false}
    ]},
    { q:'💦 El sudor enfría el cuerpo al evaporarse.', ops:[
      {t:'Calor de vaporización alto', ok:true, exp:'Romper puentes de H requiere mucha energía → el cuerpo cede calor.'},
      {t:'Tensión superficial', ok:false},
      {t:'Cohesión', ok:false},
      {t:'Adhesión', ok:false}
    ]}
  ], '6 escenarios. Identificá qué propiedad del agua los explica.')

  // ════════════════════════════════════════════════════════
  //  5. LABORATORIO DE pH — beaker animado
  // ════════════════════════════════════════════════════════
  R.ph_lab = (area, game) => {
    const targets = [3, 7, 11, 5, 9]
    let cur = 0, ph = 7, ok = 0
    const startedAt = Date.now()
    _mgShell(area, game, `
      <div style="text-align:center;margin-bottom:1rem">
        <div class="ph-beaker" id="phBeaker">
          <div class="ph-bubbles" id="phBubbles">
            <span style="left:20%;animation-delay:.1s"></span>
            <span style="left:45%;animation-delay:.6s"></span>
            <span style="left:70%;animation-delay:1.2s"></span>
          </div>
          <div class="ph-label" id="phLabel">pH 7</div>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:1rem">
        <strong style="font-size:1.1rem">Llevá a pH = <span id="phTarget" style="color:var(--green);font-family:Merriweather,serif;font-size:1.5rem">${targets[0]}</span></strong>
        <div style="font-size:.85rem;color:var(--muted);margin-top:.2rem">Ronda <span id="phRound">1</span>/${targets.length} · Aciertos: <span id="phOk">0</span></div>
      </div>
      <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
        <button class="btn" id="phM2">+ Ácido fuerte (-2)</button>
        <button class="btn" id="phM1">+ Ácido (-1)</button>
        <button class="btn" id="phP1">+ Base (+1)</button>
        <button class="btn" id="phP2">+ Base fuerte (+2)</button>
      </div>
      <div style="display:flex;gap:.5rem;justify-content:center;margin-top:.6rem">
        <button class="btn primary" id="phSubmit">✓ Confirmar</button>
      </div>
    `, 'Cada unidad de pH es 10× la concentración. Llevá la solución al objetivo en pocos pasos.')
    const beaker = area.querySelector('#phBeaker'), label = area.querySelector('#phLabel')
    function update(){
      label.textContent = 'pH ' + ph
      const colors = { 0:'#c0392b', 1:'#c0392b', 2:'#c0392b', 3:'#e67e22', 4:'#f39c12', 5:'#f1c40f', 6:'#a8c14f', 7:'#7ec8a4', 8:'#5fa5e6', 9:'#5fa5e6', 10:'#7d6fe6', 11:'#7d6fe6', 12:'#5e3fa8', 13:'#5e3fa8', 14:'#5e3fa8' }
      const c = colors[ph] || '#7ec8a4'
      beaker.style.background = `linear-gradient(180deg,transparent 0% 28%,${c} 28%)`
    }
    function adj(d){ ph = Math.max(0, Math.min(14, ph+d)); update() }
    area.querySelector('#phM2').addEventListener('click', () => adj(-2))
    area.querySelector('#phM1').addEventListener('click', () => adj(-1))
    area.querySelector('#phP1').addEventListener('click', () => adj(+1))
    area.querySelector('#phP2').addEventListener('click', () => adj(+2))
    area.querySelector('#phSubmit').addEventListener('click', () => {
      if (ph === targets[cur]){ ok++; area.querySelector('#phOk').textContent = ok }
      cur++
      if (cur >= targets.length){
        const score = Math.round(ok/targets.length*100)
        _mgShowResult(score, game.id, `Acertaste ${ok} de ${targets.length} rondas.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      ph = 7
      area.querySelector('#phTarget').textContent = targets[cur]
      area.querySelector('#phRound').textContent = cur+1
      update()
    })
  }

  // ════════════════════════════════════════════════════════
  //  6. CLASIFICÁ BIOMOLÉCULAS
  // ════════════════════════════════════════════════════════
  R.biomolecule_class = (area, game) => dragdropToBins(area, game, [
    {n:'Glucosa',c:'carb'},{n:'Almidón',c:'carb'},{n:'Celulosa',c:'carb'},
    {n:'Triglicérido',c:'lip'},{n:'Fosfolípido',c:'lip'},{n:'Colesterol',c:'lip'},
    {n:'Hemoglobina',c:'pro'},{n:'Insulina',c:'pro'},{n:'Queratina',c:'pro'},
    {n:'ADN',c:'nuc'},{n:'ARNm',c:'nuc'},{n:'ATP',c:'nuc'}
  ], { carb:'🍞 Carbohidratos', lip:'🧈 Lípidos', pro:'🍗 Proteínas', nuc:'🧬 Ácidos nucleicos' },
     'Trampa común: ATP es nucleótido (no proteína). Celulosa es carbohidrato (no lípido). Colesterol es lípido (no proteína).')

  // ════════════════════════════════════════════════════════
  //  7. PROCARIOTA VS EUCARIOTA
  // ════════════════════════════════════════════════════════
  R.pro_vs_eu = (area, game) => dragdropToBins(area, game, [
    {n:'Núcleo verdadero',c:'eu'},{n:'Nucleoide',c:'pro'},{n:'Mitocondria',c:'eu'},
    {n:'Ribosomas 70S',c:'pro'},{n:'Ribosomas 80S',c:'eu'},{n:'Pared peptidoglicano',c:'pro'},
    {n:'Aparato de Golgi',c:'eu'},{n:'Plásmidos',c:'pro'},{n:'Retículo endoplásmico',c:'eu'},
    {n:'Cromosoma circular',c:'pro'},{n:'Cromosomas lineales',c:'eu'},{n:'Cápsula',c:'pro'}
  ], { pro:'🦠 Procariota', eu:'🐾 Eucariota' },
     'Eucariotas: núcleo + organelas membranosas. Procariotas: simples, sin núcleo definido. Ambas tienen ribosomas pero distintos.')

  // ════════════════════════════════════════════════════════
  //  8. EXPLORACIÓN CELULAR 3D — canvas con organelas clicables
  // ════════════════════════════════════════════════════════
  R.cell_explorer = (area, game) => {
    const organelas = [
      { id:'nuc', name:'Núcleo', x:.5, y:.5, r:.13, c:'#7d6fe6', desc:'Almacena el ADN. Tiene poros en su envoltura.' },
      { id:'mit', name:'Mitocondria', x:.78, y:.4, r:.07, c:'#e74c3c', desc:'Genera la mayor parte del ATP por respiración.' },
      { id:'rer', name:'RER', x:.32, y:.32, r:.08, c:'#3498db', desc:'Síntesis de proteínas (con ribosomas adheridos).' },
      { id:'gol', name:'Golgi', x:.22, y:.62, r:.08, c:'#f39c12', desc:'Procesa y empaca proteínas en vesículas.' },
      { id:'lis', name:'Lisosoma', x:.75, y:.7, r:.05, c:'#2ecc71', desc:'Digestión intracelular (enzimas).' },
      { id:'rib', name:'Ribosomas libres', x:.6, y:.3, r:.04, c:'#ecf0f1', desc:'Síntesis de proteínas citosólicas.' },
      { id:'cit', name:'Citoesqueleto', x:.4, y:.8, r:.06, c:'#95a5a6', desc:'Microtúbulos y filamentos: forma y movimiento.' }
    ]
    let askIdx = 0, ok = 0
    const startedAt = Date.now()
    const order = [...organelas].sort(() => Math.random()-0.5)
    _mgShell(area, game, `
      <div class="organelle-frame" id="celFrame">
        <canvas id="celCanvas"></canvas>
        <div class="organelle-label" style="top:.6rem;left:.6rem" id="celAsk">—</div>
        <div class="organelle-label" style="bottom:.6rem;right:.6rem" id="celScore">0/${order.length}</div>
      </div>
      <p style="text-align:center;margin-top:.8rem;font-size:.88rem">Hacé clic dentro de la célula sobre la organela que se te pide.</p>
    `, 'Cada turno se te pide una organela. Hacé clic sobre ella en la escena. 7 turnos.')
    const cv = area.querySelector('#celCanvas')
    const cw = cv.width = 720, ch = cv.height = 405
    const g = cv.getContext('2d')
    function draw(){
      // Fondo
      const bg = g.createRadialGradient(cw/2, ch/2, 50, cw/2, ch/2, 400)
      bg.addColorStop(0, '#1c2e1e'); bg.addColorStop(1, '#0a1810')
      g.fillStyle = bg; g.fillRect(0,0,cw,ch)
      // Membrana celular (elipse)
      g.strokeStyle = 'rgba(126,200,164,.7)'; g.lineWidth = 8
      g.beginPath(); g.ellipse(cw/2, ch/2, cw*.45, ch*.42, 0, 0, Math.PI*2); g.stroke()
      g.fillStyle = 'rgba(47,139,77,.08)'; g.fill()
      // Citosol gradient
      const cyt = g.createRadialGradient(cw/2, ch/2, 30, cw/2, ch/2, 280)
      cyt.addColorStop(0, 'rgba(80,140,100,.15)'); cyt.addColorStop(1, 'rgba(20,40,30,.05)')
      g.fillStyle = cyt; g.fill()
      // Organelas
      organelas.forEach(o => {
        const x = o.x*cw, y = o.y*ch, r = o.r*Math.min(cw,ch)
        const grad = g.createRadialGradient(x-r/3, y-r/3, 1, x, y, r)
        grad.addColorStop(0, '#fff'); grad.addColorStop(.4, o.c); grad.addColorStop(1, '#000')
        g.fillStyle = grad
        g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill()
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1
        g.stroke()
      })
    }
    function next(){
      if (askIdx >= order.length){
        const score = Math.round(ok/order.length*100)
        _mgShowResult(score, game.id, `Identificaste ${ok} de ${order.length} organelas.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      const target = order[askIdx]
      area.querySelector('#celAsk').textContent = `Hacé clic en: ${target.name}`
      area.querySelector('#celScore').textContent = `${ok}/${order.length}`
    }
    cv.addEventListener('click', e => {
      if (askIdx >= order.length) return
      const rect = cv.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (cw/rect.width)
      const y = (e.clientY - rect.top) * (ch/rect.height)
      const target = order[askIdx]
      const tx = target.x*cw, ty = target.y*ch, tr = target.r*Math.min(cw,ch)+10
      const dist = Math.hypot(x-tx, y-ty)
      const correct = dist <= tr
      if (correct){
        ok++
        // Flash verde
        g.fillStyle = 'rgba(47,139,77,.3)'; g.beginPath(); g.arc(tx, ty, tr*1.3, 0, Math.PI*2); g.fill()
      }
      askIdx++
      setTimeout(() => { draw(); next() }, 500)
    })
    draw(); next()
  }

  // ════════════════════════════════════════════════════════
  //  9. MEMBRANA DINÁMICA
  // ════════════════════════════════════════════════════════
  R.membrane_dyn = (area, game) => multiChoiceQuiz(area, game, [
    { q:'O₂ ingresa a favor de gradiente sin proteínas.', ops:[
      {t:'Difusión simple', ok:true, exp:'Pequeña, apolar, atraviesa la bicapa libre.'},
      {t:'Difusión facilitada', ok:false},
      {t:'Transporte activo', ok:false},
      {t:'Endocitosis', ok:false}
    ]},
    { q:'Glucosa entra usando GLUT a favor de gradiente.', ops:[
      {t:'Difusión simple', ok:false, exp:'No: glucosa es polar y grande.'},
      {t:'Difusión facilitada', ok:true, exp:'Proteína GLUT, sin gasto de ATP.'},
      {t:'Transporte activo primario', ok:false},
      {t:'Exocitosis', ok:false}
    ]},
    { q:'Bomba Na⁺/K⁺ mueve iones contra gradiente.', ops:[
      {t:'Difusión facilitada', ok:false},
      {t:'Transporte activo primario', ok:true, exp:'Usa ATP directo. 3 Na⁺ fuera, 2 K⁺ dentro.'},
      {t:'Cotransporte', ok:false},
      {t:'Endocitosis', ok:false}
    ]},
    { q:'La célula engloba una bacteria con su membrana.', ops:[
      {t:'Pinocitosis', ok:false, exp:'Eso es para líquidos.'},
      {t:'Fagocitosis', ok:true, exp:'Endocitosis de partículas sólidas.'},
      {t:'Exocitosis', ok:false},
      {t:'Difusión', ok:false}
    ]},
    { q:'Vesícula libera insulina al exterior.', ops:[
      {t:'Endocitosis', ok:false},
      {t:'Exocitosis', ok:true, exp:'Vesícula se fusiona con membrana y libera contenido.'},
      {t:'Cotransporte', ok:false},
      {t:'Difusión', ok:false}
    ]},
    { q:'Agua se mueve por canales especializados.', ops:[
      {t:'Acuaporinas (ósmosis facilitada)', ok:true, exp:'Sí: canales para acelerar ósmosis.'},
      {t:'Bomba H⁺', ok:false},
      {t:'Pinocitosis', ok:false},
      {t:'Exocitosis', ok:false}
    ]}
  ], 'Identificá el tipo de transporte en cada situación.')

  // ════════════════════════════════════════════════════════
  //  10. TRÁFICO DE MEMBRANA (similar pero con escenarios distintos)
  // ════════════════════════════════════════════════════════
  R.membrane_traffic = (area, game) => multiChoiceQuiz(area, game, [
    { q:'CO₂ sale del citoplasma a favor de su gradiente.', ops:[
      {t:'Difusión simple', ok:true, exp:'Pequeña, apolar.'},
      {t:'Difusión facilitada', ok:false},
      {t:'Transporte activo', ok:false},
      {t:'Endocitosis', ok:false}
    ]},
    { q:'Aminoácidos entran al intestino acoplados al gradiente de Na⁺.', ops:[
      {t:'Difusión simple', ok:false},
      {t:'Cotransporte (activo secundario)', ok:true, exp:'Usa el gradiente que la bomba Na/K creó.'},
      {t:'Pinocitosis', ok:false},
      {t:'Difusión facilitada', ok:false}
    ]},
    { q:'La célula bebe gotitas de líquido extracelular.', ops:[
      {t:'Fagocitosis', ok:false, exp:'Eso es para sólidos.'},
      {t:'Pinocitosis', ok:true, exp:'"Bebida celular".'},
      {t:'Exocitosis', ok:false},
      {t:'Ósmosis', ok:false}
    ]},
    { q:'LDL ingresa por receptor específico en clatrina.', ops:[
      {t:'Endocitosis mediada por receptor', ok:true, exp:'Específica, eficiente.'},
      {t:'Fagocitosis', ok:false},
      {t:'Difusión', ok:false},
      {t:'Cotransporte', ok:false}
    ]},
    { q:'Neurotransmisores liberados a la sinapsis.', ops:[
      {t:'Difusión simple', ok:false},
      {t:'Exocitosis dependiente de Ca²⁺', ok:true, exp:'Vesículas se fusionan al activarse por calcio.'},
      {t:'Bomba H⁺', ok:false},
      {t:'Endocitosis', ok:false}
    ]},
    { q:'Agua entra a un eritrocito en solución hipotónica.', ops:[
      {t:'Difusión simple del agua (ósmosis)', ok:true, exp:'Aunque hay acuaporinas, también hay flujo basal.'},
      {t:'Transporte activo', ok:false},
      {t:'Cotransporte', ok:false},
      {t:'Pinocitosis', ok:false}
    ]}
  ], '6 escenarios de transporte. Identificá el tipo correcto.')

  // ════════════════════════════════════════════════════════
  //  11. ÓSMOSIS EN ACCIÓN — célula que cambia visualmente
  // ════════════════════════════════════════════════════════
  R.osmosis_lab = (area, game) => {
    const rounds = [
      { sol:'hipotónica', correct:'swollen', label:'Solución hipotónica (poco soluto fuera)' },
      { sol:'hipertónica', correct:'shrunk', label:'Solución hipertónica (mucho soluto fuera)' },
      { sol:'isotónica', correct:'normal', label:'Solución isotónica (igual concentración)' },
      { sol:'muy hipotónica', correct:'bursted', label:'Muy hipotónica + sin pared celular' }
    ]
    let idx = 0, ok = 0
    const startedAt = Date.now()
    _mgShell(area, game, `
      <div style="text-align:center;margin:1.4rem 0">
        <div style="display:inline-block;padding:40px;background:radial-gradient(circle,rgba(95,165,230,.15),transparent);border-radius:50%">
          <div class="mg-cell" id="osmCell"></div>
        </div>
        <p id="osmLabel" style="font-weight:800;margin-top:.8rem;font-size:1.05rem"></p>
      </div>
      <p style="text-align:center;font-size:.92rem;font-weight:700">¿Qué le pasa a la célula?</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.5rem;max-width:600px;margin:.6rem auto" id="osmOpts"></div>
      <div style="text-align:center;font-size:.82rem;color:var(--muted);margin-top:.5rem">Ronda <span id="osmRound">1</span>/${rounds.length} · Aciertos: <span id="osmOk">0</span></div>
    `, 'Recordá: el agua va donde HAY MÁS soluto. Hipotónico fuera = la célula se hincha (puede estallar). Hipertónico fuera = se encoge.')
    function renderRound(){
      if (idx >= rounds.length){
        const score = Math.round(ok/rounds.length*100)
        _mgShowResult(score, game.id, `Acertaste ${ok} de ${rounds.length} predicciones.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      const r = rounds[idx]
      area.querySelector('#osmLabel').textContent = r.label
      area.querySelector('#osmRound').textContent = idx+1
      area.querySelector('#osmCell').className = 'mg-cell'
      const opts = area.querySelector('#osmOpts')
      const choices = [
        {k:'shrunk',l:'Se encoge (crenación)'},
        {k:'normal',l:'Sin cambios visibles'},
        {k:'swollen',l:'Se hincha'},
        {k:'bursted',l:'Estalla (hemólisis)'}
      ]
      opts.innerHTML = ''
      choices.forEach(c => {
        const b = document.createElement('button')
        b.className = 'btn'; b.textContent = c.l
        b.addEventListener('click', () => {
          if (c.k === r.correct){ ok++; b.style.background='var(--greenSoft)'; b.style.borderColor='var(--green)' }
          else b.style.background='var(--redSoft)'
          area.querySelector('#osmOk').textContent = ok
          area.querySelector('#osmCell').className = 'mg-cell ' + (r.correct === 'normal' ? '' : r.correct)
          ;[...opts.children].forEach(x => x.disabled = true)
          setTimeout(() => { idx++; renderRound() }, 1400)
        })
        opts.appendChild(b)
      })
    }
    renderRound()
  }

  // ════════════════════════════════════════════════════════
  //  12. FLUJO DE ENERGÍA
  // ════════════════════════════════════════════════════════
  R.energy_flow = (area, game) => dragdropToBins(area, game, [
    {n:'Hidrólisis de ATP',c:'exo'},{n:'Respiración celular',c:'exo'},
    {n:'Combustión de glucosa',c:'exo'},{n:'Glucólisis (neto)',c:'exo'},
    {n:'Síntesis de proteínas',c:'endo'},{n:'Fotosíntesis',c:'endo'},
    {n:'Síntesis de ADN',c:'endo'},{n:'Bomba Na/K (carga iones)',c:'endo'}
  ], { exo:'🔥 Exergónica (libera)', endo:'⚡ Endergónica (consume)' },
     'Síntesis = endergónica (necesita energía). Degradación/respiración = exergónica (libera). El ATP acopla ambas.')

  // ════════════════════════════════════════════════════════
  //  13. ATP EN ACCIÓN
  // ════════════════════════════════════════════════════════
  R.atp_action = (area, game) => multiChoiceQuiz(area, game, [
    { q:'¿Síntesis de proteínas requiere ATP?', ops:[{t:'Sí',ok:true,exp:'Endergónica.'},{t:'No',ok:false}] },
    { q:'¿Bomba Na⁺/K⁺ requiere ATP?', ops:[{t:'Sí',ok:true,exp:'Activa primaria: hidroliza ATP.'},{t:'No',ok:false}] },
    { q:'¿Difusión simple de O₂ requiere ATP?', ops:[{t:'Sí',ok:false},{t:'No',ok:true,exp:'Pasiva, a favor de gradiente.'}] },
    { q:'¿Contracción muscular requiere ATP?', ops:[{t:'Sí',ok:true,exp:'Cabezas de miosina hidrolizan ATP.'},{t:'No',ok:false}] },
    { q:'¿Ósmosis requiere ATP?', ops:[{t:'Sí',ok:false},{t:'No',ok:true,exp:'Difusión de agua, pasiva.'}] },
    { q:'¿Replicación del ADN requiere ATP?', ops:[{t:'Sí',ok:true,exp:'Endergónica, además requiere ATP por nucleótido.'},{t:'No',ok:false}] },
    { q:'¿Difusión facilitada de glucosa por GLUT requiere ATP?', ops:[{t:'Sí',ok:false},{t:'No',ok:true,exp:'Pasiva con proteína. A favor de gradiente.'}] },
    { q:'¿Endocitosis requiere ATP?', ops:[{t:'Sí',ok:true,exp:'Sí: deformar membrana es activo.'},{t:'No',ok:false}] }
  ], '8 procesos celulares. Decidí Sí o No.')

  // ════════════════════════════════════════════════════════
  //  14. CLOROPLASTO 3D — canvas con tilacoides apilados
  // ════════════════════════════════════════════════════════
  R.chloroplast_3d = (area, game) => {
    const labels = [
      { id:'memb', n:'Membrana externa', x:.05, y:.5 },
      { id:'estr', n:'Estroma', x:.62, y:.85 },
      { id:'tila', n:'Tilacoide', x:.4, y:.4 },
      { id:'gran', n:'Grana (pila)', x:.7, y:.5 },
      { id:'lum',  n:'Lumen tilacoidal', x:.45, y:.5 }
    ]
    const correct = ['memb','tila','gran','lum','estr']
    let askIdx = 0, ok = 0
    const startedAt = Date.now()
    _mgShell(area, game, `
      <div class="organelle-frame">
        <canvas id="cpCv"></canvas>
        <div class="organelle-label" style="top:.6rem;left:.6rem" id="cpAsk">—</div>
        <div class="organelle-label" style="bottom:.6rem;right:.6rem" id="cpScore">0/${correct.length}</div>
      </div>
    `, 'Hacé clic sobre la parte del cloroplasto que se te pide. La fase luminosa ocurre en tilacoides; el ciclo de Calvin en estroma.')
    const cv = area.querySelector('#cpCv')
    const cw = cv.width = 720, ch = cv.height = 405
    const g = cv.getContext('2d')
    let phase = 0, raf
    function draw(){
      const bg = g.createRadialGradient(cw/2, ch/2, 50, cw/2, ch/2, 400)
      bg.addColorStop(0, '#1a3826'); bg.addColorStop(1, '#061a0e')
      g.fillStyle = bg; g.fillRect(0,0,cw,ch)
      // Membrana doble (elipse)
      g.strokeStyle = '#7ec8a4'; g.lineWidth = 6
      g.beginPath(); g.ellipse(cw/2, ch/2, cw*.42, ch*.38, 0, 0, Math.PI*2); g.stroke()
      g.lineWidth = 3
      g.beginPath(); g.ellipse(cw/2, ch/2, cw*.4, ch*.36, 0, 0, Math.PI*2); g.stroke()
      // Estroma (interior)
      g.fillStyle = 'rgba(80,140,100,.18)'
      g.beginPath(); g.ellipse(cw/2, ch/2, cw*.4, ch*.36, 0, 0, Math.PI*2); g.fill()
      // Tilacoides apilados (3 grana)
      const granaPos = [{x:.32,y:.5},{x:.55,y:.42},{x:.7,y:.55}]
      granaPos.forEach((gp,gi) => {
        const cx = gp.x*cw, cy = gp.y*ch
        for (let i = 0; i < 5; i++){
          const off = (i-2)*9
          const grad = g.createLinearGradient(cx-30, cy+off, cx+30, cy+off+8)
          grad.addColorStop(0, '#2f8b4d'); grad.addColorStop(.5, '#5cb285'); grad.addColorStop(1, '#2f8b4d')
          g.fillStyle = grad
          g.beginPath()
          g.ellipse(cx, cy+off, 28, 5, 0, 0, Math.PI*2)
          g.fill()
          g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .5; g.stroke()
        }
        // Conexión entre grana
        if (gi < granaPos.length-1){
          const ng = granaPos[gi+1]
          g.strokeStyle = 'rgba(95,178,133,.5)'; g.lineWidth = 4
          g.beginPath(); g.moveTo(cx+25, cy); g.lineTo(ng.x*cw-25, ng.y*ch); g.stroke()
        }
      })
      // Light particles
      const phaseSin = Math.sin(phase)
      for (let i = 0; i < 8; i++){
        const lx = (i*100 + phase*40) % cw
        const ly = 30 + Math.sin(phase + i)*8
        g.fillStyle = `rgba(255,235,150,${.5 + .4*phaseSin})`
        g.beginPath(); g.arc(lx, ly, 3, 0, Math.PI*2); g.fill()
      }
      phase += 0.04
      raf = requestAnimationFrame(draw)
    }
    function next(){
      if (askIdx >= correct.length){
        cancelAnimationFrame(raf)
        const score = Math.round(ok/correct.length*100)
        _mgShowResult(score, game.id, `Identificaste ${ok} de ${correct.length} estructuras.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      const target = labels.find(l => l.id === correct[askIdx])
      area.querySelector('#cpAsk').textContent = `Hacé clic en: ${target.n}`
      area.querySelector('#cpScore').textContent = `${ok}/${correct.length}`
    }
    cv.addEventListener('click', e => {
      if (askIdx >= correct.length) return
      const rect = cv.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (cw/rect.width)
      const y = (e.clientY - rect.top) * (ch/rect.height)
      const target = labels.find(l => l.id === correct[askIdx])
      const tx = target.x*cw, ty = target.y*ch
      const dist = Math.hypot(x-tx, y-ty)
      if (dist <= 100){ ok++ }
      askIdx++
      setTimeout(() => next(), 400)
    })
    draw(); next()
  }

  // ════════════════════════════════════════════════════════
  //  15. RUTA DE LA FOTOSÍNTESIS
  // ════════════════════════════════════════════════════════
  R.photo_path = (area, game) => orderSequence(area, game, [
    'Luz absorbida en clorofila (PSII)',
    'Fotólisis del agua → libera O₂',
    'Cadena de transporte tilacoidal (bombea H⁺)',
    'PSI re-excita electrones → reducen NADP⁺',
    'ATP sintasa produce ATP por quimiósmosis',
    'Ciclo de Calvin en el estroma',
    'Fijación de CO₂ por Rubisco a RuBP',
    'G3P → glucosa y otros azúcares'
  ], 'Ordená las 8 etapas de la fotosíntesis: desde captura de luz hasta producción de glucosa.')

  // ════════════════════════════════════════════════════════
  //  16. RESPIRACIÓN CELULAR
  // ════════════════════════════════════════════════════════
  R.cell_resp = (area, game) => orderSequence(area, game, [
    'Glucosa entra al citoplasma',
    'Glucólisis: 2 piruvatos + 2 ATP + 2 NADH',
    'Piruvato cruza a la matriz mitocondrial',
    'Oxidación a Acetil-CoA + CO₂ + NADH',
    'Ciclo de Krebs en matriz',
    'Producción de NADH y FADH₂',
    'Cadena de transporte en membrana interna',
    'O₂ acepta electrones → forma H₂O',
    'ATP sintasa produce ~26-28 ATP'
  ], '9 etapas de la respiración aeróbica. Recordá: O₂ acepta electrones (no produce ATP); ATP lo produce ATP sintasa.')

  // ════════════════════════════════════════════════════════
  //  17. CADENA DE TRANSPORTE — canvas membrana mitocondrial
  // ════════════════════════════════════════════════════════
  R.etc_pump = (area, game) => {
    let pumped = 0, atpProduced = 0
    const target = 12 // bombear 12 H+ → 4 ATP
    let started = false, t0
    _mgShell(area, game, `
      <div class="organelle-frame">
        <canvas id="etcCv"></canvas>
        <div class="organelle-label" style="top:.6rem;left:.6rem">Bombeá H⁺ al espacio intermembranal</div>
      </div>
      <div style="display:flex;gap:1rem;justify-content:center;margin-top:.8rem;flex-wrap:wrap;font-weight:800">
        <span>H⁺ bombeados: <span style="color:var(--green);font-family:Merriweather,serif" id="etcPumped">0</span>/${target}</span>
        <span>ATP producidos: <span style="color:var(--green);font-family:Merriweather,serif" id="etcAtp">0</span></span>
      </div>
      <div style="display:flex;gap:.5rem;justify-content:center;margin-top:.8rem">
        <button class="btn primary" id="etcPump">⚡ Pasar electrón al complejo (+H⁺)</button>
      </div>
    `, 'Cada electrón que pasa por la cadena bombea H⁺ al espacio intermembranal. Cada 3 H⁺ que regresan por ATP sintasa producen 1 ATP.')
    const cv = area.querySelector('#etcCv')
    const cw = cv.width = 720, ch = cv.height = 405
    const g = cv.getContext('2d')
    let raf, phase = 0
    let protons = [] // {x, y, vx, vy, side}
    function spawnPump(){
      // Lanzar 1 H+ desde matriz (abajo) hacia espacio intermembranal (arriba)
      protons.push({ x: 100 + Math.random()*500, y: ch*.7, vx: 0, vy: -2.2, t: 0, side:'up' })
      pumped++
      area.querySelector('#etcPumped').textContent = pumped
      if (pumped % 3 === 0){
        atpProduced++
        area.querySelector('#etcAtp').textContent = atpProduced
        // ATP burst
        protons.push({ x: cw*.85, y: ch*.5, vx: 1.5, vy: 0, t: 0, atp: true })
      }
      if (pumped >= target){
        const dur = (Date.now() - t0)/1000
        const score = atpProduced >= 4 ? 100 : Math.round(atpProduced*25)
        cancelAnimationFrame(raf)
        _mgShowResult(score, game.id, `Produjiste ${atpProduced} ATP en ${dur.toFixed(1)}s.`)
        mgFinishGame(game.id, score, dur)
      }
    }
    function draw(){
      const bg = g.createLinearGradient(0, 0, 0, ch)
      bg.addColorStop(0, '#0d1f1a'); bg.addColorStop(1, '#1c2e1e')
      g.fillStyle = bg; g.fillRect(0,0,cw,ch)
      // Membrana interna (banda en medio)
      g.fillStyle = 'rgba(120,90,40,.4)'; g.fillRect(0, ch*.45, cw, ch*.1)
      g.strokeStyle = 'rgba(255,200,100,.6)'; g.lineWidth = 2
      g.strokeRect(0, ch*.45, cw, ch*.1)
      // Complejos I, II, III, IV (4 cuadros)
      ;['I','III','IV','ATP'].forEach((name, i) => {
        const x = 100 + i*180
        const grd = g.createLinearGradient(x, ch*.4, x+90, ch*.6)
        grd.addColorStop(0, '#34495e'); grd.addColorStop(1, '#1a2530')
        g.fillStyle = grd
        g.fillRect(x, ch*.4, 90, ch*.2)
        g.strokeStyle = '#7d8c95'; g.lineWidth = 1.5
        g.strokeRect(x, ch*.4, 90, ch*.2)
        g.fillStyle = '#fff'; g.font = 'bold 16px sans-serif'
        g.textAlign = 'center'
        g.fillText(name, x+45, ch*.5+5)
      })
      // Labels
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '12px sans-serif'; g.textAlign = 'left'
      g.fillText('🔼 Espacio intermembranal (alta H⁺)', 10, 20)
      g.fillText('🔽 Matriz mitocondrial (baja H⁺)', 10, ch-10)
      // Protones
      protons = protons.filter(p => {
        p.x += p.vx; p.y += p.vy
        if (p.atp){
          g.fillStyle = '#f1c40f'; g.font = 'bold 14px sans-serif'
          g.fillText('ATP', p.x, p.y)
          return p.x < cw + 20
        } else {
          g.fillStyle = '#e74c3c'
          g.beginPath(); g.arc(p.x, p.y, 5, 0, Math.PI*2); g.fill()
          g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign='center'; g.textBaseline='middle'
          g.fillText('H⁺', p.x, p.y)
          return p.y > 20 && p.y < ch+10
        }
      })
      phase += 0.05
      raf = requestAnimationFrame(draw)
    }
    area.querySelector('#etcPump').addEventListener('click', () => {
      if (!started){ started = true; t0 = Date.now() }
      if (pumped < target) spawnPump()
    })
    draw()
  }

  // ════════════════════════════════════════════════════════
  //  18. EMPAQUETAMIENTO ADN
  // ════════════════════════════════════════════════════════
  R.dna_packaging = (area, game) => orderSequence(area, game, [
    'ADN doble hélice (2 nm)',
    'Nucleosoma: ADN + 8 histonas (10 nm)',
    'Fibra de cromatina (30 nm)',
    'Bucles de cromatina (300 nm)',
    'Cromatina condensada (700 nm)',
    'Cromosoma metafásico (1400 nm)'
  ], 'Ordená los 6 niveles de empaquetamiento del ADN, desde la doble hélice hasta el cromosoma listo para mitosis.')

  // ════════════════════════════════════════════════════════
  //  19. CONTROL DEL CICLO CELULAR
  // ════════════════════════════════════════════════════════
  R.cell_cycle = (area, game) => multiChoiceQuiz(area, game, [
    { q:'Checkpoint G1: detectás daño en el ADN. ¿Qué hacés?', ops:[
      {t:'Continuar a S igual', ok:false, exp:'Permitir replicación con ADN dañado = catástrofe.'},
      {t:'Detener el ciclo y reparar', ok:true, exp:'Sí: p53 activa y para el ciclo.'},
      {t:'Saltar a M', ok:false},
      {t:'Apoptosis inmediata', ok:false, exp:'Solo si el daño es irreparable.'}
    ]},
    { q:'Daño irreparable en G1, p53 sigue alta:', ops:[
      {t:'Continuar el ciclo', ok:false},
      {t:'Reparar otra vez', ok:false, exp:'Si no se pudo, no insistir.'},
      {t:'Apoptosis programada', ok:true, exp:'Suicidio celular para evitar cáncer.'},
      {t:'Quedarse en G0 indefinido', ok:false}
    ]},
    { q:'Checkpoint G2: replicación incompleta del ADN:', ops:[
      {t:'Iniciar mitosis', ok:false, exp:'Mitosis con ADN incompleto = células anómalas.'},
      {t:'Detener y completar replicación', ok:true, exp:'Correcto: G2 verifica que la replicación esté lista.'},
      {t:'Saltar a anafase', ok:false},
      {t:'Apoptosis', ok:false, exp:'No es la respuesta inmediata.'}
    ]},
    { q:'Checkpoint M: cromosomas mal alineados en la placa metafásica:', ops:[
      {t:'Continuar a anafase', ok:false, exp:'Habría aneuploidía.'},
      {t:'Esperar correcta unión al huso', ok:true, exp:'El checkpoint del huso pausa hasta que todo esté alineado.'},
      {t:'Apoptosis', ok:false},
      {t:'Volver a G2', ok:false}
    ]},
    { q:'Mutación en p53 → ¿qué riesgo aumenta?', ops:[
      {t:'Apoptosis excesiva', ok:false},
      {t:'Cáncer', ok:true, exp:'p53 es supresor tumoral. Sin él, células dañadas se dividen.'},
      {t:'Crecimiento más lento', ok:false},
      {t:'Inmortalidad celular benéfica', ok:false}
    ]}
  ], 'Sos la célula. Decidí en cada checkpoint según las señales recibidas.')

  // ════════════════════════════════════════════════════════
  //  20. MITOSIS VS MEIOSIS
  // ════════════════════════════════════════════════════════
  R.mitosis_meiosis = (area, game) => multiChoiceQuiz(area, game, [
    { q:'Mitosis produce:', ops:[
      {t:'2 células haploides', ok:false},
      {t:'2 células diploides idénticas', ok:true, exp:'Mantiene ploidía y genoma.'},
      {t:'4 células haploides distintas', ok:false},
      {t:'1 célula diploide', ok:false}
    ]},
    { q:'Meiosis produce:', ops:[
      {t:'2 células diploides', ok:false},
      {t:'4 células haploides genéticamente distintas', ok:true, exp:'Reduce ploidía + genera variabilidad.'},
      {t:'2 haploides', ok:false},
      {t:'4 diploides', ok:false}
    ]},
    { q:'¿En qué fase ocurre el entrecruzamiento?', ops:[
      {t:'Profase mitótica', ok:false},
      {t:'Profase I de meiosis', ok:true, exp:'Crossing-over entre homólogos.'},
      {t:'Metafase II', ok:false},
      {t:'Anafase mitótica', ok:false}
    ]},
    { q:'En meiosis I se separan:', ops:[
      {t:'Cromátidas hermanas', ok:false, exp:'Eso ocurre en meiosis II y mitosis.'},
      {t:'Cromosomas homólogos', ok:true, exp:'Reducción a haploide.'},
      {t:'Centrómeros', ok:false},
      {t:'Centríolos', ok:false}
    ]},
    { q:'En meiosis II se separan:', ops:[
      {t:'Cromosomas homólogos', ok:false},
      {t:'Cromátidas hermanas', ok:true, exp:'Como en mitosis. Genera 4 haploides.'},
      {t:'Núcleos', ok:false},
      {t:'Cromátidas y homólogos', ok:false}
    ]}
  ], '5 preguntas comparando mitosis y meiosis.')

  // ════════════════════════════════════════════════════════
  //  21. PUNNETT
  // ════════════════════════════════════════════════════════
  R.punnett_pro = (area, game) => {
    const cases = [
      { p1:'Aa', p2:'Aa', cells:['AA','Aa','Aa','aa'], desc:'Heterocigoto × heterocigoto' },
      { p1:'AA', p2:'aa', cells:['Aa','Aa','Aa','Aa'], desc:'Homocigoto dom × homocigoto rec' },
      { p1:'Aa', p2:'aa', cells:['Aa','Aa','aa','aa'], desc:'Cruce de prueba' }
    ]
    let idx = 0, totalOk = 0, totalCells = 0
    const startedAt = Date.now()
    let selected = -1
    _mgShell(area, game, '', 'Click una celda y elegí el genotipo. Verificá al final de cada cruce.')
    function renderCase(){
      if (idx >= cases.length){
        const score = Math.round(totalOk/totalCells*100)
        _mgShowResult(score, game.id, `Acertaste ${totalOk} de ${totalCells} celdas.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      const cs = cases[idx]
      const a1 = cs.p1[0], a2 = cs.p1[1]
      const b1 = cs.p2[0], b2 = cs.p2[1]
      const c = area.querySelector('#mgGameContent')
      c.innerHTML = `<p style="text-align:center;margin-bottom:.4rem"><strong>Caso ${idx+1}/${cases.length}</strong>: ${esc(cs.desc)}</p>
        <p style="text-align:center;font-size:.9rem;margin-bottom:.4rem">Padre 1: <strong>${cs.p1}</strong> · Padre 2: <strong>${cs.p2}</strong></p>
        <div class="mg-punnett">
          <div class="pc"></div>
          <div class="pc header">${b1}</div>
          <div class="pc header">${b2}</div>
          <div class="pc header">${a1}</div>
          <div class="pc cell" data-i="0">?</div>
          <div class="pc cell" data-i="1">?</div>
          <div class="pc header">${a2}</div>
          <div class="pc cell" data-i="2">?</div>
          <div class="pc cell" data-i="3">?</div>
        </div>
        <div style="text-align:center;margin-top:.8rem">
          <p style="font-size:.85rem;margin-bottom:.4rem">Click una celda y elegí el genotipo:</p>
          <div style="display:flex;gap:.4rem;justify-content:center;flex-wrap:wrap">
            <button class="btn" data-pun="AA">AA</button>
            <button class="btn" data-pun="Aa">Aa</button>
            <button class="btn" data-pun="aa">aa</button>
          </div>
        </div>
        <div style="text-align:center;margin-top:.8rem">
          <button class="btn primary" id="punSubmit">✓ Verificar tablero</button>
        </div>`
      selected = -1
      c.querySelectorAll('.pc.cell').forEach(cell => {
        cell.addEventListener('click', () => {
          selected = parseInt(cell.dataset.i)
          c.querySelectorAll('.pc.cell').forEach((x,j) => x.style.outline = j===selected?'3px solid var(--green)':'none')
        })
      })
      c.querySelectorAll('[data-pun]').forEach(b => {
        b.addEventListener('click', () => {
          if (selected < 0) return
          const cell = c.querySelector(`.pc.cell[data-i="${selected}"]`)
          if (cell){ cell.textContent = b.dataset.pun; cell.dataset.value = b.dataset.pun }
        })
      })
      c.querySelector('#punSubmit').addEventListener('click', () => {
        let ok = 0
        cs.cells.forEach((expected, i) => {
          const cell = c.querySelector(`.pc.cell[data-i="${i}"]`)
          const got = cell?.dataset.value || ''
          const norm = s => s.split('').sort().reverse().join('')
          if (norm(got) === norm(expected)){ ok++; cell.classList.add('correct') }
          else cell.classList.add('wrong')
        })
        totalOk += ok; totalCells += cs.cells.length
        setTimeout(() => { idx++; renderCase() }, 1500)
      })
    }
    renderCase()
  }

  // ════════════════════════════════════════════════════════
  //  22. REPLICACIÓN DEL ADN
  // ════════════════════════════════════════════════════════
  R.dna_replication = (area, game) => {
    const templates = ['ATGC','TACG','GGCAT','CCTAG','GATTACA']
    const compMap = { A:'T', T:'A', G:'C', C:'G' }
    let idx = 0, ok = 0
    const startedAt = Date.now()
    _mgShell(area, game, '', 'A↔T, G↔C. Pulsá una base y se ubica en el siguiente hueco. Verificá cuando termines.')
    function renderRound(){
      if (idx >= templates.length){
        const score = Math.round(ok/templates.length*100)
        _mgShowResult(score, game.id, `Acertaste ${ok} de ${templates.length} cadenas.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      const tpl = templates[idx]
      const c = area.querySelector('#mgGameContent')
      c.innerHTML = `
        <p style="text-align:center;margin-bottom:.3rem"><strong>Cadena molde:</strong> Ronda ${idx+1}/${templates.length} · Aciertos: ${ok}</p>
        <div class="dna-strand">${tpl.split('').map(b => `<span class="dna-base ${b}">${b}</span>`).join('')}</div>
        <p style="text-align:center;font-size:.85rem;color:var(--muted)">↓ Construí la cadena complementaria ↓</p>
        <div class="dna-strand" id="drSlots">${tpl.split('').map((_,i) => `<span class="dna-base empty" data-slot="${i}">·</span>`).join('')}</div>
        <div style="display:flex;gap:.4rem;justify-content:center;flex-wrap:wrap;margin-top:.5rem">
          ${['A','T','G','C'].map(b => `<button class="btn dna-base ${b}" data-base="${b}" style="min-width:54px;font-family:Courier New,monospace;font-size:1.1rem">${b}</button>`).join('')}
        </div>
        <div style="display:flex;gap:.5rem;justify-content:center;margin-top:.8rem">
          <button class="btn" id="drClear">↺ Limpiar</button>
          <button class="btn primary" id="drCheck">✓ Verificar</button>
        </div>
      `
      const slots = c.querySelectorAll('#drSlots .dna-base')
      c.querySelectorAll('[data-base]').forEach(btn => {
        btn.addEventListener('click', () => {
          for (const s of slots){
            if (s.classList.contains('empty')){
              s.textContent = btn.dataset.base
              s.className = 'dna-base ' + btn.dataset.base
              s.dataset.slot = s.dataset.slot
              break
            }
          }
        })
      })
      c.querySelector('#drClear').addEventListener('click', () => {
        slots.forEach((s,i) => { s.textContent = '·'; s.className = 'dna-base empty'; s.dataset.slot = i })
      })
      c.querySelector('#drCheck').addEventListener('click', () => {
        let allOk = true
        slots.forEach((s,i) => {
          const expected = compMap[tpl[i]]
          if (s.textContent === expected){ s.classList.add('correct') }
          else { s.classList.add('wrong'); allOk = false }
        })
        if (allOk) ok++
        setTimeout(() => { idx++; renderRound() }, 1300)
      })
    }
    renderRound()
  }

  // ════════════════════════════════════════════════════════
  //  23. CODON TRANSLATOR (ADN → proteína)
  // ════════════════════════════════════════════════════════
  R.codon_translator = (area, game) => {
    const codonTable = {
      'AUG':'Met','UUU':'Phe','UUC':'Phe','CCU':'Pro','CCC':'Pro','CCA':'Pro','CCG':'Pro',
      'GGU':'Gly','GGC':'Gly','GGA':'Gly','GGG':'Gly','AAA':'Lys','AAG':'Lys',
      'UAA':'STOP','UAG':'STOP','UGA':'STOP','GCU':'Ala','GCC':'Ala','GCA':'Ala','GCG':'Ala',
      'UUA':'Leu','UUG':'Leu','UCU':'Ser','UCC':'Ser','UCA':'Ser','UCG':'Ser',
      'CAU':'His','CAC':'His','CAA':'Gln','CAG':'Gln'
    }
    const sequences = [
      ['AUG','GCU','UAA'],
      ['AUG','UUU','GGU','UAA'],
      ['AUG','CCC','AAA','UAG'],
      ['AUG','UCU','CAU','GCC','UAA']
    ]
    const aaPool = ['Met','Phe','Pro','Gly','Lys','STOP','Ala','Leu','Ser','His','Gln']
    let idx = 0, totalOk = 0, totalCodons = 0
    const startedAt = Date.now()
    _mgShell(area, game, '', 'Traducí cada codón ARNm al aminoácido correcto. AUG = Met (start). UAA/UAG/UGA = STOP.')
    function renderSeq(){
      if (idx >= sequences.length){
        const score = Math.round(totalOk/totalCodons*100)
        _mgShowResult(score, game.id, `Acertaste ${totalOk} de ${totalCodons} codones.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      const seq = sequences[idx]
      const c = area.querySelector('#mgGameContent')
      c.innerHTML = `
        <p style="text-align:center"><strong>Secuencia ${idx+1}/${sequences.length}</strong></p>
        <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin:1rem 0">
          ${seq.map((cod,i) => `<div style="text-align:center">
            <div style="font-family:Courier New,monospace;font-weight:800;font-size:1.2rem;padding:.5rem .8rem;background:var(--blueSoft);border-radius:8px;margin-bottom:.3rem">${cod}</div>
            <select data-codon="${i}" style="padding:.4rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-weight:700">
              <option value="">—</option>
              ${aaPool.map(aa => `<option value="${aa}">${aa}</option>`).join('')}
            </select>
          </div>`).join('')}
        </div>
        <div style="text-align:center">
          <button class="btn primary" id="codCheck">✓ Verificar traducción</button>
        </div>
      `
      c.querySelector('#codCheck').addEventListener('click', () => {
        let ok = 0
        seq.forEach((cod, i) => {
          const sel = c.querySelector(`select[data-codon="${i}"]`)
          const expected = codonTable[cod]
          if (sel.value === expected){ ok++; sel.style.background='var(--greenSoft)'; sel.style.borderColor='var(--green)' }
          else { sel.style.background='var(--redSoft)' }
        })
        totalOk += ok; totalCodons += seq.length
        setTimeout(() => { idx++; renderSeq() }, 1300)
      })
    }
    renderSeq()
  }

  // ════════════════════════════════════════════════════════
  //  24. INGENIERÍA GENÉTICA — cortar e insertar
  // ════════════════════════════════════════════════════════
  R.genetic_eng = (area, game) => multiChoiceQuiz(area, game, [
    { q:'Querés insertar un gen humano (insulina) en una bacteria. ¿Qué necesitás primero?', ops:[
      {t:'Una enzima de restricción que reconozca el sitio', ok:true, exp:'Corta tanto el plásmido como el gen.'},
      {t:'ADN polimerasa', ok:false, exp:'Esa replica, no corta.'},
      {t:'Helicasa', ok:false},
      {t:'Topoisomerasa', ok:false}
    ]},
    { q:'¿Qué une los extremos del gen al plásmido cortado?', ops:[
      {t:'ARN polimerasa', ok:false},
      {t:'Ligasa de ADN', ok:true, exp:'Forma enlaces fosfodiéster entre los extremos compatibles.'},
      {t:'Lisozima', ok:false},
      {t:'Restrictasa', ok:false}
    ]},
    { q:'¿Por qué se usa la PCR en este proceso?', ops:[
      {t:'Para destruir bacterias', ok:false},
      {t:'Para amplificar el gen y tener millones de copias', ok:true, exp:'PCR multiplica exponencialmente.'},
      {t:'Para insertar el gen', ok:false},
      {t:'Para visualizar el ADN', ok:false}
    ]},
    { q:'Para introducir el plásmido recombinante a la bacteria, usás:', ops:[
      {t:'Transformación (shock térmico o electroporación)', ok:true, exp:'Las bacterias incorporan ADN del medio.'},
      {t:'Mitosis', ok:false},
      {t:'Meiosis', ok:false},
      {t:'Apoptosis', ok:false}
    ]},
    { q:'¿Cómo identificás cuáles bacterias incorporaron el plásmido?', ops:[
      {t:'A simple vista', ok:false},
      {t:'Marcador de resistencia a antibiótico en el plásmido', ok:true, exp:'Solo crecen las que tienen el plásmido.'},
      {t:'Por su forma', ok:false},
      {t:'Por su olor', ok:false}
    ]}
  ], 'Vas a clonar un gen en bacterias. Decidí cada paso del protocolo.')

  // ════════════════════════════════════════════════════════
  //  25. SELECCIÓN NATURAL — simulación canvas
  // ════════════════════════════════════════════════════════
  R.natural_select = (area, game) => {
    const popSize = 60
    let pop = [] // {x,y,vx,vy,color,fitness}
    let env = 'normal' // normal | dark | light
    let gen = 0, maxGen = 6
    let lightFreq = 0.5
    const startedAt = Date.now()
    _mgShell(area, game, `
      <div class="organelle-frame">
        <canvas id="nsCv"></canvas>
        <div class="organelle-label" style="top:.6rem;left:.6rem">Generación: <span id="nsGen">0</span>/${maxGen}</div>
        <div class="organelle-label" style="top:.6rem;right:.6rem">Frec. claros: <span id="nsFreq">50%</span></div>
      </div>
      <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.8rem">
        <button class="btn" id="nsEnvLight">☀️ Ambiente claro</button>
        <button class="btn" id="nsEnvDark">🌑 Ambiente oscuro</button>
        <button class="btn primary" id="nsNext">▶ Siguiente generación</button>
      </div>
      <p style="text-align:center;margin-top:.5rem;font-size:.85rem;color:var(--muted)">Si elegís oscuro: los oscuros se camuflan mejor → sobreviven más. Si claro: los claros sobreviven más.</p>
    `, 'Cambiá el ambiente y avanzá generaciones. Tu objetivo: que la población se adapte (>80% de un color en 6 generaciones).')
    const cv = area.querySelector('#nsCv')
    const cw = cv.width = 720, ch = cv.height = 405
    const g = cv.getContext('2d')
    let raf
    function spawn(){
      pop = []
      for (let i = 0; i < popSize; i++){
        pop.push({
          x: Math.random()*cw, y: Math.random()*ch,
          vx: (Math.random()-.5)*1.5, vy: (Math.random()-.5)*1.5,
          color: Math.random() < 0.5 ? 'light' : 'dark'
        })
      }
    }
    function draw(){
      const bg = env === 'light' ? '#a8c4a4' : env === 'dark' ? '#0a1810' : '#3a4a3a'
      g.fillStyle = bg; g.fillRect(0,0,cw,ch)
      pop.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > cw) p.vx *= -1
        if (p.y < 0 || p.y > ch) p.vy *= -1
        const c = p.color === 'light' ? '#f4e4c1' : '#3d2817'
        const grd = g.createRadialGradient(p.x-2, p.y-2, 0, p.x, p.y, 7)
        grd.addColorStop(0, '#fff'); grd.addColorStop(.4, c); grd.addColorStop(1, '#000')
        g.fillStyle = grd
        g.beginPath(); g.arc(p.x, p.y, 6, 0, Math.PI*2); g.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    function nextGen(){
      gen++
      // Selección: en ambiente claro mueren más oscuros, en oscuro mueren más claros
      pop = pop.filter(p => {
        if (env === 'normal') return Math.random() < 0.7
        const matches = (env === 'light' && p.color === 'light') || (env === 'dark' && p.color === 'dark')
        return Math.random() < (matches ? 0.85 : 0.25)
      })
      // Reproducción
      const survivors = [...pop]
      while (pop.length < popSize && survivors.length){
        const parent = survivors[Math.floor(Math.random()*survivors.length)]
        pop.push({
          x: Math.random()*cw, y: Math.random()*ch,
          vx: (Math.random()-.5)*1.5, vy: (Math.random()-.5)*1.5,
          color: Math.random() < 0.05 ? (parent.color === 'light' ? 'dark' : 'light') : parent.color // mutación 5%
        })
      }
      const lights = pop.filter(p => p.color === 'light').length
      lightFreq = lights / pop.length
      area.querySelector('#nsGen').textContent = gen
      area.querySelector('#nsFreq').textContent = (lightFreq*100).toFixed(0) + '%'
      if (gen >= maxGen){
        cancelAnimationFrame(raf)
        const dom = Math.max(lightFreq, 1-lightFreq)
        const score = Math.round(dom * 100)
        _mgShowResult(score, game.id, `Población final: ${(lightFreq*100).toFixed(0)}% claros, ${((1-lightFreq)*100).toFixed(0)}% oscuros. Adaptación: ${(dom*100).toFixed(0)}%.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000)
      }
    }
    area.querySelector('#nsEnvLight').addEventListener('click', () => env = 'light')
    area.querySelector('#nsEnvDark').addEventListener('click', () => env = 'dark')
    area.querySelector('#nsNext').addEventListener('click', () => { if (gen < maxGen) nextGen() })
    spawn(); draw()
  }

  // ════════════════════════════════════════════════════════
  //  26. HARDY-WEINBERG INTERACTIVO
  // ════════════════════════════════════════════════════════
  R.hardy_weinberg = (area, game) => {
    const startedAt = Date.now()
    let p = 0.5
    let mutation = 0, migration = 0, selection = 0
    let answered = 0, ok = 0
    const questions = [
      'Si p = 0.7 y q = 0.3, ¿qué frecuencia tendría AA en equilibrio?',
      'Si la mutación = 0 y selección = 0, ¿la población está en equilibrio?',
      'Si selección > 0 favoreciendo aa, ¿qué pasa con p en el tiempo?',
      'Si p = 0.5 y q = 0.5, ¿qué frecuencia tiene Aa?'
    ]
    const correct = ['0.49', 'Sí', 'Disminuye', '0.5']
    const opts = [
      ['0.21','0.49','0.7','0.09'],
      ['Sí','No','Solo si N es grande','Imposible saber'],
      ['Aumenta','Disminuye','No cambia','Oscila'],
      ['0.25','0.5','0.75','1.0']
    ]
    _mgShell(area, game, `
      <div class="mg-controls">
        <div class="mg-control"><label>Frecuencia p (alelo A)</label><input type="range" min="0" max="100" value="50" id="hwP"><span class="v" id="hwPV">0.50</span></div>
        <div class="mg-control"><label>Mutación (rate)</label><input type="range" min="0" max="100" value="0" id="hwMut"><span class="v" id="hwMutV">0.00</span></div>
        <div class="mg-control"><label>Migración</label><input type="range" min="0" max="100" value="0" id="hwMig"><span class="v" id="hwMigV">0.00</span></div>
        <div class="mg-control"><label>Selección contra aa</label><input type="range" min="0" max="100" value="0" id="hwSel"><span class="v" id="hwSelV">0.00</span></div>
      </div>
      <div style="margin-top:1rem;padding:1rem;background:var(--soft);border-radius:12px;text-align:center;font-family:Merriweather,serif">
        <div style="font-size:1.1rem">AA: <span id="hwAA" style="color:var(--green)">0.25</span> · Aa: <span id="hwAa" style="color:var(--blue)">0.50</span> · aa: <span id="hwaa" style="color:var(--red)">0.25</span></div>
        <div style="font-size:.8rem;color:var(--muted);margin-top:.4rem" id="hwStatus">En equilibrio Hardy-Weinberg ✓</div>
      </div>
      <hr style="margin:1.4rem 0;border:none;border-top:1px solid var(--border)">
      <div id="hwQuiz"></div>
    `, 'Movés sliders y ves cómo cambian las frecuencias. Después contestá 4 preguntas conceptuales.')
    function update(){
      p = parseInt(area.querySelector('#hwP').value)/100
      mutation = parseInt(area.querySelector('#hwMut').value)/100
      migration = parseInt(area.querySelector('#hwMig').value)/100
      selection = parseInt(area.querySelector('#hwSel').value)/100
      const q = 1-p
      const aa = (p*p).toFixed(2), aA = (2*p*q).toFixed(2), aaA = (q*q).toFixed(2)
      area.querySelector('#hwPV').textContent = p.toFixed(2)
      area.querySelector('#hwMutV').textContent = mutation.toFixed(2)
      area.querySelector('#hwMigV').textContent = migration.toFixed(2)
      area.querySelector('#hwSelV').textContent = selection.toFixed(2)
      area.querySelector('#hwAA').textContent = aa
      area.querySelector('#hwAa').textContent = aA
      area.querySelector('#hwaa').textContent = aaA
      const inEq = mutation < 0.01 && migration < 0.01 && selection < 0.01
      area.querySelector('#hwStatus').textContent = inEq ? 'En equilibrio Hardy-Weinberg ✓' : 'Fuera de equilibrio: la población evoluciona ✗'
      area.querySelector('#hwStatus').style.color = inEq ? 'var(--green)' : 'var(--red)'
    }
    area.querySelectorAll('input[type=range]').forEach(i => i.addEventListener('input', update))
    update()
    // Quiz al final
    let qIdx = 0
    function renderQuiz(){
      const qDiv = area.querySelector('#hwQuiz')
      if (qIdx >= questions.length){
        const score = Math.round(ok/questions.length*100)
        _mgShowResult(score, game.id, `Acertaste ${ok} de ${questions.length} preguntas.`)
        mgFinishGame(game.id, score, (Date.now()-startedAt)/1000); return
      }
      qDiv.innerHTML = `<div class="quiz-stage" style="font-size:.95rem">${questions[qIdx]}</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem" id="hwOpts"></div>`
      const od = qDiv.querySelector('#hwOpts')
      opts[qIdx].forEach(o => {
        const b = document.createElement('button')
        b.className='btn'; b.textContent = o
        b.addEventListener('click', () => {
          if (o === correct[qIdx]){ ok++; b.style.background='var(--greenSoft)' } else b.style.background='var(--redSoft)'
          ;[...od.children].forEach(x => x.disabled = true)
          setTimeout(() => { qIdx++; renderQuiz() }, 900)
        })
        od.appendChild(b)
      })
    }
    renderQuiz()
  }

  // ════════════════════════════════════════════════════════
  //  27. AISLAMIENTO REPRODUCTIVO
  // ════════════════════════════════════════════════════════
  R.isolation = (area, game) => multiChoiceQuiz(area, game, [
    { q:'Dos poblaciones de ranas habitan ríos separados por una montaña hace 10.000 años.', ops:[
      {t:'Aislamiento geográfico', ok:true, exp:'Barrera física → especiación alopátrica.'},
      {t:'Aislamiento temporal', ok:false},
      {t:'Aislamiento conductual', ok:false},
      {t:'Aislamiento mecánico', ok:false}
    ]},
    { q:'Una especie florece en primavera, otra en otoño. No se cruzan.', ops:[
      {t:'Geográfico', ok:false},
      {t:'Temporal', ok:true, exp:'Ciclos reproductivos asincrónicos.'},
      {t:'Mecánico', ok:false},
      {t:'Gamético', ok:false}
    ]},
    { q:'Dos aves del bosque cantan diferente. Las hembras solo responden al canto de su especie.', ops:[
      {t:'Conductual', ok:true, exp:'Comportamiento de cortejo distinto.'},
      {t:'Gamético', ok:false},
      {t:'Geográfico', ok:false},
      {t:'Mecánico', ok:false}
    ]},
    { q:'Dos especies de insectos no pueden copular porque sus genitales son anatómicamente incompatibles.', ops:[
      {t:'Conductual', ok:false},
      {t:'Mecánico', ok:true, exp:'Incompatibilidad anatómica.'},
      {t:'Híbrido', ok:false},
      {t:'Temporal', ok:false}
    ]},
    { q:'Esperma y óvulo de dos especies se encuentran pero no hay fecundación.', ops:[
      {t:'Mecánico', ok:false},
      {t:'Gamético', ok:true, exp:'Incompatibilidad de gametos a nivel molecular.'},
      {t:'Conductual', ok:false},
      {t:'Geográfico', ok:false}
    ]},
    { q:'Dos especies se cruzan, hay descendencia, pero los híbridos son estériles (mula).', ops:[
      {t:'Aislamiento poscigótico (híbrido estéril)', ok:true, exp:'Hay fecundación, pero no flujo génico.'},
      {t:'Geográfico', ok:false},
      {t:'Temporal', ok:false},
      {t:'Conductual', ok:false}
    ]}
  ], '6 escenarios. Identificá el tipo de aislamiento reproductivo.')

  // ════════════════════════════════════════════════════════
  //  28. EVOLUCIÓN QUÍMICA — sopa primitiva
  // ════════════════════════════════════════════════════════
  R.chem_evo = (area, game) => dragdropToBins(area, game, [
    {n:'CH₄ (metano)', c:'inorg'},
    {n:'NH₃ (amoníaco)', c:'inorg'},
    {n:'H₂O (agua)', c:'inorg'},
    {n:'H₂ (hidrógeno)', c:'inorg'},
    {n:'CO₂ (dióxido)', c:'inorg'},
    {n:'Aminoácido', c:'monomer'},
    {n:'Nucleótido', c:'monomer'},
    {n:'Glúcido simple', c:'monomer'},
    {n:'Proteína', c:'polimer'},
    {n:'ARN', c:'polimer'},
    {n:'Coacervado', c:'protocell'},
    {n:'Liposoma', c:'protocell'}
  ], { inorg:'⚛️ Inorgánicas (atmósfera primitiva)', monomer:'🧱 Monómeros (Miller)', polimer:'🔗 Polímeros (1ras macromoléculas)', protocell:'🫧 Protocélulas' },
     'Modelo de Oparin/Haldane + experimento de Miller-Urey: las inorgánicas formaron monómeros, los monómeros polímeros, y luego protocélulas con membrana primitiva.')
}
