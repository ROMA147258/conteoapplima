import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Settings, Info, Cpu, CheckCircle2, XCircle, Loader2, RefreshCw, Eye, Zap, AlertTriangle } from 'lucide-react';
import { saveServerConfig, fetchOllamaModels, testOllamaConnection } from '../../services/api';

export const ConfigModal = () => {
  const { 
    isConfigModalOpen, 
    setIsConfigModalOpen, 
    apiUrl, 
    setApiUrl, 
    ollamaHost, 
    setOllamaHost,
    ollamaModel, 
    setOllamaModel,
    showToast 
  } = useApp();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [inputHost, setInputHost] = useState(ollamaHost || 'http://127.0.0.1:11434');
  const [inputModel, setInputModel] = useState(ollamaModel || 'moondream:latest');
  const [availableModels, setAvailableModels] = useState([]);
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState(null);

  // Cargar modelos disponibles al abrir el modal
  useEffect(() => {
    setInputUrl(apiUrl);
    const host = ollamaHost || 'http://127.0.0.1:11434';
    setInputHost(host);
    const currentM = ollamaModel || 'moondream:latest';
    setInputModel(currentM);
    setOllamaTestResult(null);

    if (isConfigModalOpen) {
      loadOllamaModels(host, currentM);
    }
  }, [apiUrl, ollamaHost, ollamaModel, isConfigModalOpen]);

  const loadOllamaModels = async (hostToTest, currentSelectedModel) => {
    try {
      const models = await fetchOllamaModels(hostToTest);
      if (models && models.length > 0) {
        setAvailableModels(models);

        // Si el modelo actual no está configurado o no tiene vision, autoseleccionar el mejor
        const hasCurrent = models.some(m => (typeof m === 'string' ? m : m.name) === currentSelectedModel);
        if (!hasCurrent) {
          const preferred = models.find(m => {
            const name = typeof m === 'string' ? m : m.name;
            return name.includes('moondream') || name.includes('llama3.2-vision') || (m.hasVision);
          });
          if (preferred) {
            setInputModel(typeof preferred === 'string' ? preferred : preferred.name);
          }
        }
      }
    } catch (e) {
      console.warn('[ConfigModal] No se pudieron auto-cargar los modelos de Ollama:', e.message);
    }
  };

  if (!isConfigModalOpen) return null;

  const handleTestOllama = async () => {
    setIsTestingOllama(true);
    setOllamaTestResult(null);
    try {
      const result = await testOllamaConnection(inputHost);
      setOllamaTestResult(result);

      if (result.success && result.models) {
        const rawModels = result.models.map(m => ({
          name: typeof m === 'string' ? m : m.name,
          hasVision: typeof m === 'string' 
            ? (m.includes('vision') || m.includes('moondream') || m.includes('llava'))
            : !!m.hasVision
        }));
        setAvailableModels(rawModels);

        const currentModelName = inputModel;
        const exists = rawModels.some(m => m.name === currentModelName);
        if (!exists && rawModels.length > 0) {
          const visionModel = rawModels.find(m => m.hasVision) || rawModels[0];
          setInputModel(visionModel.name);
        }
      }
    } catch (err) {
      setOllamaTestResult({
        success: false,
        message: `No se pudo conectar a ${inputHost}. Verifica que Ollama esté abierto en tu computadora.`
      });
    } finally {
      setIsTestingOllama(false);
    }
  };

  const handleSave = async () => {
    const configData = {
      apiUrl: inputUrl.trim(),
      ollamaHost: inputHost.trim(),
      ollamaModel: inputModel.trim()
    };

    try {
      await saveServerConfig(configData);
      setApiUrl(configData.apiUrl);
      setOllamaHost(configData.ollamaHost);
      setOllamaModel(configData.ollamaModel);

      localStorage.setItem('votoReal_ollamaHost', configData.ollamaHost);
      localStorage.setItem('votoReal_ollamaModel', configData.ollamaModel);

      showToast(`Configuración guardada: Modelo ${configData.ollamaModel} activo.`, 'success');
      setIsConfigModalOpen(false);
    } catch (err) {
      showToast('Error al guardar la configuración en el servidor.', 'error');
    }
  };

  // Helper para renderizar etiqueta del modelo
  const getModelLabel = (modelObj) => {
    const name = typeof modelObj === 'string' ? modelObj : modelObj.name;
    const isVision = typeof modelObj === 'object' ? modelObj.hasVision : (name.includes('vision') || name.includes('moondream') || name.includes('minicpm') || name.includes('llava'));

    if (name.includes('minicpm')) {
      return `🏆 ${name} — Máximo Rendimiento OCR (Recomendado)`;
    }
    if (name.includes('llama3.2-vision')) {
      return `🎯 ${name} — Alta Precisión`;
    }
    if (name.includes('moondream')) {
      return `⚡ ${name} — Ultra Rápido`;
    }
    if (isVision) {
      return `👁️ ${name} — Modelo de Visión`;
    }
    return `📝 ${name} (Solo Texto / No óptimo para fotos)`;
  };

  return createPortal(
    <div id="modal-config" className="modal active">
      <div className="modal-content glass" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h3>
            <Settings className="inline-icon" size={20} /> Configuración del Sistema y Ollama OCR
          </h3>
          <button id="btn-close-config" className="btn-icon-close" onClick={() => setIsConfigModalOpen(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="input-group">
            <label htmlFor="config-url" style={{ fontWeight: '600', fontSize: '0.88rem' }}>Endpoint API del Backend</label>
            <input
              type="text"
              id="config-url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="/api/voto-real"
            />
          </div>

          <div style={{ 
            background: 'rgba(37, 99, 235, 0.04)', 
            border: '1px solid rgba(37, 99, 235, 0.2)', 
            borderRadius: '10px', 
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={18} /> Motor OCR: Ollama Local (Offline / Privado)
              </span>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: isTestingOllama ? 'not-allowed' : 'pointer'
                }}
                onClick={handleTestOllama}
                disabled={isTestingOllama}
              >
                {isTestingOllama ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                {isTestingOllama ? 'Probando...' : 'Probar Conexión'}
              </button>
            </div>

            <div className="input-group">
              <label htmlFor="config-ollama-host" style={{ fontSize: '0.82rem', fontWeight: '600' }}>
                Servidor URL de Ollama
              </label>
              <input
                type="text"
                id="config-ollama-host"
                value={inputHost}
                onChange={(e) => setInputHost(e.target.value)}
                placeholder="http://127.0.0.1:11434"
              />
            </div>

            <div className="input-group">
              <label htmlFor="config-ollama-model" style={{ fontSize: '0.82rem', fontWeight: '600' }}>
                Modelo de Visión para Reconocimiento de Actas
              </label>
              {availableModels.length > 0 ? (
                <select
                  id="config-ollama-model"
                  value={inputModel}
                  onChange={(e) => setInputModel(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  {availableModels.map((m, idx) => {
                    const name = typeof m === 'string' ? m : m.name;
                    return (
                      <option key={idx} value={name}>
                        {getModelLabel(m)}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  id="config-ollama-model"
                  value={inputModel}
                  onChange={(e) => setInputModel(e.target.value)}
                  placeholder="moondream:latest o llama3.2-vision:latest"
                />
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span style={{ fontSize: '0.74rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  ⚡ <strong>moondream:latest</strong> (1.7GB): Escaneo veloz y ligero
                </span>
                <span style={{ fontSize: '0.74rem', background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ddd6fe' }}>
                  🎯 <strong>llama3.2-vision:latest</strong> (7.8GB): Máxima precisión en tablas
                </span>
              </div>
            </div>

            {ollamaTestResult && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                background: ollamaTestResult.success ? '#ecfdf5' : '#fef2f2',
                color: ollamaTestResult.success ? '#065f46' : '#991b1b',
                border: `1px solid ${ollamaTestResult.success ? '#a7f3d0' : '#fecaca'}`
              }}>
                {ollamaTestResult.success ? (
                  <CheckCircle2 size={18} style={{ marginTop: '1px', flexShrink: 0, color: '#10b981' }} />
                ) : (
                  <XCircle size={18} style={{ marginTop: '1px', flexShrink: 0, color: '#ef4444' }} />
                )}
                <div>
                  <strong>{ollamaTestResult.success ? 'Conexión Establecida' : 'Error de Conexión'}:</strong>
                  <p style={{ margin: '2px 0 0 0' }}>{ollamaTestResult.message}</p>
                </div>
              </div>
            )}
          </div>

          <div className="alert info-alert" style={{ margin: 0, padding: '10px 12px' }}>
            <Info className="alert-icon" size={16} />
            <p style={{ fontSize: '0.8rem', margin: 0 }}>
              <strong>100% Offline y Seguro:</strong> Las imágenes de las actas se procesan de forma local en tu computadora utilizando los modelos de inteligencia artificial en Ollama, sin enviar información fuera de tu red.
            </p>
          </div>
        </div>
        <div className="modal-footer" style={{ marginTop: '14px' }}>
          <button id="btn-save-config" className="btn btn-primary" onClick={handleSave}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
