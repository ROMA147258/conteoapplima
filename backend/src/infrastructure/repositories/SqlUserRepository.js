const { mssql, getPool } = require('../database/connection');
const IUserRepository = require('../../domain/repositories/IUserRepository');

class SqlUserRepository extends IUserRepository {
  async findByDniOrName(rawDni = '', rawNombre = '') {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

    const dniStr = rawDni.toString().trim();
    const nomStr = rawNombre.toString().trim();

    if (dniStr === '__warmup__' || nomStr === '__warmup__') {
      return { success: true, message: 'Warmup exitoso' };
    }

    if (!dniStr && !nomStr) {
      return null;
    }

    let targetDni = '';
    let targetNombre = '';

    if (dniStr && /^\d+$/.test(dniStr)) {
      targetDni = dniStr;
      targetNombre = nomStr;
    } else if (nomStr && /^\d+$/.test(nomStr)) {
      targetDni = nomStr;
      targetNombre = dniStr;
    } else {
      targetDni = dniStr;
      targetNombre = nomStr;
    }

    const nameWords = targetNombre
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    let blockedUser = null;

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

          blockedUser = {
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

          blockedUser = {
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

    let usuario = await buscarEnRpersoneros();
    if (usuario) return usuario;
    if (blockedUser) return blockedUser;

    usuario = await buscarEnRcoordinadores();
    if (usuario) return usuario;
    if (blockedUser) return blockedUser;

    usuario = await buscarEnUsuarios();
    if (usuario) return usuario;

    usuario = await buscarEnUsuarios1();
    if (usuario) return usuario;

    return null;
  }

  async getAllUsers() {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

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
    return res.recordset || [];
  }
}

module.exports = new SqlUserRepository();
