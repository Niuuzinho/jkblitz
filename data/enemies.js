// ============================================================
// INIMIGOS (V4.1): comuns, sub-chefes e chefões. Todo inimigo joga com um ARQUÉTIPO:
// tem um deck montado em volta dele e um estilo que a IA segue (ver js/ia.js).
// Os decks são montados em js/run.js (montarDeckInimigo) a partir do ato e do combate.
// Arquétipos dos inimigos: Investida, Muralha, Arquivo, Leitura, Blitz e Blefe (só o Trapaceiro).
// ============================================================

// ---------- Inimigos comuns ----------
// deck: cartas no ato 1. ato2: cartas que entram no ato 2 (junto com 2 upgrades).
// tendencia: o que a tela mostra antes da luta. estilo: como a IA joga (texto mostrado antes da luta).
// Todos aparecem nos dois atos.
const INIMIGOS = {
  rochedo:   { id: 'rochedo', nome: 'O Rochedo', arq: 'Muralha', tendencia: 'Gosta de pedra', estilo: 'Joga pedra 55% das vezes e usa o Seixo quando espera um empate.',
    ia: { arq: 'Muralha', padrao: 'rochedo', pedra: 0.55 }, deck: ['pedra', 'pedra', 'pedra', 'pedra', 'papel', 'tesoura', 'seixo', 'papelao'], ato2: ['monolito', 'bainha'] },
  copiadora: { id: 'copiadora', nome: 'A Copiadora', arq: 'Arquivo', tendencia: 'Imita você', estilo: '50% de chance de repetir o naipe que você jogou na rodada anterior, e usa o Rascunho para pedir esse naipe.',
    ia: { arq: 'Arquivo', padrao: 'copiadora', repete: 0.5 }, deck: ['pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura', 'rascunho', 'cascalho'], ato2: ['recorte', 'geodo'] },
  vingativo: { id: 'vingativo', nome: 'O Vingativo', arq: 'Investida', tendencia: 'Não esquece uma derrota', estilo: 'Depois de perder, 70% de chance de jogar o naipe que venceria a sua última carta, com a carta de mais dano.',
    ia: { arq: 'Investida', padrao: 'vingativo', vinganca: 0.7 }, deck: ['tesoura', 'tesoura', 'pedra', 'papel', 'estilete', 'pedrada', 'multa'], ato2: ['guilhotina', 'fossil'] },
  docontra:  { id: 'docontra', nome: 'O Do Contra', arq: 'Blitz', tendencia: 'Nunca repete', estilo: 'Nunca joga o mesmo naipe duas rodadas seguidas; guarda a Bainha para a Blitz.',
    ia: { arq: 'Blitz', padrao: 'docontra' }, deck: ['pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura', 'bainha', 'seixo'], ato2: ['cutelo', 'pedrada'] },
  leitora:   { id: 'leitora', nome: 'A Leitora', arq: 'Leitura', tendencia: 'Confia nas odds', estilo: '60% de chance de jogar o naipe que vence o seu mais provável; marca antes de atacar.',
    ia: { arq: 'Leitura', padrao: 'leitora', le: 0.6 }, deck: ['pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura', 'cristal', 'bilhete', 'abridor'], ato2: ['mapa', 'bisturi'] }
};

// ---------- Sub-chefes ----------
// Escolha 1 entre 2 sorteados no 3º combate de cada ato. Vida 6, uma regra e uma recompensa.
// deck: as 4 cartas de efeito (os 4 vanillas são acrescentados em js/run.js, puxando para o naipe delas).
// regraAberta: texto da regra no modo Mão aberta, quando muda.
const SUBCHEFES = {
  quebradico:   { id: 'quebradico', nome: 'O Quebradiço', arq: 'Investida', regra: '2 cartas aleatórias suas ficam Frágeis neste combate.', recompensa: '1 Lendária à escolha entre 2', rec: 'lendaria2',
    deck: ['guilhotina', 'estilete', 'estilete', 'pedrada'] },
  espiao:       { id: 'espiao', nome: 'O Espião', arq: 'Leitura', regra: 'A cada 2 rodadas, 1 carta da sua mão fica Marcada.', regraAberta: 'Suas cartas nunca ficam Secretas neste combate.', recompensa: '1 omamori à escolha entre 2', rec: 'omamori2',
    deck: ['cristal', 'bilhete', 'abridor', 'bisturi'] },
  ganancioso:   { id: 'ganancioso', nome: 'O Ganancioso', arq: 'Arquivo', regra: 'Tem 8 de vida em vez de 6.', recompensa: '6 moedas', rec: 'moedas6',
    deck: ['nota', 'cascalho', 'rascunho', 'geodo'] },
  teimoso:      { id: 'teimoso', nome: 'O Teimoso', arq: 'Muralha', regra: 'Vence todos os empates.', recompensa: '1 omamori à escolha entre 2', rec: 'omamori2',
    deck: ['seixo', 'seixo', 'monolito', 'papelao'] },
  apressado:    { id: 'apressado', nome: 'O Apressado', arq: 'Blitz', regra: 'A Blitz começa na rodada 3 neste combate.', recompensa: '2 upgrades grátis', rec: 'upgrades2',
    deck: ['cutelo', 'bainha', 'pedrada', 'estilete'] },
  ladra:        { id: 'ladra', nome: 'A Ladra', arq: 'Investida', regra: 'Cada vez que ela vence uma rodada, você perde 1 moeda.', recompensa: 'Devolve o que roubou, mais 5 moedas', rec: 'ladra',
    deck: ['multa', 'estilete', 'recorte', 'nota'] },
  embaralhador: { id: 'embaralhador', nome: 'O Embaralhador', arq: 'Arquivo', regra: 'Sua mão é de 2 cartas neste combate.', recompensa: '1 Lendária à escolha entre 2', rec: 'lendaria2',
    deck: ['rascunho', 'cascalho', 'testamento', 'recorte'] },
  gemeo:        { id: 'gemeo', nome: 'O Gêmeo', arq: null, regra: 'Joga com uma cópia do seu deck e com o seu arquétipo ativo.', recompensa: '1 upgrade grátis e 3 moedas', rec: 'gemeo',
    deck: null }
};

// ---------- Chefões ----------
// Cada chefão joga com um arquétipo, como um jogador faria: deck montado, poder próprio e estilo.
// Os 3 do ato são sorteados 1. poder: nome e texto (poderAberta: texto no modo Mão aberta, quando muda).
// pista: só o Trapaceiro. A regra dele nunca aparece na tela; só esta pista.
// anuncio: só o Trapaceiro anuncia ('mentira' = sempre mente).
const CHEFOES = {
  pedreiro:    { id: 'pedreiro', nome: 'O Pedreiro', ato: 1, arq: 'Muralha', poderId: 'pedreiro',
    poder: { nome: 'Muralha viva', texto: 'Vence os empates na Blitz e cura 1 a cada empate que vence.' },
    estilo: 'Segura o jogo até a Blitz; joga cartas que ganham empate quando espera um empate.',
    ia: { arq: 'Muralha', padrao: 'pedreiro' },
    deck: ['pedra', 'pedra', 'pedra', 'pedra', 'seixo', 'seixo', 'monolito', 'papelao', 'pedrada'], trofeu: 'pedraangular', omamori: 'fundacao' },
  arquivista:  { id: 'arquivista', nome: 'A Arquivista', ato: 1, arq: 'Arquivo', poderId: 'arquivista',
    poder: { nome: 'Arquivo morto', texto: 'No fim de cada turno, guarda 1 carta (a mais forte).', textoAberta: 'No fim de cada turno, guarda 1 carta (a mais forte), e a guardada fica Secreta.' },
    estilo: 'Monta a mão antes de atacar; guarda as Lendárias para a hora certa.',
    ia: { arq: 'Arquivo', padrao: 'arquivista' },
    deck: ['papel', 'papel', 'rascunho', 'rascunho', 'cascalho', 'recorte', 'geodo', 'testamento', 'pedra'], trofeu: 'fichario', omamori: 'pasta' },
  duelista:    { id: 'duelista', nome: 'O Duelista', ato: 1, arq: 'Investida', poderId: 'duelista',
    poder: { nome: 'Embalo', texto: 'Cada vitória dele dá +1 de dano na vitória seguinte, até +2. Perder zera.' },
    estilo: 'Ataca desde a primeira rodada; depois de vencer, tende a repetir o naipe (70%).',
    ia: { arq: 'Investida', padrao: 'duelista', repete: 0.7 },
    deck: ['tesoura', 'tesoura', 'estilete', 'estilete', 'pedrada', 'multa', 'guilhotina', 'pedra', 'papel'], trofeu: 'florete', omamori: 'luva' },
  ilusionista: { id: 'ilusionista', nome: 'A Ilusionista', ato: 2, arq: 'Leitura', poderId: 'ilusionista',
    poder: { nome: 'Véu', texto: 'A cada 2 rodadas, marca 1 carta sua.', textoAberta: 'Deixa 2 cartas dela Secretas por turno.' },
    estilo: 'Joga primeiro as cartas de marcar e depois pune as Marcadas.',
    ia: { arq: 'Leitura', padrao: 'ilusionista' },
    deck: ['pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura', 'cristal', 'bilhete', 'mapa', 'abridor', 'bisturi'], trofeu: 'biombo', omamori: 'veu' },
  trapaceiro:  { id: 'trapaceiro', nome: 'O Trapaceiro', ato: 2, arq: 'Blefe', poderId: 'trapaceiro', anuncio: 'mentira',
    poder: { nome: 'Conversa fiada', texto: 'Anuncia o naipe toda rodada.', textoAberta: 'Anuncia a carta toda rodada.' },
    pista: 'Não acredite em nada do que ele diz.',
    estilo: 'Anuncia a carta que você mais teme; joga o Curinga quando o naipe da vez vence o seu mais provável.',
    ia: { arq: 'Blefe', padrao: 'trapaceiro' },
    deck: ['pedra', 'pedra', 'papel', 'papel', 'tesoura', 'tesoura', 'curinga', 'rascunho', 'recorte', 'estilete', 'seixo'], trofeu: 'asnamanga', omamori: 'cartola' },
  relojoeiro:  { id: 'relojoeiro', nome: 'O Relojoeiro', ato: 2, arq: 'Blitz', poderId: 'relojoeiro',
    poder: { nome: 'Adiantado', texto: 'Contra ele, a Blitz começa na rodada 4.' },
    estilo: 'Gasta as cartas fracas cedo e guarda Cutelo e Meteoro para a Blitz.',
    ia: { arq: 'Blitz', padrao: 'relojoeiro' },
    deck: ['pedra', 'pedra', 'tesoura', 'tesoura', 'papel', 'cutelo', 'bainha', 'seixo', 'meteoro', 'pedrada', 'monolito'], trofeu: 'ponteiro', omamori: 'relogiobolso' }
};
