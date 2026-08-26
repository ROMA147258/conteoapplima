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
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "NULOS": 0, "VACIOS": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "NULOS": 0, "VACIOS": 0 }
  };

  if (!text) return detected;

  const parties = ["FP", "JP", "SOMOS PERU", "FREPAP", "VERDE", "MORADO", "NULOS", "VACIOS"];

  const matchPartyKey = (str) => {
    const s = norm(str).toUpperCase();
    const firstWord = s.split(/[\s|,\t\-:]+/)[0];

    if (firstWord === 'FP' || s.startsWith('FP ') || s.includes('FUERZA POPULAR') || s.startsWith('FUERZA')) return 'FP';
    if (firstWord === 'JP' || s.startsWith('JP ') || s.includes('JUNTOS POR EL PERU') || s.startsWith('JUNTOS')) return 'JP';
    if (firstWord === 'SP' || s.includes('SOMOS') || s.startsWith('SP ')) return 'SOMOS PERU';
    if (s.includes('FREPAP') || s.includes('AGRICOLA')) return 'FREPAP';
    if (s.includes('VERDE') || s.includes('DEMOCRATA VERDE')) return 'VERDE';
    if (s.includes('MORADO') || s.includes('PARTIDO MORADO')) return 'MORADO';
    if (s.includes('NULO') || s.includes('IMPUGNADO') || s.includes('ANULADO')) return 'NULOS';
    if (s.includes('VACIO') || s.includes('BLANCO') || s.includes('EN BLANCO')) return 'VACIOS';
    return null;
  };

  // 1. Si el texto viene como JSON estructurado de Gemini
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
    const pKey = matchPartyKey(line);
    if (!pKey) return;

    // Extraer todos los números de la línea
    const numTokens = line.split(/[|,\t\s]+/)
      .map(tok => convertConfusedTextToNumber(tok))
      .filter(n => !isNaN(n) && n >= 0 && n <= 999);

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
      if (isProv) {
        detected.provincial[pKey] = numTokens[0];
      } else {
        detected.distrital[pKey] = numTokens[0];
      }
    }
  });

  return detected;
}

export async function analizarImagenGemini(imageSrc, apiKey, currentDistrict = 'Lima') {
  const effectiveKey = apiKey || 
    (typeof localStorage !== 'undefined' ? localStorage.getItem('votoReal_geminiApiKey') : '') || 
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '') || 
    '';

  const base64Image = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
  const mimeType = imageSrc.includes(';') ? (imageSrc.split(';')[0].split(':')[1] || 'image/jpeg') : 'image/jpeg';

  const candidatosProvinciales = obtenerCandidatosPorUbicacion("Lima");
  const candidatosDistritales = obtenerCandidatosPorUbicacion(currentDistrict);

  const candidatosProvContext = Object.entries(candidatosProvinciales)
    .map(([p, n]) => `  - ${p} (${PARTIDO_NOMBRES_LARGOS[p] || p}): ${n}`)
    .join('\n');
  const candidatosDistContext = Object.entries(candidatosDistritales)
    .map(([p, n]) => `  - ${p} (${PARTIDO_NOMBRES_LARGOS[p] || p}): ${n}`)
    .join('\n');

  const prompt = `Eres un sistema experto de conteo electoral peruano. Analiza esta imagen con máxima precisión y extrae los votos exactos por partido.

ESTRUCTURA DE LA TABLA O ACTA ELECTORAL:
1. Partidos válidos (usa exactamente estas claves):
   - FP = Fuerza Popular
   - JP = Juntos por el Perú
   - SOMOS PERU = Somos Perú
   - FREPAP = Frepap
   - VERDE = Partido Demócrata Verde / Verde
   - MORADO = Partido Morado
   - NULOS = Votos Nulos
   - VACIOS = Votos en Blanco / Vacíos

2. Mapeo de Columnas:
   - La columna "LIMA" (o "PROVINCIAL") corresponde a la sección Provincial.
   - La columna con el distrito "${currentDistrict}" (ej. BREÑA, ATE, LURÍN, etc.) o "DISTRITAL" corresponde a la sección Distrital.
   - Si la imagen muestra una matriz de múltiples columnas (ej. BREÑA, LIMA, ATE, LURIN), lee cada valor numérico en su intersección fila/columna.

Devuelve ÚNICAMENTE un JSON válido sin Markdown ni explicaciones:
{
  "tipoDocumento": "acta_electoral",
  "votos": {
    "provincial": {
      "FP": 0,
      "JP": 0,
      "SOMOS PERU": 0,
      "FREPAP": 0,
      "VERDE": 0,
      "MORADO": 0,
      "NULOS": 0,
      "VACIOS": 0
    },
    "distrital": {
      "FP": 0,
      "JP": 0,
      "SOMOS PERU": 0,
      "FREPAP": 0,
      "VERDE": 0,
      "MORADO": 0,
      "NULOS": 0,
      "VACIOS": 0
    }
  },
  "tabla_completa": {
    "columnas": ["PARTIDO", "LIMA", "${currentDistrict}"],
    "filas": [
      {"PARTIDO": "FP", "LIMA": 0, "${currentDistrict}": 0}
    ]
  }
}`;

  // 1. Si hay effectiveKey, intentar llamada directa a Gemini desde el cliente
  if (effectiveKey) {
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest"
    ];

    for (const modelName of modelsToTry) {
      const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${effectiveKey}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType, data: base64Image } }
                ]
              }
            ]
          })
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          const parsedJson = extractJsonFromString(rawText);

          if (parsedJson) {
            const structuredResult = parsedJson.tipoDocumento ? parsedJson : {
              tipoDocumento: autoDetectTipoDocumento(JSON.stringify(parsedJson)),
              ...parsedJson
            };
            return {
              rawText: JSON.stringify(structuredResult, null, 2),
              preprocessedDataUrl: imageSrc
            };
          }

          const parsedTables = parseMarkdownTableToJSON(rawText);
          if (parsedTables && parsedTables.length > 0) {
            return {
              rawText: JSON.stringify({
                tipoDocumento: "tabla",
                columnas: parsedTables[0].columnas,
                filas: parsedTables[0].filas
              }, null, 2),
              preprocessedDataUrl: imageSrc
            };
          }

          return {
            rawText: JSON.stringify({
              tipoDocumento: autoDetectTipoDocumento(rawText),
              textoExtraido: rawText
            }, null, 2),
            preprocessedDataUrl: imageSrc
          };
        }
      } catch (err) {
        console.warn(`[analizarImagenGemini] Error o timeout con modelo ${modelName}:`, err.message);
      }
    }
  }

  // 2. Fallback a través del servidor backend (/api/voto-real con action: procesar_acta_ocr)
  try {
    const backendRes = await fetch('/api/voto-real', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'procesar_acta_ocr',
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
          preprocessedDataUrl: imageSrc
        };
      }
    }
  } catch (backendErr) {
    console.warn('[analizarImagenGemini] Error en backend proxy OCR:', backendErr.message);
  }

  const errorFallback = {
    tipoDocumento: "error_temporal",
    mensaje: "No se pudo conectar con la API de Gemini o el acta no fue nítida. Por favor, verifica tu API Key de Gemini en Configuración o ingresa los votos manualmente."
  };

  return {
    rawText: JSON.stringify(errorFallback, null, 2),
    preprocessedDataUrl: imageSrc
  };
}
