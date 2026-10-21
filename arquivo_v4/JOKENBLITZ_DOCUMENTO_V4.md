# Jokenblitz: documento da versão 4 (estado atual)

Deckbuilder roguelike de pedra, papel e tesoura, no navegador, contra IA. HTML, CSS e JavaScript puros, sem servidor, **sem imagens geradas por IA** (formas e cores). Comentários do código são simples e em português. Este documento substitui os da V3 e V3.1 (guardados em `arquivo_v31/`). A especificação é `JOKENBLITZ_V4_PARA_O_CODE.md`.

## 1. Regras do combate
- Vida 5 (3 na primeira luta). **Mão sempre de 3**: no fim do turno o que não foi jogado vai ao cemitério, menos as cartas guardadas (que contam nas 3). Mão +1 completa até 4 só no turno seguinte. Deck acabou: o cemitério é embaralhado e vira o deck.
- Dano da vitória 1. Empate: 0, ou 1 para cada lado na **Blitz** (rodada 6; rodada 4 na primeira luta; regra fixa). Limite de 12 rodadas: vence quem tem mais vida.
- "Causa N de dano" é dano total. Só a Dinamite vence qualquer naipe. Quem "ganha o empate" conta como vencedor; se os dois ganham, continua empate.
- **Estados**: Marcada (revelada ao oponente, na mão ou no topo do deck; conta como certeza nas odds; **sem bônus de dano**) e Cortada (fora do resto do combate; volta no seguinte). **Frágil** é traço impresso: depois de jogada vai às Cortadas. Nunca descartadas: Geodo, Meteoro, Curinga, Ás na Manga.
- **Odds** (o centro da leitura): porcentagem de Pedra, Papel e Tesoura entre deck e mão de cada lado; Marcadas à parte como certeza; Curinga como "?".
- Ordem da rodada: omamoris de início, completa a mão (Rascunho, marcas agendadas, Curinga muda), chefão anuncia, escolha em segredo, revelação, resultado, efeitos de carta/selo/omamori, dano e cura simultâneos, carta jogada vai ao cemitério (ou Cortadas), resto da mão descartado (menos guardadas), fim.

## 2. Cartas (35)
- **3 Comuns** (vanilla; upgrade: Vencer +1 de dano), **12 Raras** (3 por arquétipo, 1 por naipe), **9 Lendárias**, **3 Prismáticas** (Meteoro, Origami, Excalisoura; máx. 1 por deck), **2 Especiais** (Dinamite, Curinga; só na Mesa; máx. 1 de cada) e **6 Troféus** (1 por chefão; só no espólio; máx. 1 de cada). Toda carta tem um upgrade ("+").
- **Arquétipos**: Investida (dano), Muralha (empates e defesa), Arquivo (guardar e escolher a mão), Leitura (marcar e punir Marcadas). Com 3 cartas no deck o arquétipo fica **ativo**: a Loja oferece mais cartas dele e os omamoris dele podem aparecer.
- **Selos (5)**: Pesada, Blindada, Guardada, Delatora, Na manga. Um por carta; comprar outro substitui.
- Dados em `data/cards.js`; efeitos em `js/efeitos.js`.

## 3. A run
- 2 atos de 5 combates: comum, comum, **sub-chefe (escolha 1 entre 2)**, comum, **chefão**. Vence quem derrota o chefão do ato 2. Começa com 6 vanillas, sem omamori e sem moedas; o combate 1 é a luta de aquecimento; depois dele, escolhe 1 entre 3 omamoris básicos.
- Vida da run 10. Empate −1, derrota −3 (Seguro: a primeira custa 1). **Chefão: perder ou empatar faz lutar de novo** (a Loja vem no meio).
- **Moedas**: vitória 3, empate 2, derrota 1, chefão +3; Cofre +1; Nota de cem; recompensas de sub-chefe.
- **Loja** depois de todo combate: 3 cartas (uma de cada naipe) com preço (Comum 1, Rara 3, Lendária 6, Prismática 10), upgrade 2, remover 2 (deck ≥ 6), 1 selo sorteado 3, renovar 1. Raridade por ato (ato 1: 45/45/10/0; ato 2: 30/45/20/5); Rara e Lendária têm 50% de ser do arquétipo ativo.
- **Sub-chefes (8)**: Quebradiço, Espião, Ganancioso, Teimoso, Apressado, Ladra, Embaralhador, Gêmeo, cada um com regra e recompensa. **Chefões (6)**: Juiz, Trapaceiro, Pêndulo (ato 1); Rancoroso, Burocrata, Duelista (ato 2), com regra fixa de anúncio, carta Troféu e omamori. Espólio: Troféu, omamori do chefão ou omamori sorteado.
- **Mesa do Apostador** (uma vez, ato 2): melhor de 3 de jokenpô contra o acaso, apostando 1 Lendária ou 8 moedas, pela Dinamite ou pelo Curinga.
- **22 omamoris** (4 básicos, 4 de arquétipo, 8 neutros, 6 dos chefões); máximo 5.

## 4. Interface (visual de protótipo)
Formas lisas e texto legível. Carta: faixa da cor do naipe com símbolo e nome, bolinha de raridade, efeito com a condição em etiqueta colorida (Vencer, Perder, Empatar, Jogar, Sempre), traços (Frágil, Nunca descartada, selo) e rodapé. Marcada tem borda ciano e olho; Frágil tem borda tracejada e rachadura; upgrade tem nome verde e "+".
Combate: três colunas no computador (oponente e você / mesa e mão / odds, últimas rodadas e botão principal) e uma coluna no celular (390×844). Telas: menu, pré-combate (com a escolha do sub-chefe e a prévia do chefão), omamori inicial, Loja, recompensa do sub-chefe, espólio, Mesa do Apostador, fim da run, trilha com os 2 atos. Mantidos: botão direito amplia a carta (tecla I), explicações só após 1 s parado, tutorial O Treinador (7 rodadas), dicas de primeira vez, glossário.

## 5. Código
`data/` (config, cards, omamoris, enemies, textos); `js/efeitos.js`, `motor.js`, `ia.js`, `run.js`; interface em `ui-base.js`, `ui-eventos.js`, `ui-combate.js`, `ui-run.js`, `ui-main.js`, `tutorial.js`, `tips.js`; `style.css`; `montar_artefato.py` gera o arquivo único. Lógica sem DOM. Salvamento: `jokenblitz_save_v4`.

## 6. Testes e medições
`node tests/cartas.js` (557), `node tests/simular.js` (runs completas e invariantes), `node tests/medidas.js` (as medições), e no Chromium `tests/ui_bot.js`, `ui_tutorial.js`, `ui_omamoris.js`. Os números das medições e as decisões onde a especificação foi omissa estão no `RELATORIO.md`.
