import * as XLSX from 'xlsx';

/**
 * Genera y descarga un reporte en formato Excel (.xlsx) estructurado, limpio y profesional,
 * agrupado por ZONA, con sus respectivos Colegios, Coordinadores Zonales, Coordinadores Locales
 * y Personeros de Mesa, filtrando cualquier dato irrelevante.
 */
export function exportarZonaExcel({
  zonaNombre = 'Zona Mariátegui',
  distrito = 'Villa María del Triunfo',
  colegiosAsignados = [],
  personeros = [],
  coordinadoresLocales = [],
  coordinadoresZonales = [],
  confirmacionesCoord = [],
  asistencias = [],
  statsGlobales = {},
  getColegioStats = null,
  isMarcadoPorCoord = null,
  checkLlegada = null,
  getPersoneroPhoto = null
}) {
  // Normalizador de texto
  const norm = (s) => (s || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Comparador inteligente de nombres de colegios
  const matchColegio = (colA, colB) => {
    if (!colA || !colB) return false;
    const cleanA = norm(colA);
    const cleanB = norm(colB);
    if (!cleanA || !cleanB) return false;
    if (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

    const numA = cleanA.match(/\b\d+\b/g);
    const numB = cleanB.match(/\b\d+\b/g);
    if (numA && numB) {
      const commonNum = numA.filter(n => numB.includes(n));
      if (commonNum.length > 0) return true;
    }

    const ignore = ['colegio', 'escuela', 'institucion', 'educativa', 'primaria', 'secundaria', 'inicial', 'sede', 'parroquial', 'iep', 'ie'];
    const tokA = cleanA.split(' ').filter(t => t.length > 3 && !ignore.includes(t));
    const tokB = cleanB.split(' ').filter(t => t.length > 3 && !ignore.includes(t));
    if (tokA.length > 0 && tokB.length > 0) {
      const commonTok = tokA.filter(t => tokB.includes(t));
      if (commonTok.length >= 2 || (tokA.length === 1 && commonTok.length === 1) || (tokB.length === 1 && commonTok.length === 1)) {
        return true;
      }
    }
    return false;
  };

  const fechaGeneracion = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Helper para saber si un personero o coordinador asistió
  const getAsistenciaStatus = (p) => {
    const pDni = (p.dni || p.DNI || '').toString().trim();
    if (!pDni) return 'PENDIENTE';
    if (isMarcadoPorCoord && isMarcadoPorCoord(p)) return 'CONFIRMADA';
    if (p.confirmado_coordinador || p.asistencia_confirmada) return 'CONFIRMADA';
    const hasConf = confirmacionesCoord.some(c => (c.personero_dni || '').toString().trim() === pDni);
    if (hasConf) return 'CONFIRMADA';
    const hasAsis = asistencias.some(a => (a.dni || '').toString().trim() === pDni);
    if (hasAsis) return 'CONFIRMADA';
    return 'PENDIENTE';
  };

  // Helper para saber si tiene foto de instalación
  const getFotoStatus = (p) => {
    if (getPersoneroPhoto && getPersoneroPhoto(p)) return 'SÍ';
    if (p.foto_url && p.foto_url.length > 10) return 'SÍ';
    const pDni = (p.dni || p.DNI || '').toString().trim();
    if (pDni) {
      const asis = asistencias.find(a => (a.dni || '').toString().trim() === pDni && a.foto_url);
      if (asis?.foto_url) return 'SÍ';
    }
    return 'NO';
  };

  // 1. Agrupar la estructura por ZONAS
  // Si existen coordinadores zonales registrados, estructuramos por cada uno
  const zonasEstructura = [];

  if (Array.isArray(coordinadoresZonales) && coordinadoresZonales.length > 0) {
    coordinadoresZonales.forEach((zonal, idx) => {
      const zonalColegiosRaw = (zonal.colegios || zonal.colegio || '').split(',').map(c => c.trim()).filter(Boolean);
      
      // Colegios que pertenecen a esta zona
      const colegiosDeEstaZona = (colegiosAsignados.length > 0 ? colegiosAsignados : zonalColegiosRaw).filter(colName => {
        return zonalColegiosRaw.some(zc => matchColegio(zc, colName));
      });

      // Si no hubo coincidencia estricta en el filtro de colegiosAsignados, usar los de la lista zonal
      const listaColegiosFinal = colegiosDeEstaZona.length > 0 ? colegiosDeEstaZona : zonalColegiosRaw;

      zonasEstructura.push({
        numeroZona: idx + 1,
        zonaNombre: zonal.zona || `Zona ${idx + 1} - ${zonal.nombre.split(' ')[0]}`,
        coordinadorZonal: zonal,
        colegios: listaColegiosFinal
      });
    });
  }

  // Si no hay coordinadores zonales específicos o quedan colegios huérfanos, agruparlos en Zona General
  const colegiosEnZonas = new Set(zonasEstructura.flatMap(z => z.colegios));
  const colegiosSueltos = colegiosAsignados.filter(col => !Array.from(colegiosEnZonas).some(zc => matchColegio(zc, col)));

  if (colegiosSueltos.length > 0 || zonasEstructura.length === 0) {
    zonasEstructura.push({
      numeroZona: zonasEstructura.length + 1,
      zonaNombre: zonaNombre || 'Zona General',
      coordinadorZonal: coordinadoresZonales[0] || null,
      colegios: colegiosSueltos.length > 0 ? colegiosSueltos : colegiosAsignados
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. HOJA 1: RESUMEN EJECUTIVO POR ZONAS Y COLEGIOS (SOLO DATOS RELEVANTES)
  // ─────────────────────────────────────────────────────────────────────────────
  const resumenRows = [
    ['SISTEMA ELECTORAL - CONTROL DE ASISTENCIA Y CONTEO DE ACTAS'],
    ['REPORTE EJECUTIVO POR ZONAS Y CENTROS DE VOTACIÓN'],
    [],
    ['Distrito:', distrito || 'Villa María del Triunfo'],
    ['Fecha de Generación:', fechaGeneracion],
    ['Total Centros de Votación:', colegiosAsignados.length],
    ['Total Mesas Oficiales:', statsGlobales?.mesasTotales || 0],
    ['Asistencia Global:', `${statsGlobales?.validadosTotales || 0} (${statsGlobales?.porcentajeGlobal || 0}%)`],
    [],
    [
      'N°',
      'Zona / Sector',
      'Coordinador Zonal',
      'Celular Coord. Zonal',
      'Centro de Votación (Colegio)',
      'Total Mesas',
      'Personeros Asistieron',
      'Faltan Asistir',
      '% Asistencia',
      'Fotos Instalación',
      'Coordinador de Local (Personero CV)',
      'DNI Coord. Local',
      'Celular Coord. Local',
      'Estado Asistencia Coord. Local'
    ]
  ];

  let resumenIndex = 1;

  zonasEstructura.forEach(zona => {
    const zCoord = zona.coordinadorZonal;
    const zNombre = zCoord?.nombre || 'Coordinador Zonal';
    const zCel = zCoord?.celular || '---';

    zona.colegios.forEach(colName => {
      const st = getColegioStats ? getColegioStats(colName) : null;
      const coordLocal = st?.coordLocal || coordinadoresLocales.find(c => matchColegio(c.colegio || c.local, colName));

      const isCoordLocalConfirmado = coordLocal ? (getAsistenciaStatus(coordLocal) === 'CONFIRMADA') : false;

      resumenRows.push([
        resumenIndex++,
        zona.zonaNombre,
        zNombre,
        zCel,
        colName,
        st ? st.totalMesas : 0,
        st ? st.asistieronValidados : 0,
        st ? st.faltan : 0,
        st ? `${st.porcentajeAsistencia}%` : '0%',
        st ? st.conFoto : 0,
        coordLocal?.nombre || 'Pendiente de Asignación',
        coordLocal?.dni || '---',
        coordLocal?.celular || '---',
        isCoordLocalConfirmado ? 'ASISTIÓ' : 'PENDIENTE'
      ]);
    });
  });

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
  wsResumen['!cols'] = [
    { wch: 6 },   // N°
    { wch: 22 },  // Zona
    { wch: 32 },  // Coord. Zonal
    { wch: 18 },  // Cel. Zonal
    { wch: 45 },  // Colegio
    { wch: 14 },  // Total Mesas
    { wch: 18 },  // Asistieron
    { wch: 14 },  // Faltan
    { wch: 15 },  // % Asistencia
    { wch: 16 },  // Fotos
    { wch: 36 },  // Coord. Local
    { wch: 16 },  // DNI Local
    { wch: 18 },  // Cel. Local
    { wch: 22 }   // Estado Asistencia Local
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HOJA 2: PADRÓN DETALLADO (ZONA -> COLEGIO -> COORDINADORES -> PERSONEROS)
  // ─────────────────────────────────────────────────────────────────────────────
  const detalleHeaders = [
    'N°',
    'Zona / Sector',
    'Coordinador Zonal',
    'Centro de Votación (Colegio)',
    'Rol Electoral',
    'N° Mesa',
    'Nombres y Apellidos',
    'DNI',
    'Celular / Contacto',
    'Asistencia',
    'Foto Instalación',
    'Conteo Manual',
    'Conteo OCR (Imagen)',
    'Total Votos Mesa'
  ];

  const detalleRows = [
    ['PADRÓN ELECTORAL Y CONTROL DE ASISTENCIA POR ZONAS'],
    [`Distrito: ${distrito || 'Villa María del Triunfo'} | Fecha: ${fechaGeneracion}`],
    [],
    detalleHeaders
  ];

  let padronIndex = 1;

  zonasEstructura.forEach(zona => {
    const zCoord = zona.coordinadorZonal;
    const zNombre = zCoord?.nombre || 'Coordinador Zonal';

    zona.colegios.forEach(colName => {
      // 1. Coordinador Local de este colegio
      const coordLocal = coordinadoresLocales.find(c => matchColegio(c.colegio || c.local, colName));

      if (coordLocal) {
        const asistioLocal = getAsistenciaStatus(coordLocal);
        detalleRows.push([
          padronIndex++,
          zona.zonaNombre,
          zNombre,
          colName,
          'COORDINADOR DE LOCAL',
          'LOCAL',
          coordLocal.nombre || 'Coordinador Local',
          coordLocal.dni || '---',
          coordLocal.celular || '---',
          asistioLocal,
          coordLocal.foto_url ? 'SÍ' : 'NO',
          '---',
          '---',
          '---'
        ]);
      }

      // 2. Personeros de este colegio
      const personerosCol = personeros.filter(p => matchColegio(p.colegio || p.local, colName));

      personerosCol.forEach(p => {
        const pDni = (p.dni || p.DNI || '').toString().trim();
        const asistioP = getAsistenciaStatus(p);
        const fotoP = getFotoStatus(p);

        const votoManualStr = p.voto_manual_enviado ? 'TRANSMITIDO' : 'PENDIENTE';
        const votoOcrStr = p.voto_imagen_enviado ? 'TRANSMITIDO' : 'PENDIENTE';
        const totalVotos = p.total_votos_mesa || p.p_total_votos || 0;

        detalleRows.push([
          padronIndex++,
          zona.zonaNombre,
          zNombre,
          colName,
          'PERSONERO DE MESA',
          p.mesa || p.mesa_asignada || '---',
          p.nombre || 'Personero',
          pDni || '---',
          p.celular || '---',
          asistioP,
          fotoP,
          votoManualStr,
          votoOcrStr,
          totalVotos > 0 ? totalVotos : '---'
        ]);
      });
    });
  });

  const wsDetalle = XLSX.utils.aoa_to_sheet(detalleRows);
  wsDetalle['!cols'] = [
    { wch: 6 },   // N°
    { wch: 22 },  // Zona
    { wch: 32 },  // Coord. Zonal
    { wch: 45 },  // Colegio
    { wch: 26 },  // Rol Electoral
    { wch: 14 },  // N° Mesa
    { wch: 38 },  // Nombre
    { wch: 15 },  // DNI
    { wch: 18 },  // Celular
    { wch: 16 },  // Asistencia
    { wch: 16 },  // Foto Instalación
    { wch: 18 },  // Conteo Manual
    { wch: 20 },  // Conteo OCR
    { wch: 18 }   // Total Votos
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. HOJAS INDIVIDUALES POR CADA ZONA
  // ─────────────────────────────────────────────────────────────────────────────
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen Zonas');
  XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Padrón General');

  // Si hay múltiples zonas, crear una pestaña dedicada para cada zona
  zonasEstructura.forEach(zona => {
    const zCoord = zona.coordinadorZonal;
    const zNombre = zCoord?.nombre || 'Coordinador Zonal';
    const zDni = zCoord?.dni || '---';
    const zCel = zCoord?.celular || '---';

    const zonaSheetRows = [
      [`REPORTE DE ${zona.zonaNombre.toUpperCase()}`],
      [`Coordinador Zonal: ${zNombre} | DNI: ${zDni} | Cel: ${zCel}`],
      [`Distrito: ${distrito || 'Villa María del Triunfo'} | Fecha: ${fechaGeneracion}`],
      [],
      [
        'N°',
        'Centro de Votación (Colegio)',
        'Rol Electoral',
        'N° Mesa',
        'Nombres y Apellidos',
        'DNI',
        'Celular',
        'Asistencia',
        'Foto Instalación',
        'Conteo Manual',
        'Conteo OCR',
        'Total Votos'
      ]
    ];

    let zIndex = 1;

    zona.colegios.forEach(colName => {
      // Coordinador Local
      const coordLocal = coordinadoresLocales.find(c => matchColegio(c.colegio || c.local, colName));
      if (coordLocal) {
        const asistioLocal = getAsistenciaStatus(coordLocal);
        zonaSheetRows.push([
          zIndex++,
          colName,
          'COORDINADOR DE LOCAL',
          'LOCAL',
          coordLocal.nombre || 'Coordinador Local',
          coordLocal.dni || '---',
          coordLocal.celular || '---',
          asistioLocal,
          coordLocal.foto_url ? 'SÍ' : 'NO',
          '---',
          '---',
          '---'
        ]);
      }

      // Personeros
      const personerosCol = personeros.filter(p => matchColegio(p.colegio || p.local, colName));
      personerosCol.forEach(p => {
        const pDni = (p.dni || p.DNI || '').toString().trim();
        const asistioP = getAsistenciaStatus(p);
        const fotoP = getFotoStatus(p);
        const votoManualStr = p.voto_manual_enviado ? 'TRANSMITIDO' : 'PENDIENTE';
        const votoOcrStr = p.voto_imagen_enviado ? 'TRANSMITIDO' : 'PENDIENTE';
        const totalVotos = p.total_votos_mesa || p.p_total_votos || 0;

        zonaSheetRows.push([
          zIndex++,
          colName,
          'PERSONERO DE MESA',
          p.mesa || p.mesa_asignada || '---',
          p.nombre || 'Personero',
          pDni || '---',
          p.celular || '---',
          asistioP,
          fotoP,
          votoManualStr,
          votoOcrStr,
          totalVotos > 0 ? totalVotos : '---'
        ]);
      });
    });

    const wsZonaIndividual = XLSX.utils.aoa_to_sheet(zonaSheetRows);
    wsZonaIndividual['!cols'] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 26 },
      { wch: 14 },
      { wch: 38 },
      { wch: 15 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 }
    ];

    // Nombre de pestaña (máx 31 caracteres para Excel)
    const rawSheetName = zona.zonaNombre.replace(/[:\\/?*[\]]/g, '').slice(0, 30);
    XLSX.utils.book_append_sheet(workbook, wsZonaIndividual, rawSheetName);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. GUARDAR Y DESCARGAR ARCHIVO EXCEL
  // ─────────────────────────────────────────────────────────────────────────────
  const cleanZona = (zonaNombre || 'Distrito')
    .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const fechaCompacta = new Date().toISOString().slice(0, 10);
  const fileName = `Reporte_Electoral_${cleanZona}_${fechaCompacta}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  return true;
}
