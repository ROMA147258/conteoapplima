import { obtenerCandidatosPorUbicacion, PARTIDO_NOMBRES_LARGOS } from '../../constants/distritos.js';
import { extractJsonFromString } from '../../utils/helpers.js';
import { apiPost } from '../api/apiClient.js';

export const geminiService = {
  async analyzeDocumentImage(imageSrc, apiKey = null, currentDistrict = 'Lima') {
    const cleanBase64 = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
    const mimeType = imageSrc.includes(';') ? (imageSrc.split(';')[0].split(':')[1] || 'image/jpeg') : 'image/jpeg';

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
Los únicos partidos válidos son:
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
1. Extrae los votos por partido y métricas (NULOS, VACIOS).
2. Devuelve ÚNICAMENTE un JSON válido sin Markdown.`;

    // 1. Intentar procesamiento seguro a través del Backend (sin exponer API key)
    try {
      const serverRes = await apiPost({
        action: 'procesar_acta_ocr',
        imageBase64: cleanBase64,
        mimeType: mimeType,
        prompt: prompt,
        distrito: currentDistrict
      });

      if (serverRes && serverRes.success && serverRes.rawText) {
        const parsedJson = extractJsonFromString(serverRes.rawText);
        return {
          rawText: parsedJson ? JSON.stringify(parsedJson, null, 2) : serverRes.rawText,
          preprocessedDataUrl: imageSrc
        };
      }
    } catch (err) {
      console.warn('[GeminiService] Error procesando en backend, intentando fallback:', err);
    }

    // 2. Fallback cliente si se suministró apiKey explícita
    if (apiKey) {
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-002"
      ];

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
                    { inlineData: { mimeType, data: cleanBase64 } }
                  ]
                }
              ]
            })
          });

          if (response.ok) {
            const result = await response.json();
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            const parsedJson = extractJsonFromString(rawText);

            return {
              rawText: parsedJson ? JSON.stringify(parsedJson, null, 2) : rawText,
              preprocessedDataUrl: imageSrc
            };
          }
        } catch (err) {}
      }
    }

    return {
      rawText: JSON.stringify({
        tipoDocumento: "error_temporal",
        mensaje: "Reconocimiento automático no disponible. Por favor, digita los votos manualmente."
      }, null, 2),
      preprocessedDataUrl: imageSrc
    };
  }
};
