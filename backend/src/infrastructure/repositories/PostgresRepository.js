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
        const u = res.rows[0];
        const cred = (u.credenciales || '').toString().trim().toLowerCase();
        const preg = (u.preguntas || '').toString().trim().toLowerCase();

        const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred === 'si' || cred === '1'));
        const isDesaprobado = Boolean(cred.includes('desaprobad') || cred.includes('bloquead') || preg.includes('desaprobad') || preg.includes('reprobad'));
        const isAprobado = Boolean(preg && (preg.includes('aprobad') || preg === 'si' || preg === '1')) && !isDesaprobado;

        if (isConfirmed && isAprobado) {
          u.origenHoja = 'Rpersoneros';
          u.tabla_origen = 'rpersoneros';
          u.rol = 'Personero';
          u.tipo_interfaz = 'personero_conteo';
          return u;
        } else {
          let errorMsg = 'Acceso Denegado: Tus credenciales deben estar en estado Confirmado y tu evaluación en estado Aprobado para poder ingresar.';
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
            rol: 'Personero',
            message: errorMsg
          };
          return null;
        }
      }
      return null;
    };

    // 2. rcoordinadores (Coordinadores formulario)
    const buscarEnRcoordinadores = async () => {
      let res = null;
      if (targetDni) {
        try {
          res = await query(`
            SELECT 
              dni,
              nombres_y_apellidos AS nombre,
              'Coordinador' AS rol,
              COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
              COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
              '' AS mesa,
              credenciales,
              preguntas
            FROM rcoordinadores
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
              'Coordinador' AS rol,
              COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
              COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
              '' AS mesa,
              credenciales,
              preguntas
            FROM rcoordinadores
            WHERE ${whereClauses.join(' AND ')}
            LIMIT 1
          `, params);
        } catch (e) {}
      }

      if (res && res.rows && res.rows.length > 0) {
        const u = res.rows[0];
        const cred = (u.credenciales || '').toString().trim().toLowerCase();
        const preg = (u.preguntas || '').toString().trim().toLowerCase();

        const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred === 'si' || cred === '1'));
        const isDesaprobado = Boolean(cred.includes('desaprobad') || cred.includes('bloquead') || preg.includes('desaprobad') || preg.includes('reprobad'));
        const isAprobado = Boolean(preg && (preg.includes('aprobad') || preg === 'si' || preg === '1')) && !isDesaprobado;

        if (isConfirmed && isAprobado) {
          u.origenHoja = 'Rcoordinadores';
          u.tabla_origen = 'rcoordinadores';
          u.rol = 'Coordinador';
          u.tipo_interfaz = 'coordinador_lista';
          return u;
        } else {
          let errorMsg = 'Acceso Denegado: Tus credenciales de coordinador deben estar en estado Confirmado para poder ingresar.';
          if (cred.includes('desaprobad') || cred.includes('bloquead')) {
            errorMsg = `Acceso Denegado: Tus credenciales se encuentran en estado '${u.credenciales}' en el sistema.`;
          } else if (preg.includes('desaprobad') || preg.includes('reprobad')) {
            errorMsg = `Acceso Denegado: Tu evaluación de coordinador se encuentra en estado '${u.preguntas}'. Debes estar Aprobado.`;
          } else if (!isConfirmed) {
            errorMsg = `Acceso Denegado: Tus credenciales se encuentran en estado '${u.credenciales || 'Pendiente'}'. Deben estar en estado Confirmado.`;
          } else if (!isAprobado) {
            errorMsg = `Acceso Denegado: Tu evaluación se encuentra en estado '${u.preguntas || 'Pendiente'}'. Debe estar en estado Aprobado.`;
          }

          usuarioBloqueado = {
            isBlocked: true,
            status: 'blocked',
            rol: 'Coordinador',
            message: errorMsg
          };
          return null;
        }
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

    let usuarioEncontrado = await buscarEnRpersoneros();
    if (usuarioEncontrado) {
      usuarioEncontrado = await enriquecerEstadoUsuario(usuarioEncontrado);
      return { success: true, status: 'success', usuario: usuarioEncontrado, user: usuarioEncontrado, data: usuarioEncontrado };
    }
    if (usuarioBloqueado) {
      return { success: false, status: 'blocked', message: usuarioBloqueado.message };
    }

    usuarioEncontrado = await buscarEnRcoordinadores();
    if (usuarioEncontrado) {
      usuarioEncontrado = await enriquecerEstadoUsuario(usuarioEncontrado);
      return { success: true, status: 'success', usuario: usuarioEncontrado, user: usuarioEncontrado, data: usuarioEncontrado };
    }
    if (usuarioBloqueado) {
      return { success: false, status: 'blocked', message: usuarioBloqueado.message };
    }

    return { success: false, status: 'error', message: 'Usuario no encontrado en rpersoneros / rcoordinadores. Verifica tu DNI o nombre.' };
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

    const p_fp_v = extractVote(prov.FP);
    const p_jp_v = extractVote(prov.JP);
    const p_sp_v = extractVote(prov["SOMOS PERU"] || prov.SP);
    const p_frepap_v = extractVote(prov.FREPAP);
    const p_verde_v = extractVote(prov.VERDE);
    const p_morado_v = extractVote(prov.MORADO);
    const p_nulos = parseInt(data.votos_nulos ?? prov.NULOS ?? 0, 10) || 0;
    const p_vacios = parseInt(data.votos_vacios ?? prov.VACIOS ?? 0, 10) || 0;
    const p_tot = p_fp_v + p_jp_v + p_sp_v + p_frepap_v + p_verde_v + p_morado_v + p_nulos + p_vacios;

    const d_fp_v = extractVote(dist.FP);
    const d_jp_v = extractVote(dist.JP);
    const d_sp_v = extractVote(dist["SOMOS PERU"] || dist.SP);
    const d_frepap_v = extractVote(dist.FREPAP);
    const d_verde_v = extractVote(dist.VERDE);
    const d_morado_v = extractVote(dist.MORADO);
    const d_nulos = parseInt(data.votos_dist_nulos ?? dist.NULOS ?? 0, 10) || 0;
    const d_vacios = parseInt(data.votos_dist_vacios ?? dist.VACIOS ?? 0, 10) || 0;
    const d_tot = d_fp_v + d_jp_v + d_sp_v + d_frepap_v + d_verde_v + d_morado_v + d_nulos + d_vacios;

    const sql = `
      INSERT INTO votos_detalle (
        personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
        p_fp_candidato, p_fp_votos, p_jp_candidato, p_jp_votos, p_sp_candidato, p_sp_votos,
        p_frepap_candidato, p_frepap_votos, p_verde_candidato, p_verde_votos, p_morado_candidato, p_morado_votos,
        p_nulos, p_vacios, p_total_votos,
        d_fp_candidato, d_fp_votos, d_jp_candidato, d_jp_votos, d_sp_candidato, d_sp_votos,
        d_frepap_candidato, d_frepap_votos, d_verde_candidato, d_verde_votos, d_morado_candidato, d_morado_votos,
        d_nulos, d_vacios, d_total_votos, fecha_hora
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23,
        $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35,
        $36, $37, $38, CURRENT_TIMESTAMP
      )
      ON CONFLICT (numero_mesa, origen) DO UPDATE SET
        personero = EXCLUDED.personero,
        dni = EXCLUDED.dni,
        departamento = EXCLUDED.departamento,
        provincia = EXCLUDED.provincia,
        ubicacion = EXCLUDED.ubicacion,
        colegio = EXCLUDED.colegio,
        p_fp_candidato = EXCLUDED.p_fp_candidato, p_fp_votos = EXCLUDED.p_fp_votos,
        p_jp_candidato = EXCLUDED.p_jp_candidato, p_jp_votos = EXCLUDED.p_jp_votos,
        p_sp_candidato = EXCLUDED.p_sp_candidato, p_sp_votos = EXCLUDED.p_sp_votos,
        p_frepap_candidato = EXCLUDED.p_frepap_candidato, p_frepap_votos = EXCLUDED.p_frepap_votos,
        p_verde_candidato = EXCLUDED.p_verde_candidato, p_verde_votos = EXCLUDED.p_verde_votos,
        p_morado_candidato = EXCLUDED.p_morado_candidato, p_morado_votos = EXCLUDED.p_morado_votos,
        p_nulos = EXCLUDED.p_nulos, p_vacios = EXCLUDED.p_vacios, p_total_votos = EXCLUDED.p_total_votos,
        d_fp_candidato = EXCLUDED.d_fp_candidato, d_fp_votos = EXCLUDED.d_fp_votos,
        d_jp_candidato = EXCLUDED.d_jp_candidato, d_jp_votos = EXCLUDED.d_jp_votos,
        d_sp_candidato = EXCLUDED.d_sp_candidato, d_sp_votos = EXCLUDED.d_sp_votos,
        d_frepap_candidato = EXCLUDED.d_frepap_candidato, d_frepap_votos = EXCLUDED.d_frepap_votos,
        d_verde_candidato = EXCLUDED.d_verde_candidato, d_verde_votos = EXCLUDED.d_verde_votos,
        d_morado_candidato = EXCLUDED.d_morado_candidato, d_morado_votos = EXCLUDED.d_morado_votos,
        d_nulos = EXCLUDED.d_nulos, d_vacios = EXCLUDED.d_vacios, d_total_votos = EXCLUDED.d_total_votos,
        fecha_hora = CURRENT_TIMESTAMP
    `;

    const params = [
      data.brigadista || '', data.dni || '', data.departamento || 'Lima', data.provincia || 'Lima',
      data.ubicacion || '', data.colegio || '', mesaStr, origenStr,
      extractCand(prov.FP), p_fp_v, extractCand(prov.JP), p_jp_v, extractCand(prov["SOMOS PERU"] || prov.SP), p_sp_v,
      extractCand(prov.FREPAP), p_frepap_v, extractCand(prov.VERDE), p_verde_v, extractCand(prov.MORADO), p_morado_v,
      p_nulos, p_vacios, p_tot,
      extractCand(dist.FP), d_fp_v, extractCand(dist.JP), d_jp_v, extractCand(dist["SOMOS PERU"] || dist.SP), d_sp_v,
      extractCand(dist.FREPAP), d_frepap_v, extractCand(dist.VERDE), d_verde_v, extractCand(dist.MORADO), d_morado_v,
      d_nulos, d_vacios, d_tot
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
    const votoRes = await query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'MANUAL\' ORDER BY id DESC LIMIT 1', [dniQuery]);

    const asistencia_confirmada = Boolean(asisRes.rows && asisRes.rows.length > 0);
    const llegada_confirmada = Boolean(llegadaRes.rows && llegadaRes.rows.length > 0);
    const voto_manual_enviado = Boolean(votoRes.rows && votoRes.rows.length > 0);

    return {
      success: true,
      asistencia: asisRes.rows[0] || null,
      asistencia_confirmada,
      llegada: llegadaRes.rows[0] || null,
      llegada_confirmada,
      voto_manual: votoRes.rows[0] || null,
      voto_manual_enviado
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

  // 11. PERSONEROS POR COLEGIO
  async obtenerPersonerosPorColegio(data) {
    const colQuery = (data.colegio || data.local || '').toString().trim();
    const distQuery = (data.distrito || data.ubicacion || '').toString().trim();

    if (!colQuery && !distQuery) {
      return { success: true, personeros: [] };
    }

    const params = [];
    let sql = `
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
    `;

    if (colQuery) {
      params.push(colQuery, `%${colQuery}%`);
      const p1 = params.length - 1;
      const p2 = params.length;
      sql += ` AND (COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) ILIKE $${p1} 
                 OR COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) ILIKE $${p2})`;
    }

    if (distQuery) {
      params.push(distQuery, `%${distQuery}%`);
      const p1 = params.length - 1;
      const p2 = params.length;
      sql += ` AND (COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) ILIKE $${p1} 
                 OR COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) ILIKE $${p2})`;
    }

    sql += ` ORDER BY mesa ASC, nombre ASC`;

    const res = await query(sql, params);
    return { success: true, personeros: res.rows };
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
  async obtenerReporte() {
    const reportRes = await query(`
      SELECT 
        COALESCE(SUM(p_fp_votos), 0)::int AS "FP", 
        COALESCE(SUM(p_jp_votos), 0)::int AS "JP", 
        COALESCE(SUM(p_sp_votos), 0)::int AS "SOMOS PERU", 
        COALESCE(SUM(p_frepap_votos), 0)::int AS "FREPAP", 
        COALESCE(SUM(p_verde_votos), 0)::int AS "VERDE", 
        COALESCE(SUM(p_morado_votos), 0)::int AS "MORADO",
        COALESCE(SUM(p_nulos), 0)::int AS "NULOS", 
        COALESCE(SUM(p_vacios), 0)::int AS "VACIOS"
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
        COALESCE(SUM(d_vacios), 0)::int AS "VACIOS"
      FROM votos_detalle
    `);

    const mesasRes = await query('SELECT numero_mesa AS mesa, origen, ubicacion FROM votos_detalle');

    return {
      success: true,
      totales_provincial: reportRes.rows[0] || {},
      totales_distrital: distRes.rows[0] || {},
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
