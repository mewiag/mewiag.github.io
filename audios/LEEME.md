# Audios del libro (Mathink)

Página tipo linktree en `https://mewiag.github.io/audios/` con un reproductor por audio.
Cada QR impreso abre la página con su audio resaltado (`.../audios/#01`, `#02`, …).

## Agregar o cambiar audios

1. Sube el archivo de audio (`.mp3`) a `audios/archivos/`, por ejemplo `archivos/04.mp3`.
2. Agrega una entrada en `audios/pistas.json`:

   ```json
   { "id": "04", "titulo": "Capítulo 3 · …", "detalle": "Página 30", "archivo": "archivos/04.mp3" }
   ```

   - `id` es lo que va en el QR. **Una vez impreso el libro, no lo cambies.**
   - `detalle` es opcional.
   - `archivo` también puede ser una URL directa a un `.mp3` en otro servidor.
3. Cambia `titulo`, `subtitulo` y `pie` dentro de `"libro"` con los datos del libro.

## Generar los códigos QR

```bash
pip install segno
python3 scripts/generar_qr.py
```

Crea en `audios/qr/` un SVG (para imprenta) y un PNG por audio, más `todos.svg/png`
que lleva a la lista completa.

## Logo

Guarda el logo como `audios/logo.png`. Mientras no exista, se muestra el texto
"Mathink · Método Singapur".
