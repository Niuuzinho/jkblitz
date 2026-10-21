// ============================================================
// INTERFACE: CLIQUES, TECLADO E INICIALIZAÇÃO
// Teclado: 1 a 9 jogam a carta, Enter ou Espaço pulam a animação e a espera, I amplia a carta, Esc fecha janelas.
// Um toque em qualquer lugar da mesa também pula a animação e a espera pela próxima rodada.
// ============================================================
(function () {
  const { st, prefs, app } = UI;
  const C = () => UI.combate, R = () => UI.runAcoes;

  function sairParaMenu() {
    C().cancelarAnimacao(); st.run = null; st.modal = null; st.prompt = null; st.tutorial = null; st.estado = null; st.tela = 'menu'; Motor.definirModo(st.escolhas.modo);
    document.body.classList.remove('blitz-borda'); Dicas.fechar(); UI.desenhar();
  }

  function clique(ev) {
    if (Tips.segurouRecente()) { ev.preventDefault(); return; }   // clique que vem depois de segurar o dedo
    const alvo = ev.target.closest('[data-acao]');
    if (!alvo) { if (st.tela === 'combate' && st.estado && !st.modal && ev.target.closest('.combate')) C().toque(); return; }
    const a = alvo.dataset.acao, d = alvo.dataset;
    if (a === 'fechar') { if (ev.target === alvo || alvo.tagName === 'BUTTON') { st.modal = null; UI.desenhar(); } return; }
    if (a !== 'selecionar') Som.tocar('clique');
    switch (a) {
      case 'menu': sairParaMenu(); break;
      case 'som': prefs.som = !prefs.som; UI.salvarPrefs(); UI.aplicarPrefs(); UI.desenhar(); break;
      case 'gloss': st.modal = { tipo: 'gloss' }; UI.desenhar(); { const b = document.getElementById('busca-gloss'); if (b) b.focus(); } break;
      case 'log': st.modal = { tipo: 'log' }; UI.desenhar(); break;
      case 'modo': st.escolhas.modo = d.valor; Motor.definirModo(d.valor); UI.desenhar(); break;
      case 'novarun': R().novaRun(); break;
      case 'continuar': R().continuar(); break;
      case 'rapido': R().rapido(); break;
      case 'combater': R().comecarCombate(); break;
      case 'verdeck': st.modal = { tipo: 'deck' }; UI.desenhar(); break;
      case 'filtro-naipe': st.filtroNaipe = d.valor; UI.desenhar(); break;
      case 'filtro-arq': st.filtroArq = d.valor; UI.desenhar(); break;
      case 'verup': st.verUp = !st.verUp; UI.desenhar(); break;
      // Combate
      case 'selecionar': C().selecionar(Number(d.uid)); break;
      case 'confirmar': C().confirmarCarta(); break;
      case 'jogar': C().jogar(Number(d.uid), {}); break;
      case 'pular': C().pularAnimacao(); break;
      case 'proxima': C().comecarRodada(); break;   // só no tutorial
      case 'terminar': C().contabilizar(); C().telaFimCombate(); break;   // só no tutorial
      case 'seguirrun': R().seguirRun(); break;
      case 'zona': abrirZona(d.lado, d.zona); break;
      case 'caderno': C().pedirCaderno(); break;
      case 'cartola': case 'prompt-jogar': case 'prompt-carta': case 'prompt-cartola': case 'prompt-cancelar': case 'tapar':
      case 'guardar-sel': case 'guardar-ok': C().aoPrompt(a, d); break;
      // Run
      case 'mesmaseed-run': st.escolhas.semente = String(st.run.semente); R().novaRun(); break;
      case 'painel': st.painel = st.painel === d.valor ? null : d.valor; UI.desenhar(); break;
      case 'sub-escolher': R().subEscolher(d.id); break;
      case 'omamori-inicial': R().omamoriInicial(d.id); break;
      case 'passo-ok': R().concluirPasso(); break;
      case 'loja-comprar': R().lojaComprar(Number(d.i)); break;
      case 'loja-modo': R().lojaModo(d.modo); break;
      case 'loja-sel': R().lojaSel(Number(d.uid)); break;
      case 'loja-renovar': R().lojaRenovar(); break;
      case 'loja-omamori': R().lojaOmamori(); break;
      case 'rec-carta': R().recCarta(Number(d.i)); break;
      case 'rec-pular': R().recPular(); break;
      case 'ofi-up': R().oficinaUp(Number(d.uid)); break;
      case 'ofi-pular': R().oficinaPular(); break;
      case 'espolio-garantido': R().espolioGarantido(); break;
      case 'rec-escolher': R().recEscolher(d.id); break;
      case 'rec-moedas': R().recMoedas(); break;
      case 'rec-up': R().recUp(Number(d.uid)); break;
      case 'espolio': R().espolio(d.tipo); break;
      case 'prompt-substituir': R().substituir(d.id); break;
      case 'prompt-cancelar2': st.prompt = null; UI.desenhar(); break;
      case 'mesa-aposta-lend': R().mesaApostaLend(Number(d.uid)); break;
      case 'mesa-aposta-moedas': R().mesaApostaMoedas(); break;
      case 'mesa-recusar': R().mesaRecusar(); break;
      case 'mesa-jogar': R().mesaJogar(d.naipe); break;
      case 'mesa-premio': R().mesaPremio(d.id); break;
      // Tutorial e dicas
      case 'tut-iniciar': st.convite = false; Tutorial.iniciar(); break;
      case 'tut-recusar': st.convite = false; prefs.vistas.tutorial = true; UI.salvarPrefs(); UI.desenhar(); break;
      case 'tut-pular': Tutorial.pular(); break;
      case 'tut-ok': Tutorial.dicaOk(); break;
      case 'tut-run': st.tutorial = null; st.estado = null; R().novaRun(); break;
      case 'tut-sair': Tutorial.fimDoTutorial(true); break;
      case 'dica-ok': Dicas.fechar(); break;
      case 'rever-dicas': Dicas.resetar(); alvo.textContent = 'feito'; break;
    }
  }

  function abrirZona(lado, zona) {
    const j = st.estado[lado];
    const nome = { deck: 'deck', cemiterio: 'cemitério', cortadas: 'cortadas' }[zona];
    st.modal = { titulo: (lado === 'jogador' ? 'Seu ' : j.nome + ': ') + nome, gerar: () => {
      const lista = zona === 'deck' ? j.deck.slice().sort((a, b) => a.nome.localeCompare(b.nome)) : j[zona];   // a ordem do deck fica escondida
      return lista.map(c => UI.cartaHtml(c, { tam: 'pequena' })).join('');
    } };
    UI.desenhar();
  }

  // ---------- Teclado ----------
  function tecla(ev) {
    const t = ev.target;
    if (ev.key === 'Escape' && st.modal) { st.modal = null; UI.desenhar(); return; }   // vale até com o foco no campo de busca
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    // I: amplia a carta focada ou a selecionada
    if (/^[iI]$/.test(ev.key) && !st.prompt) {
      let ref = t && t.dataset && t.dataset.cref;
      if (!ref && st.estado && st.selecionado != null) { const el = document.querySelector('.mao .carta.selecionada'); ref = el && el.dataset.cref; }
      if (ref) { UI.ampliarCarta(ref); return; }
    }
    if (st.modal || st.tela !== 'combate' || !st.estado) return;
    const e = st.estado, c = C();
    if (ev.key === ' ' || ev.code === 'Space') { if (st.fase === 'animando') { ev.preventDefault(); c.pularAnimacao(); } else if (st.fase === 'revelacao' && !st.tutorial && !st.prompt) { ev.preventDefault(); c.avancar(); } return; }
    if (st.prompt) return;
    const focoEmBotao = t && t.tagName === 'BUTTON';
    const livres = c.livresAtuais();
    if (st.fase === 'escolha' && !e.jogador.aleatoria && !e.escolhaSecreta && /^[1-9]$/.test(ev.key)) {
      const carta = e.jogador.mao[Number(ev.key) - 1];
      if (carta && livres.indexOf(carta) >= 0) c.selecionar(carta.uid);
      return;
    }
    if (st.fase === 'escolha') {
      if (ev.key === 'Enter' && !focoEmBotao && st.selecionado != null) c.confirmarCarta();
    } else if (st.fase === 'revelacao' && ev.key === 'Enter' && !focoEmBotao) {
      if (e.pendente) return;
      if (st.tutorial) { if (e.fim) { c.contabilizar(); c.telaFimCombate(); } else c.comecarRodada(); } else c.avancar();
    } else if (st.fase === 'animando' && ev.key === 'Enter' && !focoEmBotao) c.pularAnimacao();
  }

  // ---------- Arrastar a carta da mão para a mesa ----------
  app.addEventListener('dragstart', ev => {
    const b = ev.target.closest && ev.target.closest('.mao .carta[data-uid]');
    if (!b || b.disabled) { ev.preventDefault(); return; }
    ev.dataTransfer.setData('text/plain', b.dataset.uid); ev.dataTransfer.effectAllowed = 'move';
  });
  app.addEventListener('dragover', ev => { if (ev.target.closest && ev.target.closest('#lado-jogador')) ev.preventDefault(); });
  app.addEventListener('drop', ev => {
    if (!(ev.target.closest && ev.target.closest('#lado-jogador'))) return;
    ev.preventDefault();
    const uid = Number(ev.dataTransfer.getData('text/plain'));
    if (uid && st.fase === 'escolha' && !st.estado.jogador.aleatoria) C().selecionar(uid);
  });

  // ---------- Ligações ----------
  app.addEventListener('click', clique);
  document.addEventListener('keydown', tecla);

  app.addEventListener('input', ev => {
    const t = ev.target;
    if (t.id === 'semente') st.escolhas.semente = t.value;
    else if (t.id === 'busca-gloss') {   // atualiza só a lista, para não perder o foco do campo
      st.buscaGloss = t.value;
      const l = document.getElementById('gloss-lista'); if (l) l.innerHTML = UI.glossarioLista(st.buscaGloss);
    }
  });
  app.addEventListener('change', ev => {
    const t = ev.target, E = st.escolhas;
    if (t.id === 'deck') E.deck = t.value;
    else if (t.id === 'inimigo') E.inimigo = t.value;
    else if (t.id === 'vel') { prefs.vel = t.value; UI.salvarPrefs(); UI.aplicarPrefs(); }
    else if (t.id === 'fonte') { prefs.fonte = t.value; UI.salvarPrefs(); UI.aplicarPrefs(); }
    else if (t.id === 'dicas') { prefs.dicas = t.value; UI.salvarPrefs(); }
    else if (t.id === 'hints') { prefs.hints = t.checked; UI.salvarPrefs(); }
    else if (t.id === 'confirmar') { prefs.confirmar = t.checked; UI.salvarPrefs(); }
    else if (t.id === 'modo') { E.modo = t.value; Motor.definirModo(E.modo); UI.desenhar(); }
    else if (t.id === 'som') { prefs.som = t.checked; UI.salvarPrefs(); UI.aplicarPrefs(); }
  });
  document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('[data-acao=dica-ok]')) Dicas.fechar(); });

  Tips.iniciar({ modo: () => prefs.dicas, aoCarta: el => UI.ampliarCarta(el.dataset.cref) });
  UI.aplicarPrefs();
  st.convite = !prefs.vistas.tutorial;   // na primeira vez o jogo oferece o tutorial
  UI.desenhar();
})();
