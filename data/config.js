// ============================================================
// CONFIGURAÇÃO DE BALANCEAMENTO (V4)
// Mude os números aqui para testar o jogo. Não precisa mexer na lógica.
// Nenhum número da V4 foi simulado antes de entrar aqui: todos são ponto de partida.
// ============================================================
const CONFIG = {
  // ----- Combate -----
  vida: 5,            // vida de cada jogador no combate
  mao: 3,             // cartas na mão a cada turno (o que não for jogado é descartado)
  maoMais: 4,         // tamanho da mão no turno depois de um "Mão +1" (e da Mochila)
  danoPadrao: 1,      // dano de uma vitória comum
  danoEmpate: 0,      // dano de cada lado num empate de rodada
  danoEmpateBlitz: 1, // dano de cada lado num empate DURANTE a Blitz
  rodadaBlitz: 6,     // a partir desta rodada começa a Blitz (empates passam a machucar)
  limiteRodadas: 12,  // ao fim, vence quem tiver mais vida
  deckMinimo: 6,      // o deck da run nunca fica com menos cartas que isso
  anuncioMaxMoedasNota: 3, // (referência) Nota de cem: 3 moedas por combate (5 com upgrade) estão na carta

  // ----- Run -----
  run: {
    vida: 10,              // vida da run
    atos: 2, combatesPorAto: 5,   // 2 atos de 5 combates
    subchefeNoCombate: 3,  // o 3º combate de cada ato tem sub-chefe (escolha entre 2)
    custoEmpate: 1,        // vida da run perdida num empate
    custoDerrota: 3,       // vida da run perdida numa derrota
    vidaPrimeiraPartida: 3,// vida dos dois lados no 1º combate da run (partida de aquecimento)
    rodadaBlitzPrimeiraLuta: 4,
    vidaSubchefe: 6,       // vida de cada sub-chefe (o Ganancioso tem 8)
    vidaChefao: { 1: 6, 2: 7 },
    limiteOmamoris: 5,
    deckInicial: 6,        // 2 de cada naipe
    // Dinheiro
    moedas: { vitoria: 3, empate: 2, derrota: 1, chefao: 3, pularRecompensa: 2, pularOficina: 1 },
    // Onde ficam a Loja e a Oficina (posição do combate dentro do ato)
    lojaDepoisDe: [1, 3, 5], oficinaDepoisDe: [2, 4],
    // Loja
    preco: { comum: 1, rara: 3, lendaria: 6, prismatica: 10, upgrade: 2, remover: 2, selo: 3, renovar: 1, omamori: 6 },
    // Raridade das cartas da Loja, por ato (porcentagens): só Raras ou melhores
    raridade: { 1: { comum: 0, rara: 80, lendaria: 20, prismatica: 0 }, 2: { comum: 0, rara: 60, lendaria: 32, prismatica: 8 } },
    // Raridade das cartas da Recompensa grátis (depois de todo combate; nunca Prismática)
    raridadeRecompensa: { 1: { comum: 50, rara: 45, lendaria: 5 }, 2: { comum: 35, rara: 50, lendaria: 15 } },
    deckAlvo: [14, 18],   // tamanho do deck no fim da run (só para as medições)
    pesoArquetipoAtivo: 0.5,  // chance de a Rara ou Lendária sorteada ser do arquétipo ativo
    arquetipoAtivoCartas: 3,  // cartas de um arquétipo no deck para ele ficar ativo
    // Mesa do Apostador
    mesa: { apostaMoedas: 8, rodadasParaVencer: 2 },
    // Upgrades dos decks dos inimigos: no ato 2, 2 (todos); no ato 1, só os inimigos comuns do combate 4 em diante têm 1
    upgradesInimigo: { ato1ComumDe: 4, ato1Comum: 1, ato2: 2 }
  },

  // ----- Modo de teste "Mão aberta" -----
  maoAberta: {
    leitura: 0.6   // a IA mistura 60% de leitura da mão do jogador com 40% dos pesos da personalidade
  }
};
