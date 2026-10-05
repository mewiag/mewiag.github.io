#!/usr/bin/env python3
"""Genera el código QR (SVG para imprenta y PNG) de la página de canciones.

Todas las canciones comparten el mismo QR: lleva a la lista completa,
donde la maestra elige el nivel o busca la canción.

Uso:
    pip install segno
    python3 scripts/generar_qr.py
"""
from pathlib import Path

import segno

URL = "https://mewiag.github.io/audios/"
VERDE_OSCURO = "#0B753B"

destino = Path(__file__).resolve().parent.parent / "audios" / "qr"
destino.mkdir(exist_ok=True)

qr = segno.make(URL, error="h")
qr.save(destino / "canciones.svg", scale=10, border=4, dark=VERDE_OSCURO)
qr.save(destino / "canciones.png", scale=20, border=4, dark=VERDE_OSCURO)
print(f"QR -> {URL}")
