// ============================================================
// INTERFACE: BASE (estado, desenhos, janelas) (V4: visual de protótipo)
// A lógica do jogo fica em js/motor.js, js/ia.js e js/run.js.
// A interface é dividida em arquivos que compartilham o objeto UI:
//   ui-base.js (este)  estado, cartas, odds, janelas, glossário
//   ui-eventos.js      trilha da run e moldura das telas da run
//   ui-combate.js      combate (mesa em coluna, um toque por rodada) e animação da revelação
//   ui-run.js          menu, pré-combate, Recompensa, Oficina, Loja, sub-chefe, chefão, Mesa, espólio, fim da run
//   tutorial.js        tutorial do Treinador e dicas de primeira vez
//   ui-main.js         cliques, teclado e inicialização
// ============================================================
const UI = (function () {
  const app = document.getElementById('app');
  const sr = document.getElementById('sr');   // região lida por leitores de tela
  const esc = Tips.esc, fmt = Tips.fmt;

  // ---------- Estado da tela ----------
  const st = {
    tela: 'menu',      // menu | run | combate | omamori | recompensa | oficina | loja | recsub | mesa | espolio | fimrun
    run: null, estado: null,
    fase: 'escolha',   // no combate: escolha | animando | revelacao
    ultimo: null,      // resultado da última rodada
    selecionado: null, // uid da carta selecionada na mão
    modal: null, prompt: null,
    textoRun: '', erroMenu: '',
    vidaView: { jogador: 0, inimigo: 0 },   // vida mostrada (muda durante a animação)
    verUp: false, filtroNaipe: 'todos', filtroArq: 'todas',
    historico: [],     // resumo das últimas rodadas
    escolhas: { deck: 'basico', inimigo: 'rochedo', semente: '', modo: 'normal' }
  };

  // ---------- Preferências ----------
  const CHAVE_PREFS = 'jokenblitz_prefs';
  const reduzido = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const prefs = { vel: 'normal', fonte: 'normal', som: true, dicas: 'hover', hints: true, confirmar: false, vistas: {} };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(CHAVE_PREFS) || '{}')); } catch (e) { /* sem prefs salvas */ }
  function salvarPrefs() { try { localStorage.setItem(CHAVE_PREFS, JSON.stringify(prefs)); } catch (e) { /* tudo bem */ } }
  function aplicarPrefs() {
    document.body.dataset.vel = prefs.vel;
    document.documentElement.style.fontSize = { normal: '16px', grande: '19px', enorme: '22px' }[prefs.fonte] || '16px';
    Som.ligar(prefs.som);
  }
  // Fator de tempo das animações: 1 normal, 0,5 rápida, 0 sem animação
  const velFator = () => (reduzido || prefs.vel === 'nenhuma' ? 0 : prefs.vel === 'rapida' ? 0.5 : 1);

  const RARIDADE = NOME_RARIDADE;
  const semAcento = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const SIM = { '●': 'pedra', '■': 'papel', '▲': 'tesoura', '◆': 'nenhum' };

  // Colore os símbolos de naipe (●■▲◆) num texto já escapado
  function colorirSimbolos(html) {
    return html.replace(/[●■▲◆]/g, s => '<span class="simb s-' + SIM[s] + '" aria-hidden="false">' + s + '</span>');
  }
  const txtNaipe = n => NAIPES[n].nome + ' <span class="simb s-' + n + '">' + NAIPES[n].simbolo + '</span>';

  // ---------- Salvamento entre combates ----------
  function salvar() { if (st.run) Run.salvar(st.run, { tela: st.tela, textoRun: st.textoRun }); }

  // ---------- Desenhos: formas, cartas, odds, vida ----------
  // Forma geométrica do naipe (nunca só cor: sempre forma + nome)
  function forma(naipe, tam) {
    const n = NAIPES[naipe] || NAIPES.nenhum, cor = n.cor, f = n.forma, t = tam || 22;
    let d;
    if (f === 'circulo') d = `<circle cx="12" cy="12" r="10" fill="${cor}"/>`;
    else if (f === 'quadrado') d = `<rect x="3" y="3" width="18" height="18" rx="1" fill="${cor}"/>`;
    else if (f === 'triangulo') d = `<polygon points="12,2 22,22 2,22" fill="${cor}"/>`;
    else if (f === 'curinga') d = `<circle cx="12" cy="12" r="10" fill="${cor}"/><text x="12" y="17" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="sans-serif">?</text>`;
    else d = `<polygon points="12,1 23,12 12,23 1,12" fill="${cor}" stroke="#ffd400" stroke-width="2"/>`;
    return `<svg width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  }
  const tagHtml = tag => `<span class="tag t-${semAcento(tag)}">${tag}</span>`;

  // Números em negrito dentro de um texto já formatado (sem mexer nas marcas HTML)
  const negritoNumeros = html => html.replace(/(<[^>]+>)|(\+?\d+%?)/g, (m, tag, num) => (tag ? tag : '<span class="n">' + num + '</span>'));

  // Linhas de efeito: cada linha começa com uma etiqueta de QUANDO vale, e o texto não repete a condição
  function linhasHtml(c, comNumeros) {
    if (!c.texto) return '';
    return c.texto.split('\n').map(l => {
      const m = /^\[(\w+)\]\s*(.*)$/.exec(l);
      const corpo = t => (comNumeros ? negritoNumeros(fmt(t)) : fmt(t));
      return m ? `<span class="lin"><span class="q q-${m[1]}">${ETIQUETAS[m[1]]}</span> ${corpo(m[2])}</span>` : `<span class="lin">${corpo(l)}</span>`;
    }).join('');
  }

  // Ícones: rachadura (Frágil) e olho (Marcada)
  const ICONE_FRAGIL = '<svg class="ic-fragil" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M10 1 L7 8 L12 10 L8 19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  const ICONE_OLHO = '<svg class="ic-olho" viewBox="0 0 24 16" width="18" height="12" aria-hidden="true"><path d="M1 8 Q12 -3 23 8 Q12 19 1 8Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="8" r="3.2" fill="currentColor"/></svg>';

  const ICONE_SECRETA = '<svg class="ic-secreta" viewBox="0 0 24 16" width="14" height="10" aria-hidden="true"><path d="M1 8 Q12 -3 23 8 Q12 19 1 8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 14 L21 2" stroke="currentColor" stroke-width="2.4"/></svg>';
  const secretaCls = c => (st.estado && st.tela === 'combate' && st.estado.modo === 'aberta' && Motor.ehSecreta(st.estado, c) ? 'secreta' : '');

  // Símbolo branco do naipe (dentro da faixa da carta)
  function simboloSvg(n) {
    if (n === 'pedra') return '<circle cx="12" cy="12" r="10" fill="#fff"/>';
    if (n === 'papel') return '<rect x="3" y="3" width="18" height="18" rx="2" fill="#fff"/>';
    if (n === 'tesoura') return '<polygon points="12,2 22,22 2,22" fill="#fff"/>';
    if (n === 'curinga') return '<circle cx="12" cy="12" r="10" fill="#fff"/><text x="12" y="17" text-anchor="middle" font-size="14" font-weight="800" fill="#333" font-family="sans-serif">?</text>';
    return '<polygon points="12,1 23,12 12,23 1,12" fill="#fff"/>';
  }

  // Carta. c = carta (de combate ou montada de uma entrada de deck)
  // extras: acao, id, selecionada, desativada, naipe, tam, classe, cinza, semRef, aviso
  function cartaHtml(c, x) {
    x = x || {};
    const naipe = x.naipe || c.naipe;
    const el = x.acao ? 'button' : 'div';
    const ref = x.semRef ? '' : `data-cref="${Tips.registrarCarta(c)}"`;
    const alvo = x.acao ? `type="button" ${x.acao === 'selecionar' ? 'draggable="true"' : ''} data-acao="${x.acao}" data-uid="${x.id != null ? x.id : c.uid}" ${x.desativada ? 'disabled' : ''}` : (x.semRef ? '' : 'tabindex="0"');
    const curinga = c.def.naipe === 'curinga';
    const fragil = (c.def.fragil || c.fragilTemp) && c.mod !== 'blindada';
    const cls = ['carta', 'n-' + naipe, 'rar-' + c.def.raridade, x.selecionada ? 'selecionada' : '', secretaCls(c), x.cinza ? 'cinza' : '', c.up ? 'upg' : '', c.marcada ? 'marcada' : '', fragil ? 'fragil' : '', !c.texto ? 'van' : '', x.tam || '', x.classe || ''].filter(Boolean).join(' ');
    const resumo = `${c.nome}, ${NAIPES[naipe].nome}, ${RARIDADE[c.def.raridade]}. ${c.texto ? c.texto.replace(/[{}]/g, '').replace(/\[(\w+)\]/g, (m, k) => ETIQUETAS[k] + ':') : 'Sem efeito.'}${c.mod ? ' Selo ' + seloNome(c.mod) + '.' : ''}${c.marcada ? ' Marcada.' : ''}${fragil ? ' Frágil.' : ''}`;
    const nome = c.up ? esc(c.nome.replace(/\+$/, '')) + '<span class="pl">+</span>' : esc(c.nome);
    const proximo = curinga && c.idx !== undefined ? `<span class="c-prox">próximo: ${NAIPES[Motor.CICLO[(c.idx + 1) % 3]].nome} ${NAIPES[Motor.CICLO[(c.idx + 1) % 3]].simbolo}</span>` : '';
    const tracos = [];
    if (fragil) tracos.push(`<span class="trc trc-fragil">${ICONE_FRAGIL}Frágil</span>`);
    if (c.def.nuncaDescarta) tracos.push('<span class="trc">Nunca descartada</span>');
    if (c.def.soBlitz) tracos.push('<span class="trc">Só na Blitz</span>');
    if (c.mod) tracos.push(`<span class="trc trc-selo" title="${esc(seloTexto(c.mod))}">Selo ${esc(seloNome(c.mod))}</span>`);
    const secreta = !!(st.estado && st.tela === 'combate' && st.estado.modo === 'aberta' && Motor.ehSecreta(st.estado, c));
    if (secreta) tracos.push(`<span class="trc trc-secreta">${ICONE_SECRETA}Secreta</span>`);
    const ft = `<span class="c-ft"><i class="dot r-${c.def.raridade}"></i>${RARIDADE[c.def.raridade]}${c.arq ? `<span class="c-tg">${esc(c.arq)}</span>` : ''}</span>`;
    const tx = (c.texto || x.aviso) ? `<span class="c-tx">${linhasHtml(c, true)}${x.aviso ? `<span class="c-aviso">${x.aviso}</span>` : ''}</span>` : '<span class="c-tx"></span>';
    return `<${el} class="${cls}" ${ref} ${alvo} aria-label="${esc(resumo)}">
      <span class="c-faixa"><svg class="c-ix" viewBox="0 0 24 24" aria-hidden="true">${simboloSvg(naipe)}</svg><span class="c-nome">${nome}</span>${c.marcada ? `<span class="c-olho" title="Marcada">${ICONE_OLHO}</span>` : ''}<i class="dot r-${c.def.raridade}" title="${RARIDADE[c.def.raridade]}"></i></span>
      ${proximo}${tx}
      ${tracos.length ? `<span class="c-tracos">${tracos.join('')}</span>` : ''}${ft}
    </${el}>`;
  }

  // Carta a partir de uma entrada de deck. Com "Ver upgrades", mostra a versão +.
  function cartaEntrada(e, x) {
    const mostrarMais = st.verUp && !e.up && CARTAS_POR_ID[e.id].up;
    const c = Motor.cartaDeEntrada(mostrarMais ? Object.assign({}, e, { up: true }) : e);
    return cartaHtml(c, Object.assign({ id: e.eid, aviso: mostrarMais ? 'Versão + (prévia)' : '' }, x));
  }

  // ---------- Carta ampliada (botão direito, segurar o dedo ou a tecla I) ----------
  function ampliadaHtml(c) {
    const secoes = [];
    const usadas = [];
    (c.quando || []).forEach(k => { if (usadas.indexOf(k) < 0) usadas.push(k); });
    if (usadas.length) secoes.push('<h4>Quando o efeito vale</h4>' + usadas.map(k => { const t = TEXTOS.etiquetas[k]; return `<p><span class="q q-${k}">${t.nome}</span> ${esc(t.longo)}</p>`; }).join(''));
    else secoes.push('<h4>Efeito</h4><p>Esta carta é Comum: não tem efeito. Com upgrade ganha Vencer: +1 de dano.</p>');
    if (c.arq && TEXTOS.tags[c.arq]) { const x = TEXTOS.tags[c.arq]; secoes.push(`<h4>Arquétipo: ${tagHtml(c.arq)}</h4><p>${esc(x.curto)} ${esc(x.longo)}</p>`); }
    Tips.palavrasDe(c.texto).forEach(p => { if (['vencer', 'perder', 'empatar'].indexOf(p.chave) >= 0) return; secoes.push(`<h4>${esc(p.e.nome)}</h4><p>${esc(p.e.curto)} ${esc(p.e.longo || '')}</p>`); });
    if (c.def.fragil || c.fragilTemp) secoes.push(`<h4>${TEXTOS.palavras['frágil'].nome}</h4><p>${esc(TEXTOS.palavras['frágil'].curto)} ${esc(TEXTOS.palavras['frágil'].longo)}</p>`);
    if (c.def.nuncaDescarta) secoes.push('<h4>Nunca descartada</h4><p>Fica na mão até ser jogada e ocupa um lugar entre as 3 cartas da mão.</p>');
    if (c.mod) secoes.push(`<h4>Selo: ${seloNome(c.mod)}</h4><p>${esc(seloTexto(c.mod))}</p><p class="info"><i>Ex.:</i> ${esc(TEXTOS.modExemplos[c.mod])}</p>`);
    const n = TEXTOS.naipes[c.def.naipe];
    secoes.push(`<h4>Naipe: ${esc(n.nome)}</h4><p>${esc(n.curto)} ${esc(n.longo)}</p>`);
    const preco = CONFIG.run.preco[c.def.raridade];
    secoes.push(`<h4>Raridade: ${RARIDADE[c.def.raridade]}</h4><p>${c.def.raridade === 'comum' ? 'Só sai na Recompensa (a Loja vende Raras ou melhores).' : preco ? 'Preço na Loja: ' + preco + ' moeda(s).' : c.def.raridade === 'especial' ? 'Só sai na Mesa do Apostador.' : 'Só sai no espólio do chefão.'}</p>`);
    if (c.def.up && !c.up) {
      const mais = Motor.cartaDeEntrada({ id: c.def.id, up: true, mod: c.mod });
      secoes.push(`<h4>Versão +</h4><div class="vmais">${linhasHtml(mais)}</div>`);
    } else if (c.up) {
      const base = Motor.cartaDeEntrada({ id: c.def.id, up: false, mod: c.mod });
      secoes.push(`<h4>Versão base (antes do +)</h4><div class="vmais">${base.texto ? linhasHtml(base) : '<em>Sem efeito.</em>'}</div><p class="info">Esta carta já foi melhorada: o que mudou está em destaque.</p>`);
    }
    return `<div class="modal ampl" data-acao="fechar"><div role="dialog" aria-label="${esc(c.nome)}" class="largo-modal">
      <div class="ampl-linha"><div class="ampl-carta">${cartaHtml(c, { tam: 'enorme', semRef: true })}</div>
      <div class="ampl-texto">${secoes.join('')}</div></div>
      <p><button type="button" data-acao="fechar">Fechar</button> <span class="info">Esc ou botão direito fecham.</span></p></div></div>`;
  }

  // ---------- Odds, vida, Blitz, omamoris ----------
  // Odds: barra com a chance de cada naipe; embaixo, as cartas Marcadas (certeza) e o Curinga ("?")
  function oddsHtml(j, chave) {
    const aberta = Motor.modo() === 'aberta';
    const o = Motor.odds(j);
    const itens = BASE.map(n => [n, o[n]]).filter(i => i[1] > 0);
    const resumo = BASE.map(n => NAIPES[n].nome + ' ' + o[n] + '%').join(', ');
    const barra = itens.length ? itens.map(i => `<span class="seg seg-${i[0]}" style="flex:${i[1]}"></span>`).join('') : '<span class="seg seg-vazio" style="flex:1"></span>';
    const rot = BASE.filter(n => o[n] > 0).map(n => `<span class="oddlbl s-${n}">${NAIPES[n].simbolo} ${NAIPES[n].nome} ${o[n]}%</span>`).join('');
    const extra = [];
    if (o.curinga) extra.push(`<span class="odd-cur" title="Curinga">? Curinga ×${o.curinga}</span>`);
    const certezas = o.marcadas.map(m => `<span class="odd-cert s-${m.naipe}">${ICONE_OLHO} ${NAIPES[m.naipe].simbolo} ${esc(NAIPES[m.naipe].nome)} certa ${m.onde === 'mao' ? 'na mão' : 'no deck'}</span>`);
    return `<div class="odds ${aberta ? 'odds-peq' : ''}" data-tip="ui:${aberta ? 'oddsAberta' : chave}" tabindex="0" aria-label="Odds: ${resumo}${o.marcadas.length ? '. ' + o.marcadas.length + ' marcada(s)' : ''}">
      <div class="odds-barra">${barra}</div><div class="odds-rot">${rot || '<span class="info">sem cartas</span>'}${extra.join('')}</div>${certezas.length ? `<div class="odds-cert">${certezas.join('')}</div>` : ''}</div>`;
  }

  // Vida em quadradinhos; a animação troca as classes dos quadradinhos
  function pipsHtml(lado, v) {
    const j = st.estado[lado]; let h = '';
    for (let i = 0; i < j.vidaMax; i++) h += `<i class="pip ${i < v ? '' : 'e'}"></i>`;
    return h;
  }
  function vidaHtml(lado) {
    const j = st.estado[lado], v = st.vidaView[lado];
    return `<div class="linha vida" data-tip="ui:${lado === 'jogador' ? 'vida' : 'vidaInimigo'}" tabindex="0"><span class="lbl">Vida</span>
      <span class="pips" id="vida-pips-${lado}">${pipsHtml(lado, v)}</span><b class="num" id="vida-num-${lado}">${Math.max(0, v)}</b>
      <span class="flutuantes" id="flut-${lado}" aria-hidden="true"></span></div>`;
  }

  // Linha da Blitz: "Rodada 4 · Blitz em 2" e, embaixo, um segmento por rodada (o amarelo é onde a Blitz começa)
  function blitzHtml() {
    const estado = st.estado, ativa = Motor.blitzAtiva(estado), tot = estado.cfg.limiteRodadas;
    let segs = '';
    for (let i = 1; i <= tot; i++) segs += `<i class="bseg ${i < estado.rodada ? 'passou' : i === estado.rodada ? 'agora' : ''} ${i === estado.rodadaBlitz ? 'blitz' : ''}"></i>`;
    const falta = estado.rodadaBlitz - estado.rodada;
    const txt = ativa ? `Rodada ${estado.rodada} · <b class="amarelo">BLITZ</b>` : `Rodada ${estado.rodada} · <b class="amarelo">Blitz ${falta === 1 ? 'na próxima' : 'em ' + falta}</b>`;
    const dica = Tips.texto({ nome: 'Blitz', curto: ativa ? 'Todo empate causa ' + estado.cfg.danoEmpateBlitz + ' de dano a cada lado.' : 'Começa na rodada ' + estado.rodadaBlitz + '. Até lá, empate não causa dano.', longo: TEXTOS.palavras.blitz.longo, exemplo: TEXTOS.palavras.blitz.exemplo });
    return `<div class="blitz ${ativa ? 'ativa' : ''}" data-tip="${dica}" tabindex="0"><div class="blitz-txt">${txt}</div><div class="bsegs" aria-hidden="true">${segs}</div></div>`;
  }

  // Ícone de omamori (a forma varia pelo nome, a cor pela categoria)
  const COR_OMAMORI = { basico: '#c9b6a3', arquetipo: '#8fc3ef', neutro: '#4fd1a5', chefao: '#d9a21c' };
  function omamoriHtml(id, extra, tam) {
    const o = OMAMORIS_POR_ID[id], cor = COR_OMAMORI[o.categoria] || '#8aa0b8';
    let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 5;
    const formas = [`<circle cx="16" cy="16" r="14" fill="${cor}"/>`, `<polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="${cor}"/>`,
      `<polygon points="16,1 31,16 16,31 1,16" fill="${cor}"/>`, `<rect x="3" y="3" width="26" height="26" rx="6" fill="${cor}"/>`,
      `<polygon points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12" fill="${cor}"/>`];
    const ini = o.nome.replace(/[^A-Za-zÀ-ú ]/g, '').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    const dica = Tips.texto({ nome: o.nome, curto: textoOmamori(o), longo: { basico: 'Omamori básico', arquetipo: 'Omamori de arquétipo (' + o.arq + ')', neutro: 'Omamori neutro', chefao: 'Omamori de chefão' }[o.categoria], exemplo: '' });
    return `<span class="omamori ${extra || ''}" data-tip="${dica}" tabindex="0" data-rel="${id}" aria-label="Omamori ${esc(o.nome)}: ${esc(textoOmamori(o))}">
      <svg width="${tam || 30}" height="${tam || 30}" viewBox="0 0 32 32" aria-hidden="true">${formas[h]}<text x="16" y="21" text-anchor="middle" font-size="12" font-weight="800" fill="#0b0d12" font-family="sans-serif">${ini}</text></svg></span>`;
  }
  const omamorisHtml = ids => (ids && ids.length ? `<span class="omamoris" data-tip="ui:omamoris" aria-label="Omamoris">${ids.map(i => omamoriHtml(i)).join('')}</span>` : '');

  function contadoresHtml(j, lado, mostrarDeck) {
    const pilha = (n, rot, zona, chave, ativo) => `<button class="pilha" type="button" data-acao="zona" data-lado="${lado}" data-zona="${zona}" data-tip="ui:${chave}" ${ativo ? '' : 'disabled'}>
      <span class="pilha-n">${n}</span><span class="pilha-t">${rot}</span></button>`;
    return `<div class="contadores">${pilha(j.deck.length, 'Deck', 'deck', 'deck', mostrarDeck)}${pilha(j.cemiterio.length, 'Cemitério', 'cemiterio', 'cemiterio', true)}${pilha(j.cortadas.length, 'Cortadas', 'cortadas', 'cortadas', true)}</div>`;
  }

  // Barra da run: combate, ato, vida da run, moedas e seed
  function statusRun() {
    const r = st.run, tot = Run.totalEtapas(r), ato = Run.atoDe(r, r.etapa);
    return `<div class="statusrun"><span data-tip="ui:ato" tabindex="0">Combate <b>${r.etapa}</b> de ${tot} · Ato <b>${ato}</b></span>
      <span data-tip="ui:vidaRun" tabindex="0">Vida da run: <b>♥ ${Math.max(0, r.vida)} / ${r.vidaMax}</b></span>
      <span data-tip="ui:moedas" tabindex="0">Moedas: <b class="moeda-n">● ${r.moedas}</b></span>
      <span data-tip="ui:seed" tabindex="0">Seed: <b>${r.semente}</b></span>${r.modo === 'aberta' ? '<span class="modo-tag" data-tip="regra:maoAberta" tabindex="0">Mão aberta (teste)</span>' : ''}${omamorisHtml(r.omamoris)}</div>`;
  }

  // Barra no topo de todas as telas: logo e atalhos
  function barraTopo() {
    const logo = `<span class="logo" aria-label="Jokenblitz"><svg width="46" height="18" viewBox="0 0 46 18" aria-hidden="true"><circle cx="8" cy="9" r="7" fill="${NAIPES.pedra.cor}"/><rect x="18" y="2" width="14" height="14" rx="1" fill="${NAIPES.papel.cor}"/><polygon points="39,2 46,16 32,16" transform="translate(-1 0)" fill="${NAIPES.tesoura.cor}"/></svg><b>JOKENBLITZ</b></span>`;
    const emCombate = st.tela === 'combate';
    return `<header class="topo-barra">${logo}<span class="topo-acoes">
      ${emCombate ? '<button type="button" class="mini" data-acao="log">Log</button>' : ''}
      ${st.run && st.tela !== 'menu' && st.tela !== 'combate' ? '<button type="button" class="mini" data-acao="verdeck" data-tip="ui:verDeck">Deck</button>' : ''}
      <button type="button" class="mini" data-acao="som" data-tip="ui:som" aria-pressed="${prefs.som}">Som: ${prefs.som ? 'ligado' : 'mudo'}</button>
      <button type="button" class="mini" data-acao="gloss" data-tip="ui:glossario">Glossário</button>
      ${st.tela !== 'menu' ? '<button type="button" class="mini" data-acao="menu">Menu</button>' : ''}</span></header>`;
  }

  // ---------- Janelas (modais) ----------
  function modalHtml() {
    const m = st.modal;
    if (m.tipo === 'gloss') return glossarioModal();
    if (m.tipo === 'deck') return deckModal();
    if (m.tipo === 'ampliada') return ampliadaHtml(m.carta);
    if (m.tipo === 'log') return `<div class="modal" data-acao="fechar"><div role="dialog" aria-label="Log do combate" class="largo-modal"><h3>Log do combate</h3><pre class="log-pre">${colorirSimbolos(esc(st.estado.log.join('\n')))}</pre><button type="button" data-acao="fechar">Fechar</button></div></div>`;
    return `<div class="modal" data-acao="fechar"><div role="dialog" aria-label="${esc(m.titulo)}">
      <h3>${esc(m.titulo)}</h3>
      <div class="grade">${m.gerar() || '<em>Vazio</em>'}</div>
      <button type="button" data-acao="fechar">Fechar</button></div></div>`;
  }

  // Glossário: etiquetas, palavras-chave, naipes, arquétipos, selos, omamoris e regras
  function entradasGlossario() {
    const lista = [];
    const add = (cat, obj) => Object.keys(obj).forEach(k => lista.push({ cat, nome: obj[k].nome, curto: obj[k].curto, longo: obj[k].longo || '', exemplo: obj[k].exemplo || '' }));
    add('Etiquetas de condição', TEXTOS.etiquetas); add('Palavras-chave', TEXTOS.palavras); add('Naipes', TEXTOS.naipes);
    add('Arquétipos', TEXTOS.tags);
    Object.keys(MODIFICADORES).forEach(k => lista.push({ cat: 'Selos', nome: seloNome(k), curto: seloTexto(k), longo: '', exemplo: TEXTOS.modExemplos[k] }));
    OMAMORIS.forEach(o => lista.push({ cat: 'Omamoris', nome: o.nome, curto: textoOmamori(o), longo: { basico: 'Básico', arquetipo: 'De arquétipo (' + o.arq + ')', neutro: 'Neutro', chefao: 'De chefão' }[o.categoria], exemplo: '' }));
    add('Regras', TEXTOS.regras);
    return lista;
  }
  function glossarioLista(busca) {
    const q = semAcento(busca || '');
    const itens = entradasGlossario().filter(e => !q || semAcento(e.nome + ' ' + e.curto + ' ' + e.longo + ' ' + e.exemplo).indexOf(q) >= 0);
    if (!itens.length) return '<p class="info">Nada encontrado.</p>';
    let cat = '', h = '';
    itens.forEach(e => {
      if (e.cat !== cat) { cat = e.cat; h += `<h4>${cat}</h4>`; }
      h += `<div class="gl-item"><b>${esc(e.nome)}</b>: ${fmt(e.curto)}${e.longo ? ' ' + fmt(e.longo) : ''}${e.exemplo ? `<div class="info"><i>Exemplo:</i> ${fmt(e.exemplo)}</div>` : ''}</div>`;
    });
    return h;
  }
  function glossarioModal() {
    return `<div class="modal" data-acao="fechar"><div role="dialog" aria-label="Glossário" class="largo-modal"><h3>Glossário</h3>
      <label for="busca-gloss" class="info">Buscar</label>
      <input id="busca-gloss" type="search" placeholder="Ex.: blitz, marcada, frágil" value="${esc(st.buscaGloss || '')}">
      <div id="gloss-lista" class="gl-lista">${glossarioLista(st.buscaGloss)}</div>
      <p><button type="button" data-acao="fechar">Fechar</button></p></div></div>`;
  }

  // Deck da run, com filtros por naipe e arquétipo, os arquétipos ativos e os omamoris
  function deckModal() {
    const run = st.run, ativos = Run.arquetiposAtivos(run);
    const btn = (acao, valor, atual, rot) => `<button type="button" class="mini ${atual === valor ? 'sel' : ''}" data-acao="${acao}" data-valor="${valor}">${rot}</button>`;
    const filtroN = ['todos', 'pedra', 'papel', 'tesoura', 'outros'].map(n => btn('filtro-naipe', n, st.filtroNaipe, n === 'todos' ? 'Todos os naipes' : n === 'outros' ? 'Especiais' : NAIPES[n].nome + ' ' + NAIPES[n].simbolo)).join('');
    const filtroT = ['todas'].concat(ARQUETIPOS).map(t => btn('filtro-arq', t, st.filtroArq, t === 'todas' ? 'Todos os arquétipos' : t)).join('');
    const cartas = run.deck.filter(e => {
      const d = CARTAS_POR_ID[e.id];
      const okN = st.filtroNaipe === 'todos' || d.naipe === st.filtroNaipe || (st.filtroNaipe === 'outros' && BASE.indexOf(d.naipe) < 0);
      return okN && (st.filtroArq === 'todas' || d.arq === st.filtroArq);
    }).map(e => cartaEntrada(e, { tam: 'pequena' })).join('');
    const arq = ativos.length
      ? ativos.map(a => `<span class="arq" data-tip="regra:arquetipoAtivo" tabindex="0">${a.chave} (${a.qtd})</span>`).join('')
      : '<span class="info">Nenhum ainda: junte 3 cartas do mesmo arquétipo.</span>';
    return `<div class="modal" data-acao="fechar"><div role="dialog" aria-label="Seu deck" class="largo-modal">
      <h3>Seu deck (${run.deck.length} cartas)</h3>
      <p><b data-tip="regra:arquetipoAtivo" tabindex="0">Arquétipos ativos:</b> ${arq}</p>
      <p><b>Omamoris (${run.omamoris.length}/${run.cfg.run.limiteOmamoris}):</b> ${run.omamoris.length ? omamorisHtml(run.omamoris) : '<span class="info">nenhum</span>'}</p>
      <p class="filtros">${filtroN}</p><p class="filtros">${filtroT}</p>
      <p><button type="button" class="mini ${st.verUp ? 'sel' : ''}" data-acao="verup" aria-pressed="${st.verUp}">Ver upgrades: ${st.verUp ? 'sim' : 'não'}</button></p>
      <div class="grade">${cartas || '<em>Nenhuma carta com esse filtro.</em>'}</div>
      <button type="button" data-acao="fechar">Fechar</button></div></div>`;
  }

  // ---------- Moldura e desenho ----------
  // Ao desenhar uma tela, as cartas se registram ao serem montadas, então o registro é limpo antes.
  function moldura(conteudo) {
    document.body.classList.toggle('blitz-borda', !!(st.tela === 'combate' && st.estado && !st.estado.fim && Motor.blitzAtiva(st.estado)));
    app.innerHTML = barraTopo() + conteudo + (st.modal ? modalHtml() : '') + (st.prompt ? UI.promptHtml() : '');
    UI.aposDesenhar();
  }
  const telas = {};   // cada arquivo registra suas telas aqui
  function desenhar() {
    Tips.fechar(); Tips.limparRegistro();
    if (telas[st.tela]) telas[st.tela]();
  }

  // Lê um texto de uma carta ao ser ampliada
  function ampliarCarta(ref) {
    const c = Tips.cartaDe(ref);
    if (!c) return;
    st.modal = { tipo: 'ampliada', carta: c }; desenhar();
  }

  return { app, sr, st, prefs, reduzido, esc, fmt, salvarPrefs, aplicarPrefs, velFator, salvar, RARIDADE, semAcento, colorirSimbolos, txtNaipe,
    forma, tagHtml, linhasHtml, cartaHtml, cartaEntrada, ampliadaHtml, oddsHtml, vidaHtml, pipsHtml, blitzHtml, omamoriHtml, omamorisHtml, contadoresHtml,
    statusRun, barraTopo, modalHtml, glossarioLista, deckModal, moldura, telas, desenhar, ampliarCarta, ICONE_OLHO, ICONE_FRAGIL,
    promptHtml: () => '', aposDesenhar: () => {} };
})();
