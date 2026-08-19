import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Settings, Info } from 'lucide-react';
import { saveServerConfig } from '../../services/api';

export const ConfigModal = () => {
  const { isConfigModalOpen, setIsConfigModalOpen, apiUrl, setApiUrl, geminiApiKey, setGeminiApiKey, showToast } = useApp();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [inputKey, setInputKey] = useState(geminiApiKey);

  useEffect(() => {
    setInputUrl(apiUrl);
    setInputKey(geminiApiKey);
  }, [apiUrl, geminiApiKey, isConfigModalOpen]);

  if (!isConfigModalOpen) return null;

  const handleSave = async () => {
    const configData = {
      apiUrl: inputUrl.trim(),
      geminiApiKey: inputKey.trim()
    };

    try {
      await saveServerConfig(configData);
      setApiUrl(configData.apiUrl);
      setGeminiApiKey(configData.geminiApiKey);

      localStorage.setItem('votoReal_geminiApiKey', configData.geminiApiKey);

      showToast('Configuración guardada correctamente.', 'success');
      setIsConfigModalOpen(false);
    } catch (err) {
      showToast('Error al guardar la configuración en el servidor.', 'error');
    }
  };

  return createPortal(
    <div id="modal-config" className="modal active">
      <div className="modal-content glass">
        <div className="modal-header">
          <h3>
            <Settings className="inline-icon" size={20} /> Configurar Servidor Backend
          </h3>
          <button id="btn-close-config" className="btn-icon-close" onClick={() => setIsConfigModalOpen(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="input-group">
            <label htmlFor="config-url">Endpoint API del Backend</label>
            <input
              type="text"
              id="config-url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="/api/voto-real"
            />
          </div>
          <div className="input-group">
            <label htmlFor="config-gemini-key">Clave de Servicio OCR Gemini (Opcional)</label>
            <input
              type="password"
              id="config-gemini-key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Clave de servicio óptico Gemini..."
            />
          </div>
          <div className="alert info-alert">
            <Info className="alert-icon" size={18} />
            <p>El frontend se comunica directamente con el servidor Backend Express y la base de datos SQL Server 2022.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button id="btn-save-config" className="btn btn-primary" onClick={handleSave}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


