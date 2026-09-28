export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';
export const DEFAULT_API_URL = import.meta.env?.VITE_API_URL || `${API_BASE_URL}/voto-real`;

function getAuthHeaders() {
  const token = sessionStorage.getItem('votoReal_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchServerConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('[API Client] No se pudo cargar config del backend local:', e);
  }
  return null;
}

export async function saveServerConfig(configData) {
  const response = await fetch(`${API_BASE_URL}/save-config`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(configData)
  });
  if (!response.ok) {
    throw new Error('Error al guardar configuración en el servidor');
  }
  return await response.json();
}

export async function apiPost(data, customApiUrl = null) {
  const url = customApiUrl || DEFAULT_API_URL;
  const payload = { ...data };

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function serverLogout(customApiUrl = null) {
  try {
    const token = sessionStorage.getItem('votoReal_token');
    if (!token) return;
    const url = customApiUrl ? `${customApiUrl}?action=logout` : `${API_BASE_URL}/logout`;
    await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'logout' })
    });
  } catch (e) {
    console.warn('[API Client] Logout server aviso silencioso:', e);
  }
}

