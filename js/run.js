// ============================================================
// RUN (V4.1): 2 atos de 5 combates, Recompensa, Oficina, Loja, sub-chefes, chefões, Mesa do Apostador e omamoris
// Lógica pura (sem tela). A interface chama estas funções e só desenha o resultado.
//
// Estrutura de um ato: 1 comum, 2 comum, 3 sub-chefe (escolha 1 entre 2), 4 comum, 5 chefão.
// O combate 1 da run é a luta de aquecimento (6 vanillas, 3 de vida).
// Depois de todo combate vem a Recompensa de cartas. Depois dos combates 2 e 4 de cada ato, a Oficina; depois dos
// combates 1, 3 e 5, a Loja. Sub-chefe vencido: recompensa dele antes da Recompensa. Chefão vencido: Espólio primeiro.
// A Mesa do Apostador aparece uma vez, no ato 2, entre a Recompensa e a Loja do sub-chefe.
// Chefão: perder ou empatar faz lutar de novo (revanche).
// ============================================================
const Run = (function () {
  const CHAVE_SAVE = 'jokenblitz_save_v41';
  const CHAVES_ANTIGAS = ['jokenblitz_save_v4', 'jokenblitz_save_v31', 'jokenblitz_save_v3', 'jokenblitz_save_v2', 'jokenblitz_save'];

  // Canais de sorteio: cada tipo de sorteio tem a sua semente, para não mudar um quando outro muda
  const CANAL = { inimigo: 0, sub: 1, chefao: 2, loja: 3, omamori: 4, recompensa: 5, mesa: 6, deck: 7, espolio: 8, cartas: 9 };
  function rngDe(run, etapa, canal, extra) {
    let h = (run.semente >>> 0) ^ Math.imul(etapa + 1, 0x9E3779B1) ^ Math.imul(canal + 7, 0x85EBCA6B) ^ Math.imul((extra || 0) + 3, 0xC2B2AE35);
    h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D); h ^= h >>> 12;
    return Motor.criarRng(h >>> 0);
  }
  const sorteia = (lista, rng) => lista[Math.floor(rng() * lista.length)];
  const defDe = e => CARTAS_POR_ID[e.id];

  // ---------- Criação ----------
  function criar(opcoes) {
    const cfg = opcoes.cfg;
    const run = {
      cfg, semente: opcoes.semente != null ? opcoes.semente : Math.floor(Math.random() * 1e9),
      modo: opcoes.modo === 'aberta' ? 'aberta' : 'normal',   // 'normal' ou 'aberta' (Mão aberta, modo de teste)
      vida: cfg.run.vida, vidaMax: cfg.run.vida,
      vitorias: 0, empates: 0, derrotas: 0,
      etapa: 1, proximoEid: 1, deck: [], omamoris: [], moedas: 0,
      mapa: [],         // um item por combate jogado: { etapa, resultado, inimigo, tipo }
      fila: [],         // passos depois do combate: omamori, espolio, recsub, recompensa, mesa, oficina, loja
      filaTotal: [],
      pendente: null,   // decisão em andamento (recompensa, mesa)
      usos: {},         // marcadores de uso único da run (Seguro, Mesa)
      sub: {},          // sub-chefes: { ato: [idA, idB] } e escolhido
      subEscolhido: null, chefao: {}, revanche: 0, contLoja: 0, loja: null,
      ultimoInimigo: null, ultimoResultado: null,
      stats: { naipes: { pedra: 0, papel: 0, tesoura: 0, nenhum: 0 }, rodadas: 0, vitoriasRodada: 0, cartas: {},
        ganho: { combate: 0, nota: 0, premio: 0, outro: 0 }, gasto: { cartas: 0, upgrade: 0, remover: 0, selo: 0, renovar: 0, omamori: 0, mesa: 0, roubo: 0 }, pulos: { recompensa: 0, oficina: 0 } },
      fim: null         // 'vitoria' | 'derrota'
    };
    ['pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura'].forEach(id => run.deck.push(entrada(run, id)));
    return run;
  }
  function entrada(run, id, extra) { return Object.assign({ eid: run.proximoEid++, id, up: false, mod: null }, extra || {}); }

  // ---------- Etapas, atos e tipos de combate ----------
  const totalEtapas = run => run.cfg.run.atos * run.cfg.run.combatesPorAto;
  const atoDe = (run, n) => Math.floor((n - 1) / run.cfg.run.combatesPorAto) + 1;
  const posDe = (run, n) => ((n - 1) % run.cfg.run.combatesPorAto) + 1;
  function tipoDaEtapa(run, n) {
    const pos = posDe(run, n);
    if (pos === run.cfg.run.combatesPorAto) return 'chefao';
    if (pos === run.cfg.run.subchefeNoCombate) return 'sub';
    return 'comum';
  }
  const ehUltima = (run, n) => n >= totalEtapas(run);

  // ---------- Arquétipo ativo ----------
  function arquetiposAtivos(run) {
    const cont = {};
    run.deck.forEach(e => { const a = defDe(e).arq; if (a) cont[a] = (cont[a] || 0) + 1; });
    return ARQUETIPOS.filter(a => (cont[a] || 0) >= run.cfg.run.arquetipoAtivoCartas).map(a => ({ chave: a, qtd: cont[a] }));
  }
  const temCarta = (run, id) => run.deck.some(e => e.id === id);
  const temPrismatica = run => run.deck.some(e => defDe(e).raridade === 'prismatica');

  // ---------- Inimigos ----------
  function inimigosComuns(run, ato) {
    return Object.keys(INIMIGOS).map(k => INIMIGOS[k]);   // todos aparecem nos dois atos
  }
  function inimigoComum(run, n) {
    if (run.inimigoForcado && INIMIGOS[run.inimigoForcado]) return INIMIGOS[run.inimigoForcado];   // só para testes e medições
    const ato = atoDe(run, n), rng = rngDe(run, n, CANAL.inimigo, run.revanche);
    let pool = inimigosComuns(run, ato).filter(d => d.id !== run.ultimoInimigo);
    if (!pool.length) pool = inimigosComuns(run, ato);
    return sorteia(pool, rng);
  }
  // Os 2 sub-chefes do ato (sorteados uma vez)
  function subOfertas(run) {
    const ato = atoDe(run, run.etapa);
    if (!run.sub[ato]) {
      const rng = rngDe(run, ato * 10, CANAL.sub), ids = Object.keys(SUBCHEFES), a = ids.splice(Math.floor(rng() * ids.length), 1)[0], b = ids[Math.floor(rng() * ids.length)];
      run.sub[ato] = [a, b];
    }
    return run.sub[ato].slice();
  }
  function escolherSub(run, id) { if (subOfertas(run).indexOf(id) < 0) return false; run.subEscolhido = id; return true; }
  function chefaoDoAto(run, ato) {
    if (!run.chefao[ato]) {
      const ids = Object.keys(CHEFOES).filter(k => CHEFOES[k].ato === ato);
      run.chefao[ato] = sorteia(ids, rngDe(run, ato * 10, CANAL.chefao));
    }
    return CHEFOES[run.chefao[ato]];
  }
  // O inimigo do combate n, como a tela mostra antes da luta
  function inimigoDaEtapa(run, n) {
    const t = tipoDaEtapa(run, n);
    if (n === 1) return Object.assign({ tipo: 'comum', vanilla: true }, inimigoComum(run, n));
    if (t === 'sub') return run.subEscolhido ? Object.assign({ tipo: 'sub' }, SUBCHEFES[run.subEscolhido]) : null;
    if (t === 'chefao') return Object.assign({ tipo: 'chefao' }, chefaoDoAto(run, atoDe(run, n)));
    return Object.assign({ tipo: 'comum' }, inimigoComum(run, n));
  }

  // ---------- Deck do inimigo ----------
  // Os 4 vanillas dos sub-chefes: um de cada naipe e mais um do naipe que mais aparece nas cartas dele
  function vanilasPara(ids) {
    const cont = { pedra: 0, papel: 0, tesoura: 0 };
    ids.forEach(id => { const n = CARTAS_POR_ID[id].naipe; if (cont[n] !== undefined) cont[n]++; });
    return BASE.concat([BASE.slice().sort((a, b) => cont[b] - cont[a])[0]]);
  }
  function montarDeckInimigo(run, def, n, tipo) {
    const rng = rngDe(run, n, CANAL.deck, run.revanche), ato = atoDe(run, n), U = run.cfg.run.upgradesInimigo;
    const deck = [];
    let eid = 1;
    const add = (id, extra) => deck.push(Object.assign({ eid: eid++, id, up: false, mod: null }, extra || {}));
    if (def.id === 'gemeo') return run.deck.map(e => ({ eid: e.eid, id: e.id, up: e.up, mod: e.mod }));
    if (n === 1) { ['pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura'].forEach(id => add(id)); return deck; }
    if (tipo === 'sub') vanilasPara(def.deck).concat(def.deck).forEach(id => add(id));
    else if (tipo === 'chefao') def.deck.concat(def.trofeu ? [def.trofeu] : []).forEach(id => add(id));
    else def.deck.concat(ato === 2 ? def.ato2 || [] : []).forEach(id => add(id));
    // Upgrades: ato 2 tem 2; no ato 1 só os comuns a partir do combate 4 têm 1. Cartas com efeito primeiro.
    const ups = ato === 2 ? U.ato2 : (tipo === 'comum' && n >= U.ato1ComumDe ? U.ato1Comum : 0);
    const candidatas = deck.filter(e => CARTAS_POR_ID[e.id].up && CARTAS_POR_ID[e.id].raridade !== 'prismatica');
    for (let i = 0; i < ups && candidatas.length; i++) {
      const comEfeito = candidatas.filter(e => CARTAS_POR_ID[e.id].raridade !== 'comum');
      const lista = comEfeito.length ? comEfeito : candidatas;
      const e = lista[Math.floor(rng() * lista.length)]; e.up = true; candidatas.splice(candidatas.indexOf(e), 1);
    }
    // Mão aberta: no ato 2, os inimigos comuns trazem 1 ou 2 cartas com o selo Sigilosa (id 'delatora')
    if (run.modo === 'aberta' && ato === 2 && tipo === 'comum') {
      const alvos = deck.filter(e => CARTAS_POR_ID[e.id].raridade !== 'comum');
      const k = 1 + Math.floor(rng() * 2);
      for (let i = 0; i < k && alvos.length; i++) alvos.splice(Math.floor(rng() * alvos.length), 1)[0].mod = 'delatora';
    }
    return deck;
  }

  // ---------- Combate ----------
  function iniciarCombate(run) {
    const n = run.etapa, def = inimigoDaEtapa(run, n), cfg = run.cfg, tipo = def.tipo, aberta = run.modo === 'aberta';
    let ia = def.ia || {};
    if (tipo === 'sub') ia = { arq: def.id === 'gemeo' ? ((arquetiposAtivos(run)[0] || {}).chave || null) : def.arq };
    const inimigo = { nome: def.nome, deck: montarDeckInimigo(run, def, n, tipo), ia, anuncio: tipo === 'chefao' ? (def.anuncio || null) : null, vida: cfg.vida,
      regra: (aberta && def.regraAberta) || def.regra || '', estilo: def.estilo || '', arq: def.arq || null,
      poderId: tipo === 'chefao' ? def.poderId : null, poderNome: tipo === 'chefao' ? def.poder.nome : '', poder: tipo === 'chefao' ? ((aberta && def.poder.textoAberta) || def.poder.texto) : '', pista: def.pista || '',
      tendencia: def.tendencia || (tipo === 'chefao' ? 'Chefão do ato ' + atoDe(run, n) : tipo === 'sub' ? 'Sub-chefe' : ''), tipo, id: def.id };
    const regras = {};
    let vidaJ = cfg.vida, rodadaBlitz = cfg.rodadaBlitz;
    if (n === 1) { vidaJ = cfg.run.vidaPrimeiraPartida; inimigo.vida = cfg.run.vidaPrimeiraPartida; rodadaBlitz = cfg.run.rodadaBlitzPrimeiraLuta; }
    else if (tipo === 'sub') {
      inimigo.vida = def.id === 'ganancioso' ? 8 : cfg.run.vidaSubchefe;
      const r = { quebradico: 'quebradico', espiao: 'espiao', teimoso: 'teimoso', apressado: 'apressado', ladra: 'ladra', embaralhador: 'embaralhador' }[def.id];
      if (r) regras[r] = true;
      if (def.id === 'apressado') regras.blitzRodada = 3;
      if (def.id === 'embaralhador') regras.maoJogador = 2;
    } else if (tipo === 'chefao') {
      inimigo.vida = cfg.run.vidaChefao[atoDe(run, n)];
      if (def.id === 'relojoeiro') regras.blitzRodada = 4;   // Adiantado
    }
    const estado = Motor.criarCombate({
      cfg, deckJogador: run.deck, inimigo, semente: Math.floor(rngDe(run, n, CANAL.inimigo, 99 + run.revanche)() * 1e9),
      omamoris: n === 1 ? [] : run.omamoris, vidaJogador: vidaJ, rodadaBlitz, regras, moedasJogador: run.moedas, modo: run.modo
    });
    estado.inimigoDef = Object.assign({}, estado.inimigoDef, { anuncio: inimigo.anuncio, ia: inimigo.ia, id: def.id, tipo });
    run.ultimoInimigo = def.id;
    return estado;
  }

  // Preço na Loja (o omamori Cupom tira 1; mínimo 1)
  const preco = (run, base) => (run.omamoris.indexOf('cupom') >= 0 ? Math.max(1, base - 1) : base);

  // Aplica o resultado do combate na run e monta a fila de passos. Devolve o texto do efeito.
  function terminarCombate(run, estado) {
    const fim = estado.fim, n = run.etapa, tipo = tipoDaEtapa(run, n), info = [];
    const st = run.stats;
    estado.historico.forEach(r => { st.rodadas++; if (r.naipeJogador) st.naipes[r.naipeJogador]++;
      if (r.eidJogador != null && r.resultadoJogador === 'win') { const c = st.cartas[r.eidJogador] = st.cartas[r.eidJogador] || { nome: r.nomeJogador, vitorias: 0 }; c.vitorias++; c.nome = r.nomeJogador; st.vitoriasRodada++; } });
    run.mapa.push({ etapa: n, resultado: fim, inimigo: estado.inimigoDef.nome, tipo });
    // Dinheiro
    const M = run.cfg.run.moedas;
    let ganho = fim === 'vitoria' ? M.vitoria : fim === 'empate' ? M.empate : M.derrota;
    if (fim === 'vitoria' && tipo === 'chefao') ganho += M.chefao;
    if (run.omamoris.indexOf('cofre') >= 0 && n > 1) ganho += 1;
    const nota = estado.jogador.moedas || 0;
    run.moedas += ganho + nota; st.ganho.combate += ganho; st.ganho.nota += nota;
    info.push('+' + (ganho + nota) + ' moeda(s)');
    // A Ladra roubou moedas
    if (estado.roubadas) { run.moedas = Math.max(0, run.moedas - estado.roubadas); st.gasto.roubo += estado.roubadas; info.push('A Ladra roubou ' + estado.roubadas); run.usos.roubadas = estado.roubadas; }
    // Vida da run
    if (fim === 'vitoria') { run.vitorias++; }
    else if (fim === 'empate') { run.empates++; run.vida -= run.cfg.run.custoEmpate; info.push('-' + run.cfg.run.custoEmpate + ' de vida da run'); }
    else {
      let c = run.cfg.run.custoDerrota;
      if (run.omamoris.indexOf('seguro') >= 0 && !run.usos.seguro) { run.usos.seguro = true; c = 1; info.push('Seguro: a derrota custou só 1'); }
      run.derrotas++; run.vida -= c; info.push('-' + c + ' de vida da run');
    }
    run.ultimoResultado = fim; run.fila = []; run.pendente = null; run.loja = null;
    const ato = atoDe(run, n);
    if (run.vida <= 0) run.fim = 'derrota';
    else if (tipo === 'chefao' && fim === 'vitoria' && ehUltima(run, n)) run.fim = 'vitoria';
    if (run.fim) return info.join(' · ');
    // Fila de passos
    if (tipo === 'chefao' && fim === 'vitoria') run.usos.revancheDe = null;
    if (tipo === 'chefao' && fim !== 'vitoria') { run.revanche++; run.usos.revancheDe = n; info.push('Chefão: você luta de novo'); }
    const pos = posDe(run, n), C = run.cfg.run;
    if (n === 1) run.fila.push('omamori');
    if (tipo === 'chefao' && fim === 'vitoria') run.fila.push('espolio');
    if (tipo === 'sub' && fim === 'vitoria') run.fila.push('recsub');
    run.fila.push('recompensa');   // depois de todo combate, inclusive empate e derrota
    if (tipo === 'sub' && ato === 2 && mesaDisponivel(run)) run.fila.push('mesa');
    if (C.oficinaDepoisDe.indexOf(pos) >= 0) run.fila.push('oficina');
    if (C.lojaDepoisDe.indexOf(pos) >= 0) run.fila.push('loja');
    run.filaTotal = run.fila.slice();
    prepararPasso(run);
    return info.join(' · ');
  }

  // ---------- Fila de passos ----------
  const passo = run => (run.fila && run.fila[0]) || null;
  function concluirPasso(run) {
    run.fila.shift(); run.pendente = null; run.loja = null;
    if (!run.fila.length) { proximaEtapa(run); return 'combate'; }
    prepararPasso(run);
    return run.fila[0];
  }
  // Monta o que o passo atual precisa (as cartas da Recompensa, o prêmio do sub-chefe, o Espólio)
  function prepararPasso(run) {
    const p = run.fila[0];
    run.pendente = null;
    if (p === 'recompensa') run.pendente = montarRecompensaCartas(run);
    else if (p === 'oficina') run.pendente = { tipo: 'oficina', feito: false };
    else if (p === 'recsub') run.pendente = montarRecompensa(run);
    else if (p === 'espolio') espolioIniciar(run);
  }
  function proximaEtapa(run) {
    if (run.revanche && run.usos.revancheDe === run.etapa) { /* repete o chefão */ }
    else { run.etapa++; run.revanche = 0; run.usos.revancheDe = null; if (tipoDaEtapa(run, run.etapa) !== 'sub') run.subEscolhido = null; }
    run.usos.roubadas = 0;
  }
  // Trilha da run: os 10 combates (os dois atos), com o resultado dos já jogados
  function trilha(run) {
    const nos = [];
    for (let n = 1; n <= totalEtapas(run); n++) {
      const m = run.mapa.filter(x => x.etapa === n).slice(-1)[0], ativa = !!(run.fila && run.fila.length);
      let estado = 'pendente';
      if (n < run.etapa || (n === run.etapa && ativa)) estado = 'feito'; else if (n === run.etapa) estado = 'atual';
      nos.push({ n, ato: atoDe(run, n), tipo: tipoDaEtapa(run, n), estado, resultado: m ? m.resultado : null });
    }
    return nos;
  }

  // ---------- Omamoris ----------
  const omamoriDisponivel = (run, o) => run.omamoris.indexOf(o.id) < 0 && o.categoria !== 'chefao' && (!o.minAto || atoDe(run, run.etapa) >= o.minAto) &&
    (o.categoria !== 'arquetipo' || arquetiposAtivos(run).some(a => a.chave === o.arq));
  // As 3 ofertas do omamori inicial: básicos
  function ofertasOmamoriInicial(run) {
    const rng = rngDe(run, 0, CANAL.omamori), basicos = OMAMORIS.filter(o => o.categoria === 'basico' && run.omamoris.indexOf(o.id) < 0).slice(), saida = [];
    while (saida.length < 3 && basicos.length) saida.push(basicos.splice(Math.floor(rng() * basicos.length), 1)[0]);
    return saida;
  }
  // n ofertas sorteadas, com pelo menos uma opção neutra (básico ou neutro)
  function ofertasOmamori(run, n, extra) {
    const rng = rngDe(run, run.etapa, CANAL.omamori, 5 + (extra || 0)), pool = OMAMORIS.filter(o => omamoriDisponivel(run, o));
    const neutros = pool.filter(o => o.categoria !== 'arquetipo');
    const saida = [];
    if (neutros.length && n > 1) saida.push(neutros.splice(Math.floor(rng() * neutros.length), 1)[0]);   // ofertas de 2 ou mais: pelo menos 1 neutro
    const resto = pool.filter(o => saida.indexOf(o) < 0);
    while (saida.length < n && resto.length) saida.push(resto.splice(Math.floor(rng() * resto.length), 1)[0]);
    return saida;
  }
  const omamorisCheios = run => run.omamoris.length >= run.cfg.run.limiteOmamoris;
  function adicionarOmamori(run, id, substitui) {
    if (run.omamoris.indexOf(id) >= 0) return false;
    if (omamorisCheios(run)) { if (!substitui || run.omamoris.indexOf(substitui) < 0) return false; run.omamoris = run.omamoris.filter(x => x !== substitui); }
    run.omamoris.push(id); return true;
  }
  function escolherOmamoriInicial(run, id) {
    if (!ofertasOmamoriInicial(run).some(o => o.id === id)) return false;
    return adicionarOmamori(run, id);
  }

  // ---------- Sorteio de cartas (Loja e Recompensa) ----------
  // tabela: { comum, rara, lendaria, prismatica } em porcentagens
  function rolarRaridade(run, tabela, rng) {
    let x = rng() * 100, r = 'rara';
    [['comum', tabela.comum], ['rara', tabela.rara], ['lendaria', tabela.lendaria], ['prismatica', tabela.prismatica || 0]].some(p => { if (x < p[1]) { r = p[0]; return true; } x -= p[1]; return false; });
    if (r === 'prismatica' && temPrismatica(run)) r = 'lendaria';
    return r;
  }
  // Uma carta do naipe dado. Rara e Lendária têm 50% de chance de ser do arquétipo ativo, se houver carta dele.
  function sortearCarta(run, naipe, tabela, rng) {
    const raridade = rolarRaridade(run, tabela, rng);
    let pool = CARTAS_LOJA.filter(c => c.naipe === naipe && c.raridade === raridade);
    if (raridade === 'rara' || raridade === 'lendaria') {
      const ativos = arquetiposAtivos(run).map(a => a.chave);
      const doArq = pool.filter(c => ativos.indexOf(c.arq) >= 0);
      if (doArq.length && rng() < run.cfg.run.pesoArquetipoAtivo) pool = doArq;
    }
    if (!pool.length) pool = CARTAS_LOJA.filter(c => c.naipe === naipe && c.raridade === 'rara');
    return sorteia(pool, rng);
  }

  // ---------- Recompensa de cartas (depois de todo combate) ----------
  // 3 cartas, uma de cada naipe, só na versão atual. Escolhe 1 (entra no deck) ou pula e ganha 2 moedas.
  function montarRecompensaCartas(run) {
    const rng = rngDe(run, run.etapa, CANAL.cartas, run.revanche), tabela = run.cfg.run.raridadeRecompensa[atoDe(run, run.etapa)];
    const cartas = BASE.map(n => { const c = sortearCarta(run, n, tabela, rng); return { id: c.id, raridade: c.raridade }; });
    return { tipo: 'cartas', cartas, escolhida: null, pulou: false };
  }
  function recompensaEscolher(run, i) {
    const r = run.pendente;
    if (!r || r.tipo !== 'cartas' || r.escolhida || r.pulou || !r.cartas[i]) return false;
    r.escolhida = r.cartas[i].id; run.deck.push(entrada(run, r.escolhida)); return true;
  }
  function recompensaPular(run) {
    const r = run.pendente;
    if (!r || r.tipo !== 'cartas' || r.escolhida || r.pulou) return false;
    r.pulou = true; run.moedas += run.cfg.run.moedas.pularRecompensa; run.stats.ganho.premio += run.cfg.run.moedas.pularRecompensa; run.stats.pulos.recompensa++; return true;
  }
  const recompensaCartasFeita = run => { const r = run.pendente; return !r || r.tipo !== 'cartas' || !!(r.escolhida || r.pulou); };

  // ---------- Oficina (depois dos combates 2 e 4 de cada ato) ----------
  // 1 upgrade grátis, ou pular e ganhar 1 moeda.
  const podeUpgrade = (run, eid) => { const e = run.deck.find(x => x.eid === eid); return !!e && !e.up && !!defDe(e).up; };
  function oficinaUpgrade(run, eid) {
    const o = run.pendente;
    if (!o || o.tipo !== 'oficina' || o.feito || !podeUpgrade(run, eid)) return false;
    run.deck.find(x => x.eid === eid).up = true; o.feito = true; o.eid = eid; return true;
  }
  function oficinaPular(run) {
    const o = run.pendente;
    if (!o || o.tipo !== 'oficina' || o.feito) return false;
    o.feito = true; o.pulou = true; run.moedas += run.cfg.run.moedas.pularOficina; run.stats.ganho.premio += run.cfg.run.moedas.pularOficina; run.stats.pulos.oficina++; return true;
  }
  const oficinaFeita = run => !run.pendente || run.pendente.tipo !== 'oficina' || !!run.pendente.feito;

  // A primeira Loja (depois do combate 1) só vende o que dá para pagar: o máximo que o jogador tem são 3 moedas,
  // então só Raras, e sem omamori (que custa 6)
  const lojaInicial = run => run.etapa === 1;
  const tabelaLoja = run => (lojaInicial(run) ? { comum: 0, rara: 100, lendaria: 0, prismatica: 0 } : run.cfg.run.raridade[atoDe(run, run.etapa)]);
  // ---------- Loja ----------
  // 3 cartas (Raras ou melhores, uma de cada naipe), 1 omamori, 1 selo, upgrade, remoção e renovar
  function gerarLoja(run) {
    const rng = rngDe(run, run.etapa, CANAL.loja, run.contLoja++ + run.revanche * 100);
    const tabela = tabelaLoja(run);
    const cartas = BASE.map(n => { const c = sortearCarta(run, n, tabela, rng); return { id: c.id, raridade: c.raridade, preco: preco(run, run.cfg.run.preco[c.raridade]), comprada: false }; });
    const mods = Object.keys(MODIFICADORES), mod = sorteia(mods, rng);
    // 1 omamori à venda (some se o jogador já tem o limite)
    let omamori = null;
    if (!omamorisCheios(run) && !lojaInicial(run)) {
      const pool = OMAMORIS.filter(o => omamoriDisponivel(run, o));
      if (pool.length) omamori = { id: sorteia(pool, rng).id, preco: preco(run, run.cfg.run.preco.omamori), comprado: false };
    }
    run.loja = { cartas, omamori, selo: { mod, preco: preco(run, run.cfg.run.preco.selo), comprado: false }, renovou: false };
    return run.loja;
  }
  const loja = run => run.loja || gerarLoja(run);
  const precoServico = (run, tipo) => preco(run, run.cfg.run.preco[tipo]);
  function gastar(run, valor, tipo) { run.moedas -= valor; run.stats.gasto[tipo] += valor; }
  function comprarCarta(run, i) {
    const L = loja(run), it = L.cartas[i];
    if (!it || it.comprada || run.moedas < it.preco) return false;
    const def = CARTAS_POR_ID[it.id];
    if (def.raridade === 'prismatica' && temPrismatica(run)) return false;
    gastar(run, it.preco, 'cartas'); it.comprada = true;
    run.deck.push(entrada(run, it.id)); return true;
  }
  function comprarOmamoriLoja(run) {
    const o = loja(run).omamori;
    if (!o || o.comprado || run.moedas < o.preco || omamorisCheios(run)) return false;
    gastar(run, o.preco, 'omamori'); o.comprado = true; run.omamoris.push(o.id); return true;
  }
  function comprarUpgrade(run, eid) {
    const p = precoServico(run, 'upgrade');
    if (run.moedas < p || !podeUpgrade(run, eid)) return false;
    gastar(run, p, 'upgrade'); run.deck.find(x => x.eid === eid).up = true; return true;
  }
  const podeRemover = run => run.deck.length > run.cfg.deckMinimo;
  function comprarRemocao(run, eid) {
    const p = precoServico(run, 'remover');
    if (run.moedas < p || !podeRemover(run) || !run.deck.some(e => e.eid === eid)) return false;
    gastar(run, p, 'remover'); run.deck = run.deck.filter(e => e.eid !== eid); return true;
  }
  function comprarSelo(run, eid) {
    const L = loja(run), p = L.selo.preco;
    const e = run.deck.find(x => x.eid === eid);
    if (!e || L.selo.comprado || run.moedas < p) return false;
    gastar(run, p, 'selo'); L.selo.comprado = true; e.mod = L.selo.mod; return true;
  }
  function renovarLoja(run) {
    const L = loja(run), p = precoServico(run, 'renovar');
    if (L.renovou || run.moedas < p) return false;
    gastar(run, p, 'renovar');
    const rng = rngDe(run, run.etapa, CANAL.loja, run.contLoja++ + 50 + run.revanche * 100), tabela = tabelaLoja(run);
    L.cartas = BASE.map(n => { const c = sortearCarta(run, n, tabela, rng); return { id: c.id, raridade: c.raridade, preco: preco(run, run.cfg.run.preco[c.raridade]), comprada: false }; });
    L.renovou = true; return true;
  }

  // ---------- Recompensa do sub-chefe ----------
  function montarRecompensa(run) {
    const sub = SUBCHEFES[run.subEscolhido];
    if (!sub) return null;
    const rng = rngDe(run, run.etapa, CANAL.recompensa), rec = sub.rec;
    if (rec === 'lendaria2') {
      const pool = CARTAS_LOJA.filter(c => c.raridade === 'lendaria'), duas = [];
      while (duas.length < 2 && pool.length) duas.push(pool.splice(Math.floor(rng() * pool.length), 1)[0].id);
      return { tipo: 'lendaria2', opcoes: duas };
    }
    if (rec === 'omamori2') return { tipo: 'omamori2', opcoes: ofertasOmamori(run, 2).map(o => o.id) };
    if (rec === 'moedas6') return { tipo: 'moedas', valor: 6, aplicada: false };
    if (rec === 'upgrades2') return { tipo: 'upgrades', restam: 2 };
    if (rec === 'gemeo') return { tipo: 'upgrades', restam: 1, moedas: 3, aplicada: false };
    if (rec === 'ladra') return { tipo: 'moedas', valor: (run.usos.roubadas || 0) + 5, aplicada: false, devolve: run.usos.roubadas || 0 };
    return null;
  }
  // escolha: id (lendária ou omamori) ou null (moedas/upgrades usam as funções abaixo)
  function aplicarRecompensa(run, escolha, substitui) {
    const r = run.pendente; if (!r) return false;
    if (r.tipo === 'lendaria2') { if (r.opcoes.indexOf(escolha) < 0) return false; run.deck.push(entrada(run, escolha)); run.pendente = { tipo: 'feito' }; return true; }
    if (r.tipo === 'omamori2') { if (r.opcoes.indexOf(escolha) < 0) return false; if (!adicionarOmamori(run, escolha, substitui)) return false; run.pendente = { tipo: 'feito' }; return true; }
    if (r.tipo === 'moedas') { if (r.aplicada) return false; run.moedas += r.valor; run.stats.ganho.premio += r.valor; r.aplicada = true; return true; }
    if (r.tipo === 'upgrades' && r.moedas && !r.aplicada) { run.moedas += r.moedas; run.stats.ganho.premio += r.moedas; r.aplicada = true; return true; }
    return false;
  }
  function upgradeGratis(run, eid) {
    const r = run.pendente;
    if (!r || r.tipo !== 'upgrades' || r.restam < 1 || !podeUpgrade(run, eid)) return false;
    run.deck.find(x => x.eid === eid).up = true; r.restam--;
    if (r.restam === 0 || !run.deck.some(e => podeUpgrade(run, e.eid))) r.restam = 0;
    return true;
  }
  const recompensaConcluida = run => { const r = run.pendente; if (!r) return true; if (r.tipo === 'feito') return true; if (r.tipo === 'moedas') return r.aplicada; if (r.tipo === 'upgrades') return r.restam === 0 && (!r.moedas || r.aplicada); return false; };

  // ---------- Espólio do chefão ----------
  // O omamori do chefão é garantido. O jogador ainda escolhe 1: a carta Troféu ou 1 omamori sorteado.
  function espolioIniciar(run) {
    if (run.pendente && run.pendente.tipo === 'espolio') return run.pendente;
    const c = chefaoDoAto(run, atoDe(run, run.etapa));
    const p = { tipo: 'espolio', garantido: c.omamori, garantidoOk: false, escolhido: false, trofeu: temCarta(run, c.trofeu) ? null : c.trofeu, sorteado: null };
    if (run.omamoris.indexOf(c.omamori) >= 0) p.garantidoOk = true;
    else if (!omamorisCheios(run)) { run.omamoris.push(c.omamori); p.garantidoOk = true; }
    const sorteados = ofertasOmamori(run, 1, 20);
    p.sorteado = sorteados.length ? sorteados[0].id : null;
    if (!p.trofeu && !p.sorteado) p.escolhido = true;
    run.pendente = p; return p;
  }
  // Com o limite de omamoris cheio, o garantido pede para trocar por um dos seus
  function espolioGarantido(run, substitui) {
    const p = run.pendente;
    if (!p || p.tipo !== 'espolio' || p.garantidoOk) return false;
    if (!adicionarOmamori(run, p.garantido, substitui)) return false;
    p.garantidoOk = true; return true;
  }
  function espolioEscolher(run, tipo, substitui) {
    const p = run.pendente;
    if (!p || p.tipo !== 'espolio' || p.escolhido || !p.garantidoOk) return false;
    if (tipo === 'carta') { if (!p.trofeu) return false; run.deck.push(entrada(run, p.trofeu)); p.escolhido = true; return true; }
    if (!p.sorteado || !adicionarOmamori(run, p.sorteado, substitui)) return false;
    p.escolhido = true; return true;
  }
  const espolioFeito = run => { const p = run.pendente; return !p || p.tipo !== 'espolio' || (p.garantidoOk && p.escolhido); };

  // ---------- Mesa do Apostador ----------
  const mesaDisponivel = run => atoDe(run, run.etapa) === 2 && !run.usos.mesa && !(temCarta(run, 'dinamite') && temCarta(run, 'curinga'));
  const lendariasDoDeck = run => run.deck.filter(e => defDe(e).raridade === 'lendaria');
  function mesaApostasPossiveis(run) {
    const r = [];
    if (lendariasDoDeck(run).length) r.push({ tipo: 'lendaria' });
    if (run.moedas >= run.cfg.run.mesa.apostaMoedas) r.push({ tipo: 'moedas', valor: run.cfg.run.mesa.apostaMoedas });
    return r;
  }
  function mesaIniciar(run, aposta) {
    if (run.usos.mesa) return false;
    run.usos.mesa = true;
    run.pendente = { tipo: 'mesa', aposta: aposta || null, placar: [0, 0], rodadas: [], fim: null, rng: Math.floor(rngDe(run, run.etapa, CANAL.mesa)() * 1e9) };
    return true;
  }
  // O Apostador joga ao acaso. Empate repete a rodada. Vence quem chegar a 2.
  function mesaJogar(run, naipe) {
    const m = run.pendente;
    if (!m || m.tipo !== 'mesa' || m.fim) return null;
    m.rng = (Math.imul(m.rng ^ 0x5DEECE6, 1103515245) + 12345) >>> 0;
    const dele = BASE[Math.floor((m.rng >>> 8) % 3)];
    let res = 'empate';
    if (naipe !== dele) res = NAIPES[naipe].vence === dele ? 'vitoria' : 'derrota';
    m.rodadas.push({ voce: naipe, ele: dele, res });
    if (res === 'vitoria') m.placar[0]++; else if (res === 'derrota') m.placar[1]++;
    const alvo = run.cfg.run.mesa.rodadasParaVencer;
    if (m.placar[0] >= alvo) m.fim = 'vitoria'; else if (m.placar[1] >= alvo) m.fim = 'derrota';
    if (m.fim === 'derrota') {
      // perde o que apostou
      if (m.aposta && m.aposta.tipo === 'moedas') { run.moedas -= m.aposta.valor; run.stats.gasto.mesa += m.aposta.valor; }
      else if (m.aposta && m.aposta.tipo === 'lendaria') run.deck = run.deck.filter(e => e.eid !== m.aposta.eid);
    }
    return { dele, res, fim: m.fim, placar: m.placar.slice() };
  }
  // Prêmio: a Dinamite ou o Curinga (se já tem um, leva o outro)
  function mesaPremioOpcoes(run) { return ['dinamite', 'curinga'].filter(id => !temCarta(run, id)); }
  function mesaPremio(run, id) {
    if (!run.pendente || run.pendente.fim !== 'vitoria' || mesaPremioOpcoes(run).indexOf(id) < 0) return false;
    run.deck.push(entrada(run, id)); run.pendente.premio = id; return true;
  }

  // ---------- Salvamento ----------
  function salvar(run, ui) { try { localStorage.setItem(CHAVE_SAVE, JSON.stringify({ v: 41, run, ui })); } catch (e) { /* sem problema */ } }
  function carregar() {
    try { const t = localStorage.getItem(CHAVE_SAVE); if (!t) return null; const d = JSON.parse(t); if (d.v !== 41 || !d.run) return null; return d; } catch (e) { return null; }
  }
  function apagarSave() { try { localStorage.removeItem(CHAVE_SAVE); } catch (e) { /* sem problema */ } }
  // Uma run salva de versão anterior não funciona na V4.1: é descartada, e o menu avisa uma vez
  function descartarSaveAntigo() {
    let achou = false;
    CHAVES_ANTIGAS.forEach(k => { try { if (localStorage.getItem(k)) { localStorage.removeItem(k); achou = true; } } catch (e) { /* sem problema */ } });
    return achou;
  }

  return {
    CANAL, criar, entrada, totalEtapas, atoDe, posDe, tipoDaEtapa, ehUltima, arquetiposAtivos, temCarta, temPrismatica,
    inimigoDaEtapa, subOfertas, escolherSub, chefaoDoAto, montarDeckInimigo, iniciarCombate, terminarCombate,
    passo, concluirPasso, prepararPasso, proximaEtapa, trilha, preco, precoServico,
    ofertasOmamoriInicial, ofertasOmamori, omamorisCheios, adicionarOmamori, escolherOmamoriInicial,
    recompensaEscolher, recompensaPular, recompensaCartasFeita, oficinaUpgrade, oficinaPular, oficinaFeita,
    loja, gerarLoja, comprarCarta, comprarOmamoriLoja, podeUpgrade, comprarUpgrade, podeRemover, comprarRemocao, comprarSelo, renovarLoja,
    montarRecompensa, aplicarRecompensa, upgradeGratis, recompensaConcluida,
    espolioIniciar, espolioGarantido, espolioEscolher, espolioFeito,
    mesaDisponivel, lendariasDoDeck, mesaApostasPossiveis, mesaIniciar, mesaJogar, mesaPremioOpcoes, mesaPremio,
    salvar, carregar, apagarSave, descartarSaveAntigo, rngDe
  };
})();
