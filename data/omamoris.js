// ============================================================
// OMAMORIS (antes chamados de relíquias): itens passivos que valem pela run inteira.
// 16 comuns (4 básicos, 4 de arquétipo, 8 neutros) e 6 dos chefões (V4.1: novos). Máximo de 5 por run, sem repetir.
// categoria: 'basico' | 'arquetipo' | 'neutro' | 'chefao'
// Os efeitos ficam em js/efeitos.js (OMAMORIS_EFEITOS), com o mesmo id.
// ============================================================
const OMAMORIS = [
  // --- Básicos (4): a escolha inicial vem daqui ---
  { id: 'rochamae', nome: 'Rocha-Mãe', categoria: 'basico', texto: 'A primeira vez em cada combate que você vencer com pedra, cura 1.' },
  { id: 'grampeador', nome: 'Grampeador', categoria: 'basico', texto: 'A primeira vez em cada combate que você vencer com papel, Mão +1 no próximo turno.' },
  { id: 'amolar', nome: 'Pedra de Amolar', categoria: 'basico', texto: 'A primeira tesoura que vencer em cada combate causa +1 de dano.' },
  { id: 'lente', nome: 'Lente', categoria: 'basico', texto: 'No início de cada combate, 1 carta aleatória da mão do oponente fica Marcada.',
    maoAberta: 'No início de cada combate, 1 carta sua fica Secreta.' },
  // --- De arquétipo (4): só aparecem com o arquétipo ativo ---
  { id: 'navalha', nome: 'Fio de Navalha', categoria: 'arquetipo', arq: 'Investida', texto: 'Vencer causando 3 ou mais de dano: cura 1.' },
  { id: 'alicerce', nome: 'Alicerce', categoria: 'arquetipo', arq: 'Muralha', texto: 'A primeira derrota sua em cada combate não causa dano.' },
  { id: 'caderno', nome: 'Caderno', categoria: 'arquetipo', arq: 'Arquivo', texto: 'Uma vez por combate, guarde 1 carta da mão.' },
  { id: 'lupa', nome: 'Lupa', categoria: 'arquetipo', arq: 'Leitura', texto: 'Vencer contra uma carta Marcada: cura 1.',
    maoAberta: 'Vencer com uma carta Secreta: cura 1.' },
  // --- Neutros (8) ---
  { id: 'cofre', nome: 'Cofre', categoria: 'neutro', texto: '+1 moeda depois de cada combate.' },
  { id: 'cupom', nome: 'Cupom', categoria: 'neutro', texto: 'Tudo na Loja custa 1 a menos (mínimo 1).' },
  { id: 'seguro', nome: 'Seguro', categoria: 'neutro', texto: 'A próxima derrota da run custa 1 de vida da run em vez de 3 (uma vez).' },
  { id: 'relogio', nome: 'Relógio Quebrado', categoria: 'neutro', texto: 'O primeiro empate na Blitz de cada combate não causa dano a você.' },
  { id: 'estopim', nome: 'Estopim', categoria: 'neutro', texto: 'Quando a Blitz começa, você cura 1.' },
  { id: 'fusivel', nome: 'Fusível', categoria: 'neutro', texto: 'Quando a Blitz começa, o oponente sofre 1.' },
  { id: 'coroa', nome: 'Coroa de Papel', categoria: 'neutro', texto: 'Na primeira rodada de cada combate, você vence empates.' },
  { id: 'mochila', nome: 'Mochila', categoria: 'neutro', minAto: 2, texto: 'Sua mão passa a ter 4 cartas. Só aparece a partir do ato 2.' },
  // --- Dos chefões (6): um por chefão; o do ato é garantido no espólio ---
  { id: 'fundacao', nome: 'Fundação', categoria: 'chefao', texto: 'Sua vida máxima no combate é 6 em vez de 5.' },
  { id: 'pasta', nome: 'Pasta', categoria: 'chefao', texto: 'Sua primeira mão de cada combate tem 4 cartas.' },
  { id: 'luva', nome: 'Luva de Duelo', categoria: 'chefao', texto: 'Sua primeira vitória em cada combate causa +1.' },
  { id: 'veu', nome: 'Véu', categoria: 'chefao', texto: 'Suas cartas não podem ser Marcadas.',
    maoAberta: 'No início de cada turno, 1 carta aleatória sua fica Secreta.' },
  { id: 'cartola', nome: 'Cartola', categoria: 'chefao', texto: 'Uma vez por combate, troque 1 carta da mão pela do topo do deck.' },
  { id: 'relogiobolso', nome: 'Relógio de Bolso', categoria: 'chefao', texto: 'Na Blitz, você vence empates.' }
];
// Texto de um omamori no modo atual (alguns têm outra versão na Mão aberta)
function textoOmamori(o) { return (Motor.modo() === 'aberta' && o.maoAberta) || o.texto; }
const OMAMORIS_POR_ID = {};
OMAMORIS.forEach(o => { OMAMORIS_POR_ID[o.id] = o; });
