const { query, getPool } = require('../src/infrastructure/database/connection');

async function syncPartyColumns() {
  console.log('🔄 Sincronizando columnas individuales de partidos desde votos_json...');
  try {
    const res = await query('SELECT id, votos_json FROM votos_detalle WHERE votos_json IS NOT NULL');
    console.log(`Encontradas ${res.rows.length} filas para sincronizar.`);

    const ext = (item) => {
      if (!item) return 0;
      if (typeof item === 'number') return item;
      if (typeof item === 'string') return parseInt(item, 10) || 0;
      if (typeof item === 'object' && item.votos !== undefined) return parseInt(item.votos, 10) || 0;
      return 0;
    };

    let updated = 0;
    for (const row of res.rows) {
      const v = typeof row.votos_json === 'string' ? JSON.parse(row.votos_json) : row.votos_json;
      const prov = v.provincial || {};
      const dist = v.distrital || {};

      const sql = `
        UPDATE votos_detalle SET
          p_sp_votos = $1, p_rp_votos = $2, p_an_votos = $3, p_avanza_votos = $4,
          p_podemos_votos = $5, p_jp_votos = $6, p_obras_votos = $7, p_frepap_votos = $8,
          p_ap_votos = $9, p_esperanza_votos = $10, p_venceremos_votos = $11, p_vision_votos = $12,
          p_apra_votos = $13, p_fp_votos = $14, p_ppc_votos = $15, p_progresemos_votos = $16,
          p_morado_votos = $17, p_buen_gobierno_votos = $18, p_verde_votos = $19, p_peru_libre_votos = $20,
          p_tierra_verde_votos = $21, p_pueblo_consciente_votos = $22, p_ppp_votos = $23, p_integridad_votos = $24,
          p_fuerza_ciudadana_votos = $25, p_batalla_votos = $26, p_app_votos = $27, p_alianza_regional_votos = $28,
          d_sp_votos = $29, d_rp_votos = $30, d_an_votos = $31, d_avanza_votos = $32,
          d_podemos_votos = $33, d_jp_votos = $34, d_obras_votos = $35, d_frepap_votos = $36,
          d_ap_votos = $37, d_esperanza_votos = $38, d_venceremos_votos = $39, d_vision_votos = $40,
          d_apra_votos = $41, d_fp_votos = $42, d_ppc_votos = $43, d_progresemos_votos = $44,
          d_morado_votos = $45, d_buen_gobierno_votos = $46, d_verde_votos = $47, d_peru_libre_votos = $48,
          d_tierra_verde_votos = $49, d_pueblo_consciente_votos = $50, d_ppp_votos = $51, d_integridad_votos = $52,
          d_fuerza_ciudadana_votos = $53, d_batalla_votos = $54, d_app_votos = $55, d_alianza_regional_votos = $56
        WHERE id = $57
      `;

      const params = [
        ext(prov['SOMOS PERU'] || prov.SP),
        ext(prov.RENOVACION || prov['RENOVACION POPULAR'] || prov.RP),
        ext(prov['AHORA NACION'] || prov.AN),
        ext(prov['AVANZA PAIS'] || prov.AVANZA),
        ext(prov.PODEMOS || prov['PODEMOS PERU']),
        ext(prov.JP || prov['JUNTOS POR EL PERU']),
        ext(prov.OBRAS || prov['PARTIDO CIVICO OBRAS']),
        ext(prov.FREPAP),
        ext(prov['ACCION POPULAR'] || prov.AP),
        ext(prov.ESPERANZA || prov.FE || prov['FRENTE DE LA ESPERANZA']),
        ext(prov.VENCEREMOS || prov.AEV || prov['ALIANZA ELECTORAL VENCEREMOS']),
        ext(prov['VISION PERU'] || prov.VP || prov.VISION),
        ext(prov.APRA || prov['PARTIDO APRISTA PERUANO']),
        ext(prov.FP || prov['FUERZA POPULAR']),
        ext(prov.PPC || prov['PARTIDO POPULAR CRISTIANO']),
        ext(prov.PROGRESEMOS || prov.PROG),
        ext(prov.MORADO || prov.PM || prov['PARTIDO MORADO']),
        ext(prov['BUEN GOBIERNO'] || prov.PBG || prov['PARTIDO DEL BUEN GOBIERNO']),
        ext(prov.VERDE || prov.PDV || prov['PARTIDO DEMOCRATA VERDE']),
        ext(prov['PERU LIBRE'] || prov.PL),
        ext(prov['TIERRA VERDE'] || prov.CTTV),
        ext(prov['PUEBLO CONSCIENTE'] || prov.PC),
        ext(prov.PPP || prov['PARTIDO PATRIOTICO DEL PERU']),
        ext(prov.INTEGRIDAD || prov.ID || prov['INTEGRIDAD DEMOCRATICA']),
        ext(prov['FUERZA CIUDADANA'] || prov.FC),
        ext(prov['BATALLA PERU'] || prov.BP),
        ext(prov.APP || prov['ALIANZA PARA EL PROGRESO']),
        ext(prov['ALIANZA REGIONAL'] || prov.ARP || prov['ALIANZA REGIONAL POR EL PERU']),
        ext(dist['SOMOS PERU'] || dist.SP),
        ext(dist.RENOVACION || dist['RENOVACION POPULAR'] || dist.RP),
        ext(dist['AHORA NACION'] || dist.AN),
        ext(dist['AVANZA PAIS'] || dist.AVANZA),
        ext(dist.PODEMOS || dist['PODEMOS PERU']),
        ext(dist.JP || dist['JUNTOS POR EL PERU']),
        ext(dist.OBRAS || dist['PARTIDO CIVICO OBRAS']),
        ext(dist.FREPAP),
        ext(dist['ACCION POPULAR'] || dist.AP),
        ext(dist.ESPERANZA || dist.FE || dist['FRENTE DE LA ESPERANZA']),
        ext(dist.VENCEREMOS || dist.AEV || dist['ALIANZA ELECTORAL VENCEREMOS']),
        ext(dist['VISION PERU'] || dist.VP || dist.VISION),
        ext(dist.APRA || dist['PARTIDO APRISTA PERUANO']),
        ext(dist.FP || dist['FUERZA POPULAR']),
        ext(dist.PPC || dist['PARTIDO POPULAR CRISTIANO']),
        ext(dist.PROGRESEMOS || dist.PROG),
        ext(dist.MORADO || dist.PM || dist['PARTIDO MORADO']),
        ext(dist['BUEN GOBIERNO'] || dist.PBG || dist['PARTIDO DEL BUEN GOBIERNO']),
        ext(dist.VERDE || dist.PDV || dist['PARTIDO DEMOCRATA VERDE']),
        ext(dist['PERU LIBRE'] || dist.PL),
        ext(dist['TIERRA VERDE'] || dist.CTTV),
        ext(dist['PUEBLO CONSCIENTE'] || dist.PC),
        ext(dist.PPP || dist['PARTIDO PATRIOTICO DEL PERU']),
        ext(dist.INTEGRIDAD || dist.ID || dist['INTEGRIDAD DEMOCRATICA']),
        ext(dist['FUERZA CIUDADANA'] || dist.FC),
        ext(dist['BATALLA PERU'] || dist.BP),
        ext(dist.APP || dist['ALIANZA PARA EL PROGRESO']),
        ext(dist['ALIANZA REGIONAL'] || dist.ARP || dist['ALIANZA REGIONAL POR EL PERU']),
        row.id
      ];

      await query(sql, params);
      updated++;
    }

    console.log(`✅ Sincronizadas ${updated} filas en votos_detalle con éxito.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en sincronización:', err);
    process.exit(1);
  }
}

syncPartyColumns();
