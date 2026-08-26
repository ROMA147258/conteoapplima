const { getPool } = require('../database/connection');
const IReportRepository = require('../../domain/repositories/IReportRepository');

class SqlReportRepository extends IReportRepository {
  async getReportData() {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

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
      totales_provincial: reportRes.recordset[0] || {},
      totales_distrital: distRes.recordset[0] || {},
      mesas: mesasRes.recordset || []
    };
  }
}

module.exports = new SqlReportRepository();
