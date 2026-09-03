const { mssql, getPool } = require('../database/connection');
const env = require('../../config/env');
const path = require('path');
const fs = require('fs');

class SqlServerRepository {
  async getPool() {
    const pool = await getPool();
    if (!pool) {
      throw new Error('Base de datos "conteo" no disponible o SQL Server desconectado.');
    }
    return pool;
  }

  // 1. LOGIN
  async login(data) {
    const pool = await this.getPool();
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

    // 1. dbo.Rpersoneros (Personeros formulario - Fuente Principal)
    const buscarEnRpersoneros = async () => {
      let res = null;
      if (targetDni) {
        try {
          const req = pool.request();
          req.input('dni', mssql.VarChar, targetDni);
          res = await req.query(`
            SELECT TOP 1 
              DNI AS dni,
              Nombres_y_Apellidos AS nombre,
              ISNULL(NULLIF(Rol_a_Desempenar, ''), 'Personero') AS rol,
              ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion,
              ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio,
              ISNULL(NULLIF(Mesa_Asignada, ''), Mesa_de_Sufragio) AS mesa,
              Credenciales AS credenciales,
              Preguntas AS preguntas
            FROM dbo.Rpersoneros
            WHERE LTRIM(RTRIM(DNI)) COLLATE Latin1_General_CI_AI = @dni
          `);
        } catch (e) {}
      }

      if ((!res || !res.recordset || res.recordset.length === 0) && nameWords.length > 0) {
        try {
          const req = pool.request();
          const whereClauses = nameWords.map((w, idx) => {
            req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
            return `(Nombres_y_Apellidos COLLATE Latin1_General_CI_AI LIKE @w_${idx})`;
          });
          res = await req.query(`
            SELECT TOP 1 
              DNI AS dni,
              Nombres_y_Apellidos AS nombre,
              ISNULL(NULLIF(Rol_a_Desempenar, ''), 'Personero') AS rol,
              ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion,
              ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio,
              ISNULL(NULLIF(Mesa_Asignada, ''), Mesa_de_Sufragio) AS mesa,
              Credenciales AS credenciales,
              Preguntas AS preguntas
            FROM dbo.Rpersoneros
            WHERE ${whereClauses.join(' AND ')}
          `);
        } catch (e) {}
      }

      if (res && res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        const cred = (u.credenciales || '').toString().trim().toLowerCase();
        const preg = (u.preguntas || '').toString().trim().toLowerCase();

        const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado'));
        const isAprobado = Boolean(preg && (preg.includes('aprobad') || preg === 'si' || preg === '1'));

        if (isConfirmed && isAprobado) {
          u.origenHoja = 'Rpersoneros';
          u.tabla_origen = 'dbo.Rpersoneros';
          u.rol = 'Personero';
          u.tipo_interfaz = 'personero_conteo';
          return u;
        } else {
          let errorMsg = 'Acceso Denegado: Tus credenciales deben estar en estado Confirmado y tu evaluación en estado Aprobado para ingresar.';
          if (!isAprobado && !isConfirmed) {
            errorMsg = 'Acceso Denegado: Debes tener la evaluación Aprobada y las credenciales Confirmadas para poder ingresar.';
          } else if (!isAprobado) {
            errorMsg = 'Acceso Denegado: Tu evaluación/preguntas deben estar en estado Aprobado para poder ingresar.';
          } else if (!isConfirmed) {
            errorMsg = 'Acceso Denegado: Tus credenciales deben estar en estado Confirmado para poder ingresar.';
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

    // 2. dbo.Rcoordinadores (Coordinadores formulario)
    const buscarEnRcoordinadores = async () => {
      let res = null;
      if (targetDni) {
        try {
          const req = pool.request();
          req.input('dni', mssql.VarChar, targetDni);
          res = await req.query(`
            SELECT TOP 1 
              DNI AS dni,
              Nombres_y_Apellidos AS nombre,
              'Coordinador' AS rol,
              ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion,
              ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio,
              '' AS mesa,
              Credenciales AS credenciales,
              Preguntas AS preguntas
            FROM dbo.Rcoordinadores
            WHERE LTRIM(RTRIM(DNI)) COLLATE Latin1_General_CI_AI = @dni
          `);
        } catch (e) {}
      }

      if ((!res || !res.recordset || res.recordset.length === 0) && nameWords.length > 0) {
        try {
          const req = pool.request();
          const whereClauses = nameWords.map((w, idx) => {
            req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
            return `(Nombres_y_Apellidos COLLATE Latin1_General_CI_AI LIKE @w_${idx})`;
          });
          res = await req.query(`
            SELECT TOP 1 
              DNI AS dni,
              Nombres_y_Apellidos AS nombre,
              'Coordinador' AS rol,
              ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion,
              ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio,
              '' AS mesa,
              Credenciales AS credenciales,
              Preguntas AS preguntas
            FROM dbo.Rcoordinadores
            WHERE ${whereClauses.join(' AND ')}
          `);
        } catch (e) {}
      }

      if (res && res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        const cred = (u.credenciales || '').toString().trim().toLowerCase();
        const preg = (u.preguntas || '').toString().trim().toLowerCase();

        const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado'));
        const isAprobado = Boolean(preg && (preg.includes('aprobad') || preg === 'si' || preg === '1'));

        if (isConfirmed && isAprobado) {
          u.origenHoja = 'Rcoordinadores';
          u.tabla_origen = 'dbo.Rcoordinadores';
          u.rol = 'Coordinador';
          u.tipo_interfaz = 'coordinador_lista';
          return u;
        } else {
          let errorMsg = 'Acceso Denegado: Tus credenciales de coordinador deben estar Confirmadas y la evaluación Aprobada para ingresar.';
          if (!isAprobado && !isConfirmed) {
            errorMsg = 'Acceso Denegado: Debes tener la evaluación Aprobada y las credenciales Confirmadas para ingresar.';
          } else if (!isAprobado) {
            errorMsg = 'Acceso Denegado: Tu evaluación/preguntas deben estar en estado Aprobado para ingresar.';
          } else if (!isConfirmed) {
            errorMsg = 'Acceso Denegado: Tus credenciales deben estar en estado Confirmado para ingresar.';
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

    // 3. dbo.Usuarios (Personeros oficiales)
    const buscarEnUsuarios = async () => {
      let res = null;
      if (targetDni) {
        try {
          const req = pool.request();
          req.input('dni', mssql.VarChar, targetDni);
          res = await req.query(`SELECT TOP 1 * FROM dbo.Usuarios WHERE LTRIM(RTRIM(dni)) COLLATE Latin1_General_CI_AI = @dni`);
        } catch (e) {}
      }

      if ((!res || !res.recordset || res.recordset.length === 0) && nameWords.length > 0) {
        try {
          const req = pool.request();
          const whereClauses = nameWords.map((w, idx) => {
            req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
            return `(nombre COLLATE Latin1_General_CI_AI LIKE @w_${idx})`;
          });
          res = await req.query(`SELECT TOP 1 * FROM dbo.Usuarios WHERE ${whereClauses.join(' AND ')}`);
        } catch (e) {}
      }

      if (res && res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        u.origenHoja = 'Usuarios';
        u.tabla_origen = 'dbo.Usuarios';
        u.rol = u.rol || 'Personero';
        u.tipo_interfaz = 'personero_conteo';
        return u;
      }
      return null;
    };

    // 4. dbo.Usuarios1 (Coordinadores oficiales)
    const buscarEnUsuarios1 = async () => {
      let res = null;
      if (targetDni) {
        try {
          const req = pool.request();
          req.input('dni', mssql.VarChar, targetDni);
          res = await req.query(`
            SELECT TOP 1 
              dni,
              nombre,
              'Coordinador' AS rol,
              ubicacion,
              colegio,
              mesa
            FROM dbo.Usuarios1
            WHERE LTRIM(RTRIM(dni)) COLLATE Latin1_General_CI_AI = @dni
          `);
        } catch (e) {}
      }

      if ((!res || !res.recordset || res.recordset.length === 0) && nameWords.length > 0) {
        try {
          const req = pool.request();
          const whereClauses = nameWords.map((w, idx) => {
            req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
            return `(nombre COLLATE Latin1_General_CI_AI LIKE @w_${idx})`;
          });
          res = await req.query(`
            SELECT TOP 1 
              dni,
              nombre,
              'Coordinador' AS rol,
              ubicacion,
              colegio,
              mesa
            FROM dbo.Usuarios1
            WHERE ${whereClauses.join(' AND ')}
          `);
        } catch (e) {}
      }

      if (res && res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        u.origenHoja = 'Usuarios1';
        u.tabla_origen = 'dbo.Usuarios1';
        u.rol = 'Coordinador';
        u.tipo_interfaz = 'coordinador_lista';
        return u;
      }
      return null;
    };

    let usuarioEncontrado = await buscarEnRpersoneros();
    if (usuarioEncontrado) {
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
        message: usuarioBloqueado.message
      };
    }

    usuarioEncontrado = await buscarEnRcoordinadores();
    if (usuarioEncontrado) {
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
        message: usuarioBloqueado.message
      };
    }

    usuarioEncontrado = await buscarEnUsuarios();
    if (usuarioEncontrado) {
      return {
        success: true,
        status: 'success',
        usuario: usuarioEncontrado,
        user: usuarioEncontrado,
        data: usuarioEncontrado
      };
    }

    usuarioEncontrado = await buscarEnUsuarios1();
    if (usuarioEncontrado) {
      return {
        success: true,
        status: 'success',
        usuario: usuarioEncontrado,
        user: usuarioEncontrado,
        data: usuarioEncontrado
      };
    }

    return { success: false, status: 'error', message: 'Usuario no encontrado. Verifica tu DNI o nombre.' };
  }

  // 2. REGISTRAR VOTOS
  async registrarVotos(data) {
    const pool = await this.getPool();
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
    const p_blanco = parseInt(data.votos_blancos ?? data.votos_vacios ?? prov.BLANCO ?? prov.VACIOS ?? 0, 10) || 0;
    const p_impugnados = parseInt(data.votos_impugnados ?? prov.IMPUGNADOS ?? 0, 10) || 0;

    const d_fp_v = extractVote(dist.FP);
    const d_jp_v = extractVote(dist.JP);
    const d_sp_v = extractVote(dist["SOMOS PERU"] || dist.SP);
    const d_frepap_v = extractVote(dist.FREPAP);
    const d_verde_v = extractVote(dist.VERDE);
    const d_morado_v = extractVote(dist.MORADO);
    const d_nulos = parseInt(data.votos_dist_nulos ?? dist.NULOS ?? 0, 10) || 0;
    const d_blanco = parseInt(data.votos_dist_blancos ?? data.votos_dist_vacios ?? dist.BLANCO ?? dist.VACIOS ?? 0, 10) || 0;
    const d_impugnados = parseInt(data.votos_dist_impugnados ?? dist.IMPUGNADOS ?? 0, 10) || 0;

    const req = pool.request()
      .input('personero', mssql.VarChar, data.brigadista || '')
      .input('dni', mssql.VarChar, data.dni || '')
      .input('departamento', mssql.VarChar, data.departamento || 'Lima')
      .input('provincia', mssql.VarChar, data.provincia || 'Lima')
      .input('ubicacion', mssql.VarChar, data.ubicacion || '')
      .input('colegio', mssql.VarChar, data.colegio || '')
      .input('numero_mesa', mssql.VarChar, mesaStr)
      .input('origen', mssql.VarChar, origenStr)

      // Provincial
      .input('p_fp_cand', mssql.VarChar, extractCand(prov.FP))
      .input('p_fp_votos', mssql.Int, p_fp_v)
      .input('p_jp_cand', mssql.VarChar, extractCand(prov.JP))
      .input('p_jp_votos', mssql.Int, p_jp_v)
      .input('p_sp_cand', mssql.VarChar, extractCand(prov["SOMOS PERU"] || prov.SP))
      .input('p_sp_votos', mssql.Int, p_sp_v)
      .input('p_frepap_cand', mssql.VarChar, extractCand(prov.FREPAP))
      .input('p_frepap_votos', mssql.Int, p_frepap_v)
      .input('p_verde_cand', mssql.VarChar, extractCand(prov.VERDE))
      .input('p_verde_votos', mssql.Int, p_verde_v)
      .input('p_morado_cand', mssql.VarChar, extractCand(prov.MORADO))
      .input('p_morado_votos', mssql.Int, p_morado_v)
      .input('p_nulos', mssql.Int, p_nulos)
      .input('p_vacios', mssql.Int, p_blanco)
      .input('p_blanco', mssql.Int, p_blanco)
      .input('p_impugnados', mssql.Int, p_impugnados)

      // Distrital
      .input('d_fp_cand', mssql.VarChar, extractCand(dist.FP))
      .input('d_fp_votos', mssql.Int, d_fp_v)
      .input('d_jp_cand', mssql.VarChar, extractCand(dist.JP))
      .input('d_jp_votos', mssql.Int, d_jp_v)
      .input('d_sp_cand', mssql.VarChar, extractCand(dist["SOMOS PERU"] || dist.SP))
      .input('d_sp_votos', mssql.Int, d_sp_v)
      .input('d_frepap_cand', mssql.VarChar, extractCand(dist.FREPAP))
      .input('d_frepap_votos', mssql.Int, d_frepap_v)
      .input('d_verde_cand', mssql.VarChar, extractCand(dist.VERDE))
      .input('d_verde_votos', mssql.Int, d_verde_v)
      .input('d_morado_cand', mssql.VarChar, extractCand(dist.MORADO))
      .input('d_morado_votos', mssql.Int, d_morado_v)
      .input('d_nulos', mssql.Int, d_nulos)
      .input('d_vacios', mssql.Int, d_blanco)
      .input('d_blanco', mssql.Int, d_blanco)
      .input('d_impugnados', mssql.Int, d_impugnados);

    await req.query(`
      MERGE dbo.Votos_Detalle AS target
      USING (SELECT @numero_mesa AS mesa, @origen AS origen) AS source
      ON (target.numero_mesa = source.mesa AND target.origen = source.origen)
      WHEN MATCHED THEN
        UPDATE SET 
          personero = @personero, dni = @dni, departamento = @departamento, provincia = @provincia,
          ubicacion = @ubicacion, colegio = @colegio, fecha_hora = GETDATE(),
          p_fp_candidato = @p_fp_cand, p_fp_votos = @p_fp_votos,
          p_jp_candidato = @p_jp_cand, p_jp_votos = @p_jp_votos,
          p_sp_candidato = @p_sp_cand, p_sp_votos = @p_sp_votos,
          p_frepap_candidato = @p_frepap_cand, p_frepap_votos = @p_frepap_votos,
          p_verde_candidato = @p_verde_cand, p_verde_votos = @p_verde_votos,
          p_morado_candidato = @p_morado_cand, p_morado_votos = @p_morado_votos,
          p_nulos = @p_nulos, p_vacios = @p_vacios,
          p_total_votos = (@p_fp_votos + @p_jp_votos + @p_sp_votos + @p_frepap_votos + @p_verde_votos + @p_morado_votos + @p_nulos + @p_blanco + @p_impugnados),
          d_fp_candidato = @d_fp_cand, d_fp_votos = @d_fp_votos,
          d_jp_candidato = @d_jp_cand, d_jp_votos = @d_jp_votos,
          d_sp_candidato = @d_sp_cand, d_sp_votos = @d_sp_votos,
          d_frepap_candidato = @d_frepap_cand, d_frepap_votos = @d_frepap_votos,
          d_verde_candidato = @d_verde_cand, d_verde_votos = @d_verde_votos,
          d_morado_candidato = @d_morado_cand, d_morado_votos = @d_morado_votos,
          d_nulos = @d_nulos, d_vacios = @d_vacios,
          d_total_votos = (@d_fp_votos + @d_jp_votos + @d_sp_votos + @d_frepap_votos + @d_verde_votos + @d_morado_votos + @d_nulos + @d_blanco + @d_impugnados)
      WHEN NOT MATCHED THEN
        INSERT (
          personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
          p_fp_candidato, p_fp_votos, p_jp_candidato, p_jp_votos, p_sp_candidato, p_sp_votos,
          p_frepap_candidato, p_frepap_votos, p_verde_candidato, p_verde_votos, p_morado_candidato, p_morado_votos,
          p_nulos, p_vacios, p_total_votos,
          d_fp_candidato, d_fp_votos, d_jp_candidato, d_jp_votos, d_sp_candidato, d_sp_votos,
          d_frepap_candidato, d_frepap_votos, d_verde_candidato, d_verde_votos, d_morado_candidato, d_morado_votos,
          d_nulos, d_vacios, d_total_votos
        )
        VALUES (
          @personero, @dni, @departamento, @provincia, @ubicacion, @colegio, @numero_mesa, @origen,
          @p_fp_cand, @p_fp_votos, @p_jp_cand, @p_jp_votos, @p_sp_cand, @p_sp_votos,
          @p_frepap_cand, @p_frepap_votos, @p_verde_cand, @p_verde_votos, @p_morado_cand, @p_morado_votos,
          @p_nulos, @p_vacios, (@p_fp_votos + @p_jp_votos + @p_sp_votos + @p_frepap_votos + @p_verde_votos + @p_morado_votos + @p_nulos + @p_blanco + @p_impugnados),
          @d_fp_cand, @d_fp_votos, @d_jp_cand, @d_jp_votos, @d_sp_cand, @d_sp_votos,
          @d_frepap_cand, @d_frepap_votos, @d_verde_cand, @d_verde_votos, @d_morado_cand, @d_morado_votos,
          @d_nulos, @d_vacios, (@d_fp_votos + @d_jp_votos + @d_sp_votos + @d_frepap_votos + @d_verde_votos + @d_morado_votos + @d_nulos + @d_blanco + @d_impugnados)
        );
    `);
    return { success: true, message: 'Votos registrados correctamente en la base de datos "conteo".' };
  }

  // 3. REGISTRAR ASISTENCIA (PERSONERO)
  async registrarAsistencia(data) {
    const pool = await this.getPool();
    const req = pool.request();
    req.input('nombre', mssql.VarChar, data.nombre || '');
    req.input('dni', mssql.VarChar, data.dni || '');
    req.input('distrito', mssql.VarChar, data.distrito || '');
    req.input('local', mssql.VarChar, data.local || data.colegio || '');
    req.input('mesa', mssql.VarChar, data.mesa || '');
    req.input('confirmacion', mssql.VarChar, data.confirmacion || 'SI');
    req.input('foto_url', mssql.VarChar, data.foto_url || data.fotoBase64 || '');
    req.input('ubicacion_gps', mssql.VarChar, data.ubicacion_gps || data.ubicacionGps || '');

    const query = `
      MERGE dbo.Asistencia AS target
      USING (SELECT @dni AS dni, @mesa AS mesa) AS source
      ON (target.dni = source.dni AND target.mesa = source.mesa)
      WHEN MATCHED THEN
        UPDATE SET
          nombre        = @nombre,
          distrito      = @distrito,
          local         = @local,
          confirmacion  = @confirmacion,
          foto_url      = @foto_url,
          ubicacion_gps = @ubicacion_gps,
          fecha_hora    = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps)
        VALUES (@nombre, @dni, @distrito, @local, @mesa, @confirmacion, @foto_url, @ubicacion_gps);
    `;

    await req.query(query);
    return { success: true, message: 'Asistencia registrada exitosamente' };
  }

  // 4. CONFIRMAR ASISTENCIA LLEGADA (GPS 50m)
  async confirmarAsistenciaLlegada(data) {
    const pool = await this.getPool();
    const req = pool.request();
    req.input('nombre', mssql.VarChar, data.nombre || '');
    req.input('dni', mssql.VarChar, data.dni || '');
    req.input('distrito', mssql.VarChar, data.distrito || '');
    req.input('colegio', mssql.VarChar, data.colegio || data.local || '');
    req.input('mesa', mssql.VarChar, data.mesa || '');
    req.input('latitud', mssql.Float, parseFloat(data.latitud) || 0);
    req.input('longitud', mssql.Float, parseFloat(data.longitud) || 0);
    req.input('distancia_metros', mssql.Float, parseFloat(data.distancia_metros) || 0);
    req.input('dentro_del_rango', mssql.VarChar, data.dentro_del_rango ? 'SI' : 'NO');
    req.input('foto_url', mssql.VarChar, data.foto_url || data.fotoBase64 || '');

    const query = `
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'AsistenciaLlegada')
      BEGIN
        CREATE TABLE dbo.AsistenciaLlegada (
          id INT IDENTITY(1,1) PRIMARY KEY,
          nombre VARCHAR(150),
          dni VARCHAR(50),
          distrito VARCHAR(100),
          colegio VARCHAR(200),
          mesa VARCHAR(50),
          latitud FLOAT,
          longitud FLOAT,
          distancia_metros FLOAT,
          dentro_del_rango VARCHAR(10),
          foto_url VARCHAR(500),
          estado VARCHAR(50) DEFAULT 'CONFIRMADO 2DA LLEGADA',
          fecha_hora DATETIME DEFAULT GETDATE()
        );
      END;

      INSERT INTO dbo.AsistenciaLlegada (nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, dentro_del_rango, foto_url)
      VALUES (@nombre, @dni, @distrito, @colegio, @mesa, @latitud, @longitud, @distancia_metros, @dentro_del_rango, @foto_url);
    `;

    await req.query(query);
    return { success: true, message: 'Llegada confirmada exitosamente (GPS 50m)' };
  }

  // 5. CONFIRMAR COORDINADOR
  async confirmarCoordinador(data) {
    const pool = await this.getPool();
    const req = pool.request();
    req.input('p_nom', mssql.VarChar, data.personero_nombre || data.personeroNombre || '');
    req.input('p_dni', mssql.VarChar, data.personero_dni || data.personeroDni || '');
    req.input('distrito', mssql.VarChar, data.distrito || '');
    req.input('local', mssql.VarChar, data.local || data.colegio || '');
    req.input('c_nom', mssql.VarChar, data.coordinador_nombre || data.coordinadorNombre || '');
    req.input('c_dni', mssql.VarChar, data.coordinador_dni || data.coordinadorDni || '');
    req.input('confirmacion', mssql.VarChar, data.confirmacion || 'SI');
    req.input('foto_url', mssql.VarChar, data.foto_url || data.fotoBase64 || '');

    const query = `
      MERGE dbo.Coordinadores AS target
      USING (SELECT @p_dni AS p_dni, @local AS local) AS source
      ON (target.personero_dni = source.p_dni AND target.local = source.local)
      WHEN MATCHED THEN
        UPDATE SET
          personero_nombre   = @p_nom,
          distrito           = @distrito,
          coordinador_nombre = @c_nom,
          coordinador_dni    = @c_dni,
          confirmacion       = @confirmacion,
          foto_url           = @foto_url,
          fecha_hora         = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (personero_nombre, personero_dni, distrito, local, coordinador_nombre, coordinador_dni, confirmacion, foto_url)
        VALUES (@p_nom, @p_dni, @distrito, @local, @c_nom, @c_dni, @confirmacion, @foto_url);
    `;

    await req.query(query);
    return { success: true, message: 'Confirmación de coordinador registrada exitosamente' };
  }

  // 6. OBTENER USUARIOS
  async obtenerUsuarios() {
    const pool = await this.getPool();
    const res = await pool.request().query(`
      SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS origenHoja FROM dbo.Usuarios
      UNION ALL
      SELECT DNI AS dni, Nombres_y_Apellidos AS nombre, 'Personero' AS rol, ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion, ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio, ISNULL(NULLIF(Mesa_Asignada, ''), Mesa_de_Sufragio) AS mesa, 'Rpersoneros' AS origenHoja 
      FROM dbo.Rpersoneros
      WHERE (
        Credenciales COLLATE Latin1_General_CI_AI LIKE '%confirmad%' 
        OR Credenciales COLLATE Latin1_General_CI_AI = 'SI' 
        OR Credenciales COLLATE Latin1_General_CI_AI = '1'
        OR Credenciales COLLATE Latin1_General_CI_AI = 'Aprobado'
      )
      UNION ALL
      SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios1' AS origenHoja FROM dbo.Usuarios1
      UNION ALL
      SELECT DNI AS dni, Nombres_y_Apellidos AS nombre, 'Coordinador' AS rol, ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion, ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio, '' AS mesa, 'Rcoordinadores' AS origenHoja 
      FROM dbo.Rcoordinadores
      WHERE (
        Credenciales COLLATE Latin1_General_CI_AI LIKE '%confirmad%' 
        OR Credenciales COLLATE Latin1_General_CI_AI = 'SI' 
        OR Credenciales COLLATE Latin1_General_CI_AI = '1'
        OR Credenciales COLLATE Latin1_General_CI_AI = 'Aprobado'
      )
      ORDER BY nombre ASC
    `);
    return { success: true, usuarios: res.recordset, data: res.recordset };
  }

  // 7. OBTENER ASISTENCIA
  async obtenerAsistencia() {
    const pool = await this.getPool();
    const res = await pool.request().query('SELECT * FROM dbo.Asistencia ORDER BY fecha_hora DESC');
    return { success: true, asistencia: res.recordset };
  }

  // 8. OBTENER COORDINADORES
  async obtenerCoordinadores() {
    const pool = await this.getPool();
    const res = await pool.request().query('SELECT * FROM dbo.Coordinadores ORDER BY fecha_hora DESC');
    return { success: true, coordinadores: res.recordset };
  }

  // 9. ASISTENCIA POR DNI
  async obtenerAsistenciaPorDni(dni) {
    const pool = await this.getPool();
    const dniQuery = (dni || '').toString().trim();
    if (!dniQuery) return { success: false, message: 'Se requiere DNI' };
    const res = await pool.request()
      .input('dni', mssql.VarChar, dniQuery)
      .query('SELECT TOP 1 * FROM dbo.Asistencia WHERE dni = @dni ORDER BY fecha_hora DESC');
    return { success: true, asistencia: res.recordset[0] || null };
  }

  // 10. CONFIRMACIONES POR COLEGIO
  async obtenerConfirmacionesPorColegio(colegio) {
    const pool = await this.getPool();
    const colegioQuery = (colegio || '').toString().trim();
    if (!colegioQuery) return { success: false, message: 'Se requiere colegio' };
    const res = await pool.request()
      .input('local', mssql.VarChar, colegioQuery)
      .query(`
        SELECT c.*, a.mesa AS personero_mesa
        FROM dbo.Coordinadores c
        LEFT JOIN dbo.Asistencia a ON a.dni = c.personero_dni
        WHERE c.local = @local
        ORDER BY c.fecha_hora DESC
      `);
    return { success: true, confirmaciones: res.recordset };
  }

  // 11. PERSONEROS POR COLEGIO
  async obtenerPersonerosPorColegio(data) {
    const pool = await this.getPool();
    const colQuery = (data.colegio || data.local || '').toString().trim();
    const distQuery = (data.distrito || data.ubicacion || '').toString().trim();
    const origenCoord = (data.origenHoja || data.tabla_origen || '').toString().trim();

    if (!colQuery && !distQuery) {
      return { success: true, personeros: [] };
    }

    const req = pool.request();
    req.input('colegio', mssql.VarChar, colQuery);
    req.input('colegio_like', mssql.VarChar, `%${colQuery}%`);
    req.input('distrito', mssql.VarChar, distQuery);
    req.input('distrito_like', mssql.VarChar, `%${distQuery}%`);

    let query = '';
    if (origenCoord === 'Rcoordinadores' || origenCoord === 'dbo.Rcoordinadores') {
      query = `
        SELECT 
          DNI AS dni, 
          Nombres_y_Apellidos AS nombre, 
          'Personero' AS rol, 
          ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion, 
          ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio, 
          ISNULL(NULLIF(Mesa_Asignada, ''), Mesa_de_Sufragio) AS mesa, 
          'Rpersoneros' AS origenHoja, 
          'dbo.Rpersoneros' AS tabla_origen
        FROM dbo.Rpersoneros
        WHERE 1=1
          ${colQuery ? "AND (ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) COLLATE Latin1_General_CI_AI = @colegio OR ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) COLLATE Latin1_General_CI_AI LIKE @colegio_like)" : ""}
          ${distQuery ? "AND (ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) COLLATE Latin1_General_CI_AI = @distrito OR ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) COLLATE Latin1_General_CI_AI LIKE @distrito_like)" : ""}
        ORDER BY mesa ASC, nombre ASC
      `;
    } else if (origenCoord === 'Usuarios1' || origenCoord === 'dbo.Usuarios1') {
      query = `
        SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS origenHoja, 'dbo.Usuarios' AS tabla_origen
        FROM dbo.Usuarios
        WHERE rol = 'Personero'
          ${colQuery ? "AND (colegio COLLATE Latin1_General_CI_AI = @colegio OR colegio COLLATE Latin1_General_CI_AI LIKE @colegio_like)" : ""}
          ${distQuery ? "AND (ubicacion COLLATE Latin1_General_CI_AI = @distrito OR ubicacion COLLATE Latin1_General_CI_AI LIKE @distrito_like)" : ""}
        ORDER BY mesa ASC, nombre ASC
      `;
    } else {
      query = `
        SELECT 
          DNI AS dni, 
          Nombres_y_Apellidos AS nombre, 
          'Personero' AS rol, 
          ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion, 
          ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio, 
          ISNULL(NULLIF(Mesa_Asignada, ''), Mesa_de_Sufragio) AS mesa, 
          'Rpersoneros' AS origenHoja, 
          'dbo.Rpersoneros' AS tabla_origen
        FROM dbo.Rpersoneros
        WHERE 1=1
          ${colQuery ? "AND (ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) COLLATE Latin1_General_CI_AI = @colegio OR ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) COLLATE Latin1_General_CI_AI LIKE @colegio_like)" : ""}
          ${distQuery ? "AND (ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) COLLATE Latin1_General_CI_AI = @distrito OR ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) COLLATE Latin1_General_CI_AI LIKE @distrito_like)" : ""}
        ORDER BY mesa ASC, nombre ASC
      `;
    }

    const res = await req.query(query);
    return { success: true, personeros: res.recordset };
  }

  // 12. MESAS
  async obtenerMesas() {
    const pool = await this.getPool();
    const resEstructura = await pool.request().query(`
      SELECT mesa, distrito, colegio, latitud, longitud, coordenadas_gps, 50 AS radio_metros 
      FROM dbo.Mesas
    `);
    const resVotos = await pool.request().query(`
      SELECT numero_mesa AS mesa, ubicacion AS distrito, colegio, origen 
      FROM dbo.Votos_Detalle
    `);
    return { 
      success: true, 
      mesas: resVotos.recordset,
      mesas_estructura: resEstructura.recordset 
    };
  }

  // 13. COORDENADAS COLEGIO
  async obtenerCoordenadasColegio(data) {
    const pool = await this.getPool();
    const colQuery = (data.colegio || '').toString().trim();
    const distQuery = (data.distrito || '').toString().trim();
    const mesaQuery = (data.mesa || '').toString().trim();

    const req = pool.request();
    req.input('col', mssql.VarChar, `%${colQuery}%`);
    req.input('dist', mssql.VarChar, `%${distQuery}%`);
    req.input('mesa', mssql.VarChar, mesaQuery);

    let res = await req.query(`
      SELECT TOP 1 colegio, distrito, direccion, latitud, longitud, coordenadas_gps, radio_metros
      FROM dbo.Colegios
      WHERE colegio COLLATE Latin1_General_CI_AI LIKE @col
    `);

    if (!res.recordset || res.recordset.length === 0) {
      res = await req.query(`
        SELECT TOP 1 colegio, distrito, '' AS direccion, latitud, longitud, coordenadas_gps, 50 AS radio_metros
        FROM dbo.Mesas
        WHERE mesa = @mesa OR colegio COLLATE Latin1_General_CI_AI LIKE @col
      `);
    }

    if (res.recordset && res.recordset.length > 0) {
      const c = res.recordset[0];
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
    const pool = await this.getPool();
    const reportRes = await pool.request().query(`
      SELECT 
        ISNULL(SUM(p_fp_votos), 0) AS FP, ISNULL(SUM(p_jp_votos), 0) AS JP, ISNULL(SUM(p_sp_votos), 0) AS [SOMOS PERU], 
        ISNULL(SUM(p_frepap_votos), 0) AS FREPAP, ISNULL(SUM(p_verde_votos), 0) AS VERDE, ISNULL(SUM(p_morado_votos), 0) AS MORADO,
        ISNULL(SUM(p_nulos), 0) AS NULOS, 
        ISNULL(SUM(ISNULL(p_blanco, p_vacios)), 0) AS BLANCO,
        ISNULL(SUM(p_impugnados), 0) AS IMPUGNADOS,
        ISNULL(SUM(ISNULL(p_blanco, p_vacios)), 0) AS VACIOS
      FROM dbo.Votos_Detalle
    `);

    const distRes = await pool.request().query(`
      SELECT 
        ISNULL(SUM(d_fp_votos), 0) AS FP, ISNULL(SUM(d_jp_votos), 0) AS JP, ISNULL(SUM(d_sp_votos), 0) AS [SOMOS PERU], 
        ISNULL(SUM(d_frepap_votos), 0) AS FREPAP, ISNULL(SUM(d_verde_votos), 0) AS VERDE, ISNULL(SUM(d_morado_votos), 0) AS MORADO,
        ISNULL(SUM(d_nulos), 0) AS NULOS, 
        ISNULL(SUM(ISNULL(d_blanco, d_vacios)), 0) AS BLANCO,
        ISNULL(SUM(d_impugnados), 0) AS IMPUGNADOS,
        ISNULL(SUM(ISNULL(d_blanco, d_vacios)), 0) AS VACIOS
      FROM dbo.Votos_Detalle
    `);

    const mesasRes = await pool.request().query('SELECT numero_mesa AS mesa, origen, ubicacion FROM dbo.Votos_Detalle');

    return {
      success: true,
      totales_provincial: reportRes.recordset[0] || {},
      totales_distrital: distRes.recordset[0] || {},
      mesas: mesasRes.recordset || []
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

module.exports = new SqlServerRepository();
