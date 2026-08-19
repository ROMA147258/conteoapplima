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

    const defaultPrompt = prompt || `Eres un sistema de conteo electoral peruano. Analiza esta imagen de acta electoral para el distrito de ${distrito}. Extrae los votos por partido (FP, JP, SOMOS PERU, FREPAP, VERDE, MORADO) y las métricas (NULOS, VACIOS) tanto para la sección Provincial como Distrital. Devuelve ÚNICAMENTE un JSON válido sin formato Markdown adicional.`;

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
