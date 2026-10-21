# Jokenblitz: documento da versão 4.1 (estado atual)

Deckbuilder roguelike de pedra, papel e tesoura, no navegador, contra IA. HTML, CSS e JavaScript puros, sem servidor, **sem imagens geradas por IA** (formas e cores). Comentários do código simples e em português. A especificação é `JOKENBLITZ_V4_1_PARA_O_CODE.md`. A V4 está em `arquivo_v4/` e a V3.1 em `arquivo_v31/`.

## 1. Regras do combate
- Vida 5 (3 na primeira luta). **Mão sempre de 3**: no fim do turno o que não foi jogado vai ao cemitério, menos as cartas guardadas (que contam nas 3). Mão +1 completa até 4 só no turno seguinte. Deck acabou: o cemitério é embaralhado e vira o deck.
- Dano da vitória 1. Empate: 0, ou 1 para cada lado na **Blitz** (rodada 6; 4 na primeira luta; regra fixa). Limite de 12 rodadas: vence quem tem mais vida.
- "Causa N de dano" é dano total. Só a Dinamite vence qualquer naipe. Quem "ganha o empate" conta como vencedor; se os dois ganham, continua empate.
- **Estados**: Marcada (revelada ao oponente; certeza nas odds; sem bônus de dano), Cortada (fora do resto do combate). **Frágil** é traço impresso. Nunca descartadas: Geodo, Meteoro, Curinga, Ás na Manga.
- **Odds do oponente** (o jogador não vê as próprias): % de Pedra, Papel e Tesoura entre deck e mão; Marcadas à parte; Curinga como "?".
- Ordem da rodada: omamoris de início, completa a mão, (Trapaceiro anuncia), escolha em segredo, revelação, resultado, efeitos, dano e cura simultâneos, carta jogada vai ao cemitério (ou Cortadas), resto da mão descartado (menos guardadas), fim.

## 2. Modos de jogo
- **Normal**: mão do oponente escondida; Marcada.
- **Mão aberta (teste)**, escolhido no menu antes da run: as duas mãos à vista (efeitos incluídos), deck escondido; **Secreta** no lugar de Marcada (carta virada para o oponente na mão). Cada carta, selo ou omamori que fala de Marcada tem um campo `maoAberta` nos dados com o texto da segunda versão (os efeitos mudam em `js/efeitos.js` conforme `estado.modo`). Odds só do deck. A IA lê a mão do jogador (60% leitura, 40% personalidade; Secretas ignoradas). Todo chefão tampa 1 carta por turno (Ilusionista, 2); inimigos comuns do ato 2 trazem 1 ou 2 cartas Sigilosas. A run guarda o modo (`run.modo`), e o resumo do fim da run mostra.

## 3. Cartas (35)
- **3 Comuns** (vanilla; upgrade: Vencer +1), **12 Raras** (3 por arquétipo), **9 Lendárias**, **3 Prismáticas** (máx. 1 por deck), **2 Especiais** (Dinamite e Curinga; só na Mesa; máx. 1) e **6 Troféus** (só no espólio; máx. 1 de cada): Pedra Angular, Fichário, Florete, Biombo, Ás na Manga e Ponteiro. Toda carta tem upgrade ("+").
- **Arquétipos**: Investida, Muralha, Arquivo, Leitura. Com 3 cartas no deck o arquétipo fica **ativo** (50% das Raras e Lendárias da Loja e da Recompensa são dele; os omamoris dele podem aparecer).
- **Selos (5)**: Pesada, Blindada, Guardada, Delatora (Sigilosa na Mão aberta), Na manga. Dados em `data/cards.js`; efeitos em `js/efeitos.js`.

## 4. A run
- 2 atos de 5 combates: comum, comum, **sub-chefe (1 entre 2)**, comum, **chefão**. Vence quem derrota o chefão do ato 2. Começa com 6 vanillas, sem omamori e sem moedas; o combate 1 é a luta de aquecimento; depois dele, 1 entre 3 omamoris básicos.
- Vida da run 10; empate −1, derrota −3 (Seguro: a primeira custa 1). **Chefão: perder ou empatar faz lutar de novo.**
- **Moedas**: vitória 3, empate 2, derrota 1, chefão +3; pular a Recompensa +2; pular a Oficina +1; Cofre +1; Nota de cem.
- **Paradas depois do combate**: combate 1: omamori, Recompensa, Loja. Combates 2 e 4: Recompensa, Oficina. Sub-chefe: recompensa dele, Recompensa, (Mesa no ato 2), Loja. Chefão: Espólio, Recompensa, Loja. A Recompensa vem depois de qualquer resultado.
- **Recompensa**: 3 cartas (uma por naipe, só versão atual); ato 1: 50/45/5, ato 2: 35/50/15 (Comum/Rara/Lendária). **Oficina**: 1 upgrade grátis (atual e "+" lado a lado). **Loja** (combates 1, 3 e 5): 3 cartas Raras ou melhores (ato 1: 80/20/0; ato 2: 60/32/8), 1 omamori (6), 1 selo (3), upgrade (2), remover (2), renovar (1).
- **Sub-chefes (8)**: Quebradiço, Espião, Ganancioso, Teimoso, Apressado, Ladra, Embaralhador, Gêmeo; cada um com arquétipo, deck, regra e recompensa.
- **Chefões (6)**, cada um com arquétipo, poder, estilo, Troféu e omamori: Pedreiro (Muralha, Muralha viva, Pedra Angular, Fundação), Arquivista (Arquivo, Arquivo morto, Fichário, Pasta), Duelista (Investida, Embalo, Florete, Luva de Duelo) no ato 1; Ilusionista (Leitura, Véu, Biombo, Véu), Trapaceiro (Blefe, Conversa fiada, Ás na Manga, Cartola), Relojoeiro (Blitz, Adiantado, Ponteiro, Relógio de Bolso) no ato 2. Só o Trapaceiro anuncia, e sempre mente; a regra não aparece, só a pista.
- **Inimigos comuns (5)**, todos nos dois atos: Rochedo (Muralha), Copiadora (Arquivo), Vingativo (Investida), Do Contra (Blitz), Leitora (Leitura).
- **Mesa do Apostador** (uma vez, ato 2): melhor de 3 de jokenpô contra o acaso, apostando 1 Lendária ou 8 moedas, pela Dinamite ou pelo Curinga.
- **22 omamoris** (4 básicos, 4 de arquétipo, 8 neutros, 6 dos chefões); máximo 5.
- **IA**: pesos de naipe da personalidade × valor das cartas pelo estilo do arquétipo (`js/ia.js`).

## 5. Interface (visual de protótipo)
Formas lisas e texto legível. **Mesa de combate em coluna** (computador e celular): trilha compacta, inimigo, odds dele, mesa (sua carta à esquerda, a dele à direita), você e a mão. Um toque na carta joga; "Jo… Ken… Pô!" ou "Blitz!"; a próxima rodada começa em ~1,5 s e um toque pula; escolhas de efeito numa linha de botões na mesa; fim do combate com um botão ("Continuar"). Menu: modo (Normal ou Mão aberta), Opções (Velocidade Normal ou Rápida, Confirmar jogada, tamanho do texto, dicas, seed, combate rápido). Telas: pré-combate (escolha do sub-chefe; prévia do chefão com arquétipo, poder, estilo, Troféu e omamori), omamori inicial, Recompensa, Oficina, Loja, recompensa do sub-chefe, Espólio, Mesa, fim da run. Botão direito amplia a carta (tecla I), explicações após 1 s parado, tutorial O Treinador (7 rodadas), dicas de primeira vez, glossário.

## 6. Código
`data/` (config, cards, omamoris, enemies, textos); `js/efeitos.js`, `motor.js`, `ia.js`, `run.js` (lógica sem DOM); interface em `ui-base.js`, `ui-eventos.js`, `ui-combate.js`, `ui-run.js`, `ui-main.js`, `tutorial.js`, `tips.js`; `style.css`; `montar_artefato.py` gera o arquivo único. Salvamento: `jokenblitz_save_v41`.

## 7. Testes e medições
`node tests/cartas.js` (700), `node tests/simular.js` (runs completas nos dois modos), `node tests/medidas.js` (as medições), e no Chromium `tests/ui_bot.js`, `ui_tutorial.js`, `ui_omamoris.js`, `ui_ritmo.js`. Os números e as decisões onde a especificação foi omissa estão no `RELATORIO.md`.
