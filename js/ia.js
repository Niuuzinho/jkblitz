// ============================================================
// IA DOS INIMIGOS (V4.1)
// Escolhe a carta por pesos de naipe (a personalidade) dentro da própria mão, e depois a carta dentro do naipe
// pelo ESTILO do arquétipo do inimigo (Investida, Muralha, Arquivo, Leitura, Blitz ou Blefe).
// Usa só informação pública: as odds do jogador e as cartas dele que estão Marcadas.
// No modo Mão aberta ela também lê a mão do jogador (menos as cartas Secretas): 60% das jogadas
// vêm dessa leitura e 40% dos pesos da personalidade (CONFIG.maoAberta.leitura).
// Só o Trapaceiro anuncia o que vai jogar, e ele sempre mente.
// ============================================================
const IA = (function () {
  const BASE3 = ['pedra', 'papel', 'tesoura'];
  const queVence = n => BASE3.find(x => NAIPES[x].vence === n);   // o naipe que vence n
  const ultimo = (estado, chave) => { const h = estado.historico; return h.length ? h[h.length - 1][chave] : null; };
  const argmax = d => BASE3.slice().sort((a, b) => d[b] - d[a])[0];
  const normalizar = d => { const t = BASE3.reduce((a, k) => a + d[k], 0); BASE3.forEach(k => { d[k] = t > 0 ? d[k] / t : 1 / 3; }); return d; };
  // Efeitos que existem para causar dano
  const DANO = new Set(['pedrada', 'multa', 'estilete', 'fossil', 'geodo', 'guilhotina', 'cutelo', 'abridor', 'bisturi', 'excalisoura', 'ponteiro', 'florete', 'pedraangular', 'fichario', 'dinamite', 'meteoro']);
  const empatadoras = new Set(['seixo', 'monolito', 'pedraangular']);
  const guardadoras = new Set(['cascalho', 'rascunho', 'recorte', 'fichario']);
  const marcadoras = new Set(['cristal', 'bilhete', 'mapa']);
  const decisivas = new Set(['cutelo', 'meteoro', 'ponteiro', 'bainha', 'pedraangular']);   // cartas que o estilo Blitz guarda para a Blitz

  // Chance de cada naipe na jogada do jogador (soma 1). Normal: odds, com as Marcadas como certeza.
  // Mão aberta: a mão visível do jogador, com peso maior para cartas com efeito e para as que vencem cartas da IA.
  function distJogador(estado) {
    const d = { pedra: 0, papel: 0, tesoura: 0 };
    if (estado.modo === 'aberta') {
      const minhas = estado.inimigo.mao;
      let tot = 0;
      estado.jogador.mao.forEach(c => {
        if (Motor.ehSecreta(estado, c) || (c.def.soBlitz && !Motor.blitzAtiva(estado)) || BASE3.indexOf(c.naipe) < 0) return;
        const w = 1 + (c.efeito && c.efeito !== 'bonus' && c.efeito !== 'curinga' ? 0.5 : 0) + (minhas.some(m => Motor.vence(c.naipe, m.naipe)) ? 0.5 : 0);
        d[c.naipe] += w; tot += w;
      });
      if (tot > 0) return normalizar(d);
    }
    const o = Motor.odds(estado.jogador);
    BASE3.forEach(k => { d[k] = o[k]; });
    o.marcadas.forEach(m => { if (d[m.naipe] !== undefined) d[m.naipe] += 60; });
    return normalizar(d);
  }
  // Naipe mais provável do jogador
  const naipeProvavel = estado => argmax(distJogador(estado));

  // Pesos de naipe da personalidade (somam 1) e o ajuste pelas informações públicas
  function pesos(estado, dist) {
    const ia = estado.inimigoDef.ia || {}, p = { pedra: 1 / 3, papel: 1 / 3, tesoura: 1 / 3 };
    const naipeJ = ultimo(estado, 'naipeJogador'), naipeI = ultimo(estado, 'naipeInimigo'), resI = ultimo(estado, 'resultadoInimigo');
    const dar = (n, v) => { const resto = (1 - v) / 2; BASE3.forEach(k => { p[k] = k === n ? v : resto; }); };
    const base = n => BASE3.indexOf(n) >= 0;
    dist = dist || distJogador(estado);
    if (ia.padrao === 'rochedo') dar('pedra', ia.pedra);
    else if (ia.padrao === 'copiadora' && base(naipeJ)) dar(naipeJ, ia.repete);
    else if (ia.padrao === 'vingativo' && resI === 'lose' && base(naipeJ)) dar(queVence(naipeJ), ia.vinganca);
    else if (ia.padrao === 'docontra' && base(naipeI)) { p[naipeI] = 0; BASE3.filter(k => k !== naipeI).forEach(k => { p[k] = 0.5; }); }
    else if (ia.padrao === 'leitora') dar(queVence(argmax(dist)), ia.le);
    else if (ia.padrao === 'duelista' && resI === 'win' && base(naipeI)) dar(naipeI, ia.repete);   // depois de vencer, repete o naipe
    // Informação pública: se um naipe do jogador passa de 50%, o naipe que o vence ganha peso
    BASE3.forEach(n => { if (dist[n] > 0.5) p[queVence(n)] *= 1.5; });
    // Estilo Muralha: na Blitz prefere empatar (joga o naipe mais provável do jogador)
    if (ia.arq === 'Muralha' && Motor.blitzAtiva(estado)) p[argmax(dist)] *= 2;
    return normalizar(p);
  }

  const probVence = (c, dist) => (c.def.naipe === 'nenhum' ? 1 : BASE3.reduce((a, k) => a + (Motor.vence(c.naipe, k) ? dist[k] : 0), 0));

  // Quanto vale jogar esta carta agora: condições cumpridas e o estilo do arquétipo
  function valorCarta(estado, c, dist) {
    const ia = estado.inimigoDef.ia || {}, arq = ia.arq, blitz = Motor.blitzAtiva(estado), ef = c.efeito;
    const pv = probVence(c, dist), pe = dist[c.naipe] || 0, aberta = estado.modo === 'aberta';
    const jogMarcadas = estado.jogador.mao.some(x => x.marcada);
    let b = 1 + ({ comum: 0, rara: 0.2, lendaria: 0.4, prismatica: 0.6, especial: 0.5, trofeu: 0.4 }[c.def.raridade] || 0);
    // Condições específicas de cada carta
    if (blitz && decisivas.has(ef)) b *= 3;
    if (ef === 'abridor' || ef === 'bisturi') b *= (aberta || jogMarcadas) ? 2.5 : 0.6;
    if (ef === 'estilete' && estado.inimigo.jogadas === 0) b *= 1.5;
    if (ef === 'fossil') b *= estado.inimigo.cemiterio.filter(x => x.def.naipe === 'pedra').length >= 2 ? 1.6 : 0.8;
    if (ef === 'geodo') b *= c.turnos >= 2 ? 2 : 0.7;
    // Estilo do arquétipo
    if (arq === 'Investida') {
      if (DANO.has(ef) || (c.params && c.params.dano >= 2)) b *= pv > 0.5 ? 2.5 : 0.7;
      if (Motor.ehFragil(c)) b *= pv >= 0.7 ? 2 : 0.25;   // guarda as Frágeis para quando tiver certeza
    } else if (arq === 'Muralha') {
      if (empatadoras.has(ef)) b *= pe > 0.4 ? 3 : (blitz ? 1.5 : 1);
    } else if (arq === 'Arquivo') {
      if (c.def.raridade === 'lendaria' || DANO.has(ef)) b *= pv > 0.5 ? 2.5 : 0.35;   // guarda as Lendárias e o dano até a condição
      if (guardadoras.has(ef) && estado.rodada <= 2) b *= 1.6;
    } else if (arq === 'Leitura') {
      if (marcadoras.has(ef)) b *= estado.rodada <= 4 ? 3 : 1.2;   // marca primeiro
      if (ef === 'abridor' || ef === 'bisturi') b *= 1.2;          // e ataca as Marcadas depois
    } else if (arq === 'Blitz') {
      if (decisivas.has(ef)) b *= blitz ? 4 : 0.15;                 // guarda as cartas de Blitz para a Blitz
      else if (c.def.raridade === 'comum') b *= blitz ? 0.7 : 1.6;  // gasta as fracas antes
    } else if (arq === 'Blefe') {
      if (c.def.naipe === 'curinga' && Motor.vence(c.naipe, argmax(dist))) b *= 3;
    }
    return b;
  }

  function escolherCarta(estado) {
    const j = estado.inimigo, pool = Motor.jogaveis(estado, j);
    if (!pool.length) return null;
    const rng = estado.rng, dist = distJogador(estado), w = pesos(estado, dist);
    const grupos = {};
    pool.forEach(c => { (grupos[c.naipe] = grupos[c.naipe] || []).push(c); });
    const naipes = Object.keys(grupos);
    let esc = null;
    // Trapaceiro: joga o Curinga quando o naipe da vez vence o naipe mais provável do jogador
    if (estado.poder === 'trapaceiro') {
      const cur = pool.find(c => c.def.naipe === 'curinga' && Motor.vence(c.naipe, argmax(dist)));
      if (cur && rng() < 0.8) return cur;
    }
    // Mão aberta: 60% das vezes, joga o naipe que vence a carta mais provável do jogador (lida na mão dele)
    if (estado.modo === 'aberta' && rng() < estado.cfg.maoAberta.leitura) {
      const v = queVence(argmax(dist));
      if (grupos[v]) esc = v;
    }
    if (!esc) {
      // Peso do naipe = peso da personalidade x (valor da melhor carta do naipe) ^ 0,75: o estilo do arquétipo também puxa o naipe
      const valores = {};
      naipes.forEach(n => { valores[n] = Math.max.apply(null, grupos[n].map(c => valorCarta(estado, c, dist))); });
      const peso = n => (w[n] !== undefined ? w[n] : 0.2) * Math.pow(valores[n], 0.75);
      const tot = naipes.reduce((a, n) => a + peso(n), 0);
      let x = rng() * tot;
      esc = naipes[naipes.length - 1];
      for (let i = 0; i < naipes.length; i++) { x -= peso(naipes[i]); if (x < 0) { esc = naipes[i]; break; } }
    }
    const cartas = grupos[esc], pesosC = cartas.map(c => valorCarta(estado, c, dist));
    let y = rng() * pesosC.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cartas.length; i++) { y -= pesosC[i]; if (y < 0) return cartas[i]; }
    return cartas[cartas.length - 1];
  }

  // Decisões que certas cartas pedem ao jogar (a IA decide sozinha)
  function escolhasPara(estado, lado, carta) {
    const e = {};
    if (!carta) return e;
    const j = estado[lado], ia = estado.inimigoDef.ia || {};
    if (carta.def.escolhe === 'naipe') {
      const naipeJ = ultimo(estado, 'naipeJogador');
      // Copiadora pede o naipe que o jogador jogou; os outros pedem o que vence o mais provável do jogador
      e.naipe = ia.padrao === 'copiadora' && BASE3.indexOf(naipeJ) >= 0 ? naipeJ : queVence(naipeProvavel(estado));
      if (!j.deck.some(c => c.naipe === e.naipe)) e.naipe = BASE3.find(n => j.deck.some(c => c.naipe === n)) || e.naipe;
    }
    if (carta.def.escolhe === 'carta') {
      const dist = distJogador(estado);
      const lista = j.cemiterio.concat(carta.params.cortadas ? j.cortadas : []).filter(x => x.efeito && x.efeito !== 'testamento');
      lista.sort((a, b) => (valorCarta(estado, b, dist) + (b.params.dano || 0)) - (valorCarta(estado, a, dist) + (a.params.dano || 0)));
      if (lista[0]) e.cartaUid = lista[0].uid;
    }
    return e;
  }

  // Anúncio do Trapaceiro: ele sempre mente. Escolhe o naipe (ou, na Mão aberta, a carta) que o jogador mais teme.
  // Devolve null se o inimigo não anuncia.
  function anunciar(estado, carta) {
    if (estado.inimigoDef.anuncio !== 'mentira' || !carta || carta.def.naipe === 'nenhum') return null;
    const dist = distJogador(estado);
    if (estado.modo === 'aberta') {
      const outras = estado.inimigo.mao.filter(c => c !== carta && !Motor.ehSecreta(estado, c) && c.def.naipe !== 'nenhum');
      if (outras.length) {
        outras.sort((a, b) => probVence(b, dist) - probVence(a, dist));
        return { tipo: 'mentira', naipe: outras[0].naipe, cartaUid: outras[0].uid, cartaNome: outras[0].nome };
      }
    }
    const real = carta.naipe, cand = BASE3.filter(n => n !== real);
    // o naipe mentiroso que mais ameaça o jogador (vence o naipe mais provável dele), senão o primeiro
    const temido = queVence(argmax(dist));
    const naipe = cand.indexOf(temido) >= 0 ? temido : cand[Math.floor(estado.rng() * cand.length)];
    return { tipo: 'mentira', naipe };
  }

  // Chamada depois de Motor.iniciarRodada: decide a carta e o anúncio do inimigo
  function preparar(estado) {
    const carta = escolherCarta(estado);
    estado.decisaoIA = { uid: carta ? carta.uid : null, escolhas: escolhasPara(estado, 'inimigo', carta) };
    estado.anuncio = estado.inimigo.aleatoria ? null : anunciar(estado, carta);
    return estado.decisaoIA;
  }

  return { preparar, escolherCarta, escolhasPara, anunciar, pesos, naipeProvavel, distJogador, queVence };
})();
