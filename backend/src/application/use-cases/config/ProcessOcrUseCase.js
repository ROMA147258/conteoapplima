const env = require('../../../config/env');

class ProcessOcrUseCase {
  async execute({ imageBase64, mimeType = 'image/jpeg', prompt, distrito = 'Lima' }) {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        rawText: JSON.stringify({
          tipoDocumento: "error_temporal",
          mensaje: "Reconocimiento automático no configurado en el servidor. Por favor, digita los votos manualmente."
        }, null, 2)
      };
    }

    const cleanBase64 = (imageBase64 || '').includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-002"
    ];

    const defaultPrompt = prompt || `Eres un sistema experto de conteo electoral peruano. Analiza esta imagen con máxima precisión y extrae los votos exactos por partido.

ESTRUCTURA DE LA TABLA O ACTA ELECTORAL:
1. Partidos válidos (usa exactamente estas claves):
   - FP = Fuerza Popular
   - JP = Juntos por el Perú
   - SOMOS PERU = Somos Perú
   - FREPAP = Frepap
   - VERDE = Partido Demócrata Verde / Verde
   - MORADO = Partido Morado
   - NULOS = Votos Nulos
   - BLANCO = Votos en Blanco
   - IMPUGNADOS = Votos Impugnados

2. Mapeo de Columnas:
   - La columna "LIMA" (o "PROVINCIAL") corresponde a la sección Provincial.
   - La columna con el distrito "${distrito}" (ej. BREÑA, ATE, LURÍN, etc.) o "DISTRITAL" corresponde a la sección Distrital.
   - Si la imagen muestra una matriz de múltiples columnas (ej. BREÑA, LIMA, ATE, LURIN), lee cada valor numérico en su intersección fila/columna.

Devuelve ÚNICAMENTE un JSON válido sin Markdown ni explicaciones:
{
  "tipoDocumento": "acta_electoral",
  "votos": {
    "provincial": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 },
    "distrital": { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "BLANCO": 0, "NULOS": 0, "IMPUGNADOS": 0 }
  },
  "tabla_completa": {
    "columnas": ["PARTIDO", "LIMA", "${distrito}"],
    "filas": [
      {"PARTIDO": "FP", "LIMA": 0, "${distrito}": 0}
    ]
  }
}`;

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
                  { text: defaultPrompt },
                  { inlineData: { mimeType, data: cleanBase64 } }
                ]
              }
            ]
          })
        });

        if (response.ok) {
          const result = await response.json();
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          return {
            success: true,
            rawText: rawText
          };
        }
      } catch (err) {
        console.warn(`[ProcessOcrUseCase] Error con modelo ${modelName}:`, err.message);
      }
    }

    return {
      success: false,
      rawText: JSON.stringify({
        tipoDocumento: "error_temporal",
        mensaje: "No se pudo procesar la imagen del acta con el motor OCR. Por favor ingresa los votos manualmente."
      }, null, 2)
    };
  }
}

module.exports = new ProcessOcrUseCase();
