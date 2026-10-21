# Passagem para o Claude Code: Jokenblitz V4

Este arquivo tem duas partes: este roteiro de migração e, logo depois, a **Especificação V4** completa.

A V4 é uma simplificação grande do jogo. O código atual é a V3 (ou a V3.1, se a passagem anterior já foi aplicada). O roteiro vale para os dois casos, porque quase tudo o que muda é **remoção**: sai muito sistema, entra pouco.

- **Fonte da verdade:** a Especificação. Se este roteiro e ela discordarem, vale a Especificação.
- **Remover de verdade:** o que sai deve sair do código, dos dados, dos textos e dos testes, e não só ficar escondido atrás de uma opção.
- **Visual:** a V4 volta ao visual de protótipo (ver Interface na Especificação). **Não implementar** o visual V3.1 nem as telas do `JOKENBLITZ_V3_1_VISUAL.zip`. Eles ficam guardados para depois.
- **Nomes:** "relíquias" passam a se chamar **omamoris** em todo o jogo (código, dados e telas). Os "modificadores" continuam se chamando **selos**.
- **Texto das cartas:** continua com a condição na etiqueta (Vencer, Perder, Empatar, Jogar).
- **Números:** nenhum número da V4 foi simulado. Todos ficam em `data/` para ajuste.

## O que fica como está

- Arquitetura, pastas, `montar_artefato.py`, testes em node e no Chromium.
- O núcleo do combate: triângulo clássico, dano de 1 por vitória, empate sem dano fora da Blitz, Blitz na rodada 6 com 1 de dano para cada lado no empate, limite de 12 rodadas.
- Deck inicial de 6 vanillas (2 de cada naipe) e primeira luta vanilla.
- A estrutura da trilha da run no topo (o conteúdo muda).
- O sistema de chefes com carta e omamori próprios (o conteúdo muda).
- Personalidades dos inimigos como pesos de naipe (a lista muda).
- Tutorial com O Treinador e dicas de primeira vez (o conteúdo muda, a estrutura não).

## O que sai

| Sistema | Onde mexer |
| --- | --- |
| Anúncio do jogador inteiro: Verdade, Mentira, Silêncio, credibilidade, Golpe, Palavra cumprida, credulidade da IA, opção no menu | `config`, `motor`, `ia`, `ui-combate`, `textos`, menu |
| Corrente (Combo) e Camadas (Sedimento) | `motor`, `efeitos`, `ui-combate` |
| Estados Lacrada, Exaustão e Cega (se ainda existir) | `motor`, `ia`, `ui-combate`, `textos` |
| Compra de 1 por rodada, limite de mão 6 e queima de carta | `config`, `motor` |
| Efeitos que adiantam ou atrasam a Blitz | `cards`, `efeitos` |
| Boosters (todos os pacotes, catálogo, sorteio, telas) | `boosters`, `run`, `ui-eventos` |
| Eventos Oficina, Ateliê, Escambo e Troca | `run`, `ui-eventos`, trilha |
| Pontos de oficina e valor de escambo | `run`, `config` |
| Todas as cartas que não estão na lista da V4, inclusive Mestres do Clássico e as Prismáticas antigas | `cards`, `efeitos` |
| Selos Eco, Zumbi, Elétrica, Elo, Cara-limpa, Muda, Puro, Fantasma e Camaleão | `cards`, `run` |
| Relíquias que não estão na lista de omamoris | `reliquias` |
| Tags de arquétipo antigas e a regra de naipe com 40% do deck | `cards`, `run` |
| Cartas Ocultas, limite de Ocultas, Neblina e Disfarce nas odds | `motor`, `ui-combate` |
| Acabamentos Foil, Full Art e Gravada; raridade Incomum; raridade Proibida | `cards`, `style.css` |
| Meta de 8 vitórias e chefes fixos nos combates 4 e 8 | `run`, `config` |

## O que entra

| Área | V4 | Onde mexer |
| --- | --- | --- |
| Mão | Sempre 3 por turno. No fim do turno, o que não foi jogado vai para o cemitério, menos as cartas guardadas. Cartas guardadas contam nas 3. **Mão +1** completa até 4 só no turno seguinte | `config`, `motor`, `ui-combate` |
| Nunca descartadas | Geodo, Meteoro, Curinga e Ás na Manga ficam na mão até serem jogados | `motor` |
| Frágil | Traço impresso na carta: depois de jogada, vai para as Cortadas e volta no combate seguinte. O sub-chefe Quebradiço aplica Frágil só durante a luta | `cards`, `motor`, `ui-base` |
| Marcada | Revelada para o oponente, na mão ou no topo do deck. Conta como certeza nas odds. **Sem bônus de dano** | `motor`, `ia`, `ui-combate` |
| Cartas | 27 cartas, 2 especiais e 6 cartas Troféu, com 4 tags de arquétipo (Investida, Muralha, Arquivo, Leitura) | `cards`, `efeitos` |
| Raridades | Comum (vanilla), Rara, Lendária, Prismática, Especial, Troféu | `cards`, `ui-base` |
| Dinheiro | Moedas por resultado de combate; acumulam na run | `run`, `config`, `ui-run` |
| Loja | Depois de todo combate: 3 cartas (uma de cada naipe) com preço, upgrade, remoção, 1 selo e renovar | `run`, `ui-eventos` (tela nova) |
| Selos | 5: Pesada, Blindada, Guardada, Delatora, Na manga | `cards`, `run` |
| Run | 2 atos de 5 combates. Vence ao derrotar o chefão do ato 2 | `run`, `ui-run`, trilha |
| Sub-chefes | No 3º combate de cada ato, escolher 1 entre 2 sorteados; 8 sub-chefes com regra e recompensa | `enemies`, `run`, `ui-eventos` (tela nova) |
| Chefões | 6, três por ato. Quase todos anunciam o naipe com uma regra fixa. Perder ou empatar: luta de novo | `enemies`, `ia`, `run`, `ui-combate` |
| Mesa do Apostador | Uma vez por run, no ato 2: melhor de 3 de jokenpô contra um oponente aleatório, apostando 1 Lendária ou 8 moedas, pela Dinamite ou pelo Curinga | `run`, `ui-eventos` (tela nova) |
| Omamoris | 16, mais 6 dos chefões. Máximo 5 por run | `reliquias` (renomear para `omamoris`), `motor` |
| Inimigos | Rochedo, Copiadora, Vingativo, Do Contra, Leitora | `enemies`, `ia` |
| Salvamento | Chave nova (`jokenblitz_save_v4`). Uma run salva de versão anterior é descartada com um aviso | `run`, `ui-main` |

## Como fazer

**Fazer a V4 inteira de uma vez, sem parar para o André testar no meio.** A entrega é o jogo completo da V4 funcionando.

Tudo isto entra na mesma passada:

- Remover tudo da tabela "O que sai".
- Regras base: mão de 3 com descarte, guardar, Mão +1, nunca descartadas, Frágil e Cortadas, Marcada nova, odds com Marcadas e Curinga, deck mínimo 6.
- As 27 cartas, as 2 especiais e as 6 Troféu, com upgrades, tags e a regra de arquétipo ativo.
- Moedas, Loja com todos os serviços, os 5 selos, raridade por ato e peso do arquétipo ativo.
- Atos, escolha do sub-chefe, chefões com anúncio e revanche, espólio, Mesa do Apostador, omamoris e escolha do omamori inicial.
- Visual de protótipo no computador e no celular (vertical), telas novas, tutorial, dicas, glossário, textos e salvamento novo.

O Code testa por conta própria enquanto trabalha. Antes de entregar, precisa passar:

- `tests/cartas.js` com uma checagem por carta e casos de mão, descarte e reembaralhamento.
- `tests/ui_bot.js` jogando uma run completa, passando por Lojas, sub-chefe, chefão e Mesa do Apostador.
- `tests/simular.js` com runs completas, sem erro no console.
- As medições da seção "O que medir", registradas no `RELATORIO.md`.

## Decisões já tomadas

1. A Marcada não dá mais +1 de dano. O dano extra contra Marcadas fica só nas cartas de Leitura.
2. Lacrada e Exaustão saíram de vez. Só existem Marcada e Cortada.
3. Prismáticas não são Frágeis automaticamente: só as que dizem Frágil no texto (Meteoro e Origami).
4. Contra o chefão, empate ou derrota faz o jogador lutar de novo, pagando a vida da run. Contra combate comum ou sub-chefe, o jogador segue em frente.
5. A IA segue as mesmas regras de mão, descarte e Frágil que o jogador.
6. O sub-chefe Gêmeo copia o deck atual do jogador, com upgrades e selos, mas sem omamoris.
7. Com a mão de 3, a regra Sem mão travada deixa de ser necessária. Se ainda for possível ficar sem carta jogável (por exemplo, só com Meteoro fora da Blitz), o jogador compra até ter uma.
8. Os fantasmas (decks de outros jogadores) ficam desligados na V4 até o André decidir se voltam.
9. Registrar em `RELATORIO.md` qualquer decisão onde a Especificação for omissa, e no fim atualizar o documento de estado (que passa a ser o da V4).

## O que medir

Nenhum número da V4 foi testado. Depois de implementar tudo, reportar, com o bot que joga pelas odds:

- Tamanho médio do deck no fim da run. O alvo é de 12 a 15 cartas.
- Moedas ganhas e gastas por run, e em quê.
- Taxa de vitória por arquétipo (deck de teste de cada um contra os inimigos comuns). A meta é ficarem próximas umas das outras, entre 58% e 73%.
- Taxa de vitória contra cada sub-chefe e cada chefão.
- Diferença entre o bot pelas odds e um bot que joga ao acaso. Quanto maior, mais o jogo premia a leitura.

---

# Jokenblitz: Especificação V4

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

Quase todo sistema que existia só para sustentar outro saiu, e os serviços entre combates viraram uma Loja única.

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
| Boosters | 1 entre 3 pacotes | Saem. A Loja oferece 3 cartas, uma de cada naipe |
| Oficina, Ateliê, Escambo, Troca | Eventos próprios | Saem. Upgrade, remoção e selo viram serviços da Loja |
| Moeda | Pontos de oficina e valor de escambo | Dinheiro, ganho em todo combate |
| Selos | 11 | 5 |
| Relíquias | 36 | Viram omamoris: 16, mais os dos chefões |
| Run | 8 vitórias, chefes nos combates 4 e 8 | 2 atos de 5 combates, com sub-chefe à escolha e chefão |
| Dinamite | Some da run depois de usada | Frágil: um uso por combate, fica no deck |
| Visual | V3.1 aprovado | Protótipo. O V3.1 fica guardado para depois |

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

- As odds mostram, para cada lado, a porcentagem de cada naipe entre as cartas que ainda podem estar na mão dele, ou seja, as que estão no deck ou na mão.
- Cartas Marcadas aparecem à parte, como certeza (por exemplo, "1 tesoura certa na mão").
- O Curinga aparece como "?", separado dos três naipes.
- Sem a mão acumulada, as odds refletem quase só a composição do deck. Um deck com muita pedra fica previsível, e esse é o preço de se especializar num naipe.

| Informação | Quem vê |
| --- | --- |
| Cartas exatas da mão | Só o dono, menos as Marcadas |
| Efeitos das cartas na mão | Só o dono, até a revelação |
| Odds de cada naipe | Os dois, dos dois lados |
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

Depois de cada combate vem a Loja. Depois do chefão, o Espólio vem antes da Loja. A Mesa do Apostador aparece uma vez por run, no ato 2, entre o sub-chefe e a Loja.

### Início

- O jogador começa com 6 vanillas (2 de cada naipe), sem omamori e sem dinheiro.
- O primeiro combate é sempre vanilla: os dois lados têm 6 vanillas e 3 de vida, a Blitz começa na rodada 4, e o inimigo mantém a personalidade.
- Depois desse combate, vencendo ou não, o jogador escolhe o omamori inicial entre 3 básicos. Só então vem a primeira Loja.

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
| Recompensa de sub-chefe | Varia (ver Sub-chefes) |
| Carta Nota de cem, omamori Cofre | Ver cada um |

O dinheiro acumula pela run inteira. Não gastar numa Loja é o jeito de guardar para algo caro.

### Tamanho do deck

O alvo é terminar a run com 12 a 15 cartas. Com a mão de 3, uma carta específica aparece em 25% dos turnos num deck de 12, e em 17% num deck de 18. Preços e recompensas são ajustados para manter o deck nessa faixa.

Pela conta inicial (estimada), um jogador que vence 70% dos combates termina com cerca de 29 moedas, o que dá umas 9 Raras se gastar tudo em cartas, e um deck perto de 15.

## Loja

A Loja aparece depois de todo combate e junta o que antes eram o booster, a Oficina e o Ateliê. O jogador compra quantas coisas puder pagar, ou sai sem gastar.

### O que tem à venda

| Item | Preço | Regras |
| --- | --- | --- |
| 3 cartas, uma de cada naipe | Pela raridade: 1, 3, 6 ou 10 | Cada carta só pode ser comprada uma vez |
| Upgrade | 2 | Uma vez por carta |
| Remover carta | 2 | O deck não fica com menos de 6 |
| 1 selo sorteado | 3 | Substitui o selo antigo da carta, com aviso |
| Renovar as cartas | 1 | Sorteia 3 cartas novas. Uma vez por Loja |

Cada carta mostra a versão atual e a versão "+" lado a lado, antes da compra.

### Raridade das cartas

A raridade é sorteada para cada uma das 3 cartas, separadamente.

| Ato | Comum | Rara | Lendária | Prismática |
| --- | --- | --- | --- | --- |
| 1 | 45% | 45% | 10% | 0% |
| 2 | 30% | 45% | 20% | 5% |

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
| Recompensa de alguns sub-chefes | 1 entre 2 |
| Espólio do chefão | O omamori do chefão ou 1 sorteado (ver Chefões) |

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

Todo inimigo tem uma tendência mostrada antes da luta e segue uma regra clara. O jogador nunca precisa adivinhar como o inimigo pensa, só o que ele vai jogar.

### Como a IA joga

- Escolhe por pesos de naipe, definidos pela personalidade, dentro da própria mão de 3.
- Usa a mesma informação pública que o jogador: odds e cartas Marcadas. Se um naipe do jogador passa de 50% nas odds, ela aumenta o peso do naipe que o vence.
- Prefere cartas cuja condição está cumprida, como o Cutelo na Blitz ou o Abridor de cartas contra uma Marcada.
- Os decks dos inimigos ganham cerca de 1 upgrade a cada 2 combates. No ato 2, eles têm Raras e Lendárias.

### Inimigos comuns

| Inimigo | Tendência mostrada | Regra | Aparece |
| --- | --- | --- | --- |
| O Rochedo | "Gosta de pedra" | Joga pedra 60% das vezes | Sempre |
| A Copiadora | "Imita você" | 60% de chance de repetir o naipe que você jogou na rodada anterior | Ato 1 |
| O Vingativo | "Não esquece uma derrota" | Depois de perder, 70% de chance de jogar o naipe que venceria a sua última carta | Sempre |
| O Do Contra | "Nunca repete" | Nunca joga o mesmo naipe duas rodadas seguidas | Sempre |
| A Leitora | "Confia nas odds" | 60% de chance de jogar o naipe que vence o seu naipe mais provável | Ato 2 |

### Sub-chefes

No 3º combate de cada ato, o jogo sorteia 2 sub-chefes, e o jogador escolhe qual enfrentar. Cada um tem 6 de vida, uma regra e uma recompensa, além das moedas normais do combate.

| Sub-chefe | Regra | Recompensa |
| --- | --- | --- |
| O Quebradiço | 2 cartas aleatórias suas ficam Frágeis neste combate | 1 Lendária à escolha entre 2 |
| O Espião | A cada 2 rodadas, 1 carta da sua mão fica Marcada | 1 omamori à escolha entre 2 |
| O Ganancioso | Tem 8 de vida em vez de 6 | 6 moedas |
| O Teimoso | Vence todos os empates | 1 omamori à escolha entre 2 |
| O Apressado | A Blitz começa na rodada 3 neste combate | 2 upgrades grátis |
| A Ladra | Cada vez que ela vence uma rodada, você perde 1 moeda | Devolve o que roubou, mais 5 moedas |
| O Embaralhador | Sua mão é de 2 cartas neste combate | 1 Lendária à escolha entre 2 |
| O Gêmeo | Joga com uma cópia do seu deck | 1 upgrade grátis e 3 moedas |

Se o jogador empatar ou perder contra o sub-chefe, não recebe a recompensa e segue em frente.

### Chefões

O chefão do ato é sorteado entre 3. Antes da luta, a tela mostra a regra dele, a carta Troféu e o omamori. Quase todos anunciam o naipe antes da escolha, cada um seguindo uma regra fixa. O jogador nunca anuncia. Chefões têm 6 de vida no ato 1 e 7 no ato 2.

| Chefão | Ato | Regra do anúncio | Carta Troféu | Omamori |
| --- | --- | --- | --- | --- |
| O Juiz | 1 | Anuncia sempre e sempre fala a verdade | **Martelo** (Pedra): ganha empates. Vencer: 2 de dano | **Toga:** na primeira rodada de cada combate, o oponente anuncia o naipe, e é verdade |
| O Trapaceiro | 1 | Anuncia sempre e sempre mente | **Ás na Manga** (Papel): nunca é descartado. Vencer: 2 de dano | **Cartola:** uma vez por combate, troque 1 carta da mão pela do topo do deck |
| O Pêndulo | 1 | Alterna verdade e mentira, começando pela verdade | **Pêndulo** (Pedra): Vencer em rodada par: 3 de dano. Em rodada ímpar: 1 | **Metrônomo:** nas rodadas pares, você vence empates |
| O Rancoroso | 2 | Fala a verdade até perder uma rodada. Na rodada seguinte, mente. Depois volta à verdade | **Rancor** (Tesoura): Vencer logo depois de perder uma rodada: 3 de dano | **Diário:** depois de perder uma rodada, sua próxima vitória causa +1 |
| A Burocrata | 2 | Nas rodadas ímpares, anuncia a verdade. Nas pares, não anuncia, e você joga uma carta aleatória da mão | **Formulário 3B** (Papel): Vencer: 2 de dano, e na próxima rodada o oponente joga uma carta aleatória | **Carimbo:** na primeira rodada de cada combate, o oponente joga uma carta aleatória |
| O Duelista | 2 | Nunca anuncia. Depois de vencer, sempre repete o naipe | **Florete** (Tesoura): Vencer: 2 de dano e fica na mão (no máximo 2 vezes por combate) | **Luva de Duelo:** sua primeira vitória em cada combate causa +1 |

Com upgrade, toda carta Troféu causa +1 de dano. O deck só pode ter 1 de cada.

### Espólio

Ao vencer o chefão, o jogador ganha 3 moedas a mais e escolhe 1 entre: a carta Troféu, o omamori do chefão ou 1 omamori sorteado.

## Interface

A V4 volta ao visual de protótipo: formas simples, cores lisas e texto legível. O visual V3.1 aprovado fica guardado no canvas, na página Histórico, para voltar quando o sistema assentar.

### Regras do protótipo

- **Cores dos naipes:** pedra marrom (#8c7663), papel azul (#3d8fd6), tesoura laranja (#e05a2b). Sem texturas, sombras ou acabamentos (foil e fullart ficam para depois).
- **Carta:** retângulo com uma faixa da cor do naipe, o símbolo do naipe, o nome, a raridade como uma bolinha de cor e o efeito, com a condição em destaque (Vencer, Perder, Empatar, Jogar).
- **Estados:** Marcada com borda ciano e um ícone de olho. Frágil com um ícone de rachadura. Cartas cortadas vão para a pilha Cortadas.
- **Upgrade:** nome em verde e "+" no fim.
- **Sem imagens geradas por IA:** só formas e cores.
- Layout horizontal no computador e vertical no celular (390 × 844).

### Telas

| Tela | O que tem |
| --- | --- |
| Combate | Vida dos dois lados, trilha de rodadas com a Blitz marcada, mão de 3, contadores de deck, cemitério e Cortadas, odds dos dois lados, cartas Marcadas, omamoris junto de cada jogador, anúncio do chefão quando houver |
| Loja | 3 cartas com preço (versão atual e "+"), selo à venda, upgrade, remoção, renovar e o seu dinheiro |
| Escolha do sub-chefe | Os 2 sub-chefes lado a lado, cada um com a regra e a recompensa |
| Antes do chefão | Regra do anúncio, carta Troféu e omamori |
| Espólio | 1 entre 3 opções |
| Mesa do Apostador | O que você aposta, o prêmio e o placar da melhor de 3 |
| Omamori inicial | 1 entre 3 básicos |
| Trilha da run | Os 2 atos, com o combate atual, os sub-chefes e os chefões |
| Menu e fim de run | Iniciar, continuar; resumo da run no fim |

Saem da tela de combate: o seletor de anúncio, a credibilidade, a Corrente e as Camadas. Saem as telas de booster, Oficina, Ateliê, Escambo e Troca.

## Pendências

Todos os números da V4 são um ponto de partida, ainda não testados. Os primeiros a conferir, jogando ou no simulador:

- [ ] Tamanho do deck no fim da run (alvo: 12 a 15)
- [ ] Preços da Loja e moedas por resultado
- [ ] Chances de raridade por ato
- [ ] Força do Geodo, da Guilhotina, da Excalisoura e da Mochila
- [ ] Vida dos sub-chefes e dos chefões
- [ ] Valor da aposta em moedas na Mesa do Apostador (hoje 8)
- [ ] Se os inimigos que jogam ao acaso ou por peso ficam fáceis demais sem o anúncio

Ainda a decidir:

- [ ] Os fantasmas (decks de outros jogadores) continuam na V4? Até decidir, ficam desligados.
- [ ] Nomes finais dos omamoris novos e das cartas Troféu
