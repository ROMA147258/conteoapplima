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

    const d_fp_v = extractVote(dist.FP);
    const d_jp_v = extractVote(dist.JP);
    const d_sp_v = extractVote(dist["SOMOS PERU"] || dist.SP);
    const d_frepap_v = extractVote(dist.FREPAP);
    const d_verde_v = extractVote(dist.VERDE);
    const d_morado_v = extractVote(dist.MORADO);
    const d_nulos = parseInt(data.votos_dist_nulos ?? dist.NULOS ?? 0, 10) || 0;
    const d_vacios = parseInt(data.votos_dist_vacios ?? dist.VACIOS ?? 0, 10) || 0;

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
      .input('p_vacios', mssql.Int, p_vacios)

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
      .input('d_vacios', mssql.Int, d_vacios);

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
