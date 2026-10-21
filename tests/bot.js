// Bots que jogam pela API (sem tela): usados nas simulações de run e nas medições.
// politica 'odds': escolhe a carta cujo naipe vence o naipe mais provável do oponente (e usa as Marcadas).
//   Na Mão aberta lê a mão visível do oponente (menos as cartas Secretas), como faz a IA.
// politica 'acaso': escolhe uma carta jogável qualquer.
function criarBot(A) {
  const { Motor, IA, Run, CONFIG, BASE, NAIPES, CARTAS_POR_ID } = A;
  const vencedor = n => BASE.find(x => NAIPES[x].vence === n);

  // Naipe mais provável da próxima jogada do oponente (da IA)
  function provavelDoInimigo(e) {
    const pts = { pedra: 0, papel: 0, tesoura: 0 };
    if (e.modo === 'aberta') {
      const vis = e.inimigo.mao.filter(c => !Motor.ehSecreta(e, c) && pts[c.naipe] !== undefined);
      if (vis.length) { vis.forEach(c => { pts[c.naipe] += 1; }); }
      else { const o = Motor.odds(e.inimigo); BASE.forEach(n => { pts[n] = o[n]; }); }
    } else {
      const o = Motor.odds(e.inimigo); BASE.forEach(n => { pts[n] = o[n]; });
      o.marcadas.forEach(m => { if (pts[m.naipe] !== undefined) pts[m.naipe] += 60; });
    }
    const an = e.anuncio; if (an && an.naipe && e.inimigoDef.anuncio !== 'mentira') pts[an.naipe] += 25;
    return BASE.slice().sort((a, b) => pts[b] - pts[a])[0];
  }

  function escolherCarta(e, politica) {
    const pool = Motor.jogaveis(e, e.jogador);
    if (!pool.length) return null;
    if (politica === 'acaso') return pool[Math.floor(e.rng() * pool.length)];
    const quer = vencedor(provavelDoInimigo(e));
    const valor = c => (c.naipe === quer ? 10 : 0) + ({ comum: 0, rara: 1, lendaria: 2, prismatica: 2, especial: 2, trofeu: 2 }[c.def.raridade]) + (['cutelo', 'ponteiro', 'pedraangular'].indexOf(c.efeito) >= 0 && Motor.blitzAtiva(e) ? 3 : 0) + e.rng() * 0.5;
    return pool.slice().sort((a, b) => valor(b) - valor(a))[0];
  }
  function escolhasDe(e, c) {
    const esc = {};
    if (!c) return esc;
    if (c.def.escolhe === 'naipe') esc.naipe = vencedor(provavelDoInimigo(e));
    if (c.def.escolhe === 'carta') { const l = e.jogador.cemiterio.concat(c.params.cortadas ? e.jogador.cortadas : []).filter(x => x.efeito && x.efeito !== 'testamento'); l.sort((a, b) => (b.params.dano || 0) - (a.params.dano || 0)); if (l[0]) esc.cartaUid = l[0].uid; }
    return esc;
  }

  // Joga um combate inteiro. Devolve o estado final.
  function combate(estado, politica, ganchos) {
    let guard = 0;
    while (!estado.fim && guard++ < 40) {
      Motor.iniciarRodada(estado);
      if (estado.fim) break;
      IA.preparar(estado);
      while (estado.escolhaSecreta > 0) { const c = estado.jogador.mao.find(x => !Motor.ehSecreta(estado, x)); if (!c || !Motor.taparCarta(estado, c.uid)) break; }
      if (ganchos && ganchos.antes) ganchos.antes(estado);
      const c = escolherCarta(estado, politica);
      Motor.resolverRodada(estado, c ? c.uid : 0, escolhasDe(estado, c));
      if (estado.pendente) Motor.concluirRodada(estado, estado.pendente.candidatos.slice(0, estado.pendente.n).map(x => x.uid));
    }
    if (guard >= 40) throw new Error('combate travou');
    return estado;
  }

  const ALVO = CONFIG.run.deckAlvo;   // [14, 18]
  const valorCarta = (run, id) => {
    const d = CARTAS_POR_ID[id], arqs = Run.arquetiposAtivos(run).map(a => a.chave);
    return ({ comum: 0, rara: 2, lendaria: 4, prismatica: 5, especial: 4, trofeu: 4 }[d.raridade]) + (arqs.indexOf(d.arq) >= 0 ? 2 : 0);
  };
  // Compras da Loja: prefere cartas do arquétipo ativo e de raridade maior; omamori; depois upgrade, selo e remoção
  function loja(run, rng) {
    const L = Run.loja(run);
    for (let k = 0; k < 10; k++) {
      let feito = false;
      const cands = L.cartas.map((it, i) => ({ it, i })).filter(x => !x.it.comprada && x.it.preco <= run.moedas && run.deck.length < ALVO[1])
        .sort((a, b) => valorCarta(run, b.it.id) - valorCarta(run, a.it.id));
      if (L.omamori && !L.omamori.comprado && run.moedas >= L.omamori.preco && !Run.omamorisCheios(run) && (run.moedas >= L.omamori.preco + 2 || !cands.length)) { feito = Run.comprarOmamoriLoja(run); }
      else if (cands.length && Run.comprarCarta(run, cands[0].i)) feito = true;
      else {
        const up = run.deck.filter(e => Run.podeUpgrade(run, e.eid)).sort((a, b) => valorCarta(run, b.id) - valorCarta(run, a.id))[0];
        if (up && run.moedas >= Run.precoServico(run, 'upgrade') + 2 && Run.comprarUpgrade(run, up.eid)) feito = true;
        else if (!L.selo.comprado && run.moedas >= L.selo.preco + 3) { const alvo = run.deck.filter(e => !e.mod && CARTAS_POR_ID[e.id].raridade !== 'comum')[0]; if (alvo && Run.comprarSelo(run, alvo.eid)) feito = true; }
        else if (run.deck.length > ALVO[1] && run.moedas >= Run.precoServico(run, 'remover')) { const c = run.deck.filter(e => CARTAS_POR_ID[e.id].raridade === 'comum' && !e.up)[0]; if (c && Run.comprarRemocao(run, c.eid)) feito = true; }
      }
      if (!feito) break;
    }
  }

  // Joga uma run inteira, passando por tudo (Recompensa, Oficina, Lojas, sub-chefe, chefão, Mesa). Devolve a run.
  function runCompleta(semente, politica, opcoes) {
    opcoes = opcoes || {};
    const run = Run.criar({ cfg: CONFIG, semente, modo: opcoes.modo });
    const rng = Motor.criarRng(semente + 12345);
    let guard = 0; const vistos = { loja: 0, sub: 0, chefao: 0, mesa: 0, recompensa: 0, recsub: 0, oficina: 0, espolio: 0, omamori: 0 };
    while (!run.fim && guard++ < 400) {
      const n = run.etapa, t = Run.tipoDaEtapa(run, n);
      if (t === 'sub' && !run.subEscolhido) { const o = Run.subOfertas(run); Run.escolherSub(run, opcoes.sub ? (o.indexOf(opcoes.sub) >= 0 ? opcoes.sub : o[0]) : o[Math.floor(rng() * 2)]); vistos.sub++; }
      if (t === 'chefao') vistos.chefao++;
      const estado = Run.iniciarCombate(run);
      combate(estado, politica);
      Run.terminarCombate(run, estado);
      if (opcoes.aoCombate) opcoes.aoCombate(run, estado, t);
      while (!run.fim && Run.passo(run)) {
        const p = Run.passo(run); vistos[p] = (vistos[p] || 0) + 1;
        if (p === 'omamori') { const o = Run.ofertasOmamoriInicial(run); Run.escolherOmamoriInicial(run, o[0].id); }
        else if (p === 'recompensa') {   // 1 carta grátis entre 3: a de maior valor, a não ser que o deck já esteja cheio
          const r = run.pendente;
          if (run.deck.length >= ALVO[1]) Run.recompensaPular(run);
          else { const i = r.cartas.map((c, k) => ({ k, v: valorCarta(run, c.id) + (CARTAS_POR_ID[c.id].raridade === 'prismatica' && Run.temPrismatica(run) ? -9 : 0) + rng() })).sort((a, b) => b.v - a.v)[0].k; Run.recompensaEscolher(run, i); }
        } else if (p === 'oficina') {
          const e = run.deck.filter(x => Run.podeUpgrade(run, x.eid)).sort((a, b) => valorCarta(run, b.id) - valorCarta(run, a.id))[0];
          if (!e || !Run.oficinaUpgrade(run, e.eid)) Run.oficinaPular(run);
        } else if (p === 'recsub') {
          const r = run.pendente;
          if (r) {
            if (r.tipo === 'lendaria2' || r.tipo === 'omamori2') {
              const id = r.opcoes[0]; Run.aplicarRecompensa(run, id, run.omamoris[0]);
            } else if (r.tipo === 'moedas') Run.aplicarRecompensa(run);
            else if (r.tipo === 'upgrades') {
              if (r.moedas) Run.aplicarRecompensa(run);
              let g2 = 0; while (r.restam > 0 && g2++ < 5) { const e = run.deck.filter(x => Run.podeUpgrade(run, x.eid)).sort((a, b) => valorCarta(run, b.id) - valorCarta(run, a.id))[0]; if (!e || !Run.upgradeGratis(run, e.eid)) break; }
            }
          }
        } else if (p === 'mesa') {
          const ap = Run.mesaApostasPossiveis(run);
          if (ap.length && rng() < (opcoes.mesa != null ? opcoes.mesa : 0.5)) {
            const a = ap[Math.floor(rng() * ap.length)];
            const aposta = a.tipo === 'lendaria' ? { tipo: 'lendaria', eid: Run.lendariasDoDeck(run)[0].eid } : a;
            Run.mesaIniciar(run, aposta);
            let g3 = 0; while (!run.pendente.fim && g3++ < 30) Run.mesaJogar(run, BASE[Math.floor(rng() * 3)]);
            if (run.pendente.fim === 'vitoria') Run.mesaPremio(run, Run.mesaPremioOpcoes(run)[0]);
          } else Run.mesaIniciar(run, null);
        } else if (p === 'espolio') {
          const sp = run.pendente;
          if (!sp.garantidoOk) Run.espolioGarantido(run, run.omamoris[0]);
          if (sp.trofeu && run.deck.length < ALVO[1] + 2) Run.espolioEscolher(run, 'carta');
          else if (sp.sorteado) Run.espolioEscolher(run, 'omamori', run.omamoris[0]);
          else Run.espolioEscolher(run, 'carta');
        } else if (p === 'loja') loja(run, rng);
        Run.concluirPasso(run);
      }
    }
    if (guard >= 400) throw new Error('run travou');
    run.vistos = vistos;
    return run;
  }
  return { combate, runCompleta, escolherCarta, escolhasDe, loja };
}
module.exports = { criarBot };
