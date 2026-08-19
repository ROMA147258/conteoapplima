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
  const lines = text.split('\n');
  let currentSection = 'provincial';
  
  const detected = {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0 }
  };

  let distritalColIndex = -1;
  let provincialColIndex = -1;

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const cleanLine = lines[i].toUpperCase().replace(/[\s\-_|]+/g, ' ').trim();
    if (!cleanLine) continue;

    const userDist = currentDistrict.toUpperCase();
    const hasDistritalKeyword = cleanLine.includes('BREÑA') || cleanLine.includes(userDist) || cleanLine.includes('DISTRITAL') || cleanLine.includes('LOCAL') || cleanLine.includes('BRENA');
    const hasProvincialKeyword = cleanLine.includes('LIMA') || cleanLine.includes('PROVINCIAL') || cleanLine.includes('METROPOLITANA');

    if (hasDistritalKeyword && hasProvincialKeyword) {
      let distWord = '';
      if (cleanLine.includes('BREÑA')) distWord = 'BREÑA';
      else if (cleanLine.includes('BRENA')) distWord = 'BRENA';
      else if (cleanLine.includes(userDist)) distWord = userDist;
      else if (cleanLine.includes('DISTRITAL')) distWord = 'DISTRITAL';
      else if (cleanLine.includes('LOCAL')) distWord = 'LOCAL';

      let provWord = '';
      if (cleanLine.includes('LIMA')) provWord = 'LIMA';
      else if (cleanLine.includes('PROVINCIAL')) provWord = 'PROVINCIAL';
      else if (cleanLine.includes('METROPOLITANA')) provWord = 'METROPOLITANA';

      if (distWord && provWord) {
        const distIndex = cleanLine.indexOf(distWord);
        const provIndex = cleanLine.indexOf(provWord);
        if (distIndex < provIndex) {
          distritalColIndex = 0;
          provincialColIndex = 1;
        } else {
          provincialColIndex = 0;
          distritalColIndex = 1;
        }
        break;
      }
    }
  }

  if (distritalColIndex === -1) {
    let twoNumLines = 0;
    lines.forEach(line => {
      const words = line.split(/[\s|\-_:]+/).map(w => w.trim()).filter(w => w.length > 0);
      let count = 0;
      words.forEach(w => {
        const isNumericToken = /^[0-9OoIiLl|ZzEeAaSsGgBbTtDdQq[\](){}/\\_\-]{1,5}$/.test(w) || /\d/.test(w);
        if (isNumericToken && !isNaN(convertConfusedTextToNumber(w))) {
          count++;
        }
      });
      if (count >= 2) twoNumLines++;
    });
    if (twoNumLines >= 2) {
      distritalColIndex = 0;
      provincialColIndex = 1;
    }
  }

  lines.forEach(line => {
    const cleanLine = line.toUpperCase().replace(/[|\-_:]+/g, ' ').trim();
    if (!cleanLine) return;

    if (cleanLine.includes('METROPOLITANA') || cleanLine.includes('LIMA') || cleanLine.includes('PROVINCIAL') || cleanLine.includes('ALIAGA')) {
      currentSection = 'provincial';
    } else if (cleanLine.includes('DISTRITAL') || cleanLine.includes('LOCAL') || cleanLine.includes('VIDAL') || cleanLine.includes('AVANZA') || cleanLine.includes('ATE') || cleanLine.includes('BREÑA') || cleanLine.includes('BRENA')) {
      currentSection = 'distrital';
    }

    let matchedMetric = null;
    if (cleanLine.includes('NULO') || cleanLine.includes('NULOS')) {
      matchedMetric = 'NULOS';
    } else if (cleanLine.includes('VACIO') || cleanLine.includes('VACIOS') || cleanLine.includes('BLANCO') || cleanLine.includes('BLANCOS')) {
      matchedMetric = 'VACIOS';
    }

    if (matchedMetric) {
      const tokens = cleanLine.split(/[\s|\-_:]+/).map(t => t.trim()).filter(t => t.length > 0);
      const numbers = tokens
        .filter(t => /^[0-9OoIiLl|ZzEeAaSsGgBbTt]{1,3}$/.test(t) || /\d/.test(t))
        .map(convertConfusedTextToNumber)
        .filter(n => !isNaN(n) && n >= 0 && n <= 999);

      if (numbers.length > 0) {
        if (distritalColIndex !== -1 && provincialColIndex !== -1 && numbers.length >= 2) {
          const distVal = numbers[distritalColIndex];
          const provVal = numbers[provincialColIndex];
          if (distVal !== undefined) detected.distrital[matchedMetric] = distVal;
          if (provVal !== undefined) detected.provincial[matchedMetric] = provVal;
        } else {
          detected[currentSection][matchedMetric] = numbers[0];
        }
      }
      return;
    }

    const matchedParty = obtenerNombreRealPartido(cleanLine, currentDistrict);

    if (matchedParty) {
      const columnTokens = cleanLine.split(/[|,\t\-_:/\\#]+|\s{2,}/);
      let numbers = [];
      columnTokens.forEach(tok => {
        const cleanTok = tok.trim().replace(/\s+/g, '');
        if (!cleanTok) return;
        const num = convertConfusedTextToNumber(cleanTok);
        if (!isNaN(num) && num >= 0 && num <= 999) {
          numbers.push(num);
        }
      });

      if (numbers.length === 0) {
        let voteText = cleanLine;
        voteText = voteText.replace(matchedParty, ' ');
        const longName = (PARTIDO_NOMBRES_LARGOS[matchedParty] || '').toUpperCase();
        voteText = voteText.replace(longName, ' ');
        
        const candProv = (obtenerCandidatosPorUbicacion("Lima")[matchedParty] || "").toUpperCase();
        const candDist = (obtenerCandidatosPorUbicacion(currentDistrict)[matchedParty] || "").toUpperCase();
        if (candProv) voteText = voteText.replace(candProv, ' ');
        if (candDist) voteText = voteText.replace(candDist, ' ');

        const tokens = voteText.split(/[\s|\-_:]+/).map(t => t.trim()).filter(t => t.length > 0);
        numbers = tokens
          .filter(t => /^[0-9OoIiLl|ZzEeAaSsGgBbTt]{1,3}$/.test(t) || /\d/.test(t))
          .map(convertConfusedTextToNumber)
          .filter(n => !isNaN(n) && n >= 0 && n <= 999);
      }

      if (numbers.length > 0) {
        if (distritalColIndex !== -1 && provincialColIndex !== -1 && numbers.length >= 2) {
          const distVal = numbers[distritalColIndex];
          const provVal = numbers[provincialColIndex];
          if (distVal !== undefined && distVal >= 0 && distVal <= 999) {
            detected.distrital[matchedParty] = distVal;
          }
          if (provVal !== undefined && provVal >= 0 && provVal <= 999) {
            detected.provincial[matchedParty] = provVal;
          }
        } else {
          let lineScope = currentSection;
          if (cleanLine.includes('ROMERO') || cleanLine.includes('GONZALO') || cleanLine.includes('ALEGRIA') || cleanLine.includes('FORSYTH') || cleanLine.includes('YURI') || cleanLine.includes('NESTOR')) {
            lineScope = 'provincial';
          } else if (cleanLine.includes('PATRICIA') || cleanLine.includes('PAREDES') || cleanLine.includes('CHAVEZ') || cleanLine.includes('VICTOR') || cleanLine.includes('ANA') || cleanLine.includes('SONIA') || cleanLine.includes('ROJAS')) {
            lineScope = 'distrital';
          }
          
          const voteCount = numbers[numbers.length - 1];
          if (voteCount !== undefined && voteCount >= 0 && voteCount <= 999) {
            detected[lineScope][matchedParty] = voteCount;
          }
        }
      }
    }
  });

  return detected;
}

export async function analizarImagenGemini(imageSrc, apiKey, currentDistrict = 'Lima') {
  if (!apiKey) {
    return {
      rawText: JSON.stringify({
        tipoDocumento: "error_temporal",
        mensaje: "Reconocimiento automático no disponible. Por favor, digita los votos manualmente."
      }, null, 2),
      preprocessedDataUrl: imageSrc
    };
  }

  const base64Image = imageSrc.split(',')[1];
  const mimeType = imageSrc.split(';')[0].split(':')[1] || 'image/png';

  const candidatosProvinciales = obtenerCandidatosPorUbicacion("Lima");
  const candidatosDistritales = obtenerCandidatosPorUbicacion(currentDistrict);

  const candidatosProvContext = Object.entries(candidatosProvinciales)
    .map(([p, n]) => `  - ${p} (${PARTIDO_NOMBRES_LARGOS[p] || p}): ${n}`)
    .join('\n');
  const candidatosDistContext = Object.entries(candidatosDistritales)
    .map(([p, n]) => `  - ${p} (${PARTIDO_NOMBRES_LARGOS[p] || p}): ${n}`)
    .join('\n');

  const prompt = `Eres un sistema de conteo electoral peruano. Analiza esta imagen de acta electoral.

CONTEXTO DEL SISTEMA:
Los únicos partidos válidos son (usa EXACTAMENTE estas claves):
- FP = Fuerza Popular
- JP = Juntos por el Perú
- SOMOS PERU = Somos Perú
- FREPAP = Frepap
- VERDE = Partido Verde
- MORADO = Partido Morado

CANDIDATOS PROVINCIALES (Lima Metropolitana):
${candidatosProvContext}

CANDIDATOS DISTRITALES (${currentDistrict}):
${candidatosDistContext}

INSTRUCCIONES:
1. Si la imagen muestra una tabla con PARTIDOS como filas y DISTRITOS como columnas:
   - Extrae los votos por partido para cada distrito visible.
   - Devuelve un JSON con "tipoDocumento": "tabla" y "table": {"headers": [...], "rows": [...]}.
2. Si la imagen muestra una lista de CANDIDATOS con números:
   - Devuelve un JSON con "tipoDocumento": "candidatos_votos" y "votos": {"provincial": {}, "distrital": {}}.
3. Si no reconoces el formato, extrae el texto estructurado.

REGLAS:
- Usa SOLO las claves de partido: FP, JP, SOMOS PERU, FREPAP, VERDE, MORADO.
- No inventes votos. Solo transcribe lo visible en la imagen.
- Devuelve ÚNICAMENTE JSON válido, sin explicaciones ni Markdown.
- No uses bloques \`\`\`json.`;

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-002"
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (response.ok) {
        const result = await response.json();
        const rawText = result.candidates[0].content.parts[0].text.trim();
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
      lastError = err;
    }
  }

  const errorFallback = {
    tipoDocumento: "error_temporal",
    mensaje: "No se pudo reconocer el texto del acta con suficiente claridad. Por favor, digita los votos de forma manual o sube una foto más nítida e iluminada."
  };

  return {
    rawText: JSON.stringify(errorFallback, null, 2),
    preprocessedDataUrl: imageSrc
  };
}
