# Configurar la app de tickets

Son unos 15 minutos, una sola vez.

## 1. El receptor en Google Apps Script

1. Entra a <https://script.google.com> con la cuenta de Google donde quieres las fotos y crea un proyecto nuevo.
2. Borra lo que trae y pega el contenido de [`apps-script/Code.gs`](apps-script/Code.gs).
3. Arriba del todo, cambia `PERFILES_INICIALES` por los dos nombres cortos que quieras (sin espacios ni acentos, por ejemplo `['maria', 'pareja']`).
4. Selecciona la función `configurar` y dale **Ejecutar**. Google te pide permisos para Drive y Docs: acéptalos.
5. En el registro de ejecución aparecen la **clave** y el link a la carpeta. Copia la clave.
6. **Implementar → Nueva implementación**, tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**

   Copia la URL que termina en `/exec`.

"Cualquier usuario" significa que cualquiera que tenga la URL puede llamarla. Por eso existe la clave: sin ella el script rechaza todo.

Si después cambias el código, usa **Implementar → Gestionar implementaciones → editar → Nueva versión** para que la URL siga siendo la misma.

## 2. Los datos fiscales

Abre `Facturas automáticas/Perfiles fiscales` en tu Drive y llena los dos bloques. El nombre o razón social tiene que estar exactamente como en la Constancia de Situación Fiscal; en CFDI 4.0 un nombre distinto hace que el portal rechace la factura.

## 3. La app en el teléfono

1. Abre <https://mewiag.github.io/facturas/> en el teléfono.
2. En **Ajustes**, pega la URL `/exec`, la clave y los dos perfiles separados por coma. **Probar conexión**, luego **Guardar**.
3. Agrégala a la pantalla de inicio (Safari: Compartir → Agregar a inicio; Chrome: menú → Agregar a pantalla de inicio).
4. Para el otro teléfono: **Copiar link para otro teléfono** y mándalo por un canal privado. Al abrirlo, la app queda configurada.

## 4. Lo que hace Claude cada día

Una tarea programada abre una sesión de Claude Code una vez al día, que sigue [`PROCESAR.md`](PROCESAR.md). Para que funcione:

- El entorno de Claude Code necesita acceso de red completo. Con el acceso limitado, los portales de facturación están bloqueados.
- La tarea necesita los conectores de Google Drive y Gmail.
