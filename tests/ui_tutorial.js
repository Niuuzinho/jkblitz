// Faz o tutorial inteiro pela interface (clicando) e confere que ele termina sem erro.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const arq = path.resolve(process.argv[2] || __dirname + '/../index.html');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let falhas = 0;
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
    const p = await ctx.newPage(); const erros = [];
    p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await p.goto('file://' + arq); await p.evaluate(() => localStorage.clear()); await p.reload();
    await p.evaluate(() => { UI.prefs.vel = 'nenhuma'; UI.aplicarPrefs(); });
    await p.click('.modal [data-acao=tut-iniciar]');
    let passos = 0, fim = false, rodadas = 0; const vistos = new Set();
    while (passos++ < 400 && !fim) {
      const info = await p.evaluate(() => ({ tela: UI.st.tela, fase: UI.st.fase, tut: !!UI.st.tutorial, acoes: [...document.querySelectorAll('[data-acao]')].filter(e => !e.disabled && e.offsetParent !== null).map(e => e.dataset.acao + (e.dataset.uid !== undefined ? ':' + e.dataset.uid : '') + (e.dataset.naipe ? '~' + e.dataset.naipe : '')), coach: (document.querySelector('.coach') || {}).innerText || '', ov: document.body.innerText.includes('Tutorial concluído') }));
      if (info.coach) vistos.add(info.coach.slice(0, 40));
      const tem = (pre) => info.acoes.filter(a => a.split(/[:~]/)[0] === pre);
      if (tem('tut-run').length) { fim = true; break; }
      let alvo = tem('tut-ok')[0] || tem('dica-ok')[0] || tem('seguirrun')[0] || tem('rapido')[0] || tem('proxima')[0];
      if (!alvo && info.fase === 'animando') { await p.keyboard.press('Space'); await p.waitForTimeout(30); continue; }
      if (!alvo && info.fase === 'escolha') { const s2 = tem('selecionar'); if (s2.length) alvo = s2[0]; }
      if (!alvo) alvo = tem('terminar')[0];
      if (!alvo) { await p.waitForTimeout(60); continue; }
      const a = alvo.split(/[:~]/)[0]; let sel = `[data-acao="${a}"]`; const m = alvo.match(/:(.*)$/); if (m) sel += `[data-uid="${m[1]}"]`;
      try { await p.click(sel, { timeout: 1200 }); } catch (e) { await p.keyboard.press('Escape'); }
    }
    console.log(`tutorial ${w}x${h}: passos ${passos}, terminou ${fim}, textos do treinador vistos ${vistos.size}, erros ${erros.length}`);
    if (!fim || erros.length) { falhas++; console.log(erros.slice(0, 5)); await p.screenshot({ path: '/tmp/tut' + w + '.png' }); }
    await ctx.close();
  }
  await b.close(); console.log(falhas ? 'FALHOU' : 'OK'); process.exit(falhas ? 1 : 0);
})();
