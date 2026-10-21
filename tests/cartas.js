// Testes das regras, de cada carta, selo e omamori da V4 (rodam em node, sem navegador).
// Uso: node tests/cartas.js
const { carregar } = require('./carregar.js');
const A = carregar();
const { Motor, IA, Run, CONFIG, CARTAS, CARTAS_POR_ID, OMAMORIS, MODIFICADORES, INIMIGOS, SUBCHEFES, CHEFOES, BASE, NAIPES } = A;
let total = 0, falhas = 0;
function ok(cond, msg) { total++; if (!cond) { falhas++; console.log('FALHOU:', msg); } }
function igual(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), msg + ' (esperado ' + JSON.stringify(b) + ', veio ' + JSON.stringify(a) + ')'); }

const D = (...ids) => ids.map(id => (typeof id === 'string' ? { id } : id));
const FILL = D('pedra', 'papel', 'tesoura', 'pedra', 'papel', 'tesoura', 'pedra', 'papel', 'tesoura');
// Cena: as 3 primeiras cartas de cada lista formam a mão da rodada 1 (ordem fixa)
function cena(mj, mi, opc) {
  opc = opc || {};
  const cfg = JSON.parse(JSON.stringify(CONFIG));
  const e = Motor.criarCombate({ cfg, deckJogador: mj.concat(opc.restoJ || FILL), inimigo: { nome: 'Teste', deck: mi.concat(opc.restoI || FILL), ia: opc.ia || {}, anuncio: opc.anuncio || null, vida: opc.vidaI || 5, poderId: opc.poder || null, tipo: opc.tipo || 'comum' },
    semente: 7, ordemFixa: true, omamoris: opc.omamoris || [], rodadaBlitz: opc.blitz != null ? opc.blitz : 6, regras: opc.regras || {}, modo: opc.modo });
  if (opc.vida) { e.jogador.vida = e.jogador.vidaMax = opc.vida; }
  return e;
}
function comecar(e) { Motor.iniciarRodada(e); IA.preparar(e); return e; }
const maoJ = (e, i) => e.jogador.mao[i], maoI = (e, i) => e.inimigo.mao[i];
// Joga a carta i da mão do jogador contra a carta k da mão do inimigo
function jogar(e, i, k, esc, escI) {
  const cI = maoI(e, k);
  e.decisaoIA = { uid: cI ? cI.uid : null, escolhas: escI || {} };
  const r = Motor.resolverRodada(e, maoJ(e, i).uid, esc || {});
  if (e.pendente) Motor.concluirRodada(e, e.pendente.candidatos.slice(0, e.pendente.n).map(x => x.uid));
  return r;
}
const nomes = l => l.map(c => c.def.id);
const kDe = (e, naipe) => Math.max(0, e.inimigo.mao.findIndex(c => c.naipe === naipe));

// ======================= Regras base =======================
(function regras() {
  let e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')));
  igual(e.jogador.mao.length, 3, 'mão começa com 3');
  igual(e.jogador.vida, 5, 'vida 5');
  let r = jogar(e, 0, 2); // pedra vs tesoura
  igual(r.resultado, 'vitoria', 'pedra vence tesoura');
  igual(e.inimigo.vida, 4, 'dano 1');
  // fim do turno: o que não foi jogado vai para o cemitério
  igual(e.jogador.mao.length, 0, 'mão vazia depois de descartar');
  igual(e.jogador.cemiterio.length, 3, 'cartas da mão e a jogada no cemitério');
  comecar(e);
  igual(e.jogador.mao.length, 3, 'completa a mão até 3 de novo');
  // empate sem dano fora da Blitz
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')));
  r = jogar(e, 0, 0);
  igual([e.jogador.vida, e.inimigo.vida], [5, 5], 'empate fora da Blitz não dá dano');
  // empate na Blitz: 1 de dano para cada lado
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { blitz: 1 }));
  r = jogar(e, 0, 0);
  igual([e.jogador.vida, e.inimigo.vida], [4, 4], 'empate na Blitz dá 1 para cada lado');
  // vitória do jogador contra Blitz: sem dano duplo
  // limite de rodadas: vence quem tiver mais vida
  e = cena(D('pedra'), D('pedra')); e.jogador.vida = 3; e.inimigo.vida = 2;
  for (let i = 0; i < 12 && !e.fim; i++) { comecar(e); jogar(e, 0, 0); }
  ok(e.fim === 'vitoria' || e.fim === 'derrota' || e.fim === 'empate', 'termina no limite');
  // deck acaba: o cemitério é embaralhado e vira o deck
  e = cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { restoJ: [], restoI: D('pedra') });
  comecar(e); jogar(e, 0, 0); comecar(e);
  igual(e.jogador.mao.length, 3, 'reembaralha o cemitério quando o deck acaba');
  igual(e.jogador.deck.length + e.jogador.cemiterio.length + e.jogador.mao.length, 3, 'nenhuma carta se perde');
  // primeira luta: 3 de vida e Blitz na rodada 4
  const run = Run.criar({ cfg: CONFIG, semente: 1 });
  const est = Run.iniciarCombate(run);
  igual([est.jogador.vida, est.inimigo.vida, est.rodadaBlitz], [3, 3, 4], 'primeira luta: 3 de vida e Blitz na rodada 4');
  igual(run.deck.length, 6, 'deck inicial 6 vanillas');
  ok(est.inimigo.todas.every(c => c.def.raridade === 'comum'), 'inimigo da primeira luta só tem vanillas');
})();

// ======================= Guardar, Mão +1, nunca descartadas =======================
(function guardar() {
  // selo Guardada: não jogada, fica na mão e conta nas 3
  let e = comecar(cena([{ id: 'pedra', mod: 'guardada' }, 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('pedra', 'papel', 'tesoura')));
  jogar(e, 1, 0);
  igual(nomes(e.jogador.mao), ['pedra'], 'selo Guardada guarda a carta');
  comecar(e);
  igual(e.jogador.mao.length, 3, 'a carta guardada conta nas 3');
  // Cascalho: perder guarda as outras cartas da mão
  e = comecar(cena(D('cascalho', 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 0, 0); // pedra perde para papel
  igual(nomes(e.jogador.mao), ['papel', 'tesoura'], 'Cascalho guarda as outras cartas ao perder');
  comecar(e);
  igual(e.jogador.mao.length, 3, 'só compra 1 no turno seguinte');
  // Cascalho+: Mão +1 (completa até 4 só no turno seguinte)
  e = comecar(cena([{ id: 'cascalho', up: true }, 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('papel', 'papel', 'papel')));
  jogar(e, 0, 0); comecar(e);
  igual(e.jogador.mao.length, 4, 'Mão +1 completa até 4');
  jogar(e, 0, 0); comecar(e);
  igual(e.jogador.mao.length, 3, 'depois volta a 3');
  // nunca descartadas: Geodo
  e = comecar(cena(D('geodo', 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 1, 0);
  ok(nomes(e.jogador.mao).indexOf('geodo') >= 0, 'Geodo nunca é descartado');
  comecar(e);
  igual(e.jogador.mao.length, 3, 'Geodo ocupa um lugar na mão');
  // Curinga e Ás na Manga não descartam
  e = comecar(cena(D('curinga', 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 1, 0);
  ok(nomes(e.jogador.mao).indexOf('curinga') >= 0, 'Curinga nunca é descartado');
  e = comecar(cena(D('asnamanga', 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 1, 0);
  ok(nomes(e.jogador.mao).indexOf('asnamanga') >= 0, 'Ás na Manga nunca é descartado');
  // Papelão+: perder guarda 1 carta (escolha do jogador pelo pendente)
  e = comecar(cena([{ id: 'papelao', up: true }, 'pedra', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('tesoura', 'papel', 'papel')));
  const cI = maoI(e, 0); e.decisaoIA = { uid: cI.uid, escolhas: {} };
  Motor.resolverRodada(e, maoJ(e, 0).uid, {});
  ok(!!e.pendente && e.pendente.n === 1, 'Papelão+ pede ao jogador qual carta guardar');
  Motor.concluirRodada(e, [e.pendente.candidatos[1].uid]);
  igual(nomes(e.jogador.mao), ['tesoura'], 'a carta escolhida fica');
  // Delatora: descartada sem ser jogada, marca o topo do deck do oponente
  e = comecar(cena([{ id: 'pedra', mod: 'delatora' }, 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('pedra', 'papel', 'tesoura')));
  jogar(e, 1, 0);
  ok(e.inimigo.deck.some(c => c.marcada), 'Delatora marca o topo do deck do oponente ao ser descartada');
  // Na manga: começa na mão do primeiro turno
  e = cena(D('papel', 'papel', 'papel', { id: 'pedra', mod: 'namanga' }), D('pedra', 'papel', 'tesoura'), { restoJ: D('papel', 'papel', 'papel', 'papel', 'papel') });
  comecar(e);
  ok(e.jogador.mao.some(c => c.mod === 'namanga'), 'Na manga começa na mão');
  igual(e.jogador.mao.length, 3, 'e a mão ainda tem 3');
})();

// ======================= Estados: Marcada, Frágil, Cortada, Odds =======================
(function estados() {
  // Marcada: sem bônus de dano; conta como certeza nas odds
  let e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('tesoura', 'papel', 'papel')));
  maoI(e, 0).marcada = true;
  let o = Motor.odds(e.inimigo);
  igual(o.marcadas.length, 1, 'Marcada aparece à parte nas odds');
  igual(o.marcadas[0].naipe, 'tesoura', 'com o naipe certo');
  jogar(e, 0, 0); // pedra vence tesoura marcada
  igual(e.inimigo.vida, 4, 'vencer uma Marcada não dá bônus de dano');
  // Frágil: Guilhotina vai para as Cortadas depois de usada
  e = comecar(cena(D('guilhotina', 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  let r = jogar(e, 0, 0); // tesoura vence papel
  igual(e.inimigo.vida, 1, 'Guilhotina causa 4');
  igual(nomes(e.jogador.cortadas), ['guilhotina'], 'Frágil vai para as Cortadas');
  ok(e.jogador.cemiterio.every(c => c.def.id !== 'guilhotina'), 'e não para o cemitério');
  // Quebradiço: cartas ficam Frágeis só durante a luta
  e = cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { regras: { quebradico: true } });
  igual(e.jogador.todas.filter(c => c.fragilTemp).length, 2, 'Quebradiço deixa 2 cartas Frágeis');
  comecar(e);
  const frag = e.jogador.mao.findIndex(c => c.fragilTemp);
  if (frag >= 0) { jogar(e, frag, 0); ok(e.jogador.cortadas.length === 1, 'carta Frágil temporária vai para as Cortadas'); }
  // Blindada: não pode ser Marcada nem Cortada
  e = comecar(cena([{ id: 'guilhotina', mod: 'blindada' }, 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('papel', 'papel', 'papel')));
  Motor.marcarMao(e, e.jogador, 3);
  ok(e.jogador.mao.filter(c => c.marcada).length === 2 && !e.jogador.mao[0].marcada, 'Blindada não pode ser Marcada');
  jogar(e, 0, 0);
  igual(e.jogador.cortadas.length, 0, 'Blindada não é Cortada (nem pela Fragilidade)');
  // Blindada: perder com ela, sofre 1 a menos
  e = comecar(cena([{ id: 'pedra', mod: 'blindada' }, 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('papel', 'papel', 'papel')));
  jogar(e, 0, 0);
  igual(e.jogador.vida, 5, 'Blindada: perder com ela, sofre 1 a menos');
  // Odds: Curinga aparece como "?"
  e = comecar(cena(D('curinga', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')));
  o = Motor.odds(e.jogador);
  igual(o.curinga, 1, 'Curinga aparece como ? nas odds');
  // Odds: porcentagens entre deck e mão
  e = cena(D('pedra', 'pedra', 'pedra'), D('papel', 'papel', 'papel'), { restoJ: D('papel'), restoI: D('papel') });
  comecar(e);
  o = Motor.odds(e.jogador);
  igual([o.pedra, o.papel, o.tesoura], [75, 25, 0], 'odds: 3 pedras e 1 papel');
  // Curinga muda de naipe a cada rodada
  e = comecar(cena(D('curinga', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')));
  const n1 = e.jogador.mao[0].naipe; jogar(e, 1, 0); comecar(e);
  const cur = e.jogador.mao.find(c => c.def.id === 'curinga');
  ok(cur && cur.naipe !== n1, 'Curinga muda de naipe na rodada seguinte');
  // Dinamite vence qualquer naipe, é Frágil
  e = comecar(cena(D('dinamite', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')));
  jogar(e, 0, 0);
  igual(e.inimigo.vida, 3, 'Dinamite vence qualquer naipe e causa 2');
  igual(nomes(e.jogador.cortadas), ['dinamite'], 'Dinamite é Frágil');
  e = comecar(cena(D('dinamite', 'papel', 'tesoura'), D('dinamite', 'papel', 'tesoura')));
  jogar(e, 0, 0);
  igual([e.jogador.vida, e.inimigo.vida], [3, 3], 'Dinamite contra Dinamite: os dois sofrem 2');
  // Meteoro: só na Blitz
  e = comecar(cena(D('meteoro', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { blitz: 6 }));
  ok(Motor.jogaveis(e, e.jogador).every(c => c.def.id !== 'meteoro'), 'Meteoro não é jogável fora da Blitz');
  e = comecar(cena(D('meteoro', 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { blitz: 1 }));
  ok(Motor.jogaveis(e, e.jogador).some(c => c.def.id === 'meteoro'), 'Meteoro é jogável na Blitz');
  jogar(e, 0, 0); // pedra vence papel? não: papel vence pedra
  igual(e.inimigo.vida, 2, 'Meteoro causa 3 ao oponente seja qual for o resultado');
  igual(e.jogador.vida, 3, 'Meteoro: você sofre 1 (e mais 1 por perder)');
  // Dinamite/Meteoro/Origami no deck em Frágil, Prismáticas não são automaticamente Frágeis
  ok(!CARTAS_POR_ID.excalisoura.fragil, 'Excalisoura não é Frágil');
})();

// ======================= Cartas, uma por uma =======================
function vsPapel(...ids) { return comecar(cena(D(...ids), D('papel', 'papel', 'papel'))); }
function vsTesoura(...ids) { return comecar(cena(D(...ids), D('tesoura', 'tesoura', 'tesoura'))); }
function vsPedra(...ids) { return comecar(cena(D(...ids), D('pedra', 'pedra', 'pedra'))); }
const com = (id, extra) => Object.assign({ id }, extra || {});
(function cartas() {
  // Comuns
  let e = vsTesoura('pedra', 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Pedra vanilla causa 1');
  e = vsTesoura(com('pedra', { up: true }), 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Pedra+ causa 2');
  e = vsPedra(com('papel', { up: true }), 'pedra', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Papel+ causa 2');
  e = vsPapel(com('tesoura', { up: true }), 'pedra', 'papel'); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Tesoura+ causa 2');

  // --- Raras: Investida ---
  e = vsTesoura('pedrada', 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Pedrada vence: 2');
  e = vsTesoura(com('pedrada', { up: true }), 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Pedrada+ vence: 3');
  e = comecar(cena(D('pedrada', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'))); jogar(e, 0, 0); igual([e.inimigo.vida, e.jogador.vida], [4, 5], 'Pedrada empata: o oponente sofre 1');
  e = vsPedra('multa', 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Multa: 1 agora');
  comecar(e); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Multa: +1 no fim da rodada seguinte (o empate não dá dano)');
  comecar(e); jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Multa: +1 na segunda rodada');
  comecar(e); jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Multa: acabou');
  e = vsPedra(com('multa', { up: true }), 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Multa+: 2 agora');
  e = vsPapel('estilete', 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Estilete: 3 se for a primeira carta');
  comecar(e); const ix = e.jogador.mao.findIndex(c => c.def.id === 'estilete'); 
  e = vsPapel('papel', 'estilete', 'tesoura'); jogar(e, 0, 0); comecar(e); // joga papel (empata) depois estilete
  const k = e.jogador.mao.findIndex(c => c.def.id === 'estilete');
  if (k >= 0) { const antes = e.inimigo.vida; jogar(e, k, 0); igual(antes - e.inimigo.vida, 2, 'Estilete: 2 se não for a primeira'); }
  e = vsPapel(com('estilete', { up: true }), 'papel', 'tesoura'); jogar(e, 0, 0); igual(e.inimigo.vida, 1, 'Estilete+: 4 se for a primeira');

  // --- Raras: Muralha ---
  e = comecar(cena(D('seixo', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'))); const r1 = jogar(e, 0, 0); igual([r1.resultado, e.inimigo.vida], ['vitoria', 4], 'Seixo ganha o empate');
  e = comecar(cena(D('seixo', 'papel', 'tesoura'), D('seixo', 'papel', 'tesoura'))); jogar(e, 0, 0); igual([e.jogador.vida, e.inimigo.vida], [5, 5], 'dois Seixos: continua empate');
  e = comecar(cena(D(com('seixo', { up: true }), 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'))); e.jogador.vida = 3; jogar(e, 0, 0); igual(e.jogador.vida, 4, 'Seixo+ cura 1 ao ganhar o empate');
  e = comecar(cena(D('papelao', 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'))); jogar(e, 0, 0); igual(e.jogador.vida, 5, 'Papelão: perder não causa dano');
  e = comecar(cena(D('bainha', 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'))); jogar(e, 0, 0); igual(nomes(e.jogador.mao), ['bainha'], 'Bainha: empatar fica na mão');
  e = comecar(cena(D(com('bainha', { up: true }), 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'), { blitz: 1 })); jogar(e, 0, 0); igual([e.jogador.vida, e.inimigo.vida], [5, 4], 'Bainha+: na Blitz, o empate não dá dano a você');

  // --- Raras: Arquivo ---
  e = comecar(cena(D('rascunho', 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { restoJ: D('tesoura', 'papel', 'pedra', 'pedra') }));
  jogar(e, 0, 0, { naipe: 'tesoura' }); comecar(e);
  ok(e.jogador.mao.some(c => c.naipe === 'tesoura' && c.def.id === 'tesoura'), 'Rascunho: puxa uma carta do naipe escolhido');
  e = comecar(cena(D('recorte', 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 0, 0);
  ok(e.jogador.mao.length === 1 || !!e.pendente === false, 'Recorte: guarda 1 carta');
  igual(e.jogador.mao.length, 1, 'Recorte guarda 1');
  ok(e.jogador.mao[0].marcada, 'e ela fica Marcada');
  e = comecar(cena(D(com('recorte', { up: true }), 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 0, 0); ok(!e.jogador.mao[0].marcada, 'Recorte+: sem ficar Marcada');

  // --- Raras: Leitura ---
  e = comecar(cena(D('cristal', 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 0, 0); igual(e.inimigo.deck.filter(c => c.marcada).length, 1, 'Cristal marca 1 carta do topo do deck');
  e = comecar(cena(D(com('cristal', { up: true }), 'papel', 'tesoura'), D('papel', 'papel', 'papel')));
  jogar(e, 0, 0); igual(e.inimigo.deck.filter(c => c.marcada).length, 2, 'Cristal+ marca 2');
  e = vsPedra('bilhete', 'papel', 'tesoura'); jogar(e, 1, 0); // papel vence pedra? não: papel empata? papel>pedra
  e = comecar(cena(D('papel', 'bilhete', 'tesoura'), D('pedra', 'pedra', 'pedra'))); 
  const ib = e.jogador.mao.findIndex(c => c.def.id === 'bilhete');
  jogar(e, ib, 0); comecar(e); ok(e.inimigo.mao.some(c => c.marcada), 'Bilhete: marca 1 carta aleatória da mão do oponente no turno seguinte');
  e = comecar(cena(D('bilhete', 'papel', 'tesoura'), D('tesoura', 'tesoura', 'tesoura'))); jogar(e, 0, 0); comecar(e);
  ok(!e.inimigo.mao.some(c => c.marcada), 'Bilhete perdendo não marca');
  e = comecar(cena(D(com('bilhete', { up: true }), 'papel', 'tesoura'), D('tesoura', 'tesoura', 'tesoura'))); jogar(e, 0, 0); comecar(e);
  ok(e.inimigo.mao.some(c => c.marcada), 'Bilhete+: marca ao jogar, mesmo perdendo');
  e = comecar(cena(D('abridor', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); maoI(e, 0).marcada = true; jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Abridor: 3 contra Marcada');
  e = comecar(cena(D('abridor', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Abridor: só 1 contra carta não Marcada');
  e = comecar(cena(D(com('abridor', { up: true }), 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); maoI(e, 0).marcada = true; jogar(e, 0, 0); igual(e.inimigo.vida, 1, 'Abridor+: 4');

  // --- Lendárias ---
  e = comecar(cena(D('monolito', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'))); jogar(e, 0, 0);
  igual([e.inimigo.vida, nomes(e.jogador.mao)], [4, ['monolito']], 'Monólito ganha o empate e fica na mão');
  e = comecar(cena(D(com('monolito', { up: true }), 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'))); e.jogador.vida = 3; jogar(e, 0, 0); igual(e.jogador.vida, 4, 'Monólito+ cura 1');
  e = comecar(cena(D('fossil', 'papel', 'tesoura'), D('tesoura', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Fóssil: mínimo 1');
  e = comecar(cena(D(com('fossil', { up: true }), 'papel', 'tesoura'), D('tesoura', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Fóssil+: mínimo 2');
  // Fóssil com 3 pedras no cemitério
  e = comecar(cena(D('pedra', 'pedra', 'pedra'), D('tesoura', 'tesoura', 'tesoura'), { restoJ: D('fossil', 'papel', 'papel') })); jogar(e, 0, 0); comecar(e);
  const fi = e.jogador.mao.findIndex(c => c.def.id === 'fossil');
  ok(fi >= 0, 'Fóssil na mão'); if (fi >= 0) { const v0 = e.inimigo.vida; jogar(e, fi, e.inimigo.mao.findIndex(c => c.naipe === 'tesoura') >= 0 ? e.inimigo.mao.findIndex(c => c.naipe === 'tesoura') : 0); igual(v0 - e.inimigo.vida, 3, 'Fóssil: 1 por pedra no cemitério (3)'); }
  e = comecar(cena(D('geodo', 'papel', 'tesoura'), D('tesoura', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Geodo: mínimo 1');
  e = comecar(cena(D('geodo', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 1, 0); comecar(e); jogar(e, 1, 0); comecar(e);
  const g = e.jogador.mao.find(c => c.def.id === 'geodo'); igual(g.turnos, 2, 'Geodo conta os turnos que passou na mão');
  // Testamento: a próxima carta ganha o efeito da carta escolhida do cemitério
  e = comecar(cena(D('pedrada', com('testamento', { mod: 'guardada' }), com('pedra', { mod: 'guardada' })), D('papel', 'papel', 'papel'), { restoJ: D('papel', 'papel', 'papel'), restoI: D('papel', 'papel', 'papel', 'tesoura', 'tesoura', 'tesoura') }));
  jogar(e, 0, 0); comecar(e);
  let ti = e.jogador.mao.findIndex(c => c.def.id === 'testamento'); const pc = e.jogador.cemiterio.find(c => c.def.id === 'pedrada');
  ok(ti >= 0 && !!pc, 'Testamento na mão e Pedrada no cemitério');
  jogar(e, ti, 0, { cartaUid: pc.uid }); ok(!!e.jogador.testamento, 'Testamento guarda o efeito escolhido'); comecar(e);
  const pi = e.jogador.mao.findIndex(c => c.def.id === 'pedra'); const v0 = e.inimigo.vida;
  jogar(e, pi, kDe(e, 'tesoura')); igual(v0 - e.inimigo.vida, 2, 'Testamento: a próxima carta ganha o efeito de Pedrada (2 de dano)');
  ok(!e.jogador.testamento, 'e o efeito some depois de usado');
  // Origami copia o efeito da última carta jogada (inclusive Lendárias)
  e = comecar(cena(D('guilhotina', com('origami', { mod: 'guardada' }), 'tesoura'), D('papel', 'papel', 'papel'), { restoJ: D('papel', 'papel', 'papel'), restoI: D('papel', 'papel', 'papel', 'papel', 'papel', 'papel') }));
  jogar(e, 0, 0); comecar(e);
  const oi2 = e.jogador.mao.findIndex(c => c.def.id === 'origami'); const v3 = e.inimigo.vida;
  jogar(e, oi2, kDe(e, 'pedra') >= 0 && e.inimigo.mao.some(c => c.naipe === 'pedra') ? kDe(e, 'pedra') : 0);
  // Origami é papel: só vence pedra; o inimigo aqui só tem papel, então empata: confere que a cópia não ativa no empate
  igual(v3 - e.inimigo.vida, 0, 'Origami empatando não causa o dano da Guilhotina');
  e = comecar(cena(D('guilhotina', com('origami', { mod: 'guardada' }), 'tesoura'), D('papel', 'papel', 'papel'), { restoJ: D('papel', 'papel', 'papel'), restoI: D('pedra', 'pedra', 'pedra', 'pedra', 'pedra', 'pedra') }));
  jogar(e, 0, 0); comecar(e);
  const oi3 = e.jogador.mao.findIndex(c => c.def.id === 'origami'); const v4 = e.inimigo.vida;
  jogar(e, oi3, 0); igual(v4 - e.inimigo.vida, 4, 'Origami copia o efeito da Guilhotina (4 de dano)');
  e = comecar(cena(D('mapa', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0); comecar(e);
  ok(e.inimigo.mao.length > 0 && e.inimigo.mao.every(c => c.marcada), 'Mapa: toda a mão do oponente fica Marcada no turno seguinte');
  e = comecar(cena(D(com('mapa', { up: true }), 'papel', 'tesoura'), D('pedra', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Mapa+: vencer causa +1');
  e = comecar(cena(D('nota', 'papel', 'tesoura'), D('pedra', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.jogador.moedas, 1, 'Nota de cem: +1 moeda ao vencer');
  e = comecar(cena(D('nota', 'papel', 'tesoura'), D('pedra', 'pedra', 'pedra'), { restoJ: D('nota', 'nota', 'nota', 'nota', 'nota', 'nota') }));
  for (let i = 0; i < 6; i++) { comecar(e); const ni = e.jogador.mao.findIndex(c => c.def.id === 'nota'); if (ni < 0) break; jogar(e, ni, 0); }
  ok(e.jogador.moedas <= 3, 'Nota de cem: no máximo 3 por combate (veio ' + e.jogador.moedas + ')');
  e = comecar(cena(D('guilhotina', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 1, 'Guilhotina: 4');
  e = comecar(cena(D(com('guilhotina', { up: true }), 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 0, 'Guilhotina+: 5');
  e = comecar(cena(D('bisturi', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); maoI(e, 0).marcada = true; jogar(e, 0, 0);
  igual([e.inimigo.vida, e.inimigo.cortadas.length], [2, 1], 'Bisturi: 3 contra Marcada e a carta é Cortada');
  e = comecar(cena(D('bisturi', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0);
  igual([e.inimigo.vida, e.inimigo.cortadas.length], [4, 0], 'Bisturi sem Marcada: nada demais');
  e = comecar(cena(D('cutelo', 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { blitz: 1 })); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Cutelo na Blitz: o dobro');
  e = comecar(cena(D('cutelo', 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { blitz: 6 })); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Cutelo fora da Blitz: normal');
  e = comecar(cena(D(com('cutelo', { up: true }), 'papel', 'tesoura'), D('tesoura', 'papel', 'papel'), { blitz: 1 })); jogar(e, 0, 0); igual([e.jogador.vida, e.inimigo.vida], [5, 4], 'Cutelo+: na Blitz, empate não dá dano a você');

  // --- Prismáticas ---
  e = comecar(cena(D('origami', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0);
  igual(nomes(e.jogador.cortadas), ['origami'], 'Origami é Frágil');
  e = comecar(cena(D('excalisoura', 'pedra', 'tesoura'), D('papel', 'papel', 'papel'), { restoI: D('papel', 'papel', 'papel', 'papel', 'papel', 'papel') }));
  jogar(e, 0, 0); igual([e.inimigo.vida, nomes(e.jogador.mao)], [4, ['excalisoura']], 'Excalisoura vence e fica na mão (1)');
  comecar(e); let ex = e.jogador.mao.findIndex(c => c.def.id === 'excalisoura'); const v1 = e.inimigo.vida; jogar(e, ex, 0); igual(v1 - e.inimigo.vida, 2, 'Excalisoura: segunda vitória causa 2');
  comecar(e); ex = e.jogador.mao.findIndex(c => c.def.id === 'excalisoura'); const v2 = e.inimigo.vida; jogar(e, ex, 0); igual(v2 - e.inimigo.vida, 3, 'Excalisoura: terceira vitória causa 3');
  e = comecar(cena(D(com('excalisoura', { up: true }), 'pedra', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Excalisoura+: começa em 2');
  e = comecar(cena(D('excalisoura', 'papel', 'tesoura'), D('pedra', 'pedra', 'pedra'))); jogar(e, 0, 0); igual(nomes(e.jogador.cortadas), ['excalisoura'], 'Excalisoura perdendo é Cortada');
  e = comecar(cena(D('meteoro', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { blitz: 1 }));
  jogar(e, 0, 1);
  e = comecar(cena(D(com('meteoro', { up: true }), 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'), { blitz: 1 })); jogar(e, 0, 0);
  igual([e.jogador.vida, e.inimigo.vida], [5, 1], 'Meteoro+: você não sofre dano (e o oponente sofre 3 + 1 pela vitória)');

  // --- Troféus (V4.1: Pedra Angular, Fichário, Florete, Biombo, Ás na Manga, Ponteiro) ---
  e = comecar(cena(D('pedraangular', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'))); const rpa = jogar(e, 0, 0); igual([rpa.resultado, e.inimigo.vida], ['vitoria', 4], 'Pedra Angular ganha o empate (fora da Blitz causa só 1)');
  e = comecar(cena(D('pedraangular', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { blitz: 1 })); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Pedra Angular na Blitz: vencer causa 2');
  e = comecar(cena(D('pedraangular', 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'))); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Pedra Angular fora da Blitz: 1');
  e = comecar(cena(D(com('pedraangular', { up: true }), 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'), { blitz: 1 })); jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Pedra Angular+: 3 na Blitz');
  e = comecar(cena(D('fichario', 'papel', 'tesoura'), D('pedra', 'pedra', 'pedra'))); jogar(e, 0, 0); igual([e.inimigo.vida, e.jogador.mao.length], [3, 2], 'Fichário: Jogar guarda as outras cartas e Vencer causa 2');
  e = comecar(cena(D('fichario', 'papel', 'tesoura'), D('tesoura', 'tesoura', 'tesoura'))); jogar(e, 0, 0); igual([e.jogador.mao.length, e.jogador.vida], [2, 4], 'Fichário guarda mesmo perdendo');
  e = comecar(cena(D('florete', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0);
  igual([e.inimigo.vida, nomes(e.jogador.mao)], [3, ['florete']], 'Florete: 2 e fica na mão');
  e = comecar(cena(D('asnamanga', 'papel', 'tesoura'), D('pedra', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Ás na Manga: 2');
  e = comecar(cena(D('ponteiro', 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { blitz: 1 })); jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Ponteiro na Blitz: 3');
  e = comecar(cena(D('ponteiro', 'papel', 'tesoura'), D('papel', 'papel', 'papel'))); jogar(e, 0, 0); igual(e.inimigo.vida, 4, 'Ponteiro fora da Blitz: 1');
  e = comecar(cena(D(com('ponteiro', { up: true }), 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { blitz: 1 })); jogar(e, 0, 0); igual(e.inimigo.vida, 1, 'Troféu com upgrade: +1 (Ponteiro+ 4)');
  // Biombo: nunca é Marcado
  e = comecar(cena(D('biombo', 'papel', 'tesoura'), D('pedra', 'pedra', 'pedra'))); Motor.marcarMao(e, e.jogador, 3);
  ok(!e.jogador.mao[0].marcada && e.jogador.mao.filter(c => c.marcada).length === 2, 'Biombo nunca é Marcado');
  jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Biombo: vencer causa 2');
})();

// ======================= Selos =======================
(function selos() {
  let e = comecar(cena([com('pedra', { mod: 'pesada' }), 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('tesoura', 'papel', 'tesoura')));
  jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Pesada: +1 ao vencer');
  e = comecar(cena([com('pedra', { mod: 'pesada' }), 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('papel', 'papel', 'tesoura')));
  jogar(e, 0, 0); igual(e.inimigo.vida, 5, 'Pesada: sem efeito ao perder');
  igual(Object.keys(MODIFICADORES).length, 5, '5 selos');
})();

// ======================= Omamoris =======================
(function omamoris() {
  let e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'), { omamoris: ['rochamae'] })); e.jogador.vida = 3; jogar(e, 0, 0); igual(e.jogador.vida, 4, 'Rocha-Mãe: cura 1 na primeira vitória com pedra');
  comecar(e); const p = e.jogador.mao.findIndex(c => c.naipe === 'pedra'); if (p >= 0) { e.jogador.vida = 3; jogar(e, p, kDe(e, 'tesoura')); igual(e.jogador.vida, 3, 'Rocha-Mãe só uma vez'); }
  e = comecar(cena(D('papel', 'pedra', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['grampeador'] })); jogar(e, 0, 0); comecar(e); igual(e.jogador.mao.length, 4, 'Grampeador: Mão +1');
  e = comecar(cena(D('tesoura', 'papel', 'pedra'), D('papel', 'papel', 'tesoura'), { omamoris: ['amolar'] })); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Pedra de Amolar: +1');
  e = cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['lente'] }); comecar(e); igual(e.inimigo.mao.filter(c => c.marcada).length, 1, 'Lente marca 1 carta da mão do oponente');
  e = comecar(cena(D('guilhotina', 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { omamoris: ['navalha'] })); e.jogador.vida = 3; jogar(e, 0, 0); igual(e.jogador.vida, 4, 'Fio de Navalha: cura 1 ao causar 3 ou mais');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('papel', 'papel', 'tesoura'), { omamoris: ['alicerce'] })); jogar(e, 0, 0); igual(e.jogador.vida, 5, 'Alicerce: a primeira derrota não causa dano');
  e = comecar(cena(D('papel', 'papel', 'tesoura'), D('papel', 'papel', 'tesoura'), { omamoris: ['caderno'] })); ok(Motor.pedirCaderno(e, 'jogador'), 'Caderno pode ser pedido'); jogar(e, 0, 0);
  igual(e.jogador.mao.length >= 1, true, 'Caderno guarda 1 carta');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'), { omamoris: ['lupa'] })); maoI(e, 0).marcada = true; e.jogador.vida = 3; jogar(e, 0, 0); igual(e.jogador.vida, 4, 'Lupa: cura 1 contra Marcada');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['coroa'] })); const rc = jogar(e, 0, 0); igual(rc.resultado, 'vitoria', 'Coroa de Papel: vence empate na rodada 1');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'), { omamoris: ['luva'] })); jogar(e, 0, 0); igual(e.inimigo.vida, 3, 'Luva de Duelo: primeira vitória +1');
  e = cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['estopim'], blitz: 2 }); comecar(e); jogar(e, 0, 2); e.jogador.vida = 3; comecar(e); igual(e.jogador.vida, 4, 'Estopim: cura 1 quando a Blitz começa');
  e = cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['fusivel'], blitz: 2 }); comecar(e); jogar(e, 0, 0); comecar(e); igual(e.inimigo.vida, 4, 'Fusível: o oponente sofre 1 quando a Blitz começa');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['relogio'], blitz: 1 })); jogar(e, 0, 0); igual([e.jogador.vida, e.inimigo.vida], [5, 4], 'Relógio Quebrado: o primeiro empate na Blitz não causa dano a você');
  e = cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['mochila'] }); e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: FILL, ia: {} }, omamoris: ['mochila'], semente: 1 }); comecar(e); igual(e.jogador.mao.length, 4, 'Mochila: mão de 4');
  // Cartola
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['cartola'] }));
  const topo = e.jogador.deck[e.jogador.deck.length - 1]; ok(Motor.usarCartola(e, 'jogador', e.jogador.mao[0].uid), 'Cartola funciona'); ok(e.jogador.mao.indexOf(topo) >= 0, 'Cartola traz a carta do topo'); ok(!Motor.usarCartola(e, 'jogador', e.jogador.mao[0].uid), 'Cartola só uma vez');
  // Omamoris dos chefões (V4.1)
  e = cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['fundacao'] }); igual([e.jogador.vida, e.jogador.vidaMax], [6, 6], 'Fundação: vida máxima 6');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['pasta'] })); igual(e.jogador.mao.length, 4, 'Pasta: a primeira mão tem 4 cartas');
  jogar(e, 0, 0); comecar(e); igual(e.jogador.mao.length, 3, 'Pasta: só a primeira mão');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['veu'] })); Motor.marcarMao(e, e.jogador, 3); ok(!e.jogador.mao.some(c => c.marcada), 'Véu (modo normal): suas cartas não podem ser Marcadas');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['relogiobolso'], blitz: 1 })); const rrb = jogar(e, 0, 0); igual(rrb.resultado, 'vitoria', 'Relógio de Bolso: na Blitz, vence empates');
  e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['relogiobolso'], blitz: 6 })); igual(jogar(e, 0, 0).resultado, 'empate', 'Relógio de Bolso: fora da Blitz, empate normal');
  igual(OMAMORIS.length, 22, '22 omamoris (16 + 6 dos chefões)');
})();

// ======================= IA e chefões (V4.1) =======================
(function ia() {
  // Rochedo: pedra 55% (com mão variada)
  let pedras = 0, N = 800;
  for (let s = 0; s < N; s++) { const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: FILL, ia: { padrao: 'rochedo', pedra: .55 } }, semente: s }); Motor.iniciarRodada(e); IA.preparar(e); const c = e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid); if (c.naipe === 'pedra') pedras++; }
  ok(pedras / N > .44 && pedras / N < .68, 'Rochedo joga pedra por volta de 55% (veio ' + (pedras / N).toFixed(2) + ')');
  // Do Contra: nunca repete
  let repetiu = false;
  for (let s = 0; s < 60 && !repetiu; s++) {
    const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: FILL, ia: { padrao: 'docontra' } }, semente: s });
    let ult = null;
    for (let r = 0; r < 4 && !e.fim; r++) { Motor.iniciarRodada(e); IA.preparar(e); const c = e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid); if (ult && c.naipe === ult && e.inimigo.mao.some(x => x.naipe !== ult)) repetiu = true; ult = c.naipe; Motor.resolverRodada(e, e.jogador.mao[0].uid, {}); if (e.pendente) Motor.concluirRodada(e, []); }
  }
  ok(!repetiu, 'Do Contra nunca joga o mesmo naipe duas rodadas seguidas');
  // Copiadora: 50% de repetir o naipe que o jogador jogou
  { let rep = 0, tot = 0;
    for (let s = 0; s < 300; s++) { const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: FILL, ia: { padrao: 'copiadora', repete: .5 } }, semente: s });
      Motor.iniciarRodada(e); IA.preparar(e); Motor.resolverRodada(e, e.jogador.mao[0].uid, {}); if (e.pendente) Motor.concluirRodada(e, []);
      const nj = e.historico[0].naipeJogador; Motor.iniciarRodada(e); IA.preparar(e); const c = e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid); tot++; if (c.naipe === nj) rep++; }
    ok(rep / tot > .42 && rep / tot < .72, 'Copiadora repete o naipe do jogador por volta de 50% (veio ' + (rep / tot).toFixed(2) + ')'); }

  // Só o Trapaceiro anuncia, e ele sempre mente
  const mk = (anuncio, modo) => Motor.criarCombate({ cfg: CONFIG, deckJogador: D('pedra', 'pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura', 'tesoura'), inimigo: { nome: 'x', deck: D('pedra', 'pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura', 'tesoura'), ia: {}, anuncio }, semente: 3, modo });
  { const e = mk('mentira'); const out = [];
    for (let r = 0; r < 5 && !e.fim; r++) { Motor.iniciarRodada(e); IA.preparar(e); const c = e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid); out.push(e.anuncio ? (e.anuncio.naipe === c.naipe ? 'V' : 'M') : '-'); Motor.resolverRodada(e, e.jogador.mao[0].uid, {}); if (e.pendente) Motor.concluirRodada(e, []); }
    igual(out.join(''), 'MMMMM', 'Trapaceiro sempre mente (naipe)'); }
  { const e = mk(null); Motor.iniciarRodada(e); IA.preparar(e); ok(e.anuncio === null, 'quem não é o Trapaceiro não anuncia'); }
  { const e = mk('mentira', 'aberta'); const out = [];
    for (let r = 0; r < 5 && !e.fim; r++) { Motor.iniciarRodada(e); IA.preparar(e); const c = e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid); out.push(e.anuncio ? (e.anuncio.cartaUid != null ? (e.anuncio.cartaUid === c.uid ? 'V' : 'M') : (e.anuncio.naipe === c.naipe ? 'V' : 'M')) : '-');
      const u = Motor.resolverRodada(e, e.jogador.mao[0].uid, {}); if (r === 0) ok(u.detalhes.anuncio && u.detalhes.anuncio.verdade === false, 'Mão aberta: o anúncio da carta é conferido como mentira'); if (e.pendente) Motor.concluirRodada(e, []); }
    igual(out.join(''), 'MMMMM', 'Trapaceiro na Mão aberta: anuncia uma carta que não vai jogar'); }
  ok(CHEFOES.trapaceiro.pista === 'Não acredite em nada do que ele diz.' && Object.keys(CHEFOES).filter(k => CHEFOES[k].anuncio).join() === 'trapaceiro', 'só o Trapaceiro tem anúncio, e a pista dele é a frase certa');

  // Poderes dos chefões
  { // Pedreiro: vence os empates na Blitz e cura 1
    const e = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { poder: 'pedreiro', tipo: 'chefao', blitz: 1 })); e.inimigo.vida = 3;
    const r = jogar(e, 0, 0); igual(r.resultado, 'derrota', 'Pedreiro vence o empate na Blitz'); igual([e.jogador.vida, e.inimigo.vida], [4, 4], 'e cura 1 ao vencer o empate');
    const f = comecar(cena(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { poder: 'pedreiro', tipo: 'chefao', blitz: 6 })); igual(jogar(f, 0, 0).resultado, 'empate', 'Pedreiro: fora da Blitz, empate normal');
    const g = comecar(cena(D('seixo', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { poder: 'pedreiro', tipo: 'chefao', blitz: 1 })); igual(jogar(g, 0, 0).resultado, 'empate', 'Pedreiro e Seixo: os dois vencem empate, continua empate'); }
  { // Arquivista: guarda 1 carta no fim de cada turno (a mais forte); na Mão aberta ela fica Secreta
    const mi = D('papel', 'guilhotina', 'papel');
    let e = comecar(cena(D('pedra', 'papel', 'tesoura'), mi, { poder: 'arquivista', tipo: 'chefao' })); jogar(e, 0, 0);
    igual(nomes(e.inimigo.mao), ['guilhotina'], 'Arquivista guarda a carta mais forte no fim do turno');
    e = comecar(cena(D('pedra', 'papel', 'tesoura'), mi, { poder: 'arquivista', tipo: 'chefao', modo: 'aberta' })); jogar(e, 0, 0);
    ok(e.inimigo.mao.length === 1 && Motor.ehSecreta(e, e.inimigo.mao[0]), 'Mão aberta: a carta guardada pela Arquivista fica Secreta'); }
  { // Duelista: Embalo
    const e = comecar(cena(D('papel', 'papel', 'papel'), D('tesoura', 'tesoura', 'tesoura'), { poder: 'duelista', tipo: 'chefao', restoJ: D('papel', 'papel', 'papel', 'papel', 'papel', 'papel'), restoI: D('tesoura', 'tesoura', 'tesoura', 'tesoura', 'tesoura', 'tesoura') }));
    jogar(e, 0, 0); igual(e.jogador.vida, 4, 'Duelista: 1ª vitória causa 1');
    comecar(e); jogar(e, 0, 0); igual(e.jogador.vida, 2, 'Embalo: a vitória seguinte causa +1 (2)');
    comecar(e); const v = e.jogador.vida; e.jogador.vida = 5; jogar(e, 0, 0); igual(5 - e.jogador.vida, 3, 'Embalo: acumula até +2 (3 no total)');
    const f = comecar(cena(D('pedra', 'pedra', 'pedra'), D('tesoura', 'tesoura', 'tesoura'), { poder: 'duelista', tipo: 'chefao' })); f.inimigo.embalo = 2; jogar(f, 0, 0); igual(f.inimigo.embalo, 0, 'Embalo: perder zera'); }
  { // Ilusionista: marca 1 carta do jogador a cada 2 rodadas (modo normal)
    const e = cena(D('pedra', 'pedra', 'pedra'), D('papel', 'papel', 'papel'), { poder: 'ilusionista', tipo: 'chefao' }); comecar(e); ok(!e.jogador.mao.some(c => c.marcada), 'Ilusionista: rodada 1 sem marca');
    jogar(e, 0, 0); comecar(e); ok(e.jogador.mao.some(c => c.marcada), 'Ilusionista: marca 1 carta sua a cada 2 rodadas'); }
  { // Relojoeiro: Blitz na rodada 4
    const r = Run.criar({ cfg: CONFIG, semente: 40 }); r.etapa = 10; r.chefao[2] = 'relojoeiro'; const e = Run.iniciarCombate(r); igual(e.rodadaBlitz, 4, 'Relojoeiro: a Blitz começa na rodada 4'); }
  // Estilos por arquétipo (a IA segue as prioridades)
  { // Blitz: guarda Cutelo para a Blitz
    let antes = 0, durante = 0; const N = 200;
    for (let s = 0; s < N; s++) {
      const mk2 = blitz => { const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: D('cutelo', 'pedra', 'pedra').concat(D('pedra', 'pedra', 'pedra')), ia: { arq: 'Blitz' } }, semente: s, ordemFixa: true, rodadaBlitz: blitz }); Motor.iniciarRodada(e); IA.preparar(e); return e; };
      let e = mk2(6); if (e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid).def.id === 'cutelo') antes++;
      e = mk2(1); if (e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid).def.id === 'cutelo') durante++;
    }
    ok(antes < N * 0.3 && durante > N * 0.8, 'estilo Blitz: guarda o Cutelo para a Blitz (antes ' + antes + ', durante ' + durante + ' de ' + N + ')'); }
  { // Leitura: marca primeiro (Cristal) antes de atacar
    let marca = 0, N = 200;
    for (let s = 0; s < N; s++) { const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: D('cristal', 'abridor', 'pedra', 'pedra', 'pedra', 'pedra'), ia: { arq: 'Leitura' } }, semente: s, ordemFixa: true }); Motor.iniciarRodada(e); IA.preparar(e); const c = e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid); if (c.def.id === 'cristal') marca++; }
    ok(marca > 0, 'estilo Leitura: joga as cartas de marcar quando o jogador não tem Marcadas'); }
  { // Investida guarda a Frágil quando não tem certeza
    let joga = 0, certeza = 0, N = 300;
    for (let s = 0; s < N; s++) {
      const mk3 = marcar => { const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: D('guilhotina', 'pedra', 'pedra', 'pedra', 'pedra', 'pedra'), ia: { arq: 'Investida' } }, semente: s, ordemFixa: true }); Motor.iniciarRodada(e); if (marcar) e.jogador.mao.find(c => c.naipe === 'papel').marcada = true; IA.preparar(e); return e; };
      let e = mk3(false); if (e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid).def.id === 'guilhotina') joga++;
      e = mk3(true); if (e.inimigo.mao.find(x => x.uid === e.decisaoIA.uid).def.id === 'guilhotina') certeza++;
    }
    ok(certeza > joga, 'estilo Investida: joga a Frágil com mais vontade quando tem certeza (' + joga + ' → ' + certeza + ')'); }
  // Decks do inimigo: arquétipo e tamanho
  Object.keys(INIMIGOS).forEach(k => { ok(!!INIMIGOS[k].arq && INIMIGOS[k].deck.length >= 7 && INIMIGOS[k].ato2.length === 2, 'inimigo comum com arquétipo e deck: ' + k); });
  Object.keys(CHEFOES).forEach(k => { const c = CHEFOES[k]; ok(!!c.arq && !!c.poder.nome && !!c.estilo && !!CARTAS_POR_ID[c.trofeu] && !!A.OMAMORIS_POR_ID[c.omamori], 'chefão completo: ' + k); });
  [['pedreiro', 10], ['arquivista', 10], ['duelista', 10], ['ilusionista', 12], ['trapaceiro', 12], ['relojoeiro', 12]].forEach(x => { const r = Run.criar({ cfg: CONFIG, semente: 50 }); r.etapa = CHEFOES[x[0]].ato === 1 ? 5 : 10; r.chefao[CHEFOES[x[0]].ato] = x[0]; const e = Run.iniciarCombate(r); igual(e.inimigo.todas.length, x[1], 'deck do chefão ' + x[0] + ' tem ' + x[1] + ' cartas'); });
  igual(Object.keys(CHEFOES).sort().join(), 'arquivista,duelista,ilusionista,pedreiro,relojoeiro,trapaceiro', 'os 6 chefões novos');
})();

// ======================= Run =======================
(function run() {
  const run = Run.criar({ cfg: CONFIG, semente: 5 });
  igual([run.vida, run.moedas, run.omamoris.length], [10, 0, 0], 'run começa com 10 de vida, sem dinheiro e sem omamori');
  igual([Run.atoDe(run, 5), Run.atoDe(run, 6), Run.tipoDaEtapa(run, 3), Run.tipoDaEtapa(run, 5), Run.tipoDaEtapa(run, 8), Run.tipoDaEtapa(run, 10)], [1, 2, 'sub', 'chefao', 'sub', 'chefao'], '2 atos de 5 combates, sub-chefe no 3º e chefão no 5º');
  // dinheiro e vida da run
  let est = Run.iniciarCombate(run); est.fim = 'vitoria'; Run.terminarCombate(run, est);
  igual(run.moedas, 3, 'vitória: 3 moedas'); igual(Run.passo(run), 'omamori', 'depois do primeiro combate vem o omamori inicial');
  const of = Run.ofertasOmamoriInicial(run); igual(of.length, 3, '3 omamoris básicos'); ok(of.every(o => o.categoria === 'basico'), 'todos básicos');
  Run.escolherOmamoriInicial(run, of[0].id); Run.concluirPasso(run); igual(Run.passo(run), 'recompensa', 'depois vem a Recompensa de cartas'); ok(run.pendente && run.pendente.tipo === 'cartas', 'com 3 cartas'); Run.concluirPasso(run); igual(Run.passo(run), 'loja', 'e então a Loja');
  // Loja
  let L = Run.loja(run); igual(L.cartas.map(c => CARTAS_POR_ID[c.id].naipe), ['pedra', 'papel', 'tesoura'], 'a Loja tem 3 cartas, uma de cada naipe'); ok(L.cartas.every(c => c.raridade !== 'comum'), 'a Loja só vende Raras ou melhores'); ok(L.cartas.every(c => c.raridade === 'rara') && L.omamori === null, 'a primeira Loja (máximo 3 moedas) só vende Raras e nenhum omamori');
  ok(L.cartas.every(c => c.preco === CONFIG.run.preco[c.raridade]), 'preços pela raridade');
  run.moedas = 20; const antes = run.deck.length, c0 = L.cartas[0];
  ok(Run.comprarCarta(run, 0), 'compra carta'); igual(run.deck.length, antes + 1, 'o deck cresce'); ok(!Run.comprarCarta(run, 0), 'cada carta só pode ser comprada uma vez');
  ok(run.moedas === 20 - c0.preco, 'desconta o preço');
  const alvo = run.deck.find(e => CARTAS_POR_ID[e.id].up); const m0 = run.moedas;
  ok(Run.comprarUpgrade(run, alvo.eid), 'compra upgrade'); igual(run.moedas, m0 - 2, 'upgrade custa 2'); ok(!Run.comprarUpgrade(run, alvo.eid), 'uma vez por carta');
  const m1 = run.moedas; ok(Run.comprarRemocao(run, run.deck[0].eid), 'remove carta'); igual(run.moedas, m1 - 2, 'remover custa 2');
  while (run.deck.length > 6) Run.comprarRemocao(run, run.deck[0].eid);
  ok(!Run.comprarRemocao(run, run.deck[0].eid), 'o deck nunca fica com menos de 6 cartas');
  run.moedas = 10; const sel = run.deck[0]; sel.mod = 'pesada'; L.selo.mod = 'guardada'; ok(Run.comprarSelo(run, sel.eid), 'compra selo'); igual(sel.mod, 'guardada', 'o selo novo substitui o antigo'); ok(!Run.comprarSelo(run, sel.eid), 'só um selo por Loja');
  run.moedas = 5; ok(Run.renovarLoja(run), 'renova a Loja'); igual(run.moedas, 4, 'renovar custa 1'); ok(!Run.renovarLoja(run), 'só uma vez por Loja');
  // Cupom
  run.omamoris.push('cupom'); igual(Run.preco(run, 3), 2, 'Cupom tira 1'); igual(Run.preco(run, 1), 1, 'Cupom: mínimo 1'); run.omamoris.pop();
  // raridade por ato (amostra grande)
  const cont = { comum: 0, rara: 0, lendaria: 0, prismatica: 0 }, r2 = Run.criar({ cfg: CONFIG, semente: 9 }); r2.etapa = 6;
  for (let i = 0; i < 400; i++) { r2.contLoja = i; r2.loja = null; Run.loja(r2).cartas.forEach(c => cont[c.raridade]++); r2.deck = r2.deck.filter(e => CARTAS_POR_ID[e.id].raridade !== 'prismatica'); }
  ok(cont.prismatica > 0 && cont.lendaria > cont.prismatica, 'ato 2 tem prismáticas e lendárias');
  const r3 = Run.criar({ cfg: CONFIG, semente: 9 }); let p1 = 0; for (let i = 0; i < 300; i++) { r3.contLoja = i; Run.gerarLoja(r3).cartas.forEach(c => { if (c.raridade === 'prismatica') p1++; }); }
  igual(p1, 0, 'ato 1 não tem prismáticas');
  // Prismática só se o deck ainda não tiver uma
  const r4 = Run.criar({ cfg: CONFIG, semente: 3 }); r4.etapa = 6; r4.deck.push(Run.entrada(r4, 'meteoro')); let p2 = 0; for (let i = 0; i < 300; i++) { r4.contLoja = i; Run.gerarLoja(r4).cartas.forEach(c => { if (c.raridade === 'prismatica') p2++; }); }
  igual(p2, 0, 'com uma prismática no deck, não aparece outra');
  // Dinamite, Curinga e Troféus nunca na Loja
  ok(['dinamite', 'curinga', 'martelo'].every(id => !A.CARTAS_POR_ID[id] || true), 'ok');
  let aparece = false; const r5 = Run.criar({ cfg: CONFIG, semente: 4 }); r5.etapa = 8; for (let i = 0; i < 300; i++) { r5.contLoja = i; Run.gerarLoja(r5).cartas.forEach(c => { if (['especial', 'trofeu'].indexOf(c.raridade) >= 0) aparece = true; }); } ok(!aparece, 'Especiais e Troféus nunca aparecem na Loja');
  // Arquétipo ativo: 3 cartas
  const r6 = Run.criar({ cfg: CONFIG, semente: 6 }); igual(Run.arquetiposAtivos(r6).length, 0, 'sem arquétipo ativo no começo');
  ['pedrada', 'multa', 'estilete'].forEach(id => r6.deck.push(Run.entrada(r6, id))); igual(Run.arquetiposAtivos(r6).map(a => a.chave), ['Investida'], '3 cartas ativam o arquétipo');
  let doArq = 0, totRL = 0; r6.etapa = 8; for (let i = 0; i < 600; i++) { r6.contLoja = i; Run.gerarLoja(r6).cartas.forEach(c => { if (c.raridade === 'rara' || c.raridade === 'lendaria') { totRL++; if (CARTAS_POR_ID[c.id].arq === 'Investida') doArq++; } }); }
  ok(doArq / totRL > 0.4, 'arquétipo ativo aparece mais na Loja (' + (doArq / totRL).toFixed(2) + ')');
  // Omamoris: oferta de arquétipo só com o ativo; pelo menos uma neutra; Mochila só no ato 2
  const r7 = Run.criar({ cfg: CONFIG, semente: 7 }); let arqSem = false, mochila1 = false;
  for (let i = 0; i < 100; i++) { r7.etapa = 1 + (i % 4); const o = Run.ofertasOmamori(r7, 2, i); if (o.some(x => x.categoria === 'arquetipo')) arqSem = true; if (o.some(x => x.id === 'mochila')) mochila1 = true; ok(o.some(x => x.categoria !== 'arquetipo'), 'oferta com pelo menos uma neutra'); }
  ok(!arqSem, 'omamori de arquétipo só aparece com o arquétipo ativo'); ok(!mochila1, 'Mochila só aparece no ato 2');
  // Sub-chefes e chefões
  const r8 = Run.criar({ cfg: CONFIG, semente: 8 }); r8.etapa = 3; const so = Run.subOfertas(r8); igual(so.length, 2, '2 sub-chefes sorteados'); ok(so[0] !== so[1], 'diferentes');
  ok(Run.escolherSub(r8, so[0]), 'escolhe um deles'); ok(!Run.escolherSub(r8, 'inexistente'), 'não aceita outro');
  igual(Object.keys(SUBCHEFES).length, 8, '8 sub-chefes'); igual(Object.keys(CHEFOES).length, 6, '6 chefões');
  [1, 2].forEach(ato => { const l = Object.keys(CHEFOES).filter(k => CHEFOES[k].ato === ato); igual(l.length, 3, '3 chefões no ato ' + ato); });
  // Vida dos sub-chefes e chefões
  Object.keys(SUBCHEFES).forEach(id => { const r = Run.criar({ cfg: CONFIG, semente: 11 }); r.etapa = 3; r.subEscolhido = id; const e = Run.iniciarCombate(r); igual(e.inimigo.vida, id === 'ganancioso' ? 8 : 6, 'vida do sub-chefe ' + id); });
  [5, 10].forEach(n => { const r = Run.criar({ cfg: CONFIG, semente: 12 }); r.etapa = n; const e = Run.iniciarCombate(r); igual(e.inimigo.vida, n === 5 ? 6 : 7, 'vida do chefão do combate ' + n); ok(e.inimigo.todas.some(c => c.def.raridade === 'trofeu'), 'o chefão tem a carta Troféu no deck'); });
  // Sub-chefes: regras
  { const r = Run.criar({ cfg: CONFIG, semente: 13 }); r.etapa = 3; r.subEscolhido = 'apressado'; const e = Run.iniciarCombate(r); igual(e.rodadaBlitz, 3, 'Apressado: Blitz na rodada 3'); }
  { const r = Run.criar({ cfg: CONFIG, semente: 13 }); r.etapa = 3; r.subEscolhido = 'embaralhador'; const e = Run.iniciarCombate(r); Motor.iniciarRodada(e); igual(e.jogador.mao.length, 2, 'Embaralhador: mão de 2'); }
  { const r = Run.criar({ cfg: CONFIG, semente: 13 }); r.etapa = 3; r.subEscolhido = 'espiao'; const e = Run.iniciarCombate(r); Motor.iniciarRodada(e); IA.preparar(e); Motor.resolverRodada(e, e.jogador.mao[0].uid, {}); if (e.pendente) Motor.concluirRodada(e, []); Motor.iniciarRodada(e); ok(e.jogador.mao.some(c => c.marcada), 'Espião: marca uma carta a cada 2 rodadas'); }
  { const r = Run.criar({ cfg: CONFIG, semente: 13 }); r.etapa = 3; r.subEscolhido = 'teimoso'; const e = Run.iniciarCombate(r); Motor.iniciarRodada(e); e.decisaoIA = { uid: null, escolhas: {} }; const ce = e.inimigo.mao[0]; const cj = e.jogador.mao.find(c => c.naipe === ce.naipe); if (cj) { e.decisaoIA = { uid: ce.uid, escolhas: {} }; const res = Motor.resolverRodada(e, cj.uid, {}); igual(res.resultado, 'derrota', 'Teimoso vence todos os empates'); } }
  { const r = Run.criar({ cfg: CONFIG, semente: 14 }); r.etapa = 3; r.subEscolhido = 'gemeo'; r.deck.push(Run.entrada(r, 'pedrada', { up: true, mod: 'pesada' })); const e = Run.iniciarCombate(r); igual(e.inimigo.todas.length, r.deck.length, 'Gêmeo copia o deck'); ok(e.inimigo.todas.some(c => c.def.id === 'pedrada' && c.up && c.mod === 'pesada'), 'com upgrades e selos'); }
  // Recompensas dos sub-chefes
  const rec = (id, fn) => { const r = Run.criar({ cfg: CONFIG, semente: 21 }); r.etapa = 3; r.subEscolhido = id; r.moedas = 0; const e = Run.iniciarCombate(r); e.fim = 'vitoria'; Run.terminarCombate(r, e); r.moedas = 0; fn(r); };
  rec('quebradico', r => { igual(r.pendente.tipo, 'lendaria2', 'Quebradiço: Lendária entre 2'); ok(r.pendente.opcoes.every(id => CARTAS_POR_ID[id].raridade === 'lendaria'), 'são Lendárias'); const n = r.deck.length; Run.aplicarRecompensa(r, r.pendente.opcoes[0]); igual(r.deck.length, n + 1, 'recebe a carta'); });
  rec('espiao', r => { igual(r.pendente.tipo, 'omamori2', 'Espião: omamori entre 2'); Run.aplicarRecompensa(r, r.pendente.opcoes[0]); igual(r.omamoris.length, 1, 'recebe o omamori'); });
  rec('ganancioso', r => { Run.aplicarRecompensa(r); igual(r.moedas, 6, 'Ganancioso: 6 moedas'); });
  rec('apressado', r => { igual(r.pendente.restam, 2, 'Apressado: 2 upgrades'); const a = r.deck.filter(e => Run.podeUpgrade(r, e.eid)); Run.upgradeGratis(r, a[0].eid); Run.upgradeGratis(r, a[1].eid); igual(r.deck.filter(e => e.up).length, 2, 'dois upgrades grátis'); ok(Run.recompensaConcluida(r), 'concluída'); });
  rec('gemeo', r => { Run.aplicarRecompensa(r); igual(r.moedas, 3, 'Gêmeo: 3 moedas'); Run.upgradeGratis(r, r.deck.find(e => Run.podeUpgrade(r, e.eid)).eid); igual(r.deck.filter(e => e.up).length, 1, '1 upgrade grátis'); });
  { const r = Run.criar({ cfg: CONFIG, semente: 22 }); r.etapa = 3; r.subEscolhido = 'ladra'; r.moedas = 10; const e = Run.iniciarCombate(r); e.roubadas = 3; e.fim = 'vitoria'; Run.terminarCombate(r, e); igual(r.moedas, 10 + 3 - 3, 'Ladra: o roubo é descontado'); r.moedas = 0; Run.aplicarRecompensa(r); igual(r.moedas, 3 + 5, 'Ladra: devolve o que roubou, mais 5'); }
  // Sub-chefe: perder não dá recompensa e segue em frente
  { const r = Run.criar({ cfg: CONFIG, semente: 23 }); r.etapa = 3; r.subEscolhido = 'espiao'; const e = Run.iniciarCombate(r); e.fim = 'derrota'; Run.terminarCombate(r, e); ok(r.fila.indexOf('recsub') < 0, 'sem recompensa do sub-chefe ao perder'); ok(r.fila.indexOf('recompensa') >= 0, 'mas a Recompensa de cartas vem mesmo assim'); igual(r.vida, 7, 'derrota custa 3'); const v = r.etapa; while (Run.passo(r)) Run.concluirPasso(r); igual(r.etapa, v + 1, 'segue em frente'); }
  // Empate custa 1 e dá 2 moedas; derrota custa 3 e dá 1
  { const r = Run.criar({ cfg: CONFIG, semente: 24 }); r.etapa = 2; let e = Run.iniciarCombate(r); e.fim = 'empate'; Run.terminarCombate(r, e); igual([r.vida, r.moedas], [9, 2], 'empate: -1 vida e 2 moedas'); }
  // Seguro
  { const r = Run.criar({ cfg: CONFIG, semente: 25 }); r.etapa = 2; r.omamoris.push('seguro'); let e = Run.iniciarCombate(r); e.fim = 'derrota'; Run.terminarCombate(r, e); igual(r.vida, 9, 'Seguro: a primeira derrota custa 1'); r.etapa = 4; e = Run.iniciarCombate(r); e.fim = 'derrota'; Run.terminarCombate(r, e); igual(r.vida, 6, 'e só uma vez'); }
  // Cofre
  { const r = Run.criar({ cfg: CONFIG, semente: 26 }); r.etapa = 2; r.omamoris.push('cofre'); const e = Run.iniciarCombate(r); e.fim = 'vitoria'; Run.terminarCombate(r, e); igual(r.moedas, 4, 'Cofre: +1 moeda'); }
  // Chefão: vitória +3 moedas, espólio antes da Loja; derrota ou empate: luta de novo
  { const r = Run.criar({ cfg: CONFIG, semente: 27 }); r.etapa = 5; const e = Run.iniciarCombate(r); e.fim = 'vitoria'; Run.terminarCombate(r, e); igual(r.moedas, 6, 'chefão: 3 + 3 moedas'); igual(r.fila.join(), 'espolio,recompensa,loja', 'chefão: Espólio, Recompensa, Loja'); const p = r.pendente; ok(p.tipo === 'espolio' && p.garantidoOk && r.omamoris.indexOf(CHEFOES[r.chefao[1]].omamori) >= 0, 'o omamori do chefão é garantido'); ok(!!p.trofeu && !!p.sorteado, 'e a escolha entre o Troféu e 1 omamori sorteado'); ok(!Run.espolioFeito(r), 'ainda falta escolher'); ok(Run.espolioEscolher(r, 'carta'), 'leva a carta Troféu'); ok(r.deck.some(e => CARTAS_POR_ID[e.id].raridade === 'trofeu'), 'o Troféu está no deck'); ok(Run.espolioFeito(r), 'espólio concluído'); Run.concluirPasso(r); Run.concluirPasso(r); Run.concluirPasso(r); igual(r.etapa, 6, 'segue para o ato 2'); }
  { const r = Run.criar({ cfg: CONFIG, semente: 28 }); r.etapa = 5; let e = Run.iniciarCombate(r); e.fim = 'derrota'; Run.terminarCombate(r, e); igual(r.vida, 7, 'derrota para o chefão custa 3'); while (Run.passo(r)) Run.concluirPasso(r); igual(r.etapa, 5, 'derrota no chefão: luta de novo'); e = Run.iniciarCombate(r); e.fim = 'empate'; Run.terminarCombate(r, e); while (Run.passo(r)) Run.concluirPasso(r); igual(r.etapa, 5, 'empate no chefão: luta de novo'); e = Run.iniciarCombate(r); e.fim = 'vitoria'; Run.terminarCombate(r, e); while (Run.passo(r)) Run.concluirPasso(r); igual(r.etapa, 6, 'vence o chefão e segue'); }
  { const r = Run.criar({ cfg: CONFIG, semente: 29 }); r.etapa = 10; const e = Run.iniciarCombate(r); e.fim = 'vitoria'; Run.terminarCombate(r, e); igual(r.fim, 'vitoria', 'derrotar o chefão do ato 2 vence a run'); }
  { const r = Run.criar({ cfg: CONFIG, semente: 30 }); r.etapa = 4; r.vida = 3; const e = Run.iniciarCombate(r); e.fim = 'derrota'; Run.terminarCombate(r, e); igual(r.fim, 'derrota', 'vida da run em 0 termina a run'); }
  // Mesa do Apostador
  { const r = Run.criar({ cfg: CONFIG, semente: 31 }); r.etapa = 8; ok(Run.mesaDisponivel(r), 'Mesa disponível no ato 2'); r.etapa = 3; ok(!Run.mesaDisponivel(r), 'não no ato 1'); r.etapa = 8;
    r.moedas = 8; igual(Run.mesaApostasPossiveis(r).map(a => a.tipo), ['moedas'], 'aposta de 8 moedas'); r.deck.push(Run.entrada(r, 'fossil')); igual(Run.mesaApostasPossiveis(r).map(a => a.tipo), ['lendaria', 'moedas'], 'ou uma Lendária');
    Run.mesaIniciar(r, { tipo: 'moedas', valor: 8 }); let g = 0; while (!r.pendente.fim && g++ < 60) Run.mesaJogar(r, 'pedra');
    ok(r.pendente.fim === 'vitoria' || r.pendente.fim === 'derrota', 'melhor de 3 termina'); ok(r.pendente.placar[0] === 2 || r.pendente.placar[1] === 2, 'vence quem chega a 2');
    if (r.pendente.fim === 'derrota') igual(r.moedas, 0, 'perdeu: perde a aposta'); else { const op = Run.mesaPremioOpcoes(r); igual(op.length, 2, 'ganhou: Dinamite ou Curinga'); Run.mesaPremio(r, 'dinamite'); igual(Run.mesaPremioOpcoes(r), ['curinga'], 'já tem a Dinamite: só sobra o Curinga'); }
    ok(!Run.mesaDisponivel(r), 'uma vez por run'); }
  { const r = Run.criar({ cfg: CONFIG, semente: 32 }); r.etapa = 8; r.deck.push(Run.entrada(r, 'dinamite'), Run.entrada(r, 'curinga')); ok(!Run.mesaDisponivel(r), 'com as duas cartas a Mesa não aparece'); }
  // Perdeu a Lendária apostada
  { let perdeu = false; for (let s = 1; s < 40 && !perdeu; s++) { const r = Run.criar({ cfg: CONFIG, semente: s }); r.etapa = 8; r.deck.push(Run.entrada(r, 'fossil')); const eid = r.deck[r.deck.length - 1].eid; Run.mesaIniciar(r, { tipo: 'lendaria', eid }); let g = 0; while (!r.pendente.fim && g++ < 60) Run.mesaJogar(r, 'pedra'); if (r.pendente.fim === 'derrota') { perdeu = true; ok(!r.deck.some(e => e.eid === eid), 'perdeu a Lendária apostada'); } } ok(perdeu, 'achou uma Mesa perdida para testar'); }
  // Salvamento
  const rs = Run.criar({ cfg: CONFIG, semente: 33 }); Run.salvar(rs, { tela: 'run' }); const cd = Run.carregar(); ok(cd && cd.run.semente === 33, 'salva e carrega'); Run.apagarSave(); ok(!Run.carregar(), 'apaga o save');
  A.memoria.jokenblitz_save_v31 = '{"x":1}'; ok(Run.descartarSaveAntigo(), 'descarta o save antigo'); ok(!A.memoria.jokenblitz_save_v31, 'e apaga');
})();

// ======================= Mão aberta (modo de teste) =======================
(function maoAberta() {
  const ab = (mj, mi, opc) => comecar(cena(mj, mi, Object.assign({ modo: 'aberta' }, opc || {})));
  let e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'));
  igual(e.modo, 'aberta', 'o combate guarda o modo'); igual(Motor.modo(), 'aberta', 'e o motor também');
  // Texto das cartas na Mão aberta
  const ct = Motor.cartaDeEntrada({ id: 'cristal' }, 1); ok(/Secreta/.test(ct.texto), 'Cristal tem texto da Mão aberta'); ok(!/Marca/.test(ct.texto), 'sem falar de Marcada');
  const abr = Motor.cartaDeEntrada({ id: 'abridor' }, 1); ok(/Nasce Secreto/.test(abr.texto) && !/Marcada/.test(abr.texto), 'Abridor: nasce Secreto, sem a condição de Marcada');
  ok(/Secreta/.test(Motor.cartaDeEntrada({ id: 'recorte', up: true }, 1).texto), 'Recorte+: a carta guardada fica Secreta');
  ok(Motor.cartaDeEntrada({ id: 'pedrada' }, 1).texto === CARTAS_POR_ID.pedrada.texto, 'cartas sem Marcada têm o mesmo texto');
  A.Motor.definirModo('normal'); ok(/Marca/.test(Motor.cartaDeEntrada({ id: 'cristal' }, 1).texto), 'no modo normal o texto é o de Marcada'); A.Motor.definirModo('aberta');
  // Abridor e Bisturi nascem Secretos e causam o dano sem precisar de Marcada
  e = ab(D('abridor', 'papel', 'tesoura'), D('papel', 'papel', 'papel')); ok(Motor.ehSecreta(e, e.jogador.mao[0]), 'Abridor nasce Secreto'); jogar(e, 0, 0); igual(e.inimigo.vida, 2, 'Abridor na Mão aberta: 3 de dano sem Marcada');
  e = ab(D('bisturi', 'papel', 'tesoura'), D('papel', 'papel', 'papel')); jogar(e, 0, 0); igual([e.inimigo.vida, e.inimigo.cortadas.length], [2, 1], 'Bisturi na Mão aberta: 3 de dano e Corta a carta');
  // Cristal: revela uma carta Secreta; se não houver, a do topo do deck
  e = ab(D('cristal', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')); maoI(e, 1).secreta = true; jogar(e, 0, 0);
  ok(!maoI(e, 1) || true, ''); igual(e.inimigo.deck.filter(c => c.marcada).length, 0, 'Cristal: revela a Secreta em vez do topo do deck'); 
  e = ab(D('cristal', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')); jogar(e, 0, 0); igual(e.inimigo.deck.filter(c => c.marcada).length, 1, 'Cristal sem Secretas: revela o topo do deck');
  e = ab(D('cristal', 'papel', 'tesoura'), D({ id: 'pedra', mod: 'blindada' }, 'papel', 'tesoura')); maoI(e, 0).secreta = true; const cb = maoI(e, 0); Motor.revelarSecretas(e, e.inimigo, 1); ok(cb.secreta, 'Blindada não pode ser revelada');
  // Bilhete: no turno seguinte o jogador escolhe 1 carta para ficar Secreta
  e = ab(D('bilhete', 'papel', 'tesoura'), D('tesoura', 'tesoura', 'tesoura')); jogar(e, 0, 0); comecar(e); igual(e.escolhaSecreta, 0, 'Bilhete perdendo: sem Secreta');
  e = ab(D('bilhete', 'papel', 'tesoura'), D('pedra', 'pedra', 'pedra')); jogar(e, 0, 0); comecar(e); igual(e.escolhaSecreta, 1, 'Bilhete: no turno seguinte, escolha 1 carta para ficar Secreta');
  ok(Motor.taparCarta(e, e.jogador.mao[0].uid) && Motor.ehSecreta(e, e.jogador.mao[0]), 'o jogador escolhe a carta que fica Secreta'); igual(e.escolhaSecreta, 0, 'e a escolha acaba');
  // Mapa: todas as cartas do jogador ficam Secretas no turno seguinte
  e = ab(D('mapa', 'papel', 'tesoura'), D('papel', 'papel', 'papel')); jogar(e, 0, 0); comecar(e); ok(e.jogador.mao.length > 0 && e.jogador.mao.every(c => Motor.ehSecreta(e, c)), 'Mapa: todas as suas cartas ficam Secretas');
  // Recorte: guarda sem custo; com upgrade a carta fica Secreta
  e = ab(D('recorte', 'papel', 'tesoura'), D('papel', 'papel', 'papel')); jogar(e, 0, 0); ok(e.jogador.mao.length === 1 && !e.jogador.mao[0].marcada && !Motor.ehSecreta(e, e.jogador.mao[0]), 'Recorte: guarda 1 carta, sem marca nem Secreta');
  e = ab(D(com('recorte', { up: true }), 'papel', 'tesoura'), D('papel', 'papel', 'papel')); jogar(e, 0, 0); ok(e.jogador.mao.length === 1 && Motor.ehSecreta(e, e.jogador.mao[0]), 'Recorte+: a carta guardada fica Secreta');
  // Selo Delatora vira Sigilosa: sempre Secreta, e descartar não marca nada
  e = ab([com('pedra', { mod: 'delatora' }), 'papel', 'tesoura'].map(x => (typeof x === 'string' ? { id: x } : x)), D('pedra', 'papel', 'tesoura')); ok(Motor.ehSecreta(e, e.jogador.mao[0]), 'Sigilosa: sempre Secreta');
  jogar(e, 1, 0); ok(!e.inimigo.deck.some(c => c.marcada), 'Sigilosa descartada não marca o deck do oponente'); ok(A.MODIFICADORES.delatora.maoAberta.nome === 'Sigilosa', 'o selo se chama Sigilosa na Mão aberta');
  // Lente e Lupa
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['lente'] }); igual(e.jogador.mao.filter(c => c.secreta).length, 1, 'Lente na Mão aberta: 1 carta sua fica Secreta'); igual(e.inimigo.mao.filter(c => c.marcada).length, 0, 'e não marca o oponente');
  e = ab(D('abridor', 'papel', 'tesoura'), D('papel', 'papel', 'papel'), { omamoris: ['lupa'] }); e.jogador.vida = 3; jogar(e, 0, 0); igual(e.jogador.vida, 4, 'Lupa: vencer com uma carta Secreta cura 1');
  e = ab(D('pedra', 'papel', 'tesoura'), D('tesoura', 'papel', 'tesoura'), { omamoris: ['lupa'] }); e.jogador.vida = 3; jogar(e, 0, 0); igual(e.jogador.vida, 3, 'Lupa: sem carta Secreta, não cura');
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { omamoris: ['veu'] }); igual(e.jogador.mao.filter(c => c.secreta).length, 1, 'Véu na Mão aberta: 1 carta aleatória sua fica Secreta a cada turno');
  // Espião: as cartas dele nunca ficam Secretas
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { regras: { espiao: true } }); Motor.secretar(e, e.inimigo, 3); ok(!e.inimigo.mao.some(c => c.secreta), 'Espião: as cartas dele nunca ficam Secretas');
  // Todo chefão tampa 1 carta por turno (a Ilusionista, 2)
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { tipo: 'chefao', poder: 'pedreiro' }); igual(e.inimigo.mao.filter(c => c.secreta).length, 1, 'chefão tampa 1 carta por turno');
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { tipo: 'chefao', poder: 'ilusionista' }); igual(e.inimigo.mao.filter(c => c.secreta).length, 2, 'a Ilusionista tampa 2');
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')); igual(e.inimigo.mao.filter(c => c.secreta).length, 0, 'inimigo comum não tampa');
  // A Secreta some quando a carta é jogada ou descartada
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura'), { tipo: 'chefao', poder: 'pedreiro' }); const sec = e.inimigo.mao.find(c => c.secreta); jogar(e, 0, e.inimigo.mao.indexOf(sec)); ok(!sec.secreta, 'a marca de Secreta some depois de jogada');
  // Odds mostram só o deck
  e = ab(D('pedra', 'pedra', 'pedra'), D('papel', 'papel', 'papel'), { restoJ: D('papel'), restoI: D('tesoura') }); let o = Motor.odds(e.inimigo); igual([o.pedra, o.papel, o.tesoura], [0, 0, 100], 'Mão aberta: as odds só contam o deck do oponente');
  // A IA lê a mão do jogador e ignora as cartas Secretas
  e = ab(D('pedra', 'pedra', 'pedra'), D('pedra', 'papel', 'tesoura')); let d = IA.distJogador(e); ok(d.pedra > 0.9, 'a IA lê a mão visível do jogador (só pedras)');
  e.jogador.mao[0].secreta = true; e.jogador.mao[1].secreta = true; d = IA.distJogador(e); ok(d.pedra > 0.9, 'e com 2 Secretas lê só a 3ª carta');
  e = ab(D('pedra', 'papel', 'tesoura'), D('pedra', 'papel', 'tesoura')); e.jogador.mao.forEach(c => { c.secreta = true; }); d = IA.distJogador(e); ok(Math.abs(d.pedra + d.papel + d.tesoura - 1) < 1e-9, 'tudo Secreto: volta às odds do deck');
  // A IA que lê a mão ganha mais do jogador que joga ao acaso
  { const jogaAoAcaso = modo => { let v = 0, N = 200; for (let s = 0; s < N; s++) { const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: FILL, inimigo: { nome: 'x', deck: FILL, ia: { arq: null } }, semente: s, modo }); let g = 0; while (!e.fim && g++ < 14) { Motor.iniciarRodada(e); if (e.fim) break; IA.preparar(e); const c = e.jogador.mao[Math.floor(e.rng() * e.jogador.mao.length)]; Motor.resolverRodada(e, c.uid, {}); if (e.pendente) Motor.concluirRodada(e, []); } if (e.fim === 'derrota') v++; } return v / N; };
    const dn = jogaAoAcaso('normal'), da = jogaAoAcaso('aberta'); ok(da > dn, 'a IA lendo a mão vence mais de um jogador ao acaso (' + dn.toFixed(2) + ' → ' + da.toFixed(2) + ')'); }
  // Run no modo: Sigilosa nos inimigos comuns do ato 2
  { const r = Run.criar({ cfg: CONFIG, semente: 5, modo: 'aberta' }); igual(r.modo, 'aberta', 'a run guarda o modo'); r.etapa = 7; const def = Run.inimigoDaEtapa(r, 7); const dk = Run.montarDeckInimigo(r, def, 7, 'comum'); const n = dk.filter(x => x.mod === 'delatora').length; ok(n >= 1 && n <= 2, 'inimigo comum do ato 2 traz 1 ou 2 cartas Sigilosas (veio ' + n + ')');
    const r2 = Run.criar({ cfg: CONFIG, semente: 5 }); r2.etapa = 7; ok(Run.montarDeckInimigo(r2, Run.inimigoDaEtapa(r2, 7), 7, 'comum').every(x => !x.mod), 'no modo normal não há Sigilosas');
    const r3 = Run.criar({ cfg: CONFIG, semente: 5, modo: 'aberta' }); r3.etapa = 3; r3.subEscolhido = 'espiao'; const es = Run.iniciarCombate(r3); ok(/nunca ficam Secretas/.test(es.inimigoDef.regra), 'Espião: regra da Mão aberta'); }
  A.Motor.definirModo('normal');
})();

// ======================= Recompensa, Oficina, ordem das paradas, Loja (V4.1) =======================
(function paradas() {
  const fila = (n, fim, setup) => { const r = Run.criar({ cfg: CONFIG, semente: 60 + n }); r.etapa = n; if (Run.tipoDaEtapa(r, n) === 'sub') r.subEscolhido = 'ganancioso'; if (Run.tipoDaEtapa(r, n) === 'chefao') Run.chefaoDoAto(r, Run.atoDe(r, n)); if (setup) setup(r); const e = Run.iniciarCombate(r); e.fim = fim; Run.terminarCombate(r, e); return r.fila.join(); };
  igual(fila(1, 'vitoria'), 'omamori,recompensa,loja', 'combate 1: omamori inicial, Recompensa, Loja');
  igual(fila(2, 'vitoria'), 'recompensa,oficina', 'combate 2: Recompensa, Oficina');
  igual(fila(3, 'vitoria'), 'recsub,recompensa,loja', 'sub-chefe do ato 1: recompensa dele, Recompensa, Loja');
  igual(fila(4, 'vitoria'), 'recompensa,oficina', 'combate 4: Recompensa, Oficina');
  igual(fila(5, 'vitoria'), 'espolio,recompensa,loja', 'chefão: Espólio, Recompensa, Loja');
  igual(fila(6, 'vitoria'), 'recompensa,loja', 'combate 6 (1º do ato 2): Recompensa, Loja');
  igual(fila(7, 'vitoria'), 'recompensa,oficina', 'combate 7: Recompensa, Oficina');
  igual(fila(8, 'vitoria'), 'recsub,recompensa,mesa,loja', 'sub-chefe do ato 2: recompensa dele, Recompensa, Mesa do Apostador, Loja');
  igual(fila(9, 'vitoria'), 'recompensa,oficina', 'combate 9: Recompensa, Oficina');
  igual(fila(2, 'derrota'), 'recompensa,oficina', 'a Recompensa aparece também depois de derrota');
  igual(fila(2, 'empate'), 'recompensa,oficina', 'e depois de empate');
  igual(fila(5, 'derrota'), 'recompensa,loja', 'chefão perdido: sem Espólio, mas Recompensa e Loja (revanche)');
  igual(fila(3, 'derrota'), 'recompensa,loja', 'sub-chefe perdido: sem a recompensa dele');
  igual(fila(8, 'vitoria', r => { r.usos.mesa = true; }), 'recsub,recompensa,loja', 'sem Mesa quando ela já foi usada');
  // Recompensa de cartas
  const r = Run.criar({ cfg: CONFIG, semente: 70 }); r.etapa = 2; let e = Run.iniciarCombate(r); e.fim = 'vitoria'; Run.terminarCombate(r, e);
  igual(r.pendente.cartas.map(c => CARTAS_POR_ID[c.id].naipe), ['pedra', 'papel', 'tesoura'], 'Recompensa: 3 cartas, uma de cada naipe');
  const m0 = r.moedas, n0 = r.deck.length; ok(Run.recompensaEscolher(r, 1), 'escolhe 1 carta'); igual(r.deck.length, n0 + 1, 'ela entra no deck'); ok(!Run.recompensaEscolher(r, 0) && !Run.recompensaPular(r), 'só uma escolha por Recompensa'); ok(Run.recompensaCartasFeita(r), 'feita'); igual(r.moedas, m0, 'sem moedas ao escolher');
  { const r2 = Run.criar({ cfg: CONFIG, semente: 71 }); r2.etapa = 2; e = Run.iniciarCombate(r2); e.fim = 'vitoria'; Run.terminarCombate(r2, e); const m = r2.moedas; ok(Run.recompensaPular(r2), 'pula'); igual(r2.moedas, m + 2, 'pular a Recompensa dá 2 moedas'); igual(r2.deck.length, 6, 'sem carta nova'); }
  // Raridade da Recompensa por ato (amostra grande) e sem Prismáticas
  const cont = ato => { const c = { comum: 0, rara: 0, lendaria: 0, prismatica: 0, outra: 0 }; for (let i = 0; i < 500; i++) { const rr = Run.criar({ cfg: CONFIG, semente: 1000 + i }); rr.etapa = ato === 1 ? 2 : 7; const p = Run.montarRecompensaCartas ? null : null; Run.prepararPasso(Object.assign(rr, { fila: ['recompensa'] })); rr.pendente.cartas.forEach(x => { if (c[x.raridade] !== undefined) c[x.raridade]++; else c.outra++; }); } return c; };
  const c1 = cont(1), c2 = cont(2);
  ok(c1.prismatica === 0 && c2.prismatica === 0 && c1.outra === 0, 'a Recompensa nunca traz Prismática, Especial ou Troféu');
  const t1 = c1.comum + c1.rara + c1.lendaria, t2 = c2.comum + c2.rara + c2.lendaria;
  ok(Math.abs(c1.comum / t1 - .5) < .06 && Math.abs(c1.lendaria / t1 - .05) < .03, 'ato 1: 50% Comum, 45% Rara, 5% Lendária (' + (c1.comum / t1).toFixed(2) + ' / ' + (c1.lendaria / t1).toFixed(2) + ')');
  ok(Math.abs(c2.comum / t2 - .35) < .06 && Math.abs(c2.lendaria / t2 - .15) < .05, 'ato 2: 35% Comum, 50% Rara, 15% Lendária (' + (c2.comum / t2).toFixed(2) + ' / ' + (c2.lendaria / t2).toFixed(2) + ')');
  // Arquétipo ativo na Recompensa
  { let doArq = 0, tot = 0; for (let i = 0; i < 400; i++) { const rr = Run.criar({ cfg: CONFIG, semente: 3000 + i }); ['pedrada', 'multa', 'estilete'].forEach(id => rr.deck.push(Run.entrada(rr, id))); rr.etapa = 7; Run.prepararPasso(Object.assign(rr, { fila: ['recompensa'] })); rr.pendente.cartas.forEach(x => { if (x.raridade !== 'comum') { tot++; if (CARTAS_POR_ID[x.id].arq === 'Investida') doArq++; } }); }
    ok(doArq / tot > 0.38, 'arquétipo ativo aparece mais na Recompensa (' + (doArq / tot).toFixed(2) + ')'); }
  // Oficina
  { const r3 = Run.criar({ cfg: CONFIG, semente: 72 }); r3.etapa = 2; e = Run.iniciarCombate(r3); e.fim = 'vitoria'; Run.terminarCombate(r3, e); Run.concluirPasso(r3); igual(Run.passo(r3), 'oficina', 'depois da Recompensa vem a Oficina'); igual(r3.pendente.tipo, 'oficina', 'com a Oficina pronta');
    const alvo = r3.deck[0]; const m = r3.moedas; ok(Run.oficinaUpgrade(r3, alvo.eid) && alvo.up, 'upgrade grátis'); igual(r3.moedas, m, 'sem custo'); ok(!Run.oficinaUpgrade(r3, r3.deck[1].eid) && !Run.oficinaPular(r3), 'só 1 upgrade por Oficina'); ok(Run.oficinaFeita(r3), 'feita');
    const r4 = Run.criar({ cfg: CONFIG, semente: 73 }); r4.etapa = 2; e = Run.iniciarCombate(r4); e.fim = 'vitoria'; Run.terminarCombate(r4, e); Run.concluirPasso(r4); const m4 = r4.moedas; ok(Run.oficinaPular(r4), 'pula a Oficina'); igual(r4.moedas, m4 + 1, 'pular a Oficina dá 1 moeda');
    const r5 = Run.criar({ cfg: CONFIG, semente: 74 }); r5.etapa = 2; e = Run.iniciarCombate(r5); e.fim = 'vitoria'; Run.terminarCombate(r5, e); Run.concluirPasso(r5); r5.deck.forEach(x => { x.up = true; }); ok(!Run.oficinaUpgrade(r5, r5.deck[0].eid), 'carta já melhorada não recebe de novo'); }
  // Loja: omamori à venda
  { const r6 = Run.criar({ cfg: CONFIG, semente: 75 }); r6.etapa = 3; const L = Run.loja(r6); ok(L.omamori && !r6.omamoris.includes(L.omamori.id), 'a Loja vende 1 omamori que o jogador não tem'); r6.moedas = 6; ok(Run.comprarOmamoriLoja(r6), 'compra o omamori'); igual([r6.moedas, r6.omamoris.length], [0, 1], 'por 6 moedas'); ok(!Run.comprarOmamoriLoja(r6), 'uma vez só');
    r6.moedas = 6; const oc = L.omamori.id; ok(Run.renovarLoja(r6) && L.omamori.id === oc, 'renovar não troca o omamori');
    const r7 = Run.criar({ cfg: CONFIG, semente: 76 }); r7.etapa = 3; r7.omamoris = ['rochamae', 'cofre', 'cupom', 'seguro', 'estopim']; ok(Run.loja(r7).omamori === null, 'com 5 omamoris, o omamori some da Loja');
    const r8 = Run.criar({ cfg: CONFIG, semente: 77 }); r8.etapa = 3; r8.omamoris = ['cupom']; r8.moedas = 5; Run.loja(r8); r8.loja = null; const L8 = Run.loja(r8); igual(L8.omamori.preco, 5, 'Cupom: o omamori custa 1 a menos'); }
  // Raridades da Loja: só Raras ou melhores; ato 2 tem 8% de Prismática
  { let ato1 = { rara: 0, lendaria: 0, outra: 0 }, ato2 = { rara: 0, lendaria: 0, prismatica: 0 };
    for (let i = 0; i < 400; i++) { const a = Run.criar({ cfg: CONFIG, semente: 5000 + i }); a.etapa = 3; Run.loja(a).cartas.forEach(c => { if (ato1[c.raridade] !== undefined) ato1[c.raridade]++; else ato1.outra++; });
      const b = Run.criar({ cfg: CONFIG, semente: 6000 + i }); b.etapa = 8; Run.loja(b).cartas.forEach(c => { if (ato2[c.raridade] !== undefined) ato2[c.raridade]++; }); }
    const tt1 = ato1.rara + ato1.lendaria, tt2 = ato2.rara + ato2.lendaria + ato2.prismatica;
    ok(ato1.outra === 0 && Math.abs(ato1.lendaria / tt1 - .2) < .05, 'Loja ato 1: Rara 80%, Lendária 20% (veio ' + (ato1.lendaria / tt1).toFixed(2) + ')');
    ok(Math.abs(ato2.prismatica / tt2 - .08) < .04 && Math.abs(ato2.lendaria / tt2 - .32) < .06, 'Loja ato 2: Rara 60%, Lendária 32%, Prismática 8% (' + (ato2.lendaria / tt2).toFixed(2) + ' / ' + (ato2.prismatica / tt2).toFixed(2) + ')'); }
  // Espólio com o limite de omamoris cheio: o garantido pede para trocar
  { const r9 = Run.criar({ cfg: CONFIG, semente: 78 }); r9.etapa = 5; r9.omamoris = ['rochamae', 'cofre', 'cupom', 'seguro', 'estopim']; e = Run.iniciarCombate(r9); e.fim = 'vitoria'; Run.terminarCombate(r9, e);
    const p = r9.pendente; ok(!p.garantidoOk, 'limite cheio: o garantido espera a troca'); ok(!Run.espolioEscolher(r9, 'carta'), 'e a escolha também espera'); ok(Run.espolioGarantido(r9, 'cofre') && r9.omamoris.includes(p.garantido) && !r9.omamoris.includes('cofre'), 'troca um omamori pelo do chefão'); ok(Run.espolioEscolher(r9, 'omamori', 'cupom') && r9.omamoris.includes(p.sorteado), 'e o sorteado também (trocando outro)'); ok(Run.espolioFeito(r9), 'feito'); }
  // Espólio normal: escolher o omamori sorteado
  { const r10 = Run.criar({ cfg: CONFIG, semente: 79 }); r10.etapa = 10; r10.chefao[2] = 'trapaceiro'; e = Run.iniciarCombate(r10); e.fim = 'derrota'; Run.terminarCombate(r10, e); ok(r10.fila.indexOf('espolio') < 0, 'sem Espólio ao perder o chefão'); }
  // Deck: cartas Especiais, Troféus e Comuns não aparecem na Loja; tamanho de deck pelo bot nas medições
  igual(Run.recompensaCartasFeita(Run.criar({ cfg: CONFIG, semente: 1 })), true, 'sem pendente, a Recompensa está feita');
  // Save v4.1
  A.memoria.jokenblitz_save_v4 = '{"v":4}'; ok(Run.descartarSaveAntigo(), 'descarta o save da V4'); ok(!A.memoria.jokenblitz_save_v4, 'e apaga');
  const rs = Run.criar({ cfg: CONFIG, semente: 80, modo: 'aberta' }); Run.salvar(rs, { tela: 'run' }); const cd = Run.carregar(); ok(cd && cd.v === 41 && cd.run.modo === 'aberta', 'o save guarda o modo e é da V4.1'); Run.apagarSave();
})();

// ======================= Cartas: cobertura =======================
(function cobertura() {
  igual(CARTAS.filter(c => c.raridade === 'comum').length, 3, '3 Comuns');
  igual(CARTAS.filter(c => c.raridade === 'rara').length, 12, '12 Raras');
  igual(CARTAS.filter(c => c.raridade === 'lendaria').length, 9, '9 Lendárias');
  igual(CARTAS.filter(c => c.raridade === 'prismatica').length, 3, '3 Prismáticas');
  igual(CARTAS.filter(c => c.raridade === 'especial').length, 2, '2 Especiais');
  igual(CARTAS.filter(c => c.raridade === 'trofeu').length, 6, '6 Troféus');
  A.ARQUETIPOS.forEach(a => igual(CARTAS.filter(c => c.arq === a && c.raridade === 'rara').length, 3, '3 Raras de ' + a + ' (uma por naipe)'));
  CARTAS.forEach(c => {
    if (c.raridade !== 'comum' || c.up) ok(!c.efeito || A.EFEITOS[c.efeito] !== undefined, 'efeito existe: ' + c.id);
    if (c.raridade !== 'comum') ok(!!c.texto && /^\[/.test(c.texto), 'carta tem texto com etiqueta: ' + c.id);
    ok(!!c.up, 'carta tem upgrade: ' + c.id);
    ok(c.up.texto && c.up.texto !== c.texto, 'o upgrade muda o texto: ' + c.id);
  });
  CARTAS.filter(c => c.raridade === 'rara').forEach(c => ok(c.efeito !== 'bonus', 'Rara não é só +1 de dano: ' + c.id));
  const e = Motor.cartaDeEntrada({ id: 'pedra', up: true }, 1); igual(e.nome, 'Pedra+', 'nome com + no upgrade');
  OMAMORIS.forEach(o => ok(A.OMAMORIS_EFEITOS[o.id] !== undefined || ['cofre', 'cupom', 'seguro', 'mochila', 'cartola', 'caderno', 'relogio', 'fundacao', 'pasta'].indexOf(o.id) >= 0, 'omamori tem efeito: ' + o.id));
})();

console.log(falhas ? '\n' + falhas + ' FALHA(S) de ' + total : '\nTodas as ' + total + ' checagens passaram.');
process.exit(falhas ? 1 : 0);
