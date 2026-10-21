// ============================================================
// NAIPES, CARTAS, SELOS (V4)
//
// 27 cartas (3 Comuns, 12 Raras, 9 Lendárias, 3 Prismáticas), 2 Especiais (Dinamite e Curinga)
// e 6 cartas Troféu (uma por chefão).
//
// Campos de cada carta:
//   id, nome, naipe, raridade, arq (arquétipo), efeito (função em js/efeitos.js), params, texto, up
//   fragil: depois de jogada vai para as Cortadas e volta só no combate seguinte
//   nuncaDescarta: fica na mão até ser jogada (conta nas 3 cartas)
//   soBlitz: só pode ser jogada durante a Blitz (Meteoro)
//   maoAberta: versão do texto no modo de teste Mão aberta ({texto, up:{texto}, secreta}); os efeitos
//              mudam dentro de js/efeitos.js conforme o modo. secreta: a carta nasce Secreta na mão.
//   semMarca: a carta nunca pode ser Marcada (Biombo)
//
// TEXTO: cada linha começa com uma etiqueta de QUANDO o efeito vale:
//   [vencer] [perder] [empatar] [jogar] [sempre]
// A interface mostra a etiqueta como um selo colorido e tira a palavra do texto.
// Use \n para separar linhas. Comum não tem texto. O que MUDA no upgrade (+) fica entre {{chaves duplas}}.
// "Causa N de dano" quer dizer dano TOTAL de N (o dano base da vitória, 1, já está contado).
// ============================================================

const NAIPES = {
  pedra:   { nome: 'Pedra',    vence: 'tesoura', forma: 'circulo',   cor: '#8c7663', simbolo: '●' },
  papel:   { nome: 'Papel',    vence: 'pedra',   forma: 'quadrado',  cor: '#3d8fd6', simbolo: '■' },
  tesoura: { nome: 'Tesoura',  vence: 'papel',   forma: 'triangulo', cor: '#e05a2b', simbolo: '▲' },
  nenhum:  { nome: 'Dinamite', vence: null,      forma: 'losango',   cor: '#d9a21c', simbolo: '◆' },
  curinga: { nome: 'Curinga',  vence: null,      forma: 'curinga',   cor: '#9b6bd8', simbolo: '?' }   // muda de naipe a cada rodada na mão
};
const BASE = ['pedra', 'papel', 'tesoura'];

// Quando uma etiqueta [x] aparece no texto, este é o rótulo mostrado
const ETIQUETAS = { vencer: 'Vencer', perder: 'Perder', empatar: 'Empatar', jogar: 'Jogar', sempre: 'Sempre' };

const ARQUETIPOS = ['Investida', 'Muralha', 'Arquivo', 'Leitura'];
const RARIDADES = ['comum', 'rara', 'lendaria', 'prismatica', 'especial', 'trofeu'];
const NOME_RARIDADE = { comum: 'Comum', rara: 'Rara', lendaria: 'Lendária', prismatica: 'Prismática', especial: 'Especial', trofeu: 'Troféu' };

const CARTAS = [
  // ======================= COMUNS (vanilla) =======================
  { id: 'pedra', nome: 'Pedra', naipe: 'pedra', raridade: 'comum',
    up: { efeito: 'bonus', params: { bonusDano: 1 }, texto: '[vencer] {{+1 de dano.}}' } },
  { id: 'papel', nome: 'Papel', naipe: 'papel', raridade: 'comum',
    up: { efeito: 'bonus', params: { bonusDano: 1 }, texto: '[vencer] {{+1 de dano.}}' } },
  { id: 'tesoura', nome: 'Tesoura', naipe: 'tesoura', raridade: 'comum',
    up: { efeito: 'bonus', params: { bonusDano: 1 }, texto: '[vencer] {{+1 de dano.}}' } },

  // ======================= RARAS (12) =======================
  // --- Investida ---
  { id: 'pedrada', nome: 'Pedrada', naipe: 'pedra', raridade: 'rara', arq: 'Investida', efeito: 'pedrada', params: { dano: 2 },
    texto: '[vencer] Causa 2 de dano.\n[empatar] O oponente sofre 1.',
    up: { params: { dano: 3 }, texto: '[vencer] Causa {{3}} de dano.\n[empatar] O oponente sofre 1.' } },
  { id: 'multa', nome: 'Multa', naipe: 'papel', raridade: 'rara', arq: 'Investida', efeito: 'multa', params: { agora: 1, ticks: 2 },
    texto: '[vencer] Causa 1 de dano agora e mais 1 no fim de cada uma das 2 próximas rodadas.',
    up: { params: { agora: 2, ticks: 2 }, texto: '[vencer] Causa {{2}} de dano agora e mais 1 no fim de cada uma das 2 próximas rodadas.' } },
  { id: 'estilete', nome: 'Estilete', naipe: 'tesoura', raridade: 'rara', arq: 'Investida', efeito: 'estilete', params: { dano: 2, primeira: 3 },
    texto: '[vencer] Causa 2 de dano, ou 3 se for a primeira carta que você joga no combate.',
    up: { params: { dano: 3, primeira: 4 }, texto: '[vencer] Causa {{3}} de dano, ou {{4}} se for a primeira carta que você joga no combate.' } },
  // --- Muralha ---
  { id: 'seixo', nome: 'Seixo', naipe: 'pedra', raridade: 'rara', arq: 'Muralha', efeito: 'seixo', params: { cura: 0 },
    texto: '[empatar] Ganha o empate.',
    up: { params: { cura: 1 }, texto: '[empatar] Ganha o empate{{ e cura 1}}.' } },
  { id: 'papelao', nome: 'Papelão', naipe: 'papel', raridade: 'rara', arq: 'Muralha', efeito: 'papelao', params: { guarda: 0 },
    texto: '[perder] Você não sofre dano.',
    up: { params: { guarda: 1 }, texto: '[perder] Você não sofre dano{{ e guarda 1 carta da mão}}.' } },
  { id: 'bainha', nome: 'Bainha', naipe: 'tesoura', raridade: 'rara', arq: 'Muralha', efeito: 'bainha', params: { semDano: false },
    texto: '[empatar] Fica na mão.',
    up: { params: { semDano: true }, texto: '[empatar] Fica na mão.{{ Na Blitz, esse empate não te dá dano.}}' } },
  // --- Arquivo ---
  { id: 'cascalho', nome: 'Cascalho', naipe: 'pedra', raridade: 'rara', arq: 'Arquivo', efeito: 'cascalho', params: { maisUm: false },
    texto: '[perder] Guarda as outras cartas da mão.',
    up: { params: { maisUm: true }, texto: '[perder] Guarda as outras cartas da mão.{{ Mão +1.}}' }, escolhe: null },
  { id: 'rascunho', nome: 'Rascunho', naipe: 'papel', raridade: 'rara', arq: 'Arquivo', efeito: 'rascunho', params: { n: 1 },
    texto: '[jogar] No próximo turno, uma das cartas que você compra é do naipe que você escolher (se houver no deck).',
    up: { params: { n: 2 }, texto: '[jogar] No próximo turno, {{duas}} das cartas que você compra são do naipe que você escolher (se houver no deck).' }, escolhe: 'naipe' },
  { id: 'recorte', nome: 'Recorte', naipe: 'tesoura', raridade: 'rara', arq: 'Arquivo', efeito: 'recorte', params: { marca: true },
    maoAberta: { texto: '[vencer] Guarda 1 carta da mão.', up: { texto: '[vencer] Guarda 1 carta da mão{{, que fica Secreta}}.' } },
    texto: '[vencer] Guarda 1 carta da mão, que fica Marcada.',
    up: { params: { marca: false }, texto: '[vencer] Guarda 1 carta da mão{{, sem ficar Marcada}}.' } },
  // --- Leitura ---
  { id: 'cristal', nome: 'Cristal', naipe: 'pedra', raridade: 'rara', arq: 'Leitura', efeito: 'cristal', params: { n: 1 },
    maoAberta: { texto: '[jogar] Revela 1 carta Secreta do oponente. Se ele não tiver nenhuma, revela a carta do topo do deck dele.', up: { texto: '[jogar] Revela {{2 cartas}} Secretas do oponente. Se faltarem, revela as do topo do deck dele.' } },
    texto: '[jogar] Marca a carta do topo do deck do oponente.',
    up: { params: { n: 2 }, texto: '[jogar] Marca {{as 2 cartas}} do topo do deck do oponente.' } },
  { id: 'bilhete', nome: 'Bilhete', naipe: 'papel', raridade: 'rara', arq: 'Leitura', efeito: 'bilhete', params: { aoJogar: false },
    maoAberta: { texto: '[vencer] No próximo turno, 1 carta sua à escolha fica Secreta.', up: { texto: '[jogar] No próximo turno, 1 carta sua à escolha fica Secreta.' } },
    texto: '[vencer] No próximo turno, 1 carta aleatória da mão do oponente fica Marcada.',
    up: { params: { aoJogar: true }, texto: '[jogar] No próximo turno, 1 carta aleatória da mão do oponente fica Marcada.' } },
  { id: 'abridor', nome: 'Abridor de cartas', naipe: 'tesoura', raridade: 'rara', arq: 'Leitura', efeito: 'abridor', params: { dano: 3 },
    maoAberta: { secreta: true, texto: '[sempre] Nasce Secreto: nunca aparece para o oponente na mão.\n[vencer] Causa 3 de dano.', up: { texto: '[sempre] Nasce Secreto: nunca aparece para o oponente na mão.\n[vencer] Causa {{4}} de dano.' } },
    texto: '[vencer] Contra carta Marcada: causa 3 de dano.',
    up: { params: { dano: 4 }, texto: '[vencer] Contra carta Marcada: causa {{4}} de dano.' } },

  // ======================= LENDÁRIAS (9) =======================
  { id: 'monolito', nome: 'Monólito', naipe: 'pedra', raridade: 'lendaria', arq: 'Muralha', efeito: 'monolito', params: { cura: 0 },
    texto: '[empatar] Ganha todos os empates. Quando ganha um, fica na mão.',
    up: { params: { cura: 1 }, texto: '[empatar] Ganha todos os empates. Quando ganha um, fica na mão{{ e cura 1}}.' } },
  { id: 'fossil', nome: 'Fóssil', naipe: 'pedra', raridade: 'lendaria', arq: 'Investida', efeito: 'fossil', params: { min: 1, max: 4 },
    texto: '[vencer] Causa 1 de dano por pedra no seu cemitério (mínimo 1, máximo 4).',
    up: { params: { min: 2, max: 4 }, texto: '[vencer] Causa 1 de dano por pedra no seu cemitério (mínimo {{2}}, máximo 4).' } },
  { id: 'geodo', nome: 'Geodo', naipe: 'pedra', raridade: 'lendaria', arq: 'Arquivo', nuncaDescarta: true, efeito: 'geodo', params: { max: 4 },
    texto: '[vencer] Causa 1 de dano por turno que passou na sua mão (mínimo 1, máximo 4).',
    up: { params: { max: 5 }, texto: '[vencer] Causa 1 de dano por turno que passou na sua mão (mínimo 1, máximo {{5}}).' } },
  { id: 'testamento', nome: 'Testamento', naipe: 'papel', raridade: 'lendaria', arq: 'Arquivo', efeito: 'testamento', params: { cortadas: false },
    texto: '[jogar] Escolha uma carta do seu cemitério. A próxima carta que você jogar ganha o efeito dela, somado ao próprio.',
    up: { params: { cortadas: true }, texto: '[jogar] Escolha uma carta do seu cemitério{{ ou das Cortadas}}. A próxima carta que você jogar ganha o efeito dela, somado ao próprio.' }, escolhe: 'carta' },
  { id: 'mapa', nome: 'Mapa', naipe: 'papel', raridade: 'lendaria', arq: 'Leitura', efeito: 'mapa', params: {},
    maoAberta: { texto: '[jogar] No próximo turno, todas as suas cartas ficam Secretas.', up: { texto: '[jogar] No próximo turno, todas as suas cartas ficam Secretas.\n[vencer] {{+1 de dano.}}' } },
    texto: '[jogar] No próximo turno, todas as cartas da mão do oponente ficam Marcadas.',
    up: { params: { bonusDano: 1 }, texto: '[jogar] No próximo turno, todas as cartas da mão do oponente ficam Marcadas.\n[vencer] {{+1 de dano.}}' } },
  { id: 'nota', nome: 'Nota de cem', naipe: 'papel', raridade: 'lendaria', efeito: 'nota', params: { max: 3 },
    texto: '[vencer] Ganha 1 moeda (até 3 por combate).',
    up: { params: { max: 5 }, texto: '[vencer] Ganha 1 moeda (até {{5}} por combate).' } },
  { id: 'guilhotina', nome: 'Guilhotina', naipe: 'tesoura', raridade: 'lendaria', arq: 'Investida', fragil: true, efeito: 'causa', params: { dano: 4 },
    texto: '[vencer] Causa 4 de dano.',
    up: { params: { dano: 5 }, texto: '[vencer] Causa {{5}} de dano.' } },
  { id: 'bisturi', nome: 'Bisturi', naipe: 'tesoura', raridade: 'lendaria', arq: 'Leitura', efeito: 'bisturi', params: { dano: 3 },
    maoAberta: { secreta: true, texto: '[sempre] Nasce Secreto: nunca aparece para o oponente na mão.\n[vencer] Causa 3 de dano, e a carta do oponente é Cortada.', up: { texto: '[sempre] Nasce Secreto: nunca aparece para o oponente na mão.\n[vencer] Causa {{4}} de dano, e a carta do oponente é Cortada.' } },
    texto: '[vencer] Contra carta Marcada: causa 3 de dano, e a carta do oponente é Cortada.',
    up: { params: { dano: 4 }, texto: '[vencer] Contra carta Marcada: causa {{4}} de dano, e a carta do oponente é Cortada.' } },
  { id: 'cutelo', nome: 'Cutelo', naipe: 'tesoura', raridade: 'lendaria', arq: 'Investida', efeito: 'cutelo', params: { semDano: false },
    texto: '[vencer] Na Blitz, causa o dobro do dano.',
    up: { params: { semDano: true }, texto: '[vencer] Na Blitz, causa o dobro do dano.\n[empatar] {{Na Blitz, este empate não te dá dano.}}' } },

  // ======================= PRISMÁTICAS (3) =======================
  { id: 'meteoro', nome: 'Meteoro', naipe: 'pedra', raridade: 'prismatica', fragil: true, nuncaDescarta: true, soBlitz: true, efeito: 'meteoro', params: { dano: 3, auto: 1 },
    texto: '[sempre] Só pode ser jogado na Blitz. Causa 3 de dano ao oponente, seja qual for o resultado, e você sofre 1.',
    up: { params: { dano: 3, auto: 0 }, texto: '[sempre] Só pode ser jogado na Blitz. Causa 3 de dano ao oponente, seja qual for o resultado, e você {{não sofre dano}}.' } },
  { id: 'origami', nome: 'Origami', naipe: 'papel', raridade: 'prismatica', fragil: true, efeito: 'origami', params: {},
    texto: '[jogar] Copia o efeito da última carta que você jogou neste combate, inclusive o de Lendárias.',
    up: { params: { bonusDano: 1 }, texto: '[jogar] Copia o efeito da última carta que você jogou neste combate, inclusive o de Lendárias.\n[vencer] {{+1 de dano.}}' } },
  { id: 'excalisoura', nome: 'Excalisoura', naipe: 'tesoura', raridade: 'prismatica', efeito: 'excalisoura', params: { inicio: 1 },
    texto: '[vencer] Fica na mão; cada vitória seguida dela causa 1 a mais (1, 2, 3...).\n[perder] É Cortada.\n[empatar] É Cortada.',
    up: { params: { inicio: 2 }, texto: '[vencer] Fica na mão; cada vitória seguida dela causa 1 a mais ({{2, 3, 4}}...).\n[perder] É Cortada.\n[empatar] É Cortada.' } },

  // ======================= ESPECIAIS (2): só saem na Mesa do Apostador =======================
  { id: 'dinamite', nome: 'Dinamite', naipe: 'nenhum', raridade: 'especial', fragil: true, efeito: 'dinamite', params: { dano: 2, dupla: 2 },
    texto: '[sempre] Vence qualquer naipe e causa 2 de dano. Dinamite contra Dinamite: os dois sofrem 2.',
    up: { params: { dano: 3, dupla: 2 }, texto: '[sempre] Vence qualquer naipe e causa {{3}} de dano. Dinamite contra Dinamite: os dois sofrem 2.' } },
  { id: 'curinga', nome: 'Curinga', naipe: 'curinga', raridade: 'especial', nuncaDescarta: true, efeito: 'curinga', params: {},
    texto: '[sempre] Na mão, muda de naipe no início de cada rodada (pedra, papel, tesoura).',
    up: { params: { bonusDano: 1 }, texto: '[sempre] Na mão, muda de naipe no início de cada rodada (pedra, papel, tesoura).\n[vencer] {{+1 de dano.}}' } },

  // ======================= TROFÉUS (6): uma por chefão, só saem no espólio =======================
  { id: 'pedraangular', nome: 'Pedra Angular', naipe: 'pedra', raridade: 'trofeu', arq: 'Muralha', efeito: 'pedraangular', params: { dano: 2 },
    texto: '[empatar] Ganha o empate.\n[vencer] Na Blitz, causa 2 de dano.',
    up: { params: { dano: 3 }, texto: '[empatar] Ganha o empate.\n[vencer] Na Blitz, causa {{3}} de dano.' } },
  { id: 'fichario', nome: 'Fichário', naipe: 'papel', raridade: 'trofeu', arq: 'Arquivo', efeito: 'fichario', params: { dano: 2 },
    texto: '[jogar] Guarda as outras cartas da mão.\n[vencer] Causa 2 de dano.',
    up: { params: { dano: 3 }, texto: '[jogar] Guarda as outras cartas da mão.\n[vencer] Causa {{3}} de dano.' } },
  { id: 'florete', nome: 'Florete', naipe: 'tesoura', raridade: 'trofeu', arq: 'Investida', efeito: 'florete', params: { dano: 2, max: 2 },
    texto: '[vencer] Causa 2 de dano e fica na mão (no máximo 2 vezes por combate).',
    up: { params: { dano: 3, max: 2 }, texto: '[vencer] Causa {{3}} de dano e fica na mão (no máximo 2 vezes por combate).' } },
  { id: 'biombo', nome: 'Biombo', naipe: 'papel', raridade: 'trofeu', arq: 'Leitura', efeito: 'causa', params: { dano: 2 }, semMarca: true,
    maoAberta: { secreta: true, texto: '[sempre] Sempre Secreto.\n[vencer] Causa 2 de dano.', up: { texto: '[sempre] Sempre Secreto.\n[vencer] Causa {{3}} de dano.' } },
    texto: '[sempre] Nunca é Marcado.\n[vencer] Causa 2 de dano.',
    up: { params: { dano: 3 }, texto: '[sempre] Nunca é Marcado.\n[vencer] Causa {{3}} de dano.' } },
  { id: 'asnamanga', nome: 'Ás na Manga', naipe: 'papel', raridade: 'trofeu', nuncaDescarta: true, efeito: 'causa', params: { dano: 2 },
    texto: '[vencer] Causa 2 de dano.',
    up: { params: { dano: 3 }, texto: '[vencer] Causa {{3}} de dano.' } },
  { id: 'ponteiro', nome: 'Ponteiro', naipe: 'tesoura', raridade: 'trofeu', arq: 'Investida', efeito: 'ponteiro', params: { dano: 3 },
    texto: '[vencer] Na Blitz, causa 3 de dano.',
    up: { params: { dano: 4 }, texto: '[vencer] Na Blitz, causa {{4}} de dano.' } }
];

const CARTAS_POR_ID = {};
CARTAS.forEach(c => { CARTAS_POR_ID[c.id] = c; });

// Cartas que cada raridade pode oferecer na Loja (sem Especiais nem Troféus)
const CARTAS_LOJA = CARTAS.filter(c => ['comum', 'rara', 'lendaria', 'prismatica'].indexOf(c.raridade) >= 0);

// Etiquetas que aparecem no texto, na ordem (para a carta ampliada)
function quandoDeTexto(texto) {
  const r = []; String(texto || '').split('\n').forEach(l => { const m = /^\[(\w+)\]/.exec(l); if (m) r.push(m[1]); });
  return r;
}
// Vanilla: carta Comum sem upgrade (sem efeito)
const ehVanilla = def => def.raridade === 'comum';

// ---------- Selos (5): comprados na Loja, um por carta ----------
const MODIFICADORES = {
  pesada:   { nome: 'Pesada', arq: 'Investida', texto: 'Vencer: +1 de dano.' },
  blindada: { nome: 'Blindada', arq: 'Muralha', texto: 'Não pode ser Marcada nem Cortada. Perder com ela: você sofre 1 a menos.',
    maoAberta: { texto: 'Não pode ser revelada nem Cortada. Perder com ela: você sofre 1 a menos.' } },
  guardada: { nome: 'Guardada', arq: 'Arquivo', texto: 'Se não for jogada, fica na mão em vez de ser descartada (e conta nas 3).' },
  delatora: { nome: 'Delatora', arq: 'Leitura', texto: 'Quando é descartada sem ser jogada, a carta do topo do deck do oponente fica Marcada.',
    maoAberta: { nome: 'Sigilosa', texto: 'A carta é sempre Secreta na mão.' } },
  namanga:  { nome: 'Na manga', arq: null, texto: 'Começa sempre na mão do primeiro turno do combate.' }
};

// Nome e texto de um selo no modo atual (a Delatora vira Sigilosa na Mão aberta)
const seloNome = k => (Motor.modo() === 'aberta' && MODIFICADORES[k].maoAberta && MODIFICADORES[k].maoAberta.nome) || MODIFICADORES[k].nome;
const seloTexto = k => (Motor.modo() === 'aberta' && MODIFICADORES[k].maoAberta && MODIFICADORES[k].maoAberta.texto) || MODIFICADORES[k].texto;

// ---------- Decks de teste (combate rápido e testes automáticos) ----------
const D = (...ids) => ids.map(id => ({ id }));
const DECKS_JOGADOR = {
  basico: { nome: 'Básico (6 vanillas)', cartas: D('pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura') },
  investida: { nome: 'Investida (12 cartas)', cartas: D('pedra', 'papel', 'tesoura', 'pedrada', 'multa', 'estilete', 'estilete', 'fossil', 'guilhotina', 'cutelo', 'pedrada', 'multa') },
  muralha: { nome: 'Muralha (12 cartas)', cartas: D('pedra', 'papel', 'tesoura', 'seixo', 'papelao', 'bainha', 'seixo', 'monolito', 'papelao', 'bainha', 'pedra', 'papel') },
  arquivo: { nome: 'Arquivo (12 cartas)', cartas: D('pedra', 'papel', 'tesoura', 'cascalho', 'rascunho', 'recorte', 'geodo', 'testamento', 'cascalho', 'rascunho', 'recorte', 'tesoura') },
  leitura: { nome: 'Leitura (12 cartas)', cartas: D('pedra', 'papel', 'tesoura', 'cristal', 'bilhete', 'abridor', 'mapa', 'bisturi', 'cristal', 'bilhete', 'abridor', 'tesoura') }
};
