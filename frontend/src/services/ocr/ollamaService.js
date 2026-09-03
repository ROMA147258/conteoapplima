import { obtenerCandidatosPorUbicacion, PARTIDO_NOMBRES_LARGOS } from '../../constants/distritos.js';
import { extractJsonFromString } from '../../utils/helpers.js';
import { apiPost } from '../api.js';

export const ollamaService = {
  async analyzeDocumentImage(imageSrc, district = 'Lima', options = {}) {
    const host = (options.ollamaHost || (typeof localStorage !== 'undefined' ? localStorage.getItem('votoReal_ollamaHost') : '') || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const model = (options.ollamaModel || (typeof localStorage !== 'undefined' ? localStorage.getItem('votoReal_ollamaModel') : '') || 'moondream:latest').trim();

    const cleanBase64 = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
    const mimeType = imageSrc.includes(';') ? (imageSrc.split(';')[0].split(':')[1] || 'image/jpeg') : 'image/jpeg';

    const defaultPrompt = `Eres un sistema experto de conteo electoral peruano (ONPE / JNE). Analiza esta imagen con máxima precisión y extrae los votos exactos por partido.

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
   - La columna con el distrito "${district}" (ej. BREÑA, ATE, LURÍN, etc.) o "DISTRITAL" corresponde a la sección Distrital.
   - Si la imagen muestra una matriz de múltiples columnas, lee cada valor numérico en su intersección fila/columna.

Devuelve ÚNICAMENTE un JSON válido sin Markdown ni explicaciones:
{
  "tipoDocumento": "acta_electoral",
  "votos": {
    "provincial": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 },
    "distrital": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 }
  },
  "tabla_completa": {
    "columnas": ["PARTIDO", "LIMA", "${district}"],
    "filas": [
      {"PARTIDO": "FP", "LIMA": 0, "${district}": 0}
    ]
  }
}`;

    const moondreamPrompt = `Lee con atención los nombres de partidos políticos y la cantidad de votos numéricos escritos en esta acta o tabla electoral.
Escribe cada partido y su número de votos en una línea separada con el formato:
PARTIDO: NUMERO_DE_VOTOS

Ejemplo:
SOMOS PERU: 30
RENOVACION POPULAR: 10
AVANZA PAIS: 7
PODEMOS PERU: 1
FREPAP: 17
JUNTOS POR EL PERU: 25
FUERZA POPULAR: 30
PPC: 91
VOTOS EN BLANCO: 0
VOTOS NULOS: 0`;

    // 1. Procesamiento prioritario a través del backend proxy (seguro y sin problemas CORS)
    try {
      const serverRes = await apiPost({
        action: 'procesar_acta_ocr',
        ollamaHost: host,
        ollamaModel: model,
        imageBase64: cleanBase64,
        mimeType: mimeType,
        prompt: defaultPrompt,
        distrito: district
      });

      if (serverRes && serverRes.success && serverRes.rawText) {
        const parsedJson = extractJsonFromString(serverRes.rawText);
        return {
          rawText: parsedJson ? JSON.stringify(parsedJson, null, 2) : serverRes.rawText,
          preprocessedDataUrl: imageSrc,
          model: serverRes.model || model,
          provider: 'ollama'
        };
      }
    } catch (backendErr) {
      console.warn('[OllamaService] Backend proxy falló o no disponible, intentando conexión directa:', backendErr.message);
    }

    // 2. Intento directo hacia Ollama local si backend no está disponible
    const modelsToTry = Array.from(new Set([
      model,
      model.includes(':') ? model.split(':')[0] : `${model}:latest`,
      'minicpm-v:latest',
      'moondream:latest',
      'moondream',
      'llama3.2-vision:latest',
      'llama3.2-vision',
      'llava:latest',
      'llava'
    ])).filter(Boolean);

    for (const targetModel of modelsToTry) {
      try {
        const isMoondream = targetModel.toLowerCase().includes('moondream');
        const activePrompt = isMoondream ? moondreamPrompt : defaultPrompt;
        const timeoutMs = (targetModel.includes('vision') || targetModel.includes('cpm') || targetModel.includes('11b')) ? 120000 : 45000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const bodyObj = {
          model: targetModel,
          prompt: activePrompt,
          images: [cleanBase64],
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 200,
            num_ctx: 2048,
            stop: ["\n\n\n", "TOTAL:", "---"]
          },
          keep_alive: '1m'
        };

        const ollamaRes = await fetch(`${host}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(bodyObj)
        });

        clearTimeout(timeoutId);

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          const rawText = data?.response?.trim() || '';
          const parsedJson = extractJsonFromString(rawText);

          return {
            rawText: parsedJson ? JSON.stringify(parsedJson, null, 2) : rawText,
            preprocessedDataUrl: imageSrc,
            model: targetModel,
            provider: 'ollama'
          };
        }
      } catch (err) {
        console.warn(`[OllamaService] Error con modelo directo ${targetModel}:`, err.message);
      }
    }

    return {
      rawText: JSON.stringify({
        tipoDocumento: "error_temporal",
        mensaje: `No se pudo conectar con Ollama (${host}). Por favor verifica que Ollama esté ejecutándose o ingresa los votos manualmente.`
      }, null, 2),
      preprocessedDataUrl: imageSrc
    };
  }
};
