// ============================================================
// INTERFACE: COMBATE (V4.1)
// Um toque por rodada:
//   1. comecarRodada: omamoris de início, completa a mão, a IA decide (o Trapaceiro anuncia)
//   2. fase "escolha": tocar numa carta joga (sem confirmar, a não ser com a opção "Confirmar jogada").
//      Escolhas de efeito (naipe do Rascunho, carta do Testamento, o que guardar) aparecem numa linha de botões na mesa.
//   3. fase "animando": "Jo… Ken… Pô!" (na Blitz, "Jo… Ken… Blitz!"), as cartas viram, dano e efeitos
//   4. fase "revelacao": o resultado fica na mesa e a próxima rodada começa sozinha em cerca de 1,5 segundo.
//      Um toque pula a espera (e, na animação, pula a animação). No fim do combate, um botão só: "Continuar".
// Mesa em coluna (igual no computador e no celular): trilha, inimigo, odds dele, mesa (sua carta à esquerda),
// você e a mão. As odds do próprio jogador não aparecem.
// ============================================================
(function () {
  const { st, prefs, esc, cartaHtml, oddsHtml, vidaHtml, blitzHtml, contadoresHtml, omamorisHtml, colorirSimbolos, velFator, forma } = UI;
  const est = () => st.estado;

  // ---------- Animação: controle de tempo ----------
  let seq = 0, pular = false, pendentes = [], timerAvanco = null;
  function esperar(ms) {
    return new Promise(ok => {
      if (pular) return ok();
      const t = setTimeout(() => { pendentes = pendentes.filter(p => p.t !== t); ok(); }, ms * velFator());
      pendentes.push({ t, ok });
    });
  }
  function pularAnimacao() { pular = true; pendentes.splice(0).forEach(p => { clearTimeout(p.t); p.ok(); }); }
  function cancelarAnimacao() {
    seq++; clearTimeout(timerAvanco); timerAvanco = null;
    pendentes.splice(0).forEach(p => { clearTimeout(p.t); p.ok(); });
    document.querySelectorAll('.flash, .aviso-blitz').forEach(n => n.remove());
    document.body.classList.remove('tremer');
  }

  // ---------- Início do combate e da rodada ----------
  function abrirCombate(estado) {
    cancelarAnimacao();
    st.estado = estado; st.fase = 'escolha'; st.ultimo = null; st.modal = null; st.prompt = null; st.selecionado = null; st.tela = 'combate'; st.historico = [];
    st.vidaView = { jogador: estado.jogador.vida, inimigo: estado.inimigo.vida };
    comecarRodada();
  }

  function comecarRodada() {
    if (st.tutorial && st.tutorial.ativo) { Tutorial.comecarRodada(); return; }
    cancelarAnimacao();
    const e = est();
    Motor.iniciarRodada(e);
    st.selecionado = null; st.prompt = null; st.ultimo = null;
    st.vidaView = { jogador: e.jogador.vida, inimigo: e.inimigo.vida };
    if (e.fim) { fimDeCombate(); return; }
    IA.preparar(e);
    st.fase = 'escolha';
    UI.desenhar();
    if (e.blitzComecouAgora) avisoBlitz();
    Dicas.checarMao(); if (e.inimigoDef.tipo === 'chefao') Dicas.mostrar('chefao');
    if (e.modo === 'aberta') Dicas.mostrar('secreta');
    if (e.rodada === 1) Dicas.mostrar('ritmo');
    // Sem carta para escolher (ou carta sorteada): a rodada segue sozinha
    if (e.jogador.aleatoria || !Motor.jogaveis(e, e.jogador).length) setTimeout(() => { if (st.estado === e && st.fase === 'escolha') jogar(0, {}); }, 700 * velFator());
  }

  // Passa para a próxima rodada (ou para o fim do combate) logo, sem esperar o tempo
  function avancar() {
    clearTimeout(timerAvanco); timerAvanco = null;
    if (st.tela !== 'combate' || st.fase !== 'revelacao') return;
    const e = est();
    if (e.pendente || st.prompt || e.telaFim) return;
    if (e.fim) { contabilizar(); telaFimCombate(); } else comecarRodada();
  }
  // Depois do resultado: a próxima rodada começa sozinha em cerca de 1,5 segundo (fora do tutorial)
  function agendarAvanco() {
    clearTimeout(timerAvanco); timerAvanco = null;
    if (st.tutorial) return;
    const e = est();
    if (e.pendente || st.prompt) return;
    timerAvanco = setTimeout(avancar, velFator() === 0 ? 30 : 1500 * velFator());
  }
  // Toque em qualquer lugar da mesa: pula a animação ou a espera
  function toque() {
    if (st.fase === 'animando') pularAnimacao();
    else if (st.fase === 'revelacao') avancar();
  }

  // ---------- Seleção e jogada ----------
  const livresAtuais = () => {
    const l = Motor.jogaveis(est(), est().jogador), perm = st.tutorial && st.tutorial.permitidas;
    return perm ? l.filter(c => perm.indexOf(c.def.id) >= 0) : l;
  };
  // Tocar na carta joga. Com "Confirmar jogada" ligada, o primeiro toque seleciona e o segundo joga.
  function selecionar(uid) {
    const e = est();
    if (st.fase !== 'escolha' || e.jogador.aleatoria || e.escolhaSecreta) return;
    if (st.prompt && st.prompt.tipo.indexOf('escolha') === 0) st.prompt = null;
    if (!prefs.confirmar || st.selecionado === uid) { st.selecionado = uid; confirmarCarta(); return; }
    st.selecionado = uid; Som.tocar('clique'); UI.desenhar();
  }
  // Cartas que pedem uma decisão ao jogar (Rascunho, Testamento) abrem uma linha de botões antes
  function confirmarCarta() {
    if (st.fase !== 'escolha') return;
    const e = est(), c = e.jogador.mao.find(x => x.uid === st.selecionado);
    if (!c) return;
    const tipo = Motor.escolhasNecessarias(c);
    if (tipo === 'naipe') { st.prompt = { tipo: 'escolha-naipe', uid: c.uid }; UI.desenhar(); return; }
    if (tipo === 'carta') {
      const lista = listaTestamento(c);
      if (lista.length) { st.prompt = { tipo: 'escolha-carta', uid: c.uid, lista: lista.map(x => x.uid) }; UI.desenhar(); return; }
    }
    jogar(c.uid, {});
  }
  const listaTestamento = c => est().jogador.cemiterio.concat(c.params.cortadas ? est().jogador.cortadas : []).filter(x => x.efeito && x.efeito !== 'testamento');

  function jogar(uid, escolhasJ) {
    if (st.fase !== 'escolha') return;
    const e = est();
    st.maoAntes = e.jogador.mao.slice();   // a mão antes do descarte, para mostrar o que sobrou e o que foi descartado
    st.ultimo = Motor.resolverRodada(e, uid || 0, escolhasJ || {});
    st.selecionado = null;
    animar(st.ultimo);
  }

  // Omamoris com ação: Cartola (troca uma carta pela do topo do deck) e Caderno (guarda 1 carta no fim do turno)
  function usarCartola(uid) { if (Motor.usarCartola(est(), 'jogador', uid)) { st.prompt = null; st.selecionado = null; Som.tocar('revelar'); } UI.desenhar(); }
  function pedirCaderno() { if (Motor.pedirCaderno(est(), 'jogador')) Som.tocar('clique'); UI.desenhar(); }

  // ---------- Telas ----------
  // Um lado da mesa. Antes da revelação mostra a carta escolhida (ou o costas do oponente); depois, a carta que vira.
  function ladoHtml(quem, modo, u) {
    const e = est(), final = modo === 'final', revel = modo !== 'pre';
    const ehJ = quem === 'jogador', nome = ehJ ? 'Você' : e.inimigo.nome;
    let cls = '', conteudo;
    if (revel) {
      const info = u[quem], d = u.detalhes;
      if (final) {
        if (u.resultado === 'empate') cls = 'empate';
        else if ((u.resultado === 'vitoria') === ehJ) cls = 'vence'; else cls = 'perde';
        if (d.cortada && d.cortada[quem]) cls += ' cortada';
        if (d.fragil && d.fragil[quem]) cls += ' fragilizada';
      }
      const c = info.carta;
      const carta = c ? cartaHtml(c, { naipe: info.naipe, tam: 'arena' }) : '<div class="carta vazia arena"><span class="c-nome">sem carta</span></div>';
      conteudo = `<div class="flip ${final ? '' : 'virada'}"><div class="face frente">${carta}</div><div class="face verso"><span>?</span></div></div>`;
    } else if (ehJ) {
      const sel = e.jogador.mao.find(c => c.uid === st.selecionado);
      conteudo = e.jogador.aleatoria ? '<div class="slot-vazio">Sua carta será sorteada</div>' : sel ? cartaHtml(sel, { tam: 'arena', semRef: true }) : '<div class="slot-vazio" data-tip="ui:slotJogador">Sua carta</div>';
      cls = sel ? 'cheio' : 'vago';
    } else {
      const tem = !!(e.decisaoIA && e.decisaoIA.uid != null);
      conteudo = tem ? '<div class="carta costas oponente arena"><span class="lc-t">Escolhida</span></div>' : '<div class="slot-vazio">Sem carta</div>';
      cls = tem ? 'cheio' : 'vago';
    }
    return `<div class="lado" id="lado-${quem}" data-lado="${quem}"><div class="rotulo">${esc(nome)}</div><div class="slot ${cls}" id="slot-${quem}">${conteudo}</div></div>`;
  }

  // Mão do oponente. Normal: costas, e a carta virada para cima onde ela está Marcada.
  // Mão aberta: todas as cartas à vista (com o efeito ao parar o mouse), menos as Secretas, que ficam viradas.
  function maoOponenteHtml() {
    const e = est(), mao = e.inimigo.mao, aberta = e.modo === 'aberta';
    let itens, leg;
    if (aberta) {
      const secretas = mao.filter(c => Motor.ehSecreta(e, c)).length;
      itens = mao.map(c => Motor.ehSecreta(e, c)
        ? '<div class="carta costas oponente ini" aria-label="Carta Secreta"><span class="lc-t">Secreta</span></div>'
        : `<div class="ini-vista">${cartaHtml(c, { tam: 'ini' })}</div>`).join('');
      leg = `${mao.length} ${mao.length === 1 ? 'carta' : 'cartas'} à vista${secretas ? ` · ${secretas} Secreta${secretas > 1 ? 's' : ''}` : ''}`;
      const noTopo = e.inimigo.deck.filter(c => c.marcada).length;
      if (noTopo) leg += ` · ${noTopo} revelada${noTopo > 1 ? 's' : ''} no deck`;
      return `<div class="mao-ini aberta" data-tip="ui:maoOponente" aria-label="Mão do oponente: ${leg}"><div class="mao-ini-cartas">${itens || '<em class="info">Mão vazia</em>'}</div><div class="info mao-ini-leg">${leg}</div></div>`;
    }
    const vistas = mao.filter(c => c.marcada);
    itens = mao.slice(0, 9).map(c => {
      if (c.marcada) {
        const n = c.naipe;
        return `<span class="mini-carta visivel n-${n}" data-cref="${Tips.registrarCarta(c)}" tabindex="0" aria-label="${esc(c.nome)}, marcada"><i class="mc-h">${forma(n, 12)}</i><b>${esc(c.nome)}</b></span>`;
      }
      return '<span class="mini-carta costas-m" aria-hidden="true"></span>';
    }).join('');
    const noTopo = e.inimigo.deck.filter(c => c.marcada).length;
    leg = `${mao.length} ${mao.length === 1 ? 'carta' : 'cartas'}${vistas.length ? ` · ${vistas.length} Marcada${vistas.length > 1 ? 's' : ''}` : ''}${noTopo ? ` · ${noTopo} Marcada${noTopo > 1 ? 's' : ''} no deck` : ''}`;
    return `<div class="mao-ini" data-tip="ui:maoOponente" tabindex="0" aria-label="Mão do oponente: ${leg}"><div class="mao-ini-cartas">${itens || '<em class="info">Mão vazia</em>'}</div><div class="info mao-ini-leg">${leg}</div></div>`;
  }

  // Balão do Trapaceiro (o único que anuncia): o naipe (ou a carta, na Mão aberta) que ele diz que vai jogar.
  // A regra dele nunca aparece: só a pista.
  function balaoHtml() {
    const e = est(), def = e.inimigoDef, a = e.anuncio;
    if (def.anuncio !== 'mentira') return '';
    let t;
    if (a && a.cartaNome) t = '“Vou jogar ' + a.cartaNome + '”';
    else if (a && a.naipe) t = '“Vou de ' + NAIPES[a.naipe].nome.toLowerCase() + '”';
    else t = 'Sem anúncio';
    const ic = a && a.naipe ? forma(a.naipe, 22) : '';
    const verdade = st.fase === 'revelacao' && st.ultimo && st.ultimo.detalhes.anuncio ? st.ultimo.detalhes.anuncio.verdade : null;
    const veredito = verdade === null || verdade === undefined ? '' : `<span class="veredito ${verdade ? 'v-verdade' : 'v-mentira'}">${verdade ? 'Verdade' : 'Mentira'}</span>`;
    return `<div class="balao-op" data-tip="ui:anuncioChefao" tabindex="0">${ic}<div><div class="bt">${esc(t)} ${veredito}</div><div class="bs">${esc(e.inimigoDef.pista || '')}</div></div></div>`;
  }

  // Poder do chefão (ou regra do sub-chefe) embaixo do nome
  function poderHtml() {
    const e = est(), def = e.inimigoDef;
    if (def.tipo === 'chefao' && def.poder) return `<div class="regra-ini" data-tip="ui:poderChefao" tabindex="0"><b>${esc(def.poderNome)}:</b> ${esc(def.poder)}${def.pista ? ` <i>“${esc(def.pista)}”</i>` : ''}</div>`;
    if (def.regra) return `<div class="regra-ini" data-tip="regra:regraInimigo" tabindex="0"><b>${def.tipo === 'sub' ? 'Sub-chefe' : 'Regra'}:</b> ${esc(def.regra)}</div>`;
    return '';
  }

  // Linha de botões da mesa: escolhas de efeito (sem janela) e, se ligada, a confirmação
  function linhaEscolhaHtml() {
    const e = est(), j = e.jogador, p = st.prompt;
    const chip = (c, acao, sel) => `<button type="button" class="chip n-${c.naipe === 'curinga' ? 'curinga' : c.def.naipe === 'nenhum' ? 'nenhum' : c.naipe} ${sel ? 'sel' : ''}" data-acao="${acao}" data-uid="${c.uid}" data-cref="${Tips.registrarCarta(c)}">${forma(c.def.naipe === 'nenhum' ? 'nenhum' : c.naipe, 14)} ${esc(c.nome)}</button>`;
    let corpo = '';
    if (e.escolhaSecreta && st.fase === 'escolha') {
      const cand = j.mao.filter(c => !Motor.ehSecreta(e, c));
      corpo = `<span class="el-t">Bilhete: escolha ${e.escolhaSecreta === 1 ? '1 carta' : e.escolhaSecreta + ' cartas'} para ficar Secreta${e.escolhaSecreta === 1 ? '' : 's'}:</span>${cand.map(c => chip(c, 'tapar')).join('')}`;
    } else if (p && p.tipo === 'escolha-naipe') {
      corpo = `<span class="el-t">Rascunho: a carta que você compra no próximo turno é de qual naipe?</span>${BASE.map(n => `<button type="button" class="chip n-${n}" data-acao="prompt-jogar" data-chave="naipe" data-valor="${n}">${forma(n, 14)} ${NAIPES[n].nome}</button>`).join('')}<button type="button" class="mini" data-acao="prompt-cancelar">Voltar</button>`;
    } else if (p && p.tipo === 'escolha-carta') {
      const cartas = p.lista.map(uid => j.cemiterio.concat(j.cortadas).find(c => c.uid === uid)).filter(Boolean);
      corpo = `<span class="el-t">Testamento: a próxima carta ganha o efeito de qual carta?</span>${cartas.map(c => chip(c, 'prompt-carta')).join('')}<button type="button" class="mini" data-acao="prompt-cancelar">Voltar</button>`;
    } else if (p && p.tipo === 'guardar' && e.pendente) {
      const pend = e.pendente, sel = p.sel;
      corpo = `<span class="el-t">Guarde ${pend.n === 1 ? '1 carta' : pend.n + ' cartas'} (ficam na mão e contam nas ${e.jogador.baseMao}):${pend.marca ? ' as guardadas ficam Marcadas.' : ''}</span>${pend.candidatos.map(c => chip(c, 'guardar-sel', sel.indexOf(c.uid) >= 0)).join('')}<button type="button" class="principal" data-acao="guardar-ok" ${sel.length === pend.n ? '' : 'disabled'}>Guardar ${sel.length} de ${pend.n}</button>`;
    } else if (p && p.tipo === 'cartola') {
      corpo = `<span class="el-t">Cartola: troque qual carta da mão pela do topo do deck?</span>${j.mao.filter(c => !c.def.nuncaDescarta).map(c => chip(c, 'prompt-cartola')).join('')}<button type="button" class="mini" data-acao="prompt-cancelar">Voltar</button>`;
    } else if (prefs.confirmar && st.fase === 'escolha' && st.selecionado != null) {
      const c = j.mao.find(x => x.uid === st.selecionado);
      if (c) corpo = `<button type="button" class="principal" data-acao="confirmar" data-tip="ui:confirmar">Jogar ${esc(c.nome)}</button>`;
    }
    return corpo ? `<div class="escolha-linha" role="group" aria-label="Escolha">${corpo}</div>` : '';
  }

  // Tela de fim de combate: um botão só
  function fimHtml() {
    const e = est();
    if (st.tutorial) return Tutorial.painelFim();
    const t = { vitoria: ['Vitória!', 'Você derrubou ' + e.inimigo.nome + '.'], derrota: ['Derrota', 'Você caiu para ' + e.inimigo.nome + '.'], empate: ['Empate', 'Ninguém levou a melhor.'] }[e.fim];
    const chefaoRevanche = st.run && e.inimigoDef.tipo === 'chefao' && e.fim !== 'vitoria' && !st.run.fim;
    return `<div class="fim"><div role="dialog" aria-label="${t[0]}"><h2>${t[0]}</h2><p>${esc(t[1])}</p>
      <p>Vida: você ${Math.max(0, e.jogador.vida)} × ${Math.max(0, e.inimigo.vida)} ${esc(e.inimigo.nome)}</p>
      ${st.run ? `<p class="info">${esc(st.textoRun)}</p>` : ''}${chefaoRevanche ? '<p class="aviso-save">Chefão: você vai lutar de novo.</p>' : ''}
      <button type="button" class="principal" data-acao="${st.run ? 'seguirrun' : 'menu'}">Continuar</button></div></div>`;
  }

  function telaCombate() {
    const e = est(), ini = e.inimigo, p = e.jogador, def = e.inimigoDef, aberta = e.modo === 'aberta';
    const livres = livresAtuais();
    const modo = st.fase === 'animando' ? 'animado' : st.fase === 'revelacao' ? 'final' : 'pre';
    const jogavel = st.fase === 'escolha' && !p.aleatoria && !e.escolhaSecreta;
    // Resultado, no meio da mesa
    let resultado = '<p class="frase" id="frase"></p>';
    if (st.fase === 'revelacao') {
      const u = st.ultimo;
      const txt = { vitoria: 'Você venceu a rodada!', derrota: 'Você perdeu a rodada.', empate: 'Empate.' }[u.resultado];
      resultado = `<div class="headline ${u.resultado}">${txt}</div><p class="frase aparece" id="frase">${colorirSimbolos(esc(u.detalhes.frase))}</p>`;
    } else if (st.fase === 'escolha') {
      if (p.aleatoria) resultado = '<p class="frase aparece" id="frase">Sua carta será sorteada!</p>';
      else if (!livres.length) resultado = '<p class="frase aparece" id="frase">Você não tem nenhuma carta jogável.</p>';
      else if (e.escolhaSecreta) resultado = '<p class="frase aparece" id="frase">Escolha a carta que fica Secreta.</p>';
      else resultado = `<p class="frase aparece dica-toque" id="frase">${prefs.confirmar ? 'Escolha uma carta' : 'Toque numa carta para jogar'}</p>`;
    }
    // Depois de jogar, a mão antes do descarte continua na tela: a carta jogada sai, as guardadas ficam e as descartadas esmaecem
    const jogada = st.fase !== 'escolha' && st.ultimo ? st.ultimo.jogador.carta : null;
    const base = st.fase !== 'escolha' && st.maoAntes ? st.maoAntes.filter(c => c !== jogada) : p.mao;
    const n = base.length;
    const mao = base.map((c, i) => `<div class="cl ${st.fase !== 'escolha' && p.mao.indexOf(c) < 0 ? 'descartada' : ''}" style="--i:${i};--n:${n}">${cartaHtml(c, {
      acao: 'selecionar', selecionada: c.uid === st.selecionado, desativada: !jogavel || livres.indexOf(c) < 0
    })}</div>`).join('');
    const emblema = `<span class="emblema" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 20 20"><path d="M10 2 L18 17 H2 Z" fill="#e05a2b"/><rect x="6" y="11" width="8" height="2" fill="#3b2733"/></svg></span>`;
    // Botões dos omamoris com ação
    const tools = [];
    if (st.fase === 'escolha') {
      if (p.omamoris.indexOf('cartola') >= 0 && !p.usos.cartola && !p.aleatoria) tools.push('<button type="button" class="mini" data-acao="cartola" data-tip="ui:cartola">Usar Cartola</button>');
      if (p.omamoris.indexOf('caderno') >= 0 && !p.usos.caderno) tools.push(p.usos.cadernoPedido ? '<span class="info">Caderno: guarda 1 carta no fim do turno</span>' : '<button type="button" class="mini" data-acao="caderno" data-tip="ui:caderno">Usar Caderno</button>');
    }
    const moedasInfo = st.run ? `<span class="info moedas-linha">Moedas <b class="moeda-n">● ${st.run.moedas}</b>${p.moedas ? ` (+${p.moedas})` : ''}</span>` : '';
    const tutBotao = st.tutorial && st.fase === 'revelacao' ? `<div class="tut-continuar"><button type="button" class="principal" data-acao="${e.fim ? 'terminar' : 'proxima'}">${e.fim ? 'Ver resultado' : 'Próxima rodada'}</button></div>` : '';

    UI.moldura(`${st.run ? UI.trilhaCompacta() : ''}
      <div class="combate fase-${st.fase} ${aberta ? 'mao-aberta' : ''}" data-fase="${st.fase}">
        <section class="painel cb-ini" aria-label="Oponente">
          <div class="ini-topo">
            <div class="quem">${emblema}<div><div class="nome">${esc(ini.nome)}</div><div class="info personalidade">${esc(def.tendencia || '')}${def.arq ? ' · ' + esc(def.arq) : ''}</div></div></div>
            ${vidaHtml('inimigo')}
            ${contadoresHtml(ini, 'inimigo', false)}
          </div>
          ${poderHtml()}
          <div class="ini-mao">${maoOponenteHtml()}${balaoHtml()}</div>
        </section>
        <section class="cb-odds" aria-label="Odds do oponente">
          <div class="cab-p"><span class="lbl">${aberta ? 'Odds do deck dele' : 'Odds dele'}</span><span class="info">${aberta ? 'próximas compras' : 'deck + mão'}</span></div>
          ${oddsHtml(ini, 'oddsInimigo')}
        </section>
        <div class="mesa-wrap">
          <section class="mesa" id="arena" aria-label="Mesa">
            ${ladoHtml('jogador', modo, st.ultimo)}
            <div class="mesa-centro">${blitzHtml()}<div class="contagem" id="contagem"></div>${resultado}</div>
            ${ladoHtml('inimigo', modo, st.ultimo)}
          </section>
          ${linhaEscolhaHtml()}
        </div>
        <section class="mao-area c-mao" data-tip="ui:mao"><div class="mao" role="group" aria-label="Sua mão">${mao || '<em class="info mao-vazia">Sem cartas na mão.</em>'}</div></section>
        <section class="painel cb-eu" aria-label="Você">
          <div class="eu-topo"><b class="eu-nome">Você</b>${vidaHtml('jogador')}${p.omamoris.length ? omamorisHtml(p.omamoris) : ''}${moedasInfo}</div>
          <div class="eu-baixo">${contadoresHtml(p, 'jogador', true)}${tools.length ? `<span class="tools">${tools.join(' ')}</span>` : ''}</div>
        </section>
        ${tutBotao}
      </div>${st.tutorial ? Tutorial.coachHtml() : ''}${e.telaFim ? fimHtml() : ''}`);
  }
  UI.telas.combate = telaCombate;

  // ---------- Animação da revelação ----------
  function setVida(lado, valor) {
    st.vidaView[lado] = valor;
    const n = document.getElementById('vida-num-' + lado), b = document.getElementById('vida-pips-' + lado);
    if (n) n.textContent = Math.max(0, valor);
    if (b) b.querySelectorAll('.pip').forEach((el, i) => el.classList.toggle('e', i >= valor));
  }
  function flutuar(lado, txt, classe) {
    const caixa = document.getElementById('flut-' + lado); if (!caixa) return;
    const s = document.createElement('span'); s.className = 'flut ' + classe; s.textContent = txt;
    caixa.appendChild(s); setTimeout(() => s.remove(), 1600 * Math.max(velFator(), 0.3));
  }
  function carimbar(lado, txt, cor) {
    const alvo = document.getElementById('lado-' + lado); if (!alvo) return;
    const c = document.createElement('div'); c.className = 'carimbo ' + cor; c.textContent = txt; c.setAttribute('role', 'status');
    alvo.appendChild(c);
  }
  function dividirCarta(slot) {   // a carta cortada se divide em duas metades que se afastam
    const alvo = slot.querySelector('.frente .carta'); if (!alvo) return;
    const caixa = alvo.getBoundingClientRect(), pai = slot.getBoundingClientRect();
    ['a', 'b'].forEach(k => {
      const m = alvo.cloneNode(true); m.removeAttribute('data-cref'); m.classList.add('metade', 'metade-' + k);
      m.style.cssText = `position:absolute;left:${caixa.left - pai.left}px;top:${caixa.top - pai.top}px;width:${caixa.width}px;height:${caixa.height}px;margin:0`;
      slot.appendChild(m);
    });
    alvo.style.visibility = 'hidden';
  }

  async function animar(u) {
    const id = ++seq; pular = false;
    if (velFator() === 0) { finalizar(u); return; }
    const d = u.detalhes;
    st.fase = 'animando';
    st.vidaView = { jogador: d.vidaAntes.jogador, inimigo: d.vidaAntes.inimigo };
    UI.desenhar();
    const vivo = () => id === seq;
    const arena = document.getElementById('arena'), cont = document.getElementById('contagem');
    const slotDe = lado => document.getElementById('slot-' + lado);
    // 1. "Jo… Ken… Pô!" (na Blitz, "Jo… Ken… Blitz!"): menos de 1 segundo
    for (const t of ['Jo…', 'Ken…', d.blitz ? 'Blitz!' : 'Pô!']) {
      cont.textContent = t; cont.classList.remove('bate'); void cont.offsetWidth; cont.classList.add('bate');
      Som.tocar('tic'); await esperar(220); if (!vivo()) return;
    }
    // 2. As duas cartas viram ao mesmo tempo
    cont.textContent = ''; cont.classList.remove('bate');
    arena.querySelectorAll('.flip').forEach(f => f.classList.remove('virada'));
    Som.tocar('revelar'); await esperar(380); if (!vivo()) return;
    // 3. Dinamite
    if (d.dinamite) { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); document.body.classList.add('tremer'); Som.tocar('explosao'); setTimeout(() => { f.remove(); document.body.classList.remove('tremer'); }, 500 * Math.max(velFator(), 0.3)); await esperar(450); if (!vivo()) return; }
    // 4. Choque: a vencedora cresce, a perdedora treme e esmaece; no empate as duas recuam
    ['jogador', 'inimigo'].forEach(q => {
      const s = slotDe(q);
      if (u.resultado === 'empate') s.classList.add('empate'); else s.classList.add((u.resultado === 'vitoria') === (q === 'jogador') ? 'vence' : 'perde');
    });
    await esperar(320); if (!vivo()) return;
    // 5. Carimbos: Frágil, Cortada, fica na mão, Marcada
    const carimbos = [];
    ['jogador', 'inimigo'].forEach(q => {
      if (d.cortada[q]) { dividirCarta(slotDe(q)); carimbos.push([q, 'Cortada', 'vermelho']); slotDe(q).classList.add('cortada'); }
      else if (d.fragil[q]) carimbos.push([q, 'Frágil: vai às Cortadas', 'cinza']);
      if (d.fica[q]) carimbos.push([q, 'Fica na mão', 'verde']);
      if (d.marcada[q]) carimbos.push([q, 'Estava Marcada', 'ciano']);
    });
    if (carimbos.length) { carimbos.forEach(c => carimbar(c[0], c[1], c[2])); Som.tocar('revelar'); await esperar(500); if (!vivo()) return; }
    // 6. Números de dano e cura e barras de vida
    ['jogador', 'inimigo'].forEach(q => {
      if (d.dano[q] > 0) { flutuar(q, '-' + d.dano[q], 'dano'); Som.tocar('dano'); const n = document.getElementById('vida-num-' + q); if (n) n.classList.add('tremor'); }
      if (d.cura[q] > 0) { flutuar(q, '+' + d.cura[q], 'cura'); Som.tocar('cura'); }
      setVida(q, d.vidaDepois[q]);
    });
    await esperar(450); if (!vivo()) return;
    // 7. A frase que resume a rodada
    const fr = document.getElementById('frase');
    if (fr) { fr.innerHTML = colorirSimbolos(esc(d.frase)); fr.classList.add('aparece'); }
    Som.tocar({ vitoria: 'vitoria', derrota: 'derrota', empate: 'empate' }[u.resultado]);
    await esperar(150); if (!vivo()) return;
    finalizar(u);
  }

  function finalizar(u) {
    const e = est(), d = u.detalhes;
    st.vidaView = { jogador: d.vidaDepois.jogador, inimigo: d.vidaDepois.inimigo };
    st.fase = 'revelacao';
    st.historico.push({ rodada: e.rodada, res: u.resultado, frase: d.frase });
    if (st.tutorial) Tutorial.aposResultado();
    if (e.pendente) st.prompt = { tipo: 'guardar', sel: [] };
    UI.desenhar();
    UI.sr.textContent = 'Rodada ' + e.rodada + '. ' + d.frase + (e.fim ? ' Fim do combate.' : '');
    if (velFator() === 0) Som.tocar({ vitoria: 'vitoria', derrota: 'derrota', empate: 'empate' }[u.resultado]);
    // Dicas de primeira vez
    if (d.fragil.jogador) Dicas.mostrar('fragil');
    if (d.marcada.jogador || d.marcada.inimigo) Dicas.mostrar('marcada');
    agendarAvanco();
  }

  function avisoBlitz() {
    if (velFator() === 0) return;
    const a = document.createElement('div'); a.className = 'aviso-blitz'; a.setAttribute('aria-hidden', 'true'); a.textContent = 'BLITZ!';
    document.body.appendChild(a); Som.tocar('blitz'); setTimeout(() => a.remove(), 1000 * velFator());
  }

  // ---------- Fim do combate ----------
  function fimDeCombate() {
    // Fim direto (ex.: dano de omamori no início da rodada): mostra só o resultado final
    const e = est();
    st.fase = 'revelacao';
    st.ultimo = { resultado: e.fim === 'vitoria' ? 'vitoria' : e.fim === 'derrota' ? 'derrota' : 'empate', jogador: { carta: null, naipe: null }, inimigo: { carta: null, naipe: null },
      eventos: e.log.slice(-3), fim: e.fim, detalhes: { frase: 'O combate terminou antes da rodada.', vidaDepois: { jogador: e.jogador.vida, inimigo: e.inimigo.vida }, dano: {}, cura: {}, cortada: {}, fragil: {}, fica: {}, marcada: {}, anuncio: null } };
    contabilizar(); telaFimCombate();
  }
  function contabilizar() {
    const e = est();
    if (!st.run || e.contabilizado) return;
    e.contabilizado = true;
    st.textoRun = Run.terminarCombate(st.run, e);
    if (st.run.fim) Run.apagarSave(); else { const t = st.tela; st.tela = 'combate-fim'; UI.salvar(); st.tela = t; }
  }
  function telaFimCombate() {
    const e = est();
    e.telaFim = true;
    UI.desenhar();
    if (st.tutorial) { Som.tocar('vitoria'); return; }
    Som.tocar({ vitoria: 'vitoria', derrota: 'derrota', empate: 'empate' }[e.fim]);
  }

  // As escolhas de efeito aparecem na linha da mesa (ver linhaEscolhaHtml); o modal só existe para o limite de omamoris
  UI.promptHtml = function () { return ''; };

  UI.aposDesenhar = () => { if (st.tutorial) Tutorial.posicionarCoach(); };
  UI.combate = { livresAtuais, abrirCombate, comecarRodada, selecionar, confirmarCarta, jogar, usarCartola, pedirCaderno, pularAnimacao, cancelarAnimacao,
    contabilizar, telaFimCombate, avancar, toque,
    aoPrompt(acao, d) {
      const e = est();
      if (acao === 'prompt-jogar') { const esc2 = {}; esc2[d.chave] = d.valor; const uid = st.prompt.uid; st.prompt = null; jogar(uid, esc2); }
      else if (acao === 'prompt-carta') { const uid = st.prompt.uid; st.prompt = null; jogar(uid, { cartaUid: Number(d.uid) }); }
      else if (acao === 'prompt-cartola') usarCartola(Number(d.uid));
      else if (acao === 'cartola') { st.prompt = { tipo: 'cartola' }; UI.desenhar(); }
      else if (acao === 'prompt-cancelar') { st.prompt = null; st.selecionado = null; UI.desenhar(); }
      else if (acao === 'tapar') { if (Motor.taparCarta(e, Number(d.uid))) Som.tocar('clique'); UI.desenhar(); }
      else if (acao === 'guardar-sel') {
        const p = st.prompt, uid = Number(d.uid), i = p.sel.indexOf(uid);
        if (i >= 0) p.sel.splice(i, 1); else if (p.sel.length < e.pendente.n) p.sel.push(uid);
        UI.desenhar();
      } else if (acao === 'guardar-ok') {
        Motor.concluirRodada(e, st.prompt.sel); st.prompt = null; Som.tocar('clique'); UI.desenhar(); agendarAvanco();
      }
    },
    guardarAuto() { const e = est(); if (e.pendente) { Motor.concluirRodada(e, e.pendente.candidatos.slice(0, e.pendente.n).map(c => c.uid)); st.prompt = null; } }
  };
})();
