/**
 * Receptor de tickets para la app de facturas (mewiag.github.io/facturas/).
 *
 * Recibe la foto que manda la app y la guarda en tu Google Drive, en
 * "Facturas automáticas/pendientes". Nada se guarda en GitHub.
 *
 * Instalación: ver facturas/CONFIGURAR.md en el repositorio.
 */

// Edita estos nombres ANTES de correr configurar(). Cortos, sin espacios ni acentos.
const PERFILES_INICIALES = ['perfil1', 'perfil2'];

const NOMBRE_CARPETA_RAIZ = 'Facturas automáticas';
const SUBCARPETAS = ['pendientes', 'procesados', 'manuales', 'facturas'];
const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB
const TIPOS_PERMITIDOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Córrelo una vez desde el editor. Crea carpetas, el documento de perfiles y la clave. */
function configurar() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('CARPETA_PENDIENTES')) {
    Logger.log('Ya estaba configurado. Clave: %s', props.getProperty('CLAVE'));
    Logger.log('Perfiles: %s', props.getProperty('PERFILES'));
    return;
  }

  const raiz = DriveApp.createFolder(NOMBRE_CARPETA_RAIZ);
  const ids = {};
  SUBCARPETAS.forEach(function (nombre) {
    ids[nombre] = raiz.createFolder(nombre).getId();
  });

  const doc = DocumentApp.create('Perfiles fiscales');
  doc.getBody().setText(plantillaPerfiles(PERFILES_INICIALES));
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(raiz);

  const clave = Utilities.getUuid();
  props.setProperties({
    CLAVE: clave,
    PERFILES: PERFILES_INICIALES.join(','),
    CARPETA_PENDIENTES: ids.pendientes,
  });

  Logger.log('Listo. Carpeta: %s', raiz.getUrl());
  Logger.log('CLAVE (cópiala en la app): %s', clave);
  Logger.log('Perfiles: %s', PERFILES_INICIALES.join(', '));
  Logger.log('Ahora llena el documento "Perfiles fiscales" dentro de la carpeta.');
}

function plantillaPerfiles(perfiles) {
  return perfiles.map(function (p) {
    return [
      '=== PERFIL: ' + p + ' ===',
      'Correo al que se envían las facturas: ',
      'RFC: ',
      'Nombre o razón social (exacto como en la Constancia de Situación Fiscal): ',
      'Código postal del domicilio fiscal: ',
      'Régimen fiscal (clave y nombre): ',
      'Uso de CFDI (ej. G03 - Gastos en general): ',
      'Forma de pago por defecto si el portal la pide (opcional): ',
      'Notas para Claude (opcional): ',
      '',
    ].join('\n');
  }).join('\n');
}

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'Solicitud inválida' });
  }

  if (!datos.clave || datos.clave !== props.getProperty('CLAVE')) {
    return responder({ ok: false, error: 'Clave incorrecta' });
  }
  if (datos.accion === 'probar') {
    return responder({ ok: true, perfiles: props.getProperty('PERFILES').split(',') });
  }

  const perfiles = props.getProperty('PERFILES').split(',');
  if (perfiles.indexOf(datos.perfil) === -1) {
    return responder({ ok: false, error: 'Perfil desconocido: ' + datos.perfil });
  }
  const ext = TIPOS_PERMITIDOS[datos.tipo];
  if (!ext || !datos.imagen) {
    return responder({ ok: false, error: 'Falta la imagen o el formato no es válido' });
  }
  const bytes = Utilities.base64Decode(datos.imagen);
  if (bytes.length > TAMANO_MAXIMO) {
    return responder({ ok: false, error: 'La imagen pesa más de 10 MB' });
  }

  const ahora = new Date();
  const sello = Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
  const nombre = sello + '_' + datos.perfil + '.' + ext;
  const carpeta = DriveApp.getFolderById(props.getProperty('CARPETA_PENDIENTES'));
  const archivo = carpeta.createFile(Utilities.newBlob(bytes, datos.tipo, nombre));
  archivo.setDescription(JSON.stringify({
    perfil: datos.perfil,
    nota: String(datos.nota || '').slice(0, 500),
    subido: ahora.toISOString(),
    intentos: 0,
  }));

  return responder({ ok: true, archivo: nombre });
}

function doGet() {
  return responder({ ok: true, servicio: 'receptor de tickets' });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
