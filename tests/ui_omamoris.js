// Para cada omamori, nos dois modos (MODO=normal ou aberta para um só), abre um combate com ele na interface
// (com um deck cheio de cartas que pedem decisões) e joga várias rodadas clicando. Pega erros de tela que só aparecem com um omamori ou carta específicos.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const arq = path.resolve(process.argv[2] || __dirname + '/../index.html');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let falhas = 0, cx = null, p, ids = [];
  const erros = [];
  const tela = async () => p.evaluate(() => ({ fase: UI.st.fase, prompt: UI.st.prompt && UI.st.prompt.tipo, fim: !!(UI.st.estado && UI.st.estado.fim),
    acoes: [...document.querySelectorAll('[data-acao]')].filter(e => !e.disabled && e.offsetParent !== null).map(e => ({ a: e.dataset.acao, uid: e.dataset.uid, valor: e.dataset.valor, chave: e.dataset.chave })) }));
  const lista = process.env.ID ? process.env.ID.split(',') : null;
  {
    const c0 = await b.newContext(); const p0 = await c0.newPage(); await p0.goto('file://' + arq); ids = lista || await p0.evaluate(() => OMAMORIS.map(o => o.id)); await c0.close();
  }
  for (const modo of (process.env.MODO ? [process.env.MODO] : ['normal', 'aberta'])) for (const id of ids) {
    const antes = erros.length;
    if (cx) await cx.close();
    cx = await b.newContext({ viewport: { width: 1366, height: 768 } }); p = await cx.newPage();
    p.on('pageerror', e => erros.push((e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
    await p.goto('file://' + arq); await p.click('[data-acao=tut-recusar]').catch(() => {});
    await p.evaluate(() => { UI.prefs.vel = 'nenhuma'; UI.prefs.hints = false; UI.aplicarPrefs(); });
    await p.click(`[data-acao=modo][data-valor=${modo}]`);
    await p.click('[data-acao=novarun]');
    await p.evaluate(id => {
      const run = UI.st.run; run.etapa = 2; run.omamoris = [id];
      ['rascunho', 'testamento', 'recorte', 'papelao', 'cascalho', 'cristal', 'geodo', 'curinga', 'dinamite', 'meteoro', 'origami', 'bainha', 'mapa', 'bilhete'].forEach((c, i) => run.deck.push(Run.entrada(run, c, { up: i % 2 === 0, mod: i % 3 === 0 ? ['pesada', 'delatora', 'guardada', 'blindada', 'namanga'][i % 5] : null })));
      UI.desenhar();
    }, id);
    await p.click('[data-acao=combater]');
    for (let k = 0; k < 60; k++) {
      const info = await tela();
      if (info.fim && info.fase === 'revelacao' && !info.acoes.some(x => x.a === 'seguirrun') && k > 3) { await p.waitForTimeout(40); }
      const tem = pre => info.acoes.find(x => x.a === pre);
      let alvo = null;
      if (info.prompt === 'guardar') alvo = tem('guardar-ok') || tem('guardar-sel');
      else if (info.prompt) alvo = tem('prompt-jogar') || tem('prompt-carta') || tem('prompt-cartola') || tem('prompt-cancelar');
      else if (info.fase === 'animando') { await p.keyboard.press('Space'); continue; }
      else if (info.fase === 'revelacao') alvo = tem('seguirrun');
      else if (tem('tapar')) alvo = tem('tapar');
      else {
        if (tem('cartola') && k % 3 === 0) alvo = tem('cartola');
        else if (tem('caderno') && k % 3 === 1) alvo = tem('caderno');
        else alvo = tem('selecionar');
      }
      if (!alvo) { await p.waitForTimeout(30); continue; }
      let sel = `[data-acao="${alvo.a}"]`; ['uid', 'valor', 'chave'].forEach(kk => { if (alvo[kk] !== undefined) sel += `[data-${kk}="${alvo[kk]}"]`; });
      await p.click(sel, { timeout: 1000 }).catch(() => {});
    }
    const novos = erros.length - antes;
    if (novos) { falhas++; console.log(`omamori ${id} (${modo}): ${novos} erros`, erros.slice(antes, antes + 2)); }
  }
  await b.close();
  console.log(falhas ? `FALHOU: ${falhas}` : `OK: ${ids.length} omamoris nos dois modos`);
  process.exit(falhas ? 1 : 0);
})();
