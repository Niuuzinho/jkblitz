// ============================================================
// TUTORIAL (O Treinador) E DICAS DE PRIMEIRA VEZ
//
// Tutorial: uma partida guiada de 7 rodadas, com mãos e decks fixos e uma ideia por rodada.
// Aparece ao abrir o jogo pela primeira vez, pode ser pulado a qualquer momento
// e refeito pelo menu em "Como jogar". Usa o mesmo motor e a mesma tela do combate normal.
// Os textos estão em data/textos.js (TEXTOS.tutorial e TEXTOS.dicas).
//
// Dicas: uma frase curta na primeira vez que algo novo acontece. Cada dica aparece uma vez só
// e pode ser desligada no menu.
// ============================================================
const Dicas = (function () {
  let fila = [], visivel = null, timer = null;

  function exibir(txt) {
    if (visivel) { fila.push(txt); return; }
    visivel = document.createElement('div');
    visivel.className = 'dica-vez'; visivel.setAttribute('role', 'status');
    visivel.innerHTML = '<span>' + UI.esc(txt) + '</span><button type="button" class="mini" data-acao="dica-ok">Entendi</button>';
    document.body.appendChild(visivel);
    timer = setTimeout(fechar, 16000);
  }
  function fechar() {
    clearTimeout(timer);
    if (visivel) { visivel.remove(); visivel = null; }
    if (fila.length) exibir(fila.shift());
  }
  // Mostra a dica se ela ainda não foi vista (e se as dicas estão ligadas)
  function mostrar(chave) {
    if (!UI.prefs.hints || UI.prefs.vistas[chave] || (UI.st.tutorial && UI.st.tutorial.ativo)) return;
    const txt = TEXTOS.dicas[chave];
    if (!txt) return;
    UI.prefs.vistas[chave] = true; UI.salvarPrefs(); exibir(txt);
  }
  // No começo de cada rodada: olha a mão em busca de coisas novas (Curinga, selo, Frágil, Marcada, odds)
  function checarMao() {
    const e = UI.st.estado; if (!e) return;
    const mao = e.jogador.mao;
    if (mao.some(c => c.def.naipe === 'curinga')) mostrar('curinga');
    if (mao.some(c => c.mod)) mostrar('selo');
    if (mao.some(c => (c.def.fragil || c.fragilTemp) && c.mod !== 'blindada')) mostrar('fragil');
    if (mao.some(c => c.marcada) || e.inimigo.mao.some(c => c.marcada)) mostrar('marcada');
    if (mao.some(c => c.def.nuncaDescarta)) mostrar('guardar');
    if (e.rodada === 1) mostrar('direito');
    if (e.rodada === 2) mostrar('odds');
  }
  function resetar() { UI.prefs.vistas = {}; UI.salvarPrefs(); }
  return { mostrar, checarMao, fechar, resetar };
})();

const Tutorial = (function () {
  const st = UI.st;
  // Roteiro: o que cada rodada tem. mao = cartas do jogador; treina = cartas do Treinador (ele joga a primeira);
  // permitidas = cartas que o jogador pode jogar (null = qualquer); marcada = a carta do Treinador fica Marcada.
  const ROTEIRO = {
    1: { mao: ['pedra', 'papel', 'tesoura'], treina: ['tesoura', 'pedra', 'pedra'], permitidas: null },
    2: { mao: ['pedra', 'papel', 'tesoura'], treina: ['pedra', 'papel', 'papel'], permitidas: ['pedra'] },
    3: { mao: ['pedra', 'papel', 'tesoura'], treina: ['pedra', 'pedra'], deckT: ['pedra', 'pedra', 'pedra', 'papel'], permitidas: ['papel'] },   // odds quase só de pedra
    4: { mao: ['pedrada', 'papel', 'pedra'], treina: ['tesoura', 'pedra'], permitidas: ['pedrada'], vidaJ: 4 },
    5: { mao: ['pedra', 'papel', 'tesoura'], treina: ['papel', 'pedra'], permitidas: ['tesoura'], marcada: true },
    6: { mao: ['pedra', 'papel', 'tesoura'], treina: ['papel', 'pedra'], permitidas: ['papel'] },
    7: { mao: ['pedra', 'papel', 'tesoura'], treina: ['pedra', 'pedra'], permitidas: ['papel'], vidaT: 1 }
  };

  function iniciar() {
    UI.combate.cancelarAnimacao();
    const cfg = JSON.parse(JSON.stringify(CONFIG));
    const estado = Motor.criarCombate({
      cfg, deckJogador: ['pedra', 'papel', 'tesoura', 'pedrada', 'pedra', 'papel', 'tesoura', 'pedra', 'papel', 'tesoura', 'pedra', 'papel'],
      inimigo: { nome: 'O Treinador', deck: ['pedra', 'pedra', 'pedra', 'pedra', 'tesoura', 'tesoura', 'papel', 'papel'], ia: { padrao: 'rochedo' }, vida: 8, regra: '', tendencia: 'Ensina com paciência' },
      semente: 1, ordemFixa: true, rodadaBlitz: 6
    });
    st.run = null; st.estado = estado; st.tela = 'combate'; st.modal = null; st.prompt = null; st.historico = [];
    st.tutorial = { ativo: true, rodada: 0, dica: null, fila: [] };
    UI.combate.cancelarAnimacao();
    st.vidaView = { jogador: estado.jogador.vida, inimigo: estado.inimigo.vida };
    comecarRodada();
  }

  // Começa uma rodada do roteiro: mãos fixas, a jogada do Treinador já decidida
  function comecarRodada() {
    const e = st.estado;
    Motor.iniciarRodada(e);
    const r = e.rodada, rot = ROTEIRO[r] || ROTEIRO[7];
    e.jogador.vida = Math.max(e.jogador.vida, 3);
    if (rot.vidaJ) e.jogador.vida = rot.vidaJ;
    if (rot.vidaT) e.inimigo.vida = rot.vidaT;
    Motor.definirMao(e, 'jogador', rot.mao);
    Motor.definirMao(e, 'inimigo', rot.treina, rot.deckT || ['pedra', 'pedra', 'pedra', 'pedra']);
    if (rot.marcada) e.inimigo.mao[0].marcada = true;
    e.jogador.aleatoria = false; e.inimigo.aleatoria = false;
    st.tutorial.rodada = r; st.tutorial.permitidas = rot.permitidas;
    st.selecionado = null; st.prompt = null; st.ultimo = null; st.fase = 'escolha';
    st.vidaView = { jogador: e.jogador.vida, inimigo: e.inimigo.vida };
    e.decisaoIA = { uid: e.inimigo.mao[0].uid, escolhas: {} }; e.anuncio = null;
    st.tutorial.fila = passos(r, 'inicio');
    proxima(); UI.desenhar();
  }

  const passos = (rodada, momento) => TEXTOS.tutorial.passos.filter(p => p.rodada === rodada && (p.momento || 'inicio') === momento);
  // Mostra a próxima dica da fila (uma frase por vez, com a parte da tela em destaque)
  function proxima() { st.tutorial.dica = st.tutorial.fila.length ? st.tutorial.fila.shift() : null; }
  function dicaOk() { proxima(); UI.desenhar(); }
  // Momentos: no início da rodada e depois do resultado
  function aposResultado() { st.tutorial.fila = passos(st.tutorial.rodada, 'depois'); proxima(); }

  function pular() { fimDoTutorial(false); }
  function fimDoTutorial(completo) {
    UI.prefs.vistas.tutorial = true; UI.salvarPrefs();
    UI.combate.cancelarAnimacao();
    st.tutorial = null; st.estado = null; st.tela = 'menu'; st.fase = 'escolha'; st.modal = null; Motor.definirModo(st.escolhas.modo);
    document.body.classList.remove('blitz-borda');
    UI.desenhar();
  }

  // Painel final do tutorial
  function painelFim() {
    const t = TEXTOS.tutorial.fim;
    UI.prefs.vistas.tutorial = true; UI.salvarPrefs();
    return `<div class="fim"><div role="dialog" aria-label="Fim do tutorial"><h2>${UI.esc(t[0])}</h2>${t.slice(1).map(x => `<p>${UI.esc(x)}</p>`).join('')}
      <p><button type="button" class="principal" data-acao="tut-run">Começar uma run</button> <button type="button" data-acao="tut-sair">Voltar ao menu</button></p></div></div>`;
  }

  // Convite na primeira vez que o jogo é aberto
  function conviteHtml() {
    return `<div class="modal" role="dialog" aria-label="Tutorial"><div><h3>Bem-vindo ao Jokenblitz!</h3>
      <p>Quer fazer um tutorial rápido, de cerca de 2 minutos, contra O Treinador? Você pode pular a qualquer momento e refazer depois em "Como jogar".</p>
      <p><button type="button" class="principal" data-acao="tut-iniciar">Fazer o tutorial</button> <button type="button" data-acao="tut-recusar">Pular</button></p></div></div>`;
  }

  // Dica do tutorial com o alvo destacado (o resto da tela escurece)
  function coachHtml() {
    const d = st.tutorial && st.tutorial.dica;
    if (!d) return `<div class="coach-barra"><button type="button" class="mini" data-acao="tut-pular">Pular tutorial</button></div>`;
    return `<div class="coach-foco" id="coach-foco" aria-hidden="true"></div>
      <div class="coach" id="coach" role="status"><p>${UI.esc(d.texto)}</p>
        <p><button type="button" class="principal" data-acao="tut-ok">Entendi</button> <button type="button" class="mini" data-acao="tut-pular">Pular tutorial</button></p></div>`;
  }
  function posicionarCoach() {
    const d = st.tutorial && st.tutorial.dica; if (!d) return;
    const alvo = Array.from(document.querySelectorAll(d.alvo)).find(x => x.offsetParent !== null) || document.querySelector(d.alvo), foco = document.getElementById('coach-foco'), c = document.getElementById('coach');
    if (!alvo || !foco || !c) return;
    try { alvo.scrollIntoView({ block: 'center' }); } catch (e) { /* tudo bem */ }
    const r = alvo.getBoundingClientRect(), m = 6;
    foco.style.cssText = `left:${r.left - m}px;top:${r.top - m}px;width:${r.width + 2 * m}px;height:${r.height + 2 * m}px`;
    // O balão fica do lado de fora do destaque, onde houver mais espaço
    const abaixo = innerHeight - r.bottom, acima = r.top;
    c.style.left = Math.max(8, Math.min(innerWidth - c.offsetWidth - 8, r.left + r.width / 2 - c.offsetWidth / 2)) + 'px';
    c.style.top = Math.max(8, Math.min(innerHeight - c.offsetHeight - 8, abaixo >= acima ? r.bottom + 12 : r.top - c.offsetHeight - 12)) + 'px';
  }

  return { iniciar, comecarRodada, dicaOk, aposResultado, pular, fimDoTutorial, painelFim, conviteHtml, coachHtml, posicionarCoach, ROTEIRO };
})();
