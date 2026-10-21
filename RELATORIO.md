# Jokenblitz: relatório de implementação (V4.1)

> **Versão 4.1.** A especificação vigente é `JOKENBLITZ_V4_1_PARA_O_CODE.md` (a Especificação V4.1 vale mais que a lista de ajustes quando divergem). Documento de estado para outro chat: `JOKENBLITZ_DOCUMENTO_V41.md`. A V4 está em `arquivo_v4/` (documento, relatório e especificação) e a V3.1 (visual cream, mesa espelhada) em `arquivo_v31/`.

## O que foi feito na V4.1

Tudo de uma vez, nos dois modos de jogo (**Normal** e **Mão aberta (teste)**, escolhido no menu antes de começar a run):

- **Mesa de combate em coluna**, igual no computador e no celular: trilha compacta, inimigo (nome, vida, contadores, Marcadas, poder ou regra, balão do Trapaceiro), odds dele centralizadas, mesa com **a sua carta à esquerda**, você (vida, omamoris, moedas, contadores) e a mão na base. As **odds do jogador saíram da tela**.
- **Ritmo de um toque por rodada**: tocar na carta joga (sem confirmar). "Jo… Ken… Pô!" (na Blitz, "Jo… Ken… Blitz!") em menos de 1 s; resultado, efeitos e descarte automáticos; a **próxima rodada começa em ~1,5 s** e **um toque pula** a animação ou a espera (também Enter e Espaço). A mão antes do descarte continua na tela (a jogada sai, as guardadas ficam, as descartadas esmaecem). Escolhas de efeito (naipe do Rascunho, carta do Testamento, o que guardar, Cartola, a carta que fica Secreta) numa **linha de botões sobre a mesa**, sem janela. Fim de combate com **um botão só** ("Continuar"). Menu: **Confirmar jogada** (desligada) e **Velocidade** (Normal ou Rápida).
- **Recompensa** depois de todo combate (até empate e derrota): 3 cartas, uma de cada naipe, só a versão atual; escolhe 1 ou pula por 2 moedas. Raridade própria por ato (ato 1: 50/45/5; ato 2: 35/50/15 em Comum/Rara/Lendária; nunca Prismática; mesma regra do arquétipo ativo da Loja).
- **Oficina** grátis depois dos combates 2 e 4 de cada ato: 1 upgrade grátis com a versão atual e a "+" lado a lado (as já melhoradas aparecem apagadas); pular dá 1 moeda.
- **Ordem das paradas**: combate 1: omamori inicial, Recompensa, Loja. Combate 2 e 4: Recompensa, Oficina. Sub-chefe: recompensa dele (se vencer), Recompensa, (Mesa do Apostador no ato 2), Loja. Chefão: Espólio (se vencer), Recompensa, Loja.
- **Loja** só depois dos combates 1, 3 e 5 de cada ato: 3 cartas Raras ou melhores (ato 1: 80/20/0; ato 2: 60/32/8 em Rara/Lendária/Prismática), sem o upgrade ao lado; **1 omamori por 6 moedas** (some com 5 omamoris); selo à venda com o nome em negrito numa etiqueta amarela e a explicação embaixo.
- **Espólio**: o omamori do chefão é garantido e o jogador escolhe entre a carta Troféu e 1 omamori sorteado.
- **Seis chefões novos** (saem Juiz, Pêndulo, Rancoroso e Burocrata, com cartas e omamoris): **Pedreiro** (Muralha), **Arquivista** (Arquivo), **Duelista** (Investida), **Ilusionista** (Leitura), **Trapaceiro** (Blefe) e **Relojoeiro** (Blitz), cada um com deck montado, poder, estilo que a IA segue, Troféu (Pedra Angular, Fichário, Florete, Biombo, Ás na Manga, Ponteiro) e omamori novos (Fundação, Pasta, Luva de Duelo, Véu, Cartola, Relógio de Bolso). Só o Trapaceiro anuncia, sempre mente, e a regra dele **nunca aparece** (só a pista "Não acredite em nada do que ele diz."). A tela antes da luta mostra arquétipo, poder, estilo, Troféu e omamori.
- **Inimigos comuns e sub-chefes por arquétipo**: decks próprios (comuns com 7 a 9 cartas no ato 1, mais 2 cartas e 2 upgrades no ato 2; sub-chefes com 4 vanillas e 4 cartas), todos nos dois atos, com a IA seguindo as prioridades do arquétipo (Investida, Muralha, Arquivo, Leitura, Blitz e Blefe).
- **Modo Mão aberta**: as duas mãos à vista (a dele em miniatura, com o efeito ao parar o mouse), o deck escondido; **Secreta** no lugar de Marcada; segunda versão de texto e efeito (campo `maoAberta` nos dados) em Cristal, Bilhete, Mapa, Abridor de cartas, Bisturi, Recorte, selos Delatora (vira **Sigilosa**) e Blindada, omamoris Lente, Lupa e Véu e sub-chefe Espião; todo chefão tampa 1 carta por turno (a Ilusionista, 2); inimigos comuns do ato 2 trazem 1 ou 2 cartas Sigilosas; odds só do deck, numa barra menor; a IA lê a mão do jogador (60% leitura, 40% personalidade) e ignora as Secretas. O resumo do fim da run diz o modo, e este relatório também (ver as medições).
- Salvamento novo (`jokenblitz_save_v41`, com o modo da run); o save da V4 é descartado com aviso.

## Decisões onde a especificação foi omissa

As decisões 1 a 21 da V4 continuam valendo (ver `arquivo_v4/RELATORIO_V4.md`), exceto onde mudaram abaixo.

1. **Upgrades dos inimigos**: a especificação diz "cerca de 1 a cada 2 combates" na IA e "2 upgrades no ato 2" nas tabelas. Fiz: ato 2 = 2 upgrades em todos (comuns, sub-chefes e chefões); ato 1 = 1 upgrade só nos comuns do combate 4 em diante; sub-chefe e chefão do ato 1 sem upgrade. Os upgrades vão primeiro para cartas com efeito.
2. **Vanillas dos sub-chefes**: 4, sendo uma de cada naipe e mais uma do naipe que mais aparece nas 4 cartas dele.
3. **IA, "guarda"**: onde a especificação diz que a IA "guarda" cartas (Arquivo, Blitz, Investida com Frágeis), ela simplesmente **não joga a carta enquanto a condição não está cumprida**, já que a mão é de 3 e o resto é descartado; só a Arquivista guarda de verdade (poder). O peso do estilo também puxa o naipe sorteado (peso do naipe × valor da melhor carta do naipe^0,75). "Condição cumprida" = a chance de vencer passa de 50% (Frágil: 70%, ou carta Marcada), Geodo com 2 turnos na mão, Fóssil com 2 pedras no cemitério.
4. **Trapaceiro**: anuncia o naipe (ou, na Mão aberta, uma carta visível da mão dele que não vai jogar) que **mais ameaça** o jogador (o que vence o naipe mais provável dele). Sempre mente. Joga o Curinga (80% das vezes) quando o naipe da vez vence o naipe mais provável do jogador.
5. **Pedreiro**: "segura o jogo até a Blitz" virou o estilo Muralha (prefere cartas que ganham empate quando espera empate; na Blitz joga o naipe mais provável do jogador para empatar). **Arquivista** monta a mão: nas rodadas 1 e 2 prefere cartas que guardam. **Duelista**: o Embalo soma o número de vitórias seguidas (até +2); empate não zera.
6. **Ilusionista no modo normal** marca 1 carta da mão do jogador a cada 2 rodadas, como o Espião. **Véu** (omamori, modo normal): as cartas do jogador (mão e topo do deck) não podem ser Marcadas; na Mão aberta, 1 carta aleatória sua fica Secreta por turno.
7. **Fundação**: +1 de vida máxima **e** de vida atual no combate (a luta de aquecimento não tem omamori). **Pasta**: a mão da rodada 1 é de 4 (empilha com a Mochila). **Relógio de Bolso**: na Blitz, vence todos os empates (se o inimigo também vence, continua empate).
8. **Espólio**: o omamori do chefão entra na hora; com 5 omamoris o jogador escolhe qual trocar. Depois escolhe a carta Troféu ou o omamori sorteado (o sorteado também pede troca se estiver cheio). A opção Troféu some se o deck já tem o Troféu.
9. **Loja, omamori à venda**: sorteado entre os omamoris disponíveis (arquétipo só com o arquétipo ativo); como é um só, a regra "pelo menos uma opção neutra" não se aplica (ela continua nas ofertas de 2). O Cupom também baixa o preço dele.
10. **Recompensa**: o sorteio é por carta (naipe fixo, raridade sorteada, 50% de chance de ser do arquétipo ativo nas Raras e Lendárias). Cartas Comuns são os vanillas. Depois da Recompensa do combate 1 vem a Loja mesmo com 0 moedas.
11. **Oficina**: "já melhorada" aparece apagada e desativada. Se nenhuma carta pode melhorar, só resta pular (+1 moeda).
12. **Mão aberta, Cristal**: segue a especificação ao pé da letra. Como o Cristal é jogado na revelação e a Secreta dele é descartada logo depois, o efeito quase nunca muda o jogo (vale para cartas guardadas); é uma das coisas para observar no teste. **Bilhete** (Mão aberta): o jogador escolhe a carta no turno seguinte (linha de botões antes de jogar); se só sobra uma candidata, a escolha é automática; a IA escolhe a mais forte. **Mapa** deixa **as suas** cartas Secretas. **Abridor e Bisturi** perdem a condição "contra Marcada" e causam o dano sempre (é o que a tabela da especificação diz).
13. **Mão aberta, Blindada**: não pode ser revelada pelo Cristal nem Cortada. **Sigilosa** e as cartas que nascem Secretas nunca podem ser reveladas.
14. **Mão aberta, anúncio do Trapaceiro**: confere por carta ("Verdade" só se for a carta que ele joga). Se ele não tem outra carta visível para citar, anuncia o naipe.
15. **Mão aberta, a IA**: peso 1 por carta visível do jogador, +0,5 se tem efeito, +0,5 se vence alguma carta da mão da IA; as Secretas ficam fora; se a mão toda é Secreta, volta às odds do deck. Com 60% de chance ela joga o naipe que vence o mais provável; senão segue a personalidade.
16. **Velocidade "Sem animação"** continua existindo por dentro (testes e quem pede movimento reduzido no sistema), mas o menu só mostra Normal e Rápida. No tutorial a próxima rodada não é automática (o botão "Próxima rodada" aparece só nele), para dar tempo de ler.
17. **Resultado da animação**: ~2 s do toque até o resultado (contagem 0,7 s), mais 1,5 s de espera; a Rápida divide tudo por 2.
18. **Medições**: na V4 as medições "por inimigo comum" não forçavam o inimigo (todas as linhas saíam iguais). Agora a run de teste aceita `inimigoForcado` e os números por inimigo são reais.

## Testes

- `node tests/cartas.js`: **700 checagens** (regras, cada carta e upgrade, os 6 Troféus novos, selos, os 22 omamoris, poderes dos 6 chefões, Trapaceiro nos dois modos, estilos de IA por arquétipo, Mão aberta carta a carta, ordem das paradas em todos os combates, Recompensa, Oficina, Loja com omamori, Espólio com limite cheio, salvamento).
- `node tests/simular.js`: **runs completas** nos dois modos e com as duas políticas (bot pelas odds e ao acaso), 150 runs cada; 68.951 invariantes (nenhuma carta se perde, deck ≥ 6, máximos de Prismática, Dinamite, Curinga e Troféu, Marcada e Secreta nunca juntas, no máximo 12 rodadas). Sem falhas.
- No Chromium: `tests/ui_bot.js` (runs inteiras clicando, em 1366×768, 390×844 e 1920×1080, alternando os dois modos; sem erro de JavaScript e sem rolagem indevida na luta no computador), `ui_tutorial.js`, `ui_omamoris.js` (22 omamoris × 2 modos) e o novo **`tests/ui_ritmo.js`** (um toque joga; contagem "Jo… Ken… Pô!" e "Blitz!"; próxima rodada em 1,5 s; um toque pula a animação e a espera; Confirmar jogada; escolhas na linha da mesa; fim com um botão só). Também percorri por script as telas de recompensa do sub-chefe, Recompensa, Mesa, Loja e Espólio nos dois modos e tamanhos.
- Capturas conferidas: menu, pré-combate dos chefões, combate nos dois modos (computador e celular), resultado da rodada, Rascunho na linha da mesa, Recompensa, Oficina, Loja, Espólio.

## Medições (seção "O que medir")

Bot pelas odds, decks de teste de 12 cartas, inimigos montados como a run monta, 240 partidas por confronto (os números são "normal | Mão aberta"). O bot não usa Cartola, Caderno, selos nem renovar.

**Runs completas (360 por modo)**
- Vitória na run: **44% | 21%**.
- Deck no fim: média **16,6 | 15,1** (mediana 18 | 16); dentro do alvo de 14 a 18: **81% | 67%**. Nas runs vencidas, 18,1 cartas, no limite de cima do alvo (a Recompensa grátis enche o deck; o bot só pula com 18).
- Omamoris por run: **3,4 | 2,6** (4,5 | 4,3 nas runs vencidas; esperado 3 a 4). Run que morre cedo vê poucas Lojas.

**Taxa de vitória por arquétipo contra os comuns** (sem upgrades): Investida **79% | 65%**, Muralha **75% | 69%**, Leitura **59% | 57%**, Arquivo **58% | 40%**, Básico 59% | 50%.

**Por inimigo comum** (arquétipos com 3 upgrades e Rocha-Mãe): Rochedo 88% | 75%, Copiadora 75% | 70%, **Vingativo 48% | 44%**, Do Contra 70% | 69%, Leitora 65% | 50%.

**Por sub-chefe** (ato 1 / ato 2): Quebradiço 63/59 | 50/48, Espião 63/66 | 38/36, **Ganancioso 48/47 | 31/42**, Teimoso 58/55 | 38/38, Apressado 75/69 | 63/57, Ladra 64/65 | 51/52, Embaralhador 63/58 | 42/40, Gêmeo 48/53 | 36/43.

**Por chefão**: Pedreiro 77% | 72%, Arquivista 55% | 55%, Duelista 52% | 43%, **Ilusionista 50% | 24%**, Trapaceiro 48% | 37%, **Relojoeiro 19% | 20%**.

**A leitura vale quanto?** (bot pelas odds menos bot ao acaso): +17 a +26 pontos no normal, +21 a +32 na Mão aberta.

**Mão aberta, a IA que lê a mão** (vitórias da IA nos combates comuns): contra o bot ao acaso **65%** (IA normal: 54%); contra o bot pelas odds **41%** (IA normal: 29%). Ou seja, a IA que lê a mão fica 11 a 12 pontos mais forte, e o jogador que também lê a mão dela ganha menos que no modo normal.

**O que olhar primeiro** (nada foi ajustado; os números estão em `data/`): o **Relojoeiro** (19%) é uma parede (Blitz na rodada 4, Cutelo, Meteoro e Ponteiro); a **Ilusionista** na Mão aberta (24%) por causa das 2 Secretas e dos Abridor e Bisturi sempre ativos; o **Vingativo** (48%) é o inimigo comum mais forte; **Arquivo** fica fraco na Mão aberta (40%); o deck vencedor termina no teto do alvo (18). O Cristal quase não tem efeito na Mão aberta.

## Não verificado

- Não testei em aparelho real (só emulação de 390×844 no Chromium) nem o toque longo para ampliar a carta.
- O ritmo foi medido por tempo e conferido por captura, sem som; o "sentir" de ~3,5 s por rodada é por sua conta.
- A IA nova dos estilos (Investida, Muralha, Arquivo, Leitura, Blitz, Blefe) foi checada por amostragem e por medição, não contra jogadores humanos.
- O bot não usa Cartola, Caderno, selos nem renovar; o efeito deles no equilíbrio não foi medido. O bot também joga a Mão aberta com a mesma heurística do modo normal, então a diversão do modo (duelo de adivinhação) só um jogador pode julgar.
