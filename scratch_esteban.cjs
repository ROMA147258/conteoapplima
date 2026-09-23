const fs = require('fs');

const header = `import pg from 'pg';
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
        const identifier = (payload.usuario || payload.dni || payload.user || payload.nombre || '').toString().trim();
        const rawNombre = (payload.nombre || '').toString().trim();
        const rawDni = (payload.dni || payload.usuario || payload.user || '').toString().trim();

        if (!identifier && !rawNombre && !rawDni) {
          return res.status(200).json({ success: false, status: 'error', message: 'Por favor ingresa tu DNI o tu nombre.' });
        }

        // Admin check
        const allInputs = \`\${identifier} \${rawNombre} \${rawDni}\`.toLowerCase();
        if (allInputs.includes('admin#2026$secure!votoreal') || identifier === '99999999' || identifier === '12345678' || rawDni === '99999999') {
          return res.status(200).json({
            success: true,
            status: 'success',
            role: 'Admin',
            token: 'TOKEN-ADMIN-2026',
            user: { dni: identifier || rawDni || '99999999', nombre: 'Super Administrador', rol: 'Admin', ubicacion: 'Lima', distrito: 'Lima', colegio: 'CENTRAL', mesa: '' }
          });
        }

        // Helper de normalización
        const normalizeText = (str) => (str || '')
          .toString()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\\s]/g, ' ')
          .trim();

        const digitsDni = rawDni.replace(/\\D/g, '');
        const digitsNombre = rawNombre.replace(/\\D/g, '');
        const targetDniNumber = digitsDni.length >= 6 ? digitsDni : (digitsNombre.length >= 6 ? digitsNombre : '');

        const extractClave = (s) => {
          const m = (s || '').match(/\\b(ZN\\d+|SP\\d+|[A-Z0-9]{5,10})\\b/i);
          return m ? m[1].toUpperCase() : '';
        };
        const targetClave = extractClave(rawDni) || extractClave(rawNombre) || extractClave(identifier);

        const cleanNameText = (rawNombre && !/^\\d+$/.test(rawNombre) && !/^(ZN|SP)\\d+/i.test(rawNombre))
          ? rawNombre
          : (rawDni && !/^\\d+$/.test(rawDni) && !/^(ZN|SP)\\d+/i.test(rawDni) ? rawDni : (!/^\\d+$/.test(identifier) && !/^(ZN|SP)\\d+/i.test(identifier) ? identifier : ''));

        const normName = normalizeText(cleanNameText);
        const words = normName.split(/\\s+/).filter(w => w.length >= 2);

        const tablas = ['rcoordinadoresd', 'rcoordinadoresz', 'rcoordinadores', 'rpersoneros'];

        let foundUser = null;
        let foundTable = null;

        for (const t of tablas) {
          let rows = [];

          // 1. Búsqueda por DNI numérico exacto
          if (targetDniNumber) {
            try {
              const resDni = await db.query(
                \`SELECT * FROM \${t} WHERE TRIM(dni) = $1 OR TRIM(dni) = $2 LIMIT 1\`,
                [targetDniNumber, targetDniNumber.padStart(8, '0')]
              );
              if (resDni.rows.length > 0) rows = resDni.rows;
            } catch (e) {}
          }

          // 2. Búsqueda por Clave de Acceso o Token (ej: SP7845, ZN5019)
          if (rows.length === 0 && targetClave) {
            try {
              const resClave = await db.query(
                \`SELECT * FROM \${t} WHERE TRIM(clave_acceso) ILIKE $1 OR TRIM(token_verificacion) ILIKE $1 LIMIT 1\`,
                [targetClave]
              );
              if (resClave.rows.length > 0) rows = resClave.rows;
            } catch (e) {}
          }

          // 3. Búsqueda por coincidencia de palabras del Nombre (Primer Nombre + Primer Apellido, ignorando acentos)
          if (rows.length === 0 && words.length > 0) {
            try {
              const conditions = words.map((_, i) => \`TRANSLATE(LOWER(nombres_y_apellidos), 'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouaeiounnuu') ILIKE $\${i + 1}\`);
              const params = words.map(w => \`%\${w}%\`);
              const resWords = await db.query(
                \`SELECT * FROM \${t} WHERE \${conditions.join(' AND ')} LIMIT 1\`,
                params
              );
              if (resWords.rows.length > 0) rows = resWords.rows;
            } catch (e) {}
          }

          if (rows.length > 0) {
            foundUser = rows[0];
            foundTable = t;
            break;
          }
        }

        if (foundUser) {
          const u = foundUser;
          const t = foundTable;

          // Validar que el usuario esté Confirmado y Aprobado
          const cred = (u.credenciales || '').toString().trim().toLowerCase();
          const preg = (u.preguntas || '').toString().trim().toLowerCase();
          const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred.includes('aprobad') || cred === 'si' || cred === '1'));
          const isAprobado = preg ? Boolean(preg.includes('aprobad') || preg === 'si' || preg === '1') : true;

          if (!isConfirmed || !isAprobado) {
            return res.status(200).json({
              success: false,
              status: 'blocked',
              message: 'Acceso Denegado: Tus credenciales se encuentran en estado Bloqueado o tu evaluación de preguntas está Pendiente. Solo el personal Confirmado y Aprobado puede ingresar.'
            });
          }

          const userDni = (u.dni || '').toString().trim();
          const isDistrital = t === 'rcoordinadoresd' || (u.rol_a_desempenar || '').toLowerCase().includes('distrit');
          const isZonal = t === 'rcoordinadoresz' || (u.rol_a_desempenar || '').toLowerCase().includes('zonal');
          const rol = u.rol_a_desempenar || (isDistrital ? 'Coordinador Distrital' : isZonal ? 'Coordinador Zonal' : t === 'rcoordinadores' ? 'Coordinador de Local' : 'Personero');

          // Restricción Zonal solo VMT (solo para Zonal)
          if (isZonal) {
            const ubNorm = (u.distrito_asignado || u.distrito_donde_vota || '').toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();
            if (!ubNorm.includes('villa maria del triunfo') && !ubNorm.includes('vmt')) {
              return res.status(200).json({
                success: false,
                status: 'blocked',
                message: 'Acceso Restringido: La interfaz de Coordinador Zonal está habilitada únicamente para Villa María del Triunfo.'
              });
            }
          }

          let votoManualRes = { rows: [] };
          let votoImagenRes = { rows: [] };
          try {
            votoManualRes = await db.query(\`SELECT numero_mesa, origen FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = 'MANUAL' LIMIT 1\`, [userDni]);
            votoImagenRes = await db.query(\`SELECT numero_mesa, origen FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = 'IMAGEN' LIMIT 1\`, [userDni]);
          } catch (e) {}

          const ubicacionVMT = (u.distrito_asignado || u.distrito_donde_vota || 'Lima')
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\\u0300-\\u036f]/g, "")
            .trim();
          const isVMT = ubicacionVMT.includes('villa maria del triunfo') || ubicacionVMT === 'vmt';

          let tipoInterfaz = 'personero_conteo';
          if (isDistrital) {
            tipoInterfaz = 'coordinador_distrital';
          } else if (isZonal) {
            tipoInterfaz = 'coordinador_zonal';
          } else if (t === 'rcoordinadores' || (rol && rol.toLowerCase().includes('coordinador'))) {
            tipoInterfaz = 'coordinador_local';
          } else if (isVMT) {
            tipoInterfaz = 'personero_asistencia';
          }

          const userObj = {
            dni: userDni,
            nombre: u.nombres_y_apellidos,
            rol: rol,
            ubicacion: u.distrito_asignado || u.distrito_donde_vota || 'Lima',
            distrito: u.distrito_asignado || u.distrito_donde_vota || 'Lima',
            colegio: u.local_de_votacion_asignado || u.local_de_votacion || '',
            colegios: u.local_de_votacion_asignado || u.local_de_votacion || '',
            local: u.local_de_votacion_asignado || u.local_de_votacion || '',
            mesa: u.mesa_asignada || u.mesa_de_sufragio || '',
            tabla_origen: t,
            origenHoja: t,
            tipo_interfaz: tipoInterfaz,
            voto_manual_enviado: votoManualRes.rows.length > 0,
            voto_imagen_enviado: votoImagenRes.rows.length > 0
          };

          return res.status(200).json({
            success: true,
            status: 'success',
            role: rol,
            token: \`TOKEN-\${userDni}\`,
            user: userObj,
            usuario: userObj,
            data: userObj
          });
        }

        return res.status(200).json({
          success: false,
          status: 'error',
          message: 'Usuario no encontrado en el padrón electoral. Verifica tu DNI, clave o nombre.'
        });
      }
`;

const currentFile = fs.readFileSync('api/voto-real.js', 'utf8');
const registrarIdx = currentFile.indexOf("case 'registrar_votos':");
const endRegistrarIdx = currentFile.indexOf("case 'registrar_asistencia':");
const registrarBlock = currentFile.substring(registrarIdx, endRegistrarIdx);

const remainingCases = `
      // 3. ASISTENCIA
      case 'registrar_asistencia': {
        const { nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps } = payload;
        await db.query(\`
          INSERT INTO asistencia (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps, fecha_hora)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        \`, [nombre, dni, distrito, local, mesa, confirmacion || 'SI', foto_url || '', ubicacion_gps || '']);
        return res.status(200).json({ success: true, message: 'Asistencia registrada con éxito.' });
      }

      // 4. SEGUNDA LLEGADA GPS
      case 'confirmar_asistencia_llegada': {
        const { nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado } = payload;
        await db.query(\`
          INSERT INTO asistenciallegada (nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado, fecha_registro)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        \`, [nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido || 50, estado || 'CONFIRMADO 2DA LLEGADA']);
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

      // 6. ASISTENCIA Y ESTADO DE VOTOS POR DNI
      case 'obtener_asistencia_por_dni': {
        const dniQuery = (payload.dni || '').toString().trim();
        if (!dniQuery) {
          return res.status(200).json({ success: false, message: 'Se requiere DNI' });
        }

        const asisRes = await db.query('SELECT * FROM asistencia WHERE TRIM(dni) = $1 ORDER BY id DESC LIMIT 1', [dniQuery]);
        const llegadaRes = await db.query('SELECT * FROM asistenciallegada WHERE TRIM(dni) = $1 ORDER BY id DESC LIMIT 1', [dniQuery]);
        const votoManualRes = await db.query("SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = 'MANUAL' ORDER BY id DESC LIMIT 1", [dniQuery]);
        const votoImagenRes = await db.query("SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = 'IMAGEN' ORDER BY id DESC LIMIT 1", [dniQuery]);

        const asistencia_confirmada = Boolean(asisRes.rows && asisRes.rows.length > 0);
        const llegada_confirmada = Boolean(llegadaRes.rows && llegadaRes.rows.length > 0);
        const voto_manual_enviado = Boolean(votoManualRes.rows && votoManualRes.rows.length > 0);
        const voto_imagen_enviado = Boolean(votoImagenRes.rows && votoImagenRes.rows.length > 0);

        return res.status(200).json({
          success: true,
          asistencia: asisRes.rows[0] || null,
          asistencia_confirmada,
          llegada: llegadaRes.rows[0] || null,
          llegada_confirmada,
          voto_manual: votoManualRes.rows[0] || null,
          voto_manual_enviado,
          voto_imagen: votoImagenRes.rows[0] || null,
          voto_imagen_enviado
        });
      }

      // 7. OBTENER PERSONEROS, COORDINADORES Y COLEGIOS SINCRONIZADOS (DISTRITAL / ZONAL / LOCAL) - REGISTROS APROBADOS DE TODOS LOS DISTRITOS
      case 'obtener_personeros_por_colegio':
      case 'obtener_personeros': {
        const approvedFilter = "WHERE (credenciales ILIKE '%confirmad%' OR credenciales ILIKE '%aprobad%') AND (preguntas ILIKE '%aprobad%' OR preguntas IS NULL)";

        const [pRes, clRes, czRes, cdRes, colRes] = await Promise.all([
          db.query(\`SELECT * FROM rpersoneros \${approvedFilter}\`),
          db.query(\`SELECT * FROM rcoordinadores \${approvedFilter}\`),
          db.query(\`SELECT * FROM rcoordinadoresz \${approvedFilter}\`),
          db.query(\`SELECT * FROM rcoordinadoresd \${approvedFilter}\`),
          db.query('SELECT * FROM colegios')
        ]);

        const personeros = pRes.rows.map(r => ({
          dni: r.dni,
          DNI: r.dni,
          nombre: r.nombres_y_apellidos,
          Nombres_y_Apellidos: r.nombres_y_apellidos,
          celular: r.celular,
          ubicacion: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          distrito: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          Distrito_Asignado: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          colegio: r.local_de_votacion_asignado || r.local_de_votacion || '',
          local: r.local_de_votacion_asignado || r.local_de_votacion || '',
          Local_de_Votacion_Asignado: r.local_de_votacion_asignado || r.local_de_votacion || '',
          mesa: r.mesa_asignada || r.mesa_de_sufragio || '',
          Mesa_Asignada: r.mesa_asignada || r.mesa_de_sufragio || '',
          rol: r.rol_a_desempenar || 'Personero',
          credenciales: r.credenciales,
          preguntas: r.preguntas,
          tabla_origen: 'rpersoneros',
          origenHoja: 'rpersoneros'
        }));

        const coordinadores_locales = clRes.rows.map(r => ({
          dni: r.dni,
          DNI: r.dni,
          nombre: r.nombres_y_apellidos,
          Nombres_y_Apellidos: r.nombres_y_apellidos,
          celular: r.celular,
          ubicacion: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          distrito: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          colegio: r.local_de_votacion_asignado || r.local_de_votacion || '',
          local: r.local_de_votacion_asignado || r.local_de_votacion || '',
          rol: r.rol_a_desempenar || 'Coordinador de Local',
          credenciales: r.credenciales,
          preguntas: r.preguntas,
          tabla_origen: 'rcoordinadores',
          origenHoja: 'rcoordinadores'
        }));

        const coordinadores_zonales = czRes.rows.map(r => ({
          dni: r.dni,
          DNI: r.dni,
          nombre: r.nombres_y_apellidos,
          Nombres_y_Apellidos: r.nombres_y_apellidos,
          celular: r.celular,
          ubicacion: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          distrito: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          colegios: r.local_de_votacion_asignado || r.local_de_votacion || '',
          colegio: r.local_de_votacion_asignado || r.local_de_votacion || '',
          local: r.local_de_votacion_asignado || r.local_de_votacion || '',
          clave_acceso: r.clave_acceso,
          rol: r.rol_a_desempenar || 'Coordinador Zonal',
          credenciales: r.credenciales,
          preguntas: r.preguntas,
          tabla_origen: 'rcoordinadoresz',
          origenHoja: 'rcoordinadoresz'
        }));

        const coordinadores_distritales = cdRes.rows.map(r => ({
          dni: r.dni,
          DNI: r.dni,
          nombre: r.nombres_y_apellidos,
          Nombres_y_Apellidos: r.nombres_y_apellidos,
          celular: r.celular,
          ubicacion: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          distrito: r.distrito_asignado || r.distrito_donde_vota || 'Lima',
          colegios: r.local_de_votacion_asignado || r.local_de_votacion || '',
          colegio: r.local_de_votacion_asignado || r.local_de_votacion || '',
          local: r.local_de_votacion_asignado || r.local_de_votacion || '',
          clave_acceso: r.clave_acceso,
          rol: r.rol_a_desempenar || 'Coordinador Distrital',
          credenciales: r.credenciales,
          preguntas: r.preguntas,
          tabla_origen: 'rcoordinadoresd',
          origenHoja: 'rcoordinadoresd'
        }));

        const info_colegios = colRes.rows.map(r => ({
          id: r.id,
          colegio: r.colegio,
          distrito: r.distrito,
          direccion: r.direccion,
          num_mesas: r.num_mesas
        }));

        return res.status(200).json({
          success: true,
          personeros,
          coordinadores_locales,
          coordinadores_zonales,
          coordinadores_distritales,
          info_colegios
        });
      }

      // 8. OBTENER ASISTENCIA GENERAL
      case 'obtener_asistencia': {
        const asisRes = await db.query('SELECT * FROM asistencia ORDER BY id DESC');
        return res.status(200).json({
          success: true,
          asistencia: asisRes.rows
        });
      }

      // 9. OBTENER CONFIRMACIONES POR COLEGIO
      case 'obtener_confirmaciones_por_colegio':
      case 'obtener_confirmaciones': {
        const confRes = await db.query('SELECT * FROM asistencia WHERE confirmacion = $1 OR confirmacion = $2 ORDER BY id DESC', ['SI', 'CONFIRMADO']);
        const mapped = confRes.rows.map(r => ({
          personero_dni: r.dni,
          personero_nombre: r.nombre,
          confirmacion: r.confirmacion,
          fecha_hora: r.fecha_hora,
          foto_url: r.foto_url
        }));
        return res.status(200).json({
          success: true,
          confirmaciones: mapped
        });
      }

      // 10. CONFIRMAR PERSONERO POR COORDINADOR
      case 'confirmar_coordinador':
      case 'confirmar_personero_coordinador': {
        const { personeroNombre, personeroDni, distrito, local, coordinadorNombre, coordinadorDni, confirmacion, fotoBase64 } = payload;
        await db.query(\`
          INSERT INTO asistencia (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps, fecha_hora)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        \`, [
          personeroNombre || '',
          personeroDni || '',
          distrito || '',
          local || '',
          'ASIGNADA',
          confirmacion || 'SI',
          fotoBase64 || '',
          \`CONFIRMADO POR COORD: \${coordinadorNombre || ''} (\${coordinadorDni || ''})\`
        ]);
        return res.status(200).json({ success: true, message: 'Confirmación registrada exitosamente.' });
      }

      // 11. OBTENER MESAS
      case 'obtener_mesas': {
        const mesasRes = await db.query('SELECT * FROM mesas ORDER BY id ASC');
        return res.status(200).json({
          success: true,
          mesas: mesasRes.rows
        });
      }

      // 12. OBTENER USUARIOS GENERAL (SOLO APROBADOS Y CONFIRMADOS DE TODOS LOS DISTRITOS)
      case 'obtener_usuarios': {
        const approvedFilter = "WHERE (credenciales ILIKE '%confirmad%' OR credenciales ILIKE '%aprobad%') AND (preguntas ILIKE '%aprobad%' OR preguntas IS NULL)";

        const [pRes, clRes, czRes, cdRes] = await Promise.all([
          db.query(\`SELECT * FROM rpersoneros \${approvedFilter}\`),
          db.query(\`SELECT * FROM rcoordinadores \${approvedFilter}\`),
          db.query(\`SELECT * FROM rcoordinadoresz \${approvedFilter}\`),
          db.query(\`SELECT * FROM rcoordinadoresd \${approvedFilter}\`)
        ]);
        const allUsers = [
          ...cdRes.rows.map(r => ({ ...r, tabla_origen: 'rcoordinadoresd', rol: 'Coordinador Distrital' })),
          ...czRes.rows.map(r => ({ ...r, tabla_origen: 'rcoordinadoresz', rol: 'Coordinador Zonal' })),
          ...clRes.rows.map(r => ({ ...r, tabla_origen: 'rcoordinadores', rol: 'Coordinador de Local' })),
          ...pRes.rows.map(r => ({ ...r, tabla_origen: 'rpersoneros', rol: 'Personero' }))
        ];
        return res.status(200).json({
          success: true,
          usuarios: allUsers
        });
      }

      default:
        return res.status(200).json({ success: false, message: \`Acción '\${action}' no reconocida\` });
    }
  } catch (err) {
    console.error('[API Handler Error]', err);
    return res.status(500).json({ success: false, message: 'Error en base de datos: ' + err.message });
  }
}
`;

const finalApiContent = header + '\n' + registrarBlock + '\n' + remainingCases;

fs.writeFileSync('api/voto-real.js', finalApiContent, 'utf8');
fs.writeFileSync('frontend/api/voto-real.js', finalApiContent, 'utf8');
console.log('Successfully written api/voto-real.js and frontend/api/voto-real.js with approved/confirmed filters!');
