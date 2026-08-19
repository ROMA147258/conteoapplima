const { mssql, getPool } = require('../database/connection');
const IAttendanceRepository = require('../../domain/repositories/IAttendanceRepository');

class SqlAttendanceRepository extends IAttendanceRepository {
  async saveAttendance(data) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

    await pool.request()
      .input('nombre', mssql.VarChar, data.nombre || '')
      .input('dni', mssql.VarChar, data.dni || '')
      .input('distrito', mssql.VarChar, data.distrito || '')
      .input('local', mssql.VarChar, data.local || '')
      .input('mesa', mssql.VarChar, data.mesa || '')
      .input('confirmacion', mssql.VarChar, data.confirmacion || 'SI')
      .input('foto_url', mssql.NVarChar, data.fotoBase64 || '')
      .input('ubicacion_gps', mssql.VarChar, data.ubicacionGps || '')
      .query(`
        MERGE dbo.Asistencia AS target
        USING (SELECT @dni AS dni) AS source
        ON (target.dni = source.dni)
        WHEN MATCHED THEN
          UPDATE SET
            nombre        = @nombre,
            distrito      = @distrito,
            local         = @local,
            mesa          = @mesa,
            confirmacion  = @confirmacion,
            foto_url      = CASE WHEN @foto_url != '' THEN @foto_url ELSE target.foto_url END,
            ubicacion_gps = CASE WHEN @ubicacion_gps != '' THEN @ubicacion_gps ELSE target.ubicacion_gps END,
            fecha_hora    = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps)
          VALUES (@nombre, @dni, @distrito, @local, @mesa, @confirmacion, @foto_url, @ubicacion_gps);
      `);
    return { success: true, message: 'Asistencia registrada correctamente.' };
  }

  async saveArrival(data) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AsistenciaLlegada')
      BEGIN
        CREATE TABLE dbo.AsistenciaLlegada (
          id INT IDENTITY(1,1) PRIMARY KEY,
          nombre VARCHAR(255),
          dni VARCHAR(50),
          distrito VARCHAR(100),
          colegio VARCHAR(255),
          mesa VARCHAR(50),
          latitud VARCHAR(50),
          longitud VARCHAR(50),
          distancia_metros FLOAT,
          radio_permitido INT DEFAULT 50,
          estado VARCHAR(50) DEFAULT 'CONFIRMADO 2DA LLEGADA',
          fecha_registro DATETIME DEFAULT GETDATE()
        );
      END
    `);

    await pool.request()
      .input('nombre', mssql.VarChar, data.nombre || '')
      .input('dni', mssql.VarChar, data.dni || '')
      .input('distrito', mssql.VarChar, data.distrito || '')
      .input('colegio', mssql.VarChar, data.colegio || data.local || '')
      .input('mesa', mssql.VarChar, data.mesa || '')
      .input('latitud', mssql.VarChar, (data.lat || '').toString())
      .input('longitud', mssql.VarChar, (data.lon || '').toString())
      .input('distancia', mssql.Float, parseFloat(data.distancia_metros) || 0)
      .input('radio', mssql.Int, 50)
      .query(`
        INSERT INTO dbo.AsistenciaLlegada (nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido)
        VALUES (@nombre, @dni, @distrito, @colegio, @mesa, @latitud, @longitud, @distancia, @radio)
      `);

    return { success: true, message: 'Llegada por GPS registrada correctamente dentro del radio de 50 metros.' };
  }

  async getAllAttendance() {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');
    const res = await pool.request().query('SELECT * FROM dbo.Asistencia ORDER BY fecha_hora DESC');
    return res.recordset || [];
  }

  async getAttendanceByDni(dni) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');
    const dniQuery = (dni || '').toString().trim();
    if (!dniQuery) return null;
    const res = await pool.request()
      .input('dni', mssql.VarChar, dniQuery)
      .query('SELECT TOP 1 * FROM dbo.Asistencia WHERE dni = @dni ORDER BY fecha_hora DESC');
    return res.recordset[0] || null;
  }
}

module.exports = new SqlAttendanceRepository();
