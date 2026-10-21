// Simula runs completas (sem tela) com os bots e confere invariantes do jogo.
// Uso: node tests/simular.js [quantidade de runs por política]
const { carregar } = require('./carregar.js');
const { criarBot } = require('./bot.js');
const A = carregar(); const bot = criarBot(A);
const { Motor, Run, CONFIG } = A;
const N = Number(process.argv[2] || 150);
let total = 0, falhas = 0;
const ok = (c, m) => { total++; if (!c) { falhas++; if (falhas < 15) console.log('FALHOU:', m); } };

// Invariantes conferidas a cada rodada
function confere(e) {
  [e.jogador, e.inimigo].forEach(j => {
    const n = j.deck.length + j.mao.length + j.cemiterio.length + j.cortadas.length;
    ok(n === j.todas.length, 'nenhuma carta se perde nem se cria (' + j.nome + ': ' + n + ' de ' + j.todas.length + ')');
    ok(j.mao.length <= Math.max(j.baseMao + 1, 4) + 1, 'mão com tamanho razoável: ' + j.mao.length);
    ok(j.vida <= j.vidaMax, 'vida não passa do máximo');
    ok(!j.mao.some(c => A.Motor.ehFragil(c) && j.cortadas.indexOf(c) >= 0), 'carta em duas zonas');
    ok(!j.mao.some(c => c.marcada && c.secreta), 'carta Marcada e Secreta ao mesmo tempo');
  });
}

const resultados = {};
[['normal', 'odds'], ['normal', 'acaso'], ['aberta', 'odds'], ['aberta', 'acaso']].forEach(([modo, pol]) => {
  let v = 0, deckTot = 0, rodadas = 0, combates = 0, mesas = 0, subs = 0, chefes = 0, revanches = 0, ganho = 0, gasto = 0, omas = 0;
  for (let s = 1; s <= N; s++) {
    const run = bot.runCompleta(s * 7 + 3, pol, { modo, aoCombate: (r, e) => { combates++; rodadas += e.rodada; if (r.mapa[r.mapa.length - 1].tipo === 'chefao' && r.mapa[r.mapa.length - 1].resultado !== 'vitoria') revanches++; } });
    ok(run.fim === 'vitoria' || run.fim === 'derrota', 'run termina');
    ok(run.deck.length >= CONFIG.deckMinimo, 'deck nunca abaixo do mínimo (' + run.deck.length + ')');
    ok(run.omamoris.length <= CONFIG.run.limiteOmamoris, 'no máximo 5 omamoris');
    ok(run.moedas >= 0, 'moedas nunca negativas');
    ok(run.deck.filter(e => A.CARTAS_POR_ID[e.id].raridade === 'prismatica').length <= 1, 'no máximo 1 prismática');
    ['dinamite', 'curinga'].forEach(id => ok(run.deck.filter(e => e.id === id).length <= 1, 'no máximo 1 ' + id));
    A.CARTAS.filter(c => c.raridade === 'trofeu').forEach(c => ok(run.deck.filter(e => e.id === c.id).length <= 1, 'no máximo 1 troféu'));
    if (run.fim === 'vitoria') v++;
    ok(run.modo === modo, 'a run guarda o modo'); omas += run.omamoris.length;
    deckTot += run.deck.length; mesas += run.vistos.mesa || 0; subs += run.vistos.sub || 0; chefes += run.vistos.chefao || 0;
    Object.keys(run.stats.ganho).forEach(k => { ganho += run.stats.ganho[k]; }); Object.keys(run.stats.gasto).forEach(k => { gasto += run.stats.gasto[k]; });
  }
  resultados[modo + '/' + pol] = { vitorias: v, deck: (deckTot / N).toFixed(1), omamoris: (omas / N).toFixed(1), rodadasPorCombate: (rodadas / combates).toFixed(1), mesas, subs, chefes, revanches, ganho: (ganho / N).toFixed(1), gasto: (gasto / N).toFixed(1) };
});

// Invariantes dentro dos combates (amostra)
for (let s = 1; s <= 120; s++) {
  const run = Run.criar({ cfg: CONFIG, semente: s, modo: s % 3 === 0 ? 'aberta' : 'normal' });
  [1, 2, 4, 5, 6, 7, 9, 10].forEach(n => {
    run.etapa = n; if (Run.tipoDaEtapa(run, n) === 'sub') Run.escolherSub(run, Run.subOfertas(run)[s % 2]);
    ['pedrada', 'multa', 'guilhotina', 'cristal', 'mapa', 'geodo', 'testamento', 'cutelo', 'bisturi', 'origami', 'meteoro', 'excalisoura', 'curinga', 'dinamite', 'bainha', 'monolito', 'cascalho', 'recorte', 'papelao', 'rascunho', 'bilhete', 'abridor', 'ponteiro', 'fichario', 'pedraangular', 'florete', 'biombo'].forEach((id, i) => { if (i % 4 === s % 4) run.deck.push(Run.entrada(run, id, { up: s % 2 === 0, mod: ['pesada', 'blindada', 'guardada', 'delatora', 'namanga'][i % 5] })); });
    const e = Run.iniciarCombate(run);
    bot.combate(e, s % 2 ? 'odds' : 'acaso', { antes: confere });
    ok(!!e.fim, 'combate termina');
    ok(e.rodada <= CONFIG.limiteRodadas, 'no máximo 12 rodadas');
    run.deck = run.deck.slice(0, 12);
  });
}

console.log('Resultados das runs completas (' + N + ' por política):'); console.log(JSON.stringify(resultados, null, 1));
ok(resultados['normal/odds'].vitorias >= resultados['normal/acaso'].vitorias, 'o bot pelas odds ganha mais que o bot ao acaso (normal)');
console.log(falhas ? '\n' + falhas + ' FALHA(S) de ' + total : '\nTodas as ' + total + ' checagens passaram.');
process.exit(falhas ? 1 : 0);
