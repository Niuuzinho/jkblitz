// ============================================================
// EXPLICAÇÕES (tooltips) E REGISTRO DE CARTAS
//
// Regras (pedido do André: menos pop-ups):
//  - As CARTAS não abrem explicação ao passar o mouse. Botão direito (ou segurar o dedo, ou a tecla I)
//    amplia a carta e mostra tudo sobre ela (isso é feito em js/ui-base.js).
//  - Os outros itens (odds, vida, contadores, botões...) só mostram a explicação quando o mouse PARA
//    em cima por cerca de 1 segundo. Dá para desligar nas opções (modo "clique").
//  - Botão direito em qualquer item com explicação mostra a versão completa na hora.
//  - Com o teclado, a explicação abre quando o item recebe foco (Tab). Esc fecha.
//  - No celular, segurar o dedo abre a explicação numa folha na base da tela.
// Os textos vêm de data/textos.js. Os elementos pedem uma explicação com data-tip="tipo:chave".
// ============================================================
const Tips = (function () {
  const cartas = {};      // cartas desenhadas na tela, para a carta ampliada (botão direito)
  const extras = {};      // textos avulsos (valores que mudam, como o contador da Blitz)
  let seq = 0;
  let aberta = null;      // { el, origem }
  let tDwell = null, tLongo = null, segurouEm = 0, segurando = false, porTeclado = false;
  let opcoes = { modo: () => 'hover', aoCarta: null };
  const toque = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const DWELL = 900;      // milissegundos com o mouse parado para abrir a explicação

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ---------- Palavras-chave: ficam em negrito nos textos ----------
  const termos = [];
  Object.keys(TEXTOS.palavras).forEach(k => TEXTOS.palavras[k].termos.forEach(t => termos.push(t)));
  termos.sort((a, b) => b.length - a.length);
  const REGEX_KW = new RegExp('(?<![\\p{L}\\d])(' + termos.map(escRe).join('|') + ')(?![\\p{L}\\d])', 'gu');

  // Converte um texto de carta ou de explicação em HTML: palavras-chave em negrito e {{trecho}} em destaque de upgrade
  function fmt(texto) {
    let h = esc(texto || '');
    h = h.replace(REGEX_KW, m => '<b class="kw">' + m + '</b>');
    return h.replace(/\{\{/g, '<mark class="mudou">').replace(/\}\}/g, '</mark>');
  }
  // Palavras-chave (entradas de TEXTOS.palavras) que aparecem num texto, sem repetir
  function palavrasDe(texto) {
    const achadas = [];
    String(texto).replace(REGEX_KW, m => {
      let chave = null;
      Object.keys(TEXTOS.palavras).forEach(k => { if (TEXTOS.palavras[k].termos.indexOf(m) >= 0) chave = ['palavras', k]; });
      if (chave && !achadas.some(a => a[0] === chave[0] && a[1] === chave[1])) achadas.push(chave);
      return m;
    });
    return achadas.map(a => ({ tipo: a[0], chave: a[1], e: TEXTOS[a[0]][a[1]] }));
  }

  // ---------- Entradas ----------
  function entrada(chave) {
    const i = chave.indexOf(':'), tipo = chave.slice(0, i), k = chave.slice(i + 1);
    if (tipo === 'kw') return TEXTOS.palavras[k];
    if (tipo === 'naipe') return TEXTOS.naipes[k];
    if (tipo === 'tag') return TEXTOS.tags[k];
    if (tipo === 'regra') return TEXTOS.regras[k];
    if (tipo === 'ui') return TEXTOS.ui[k];
    if (tipo === 'mod') return { nome: seloNome(k) + ' (selo)', curto: seloTexto(k), longo: '', exemplo: TEXTOS.modExemplos[k] };
    if (tipo === 'txt') return extras[k];
    return null;
  }
  function texto(obj) { const id = 'x' + (++seq); extras[id] = obj; return 'txt:' + id; }   // registra um texto avulso e devolve a chave para data-tip
  function registrarCarta(c) { const id = 'c' + (++seq); cartas[id] = c; return id; }         // registra uma carta mostrada e devolve a chave (data-cref)
  const cartaDe = id => cartas[id];
  function limparRegistro() { Object.keys(cartas).forEach(k => delete cartas[k]); Object.keys(extras).forEach(k => delete extras[k]); }

  // ---------- Abrir, posicionar, fechar ----------
  function conteudo(e, longo) {
    const l = longo && (e.longo || e.exemplo)
      ? '<div class="dica-l">' + (e.longo ? '<p>' + fmt(e.longo) + '</p>' : '') + (e.exemplo ? '<p class="dica-ex"><b>Exemplo:</b> ' + fmt(e.exemplo) + '</p>' : '') + '</div>' : '';
    return '<div class="dica-t">' + esc(e.nome) + '</div><div class="dica-c">' + fmt(e.curto) + '</div>' + l;
  }

  function abrir(alvo, longo) {
    if (!alvo || !document.body.contains(alvo)) return;
    const chave = alvo.getAttribute('data-tip'); if (!chave) return;
    const e = entrada(chave); if (!e) return;
    fechar();
    const el = document.createElement('div');
    el.className = 'dica' + (toque ? ' folha' : ''); el.id = 'dica-' + (++seq); el.setAttribute('role', 'tooltip');
    el.innerHTML = (toque ? '<button class="dica-fechar" type="button" data-fechar-dica>Fechar</button>' : '') + conteudo(e, longo || toque);
    document.body.appendChild(el);
    alvo.setAttribute('aria-describedby', el.id);
    aberta = { el, origem: alvo };
    if (!toque) posicionar(el, alvo);
  }
  function fechar() {
    clearTimeout(tDwell);
    if (aberta) { aberta.origem.removeAttribute('aria-describedby'); aberta.el.remove(); aberta = null; }
  }
  // Fica ao lado do alvo, sem cobri-lo nem cobrir os botões de jogar
  function posicionar(el, alvo) {
    el.style.left = '0px'; el.style.top = '0px';
    const r = alvo.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight, m = 8;
    const cruza = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const evitar = Array.prototype.map.call(document.querySelectorAll('[data-acao=confirmar],[data-acao=jogar],[data-acao=proxima],[data-acao=terminar],[data-acao=anunciar-confirmar]'), b => b.getBoundingClientRect());
    const limita = (x, y) => ({ x: Math.max(m, Math.min(x, vw - w - m)), y: Math.max(m, Math.min(y, vh - h - m)) });
    const cands = [limita(r.left + r.width / 2 - w / 2, r.bottom + m), limita(r.left + r.width / 2 - w / 2, r.top - h - m),
                   limita(r.right + m, r.top + r.height / 2 - h / 2), limita(r.left - w - m, r.top + r.height / 2 - h / 2)];
    let esc2 = cands.find(p => { const c = { left: p.x, top: p.y, right: p.x + w, bottom: p.y + h }; return !cruza(c, r) && !evitar.some(b => cruza(c, b)); });
    esc2 = esc2 || cands.find(p => !cruza({ left: p.x, top: p.y, right: p.x + w, bottom: p.y + h }, r)) || cands[0];
    el.style.left = esc2.x + 'px'; el.style.top = esc2.y + 'px';
  }

  // ---------- Eventos globais ----------
  const alvoTip = ev => ev.target.closest && ev.target.closest('[data-tip]');
  const alvoCarta = ev => ev.target.closest && ev.target.closest('[data-cref]');

  function iniciar(o) {
    opcoes = Object.assign(opcoes, o);
    // Mouse: só abre quando para por cerca de 1 segundo (e só se o modo for "hover")
    document.addEventListener('mousemove', ev => {
      if (toque || opcoes.modo() !== 'hover') return;
      const a = alvoTip(ev);
      clearTimeout(tDwell);
      if (!a || alvoCarta(ev)) { if (aberta && (!a || a !== aberta.origem)) fechar(); return; }   // cartas não abrem explicação ao passar o mouse
      if (aberta && aberta.origem === a) return;
      tDwell = setTimeout(() => abrir(a, false), DWELL);
    });
    document.addEventListener('mouseout', ev => { if (!ev.relatedTarget) { clearTimeout(tDwell); } });
    document.addEventListener('mousedown', () => { porTeclado = false; clearTimeout(tDwell); if (aberta) fechar(); }, true);
    document.addEventListener('scroll', () => fechar(), true);
    // Botão direito: carta ampliada ou explicação completa na hora
    document.addEventListener('contextmenu', ev => {
      const c = alvoCarta(ev);
      if (c && opcoes.aoCarta) { ev.preventDefault(); fechar(); opcoes.aoCarta(c); return; }
      const a = alvoTip(ev);
      if (a) { ev.preventDefault(); abrir(a, true); }
    });
    // Teclado: o foco abre a explicação; Esc fecha
    document.addEventListener('keydown', ev => {
      porTeclado = true;
      if (ev.key === 'Escape') fechar();
    }, true);
    document.addEventListener('focusin', ev => {
      if (!porTeclado || alvoCarta(ev)) return;
      const a = alvoTip(ev); if (a) abrir(a, false);
    });
    document.addEventListener('focusout', () => { setTimeout(() => { if (aberta && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-tip]'))) fechar(); }, 60); });
    // Celular: segurar o dedo abre (cartas ampliam; o resto abre uma folha na base da tela)
    let toqueAlvo = null;
    document.addEventListener('touchstart', ev => {
      const t = ev.target;
      if (t.closest && t.closest('.dica')) return;
      fechar();
      const c = alvoCarta(ev), a = alvoTip(ev);
      if (!c && !a) return;
      toqueAlvo = c || a; clearTimeout(tLongo);
      tLongo = setTimeout(() => { if (c && opcoes.aoCarta) opcoes.aoCarta(c); else abrir(a, true); segurando = true; }, 450);
    }, { passive: true });
    ['touchend', 'touchmove', 'touchcancel'].forEach(n => document.addEventListener(n, () => {
      clearTimeout(tLongo);
      if (segurando && n !== 'touchmove') { segurando = false; segurouEm = Date.now(); }   // o clique logo depois de soltar o dedo será ignorado
    }, { passive: true }));
    document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('[data-fechar-dica]')) fechar(); });
  }

  // A interface usa isto para ignorar o clique que vem logo depois de segurar o dedo
  const segurouRecente = () => Date.now() - segurouEm < 350;

  return { iniciar, fmt, esc, entrada, texto, registrarCarta, cartaDe, limparRegistro, fechar, segurouRecente, palavrasDe };
})();
