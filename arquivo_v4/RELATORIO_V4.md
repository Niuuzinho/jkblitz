# Jokenblitz: relatório de implementação

> **Versão 4.** A especificação vigente é `JOKENBLITZ_V4_PARA_O_CODE.md` (a Especificação V4 vale mais que o roteiro quando divergem). Documento de estado para outro chat: `JOKENBLITZ_DOCUMENTO_V4.md`. O código, os testes e os documentos da V3.1 (com o visual cream e a mesa espelhada, guardados para depois) estão em `arquivo_v31/`.

## O que foi feito

Os blocos do roteiro foram feitos de uma vez, como pedido: remoção do que saiu, regras base, 27 cartas + 2 especiais + 6 Troféus, moedas e Loja, 5 selos, atos, sub-chefes, chefões com anúncio e revanche, espólio, Mesa do Apostador, 22 omamoris, visual de protótipo (computador e celular), tutorial, dicas, glossário, textos e salvamento novo (`jokenblitz_save_v4`; saves antigos são descartados com aviso no menu).

**Removido de verdade** (código, dados, textos e testes; nada ficou escondido atrás de opção): anúncio do jogador (Verdade, Mentira, Silêncio, credibilidade, Golpe, Palavra cumprida, credulidade), Corrente e Camadas, Lacrada e Exaustão, compra de 1 por rodada, limite de mão 6 e queima, efeitos de Blitz, boosters, Oficina, Ateliê, Escambo, Troca, pontos de oficina e valor de escambo, as 92 cartas antigas, os 8 selos que saíram, as 36 relíquias, tags antigas, Ocultas/Neblina/Disfarce, acabamentos (Foil, Full Art, Gravada), raridades Incomum e Proibida, meta de 8 vitórias, fantasmas (JKB) e o visual V3.1.

## Decisões onde a especificação foi omissa

1. **Omamoris dos chefões**: o chefão luta só com a carta Troféu e a regra de anúncio. O omamori dele é a recompensa do espólio e não vale para a IA.
2. **Loja depois de perder ou empatar com o chefão**: a Loja aparece (a regra diz "depois de todo combate"), e só depois vem a revanche. As moedas da derrota (1) e do empate (2) entram.
3. **Mesa do Apostador recusada** conta como usada (a Mesa aparece uma única vez, no ato 2, depois do sub-chefe e antes da Loja, mesmo se o sub-chefe foi perdido).
4. **Guardar com escolha** (Papelão+, Recorte, Caderno, ou mais cartas guardadas do que cabem): o jogador escolhe numa janela depois da revelação, antes da "Próxima rodada". A IA guarda as cartas mais raras. Se a mão do próximo turno não tem lugar, o jogador escolhe quais ficam.
5. **Recorte** marca as cartas que ele guarda (a menos que tenha upgrade). **Cascalho** guarda todas as outras cartas da mão; Mão +1 vale no turno seguinte.
6. **Mão +1 com a Mochila** empilha (5 cartas no turno). O Embaralhador (mão de 2) vale também com Mão +1 (3 cartas).
7. **Ties**: a carta que "ganha o empate" conta como vitória completa (causa o dano base e ativa os efeitos de Vencer, como o Martelo, que causa 2). O efeito de Empatar (Pedrada, Bainha) só ativa em empate real.
8. **"Causa N de dano"** é dano total N (o dano base 1 já conta). Cutelo dobra o dano total no fim. Fio de Navalha olha o dano final.
9. **Testamento** pede a carta pela janela de escolha (cemitério, e Cortadas com upgrade). Origami copia o efeito (e os parâmetros) da última carta jogada, inclusive o de Lendárias.
10. **Geodo**: turnos na mão contam as rodadas em que ele ficou na mão (a rodada em que é jogado não conta; mínimo 1).
11. **Diário** guarda a derrota até a próxima vitória (não só a rodada seguinte). **Alicerce** vale só se a derrota causaria dano.
12. **Rancoroso**: mente na rodada logo depois de perder uma rodada em que falou a verdade; depois volta à verdade. **Burocrata** nas rodadas pares não anuncia e o jogador joga carta aleatória.
13. **Ladra**: o roubo é cobrado no fim do combate (limitado às moedas que você tinha). A recompensa devolve o que roubou mais 5, só se você vencer.
14. **Gêmeo** copia o deck atual (upgrades e selos) sem omamoris. **Apressado**: Blitz na rodada 3. **Quebradiço**: 2 cartas viram Frágeis só na luta.
15. **Cartola e Caderno** são botões na fase de escolha; a Cartola manda a carta trocada para o fundo do deck.
16. **Luta de aquecimento**: o inimigo usa uma das personalidades comuns (só vanillas e 3 de vida). Sem omamori na primeira luta (a escolha vem depois dela).
17. **Omamori inicial**: 3 dos 4 básicos, sorteados. **Ofertas de omamori** sempre têm pelo menos uma opção que não é de arquétipo; Mochila só aparece no ato 2 (inclusive como sorteado no espólio).
18. **Decks dos inimigos**: vanillas inclinadas pela personalidade (8), mais Raras (1 a 3), Lendárias no ato 2 e 1 upgrade a cada 2 combates; chefões levam a Troféu. Isso não estava na especificação em números.
19. **Dinamite contra Dinamite** não ativa efeitos (como antes). **Curinga** começa num naipe sorteado e anda a cada rodada em que está na mão.
20. **Odds**: mostram só Pedra, Papel e Tesoura entre as cartas não Marcadas; Marcadas e o Curinga aparecem à parte. A Dinamite não aparece nas odds.
21. **Menu**: "Combate rápido" e seed ficam dentro de "Opções". Os decks de teste (Básico e um por arquétipo) servem ao combate rápido e às medições.

## Testes

- `node tests/cartas.js`: **557 checagens**: regras (mão de 3, descarte, guardar, Mão +1, nunca descartadas, Marcada sem bônus, Frágil e Cortadas, Blitz, reembaralhar), uma checagem por carta (e upgrade), selos, os 22 omamoris, anúncios dos 6 chefões, IA dos comuns, run (Loja, preços, raridade por ato, arquétipo ativo, sub-chefes, recompensas, vida da run, revanche, espólio, Mesa, Seguro, Cofre, salvamento).
- `node tests/simular.js`: **runs completas** (bot pelas odds e bot ao acaso) passando por Lojas, sub-chefes, chefões, revanche e Mesa; confere invariantes (nenhuma carta se perde, deck ≥ 6, no máximo 1 prismática/Dinamite/Curinga/Troféu de cada). Sem erros.
- No Chromium: `tests/ui_bot.js` (runs inteiras clicando, 3 tamanhos de tela), `ui_tutorial.js` (tutorial em 2 tamanhos) e `ui_omamoris.js` (22 omamoris com um deck cheio de cartas que pedem decisões). Sem erro de JavaScript, sem rolagem indevida no combate.
- Capturas de tela conferidas (menu, pré-combate, sub-chefe, chefão, combate, Loja, recompensa, espólio, Mesa; computador e celular).

## Medições (seção "O que medir")

Bot pelas odds jogando os decks de teste (12 cartas) contra os inimigos montados como a run monta; 300 partidas por confronto. Os decks não têm upgrades, selos nem omamoris, a não ser onde dito.

**Taxa de vitória por arquétipo contra os comuns** (meta: 58% a 73%): Investida **80%**, Muralha **73%**, Leitura **58%**, Arquivo **55%**, Básico (6 vanillas + 6 vanillas) 60%. Com 3 upgrades e 1 omamori: Investida 84%, Muralha 79%, Leitura 63%, Arquivo 63%, Básico 75%. Ou seja, Investida está acima da faixa, Arquivo um pouco abaixo (o bot não sabe aproveitar guardar cartas, então é o pior caso para ele).

**Contra cada inimigo comum** (média dos arquétipos): Rochedo 69%, Copiadora 69%, Vingativo 69%, Do Contra 69%, Leitora 68%. As personalidades quase não diferem para o bot (ele se adapta às odds).

**Contra cada sub-chefe** (decks de arquétipo com 3 upgrades; ato 1 / ato 2): Quebradiço 54% / 51%, Espião 58% / 47%, Ganancioso 42% / 35%, **Teimoso 29% / 23%**, Apressado 58% / 49%, Ladra 62% / 50%, Embaralhador 52% / 45%, Gêmeo 41% / 45%.

**Contra cada chefão** (3 upgrades e 1 omamori): Juiz 70%, Trapaceiro 64%, Pêndulo 67%, Rancoroso 68%, **Burocrata 33%**, Duelista 66%.

**Odds contra o acaso** (premia a leitura?): Básico 61% × 35% (+26 pontos), Investida 80% × 64% (+16), Muralha 78% × 53% (+25), Arquivo 53% × 32% (+22), Leitura 55% × 37% (+18). Ler as odds vale de 16 a 26 pontos de vitória por combate.

**Runs completas (bot pelas odds, 300 runs)**: vitória na run 38%. Deck no fim: média **12,6** cartas (mediana 13, de 6 a 18), dentro do alvo de 12 a 15. Moedas ganhas por run: ~23,6 em combates (+1,2 de prêmios, 0,1 da Nota de cem); gastas: ~18,5 em cartas, 1,8 em upgrade, 0,4 em remover, ~0,2 na Mesa. O bot quase não compra selos, renova ou remove, então esses números são uma estimativa para baixo.

**O que olhar primeiro** (nada foi ajustado; os números estão todos em `data/`): Teimoso e Burocrata são muito difíceis (vencem todos os empates; a Burocrata tira a escolha do jogador nas rodadas pares), Investida é forte demais e Arquivo fraco para o bot, e o Ganancioso (8 de vida) tem 35% a 42%. A Mesa aparece em ~59% das runs do bot.

## Não verificado

- Não testei em aparelho real (só emulação de 390×844 no Chromium).
- O ritmo real das animações e dos carimbos foi visto por captura, sem som e sem animação.
- A IA de cartas complexas (Testamento, Rascunho) segue heurísticas simples; não medi quanto isso pesa.
- O bot não usa Cartola, Caderno, selos nem renovar: o efeito desses itens no equilíbrio não foi medido.
