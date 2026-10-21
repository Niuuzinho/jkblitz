# Passagem para o Claude Code: Jokenblitz V4.1

Este arquivo tem duas partes: esta lista de ajustes e, logo depois, a **Especificação V4.1** completa.

A V4 já está implementada. A V4.1 são ajustes vindos do primeiro teste do André, mais um **modo de teste** novo, o Mão aberta. Fazer tudo de uma vez e entregar o jogo completo.

- **Fonte da verdade:** a Especificação. Se esta lista e ela discordarem, vale a Especificação.
- **Visual:** continua o protótipo.
- Registrar em `RELATORIO.md` qualquer decisão onde a Especificação for omissa.

## Ajustes

| Área | O que mudar | Onde mexer |
| --- | --- | --- |
| Mesa de combate | Layout em coluna, igual no computador e no celular: trilha no topo, depois tudo do inimigo (nome, vida, omamoris, contadores, Marcadas, balão de anúncio), depois as odds do inimigo centralizadas, depois a mesa com **a carta do jogador à esquerda** e a do inimigo à direita, depois as informações do jogador, e a mão na base. Ver o desenho em Interface › Mesa de combate | `ui-combate.js`, `style.css` |
| Odds | Tirar da tela as odds do próprio jogador | `ui-combate.js` |
| Contagem | "Jo… Ken… Pô!" antes da Blitz; "Jo… Ken… Blitz!" durante a Blitz. Menos de 1 segundo, e um toque pula | `ui-combate.js` |
| Ritmo | Um toque por rodada. Tocar na carta joga (sem confirmar). Resultado, efeitos e descarte automáticos; próxima rodada em cerca de 1,5 segundo, e um toque pula. Escolhas de efeito numa linha de botões na mesa, sem janela. Fim de combate com um botão só. Opções no menu: "Confirmar jogada" (desligada) e Velocidade (Normal ou Rápida) | `ui-combate.js`, `ui-main.js` |
| Recompensa | Tela nova depois de todo combate, inclusive empate e derrota: 3 cartas, uma de cada naipe, só na versão atual; escolhe 1 ou pula por 2 moedas. Raridade própria por ato | `run`, `ui-eventos`, trilha |
| Oficina | Evento grátis depois dos combates 2 e 4 de cada ato: 1 upgrade grátis, com atual e "+" lado a lado; pular dá 1 moeda | `run`, `ui-eventos`, trilha |
| Ordem das paradas | Combate 1: Recompensa, Loja. Combate 2: Recompensa, Oficina. Sub-chefe: recompensa do sub-chefe, Recompensa, (Mesa do Apostador no ato 2), Loja. Combate 4: Recompensa, Oficina. Chefão: Espólio, Recompensa, Loja | `run`, trilha |
| Loja | Aparece só depois dos combates 1, 3 e 5 de cada ato. Cartas só Raras ou melhores, sem o upgrade ao lado. Nova raridade por ato. 1 omamori à venda por 6 moedas. Nome do selo à venda em destaque (negrito numa etiqueta colorida) com a explicação embaixo | `run`, `ui-eventos`, `style.css` |
| Omamoris | Além da Loja, o Espólio dá o omamori do chefão garantido, e o jogador ainda escolhe entre a carta Troféu e 1 omamori sorteado | `run`, `ui-eventos` |
| Chefões | Os 6 chefões foram refeitos: cada um joga com um arquétipo (Muralha, Arquivo, Investida, Leitura, Blefe, Blitz), com deck montado, poder, estilo que a IA prioriza, carta Troféu e omamori novos. Saem Juiz, Pêndulo, Rancoroso e Burocrata, com suas cartas e omamoris. Só o Trapaceiro anuncia, e a regra dele nunca aparece na tela (só a pista). Antes da luta: arquétipo, poder, estilo, Troféu e omamori | `enemies`, `ia`, `cards`, `omamoris`, `ui-eventos` |
| Inimigos comuns e sub-chefes | Cada um joga com um arquétipo, com deck próprio (mais leve que o dos chefões, com mais vanillas) e um estilo. A IA segue as prioridades do arquétipo (tabela em Inimigos e chefes › Como a IA joga). Todos aparecem nos dois atos; no ato 2 o deck ganha cartas e 2 upgrades | `enemies`, `ia` |
| Dinheiro | Pular a Recompensa dá 2 moedas; pular a Oficina dá 1 | `run`, `config` |
| Deck | Alvo de 14 a 18 cartas no fim da run (para as medições) | `RELATORIO.md` |

## Modo de teste: Mão aberta

Opção no menu, antes de começar a run: **Normal** ou **Mão aberta (teste)**. É para o André comparar os dois na prática, então os dois modos precisam funcionar por completo.

- No Mão aberta, as duas mãos ficam visíveis, com os efeitos. O deck continua escondido.
- O estado Marcada é trocado por **Secreta** (carta virada para o oponente enquanto está na mão).
- As cartas, selos e omamoris que falam de Marcada têm uma segunda versão de texto e efeito para este modo, na tabela da Especificação. Guardar as duas versões nos dados (por exemplo, um campo `maoAberta` em cada uma), e não duplicar as cartas.
- A IA lê a mão do jogador, como descrito na Especificação, e ignora as cartas Secretas.
- Os inimigos também têm Secretas: todo chefão tampa 1 carta por turno (a Ilusionista, 2), e no ato 2 os inimigos comuns trazem 1 ou 2 cartas com o selo Sigilosa.
- Abridor de cartas e Bisturi nascem Secretos nesse modo, e o Cristal revela as Secretas do oponente.
- O resumo do fim da run e o `RELATORIO.md` dizem em qual modo a run foi jogada.

## O que medir

Com o bot que joga pelas odds, nos dois modos:

- Tamanho médio do deck no fim da run (alvo: 14 a 18).
- Omamoris por run (esperado: 3 a 4).
- Taxa de vitória por arquétipo e contra cada sub-chefe e chefão.
- No Mão aberta: taxa de vitória da IA que lê a mão contra um bot que joga ao acaso e contra o bot pelas odds.

---

# Jokenblitz: Especificação V4.1

21 de outubro de 2026 · André

## Visão geral

A V4 é uma versão enxuta do Jokenblitz: 4 arquétipos, 27 cartas, mão fixa de 3, uma moeda só e nenhum sistema de anúncio para o jogador. Ela substitui a Especificação V3.1 inteira, em vez de remendá-la.

Jokenblitz é um deckbuilder roguelike de pedra, papel e tesoura, jogado no navegador contra IA. Os dois lados escolhem uma carta ao mesmo tempo, e quem vence a rodada causa dano.

**Princípios**

- **Poucas regras, todas visíveis.** Se uma regra precisa de explicação longa, ela sai.
- **Cada carta faz algo que só ela faz.** Nenhuma carta trabalha contra o próprio arquétipo.
- **A raridade mede profundidade.** Comum é vanilla, Rara tem um efeito simples, Lendária tem uma regra própria, e Prismática quebra uma regra do jogo.
- **As odds são o centro da leitura.** O jogo é sobre adivinhar bem usando informação pública.
- **Visual de protótipo** até o sistema assentar.

## O que mudou da V3.1

Quase todo sistema que existia só para sustentar outro saiu, e os serviços entre combates viraram Recompensa, Oficina e Loja.

| Área | V3.1 | V4 |
| --- | --- | --- |
| Anúncio | Verdade, Mentira, Silêncio, credibilidade, Golpe, Palavra cumprida | Sai para o jogador. Só alguns chefões anunciam, com regra fixa |
| Corrente (Combo) e Camadas | Contadores na mesa | Saem |
| Estados de carta | Marcada, Lacrada, Cortada, Exaustão | Marcada e Cortada. Frágil vira traço de carta |
| Mão | Começa com 3, compra 1 por rodada, limite 6 | Sempre 3; o que não for jogado é descartado |
| Blitz | Regra mais arquétipo, com cartas que adiantam e atrasam | Só regra. Nada adianta nem atrasa |
| Arquétipos | 14 | 4: Investida, Muralha, Arquivo e Leitura |
| Cartas | 92 | 27, mais 2 especiais e as cartas Troféu dos chefões |
| Raridades | Comum, Incomum, Rara, Lendária, Prismática | Comum (vanilla), Rara, Lendária, Prismática |
| Boosters | 1 entre 3 pacotes | Saem. Depois de todo combate, 1 carta grátis entre 3 (uma de cada naipe) |
| Oficina, Ateliê, Escambo, Troca | Eventos próprios | Saem Ateliê, Escambo e Troca. A Oficina fica, com 1 upgrade grátis; upgrades extras, remoção e selo ficam na Loja |
| Moeda | Pontos de oficina e valor de escambo | Dinheiro, ganho em todo combate |
| Selos | 11 | 5 |
| Relíquias | 36 | Viram omamoris: 16, mais os dos chefões |
| Run | 8 vitórias, chefes nos combates 4 e 8 | 2 atos de 5 combates, com sub-chefe à escolha e chefão |
| Dinamite | Some da run depois de usada | Frágil: um uso por combate, fica no deck |
| Visual | V3.1 aprovado | Protótipo. O V3.1 fica guardado para depois |

## Ajustes depois do primeiro teste

Depois de jogar o primeiro protótipo da V4, entraram estes ajustes (já aplicados nas seções abaixo):

| Área | Ajuste |
| --- | --- |
| Mesa de combate | Coluna vertical: inimigo em cima, jogador embaixo, odds do inimigo no centro, a sua carta à esquerda |
| Odds | O jogador não vê mais as próprias odds |
| Contagem | "Jo… Ken… Pô!" antes da Blitz; "Jo… Ken… Blitz!" durante |
| Ritmo | Um toque por rodada: tocar na carta joga, e o resto é automático |
| Cartas novas | Recompensa grátis depois de todo combate (1 entre 3); a Loja vende só Raras ou melhores |
| Upgrade | Oficina grátis depois dos combates 2 e 4 de cada ato; a Loja continua vendendo |
| Loja | Sem o upgrade ao lado das cartas; selo com o nome em destaque; 1 omamori à venda |
| Omamoris | Mais chances: um em toda Loja, e o do chefão é garantido no Espólio |
| Chefões | Cada chefão joga com um arquétipo, com deck, poder e estilo próprios. Só o Trapaceiro ainda vive de anunciar |
| Mão aberta | Novo modo de teste: as duas mãos visíveis, com o estado Secreta no lugar de Marcada |
| Deck | Alvo de 14 a 18 cartas no fim da run |

## Regras do combate

Todo turno cada lado tem 3 cartas, joga 1 e descarta o resto, a não ser que um efeito mande guardar.

### Parâmetros

| Parâmetro | Valor |
| --- | --- |
| Vida no combate | 5 (3 na primeira luta) |
| Mão | 3 cartas por turno (4 com o omamori Mochila) |
| Dano da vitória | 1 |
| Dano do empate | 0, ou 1 para cada lado durante a Blitz |
| Início da Blitz | Rodada 6 (rodada 4 na primeira luta) |
| Limite de rodadas | 12 |
| Deck mínimo | 6 cartas |

### Ordem de uma rodada

1. Omamoris de início de rodada agem.
2. Cada lado completa a mão até 3, comprando do deck. Se o deck acabar, o cemitério é embaralhado e vira o deck.
3. Chefões que anunciam mostram o anúncio.
4. Cada lado escolhe 1 carta em segredo.
5. Revelação simultânea.
6. Resultado pela regra clássica, depois a regra de vencer empates. A Dinamite vence qualquer naipe.
7. Efeitos das cartas, selos e omamoris.
8. Dano e cura acontecem ao mesmo tempo. A cura nunca passa da vida máxima.
9. A carta jogada vai para o cemitério, ou para as Cortadas se for Frágil.
10. As outras cartas da mão vão para o cemitério, menos as guardadas.
11. Verifica o fim do combate.

### Mão, descarte e guardar

- **Descartar não ativa nada**, a não ser o selo Delatora.
- **Guardar:** a carta não é descartada no fim do turno. Ela continua na mão e conta nas 3, então no próximo turno você compra menos.
- Se houver mais cartas guardadas do que cabem na mão, você escolhe quais ficam.
- **Mão +1:** no próximo turno, você completa a mão até 4 em vez de 3. Vale só para aquele turno.
- Algumas cartas nunca são descartadas (Geodo, Meteoro, Curinga, Ás na Manga). Elas ocupam um lugar na mão até serem jogadas.

### Empate e Blitz

- **Empate:** as duas cartas vão para o cemitério, ninguém leva dano, e nada é ativado, a não ser o que cita empate.
- **Blitz:** a partir da rodada 6, todo empate causa 1 de dano a cada lado. É uma regra fixa: nenhum efeito adianta ou atrasa a Blitz.
- A tela sempre mostra quantas rodadas faltam para a Blitz.
- **Vencer empates:** algumas cartas fazem um lado vencer o empate. Se os dois lados vencem empates na mesma rodada, continua empate.

### Estados de carta

| Estado | O que significa | Quem causa |
| --- | --- | --- |
| Marcada | Fica revelada para o oponente do dono, na mão ou no topo do deck. Nas odds, conta como certeza. A marca some quando a carta é jogada ou descartada | Cartas de Leitura, Recorte, selo Delatora, omamori Lente, sub-chefe Espião |
| Cortada | Fica fora do resto do combate e volta no combate seguinte | Cartas Frágeis depois de usadas, Excalisoura |

**Frágil** não é um estado: é um traço impresso na carta. Depois de jogada, a carta Frágil é cortada, então só pode ser usada uma vez por combate. Por isso as cartas Frágeis são mais fortes que o normal. O sub-chefe Quebradiço deixa cartas Frágeis só durante a luta contra ele.

### Fim da partida

- **Vitória:** o oponente chega a 0.
- **Limite de rodadas:** vence quem tiver mais vida.
- **Empate da partida:** os dois chegam a 0 na mesma rodada, ou o limite termina com a mesma vida.

### Zonas

| Zona | O que é | Quem vê |
| --- | --- | --- |
| Deck | De onde se compra | Os dois veem a composição; ninguém vê a ordem |
| Mão | 3 cartas | Só o dono, menos as Marcadas |
| Cemitério | Cartas jogadas e descartadas. Vira o deck quando ele acaba | Os dois |
| Cortadas | Cartas fora do combate | Os dois |

No fim do combate, o deck da run volta inteiro, com upgrades e selos.

## Odds e informação

A mão é secreta, mas a composição do deck é pública, e as odds são a principal ferramenta de leitura do jogo.

- As odds mostram a porcentagem de cada naipe do oponente entre as cartas que ainda podem estar na mão dele, ou seja, as que estão no deck ou na mão. O jogador não vê as próprias odds na tela, porque já sabe o que tem.
- Cartas Marcadas aparecem à parte, como certeza (por exemplo, "1 tesoura certa na mão").
- O Curinga aparece como "?", separado dos três naipes.
- Sem a mão acumulada, as odds refletem quase só a composição do deck. Um deck com muita pedra fica previsível, e esse é o preço de se especializar num naipe.

| Informação | Quem vê |
| --- | --- |
| Cartas exatas da mão | Só o dono, menos as Marcadas |
| Efeitos das cartas na mão | Só o dono, até a revelação |
| Odds de cada naipe | Cada um vê as do outro |
| Cemitério e Cortadas | Os dois |
| Anúncio de chefão | O jogador, antes da escolha |

## Naipes e arquétipos

Cada naipe tem uma personalidade, e os 4 arquétipos atravessam os três naipes, com uma carta rara de cada arquétipo em cada naipe.

### Naipes

| Naipe | Personalidade | Nos efeitos |
| --- | --- | --- |
| Pedra | Aguenta | Ganha com empates e com derrotas; recompensa a paciência |
| Papel | Controla | Mexe na mão e na informação |
| Tesoura | Ataca | Dano alto quando vence, sem defesa quando perde |

Não existem passivas de naipe: vencer com um naipe só causa o dano normal.

### Arquétipos

| Arquétipo | Direção única | Exemplos |
| --- | --- | --- |
| Investida | Causar mais dano ao vencer | Pedrada, Guilhotina, Fóssil |
| Muralha | Ganhar empates e sofrer menos dano. Brilha na Blitz, quando o empate dá dano | Seixo, Monólito, Bainha |
| Arquivo | Controlar a mão: guardar cartas e escolher o que vem | Cascalho, Rascunho, Testamento |
| Leitura | Marcar cartas do oponente e punir cartas marcadas | Cristal, Mapa, Bisturi |

**Arquétipo ativo:** com 3 cartas de um arquétipo no deck, ele fica ativo. A Loja passa a oferecer mais cartas dele, e os omamoris dele podem aparecer.

## Cartas

O jogo tem 27 cartas: 3 Comuns, 12 Raras, 9 Lendárias e 3 Prismáticas. Além delas há 2 especiais, que só saem na Mesa do Apostador, e as cartas Troféu dos chefões.

### Raridades

| Raridade | O que é | Preço na Loja |
| --- | --- | --- |
| Comum | Vanilla, sem efeito | 1 |
| Rara | Um efeito simples | 3 |
| Lendária | Uma regra própria | 6 |
| Prismática | Quebra uma regra do jogo. No máximo 1 por deck | 10 |
| Especial | Dinamite e Curinga. No máximo 1 de cada por deck | Só na Mesa do Apostador |
| Troféu | Carta de chefão | Só no espólio |

### Upgrade

- Cada carta pode receber **um** upgrade, marcado com "+" no nome. O upgrade é comprado na Loja.
- Nas Comuns, o upgrade dá Vencer: +1 de dano.
- **Regra de desenho:** nenhuma Rara pode fazer o mesmo que uma Comum melhorada. Toda Rara tem algo além de 2 de dano ao vencer.

### Comuns (3)

| Carta | Naipe | Efeito | Com upgrade |
| --- | --- | --- | --- |
| Pedra | Pedra | Nenhum | Vencer: +1 de dano |
| Papel | Papel | Nenhum | Vencer: +1 de dano |
| Tesoura | Tesoura | Nenhum | Vencer: +1 de dano |

### Raras (12)

| Carta | Naipe | Arquétipo | Efeito | Com upgrade |
| --- | --- | --- | --- | --- |
| Pedrada | Pedra | Investida | Vencer: 2 de dano. Empatar: o oponente sofre 1 | Vencer: 3 de dano |
| Multa | Papel | Investida | Vencer: 1 de dano agora e mais 1 no fim de cada uma das 2 próximas rodadas | 2 agora |
| Estilete | Tesoura | Investida | Vencer: 2 de dano, ou 3 se for a primeira carta que você joga no combate | 3, ou 4 |
| Seixo | Pedra | Muralha | Ganha empates | E cura 1 ao ganhar um empate |
| Papelão | Papel | Muralha | Perder: você não sofre dano | E guarda 1 carta da mão |
| Bainha | Tesoura | Muralha | Empatar: fica na mão | E, na Blitz, esse empate não te dá dano |
| Cascalho | Pedra | Arquivo | Perder: guarda as outras cartas da mão | E Mão +1 |
| Rascunho | Papel | Arquivo | Jogar: no próximo turno, uma das cartas que você compra é do naipe que você escolher (se houver no deck) | Duas das cartas |
| Recorte | Tesoura | Arquivo | Vencer: guarda 1 carta da mão, que fica Marcada | Ela não fica Marcada |
| Cristal | Pedra | Leitura | Jogar: marca a carta do topo do deck do oponente | As 2 do topo |
| Bilhete | Papel | Leitura | Vencer: no próximo turno, 1 carta aleatória da mão do oponente fica Marcada | Ativa ao Jogar, não só ao Vencer |
| Abridor de cartas | Tesoura | Leitura | Vencer contra carta Marcada: 3 de dano | 4 de dano |

### Lendárias (9)

| Carta | Naipe | Arquétipo | Efeito | Com upgrade |
| --- | --- | --- | --- | --- |
| Monólito | Pedra | Muralha | Ganha todos os empates. Quando ganha um, fica na mão | E cura 1 |
| Fóssil | Pedra | Investida | Vencer: 1 de dano por pedra no seu cemitério (mínimo 1, máximo 4) | Mínimo 2 |
| Geodo | Pedra | Arquivo | Nunca é descartado. Vencer: 1 de dano por turno que passou na sua mão (mínimo 1, máximo 4) | Máximo 5 |
| Testamento | Papel | Arquivo | Jogar: escolha uma carta do seu cemitério. A próxima carta que você jogar ganha o efeito dela, somado ao próprio | Pode escolher também das Cortadas |
| Mapa | Papel | Leitura | Jogar: no próximo turno, todas as cartas da mão do oponente ficam Marcadas | E Vencer: +1 de dano |
| Nota de cem | Papel | Nenhum | Vencer: você ganha 1 moeda, até 3 por combate | Até 5 por combate |
| Guilhotina | Tesoura | Investida | Frágil. Vencer: 4 de dano | 5 de dano |
| Bisturi | Tesoura | Leitura | Vencer contra carta Marcada: 3 de dano, e a carta do oponente é Cortada | 4 de dano |
| Cutelo | Tesoura | Investida | Na Blitz, vencer causa o dobro do dano | E, na Blitz, empatar com ela não te dá dano |

Exemplo do Testamento: você joga o Testamento e escolhe a Guilhotina que está no cemitério. No turno seguinte, joga uma Pedra comum; se ela vencer, causa 1 mais os 4 da Guilhotina.

### Prismáticas (3)

| Carta | Naipe | Efeito | Com upgrade |
| --- | --- | --- | --- |
| Meteoro | Pedra | Frágil. Nunca é descartado e só pode ser jogado na Blitz. Causa 3 de dano ao oponente seja qual for o resultado, e você sofre 1 | Você não sofre dano |
| Origami | Papel | Frágil. Copia o efeito da última carta que você jogou neste combate, inclusive o de Lendárias | E Vencer: +1 de dano |
| Excalisoura | Tesoura | Vencer: fica na mão, e cada vitória seguida dela causa 1 a mais (1, 2, 3...). Perder ou empatar: é Cortada | Começa em 2 |

### Especiais (2)

| Carta | Naipe | Efeito | Com upgrade |
| --- | --- | --- | --- |
| Dinamite | Nenhum | Frágil. Vence qualquer naipe e causa 2 de dano. Dinamite contra Dinamite: os dois sofrem 2 | 3 de dano |
| Curinga | Muda | Nunca é descartado. Na mão, muda de naipe no início de cada rodada (pedra, papel, tesoura). Você vê o naipe atual e o próximo | Vencer: +1 de dano |

Só a Dinamite vence qualquer naipe. O Meteoro causa dano sem precisar vencer, mas a rodada continua seguindo o triângulo normal.

## Selos

São 5 selos, um ligado a cada arquétipo e um geral. Cada carta tem no máximo um, e eles são comprados na Loja.

| Selo | O que faz | Combina com |
| --- | --- | --- |
| Pesada | Vencer: +1 de dano | Investida |
| Blindada | Não pode ser Marcada nem Cortada. Perder com ela: você sofre 1 a menos | Muralha |
| Guardada | Se não for jogada, fica na mão em vez de ser descartada (e conta nas 3) | Arquivo |
| Delatora | Quando é descartada sem ser jogada, a carta do topo do deck do oponente fica Marcada | Leitura |
| Na manga | Começa sempre na mão do primeiro turno do combate | Geral |

- Colocar um selo numa carta que já tem outro substitui o antigo, com aviso.
- A Guardada é o jeito de driblar o limite da mão: a carta fica, mas ocupa lugar.
- Saem da V3.1: Eco, Zumbi, Elétrica, Elo, Cara-limpa, Muda, Puro e Fantasma. O Camaleão virou a carta Curinga, e o Frágil virou traço de carta.

## Run e economia

Uma run tem 2 atos de 5 combates. Ela é vencida ao derrotar o chefão do ato 2 e perdida quando a vida da run chega a 0.

### Estrutura de um ato

1. Combate comum
2. Combate comum
3. Sub-chefe: você escolhe 1 entre 2, vendo a regra e a recompensa de cada um
4. Combate comum
5. Chefão: perdeu ou empatou, luta de novo

Depois de todo combate vem uma Recompensa de cartas. Em seguida vem a Loja ou a Oficina, alternando, para que cada parada tenha no máximo duas telas (três depois do chefão, com o Espólio).

| Depois do | Telas, em ordem |
| --- | --- |
| Combate 1 | Recompensa, Loja |
| Combate 2 | Recompensa, Oficina |
| Sub-chefe | Recompensa do sub-chefe, Recompensa, Loja. No ato 2, a Mesa do Apostador vem antes da Loja |
| Combate 4 | Recompensa, Oficina |
| Chefão | Espólio, Recompensa, Loja |

### Início

- O jogador começa com 6 vanillas (2 de cada naipe), sem omamori e sem dinheiro.
- O primeiro combate é sempre vanilla: os dois lados têm 6 vanillas e 3 de vida, a Blitz começa na rodada 4, e o inimigo mantém a personalidade.
- Depois desse combate, vencendo ou não, o jogador escolhe o omamori inicial entre 3 básicos. Só então vêm a primeira Recompensa e a primeira Loja.

### Vida da run

| Resultado | Combate comum ou sub-chefe | Chefão |
| --- | --- | --- |
| Vitória | Segue | Segue (ou vence a run, no ato 2) |
| Empate | -1 de vida da run e segue | -1 de vida da run e luta de novo |
| Derrota | -3 de vida da run e segue | -3 de vida da run e luta de novo |

A vida da run começa em 10.

### Dinheiro

| Fonte | Moedas |
| --- | --- |
| Vitória | 3 |
| Empate | 2 |
| Derrota | 1 |
| Vencer um chefão | +3 |
| Pular a Recompensa | 2 |
| Pular a Oficina | 1 |
| Recompensa de sub-chefe | Varia (ver Sub-chefes) |
| Carta Nota de cem, omamori Cofre | Ver cada um |

O dinheiro acumula pela run inteira. Não gastar numa Loja é o jeito de guardar para algo caro.

### Tamanho do deck

O alvo é terminar a run com 14 a 18 cartas. Com a mão de 3, uma carta específica aparece em 21% dos turnos num deck de 14, e em 17% num deck de 18. Preços e recompensas são ajustados para manter o deck nessa faixa.

A Recompensa sozinha pode dar até 10 cartas na run. A Loja serve mais para Raras e Lendárias, upgrades, selos e omamoris, e a remoção ajuda a manter o deck na faixa.

## Recompensa e Oficina

Depois de todo combate vem uma Recompensa com 1 carta grátis, e depois dos combates 2 e 4 de cada ato vem a Oficina, com 1 upgrade grátis.

### Recompensa

- 3 cartas, uma de cada naipe. O jogador escolhe 1, que entra no deck, ou pula e ganha 2 moedas.
- Aparece também depois de empate ou derrota.
- Cada carta aparece só na versão atual, sem o upgrade ao lado.
- A raridade é sorteada para cada carta. Prismáticas não aparecem aqui.
- **Arquétipo ativo:** mesma regra da Loja.

| Ato | Comum | Rara | Lendária |
| --- | --- | --- | --- |
| 1 | 50% | 45% | 5% |
| 2 | 35% | 50% | 15% |

### Oficina

- Grátis: o jogador escolhe 1 carta do deck para receber o upgrade, ou pula e ganha 1 moeda.
- Só aqui cada carta mostra a versão atual e a versão "+" lado a lado, porque a escolha é justamente o upgrade.
- Cartas já melhoradas aparecem apagadas, com o aviso "já melhorada".
- A Loja continua vendendo upgrades extras.

## Loja

A Loja aparece depois dos combates 1, 3 (sub-chefe) e 5 (chefão) de cada ato, e vende o que a Recompensa e a Oficina não dão de graça. O jogador compra quantas coisas puder pagar, ou sai sem gastar.

### O que tem à venda

| Item | Preço | Regras |
| --- | --- | --- |
| 3 cartas, uma de cada naipe | Pela raridade: 3, 6 ou 10 | Só Raras ou melhores. Cada carta só pode ser comprada uma vez |
| 1 omamori | 6 | Sorteado pelas regras dos omamoris. Some se o jogador já tiver 5 |
| 1 selo sorteado | 3 | Substitui o selo antigo da carta, com aviso |
| Upgrade | 2 | Uma vez por carta |
| Remover carta | 2 | O deck não fica com menos de 6 |
| Renovar as cartas | 1 | Sorteia 3 cartas novas. Uma vez por Loja |

As cartas aparecem só na versão atual, sem o upgrade ao lado. O selo à venda aparece com o nome em destaque, em negrito numa etiqueta colorida, e a explicação logo abaixo.

### Raridade das cartas

A raridade é sorteada para cada uma das 3 cartas, separadamente.

| Ato | Rara | Lendária | Prismática |
| --- | --- | --- | --- |
| 1 | 80% | 20% | 0% |
| 2 | 60% | 32% | 8% |

- Prismática só aparece se o deck ainda não tiver uma. Se não puder, vira Lendária.
- **Arquétipo ativo:** quando a carta sorteada é Rara ou Lendária, ela tem 50% de chance de ser do arquétipo ativo, se houver carta dele naquele naipe e raridade.
- Dinamite, Curinga e cartas Troféu nunca aparecem na Loja.

## Mesa do Apostador

A Mesa do Apostador é uma aposta de verdade: você arrisca algo valioso pela chance de levar a Dinamite ou o Curinga, que só saem por aqui.

- **Quando:** uma vez por run, no ato 2, entre o sub-chefe e a Loja. Pode ser recusada.
- **Aposta:** 1 Lendária do deck ou 8 moedas.
- **Jogo:** melhor de 3 rodadas de jokenpô sem cartas. Cada rodada, você escolhe pedra, papel ou tesoura livremente. Empate repete a rodada.
- **O Apostador joga ao acaso.** Não há padrão para ler: é sorte pura, e isso é o ponto.
- **Ganhou:** escolhe a Dinamite ou o Curinga. Se já tiver um deles, leva o outro.
- **Perdeu:** perde o que apostou.
- Se o deck já tiver as duas cartas, a Mesa não aparece.

## Omamoris

Omamoris são os itens passivos que valem pela run inteira, fora do deck (antes chamados de relíquias). São 16, mais um de cada chefão, e cada run tem no máximo 5, sem repetir.

### Onde aparecem

| Momento | Oferta |
| --- | --- |
| Depois do primeiro combate | 1 entre 3 básicos |
| Toda Loja | 1 omamori à venda, por 6 moedas |
| Recompensa do Espião e do Teimoso | 1 entre 2 |
| Espólio do chefão | O omamori do chefão, garantido, mais 1 escolha (ver Espólio) |

Com 3 Lojas por ato e o omamori garantido do chefão, uma run normal chega a 3 ou 4 omamoris, e quem guarda dinheiro chega a 5.

Toda oferta tem pelo menos uma opção neutra. Omamoris de arquétipo só aparecem com o arquétipo ativo.

### Básicos (4)

| Omamori | Efeito |
| --- | --- |
| Rocha-Mãe | A primeira vez em cada combate que você vencer com pedra, cura 1 |
| Grampeador | A primeira vez em cada combate que você vencer com papel, Mão +1 no próximo turno |
| Pedra de Amolar | A primeira tesoura que vencer em cada combate causa +1 de dano |
| Lente | No início de cada combate, 1 carta aleatória da mão do oponente fica Marcada |

### De arquétipo (4)

| Omamori | Arquétipo | Efeito |
| --- | --- | --- |
| Fio de Navalha | Investida | Vencer causando 3 ou mais de dano: cura 1 |
| Alicerce | Muralha | A primeira derrota sua em cada combate não causa dano |
| Caderno | Arquivo | Uma vez por combate, guarde 1 carta da mão |
| Lupa | Leitura | Vencer contra uma carta Marcada: cura 1 |

### Neutros (8)

| Omamori | Efeito |
| --- | --- |
| Cofre | +1 moeda depois de cada combate |
| Cupom | Tudo na Loja custa 1 a menos (mínimo 1) |
| Seguro | A próxima derrota da run custa 1 de vida da run em vez de 3 (uma vez) |
| Relógio Quebrado | O primeiro empate na Blitz de cada combate não causa dano a você |
| Estopim | Quando a Blitz começa, você cura 1 |
| Fusível | Quando a Blitz começa, o oponente sofre 1 |
| Coroa de Papel | Na primeira rodada de cada combate, você vence empates |
| Mochila | Sua mão passa a ter 4 cartas. Só aparece a partir do ato 2 |

## Inimigos e chefes

Todo inimigo joga com um arquétipo: tem um deck montado em volta dele e um estilo que a IA segue, além de uma tendência mostrada antes da luta. Inimigos comuns e sub-chefes têm decks mais leves, com mais vanillas; os chefões têm decks completos.

### Como a IA joga

- Escolhe por pesos de naipe, definidos pela personalidade, dentro da própria mão de 3.
- Usa a mesma informação pública que o jogador: odds e cartas Marcadas. Se um naipe do jogador passa de 50% nas odds, ela aumenta o peso do naipe que o vence.
- Prefere cartas cuja condição está cumprida, como o Cutelo na Blitz ou o Abridor de cartas contra uma Marcada.
- Os decks dos inimigos ganham cerca de 1 upgrade a cada 2 combates. No ato 2, eles têm Raras e Lendárias.

| Arquétipo do inimigo | O que a IA prioriza |
| --- | --- |
| Investida | Joga as cartas de dano quando a chance de vencer passa de 50%. Guarda as Frágeis para quando tiver certeza (carta Marcada ou odds altas) |
| Muralha | Joga as cartas que ganham empate quando o naipe mais provável do jogador é o mesmo da carta dela. Na Blitz, prefere empatar |
| Arquivo | Guarda as Lendárias e as cartas de dano até a condição estar cumprida. Usa o Rascunho para pedir o naipe que vence o mais provável do jogador |
| Leitura | Marca primeiro e ataca as Marcadas depois |
| Blitz | Gasta as cartas fracas antes da Blitz e guarda as cartas de Blitz para ela |
| Blefe | Só o Trapaceiro (ver Chefões) |

### Inimigos comuns

Aparecem nos dois atos. No ato 2, o deck ganha as cartas da última coluna e 2 upgrades.

| Inimigo | Arquétipo | Tendência mostrada | Estilo | Deck no ato 1 | Entra no ato 2 |
| --- | --- | --- | --- | --- | --- |
| O Rochedo | Muralha | "Gosta de pedra" | Joga pedra 55% das vezes e usa o Seixo quando espera um empate | 4 Pedra, Papel, Tesoura, Seixo, Papelão | Monólito, Bainha |
| A Copiadora | Arquivo | "Imita você" | 50% de chance de repetir o naipe que você jogou na rodada anterior, e usa o Rascunho para pedir esse naipe | 2 de cada vanilla, Rascunho, Cascalho | Recorte, Geodo |
| O Vingativo | Investida | "Não esquece uma derrota" | Depois de perder, 70% de chance de jogar o naipe que venceria a sua última carta, com a carta de mais dano | 2 Tesoura, Pedra, Papel, Estilete, Pedrada, Multa | Guilhotina, Fóssil |
| O Do Contra | Blitz | "Nunca repete" | Nunca joga o mesmo naipe duas rodadas seguidas; guarda a Bainha para a Blitz | 2 de cada vanilla, Bainha, Seixo | Cutelo, Pedrada |
| A Leitora | Leitura | "Confia nas odds" | 60% de chance de jogar o naipe que vence o seu mais provável; marca antes de atacar | 2 de cada vanilla, Cristal, Bilhete, Abridor de cartas | Mapa, Bisturi |

### Sub-chefes

No 3º combate de cada ato, o jogo sorteia 2 sub-chefes, e o jogador escolhe qual enfrentar. Cada um tem 6 de vida, uma regra e uma recompensa, além das moedas normais do combate.

| Sub-chefe | Arquétipo | Regra | Deck | Recompensa |
| --- | --- | --- | --- | --- |
| O Quebradiço | Investida | 2 cartas aleatórias suas ficam Frágeis neste combate | 4 vanillas, Guilhotina, 2 Estilete, Pedrada | 1 Lendária à escolha entre 2 |
| O Espião | Leitura | A cada 2 rodadas, 1 carta da sua mão fica Marcada (no Mão aberta: suas cartas nunca ficam Secretas) | 4 vanillas, Cristal, Bilhete, Abridor de cartas, Bisturi | 1 omamori à escolha entre 2 |
| O Ganancioso | Arquivo | Tem 8 de vida em vez de 6 | 4 vanillas, Nota de cem, Cascalho, Rascunho, Geodo | 6 moedas |
| O Teimoso | Muralha | Vence todos os empates | 4 vanillas, 2 Seixo, Monólito, Papelão | 1 omamori à escolha entre 2 |
| O Apressado | Blitz | A Blitz começa na rodada 3 neste combate | 4 vanillas, Cutelo, Bainha, Pedrada, Estilete | 2 upgrades grátis |
| A Ladra | Investida | Cada vez que ela vence uma rodada, você perde 1 moeda | 4 vanillas, Multa, Estilete, Recorte, Nota de cem | Devolve o que roubou, mais 5 moedas |
| O Embaralhador | Arquivo | Sua mão é de 2 cartas neste combate | 4 vanillas, Rascunho, Cascalho, Testamento, Recorte | 1 Lendária à escolha entre 2 |
| O Gêmeo | O seu | Joga com uma cópia do seu deck e com o seu arquétipo ativo | Cópia do seu | 1 upgrade grátis e 3 moedas |

No ato 2, os decks dos sub-chefes ganham 2 upgrades. Os 4 vanillas são sempre de naipes variados, puxando para o naipe das cartas do arquétipo.

Se o jogador empatar ou perder contra o sub-chefe, não recebe a recompensa e segue em frente.

### Chefões

Cada chefão joga com um arquétipo, como um jogador faria: tem um deck montado em volta dele, um poder próprio e um estilo de jogo que a IA segue. O chefão do ato é sorteado entre 3. Antes da luta, a tela mostra o arquétipo, o poder, o estilo em uma frase, a carta Troféu e o omamori. Chefões têm 6 de vida no ato 1 e 7 no ato 2, e o deck do ato 2 vem com 2 upgrades.

**Tampar cartas:** no modo Mão aberta, todo chefão deixa 1 carta da própria mão Secreta a cada turno (a Ilusionista deixa 2). No modo normal, a mão dele já é escondida.

| Chefão | Ato | Arquétipo | Poder | Estilo (o que a IA prioriza) | Deck |
| --- | --- | --- | --- | --- | --- |
| O Pedreiro | 1 | Muralha | **Muralha viva:** vence os empates na Blitz e cura 1 a cada empate que vence | Segura o jogo até a Blitz; joga cartas que ganham empate quando espera um empate | 4 Pedra, 2 Seixo, Monólito, Papelão, Pedrada, Pedra Angular |
| A Arquivista | 1 | Arquivo | **Arquivo morto:** no fim de cada turno, guarda 1 carta (a mais forte). No Mão aberta, a guardada fica Secreta | Monta a mão antes de atacar; guarda as Lendárias para a hora certa | 2 Papel, 2 Rascunho, Cascalho, Recorte, Geodo, Testamento, Pedra, Fichário |
| O Duelista | 1 | Investida | **Embalo:** cada vitória dele dá +1 de dano na vitória seguinte, até +2; perder zera | Ataca desde a primeira rodada; depois de vencer, tende a repetir o naipe (70%) | 2 Tesoura, 2 Estilete, Pedrada, Multa, Guilhotina, Pedra, Papel, Florete |
| A Ilusionista | 2 | Leitura | **Véu:** no modo normal, marca 1 carta sua a cada 2 rodadas. No Mão aberta, deixa 2 cartas dela Secretas por turno | Joga primeiro as cartas de marcar e depois pune as Marcadas | 2 Pedra, 2 Papel, 2 Tesoura, Cristal, Bilhete, Mapa, Abridor de cartas, Bisturi, Biombo |
| O Trapaceiro | 2 | Blefe | **Conversa fiada:** anuncia o naipe toda rodada (no Mão aberta, a carta). A regra de quando mente fica escondida; a tela mostra só a pista "Não acredite em nada do que ele diz." (ele sempre mente) | Anuncia a carta que você mais teme; joga o Curinga quando o naipe da vez vence o seu mais provável | 2 de cada vanilla, Curinga, Rascunho, Recorte, Estilete, Seixo, Ás na Manga |
| O Relojoeiro | 2 | Blitz | **Adiantado:** contra ele, a Blitz começa na rodada 4 | Gasta as cartas fracas cedo e guarda Cutelo e Meteoro para a Blitz | 2 Pedra, 2 Tesoura, Papel, Cutelo, Bainha, Seixo, Meteoro, Pedrada, Monólito, Ponteiro |

### Cartas Troféu e omamoris dos chefões

| Chefão | Carta Troféu | Omamori |
| --- | --- | --- |
| O Pedreiro | **Pedra Angular** (Pedra): ganha empates. Na Blitz, Vencer: 2 de dano | **Fundação:** sua vida máxima no combate é 6 em vez de 5 |
| A Arquivista | **Fichário** (Papel): Jogar: guarda as outras cartas da mão. Vencer: 2 de dano | **Pasta:** sua primeira mão de cada combate tem 4 cartas |
| O Duelista | **Florete** (Tesoura): Vencer: 2 de dano e fica na mão (no máximo 2 vezes por combate) | **Luva de Duelo:** sua primeira vitória em cada combate causa +1 |
| A Ilusionista | **Biombo** (Papel): no modo normal, nunca é Marcado; no Mão aberta, é sempre Secreto. Vencer: 2 de dano | **Véu:** no modo normal, suas cartas não podem ser Marcadas; no Mão aberta, 1 carta aleatória sua fica Secreta a cada turno |
| O Trapaceiro | **Ás na Manga** (Papel): nunca é descartado. Vencer: 2 de dano | **Cartola:** uma vez por combate, troque 1 carta da mão pela do topo do deck |
| O Relojoeiro | **Ponteiro** (Tesoura): na Blitz, Vencer: 3 de dano | **Relógio de Bolso:** na Blitz, você vence empates |

Com upgrade, toda carta Troféu causa +1 de dano. O deck só pode ter 1 de cada.

### Espólio

Ao vencer o chefão, o jogador ganha 3 moedas a mais e o omamori do chefão, e ainda escolhe 1 entre a carta Troféu e 1 omamori sorteado.

## Interface

A V4 volta ao visual de protótipo: formas simples, cores lisas e texto legível. O visual V3.1 aprovado fica guardado no canvas, na página Histórico, para voltar quando o sistema assentar.

### Regras do protótipo

- **Cores dos naipes:** pedra marrom (#8c7663), papel azul (#3d8fd6), tesoura laranja (#e05a2b). Sem texturas, sombras ou acabamentos (foil e fullart ficam para depois).
- **Carta:** retângulo com uma faixa da cor do naipe, o símbolo do naipe, o nome, a raridade como uma bolinha de cor e o efeito, com a condição em destaque (Vencer, Perder, Empatar, Jogar).
- **Estados:** Marcada com borda ciano e um ícone de olho. Frágil com um ícone de rachadura. Cartas cortadas vão para a pilha Cortadas.
- **Upgrade:** nome em verde e "+" no fim.
- **Sem imagens geradas por IA:** só formas e cores.
- Layout vertical, em coluna, no computador e no celular (390 × 844). No computador, a coluna fica centralizada.

### Mesa de combate

A mesa é uma coluna: tudo do inimigo fica em cima, tudo do jogador fica embaixo, e as odds do inimigo ficam no centro da tela, sem precisar olhar para o lado.

1. **Trilha da run**, compacta, no topo.
2. **Inimigo:** nome e tendência, vida, omamoris, contadores de deck e cemitério, cartas Marcadas dele. O balão de anúncio do chefão sai daqui.
3. **Odds do inimigo**, centralizadas: uma barra com as três cores e as porcentagens embaixo.
4. **Mesa:** a carta do jogador à esquerda e a do inimigo à direita, com a rodada e quantas faltam para a Blitz ("Rodada 4 · Blitz em 2").
5. **Jogador:** vida, omamoris, contadores de deck, cemitério e Cortadas. Sem as próprias odds.
6. **Mão** de 3, na base.

```
+--------------------------------------+
|        Trilha da run (compacta)      |
+--------------------------------------+
|      INIMIGO: nome e tendência       |
| vida · omamoris · deck/cemit. · Marc.|
|        (balão de anúncio)            |
+--------------------------------------+
|              Odds dele               |
|  [==== Pedra 50% ===|= Papel 30% =|T]|
+--------------------------------------+
|        Rodada 4 · Blitz em 2         |
|   +---------+   Pô!   +---------+    |
|   |   SUA   |         |  CARTA  |    |
|   |  CARTA  |         |  DELE   |    |
|   +---------+         +---------+    |
+--------------------------------------+
|                 VOCÊ                 |
| vida · omamoris · deck/cemit./Cortad.|
+--------------------------------------+
|   [carta]     [carta]     [carta]    |
+--------------------------------------+
```

### Ritmo do combate

O combate precisa de um toque por rodada.

- **Tocar na carta joga.** Não há botão de confirmar. Segurar a carta (celular) ou deixar o mouse parado nela por 1 segundo (computador) mostra os detalhes. Quem quiser confirmar pode ligar a opção "Confirmar jogada" no menu, desligada por padrão.
- **Contagem:** antes da Blitz, "Jo… Ken… Pô!". Durante a Blitz, "Jo… Ken… Blitz!". Dura menos de 1 segundo, e um toque pula.
- **Resultado automático:** dano, efeitos e descarte acontecem sozinhos, e a próxima rodada começa depois de cerca de 1,5 segundo. Um toque na tela pula a espera.
- **Escolhas de efeito** (qual carta guardar, o naipe do Rascunho, a carta do Testamento) aparecem como uma linha de botões na própria mesa, sem janela.
- **Fim do combate:** uma tela de resultado com um botão só, "Continuar".
- **Velocidade:** Normal ou Rápida, no menu.

### Telas

| Tela | O que tem |
| --- | --- |
| Combate | Ver Mesa de combate, acima |
| Recompensa | 3 cartas, uma de cada naipe, só na versão atual, e Pular (+2 moedas) |
| Oficina | Cartas do deck com a versão atual e a "+" lado a lado, e Pular (+1 moeda) |
| Loja | 3 cartas com preço (só a versão atual), 1 omamori, 1 selo com o nome em destaque, upgrade, remoção, renovar e o seu dinheiro |
| Escolha do sub-chefe | Os 2 sub-chefes lado a lado, cada um com a regra e a recompensa |
| Antes do chefão | Arquétipo, poder, estilo, carta Troféu e omamori |
| Espólio | O omamori do chefão e a escolha entre a carta Troféu e 1 omamori |
| Mesa do Apostador | O que você aposta, o prêmio e o placar da melhor de 3 |
| Omamori inicial | 1 entre 3 básicos |
| Trilha da run | Os 2 atos, com o combate atual, os sub-chefes e os chefões |
| Menu e fim de run | Iniciar, continuar, opções (Confirmar jogada, Velocidade); resumo da run no fim |

Saem da tela de combate: o seletor de anúncio, a credibilidade, a Corrente, as Camadas, as odds do próprio jogador, o botão de confirmar e o botão de próxima rodada. Saem as telas de booster, Oficina, Ateliê, Escambo e Troca.

## Modo de teste: Mão aberta

O Mão aberta é um modo experimental, escolhido no menu antes da run, para comparar na prática com o modo normal. Nele, as duas mãos ficam visíveis o tempo todo, e o estado Marcada vira o seu contrário: **Secreta**.

### Regras do modo

- As 3 cartas de cada mão, com os efeitos, ficam visíveis para os dois lados. O deck continua escondido.
- **Secreta:** a carta aparece virada para o oponente enquanto estiver na mão. Some quando a carta é jogada ou descartada. Os inimigos também têm cartas Secretas: todo chefão tampa 1 carta por turno (a Ilusionista, 2), e no ato 2 os inimigos comuns trazem 1 ou 2 cartas com o selo Sigilosa.
- As odds mostram só o deck do oponente (as próximas compras), numa barra menor.
- O anúncio dos chefões continua: agora ele diz qual das 3 cartas visíveis o chefão vai jogar, e a regra de verdade ou mentira vale do mesmo jeito.
- **IA:** dá um peso a cada carta da mão do jogador, maior para as que têm efeito ativável e para as que venceriam as cartas dela, e escolhe a carta que vence a mais provável. A decisão final mistura 60% dessa leitura com 40% dos pesos da personalidade. Cartas Secretas do jogador ficam fora da leitura.

### O que muda nas cartas

Só o que envolve Marcada muda. Tudo o mais é igual ao modo normal.

| Carta, selo ou omamori | No modo Mão aberta |
| --- | --- |
| Cristal | Jogar: revela 1 carta Secreta do oponente. Se ele não tiver nenhuma, revela a carta do topo do deck dele |
| Bilhete | Vencer: no próximo turno, 1 carta sua à escolha fica Secreta |
| Mapa | Jogar: no próximo turno, todas as suas cartas ficam Secretas |
| Abridor de cartas | Nasce Secreto: nunca aparece para o oponente na mão. Vencer: 3 de dano |
| Bisturi | Nasce Secreto: nunca aparece para o oponente na mão. Vencer: 3 de dano, e a carta do oponente é Cortada |
| Recorte | Vencer: guarda 1 carta da mão (sem custo, porque tudo já é visível). Upgrade: ela fica Secreta |
| Selo Delatora | Vira **Sigilosa:** a carta é sempre Secreta |
| Selo Blindada | Não pode ser revelada nem Cortada. Perder com ela: sofre 1 a menos |
| Lente | No início de cada combate, 1 carta sua fica Secreta |
| Lupa | Vencer com uma carta Secreta: cura 1 |
| Sub-chefe Espião | Suas cartas nunca ficam Secretas neste combate |

### O que observar no teste

- Se as rodadas viram um duelo de adivinhação mais interessante, ou se travam o jogo com análise demais.
- Se a IA fica forte demais lendo a sua mão, ou fácil demais de enganar.
- Se o arquétipo Leitura fica mais divertido com Secreta do que com Marcada.

## Pendências

Todos os números da V4 são um ponto de partida, ainda não testados. Os primeiros a conferir, jogando ou no simulador:

- [ ] Tamanho do deck no fim da run (alvo: 14 a 18)
- [ ] Preços da Loja e moedas por resultado
- [ ] Chances de raridade por ato
- [ ] Força do Geodo, da Guilhotina, da Excalisoura e da Mochila
- [ ] Vida dos sub-chefes e dos chefões
- [ ] Valor da aposta em moedas na Mesa do Apostador (hoje 8)
- [ ] Se os inimigos que jogam ao acaso ou por peso ficam fáceis demais sem o anúncio

Ainda a decidir:

- [ ] Os fantasmas (decks de outros jogadores) continuam na V4? Até decidir, ficam desligados.
- [ ] Nomes finais dos omamoris novos e das cartas Troféu
