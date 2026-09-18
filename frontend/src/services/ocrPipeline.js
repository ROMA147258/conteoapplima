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
    provincial: { "SOMOS PERU": 0, "RENOVACION": 0, "AHORA NACION": 0, "AVANZA PAIS": 0, "PODEMOS": 0, "JP": 0, "OBRAS": 0, "FREPAP": 0, "ACCION POPULAR": 0, "ESPERANZA": 0, "VENCEREMOS": 0, "VISION PERU": 0, "APRA": 0, "FP": 0, "PPC": 0, "PROGRESEMOS": 0, "MORADO": 0, "BUEN GOBIERNO": 0, "VERDE": 0, "PERU LIBRE": 0, "TIERRA VERDE": 0, "PUEBLO CONSCIENTE": 0, "PPP": 0, "INTEGRIDAD": 0, "FUERZA CIUDADANA": 0, "BATALLA PERU": 0, "APP": 0, "ALIANZA REGIONAL": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 },
    distrital: { "SOMOS PERU": 0, "RENOVACION": 0, "AHORA NACION": 0, "AVANZA PAIS": 0, "PODEMOS": 0, "JP": 0, "OBRAS": 0, "FREPAP": 0, "ACCION POPULAR": 0, "ESPERANZA": 0, "VENCEREMOS": 0, "VISION PERU": 0, "APRA": 0, "FP": 0, "PPC": 0, "PROGRESEMOS": 0, "MORADO": 0, "BUEN GOBIERNO": 0, "VERDE": 0, "PERU LIBRE": 0, "TIERRA VERDE": 0, "PUEBLO CONSCIENTE": 0, "PPP": 0, "INTEGRIDAD": 0, "FUERZA CIUDADANA": 0, "BATALLA PERU": 0, "APP": 0, "ALIANZA REGIONAL": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 }
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

    // 1. Partidos Políticos Primero (Cruzando Nombre de Partido, Candidato y Sello/Símbolo Oficial)
    if (s.includes('RENOVACION') || s.includes('LOPEZ ALIAGA') || s.includes('ACOSTA CAJALEON') || s.includes('LETRA R') || s.includes('CIRCULO AZUL')) return 'RENOVACION';
    if (s.includes('AHORA NACION') || s.includes('SUSEL') || s.includes('CABELLO ACOSTA') || s.includes('BANDERA PERUANA') || /\bAN\b/.test(s)) return 'AHORA NACION';
    if (s.includes('AVANZA') || s.includes('ALLISON') || s.includes('COMBINA') || s.includes('CASAS') || s.includes('TREN') || s.includes('FERROCARRIL')) return 'AVANZA PAIS';
    if (s.includes('PODEMOS') || s.includes('URRESTI') || s.includes('AMAYA') || s.includes('LETRA P') || s.includes('ESTRELLAS')) return 'PODEMOS';
    if (s.includes('OBRAS') || s.includes('BELMONT') || s.includes('CIVICO OBRAS')) return 'OBRAS';
    if (s.includes('ACCION POPULAR') || s.includes('ACCION') || s.includes('TEJADA') || s.includes('CHACON') || s.includes('ARANA') || s.includes('LAMPA') || s.includes('PALA')) return 'ACCION POPULAR';
    if (s.includes('ESPERANZA') || s.includes('LEON CHINCHAY') || s.includes('SILVA MONTERO') || s.includes('ESCARAPELA') || s.includes('LETRA E')) return 'ESPERANZA';
    if (s.includes('VENCEREMOS') || s.includes('ALVARADO') || s.includes('TRES SILUETAS')) return 'VENCEREMOS';
    if (s.includes('VISION') || s.includes('ABARCA') || s.includes('CAVERO') || s.includes('OJO') || s.includes('SOL RADIANTE')) return 'VISION PERU';
    if (s.includes('APRA') || s.includes('APRISTA') || s.includes('YAYA') || s.includes('MUNOZ') || s.includes('ESTRELLA ROJA') || s.includes('ESTRELLA DE CINCO')) return 'APRA';
    if (s.includes('PPC') || s.includes('CRISTIANO') || s.includes('DE POMAR') || s.includes('GARCIA DURANTE') || s.includes('POPULAR CRISTIANO') || s.includes('MAPA DEL PERU') || s.includes('MAPA VERDE')) return 'PPC';
    if (s.includes('PROGRESEMOS') || s.includes('LLANOS') || s.includes('FLOR MULTICOLOR')) return 'PROGRESEMOS';
    if (s.includes('BUEN GOBIERNO') || s.includes('GALLARDO') || s.includes('MANOS ENTRELAZADAS') || /\bPBG\b/.test(s)) return 'BUEN GOBIERNO';
    if (s.includes('PERU LIBRE') || s.includes('RAMIREZ MATEO') || s.includes('LAPIZ') || s.includes('LAPICERO')) return 'PERU LIBRE';
    if (s.includes('TIERRA VERDE') || s.includes('YEHUDE') || s.includes('SIMON') || s.includes('HOJA VERDE')) return 'TIERRA VERDE';
    if (s.includes('PUEBLO CONSCIENTE') || s.includes('HUETTE') || s.includes('ANTORCHA Y MANOS')) return 'PUEBLO CONSCIENTE';
    if (s.includes('PATRIOTICO') || s.includes('CALLER') || s.includes('ESCUDO PPP') || /\bPPP\b/.test(s)) return 'PPP';
    if (s.includes('INTEGRIDAD') || s.includes('LINARES') || s.includes('BALANZA')) return 'INTEGRIDAD';
    if (s.includes('FUERZA CIUDADANA') || s.includes('BONILLA') || s.includes('MANO ALZADA')) return 'FUERZA CIUDADANA';
    if (s.includes('BATALLA') || s.includes('QUISPE CABALLERO') || s.includes('CASCO') || s.includes('ESCUDO DE BATALLA')) return 'BATALLA PERU';
    if (s.includes('ALIANZA PARA EL PROGRESO') || s.includes('BENEL') || s.includes('LETRA A') || /\bAPP\b/.test(s)) return 'APP';
    if (s.includes('ALIANZA REGIONAL') || s.includes('MANCHEGO') || s.includes('ESTRELLA DORADA') || /\bARP\b/.test(s)) return 'ALIANZA REGIONAL';

    if (s.includes('FUERZA POPULAR') || /\bFP\b/.test(s) || s.startsWith('FUERZA') || s.includes('DAZA') || s.includes('KEIKO') || s.includes('LETRA K') || s.includes('K NARANJA')) return 'FP';
    if (s.includes('JUNTOS POR EL PERU') || /\bJP\b/.test(s) || s.startsWith('JUNTOS') || s.includes('VARGAS CUELLAR') || s.includes('ESPIRAL')) return 'JP';
    if (s.includes('SOMOS PERU') || /\bSP\b/.test(s) || s.includes('SOMOS') || s.includes('BRUCE') || s.includes('LEGUIA') || s.includes('BAZAN') || s.includes('CORAZON')) return 'SOMOS PERU';
    if (s.includes('FREPAP') || s.includes('AGRICOLA') || s.includes('VALDEZ') || s.includes('PESCADITO') || s.includes('PEZ')) return 'FREPAP';
    if (s.includes('DEMOCRATA VERDE') || s.includes('PARTIDO VERDE') || /\bVERDE\b/.test(s) || s.includes('HURTADO') || s.includes('ARBOL')) return 'VERDE';
    if (s.includes('PARTIDO MORADO') || /\bMORADO\b/.test(s) || s.includes('LA CRUZ') || s.includes('RUIZ GUTIERREZ') || s.includes('LETRA M') || s.includes('ANTORCHA MORADA')) return 'MORADO';

    // 2. Votos especiales
    if (s.includes('IMPUGNAD')) return 'IMPUGNADOS';
    if (s.includes('BLANCO') || s.includes('EN BLANCO') || /\bVACIO\b/.test(s) || /\bVACIOS\b/.test(s)) return 'BLANCO';
    if (s.includes('NULO') || s.includes('ANULADO') || s.includes('NULOS')) return 'NULOS';

    return null;
  };

  // 1. Si el texto viene como JSON estructurado de IA / Gemini
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

export async function analizarImagenActa(imageSrc, options = {}) {
  const cleanBase64 = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
  const mimeType = imageSrc.includes(';') ? (imageSrc.split(';')[0].split(':')[1] || 'image/jpeg') : 'image/jpeg';
  const currentDistrict = options.currentDistrict || 'Lima';
  const seccion = options.seccion || 'ambos';
  const defaultKey = (typeof atob === 'function') 
    ? atob('QVEuQWI4Uk42SmRJcnA0OWxxS2FNMmF5OTZCU0FFQW91Vzl4RkNmNkNTamdSNGpVLV9rRlE=') 
    : '';

  const geminiApiKey = options.geminiApiKey || 
                       (typeof localStorage !== 'undefined' ? localStorage.getItem('votoReal_geminiApiKey') : '') ||
                       import.meta.env?.VITE_GEMINI_API_KEY ||
                       defaultKey;

  // 1. Intentar llamar al backend si está disponible (Localhost / Proxy)
  try {
    const backendRes = await fetch('/api/voto-real', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'procesar_acta_ocr',
        provider: 'gemini',
        imageBase64: cleanBase64,
        mimeType: mimeType,
        distrito: currentDistrict,
        seccion: seccion,
        geminiApiKey: geminiApiKey
      })
    });

    if (backendRes.ok) {
      const serverData = await backendRes.json();
      if (serverData && serverData.success && serverData.rawText) {
        const parsedJson = extractJsonFromString(serverData.rawText);
        return {
          rawText: parsedJson ? JSON.stringify(parsedJson, null, 2) : serverData.rawText,
          preprocessedDataUrl: imageSrc,
          provider: 'gemini',
          model: serverData.model || 'gemini-3.5-flash-lite',
          parsedJson: parsedJson
        };
      }
    }
  } catch (backendErr) {
    console.warn('[analizarImagenActa] Backend local no disponible, ejecutando Gemini Vision directo:', backendErr.message);
  }

  // 2. Fallback / Producción Vercel: Llamar directamente a Google Gemini 3.5 Flash Lite Vision
  if (geminiApiKey) {
    const fallbackModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    const prompt = `Eres un perito experto en escaneo de actas electorales peruanas (ONPE / JNE). Analiza esta imagen con precisión absoluta y extrae cada uno de los votos manuscritos o impresos para cada organización política.
 
REGLAS CRÍTICAS DE EXTRACCIÓN Y RECONOCIMIENTO MULTIMODAL:
1. IDENTIFICACIÓN POR SELLO/SÍMBOLO, PARTIDO Y CANDIDATO: En las actas electorales y cédulas de sufragio peruanas, cada fila contiene el Sello/Símbolo gráfico oficial del partido, el Nombre del partido y el Candidato. Cruza SIEMPRE los 3 elementos para identificar y asignar con exactitud el voto:
   - SOMOS PERU: Sello/Símbolo (Corazón rojo/azul 'SP') | Partido (Somos Perú) | Candidato (Carlos Bruce)
   - RENOVACION: Sello/Símbolo ('R' celeste en círculo azul) | Partido (Renovación Popular) | Candidato (Rafael López Aliaga)
   - AHORA NACION: Sello/Símbolo (Bandera peruana / 'AN') | Partido (Ahora Nación) | Candidato (Susel Paredes)
   - AVANZA PAIS: Sello/Símbolo (Tren / Ferrocarril) | Partido (Avanza País) | Candidato (Francis Allison)
   - PODEMOS: Sello/Símbolo (Letra 'P' tricolor con estrellas) | Partido (Podemos Perú) | Candidato (Daniel Urresti)
   - JP: Sello/Símbolo (Letras 'JP' rojo y verde) | Partido (Juntos por el Perú) | Candidato (Oswaldo Vargas)
   - OBRAS: Sello/Símbolo (Manos estrechadas / Sol / Obras) | Partido (Partido Cívico Obras) | Candidato (Ricardo Belmont)
   - FREPAP: Sello/Símbolo (Pescadito / Pez israelita) | Partido (FREPAP) | Candidato (Segundo Valdez)
   - ACCION POPULAR: Sello/Símbolo (Lampa / Pala roja y blanca) | Partido (Acción Popular) | Candidato (Carlos Tejada)
   - ESPERANZA: Sello/Símbolo (Escarapela verde / 'E') | Partido (Frente de la Esperanza 2021) | Candidato (Elizabeth León)
   - VENCEREMOS: Sello/Símbolo (Tres siluetas / 'V') | Partido (Alianza Electoral Venceremos) | Candidato (Juan Alvarado)
   - VISION PERU: Sello/Símbolo (Ojo / Sol radiante) | Partido (Visión Perú) | Candidato (Santiago Abarca)
   - APRA: Sello/Símbolo (Estrella roja de cinco puntas) | Partido (Partido Aprista Peruano) | Candidata (Mónica Yaya)
   - FP: Sello/Símbolo (Letra 'K' naranja) | Partido (Fuerza Popular) | Candidato (Samuel Daza)
   - PPC: Sello/Símbolo (Mapa verde del Perú) | Partido (Partido Popular Cristiano) | Candidato (Edgardo de Pomar)
   - PROGRESEMOS: Sello/Símbolo (Flor multicolor / sol) | Partido (Progresemos) | Candidato (Luis Miguel Llanos)
   - MORADO: Sello/Símbolo (Letra 'M' morada / antorcha) | Partido (Partido Morado) | Candidata (Victoria La Cruz)
   - BUEN GOBIERNO: Sello/Símbolo (Manos entrelazadas / PBG) | Partido (Partido del Buen Gobierno) | Candidato (Carlos Gallardo)
   - VERDE: Sello/Símbolo (Árbol / girasol verde) | Partido (Partido Demócrata Verde) | Candidata (Flor de María Hurtado)
   - PERU LIBRE: Sello/Símbolo (Lápiz escolar amarillo y rojo) | Partido (Perú Libre) | Candidato (Rubén Ramírez)
   - TIERRA VERDE: Sello/Símbolo (Hoja verde / Tierra) | Partido (Coalición Transformadora Tierra Verde) | Candidato (Yehude Simon)
   - PUEBLO CONSCIENTE: Sello/Símbolo (Antorcha / Manos unidas) | Partido (Pueblo Consciente) | Candidato (Luis Huette)
   - PPP: Sello/Símbolo (Escudo rojo / PPP) | Partido (Partido Patriótico del Perú) | Candidato (Sandro Caller)
   - INTEGRIDAD: Sello/Símbolo (Balanza de justicia / ID) | Partido (Integridad Democrática) | Candidata (Jessica Linares)
   - FUERZA CIUDADANA: Sello/Símbolo (Mano alzada / Flecha) | Partido (Fuerza Ciudadana) | Candidato (Rubén Bonilla)
   - BATALLA PERU: Sello/Símbolo (Casco / Escudo de batalla) | Partido (Batalla Perú) | Candidato (Samir Quispe)
   - APP: Sello/Símbolo (Letra 'A' roja en círculo blanco) | Partido (Alianza para el Progreso)
   - ALIANZA REGIONAL: Sello/Símbolo (Estrella dorada / Sol ARP) | Partido (Alianza Regional)
   - BLANCO: Fila de Votos en Blanco
   - NULOS: Fila de Votos Nulos / Viciados
   - IMPUGNADOS: Fila de Votos Impugnados

2. Extrae TODOS los partidos que figuren en la tabla o lista del acta. Si un partido no tiene votos visibles o está en blanco, asígnale 0.

3. Estructura de salida JSON obligatoria:
{
  "tipoDocumento": "acta_electoral",
  "votos": {
    "provincial": {
      "SOMOS PERU": 0,
      "RENOVACION": 0,
      "AHORA NACION": 0,
      "AVANZA PAIS": 0,
      "PODEMOS": 0,
      "JP": 0,
      "OBRAS": 0,
      "FREPAP": 0,
      "ACCION POPULAR": 0,
      "ESPERANZA": 0,
      "VENCEREMOS": 0,
      "VISION PERU": 0,
      "APRA": 0,
      "FP": 0,
      "PPC": 0,
      "PROGRESEMOS": 0,
      "MORADO": 0,
      "BUEN GOBIERNO": 0,
      "VERDE": 0,
      "PERU LIBRE": 0,
      "TIERRA VERDE": 0,
      "PUEBLO CONSCIENTE": 0,
      "PPP": 0,
      "INTEGRIDAD": 0,
      "FUERZA CIUDADANA": 0,
      "BATALLA PERU": 0,
      "APP": 0,
      "ALIANZA REGIONAL": 0,
      "BLANCO": 0,
      "NULOS": 0,
      "IMPUGNADOS": 0
    },
    "distrital": {
      "SOMOS PERU": 0,
      "RENOVACION": 0,
      "AHORA NACION": 0,
      "AVANZA PAIS": 0,
      "PODEMOS": 0,
      "JP": 0,
      "OBRAS": 0,
      "FREPAP": 0,
      "ACCION POPULAR": 0,
      "ESPERANZA": 0,
      "VENCEREMOS": 0,
      "VISION PERU": 0,
      "APRA": 0,
      "FP": 0,
      "PPC": 0,
      "PROGRESEMOS": 0,
      "MORADO": 0,
      "BUEN GOBIERNO": 0,
      "VERDE": 0,
      "PERU LIBRE": 0,
      "TIERRA VERDE": 0,
      "PUEBLO CONSCIENTE": 0,
      "PPP": 0,
      "INTEGRIDAD": 0,
      "FUERZA CIUDADANA": 0,
      "BATALLA PERU": 0,
      "APP": 0,
      "ALIANZA REGIONAL": 0,
      "BLANCO": 0,
      "NULOS": 0,
      "IMPUGNADOS": 0
    }
  }
}
Si el acta corresponde solo a Lima Metropolitana, coloca los votos en "provincial". Si corresponde al distrito de ${currentDistrict}, colócalos en "distrital". Si tiene ambas columnas, extrae ambas. Responde ÚNICAMENTE el JSON.`;

    for (const m of fallbackModels) {
      try {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              response_mime_type: "application/json"
            }
          })
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            const parsedJson = extractJsonFromString(text);
            return {
              rawText: parsedJson ? JSON.stringify(parsedJson, null, 2) : text,
              preprocessedDataUrl: imageSrc,
              provider: 'gemini',
              model: m,
              parsedJson: parsedJson
            };
          }
        }
      } catch (directErr) {
        console.warn(`[analizarImagenActa] Error con modelo directo ${m}:`, directErr.message);
      }
    }
  }

  return {
    rawText: JSON.stringify({
      tipoDocumento: "error_temporal",
      mensaje: "No se pudo procesar el acta con Gemini Vision. Por favor verifica tu conexión o ingresa los votos manualmente."
    }, null, 2),
    preprocessedDataUrl: imageSrc
  };
}


