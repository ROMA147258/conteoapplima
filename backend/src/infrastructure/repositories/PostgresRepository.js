const { getPool, query } = require('../database/connection');
const { getOfficialCandidate } = require('../../constants/candidatesData');
const electoralBloomManager = require('../cache/ElectoralBloomManager');
const env = require('../../config/env');
const path = require('path');
const fs = require('fs');

class PostgresRepository {
  async getPool() {
    const pool = getPool();
    if (!pool) {
      throw new Error('Base de datos "conteo" no disponible o PostgreSQL desconectado.');
    }
    return pool;
  }

  // 1. LOGIN
  async login(data) {
    const rawDni = (data.dni || '').toString().trim();
    const rawNombre = (data.nombre || '').toString().trim();

    if (rawDni === '__warmup__' || rawNombre === '__warmup__') {
      return { success: true, status: 'success', message: 'Warmup exitoso' };
    }

    if (!rawDni && !rawNombre) {
      return { success: false, status: 'error', message: 'Se requiere DNI o Nombre para iniciar sesión' };
    }

    let targetDni = '';
    let targetNombre = '';

    if (rawDni && /^\d+$/.test(rawDni)) {
      targetDni = rawDni;
      targetNombre = rawNombre;
    } else if (rawNombre && /^\d+$/.test(rawNombre)) {
      targetDni = rawNombre;
      targetNombre = rawDni;
    } else {
      targetDni = rawDni;
      targetNombre = rawNombre;
    }

    const nameWords = targetNombre
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    // =========================================================================
    // ⚡ OPTIMIZACIÓN BLOOM FILTER: Descarte instantáneo de DNI no registrado (<0.05ms)
    // =========================================================================
    if (targetDni && nameWords.length === 0) {
      const existsInBloom = electoralBloomManager.hasDni(targetDni);
      if (!existsInBloom) {
        return {
          success: false,
          status: 'error',
          message: 'Usuario no encontrado en el sistema electoral. Verifica tu número de DNI.'
        };
      }
    }

    let usuarioBloqueado = null;

    // Función auxiliar para normalizar y validar credenciales/preguntas
    const validarAcceso = (u, defaultRol = 'Personero', defaultTabla = 'rpersoneros') => {
      const cleanVal = (v) => (v || '').toString().replace(/["']/g, '').trim().toLowerCase();
      const cred = cleanVal(u.credenciales);
      const preg = cleanVal(u.preguntas);
      const rolStr = cleanVal(u.rol || u.rol_a_desempenar);
      const tablaStr = (u.tabla_origen || defaultTabla).toLowerCase();

      const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred === 'si' || cred === '1' || cred.includes('aprobad')));
      const isDesaprobado = Boolean(cred.includes('desaprobad') || cred.includes('bloquead') || preg.includes('desaprobad') || preg.includes('reprobad'));
      const isAprobado = Boolean(preg && (preg.includes('aprobad') || preg === 'si' || preg === '1')) && !isDesaprobado;

      const isCoordZonal = tablaStr === 'rcoordinadoresz' || rolStr.includes('zonal');
      const isCoordLocal = tablaStr === 'rcoordinadores' || rolStr.includes('local') || (!isCoordZonal && (rolStr.includes('coordinador') || defaultRol.toLowerCase().includes('coordinador')));

      // RESTRICCIÓN COORDINADOR ZONAL: Únicamente habilitado para Villa María del Triunfo
      if (isCoordZonal) {
        const ubicacionRaw = (u.ubicacion || u.distrito_asignado || u.distrito_donde_vota || u.distrito || '')
          .toString()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        const isVMT = ubicacionRaw.includes('villa maria del triunfo') || ubicacionRaw.includes('vmt');
        if (!isVMT) {
          const errorMsg = 'Acceso Restringido: La interfaz de Coordinador Zonal está habilitada únicamente para el distrito de Villa María del Triunfo.';
          usuarioBloqueado = {
            isBlocked: true,
            status: 'blocked',
            rol: 'Coordinador Zonal',
            message: errorMsg
          };
          return { valid: false, message: errorMsg };
        }
      }

      if (isConfirmed && isAprobado) {
        if (isCoordZonal) {
          u.origenHoja = 'rcoordinadoresz';
          u.tabla_origen = 'rcoordinadoresz';
          u.rol = u.rol_a_desempenar || 'Coordinador Zonal';
          u.tipo_interfaz = 'coordinador_zonal';
        } else if (isCoordLocal) {
          u.origenHoja = 'rcoordinadores';
          u.tabla_origen = 'rcoordinadores';
          u.rol = u.rol_a_desempenar || 'Coordinador de Local';
          u.tipo_interfaz = 'coordinador_local';
        } else {
          u.origenHoja = 'rpersoneros';
          u.tabla_origen = 'rpersoneros';
          u.rol = 'Personero';
          const ubicacionRaw = (u.ubicacion || u.distrito_asignado || u.distrito_donde_vota || u.distrito || '')
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          const isVMT = ubicacionRaw.includes('villa maria del triunfo') || ubicacionRaw.includes('vmt');
          u.tipo_interfaz = isVMT ? 'personero_asistencia' : 'personero_conteo';
        }
        return { valid: true, user: u };
      } else {
        let errorMsg = `Acceso Denegado: Tus credenciales deben estar en estado Confirmado y tu evaluación en estado Aprobado para poder ingresar.`;
        if (cred.includes('desaprobad') || cred.includes('bloquead')) {
          errorMsg = `Acceso Denegado: Tus credenciales se encuentran en estado '${u.credenciales}' en el sistema.`;
        } else if (preg.includes('desaprobad') || preg.includes('reprobad')) {
          errorMsg = `Acceso Denegado: Tu evaluación se encuentra en estado '${u.preguntas}'. Debes estar Aprobado para ingresar.`;
        } else if (!isConfirmed) {
          errorMsg = `Acceso Denegado: Tus credenciales se encuentran en estado '${u.credenciales || 'Pendiente'}'. Deben estar en estado Confirmado.`;
        } else if (!isAprobado) {
          errorMsg = `Acceso Denegado: Tu evaluación se encuentra en estado '${u.preguntas || 'Pendiente'}'. Debe estar en estado Aprobado.`;
        }

        usuarioBloqueado = {
          isBlocked: true,
          status: 'blocked',
          rol: isCoordZonal ? 'Coordinador Zonal' : isCoordLocal ? 'Coordinador de Local' : 'Personero',
          message: errorMsg
        };
        return { valid: false, message: errorMsg };
      }
    };

    // 1. rcoordinadoresz / rcoordinadores (Coordinadores formulario - Buscar PRIMERO)
    const buscarEnRcoordinadores = async () => {
      // ⚡ Intento en caché en memoria indexada por Bloom
      if (targetDni) {
        const cached = electoralBloomManager.getUserByDni(targetDni);
        if (cached && (cached.tabla_origen === 'rcoordinadoresz' || cached.tabla_origen === 'rcoordinadores')) {
          const validResult = validarAcceso({ ...cached }, 'Coordinador', cached.tabla_origen);
          if (validResult.valid) return validResult.user;
          return null;
        }
      }

      const tablasCoord = ['rcoordinadoresz', 'rcoordinadores'];

      for (const tabla of tablasCoord) {
        let res = null;
        if (targetDni) {
          try {
            res = await query(`
              SELECT 
                dni,
                nombres_y_apellidos AS nombre,
                COALESCE(NULLIF(rol_a_desempenar, ''), 'Coordinador') AS rol,
                COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
                COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
                '' AS mesa,
                credenciales,
                preguntas,
                '${tabla}' AS tabla_origen
              FROM ${tabla}
              WHERE TRIM(dni) ILIKE $1
              LIMIT 1
            `, [targetDni]);
          } catch (e) {}
        }

        if ((!res || !res.rows || res.rows.length === 0) && nameWords.length > 0) {
          const params = [];
          const whereClauses = nameWords.map((w) => {
            params.push(`%${w}%`);
            return `nombres_y_apellidos ILIKE $${params.length}`;
          });
          try {
            res = await query(`
              SELECT 
                dni,
                nombres_y_apellidos AS nombre,
                COALESCE(NULLIF(rol_a_desempenar, ''), 'Coordinador') AS rol,
                COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
                COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
                '' AS mesa,
                credenciales,
                preguntas,
                '${tabla}' AS tabla_origen
              FROM ${tabla}
              WHERE ${whereClauses.join(' AND ')}
              LIMIT 1
            `, params);
          } catch (e) {}
        }

        if (res && res.rows && res.rows.length > 0) {
          const validResult = validarAcceso(res.rows[0], 'Coordinador', tabla);
          if (validResult.valid) return validResult.user;
          return null;
        }
      }
      return null;
    };

    // 2. rpersoneros (Personeros formulario)
    const buscarEnRpersoneros = async () => {
      // ⚡ Intento en caché en memoria indexada por Bloom
      if (targetDni) {
        const cached = electoralBloomManager.getUserByDni(targetDni);
        if (cached && cached.tabla_origen === 'rpersoneros') {
          const rolStr = (cached.rol || '').toString().toLowerCase();
          const defaultRol = rolStr.includes('coordinador') ? 'Coordinador' : 'Personero';
          const validResult = validarAcceso({ ...cached }, defaultRol, 'rpersoneros');
          if (validResult.valid) return validResult.user;
          return null;
        }
      }

      let res = null;
      if (targetDni) {
        try {
          res = await query(`
            SELECT 
              dni,
              nombres_y_apellidos AS nombre,
              COALESCE(NULLIF(rol_a_desempenar, ''), 'Personero') AS rol,
              COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
              COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
              COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa,
              credenciales,
              preguntas,
              'rpersoneros' AS tabla_origen
            FROM rpersoneros
            WHERE TRIM(dni) ILIKE $1
            LIMIT 1
          `, [targetDni]);
        } catch (e) {}
      }

      if ((!res || !res.rows || res.rows.length === 0) && nameWords.length > 0) {
        const params = [];
        const whereClauses = nameWords.map((w) => {
          params.push(`%${w}%`);
          return `nombres_y_apellidos ILIKE $${params.length}`;
        });
        try {
          res = await query(`
            SELECT 
              dni,
              nombres_y_apellidos AS nombre,
              COALESCE(NULLIF(rol_a_desempenar, ''), 'Personero') AS rol,
              COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
              COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
              COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa,
              credenciales,
              preguntas,
              'rpersoneros' AS tabla_origen
            FROM rpersoneros
            WHERE ${whereClauses.join(' AND ')}
            LIMIT 1
          `, params);
        } catch (e) {}
      }

      if (res && res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        const rolStr = (row.rol || '').toString().toLowerCase();
        const defaultRol = rolStr.includes('coordinador') ? 'Coordinador' : 'Personero';
        const validResult = validarAcceso(row, defaultRol, 'rpersoneros');
        if (validResult.valid) return validResult.user;
        return null;
      }
      return null;
    };

    const enriquecerEstadoUsuario = async (u) => {
      if (!u || !u.dni) return u;
      const dniTrim = (u.dni || '').toString().trim();
      const mesaTrim = (u.mesa || '').toString().trim();

      // 1. Asistencia (foto y confirmación)
      try {
        const asisRes = await query(`
          SELECT mesa, local, confirmacion, foto_url, ubicacion_gps, fecha_hora
          FROM asistencia
          WHERE TRIM(dni) = $1
          ORDER BY id DESC
          LIMIT 1
        `, [dniTrim]);
        if (asisRes.rows && asisRes.rows.length > 0) {
          u.asistencia_confirmada = true;
          u.asistencia_data = asisRes.rows[0];
          if (asisRes.rows[0].mesa) u.mesa_asistencia = asisRes.rows[0].mesa;
          if (asisRes.rows[0].local) u.colegio_asistencia = asisRes.rows[0].local;
        } else {
          u.asistencia_confirmada = false;
          u.asistencia_data = null;
        }
      } catch (e) {
        u.asistencia_confirmada = false;
      }

      // 2. Asistencia Llegada (GPS)
      try {
        const llegadaRes = await query(`
          SELECT mesa, colegio, latitud, longitud, distancia_metros, fecha_registro
          FROM asistenciallegada
          WHERE TRIM(dni) = $1
          ORDER BY id DESC
          LIMIT 1
        `, [dniTrim]);
        if (llegadaRes.rows && llegadaRes.rows.length > 0) {
          u.llegada_confirmada = true;
          u.llegada_data = llegadaRes.rows[0];
        } else {
          u.llegada_confirmada = false;
          u.llegada_data = null;
        }
      } catch (e) {
        u.llegada_confirmada = false;
      }

      // 3. Votos Manuales
      // 3. Votos Manuales
      try {
        const vCheck = await query(`
          SELECT numero_mesa, origen, p_total_votos
          FROM votos_detalle
          WHERE TRIM(dni) = $1 AND origen = 'MANUAL'
          LIMIT 1
        `, [dniTrim]);
        u.voto_manual_enviado = Boolean(vCheck && vCheck.rows && vCheck.rows.length > 0);
        u.voto_manual_data = vCheck.rows[0] || null;
      } catch (e) {
        u.voto_manual_enviado = false;
      }

      // 4. Votos Imagen / OCR
      try {
        const vImgCheck = await query(`
          SELECT numero_mesa, origen, p_total_votos
          FROM votos_detalle
          WHERE TRIM(dni) = $1 AND origen = 'IMAGEN'
          LIMIT 1
        `, [dniTrim]);
        u.voto_imagen_enviado = Boolean(vImgCheck && vImgCheck.rows && vImgCheck.rows.length > 0);
        u.voto_imagen_data = vImgCheck.rows[0] || null;
      } catch (e) {
        u.voto_imagen_enviado = false;
      }

      return u;
    };

    // 1. Coordinadores primero (rcoordinadoresz / rcoordinadores)
    let usuarioEncontrado = await buscarEnRcoordinadores();
    if (usuarioEncontrado) {
      usuarioEncontrado = await enriquecerEstadoUsuario(usuarioEncontrado);
      return { success: true, status: 'success', usuario: usuarioEncontrado, user: usuarioEncontrado, data: usuarioEncontrado };
    }
    if (usuarioBloqueado) {
      return { success: false, status: 'blocked', message: usuarioBloqueado.message };
    }

    // 2. Personeros (rpersoneros)
    usuarioEncontrado = await buscarEnRpersoneros();
    if (usuarioEncontrado) {
      usuarioEncontrado = await enriquecerEstadoUsuario(usuarioEncontrado);
      return { success: true, status: 'success', usuario: usuarioEncontrado, user: usuarioEncontrado, data: usuarioEncontrado };
    }
    if (usuarioBloqueado) {
      return { success: false, status: 'blocked', message: usuarioBloqueado.message };
    }

    return { success: false, status: 'error', message: 'Usuario no encontrado en el sistema electoral. Verifica tu DNI o nombre.' };
  }

  // 2. REGISTRAR VOTOS (CON BLOOM FILTER & UPSERT RESILIENTE)
  async registrarVotos(data) {
    const mesaStr = (data.mesa || '').toString().trim();
    const origenStr = (data.origen || 'MANUAL').toString().trim().toUpperCase();
    const dniStr = (data.dni || '').toString().trim();
    const prov = data.votos ? (data.votos.provincial || {}) : {};
    const dist = data.votos ? (data.votos.distrital || {}) : {};

    const extractVote = (item) => {
      if (item === undefined || item === null) return 0;
      if (typeof item === 'object') {
        return parseInt(item.votos ?? item.val ?? item.value ?? 0, 10) || 0;
      }
      return parseInt(item, 10) || 0;
    };

    const extractCand = (item, partyKey, tipoEleccion) => {
      if (item && typeof item === 'object' && item.candidato) {
        const c = (item.candidato || '').toString().trim();
        if (c && !c.toLowerCase().startsWith('candidato ')) {
          return c;
        }
      } else if (typeof item === 'string') {
        const c = item.trim();
        if (c && !c.toLowerCase().startsWith('candidato ')) {
          return c;
        }
      }
      return getOfficialCandidate(tipoEleccion, data.ubicacion || data.distrito || '', partyKey);
    };

    const p_sp_v = extractVote(prov["SOMOS PERU"] || prov.SP);
    const p_rp_v = extractVote(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP);
    const p_an_v = extractVote(prov["AHORA NACION"] || prov.AN);
    const p_avanza_v = extractVote(prov["AVANZA PAIS"] || prov.AVANZA);
    const p_podemos_v = extractVote(prov.PODEMOS || prov["PODEMOS PERU"]);
    const p_jp_v = extractVote(prov.JP || prov["JUNTOS POR EL PERU"]);
    const p_obras_v = extractVote(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"]);
    const p_frepap_v = extractVote(prov.FREPAP);
    const p_ap_v = extractVote(prov["ACCION POPULAR"] || prov.AP);
    const p_esperanza_v = extractVote(prov.ESPERANZA || prov.FE || prov["FRENTE DE LA ESPERANZA"]);
    const p_venceremos_v = extractVote(prov.VENCEREMOS || prov.AEV || prov["ALIANZA ELECTORAL VENCEREMOS"]);
    const p_vision_v = extractVote(prov["VISION PERU"] || prov.VP || prov.VISION);
    const p_apra_v = extractVote(prov.APRA || prov["PARTIDO APRISTA PERUANO"]);
    const p_fp_v = extractVote(prov.FP || prov["FUERZA POPULAR"]);
    const p_ppc_v = extractVote(prov.PPC || prov["PARTIDO POPULAR CRISTIANO"]);
    const p_progresemos_v = extractVote(prov.PROGRESEMOS || prov.PROG);
    const p_morado_v = extractVote(prov.MORADO || prov.PM || prov["PARTIDO MORADO"]);
    const p_buen_gobierno_v = extractVote(prov["BUEN GOBIERNO"] || prov.PBG || prov["PARTIDO DEL BUEN GOBIERNO"]);
    const p_verde_v = extractVote(prov.VERDE || prov.PDV || prov["PARTIDO DEMOCRATA VERDE"]);
    const p_peru_libre_v = extractVote(prov["PERU LIBRE"] || prov.PL);
    const p_tierra_verde_v = extractVote(prov["TIERRA VERDE"] || prov.CTTV);
    const p_pueblo_consciente_v = extractVote(prov["PUEBLO CONSCIENTE"] || prov.PC);
    const p_ppp_v = extractVote(prov.PPP || prov["PARTIDO PATRIOTICO DEL PERU"]);
    const p_integridad_v = extractVote(prov.INTEGRIDAD || prov.ID || prov["INTEGRIDAD DEMOCRATICA"]);
    const p_fuerza_ciudadana_v = extractVote(prov["FUERZA CIUDADANA"] || prov.FC);
    const p_batalla_v = extractVote(prov["BATALLA PERU"] || prov.BP);
    const p_app_v = extractVote(prov.APP || prov["ALIANZA PARA EL PROGRESO"]);
    const p_alianza_regional_v = extractVote(prov["ALIANZA REGIONAL"] || prov.ARP || prov["ALIANZA REGIONAL POR EL PERU"]);

    const p_nulos = parseInt(data.votos_nulos ?? prov.NULOS ?? 0, 10) || 0;
    const p_blanco = parseInt(data.votos_blancos ?? prov.BLANCO ?? 0, 10) || 0;
    const p_impugnados = parseInt(data.votos_impugnados ?? prov.IMPUGNADOS ?? 0, 10) || 0;

    let p_cands_sum = 0;
    Object.keys(prov).forEach(k => {
      if (!['NULOS', 'BLANCO', 'IMPUGNADOS'].includes(k.toUpperCase())) {
        p_cands_sum += extractVote(prov[k]);
      }
    });
    const p_tot = p_cands_sum + p_nulos + p_blanco + p_impugnados;

    const d_sp_v = extractVote(dist["SOMOS PERU"] || dist.SP);
    const d_rp_v = extractVote(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP);
    const d_an_v = extractVote(dist["AHORA NACION"] || dist.AN);
    const d_avanza_v = extractVote(dist["AVANZA PAIS"] || dist.AVANZA);
    const d_podemos_v = extractVote(dist.PODEMOS || dist["PODEMOS PERU"]);
    const d_jp_v = extractVote(dist.JP || dist["JUNTOS POR EL PERU"]);
    const d_obras_v = extractVote(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"]);
    const d_frepap_v = extractVote(dist.FREPAP);
    const d_ap_v = extractVote(dist["ACCION POPULAR"] || dist.AP);
    const d_esperanza_v = extractVote(dist.ESPERANZA || dist.FE || dist["FRENTE DE LA ESPERANZA"]);
    const d_venceremos_v = extractVote(dist.VENCEREMOS || dist.AEV || dist["ALIANZA ELECTORAL VENCEREMOS"]);
    const d_vision_v = extractVote(dist["VISION PERU"] || dist.VP || dist.VISION);
    const d_apra_v = extractVote(dist.APRA || dist["PARTIDO APRISTA PERUANO"]);
    const d_fp_v = extractVote(dist.FP || dist["FUERZA POPULAR"]);
    const d_ppc_v = extractVote(dist.PPC || dist["PARTIDO POPULAR CRISTIANO"]);
    const d_progresemos_v = extractVote(dist.PROGRESEMOS || dist.PROG);
    const d_morado_v = extractVote(dist.MORADO || dist.PM || dist["PARTIDO MORADO"]);
    const d_buen_gobierno_v = extractVote(dist["BUEN GOBIERNO"] || dist.PBG || dist["PARTIDO DEL BUEN GOBIERNO"]);
    const d_verde_v = extractVote(dist.VERDE || dist.PDV || dist["PARTIDO DEMOCRATA VERDE"]);
    const d_peru_libre_v = extractVote(dist["PERU LIBRE"] || dist.PL);
    const d_tierra_verde_v = extractVote(dist["TIERRA VERDE"] || dist.CTTV);
    const d_pueblo_consciente_v = extractVote(dist["PUEBLO CONSCIENTE"] || dist.PC);
    const d_ppp_v = extractVote(dist.PPP || dist["PARTIDO PATRIOTICO DEL PERU"]);
    const d_integridad_v = extractVote(dist.INTEGRIDAD || dist.ID || dist["INTEGRIDAD DEMOCRATICA"]);
    const d_fuerza_ciudadana_v = extractVote(dist["FUERZA CIUDADANA"] || dist.FC);
    const d_batalla_v = extractVote(dist["BATALLA PERU"] || dist.BP);
    const d_app_v = extractVote(dist.APP || dist["ALIANZA PARA EL PROGRESO"]);
    const d_alianza_regional_v = extractVote(dist["ALIANZA REGIONAL"] || dist.ARP || dist["ALIANZA REGIONAL POR EL PERU"]);

    const d_nulos = parseInt(data.votos_dist_nulos ?? dist.NULOS ?? 0, 10) || 0;
    const d_blanco = parseInt(data.votos_dist_blancos ?? dist.BLANCO ?? 0, 10) || 0;
    const d_impugnados = parseInt(data.votos_dist_impugnados ?? dist.IMPUGNADOS ?? 0, 10) || 0;

    let d_cands_sum = 0;
    Object.keys(dist).forEach(k => {
      if (!['NULOS', 'BLANCO', 'IMPUGNADOS'].includes(k.toUpperCase())) {
        d_cands_sum += extractVote(dist[k]);
      }
    });
    const d_tot = d_cands_sum + d_nulos + d_blanco + d_impugnados;

    const votosJson = JSON.stringify(data.votos || { provincial: prov, distrital: dist });

    // ⚡ Manejo de colisiones / UPSERT seguro garantizado:
    // Primero verificamos si ya existe registro previo para este usuario por (dni, origen) o por (mesa, origen) si no hay DNI
    let existingRowId = null;
    try {
      let checkRes;
      if (dniStr) {
        checkRes = await query(`
          SELECT id FROM votos_detalle
          WHERE TRIM(dni) = $1 AND UPPER(origen) = $2
          LIMIT 1
        `, [dniStr, origenStr]);
      } else if (mesaStr) {
        checkRes = await query(`
          SELECT id FROM votos_detalle
          WHERE numero_mesa = $1 AND UPPER(origen) = $2
          LIMIT 1
        `, [mesaStr, origenStr]);
      }
      if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
        existingRowId = checkRes.rows[0].id;
      }
    } catch (e) {}

    if (existingRowId) {
      const updateSql = `
        UPDATE votos_detalle SET
          personero = $1, dni = $2, departamento = $3, provincia = $4, ubicacion = $5, colegio = $6, numero_mesa = $7, origen = $8,
          p_sp_candidato = $9, p_sp_votos = $10, p_rp_candidato = $11, p_rp_votos = $12, p_an_candidato = $13, p_an_votos = $14,
          p_avanza_candidato = $15, p_avanza_votos = $16, p_podemos_candidato = $17, p_podemos_votos = $18, p_jp_candidato = $19, p_jp_votos = $20,
          p_obras_candidato = $21, p_obras_votos = $22, p_frepap_candidato = $23, p_frepap_votos = $24, p_ap_candidato = $25, p_ap_votos = $26,
          p_esperanza_candidato = $27, p_esperanza_votos = $28, p_venceremos_candidato = $29, p_venceremos_votos = $30, p_vision_candidato = $31, p_vision_votos = $32,
          p_apra_candidato = $33, p_apra_votos = $34, p_fp_candidato = $35, p_fp_votos = $36, p_ppc_candidato = $37, p_ppc_votos = $38,
          p_progresemos_candidato = $39, p_progresemos_votos = $40, p_morado_candidato = $41, p_morado_votos = $42, p_buen_gobierno_candidato = $43, p_buen_gobierno_votos = $44,
          p_verde_candidato = $45, p_verde_votos = $46, p_peru_libre_candidato = $47, p_peru_libre_votos = $48, p_tierra_verde_candidato = $49, p_tierra_verde_votos = $50,
          p_pueblo_consciente_candidato = $51, p_pueblo_consciente_votos = $52, p_ppp_candidato = $53, p_ppp_votos = $54, p_integridad_candidato = $55, p_integridad_votos = $56,
          p_fuerza_ciudadana_candidato = $57, p_fuerza_ciudadana_votos = $58, p_batalla_candidato = $59, p_batalla_votos = $60, p_app_candidato = $61, p_app_votos = $62,
          p_alianza_regional_candidato = $63, p_alianza_regional_votos = $64,
          p_nulos = $65, p_blanco = $66, p_impugnados = $67, p_total_votos = $68,
          d_sp_candidato = $69, d_sp_votos = $70, d_rp_candidato = $71, d_rp_votos = $72, d_an_candidato = $73, d_an_votos = $74,
          d_avanza_candidato = $75, d_avanza_votos = $76, d_podemos_candidato = $77, d_podemos_votos = $78, d_jp_candidato = $79, d_jp_votos = $80,
          d_obras_candidato = $81, d_obras_votos = $82, d_frepap_candidato = $83, d_frepap_votos = $84, d_ap_candidato = $85, d_ap_votos = $86,
          d_esperanza_candidato = $87, d_esperanza_votos = $88, d_venceremos_candidato = $89, d_venceremos_votos = $90, d_vision_candidato = $91, d_vision_votos = $92,
          d_apra_candidato = $93, d_apra_votos = $94, d_fp_candidato = $95, d_fp_votos = $96, d_ppc_candidato = $97, d_ppc_votos = $98,
          d_progresemos_candidato = $99, d_progresemos_votos = $100, d_morado_candidato = $101, d_morado_votos = $102, d_buen_gobierno_candidato = $103, d_buen_gobierno_votos = $104,
          d_verde_candidato = $105, d_verde_votos = $106, d_peru_libre_candidato = $107, d_peru_libre_votos = $108, d_tierra_verde_candidato = $109, d_tierra_verde_votos = $110,
          d_pueblo_consciente_candidato = $111, d_pueblo_consciente_votos = $112, d_ppp_candidato = $113, d_ppp_votos = $114, d_integridad_candidato = $115, d_integridad_votos = $116,
          d_fuerza_ciudadana_candidato = $117, d_fuerza_ciudadana_votos = $118, d_batalla_candidato = $119, d_batalla_votos = $120, d_app_candidato = $121, d_app_votos = $122,
          d_alianza_regional_candidato = $123, d_alianza_regional_votos = $124,
          d_nulos = $125, d_blanco = $126, d_impugnados = $127, d_total_votos = $128,
          votos_json = $129, fecha_hora = CURRENT_TIMESTAMP
        WHERE id = $130
      `;

      const updateParams = [
        data.brigadista || data.personero || data.nombre || '', 
        dniStr, 
        data.departamento || 'Lima', 
        data.provincia || 'Lima',
        data.ubicacion || data.distrito || '', 
        data.colegio || data.local || '', 
        mesaStr, 
        origenStr,
        // Provincial candidates
        extractCand(prov["SOMOS PERU"] || prov.SP, "SOMOS PERU", "PROVINCIAL"), p_sp_v,
        extractCand(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP, "RENOVACION", "PROVINCIAL"), p_rp_v,
        extractCand(prov["AHORA NACION"] || prov.AN, "AHORA NACION", "PROVINCIAL"), p_an_v,
        extractCand(prov["AVANZA PAIS"] || prov.AVANZA, "AVANZA PAIS", "PROVINCIAL"), p_avanza_v,
        extractCand(prov.PODEMOS || prov["PODEMOS PERU"], "PODEMOS", "PROVINCIAL"), p_podemos_v,
        extractCand(prov.JP || prov["JUNTOS POR EL PERU"], "JP", "PROVINCIAL"), p_jp_v,
        extractCand(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"], "OBRAS", "PROVINCIAL"), p_obras_v,
        extractCand(prov.FREPAP, "FREPAP", "PROVINCIAL"), p_frepap_v,
        extractCand(prov["ACCION POPULAR"] || prov.AP, "ACCION POPULAR", "PROVINCIAL"), p_ap_v,
        extractCand(prov.ESPERANZA || prov.FE || prov["FRENTE DE LA ESPERANZA"], "ESPERANZA", "PROVINCIAL"), p_esperanza_v,
        extractCand(prov.VENCEREMOS || prov.AEV || prov["ALIANZA ELECTORAL VENCEREMOS"], "VENCEREMOS", "PROVINCIAL"), p_venceremos_v,
        extractCand(prov["VISION PERU"] || prov.VP || prov.VISION, "VISION PERU", "PROVINCIAL"), p_vision_v,
        extractCand(prov.APRA || prov["PARTIDO APRISTA PERUANO"], "APRA", "PROVINCIAL"), p_apra_v,
        extractCand(prov.FP || prov["FUERZA POPULAR"], "FP", "PROVINCIAL"), p_fp_v,
        extractCand(prov.PPC || prov["PARTIDO POPULAR CRISTIANO"], "PPC", "PROVINCIAL"), p_ppc_v,
        extractCand(prov.PROGRESEMOS || prov.PROG, "PROGRESEMOS", "PROVINCIAL"), p_progresemos_v,
        extractCand(prov.MORADO || prov.PM || prov["PARTIDO MORADO"], "MORADO", "PROVINCIAL"), p_morado_v,
        extractCand(prov["BUEN GOBIERNO"] || prov.PBG || prov["PARTIDO DEL BUEN GOBIERNO"], "BUEN GOBIERNO", "PROVINCIAL"), p_buen_gobierno_v,
        extractCand(prov.VERDE || prov.PDV || prov["PARTIDO DEMOCRATA VERDE"], "VERDE", "PROVINCIAL"), p_verde_v,
        extractCand(prov["PERU LIBRE"] || prov.PL, "PERU LIBRE", "PROVINCIAL"), p_peru_libre_v,
        extractCand(prov["TIERRA VERDE"] || prov.CTTV, "TIERRA VERDE", "PROVINCIAL"), p_tierra_verde_v,
        extractCand(prov["PUEBLO CONSCIENTE"] || prov.PC, "PUEBLO CONSCIENTE", "PROVINCIAL"), p_pueblo_consciente_v,
        extractCand(prov.PPP || prov["PARTIDO PATRIOTICO DEL PERU"], "PPP", "PROVINCIAL"), p_ppp_v,
        extractCand(prov.INTEGRIDAD || prov.ID || prov["INTEGRIDAD DEMOCRATICA"], "INTEGRIDAD", "PROVINCIAL"), p_integridad_v,
        extractCand(prov["FUERZA CIUDADANA"] || prov.FC, "FUERZA CIUDADANA", "PROVINCIAL"), p_fuerza_ciudadana_v,
        extractCand(prov["BATALLA PERU"] || prov.BP, "BATALLA PERU", "PROVINCIAL"), p_batalla_v,
        extractCand(prov.APP || prov["ALIANZA PARA EL PROGRESO"], "APP", "PROVINCIAL"), p_app_v,
        extractCand(prov["ALIANZA REGIONAL"] || prov.ARP || prov["ALIANZA REGIONAL POR EL PERU"], "ALIANZA REGIONAL", "PROVINCIAL"), p_alianza_regional_v,
        p_nulos, p_blanco, p_impugnados, p_tot,
        // Distrital candidates
        extractCand(dist["SOMOS PERU"] || dist.SP, "SOMOS PERU", "DISTRITAL"), d_sp_v,
        extractCand(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP, "RENOVACION", "DISTRITAL"), d_rp_v,
        extractCand(dist["AHORA NACION"] || dist.AN, "AHORA NACION", "DISTRITAL"), d_an_v,
        extractCand(dist["AVANZA PAIS"] || dist.AVANZA, "AVANZA PAIS", "DISTRITAL"), d_avanza_v,
        extractCand(dist.PODEMOS || dist["PODEMOS PERU"], "PODEMOS", "DISTRITAL"), d_podemos_v,
        extractCand(dist.JP || dist["JUNTOS POR EL PERU"], "JP", "DISTRITAL"), d_jp_v,
        extractCand(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"], "OBRAS", "DISTRITAL"), d_obras_v,
        extractCand(dist.FREPAP, "FREPAP", "DISTRITAL"), d_frepap_v,
        extractCand(dist["ACCION POPULAR"] || dist.AP, "ACCION POPULAR", "DISTRITAL"), d_ap_v,
        extractCand(dist.ESPERANZA || dist.FE || dist["FRENTE DE LA ESPERANZA"], "ESPERANZA", "DISTRITAL"), d_esperanza_v,
        extractCand(dist.VENCEREMOS || dist.AEV || dist["ALIANZA ELECTORAL VENCEREMOS"], "VENCEREMOS", "DISTRITAL"), d_venceremos_v,
        extractCand(dist["VISION PERU"] || dist.VP || dist.VISION, "VISION PERU", "DISTRITAL"), d_vision_v,
        extractCand(dist.APRA || dist["PARTIDO APRISTA PERUANO"], "APRA", "DISTRITAL"), d_apra_v,
        extractCand(dist.FP || dist["FUERZA POPULAR"], "FP", "DISTRITAL"), d_fp_v,
        extractCand(dist.PPC || dist["PARTIDO POPULAR CRISTIANO"], "PPC", "DISTRITAL"), d_ppc_v,
        extractCand(dist.PROGRESEMOS || dist.PROG, "PROGRESEMOS", "DISTRITAL"), d_progresemos_v,
        extractCand(dist.MORADO || dist.PM || dist["PARTIDO MORADO"], "MORADO", "DISTRITAL"), d_morado_v,
        extractCand(dist["BUEN GOBIERNO"] || dist.PBG || dist["PARTIDO DEL BUEN GOBIERNO"], "BUEN GOBIERNO", "DISTRITAL"), d_buen_gobierno_v,
        extractCand(dist.VERDE || dist.PDV || dist["PARTIDO DEMOCRATA VERDE"], "VERDE", "DISTRITAL"), d_verde_v,
        extractCand(dist["PERU LIBRE"] || dist.PL, "PERU LIBRE", "DISTRITAL"), d_peru_libre_v,
        extractCand(dist["TIERRA VERDE"] || dist.CTTV, "TIERRA VERDE", "DISTRITAL"), d_tierra_verde_v,
        extractCand(dist["PUEBLO CONSCIENTE"] || dist.PC, "PUEBLO CONSCIENTE", "DISTRITAL"), d_pueblo_consciente_v,
        extractCand(dist.PPP || dist["PARTIDO PATRIOTICO DEL PERU"], "PPP", "DISTRITAL"), d_ppp_v,
        extractCand(dist.INTEGRIDAD || dist.ID || dist["INTEGRIDAD DEMOCRATICA"], "INTEGRIDAD", "DISTRITAL"), d_integridad_v,
        extractCand(dist["FUERZA CIUDADANA"] || dist.FC, "FUERZA CIUDADANA", "DISTRITAL"), d_fuerza_ciudadana_v,
        extractCand(dist["BATALLA PERU"] || dist.BP, "BATALLA PERU", "DISTRITAL"), d_batalla_v,
        extractCand(dist.APP || dist["ALIANZA PARA EL PROGRESO"], "APP", "DISTRITAL"), d_app_v,
        extractCand(dist["ALIANZA REGIONAL"] || dist.ARP || dist["ALIANZA REGIONAL POR EL PERU"], "ALIANZA REGIONAL", "DISTRITAL"), d_alianza_regional_v,
        d_nulos, d_blanco, d_impugnados, d_tot,
        votosJson,
        existingRowId
      ];

      await query(updateSql, updateParams);
    } else {
      const insertSql = `
        INSERT INTO votos_detalle (
          personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
          p_sp_candidato, p_sp_votos, p_rp_candidato, p_rp_votos, p_an_candidato, p_an_votos,
          p_avanza_candidato, p_avanza_votos, p_podemos_candidato, p_podemos_votos, p_jp_candidato, p_jp_votos,
          p_obras_candidato, p_obras_votos, p_frepap_candidato, p_frepap_votos, p_ap_candidato, p_ap_votos,
          p_esperanza_candidato, p_esperanza_votos, p_venceremos_candidato, p_venceremos_votos, p_vision_candidato, p_vision_votos,
          p_apra_candidato, p_apra_votos, p_fp_candidato, p_fp_votos, p_ppc_candidato, p_ppc_votos,
          p_progresemos_candidato, p_progresemos_votos, p_morado_candidato, p_morado_votos, p_buen_gobierno_candidato, p_buen_gobierno_votos,
          p_verde_candidato, p_verde_votos, p_peru_libre_candidato, p_peru_libre_votos, p_tierra_verde_candidato, p_tierra_verde_votos,
          p_pueblo_consciente_candidato, p_pueblo_consciente_votos, p_ppp_candidato, p_ppp_votos, p_integridad_candidato, p_integridad_votos,
          p_fuerza_ciudadana_candidato, p_fuerza_ciudadana_votos, p_batalla_candidato, p_batalla_votos, p_app_candidato, p_app_votos,
          p_alianza_regional_candidato, p_alianza_regional_votos,
          p_nulos, p_blanco, p_impugnados, p_total_votos,
          d_sp_candidato, d_sp_votos, d_rp_candidato, d_rp_votos, d_an_candidato, d_an_votos,
          d_avanza_candidato, d_avanza_votos, d_podemos_candidato, d_podemos_votos, d_jp_candidato, d_jp_votos,
          d_obras_candidato, d_obras_votos, d_frepap_candidato, d_frepap_votos, d_ap_candidato, d_ap_votos,
          d_esperanza_candidato, d_esperanza_votos, d_venceremos_candidato, d_venceremos_votos, d_vision_candidato, d_vision_votos,
          d_apra_candidato, d_apra_votos, d_fp_candidato, d_fp_votos, d_ppc_candidato, d_ppc_votos,
          d_progresemos_candidato, d_progresemos_votos, d_morado_candidato, d_morado_votos, d_buen_gobierno_candidato, d_buen_gobierno_votos,
          d_verde_candidato, d_verde_votos, d_peru_libre_candidato, d_peru_libre_votos, d_tierra_verde_candidato, d_tierra_verde_votos,
          d_pueblo_consciente_candidato, d_pueblo_consciente_votos, d_ppp_candidato, d_ppp_votos, d_integridad_candidato, d_integridad_votos,
          d_fuerza_ciudadana_candidato, d_fuerza_ciudadana_votos, d_batalla_candidato, d_batalla_votos, d_app_candidato, d_app_votos,
          d_alianza_regional_candidato, d_alianza_regional_votos,
          d_nulos, d_blanco, d_impugnados, d_total_votos, votos_json, fecha_hora
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
          $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56,
          $57, $58, $59, $60, $61, $62, $63, $64,
          $65, $66, $67, $68,
          $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80,
          $81, $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92,
          $93, $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104,
          $105, $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116,
          $117, $118, $119, $120, $121, $122, $123, $124,
          $125, $126, $127, $128, $129, CURRENT_TIMESTAMP
        )
      `;

      const insertParams = [
        data.brigadista || data.personero || data.nombre || '', 
        dniStr, 
        data.departamento || 'Lima', 
        data.provincia || 'Lima',
        data.ubicacion || data.distrito || '', 
        data.colegio || data.local || '', 
        mesaStr, 
        origenStr,
        // Provincial candidates
        extractCand(prov["SOMOS PERU"] || prov.SP, "SOMOS PERU", "PROVINCIAL"), p_sp_v,
        extractCand(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP, "RENOVACION", "PROVINCIAL"), p_rp_v,
        extractCand(prov["AHORA NACION"] || prov.AN, "AHORA NACION", "PROVINCIAL"), p_an_v,
        extractCand(prov["AVANZA PAIS"] || prov.AVANZA, "AVANZA PAIS", "PROVINCIAL"), p_avanza_v,
        extractCand(prov.PODEMOS || prov["PODEMOS PERU"], "PODEMOS", "PROVINCIAL"), p_podemos_v,
        extractCand(prov.JP || prov["JUNTOS POR EL PERU"], "JP", "PROVINCIAL"), p_jp_v,
        extractCand(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"], "OBRAS", "PROVINCIAL"), p_obras_v,
        extractCand(prov.FREPAP, "FREPAP", "PROVINCIAL"), p_frepap_v,
        extractCand(prov["ACCION POPULAR"] || prov.AP, "ACCION POPULAR", "PROVINCIAL"), p_ap_v,
        extractCand(prov.ESPERANZA || prov.FE || prov["FRENTE DE LA ESPERANZA"], "ESPERANZA", "PROVINCIAL"), p_esperanza_v,
        extractCand(prov.VENCEREMOS || prov.AEV || prov["ALIANZA ELECTORAL VENCEREMOS"], "VENCEREMOS", "PROVINCIAL"), p_venceremos_v,
        extractCand(prov["VISION PERU"] || prov.VP || prov.VISION, "VISION PERU", "PROVINCIAL"), p_vision_v,
        extractCand(prov.APRA || prov["PARTIDO APRISTA PERUANO"], "APRA", "PROVINCIAL"), p_apra_v,
        extractCand(prov.FP || prov["FUERZA POPULAR"], "FP", "PROVINCIAL"), p_fp_v,
        extractCand(prov.PPC || prov["PARTIDO POPULAR CRISTIANO"], "PPC", "PROVINCIAL"), p_ppc_v,
        extractCand(prov.PROGRESEMOS || prov.PROG, "PROGRESEMOS", "PROVINCIAL"), p_progresemos_v,
        extractCand(prov.MORADO || prov.PM || prov["PARTIDO MORADO"], "MORADO", "PROVINCIAL"), p_morado_v,
        extractCand(prov["BUEN GOBIERNO"] || prov.PBG || prov["PARTIDO DEL BUEN GOBIERNO"], "BUEN GOBIERNO", "PROVINCIAL"), p_buen_gobierno_v,
        extractCand(prov.VERDE || prov.PDV || prov["PARTIDO DEMOCRATA VERDE"], "VERDE", "PROVINCIAL"), p_verde_v,
        extractCand(prov["PERU LIBRE"] || prov.PL, "PERU LIBRE", "PROVINCIAL"), p_peru_libre_v,
        extractCand(prov["TIERRA VERDE"] || prov.CTTV, "TIERRA VERDE", "PROVINCIAL"), p_tierra_verde_v,
        extractCand(prov["PUEBLO CONSCIENTE"] || prov.PC, "PUEBLO CONSCIENTE", "PROVINCIAL"), p_pueblo_consciente_v,
        extractCand(prov.PPP || prov["PARTIDO PATRIOTICO DEL PERU"], "PPP", "PROVINCIAL"), p_ppp_v,
        extractCand(prov.INTEGRIDAD || prov.ID || prov["INTEGRIDAD DEMOCRATICA"], "INTEGRIDAD", "PROVINCIAL"), p_integridad_v,
        extractCand(prov["FUERZA CIUDADANA"] || prov.FC, "FUERZA CIUDADANA", "PROVINCIAL"), p_fuerza_ciudadana_v,
        extractCand(prov["BATALLA PERU"] || prov.BP, "BATALLA PERU", "PROVINCIAL"), p_batalla_v,
        extractCand(prov.APP || prov["ALIANZA PARA EL PROGRESO"], "APP", "PROVINCIAL"), p_app_v,
        extractCand(prov["ALIANZA REGIONAL"] || prov.ARP || prov["ALIANZA REGIONAL POR EL PERU"], "ALIANZA REGIONAL", "PROVINCIAL"), p_alianza_regional_v,
        // Provincial Metrics
        p_nulos, p_blanco, p_impugnados, p_tot,
        // Distrital candidates
        extractCand(dist["SOMOS PERU"] || dist.SP, "SOMOS PERU", "DISTRITAL"), d_sp_v,
        extractCand(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP, "RENOVACION", "DISTRITAL"), d_rp_v,
        extractCand(dist["AHORA NACION"] || dist.AN, "AHORA NACION", "DISTRITAL"), d_an_v,
        extractCand(dist["AVANZA PAIS"] || dist.AVANZA, "AVANZA PAIS", "DISTRITAL"), d_avanza_v,
        extractCand(dist.PODEMOS || dist["PODEMOS PERU"], "PODEMOS", "DISTRITAL"), d_podemos_v,
        extractCand(dist.JP || dist["JUNTOS POR EL PERU"], "JP", "DISTRITAL"), d_jp_v,
        extractCand(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"], "OBRAS", "DISTRITAL"), d_obras_v,
        extractCand(dist.FREPAP, "FREPAP", "DISTRITAL"), d_frepap_v,
        extractCand(dist["ACCION POPULAR"] || dist.AP, "ACCION POPULAR", "DISTRITAL"), d_ap_v,
        extractCand(dist.ESPERANZA || dist.FE || dist["FRENTE DE LA ESPERANZA"], "ESPERANZA", "DISTRITAL"), d_esperanza_v,
        extractCand(dist.VENCEREMOS || dist.AEV || dist["ALIANZA ELECTORAL VENCEREMOS"], "VENCEREMOS", "DISTRITAL"), d_venceremos_v,
        extractCand(dist["VISION PERU"] || dist.VP || dist.VISION, "VISION PERU", "DISTRITAL"), d_vision_v,
        extractCand(dist.APRA || dist["PARTIDO APRISTA PERUANO"], "APRA", "DISTRITAL"), d_apra_v,
        extractCand(dist.FP || dist["FUERZA POPULAR"], "FP", "DISTRITAL"), d_fp_v,
        extractCand(dist.PPC || dist["PARTIDO POPULAR CRISTIANO"], "PPC", "DISTRITAL"), d_ppc_v,
        extractCand(dist.PROGRESEMOS || dist.PROG, "PROGRESEMOS", "DISTRITAL"), d_progresemos_v,
        extractCand(dist.MORADO || dist.PM || dist["PARTIDO MORADO"], "MORADO", "DISTRITAL"), d_morado_v,
        extractCand(dist["BUEN GOBIERNO"] || dist.PBG || dist["PARTIDO DEL BUEN GOBIERNO"], "BUEN GOBIERNO", "DISTRITAL"), d_buen_gobierno_v,
        extractCand(dist.VERDE || dist.PDV || dist["PARTIDO DEMOCRATA VERDE"], "VERDE", "DISTRITAL"), d_verde_v,
        extractCand(dist["PERU LIBRE"] || dist.PL, "PERU LIBRE", "DISTRITAL"), d_peru_libre_v,
        extractCand(dist["TIERRA VERDE"] || dist.CTTV, "TIERRA VERDE", "DISTRITAL"), d_tierra_verde_v,
        extractCand(dist["PUEBLO CONSCIENTE"] || dist.PC, "PUEBLO CONSCIENTE", "DISTRITAL"), d_pueblo_consciente_v,
        extractCand(dist.PPP || dist["PARTIDO PATRIOTICO DEL PERU"], "PPP", "DISTRITAL"), d_ppp_v,
        extractCand(dist.INTEGRIDAD || dist.ID || dist["INTEGRIDAD DEMOCRATICA"], "INTEGRIDAD", "DISTRITAL"), d_integridad_v,
        extractCand(dist["FUERZA CIUDADANA"] || dist.FC, "FUERZA CIUDADANA", "DISTRITAL"), d_fuerza_ciudadana_v,
        extractCand(dist["BATALLA PERU"] || dist.BP, "BATALLA PERU", "DISTRITAL"), d_batalla_v,
        extractCand(dist.APP || dist["ALIANZA PARA EL PROGRESO"], "APP", "DISTRITAL"), d_app_v,
        extractCand(dist["ALIANZA REGIONAL"] || dist.ARP || dist["ALIANZA REGIONAL POR EL PERU"], "ALIANZA REGIONAL", "DISTRITAL"), d_alianza_regional_v,
        // Distrital Metrics
        d_nulos, d_blanco, d_impugnados, d_tot,
        votosJson
      ];

      try {
        await query(insertSql, insertParams);
      } catch (insertErr) {
        // Fallback resiliente si hubo colisión concurrente
        console.warn('[PostgresRepository] Colisión detectada en inserción, reintentando como actualización...');
        let retryCheck;
        if (dniStr) {
          retryCheck = await query(`
            SELECT id FROM votos_detalle
            WHERE TRIM(dni) = $1 AND UPPER(origen) = $2
            LIMIT 1
          `, [dniStr, origenStr]);
        } else if (mesaStr) {
          retryCheck = await query(`
            SELECT id FROM votos_detalle
            WHERE numero_mesa = $1 AND UPPER(origen) = $2
            LIMIT 1
          `, [mesaStr, origenStr]);
        }
        if (retryCheck && retryCheck.rows && retryCheck.rows.length > 0) {
          const retryUpdateParams = [...insertParams, retryCheck.rows[0].id];
          const retrySql = `
            UPDATE votos_detalle SET
              personero = $1, dni = $2, departamento = $3, provincia = $4, ubicacion = $5, colegio = $6, numero_mesa = $7, origen = $8,
              p_sp_candidato = $9, p_sp_votos = $10, p_rp_candidato = $11, p_rp_votos = $12, p_an_candidato = $13, p_an_votos = $14,
              p_avanza_candidato = $15, p_avanza_votos = $16, p_podemos_candidato = $17, p_podemos_votos = $18, p_jp_candidato = $19, p_jp_votos = $20,
              p_obras_candidato = $21, p_obras_votos = $22, p_frepap_candidato = $23, p_frepap_votos = $24, p_ap_candidato = $25, p_ap_votos = $26,
              p_esperanza_candidato = $27, p_esperanza_votos = $28, p_venceremos_candidato = $29, p_venceremos_votos = $30, p_vision_candidato = $31, p_vision_votos = $32,
              p_apra_candidato = $33, p_apra_votos = $34, p_fp_candidato = $35, p_fp_votos = $36, p_ppc_candidato = $37, p_ppc_votos = $38,
              p_progresemos_candidato = $39, p_progresemos_votos = $40, p_morado_candidato = $41, p_morado_votos = $42, p_buen_gobierno_candidato = $43, p_buen_gobierno_votos = $44,
              p_verde_candidato = $45, p_verde_votos = $46, p_peru_libre_candidato = $47, p_peru_libre_votos = $48, p_tierra_verde_candidato = $49, p_tierra_verde_votos = $50,
              p_pueblo_consciente_candidato = $51, p_pueblo_consciente_votos = $52, p_ppp_candidato = $53, p_ppp_votos = $54, p_integridad_candidato = $55, p_integridad_votos = $56,
              p_fuerza_ciudadana_candidato = $57, p_fuerza_ciudadana_votos = $58, p_batalla_candidato = $59, p_batalla_votos = $60, p_app_candidato = $61, p_app_votos = $62,
              p_alianza_regional_candidato = $63, p_alianza_regional_votos = $64,
              p_nulos = $65, p_blanco = $66, p_impugnados = $67, p_total_votos = $68,
              d_sp_candidato = $69, d_sp_votos = $70, d_rp_candidato = $71, d_rp_votos = $72, d_an_candidato = $73, d_an_votos = $74,
              d_avanza_candidato = $75, d_avanza_votos = $76, d_podemos_candidato = $77, d_podemos_votos = $78, d_jp_candidato = $79, d_jp_votos = $80,
              d_obras_candidato = $81, d_obras_votos = $82, d_frepap_candidato = $83, d_frepap_votos = $84, d_ap_candidato = $85, d_ap_votos = $86,
              d_esperanza_candidato = $87, d_esperanza_votos = $88, d_venceremos_candidato = $89, d_venceremos_votos = $90, d_vision_candidato = $91, d_vision_votos = $92,
              d_apra_candidato = $93, d_apra_votos = $94, d_fp_candidato = $95, d_fp_votos = $96, d_ppc_candidato = $97, d_ppc_votos = $98,
              d_progresemos_candidato = $99, d_progresemos_votos = $100, d_morado_candidato = $101, d_morado_votos = $102, d_buen_gobierno_candidato = $103, d_buen_gobierno_votos = $104,
              d_verde_candidato = $105, d_verde_votos = $106, d_peru_libre_candidato = $107, d_peru_libre_votos = $108, d_tierra_verde_candidato = $109, d_tierra_verde_votos = $110,
              d_pueblo_consciente_candidato = $111, d_pueblo_consciente_votos = $112, d_ppp_candidato = $113, d_ppp_votos = $114, d_integridad_candidato = $115, d_integridad_votos = $116,
              d_fuerza_ciudadana_candidato = $117, d_fuerza_ciudadana_votos = $118, d_batalla_candidato = $119, d_batalla_votos = $120, d_app_candidato = $121, d_app_votos = $122,
              d_alianza_regional_candidato = $123, d_alianza_regional_votos = $124,
              d_nulos = $125, d_blanco = $126, d_impugnados = $127, d_total_votos = $128,
              votos_json = $129, fecha_hora = CURRENT_TIMESTAMP
            WHERE id = $130
          `;
          await query(retrySql, retryUpdateParams);
        }
      }
    }

    // ⚡ Actualizar Bloom Filter con el nuevo voto registrado
    electoralBloomManager.recordVoteSubmission(dniStr, mesaStr, origenStr);

    return { success: true, message: 'Votos registrados correctamente en PostgreSQL.' };
  }

  // 3. REGISTRAR ASISTENCIA (PERSONERO)
  async registrarAsistencia(data) {
    const sql = `
      INSERT INTO asistencia (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `;
    const params = [
      data.nombre || '',
      data.dni || '',
      data.distrito || '',
      data.local || data.colegio || '',
      data.mesa || '',
      data.confirmacion || 'SI',
      data.foto_url || data.fotoBase64 || '',
      data.ubicacion_gps || data.ubicacionGps || ''
    ];
    await query(sql, params);

    // ⚡ Actualizar Bloom Filter
    if (data.dni) electoralBloomManager.recordAttendance(data.dni);

    return { success: true, message: 'Asistencia registrada exitosamente en PostgreSQL' };
  }

  // 4. CONFIRMAR ASISTENCIA LLEGADA (GPS 50m)
  async confirmarAsistenciaLlegada(data) {
    const sql = `
      INSERT INTO asistenciallegada (
        nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado, fecha_registro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    `;
    const params = [
      data.nombre || '',
      data.dni || '',
      data.distrito || '',
      data.colegio || data.local || '',
      data.mesa || '',
      (data.latitud || '').toString(),
      (data.longitud || '').toString(),
      parseFloat(data.distancia_metros) || 0,
      50,
      'CONFIRMADO 2DA LLEGADA'
    ];
    await query(sql, params);

    // ⚡ Actualizar Bloom Filter
    if (data.dni) electoralBloomManager.recordLlegada(data.dni);

    return { success: true, message: 'Llegada confirmada exitosamente (GPS 50m)' };
  }

  // 5. CONFIRMAR COORDINADOR
  async confirmarCoordinador(data) {
    const personeroDni = (data.personero_dni || data.personeroDni || '').toString().trim();
    const local = (data.local || data.colegio || '').toString().trim();
    const personeroNombre = (data.personero_nombre || data.personeroNombre || '').toString().trim();
    const distrito = (data.distrito || '').toString().trim();
    const coordNombre = (data.coordinador_nombre || data.coordinadorNombre || '').toString().trim();
    const coordDni = (data.coordinador_dni || data.coordinadorDni || '').toString().trim();
    const confirmacion = (data.confirmacion || 'SI').toString().trim();
    const fotoUrl = (data.foto_url || data.fotoBase64 || '').toString().trim();

    if (!personeroDni) {
      return { success: false, message: 'DNI de personero requerido' };
    }

    // Verificar si ya existe confirmación para este personero en este local (evitar duplicados)
    const checkSql = `
      SELECT id FROM coordinadores 
      WHERE TRIM(personero_dni) = $1 AND TRIM(local) = $2
      LIMIT 1
    `;
    const existing = await query(checkSql, [personeroDni, local]);

    if (existing && existing.rows && existing.rows.length > 0) {
      const updateSql = `
        UPDATE coordinadores
        SET personero_nombre = $1,
            distrito = $2,
            coordinador_nombre = $3,
            coordinador_dni = $4,
            confirmacion = $5,
            foto_url = CASE WHEN $6 != '' THEN $6 ELSE foto_url END,
            fecha_hora = CURRENT_TIMESTAMP
        WHERE id = $7
      `;
      await query(updateSql, [personeroNombre, distrito, coordNombre, coordDni, confirmacion, fotoUrl, existing.rows[0].id]);
      return { success: true, message: 'Confirmación de coordinador actualizada exitosamente' };
    }

    const insertSql = `
      INSERT INTO coordinadores (personero_nombre, personero_dni, distrito, local, coordinador_nombre, coordinador_dni, confirmacion, foto_url, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `;
    await query(insertSql, [personeroNombre, personeroDni, distrito, local, coordNombre, coordDni, confirmacion, fotoUrl]);
    return { success: true, message: 'Confirmación de coordinador registrada exitosamente' };
  }

  // 6. OBTENER USUARIOS
  async obtenerUsuarios() {
    const sql = `
      SELECT 
        dni, 
        nombres_y_apellidos AS nombre, 
        'Personero' AS rol, 
        COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion, 
        COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio, 
        COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa, 
        'Rpersoneros' AS "origenHoja"
      FROM rpersoneros
      WHERE (
        credenciales ILIKE '%confirmad%' 
        OR credenciales = 'SI' 
        OR credenciales = '1'
        OR credenciales ILIKE '%aprobado%'
      )
      AND (
        preguntas ILIKE '%aprobad%'
        OR preguntas = 'SI'
        OR preguntas = '1'
      )
      UNION ALL
      SELECT 
        dni, 
        nombres_y_apellidos AS nombre, 
        'Coordinador' AS rol, 
        COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion, 
        COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio, 
        '' AS mesa, 
        'Rcoordinadores' AS "origenHoja"
      FROM rcoordinadores
      WHERE (
        credenciales ILIKE '%confirmad%' 
        OR credenciales = 'SI' 
        OR credenciales = '1'
        OR credenciales ILIKE '%aprobado%'
      )
      AND (
        preguntas ILIKE '%aprobad%'
        OR preguntas = 'SI'
        OR preguntas = '1'
      )
      ORDER BY nombre ASC
    `;
    const res = await query(sql);
    return { success: true, usuarios: res.rows, data: res.rows };
  }

  // 7. OBTENER ASISTENCIA
  async obtenerAsistencia() {
    const res = await query('SELECT * FROM asistencia ORDER BY fecha_hora DESC');
    return { success: true, asistencia: res.rows };
  }

  // 8. OBTENER COORDINADORES
  async obtenerCoordinadores() {
    const res = await query('SELECT * FROM coordinadores ORDER BY fecha_hora DESC');
    return { success: true, coordinadores: res.rows };
  }

  // 9. ASISTENCIA POR DNI
  async obtenerAsistenciaPorDni(dni) {
    const dniQuery = (dni || '').toString().trim();
    if (!dniQuery) return { success: false, message: 'Se requiere DNI' };

    const asisRes = await query('SELECT * FROM asistencia WHERE TRIM(dni) = $1 ORDER BY id DESC LIMIT 1', [dniQuery]);
    const llegadaRes = await query('SELECT * FROM asistenciallegada WHERE TRIM(dni) = $1 ORDER BY id DESC LIMIT 1', [dniQuery]);
    const votoManualRes = await query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'MANUAL\' ORDER BY id DESC LIMIT 1', [dniQuery]);
    const votoImagenRes = await query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'IMAGEN\' ORDER BY id DESC LIMIT 1', [dniQuery]);

    const asistencia_confirmada = Boolean(asisRes.rows && asisRes.rows.length > 0);
    const llegada_confirmada = Boolean(llegadaRes.rows && llegadaRes.rows.length > 0);
    const voto_manual_enviado = Boolean(votoManualRes.rows && votoManualRes.rows.length > 0);
    const voto_imagen_enviado = Boolean(votoImagenRes.rows && votoImagenRes.rows.length > 0);

    return {
      success: true,
      asistencia: asisRes.rows[0] || null,
      asistencia_confirmada,
      llegada: llegadaRes.rows[0] || null,
      llegada_confirmada,
      voto_manual: votoManualRes.rows[0] || null,
      voto_manual_enviado,
      voto_imagen: votoImagenRes.rows[0] || null,
      voto_imagen_enviado
    };
  }

  // 10. CONFIRMACIONES POR COLEGIO
  async obtenerConfirmacionesPorColegio(colegio) {
    const colegioQuery = (colegio || '').toString().trim();
    if (!colegioQuery) return { success: false, message: 'Se requiere colegio' };
    const sql = `
      SELECT c.*, a.mesa AS personero_mesa
      FROM coordinadores c
      LEFT JOIN asistencia a ON a.dni = c.personero_dni
      WHERE c.local ILIKE $1
      ORDER BY c.fecha_hora DESC
    `;
    const res = await query(sql, [colegioQuery]);
    return { success: true, confirmaciones: res.rows };
  }

  // 11. PERSONEROS POR COLEGIO (Solo los que aprobaron, con información detallada de quiénes llegaron)
  async obtenerPersonerosPorColegio(data) {
    const colQuery = (data.colegio || data.local || '').toString().trim();
    const distQuery = (data.distrito || data.ubicacion || '').toString().trim();

    if (!colQuery && !distQuery) {
      return { success: true, personeros: [] };
    }

    const params = [];
    let sql = `
      SELECT 
        p.dni, 
        p.nombres_y_apellidos AS nombre, 
        'Personero' AS rol, 
        COALESCE(NULLIF(p.distrito_asignado, ''), p.distrito_donde_vota) AS ubicacion, 
        COALESCE(NULLIF(p.local_de_votacion_asignado, ''), p.local_de_votacion) AS colegio, 
        COALESCE(NULLIF(p.mesa_asignada, ''), p.mesa_de_sufragio) AS mesa, 
        p.credenciales,
        p.preguntas,
        'Rpersoneros' AS "origenHoja", 
        'rpersoneros' AS tabla_origen,
        -- Estado de llegada al colegio (GPS o Foto)
        CASE 
          WHEN l.id IS NOT NULL THEN 'LLEGADA_GPS'
          WHEN a.id IS NOT NULL THEN 'LLEGADA_FOTO'
          ELSE 'PENDIENTE'
        END AS estado_llegada,
        CASE WHEN (l.id IS NOT NULL OR a.id IS NOT NULL) THEN TRUE ELSE FALSE END AS ha_llegado,
        COALESCE(l.fecha_registro, a.fecha_hora) AS fecha_llegada,
        l.distancia_metros,
        a.foto_url,
        -- Estado de confirmación de coordinador
        CASE WHEN c.id IS NOT NULL THEN TRUE ELSE FALSE END AS confirmado_coordinador,
        c.fecha_hora AS fecha_confirmacion,
        c.coordinador_nombre
      FROM rpersoneros p
      LEFT JOIN LATERAL (
        SELECT id, fecha_registro, distancia_metros 
        FROM asistenciallegada 
        WHERE TRIM(dni) = TRIM(p.dni) 
        ORDER BY id DESC LIMIT 1
      ) l ON TRUE
      LEFT JOIN LATERAL (
        SELECT id, fecha_hora, foto_url 
        FROM asistencia 
        WHERE TRIM(dni) = TRIM(p.dni) 
        ORDER BY id DESC LIMIT 1
      ) a ON TRUE
      LEFT JOIN LATERAL (
        SELECT id, fecha_hora, coordinador_nombre 
        FROM coordinadores 
        WHERE TRIM(personero_dni) = TRIM(p.dni) 
        ORDER BY id DESC LIMIT 1
      ) c ON TRUE
      WHERE 1=1
    `;

    // Filtro para los que aprobaron
    sql += ` AND (
      p.preguntas ILIKE '%aprobad%' 
      OR p.preguntas = 'SI' 
      OR p.preguntas = '1'
      OR p.credenciales ILIKE '%confirmad%' 
      OR p.credenciales = 'SI' 
      OR p.credenciales = '1'
      OR p.credenciales ILIKE '%aprobad%'
    )`;

    if (colQuery) {
      const colegiosLista = colQuery.split(',').map(c => c.trim()).filter(Boolean);
      if (colegiosLista.length > 1) {
        const colConditions = [];
        for (const colName of colegiosLista) {
          params.push(colName, `%${colName}%`);
          const p1 = params.length - 1;
          const p2 = params.length;
          colConditions.push(`(COALESCE(NULLIF(p.local_de_votacion_asignado, ''), p.local_de_votacion) ILIKE $${p1} OR COALESCE(NULLIF(p.local_de_votacion_asignado, ''), p.local_de_votacion) ILIKE $${p2})`);
        }
        sql += ` AND (${colConditions.join(' OR ')})`;
      } else {
        params.push(colQuery, `%${colQuery}%`);
        const p1 = params.length - 1;
        const p2 = params.length;
        sql += ` AND (COALESCE(NULLIF(p.local_de_votacion_asignado, ''), p.local_de_votacion) ILIKE $${p1} 
                   OR COALESCE(NULLIF(p.local_de_votacion_asignado, ''), p.local_de_votacion) ILIKE $${p2})`;
      }
    }

    if (distQuery) {
      params.push(distQuery, `%${distQuery}%`);
      const p1 = params.length - 1;
      const p2 = params.length;
      sql += ` AND (COALESCE(NULLIF(p.distrito_asignado, ''), p.distrito_donde_vota) ILIKE $${p1} 
                 OR COALESCE(NULLIF(p.distrito_asignado, ''), p.distrito_donde_vota) ILIKE $${p2})`;
    }

    sql += ` ORDER BY p.mesa_asignada ASC, p.nombres_y_apellidos ASC`;

    try {
      const res = await query(sql, params);

      // 1. Buscar información oficial de mesas de los colegios
      let infoColegios = [];
      try {
        if (colQuery) {
          const colList = colQuery.split(',').map(c => c.trim()).filter(Boolean);
          const colParams = [];
          const whereClauses = colList.map(c => {
            colParams.push(`%${c}%`);
            return `colegio ILIKE $${colParams.length}`;
          });
          const colRes = await query(`
            SELECT colegio, distrito, num_mesas, direccion
            FROM colegios
            WHERE ${whereClauses.join(' OR ')}
          `, colParams);
          if (colRes && colRes.rows) {
            infoColegios = colRes.rows;
          }
        }
      } catch (e) {}

      // 2. Buscar coordinadores locales exclusivamente de la tabla rcoordinadores
      let coordinadoresLocales = [];
      try {
        const coordSql = `
          SELECT 
            dni,
            nombres_y_apellidos AS nombre,
            COALESCE(NULLIF(rol_a_desempenar, ''), 'Coordinador de Local') AS rol,
            COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS distrito,
            COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
            celular,
            correo_electronico,
            credenciales,
            preguntas
          FROM rcoordinadores
          WHERE (preguntas ILIKE '%aprobad%' OR preguntas = 'SI' OR preguntas = '1')
        `;
        const coordRes = await query(coordSql);
        if (coordRes && coordRes.rows) {
          coordinadoresLocales = coordRes.rows;
        }
      } catch (e) {}

      return { 
        success: true, 
        personeros: res.rows,
        info_colegios: infoColegios,
        coordinadores_locales: coordinadoresLocales
      };
    } catch (err) {
      console.warn('[PostgresRepository] Fallback simple para personeros de colegio:', err.message);
      const simpleSql = `
        SELECT 
          dni, 
          nombres_y_apellidos AS nombre, 
          'Personero' AS rol, 
          COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion, 
          COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio, 
          COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa, 
          'Rpersoneros' AS "origenHoja", 
          'rpersoneros' AS tabla_origen
        FROM rpersoneros
        WHERE 1=1
        ORDER BY mesa_asignada ASC, nombres_y_apellidos ASC
      `;
      const fallbackRes = await query(simpleSql);
      return { success: true, personeros: fallbackRes.rows, info_colegios: [], coordinadores_locales: [] };
    }
  }

  // 12. MESAS
  async obtenerMesas() {
    const resEstructura = await query(`
      SELECT numero_mesa AS mesa, distrito, colegio, latitud, longitud, coordenadas_gps, 50 AS radio_metros 
      FROM mesas
      ORDER BY colegio ASC, numero_mesa ASC
    `);
    const resVotos = await query(`
      SELECT numero_mesa AS mesa, ubicacion AS distrito, colegio, origen 
      FROM votos_detalle
    `);
    return { 
      success: true, 
      mesas: resVotos.rows,
      mesas_estructura: resEstructura.rows 
    };
  }

  // 13. COORDENADAS COLEGIO
  async obtenerCoordenadasColegio(data) {
    const colQuery = (data.colegio || '').toString().trim();
    const distQuery = (data.distrito || '').toString().trim();
    const mesaQuery = (data.mesa || '').toString().trim();

    let res = await query(`
      SELECT colegio, distrito, direccion, latitud, longitud, coordenadas_gps, radio_metros
      FROM colegios
      WHERE colegio ILIKE $1
      LIMIT 1
    `, [`%${colQuery}%`]);

    if (!res.rows || res.rows.length === 0) {
      res = await query(`
        SELECT colegio, distrito, direccion, latitud, longitud, coordenadas_gps, 50 AS radio_metros
        FROM mesas
        WHERE numero_mesa = $1 OR colegio ILIKE $2
        LIMIT 1
      `, [mesaQuery, `%${colQuery}%`]);
    }

    if (res.rows && res.rows.length > 0) {
      const c = res.rows[0];
      return { 
        success: true, 
        colegio: c.colegio,
        distrito: c.distrito,
        lat: c.latitud, 
        lon: c.longitud, 
        coordenadas_gps: c.coordenadas_gps,
        radio_metros: c.radio_metros || 50 
      };
    }

    return { success: false, message: 'Coordenadas no encontradas para este colegio' };
  }

  // 14. REPORTE
  async obtenerReporte(distritoFiltro = null) {
    const reportRes = await query(`
      SELECT 
        COALESCE(SUM(p_fp_votos), 0)::int AS "FP", 
        COALESCE(SUM(p_jp_votos), 0)::int AS "JP", 
        COALESCE(SUM(p_sp_votos), 0)::int AS "SOMOS PERU", 
        COALESCE(SUM(p_frepap_votos), 0)::int AS "FREPAP", 
        COALESCE(SUM(p_verde_votos), 0)::int AS "VERDE", 
        COALESCE(SUM(p_morado_votos), 0)::int AS "MORADO",
        COALESCE(SUM(p_nulos), 0)::int AS "NULOS", 
        COALESCE(SUM(p_blanco), 0)::int AS "BLANCO",
        COALESCE(SUM(p_impugnados), 0)::int AS "IMPUGNADOS"
      FROM votos_detalle
    `);

    const distRes = await query(`
      SELECT 
        COALESCE(SUM(d_fp_votos), 0)::int AS "FP", 
        COALESCE(SUM(d_jp_votos), 0)::int AS "JP", 
        COALESCE(SUM(d_sp_votos), 0)::int AS "SOMOS PERU", 
        COALESCE(SUM(d_frepap_votos), 0)::int AS "FREPAP", 
        COALESCE(SUM(d_verde_votos), 0)::int AS "VERDE", 
        COALESCE(SUM(d_morado_votos), 0)::int AS "MORADO",
        COALESCE(SUM(d_nulos), 0)::int AS "NULOS", 
        COALESCE(SUM(d_blanco), 0)::int AS "BLANCO",
        COALESCE(SUM(d_impugnados), 0)::int AS "IMPUGNADOS"
      FROM votos_detalle
    `);

    const mesasRes = await query(`
      SELECT 
        numero_mesa AS mesa, 
        origen, 
        ubicacion AS distrito, 
        colegio, 
        personero, 
        dni, 
        p_total_votos, 
        d_total_votos, 
        votos_json, 
        fecha_hora
      FROM votos_detalle
      ${distritoFiltro ? 'WHERE ubicacion ILIKE $1' : ''}
      ORDER BY fecha_hora DESC
    `, distritoFiltro ? [`%${distritoFiltro}%`] : []);

    const totalesProvincialCompleto = { ...(reportRes.rows[0] || {}) };
    const totalesDistritalCompleto = { ...(distRes.rows[0] || {}) };
    const reportePorDistrito = {};

    mesasRes.rows.forEach(row => {
      const dist = (row.distrito || 'Sin Distrito').toUpperCase().trim();
      if (!reportePorDistrito[dist]) {
        reportePorDistrito[dist] = {
          mesas_contabilizadas: 0,
          total_votos_provincial: 0,
          total_votos_distrital: 0,
          candidatos_provincial: {},
          candidatos_distrital: {}
        };
      }
      reportePorDistrito[dist].mesas_contabilizadas += 1;
      reportePorDistrito[dist].total_votos_provincial += (row.p_total_votos || 0);
      reportePorDistrito[dist].total_votos_distrital += (row.d_total_votos || 0);

      let parsedVotos = null;
      try {
        parsedVotos = typeof row.votos_json === 'string' ? JSON.parse(row.votos_json) : row.votos_json;
      } catch (e) {}

      if (parsedVotos) {
        // Provincial
        const prov = parsedVotos.provincial || {};
        Object.entries(prov).forEach(([key, val]) => {
          const v = typeof val === 'object' ? (parseInt(val.votos, 10) || 0) : (parseInt(val, 10) || 0);
          totalesProvincialCompleto[key] = (totalesProvincialCompleto[key] || 0) + v;
          reportePorDistrito[dist].candidatos_provincial[key] = (reportePorDistrito[dist].candidatos_provincial[key] || 0) + v;
        });

        // Distrital
        const distVotos = parsedVotos.distrital || {};
        Object.entries(distVotos).forEach(([key, val]) => {
          const v = typeof val === 'object' ? (parseInt(val.votos, 10) || 0) : (parseInt(val, 10) || 0);
          totalesDistritalCompleto[key] = (totalesDistritalCompleto[key] || 0) + v;
          reportePorDistrito[dist].candidatos_distrital[key] = (reportePorDistrito[dist].candidatos_distrital[key] || 0) + v;
        });
      }
    });

    return {
      success: true,
      totales_provincial: totalesProvincialCompleto,
      totales_distrital: totalesDistritalCompleto,
      reporte_por_distrito: reportePorDistrito,
      mesas: mesasRes.rows || []
    };
  }

  // 15. CONFIG OCR
  async obtenerConfigOcr() {
    return {
      success: true,
      ocrProvider: env.OCR_PROVIDER || 'gemini',
      geminiModel: 'gemini-2.5-flash',
      configured: true
    };
  }
}

module.exports = new PostgresRepository();
