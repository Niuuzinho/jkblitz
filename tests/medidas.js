// Medições da V4.1 (seção "O que medir" do roteiro), nos dois modos (Normal e Mão aberta).
// Rode: node tests/medidas.js [partidas por confronto]
const { carregar } = require('./carregar.js');
const { criarBot } = require('./bot.js');
const A = carregar(); const bot = criarBot(A);
const { Motor, Run, CONFIG, INIMIGOS, SUBCHEFES, CHEFOES, DECKS_JOGADOR, CARTAS_POR_ID } = A;
const N = Number(process.argv[2] || 240);
const pct = (v, t) => (100 * v / t).toFixed(0) + '%';
const MODOS = ['normal', 'aberta'];
const col = (m, f) => MODOS.map(x => f(x)).join(' | ');

// Um combate de um deck de teste contra um inimigo montado como a run monta (combate n do ato)
function luta(deck, def, n, tipo, politica, semente, modo, extra) {
  const run = Run.criar({ cfg: CONFIG, semente, modo }); run.etapa = n; run.deck = deck.map((e, i) => ({ eid: 100 + i, id: e.id, up: !!e.up, mod: e.mod || null }));
  if (tipo === 'sub') run.subEscolhido = def.id;
  if (tipo === 'comum') run.inimigoForcado = def.id;
  if (tipo === 'chefao') run.chefao[def.ato] = def.id;
  run.omamoris = (extra && extra.omamoris) || [];
  const e = Run.iniciarCombate(run);
  bot.combate(e, politica);
  return e.fim;
}
const comUp = (cartas, k) => cartas.map((c, i) => ({ id: c.id, up: i % k === 0 }));
const arqDecks = Object.keys(DECKS_JOGADOR).filter(k => k !== 'basico');

console.log('=== 1. Runs completas (bot pelas odds): deck no fim, omamoris, vitórias ===');
console.log('(alvo do deck: ' + CONFIG.run.deckAlvo.join(' a ') + ' cartas; omamoris esperados: 3 a 4)');
const R = Math.max(150, Math.round(N * 1.5));
MODOS.forEach(modo => {
  let vit = 0, deck = 0, om = 0, naFaixa = 0, om34 = 0, omVit = 0, deckVit = 0; const tam = [];
  for (let s = 1; s <= R; s++) {
    const run = bot.runCompleta(s * 13 + 1, 'odds', { modo }); if (run.fim === 'vitoria') vit++;
    deck += run.deck.length; tam.push(run.deck.length); om += run.omamoris.length;
    if (run.fim === 'vitoria') { omVit += run.omamoris.length; deckVit += run.deck.length; }
    if (run.deck.length >= CONFIG.run.deckAlvo[0] && run.deck.length <= CONFIG.run.deckAlvo[1]) naFaixa++;
    if (run.omamoris.length >= 3 && run.omamoris.length <= 4) om34++;
  }
  tam.sort((a, b) => a - b);
  console.log(modo.padEnd(7), '| vitórias na run:', pct(vit, R), '| deck médio:', (deck / R).toFixed(1), '(mediana ' + tam[Math.floor(R / 2)] + ', de ' + tam[0] + ' a ' + tam[R - 1] + ', dentro de 14-18: ' + pct(naFaixa, R) + ')', '| omamoris por run:', (om / R).toFixed(2), '(3 a 4 em ' + pct(om34, R) + ' das runs)', '| só nas runs vencidas: deck', vit ? (deckVit / vit).toFixed(1) : '—', ', omamoris', vit ? (omVit / vit).toFixed(2) : '—');
});

console.log('\n=== 2. Taxa de vitória por arquétipo (deck de 12 cartas, sem upgrades nem omamoris) contra os inimigos comuns (bot pelas odds) ===');
console.log('(combates 2, 4, 7 e 9; normal | Mão aberta)');
['basico'].concat(arqDecks).forEach(k => {
  const r = {};
  MODOS.forEach(modo => { let v = 0, t = 0; Object.keys(INIMIGOS).forEach(ik => [2, 4, 7, 9].forEach(n => { for (let s = 0; s < N / 8; s++) { t++; if (luta(DECKS_JOGADOR[k].cartas, INIMIGOS[ik], n, 'comum', 'odds', 1000 + s, modo) === 'vitoria') v++; } })); r[modo] = pct(v, t); });
  console.log(k.padEnd(10), r.normal, '|', r.aberta);
});

console.log('\n=== 3. Taxa de vitória por inimigo comum (média dos decks de arquétipo com 3 upgrades e Rocha-Mãe) ===');
Object.keys(INIMIGOS).forEach(ik => {
  const r = {};
  MODOS.forEach(modo => { let v = 0, t = 0; arqDecks.forEach(k => [2, 4, 7, 9].forEach(n => { for (let s = 0; s < N / 8; s++) { t++; if (luta(comUp(DECKS_JOGADOR[k].cartas, 4), INIMIGOS[ik], n, 'comum', 'odds', 500 + s, modo, { omamoris: ['rochamae'] }) === 'vitoria') v++; } })); r[modo] = pct(v, t); });
  console.log((INIMIGOS[ik].nome + ' (' + INIMIGOS[ik].arq + ')').padEnd(26), r.normal, '|', r.aberta);
});

console.log('\n=== 4. Taxa de vitória contra cada sub-chefe (decks de arquétipo com 3 upgrades; ato 1 = combate 3, ato 2 = combate 8) ===');
Object.keys(SUBCHEFES).forEach(id => {
  const cel = modo => [3, 8].map(n => { let v = 0, t = 0; arqDecks.forEach(k => { for (let s = 0; s < N / 4; s++) { t++; if (luta(comUp(DECKS_JOGADOR[k].cartas, 4), SUBCHEFES[id], n, 'sub', 'odds', 700 + s, modo) === 'vitoria') v++; } }); return pct(v, t); }).join(' / ');
  console.log((SUBCHEFES[id].nome + ' (' + (SUBCHEFES[id].arq || 'o seu') + ')').padEnd(28), 'normal', cel('normal'), '| Mão aberta', cel('aberta'));
});

console.log('\n=== 5. Taxa de vitória contra cada chefão (decks de arquétipo com 3 upgrades e Rocha-Mãe) ===');
Object.keys(CHEFOES).forEach(id => {
  const ch = CHEFOES[id], n = ch.ato === 1 ? 5 : 10;
  const r = {};
  MODOS.forEach(modo => { let v = 0, t = 0; arqDecks.forEach(k => { for (let s = 0; s < N / 4; s++) { t++; if (luta(comUp(DECKS_JOGADOR[k].cartas, 4), ch, n, 'chefao', 'odds', 900 + s, modo, { omamoris: ['rochamae'] }) === 'vitoria') v++; } }); r[modo] = pct(v, t); });
  console.log((ch.nome + ' (' + ch.arq + ', ato ' + ch.ato + ')').padEnd(34), r.normal, '|', r.aberta);
});

console.log('\n=== 6. Leitura vale quanto? Bot pelas odds contra bot ao acaso (mesmos decks e inimigos) ===');
['basico', 'investida', 'muralha', 'arquivo', 'leitura'].forEach(k => {
  const r = {};
  MODOS.forEach(modo => { let a = 0, b = 0, t = 0; Object.keys(INIMIGOS).forEach(ik => [2, 4, 7, 9].forEach(n => { for (let s = 0; s < N / 8; s++) { t++; if (luta(DECKS_JOGADOR[k].cartas, INIMIGOS[ik], n, 'comum', 'odds', 40 + s, modo) === 'vitoria') a++; if (luta(DECKS_JOGADOR[k].cartas, INIMIGOS[ik], n, 'comum', 'acaso', 40 + s, modo) === 'vitoria') b++; } })); r[modo] = 'odds ' + pct(a, t) + ' acaso ' + pct(b, t) + ' (+' + (100 * (a - b) / t).toFixed(0) + ' pts)'; });
  console.log(k.padEnd(10), 'normal:', r.normal, '| Mão aberta:', r.aberta);
});

console.log('\n=== 7. Mão aberta: a IA que lê a sua mão (vitórias da IA, % dos combates) ===');
console.log('(a IA do modo normal não lê a mão; é a referência. Média dos decks de teste contra todos os inimigos comuns, combates 2, 4, 7 e 9)');
['acaso', 'odds'].forEach(pol => {
  const r = {};
  MODOS.forEach(modo => { let ia = 0, emp = 0, t = 0; ['basico'].concat(arqDecks).forEach(k => Object.keys(INIMIGOS).forEach(ik => [2, 4, 7, 9].forEach(n => { for (let s = 0; s < N / 12; s++) { t++; const f = luta(DECKS_JOGADOR[k].cartas, INIMIGOS[ik], n, 'comum', pol, 2000 + s, modo); if (f === 'derrota') ia++; else if (f === 'empate') emp++; } }))); r[modo] = pct(ia, t) + ' (empates ' + pct(emp, t) + ')'; });
  console.log(('contra o bot ' + (pol === 'acaso' ? 'ao acaso' : 'pelas odds')).padEnd(26), 'IA normal:', r.normal, '| IA lendo a mão:', r.aberta);
});
console.log('\n(Os chefões na Mão aberta também tampam cartas; ver o item 5.)');
