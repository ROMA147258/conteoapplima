const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const env = require('../../../config/env');
const sqlConfigRepo = require('../../../infrastructure/repositories/SqlConfigRepository');

class ProcessOcrUseCase {
  /**
   * Procesa la imagen utilizando Google Gemini Vision
   */
  async processWithGemini({ imageBase64, mimeType = 'image/jpeg', prompt, apiKey }) {
    const key = apiKey || env.GEMINI_API_KEY || (sqlConfigRepo.getConfig()?.geminiApiKey);
    if (!key) return null;

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash'];

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
        console.warn(`[ProcessOcrUseCase] Intento fallido con modelo ${model}:`, e.message);
      }
    }
    return null;
  }

  async execute({ imageBase64, mimeType = 'image/jpeg', prompt, distrito = 'Lima', seccion = 'ambos', provider, apiKey, geminiApiKey }) {
    const cleanBase64 = (imageBase64 || '').includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const resolvedKey = geminiApiKey || apiKey || env.GEMINI_API_KEY || (sqlConfigRepo.getConfig()?.geminiApiKey) || '';

    const defaultJsonPrompt = prompt || `Eres un perito experto en escaneo de actas electorales peruanas (ONPE / JNE). Analiza esta imagen con precisión absoluta y extrae cada uno de los votos manuscritos o impresos para cada organización política.

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
   - ALIANZA REGIONAL: Sello/Símbolo (Estrella dorada / Sol ARP) | Partido (Alianza Regional por el Perú)
   - BLANCO: Fila de Votos en Blanco
   - NULOS: Fila de Votos Nulos / Viciados
   - IMPUGNADOS: Fila de Votos Impugnados

2. Extrae TODOS los partidos que figuren en la tabla o lista del acta. Si un partido no tiene votos visibles o está en blanco, asígnale 0.
3. Si el acta contiene 2 columnas (LIMA / PROVINCIAL y ${distrito} / DISTRITAL), extrae ambas en sus respectivos campos.
4. Si el acta es de una sola columna para ${seccion === 'distrital' ? 'DISTRITAL (' + distrito + ')' : 'LIMA METROPOLITANA (PROVINCIAL)'}, llena los votos en la sección correspondiente.

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
