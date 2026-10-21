// ============================================================
// MOTOR DO JOGO (V4): lógica pura, sem nada de tela
// Depende de: NAIPES, CARTAS_POR_ID, MODIFICADORES (data/cards.js), OMAMORIS_POR_ID (data/omamoris.js),
//             EFEITOS e OMAMORIS_EFEITOS (js/efeitos.js)
//
// Ordem de uma rodada (Especificação V4):
//   iniciarRodada: 1) omamoris de início  2) cada lado completa a mão  (a IA decide e o chefão anuncia)
//   resolverRodada: 4) escolha  5) revelação  6) resultado  7) efeitos  8) dano e cura
//                   9) a carta jogada vai ao cemitério (ou às Cortadas)  10) o resto da mão é descartado
//                   11) fim do combate
// Se alguma carta guarda cartas com escolha do jogador, o passo 10 espera: concluirRodada(estado, escolhas).
// ============================================================
const Motor = (function () {

  // Modo de jogo: 'normal' ou 'aberta' (Mão aberta, modo de teste). Muda textos e efeitos das cartas de Leitura.
  let modoAtual = 'normal';
  const modo = () => modoAtual;
  function definirModo(m) { modoAtual = m === 'aberta' ? 'aberta' : 'normal'; }

  const CICLO = ['pedra', 'papel', 'tesoura'];   // ciclo do Curinga
  const SIMBOLO = n => (NAIPES[n] ? NAIPES[n].simbolo : '');

  // ---------- Utilidades ----------
  // Gerador de números aleatórios com semente (mesma semente = mesmos sorteios)
  function criarRng(semente) {
    let a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function embaralhar(lista, rng) {
    const l = lista.slice();
    for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
    return l;
  }
  const escolherUm = (lista, rng) => lista[Math.floor(rng() * lista.length)];
  function remover(lista, item) { const i = lista.indexOf(item); if (i >= 0) lista.splice(i, 1); }

  // ---------- Cartas ----------
  // Transforma uma "entrada de deck" ({id, up, mod, eid}, ou só o id) numa carta pronta para jogar e mostrar.
  function cartaDeEntrada(entrada, uid) {
    const e = typeof entrada === 'string' ? { id: entrada } : entrada;
    const def = CARTAS_POR_ID[e.id];
    const up = e.up && def.up ? def.up : null;
    const params = Object.assign({}, def.params, up && up.params);
    const ab = modoAtual === 'aberta' && def.maoAberta ? def.maoAberta : null;   // versão do texto na Mão aberta
    const texto = (up ? ((ab && ab.up && ab.up.texto) || up.texto) : ((ab && ab.texto) || def.texto)) || '';
    return {
      uid: uid != null ? uid : e.eid, eid: e.eid, def,
      nome: def.nome + (up ? '+' : ''), texto,
      efeito: (up && up.efeito) || def.efeito || null, params,
      quando: quandoDeTexto(texto), arq: def.arq || null,
      mod: e.mod || null, up: !!up,
      naipe: def.naipe === 'curinga' ? 'pedra' : def.naipe,   // naipe atual (o Curinga muda)
      fragilTemp: false,   // Quebradiço: Frágil só durante a luta
      marcada: false,      // revelada ao oponente (na mão ou no topo do deck)
      secreta: false,      // Mão aberta: virada para o oponente enquanto está na mão
      turnos: 0,           // Geodo: turnos que passou na mão
      vitorias: 0,         // Excalisoura: vitórias seguidas
      usos: 0              // Florete: vezes que ficou na mão
    };
  }
  const ehCuringa = c => c.def.naipe === 'curinga';
  const ehFragil = c => (c.def.fragil || c.fragilTemp) && c.mod !== 'blindada';
  const naipeDe = c => c.naipe;

  // ---------- Criação do combate ----------
  function criarJogador(nome, lado, entradas, vida, estado, omamoris) {
    const cartas = entradas.map(e => cartaDeEntrada(e, estado.proximoUid++));
    cartas.forEach(c => { if (ehCuringa(c)) c.idx = Math.floor(estado.rng() * 3); });
    return {
      nome, lado, vida, vidaMax: vida,
      deck: estado.ordemFixa ? cartas.slice().reverse() : embaralhar(cartas, estado.rng),
      mao: [], cemiterio: [], cortadas: [],
      todas: cartas.slice(),
      omamoris: (omamoris || []).slice(),
      baseMao: estado.cfg.mao,
      maisUm: false,                // Mão +1: o próximo turno completa até 4
      pend: { marcarAleatorio: 0, marcarTodas: false, compraNaipe: [], secretaTodas: false, secretaEscolha: 0 },   // efeitos do oponente que valem no próximo turno
      sangrias: [],                 // Multa: danos agendados para o fim das próximas rodadas
      jogadas: 0, ultimoResultado: null, ultimaCarta: null, testamento: null,
      proxAleatoria: 0, aleatoria: false,   // a carta jogada é sorteada
      perdeuAntes: false,           // Diário: perdeu a rodada anterior
      moedas: 0,                    // moedas ganhas no combate (Nota de cem)
      usos: {}                      // marcadores "já usado neste combate" dos omamoris
    };
  }

  // opcoes: cfg, deckJogador, inimigo {nome, deck, ia, anuncio, vida, regra}, semente, omamoris, vidaJogador, rodadaBlitz,
  //         regras (efeitos de sub-chefe), ordemFixa (tutorial), moedasJogador
  function criarCombate(opcoes) {
    const cfg = opcoes.cfg, ini = opcoes.inimigo;
    const regras = Object.assign({}, opcoes.regras || {});
    definirModo(opcoes.modo);
    const estado = {
      cfg, rng: criarRng(opcoes.semente != null ? opcoes.semente : Date.now()), modo: opcoes.modo === 'aberta' ? 'aberta' : 'normal',
      poder: ini.poderId || null,   // poder do chefão (ver resolverRodada e iniciarRodada)
      proximoUid: 1, rodada: 0, log: [], historico: [], fim: null, ordemFixa: !!opcoes.ordemFixa,
      inimigoDef: ini, regras,
      rodadaBlitz: regras.blitzRodada != null ? regras.blitzRodada : (opcoes.rodadaBlitz != null ? opcoes.rodadaBlitz : cfg.rodadaBlitz),
      blitzIniciou: false, blitzComecouAgora: false,
      anuncio: null, decisaoIA: null, pendente: null,
      roubadas: 0, moedasJogador: opcoes.moedasJogador || 0
    };
    estado.jogador = criarJogador('Você', 'jogador', opcoes.deckJogador, opcoes.vidaJogador || cfg.vida, estado, opcoes.omamoris);
    estado.inimigo = criarJogador(ini.nome, 'inimigo', ini.deck, ini.vida || cfg.vida, estado, []);
    estado.inimigo.embalo = 0;   // Duelista: vitórias seguidas acumuladas (até +2 de dano)
    if (temOmamori(estado.jogador, 'fundacao')) { estado.jogador.vidaMax++; estado.jogador.vida++; }   // Fundação
    if (regras.maoJogador) estado.jogador.baseMao = regras.maoJogador;
    else if (estado.jogador.omamoris.indexOf('mochila') >= 0) estado.jogador.baseMao = cfg.maoMais;
    estado.jogador.todas.forEach(c => { if (c.mod === 'namanga') c.naManga = true; });
    estado.inimigo.todas.forEach(c => { if (c.mod === 'namanga') c.naManga = true; });
    // Quebradiço: 2 cartas aleatórias do jogador ficam Frágeis neste combate
    if (regras.quebradico) {
      const pool = embaralhar(estado.jogador.todas.filter(c => !c.def.fragil && c.mod !== 'blindada'), estado.rng);
      pool.slice(0, 2).forEach(c => { c.fragilTemp = true; });
    }
    registrar(estado, 'Combate começou: Você vs ' + ini.nome + '.');
    // Cartas "Na manga" começam na mão do primeiro turno (o resto da mão é comprado em iniciarRodada)
    [estado.jogador, estado.inimigo].forEach(j => {
      j.deck.filter(c => c.naManga).forEach(c => { if (j.mao.length < tamanhoMao(estado, j)) { remover(j.deck, c); j.mao.push(c); } });
    });
    disparar(estado, 'inicioCombate');
    return estado;
  }

  function registrar(estado, texto) { estado.log.push(texto); }
  const temOmamori = (j, id) => j.omamoris.indexOf(id) >= 0;

  // Tamanho da mão neste turno
  function tamanhoMao(estado, j) {
    return j.baseMao + (j.maisUm ? 1 : 0) + (estado.rodada === 1 && temOmamori(j, 'pasta') ? 1 : 0);   // Pasta: 1ª mão com 4
  }

  // ---------- Mão aberta: cartas Secretas ----------
  // Secreta = virada para o oponente na mão. Sigilosa (selo) e as cartas que "nascem Secretas" são sempre Secretas.
  function ehSecreta(estado, c) {
    return estado.modo === 'aberta' && !!(c.secreta || c.mod === 'delatora' || (c.def.maoAberta && c.def.maoAberta.secreta));
  }
  // O Espião, na Mão aberta, impede que as cartas dele fiquem Secretas
  const podeSecretar = (estado, j) => estado.modo === 'aberta' && !(j.lado === 'inimigo' && estado.regras.espiao);
  // Deixa n cartas da mão Secretas (aleatórias, ou as mais fortes se melhores = true)
  function secretar(estado, j, n, melhores) {
    if (!podeSecretar(estado, j)) return 0;
    let cand = j.mao.filter(c => !ehSecreta(estado, c));
    if (melhores) cand = cand.sort((a, b) => valorAI(b) - valorAI(a));
    let feitos = 0;
    while (feitos < n && cand.length) {
      const c = melhores ? cand.shift() : cand.splice(Math.floor(estado.rng() * cand.length), 1)[0];
      c.secreta = true; feitos++;
    }
    return feitos;
  }
  // O jogador escolhe qual carta fica Secreta (Bilhete, na Mão aberta)
  function taparCarta(estado, uid) {
    const j = estado.jogador, c = j.mao.find(x => x.uid === uid);
    if (!estado.escolhaSecreta || !c || ehSecreta(estado, c)) return false;
    c.secreta = true; estado.escolhaSecreta--;
    return true;
  }
  // Cristal na Mão aberta: revela Secretas do oponente; se faltarem, as cartas do topo do deck dele
  function revelarSecretas(estado, j, n) {
    let feitos = 0;
    j.mao.filter(c => c.secreta && c.mod !== 'blindada').slice(0, n).forEach(c => { c.secreta = false; feitos++; });
    if (feitos < n) feitos += marcarTopo(estado, j, n - feitos);
    return feitos;
  }
  // Cartas que não aceitam ser Marcadas (selo Blindada, Biombo, omamori Véu no modo normal)
  const imuneMarca = (estado, j, c) => c.mod === 'blindada' || !!c.def.semMarca || (estado.modo !== 'aberta' && temOmamori(j, 'veu'));

  // ---------- Compra e zonas ----------
  // Compra n cartas. Se o deck acaba, o cemitério é embaralhado e vira o deck.
  function comprar(estado, j, n) {
    let compradas = 0;
    for (let i = 0; i < n; i++) {
      if (j.deck.length === 0 && j.cemiterio.length > 0) {
        j.deck = embaralhar(j.cemiterio, estado.rng); j.cemiterio = [];
        registrar(estado, j.nome + ': cemitério embaralhado e virou o deck.');
      }
      if (j.deck.length === 0) break;
      j.mao.push(j.deck.pop()); compradas++;
    }
    return compradas;
  }
  // Completa a mão até o tamanho do turno (cartas guardadas já contam). Rascunho puxa do deck o naipe escolhido.
  function completarMao(estado, j) {
    const alvo = tamanhoMao(estado, j);
    // Rascunho: uma ou duas cartas do naipe escolhido (se houver no deck), primeiro
    j.pend.compraNaipe.forEach(n => {
      if (j.mao.length >= alvo) return;
      for (let i = j.deck.length - 1; i >= 0; i--) {
        if (j.deck[i].naipe === n && !ehCuringa(j.deck[i])) { j.mao.push(j.deck.splice(i, 1)[0]); registrar(estado, j.nome + ' puxou ' + NAIPES[n].nome + ' do deck.'); break; }
      }
    });
    j.pend.compraNaipe = [];
    comprar(estado, j, alvo - j.mao.length);
    j.maisUm = false;
  }

  // Marca n cartas aleatórias da mão de j (Blindada resiste)
  function marcarMao(estado, j, n) {
    const alvos = j.mao.filter(c => !c.marcada && !imuneMarca(estado, j, c));
    let feitos = 0;
    while (feitos < n && alvos.length) { alvos.splice(Math.floor(estado.rng() * alvos.length), 1)[0].marcada = true; feitos++; }
    return feitos;
  }
  // Marca as n cartas do topo do deck de j
  function marcarTopo(estado, j, n) {
    let feitos = 0;
    for (let i = j.deck.length - 1; i >= 0 && feitos < n; i--) {
      const c = j.deck[i];
      if (imuneMarca(estado, j, c)) continue;
      c.marcada = true; feitos++;
    }
    return feitos;
  }

  // ---------- Omamoris: gatilhos ----------
  // Gatilhos: inicioCombate, inicioRodada, inicioBlitz, fimCombate. (vitoria/derrota/empate: dispararResultado)
  function disparar(estado, gatilho) {
    const c = montarCtx(estado, []);
    ['jogador', 'inimigo'].forEach(lado => {
      const j = estado[lado], op = estado[lado === 'jogador' ? 'inimigo' : 'jogador'];
      j.omamoris.forEach(id => {
        const o = OMAMORIS_EFEITOS[id];
        if (o && o[gatilho]) o[gatilho](estado, j, op, c);
      });
    });
  }
  function dispararResultado(estado, gatilho, s, o, c) {
    s.j.omamoris.forEach(id => {
      const r = OMAMORIS_EFEITOS[id];
      if (r && r[gatilho]) r[gatilho](s, o, c);
    });
  }

  // ---------- Blitz ----------
  const blitzAtiva = estado => estado.rodada >= estado.rodadaBlitz;
  function verificarInicioBlitz(estado) {
    if (estado.blitzIniciou || !blitzAtiva(estado) || estado.rodada < 1) return;
    estado.blitzIniciou = true; estado.blitzComecouAgora = true;
    registrar(estado, 'BLITZ! A partir de agora, empates machucam os dois lados.');
    disparar(estado, 'inicioBlitz');
  }

  // ---------- Início da rodada ----------
  function iniciarRodada(estado) {
    estado.rodada++;
    registrar(estado, '--- Rodada ' + estado.rodada + ' ---');
    estado.blitzComecouAgora = false; estado.anuncio = null; estado.decisaoIA = null; estado.pendente = null;
    verificarInicioBlitz(estado);
    disparar(estado, 'inicioRodada');           // 1) omamoris de início de rodada
    const A = [estado.jogador, estado.inimigo];
    A.forEach(j => {                            // 2) completa a mão
      j.aleatoria = j.proxAleatoria > 0; if (j.aleatoria) j.proxAleatoria--;
      completarMao(estado, j);
      j.mao.forEach(c => {                      // o Curinga muda de naipe a cada rodada em que está na mão
        if (!ehCuringa(c)) return;
        c.idx = (c.idx + 1) % 3; c.naipe = CICLO[c.idx];
      });
    });
    A.forEach(j => {                            // marcações agendadas pelo oponente
      if (j.pend.marcarTodas) { j.mao.forEach(c => { if (!imuneMarca(estado, j, c)) c.marcada = true; }); j.pend.marcarTodas = false; }
      if (j.pend.marcarAleatorio > 0) { marcarMao(estado, j, j.pend.marcarAleatorio); j.pend.marcarAleatorio = 0; }
    });
    // Espião e Ilusionista (modo normal): a cada 2 rodadas, 1 carta da mão do jogador fica Marcada
    if (estado.modo !== 'aberta' && (estado.regras.espiao || estado.poder === 'ilusionista') && estado.rodada % 2 === 0) {
      if (marcarMao(estado, estado.jogador, 1)) registrar(estado, estado.inimigo.nome + ' marcou uma carta da sua mão.');
    }
    if (estado.modo === 'aberta') aplicarSecretas(estado);
    A.forEach(j => {                            // Sem mão travada: compra até ter uma carta jogável
      while (jogaveis(estado, j).length === 0 && comprar(estado, j, 1) > 0) registrar(estado, j.nome + ' compra uma carta extra para ter o que jogar.');
    });
    checarFim(estado);
  }

  // Mão aberta: Secretas agendadas (Bilhete, Mapa), omamoris (Lente, Véu) e o tampar dos chefões
  function aplicarSecretas(estado) {
    estado.escolhaSecreta = 0;
    [estado.jogador, estado.inimigo].forEach(j => {
      if (j.pend.secretaTodas) { j.pend.secretaTodas = false; if (podeSecretar(estado, j)) j.mao.forEach(c => { c.secreta = true; }); }
      const n = j.pend.secretaEscolha; j.pend.secretaEscolha = 0;
      if (n > 0 && podeSecretar(estado, j)) {
        const cand = j.mao.filter(c => !ehSecreta(estado, c));
        if (j.lado === 'jogador' && cand.length > n) estado.escolhaSecreta = n;   // o jogador escolhe na tela
        else secretar(estado, j, n, true);
      }
    });
    disparar(estado, 'aposMao');
    if (estado.inimigoDef.tipo === 'chefao') secretar(estado, estado.inimigo, estado.poder === 'ilusionista' ? 2 : 1, true);   // todo chefão tampa cartas
  }

  // Cartas que podem ser escolhidas agora (o Meteoro só na Blitz)
  function jogaveis(estado, j) {
    return j.mao.filter(c => !(c.def.soBlitz && !blitzAtiva(estado)));
  }
  const escolhasNecessarias = c => (c && c.efeito && c.def.escolhe) || null;   // 'naipe' | 'carta' | null

  // ---------- Odds (informação pública) ----------
  // Para cada lado: porcentagem de cada naipe entre as cartas que podem estar na mão (deck + mão).
  // Cartas Marcadas aparecem à parte (certeza) e o Curinga aparece como "?".
  function odds(j) {
    const cont = { pedra: 0, papel: 0, tesoura: 0 };
    let curinga = 0, total = 0;
    const marcadas = [];
    const fonte = modoAtual === 'aberta' ? j.deck : j.deck.concat(j.mao);   // Mão aberta: só o deck (a mão já está à vista)
    fonte.forEach(c => {
      if (c.marcada) { marcadas.push({ carta: c, naipe: c.naipe, onde: j.mao.indexOf(c) >= 0 ? 'mao' : 'deck', nome: c.nome }); return; }
      if (ehCuringa(c)) { curinga++; return; }
      if (c.def.naipe === 'nenhum') return;   // a Dinamite não aparece nas odds
      cont[c.naipe]++; total++;
    });
    const r = { total, curinga, marcadas, n: cont, naMao: j.mao.length };
    CICLO.forEach(k => { r[k] = total ? Math.round(100 * cont[k] / total) : 0; });
    return r;
  }

  // ---------- Fim do combate ----------
  function checarFim(estado) {
    if (estado.fim) return;
    const vJ = estado.jogador.vida, vI = estado.inimigo.vida;
    if (vJ <= 0 || vI <= 0) estado.fim = vJ <= 0 && vI <= 0 ? 'empate' : (vI <= 0 ? 'vitoria' : 'derrota');
  }

  // ---------- Utilidades entregues aos efeitos (js/efeitos.js) ----------
  function montarCtx(estado, eventos, dizer) {
    return {
      estado, rng: estado.rng, cfg: estado.cfg,
      dizer: dizer || (t => registrar(estado, t)),
      comprar: (j, n) => comprar(estado, j, n),
      marcar: (j, n) => marcarMao(estado, j, n),
      marcarTopo: (j, n) => marcarTopo(estado, j, n),
      secretar: (j, n) => secretar(estado, j, n, false), revelarSecretas: (j, n) => revelarSecretas(estado, j, n),
      aberta: () => estado.modo === 'aberta',
      blitzAtiva: () => blitzAtiva(estado),
      temOmamori, embaralhar, escolherUm
    };
  }

  // Quem vence entre dois naipes
  function vence(a, b) {
    if (a === b || !NAIPES[a] || !NAIPES[b]) return false;
    return NAIPES[a].vence === b;
  }

  // Lista de efeitos de uma carta numa rodada: o próprio efeito, o do Testamento e o do Origami (copiado)
  function efeitosDe(s) {
    const c = s.carta, lista = [];
    if (c.efeito && EFEITOS[c.efeito]) lista.push({ ef: EFEITOS[c.efeito], p: c.params, fonte: c });
    if (s.j.testamento && !s.j.testamento.usado) lista.push({ ef: EFEITOS[s.j.testamento.efeito], p: s.j.testamento.params, fonte: c, extra: true });
    return lista;
  }

  // ---------- Resolver uma rodada ----------
  // uidJogador: carta escolhida (a IA decide em iniciarRodada, via estado.decisaoIA)
  // escolhas: { jogador: {naipe, cartaUid}, inimigo: {...} } para cartas que pedem uma decisão ao jogar
  function resolverRodada(estado, uidJogador, escolhasJogador) {
    const cfg = estado.cfg, rng = estado.rng;
    const eventos = [];
    const dizer = t => { eventos.push(t); registrar(estado, t); };
    const ctx = montarCtx(estado, eventos, dizer);
    const dec = estado.decisaoIA || { uid: null, escolhas: {} };
    const escolhas = { jogador: escolhasJogador || {}, inimigo: dec.escolhas || {} };
    const vidaAntes = { jogador: estado.jogador.vida, inimigo: estado.inimigo.vida };

    // --- 4) Escolha das cartas ---
    function pegarCarta(lado, uid) {
      const j = estado[lado], pool = jogaveis(estado, j);
      if (pool.length === 0) return null;   // nenhuma carta jogável: perde a rodada
      let c;
      j.aleatoriaUsada = !!j.aleatoria;
      if (j.aleatoria) { c = escolherUm(pool, rng); dizer(j.nome + ' jogou uma carta aleatória.'); }
      else c = pool.find(x => x.uid === uid) || escolherUm(pool, rng);
      remover(j.mao, c);
      c.vinhaMarcada = c.marcada; c.marcada = false;   // ao ser jogada, a carta é revelada e a marca some
      c.vinhaSecreta = ehSecreta(estado, c); c.secreta = false;
      return c;
    }
    const cJ = pegarCarta('jogador', uidJogador), cI = pegarCarta('inimigo', dec.uid);

    function criarLado(j, carta, lado) {
      return {
        j, carta, lado, naipe: carta ? carta.naipe : null, res: null, escolhas: escolhas[lado] || {},
        dano: 0, causaDireta: 0, danoPropio: 0, cura: 0, evitar: false, reduz: 0,
        fica: false, cortarSelf: false, cortaOp: false, dobro: false, semDanoEmpate: false,
        guardarN: 0, guardarMarca: false, guardarSecreta: false, guardarTudo: false, ativou: false, empateGanho: false,
        efs: []
      };
    }
    const sJ = criarLado(estado.jogador, cJ, 'jogador'), sI = criarLado(estado.inimigo, cI, 'inimigo');
    sJ.op = sI; sI.op = sJ;
    const lados = [sJ, sI];
    lados.forEach(s => { if (s.carta) s.efs = efeitosDe(s); });

    // --- 5) Revelação: efeitos "Jogar" ---
    dizer(estado.jogador.nome + ': ' + descreve(sJ) + '  |  ' + estado.inimigo.nome + ': ' + descreve(sI));
    lados.forEach(s => {
      if (!s.carta) return;
      s.efs.forEach(x => { if (x.ef.jogar && x.ef.jogar(s, s.op, ctx, x.p, s.escolhas, x) !== false) s.ativou = true; });
      if (s.j.testamento && s.j.testamento.usado !== true && s.efs.some(x => x.extra)) s.j.testamento.usado = true;
    });

    // --- 6) Resultado pela regra clássica ---
    let dinamiteDupla = false;
    const dJ = cJ && cJ.efeito === 'dinamite', dI = cI && cI.efeito === 'dinamite';
    const empateOriginal = !!(cJ && cI && !dJ && !dI && sJ.naipe === sI.naipe);
    if (!cJ && !cI) { sJ.res = sI.res = 'draw'; }
    else if (!cJ) { sJ.res = 'lose'; sI.res = 'win'; }
    else if (!cI) { sJ.res = 'win'; sI.res = 'lose'; }
    else if (dJ && dI) { sJ.res = sI.res = 'draw'; dinamiteDupla = true; sJ.danoPropio = sI.danoPropio = cJ.params.dupla; dizer('Dinamite contra Dinamite! Os dois sofrem ' + cJ.params.dupla + '.'); }
    else if (dJ) { sJ.res = 'win'; sI.res = 'lose'; }
    else if (dI) { sI.res = 'win'; sJ.res = 'lose'; }
    else if (sJ.naipe === sI.naipe) { sJ.res = sI.res = 'draw'; }
    else if (vence(sJ.naipe, sI.naipe)) { sJ.res = 'win'; sI.res = 'lose'; }
    else { sI.res = 'win'; sJ.res = 'lose'; }

    // Vencer empates: efeitos de carta, omamoris e regras. Se os dois lados vencem, continua empate.
    if (empateOriginal) {
      const venceEmpate = s => {
        if (s.efs.some(x => x.ef.venceEmpate && x.ef.venceEmpate(s, s.op, ctx, x.p))) return true;
        if (s.j.omamoris.some(id => OMAMORIS_EFEITOS[id] && OMAMORIS_EFEITOS[id].venceEmpate && OMAMORIS_EFEITOS[id].venceEmpate(estado, s.j))) return true;
        if (s.lado === 'inimigo' && estado.regras.teimoso) return true;
        if (s.lado === 'inimigo' && estado.poder === 'pedreiro' && blitzAtiva(estado)) return true;   // Muralha viva
        return false;
      };
      const vJ = venceEmpate(sJ), vI = venceEmpate(sI);
      if (vJ && !vI) { sJ.res = 'win'; sI.res = 'lose'; sJ.empateGanho = true; dizer('O empate conta como vitória para ' + sJ.j.nome + '!'); }
      else if (vI && !vJ) {
        sI.res = 'win'; sJ.res = 'lose'; sI.empateGanho = true; dizer('O empate conta como vitória para ' + sI.j.nome + '!');
        if (estado.poder === 'pedreiro') { sI.cura += 1; dizer('Muralha viva: ' + sI.j.nome + ' cura 1.'); }
      }
    }
    if (sJ.res === 'draw' && !dinamiteDupla) dizer('Empate: as duas cartas vão para o cemitério.');

    // --- 7) Efeitos das cartas, selos e omamoris ---
    lados.forEach(s => { if (s.res === 'win') s.dano = cfg.danoPadrao; });
    const caso = { win: 'vencer', lose: 'perder', draw: 'empatar' };
    lados.forEach(s => {
      if (!s.carta || dinamiteDupla) return;
      s.efs.forEach(x => {
        const ef = x.ef;
        if (s.empateGanho && ef.ganhouEmpate && ef.ganhouEmpate(s, s.op, ctx, x.p) !== false) s.ativou = true;
        if (ef[caso[s.res]] && ef[caso[s.res]](s, s.op, ctx, x.p, s.escolhas, x) !== false) s.ativou = true;
        if (ef.sempre && ef.sempre(s, s.op, ctx, x.p, s.escolhas, x) !== false) s.ativou = true;
        if (s.res === 'win' && x.p && x.p.bonusDano) { s.dano += x.p.bonusDano; dizer(s.carta.nome + ': +' + x.p.bonusDano + ' de dano.'); }
      });
    });
    // Dinamite: o dano vem do efeito mesmo sem "vencer" explícito (ela vence qualquer naipe)
    // Duelista: o Embalo soma dano na vitória seguinte
    if (estado.poder === 'duelista' && sI.res === 'win' && estado.inimigo.embalo > 0) { sI.dano += estado.inimigo.embalo; dizer('Embalo: ' + sI.j.nome + ' causa +' + estado.inimigo.embalo + '.'); }
    if (estado.poder === 'duelista') estado.inimigo.embalo = sI.res === 'win' ? Math.min(2, estado.inimigo.embalo + 1) : sI.res === 'lose' ? 0 : estado.inimigo.embalo;
    // Selos de dano
    lados.forEach(s => {
      if (!s.carta || dinamiteDupla) return;
      if (s.carta.mod === 'pesada' && s.res === 'win') { s.dano += 1; dizer('Pesada: +1 de dano.'); }
      if (s.carta.mod === 'blindada' && s.res === 'lose') { s.reduz += 1; }
    });
    // Cutelo: o dobro do dano na Blitz
    lados.forEach(s => { if (s.dobro && s.res === 'win' && s.dano > 0) { s.dano *= 2; dizer(s.carta.nome + ': o dano dobra (' + s.dano + ').'); } });
    // Omamoris de vitória, derrota e empate
    lados.forEach(s => {
      if (!s.carta || dinamiteDupla) return;
      dispararResultado(estado, { win: 'vitoria', lose: 'derrota', draw: 'empate' }[s.res], s, s.op, ctx);
    });
    lados.forEach(s => { if (s.carta && s.res === 'win' && !dinamiteDupla) dispararResultado(estado, 'vitoriaFinal', s, s.op, ctx); });

    // --- 8) Dano e cura (simultâneos) ---
    const blitz = blitzAtiva(estado);
    const danoEmpate = blitz ? cfg.danoEmpateBlitz : cfg.danoEmpate;
    const tieDano = sJ.res === 'draw' && !dinamiteDupla && cJ && cI ? danoEmpate : 0;
    if (tieDano && blitz) lados.forEach(s => {
      if (s.j.omamoris.indexOf('relogio') >= 0 && !s.j.usos.relogio) { s.j.usos.relogio = true; s.semDanoEmpate = true; dizer('Relógio Quebrado: ' + s.j.nome + ' não leva o dano deste empate.'); }
    });
    const total = {}, sangriaDano = { jogador: 0, inimigo: 0 };
    [estado.jogador, estado.inimigo].forEach(j => {   // Multa: os danos agendados no fim desta rodada
      j.sangrias = j.sangrias.filter(k => {
        if (k.nova) { k.nova = false; return true; }
        sangriaDano[j.lado] += k.dano; k.restam--;
        dizer('Multa: ' + j.nome + ' sofre ' + k.dano + '.');
        return k.restam > 0;
      });
    });
    lados.forEach(s => {
      let recebido = s.evitar ? 0 : s.op.dano;
      if (recebido > 0 && s.reduz > 0) recebido = Math.max(0, recebido - s.reduz);
      const empate = tieDano && !s.semDanoEmpate ? tieDano : 0;
      total[s.lado] = recebido + empate + s.danoPropio + s.op.causaDireta + sangriaDano[s.lado];
      if (empate) dizer((blitz ? 'Blitz! ' : '') + s.j.nome + ' sofre ' + empate + ' pelo empate.');
    });
    lados.forEach(s => {
      s.j.vida = Math.min(s.j.vidaMax, s.j.vida - total[s.lado] + s.cura);
      if (total[s.lado] > 0) dizer(s.j.nome + ' sofre ' + total[s.lado] + ' de dano.');
      if (s.cura > 0) dizer(s.j.nome + ' cura ' + s.cura + '.');
    });
    // A Ladra: cada rodada que ela vence rouba 1 moeda
    if (estado.regras.ladra && sI.res === 'win' && estado.roubadas < estado.moedasJogador) { estado.roubadas++; dizer('A Ladra roubou 1 moeda.'); }

    // --- 9) Zonas: a carta jogada ---
    const cortadasAgora = { jogador: false, inimigo: false }, fragilAgora = { jogador: false, inimigo: false };
    lados.forEach(s => {
      const c = s.carta;
      if (!c) return;
      c.naipe = ehCuringa(c) ? c.naipe : c.def.naipe;
      const j = s.j, blind = c.mod === 'blindada';
      const cortadaPorOp = s.op.cortaOp && !blind;
      if (dinamiteDupla && ehFragil(c)) { j.cortadas.push(c); fragilAgora[s.lado] = true; return; }
      if (c.efeito === 'dinamite') { j.cortadas.push(c); fragilAgora[s.lado] = true; return; }
      if (ehFragil(c)) { j.cortadas.push(c); fragilAgora[s.lado] = true; dizer(c.nome + ' é Frágil: vai para as Cortadas.'); }
      else if (cortadaPorOp) { j.cortadas.push(c); cortadasAgora[s.lado] = true; dizer(c.nome + ' foi Cortada.'); }
      else if (s.cortarSelf && !blind) { j.cortadas.push(c); cortadasAgora[s.lado] = true; dizer(c.nome + ' é Cortada.'); }
      else if (s.fica) { c.mantida = true; j.mao.push(c); }
      else j.cemiterio.push(c);
      // Marcada de volta na mão não vale: a carta voltou "limpa"
    });
    // Estados que andam
    lados.forEach(s => {
      const j = s.j;
      j.jogadas += s.carta ? 1 : 0;
      j.perdeuAntes = s.res === 'lose';
      j.ultimoResultado = s.res;
      if (s.carta) {
        j.ultimaCarta = { efeito: s.carta.efeito, params: s.carta.params, nome: s.carta.nome, id: s.carta.def.id };
        if (j.testamento && j.testamento.usado) j.testamento = null;
      }
    });
    // Geodo: os turnos na mão contam para cada Geodo que ficou na mão
    [estado.jogador, estado.inimigo].forEach(j => { j.mao.forEach(c => { c.turnos++; }); });

    // --- Registro para a IA e para as estatísticas ---
    const an = estado.anuncio;
    const anunciouVerdade = an ? (an.cartaUid != null ? (cI ? an.cartaUid === cI.uid : false) : an.naipe ? an.naipe === (sI.naipe || null) : null) : null;
    estado.historico.push({
      naipeJogador: sJ.naipe, naipeInimigo: sI.naipe, resultadoJogador: sJ.res, resultadoInimigo: sI.res,
      eidJogador: cJ ? cJ.eid : null, nomeJogador: cJ ? cJ.nome : null, anuncioVerdade: anunciouVerdade
    });

    // --- 11) Fim do combate ---
    checarFim(estado);
    if (!estado.fim && estado.rodada >= cfg.limiteRodadas) {
      const vJ = estado.jogador.vida, vI = estado.inimigo.vida;
      estado.fim = vJ === vI ? 'empate' : (vJ > vI ? 'vitoria' : 'derrota');
      dizer('Limite de ' + cfg.limiteRodadas + ' rodadas atingido.');
    }
    if (estado.fim) { dizer('FIM: ' + { vitoria: 'vitória!', derrota: 'derrota.', empate: 'empate.' }[estado.fim]); disparar(estado, 'fimCombate'); }

    // --- 10) O resto da mão é descartado (com escolha do jogador, se for o caso) ---
    const descartes = { jogador: [], inimigo: [] };
    estado.planoGuardar = { lados, descartes };
    const pend = estado.fim ? null : planejarGuardar(estado, lados);
    if (pend) estado.pendente = pend;
    else if (!estado.fim) aplicarGuardar(estado, lados, null, descartes);

    const detalhes = {
      vidaAntes, vidaDepois: { jogador: estado.jogador.vida, inimigo: estado.inimigo.vida },
      dano: { jogador: total.jogador, inimigo: total.inimigo },
      cura: { jogador: sJ.cura, inimigo: sI.cura },
      dinamite: !!(dJ || dI), empate: sJ.res === 'draw', empateOriginal, dinamiteDupla,
      blitz, blitzComecou: !!estado.blitzComecouAgora,
      marcada: { jogador: !!(cJ && cJ.vinhaMarcada), inimigo: !!(cI && cI.vinhaMarcada) },
      cortada: cortadasAgora, fragil: fragilAgora,
      fica: { jogador: !!(cJ && sJ.fica), inimigo: !!(cI && sI.fica) },
      aleatoria: { jogador: !!estado.jogador.aleatoriaUsada, inimigo: !!estado.inimigo.aleatoriaUsada },
      anuncio: an ? { naipe: an.naipe, verdade: anunciouVerdade, tipo: an.tipo, cartaNome: an.cartaNome || null } : null,
      descartadas: descartes,
      moedas: estado.jogador.moedas, roubadas: estado.roubadas,
      pendente: !!estado.pendente
    };
    detalhes.frase = montarFrase(estado, sJ, sI, detalhes);
    return {
      resultado: sJ.res === 'win' ? 'vitoria' : sJ.res === 'lose' ? 'derrota' : 'empate',
      jogador: { carta: cJ, naipe: sJ.naipe }, inimigo: { carta: cI, naipe: sI.naipe },
      eventos, fim: estado.fim, detalhes
    };
  }

  // ---------- Guardar e descartar (passo 10) ----------
  // Cartas que ficam na mão: Frágeis não (vão às Cortadas), "nunca descartadas", selo Guardada, Cascalho (as outras),
  // e as escolhidas por Papelão+, Recorte e Caderno. A mão do próximo turno tem o tamanho de sempre.
  function planejarGuardar(estado, lados) {
    let pend = null;
    lados.forEach(s => {
      const j = s.j;
      const obrig = j.mao.filter(c => c.def.nuncaDescarta || c.mantida);
      let n = s.guardarN;
      if (estado.poder === 'arquivista' && s.lado === 'inimigo') n += 1;   // Arquivo morto: guarda a mais forte
      if (temOmamori(j, 'caderno') && j.usos.cadernoPedido) { n += 1; j.usos.cadernoPedido = false; j.usos.caderno = true; }
      const livres = j.mao.filter(c => obrig.indexOf(c) < 0);
      const auto = livres.filter(c => c.mod === 'guardada' || s.guardarTudo);
      const resto = livres.filter(c => auto.indexOf(c) < 0);
      const cap = Math.max(0, tamanhoMaoProx(estado, j) - obrig.length);
      s.plano = { obrig, auto, resto, n, marca: s.guardarMarca, secreta: s.guardarSecreta || (estado.poder === 'arquivista' && s.lado === 'inimigo'), cap };
      if (s.lado === 'jogador' && !pend) {
        const k = Math.min(cap, auto.length + Math.min(n, resto.length));
        if (k > 0 && livres.length > k && (n > 0 || auto.length > cap)) pend = { lado: 'jogador', n: k, candidatos: livres, marca: s.guardarMarca };
      }
    });
    return pend;
  }
  const tamanhoMaoProx = (estado, j) => j.baseMao + (j.maisUm ? 1 : 0);
  // escolhaJogador: lista de uids que o jogador quis guardar (ou null para decisão automática)
  function aplicarGuardar(estado, lados, escolhaJogador, descartes) {
    lados.forEach(s => {
      const j = s.j, p = s.plano;
      if (!p) return;
      let guardar = [];
      if (s.lado === 'jogador' && escolhaJogador) {
        guardar = escolhaJogador.map(u => j.mao.find(c => c.uid === u)).filter(Boolean);
      } else {
        guardar = p.auto.slice(0, p.cap);
        p.resto.slice().sort((a, b) => valorAI(b) - valorAI(a)).slice(0, Math.min(p.n, Math.max(0, p.cap - guardar.length))).forEach(c => guardar.push(c));
      }
      guardar = guardar.filter((c, i, a) => a.indexOf(c) === i).slice(0, p.cap);
      if (p.marca) guardar.filter(c => p.auto.indexOf(c) < 0).forEach(c => { if (!imuneMarca(estado, j, c)) c.marcada = true; });
      if (p.secreta && podeSecretar(estado, j)) guardar.filter(c => p.auto.indexOf(c) < 0).forEach(c => { c.secreta = true; });
      // O resto da mão é descartado (Delatora marca o topo do deck do oponente)
      j.mao.slice().forEach(c => {
        if (p.obrig.indexOf(c) >= 0 || guardar.indexOf(c) >= 0) return;
        remover(j.mao, c); c.marcada = false; c.secreta = false; j.cemiterio.push(c);
        descartes[s.lado].push(c);
        if (c.mod === 'delatora' && estado.modo !== 'aberta') { if (marcarTopo(estado, s.op.j, 1)) registrar(estado, 'Delatora: a carta do topo do deck de ' + s.op.j.nome + ' ficou Marcada.'); }
      });
      j.mao.forEach(c => { c.mantida = false; });
    });
  }
  // IA e descarte automático: a carta mais valiosa fica
  const valorAI = c => ({ comum: 0, rara: 2, lendaria: 4, prismatica: 5, especial: 4, trofeu: 3 }[c.def.raridade] || 0) + (c.up ? 1 : 0);

  // Conclui o passo 10 depois de o jogador escolher (uids das cartas que ficam na mão)
  function concluirRodada(estado, uids) {
    if (!estado.planoGuardar) return;
    const { lados, descartes } = estado.planoGuardar;
    aplicarGuardar(estado, lados, uids || [], descartes);
    estado.pendente = null; estado.planoGuardar = null;
  }

  function descreve(s) { return s.carta ? s.carta.nome + ' ' + SIMBOLO(s.naipe) : '(sem carta)'; }

  // Frase curta que resume a rodada. Ex.: "Estilete ▲ venceu Papel ■. O Rochedo sofre 2 de dano."
  function montarFrase(estado, sJ, sI, d) {
    const leva = lado => {
      const j = estado[lado], n = d.dano[lado];
      return n > 0 ? (lado === 'jogador' ? 'Você sofre ' : j.nome + ' sofre ') + n + ' de dano.' : '';
    };
    if (d.dinamiteDupla) return 'Duas Dinamites explodiram! Os dois sofrem ' + d.dano.jogador + ' de dano.';
    if (sJ.res === 'draw') {
      if (!sJ.carta && !sI.carta) return 'Ninguém tinha carta jogável. Rodada em branco.';
      const dano = d.dano.jogador > 0 || d.dano.inimigo > 0 ? ' ' + [leva('jogador'), leva('inimigo')].filter(Boolean).join(' ') : ' Ninguém sofre dano.';
      return descreve(sJ) + ' e ' + descreve(sI) + ' empataram.' + dano;
    }
    const v = sJ.res === 'win' ? sJ : sI, p = v.op;
    const verbo = d.cortada && d.cortada[p.lado] ? 'cortou' : 'venceu';
    const base = (v.lado === 'jogador' ? 'Sua ' : 'A ') + descreve(v) + ' ' + verbo + ' ' + descreve(p) + '.';
    const danos = [leva('jogador'), leva('inimigo')].filter(Boolean).join(' ');
    return base + (danos ? ' ' + danos : '');
  }

  // ---------- Ações do jogador no meio da rodada ----------
  // Cartola: troca 1 carta da mão pela do topo do deck (a carta trocada vai para o fundo do deck)
  function usarCartola(estado, lado, uid) {
    const j = estado[lado];
    if (!temOmamori(j, 'cartola') || j.usos.cartola) return false;
    const c = j.mao.find(x => x.uid === uid);
    if (!c || c.def.nuncaDescarta || !j.deck.length) return false;
    j.usos.cartola = true;
    remover(j.mao, c); c.marcada = false; c.secreta = false; j.deck.unshift(c);
    j.mao.push(j.deck.pop());
    if (estado.decisaoIA == null) estado.decisaoIA = null;
    registrar(estado, j.nome + ' usou a Cartola.');
    return true;
  }
  // Caderno: guarda 1 carta da mão no fim deste turno (uma vez por combate)
  function pedirCaderno(estado, lado) {
    const j = estado[lado];
    if (!temOmamori(j, 'caderno') || j.usos.caderno || j.usos.cadernoPedido) return false;
    j.usos.cadernoPedido = true; return true;
  }

  // ---------- Ajudas para testes, tutorial e interface ----------
  // Troca a mão (e opcionalmente o deck) de um lado por cartas novas
  function definirMao(estado, lado, entradas, entradasDeck) {
    const j = estado[lado];
    j.mao = entradas.map(e => { const c = cartaDeEntrada(e, estado.proximoUid++); if (ehCuringa(c)) { c.idx = 0; c.naipe = 'pedra'; } return c; });
    if (entradasDeck) j.deck = entradasDeck.map(e => { const c = cartaDeEntrada(e, estado.proximoUid++); return c; }).reverse();
    j.todas = j.mao.concat(j.deck, j.cemiterio, j.cortadas);
    return j.mao;
  }

  return {
    cartaDeEntrada, criarRng, embaralhar, escolherUm, criarCombate, iniciarRodada, resolverRodada, concluirRodada, jogaveis, odds,
    blitzAtiva, vence, marcarMao, marcarTopo, temOmamori, definirMao, escolhasNecessarias, naipeDe, checarFim, ehFragil, ehCuringa,
    usarCartola, pedirCaderno, tamanhoMao, CICLO, registrar, comprar,
    modo, definirModo, ehSecreta, podeSecretar, secretar, taparCarta, revelarSecretas, imuneMarca, valorAI
  };
})();
