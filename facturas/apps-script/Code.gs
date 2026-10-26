/**
 * Barbifacturas: receptor de tickets.
 *
 * Recibe la foto o PDF que manda la app y lo guarda en la carpeta
 * "Barbifacturas/Tickets por facturar" de Google Drive. También le dice
 * a la app en qué va cada ticket.
 *
 * Esta copia del repositorio no trae la clave ni las carpetas. La copia
 * lista para pegar está en el Drive de la dueña de la cuenta.
 */

const CLAVE = '__CLAVE__';
const CARPETAS = {
  porFacturar: '__CARPETA_POR_FACTURAR__',
  facturados: '__CARPETA_FACTURADOS__',
  conProblema: '__CARPETA_CON_PROBLEMA__',
};

// Disparador por API de la tarea programada de Claude (claude.ai/code/routines).
// Si se deja vacío, los tickets esperan a la corrida diaria.
const DISPARADOR_URL = '__DISPARADOR_URL__';
const DISPARADOR_TOKEN = '__DISPARADOR_TOKEN__';
const PAUSA_ENTRE_DISPAROS = 15 * 60; // segundos

const TAMANO_MAXIMO = 15 * 1024 * 1024; // 15 MB
const TIPOS_PERMITIDOS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'Solicitud inválida' });
  }
  if (datos.clave !== CLAVE) {
    return responder({ ok: false, error: 'Este link ya no es válido' });
  }

  if (datos.accion === 'probar') return responder({ ok: true });
  if (datos.accion === 'estado') return responder({ ok: true, tickets: estado(datos.perfil) });
  return guardarTicket(datos);
}

function guardarTicket(datos) {
  const perfil = String(datos.perfil || '').trim().slice(0, 40);
  if (!perfil) return responder({ ok: false, error: 'Falta elegir de quién es el ticket' });

  const ext = TIPOS_PERMITIDOS[datos.tipo];
  if (!ext || !datos.archivo) {
    return responder({ ok: false, error: 'Solo se aceptan fotos o PDF' });
  }
  const bytes = Utilities.base64Decode(datos.archivo);
  if (bytes.length > TAMANO_MAXIMO) {
    return responder({ ok: false, error: 'El archivo es demasiado grande' });
  }

  const ahora = new Date();
  const sello = Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
  const nombre = sello + '_' + paraNombreDeArchivo(perfil) + '.' + ext;
  const archivo = DriveApp.getFolderById(CARPETAS.porFacturar)
    .createFile(Utilities.newBlob(bytes, datos.tipo, nombre));
  archivo.setDescription(JSON.stringify({
    perfil: perfil,
    nota: String(datos.nota || '').slice(0, 500),
    subido: ahora.toISOString(),
    intentos: 0,
  }));

  avisarAClaude();
  return responder({ ok: true });
}

/** Arranca la sesión de Claude, como mucho una vez cada PAUSA_ENTRE_DISPAROS. */
function avisarAClaude() {
  if (!/^https:/.test(DISPARADOR_URL) || !DISPARADOR_TOKEN || DISPARADOR_TOKEN.indexOf('__') === 0) return;
  const cache = CacheService.getScriptCache();
  if (cache.get('disparado')) return;
  cache.put('disparado', '1', PAUSA_ENTRE_DISPAROS);
  try {
    UrlFetchApp.fetch(DISPARADOR_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + DISPARADOR_TOKEN,
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'anthropic-version': '2023-06-01',
      },
      payload: JSON.stringify({ text: 'Llegó un ticket nuevo.' }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    // Si falla, la corrida diaria lo recoge.
  }
}

/** Los últimos tickets de un perfil, con su estado, para la pantalla "Mis tickets". */
function estado(perfil) {
  const tickets = [];
  [['porFacturar', 'en_espera'], ['facturados', 'facturado'], ['conProblema', 'problema']]
    .forEach(function (par) {
      const archivos = DriveApp.getFolderById(CARPETAS[par[0]]).getFiles();
      while (archivos.hasNext()) {
        const f = archivos.next();
        let d = {};
        try { d = JSON.parse(f.getDescription() || '{}'); } catch (err) { /* descripción libre */ }
        if (d.perfil !== perfil) continue;
        tickets.push({
          estado: par[1],
          subido: d.subido || f.getDateCreated().toISOString(),
          comercio: d.comercio || '',
          total: d.total || '',
          motivo: d.motivo || '',
        });
      }
    });
  tickets.sort(function (a, b) { return a.subido < b.subido ? 1 : -1; });
  return tickets.slice(0, 20);
}

function paraNombreDeArchivo(texto) {
  return texto.normalize('NFD').split('').filter(function (c) { return c.charCodeAt(0) < 128; }).join('')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'perfil';
}

function doGet() {
  return responder({ ok: true, servicio: 'Barbifacturas' });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
