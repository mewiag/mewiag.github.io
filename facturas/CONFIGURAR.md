# Barbifacturas: cómo está armado

Para quien mantenga esto. Bárbara y María no necesitan leerlo: ellas solo abren su link.

- **App** (`index.html`): página estática en GitHub Pages. Se activa con un link `#u=<URL del receptor>&k=<clave>&p=Bárbara,María`. La clave se guarda solo en el teléfono.
- **Receptor** (`apps-script/Code.gs`): Google Apps Script publicado como aplicación web ("Ejecutar como: Yo", "Cualquier usuario"). Guarda cada ticket en `Barbifacturas/Tickets por facturar` en Drive y le dice a la app en qué va cada uno. Esta copia trae huecos (`__CLAVE__`, IDs de carpetas, token); la copia llena vive en el Drive de la dueña, en "Barbifacturas – código para pegar (privado)".
- **Procesador**: tarea programada de Claude Code llamada "Barbifacturas". Corre una vez al día y además la dispara el receptor (máximo una vez cada 15 minutos) cuando llega un ticket. Sigue [`PROCESAR.md`](PROCESAR.md); las mismas instrucciones están en la tarea.
- **Datos fiscales**: Google Doc `Barbifacturas/Perfiles fiscales`, llenado a partir de las Constancias de Situación Fiscal en `Barbifacturas/Constancias fiscales (CSF)`.

Requisitos para que el procesador funcione:

- El entorno de Claude Code necesita acceso de red completo, porque cada comercio tiene su propio portal.
- La tarea necesita los conectores de Google Drive y Gmail.
