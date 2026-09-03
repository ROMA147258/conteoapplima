export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';
export const DEFAULT_API_URL = import.meta.env?.VITE_API_URL || `${API_BASE_URL}/voto-real`;

export async function fetchServerConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/config`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('[API] No se pudo cargar config del backend local:', e);
  }
  return null;
}

export async function saveServerConfig(configData) {
  const response = await fetch(`${API_BASE_URL}/save-config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(configData)
  });
  if (!response.ok) {
    throw new Error('Error al guardar configuración en el servidor');
  }
  return await response.json();
}

export async function fetchOllamaModels(host = 'http://127.0.0.1:11434') {
  // 1. Intentar a través del backend proxy (evita bloqueos de CORS)
  try {
    const backendRes = await fetch(`${API_BASE_URL}/ocr/models?host=${encodeURIComponent(host)}`);
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data && data.success && data.models) {
        return data.models;
      }
    }
  } catch (e) {
    console.warn('[API] Falló fetchOllamaModels vía backend, intentando directo:', e.message);
  }

  // 2. Fallback: Conexión directa a Ollama
  try {
    const cleanHost = host.trim().replace(/\/$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${cleanHost}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return (data.models || []).map(m => {
        const hasVision = (m.capabilities && m.capabilities.includes('vision')) ||
          m.name.includes('vision') ||
          m.name.includes('moondream') ||
          m.name.includes('llava');
        return {
          name: m.name,
          size: m.size,
          hasVision
        };
      });
    }
  } catch (e) {
    console.warn('[API] Falló fetchOllamaModels directo:', e.message);
  }

  return [];
}

export async function testOllamaConnection(host = 'http://127.0.0.1:11434') {
  // 1. Intento vía backend proxy
  try {
    const backendRes = await fetch(`${API_BASE_URL}/ocr/test?host=${encodeURIComponent(host)}`);
    if (backendRes.ok) {
      return await backendRes.json();
    }
  } catch (e) {
    console.warn('[API] Falló testOllamaConnection vía backend:', e.message);
  }

  // 2. Fallback directo
  try {
    const cleanHost = host.trim().replace(/\/$/, '');
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${cleanHost}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      const models = (data.models || []).map(m => m.name);
      const visionModels = models.filter(m => m.includes('moondream') || m.includes('vision') || m.includes('llava'));
      return {
        success: true,
        host: cleanHost,
        latencyMs,
        models,
        visionModels,
        hasVision: visionModels.length > 0,
        message: `Conexión directa exitosa (${latencyMs}ms). ${models.length} modelos detectados.`
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `No se pudo conectar con ${host}. Asegúrate de que Ollama esté ejecutándose.`
    };
  }

  return {
    success: false,
    message: `No se pudo conectar a Ollama (${host}).`
  };
}

export async function apiPost(data, customApiUrl = null) {
  const url = customApiUrl || DEFAULT_API_URL;
  const payload = { ...data };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function apiGet(params = {}, customApiUrl = null) {
  const baseUrl = customApiUrl || DEFAULT_API_URL;
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.append(key, val);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
