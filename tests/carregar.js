// Carrega os arquivos do jogo SEM navegador, num contexto isolado, e devolve a API.
// Usado por todos os testes em node.
const fs = require('fs'), vm = require('vm'), path = require('path');
const raiz = path.join(__dirname, '..');
const ARQUIVOS = ['data/config.js', 'data/cards.js', 'data/omamoris.js', 'data/enemies.js', 'data/textos.js',
  'js/efeitos.js', 'js/motor.js', 'js/ia.js', 'js/run.js'];
function carregar() {
  const memoria = {};
  const contexto = {
    console, Math, Date, JSON, Object, Array, String, Number, RegExp, Error, Set, Map,
    btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
    unescape, escape, encodeURIComponent, decodeURIComponent,
    localStorage: { getItem: k => (k in memoria ? memoria[k] : null), setItem: (k, v) => { memoria[k] = String(v); }, removeItem: k => { delete memoria[k]; } }
  };
  const existentes = ARQUIVOS.filter(f => fs.existsSync(path.join(raiz, f)));
  const codigo = existentes.map(f => fs.readFileSync(path.join(raiz, f), 'utf8')).join('\n') + `
;this.__api = { CONFIG, CARTAS, CARTAS_POR_ID, NAIPES, MODIFICADORES, OMAMORIS, OMAMORIS_POR_ID, INIMIGOS, SUBCHEFES, CHEFOES, DECKS_JOGADOR, BASE, ARQUETIPOS,
  Motor, IA, EFEITOS, OMAMORIS_EFEITOS, Run: (typeof Run !== 'undefined' ? Run : null), TEXTOS: (typeof TEXTOS !== 'undefined' ? TEXTOS : null) };`;
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  contexto.__api.memoria = memoria;
  return contexto.__api;
}
module.exports = { carregar };
