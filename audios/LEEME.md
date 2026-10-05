# Canciones del libro (Mathink)

Página en `https://mewiag.github.io/audios/`. Un solo código QR lleva a la lista
completa. Ahí la maestra elige el nivel (G3, G4, G5) o busca por nombre o número.
La búsqueda no distingue acentos ni mayúsculas.

## Editar la lista de canciones

Toda la lista está en `audios/pistas.csv`. Se puede abrir con Excel o Google Sheets.
Columnas:

| nivel | numero | titulo | detalle | enlace |
|-------|--------|--------|---------|--------|
| G3 | 1 | Los números del 1 al 10 | Página 5 | archivos/g3-01.mp3 |

- `detalle` es opcional (por ejemplo, la página del libro).
- `enlace` puede ser:
  - un archivo de audio (`.mp3`, `.m4a`, `.wav`…) subido a `audios/archivos/` o en otro
    servidor: se reproduce dentro de la página;
  - cualquier otro enlace (Drive, YouTube, SoundCloud…): se abre en otra pestaña;
  - vacío: la canción aparece como "todavía no disponible".
- Se puede guardar con coma o con punto y coma como separador.
- Los niveles aparecen en el orden en que salen en el archivo.
- `audios/#g4` abre la página con G4 ya elegido.

## Código QR

```bash
pip install segno
python3 scripts/generar_qr.py
```

Crea `audios/qr/canciones.svg` (para imprenta) y `canciones.png`.
No cambies la dirección de la página después de imprimir.

## Logo

Guarda el logo como `audios/logo.png`. Mientras no exista, se muestra el texto
"Mathink · Método Singapur".
