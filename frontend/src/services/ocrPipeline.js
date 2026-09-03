import { obtenerCandidatosPorUbicacion, obtenerNombreRealPartido, PARTIDO_NOMBRES_LARGOS } from '../constants/distritos.js';
import { extractJsonFromString } from '../utils/helpers.js';

export function convertConfusedTextToNumber(str) {
  let clean = str.trim()
    .replace(/[\[\](){}|\\/_\-]/g, '')
    .trim();

  clean = clean
    .replace(/O/g, '0')
    .replace(/o/g, '0')
    .replace(/D/g, '0')
    .replace(/Q/g, '0')
    .replace(/I/g, '1')
    .replace(/i/g, '1')
    .replace(/l/g, '1')
    .replace(/L/g, '1')
    .replace(/Z/g, '2')
    .replace(/z/g, '2')
    .replace(/E/g, '3')
    .replace(/e/g, '3')
    .replace(/A/g, '4')
    .replace(/a/g, '4')
    .replace(/S/g, '5')
    .replace(/s/g, '5')
    .replace(/G/g, '6')
    .replace(/g/g, '9')
    .replace(/b/g, '6')
    .replace(/T/g, '7')
    .replace(/t/g, '7')
    .replace(/B/g, '8')
    .replace(/q/g, '9')
    .replace(/p/g, '9');
  
  clean = clean.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : NaN;
}

export function cleanCellText(text) {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/<br\s*\/?>/gi, ' ');
  cleaned = cleaned.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/__/g, '');
  cleaned = cleaned.replace(/_/g, '');
  cleaned = cleaned.replace(/`/g, '');
  cleaned = cleaned.replace(/###/g, '');
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned.trim();
}

export function getTableCells(line) {
  let cells = line.split('|').map(c => c.trim());
  if (line.startsWith('|')) cells.shift();
  if (line.endsWith('|')) cells.pop();
  return cells;
}

export function parseMarkdownTableToJSON(markdownText) {
  const lines = markdownText.split('\n');
  const tables = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.includes('|')) {
      i++;
      continue;
    }

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.includes('|')) {
        const headerCells = getTableCells(line);
        const sepCells = getTableCells(nextLine);

        const isSep = sepCells.length > 0 && sepCells.every(cell => cell.match(/^:?-+:?$/));
        if (isSep && headerCells.length === sepCells.length) {
          const cleanedHeaders = headerCells.map(c => cleanCellText(c));
          
          const table = {
            columnas: cleanedHeaders.slice(1),
            filas: []
          };
          
          i += 2;
          
          while (i < lines.length) {
            const rowLine = lines[i].trim();
            if (!rowLine.includes('|')) break;
            const rowCells = getTableCells(rowLine);
            if (rowCells.length === 0) break;
            
            const isRowSep = rowCells.every(cell => cell.match(/^:?-+:?$/));
            if (isRowSep) {
              i++;
              continue;
            }

            const cleanedRowCells = rowCells.map(c => cleanCellText(c));
            const rowObj = {
              nombre: cleanedRowCells[0] || ""
            };
            
            table.columnas.forEach((col, idx) => {
              const valStr = cleanedRowCells[idx + 1] !== undefined ? cleanedRowCells[idx + 1] : "";
              if (valStr.match(/^-?\d+$/)) {
                rowObj[col] = Number(valStr);
              } else {
                rowObj[col] = valStr;
              }
            });
            table.filas.push(rowObj);
            i++;
          }
          
          tables.push(table);
          continue;
        }
      }
    }
    i++;
  }
  return tables;
}

export function autoDetectTipoDocumento(rawText) {
  const lower = rawText.toLowerCase();
  
  if (lower.includes('"table"') || lower.includes('"filas"') || lower.includes('"rows"') || lower.includes('"column_headers"') || lower.includes('"columnas"')) {
    return "tabla";
  }
  
  const keywordsRecibo = ["total", "subtotal", "boleta", "factura", "recibo", "pago", "monto", "s/.", "precio", "neto", "igv", "ruc"];
  const matchesRecibo = keywordsRecibo.filter(k => lower.includes(k)).length;
  if (matchesRecibo >= 3) return "recibo";
  
  const keywordsInterfaz = ["configuración", "guardar", "cancelar", "usuario", "contraseña", "login", "iniciar sesión", "dashboard", "botón", "buscar"];
  const matchesInterfaz = keywordsInterfaz.filter(k => lower.includes(k)).length;
  if (matchesInterfaz >= 3 || lower.includes("iniciar sesión")) return "interfaz";
  
  const formPattern = /[a-zA-Záéíóúñü\s]+\s*:\s*[^\n]*/g;
  const formMatches = lower.match(formPattern);
  if (formMatches && formMatches.length >= 4) return "formulario";
  
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  if (paragraphs.length >= 2 || rawText.trim().length > 400) return "documento";
  
  if (rawText.trim().length > 0 && rawText.trim().length < 150) return "imagen_con_texto";
  
  return "texto_libre";
}

export function procesarTextoOCR(text, currentDistrict = 'ATE') {
  const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const userDistNorm = norm(currentDistrict || 'ATE');

  const detected = {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "RENOVACION": 0, "AHORA NACION": 0, "AVANZA PAIS": 0, "PODEMOS": 0, "OBRAS": 0, "ACCION POPULAR": 0, "ESPERANZA": 0, "VENCEREMOS": 0, "VISION PERU": 0, "APRA": 0, "PPC": 0, "PROGRESEMOS": 0, "BUEN GOBIERNO": 0, "PERU LIBRE": 0, "TIERRA VERDE": 0, "PUEBLO CONSCIENTE": 0, "PPP": 0, "INTEGRIDAD": 0, "FUERZA CIUDADANA": 0, "BATALLA PERU": 0, "APP": 0, "ALIANZA REGIONAL": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0, "VACIOS": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "RENOVACION": 0, "AHORA NACION": 0, "AVANZA PAIS": 0, "PODEMOS": 0, "OBRAS": 0, "ACCION POPULAR": 0, "ESPERANZA": 0, "VENCEREMOS": 0, "VISION PERU": 0, "APRA": 0, "PPC": 0, "PROGRESEMOS": 0, "BUEN GOBIERNO": 0, "PERU LIBRE": 0, "TIERRA VERDE": 0, "PUEBLO CONSCIENTE": 0, "PPP": 0, "INTEGRIDAD": 0, "FUERZA CIUDADANA": 0, "BATALLA PERU": 0, "APP": 0, "ALIANZA REGIONAL": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0, "VACIOS": 0 }
  };

  if (!text) return detected;

  const parties = [
    "SOMOS PERU", "RENOVACION", "AHORA NACION", "AVANZA PAIS", "PODEMOS", "JP",
    "OBRAS", "FREPAP", "ACCION POPULAR", "ESPERANZA", "VENCEREMOS", "VISION PERU",
    "APRA", "FP", "PPC", "PROGRESEMOS", "MORADO", "BUEN GOBIERNO", "VERDE",
    "PERU LIBRE", "TIERRA VERDE", "PUEBLO CONSCIENTE", "PPP", "INTEGRIDAD",
    "FUERZA CIUDADANA", "BATALLA PERU", "APP", "ALIANZA REGIONAL",
    "BLANCO", "NULOS", "IMPUGNADOS"
  ];

  const matchPartyKey = (str) => {
    if (!str) return null;
    const s = norm(str).toUpperCase();

    // 1. Partidos Políticos Primero (Evitar que "RENOVACION" coincida con "VACIO")
    if (s.includes('RENOVACION') || s.includes('LOPEZ ALIAGA') || s.includes('ACOSTA CAJALEON')) return 'RENOVACION';
    if (s.includes('AHORA NACION') || s.includes('SUSEL') || s.includes('CABELLO ACOSTA')) return 'AHORA NACION';
    if (s.includes('AVANZA') || s.includes('ALLISON') || s.includes('COMBINA') || s.includes('CASAS')) return 'AVANZA PAIS';
    if (s.includes('PODEMOS') || s.includes('URRESTI') || s.includes('AMAYA')) return 'PODEMOS';
    if (s.includes('OBRAS') || s.includes('BELMONT')) return 'OBRAS';
    if (s.includes('ACCION POPULAR') || s.includes('ACCION') || s.includes('TEJADA') || s.includes('CHACON') || s.includes('ARANA')) return 'ACCION POPULAR';
    if (s.includes('ESPERANZA') || s.includes('LEON CHINCHAY') || s.includes('SILVA MONTERO')) return 'ESPERANZA';
    if (s.includes('VENCEREMOS') || s.includes('ALVARADO')) return 'VENCEREMOS';
    if (s.includes('VISION') || s.includes('ABARCA') || s.includes('CAVERO')) return 'VISION PERU';
    if (s.includes('APRA') || s.includes('APRISTA') || s.includes('YAYA') || s.includes('MUNOZ')) return 'APRA';
    if (s.includes('PPC') || s.includes('CRISTIANO') || s.includes('DE POMAR') || s.includes('GARCIA DURANTE') || s.includes('POPULAR CRISTIANO')) return 'PPC';
    if (s.includes('PROGRESEMOS') || s.includes('LLANOS')) return 'PROGRESEMOS';
    if (s.includes('BUEN GOBIERNO') || s.includes('GALLARDO')) return 'BUEN GOBIERNO';
    if (s.includes('PERU LIBRE') || s.includes('RAMIREZ MATEO')) return 'PERU LIBRE';
    if (s.includes('TIERRA VERDE') || s.includes('YEHUDE') || s.includes('SIMON')) return 'TIERRA VERDE';
    if (s.includes('PUEBLO CONSCIENTE') || s.includes('HUETTE')) return 'PUEBLO CONSCIENTE';
    if (s.includes('PATRIOTICO') || s.includes('CALLER') || /\bPPP\b/.test(s)) return 'PPP';
    if (s.includes('INTEGRIDAD') || s.includes('LINARES')) return 'INTEGRIDAD';
    if (s.includes('FUERZA CIUDADANA') || s.includes('BONILLA')) return 'FUERZA CIUDADANA';
    if (s.includes('BATALLA') || s.includes('QUISPE CABALLERO')) return 'BATALLA PERU';
    if (s.includes('ALIANZA PARA EL PROGRESO') || s.includes('BENEL') || /\bAPP\b/.test(s)) return 'APP';
    if (s.includes('ALIANZA REGIONAL') || s.includes('MANCHEGO')) return 'ALIANZA REGIONAL';

    if (s.includes('FUERZA POPULAR') || /\bFP\b/.test(s) || s.startsWith('FUERZA') || s.includes('DAZA') || s.includes('KEIKO')) return 'FP';
    if (s.includes('JUNTOS POR EL PERU') || /\bJP\b/.test(s) || s.startsWith('JUNTOS') || s.includes('VARGAS CUELLAR')) return 'JP';
    if (s.includes('SOMOS PERU') || /\bSP\b/.test(s) || s.includes('SOMOS') || s.includes('BRUCE') || s.includes('LEGUIA') || s.includes('BAZAN')) return 'SOMOS PERU';
    if (s.includes('FREPAP') || s.includes('AGRICOLA') || s.includes('VALDEZ')) return 'FREPAP';
    if (s.includes('DEMOCRATA VERDE') || s.includes('PARTIDO VERDE') || /\bVERDE\b/.test(s) || s.includes('HURTADO')) return 'VERDE';
    if (s.includes('PARTIDO MORADO') || /\bMORADO\b/.test(s) || s.includes('LA CRUZ') || s.includes('RUIZ GUTIERREZ')) return 'MORADO';

    // 2. Votos especiales
    if (s.includes('IMPUGNAD')) return 'IMPUGNADOS';
    if (s.includes('BLANCO') || s.includes('EN BLANCO') || /\bVACIO\b/.test(s) || /\bVACIOS\b/.test(s)) return 'BLANCO';
    if (s.includes('NULO') || s.includes('ANULADO') || s.includes('NULOS')) return 'NULOS';

    return null;
  };

  // 1. Si el texto viene como JSON estructurado de Ollama / IA
  const parsedDirectJson = extractJsonFromString(text);
  if (parsedDirectJson && typeof parsedDirectJson === 'object') {
    // A. Si tiene tabla_completa / table / filas
    const tableData = parsedDirectJson.tabla_completa || parsedDirectJson.table || parsedDirectJson.tabla;
    if (tableData && (tableData.rows || tableData.filas || Array.isArray(tableData))) {
      const headers = (tableData.headers || tableData.columnas || []).map(h => norm(h));
      const rows = tableData.rows || tableData.filas || (Array.isArray(tableData) ? tableData : []);

      let colProvIdx = headers.findIndex(h => h.includes('lima') || h.includes('prov'));
      let colDistIdx = headers.findIndex(h => h.includes(userDistNorm) || (userDistNorm.includes('brena') && h.includes('bren')) || h.includes('dist'));
      
      if (colDistIdx === -1 && headers.length > 2) {
        colDistIdx = headers.findIndex((h, idx) => idx > 0 && idx !== colProvIdx);
      }

      rows.forEach(r => {
        let pKey = null;
        let provVal = undefined;
        let distVal = undefined;

        if (Array.isArray(r)) {
          pKey = matchPartyKey(r[0]);
          if (colProvIdx !== -1 && r[colProvIdx] !== undefined) provVal = Number(r[colProvIdx]);
          if (colDistIdx !== -1 && r[colDistIdx] !== undefined) distVal = Number(r[colDistIdx]);
        } else if (typeof r === 'object' && r !== null) {
          const keys = Object.keys(r);
          const firstKey = keys[0];
          pKey = matchPartyKey(r[firstKey] || firstKey);

          for (const [k, v] of Object.entries(r)) {
            const kn = norm(k);
            if (kn.includes('lima') || kn.includes('prov')) provVal = Number(v);
            if (kn.includes(userDistNorm) || kn.includes('dist') || (userDistNorm.includes('brena') && kn.includes('bren'))) distVal = Number(v);
          }
        }

        if (pKey) {
          if (!isNaN(provVal) && provVal >= 0) detected.provincial[pKey] = provVal;
          if (!isNaN(distVal) && distVal >= 0) detected.distrital[pKey] = distVal;
        }
      });

      const totalCount = Object.values(detected.provincial).reduce((a, b) => a + b, 0) + Object.values(detected.distrital).reduce((a, b) => a + b, 0);
      if (totalCount > 0) return detected;
    }

    // B. Si tiene votos.provincial / votos.distrital directos
    const rawVotos = parsedDirectJson.votos || parsedDirectJson.votes || parsedDirectJson;
    const prov = rawVotos.provincial || rawVotos.Provincial || rawVotos.PROVINCIAL || rawVotos.lima || rawVotos.Lima || {};
    const dist = rawVotos.distrital || rawVotos.Distrital || rawVotos.DISTRITAL || rawVotos[userDistNorm] || rawVotos[currentDistrict] || rawVotos.local || {};

    let foundCount = 0;
    parties.forEach(p => {
      const findValInObj = (obj) => {
        if (!obj || typeof obj !== 'object') return undefined;
        for (const [k, v] of Object.entries(obj)) {
          if (matchPartyKey(k) === p) {
            const num = Number(v);
            if (!isNaN(num) && num >= 0 && num <= 999) return num;
          }
        }
        return undefined;
      };

      const vProv = findValInObj(prov);
      if (vProv !== undefined) {
        detected.provincial[p] = vProv;
        foundCount++;
      }
      const vDist = findValInObj(dist);
      if (vDist !== undefined) {
        detected.distrital[p] = vDist;
        foundCount++;
      }
    });

    if (foundCount > 0) return detected;
  }

  // 2. Parseo de Tabla en Texto Plano / Markdown / Matrices Multicolumna
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let headerColNames = [];
  let colLimaIndex = -1;
  let colDistIndex = -1;

  // Buscar línea de encabezado con nombres de distritos / provincias
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const rawLine = lines[i];
    const tokens = rawLine.split(/[|,\t\s]{2,}|\t+|\|/).map(t => t.trim()).filter(Boolean);
    const tokensNorm = tokens.map(t => norm(t));

    const hasLima = tokensNorm.some(t => t === 'lima' || t.includes('lima') || t.includes('prov'));
    const hasDist = tokensNorm.some(t => t === userDistNorm || t.includes(userDistNorm) || (userDistNorm.includes('brena') && t.includes('bren')) || t.includes('dist'));

    if (hasLima || hasDist || (tokens.length >= 3 && !tokens.some(t => !isNaN(Number(t))))) {
      headerColNames = tokensNorm;
      colLimaIndex = tokensNorm.findIndex(t => t === 'lima' || t.includes('lima') || t.includes('prov'));
      colDistIndex = tokensNorm.findIndex(t => t === userDistNorm || t.includes(userDistNorm) || (userDistNorm.includes('brena') && t.includes('bren')) || t.includes('dist'));

      if (colDistIndex === -1 && headerColNames.length >= 2) {
        colDistIndex = headerColNames.findIndex((t, idx) => idx !== colLimaIndex && t !== 'partido');
      }
      break;
    }
  }

  // Procesar filas de datos
  lines.forEach(line => {
    // Ignorar líneas de totalización / cabeceras
    if (norm(line).startsWith('total') || norm(line).startsWith('emitidos') || norm(line).startsWith('---')) return;

    const pKey = matchPartyKey(line);
    if (!pKey) return;

    // Extraer números de la línea
    let numTokens = [];
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      parts.slice(1).forEach(part => {
        const cleaned = part.replace(/[^\d]/g, '');
        if (cleaned) {
          const num = parseInt(cleaned, 10);
          if (!isNaN(num) && num >= 0 && num <= 999) {
            numTokens.push(num);
          }
        }
      });
    }

    if (numTokens.length === 0) {
      const tokens = line.split(/[\t\s]+/).filter(t => /\d/.test(t));
      numTokens = tokens
        .map(tok => convertConfusedTextToNumber(tok))
        .filter(n => !isNaN(n) && n >= 0 && n <= 999);
    }

    if (numTokens.length === 0) return;

    if (headerColNames.length > 0 && numTokens.length >= 2) {
      if (colLimaIndex !== -1 && numTokens[colLimaIndex] !== undefined) {
        detected.provincial[pKey] = numTokens[colLimaIndex];
      }
      if (colDistIndex !== -1 && numTokens[colDistIndex] !== undefined) {
        detected.distrital[pKey] = numTokens[colDistIndex];
      }
    } else if (numTokens.length >= 2) {
      // Si vienen 2 números y no hay encabezado explícito: [Distrital, Provincial] o [Provincial, Distrital]
      const isProvFirst = norm(line).includes('lima') || norm(line).includes('prov');
      if (isProvFirst) {
        detected.provincial[pKey] = numTokens[0];
        detected.distrital[pKey] = numTokens[1];
      } else {
        detected.distrital[pKey] = numTokens[0];
        detected.provincial[pKey] = numTokens[1];
      }
    } else if (numTokens.length === 1) {
      const isProv = norm(line).includes('lima') || norm(line).includes('prov');
      const isDist = norm(line).includes(userDistNorm) || norm(line).includes('dist');
      if (isProv) {
        detected.provincial[pKey] = numTokens[0];
      } else if (isDist) {
        detected.distrital[pKey] = numTokens[0];
      } else {
        // Asignar a ambas secciones si la lista es de columna única
        detected.provincial[pKey] = numTokens[0];
        detected.distrital[pKey] = numTokens[0];
      }
    }
  });

  const totalProv = Object.values(detected.provincial).reduce((a, b) => a + b, 0);
  const totalDist = Object.values(detected.distrital).reduce((a, b) => a + b, 0);
  if (totalProv > 0 && totalDist === 0) {
    detected.distrital = { ...detected.provincial };
  } else if (totalDist > 0 && totalProv === 0) {
    detected.provincial = { ...detected.distrital };
  }

  return detected;
}

export async function analizarImagenOllama(imageSrc, options = {}) {
  const host = (options.ollamaHost || (typeof localStorage !== 'undefined' ? localStorage.getItem('votoReal_ollamaHost') : '') || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = (options.ollamaModel || (typeof localStorage !== 'undefined' ? localStorage.getItem('votoReal_ollamaModel') : '') || 'moondream:latest').trim();
  const currentDistrict = options.currentDistrict || 'Lima';

  const base64Image = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
  const mimeType = imageSrc.includes(';') ? (imageSrc.split(';')[0].split(':')[1] || 'image/jpeg') : 'image/jpeg';

  const prompt = `Eres un sistema experto de conteo electoral peruano (ONPE / JNE). Analiza esta imagen con máxima precisión y extrae los votos exactos por organización política.

ESTRUCTURA DE LA TABLA O ACTA ELECTORAL:
1. Partidos válidos (usa exactamente estas claves):
   - FP = Fuerza Popular
   - JP = Juntos por el Perú
   - SOMOS PERU = Somos Perú
   - FREPAP = Frepap
   - VERDE = Partido Demócrata Verde / Verde
   - MORADO = Partido Morado
   - RENOVACION = Renovación Popular
   - AHORA NACION = Ahora Nación
   - AVANZA PAIS = Avanza País
   - PODEMOS = Podemos Perú
   - APRA = Partido Aprista Peruano
   - PPC = Partido Popular Cristiano
   - NULOS = Votos Nulos
   - BLANCO = Votos en Blanco
   - IMPUGNADOS = Votos Impugnados

2. Mapeo de Columnas:
   - La columna "LIMA" (o "PROVINCIAL" / "METROPOLITANA") corresponde a la sección Provincial.
   - La columna con el distrito "${currentDistrict}" (ej. BREÑA, ATE, LURÍN, etc.) o "DISTRITAL" corresponde a la sección Distrital.
   - Si la imagen muestra una matriz de múltiples columnas, lee cada valor numérico en su intersección fila/columna.

Devuelve ÚNICAMENTE un JSON válido sin Markdown ni explicaciones:
{
  "tipoDocumento": "acta_electoral",
  "votos": {
    "provincial": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 },
    "distrital": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 }
  },
  "tabla_completa": {
    "columnas": ["PARTIDO", "LIMA", "${currentDistrict}"],
    "filas": [
      {"PARTIDO": "FP", "LIMA": 0, "${currentDistrict}": 0}
    ]
  }
}`;

  // 1. Canal Primario: Backend Proxy Express (1 sola petición limpia, sin problemas de CORS)
  try {
    const backendRes = await fetch('/api/voto-real', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'procesar_acta_ocr',
        provider: 'ollama',
        ollamaHost: host,
        ollamaModel: model,
        imageBase64: base64Image,
        mimeType: mimeType,
        prompt: prompt,
        distrito: currentDistrict
      })
    });

    if (backendRes.ok) {
      const serverData = await backendRes.json();
      if (serverData && serverData.success && serverData.rawText) {
        const parsedJson = extractJsonFromString(serverData.rawText);
        return {
          rawText: parsedJson ? JSON.stringify(parsedJson, null, 2) : serverData.rawText,
          preprocessedDataUrl: imageSrc,
          provider: 'ollama',
          model: serverData.model || model
        };
      }
    }
  } catch (backendErr) {
    console.warn('[analizarImagenOllama] Error en backend proxy, intentando conexión directa:', backendErr.message);
  }

  // 2. Canal Secundario: Intento directo a Ollama local con modelo configurado y fallbacks
  const candidateModels = Array.from(new Set([
    model,
    model.includes(':') ? model.split(':')[0] : `${model}:latest`,
    'moondream:latest',
    'moondream',
    'llama3.2-vision:latest',
    'llama3.2-vision',
    'llava:latest',
    'llava'
  ])).filter(Boolean);

  for (const targetModel of candidateModels) {
    try {
      const timeoutMs = targetModel.includes('vision') ? 60000 : 35000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const ollamaRes = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          prompt: prompt,
          images: [base64Image],
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1
          }
        })
      });

      clearTimeout(timeoutId);

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const rawText = data?.response?.trim() || '';
        const parsedJson = extractJsonFromString(rawText);

        if (parsedJson) {
          const structuredResult = parsedJson.tipoDocumento ? parsedJson : {
            tipoDocumento: autoDetectTipoDocumento(JSON.stringify(parsedJson)),
            ...parsedJson
          };
          return {
            rawText: JSON.stringify(structuredResult, null, 2),
            preprocessedDataUrl: imageSrc,
            provider: 'ollama',
            model: targetModel
          };
        }
      }
    } catch (err) {
      console.warn(`[analizarImagenOllama] Intento directo con ${targetModel} falló:`, err.message);
    }
  }

  return {
    rawText: JSON.stringify({
      tipoDocumento: "error_temporal",
      mensaje: `No se pudo conectar con Ollama (${host}). Asegúrate de que Ollama esté ejecutándose o ingresa los votos manualmente.`
    }, null, 2),
    preprocessedDataUrl: imageSrc
  };
}

export async function analizarImagenActa(imageSrc, options = {}) {
  return await analizarImagenOllama(imageSrc, options);
}


