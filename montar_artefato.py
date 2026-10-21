# Junta o jogo num arquivo HTML único (usado para publicar a página).
# Uso: python3 montar_artefato.py caminho/de/saida.html
import sys
d = __file__.rsplit('/', 1)[0] + '/'
css = open(d + 'style.css').read()
arquivos = ['data/config.js', 'data/cards.js', 'data/omamoris.js', 'data/enemies.js', 'data/textos.js', 'js/efeitos.js', 'js/motor.js', 'js/ia.js', 'js/run.js', 'js/tips.js', 'js/som.js', 'js/ui-base.js', 'js/tutorial.js', 'js/ui-eventos.js', 'js/ui-combate.js', 'js/ui-run.js', 'js/ui-main.js']
js = ''.join('<script>\n' + open(d + f).read() + '\n</script>\n' for f in arquivos)
html = f'''<title>Jokenblitz</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka:wght@500;600;700&display=swap">
<style>
:root {{ color-scheme: dark; }}
{css}
body {{ background: var(--fundo); color: var(--texto); }}
</style>
<main id="app"></main>
<div id="sr" class="sr" aria-live="polite"></div>
{js}'''
open(sys.argv[1], 'w').write(html)
print('ok', sys.argv[1], len(html))
