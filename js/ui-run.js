// ============================================================
// INTERFACE: MENU E RUN (V4.1)
// Menu (com o modo Normal ou Mão aberta), pré-combate (sub-chefe e chefão), omamori inicial, Recompensa de cartas,
// Oficina, Loja, recompensa do sub-chefe, Mesa do Apostador, espólio do chefão e fim da run.
// A lógica de cada passo está em js/run.js.
// ============================================================
(function () {
  const { st, prefs, esc, cartaHtml, cartaEntrada, forma, moldura, omamoriHtml, omamorisHtml, salvar } = UI;
  const run = () => st.run;
  const lerSemente = () => { const v = String(st.escolhas.semente).trim(); return v === '' || isNaN(Number(v)) ? undefined : Math.floor(Number(v)); };
  const grade = (html, cls) => `<div class="grade ${cls || ''}">${html}</div>`;
  const DICA_PASSO = { loja: 'loja', espolio: 'espolio', omamori: 'omamori', mesa: 'mesa', recsub: 'subchefe', recompensa: 'recompensa', oficina: 'oficina' };

  // ---------- Menu ----------
  function telaMenu() {
    const salvo = Run.carregar();
    const E = st.escolhas;
    if (Run.descartarSaveAntigo()) st.avisoSave = true;
    const opDecks = Object.keys(DECKS_JOGADOR).map(k => `<option value="${k}" ${k === E.deck ? 'selected' : ''}>${DECKS_JOGADOR[k].nome}</option>`).join('');
    const opInim = Object.keys(INIMIGOS).map(k => `<option value="${k}" ${k === E.inimigo ? 'selected' : ''}>${INIMIGOS[k].nome}: ${INIMIGOS[k].tendencia}</option>`).join('');
    const sel = (id, val, ops) => `<select id="${id}">${ops.map(o => `<option value="${o[0]}" ${o[0] === val ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
    const ic = d => `<svg class="mh-ic" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">${d}</svg>`;
    let painel = '';
    if (st.painel === 'opcoes') {
      painel = `<div class="mh-painel"><h3>Opções</h3>
        <label for="vel">Velocidade</label>${sel('vel', prefs.vel === 'nenhuma' ? 'rapida' : prefs.vel, [['normal', 'Normal'], ['rapida', 'Rápida']])}
        <label><input type="checkbox" id="confirmar" ${prefs.confirmar ? 'checked' : ''}> Confirmar jogada (o primeiro toque seleciona, o segundo joga)</label>
        <label for="fonte">Tamanho do texto</label>${sel('fonte', prefs.fonte, [['normal', 'Normal'], ['grande', 'Grande'], ['enorme', 'Maior']])}
        <label for="dicas">Explicações dos itens da tela</label>${sel('dicas', prefs.dicas, [['hover', 'Ao parar o mouse em cima (1 segundo)'], ['clique', 'Só com o botão direito']])}
        <p class="info">Em qualquer carta, clique com o botão direito (ou segure o dedo) para ampliar e ler tudo sobre ela.</p>
        <label><input type="checkbox" id="som" ${prefs.som ? 'checked' : ''}> Sons ligados</label>
        <label><input type="checkbox" id="hints" ${prefs.hints ? 'checked' : ''}> Dicas de primeira vez (<button type="button" class="mini" data-acao="rever-dicas">rever todas</button>)</label>
        <label for="semente">Seed da próxima run (opcional: mesma seed = mesmos inimigos e Lojas)</label>
        <input id="semente" type="text" inputmode="numeric" placeholder="aleatória" value="${esc(E.semente)}">
        <h3>Combate rápido</h3>
        <label for="deck">Seu deck</label><select id="deck">${opDecks}</select>
        <label for="inimigo">Inimigo</label><select id="inimigo">${opInim}</select>
        <p><button type="button" data-acao="rapido">Começar combate rápido</button></p></div>`;
    }
    moldura(`<div class="menu-home">
      <div class="mh-esq">
        <h1 class="logo-grande" aria-label="Jokenblitz">JOKEN<br>BLITZ</h1>
        <p class="mh-sub">Pedra, papel e tesoura com deck, odds e Blitz.</p>
        ${st.erroMenu ? `<p class="erro" role="alert">${esc(st.erroMenu)}</p>` : ''}
        ${st.avisoSave ? '<p class="aviso-save" role="status">Sua run salva de uma versão anterior não funciona na V4.1 e foi descartada. Comece uma nova run!</p>' : ''}
        <div class="mh-modo" role="group" aria-label="Modo de jogo"><span class="lbl">Modo</span>
          <button type="button" class="mini ${E.modo === 'normal' ? 'sel' : ''}" data-acao="modo" data-valor="normal" aria-pressed="${E.modo === 'normal'}">Normal</button>
          <button type="button" class="mini ${E.modo === 'aberta' ? 'sel' : ''}" data-acao="modo" data-valor="aberta" aria-pressed="${E.modo === 'aberta'}" data-tip="regra:maoAberta">Mão aberta (teste)</button></div>
        <div class="mh-botoes">
          ${salvo ? `<button type="button" class="mh-b amarelo-b" data-acao="continuar">${ic('<path d="M5 3l12 7-12 7z" fill="currentColor"/>')}<span><b>Continuar run</b><small>Combate ${salvo.run.etapa} · ${salvo.run.vitorias} vitória(s) · vida ${Math.max(0, salvo.run.vida)}/${salvo.run.vidaMax}</small></span></button>` : ''}
          <button type="button" class="mh-b" data-acao="novarun">${ic('<path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="2.4"/>')}<span><b>Nova run</b></span></button>
          <div class="mh-duplo"><button type="button" class="mh-b" data-acao="tut-iniciar"><span><b>Como jogar</b></span></button><button type="button" class="mh-b" data-acao="painel" data-valor="opcoes"><span><b>Opções</b></span></button></div>
        </div>
        ${painel}
        <p class="rodape">Versão 4.1 · nenhuma imagem gerada por IA: tudo aqui é forma e cor</p>
      </div>
      <div class="mh-arte" aria-hidden="true"><i class="f-pedra"></i><i class="f-papel"></i><i class="f-tesoura"></i></div>
    </div>${st.convite ? Tutorial.conviteHtml() : ''}`);
  }
  UI.telas.menu = telaMenu;

  // ---------- Começar e continuar ----------
  function rapido() {
    st.run = null; st.erroMenu = ''; st.tutorial = null;
    const E = st.escolhas, def = INIMIGOS[E.inimigo], tmp = Run.criar({ cfg: CONFIG, semente: lerSemente(), modo: E.modo });
    tmp.etapa = 4;
    UI.combate.abrirCombate(Motor.criarCombate({ cfg: CONFIG, deckJogador: DECKS_JOGADOR[E.deck].cartas, modo: E.modo,
      inimigo: { nome: def.nome, deck: Run.montarDeckInimigo(tmp, def, 4, 'comum'), ia: def.ia, vida: CONFIG.vida, regra: '', estilo: def.estilo, arq: def.arq, tendencia: def.tendencia, tipo: 'comum', id: def.id }, semente: lerSemente() }));
  }
  function novaRun() {
    st.erroMenu = ''; st.tutorial = null;
    st.run = Run.criar({ cfg: CONFIG, semente: lerSemente(), modo: st.escolhas.modo }); Motor.definirModo(st.run.modo);
    st.textoRun = ''; st.modal = null; st.sub = null; st.tela = 'run'; salvar(); UI.desenhar();
  }
  // Volta para a tela certa da run (o passo atual da fila, ou o pré-combate)
  function irParaPasso() {
    const p = Run.passo(st.run);
    st.sub = null;
    st.tela = p || 'run';
    UI.desenhar();
    if (p) Dicas.mostrar(DICA_PASSO[p]);
  }
  function continuar() {
    const d = Run.carregar();
    if (!d) { st.erroMenu = 'Não há run salva.'; UI.desenhar(); return; }
    st.run = d.run; st.textoRun = (d.ui && d.ui.textoRun) || ''; Motor.definirModo(st.run.modo);
    st.modal = null; st.tutorial = null; irParaPasso();
  }
  function concluirPasso() {
    const prox = Run.concluirPasso(st.run);
    st.sub = null; st.textoRun = '';
    st.tela = prox === 'combate' ? 'run' : prox;
    salvar(); UI.desenhar();
    if (prox !== 'combate') Dicas.mostrar(DICA_PASSO[prox]);
  }
  function seguirRun() {
    st.modal = null;
    if (st.run.fim) { st.tela = 'fimrun'; UI.desenhar(); return; }
    irParaPasso(); salvar();
  }
  function comecarCombate() {
    const e = Run.iniciarCombate(st.run);
    UI.combate.abrirCombate(e);
  }

  // ---------- Pré-combate: o próximo combate, escolha do sub-chefe e antes do chefão ----------
  function subCartaHtml(id, escolhido) {
    const s = SUBCHEFES[id], aberta = run().modo === 'aberta';
    return `<div class="sub-op ${escolhido ? 'sel' : ''}"><div class="esp-tit">Sub-chefe${s.arq ? ' · ' + esc(s.arq) : ''}</div><h3>${esc(s.nome)}</h3>
      <p class="sub-regra"><b>Regra:</b> ${esc((aberta && s.regraAberta) || s.regra)}</p><p class="sub-rec"><b>Recompensa:</b> ${esc(s.recompensa)}</p><p class="info">${id === 'ganancioso' ? '8 de vida.' : '6 de vida.'}</p>
      <button type="button" class="${escolhido ? 'principal' : ''}" data-acao="sub-escolher" data-id="${id}" aria-pressed="${escolhido ? 'true' : 'false'}">${escolhido ? 'Escolhido' : 'Enfrentar ' + esc(s.nome)}</button></div>`;
  }
  function telaRun() {
    const r = run(), n = r.etapa, tipo = Run.tipoDaEtapa(r, n), aberta = r.modo === 'aberta';
    let corpo = '', podeIniciar = true;
    if (tipo === 'sub') {
      const ofertas = Run.subOfertas(r);
      corpo = `<h2>Sub-chefe: escolha 1 entre 2</h2><p class="info">Perder ou empatar contra o sub-chefe não dá a recompensa, mas você segue em frente.</p>
        <div class="sub-grade" data-tip="ui:subchefe">${ofertas.map(id => subCartaHtml(id, r.subEscolhido === id)).join('')}</div>`;
      podeIniciar = !!r.subEscolhido;
      Dicas.mostrar('subchefe');
    } else {
      const inim = Run.inimigoDaEtapa(r, n);
      let extra = '';
      if (tipo === 'chefao') {
        const ch = inim, trofeu = CARTAS_POR_ID[ch.trofeu], om = OMAMORIS_POR_ID[ch.omamori], poderTxt = (aberta && ch.poder.textoAberta) || ch.poder.texto;
        extra = `<div class="chefe-info"><p><span class="chefe">CHEFÃO · ato ${Run.atoDe(r, n)}</span> <span class="tag">${esc(ch.arq)}</span> Antes da luta: o poder e o estilo dele, e o que você pode levar se vencer.</p>
          <p class="chefe-regra" data-tip="ui:poderChefao" tabindex="0"><b>Poder · ${esc(ch.poder.nome)}:</b> ${esc(poderTxt)}${ch.pista ? ` <i>“${esc(ch.pista)}”</i>` : ''}</p>
          <p class="chefe-estilo"><b>Estilo:</b> ${esc(ch.estilo)}</p>
          <p class="info">${r.cfg.run.vidaChefao[Run.atoDe(r, n)]} de vida. ${r.revanche ? 'Revanche: perder ou empatar faz você lutar de novo.' : 'Perder ou empatar faz você lutar de novo.'}</p>
          <div class="chefe-linha"><div><div class="rotulo">Carta Troféu</div>${cartaHtml(Motor.cartaDeEntrada({ id: trofeu.id }, 9000), { tam: 'media' })}</div>
          <div><div class="rotulo">Omamori do chefão (garantido)</div><div class="relic-grande">${omamoriHtml(om.id, 'grande', 60)}<span><b>${esc(om.nome)}</b><br>${esc(textoOmamori(om))}</span></div></div></div></div>`;
        Dicas.mostrar('chefao');
      }
      corpo = `<h2>Próximo combate</h2>
        <p class="proximo"><b>${esc(inim.nome)}</b>${tipo === 'chefao' ? ' <span class="chefe">CHEFÃO</span>' : ''}<br><i>${esc(inim.tendencia || '')}</i>${tipo !== 'chefao' && inim.arq ? ` <span class="tag">${esc(inim.arq)}</span>` : ''}${tipo !== 'chefao' && inim.estilo ? `<br><span class="info" data-tip="regra:regraInimigo" tabindex="0">${esc(inim.estilo)}</span>` : ''}</p>
        ${extra}
        ${n === 1 ? '<p class="info">Luta de aquecimento: só cartas Comuns (sem efeito), 3 de vida e Blitz na rodada ' + r.cfg.run.rodadaBlitzPrimeiraLuta + '. Depois dela você escolhe o seu primeiro omamori.</p>' : ''}`;
    }
    moldura(`${UI.statusRun()}${UI.trilhaHtml()}<div class="menu largo prox-combate">
        ${st.textoRun ? `<p class="info">Último combate: ${esc(st.textoRun)}</p>` : ''}
        ${corpo}
        <p><button type="button" class="principal grande" data-acao="combater" ${podeIniciar ? '' : 'disabled'}>${podeIniciar ? 'Começar combate' : 'Escolha um sub-chefe'}</button>
        <button type="button" data-acao="verdeck" data-tip="ui:verDeck">Ver meu deck (${r.deck.length})</button>
        <button type="button" data-acao="menu">Abandonar run</button></p>
      </div>`);
  }
  UI.telas.run = telaRun;

  // ---------- Peças comuns das telas de escolha ----------
  const RARIDADE_OM = o => ({ basico: 'Básico', arquetipo: 'De arquétipo: ' + o.arq, neutro: 'Neutro', chefao: 'De chefão' }[o.categoria]);
  // Uma opção grande (espólio e omamori): título pequeno, arte, nome, etiqueta, texto e botão
  function opcaoGrande(titulo, arte, nome, etiqueta, texto, botao, destaque) {
    return `<div class="esp-op ${destaque ? 'destaque' : ''}"><div class="esp-tit">${titulo}</div><div class="esp-arte">${arte}</div>
      <h3>${nome}</h3>${etiqueta ? `<span class="pilula">${etiqueta}</span>` : ''}<p>${texto}</p>${botao}</div>`;
  }
  const opOmamori = (o, titulo, acao, atrs, rotuloBotao, destaque) => opcaoGrande(titulo, UI.omamoriGrande(o.id), esc(o.nome), RARIDADE_OM(o), esc(textoOmamori(o)),
    `<button type="button" class="principal" data-acao="${acao}" ${atrs}>${rotuloBotao}</button>`, destaque);

  // ---------- Omamori inicial: depois do primeiro combate ----------
  function telaOmamori() {
    const r = run(), ofs = Run.ofertasOmamoriInicial(r);
    const caixas = ofs.map(o => opOmamori(o, 'Omamori básico', 'omamori-inicial', `data-id="${o.id}"`, 'Levar o omamori')).join('');
    moldura(UI.statusRun() + UI.eventoHtml('omamori', 'Seu primeiro omamori', 'Escolha <b>1</b> entre 3 omamoris básicos: ele vale pela run inteira.', `<div class="esp-grade">${caixas}</div>`));
  }
  UI.telas.omamori = telaOmamori;

  // ---------- Recompensa de cartas (depois de todo combate) ----------
  function telaRecompensa() {
    const r = run(), rec = r.pendente;
    if (!rec || rec.tipo !== 'cartas') { moldura(UI.statusRun() + UI.eventoHtml('recompensa', 'Recompensa', '', '<p class="info">Nada a receber.</p>', null, '<button type="button" class="principal" data-acao="passo-ok">Continuar</button>')); return; }
    const feita = Run.recompensaCartasFeita(r), M = r.cfg.run.moedas;
    const itens = rec.cartas.map((it, i) => {
      const c = Motor.cartaDeEntrada({ id: it.id, eid: 9500 + i }, 9500 + i), tomada = rec.escolhida === it.id;
      return `<div class="rec-item ${rec.escolhida && !tomada ? 'apagada' : ''}">${cartaHtml(c, { tam: 'media' })}
        <button type="button" class="principal" data-acao="rec-carta" data-i="${i}" ${feita ? 'disabled' : ''}>${tomada ? 'Levada' : 'Levar a carta'}</button></div>`;
    }).join('');
    const acoes = `<button type="button" data-acao="rec-pular" data-tip="ui:recompensaCartas" ${feita ? 'disabled' : ''}>${rec.pulou ? 'Pulada (+' + M.pularRecompensa + ' moedas)' : 'Pular · +' + M.pularRecompensa + ' moedas'}</button><button type="button" class="principal" data-acao="passo-ok" ${feita ? '' : 'disabled'}>Continuar</button>`;
    moldura(UI.statusRun() + UI.eventoHtml('recompensa', 'Recompensa', 'Escolha <b>1</b> das 3 cartas, uma de cada naipe, ou pule e ganhe ' + M.pularRecompensa + ' moedas.', `<div class="rec-grade">${itens}</div>`, 'ui:recompensaCartas', acoes));
  }
  UI.telas.recompensa = telaRecompensa;

  // ---------- Oficina (depois dos combates 2 e 4 de cada ato) ----------
  // Cada carta do deck mostra a versão atual e a "+" lado a lado
  function telaOficina() {
    const r = run(), of = r.pendente;
    if (!of || of.tipo !== 'oficina') { moldura(UI.statusRun() + UI.eventoHtml('oficina', 'Oficina', '', '<p class="info">Nada a fazer.</p>', null, '<button type="button" class="principal" data-acao="passo-ok">Continuar</button>')); return; }
    const feita = of.feito, M = r.cfg.run.moedas;
    const itens = r.deck.map(e => {
      const ja = e.up || !CARTAS_POR_ID[e.id].up, atual = Motor.cartaDeEntrada(Object.assign({}, e), e.eid), mais = Motor.cartaDeEntrada(Object.assign({}, e, { up: true }), e.eid + 7000);
      const tomada = of.eid === e.eid;
      return `<div class="ofi-item ${ja ? 'ja' : ''} ${tomada ? 'tomada' : ''}"><div class="par-up">${cartaHtml(atual, { tam: 'media' })}<span class="seta" aria-hidden="true">→</span>${ja ? `<div class="ja-melhorada">${e.up ? 'já melhorada' : 'sem upgrade'}</div>` : cartaHtml(mais, { tam: 'media', semRef: false, aviso: 'Versão +' })}</div>
        <button type="button" class="principal" data-acao="ofi-up" data-uid="${e.eid}" ${ja || feita ? 'disabled' : ''}>${tomada ? 'Melhorada' : ja ? 'Já melhorada' : 'Melhorar de graça'}</button></div>`;
    }).join('');
    const acoes = `<button type="button" data-acao="ofi-pular" ${feita ? 'disabled' : ''}>${of.pulou ? 'Pulada (+' + M.pularOficina + ' moeda)' : 'Pular · +' + M.pularOficina + ' moeda'}</button><button type="button" class="principal" data-acao="passo-ok" ${feita ? '' : 'disabled'}>Continuar</button>`;
    moldura(UI.statusRun() + UI.eventoHtml('oficina', 'Oficina', 'Escolha <b>1</b> carta do deck para receber o upgrade de graça, ou pule e ganhe ' + M.pularOficina + ' moeda.', `<div class="ofi-grade">${itens}</div>`, 'ui:oficina', acoes));
  }
  UI.telas.oficina = telaOficina;

  // ---------- Loja ----------
  // 3 cartas (Raras ou melhores, só a versão atual), 1 omamori, 1 selo em destaque, upgrade, remoção e renovar
  function telaLoja() {
    const r = run(), L = Run.loja(r);
    if (!st.sub || st.sub.tipo !== 'loja') st.sub = { tipo: 'loja', modo: null, msg: '' };
    const S = st.sub, P = t => Run.precoServico(r, t);
    const cartas = L.cartas.map((it, i) => {
      const def = CARTAS_POR_ID[it.id], pode = !it.comprada && r.moedas >= it.preco && !(def.raridade === 'prismatica' && Run.temPrismatica(r));
      const atual = Motor.cartaDeEntrada({ id: it.id, eid: 8000 + i }, 8000 + i);
      return `<div class="loja-item ${it.comprada ? 'comprada' : ''}">${cartaHtml(atual, { tam: 'media' })}
        <button type="button" class="principal" data-acao="loja-comprar" data-i="${i}" data-tip="ui:preco" ${pode ? '' : 'disabled'}>${it.comprada ? 'Comprada' : 'Comprar · ● ' + it.preco}</button></div>`;
    }).join('');
    const om = L.omamori ? OMAMORIS_POR_ID[L.omamori.id] : null;
    const omamoriBox = om ? `<div class="loja-item loja-omamori ${L.omamori.comprado ? 'comprada' : ''}"><div class="esp-tit">Omamori à venda</div><div class="relic-grande">${omamoriHtml(om.id, 'grande', 60)}<span><b>${esc(om.nome)}</b><br>${esc(textoOmamori(om))}<br><span class="pilula">${esc(RARIDADE_OM(om))}</span></span></div>
        <button type="button" class="principal" data-acao="loja-omamori" ${!L.omamori.comprado && r.moedas >= L.omamori.preco && !Run.omamorisCheios(r) ? '' : 'disabled'}>${L.omamori.comprado ? 'Comprado' : 'Comprar · ● ' + L.omamori.preco}</button></div>` : '';
    const mod = L.selo.mod;
    const algumUp = r.deck.some(e => Run.podeUpgrade(r, e.eid)), podeRem = Run.podeRemover(r);
    const srv = (modo, titulo, texto, preco, ok) => `<div class="servico ${S.modo === modo ? 'ativo' : ''}"><div>${titulo}<div class="info">${texto}</div></div>
      <button type="button" data-acao="loja-modo" data-modo="${modo}" ${ok || S.modo === modo ? '' : 'disabled'}>${S.modo === modo ? 'Cancelar' : 'Escolher · ● ' + preco}</button></div>`;
    let modoHtml = '';
    if (S.modo) {
      const instr = { upgrade: 'Escolha a carta que recebe o upgrade (versão +).', remover: 'Escolha a carta que sai do deck.', selo: `Escolha a carta que recebe o selo ${esc(seloNome(mod))}. Se ela já tem um selo, ele será trocado.` }[S.modo];
      const cards = r.deck.map(e => {
        const ok = S.modo === 'upgrade' ? Run.podeUpgrade(r, e.eid) : S.modo === 'remover' ? podeRem : !L.selo.comprado;
        const aviso = S.modo === 'selo' && e.mod ? 'Troca o selo ' + seloNome(e.mod) : S.modo === 'upgrade' && e.up ? 'Já melhorada' : '';
        return cartaEntrada(e, { acao: 'loja-sel', cinza: !ok, desativada: !ok, tam: 'pequena', aviso });
      }).join('');
      modoHtml = `<div class="painel loja-modo"><p><b>${instr}</b></p>${grade(cards, 'compacta')}</div>`;
    }
    const corpo = `<div class="loja-cartas">${cartas}${omamoriBox}</div>
      <div class="painel loja-servicos"><div class="lbl">Serviços</div>
        ${srv('upgrade', '<b>Upgrade</b>', 'Melhora uma carta (uma vez por carta).', P('upgrade'), algumUp && r.moedas >= P('upgrade'))}
        ${srv('remover', '<b>Remover carta</b>', 'O deck nunca fica com menos de ' + r.cfg.deckMinimo + '.', P('remover'), podeRem && r.moedas >= P('remover'))}
        ${srv('selo', `<span class="selo-etiqueta" data-tip="mod:${mod}" tabindex="0"><b>${esc(seloNome(mod))}</b></span> <span class="info">selo</span>`, esc(seloTexto(mod)), L.selo.preco, !L.selo.comprado && r.moedas >= L.selo.preco)}
        <div class="servico"><div><b>Renovar as cartas</b><div class="info">Sorteia 3 cartas novas (uma vez por Loja).</div></div>
          <button type="button" data-acao="loja-renovar" data-tip="ui:renovar" ${!L.renovou && r.moedas >= P('renovar') ? '' : 'disabled'}>Renovar · ● ${P('renovar')}</button></div>
      </div>${modoHtml}`;
    moldura(UI.statusRun() + UI.eventoHtml('loja', 'Loja', 'Cartas Raras ou melhores, 1 omamori, upgrade, remoção e um selo. Sair sem gastar também vale.', corpo, 'ui:loja',
      `<div class="loja-saldo" data-tip="ui:moedas" tabindex="0">Moedas <b class="moeda-n">● ${r.moedas}</b></div><button type="button" class="principal" data-acao="passo-ok">Sair da Loja</button>`));
  }
  UI.telas.loja = telaLoja;

  // ---------- Recompensa do sub-chefe ----------
  function telaRecsub() {
    const r = run(), rec = r.pendente;
    if (!rec) { moldura(UI.statusRun() + UI.eventoHtml('recsub', 'Recompensa do sub-chefe', '', '<p class="info">Nada a receber.</p>', null, '<button type="button" class="principal" data-acao="passo-ok">Continuar</button>')); return; }
    const sub = SUBCHEFES[r.subEscolhido];
    let corpo = '';
    const titulo = 'Recompensa: ' + esc(sub ? sub.nome : 'sub-chefe');
    const pronta = Run.recompensaConcluida(r);
    if (rec.tipo === 'lendaria2') {
      corpo = `<p>Escolha 1 Lendária:</p><div class="esp-grade">${rec.opcoes.map(id => opcaoGrande('Lendária', cartaHtml(Motor.cartaDeEntrada({ id }, 9300), { tam: 'media' }), esc(CARTAS_POR_ID[id].nome), '', '', `<button type="button" class="principal" data-acao="rec-escolher" data-id="${id}">Levar a carta</button>`)).join('')}</div>`;
    } else if (rec.tipo === 'omamori2') {
      corpo = `<p>Escolha 1 omamori:${Run.omamorisCheios(r) ? ' você está com o limite de omamoris: ao levar um, vai trocar por um dos seus.' : ''}</p><div class="esp-grade">${rec.opcoes.map(id => opOmamori(OMAMORIS_POR_ID[id], 'Omamori', 'rec-escolher', `data-id="${id}"`, 'Levar o omamori')).join('')}</div>`;
    } else if (rec.tipo === 'moedas') {
      corpo = `<p>${rec.devolve ? 'A Ladra devolve o que roubou (' + rec.devolve + '), mais 5 moedas.' : 'Você ganha ' + rec.valor + ' moedas.'}</p><p><button type="button" class="principal" data-acao="rec-moedas" ${rec.aplicada ? 'disabled' : ''}>${rec.aplicada ? 'Moedas recebidas' : 'Pegar ● ' + rec.valor}</button></p>`;
    } else if (rec.tipo === 'upgrades') {
      const cards = r.deck.map(e => cartaEntrada(e, { acao: 'rec-up', cinza: !Run.podeUpgrade(r, e.eid), desativada: !Run.podeUpgrade(r, e.eid) || rec.restam < 1, tam: 'pequena' })).join('');
      corpo = `${rec.moedas ? `<p><button type="button" class="principal" data-acao="rec-moedas" ${rec.aplicada ? 'disabled' : ''}>${rec.aplicada ? 'Moedas recebidas' : 'Pegar ● ' + rec.moedas}</button></p>` : ''}<p>${rec.restam > 0 ? 'Escolha ' + (rec.restam === 1 ? '<b>1 carta</b>' : '<b>' + rec.restam + ' cartas</b>') + ' para receber o upgrade de graça:' : 'Upgrades aplicados.'}</p>${grade(cards, 'compacta')}`;
    } else corpo = '<p>Recompensa recebida.</p>';
    moldura(UI.statusRun() + UI.eventoHtml('recsub', titulo, 'Você venceu o sub-chefe.', corpo, 'ui:subchefe', `<button type="button" class="principal" data-acao="passo-ok" ${pronta ? '' : 'disabled'}>Continuar</button>`));
  }
  UI.telas.recsub = telaRecsub;

  // ---------- Espólio do chefão ----------
  // O omamori do chefão é garantido; o jogador escolhe a carta Troféu ou 1 omamori sorteado
  function telaEspolio() {
    const r = run(), p = Run.espolioIniciar(r), ch = Run.chefaoDoAto(r, Run.atoDe(r, r.etapa));
    const om = OMAMORIS_POR_ID[p.garantido];
    const garantido = `<div class="esp-garantido"><div class="esp-tit">Garantido</div><div class="relic-grande">${omamoriHtml(om.id, 'grande', 60)}<span><b>${esc(om.nome)}</b><br>${esc(textoOmamori(om))}</span></div>
      ${p.garantidoOk ? '<span class="pilula">Já é seu</span>' : `<button type="button" class="principal" data-acao="espolio-garantido">Levar o omamori (trocar por um dos seus)</button>`}</div>`;
    const caixas = [];
    if (p.trofeu) caixas.push(opcaoGrande('Carta Troféu', cartaHtml(Motor.cartaDeEntrada({ id: p.trofeu }, 9100), { tam: 'media' }), esc(CARTAS_POR_ID[p.trofeu].nome), '', 'Só 1 por deck. Com upgrade causa +1.', `<button type="button" class="principal" data-acao="espolio" data-tipo="carta" ${p.garantidoOk && !p.escolhido ? '' : 'disabled'}>${p.escolhido ? '—' : 'Levar a carta'}</button>`, true));
    if (p.sorteado) caixas.push(opOmamori(OMAMORIS_POR_ID[p.sorteado], 'Omamori sorteado', 'espolio', 'data-tipo="omamori" ' + (p.garantidoOk && !p.escolhido ? '' : 'disabled'), 'Levar o omamori', false));
    const pronto = Run.espolioFeito(r);
    moldura(UI.statusRun() + UI.eventoHtml('espolio', 'Espólio: ' + esc(ch.nome), `Você venceu o chefão (+3 moedas) e leva o omamori dele. Agora escolha <b>1</b>: ${p.trofeu ? 'a carta Troféu' : ''}${p.trofeu && p.sorteado ? ' ou ' : ''}${p.sorteado ? 'um omamori sorteado' : ''}.${Run.omamorisCheios(r) ? ' Você já tem ' + r.cfg.run.limiteOmamoris + ' omamoris: ao levar um, vai trocar por um dos seus.' : ''}`,
      `${garantido}<div class="esp-grade n${caixas.length}">${caixas.join('')}</div>`, 'ui:espolio',
      `<button type="button" class="principal" data-acao="passo-ok" ${pronto ? '' : 'disabled'}>Continuar</button>`));
  }
  UI.telas.espolio = telaEspolio;

  // ---------- Mesa do Apostador ----------
  function telaMesa() {
    const r = run(), m = r.pendente && r.pendente.tipo === 'mesa' ? r.pendente : null;
    let corpo, acoes = '';
    if (!m) {
      const ap = Run.mesaApostasPossiveis(r);
      const lend = Run.lendariasDoDeck(r);
      corpo = `<div class="mesa-intro"><p><b>O Apostador</b> joga ao acaso: é sorte pura. Melhor de 3 rodadas de jokenpô sem cartas; empate repete a rodada.</p>
        <p>Se você ganhar, leva a <b>Dinamite</b> ou o <b>Curinga</b> (as duas só saem aqui). Se perder, perde o que apostou.</p>
        ${ap.length ? `<div class="mesa-apostas">
          ${ap.some(a => a.tipo === 'lendaria') ? `<div class="aposta"><h3>Apostar 1 Lendária</h3><p class="info">Escolha qual do seu deck:</p>${grade(lend.map(e => cartaEntrada(e, { acao: 'mesa-aposta-lend', tam: 'pequena' })).join(''), 'compacta')}</div>` : ''}
          ${ap.some(a => a.tipo === 'moedas') ? `<div class="aposta"><h3>Apostar ● ${r.cfg.run.mesa.apostaMoedas} moedas</h3><button type="button" class="principal" data-acao="mesa-aposta-moedas">Apostar ${r.cfg.run.mesa.apostaMoedas} moedas</button></div>` : ''}
        </div>` : '<p class="info">Você não tem nada que dê para apostar (1 Lendária ou ' + r.cfg.run.mesa.apostaMoedas + ' moedas).</p>'}</div>`;
      acoes = '<button type="button" data-acao="mesa-recusar">Recusar</button>';
    } else {
      const rod = m.rodadas.map(x => `<li class="m-${x.res}">Você ${forma(x.voce, 16)} ${NAIPES[x.voce].nome} × ${forma(x.ele, 16)} ${NAIPES[x.ele].nome}: ${{ vitoria: 'você ganhou', derrota: 'ele ganhou', empate: 'empate (repete)' }[x.res]}</li>`).join('');
      const aposta = m.aposta ? (m.aposta.tipo === 'moedas' ? '● ' + m.aposta.valor + ' moedas' : 'uma Lendária') : '';
      corpo = `<div class="mesa-jogo"><p class="info">Aposta: ${aposta}. Prêmio: Dinamite ou Curinga.</p><div class="placar"><b>Você ${m.placar[0]}</b> × <b>${m.placar[1]} Apostador</b></div>
        ${m.fim ? '' : `<p>Escolha:</p><p class="mesa-botoes">${BASE.map(n => `<button type="button" class="principal naipe-grande" data-acao="mesa-jogar" data-naipe="${n}">${forma(n, 28)} ${NAIPES[n].nome}</button>`).join(' ')}</p>`}
        <ul class="mesa-rodadas">${rod}</ul>
        ${m.fim === 'vitoria' ? `<h3>Você ganhou!</h3>${m.premio ? `<p>Você levou ${esc(CARTAS_POR_ID[m.premio].nome)}.</p>` : `<p>Escolha o prêmio:</p><div class="esp-grade">${Run.mesaPremioOpcoes(r).map(id => opcaoGrande('Prêmio', cartaHtml(Motor.cartaDeEntrada({ id }, 9400), { tam: 'media' }), esc(CARTAS_POR_ID[id].nome), '', '', `<button type="button" class="principal" data-acao="mesa-premio" data-id="${id}">Levar ${esc(CARTAS_POR_ID[id].nome)}</button>`)).join('')}</div>`}` : ''}
        ${m.fim === 'derrota' ? `<h3>Você perdeu.</h3><p>Perdeu o que apostou.</p>` : ''}</div>`;
      const pronto = m.fim === 'derrota' || (m.fim === 'vitoria' && m.premio);
      acoes = `<button type="button" class="principal" data-acao="passo-ok" ${pronto ? '' : 'disabled'}>Continuar</button>`;
    }
    moldura(UI.statusRun() + UI.eventoHtml('mesa', 'Mesa do Apostador', 'Uma aposta de verdade, pela Dinamite ou pelo Curinga.', corpo, 'ui:mesa', acoes));
  }
  UI.telas.mesa = telaMesa;

  // ---------- Fim da run ----------
  function telaFimRun() {
    const r = run(), s = r.stats;
    const vitoria = r.fim === 'vitoria';
    const titulo = vitoria ? 'Vitória!' : 'Run perdida';
    const arq = Run.arquetiposAtivos(r);
    const modoTxt = r.modo === 'aberta' ? 'Modo: Mão aberta (teste)' : 'Modo: Normal';
    const sub = (vitoria ? `Você derrotou o chefão do ato 2${arq.length ? ' com um deck de <b>' + esc(arq[0].chave) + '</b>' : ''} · vida da run ${Math.max(0, r.vida)}/${r.vidaMax}`
      : `Terminou no combate ${r.etapa} com ${r.vitorias} vitórias, ${r.empates} empates e ${r.derrotas} derrotas.`) + `<br><span class="modo-tag">${modoTxt}</span>`;
    const melhor = Object.keys(s.cartas).map(k => ({ eid: Number(k), c: s.cartas[k] })).sort((a, b) => b.c.vitorias - a.c.vitorias)[0];
    const naipeTop = BASE.slice().sort((a, b) => s.naipes[b] - s.naipes[a])[0];
    const caixas = r.mapa.map(m => `<span class="fim-no ${m.resultado} ${m.tipo}" title="Combate ${m.etapa}: ${m.resultado}"><i>${m.etapa}</i></span>`).join('');
    const stat = (v, rot) => `<div class="stat"><b>${v}</b><span>${rot}</span></div>`;
    const gasto = Object.keys(s.gasto).reduce((a, k) => a + s.gasto[k], 0), ganho = Object.keys(s.ganho).reduce((a, k) => a + s.ganho[k], 0);
    const stats = [
      stat(s.rodadas ? Math.round(100 * s.vitoriasRodada / s.rodadas) + '%' : '—', 'Rodadas vencidas'),
      stat(s.rodadas ? NAIPES[naipeTop].nome : '—', 'Naipe mais jogado'),
      stat(r.deck.length, 'Cartas no deck final'), stat(r.omamoris.length, 'Omamoris'),
      stat(ganho, 'Moedas ganhas'), stat(gasto, 'Moedas gastas'), stat(r.mapa.length, 'Combates jogados'), stat(r.modo === 'aberta' ? 'Mão aberta' : 'Normal', 'Modo da run')
    ].join('');
    const eCarta = melhor && r.deck.find(e => e.eid === melhor.eid);
    const cartaBox = melhor ? `<div class="carta-run">${eCarta ? cartaEntrada(eCarta, { tam: 'media' }) : ''}<div><div class="lbl">Carta da run</div><h3>${esc(melhor.c.nome)}</h3><p class="info">Venceu ${melhor.c.vitorias} ${melhor.c.vitorias === 1 ? 'vez' : 'vezes'}.</p></div></div>` : '';
    moldura(`<div class="fim-run"><div class="fim-topo"><i class="c1"></i><i class="c2"></i><i class="c3"></i><h1 class="${vitoria ? '' : 'perdeu'}">${titulo}</h1><p>${sub}</p></div>
      <div class="painel fim-mapa"><div class="fim-nos">${caixas}</div></div>
      <div class="fim-stats">${stats}${cartaBox}</div>
      ${r.omamoris.length ? `<p class="fim-rel"><span class="lbl">Omamoris</span> ${omamorisHtml(r.omamoris)}</p>` : ''}
      <p class="fim-botoes"><button type="button" class="principal" data-acao="novarun">Nova run</button> <button type="button" data-acao="mesmaseed-run">Mesma seed</button> <button type="button" data-acao="menu">Menu</button></p></div>`);
  }
  UI.telas.fimrun = telaFimRun;

  // ---------- Perguntas da run: limite de omamoris ----------
  const promptAntes = UI.promptHtml;
  const omamoriCard = id => { const o = OMAMORIS_POR_ID[id]; return `<div class="rel-card">${omamoriHtml(id)}<div><b>${esc(o.nome)}</b><div>${esc(textoOmamori(o))}</div></div></div>`; };
  UI.promptHtml = function () {
    const p = st.prompt;
    if (p.tipo === 'substituir') {
      return `<div class="modal" role="alertdialog"><div><h3>Limite de omamoris</h3><p>Você já tem ${run().cfg.run.limiteOmamoris}. Qual deles sai?</p>
        <div class="rel-lista">${run().omamoris.map(id => `<button type="button" class="rel-op" data-acao="prompt-substituir" data-id="${id}">${omamoriCard(id)}</button>`).join('')}</div>
        <p><button type="button" data-acao="prompt-cancelar2">Cancelar</button></p></div></div>`;
    }
    return promptAntes();
  };

  // ---------- Ações da run ----------
  UI.runAcoes = {
    rapido, novaRun, continuar, concluirPasso, seguirRun, comecarCombate, irParaPasso,
    subEscolher(id) { Run.escolherSub(run(), id); salvar(); UI.desenhar(); },
    omamoriInicial(id) { if (Run.escolherOmamoriInicial(run(), id)) concluirPasso(); },
    // Loja
    lojaComprar(i) { if (Run.comprarCarta(run(), i)) { Som.tocar('cura'); salvar(); } UI.desenhar(); },
    lojaModo(modo) { st.sub.modo = st.sub.modo === modo ? null : modo; UI.desenhar(); },
    lojaSel(eid) {
      const r = run(), S = st.sub; let ok = false;
      if (S.modo === 'upgrade') ok = Run.comprarUpgrade(r, eid);
      else if (S.modo === 'remover') ok = Run.comprarRemocao(r, eid);
      else if (S.modo === 'selo') ok = Run.comprarSelo(r, eid);
      if (ok) { Som.tocar('cura'); S.modo = null; salvar(); }
      UI.desenhar();
    },
    lojaRenovar() { if (Run.renovarLoja(run())) { Som.tocar('revelar'); salvar(); } UI.desenhar(); },
    lojaOmamori() { if (Run.comprarOmamoriLoja(run())) { Som.tocar('cura'); salvar(); } UI.desenhar(); },
    // Recompensa de cartas e Oficina
    recCarta(i) { if (Run.recompensaEscolher(run(), i)) { Som.tocar('cura'); salvar(); } UI.desenhar(); },
    recPular() { if (Run.recompensaPular(run())) { Som.tocar('vitoria'); salvar(); } UI.desenhar(); },
    oficinaUp(eid) { if (Run.oficinaUpgrade(run(), eid)) { Som.tocar('cura'); salvar(); } UI.desenhar(); },
    oficinaPular() { if (Run.oficinaPular(run())) { Som.tocar('vitoria'); salvar(); } UI.desenhar(); },
    // Recompensa
    recEscolher(id) {
      const r = run();
      if (r.pendente.tipo === 'omamori2' && Run.omamorisCheios(r)) { st.prompt = { tipo: 'substituir', rec: id }; UI.desenhar(); return; }
      if (Run.aplicarRecompensa(r, id)) { salvar(); UI.desenhar(); }
    },
    recMoedas() { if (Run.aplicarRecompensa(run())) { Som.tocar('vitoria'); salvar(); } UI.desenhar(); },
    recUp(eid) { if (Run.upgradeGratis(run(), eid)) { Som.tocar('cura'); salvar(); } UI.desenhar(); },
    // Espólio: o omamori do chefão é garantido; depois a escolha entre a carta Troféu e um omamori sorteado
    espolio(tipo) {
      const r = run();
      if (tipo !== 'carta' && Run.omamorisCheios(r)) { st.prompt = { tipo: 'substituir', espolio: tipo }; UI.desenhar(); return; }
      if (Run.espolioEscolher(r, tipo)) { Som.tocar('cura'); salvar(); UI.desenhar(); }
    },
    espolioGarantido() { st.prompt = { tipo: 'substituir', espolio: 'garantido' }; UI.desenhar(); },
    substituir(id) {
      const p = st.prompt; st.prompt = null;
      if (p.rec) { if (Run.aplicarRecompensa(run(), p.rec, id)) { salvar(); UI.desenhar(); } }
      else if (p.espolio === 'garantido') { if (Run.espolioGarantido(run(), id)) { salvar(); UI.desenhar(); } }
      else if (Run.espolioEscolher(run(), p.espolio, id)) { salvar(); UI.desenhar(); }
    },
    // Mesa do Apostador
    mesaApostaLend(eid) { Run.mesaIniciar(run(), { tipo: 'lendaria', eid }); salvar(); UI.desenhar(); },
    mesaApostaMoedas() { Run.mesaIniciar(run(), { tipo: 'moedas', valor: run().cfg.run.mesa.apostaMoedas }); salvar(); UI.desenhar(); },
    mesaRecusar() { Run.mesaIniciar(run(), null); concluirPasso(); },
    mesaJogar(naipe) { Run.mesaJogar(run(), naipe); Som.tocar('revelar'); salvar(); UI.desenhar(); },
    mesaPremio(id) { if (Run.mesaPremio(run(), id)) { Som.tocar('vitoria'); salvar(); UI.desenhar(); } }
  };
})();
