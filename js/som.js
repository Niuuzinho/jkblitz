// ============================================================
// SONS SINTETIZADOS (sem arquivos de áudio)
// Tudo é gerado pelo navegador com WebAudio. Só toca depois de o jogador
// interagir com a página (regra dos navegadores). Tem botão de mudo.
// ============================================================
const Som = (function () {
  let ctx = null, ligado = true;

  function garantir() {
    if (ctx === false) return null;
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = false; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Um tom simples. freq em Hz, dur em segundos, atraso em segundos, slide = frequência final
  function tom(c, freq, dur, tipo, vol, atraso, slide) {
    const t0 = c.currentTime + (atraso || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = tipo || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function ruido(c, dur, vol) {
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; g.gain.value = vol || 0.12;
    src.connect(g); g.connect(c.destination); src.start();
  }

  const EFEITOS = {
    clique:   c => tom(c, 520, 0.05, 'triangle', 0.04),
    tic:      c => tom(c, 330, 0.09, 'square', 0.035),
    revelar:  c => { tom(c, 220, 0.12, 'sawtooth', 0.04, 0, 440); },
    vitoria:  c => { tom(c, 523, 0.12, 'triangle', 0.06); tom(c, 659, 0.12, 'triangle', 0.06, 0.1); tom(c, 784, 0.2, 'triangle', 0.06, 0.2); },
    derrota:  c => { tom(c, 392, 0.14, 'triangle', 0.06); tom(c, 311, 0.14, 'triangle', 0.06, 0.12); tom(c, 233, 0.26, 'triangle', 0.06, 0.24); },
    empate:   c => { tom(c, 392, 0.12, 'sine', 0.05); tom(c, 392, 0.12, 'sine', 0.05, 0.16); },
    dano:     c => { tom(c, 180, 0.18, 'sawtooth', 0.06, 0, 70); },
    cura:     c => { tom(c, 600, 0.1, 'sine', 0.05); tom(c, 900, 0.14, 'sine', 0.05, 0.08); },
    explosao: c => { ruido(c, 0.6, 0.16); tom(c, 120, 0.5, 'sawtooth', 0.07, 0, 40); },
    blitz:    c => { tom(c, 880, 0.1, 'square', 0.05); tom(c, 1175, 0.1, 'square', 0.05, 0.1); tom(c, 1568, 0.22, 'square', 0.05, 0.2); },
    roleta:   c => tom(c, 700 + Math.random() * 300, 0.04, 'square', 0.025)
  };

  function tocar(nome) {
    if (!ligado) return;
    const c = garantir();
    if (c && EFEITOS[nome]) { try { EFEITOS[nome](c); } catch (e) { /* som é opcional */ } }
  }

  return { tocar, ligar(v) { ligado = !!v; }, estaLigado() { return ligado; } };
})();
