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

    // 1. usuarios (Personeros oficiales)
    const buscarEnUsuarios = async () => {
      const params = [];
      const whereClauses = [];

      if (targetDni) {
        params.push(targetDni);
        whereClauses.push(`dni ILIKE $${params.length}`);
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w) => {
          params.push(`%${w}%`);
          whereClauses.push(`nombre ILIKE $${params.length}`);
        });
      }

      if (whereClauses.length === 0) return null;

      const sql = `SELECT * FROM usuarios WHERE ${whereClauses.join(' AND ')} LIMIT 1`;
      const res = await query(sql, params);
      if (res.rows && res.rows.length > 0) {
        const u = res.rows[0];
        u.origenHoja = 'Usuarios';
        u.tabla_origen = 'usuarios';
        u.rol = u.rol || 'Personero';
        u.tipo_interfaz = 'personero_conteo';
        return u;
      }
      return null;
    };

    let usuarioBloqueado = null;

    // 2. rpersoneros (Personeros formulario)
    const buscarEnRpersoneros = async () => {
      const params = [];
      const whereClauses = [];

      if (targetDni) {
        params.push(targetDni);
        whereClauses.push(`dni ILIKE $${params.length}`);
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w) => {
          params.push(`%${w}%`);
          whereClauses.push(`nombres_y_apellidos ILIKE $${params.length}`);
        });
      }

      if (whereClauses.length === 0) return null;

      const sql = `
        SELECT 
          dni,
          nombres_y_apellidos AS nombre,
          COALESCE(NULLIF(rol_a_desempenar, ''), 'Personero') AS rol,
          COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
          COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
          COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa,
          credenciales
        FROM rpersoneros
        WHERE ${whereClauses.join(' AND ')}
        LIMIT 1
      `;
      try {
        const res = await query(sql, params);
        if (res.rows && res.rows.length > 0) {
          const u = res.rows[0];
          const cred = (u.credenciales || '').toString().trim().toLowerCase();
          const isConfirmed = cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado' || !u.credenciales;

          if (isConfirmed) {
            u.origenHoja = 'Rpersoneros';
            u.tabla_origen = 'rpersoneros';
            u.rol = 'Personero';
            u.tipo_interfaz = 'personero_conteo';
            return u;
          } else {
            usuarioBloqueado = {
              isBlocked: true,
              status: 'blocked',
              rol: 'Personero',
              message: 'Acceso Denegado: Tus credenciales se encuentran en estado Bloqueado en el sistema.'
            };
            return null;
          }
        }
      } catch (e) {}
      return null;
    };

    // 3. usuarios1 (Coordinadores oficiales)
    const buscarEnUsuarios1 = async () => {
      const params = [];
      const whereClauses = [];

      if (targetDni) {
        params.push(targetDni);
        whereClauses.push(`dni ILIKE $${params.length}`);
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w) => {
          params.push(`%${w}%`);
          whereClauses.push(`nombre ILIKE $${params.length}`);
        });
      }

      if (whereClauses.length === 0) return null;

      const sql = `SELECT * FROM usuarios1 WHERE ${whereClauses.join(' AND ')} LIMIT 1`;
      const res = await query(sql, params);
      if (res.rows && res.rows.length > 0) {
        const u = res.rows[0];
        u.origenHoja = 'Usuarios1';
        u.tabla_origen = 'usuarios1';
        u.rol = 'Coordinador';
        u.tipo_interfaz = 'coordinador_lista';
        return u;
      }
      return null;
    };

    // 4. rcoordinadores (Coordinadores formulario)
    const buscarEnRcoordinadores = async () => {
      const params = [];
      const whereClauses = [];

      if (targetDni) {
        params.push(targetDni);
        whereClauses.push(`dni ILIKE $${params.length}`);
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w) => {
          params.push(`%${w}%`);
          whereClauses.push(`nombres_y_apellidos ILIKE $${params.length}`);
        });
      }

      if (whereClauses.length === 0) return null;

      const sql = `
        SELECT 
          dni,
          nombres_y_apellidos AS nombre,
          'Coordinador' AS rol,
          COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
          COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
          '' AS mesa,
          credenciales
        FROM rcoordinadores
        WHERE ${whereClauses.join(' AND ')}
        LIMIT 1
      `;
      try {
        const res = await query(sql, params);
        if (res.rows && res.rows.length > 0) {
          const u = res.rows[0];
          const cred = (u.credenciales || '').toString().trim().toLowerCase();
          const isConfirmed = cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado' || !u.credenciales;

          if (isConfirmed) {
            u.origenHoja = 'Rcoordinadores';
            u.tabla_origen = 'rcoordinadores';
            u.rol = 'Coordinador';
            u.tipo_interfaz = 'coordinador_lista';
            return u;
          } else {
            usuarioBloqueado = {
              isBlocked: true,
              status: 'blocked',
              rol: 'Coordinador',
              message: 'Acceso Denegado: Tus credenciales se encuentran en estado Bloqueado en el sistema.'
            };
            return null;
          }
        }
      } catch (e) {}
      return null;
    };

    let usuarioEncontrado = await buscarEnUsuarios();
    if (!usuarioEncontrado) usuarioEncontrado = await buscarEnRpersoneros();
    if (!usuarioEncontrado) usuarioEncontrado = await buscarEnUsuarios1();
    if (!usuarioEncontrado) usuarioEncontrado = await buscarEnRcoordinadores();

    if (usuarioEncontrado && !usuarioEncontrado.isBlocked) {
      return {
        success: true,
        status: 'success',
        usuario: usuarioEncontrado,
        user: usuarioEncontrado,
        data: usuarioEncontrado
      };
    }

    if (usuarioBloqueado) {
      return {
        success: false,
        status: 'blocked',
        message: usuarioBloqueado.message || 'Acceso Denegado: Tus credenciales se encuentran en estado Bloqueado en el sistema.'
      };
    }

    return { success: false, status: 'error', message: 'Usuario no encontrado. Verifica tu DNI o nombre.' };
  }

  // 2. REGISTRAR VOTOS
  async registrarVotos(data) {
    const mesaStr = (data.mesa || '').toString().trim();
    const origenStr = (data.origen || 'MANUAL').toString().trim().toUpperCase();
    const prov = data.votos ? (data.votos.provincial || {}) : {};
    const dist = data.votos ? (data.votos.distrital || {}) : {};

    const p_fp_v = prov.FP ? (parseInt(prov.FP.votos) || 0) : 0;
    const p_jp_v = prov.JP ? (parseInt(prov.JP.votos) || 0) : 0;
    const p_sp_v = prov["SOMOS PERU"] ? (parseInt(prov["SOMOS PERU"].votos) || 0) : 0;
    const p_frepap_v = prov.FREPAP ? (parseInt(prov.FREPAP.votos) || 0) : 0;
    const p_verde_v = prov.VERDE ? (parseInt(prov.VERDE.votos) || 0) : 0;
    const p_morado_v = prov.MORADO ? (parseInt(prov.MORADO.votos) || 0) : 0;
    const p_nulos = parseInt(data.votos_nulos) || 0;
    const p_vacios = parseInt(data.votos_vacios) || 0;
    const p_tot = p_fp_v + p_jp_v + p_sp_v + p_frepap_v + p_verde_v + p_morado_v + p_nulos + p_vacios;

    const d_fp_v = dist.FP ? (parseInt(dist.FP.votos) || 0) : 0;
    const d_jp_v = dist.JP ? (parseInt(dist.JP.votos) || 0) : 0;
    const d_sp_v = dist["SOMOS PERU"] ? (parseInt(dist["SOMOS PERU"].votos) || 0) : 0;
    const d_frepap_v = dist.FREPAP ? (parseInt(dist.FREPAP.votos) || 0) : 0;
    const d_verde_v = dist.VERDE ? (parseInt(dist.VERDE.votos) || 0) : 0;
    const d_morado_v = dist.MORADO ? (parseInt(dist.MORADO.votos) || 0) : 0;
    const d_nulos = parseInt(data.votos_dist_nulos) || 0;
    const d_vacios = parseInt(data.votos_dist_vacios) || 0;
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
      prov.FP?.candidato || '', p_fp_v, prov.JP?.candidato || '', p_jp_v, prov["SOMOS PERU"]?.candidato || '', p_sp_v,
      prov.FREPAP?.candidato || '', p_frepap_v, prov.VERDE?.candidato || '', p_verde_v, prov.MORADO?.candidato || '', p_morado_v,
      p_nulos, p_vacios, p_tot,
      dist.FP?.candidato || '', d_fp_v, dist.JP?.candidato || '', d_jp_v, dist["SOMOS PERU"]?.candidato || '', d_sp_v,
      dist.FREPAP?.candidato || '', d_frepap_v, dist.VERDE?.candidato || '', d_verde_v, dist.MORADO?.candidato || '', d_morado_v,
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
      data.foto_url || '',
      data.ubicacion_gps || ''
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
    const sql = `
      INSERT INTO coordinadores (personero_nombre, personero_dni, distrito, local, coordinador_nombre, coordinador_dni, confirmacion, foto_url, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `;
    const params = [
      data.personero_nombre || '',
      data.personero_dni || '',
      data.distrito || '',
      data.local || data.colegio || '',
      data.coordinador_nombre || '',
      data.coordinador_dni || '',
      data.confirmacion || 'SI',
      data.foto_url || ''
    ];
    await query(sql, params);
    return { success: true, message: 'Confirmación de coordinador registrada exitosamente' };
  }

  // 6. OBTENER USUARIOS
  async obtenerUsuarios() {
    const sql = `
      SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS "origenHoja" FROM usuarios
      UNION ALL
      SELECT 
        dni, 
        nombres_y_apellidos AS nombre, 
        'Personero' AS rol, 
        COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion, 
        COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio, 
        COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa, 
        'Rpersoneros' AS "origenHoja"
      FROM rpersoneros
      UNION ALL
      SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios1' AS "origenHoja" FROM usuarios1
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
    const res = await query('SELECT * FROM asistencia WHERE dni ILIKE $1 ORDER BY fecha_hora DESC LIMIT 1', [dniQuery]);
    return { success: true, asistencia: res.rows[0] || null };
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
    const colQuery = (data.colegio || '').toString().trim();
    const distQuery = (data.distrito || data.ubicacion || '').toString().trim();
    const origenCoord = (data.origenHoja || data.tabla_origen || '').toString().trim();

    if (!colQuery) {
      return { success: true, personeros: [] };
    }

    let sql = '';
    const params = [colQuery, `%${colQuery}%`];

    if (origenCoord === 'Usuarios1' || origenCoord === 'usuarios1') {
      sql = `
        SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS "origenHoja", 'usuarios' AS tabla_origen
        FROM usuarios
        WHERE rol = 'Personero'
          AND (colegio ILIKE $1 OR colegio ILIKE $2)
      `;
      if (distQuery) {
        params.push(distQuery, `%${distQuery}%`);
        sql += ` AND (ubicacion ILIKE $3 OR ubicacion ILIKE $4)`;
      }
      sql += ` ORDER BY mesa ASC, nombre ASC`;
    } else {
      sql = `
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
        WHERE (COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) ILIKE $1 
           OR COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) ILIKE $2)
      `;
      if (distQuery) {
        params.push(distQuery, `%${distQuery}%`);
        sql += ` AND (COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) ILIKE $3 
                   OR COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) ILIKE $4)`;
      }
      sql += ` ORDER BY mesa ASC, nombre ASC`;
    }

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
