const { mssql, getPool } = require('../database/connection');
const IMesaRepository = require('../../domain/repositories/IMesaRepository');

class SqlMesaRepository extends IMesaRepository {
  async getAllMesas() {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

    let mesasEstructura = [];
    try {
      const resEstructura = await pool.request().query('SELECT * FROM dbo.Mesas');
      mesasEstructura = (resEstructura.recordset || []).map(m => ({
        mesa: m.mesa || m.numero_mesa,
        distrito: m.distrito,
        colegio: m.colegio,
        latitud: m.latitud,
        longitud: m.longitud,
        coordenadas_gps: m.coordenadas_gps || (m.latitud && m.longitud ? `${m.latitud},${m.longitud}` : ''),
        radio_metros: m.radio_metros || 50
      }));
    } catch (e) {
      console.warn('[SqlMesaRepository] Error consultando dbo.Mesas:', e.message);
    }

    let mesasVotos = [];
    try {
      const resVotos = await pool.request().query(`
        SELECT numero_mesa AS mesa, ubicacion AS distrito, colegio, origen 
        FROM dbo.Votos_Detalle
      `);
      mesasVotos = resVotos.recordset || [];
    } catch (e) {
      console.warn('[SqlMesaRepository] Error consultando dbo.Votos_Detalle:', e.message);
    }

    return {
      mesas: mesasVotos,
      mesas_estructura: mesasEstructura
    };
  }

  async getSchoolCoordinates(data) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

    const colQuery = (data.colegio || '').toString().trim();
    const distQuery = (data.distrito || '').toString().trim();
    const mesaQuery = (data.mesa || '').toString().trim();

    const req = pool.request();
    req.input('col', mssql.VarChar, `%${colQuery}%`);
    req.input('dist', mssql.VarChar, `%${distQuery}%`);
    req.input('mesa', mssql.VarChar, mesaQuery);

    try {
      let res = await req.query(`
        SELECT TOP 1 *
        FROM dbo.Colegios
        WHERE colegio COLLATE Latin1_General_CI_AI LIKE @col
      `);

      if (res.recordset && res.recordset.length > 0) {
        const c = res.recordset[0];
        return {
          colegio: c.colegio,
          distrito: c.distrito,
          lat: c.latitud,
          lon: c.longitud,
          coordenadas_gps: c.coordenadas_gps || (c.latitud && c.longitud ? `${c.latitud},${c.longitud}` : ''),
          radio_metros: c.radio_metros || 50
        };
      }
    } catch (e) {}

    try {
      const reqMesa = pool.request();
      reqMesa.input('col', mssql.VarChar, `%${colQuery}%`);
      reqMesa.input('mesa', mssql.VarChar, mesaQuery);

      const resMesa = await reqMesa.query(`
        SELECT TOP 1 *
        FROM dbo.Mesas
        WHERE (mesa = @mesa OR numero_mesa = @mesa) OR colegio COLLATE Latin1_General_CI_AI LIKE @col
      `);

      if (resMesa.recordset && resMesa.recordset.length > 0) {
        const m = resMesa.recordset[0];
        return {
          colegio: m.colegio,
          distrito: m.distrito,
          lat: m.latitud,
          lon: m.longitud,
          coordenadas_gps: m.coordenadas_gps || (m.latitud && m.longitud ? `${m.latitud},${m.longitud}` : ''),
          radio_metros: m.radio_metros || 50
        };
      }
    } catch (e) {}

    return null;
  }
}

module.exports = new SqlMesaRepository();
