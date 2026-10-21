// Confere o ritmo do combate na interface real: um toque por rodada, contagem "Jo… Ken… Pô!" / "Blitz!",
// próxima rodada sozinha em cerca de 1,5 s, um toque pula, "Confirmar jogada", escolhas na linha da mesa.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const arq = path.resolve(process.argv[2] || __dirname + '/../index.html');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log('FALHOU:', m); } else console.log('ok:', m); };
  const novo = async (w, h) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 }); const p = await ctx.newPage(); const erros = [];
    p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await p.goto('file://' + arq); await p.evaluate(() => localStorage.clear()); await p.reload();
    await p.click('[data-acao=tut-recusar]'); await p.evaluate(() => { UI.prefs.hints = false; UI.prefs.vel = 'normal'; UI.aplicarPrefs(); });
    return { ctx, p, erros };
  };
  // combate montado à mão: mão do jogador e decisão da IA fixas
  const montar = (p, opc) => p.evaluate(o => {
    const e = Motor.criarCombate({ cfg: CONFIG, deckJogador: o.deckJ, inimigo: { nome: 'Teste', deck: o.deckI, ia: {}, vida: 5 }, semente: 3, ordemFixa: true, rodadaBlitz: o.blitz || 6 });
    UI.st.run = null; UI.combate.abrirCombate(e);
    return true;
  }, opc);
  const estado = p => p.evaluate(() => ({ fase: UI.st.fase, rodada: UI.st.estado.rodada, cont: (document.getElementById('contagem') || {}).textContent, sel: UI.st.selecionado, prompt: UI.st.prompt && UI.st.prompt.tipo, linha: !!document.querySelector('.escolha-linha'), vida: [UI.st.estado.jogador.vida, UI.st.estado.inimigo.vida] }));

  // 1. Um toque joga; contagem; resultado; avanço automático
  { const { ctx, p, erros } = await novo(1366, 768);
    await montar(p, { deckJ: ['pedra', 'papel', 'tesoura', 'pedra', 'papel', 'tesoura'], deckI: ['pedra', 'pedra', 'pedra', 'pedra', 'pedra', 'pedra'] });
    ok((await estado(p)).fase === 'escolha', 'começa na escolha');
    const t0 = Date.now(); await p.click('.mao .carta >> nth=0');
    const vistos = new Set(); let fase = '', t1 = 0;
    while (Date.now() - t0 < 4000) { const s = await estado(p); if (s.cont) vistos.add(s.cont); if (s.fase === 'revelacao' && !t1) t1 = Date.now() - t0; if (s.fase === 'escolha' && s.rodada === 2) { fase = 'rodada2'; break; } await p.waitForTimeout(30); }
    const total = Date.now() - t0;
    ok(!(await p.evaluate(() => !!document.querySelector('[data-acao=confirmar]'))), 'não há botão de confirmar');
    ok(vistos.has('Jo…') && vistos.has('Ken…') && vistos.has('Pô!'), 'contagem Jo… Ken… Pô! (' + [...vistos].join(' ') + ')');
    ok(t1 > 0 && t1 < 3500, 'o resultado aparece em ' + t1 + ' ms');
    ok(fase === 'rodada2', 'a rodada 2 começa sozinha (' + total + ' ms depois do toque)');
    ok(total - t1 > 1100 && total - t1 < 2200, 'espera de cerca de 1,5 s entre o resultado e a próxima rodada (' + (total - t1) + ' ms)');
    // um toque pula a animação e a espera
    const t2 = Date.now(); await p.click('.mao .carta >> nth=0'); await p.waitForTimeout(120); await p.mouse.click(680, 380);   // toque na mesa durante a contagem
    let s = await estado(p); ok(s.fase === 'revelacao', 'um toque pula a animação');
    await p.mouse.click(680, 380); await p.waitForTimeout(80); s = await estado(p); ok(s.fase === 'escolha' && s.rodada === 3, 'um toque pula a espera da próxima rodada (' + (Date.now() - t2) + ' ms no total)');
    ok(erros.length === 0, 'sem erros de JavaScript (' + erros.length + ')'); await ctx.close(); }

  // 2. Na Blitz a contagem termina em "Blitz!"
  { const { ctx, p } = await novo(1366, 768);
    await montar(p, { deckJ: ['pedra', 'papel', 'tesoura', 'pedra', 'papel', 'tesoura'], deckI: ['pedra', 'pedra', 'pedra', 'pedra', 'pedra', 'pedra'], blitz: 1 });
    await p.click('.mao .carta >> nth=0'); const vistos = new Set(); const t0 = Date.now();
    while (Date.now() - t0 < 1500) { const s = await estado(p); if (s.cont) vistos.add(s.cont); await p.waitForTimeout(25); }
    ok(vistos.has('Blitz!') && !vistos.has('Pô!'), 'durante a Blitz: Jo… Ken… Blitz! (' + [...vistos].join(' ') + ')'); await ctx.close(); }

  // 3. Confirmar jogada ligada: o primeiro toque seleciona, o segundo joga
  { const { ctx, p } = await novo(1366, 768);
    await p.evaluate(() => { UI.prefs.confirmar = true; UI.prefs.vel = 'nenhuma'; UI.aplicarPrefs(); });
    await montar(p, { deckJ: ['pedra', 'papel', 'tesoura', 'pedra', 'papel', 'tesoura'], deckI: ['pedra', 'pedra', 'pedra', 'pedra', 'pedra', 'pedra'] });
    await p.click('.mao .carta >> nth=1'); let s = await estado(p); ok(s.fase === 'escolha' && s.sel != null && s.linha, 'com Confirmar jogada, o primeiro toque só seleciona (e aparece o botão Jogar)');
    await p.click('[data-acao=confirmar]'); await p.waitForTimeout(100); s = await estado(p); ok(s.rodada === 2 || s.fase !== 'escolha', 'e o botão joga'); await ctx.close(); }

  // 4. Escolhas de efeito na linha da mesa, sem janela (Rascunho e guardar)
  { const { ctx, p } = await novo(1366, 768);
    await p.evaluate(() => { UI.prefs.vel = 'nenhuma'; UI.aplicarPrefs(); });
    await montar(p, { deckJ: ['rascunho', 'papel', 'tesoura', 'pedra', 'papel', 'tesoura'], deckI: ['pedra', 'pedra', 'pedra', 'pedra', 'pedra', 'pedra'] });
    await p.click('.mao .carta >> nth=0'); await p.waitForTimeout(60); let s = await estado(p);
    ok(s.prompt === 'escolha-naipe' && s.linha && !(await p.evaluate(() => !!document.querySelector('.modal'))), 'Rascunho: pergunta numa linha de botões, sem janela');
    await p.click('[data-acao=prompt-jogar][data-valor=tesoura]'); await p.waitForTimeout(100); s = await estado(p); ok(s.rodada === 2 || s.fase === 'revelacao', 'e jogar segue sozinho');
    await montar(p, { deckJ: ['papel', 'pedra', 'tesoura', 'pedra', 'papel', 'tesoura'], deckI: ['tesoura', 'tesoura', 'tesoura', 'tesoura', 'tesoura', 'tesoura'] });
    await p.evaluate(() => { const e = UI.st.estado; e.jogador.mao.forEach(c => { c.mod = null; }); e.jogador.mao[0].mod = null; });
    await p.evaluate(() => { const e = UI.st.estado; const h = Motor.cartaDeEntrada({ id: 'papelao', up: true }, 777); e.jogador.mao[0] = h; e.jogador.todas.push(h); UI.desenhar(); });
    await p.click('.mao .carta >> nth=0'); await p.waitForTimeout(150); s = await estado(p);
    ok(s.prompt === 'guardar' && s.linha, 'Papelão+: escolha do que guardar na linha da mesa'); await p.click('[data-acao=guardar-sel] >> nth=0'); await p.click('[data-acao=guardar-ok]'); await p.waitForTimeout(150); s = await estado(p);
    ok(s.rodada === 2, 'depois de guardar, a próxima rodada começa sozinha'); await ctx.close(); }

  // 5. Fim de combate com um botão só
  { const { ctx, p } = await novo(1366, 768);
    await p.evaluate(() => { UI.prefs.vel = 'nenhuma'; UI.aplicarPrefs(); });
    await montar(p, { deckJ: ['papel', 'papel', 'papel', 'papel', 'papel', 'papel'], deckI: ['pedra', 'pedra', 'pedra', 'pedra', 'pedra', 'pedra'] });
    for (let k = 0; k < 8; k++) { await p.waitForTimeout(80); const f = await p.evaluate(() => !!document.querySelector('.fim')); if (f) break; await p.click('.mao .carta:not([disabled]) >> nth=0').catch(() => {}); }
    await p.waitForTimeout(150);
    const botoes = await p.evaluate(() => [...document.querySelectorAll('.fim button')].map(b => b.textContent));
    ok(botoes.length === 1 && botoes[0] === 'Continuar', 'fim do combate: um botão só ("' + botoes.join('/') + '")'); await ctx.close(); }

  await b.close(); console.log(falhas ? 'FALHOU: ' + falhas : 'OK'); process.exit(falhas ? 1 : 0);
})();
