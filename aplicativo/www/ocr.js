// --- ADVANCED COMPUTER VISION & OCR PIPELINE (WITH OpenCV.js & Tesseract.js) ---

function extractJsonFromString(str) {
  if (!str) return null;
  const trimmed = str.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {}

  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(codeBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {}
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  return null;
}

function extraerCeldasConOpenCV(imageElement) {
  if (typeof cv === 'undefined') {
    console.warn("OpenCV.js is not loaded. Skipping cell-level extraction.");
    return null;
  }

  let src = null, gray = null, thresh = null, M_horiz = null, M_vert = null;
  let horiz = null, vert = null, joints = null, contours = null, hierarchy = null;
  try {
    src = cv.imread(imageElement);
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    thresh = new cv.Mat();
    cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 15, 2);

    // Isolate horizontal lines
    let scaleH = 20; 
    let horizSize = Math.max(2, Math.floor(thresh.cols / scaleH));
    M_horiz = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(horizSize, 1));
    horiz = new cv.Mat();
    cv.erode(thresh, horiz, M_horiz);
    cv.dilate(horiz, horiz, M_horiz);

    // Isolate vertical lines
    let scaleV = 20;
    let vertSize = Math.max(2, Math.floor(thresh.rows / scaleV));
    M_vert = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, vertSize));
    vert = new cv.Mat();
    cv.erode(thresh, vert, M_vert);
    cv.dilate(vert, vert, M_vert);

    // Combine lines to get grid joints
    joints = new cv.Mat();
    cv.add(horiz, vert, joints);

    // Find contours
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(joints, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    let boxes = [];
    const minArea = (src.cols * src.rows) * 0.0005; // at least 0.05% of image
    const maxArea = (src.cols * src.rows) * 0.25;   // at most 25% of image

    for (let i = 0; i < contours.size(); ++i) {
      let c = contours.get(i);
      let rect = cv.boundingRect(c);
      let area = rect.width * rect.height;
      
      if (area > minArea && area < maxArea && rect.width > 15 && rect.height > 10) {
        let duplicate = false;
        for (let b of boxes) {
          if (Math.abs(b.x - rect.x) < 10 && Math.abs(b.y - rect.y) < 10 && Math.abs(b.width - rect.width) < 10) {
            duplicate = true;
            break;
          }
        }
        if (!duplicate) {
          boxes.push(rect);
        }
      }
    }

    if (boxes.length < 10) {
      console.warn(`[OpenCV] Found too few cells (${boxes.length}). Falling back.`);
      return null;
    }

    // Group bounding boxes into rows by y coordinate
    boxes.sort((a, b) => a.y - b.y);

    let rowsList = [];
    let currentRow = [boxes[0]];
    let rowThresholdY = src.rows * 0.035; // 3.5% of height as threshold

    for (let i = 1; i < boxes.length; i++) {
      let b = boxes[i];
      let prev = currentRow[currentRow.length - 1];
      if (Math.abs(b.y - prev.y) < rowThresholdY) {
        currentRow.push(b);
      } else {
        rowsList.push(currentRow);
        currentRow = [b];
      }
    }
    rowsList.push(currentRow);

    // Sort cells horizontally inside each row
    rowsList.forEach(r => r.sort((a, b) => a.x - b.x));

    // Filter rows having at least 2 cells
    rowsList = rowsList.filter(r => r.length >= 2);

    if (rowsList.length < 5) {
      console.warn(`[OpenCV] Found only ${rowsList.length} valid rows. Falling back.`);
      return null;
    }

    console.log(`[OpenCV] Detected ${rowsList.length} table rows.`);

    const parties = ["FP", "JP", "SOMOS PERU", "FREPAP", "VERDE", "MORADO"];
    let finalPartyRows = [];
    let totalRow = null;

    // We match the last 6 rows to candidate parties. If we have 7 or more, we treat the last one as TOTAL.
    let hasTotalRow = rowsList.length >= 7;
    let startIndex = Math.max(0, rowsList.length - (hasTotalRow ? 7 : 6));

    for (let i = 0; i < 6; i++) {
      let partyIndex = startIndex + i;
      if (partyIndex < rowsList.length) {
        let rowCells = rowsList[partyIndex];
        let party = parties[i];

        let provRect, distRect;
        if (rowCells.length >= 3) {
          provRect = rowCells[rowCells.length - 2];
          distRect = rowCells[rowCells.length - 1];
        } else {
          provRect = rowCells[0];
          distRect = rowCells[1];
        }

        finalPartyRows.push({
          party: party,
          provRect: provRect,
          distRect: distRect
        });
      }
    }

    if (hasTotalRow) {
      let totalRowIndex = startIndex + 6;
      if (totalRowIndex < rowsList.length) {
        let rowCells = rowsList[totalRowIndex];
        let provRect, distRect;
        if (rowCells.length >= 3) {
          provRect = rowCells[rowCells.length - 2];
          distRect = rowCells[rowCells.length - 1];
        } else {
          provRect = rowCells[0];
          distRect = rowCells[1];
        }
        totalRow = {
          provRect: provRect,
          distRect: distRect
        };
      }
    }

    return {
      partyRows: finalPartyRows,
      totalRow: totalRow
    };
  } catch (e) {
    console.error("OpenCV cell extraction error:", e);
    return null;
  } finally {
    // Release Mat objects
    if (src) src.delete();
    if (gray) gray.delete();
    if (thresh) thresh.delete();
    if (M_horiz) M_horiz.delete();
    if (M_vert) M_vert.delete();
    if (horiz) horiz.delete();
    if (vert) vert.delete();
    if (joints) joints.delete();
    if (contours) contours.delete();
    if (hierarchy) hierarchy.delete();
  }
}

function preprocesarYAnalizarCelda(imageElement, rect) {
  if (typeof cv === 'undefined' || !rect || typeof rect.x !== 'number') {
    return { isEmpty: false, dataUrl: null, inkRatio: 0 };
  }

  let src = null, cell = null, gray = null, cl = null, thresh = null, morph = null, binOCR = null, deskewed = null, upscaled = null;
  let clahe = null, k = null, points = null;
  try {
    src = cv.imread(imageElement);
    
    // Crop the cell
    let rectCrop = new cv.Rect(rect.x, rect.y, rect.width, rect.height);
    cell = src.roi(rectCrop);

    // Grayscale
    gray = new cv.Mat();
    cv.cvtColor(cell, gray, cv.COLOR_RGBA2GRAY);

    // CLAHE for contrast enhancement
    clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    cl = new cv.Mat();
    clahe.apply(gray, cl);

    // Adaptive thresholding (inverse binarization to count ink pixels)
    thresh = new cv.Mat();
    cv.adaptiveThreshold(cl, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    // Morphological opening to reduce noise
    k = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    morph = new cv.Mat();
    cv.morphologyEx(thresh, morph, cv.MORPH_OPEN, k);

    // Count ink pixels
    let inkCount = cv.countNonZero(morph);
    let totalPixels = morph.cols * morph.rows;
    let inkRatio = inkCount / totalPixels;

    // Detección de celdas vacías (less than 0.4% ink is considered empty)
    let isEmpty = inkRatio < 0.004;

    // Convert back to regular binary (black text, white background) for OCR
    binOCR = new cv.Mat();
    cv.bitwise_not(morph, binOCR);

    // Correct skewness (deskew)
    deskewed = binOCR;
    points = new cv.Mat();
    cv.findNonZero(morph, points);
    if (points.rows > 0) {
      let minRect = cv.minAreaRect(points);
      let angle = minRect.angle;
      if (angle < -45) angle = angle + 90;
      if (Math.abs(angle) > 0.5 && Math.abs(angle) < 45) {
        let center = new cv.Point(binOCR.cols / 2, binOCR.rows / 2);
        let M = cv.getRotationMatrix2D(center, angle, 1.0);
        deskewed = new cv.Mat();
        cv.warpAffine(binOCR, deskewed, M, new cv.Size(binOCR.cols, binOCR.rows), cv.INTER_CUBIC, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));
        M.delete();
      }
    }

    // Rescale 3x before OCR
    upscaled = new cv.Mat();
    let dsize = new cv.Size(deskewed.cols * 3, deskewed.rows * 3);
    cv.resize(deskewed, upscaled, dsize, 0, 0, cv.INTER_CUBIC);

    // Output to canvas and get dataURL
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, upscaled);
    const dataUrl = canvas.toDataURL('image/png');

    return { isEmpty, dataUrl, inkRatio };
  } catch (e) {
    console.error("Individual cell preprocessing failed:", e);
    return { isEmpty: false, dataUrl: null, inkRatio: 0 };
  } finally {
    if (src) src.delete();
    if (cell) cell.delete();
    if (gray) gray.delete();
    if (clahe) clahe.delete();
    if (cl) cl.delete();
    if (thresh) thresh.delete();
    if (k) k.delete();
    if (morph) morph.delete();
    if (binOCR) binOCR.delete();
    if (points) points.delete();
    if (deskewed && deskewed !== binOCR) deskewed.delete();
    if (upscaled) upscaled.delete();
  }
}async function obtenerModelosGemini() {
  if (!appState.geminiApiKey) {
    console.warn("[Gemini API] No API Key set to query models.");
    return;
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${appState.geminiApiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to list models: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log("Modelos compatibles obtenidos de la API de Gemini:", data);
  } catch (err) {
    console.error("Error al obtener la lista de modelos de Gemini:", err);
  }
}

function cleanCellText(text) {
  if (!text) return "";
  let cleaned = text;
  
  // Replace <br>, <br/>, <br >, etc. case-insensitive with space
  cleaned = cleaned.replace(/<br\s*\/?>/gi, ' ');
  
  // Remove markdown formatting characters
  cleaned = cleaned.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/__/g, '');
  cleaned = cleaned.replace(/_/g, '');
  cleaned = cleaned.replace(/`/g, '');
  cleaned = cleaned.replace(/###/g, '');
  
  // Replace newlines and carriage returns with space
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  
  // Replace multiple spaces with a single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
}

function parseMarkdownTableToJSON(markdownText) {
  const lines = markdownText.split('\n');
  const tables = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.includes('|')) {
      i++;
      continue;
    }

    // Check if next line is a separator line
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.includes('|')) {
        // Parse cells of both lines
        const headerCells = getTableCells(line);
        const sepCells = getTableCells(nextLine);

        const isSep = sepCells.length > 0 && sepCells.every(cell => cell.match(/^:?-+:?$/));
        if (isSep && headerCells.length === sepCells.length) {
          // Found a table! Let's parse it.
          const cleanedHeaders = headerCells.map(c => cleanCellText(c));
          
          const table = {
            columnas: cleanedHeaders.slice(1), // Exclude the first column (e.g. party name)
            filas: []
          };
          
          i += 2; // Move past header and separator
          
          // Parse rows until we hit a non-table line or end of text
          while (i < lines.length) {
            const rowLine = lines[i].trim();
            if (!rowLine.includes('|')) {
              break;
            }
            const rowCells = getTableCells(rowLine);
            if (rowCells.length === 0) {
              break;
            }
            
            // Ignorar filas separadoras compuestas por "---"
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
              // Parse value as number if it is integer-like
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

function getTableCells(line) {
  let cells = line.split('|').map(c => c.trim());
  if (line.startsWith('|')) cells.shift();
  if (line.endsWith('|')) cells.pop();
  return cells;
}

function autoDetectTipoDocumento(rawText) {
  const lower = rawText.toLowerCase();
  
  // 0. Detectar tabla
  if (lower.includes('"table"') || lower.includes('"filas"') || lower.includes('"rows"') || lower.includes('"column_headers"') || lower.includes('"columnas"') || lower.includes('"headers"') || lower.includes('"columns"')) {
    return "tabla";
  }
  
  // 1. Detectar recibo / boleta / factura
  const keywordsRecibo = ["total", "subtotal", "boleta", "factura", "recibo", "pago", "monto", "s/.", "precio", "neto", "igv", "ruc"];
  const matchesRecibo = keywordsRecibo.filter(k => lower.includes(k)).length;
  if (matchesRecibo >= 3) {
    return "recibo";
  }
  
  // 2. Detectar interfaz (UI)
  const keywordsInterfaz = ["configuración", "guardar", "cancelar", "usuario", "contraseña", "login", "iniciar sesión", "dashboard", "menú", "menu", "settings", "click", "botón", "button", "buscar", "search", "cerrar", "close", "home", "enlace", "link", "vista", "view", "aplicativo", "dashboard"];
  const matchesInterfaz = keywordsInterfaz.filter(k => lower.includes(k)).length;
  if (matchesInterfaz >= 3 || lower.includes("iniciar sesión") || (lower.includes("usuario") && lower.includes("contraseña"))) {
    return "interfaz";
  }
  
  // 3. Detectar formulario
  // Los formularios contienen campos con ":" seguidos por valores o espacios, o patrones repetitivos
  const formPattern = /[a-zA-Záéíóúñü\s]+\s*:\s*[^\n]*/g;
  const formMatches = lower.match(formPattern);
  if (formMatches && formMatches.length >= 4) {
    return "formulario";
  }
  
  // 4. Detectar documento (texto largo estructurado en párrafos, títulos, cartas, artículos, etc.)
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  if (paragraphs.length >= 2 || rawText.trim().length > 400) {
    return "documento";
  }
  
  // 5. Detectar imagen_con_texto (textos muy cortos, letreros, carteles, avisos, texto fragmentado)
  if (rawText.trim().length > 0 && rawText.trim().length < 150) {
    return "imagen_con_texto";
  }
  
  // 6. Fallback a texto_libre
  return "texto_libre";
}

async function fetchWithRetry(endpointUrl, requestOptions, maxAttempts = 3) {
  let attempt = 1;
  let delay = 3000; // start with 3 seconds

  while (attempt <= maxAttempts) {
    try {
      console.log(`[Gemini API] Intentando llamada a la API (Intento ${attempt}/${maxAttempts})...`);
      const response = await fetch(endpointUrl, requestOptions);
      console.log("Gemini Response status:", response.status);

      if (response.ok) {
        return response;
      }

      // Retry on 429 (quota) and 503 (overload)
      if (response.status === 429 || response.status === 503) {
        const errorText = await response.text();
        if (attempt < maxAttempts) {
          console.warn(`[Gemini API] Estado ${response.status}. Reintentando en ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          delay *= 2; // 3s -> 6s -> 12s
          continue;
        }
        // All retries exhausted for this model
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      // Other HTTP errors: throw immediately so the model loop can switch model
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);

    } catch (err) {
      if (attempt === maxAttempts) {
        throw err;
      }
      // Network failure: wait and retry
      console.warn(`[Gemini API] Fallo de red: ${err.message}. Reintentando en ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
      delay *= 2;
    }
  }
}

async function analizarImagenIndividual(imageSrc, imgIndex, totalImgs, progressBar, progressPercentage, progressStatus) {
  try {
    if (progressStatus) progressStatus.textContent = `Analizando imagen ${imgIndex}/${totalImgs}...`;
    
    if (!appState.geminiApiKey) {
      const errMsg = "Error: Google Gemini API Key no configurada. Por favor configúrala haciendo doble click en el logo.";
      console.error(errMsg);
      return { rawText: errMsg, preprocessedDataUrl: imageSrc };
    }

    // Diagnostic query to fetch available models
    await obtenerModelosGemini();

    const base64Image = imageSrc.split(',')[1];
    const mimeType = imageSrc.split(';')[0].split(':')[1] || 'image/png';

    // Build dynamic candidate context for the prompt
    const candidatosProvinciales = typeof obtenerCandidatosPorUbicacion === 'function'
      ? obtenerCandidatosPorUbicacion("Lima") : {};
    const ubicacionUsuario = (appState.currentUser && appState.currentUser.ubicacion) || "Lima";
    const candidatosDistritales = typeof obtenerCandidatosPorUbicacion === 'function'
      ? obtenerCandidatosPorUbicacion(ubicacionUsuario) : {};
    const nombresLargos = typeof PARTIDO_NOMBRES_LARGOS !== 'undefined' ? PARTIDO_NOMBRES_LARGOS : {};

    const candidatosProvContext = Object.entries(candidatosProvinciales)
      .map(([p, n]) => `  - ${p} (${nombresLargos[p] || p}): ${n}`)
      .join('\n');
    const candidatosDistContext = Object.entries(candidatosDistritales)
      .map(([p, n]) => `  - ${p} (${nombresLargos[p] || p}): ${n}`)
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

CANDIDATOS DISTRITALES (${ubicacionUsuario}):
${candidatosDistContext}

INSTRUCCIONES:
1. Si la imagen muestra una tabla con PARTIDOS como filas y DISTRITOS como columnas:
   - Extrae los votos por partido para cada distrito visible.
   - Devuelve un JSON con "tipoDocumento": "tabla" y "table": {"headers": [...], "rows": [...]}.
   - Cada fila debe tener la clave del partido (FP, JP, etc.) mapeada a sus votos por distrito.

2. Si la imagen muestra una lista de CANDIDATOS con nombres y números:
   - Identifica a qué partido pertenece cada candidato usando la tabla de candidatos arriba.
   - Si el candidato aparece en la lista provincial, asigna sus votos a "provincial".
   - Si el candidato aparece en la lista distrital de ${ubicacionUsuario}, asigna sus votos a "distrital".
   - Devuelve un JSON con "tipoDocumento": "candidatos_votos" y "votos": {"provincial": {}, "distrital": {}}.

3. Si no reconoces el formato, extrae el texto estructurado igual.

REGLAS:
- Usa SOLO las claves de partido: FP, JP, SOMOS PERU, FREPAP, VERDE, MORADO.
- No inventes votos. Solo transcribe lo visible en la imagen.
- Devuelve ÚNICAMENTE JSON válido, sin explicaciones ni Markdown.
- No uses bloques \`\`\`json.

Responde únicamente con un objeto JSON.`;

    let response = null;
    let lastError = null;
    let selectedModel = "";

    // Models to try in order of preference (verified valid names for v1beta API)
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-002"
    ];

    for (const modelName of modelsToTry) {
      selectedModel = modelName;
      const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${appState.geminiApiKey}`;
      
      console.log("[Gemini API] Probando modelo:", modelName);

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ]
        })
      };

      try {
        response = await fetchWithRetry(endpointUrl, requestOptions, 3);
        console.log(`[Gemini API] Éxito con modelo: ${modelName}`);
        // If successful, exit model loop
        break;
      } catch (err) {
        console.warn(`[Gemini API] Falló el modelo ${modelName}:`, err.message);
        lastError = err;
        
        // Try next model if: not found (404), quota (429), or server overloaded (503)
        const shouldTryNext = 
          err.message.includes("404") ||
          err.message.includes("not found") ||
          err.message.includes("429") ||
          err.message.includes("503") ||
          err.message.includes("RESOURCE_EXHAUSTED") ||
          err.message.includes("UNAVAILABLE") ||
          err.message.includes("quota") ||
          err.message.includes("high demand");

        if (shouldTryNext) {
          let reason = 'no disponible';
          if (err.message.includes("429") || err.message.includes("quota")) reason = 'cuota agotada';
          else if (err.message.includes("503") || err.message.includes("UNAVAILABLE") || err.message.includes("high demand")) reason = 'servidor sobrecargado';
          else if (err.message.includes("404")) reason = 'no encontrado';
          console.log(`[Gemini API] Modelo ${modelName} (${reason}). Probando siguiente modelo...`);
          if (progressStatus) {
            progressStatus.innerHTML = `<span style="color: #f59e0b;">Modelo ${modelName} ${reason}, probando alternativa...</span>`;
          }
          continue;
        }
        // For auth or unexpected errors, stop trying
        break;
      }
    }

    if (!response) {
      throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini.");
    }

    const result = await response.json();
    console.log("Gemini Raw Response", result);

    let rawText = result.candidates[0].content.parts[0].text.trim();
    console.log("TEXTO DETECTADO (Raw):\n", rawText);

    let outputText = "";
    
    // Check if the response contains valid JSON
    let parsedJson = extractJsonFromString(rawText);
    let isJson = parsedJson !== null;

    if (isJson && parsedJson) {
      // If it already has tipoDocumento, keep it
      if (parsedJson.tipoDocumento) {
        outputText = JSON.stringify(parsedJson, null, 2);
      } else {
        // If it is JSON but lacks tipoDocumento, inject classification
        const textToClassify = JSON.stringify(parsedJson);
        const docType = autoDetectTipoDocumento(textToClassify);
        const structuredResult = {
          tipoDocumento: docType,
          ...parsedJson
        };
        outputText = JSON.stringify(structuredResult, null, 2);
      }
    } else {
      // It is plain text. Parse as before.
      const parsedTables = parseMarkdownTableToJSON(rawText);
      if (parsedTables && parsedTables.length > 0) {
        const structuredResult = {
          tipoDocumento: "tabla",
          columnas: parsedTables[0].columnas,
          filas: parsedTables[0].filas
        };
        outputText = JSON.stringify(structuredResult, null, 2);
      } else {
        const docType = autoDetectTipoDocumento(rawText);
        const structuredResult = {
          tipoDocumento: docType,
          textoExtraido: rawText
        };
        outputText = JSON.stringify(structuredResult, null, 2);
      }
    }

    return {
      rawText: outputText,
      preprocessedDataUrl: imageSrc
    };
  } catch (err) {
    console.error(`[Gemini Vision] Error al analizar la imagen ${imgIndex}:`, err);
    
    // Intelligent fallback response
    const errorFallback = {
      tipoDocumento: "error_temporal",
      mensaje: `Gemini temporalmente no disponible. Detalle: ${err.message || err}`
    };

    return {
      rawText: JSON.stringify(errorFallback, null, 2),
      preprocessedDataUrl: imageSrc
    };
  }
}

function preprocesarImagen(imageElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageElement.naturalWidth || imageElement.width;
  canvas.height = imageElement.naturalHeight || imageElement.height;
  
  ctx.drawImage(imageElement, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Step 1: Convert to grayscale and find min/max brightness values
  let minVal = 255;
  let maxVal = 0;
  const grayscale = new Uint8Array(data.length / 4);
  
  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale[i / 4] = brightness;
    if (brightness < minVal) minVal = brightness;
    if (brightness > maxVal) maxVal = brightness;
  }
  
  // Step 2: Apply adaptive hybrid thresholding (White background, Darker black ink)
  const range = maxVal - minVal || 1;
  const threshold = minVal + range * 0.60; // 60% threshold for paper vs ink separation
  
  for (let i = 0; i < data.length; i += 4) {
    const g = grayscale[i / 4];
    let val;
    if (g < threshold) {
      // Ink stroke: darken the stroke to make it stand out sharply (e.g. 50% darker)
      val = Math.max(0, g * 0.5);
    } else {
      // Paper background/shadows: push to absolute white
      val = 255;
    }
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

function convertConfusedTextToNumber(str) {
  // Remove brackets, parentheses, slashes, or vertical bars representing grid lines
  let clean = str.trim()
    .replace(/[\[\](){}|\\/_\-]/g, '')
    .trim();

  // Map common OCR handwritten / font confusions back to digits
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
  
  // Strip any remaining non-digits
  clean = clean.replace(/\D/g, '');
  return clean ? parseInt(clean) : NaN;
}

function procesarTextoOCR(text) {
  const lines = text.split('\n');
  let currentSection = 'provincial';
  
  let detected = {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0 }
  };

  // Step 1: Detect column ordering from header keywords (e.g. BREÑA | LIMA)
  let distritalColIndex = -1;
  let provincialColIndex = -1;

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const cleanLine = lines[i].toUpperCase().replace(/[\s\-_|]+/g, ' ').trim();
    if (!cleanLine) continue;

    // Check if line contains district name or local keywords
    const userDist = appState.currentUser ? appState.currentUser.ubicacion.toUpperCase() : 'ATE';
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
        console.log(`OCR Column Layout Detected: Distrital Index ${distritalColIndex}, Provincial Index ${provincialColIndex}`);
        break;
      }
    }
  }

  // Fallback: If no headers detected but lines contain 2 or more columns of numbers
  if (distritalColIndex === -1) {
    let twoNumLines = 0;
    lines.forEach(line => {
      // Find digit-like tokens or short OCR candidate number tokens
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
      // Default ballot layout: Column 1 is Local/Distrital, Column 2 is Metropolitana/Provincial
      distritalColIndex = 0;
      provincialColIndex = 1;
    }
  }

  // Step 2: Line by line extraction
  lines.forEach(line => {
    // Replace column separators with space to keep numbers distinct
    const cleanLine = line.toUpperCase().replace(/[|\-_:]+/g, ' ').trim();
    if (!cleanLine) return;

    // Detect section shift (useful for stacked single-column layouts)
    if (cleanLine.includes('METROPOLITANA') || cleanLine.includes('LIMA') || cleanLine.includes('PROVINCIAL') || cleanLine.includes('ALIAGA')) {
      currentSection = 'provincial';
    } else if (cleanLine.includes('DISTRITAL') || cleanLine.includes('LOCAL') || cleanLine.includes('VIDAL') || cleanLine.includes('AVANZA') || cleanLine.includes('ATE') || cleanLine.includes('BREÑA') || cleanLine.includes('BRENA')) {
      currentSection = 'distrital';
    }

    // Detect Voto Nulo, Vacio
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
          const val = numbers[0];
          detected[currentSection][matchedMetric] = val;
        }
      }
      return; // Skip party matching for this line
    }

    // Party recognition mapping (fully dynamic, lookup-based)
    const userDist = (typeof appState !== 'undefined' && appState.currentUser) ? appState.currentUser.ubicacion : 'ATE';
    let matchedParty = obtenerNombreRealPartido(cleanLine, userDist);

    if (matchedParty) {
      // Find numbers using column structure first (splitting by multiple spaces or separators)
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

      // Fallback: split by single spaces if no numbers were found using column layout
      if (numbers.length === 0) {
        let voteText = cleanLine;
        voteText = voteText.replace(matchedParty, ' ');
        const longName = PARTIDO_NOMBRES_LARGOS[matchedParty].toUpperCase();
        voteText = voteText.replace(longName, ' ');
        
        const candProv = (obtenerCandidatosPorUbicacion("Lima")[matchedParty] || "").toUpperCase();
        const candDist = (obtenerCandidatosPorUbicacion(appState.currentUser ? appState.currentUser.ubicacion : "ATE")[matchedParty] || "").toUpperCase();
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
          // Map to correct columns detected in Step 1
          const distVal = numbers[distritalColIndex];
          const provVal = numbers[provincialColIndex];
          if (distVal !== undefined && distVal >= 0 && distVal <= 999) {
            detected.distrital[matchedParty] = distVal;
          }
          if (provVal !== undefined && provVal >= 0 && provVal <= 999) {
            detected.provincial[matchedParty] = provVal;
          }
        } else {
          // Single number fallback: Check candidates name context to determine scope, or fall back to section
          let lineScope = currentSection;
          if (cleanLine.includes('ROMERO') || cleanLine.includes('GONZALO') || cleanLine.includes('ALEGRIA') || cleanLine.includes('FORSYTH') || cleanLine.includes('YURI') || cleanLine.includes('NESTOR')) {
            lineScope = 'provincial';
          } else if (cleanLine.includes('PATRICIA') || cleanLine.includes('PAREDES') || cleanLine.includes('CHAVEZ') || cleanLine.includes('VICTOR') || cleanLine.includes('ANA') || cleanLine.includes('SONIA') || cleanLine.includes('ROJAS')) {
            lineScope = 'distrital';
          }
          
          // Map the last found number to the detected scope, and default the other scope to 0 or same if appropriate
          const voteCount = numbers[numbers.length - 1];
          if (voteCount !== undefined && voteCount >= 2 && voteCount <= 999) {
            detected[lineScope][matchedParty] = voteCount;
          } else if (voteCount === 0 || voteCount === 1) {
            // Include zero/one votes specifically if read
            detected[lineScope][matchedParty] = voteCount;
          }
        }
      }
    }
  });

  return detected;
}
