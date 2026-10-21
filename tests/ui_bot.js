// Joga runs inteiras pela interface real (clicando), em vários tamanhos de tela e nos dois modos.
// Falha se aparecer erro de JavaScript, se a tela rolar na luta (computador) ou se o bot travar.
// Uso: node tests/ui_bot.js [arquivo.html] [runs]      (SHOT=pasta salva uma captura de cada tela; MODO=aberta joga a Mão aberta)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const arq = path.resolve(process.argv[2] || __dirname + '/../index.html');
const RUNS = Number(process.argv[3] || 3);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let falhas = 0;
  const tamanhos = process.env.TAM ? [process.env.TAM.split('x').map(Number)] : [[1366, 768], [390, 844], [1920, 1080]];
  for (let r = Number(process.env.DE || 0); r < RUNS; r++) {
    const [w, h] = tamanhos[r % tamanhos.length];
    const modo = process.env.MODO || (r % 2 === 0 ? 'normal' : 'aberta');
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
    const p = await ctx.newPage();
    const erros = [];
    p.on('pageerror', e => erros.push((e.stack || e.message).split('\n').slice(0, 4).join(' | ')));
    p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await p.goto('file://' + arq);
    await p.evaluate(() => { localStorage.clear(); });
    await p.reload();
    await p.click('[data-acao=tut-recusar]');
    await p.evaluate(() => { UI.prefs.vel = 'nenhuma'; UI.aplicarPrefs(); UI.prefs.hints = false; });
    await p.click(`[data-acao=modo][data-valor=${modo}]`);
    await p.click('[data-acao=novarun]');
    const telas = {}; let passos = 0, rolou = 0, fim = false, parado = 0;
    while (passos++ < 3000 && !fim) {
      const info = await p.evaluate(() => ({ tela: UI.st.tela, fase: UI.st.fase, modal: !!UI.st.modal, prompt: UI.st.prompt && UI.st.prompt.tipo,
        acoes: [...document.querySelectorAll('[data-acao]')].filter(e => !e.disabled && e.offsetParent !== null).map(e => ({ a: e.dataset.acao, uid: e.dataset.uid, id: e.dataset.id, naipe: e.dataset.naipe, i: e.dataset.i, tipo: e.dataset.tipo, modo: e.dataset.modo, valor: e.dataset.valor, chave: e.dataset.chave })),
        sobra: document.documentElement.scrollHeight - innerHeight }));
      const chave = info.tela + (info.tela === 'combate' ? '/' + info.fase : '');
      if (process.env.SHOT && !telas[chave]) { await p.waitForTimeout(250); await p.screenshot({ path: process.env.SHOT + '/' + modo + '_' + w + '_' + chave.replace('/', '-') + '.png', fullPage: true }); }
      telas[chave] = 1;
      if (info.tela === 'combate' && info.fase === 'escolha' && info.sobra > 4 && w >= 1000) { rolou++; if (rolou === 1) console.log('  rolagem de', info.sobra, 'px na fase', info.fase); }
      const tem = (pre) => info.acoes.filter(a => a.a === pre);
      const um = lista => lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;
      let alvo = null;
      if (info.modal) { await p.keyboard.press('Escape'); continue; }
      else if (info.tela === 'combate') {
        if (info.fase === 'animando') { await p.keyboard.press('Space'); await p.waitForTimeout(30); continue; }
        alvo = tem('seguirrun')[0] || tem('menu').filter(() => false)[0];
        if (!alvo && info.prompt === 'guardar') { const ok = tem('guardar-ok'); alvo = ok[0] || um(tem('guardar-sel')); }
        if (!alvo) alvo = um(tem('tapar')) || um(tem('prompt-jogar')) || um(tem('prompt-carta')) || um(tem('prompt-cartola')) || tem('prompt-cancelar')[0];
        if (!alvo && info.fase === 'escolha') alvo = um(tem('selecionar'));
        if (!alvo && info.fase === 'revelacao') { await p.waitForTimeout(40); }
      } else if (info.tela === 'fimrun') { fim = true; break; }
      else if (info.tela === 'run') {
        alvo = tem('sub-escolher').length && !tem('combater').length ? um(tem('sub-escolher')) : tem('combater')[0] || um(tem('sub-escolher'));
      } else if (info.tela === 'loja') {
        const r = Math.random();
        if (r < .5) alvo = um(tem('loja-comprar')) || tem('loja-omamori')[0];
        if (!alvo && tem('loja-sel').length) alvo = r < .3 ? tem('loja-modo')[0] : um(tem('loja-sel'));   // cancela às vezes: cartas cinzas não fazem nada
        if (!alvo && r < .8) alvo = um(tem('loja-modo')) || tem('loja-renovar')[0];
        if (!alvo) alvo = tem('passo-ok')[0];
      } else if (info.tela === 'recompensa') {
        alvo = Math.random() < .85 ? um(tem('rec-carta')) : tem('rec-pular')[0];
        alvo = alvo || tem('passo-ok')[0] || tem('rec-pular')[0];
      } else if (info.tela === 'oficina') {
        alvo = Math.random() < .85 ? um(tem('ofi-up')) : tem('ofi-pular')[0];
        alvo = alvo || tem('passo-ok')[0] || tem('ofi-pular')[0];
      } else if (info.tela === 'recsub') {
        alvo = um(tem('rec-escolher')) || tem('rec-moedas')[0] || um(tem('rec-up')) || tem('passo-ok')[0] || um(tem('prompt-substituir'));
      } else if (info.tela === 'mesa') {
        alvo = um(tem('mesa-premio')) || um(tem('mesa-jogar')) || (Math.random() < .6 ? (tem('mesa-aposta-moedas')[0] || um(tem('mesa-aposta-lend'))) : null) || tem('mesa-recusar')[0] || tem('passo-ok')[0];
      } else if (info.tela === 'espolio') alvo = tem('espolio-garantido')[0] || um(tem('espolio')) || tem('passo-ok')[0] || um(tem('prompt-substituir'));
      else if (info.tela === 'omamori') alvo = um(tem('omamori-inicial'));
      else alvo = tem('passo-ok')[0] || tem('combater')[0];
      if (!alvo && info.prompt === undefined && info.tela !== 'combate') alvo = um(tem('prompt-substituir'));
      if (!alvo) { await p.waitForTimeout(60); if (++parado > 60) break; continue; }
      parado = 0;
      let sel = `[data-acao="${alvo.a}"]`;
      ['uid', 'id', 'naipe', 'i', 'tipo', 'modo', 'valor', 'chave'].forEach(k => { if (alvo[k] !== undefined) sel += `[data-${k}="${alvo[k]}"]`; });
      if (process.env.V) console.log(passos, info.tela, info.fase, sel);
      try { await p.click(sel, { timeout: 1500 }); } catch (e) { await p.keyboard.press('Escape'); }
      if ((await p.evaluate(() => UI.st.tela)) === 'fimrun') fim = true;
      if (info.tela === 'recompensa' && !info.acoes.length) await p.waitForTimeout(30);
    }
    const tela = await p.evaluate(() => UI.st.tela);
    console.log(`run ${r + 1} (${w}x${h}, ${modo}): passos ${passos}, tela final ${tela}, telas vistas: ${Object.keys(telas).join(', ')}, rolagem indevida ${rolou}, erros ${erros.length}`);
    if (erros.length) { console.log(erros.slice(0, 5)); falhas++; }
    if (rolou > 0) falhas++;
    if (!fim && tela !== 'fimrun') { falhas++; console.log('  travou:', await p.evaluate(() => document.body.innerText.slice(0, 300))); await p.screenshot({ path: '/tmp/travou' + r + '.png' }); }
    await ctx.close();
  }
  await b.close();
  console.log(falhas ? 'FALHOU: ' + falhas : 'OK');
  process.exit(falhas ? 1 : 0);
})();
