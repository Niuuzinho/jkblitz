// ============================================================
// TEXTOS DE EXPLICAÇÃO (explicações, glossário, dicas e tutorial) (V4)
// Todas as explicações do jogo vêm DAQUI, para não ficarem diferentes entre si.
// Cada entrada tem: nome, curto (1 linha), longo (detalhe) e exemplo.
// 'termos' (só nas palavras-chave): palavras que, ao aparecerem num texto do jogo, ganham negrito.
// Escreva as variações com maiúscula/minúscula, porque a busca diferencia as duas.
// ============================================================
const TEXTOS = {

  // ---------- Etiquetas de condição das cartas ----------
  // A etiqueta mostra QUANDO o efeito vale. O texto da carta não repete a condição.
  etiquetas: {
    vencer: { nome: 'Vencer', curto: 'O efeito só vale se a carta vencer a rodada.',
      longo: 'Você vence quando o naipe da sua carta bate o do oponente (pedra > tesoura > papel > pedra), ou quando um efeito faz você ganhar o empate. Se a carta perder ou empatar, esta linha não ativa.',
      exemplo: 'Guilhotina diz "Vencer: causa 4 de dano". Se ela perder, não causa.' },
    perder: { nome: 'Perder', curto: 'O efeito só vale se a carta perder a rodada.',
      longo: 'Perde quem joga o naipe que o outro naipe vence. Linhas de Perder são a defesa ou o consolo da carta.',
      exemplo: 'Papelão diz "Perder: você não sofre dano". Se ele vencer, o efeito não ativa.' },
    empatar: { nome: 'Empatar', curto: 'O efeito só vale se a rodada empatar.',
      longo: 'Empate é quando as duas cartas têm o mesmo naipe. Fora da Blitz ninguém sofre dano e nada ativa; as cartas com esta etiqueta são a exceção.',
      exemplo: 'Seixo diz "Empatar: ganha o empate".' },
    jogar: { nome: 'Jogar', curto: 'O efeito vale na revelação, qualquer que seja o resultado.',
      longo: 'Efeitos "Jogar" não dependem de vencer, perder ou empatar: acontecem assim que as cartas são reveladas.',
      exemplo: 'Cristal marca a carta do topo do deck do oponente assim que é jogado.' },
    sempre: { nome: 'Sempre', curto: 'O efeito vale qualquer que seja o resultado.',
      longo: 'Vence, perde ou empata: a linha ativa do mesmo jeito. Também marca regras que valem enquanto a carta existe, como "nunca é descartada".',
      exemplo: 'Meteoro causa 3 de dano ao oponente seja qual for o resultado.' }
  },

  // ---------- Palavras-chave (ficam em negrito nos textos) ----------
  palavras: {
    vencer: { nome: 'Vencer', termos: ['Vencer', 'vencer', 'vence', 'venceu', 'vencida', 'vitória', 'vencem'],
      curto: 'Sua carta ganhou a rodada.', longo: 'Veja a etiqueta Vencer.', exemplo: '' },
    perder: { nome: 'Perder', termos: ['Perder', 'perder', 'perde', 'perdeu', 'derrota'],
      curto: 'Sua carta perdeu a rodada.', longo: 'Veja a etiqueta Perder.', exemplo: '' },
    empatar: { nome: 'Empatar', termos: ['Empatar', 'empatar', 'Empate', 'empate', 'empates', 'empata', 'empataram'],
      curto: 'As duas cartas têm o mesmo naipe.', longo: 'Veja a etiqueta Empatar. As duas cartas vão para o cemitério, a não ser que o texto de uma carta diga o contrário.', exemplo: '' },
    blitz: { nome: 'Blitz', termos: ['Blitz'],
      curto: 'Fase acelerada: a partir da rodada 6, todo empate machuca.',
      longo: 'A partir da rodada 6 (rodada 4 na primeira luta), todo empate causa 1 de dano a cada lado. A Blitz é uma regra fixa: nenhum efeito a adianta ou atrasa. O contador na mesa mostra quantas rodadas faltam.',
      exemplo: 'Rodada 7, dois papéis empatam: os dois lados sofrem 1.' },
    frágil: { nome: 'Frágil', termos: ['Frágil', 'Frágeis', 'frágil'],
      curto: 'Depois de jogada, vai para as Cortadas e só volta no combate seguinte.',
      longo: 'Frágil é um traço impresso na carta: ela só pode ser usada uma vez por combate. Por isso as cartas Frágeis são mais fortes que o normal.',
      exemplo: 'Guilhotina causa 4 de dano, mas depois de usada fica de fora até o próximo combate.' },
    secreta: { nome: 'Secreta', termos: ['Secreta', 'Secretas', 'Secreto', 'Secretos', 'Sigilosa'],
      curto: 'Mão aberta: a carta fica virada para o oponente enquanto está na mão.',
      longo: 'Só existe no modo de teste Mão aberta, no lugar de Marcada. A carta Secreta aparece virada para o oponente; a Secreta some quando a carta é jogada ou descartada. Cristal revela Secretas.',
      exemplo: 'Abridor de cartas nasce Secreto: o oponente nunca vê o Abridor na sua mão.' },
    marcada: { nome: 'Marcada', termos: ['Marcada', 'Marcadas', 'Marcado', 'Marca', 'Marcar', 'marca', 'marcar', 'marcada', 'marcadas', 'Marcam'],
      curto: 'Fica revelada para o oponente, na mão ou no topo do deck.',
      longo: 'Nas odds, a carta Marcada conta como certeza. A marca some quando a carta é jogada ou descartada. Marcada não dá dano extra: o dano extra contra Marcadas vem só das cartas de Leitura.',
      exemplo: 'Cristal marca a carta do topo do deck do oponente: ele a comprará no próximo turno, e você já sabe qual é.' },
    cortada: { nome: 'Cortada', termos: ['Cortada', 'Cortadas', 'Cortado', 'Cortar', 'cortada', 'cortadas'],
      curto: 'Fica fora do resto do combate e volta no combate seguinte.',
      longo: 'As cartas cortadas ficam na pilha Cortadas, visível para os dois. No fim do combate o deck volta inteiro.',
      exemplo: 'Bisturi corta a carta Marcada que ele venceu.' },
    guardar: { nome: 'Guardar', termos: ['guarda', 'Guarda', 'guardar', 'guardada', 'Guardada', 'guarde', 'fica na mão', 'Fica na mão'],
      curto: 'A carta não é descartada no fim do turno.',
      longo: 'Cartas guardadas continuam na mão e contam nas 3: no próximo turno você compra menos. Se há mais cartas guardadas do que cabem na mão, você escolhe quais ficam.',
      exemplo: 'Cascalho, ao perder, guarda as outras duas cartas da mão: no turno seguinte você compra só 1.' },
    maismais: { nome: 'Mão +1', termos: ['Mão +1'],
      curto: 'No próximo turno você completa a mão até 4 em vez de 3.',
      longo: 'Vale só para o turno seguinte. Depois a mão volta ao tamanho de sempre.', exemplo: '' },
    curinga: { nome: 'Curinga', termos: ['Curinga'],
      curto: 'Carta que muda de naipe a cada rodada.',
      longo: 'Na mão, o Curinga passa por pedra, papel e tesoura no início de cada rodada. Você vê o naipe atual e o próximo. Nas odds ele aparece como "?".', exemplo: '' },
    dinamite: { nome: 'Dinamite', termos: ['Dinamite'],
      curto: 'Vence qualquer naipe. É Frágil.', longo: 'Só a Dinamite vence qualquer naipe. Dinamite contra Dinamite: os dois sofrem 2.', exemplo: '' },
    moeda: { nome: 'Moeda', termos: ['moeda', 'moedas', 'Moeda'],
      curto: 'O dinheiro da run: gasto na Loja.', longo: 'Você ganha moedas ao fim de cada combate e acumula pela run inteira.', exemplo: '' },
    cemiterio: { nome: 'Cemitério', termos: ['cemitério', 'Cemitério'],
      curto: 'Cartas jogadas e descartadas. Vira o deck quando ele acaba.', longo: 'As duas pessoas veem o cemitério.', exemplo: '' },
    oficina: { nome: 'Oficina', termos: ['Oficina'], curto: 'Evento grátis: 1 upgrade de graça depois dos combates 2 e 4 de cada ato.', longo: 'Pular a Oficina dá 1 moeda.', exemplo: '' },
    recompensa: { nome: 'Recompensa', termos: ['Recompensa'], curto: 'Depois de todo combate: 1 carta grátis entre 3 (uma de cada naipe).', longo: 'Pular dá 2 moedas. Aparece até depois de empate ou derrota.', exemplo: '' },
    ganha: { nome: 'Ganhar o empate', termos: ['Ganha o empate', 'ganha o empate', 'Ganha todos os empates', 'ganhar o empate'],
      curto: 'Num empate, esta carta vence a rodada.', longo: 'Se os dois lados ganham o empate na mesma rodada, continua empate.', exemplo: '' }
  },

  // ---------- Naipes ----------
  naipes: {
    pedra: { nome: 'Pedra', curto: 'Aguenta: ganha com empates e com derrotas.', longo: 'Pedra vence tesoura. As cartas de pedra recompensam a paciência.', exemplo: '' },
    papel: { nome: 'Papel', curto: 'Controla: mexe na mão e na informação.', longo: 'Papel vence pedra.', exemplo: '' },
    tesoura: { nome: 'Tesoura', curto: 'Ataca: dano alto quando vence, sem defesa quando perde.', longo: 'Tesoura vence papel.', exemplo: '' },
    nenhum: { nome: 'Dinamite', curto: 'Vence qualquer naipe.', longo: 'Só a Dinamite não tem naipe.', exemplo: '' },
    curinga: { nome: 'Curinga', curto: 'Muda de naipe a cada rodada.', longo: 'Na mão, passa por pedra, papel e tesoura.', exemplo: '' }
  },

  // ---------- Arquétipos (4) ----------
  tags: {
    Investida: { nome: 'Investida', curto: 'Causar mais dano ao vencer.', longo: 'Exemplos: Pedrada, Guilhotina, Fóssil. Com 3 cartas no deck o arquétipo fica ativo: a Loja passa a oferecer mais cartas dele, e os omamoris dele podem aparecer.', exemplo: '' },
    Muralha: { nome: 'Muralha', curto: 'Ganhar empates e sofrer menos dano. Brilha na Blitz.', longo: 'Exemplos: Seixo, Monólito, Bainha. Na Blitz o empate dá dano, então ganhar o empate vale muito.', exemplo: '' },
    Arquivo: { nome: 'Arquivo', curto: 'Controlar a mão: guardar cartas e escolher o que vem.', longo: 'Exemplos: Cascalho, Rascunho, Testamento.', exemplo: '' },
    Leitura: { nome: 'Leitura', curto: 'Marcar cartas do oponente e punir cartas marcadas.', longo: 'Exemplos: Cristal, Mapa, Bisturi.', exemplo: '' }
  },

  // ---------- Regras ----------
  regras: {
    maoAberta: { nome: 'Mão aberta (modo de teste)', curto: 'As duas mãos ficam visíveis, com os efeitos. O deck continua escondido.',
      longo: 'Escolhido no menu antes da run. Marcada vira Secreta (carta virada para o oponente). A IA lê a sua mão, menos as cartas Secretas. Todo chefão tampa 1 carta por turno (a Ilusionista, 2).', exemplo: '' },
    arquetipoAtivo: { nome: 'Arquétipo ativo', curto: 'Com 3 cartas de um arquétipo no deck, ele fica ativo.', longo: 'A Loja passa a oferecer mais cartas dele (50% das Raras e Lendárias) e os omamoris dele podem aparecer.', exemplo: '' },
    revanche: { nome: 'Revanche do chefão', curto: 'Perder ou empatar contra o chefão faz você lutar de novo.', longo: 'Você paga a vida da run (1 pelo empate, 3 pela derrota) e enfrenta o mesmo chefão outra vez, com a Loja no meio.', exemplo: '' },
    selo: { nome: 'Selo', curto: 'Efeito extra de uma carta. Um por carta.', longo: 'Selos se compram na Loja. Colocar um selo numa carta que já tem outro substitui o antigo.', exemplo: '' },
    regraInimigo: { nome: 'Regra do inimigo', curto: 'Como este inimigo joga.', longo: 'Todo inimigo segue uma regra clara e mostrada antes da luta.', exemplo: '' }
  },

  // ---------- Itens da tela ----------
  ui: {
    vida: { nome: 'Sua vida', curto: 'Quando chega a 0, você perde o combate.', longo: 'A cura nunca passa da vida máxima.', exemplo: '' },
    vidaInimigo: { nome: 'Vida do oponente', curto: 'Quando chega a 0, você vence o combate.', longo: 'No limite de 12 rodadas, vence quem tiver mais vida.', exemplo: '' },
    vidaRun: { nome: 'Vida da run', curto: 'Perde 1 no empate e 3 na derrota de um combate.', longo: 'Zerou, a run acaba.', exemplo: '' },
    moedas: { nome: 'Moedas', curto: 'Dinheiro da run, gasto na Loja.', longo: 'Vitória 3, empate 2, derrota 1; vencer um chefão dá +3. Pular a Recompensa dá 2; pular a Oficina dá 1.', exemplo: '' },
    ato: { nome: 'Ato', curto: 'A run tem 2 atos de 5 combates.', longo: 'O 3º combate de cada ato tem sub-chefe e o 5º tem chefão. Vence a run quem derrota o chefão do ato 2. Depois de todo combate vem uma Recompensa; a Loja vem depois dos combates 1, 3 e 5 e a Oficina depois dos combates 2 e 4.', exemplo: '' },
    seed: { nome: 'Seed', curto: 'A semente da run.', longo: 'Com a mesma seed você enfrenta os mesmos inimigos e vê as mesmas Lojas.', exemplo: '' },
    oddsInimigo: { nome: 'Odds do oponente', curto: 'O que ele provavelmente joga.', longo: 'Porcentagem de cada naipe entre as cartas que ainda podem estar na mão dele (deck e mão). Jogue o naipe que vence o mais provável. Marcadas são certeza. Você não vê as suas próprias odds: já sabe o que tem.', exemplo: '' },
    oddsAberta: { nome: 'Odds do deck dele', curto: 'Na Mão aberta, só o deck: as próximas compras dele.', longo: 'A mão dele já está à vista.', exemplo: '' },
    deck: { nome: 'Deck', curto: 'Cartas ainda não compradas.', longo: 'A composição é pública, a ordem não.', exemplo: '' },
    cemiterio: { nome: 'Cemitério', curto: 'Cartas jogadas e descartadas.', longo: 'Quando o deck acaba, o cemitério é embaralhado e vira o deck.', exemplo: '' },
    cortadas: { nome: 'Cortadas', curto: 'Cartas fora do combate.', longo: 'Voltam ao seu deck no próximo combate.', exemplo: '' },
    blitzTrilha: { nome: 'Trilha da Blitz', curto: 'Mostra quantas rodadas faltam para a Blitz.', longo: 'Cada segmento é uma rodada. O amarelo é a rodada em que a Blitz começa.', exemplo: '' },
    maoOponente: { nome: 'Mão do oponente', curto: 'Cartas que ele tem. Só as Marcadas aparecem viradas para cima.', longo: 'Cartas Marcadas contam como certeza nas odds. Na Mão aberta, todas aparecem, menos as Secretas.', exemplo: '' },
    mao: { nome: 'Sua mão', curto: 'Toque numa carta para jogar. Botão direito (ou segurar) amplia.', longo: 'Atalhos: 1 a 3 jogam a carta. O que você não jogar vai para o cemitério, a não ser que seja guardado. Na rodada seguinte, um toque em qualquer lugar pula a espera.', exemplo: '' },
    confirmar: { nome: 'Jogar a carta', curto: 'Confirma a carta selecionada (só com "Confirmar jogada" ligada).', longo: 'Atalho: Enter.', exemplo: '' },
    proximaRodada: { nome: 'Próxima rodada', curto: 'Começa sozinha em cerca de 1,5 segundo; um toque pula a espera.', longo: 'Atalho: Enter ou Espaço.', exemplo: '' },
    anuncioChefao: { nome: 'Anúncio do Trapaceiro', curto: 'O que ele diz que vai jogar.', longo: 'Só o Trapaceiro anuncia, e a regra de quando ele mente fica escondida. Fique com a pista: "Não acredite em nada do que ele diz."', exemplo: '' },
    poderChefao: { nome: 'Poder do chefão', curto: 'Cada chefão tem um poder próprio e um estilo de jogo.', longo: 'Antes da luta a tela mostra o arquétipo, o poder, o estilo, a carta Troféu e o omamori que você pode levar.', exemplo: '' },
    slotJogador: { nome: 'Sua carta', curto: 'Clique numa carta da mão ou arraste para cá.', longo: '', exemplo: '' },
    trilha: { nome: 'Trilha da run', curto: 'Os 10 combates da run, em 2 atos.', longo: 'Losango é sub-chefe, coroa é chefão. Verde: vitória. Vermelho: derrota.', exemplo: '' },
    verDeck: { nome: 'Ver deck', curto: 'Lista suas cartas, com filtros.', longo: 'Mostra também os arquétipos ativos e os seus omamoris.', exemplo: '' },
    omamoris: { nome: 'Omamoris', curto: 'Itens passivos desta run. Botão direito explica.', longo: 'Limite de 5.', exemplo: '' },
    som: { nome: 'Som', curto: 'Liga e desliga os sons.', longo: 'Os sons são gerados pelo navegador, sem arquivos.', exemplo: '' },
    glossario: { nome: 'Glossário', curto: 'Todas as palavras e regras do jogo.', longo: '', exemplo: '' },
    cartola: { nome: 'Cartola', curto: 'Uma vez por combate, troque 1 carta da mão pela do topo do deck.', longo: '', exemplo: '' },
    caderno: { nome: 'Caderno', curto: 'Uma vez por combate, guarde 1 carta da mão no fim do turno.', longo: '', exemplo: '' },
    loja: { nome: 'Loja', curto: 'Cartas Raras ou melhores, 1 omamori, upgrades, remoções e selos.', longo: 'A Loja aparece depois dos combates 1, 3 e 5 de cada ato. Não gastar é o jeito de guardar moedas para algo caro.', exemplo: '' },
    preco: { nome: 'Preço', curto: 'Rara 3, Lendária 6, Prismática 10, omamori 6.', longo: 'Upgrade 2, remover carta 2, selo 3, renovar 1. O Cupom tira 1 de tudo (mínimo 1).', exemplo: '' },
    upgrade: { nome: 'Upgrade', curto: 'Melhora uma carta (uma vez por carta).', longo: 'Nas Comuns, o upgrade dá Vencer: +1 de dano. A Oficina mostra a versão atual e a "+" lado a lado.', exemplo: '' },
    renovar: { nome: 'Renovar', curto: 'Sorteia 3 cartas novas (uma vez por Loja).', longo: 'O omamori e o selo à venda não mudam.', exemplo: '' },
    recompensaCartas: { nome: 'Recompensa', curto: 'Escolha 1 das 3 cartas (uma de cada naipe) ou pule e ganhe 2 moedas.', longo: 'Aparece depois de todo combate, inclusive empate e derrota. Cada carta aparece só na versão atual.', exemplo: '' },
    oficina: { nome: 'Oficina', curto: 'Escolha 1 carta do deck para receber o upgrade de graça, ou pule e ganhe 1 moeda.', longo: 'Só aqui cada carta mostra a versão atual e a "+" lado a lado.', exemplo: '' },
    espolio: { nome: 'Espólio', curto: 'O omamori do chefão já é seu. Escolha a carta Troféu ou um omamori sorteado.', longo: 'Você também ganha +3 moedas por vencer o chefão.', exemplo: '' },
    subchefe: { nome: 'Sub-chefe', curto: 'Escolha 1 entre 2. Vida 6, uma regra e uma recompensa.', longo: 'Perder ou empatar contra o sub-chefe não dá a recompensa, mas você segue em frente.', exemplo: '' },
    mesa: { nome: 'Mesa do Apostador', curto: 'Melhor de 3 de jokenpô pela Dinamite ou pelo Curinga.', longo: 'Você aposta 1 Lendária ou 8 moedas. O Apostador joga ao acaso: é sorte pura.', exemplo: '' }
  },

  // ---------- Exemplos dos selos ----------
  modExemplos: {
    pesada: 'Uma Pedra Pesada que vence causa 2 de dano em vez de 1.',
    blindada: 'Uma Guilhotina Blindada não é Cortada depois de usada.',
    guardada: 'Uma carta Guardada que você não joga fica para o próximo turno.',
    delatora: 'Descarte uma Delatora e a carta do topo do deck do oponente fica Marcada.',
    namanga: 'Uma Guilhotina Na manga está na sua mão logo na rodada 1.'
  },

  // ---------- Dicas de primeira vez (cada uma aparece uma vez só) ----------
  dicas: {
    loja: 'A Loja vende cartas Raras ou melhores, 1 omamori, upgrade, remover carta e um selo. Sair sem gastar também vale.',
    omamori: 'Omamoris valem pela run inteira. Botão direito em um omamori explica o que ele faz.',
    subchefe: 'No 3º combate de cada ato você escolhe 1 entre 2 sub-chefes. Cada um tem uma regra e uma recompensa.',
    chefao: 'Este é um chefão: ele tem um poder próprio. Perder ou empatar faz você lutar de novo.',
    espolio: 'O omamori do chefão já é seu. Agora escolha 1: a carta Troféu ou um omamori sorteado.',
    mesa: 'A Mesa do Apostador aparece uma vez, no ato 2. Você pode recusar.',
    marcada: 'Cartas Marcadas ficam reveladas para o oponente e contam como certeza nas odds. Marcada não dá dano extra.',
    secreta: 'Mão aberta: as duas mãos estão à vista, menos as cartas Secretas, que ficam viradas para o oponente.',
    oficina: 'Na Oficina você escolhe 1 carta do deck para receber o upgrade de graça. Pular dá 1 moeda.',
    recompensa: 'Depois de todo combate você escolhe 1 entre 3 cartas grátis (uma de cada naipe). Pular dá 2 moedas.',
    fragil: 'Carta Frágil: depois de usada vai para as Cortadas e só volta no próximo combate.',
    guardar: 'Cartas guardadas continuam na mão e contam nas 3. No próximo turno você compra menos.',
    curinga: 'O Curinga muda de naipe a cada rodada. Você vê o naipe atual e o próximo.',
    selo: 'Esta carta tem um selo, um efeito extra. Botão direito mostra o que ele faz.',
    direito: 'Dica: clique com o botão direito (ou segure o dedo) em qualquer carta para ampliar e ler tudo sobre ela.',
    odds: 'A barra de odds mostra a chance de cada naipe nas cartas que ainda podem estar na mão dele. Cartas Marcadas são certeza.',
    ritmo: 'Um toque na carta joga. O resto é automático, e um toque em qualquer lugar pula a espera.'
  },

  // ---------- Tutorial: O Treinador ----------
  tutorial: {
    passos: [
      { rodada: 1, alvo: '.mao-area', texto: 'Esta é a sua mão: 3 cartas. O Treinador vai jogar tesoura. Toque numa carta para jogar.' },
      { rodada: 1, alvo: '.mesa', texto: 'As duas cartas são reveladas juntas. Pedra vence tesoura, tesoura vence papel, papel vence pedra. Quem vence causa 1 de dano.', momento: 'depois' },
      { rodada: 2, alvo: '.mao-area', texto: 'Toda rodada você completa a mão até 3. O que você não jogou foi para o cemitério. Agora jogue qualquer carta: o Treinador vai jogar o mesmo naipe.' },
      { rodada: 2, alvo: '.mesa', texto: 'Empate: ninguém sofre dano e as duas cartas vão para o cemitério.', momento: 'depois' },
      { rodada: 3, alvo: '.cb-odds', texto: 'Esta barra mostra o que o Treinador provavelmente joga: quase tudo pedra. O que vence pedra?' },
      { rodada: 4, alvo: '.mao-area', texto: 'Você recebeu uma Pedrada. Cartas de efeito têm uma etiqueta: "Vencer: causa 2 de dano". Jogue a Pedrada contra a tesoura dele.' },
      { rodada: 4, alvo: '.mesa', texto: 'A Pedrada venceu e causou 2 de dano. Botão direito em qualquer carta explica tudo sobre ela.', momento: 'depois' },
      { rodada: 5, alvo: '.mao-area', texto: 'Uma das cartas do Treinador está Marcada: ela fica revelada para você. Veja a barra de odds dele: a carta Marcada é certeza. Jogue o naipe que a vence.' },
      { rodada: 6, alvo: '.blitz', texto: 'A Blitz começou: de agora em diante, um empate tira 1 de vida dos dois. Jogue o mesmo naipe dele para empatar.' },
      { rodada: 7, alvo: '.cb-ini .vida', texto: 'O Treinador está com 1 de vida. Jogue o naipe que vence o dele para ganhar!' }
    ],
    fim: [
      'Você venceu o Treinador!',
      'Uma run tem 2 atos de 5 combates, com sub-chefe no 3º e chefão no 5º. Perder um combate custa 3 de vida da run (empate custa 1); chegando a 0 você perde a run.',
      'Depois do primeiro combate você escolhe um omamori. Depois de todo combate há uma Recompensa de cartas grátis; a Oficina (upgrade grátis) e a Loja aparecem em seguida, alternando.'
    ]
  }
};
