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

    // 1. dbo.Usuarios (Personeros oficiales)
    const buscarEnUsuarios = async () => {
      const req = pool.request();
      const whereClauses = [];

      if (targetDni) {
        req.input('dni', mssql.VarChar, targetDni);
        whereClauses.push('(dni COLLATE Latin1_General_CI_AI = @dni)');
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w, idx) => {
          req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
          whereClauses.push(`(nombre COLLATE Latin1_General_CI_AI LIKE @w_${idx})`);
        });
      }

      if (whereClauses.length === 0) return null;

      const query = `SELECT TOP 1 * FROM dbo.Usuarios WHERE ${whereClauses.join(' AND ')}`;
      const res = await req.query(query);
      if (res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        u.origenHoja = 'Usuarios';
        u.tabla_origen = 'dbo.Usuarios';
        u.rol = u.rol || 'Personero';
        u.tipo_interfaz = 'personero_conteo';
        return u;
      }
      return null;
    };

    let blockedUser = null;

    // 2. dbo.Rpersoneros (Personeros formulario)
    const buscarEnRpersoneros = async () => {
      const req = pool.request();
      const whereClauses = [];

      if (targetDni) {
        req.input('dni', mssql.VarChar, targetDni);
        whereClauses.push('(DNI COLLATE Latin1_General_CI_AI = @dni)');
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w, idx) => {
          req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
          whereClauses.push(`(Nombres_y_Apellidos COLLATE Latin1_General_CI_AI LIKE @w_${idx})`);
        });
      }

      if (whereClauses.length === 0) return null;

      const query = `
        SELECT TOP 1 
          DNI AS dni,
          Nombres_y_Apellidos AS nombre,
          ISNULL(NULLIF(Rol_a_Desempenar, ''), 'Personero') AS rol,
          ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion,
          ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio,
          ISNULL(NULLIF(Mesa_Asignada, ''), Mesa_de_Sufragio) AS mesa,
          Credenciales AS credenciales
        FROM dbo.Rpersoneros
        WHERE ${whereClauses.join(' AND ')}
      `;
      const res = await req.query(query);
      if (res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        const cred = (u.credenciales || '').toString().trim().toLowerCase();
        const isConfirmed = cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado';

        if (isConfirmed) {
          u.origenHoja = 'Rpersoneros';
          u.tabla_origen = 'dbo.Rpersoneros';
          u.rol = 'Personero';
          u.tipo_interfaz = 'personero_conteo';
          return u;
        } else {
          blockedUser = {
            isBlocked: true,
            status: 'blocked',
            rol: 'Personero',
            message: 'Acceso Denegado: Tus credenciales se encuentran en estado Bloqueado en el sistema.'
          };
          return null;
        }
      }
      return null;
    };

    // 3. dbo.Usuarios1 (Coordinadores oficiales)
    const buscarEnUsuarios1 = async () => {
      const req = pool.request();
      const whereClauses = [];

      if (targetDni) {
        req.input('dni', mssql.VarChar, targetDni);
        whereClauses.push('(dni COLLATE Latin1_General_CI_AI = @dni)');
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w, idx) => {
          req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
          whereClauses.push(`(nombre COLLATE Latin1_General_CI_AI LIKE @w_${idx})`);
        });
      }

      if (whereClauses.length === 0) return null;

      const query = `
        SELECT TOP 1 
          dni,
          nombre,
          'Coordinador' AS rol,
          ubicacion,
          colegio,
          mesa
        FROM dbo.Usuarios1
        WHERE ${whereClauses.join(' AND ')}
      `;
      const res = await req.query(query);
      if (res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        u.origenHoja = 'Usuarios1';
        u.tabla_origen = 'dbo.Usuarios1';
        u.rol = 'Coordinador';
        u.tipo_interfaz = 'coordinador_lista';
        return u;
      }
      return null;
    };

    // 4. dbo.Rcoordinadores (Coordinadores formulario)
    const buscarEnRcoordinadores = async () => {
      const req = pool.request();
      const whereClauses = [];

      if (targetDni) {
        req.input('dni', mssql.VarChar, targetDni);
        whereClauses.push('(DNI COLLATE Latin1_General_CI_AI = @dni)');
      }

      if (nameWords.length > 0) {
        nameWords.forEach((w, idx) => {
          req.input(`w_${idx}`, mssql.VarChar, `%${w}%`);
          whereClauses.push(`(Nombres_y_Apellidos COLLATE Latin1_General_CI_AI LIKE @w_${idx})`);
        });
      }

      if (whereClauses.length === 0) return null;

      const query = `
        SELECT TOP 1 
          DNI AS dni,
          Nombres_y_Apellidos AS nombre,
          'Coordinador' AS rol,
          ISNULL(NULLIF(Distrito_Asignado, ''), Distrito_donde_Vota) AS ubicacion,
          ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) AS colegio,
          '' AS mesa,
          Credenciales AS credenciales
        FROM dbo.Rcoordinadores
        WHERE ${whereClauses.join(' AND ')}
      `;
      const res = await req.query(query);
      if (res.recordset && res.recordset.length > 0) {
        const u = res.recordset[0];
        const cred = (u.credenciales || '').toString().trim().toLowerCase();
        const isConfirmed = cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado';

        if (isConfirmed) {
          u.origenHoja = 'Rcoordinadores';
          u.tabla_origen = 'dbo.Rcoordinadores';
          u.rol = 'Coordinador';
          u.tipo_interfaz = 'coordinador_lista';
          return u;
        } else {
          blockedUser = {
            isBlocked: true,
            status: 'blocked',
            rol: 'Coordinador',
            message: 'Acceso Denegado: Tus credenciales se encuentran en estado Bloqueado en el sistema.'
          };
          return null;
        }
      }
      return null;
    };

    let usuario = await buscarEnUsuarios();
    if (!usuario) usuario = await buscarEnRpersoneros();
    if (!usuario) usuario = await buscarEnUsuarios1();
    if (!usuario) usuario = await buscarEnRcoordinadores();

    if (usuario) return usuario;
    if (blockedUser) return blockedUser;
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
