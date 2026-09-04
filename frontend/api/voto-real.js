import pg from 'pg';
const { Pool } = pg;

// Conexión directa a Neon PostgreSQL
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_SERVER || 'ep-super-silence-axywhu8v-pooler.c-4.us-east-2.aws.neon.tech',
      user: process.env.DB_USER || 'neondb_owner',
      password: process.env.DB_PASSWORD || 'npg_b5gvlBUs0NSe',
      database: process.env.DB_NAME || 'neondb',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000
    });
  }
  return pool;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let payload = {};
  if (req.method === 'GET') {
    payload = { ...req.query };
  } else if (req.method === 'POST') {
    if (req.body && typeof req.body === 'object') {
      payload = req.body;
    } else if (typeof req.body === 'string' && req.body.trim()) {
      try {
        payload = JSON.parse(req.body);
      } catch (e) {
        payload = { ...req.query };
      }
    } else {
      payload = { ...req.query };
    }
  }

  const action = payload.action;
  if (!action) {
    return res.status(200).json({ success: false, message: 'No se especificó ninguna acción' });
  }

  const db = getPool();

  try {
    switch (action) {
      // 1. LOGIN
      case 'login': {
        const identifier = (payload.usuario || payload.dni || payload.user || '').toString().trim();
        if (!identifier) {
          return res.status(200).json({ success: false, status: 'error', message: 'Por favor ingresa tu DNI.' });
        }

        // Admin check
        if (identifier === 'Admin#2026$Secure!VotoReal' || identifier === '99999999') {
          return res.status(200).json({
            success: true,
            status: 'success',
            role: 'Admin',
            token: 'TOKEN-ADMIN-2026',
            user: { dni: identifier, nombre: 'Super Administrador', rol: 'Admin', ubicacion: 'Lima', colegio: 'CENTRAL', mesa: '' }
          });
        }

        const userRes = await db.query('SELECT * FROM usuarios WHERE TRIM(dni) = $1 LIMIT 1', [identifier]);
        if (userRes.rows.length > 0) {
          const u = userRes.rows[0];
          // Verificar si ya envió votos
          const votoManualRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'MANUAL\' LIMIT 1', [identifier]);
          const votoImagenRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'IMAGEN\' LIMIT 1', [identifier]);

          return res.status(200).json({
            success: true,
            status: 'success',
            role: u.rol || 'Personero',
            token: `TOKEN-${u.dni}`,
            user: {
              ...u,
              voto_manual_enviado: votoManualRes.rows.length > 0,
              voto_imagen_enviado: votoImagenRes.rows.length > 0
            }
          });
        }

        // Buscar en rpersoneros
        const rpersRes = await db.query('SELECT * FROM rpersoneros WHERE TRIM(dni) = $1 LIMIT 1', [identifier]);
        if (rpersRes.rows.length > 0) {
          const rp = rpersRes.rows[0];
          const votoManualRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'MANUAL\' LIMIT 1', [identifier]);
          const votoImagenRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'IMAGEN\' LIMIT 1', [identifier]);

          return res.status(200).json({
            success: true,
            status: 'success',
            role: 'Personero',
            token: `TOKEN-${rp.dni}`,
            user: {
              dni: rp.dni,
              nombre: rp.nombres_y_apellidos,
              rol: 'Personero',
              ubicacion: rp.distrito_asignado || rp.distrito_donde_vota || 'Lima',
              colegio: rp.local_de_votacion_asignado || rp.local_de_votacion || '',
              mesa: rp.mesa_asignada || rp.mesa_de_sufragio || '',
              voto_manual_enviado: votoManualRes.rows.length > 0,
              voto_imagen_enviado: votoImagenRes.rows.length > 0
            }
          });
        }

        return res.status(200).json({
          success: false,
          status: 'error',
          message: 'DNI no encontrado en el padrón oficial.'
        });
      }

      // 2. REGISTRAR VOTOS
      case 'registrar_votos': {
        const dni = (payload.dni || '').toString().trim();
        const personero = (payload.brigadista || payload.personero || payload.nombre || '').toString().trim();
        const departamento = payload.departamento || 'Lima';
        const provincia = payload.provincia || 'Lima';
        const ubicacion = payload.ubicacion || payload.distrito || 'Lima';
        const colegio = payload.colegio || payload.local || '';
        const numero_mesa = (payload.mesa || payload.numero_mesa || '').toString().trim();
        const origen = (payload.origen || 'MANUAL').toString().trim().toUpperCase();

        const prov = payload.votos ? (payload.votos.provincial || {}) : {};
        const dist = payload.votos ? (payload.votos.distrital || {}) : {};

        const extractVote = (item) => {
          if (item === undefined || item === null) return 0;
          if (typeof item === 'object') return parseInt(item.votos ?? item.val ?? item.value ?? 0, 10) || 0;
          return parseInt(item, 10) || 0;
        };

        const extractCand = (item, fallback = '') => {
          if (item && typeof item === 'object' && item.candidato) return item.candidato;
          return fallback;
        };

        // Provincial
        const p_sp_v = extractVote(prov["SOMOS PERU"] || prov.SP);
        const p_rp_v = extractVote(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP);
        const p_an_v = extractVote(prov["AHORA NACION"] || prov.AN);
        const p_avanza_v = extractVote(prov["AVANZA PAIS"] || prov.AVANZA);
        const p_podemos_v = extractVote(prov.PODEMOS || prov["PODEMOS PERU"]);
        const p_jp_v = extractVote(prov.JP || prov["JUNTOS POR EL PERU"]);
        const p_obras_v = extractVote(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"]);
        const p_frepap_v = extractVote(prov.FREPAP);
        const p_ap_v = extractVote(prov["ACCION POPULAR"] || prov.AP);
        const p_esperanza_v = extractVote(prov.ESPERANZA || prov.FE);
        const p_venceremos_v = extractVote(prov.VENCEREMOS || prov.AEV);
        const p_vision_v = extractVote(prov["VISION PERU"] || prov.VP || prov.VISION);
        const p_apra_v = extractVote(prov.APRA);
        const p_fp_v = extractVote(prov.FP || prov["FUERZA POPULAR"]);
        const p_ppc_v = extractVote(prov.PPC);
        const p_progresemos_v = extractVote(prov.PROGRESEMOS || prov.PROG);
        const p_morado_v = extractVote(prov.MORADO || prov.PM);
        const p_buen_gobierno_v = extractVote(prov["BUEN GOBIERNO"] || prov.PBG);
        const p_verde_v = extractVote(prov.VERDE || prov.PDV);
        const p_peru_libre_v = extractVote(prov["PERU LIBRE"] || prov.PL);
        const p_tierra_verde_v = extractVote(prov["TIERRA VERDE"] || prov.CTTV);
        const p_pueblo_consciente_v = extractVote(prov["PUEBLO CONSCIENTE"] || prov.PC);
        const p_ppp_v = extractVote(prov.PPP);
        const p_integridad_v = extractVote(prov.INTEGRIDAD || prov.ID);
        const p_fuerza_ciudadana_v = extractVote(prov["FUERZA CIUDADANA"] || prov.FC);
        const p_batalla_v = extractVote(prov["BATALLA PERU"] || prov.BP);
        const p_app_v = extractVote(prov.APP);
        const p_alianza_regional_v = extractVote(prov["ALIANZA REGIONAL"] || prov.ARP);

        const p_nulos = parseInt(payload.votos_nulos ?? prov.NULOS ?? 0, 10) || 0;
        const p_blanco = parseInt(payload.votos_blancos ?? payload.votos_vacios ?? prov.BLANCO ?? prov.VACIOS ?? 0, 10) || 0;
        const p_impugnados = parseInt(payload.votos_impugnados ?? prov.IMPUGNADOS ?? 0, 10) || 0;

        let p_cands_sum = 0;
        Object.keys(prov).forEach(k => {
          if (!['NULOS', 'BLANCO', 'VACIOS', 'IMPUGNADOS'].includes(k.toUpperCase())) {
            p_cands_sum += extractVote(prov[k]);
          }
        });
        const p_tot = p_cands_sum + p_nulos + p_blanco + p_impugnados;

        // Distrital
        const d_sp_v = extractVote(dist["SOMOS PERU"] || dist.SP);
        const d_rp_v = extractVote(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP);
        const d_an_v = extractVote(dist["AHORA NACION"] || dist.AN);
        const d_avanza_v = extractVote(dist["AVANZA PAIS"] || dist.AVANZA);
        const d_podemos_v = extractVote(dist.PODEMOS || dist["PODEMOS PERU"]);
        const d_jp_v = extractVote(dist.JP || dist["JUNTOS POR EL PERU"]);
        const d_obras_v = extractVote(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"]);
        const d_frepap_v = extractVote(dist.FREPAP);
        const d_ap_v = extractVote(dist["ACCION POPULAR"] || dist.AP);
        const d_esperanza_v = extractVote(dist.ESPERANZA || dist.FE);
        const d_venceremos_v = extractVote(dist.VENCEREMOS || dist.AEV);
        const d_vision_v = extractVote(dist["VISION PERU"] || dist.VP || dist.VISION);
        const d_apra_v = extractVote(dist.APRA);
        const d_fp_v = extractVote(dist.FP || dist["FUERZA POPULAR"]);
        const d_ppc_v = extractVote(dist.PPC);
        const d_progresemos_v = extractVote(dist.PROGRESEMOS || dist.PROG);
        const d_morado_v = extractVote(dist.MORADO || dist.PM);
        const d_buen_gobierno_v = extractVote(dist["BUEN GOBIERNO"] || dist.PBG);
        const d_verde_v = extractVote(dist.VERDE || dist.PDV);
        const d_peru_libre_v = extractVote(dist["PERU LIBRE"] || dist.PL);
        const d_tierra_verde_v = extractVote(dist["TIERRA VERDE"] || dist.CTTV);
        const d_pueblo_consciente_v = extractVote(dist["PUEBLO CONSCIENTE"] || dist.PC);
        const d_ppp_v = extractVote(dist.PPP);
        const d_integridad_v = extractVote(dist.INTEGRIDAD || dist.ID);
        const d_fuerza_ciudadana_v = extractVote(dist["FUERZA CIUDADANA"] || dist.FC);
        const d_batalla_v = extractVote(dist["BATALLA PERU"] || dist.BP);
        const d_app_v = extractVote(dist.APP);
        const d_alianza_regional_v = extractVote(dist["ALIANZA REGIONAL"] || dist.ARP);

        const d_nulos = parseInt(payload.votos_dist_nulos ?? dist.NULOS ?? 0, 10) || 0;
        const d_blanco = parseInt(payload.votos_dist_blancos ?? payload.votos_dist_vacios ?? dist.BLANCO ?? dist.VACIOS ?? 0, 10) || 0;
        const d_impugnados = parseInt(payload.votos_dist_impugnados ?? dist.IMPUGNADOS ?? 0, 10) || 0;

        let d_cands_sum = 0;
        Object.keys(dist).forEach(k => {
          if (!['NULOS', 'BLANCO', 'VACIOS', 'IMPUGNADOS'].includes(k.toUpperCase())) {
            d_cands_sum += extractVote(dist[k]);
          }
        });
        const d_tot = d_cands_sum + d_nulos + d_blanco + d_impugnados;

        const votosJson = JSON.stringify(payload.votos || { provincial: prov, distrital: dist });

        const sql = `
          INSERT INTO votos_detalle (
            personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
            p_sp_candidato, p_sp_votos, p_rp_candidato, p_rp_votos, p_an_candidato, p_an_votos,
            p_avanza_candidato, p_avanza_votos, p_podemos_candidato, p_podemos_votos, p_jp_candidato, p_jp_votos,
            p_obras_candidato, p_obras_votos, p_frepap_candidato, p_frepap_votos, p_ap_candidato, p_ap_votos,
            p_esperanza_candidato, p_esperanza_votos, p_venceremos_candidato, p_venceremos_votos, p_vision_candidato, p_vision_votos,
            p_apra_candidato, p_apra_votos, p_fp_candidato, p_fp_votos, p_ppc_candidato, p_ppc_votos,
            p_progresemos_candidato, p_progresemos_votos, p_morado_candidato, p_morado_votos, p_buen_gobierno_candidato, p_buen_gobierno_votos,
            p_verde_candidato, p_verde_votos, p_peru_libre_candidato, p_peru_libre_votos, p_tierra_verde_candidato, p_tierra_verde_votos,
            p_pueblo_consciente_candidato, p_pueblo_consciente_votos, p_ppp_candidato, p_ppp_votos, p_integridad_candidato, p_integridad_votos,
            p_fuerza_ciudadana_candidato, p_fuerza_ciudadana_votos, p_batalla_candidato, p_batalla_votos, p_app_candidato, p_app_votos,
            p_alianza_regional_candidato, p_alianza_regional_votos,
            p_nulos, p_vacios, p_blanco, p_impugnados, p_total_votos,
            d_sp_candidato, d_sp_votos, d_rp_candidato, d_rp_votos, d_an_candidato, d_an_votos,
            d_avanza_candidato, d_avanza_votos, d_podemos_candidato, d_podemos_votos, d_jp_candidato, d_jp_votos,
            d_obras_candidato, d_obras_votos, d_frepap_candidato, d_frepap_votos, d_ap_candidato, d_ap_votos,
            d_esperanza_candidato, d_esperanza_votos, d_venceremos_candidato, d_venceremos_votos, d_vision_candidato, d_vision_votos,
            d_apra_candidato, d_apra_votos, d_fp_candidato, d_fp_votos, d_ppc_candidato, d_ppc_votos,
            d_progresemos_candidato, d_progresemos_votos, d_morado_candidato, d_morado_votos, d_buen_gobierno_candidato, d_buen_gobierno_votos,
            d_verde_candidato, d_verde_votos, d_peru_libre_candidato, d_peru_libre_votos, d_tierra_verde_candidato, d_tierra_verde_votos,
            d_pueblo_consciente_candidato, d_pueblo_consciente_votos, d_ppp_candidato, d_ppp_votos, d_integridad_candidato, d_integridad_votos,
            d_fuerza_ciudadana_candidato, d_fuerza_ciudadana_votos, d_batalla_candidato, d_batalla_votos, d_app_candidato, d_app_votos,
            d_alianza_regional_candidato, d_alianza_regional_votos,
            d_nulos, d_vacios, d_blanco, d_impugnados, d_total_votos, votos_json, fecha_hora
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
            $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
            $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56,
            $57, $58, $59, $60, $61, $62, $63, $64,
            $65, $66, $67, $68, $69,
            $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81,
            $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93,
            $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105,
            $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117,
            $118, $119, $120, $121, $122, $123, $124, $125,
            $126, $127, $128, $129, $130, $131, CURRENT_TIMESTAMP
          )
          ON CONFLICT (dni, origen) DO UPDATE SET
            personero = EXCLUDED.personero,
            departamento = EXCLUDED.departamento,
            provincia = EXCLUDED.provincia,
            ubicacion = EXCLUDED.ubicacion,
            colegio = EXCLUDED.colegio,
            numero_mesa = EXCLUDED.numero_mesa,
            p_sp_candidato = EXCLUDED.p_sp_candidato, p_sp_votos = EXCLUDED.p_sp_votos,
            p_rp_candidato = EXCLUDED.p_rp_candidato, p_rp_votos = EXCLUDED.p_rp_votos,
            p_an_candidato = EXCLUDED.p_an_candidato, p_an_votos = EXCLUDED.p_an_votos,
            p_avanza_candidato = EXCLUDED.p_avanza_candidato, p_avanza_votos = EXCLUDED.p_avanza_votos,
            p_podemos_candidato = EXCLUDED.p_podemos_candidato, p_podemos_votos = EXCLUDED.p_podemos_votos,
            p_jp_candidato = EXCLUDED.p_jp_candidato, p_jp_votos = EXCLUDED.p_jp_votos,
            p_obras_candidato = EXCLUDED.p_obras_candidato, p_obras_votos = EXCLUDED.p_obras_votos,
            p_frepap_candidato = EXCLUDED.p_frepap_candidato, p_frepap_votos = EXCLUDED.p_frepap_votos,
            p_ap_candidato = EXCLUDED.p_ap_candidato, p_ap_votos = EXCLUDED.p_ap_votos,
            p_esperanza_candidato = EXCLUDED.p_esperanza_candidato, p_esperanza_votos = EXCLUDED.p_esperanza_votos,
            p_venceremos_candidato = EXCLUDED.p_venceremos_candidato, p_venceremos_votos = EXCLUDED.p_venceremos_votos,
            p_vision_candidato = EXCLUDED.p_vision_candidato, p_vision_votos = EXCLUDED.p_vision_votos,
            p_apra_candidato = EXCLUDED.p_apra_candidato, p_apra_votos = EXCLUDED.p_apra_votos,
            p_fp_candidato = EXCLUDED.p_fp_candidato, p_fp_votos = EXCLUDED.p_fp_votos,
            p_ppc_candidato = EXCLUDED.p_ppc_candidato, p_ppc_votos = EXCLUDED.p_ppc_votos,
            p_progresemos_candidato = EXCLUDED.p_progresemos_candidato, p_progresemos_votos = EXCLUDED.p_progresemos_votos,
            p_morado_candidato = EXCLUDED.p_morado_candidato, p_morado_votos = EXCLUDED.p_morado_votos,
            p_buen_gobierno_candidato = EXCLUDED.p_buen_gobierno_candidato, p_buen_gobierno_votos = EXCLUDED.p_buen_gobierno_votos,
            p_verde_candidato = EXCLUDED.p_verde_candidato, p_verde_votos = EXCLUDED.p_verde_votos,
            p_peru_libre_candidato = EXCLUDED.p_peru_libre_candidato, p_peru_libre_votos = EXCLUDED.p_peru_libre_votos,
            p_tierra_verde_candidato = EXCLUDED.p_tierra_verde_candidato, p_tierra_verde_votos = EXCLUDED.p_tierra_verde_votos,
            p_pueblo_consciente_candidato = EXCLUDED.p_pueblo_consciente_candidato, p_pueblo_consciente_votos = EXCLUDED.p_pueblo_consciente_votos,
            p_ppp_candidato = EXCLUDED.p_ppp_candidato, p_ppp_votos = EXCLUDED.p_ppp_votos,
            p_integridad_candidato = EXCLUDED.p_integridad_candidato, p_integridad_votos = EXCLUDED.p_integridad_votos,
            p_fuerza_ciudadana_candidato = EXCLUDED.p_fuerza_ciudadana_candidato, p_fuerza_ciudadana_votos = EXCLUDED.p_fuerza_ciudadana_votos,
            p_batalla_candidato = EXCLUDED.p_batalla_candidato, p_batalla_votos = EXCLUDED.p_batalla_votos,
            p_app_candidato = EXCLUDED.p_app_candidato, p_app_votos = EXCLUDED.p_app_votos,
            p_alianza_regional_candidato = EXCLUDED.p_alianza_regional_candidato, p_alianza_regional_votos = EXCLUDED.p_alianza_regional_votos,
            p_nulos = EXCLUDED.p_nulos, p_vacios = EXCLUDED.p_vacios, p_blanco = EXCLUDED.p_blanco, p_impugnados = EXCLUDED.p_impugnados, p_total_votos = EXCLUDED.p_total_votos,
            d_sp_candidato = EXCLUDED.d_sp_candidato, d_sp_votos = EXCLUDED.d_sp_votos,
            d_rp_candidato = EXCLUDED.d_rp_candidato, d_rp_votos = EXCLUDED.d_rp_votos,
            d_an_candidato = EXCLUDED.d_an_candidato, d_an_votos = EXCLUDED.d_an_votos,
            d_avanza_candidato = EXCLUDED.d_avanza_candidato, d_avanza_votos = EXCLUDED.d_avanza_votos,
            d_podemos_candidato = EXCLUDED.d_podemos_candidato, d_podemos_votos = EXCLUDED.d_podemos_votos,
            d_jp_candidato = EXCLUDED.d_jp_candidato, d_jp_votos = EXCLUDED.d_jp_votos,
            d_obras_candidato = EXCLUDED.d_obras_candidato, d_obras_votos = EXCLUDED.d_obras_votos,
            d_frepap_candidato = EXCLUDED.d_frepap_candidato, d_frepap_votos = EXCLUDED.d_frepap_votos,
            d_ap_candidato = EXCLUDED.d_ap_candidato, d_ap_votos = EXCLUDED.d_ap_votos,
            d_esperanza_candidato = EXCLUDED.d_esperanza_candidato, d_esperanza_votos = EXCLUDED.d_esperanza_votos,
            d_venceremos_candidato = EXCLUDED.d_venceremos_candidato, d_venceremos_votos = EXCLUDED.d_venceremos_votos,
            d_vision_candidato = EXCLUDED.d_vision_candidato, d_vision_votos = EXCLUDED.d_vision_votos,
            d_apra_candidato = EXCLUDED.d_apra_candidato, d_apra_votos = EXCLUDED.d_apra_votos,
            d_fp_candidato = EXCLUDED.d_fp_candidato, d_fp_votos = EXCLUDED.d_fp_votos,
            d_ppc_candidato = EXCLUDED.d_ppc_candidato, d_ppc_votos = EXCLUDED.d_ppc_votos,
            d_progresemos_candidato = EXCLUDED.d_progresemos_candidato, d_progresemos_votos = EXCLUDED.d_progresemos_votos,
            d_morado_candidato = EXCLUDED.d_morado_candidato, d_morado_votos = EXCLUDED.d_morado_votos,
            d_buen_gobierno_candidato = EXCLUDED.d_buen_gobierno_candidato, d_buen_gobierno_votos = EXCLUDED.d_buen_gobierno_votos,
            d_verde_candidato = EXCLUDED.d_verde_candidato, d_verde_votos = EXCLUDED.d_verde_votos,
            d_peru_libre_candidato = EXCLUDED.d_peru_libre_candidato, d_peru_libre_votos = EXCLUDED.d_peru_libre_votos,
            d_tierra_verde_candidato = EXCLUDED.d_tierra_verde_candidato, d_tierra_verde_votos = EXCLUDED.d_tierra_verde_votos,
            d_pueblo_consciente_candidato = EXCLUDED.d_pueblo_consciente_candidato, d_pueblo_consciente_votos = EXCLUDED.d_pueblo_consciente_votos,
            d_ppp_candidato = EXCLUDED.d_ppp_candidato, d_ppp_votos = EXCLUDED.d_ppp_votos,
            d_integridad_candidato = EXCLUDED.d_integridad_candidato, d_integridad_votos = EXCLUDED.d_integridad_votos,
            d_fuerza_ciudadana_candidato = EXCLUDED.d_fuerza_ciudadana_candidato, d_fuerza_ciudadana_votos = EXCLUDED.d_fuerza_ciudadana_votos,
            d_batalla_candidato = EXCLUDED.d_batalla_candidato, d_batalla_votos = EXCLUDED.d_batalla_votos,
            d_app_candidato = EXCLUDED.d_app_candidato, d_app_votos = EXCLUDED.d_app_votos,
            d_alianza_regional_candidato = EXCLUDED.d_alianza_regional_candidato, d_alianza_regional_votos = EXCLUDED.d_alianza_regional_votos,
            d_nulos = EXCLUDED.d_nulos, d_vacios = EXCLUDED.d_vacios, d_blanco = EXCLUDED.d_blanco, d_impugnados = EXCLUDED.d_impugnados, d_total_votos = EXCLUDED.d_total_votos,
            votos_json = EXCLUDED.votos_json,
            fecha_hora = CURRENT_TIMESTAMP
        `;

        const params = [
          personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
          extractCand(prov["SOMOS PERU"] || prov.SP), p_sp_v,
          extractCand(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP), p_rp_v,
          extractCand(prov["AHORA NACION"] || prov.AN), p_an_v,
          extractCand(prov["AVANZA PAIS"] || prov.AVANZA), p_avanza_v,
          extractCand(prov.PODEMOS || prov["PODEMOS PERU"]), p_podemos_v,
          extractCand(prov.JP || prov["JUNTOS POR EL PERU"]), p_jp_v,
          extractCand(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"]), p_obras_v,
          extractCand(prov.FREPAP), p_frepap_v,
          extractCand(prov["ACCION POPULAR"] || prov.AP), p_ap_v,
          extractCand(prov.ESPERANZA || prov.FE), p_esperanza_v,
          extractCand(prov.VENCEREMOS || prov.AEV), p_venceremos_v,
          extractCand(prov["VISION PERU"] || prov.VP || prov.VISION), p_vision_v,
          extractCand(prov.APRA), p_apra_v,
          extractCand(prov.FP || prov["FUERZA POPULAR"]), p_fp_v,
          extractCand(prov.PPC), p_ppc_v,
          extractCand(prov.PROGRESEMOS || prov.PROG), p_progresemos_v,
          extractCand(prov.MORADO || prov.PM), p_morado_v,
          extractCand(prov["BUEN GOBIERNO"] || prov.PBG), p_buen_gobierno_v,
          extractCand(prov.VERDE || prov.PDV), p_verde_v,
          extractCand(prov["PERU LIBRE"] || prov.PL), p_peru_libre_v,
          extractCand(prov["TIERRA VERDE"] || prov.CTTV), p_tierra_verde_v,
          extractCand(prov["PUEBLO CONSCIENTE"] || prov.PC), p_pueblo_consciente_v,
          extractCand(prov.PPP), p_ppp_v,
          extractCand(prov.INTEGRIDAD || prov.ID), p_integridad_v,
          extractCand(prov["FUERZA CIUDADANA"] || prov.FC), p_fuerza_ciudadana_v,
          extractCand(prov["BATALLA PERU"] || prov.BP), p_batalla_v,
          extractCand(prov.APP), p_app_v,
          extractCand(prov["ALIANZA REGIONAL"] || prov.ARP), p_alianza_regional_v,
          p_nulos, p_blanco, p_blanco, p_impugnados, p_tot,
          extractCand(dist["SOMOS PERU"] || dist.SP), d_sp_v,
          extractCand(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP), d_rp_v,
          extractCand(dist["AHORA NACION"] || dist.AN), d_an_v,
          extractCand(dist["AVANZA PAIS"] || dist.AVANZA), d_avanza_v,
          extractCand(dist.PODEMOS || dist["PODEMOS PERU"]), d_podemos_v,
          extractCand(dist.JP || dist["JUNTOS POR EL PERU"]), d_jp_v,
          extractCand(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"]), d_obras_v,
          extractCand(dist.FREPAP), d_frepap_v,
          extractCand(dist["ACCION POPULAR"] || dist.AP), d_ap_v,
          extractCand(dist.ESPERANZA || dist.FE), d_esperanza_v,
          extractCand(dist.VENCEREMOS || dist.AEV), d_venceremos_v,
          extractCand(dist["VISION PERU"] || dist.VP || dist.VISION), d_vision_v,
          extractCand(dist.APRA), d_apra_v,
          extractCand(dist.FP || dist["FUERZA POPULAR"]), d_fp_v,
          extractCand(dist.PPC), d_ppc_v,
          extractCand(dist.PROGRESEMOS || dist.PROG), d_progresemos_v,
          extractCand(dist.MORADO || dist.PM), d_morado_v,
          extractCand(dist["BUEN GOBIERNO"] || dist.PBG), d_buen_gobierno_v,
          extractCand(dist.VERDE || dist.PDV), d_verde_v,
          extractCand(dist["PERU LIBRE"] || dist.PL), d_peru_libre_v,
          extractCand(dist["TIERRA VERDE"] || dist.CTTV), d_tierra_verde_v,
          extractCand(dist["PUEBLO CONSCIENTE"] || dist.PC), d_pueblo_consciente_v,
          extractCand(dist.PPP), d_ppp_v,
          extractCand(dist.INTEGRIDAD || dist.ID), d_integridad_v,
          extractCand(dist["FUERZA CIUDADANA"] || dist.FC), d_fuerza_ciudadana_v,
          extractCand(dist["BATALLA PERU"] || dist.BP), d_batalla_v,
          extractCand(dist.APP), d_app_v,
          extractCand(dist["ALIANZA REGIONAL"] || dist.ARP), d_alianza_regional_v,
          d_nulos, d_blanco, d_blanco, d_impugnados, d_tot,
          votosJson
        ];

        await db.query(sql, params);
        return res.status(200).json({ success: true, message: 'Votos registrados correctamente en la base de datos.' });
      }

      // 3. ASISTENCIA
      case 'registrar_asistencia': {
        const { nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps } = payload;
        await db.query(`
          INSERT INTO asistencia (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps, fecha_hora)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `, [nombre, dni, distrito, local, mesa, confirmacion || 'SI', foto_url || '', ubicacion_gps || '']);
        return res.status(200).json({ success: true, message: 'Asistencia registrada con éxito.' });
      }

      // 4. SEGUNDA LLEGADA GPS
      case 'confirmar_asistencia_llegada': {
        const { nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado } = payload;
        await db.query(`
          INSERT INTO asistenciallegada (nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado, fecha_registro)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        `, [nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido || 50, estado || 'CONFIRMADO 2DA LLEGADA']);
        return res.status(200).json({ success: true, message: 'Segunda llegada GPS confirmada.' });
      }

      // 5. REPORTE
      case 'obtener_reporte':
      case 'read_reporte': {
        const votosRes = await db.query('SELECT * FROM votos_detalle ORDER BY id DESC');
        const mesasRes = await db.query('SELECT * FROM mesas ORDER BY id ASC');
        return res.status(200).json({
          success: true,
          votos: votosRes.rows,
          mesas: mesasRes.rows
        });
      }

      default:
        return res.status(200).json({ success: false, message: `Acción '${action}' no reconocida` });
    }
  } catch (err) {
    console.error('[API Handler Error]', err);
    return res.status(500).json({ success: false, message: 'Error en base de datos: ' + err.message });
  }
}
