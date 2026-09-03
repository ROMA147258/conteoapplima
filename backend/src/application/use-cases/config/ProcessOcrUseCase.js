const env = require('../../../config/env');
const sqlConfigRepo = require('../../../infrastructure/repositories/SqlConfigRepository');

class ProcessOcrUseCase {
  /**
   * Procesa la imagen utilizando Google Gemini Vision (gemini-2.5-flash)
   */
  async processWithGemini({ imageBase64, mimeType = 'image/jpeg', prompt, apiKey }) {
    const key = apiKey || env.GEMINI_API_KEY || (sqlConfigRepo.getConfig()?.geminiApiKey);
    if (!key) return null;

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(url, {
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
            return {
              success: true,
              rawText: text,
              provider: 'gemini',
              model: model
            };
          }
        }
      } catch (e) {
        console.warn(`[ProcessOcrUseCase] Error en Gemini Vision con modelo ${model}:`, e.message);
      }
    }
    return null;
  }

  async execute({ imageBase64, mimeType = 'image/jpeg', prompt, distrito = 'Lima', provider, apiKey, geminiApiKey }) {
    const cleanBase64 = (imageBase64 || '').includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const defaultJsonPrompt = prompt || `Eres un sistema experto de conteo electoral peruano (ONPE / JNE). Analiza esta imagen con máxima precisión y extrae los votos exactos por organización política.

ESTRUCTURA DE LA TABLA O ACTA ELECTORAL:
1. Partidos y Claves Válidas:
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
   - Columna "LIMA" / "PROVINCIAL" / "METROPOLITANA": Corresponde a la sección Provincial.
   - Columna con el distrito "${distrito}" / "DISTRITAL": Corresponde a la sección Distrital.
   - Lee minuciosamente los números de cada casilla.

Devuelve ÚNICAMENTE un JSON válido sin texto adicional ni markdown:
{
  "tipoDocumento": "acta_electoral",
  "votos": {
    "provincial": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 },
    "distrital": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 }
  }
}`;

    // 1. Intentar con Google Gemini Vision (gemini-2.5-flash)
    const geminiRes = await this.processWithGemini({
      imageBase64: cleanBase64,
      mimeType,
      prompt: defaultJsonPrompt,
      apiKey: geminiApiKey || apiKey || env.GEMINI_API_KEY
    });

    if (geminiRes && geminiRes.success) {
      return geminiRes;
    }

    return {
      success: false,
      rawText: JSON.stringify({
        tipoDocumento: "error_temporal",
        mensaje: "No se pudo procesar la imagen con Gemini. Verifica la conexión o ingresa los votos manualmente."
      }, null, 2)
    };
  }
}

module.exports = new ProcessOcrUseCase();
