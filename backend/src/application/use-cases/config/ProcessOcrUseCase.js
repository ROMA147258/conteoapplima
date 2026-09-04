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
        const timeoutId = setTimeout(() => controller.abort(), 40000);

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

  async execute({ imageBase64, mimeType = 'image/jpeg', prompt, distrito = 'Lima', seccion = 'ambos', provider, apiKey, geminiApiKey }) {
    const cleanBase64 = (imageBase64 || '').includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const resolvedKey = geminiApiKey || apiKey || env.GEMINI_API_KEY || (sqlConfigRepo.getConfig()?.geminiApiKey) || '';

    const defaultJsonPrompt = prompt || `Eres un perito experto en escaneo de actas electorales peruanas (ONPE / JNE). Analiza esta imagen con precisión absoluta y extrae cada uno de los votos manuscritos o impresos para cada organización política.

REGLAS CRÍTICAS DE EXTRACCIÓN:
1. Extrae TODOS los partidos que figuren en la tabla o lista del acta. No omitas ninguno.
2. Si un partido no tiene votos visibles o está en blanco, asígnale 0.
3. Claves de Partidos oficiales que debes usar:
   - SOMOS PERU (Somos Perú / Carlos Bruce)
   - RENOVACION (Renovación Popular / Rafael López Aliaga)
   - AHORA NACION (Ahora Nación / Susel Paredes)
   - AVANZA PAIS (Avanza País / Francis Allison)
   - PODEMOS (Podemos Perú / Daniel Urresti)
   - JP (Juntos por el Perú / Oswaldo Vargas)
   - OBRAS (Partido Cívico Obras / Ricardo Belmont)
   - FREPAP (FREPAP / Segundo Valdez)
   - ACCION POPULAR (Acción Popular / Carlos Tejada)
   - ESPERANZA (Frente de la Esperanza / Elizabeth León)
   - VENCEREMOS (Alianza Electoral Venceremos / Juan Alvarado)
   - VISION PERU (Visión Perú / Santiago Abarca)
   - APRA (Partido Aprista Peruano / Mónica Yaya)
   - FP (Fuerza Popular / Samuel Daza)
   - PPC (Partido Popular Cristiano / Edgardo de Pomar)
   - PROGRESEMOS (Progresemos / Luis Miguel Llanos)
   - MORADO (Partido Morado / Victoria La Cruz)
   - BUEN GOBIERNO (Partido del Buen Gobierno / Carlos Gallardo)
   - VERDE (Partido Demócrata Verde / Flor de María Hurtado)
   - PERU LIBRE (Perú Libre)
   - TIERRA VERDE (Tierra Verde)
   - PUEBLO CONSCIENTE (Pueblo Consciente)
   - PPP (Partido Patriótico del Perú)
   - INTEGRIDAD (Integridad Democrática)
   - FUERZA CIUDADANA (Fuerza Ciudadana)
   - BATALLA PERU (Batalla Perú)
   - APP (Alianza para el Progreso)
   - ALIANZA REGIONAL (Alianza Regional por el Perú)
   - BLANCO (Votos en Blanco)
   - NULOS (Votos Nulos)
   - IMPUGNADOS (Votos Impugnados)

4. Si el acta contiene 2 columnas (LIMA / PROVINCIAL y ${distrito} / DISTRITAL), extrae ambas en sus respectivos campos.
5. Si el acta es de una sola columna para ${seccion === 'distrital' ? 'DISTRITAL (' + distrito + ')' : 'LIMA METROPOLITANA (PROVINCIAL)'}, llena los votos en la sección correspondiente.

Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "tipoDocumento": "acta_electoral",
  "seccion": "${seccion}",
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
  },
  "total_provincial": 0,
  "total_distrital": 0
}`;

    // 1. Intentar con Google Gemini Vision (gemini-2.5-flash)
    const geminiRes = await this.processWithGemini({
      imageBase64: cleanBase64,
      mimeType,
      prompt: defaultJsonPrompt,
      apiKey: resolvedKey
    });

    if (geminiRes && geminiRes.success) {
      return geminiRes;
    }

    return {
      success: false,
      rawText: JSON.stringify({
        tipoDocumento: "error_temporal",
        mensaje: "No se pudo procesar el acta con Gemini Vision. Por favor verifica que la variable GEMINI_API_KEY esté configurada en el servidor (.env o variables de entorno del hosting) o ingresa la clave en Configuración."
      }, null, 2)
    };
  }
}

module.exports = new ProcessOcrUseCase();
