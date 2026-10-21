// ============================================================
// VISUAL DAS TELAS DA RUN (V4.1): ícones, trilha dos 2 atos e moldura de cada tela.
// Só desenha HTML; a lógica fica em run.js.
// ============================================================
(function () {
  const { st, esc } = UI;

  // ---------- Ícones simples (SVG desenhado à mão, herdam a cor do texto) ----------
  const ICONES = {
    combate: '<path d="M5 19L17 7M14 5.5l4.5-.5-.5 4.5M19 19L7 7M10 5.5L5.5 5 6 9.5"/>',
    sub: '<path d="M12 3l9 9-9 9-9-9z"/><path d="M12 8v5M12 16v.5"/>',
    chefao: '<path d="M3 18l2-10 4 5 3-7 3 7 4-5 2 10z"/>',
    loja: '<path d="M5 8h14l-1.5 11h-11z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    omamori: '<path d="M12 3l7 6-7 12L5 9z"/><path d="M5 9h14M9 9l3 12 3-12M12 3L9 9M12 3l3 6"/>',
    recompensa: '<path d="M12 3l2.8 6 6.2.7-4.7 4.3 1.4 6.5L12 17.2 6.3 20.5l1.4-6.5L3 9.7 9.2 9z"/>',
    recsub: '<path d="M12 3l2.8 6 6.2.7-4.7 4.3 1.4 6.5L12 17.2 6.3 20.5l1.4-6.5L3 9.7 9.2 9z"/>',
    oficina: '<path d="M14 4l6 6-3 3-6-6zM11 7L4 14v4h4l7-7"/><path d="M4 21h16"/>',
    espolio: '<path d="M12 3l2.8 6 6.2.7-4.7 4.3 1.4 6.5L12 17.2 6.3 20.5l1.4-6.5L3 9.7 9.2 9z"/>',
    mesa: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="12" cy="12" r="1.2"/>'
  };
  function icone(tipo, tam) {
    const t = tam || 22;
    return `<svg class="ico" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[tipo] || ''}</svg>`;
  }

  // ---------- Trilha: os 10 combates em 2 atos ----------
  function trilhaHtml(compacta) {
    const r = st.run;
    if (!r || r.fim) return '';
    const nos = Run.trilha(r);
    const rotulo = n => (n.tipo === 'chefao' ? 'Chefão' : n.tipo === 'sub' ? 'Sub-chefe' : 'Combate ' + n.n);
    const grupos = [1, 2].map(ato => {
      const itens = nos.filter(n => n.ato === ato).map((n, i) => {
        const marca = n.estado === 'feito' ? `<i class="vis ${n.resultado === 'derrota' ? 'derrota' : ''}" aria-hidden="true">${n.resultado === 'derrota' ? '✕' : n.resultado === 'empate' ? '=' : '✓'}</i>` : '';
        const cls = `no t-${n.tipo} ${n.estado} ${n.resultado ? 'r-' + n.resultado : ''}`;
        return `${i ? `<li class="elo ${nos[n.n - 2] && nos[n.n - 2].estado === 'feito' ? 'feito' : ''}" aria-hidden="true"></li>` : ''}<li class="${cls}" ${n.estado === 'atual' ? 'aria-current="step"' : ''}>
          <span class="bola">${icone(n.tipo === 'comum' ? 'combate' : n.tipo, compacta ? 14 : 20)}${marca}</span>${compacta ? '' : `<span class="rot">${rotulo(n)}</span>`}</li>`;
      }).join('');
      return `<div class="ato"><span class="ato-t">Ato ${ato}</span><ol>${itens}</ol></div>`;
    }).join('<span class="ato-sep" aria-hidden="true"></span>');
    if (compacta) {
      return `<nav class="trilha compacta" data-tip="ui:trilha" aria-label="Trilha da run"><div class="trilha-in">${grupos}</div>
        <span class="trilha-info"><span data-tip="ui:vidaRun" tabindex="0">♥ ${Math.max(0, r.vida)}/${r.vidaMax}</span><span data-tip="ui:moedas" tabindex="0" class="moeda-n">● ${r.moedas}</span>${r.modo === 'aberta' ? '<span class="modo-tag" data-tip="regra:maoAberta" tabindex="0">Mão aberta</span>' : ''}</span></nav>`;
    }
    const ativa = r.fila && r.fila.length;
    let texto;
    if (ativa) {
      const total = r.filaTotal && r.filaTotal.length >= r.fila.length ? r.filaTotal.length : r.fila.length, falta = r.fila.length;
      texto = falta === 1 ? `Último passo antes do combate ${r.etapa + 1}.` : `Passo ${total - falta + 1} de ${total} antes do próximo combate.`;
    } else texto = `Próximo: combate ${r.etapa}.`;
    return `<nav class="trilha" data-tip="ui:trilha" aria-label="Trilha da run"><div class="trilha-in">${grupos}</div>
      <p class="trilha-texto"><span>${texto}</span><span class="info">Vida da run ${Math.max(0, r.vida)}/${r.vidaMax} · Moedas ${r.moedas} · Deck ${r.deck.length}${r.modo === 'aberta' ? ' · Mão aberta (teste)' : ''}</span></p></nav>`;
  }

  // Moldura comum das telas da run: faixa colorida com ícone, título, explicação e, à direita, as ações
  function eventoHtml(tipo, titulo, sub, corpo, dica, acoes) {
    return `${trilhaHtml()}<div class="evento ev-${tipo}"><header class="ev-cab"><span class="ev-icone">${icone(tipo, 28)}</span>
      <div class="ev-tit"><h2 ${dica ? `data-tip="${dica}" tabindex="0"` : ''}>${titulo}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${acoes ? `<div class="ev-acoes">${acoes}</div>` : ''}</header><div class="ev-corpo">${corpo}</div></div>`;
  }

  // Ícone grande de omamori, usado nas telas de escolha
  function omamoriGrande(id) { return UI.omamoriHtml(id, 'grande', 76); }

  Object.assign(UI, { icone, trilhaHtml, trilhaCompacta: () => trilhaHtml(true), eventoHtml, omamoriGrande });
})();
