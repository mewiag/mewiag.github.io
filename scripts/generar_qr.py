#!/usr/bin/env python3
"""Genera un código QR (SVG y PNG) por cada audio de audios/pistas.json.

Cada QR apunta a https://mewiag.github.io/audios/#<id>, que abre la página
con ese audio resaltado.

Uso:
    pip install segno
    python3 scripts/generar_qr.py
"""
import json
from pathlib import Path

import segno

URL_BASE = "https://mewiag.github.io/audios/"
VERDE_OSCURO = "#0B753B"

raiz = Path(__file__).resolve().parent.parent
datos = json.loads((raiz / "audios" / "pistas.json").read_text(encoding="utf-8"))
destino = raiz / "audios" / "qr"
destino.mkdir(exist_ok=True)

# QR general (lista completa)
qr = segno.make(URL_BASE, error="h")
qr.save(destino / "todos.svg", scale=10, border=4, dark=VERDE_OSCURO)
qr.save(destino / "todos.png", scale=20, border=4, dark=VERDE_OSCURO)
print(f"todos  -> {URL_BASE}")

for pista in datos["pistas"]:
    url = f"{URL_BASE}#{pista['id']}"
    qr = segno.make(url, error="h")
    nombre = f"audio-{pista['id']}"
    qr.save(destino / f"{nombre}.svg", scale=10, border=4, dark=VERDE_OSCURO)
    qr.save(destino / f"{nombre}.png", scale=20, border=4, dark=VERDE_OSCURO)
    print(f"{pista['id']:>5}  -> {url}")
