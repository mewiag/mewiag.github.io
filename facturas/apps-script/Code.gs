/**
 * Barbifacturas: receptor de tickets.
 *
 * Recibe la foto o PDF que manda la app, lo guarda en la carpeta
 * "Barbifacturas/Tickets por facturar" de Google Drive y avisa por correo.
 * También alimenta la app del teléfono ("Mis tickets") y el panel de
 * escritorio (lista de todos los tickets, foto, datos fiscales y marcar
 * como facturado).
 *
 * Esta copia del repositorio no trae claves, carpetas ni datos fiscales.
 * La copia lista para pegar está en el Drive de la dueña de la cuenta.
 */

// CLAVE: la que va en el link de los teléfonos (subir tickets y ver los propios).
// CLAVE_PANEL: solo para el panel de escritorio (ve todo y los datos fiscales).
const CLAVE = '__CLAVE__';
const CLAVE_PANEL = '__CLAVE_PANEL__';
const CARPETAS = {
  porFacturar: '__CARPETA_POR_FACTURAR__',
  facturados: '__CARPETA_FACTURADOS__',
  conProblema: '__CARPETA_CON_PROBLEMA__',
};

// A quién avisar por correo cuando llega un ticket, y el link del panel.
const AVISAR_A = '__AVISAR_A__';
const URL_PANEL = 'https://mewiag.github.io/facturas/panel.html';

// Datos fiscales que el panel muestra listos para copiar.
const PERFILES = {
  '__PERFIL__': {
    rfc: '', nombre: '', cp: '', regimen: '', usoCfdi: '', correo: '',
  },
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
const ESTADOS = [['porFacturar', 'pendiente'], ['facturados', 'facturado'], ['conProblema', 'problema']];

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'Solicitud inválida' });
  }

  const delPanel = ['lista', 'imagen', 'marcar'].indexOf(datos.accion) !== -1;
  if (datos.clave !== (delPanel ? CLAVE_PANEL : CLAVE)) {
    return responder({ ok: false, error: 'Este link ya no es válido' });
  }

  if (datos.accion === 'probar') return responder({ ok: true });
  if (datos.accion === 'estado') return responder({ ok: true, tickets: estado(datos.perfil) });
  if (datos.accion === 'lista') return responder({ ok: true, tickets: lista(), perfiles: PERFILES });
  if (datos.accion === 'imagen') return imagen(datos.id);
  if (datos.accion === 'marcar') return marcar(datos.id, datos.destino, datos.motivo);
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
  const nota = String(datos.nota || '').slice(0, 500);
  const archivo = DriveApp.getFolderById(CARPETAS.porFacturar)
    .createFile(Utilities.newBlob(bytes, datos.tipo, nombre));
  archivo.setDescription(JSON.stringify({
    perfil: perfil,
    nota: nota,
    subido: ahora.toISOString(),
    intentos: 0,
  }));

  avisarPorCorreo(perfil, nota, ahora);
  avisarAClaude();
  return responder({ ok: true });
}

/** Correo inmediato a AVISAR_A cada vez que alguien sube un ticket. */
function avisarPorCorreo(perfil, nota, cuando) {
  if (!AVISAR_A || AVISAR_A.indexOf('@') === -1) return;
  const hora = Utilities.formatDate(cuando, Session.getScriptTimeZone(), "d/MM 'a las' HH:mm");
  try {
    MailApp.sendEmail({
      to: AVISAR_A,
      subject: '🧾 ' + perfil + ' subió un ticket',
      htmlBody:
        '<p>' + perfil + ' subió un ticket el ' + hora + '.</p>' +
        (nota ? '<p>Nota: ' + escapar(nota) + '</p>' : '') +
        '<p><a href="' + URL_PANEL + '">Abrir el panel de Barbifacturas</a></p>',
    });
  } catch (err) {
    // Sin correo no se pierde el ticket: ya está en Drive.
  }
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

/** Todos los tickets de todos los perfiles, para el panel. */
function lista() {
  const tickets = [];
  ESTADOS.forEach(function (par) {
    const archivos = DriveApp.getFolderById(CARPETAS[par[0]]).getFiles();
    while (archivos.hasNext()) {
      const f = archivos.next();
      const d = leerDescripcion(f);
      tickets.push({
        id: f.getId(),
        estado: par[1],
        preparado: !!d.portal,
        perfil: d.perfil || '',
        subido: d.subido || f.getDateCreated().toISOString(),
        nota: d.nota || '',
        comercio: d.comercio || '',
        total: d.total || '',
        fecha: d.fecha || '',
        portal: d.portal || '',
        campos: d.campos || {},
        plazo: d.plazo || '',
        motivo: d.motivo || '',
        tipo: f.getMimeType(),
      });
    }
  });
  tickets.sort(function (a, b) { return a.subido < b.subido ? 1 : -1; });
  return tickets;
}

/** Los últimos tickets de un perfil, para la pantalla "Mis tickets" del teléfono. */
function estado(perfil) {
  return lista()
    .filter(function (t) { return t.perfil === perfil; })
    .slice(0, 20)
    .map(function (t) {
      return {
        estado: t.estado === 'pendiente' ? 'en_espera' : t.estado,
        subido: t.subido,
        comercio: t.comercio,
        total: t.total,
        motivo: t.motivo,
      };
    });
}

function imagen(id) {
  const f = ticketPorId(id);
  if (!f) return responder({ ok: false, error: 'No encontré ese ticket' });
  return responder({
    ok: true,
    tipo: f.getMimeType(),
    archivo: Utilities.base64Encode(f.getBlob().getBytes()),
  });
}

/** Mueve un ticket a facturados, con problema o de regreso a por facturar. */
function marcar(id, destino, motivo) {
  const carpetas = { facturado: 'facturados', problema: 'conProblema', pendiente: 'porFacturar' };
  if (!carpetas[destino]) return responder({ ok: false, error: 'Destino inválido' });
  const f = ticketPorId(id);
  if (!f) return responder({ ok: false, error: 'No encontré ese ticket' });

  const d = leerDescripcion(f);
  if (destino === 'problema') d.motivo = String(motivo || 'Lo marcó el panel').slice(0, 300);
  else delete d.motivo;
  if (destino === 'facturado') d.facturado = new Date().toISOString();
  f.setDescription(JSON.stringify(d));
  f.moveTo(DriveApp.getFolderById(CARPETAS[carpetas[destino]]));
  return responder({ ok: true });
}

/** Solo devuelve archivos que viven en alguna carpeta de tickets. */
function ticketPorId(id) {
  let f;
  try { f = DriveApp.getFileById(String(id)); } catch (err) { return null; }
  const validas = ESTADOS.map(function (par) { return CARPETAS[par[0]]; });
  const padres = f.getParents();
  while (padres.hasNext()) {
    if (validas.indexOf(padres.next().getId()) !== -1) return f;
  }
  return null;
}

function leerDescripcion(f) {
  try { return JSON.parse(f.getDescription() || '{}'); } catch (err) { return {}; }
}

function paraNombreDeArchivo(texto) {
  return texto.normalize('NFD').split('').filter(function (c) { return c.charCodeAt(0) < 128; }).join('')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'perfil';
}

function escapar(texto) {
  return String(texto).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function doGet() {
  return responder({ ok: true, servicio: 'Barbifacturas' });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
