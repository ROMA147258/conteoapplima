const { getPool, query } = require('../database/connection');
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

    let usuarioBloqueado = null;

    // 1. rpersoneros (Personeros formulario - Fuente principal)
    // Función auxiliar para normalizar y validar credenciales/preguntas
    const validarAcceso = (u, defaultRol = 'Personero', defaultTabla = 'rpersoneros') => {
      const cleanVal = (v) => (v || '').toString().replace(/["']/g, '').trim().toLowerCase();
      const cred = cleanVal(u.credenciales);
      const preg = cleanVal(u.preguntas);
      const rolStr = cleanVal(u.rol || u.rol_a_desempenar);
      const tablaStr = defaultTabla.toLowerCase();

      const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred === 'si' || cred === '1' || cred.includes('aprobad')));
      const isDesaprobado = Boolean(cred.includes('desaprobad') || cred.includes('bloquead') || preg.includes('desaprobad') || preg.includes('reprobad'));
      const isAprobado = Boolean(preg && (preg.includes('aprobad') || preg === 'si' || preg === '1')) && !isDesaprobado;

      const isCoordZonal = tablaStr === 'rcoordinadoresz' || rolStr.includes('zonal');
      const isCoordLocal = tablaStr === 'rcoordinadores' || rolStr.includes('local') || (!isCoordZonal && (rolStr.includes('coordinador') || defaultRol.toLowerCase().includes('coordinador')));

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
          u.tipo_interfaz = 'personero_conteo';
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
                preguntas
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
                preguntas
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
              preguntas
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
              preguntas
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
      try {
        const vCheck = await query(`
          SELECT numero_mesa, origen, p_total_votos
          FROM votos_detalle
          WHERE (TRIM(dni) = $1 OR (numero_mesa = $2 AND $2 != '')) AND origen = 'MANUAL'
          LIMIT 1
        `, [dniTrim, mesaTrim]);
        u.voto_manual_enviado = Boolean(vCheck && vCheck.rows && vCheck.rows.length > 0);
        u.voto_manual_data = vCheck.rows[0] || null;
      } catch (e) {
        u.voto_manual_enviado = false;
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

    return { success: false, status: 'error', message: 'Usuario no encontrado en rcoordinadoresz / rcoordinadores / rpersoneros. Verifica tu DNI o nombre.' };
  }

  // 2. REGISTRAR VOTOS
  async registrarVotos(data) {
    const mesaStr = (data.mesa || '').toString().trim();
    const origenStr = (data.origen || 'MANUAL').toString().trim().toUpperCase();
    const prov = data.votos ? (data.votos.provincial || {}) : {};
    const dist = data.votos ? (data.votos.distrital || {}) : {};

    const extractVote = (item) => {
      if (item === undefined || item === null) return 0;
      if (typeof item === 'object') {
        return parseInt(item.votos ?? item.val ?? item.value ?? 0, 10) || 0;
      }
      return parseInt(item, 10) || 0;
    };

    const extractCand = (item, fallback = '') => {
      if (item && typeof item === 'object' && item.candidato) {
        return item.candidato;
      }
      return fallback;
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
    const p_blanco = parseInt(data.votos_blancos ?? data.votos_vacios ?? prov.BLANCO ?? prov.VACIOS ?? 0, 10) || 0;
    const p_impugnados = parseInt(data.votos_impugnados ?? prov.IMPUGNADOS ?? 0, 10) || 0;

    let p_cands_sum = 0;
    Object.keys(prov).forEach(k => {
      if (!['NULOS', 'BLANCO', 'VACIOS', 'IMPUGNADOS'].includes(k.toUpperCase())) {
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
    const d_blanco = parseInt(data.votos_dist_blancos ?? data.votos_dist_vacios ?? dist.BLANCO ?? dist.VACIOS ?? 0, 10) || 0;
    const d_impugnados = parseInt(data.votos_dist_impugnados ?? dist.IMPUGNADOS ?? 0, 10) || 0;

    let d_cands_sum = 0;
    Object.keys(dist).forEach(k => {
      if (!['NULOS', 'BLANCO', 'VACIOS', 'IMPUGNADOS'].includes(k.toUpperCase())) {
        d_cands_sum += extractVote(dist[k]);
      }
    });
    const d_tot = d_cands_sum + d_nulos + d_blanco + d_impugnados;

    const votosJson = JSON.stringify(data.votos || { provincial: prov, distrital: dist });

    const sql = `
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
        p_nulos, p_vacios, p_blanco, p_impugnados, p_total_votos,
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
        d_nulos, d_vacios, d_blanco, d_impugnados, d_total_votos, votos_json, fecha_hora
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
        $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56,
        $57, $58, $59, $60, $61, $62, $63, $64,
        $65, $66, $67, $68, $69,
        $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81,
        $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93,
        $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105,
        $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117,
        $118, $119, $120, $121, $122, $123, $124, $125,
        $126, $127, $128, $129, $130, $131, CURRENT_TIMESTAMP
      )
      ON CONFLICT (numero_mesa, origen) DO UPDATE SET
        personero = EXCLUDED.personero,
        dni = EXCLUDED.dni,
        departamento = EXCLUDED.departamento,
        provincia = EXCLUDED.provincia,
        ubicacion = EXCLUDED.ubicacion,
        colegio = EXCLUDED.colegio,
        p_sp_candidato = EXCLUDED.p_sp_candidato, p_sp_votos = EXCLUDED.p_sp_votos,
        p_rp_candidato = EXCLUDED.p_rp_candidato, p_rp_votos = EXCLUDED.p_rp_votos,
        p_an_candidato = EXCLUDED.p_an_candidato, p_an_votos = EXCLUDED.p_an_votos,
        p_avanza_candidato = EXCLUDED.p_avanza_candidato, p_avanza_votos = EXCLUDED.p_avanza_votos,
        p_podemos_candidato = EXCLUDED.p_podemos_candidato, p_podemos_votos = EXCLUDED.p_podemos_votos,
        p_jp_candidato = EXCLUDED.p_jp_candidato, p_jp_votos = EXCLUDED.p_jp_votos,
        p_obras_candidato = EXCLUDED.p_obras_candidato, p_obras_votos = EXCLUDED.p_obras_votos,
        p_frepap_candidato = EXCLUDED.p_frepap_candidato, p_frepap_votos = EXCLUDED.p_frepap_votos,
        p_ap_candidato = EXCLUDED.p_ap_candidato, p_ap_votos = EXCLUDED.p_ap_votos,
        p_esperanza_candidato = EXCLUDED.p_esperanza_candidato, p_esperanza_votos = EXCLUDED.p_esperanza_votos,
        p_venceremos_candidato = EXCLUDED.p_venceremos_candidato, p_venceremos_votos = EXCLUDED.p_venceremos_votos,
        p_vision_candidato = EXCLUDED.p_vision_candidato, p_vision_votos = EXCLUDED.p_vision_votos,
        p_apra_candidato = EXCLUDED.p_apra_candidato, p_apra_votos = EXCLUDED.p_apra_votos,
        p_fp_candidato = EXCLUDED.p_fp_candidato, p_fp_votos = EXCLUDED.p_fp_votos,
        p_ppc_candidato = EXCLUDED.p_ppc_candidato, p_ppc_votos = EXCLUDED.p_ppc_votos,
        p_progresemos_candidato = EXCLUDED.p_progresemos_candidato, p_progresemos_votos = EXCLUDED.p_progresemos_votos,
        p_morado_candidato = EXCLUDED.p_morado_candidato, p_morado_votos = EXCLUDED.p_morado_votos,
        p_buen_gobierno_candidato = EXCLUDED.p_buen_gobierno_candidato, p_buen_gobierno_votos = EXCLUDED.p_buen_gobierno_votos,
        p_verde_candidato = EXCLUDED.p_verde_candidato, p_verde_votos = EXCLUDED.p_verde_votos,
        p_peru_libre_candidato = EXCLUDED.p_peru_libre_candidato, p_peru_libre_votos = EXCLUDED.p_peru_libre_votos,
        p_tierra_verde_candidato = EXCLUDED.p_tierra_verde_candidato, p_tierra_verde_votos = EXCLUDED.p_tierra_verde_votos,
        p_pueblo_consciente_candidato = EXCLUDED.p_pueblo_consciente_candidato, p_pueblo_consciente_votos = EXCLUDED.p_pueblo_consciente_votos,
        p_ppp_candidato = EXCLUDED.p_ppp_candidato, p_ppp_votos = EXCLUDED.p_ppp_votos,
        p_integridad_candidato = EXCLUDED.p_integridad_candidato, p_integridad_votos = EXCLUDED.p_integridad_votos,
        p_fuerza_ciudadana_candidato = EXCLUDED.p_fuerza_ciudadana_candidato, p_fuerza_ciudadana_votos = EXCLUDED.p_fuerza_ciudadana_votos,
        p_batalla_candidato = EXCLUDED.p_batalla_candidato, p_batalla_votos = EXCLUDED.p_batalla_votos,
        p_app_candidato = EXCLUDED.p_app_candidato, p_app_votos = EXCLUDED.p_app_votos,
        p_alianza_regional_candidato = EXCLUDED.p_alianza_regional_candidato, p_alianza_regional_votos = EXCLUDED.p_alianza_regional_votos,
        p_nulos = EXCLUDED.p_nulos, p_vacios = EXCLUDED.p_vacios, p_blanco = EXCLUDED.p_blanco, p_impugnados = EXCLUDED.p_impugnados, p_total_votos = EXCLUDED.p_total_votos,
        d_sp_candidato = EXCLUDED.d_sp_candidato, d_sp_votos = EXCLUDED.d_sp_votos,
        d_rp_candidato = EXCLUDED.d_rp_candidato, d_rp_votos = EXCLUDED.d_rp_votos,
        d_an_candidato = EXCLUDED.d_an_candidato, d_an_votos = EXCLUDED.d_an_votos,
        d_avanza_candidato = EXCLUDED.d_avanza_candidato, d_avanza_votos = EXCLUDED.d_avanza_votos,
        d_podemos_candidato = EXCLUDED.d_podemos_candidato, d_podemos_votos = EXCLUDED.d_podemos_votos,
        d_jp_candidato = EXCLUDED.d_jp_candidato, d_jp_votos = EXCLUDED.d_jp_votos,
        d_obras_candidato = EXCLUDED.d_obras_candidato, d_obras_votos = EXCLUDED.d_obras_votos,
        d_frepap_candidato = EXCLUDED.d_frepap_candidato, d_frepap_votos = EXCLUDED.d_frepap_votos,
        d_ap_candidato = EXCLUDED.d_ap_candidato, d_ap_votos = EXCLUDED.d_ap_votos,
        d_esperanza_candidato = EXCLUDED.d_esperanza_candidato, d_esperanza_votos = EXCLUDED.d_esperanza_votos,
        d_venceremos_candidato = EXCLUDED.d_venceremos_candidato, d_venceremos_votos = EXCLUDED.d_venceremos_votos,
        d_vision_candidato = EXCLUDED.d_vision_candidato, d_vision_votos = EXCLUDED.d_vision_votos,
        d_apra_candidato = EXCLUDED.d_apra_candidato, d_apra_votos = EXCLUDED.d_apra_votos,
        d_fp_candidato = EXCLUDED.d_fp_candidato, d_fp_votos = EXCLUDED.d_fp_votos,
        d_ppc_candidato = EXCLUDED.d_ppc_candidato, d_ppc_votos = EXCLUDED.d_ppc_votos,
        d_progresemos_candidato = EXCLUDED.d_progresemos_candidato, d_progresemos_votos = EXCLUDED.d_progresemos_votos,
        d_morado_candidato = EXCLUDED.d_morado_candidato, d_morado_votos = EXCLUDED.d_morado_votos,
        d_buen_gobierno_candidato = EXCLUDED.d_buen_gobierno_candidato, d_buen_gobierno_votos = EXCLUDED.d_buen_gobierno_votos,
        d_verde_candidato = EXCLUDED.d_verde_candidato, d_verde_votos = EXCLUDED.d_verde_votos,
        d_peru_libre_candidato = EXCLUDED.d_peru_libre_candidato, d_peru_libre_votos = EXCLUDED.d_peru_libre_votos,
        d_tierra_verde_candidato = EXCLUDED.d_tierra_verde_candidato, d_tierra_verde_votos = EXCLUDED.d_tierra_verde_votos,
        d_pueblo_consciente_candidato = EXCLUDED.d_pueblo_consciente_candidato, d_pueblo_consciente_votos = EXCLUDED.d_pueblo_consciente_votos,
        d_ppp_candidato = EXCLUDED.d_ppp_candidato, d_ppp_votos = EXCLUDED.d_ppp_votos,
        d_integridad_candidato = EXCLUDED.d_integridad_candidato, d_integridad_votos = EXCLUDED.d_integridad_votos,
        d_fuerza_ciudadana_candidato = EXCLUDED.d_fuerza_ciudadana_candidato, d_fuerza_ciudadana_votos = EXCLUDED.d_fuerza_ciudadana_votos,
        d_batalla_candidato = EXCLUDED.d_batalla_candidato, d_batalla_votos = EXCLUDED.d_batalla_votos,
        d_app_candidato = EXCLUDED.d_app_candidato, d_app_votos = EXCLUDED.d_app_votos,
        d_alianza_regional_candidato = EXCLUDED.d_alianza_regional_candidato, d_alianza_regional_votos = EXCLUDED.d_alianza_regional_votos,
        d_nulos = EXCLUDED.d_nulos, d_vacios = EXCLUDED.d_vacios, d_blanco = EXCLUDED.d_blanco, d_impugnados = EXCLUDED.d_impugnados, d_total_votos = EXCLUDED.d_total_votos,
        votos_json = EXCLUDED.votos_json,
        fecha_hora = CURRENT_TIMESTAMP
    `;

    const params = [
      data.brigadista || '', data.dni || '', data.departamento || 'Lima', data.provincia || 'Lima',
      data.ubicacion || '', data.colegio || '', mesaStr, origenStr,
      // Provincial candidates
      extractCand(prov["SOMOS PERU"] || prov.SP), p_sp_v,
      extractCand(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP), p_rp_v,
      extractCand(prov["AHORA NACION"] || prov.AN), p_an_v,
      extractCand(prov["AVANZA PAIS"] || prov.AVANZA), p_avanza_v,
      extractCand(prov.PODEMOS || prov["PODEMOS PERU"]), p_podemos_v,
      extractCand(prov.JP || prov["JUNTOS POR EL PERU"]), p_jp_v,
      extractCand(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"]), p_obras_v,
      extractCand(prov.FREPAP), p_frepap_v,
      extractCand(prov["ACCION POPULAR"] || prov.AP), p_ap_v,
      extractCand(prov.ESPERANZA || prov.FE || prov["FRENTE DE LA ESPERANZA"]), p_esperanza_v,
      extractCand(prov.VENCEREMOS || prov.AEV || prov["ALIANZA ELECTORAL VENCEREMOS"]), p_venceremos_v,
      extractCand(prov["VISION PERU"] || prov.VP || prov.VISION), p_vision_v,
      extractCand(prov.APRA || prov["PARTIDO APRISTA PERUANO"]), p_apra_v,
      extractCand(prov.FP || prov["FUERZA POPULAR"]), p_fp_v,
      extractCand(prov.PPC || prov["PARTIDO POPULAR CRISTIANO"]), p_ppc_v,
      extractCand(prov.PROGRESEMOS || prov.PROG), p_progresemos_v,
      extractCand(prov.MORADO || prov.PM || prov["PARTIDO MORADO"]), p_morado_v,
      extractCand(prov["BUEN GOBIERNO"] || prov.PBG || prov["PARTIDO DEL BUEN GOBIERNO"]), p_buen_gobierno_v,
      extractCand(prov.VERDE || prov.PDV || prov["PARTIDO DEMOCRATA VERDE"]), p_verde_v,
      extractCand(prov["PERU LIBRE"] || prov.PL), p_peru_libre_v,
      extractCand(prov["TIERRA VERDE"] || prov.CTTV), p_tierra_verde_v,
      extractCand(prov["PUEBLO CONSCIENTE"] || prov.PC), p_pueblo_consciente_v,
      extractCand(prov.PPP || prov["PARTIDO PATRIOTICO DEL PERU"]), p_ppp_v,
      extractCand(prov.INTEGRIDAD || prov.ID || prov["INTEGRIDAD DEMOCRATICA"]), p_integridad_v,
      extractCand(prov["FUERZA CIUDADANA"] || prov.FC), p_fuerza_ciudadana_v,
      extractCand(prov["BATALLA PERU"] || prov.BP), p_batalla_v,
      extractCand(prov.APP || prov["ALIANZA PARA EL PROGRESO"]), p_app_v,
      extractCand(prov["ALIANZA REGIONAL"] || prov.ARP || prov["ALIANZA REGIONAL POR EL PERU"]), p_alianza_regional_v,
      // Provincial Metrics
      p_nulos, p_blanco, p_blanco, p_impugnados, p_tot,
      // Distrital candidates
      extractCand(dist["SOMOS PERU"] || dist.SP), d_sp_v,
      extractCand(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP), d_rp_v,
      extractCand(dist["AHORA NACION"] || dist.AN), d_an_v,
      extractCand(dist["AVANZA PAIS"] || dist.AVANZA), d_avanza_v,
      extractCand(dist.PODEMOS || dist["PODEMOS PERU"]), d_podemos_v,
      extractCand(dist.JP || dist["JUNTOS POR EL PERU"]), d_jp_v,
      extractCand(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"]), d_obras_v,
      extractCand(dist.FREPAP), d_frepap_v,
      extractCand(dist["ACCION POPULAR"] || dist.AP), d_ap_v,
      extractCand(dist.ESPERANZA || dist.FE || dist["FRENTE DE LA ESPERANZA"]), d_esperanza_v,
      extractCand(dist.VENCEREMOS || dist.AEV || dist["ALIANZA ELECTORAL VENCEREMOS"]), d_venceremos_v,
      extractCand(dist["VISION PERU"] || dist.VP || dist.VISION), d_vision_v,
      extractCand(dist.APRA || dist["PARTIDO APRISTA PERUANO"]), d_apra_v,
      extractCand(dist.FP || dist["FUERZA POPULAR"]), d_fp_v,
      extractCand(dist.PPC || dist["PARTIDO POPULAR CRISTIANO"]), d_ppc_v,
      extractCand(dist.PROGRESEMOS || dist.PROG), d_progresemos_v,
      extractCand(dist.MORADO || dist.PM || dist["PARTIDO MORADO"]), d_morado_v,
      extractCand(dist["BUEN GOBIERNO"] || dist.PBG || dist["PARTIDO DEL BUEN GOBIERNO"]), d_buen_gobierno_v,
      extractCand(dist.VERDE || dist.PDV || dist["PARTIDO DEMOCRATA VERDE"]), d_verde_v,
      extractCand(dist["PERU LIBRE"] || dist.PL), d_peru_libre_v,
      extractCand(dist["TIERRA VERDE"] || dist.CTTV), d_tierra_verde_v,
      extractCand(dist["PUEBLO CONSCIENTE"] || dist.PC), d_pueblo_consciente_v,
      extractCand(dist.PPP || dist["PARTIDO PATRIOTICO DEL PERU"]), d_ppp_v,
      extractCand(dist.INTEGRIDAD || dist.ID || dist["INTEGRIDAD DEMOCRATICA"]), d_integridad_v,
      extractCand(dist["FUERZA CIUDADANA"] || dist.FC), d_fuerza_ciudadana_v,
      extractCand(dist["BATALLA PERU"] || dist.BP), d_batalla_v,
      extractCand(dist.APP || dist["ALIANZA PARA EL PROGRESO"]), d_app_v,
      extractCand(dist["ALIANZA REGIONAL"] || dist.ARP || dist["ALIANZA REGIONAL POR EL PERU"]), d_alianza_regional_v,
      // Distrital Metrics
      d_nulos, d_blanco, d_blanco, d_impugnados, d_tot,
      votosJson
    ];

    await query(sql, params);
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
        SELECT id, fecha_hora 
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
        COALESCE(SUM(COALESCE(p_blanco, p_vacios)), 0)::int AS "BLANCO",
        COALESCE(SUM(p_impugnados), 0)::int AS "IMPUGNADOS",
        COALESCE(SUM(COALESCE(p_blanco, p_vacios)), 0)::int AS "VACIOS"
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
        COALESCE(SUM(COALESCE(d_blanco, d_vacios)), 0)::int AS "BLANCO",
        COALESCE(SUM(d_impugnados), 0)::int AS "IMPUGNADOS",
        COALESCE(SUM(COALESCE(d_blanco, d_vacios)), 0)::int AS "VACIOS"
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
    let key = env.GEMINI_API_KEY;
    try {
      const cfgPath = path.resolve(__dirname, '../../../config.json');
      if (!key && fs.existsSync(cfgPath)) {
        const saved = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        if (saved.geminiApiKey) key = saved.geminiApiKey;
      }
    } catch (e) {}
    return { success: true, apiKey: key, geminiApiKey: key };
  }
}

module.exports = new PostgresRepository();
