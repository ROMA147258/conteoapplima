const { mssql, getPool } = require('../database/connection');
const IVoteRepository = require('../../domain/repositories/IVoteRepository');

class SqlVoteRepository extends IVoteRepository {
  async saveVotes(data) {
    const pool = await getPool();
    if (!pool) throw new Error('SQL Server no disponible');

    const mesaStr = (data.mesa || '').toString().trim();
    const origenStr = (data.origen || 'MANUAL').toString().trim().toUpperCase();
    const prov = data.votos ? (data.votos.provincial || {}) : {};
    const dist = data.votos ? (data.votos.distrital || {}) : {};

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
      .input('p_fp_cand', mssql.VarChar, prov.FP ? prov.FP.candidato : '')
      .input('p_fp_votos', mssql.Int, prov.FP ? (parseInt(prov.FP.votos) || 0) : 0)
      .input('p_jp_cand', mssql.VarChar, prov.JP ? prov.JP.candidato : '')
      .input('p_jp_votos', mssql.Int, prov.JP ? (parseInt(prov.JP.votos) || 0) : 0)
      .input('p_sp_cand', mssql.VarChar, prov["SOMOS PERU"] ? prov["SOMOS PERU"].candidato : '')
      .input('p_sp_votos', mssql.Int, prov["SOMOS PERU"] ? (parseInt(prov["SOMOS PERU"].votos) || 0) : 0)
      .input('p_frepap_cand', mssql.VarChar, prov.FREPAP ? prov.FREPAP.candidato : '')
      .input('p_frepap_votos', mssql.Int, prov.FREPAP ? (parseInt(prov.FREPAP.votos) || 0) : 0)
      .input('p_verde_cand', mssql.VarChar, prov.VERDE ? prov.VERDE.candidato : '')
      .input('p_verde_votos', mssql.Int, prov.VERDE ? (parseInt(prov.VERDE.votos) || 0) : 0)
      .input('p_morado_cand', mssql.VarChar, prov.MORADO ? prov.MORADO.candidato : '')
      .input('p_morado_votos', mssql.Int, prov.MORADO ? (parseInt(prov.MORADO.votos) || 0) : 0)
      .input('p_nulos', mssql.Int, parseInt(data.votos_nulos) || 0)
      .input('p_vacios', mssql.Int, parseInt(data.votos_vacios) || 0)

      // Distrital
      .input('d_fp_cand', mssql.VarChar, dist.FP ? dist.FP.candidato : '')
      .input('d_fp_votos', mssql.Int, dist.FP ? (parseInt(dist.FP.votos) || 0) : 0)
      .input('d_jp_cand', mssql.VarChar, dist.JP ? dist.JP.candidato : '')
      .input('d_jp_votos', mssql.Int, dist.JP ? (parseInt(dist.JP.votos) || 0) : 0)
      .input('d_sp_cand', mssql.VarChar, dist["SOMOS PERU"] ? dist["SOMOS PERU"].candidato : '')
      .input('d_sp_votos', mssql.Int, dist["SOMOS PERU"] ? (parseInt(dist["SOMOS PERU"].votos) || 0) : 0)
      .input('d_frepap_cand', mssql.VarChar, dist.FREPAP ? dist.FREPAP.candidato : '')
      .input('d_frepap_votos', mssql.Int, dist.FREPAP ? (parseInt(dist.FREPAP.votos) || 0) : 0)
      .input('d_verde_cand', mssql.VarChar, dist.VERDE ? dist.VERDE.candidato : '')
      .input('d_verde_votos', mssql.Int, dist.VERDE ? (parseInt(dist.VERDE.votos) || 0) : 0)
      .input('d_morado_cand', mssql.VarChar, dist.MORADO ? dist.MORADO.candidato : '')
      .input('d_morado_votos', mssql.Int, dist.MORADO ? (parseInt(dist.MORADO.votos) || 0) : 0)
      .input('d_nulos', mssql.Int, parseInt(data.votos_dist_nulos) || 0)
      .input('d_vacios', mssql.Int, parseInt(data.votos_dist_vacios) || 0);

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
          p_total_votos = (@p_fp_votos + @p_jp_votos + @p_sp_votos + @p_frepap_votos + @p_verde_votos + @p_morado_votos + @p_nulos + @p_vacios),
          d_fp_candidato = @d_fp_cand, d_fp_votos = @d_fp_votos,
          d_jp_candidato = @d_jp_cand, d_jp_votos = @d_jp_votos,
          d_sp_candidato = @d_sp_cand, d_sp_votos = @d_sp_votos,
          d_frepap_candidato = @d_frepap_cand, d_frepap_votos = @d_frepap_votos,
          d_verde_candidato = @d_verde_cand, d_verde_votos = @d_verde_votos,
          d_morado_candidato = @d_morado_cand, d_morado_votos = @d_morado_votos,
          d_nulos = @d_nulos, d_vacios = @d_vacios,
          d_total_votos = (@d_fp_votos + @d_jp_votos + @d_sp_votos + @d_frepap_votos + @d_verde_votos + @d_morado_votos + @d_nulos + @d_vacios)
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
          @p_nulos, @p_vacios, (@p_fp_votos + @p_jp_votos + @p_sp_votos + @p_frepap_votos + @p_verde_votos + @p_morado_votos + @p_nulos + @p_vacios),
          @d_fp_cand, @d_fp_votos, @d_jp_cand, @d_jp_votos, @d_sp_cand, @d_sp_votos,
          @d_frepap_cand, @d_frepap_votos, @d_verde_cand, @d_verde_votos, @d_morado_cand, @d_morado_votos,
          @d_nulos, @d_vacios, (@d_fp_votos + @d_jp_votos + @d_sp_votos + @d_frepap_votos + @d_verde_votos + @d_morado_votos + @d_nulos + @d_vacios)
        );
    `);

    return { success: true, message: 'Votos registrados correctamente en la base de datos "conteo".' };
  }
}

module.exports = new SqlVoteRepository();
