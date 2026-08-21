const { mssql, getPool } = require('../database/connection');
const ICoordinatorRepository = require('../../domain/repositories/ICoordinatorRepository');

class SqlCoordinatorRepository extends ICoordinatorRepository {
  async saveCoordinatorVerification(data) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

    await pool.request()
      .input('p_nom', mssql.VarChar, data.personero_nombre || data.personeroNombre || '')
      .input('p_dni', mssql.VarChar, data.personero_dni || data.personeroDni || '')
      .input('distrito', mssql.VarChar, data.distrito || '')
      .input('local', mssql.VarChar, data.local || data.colegio || '')
      .input('c_nom', mssql.VarChar, data.coordinador_nombre || data.coordinadorNombre || '')
      .input('c_dni', mssql.VarChar, data.coordinador_dni || data.coordinadorDni || '')
      .input('confirmacion', mssql.VarChar, data.confirmacion || 'SI')
      .input('foto_url', mssql.NVarChar, data.foto_url || data.fotoBase64 || '')
      .query(`
        MERGE dbo.Coordinadores AS target
        USING (SELECT @p_dni AS personero_dni) AS source
        ON (target.personero_dni = source.personero_dni)
        WHEN MATCHED THEN
          UPDATE SET
            confirmacion       = @confirmacion,
            personero_nombre   = @p_nom,
            coordinador_nombre = @c_nom,
            coordinador_dni    = @c_dni,
            distrito           = @distrito,
            local              = @local,
            foto_url           = @foto_url,
            fecha_hora         = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (personero_nombre, personero_dni, distrito, local, coordinador_nombre, coordinador_dni, confirmacion, foto_url)
          VALUES (@p_nom, @p_dni, @distrito, @local, @c_nom, @c_dni, @confirmacion, @foto_url);
      `);

    return { success: true, message: 'Verificación de coordinador guardada.' };
  }

  async getAllCoordinators() {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');
    const res = await pool.request().query('SELECT * FROM dbo.Coordinadores ORDER BY fecha_hora DESC');
    return res.recordset || [];
  }

  async getConfirmationsBySchool(colegio) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');
    const colegioQuery = (colegio || '').toString().trim();
    if (!colegioQuery) return [];

    const numMatch = colegioQuery.match(/\b\d{3,5}\b/);
    const colNum = numMatch ? numMatch[0] : '';

    const req = pool.request();
    req.input('local', mssql.VarChar, colegioQuery);
    req.input('local_like', mssql.VarChar, `%${colegioQuery}%`);
    req.input('col_num', mssql.VarChar, colNum ? `%${colNum}%` : `%${colegioQuery}%`);

    const res = await req.query(`
      SELECT c.*, a.mesa AS personero_mesa
      FROM dbo.Coordinadores c
      LEFT JOIN dbo.Asistencia a ON a.dni = c.personero_dni
      WHERE c.local = @local 
         OR c.local LIKE @local_like
         ${colNum ? "OR c.local LIKE @col_num" : ""}
      ORDER BY c.fecha_hora DESC
    `);
    return res.recordset || [];
  }

  async getPersonerosBySchool(data) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');
    const colQuery = (data.colegio || '').toString().trim();
    const distQuery = (data.distrito || data.ubicacion || '').toString().trim();

    if (!colQuery) {
      return [];
    }

    // Extraer número de colegio si existe (ej. 1271, 0024, etc.)
    const numMatch = colQuery.match(/\b\d{3,5}\b/);
    const colNum = numMatch ? numMatch[0] : '';

    const req = pool.request();
    req.input('colegio', mssql.VarChar, colQuery);
    req.input('colegio_like', mssql.VarChar, `%${colQuery}%`);
    req.input('col_num', mssql.VarChar, colNum ? `%${colNum}%` : `%${colQuery}%`);
    req.input('distrito', mssql.VarChar, distQuery);
    req.input('distrito_like', mssql.VarChar, `%${distQuery}%`);

    const query = `
      SELECT dni, nombre, rol, ubicacion, colegio, mesa, 'Usuarios' AS origenHoja, 'dbo.Usuarios' AS tabla_origen
      FROM dbo.Usuarios
      WHERE rol = 'Personero'
        AND (
          colegio COLLATE Latin1_General_CI_AI = @colegio 
          OR colegio COLLATE Latin1_General_CI_AI LIKE @colegio_like
          ${colNum ? "OR colegio COLLATE Latin1_General_CI_AI LIKE @col_num" : ""}
        )
      UNION
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
      WHERE (
        ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) COLLATE Latin1_General_CI_AI = @colegio 
        OR ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) COLLATE Latin1_General_CI_AI LIKE @colegio_like
        ${colNum ? "OR ISNULL(NULLIF(Local_de_Votacion_Asignado, ''), Local_de_Votacion) COLLATE Latin1_General_CI_AI LIKE @col_num" : ""}
      )
        AND (
          Credenciales COLLATE Latin1_General_CI_AI LIKE '%confirmad%' 
          OR Credenciales COLLATE Latin1_General_CI_AI = 'SI' 
          OR Credenciales COLLATE Latin1_General_CI_AI = '1'
          OR Credenciales COLLATE Latin1_General_CI_AI = 'Aprobado'
        )
      ORDER BY mesa ASC, nombre ASC
    `;

    const res = await req.query(query);
    return res.recordset || [];
  }
}

module.exports = new SqlCoordinatorRepository();
