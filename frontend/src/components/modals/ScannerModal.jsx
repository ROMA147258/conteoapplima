import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { ScanLine, ImagePlus, CheckCircle2, FileText, RefreshCw } from 'lucide-react';
import { analizarImagenGemini, procesarTextoOCR } from '../../services/ocrPipeline';

export const ScannerModal = () => {
  const { isScannerModalOpen, setIsScannerModalOpen, geminiApiKey, currentUser, setCurrentVotes, setOcrVotes, setOcrRawDetail, showToast } = useApp();

  const [images, setImages] = useState([]);
  const [progress, setProgress] = useState({ show: false, percentage: 0, status: '' });
  const [digitalizedVotes, setDigitalizedVotes] = useState(null);
  const [rawExtractedText, setRawExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  if (!isScannerModalOpen) return null;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = [];
    for (const file of files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
      newImages.push(base64);
    }

    setImages(newImages);
    processImages(newImages);
  };

  const processImages = async (imgList) => {
    if (imgList.length === 0) return;
    setIsProcessing(true);
    setProgress({ show: true, percentage: 10, status: 'Iniciando escáner...' });

    try {
      const userDist = currentUser ? currentUser.ubicacion : 'Lima';
      let combinedRawText = '';

      for (let i = 0; i < imgList.length; i++) {
        const step = Math.round(((i + 1) / imgList.length) * 80);
        setProgress({ show: true, percentage: 10 + step, status: `Analizando imagen ${i + 1}/${imgList.length}...` });
        
        const result = await analizarImagenGemini(imgList[i], geminiApiKey, userDist);
        combinedRawText += (combinedRawText ? '\n\n' : '') + result.rawText;
      }

      setProgress({ show: true, percentage: 95, status: 'Calculando votos...' });
      const parsedVotes = procesarTextoOCR(combinedRawText, userDist);

      setRawExtractedText(combinedRawText);
      setDigitalizedVotes(parsedVotes);
      setOcrRawDetail(combinedRawText);

      setProgress({ show: true, percentage: 100, status: '¡Procesamiento completo!' });
      showToast('Acta escaneada y procesada correctamente.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error durante el procesamiento del acta.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReparse = () => {
    if (!rawExtractedText.trim()) return;
    const userDist = currentUser ? currentUser.ubicacion : 'Lima';
    const recalculated = procesarTextoOCR(rawExtractedText, userDist);
    setDigitalizedVotes(recalculated);
    setOcrRawDetail(rawExtractedText);
    showToast('Votos re-calculados a partir del texto actual.', 'success');
  };

  const handleApplyVotes = () => {
    if (!digitalizedVotes) return;

    setCurrentVotes(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      Object.keys(digitalizedVotes.provincial || {}).forEach(k => {
        if (digitalizedVotes.provincial[k] !== undefined) {
          updated.provincial[k] = digitalizedVotes.provincial[k];
        }
      });
      Object.keys(digitalizedVotes.distrital || {}).forEach(k => {
        if (digitalizedVotes.distrital[k] !== undefined) {
          updated.distrital[k] = digitalizedVotes.distrital[k];
        }
      });
      return updated;
    });

    setOcrVotes(digitalizedVotes);

    showToast('Votos del escaneo aplicados exitosamente a la mesa.', 'success');
    setIsScannerModalOpen(false);
  };

  const clearAll = () => {
    setImages([]);
    setProgress({ show: false, percentage: 0, status: '' });
    setDigitalizedVotes(null);
    setRawExtractedText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return createPortal(
    <div id="modal-scanner" className="modal active">
      <div className="modal-content glass" style={{ maxWidth: 'min(94vw, 500px)', width: '100%' }}>
        <div className="modal-header">
          <h3>
            <ScanLine className="inline-icon" size={20} style={{ color: '#a855f7' }} /> Escáner de Acta
          </h3>
          <button id="btn-close-scanner" className="btn-icon-close" onClick={() => setIsScannerModalOpen(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p className="modal-desc">
            Sube o toma una foto del Acta electoral. Nuestro sistema analizará los números por capas para digitalizar los votos.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
            <label
              htmlFor="image-upload"
              id="upload-dropzone"
              style={{
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(168, 85, 247, 0.4)',
                borderRadius: '12px',
                padding: '25px 10px',
                background: 'rgba(168, 85, 247, 0.05)',
                transition: 'background 0.2s'
              }}
            >
              <ImagePlus size={40} color="#a855f7" style={{ marginBottom: '8px' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f1f5f9' }}>Tomar Foto / Subir Imágenes</span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>Selecciona una o más fotos de tus actas</span>
              <input
                type="file"
                id="image-upload"
                ref={fileInputRef}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>
          </div>

          {images.length > 0 && (
            <div id="scan-preview-container" style={{ display: 'flex', width: '100%', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Actas Cargadas:</label>
                <button
                  type="button"
                  id="btn-remove-photo"
                  onClick={clearAll}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    cursor: 'pointer'
                  }}
                >
                  Limpiar Todo
                </button>
              </div>
              <div
                id="scan-thumbnails-list"
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '4px 0 8px 0',
                  width: '100%',
                  scrollbarWidth: 'thin'
                }}
              >
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Acta ${idx + 1}`}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #a855f7' }}
                  />
                ))}
              </div>
            </div>
          )}

          {progress.show && (
            <div id="scan-progress-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 500 }}>
                <span id="scan-progress-status" style={{ color: '#a855f7' }}>{progress.status}</span>
                <span id="scan-progress-percentage" style={{ color: '#94a3b8' }}>{progress.percentage}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  id="scan-progress-bar"
                  style={{
                    width: `${progress.percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #a855f7 0%, #7c3aed 100%)',
                    transition: 'width 0.2s linear'
                  }}
                />
              </div>
            </div>
          )}

          {digitalizedVotes && (
            <div
              id="scan-results-scrollable"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '380px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}
            >
              <div
                id="scan-results-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  background: 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.82rem', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} color="#22c55e" />
                  <span>Votos Digitalizados</span>
                </h4>
                <div id="scan-results-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', marginTop: '4px' }}>
                  {Object.entries(digitalizedVotes.provincial || {}).map(([p, v]) => (
                    <div key={`p-${p}`} style={{ color: '#cbd5e1' }}>
                      <strong style={{ color: '#38bdf8' }}>Prov {p}:</strong> {v} votos
                    </div>
                  ))}
                  {Object.entries(digitalizedVotes.distrital || {}).map(([p, v]) => (
                    <div key={`d-${p}`} style={{ color: '#cbd5e1' }}>
                      <strong style={{ color: '#a855f7' }}>Dist {p}:</strong> {v} votos
                    </div>
                  ))}
                </div>
              </div>

              <div
                id="scan-raw-text-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  background: 'rgba(15, 23, 42, 0.4)'
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.78rem', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#a855f7" />
                  <span>Texto Extraído (Paso 1: Edita o corrige si es necesario)</span>
                </h4>
                <textarea
                  id="scan-raw-text-content"
                  value={rawExtractedText}
                  onChange={(e) => setRawExtractedText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    color: '#f1f5f9',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="El texto extraído aparecerá aquí..."
                />
                <button
                  type="button"
                  id="btn-reparse-text"
                  className="btn btn-secondary"
                  onClick={handleReparse}
                  style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                    background: 'rgba(168, 85, 247, 0.1)',
                    color: '#c084fc',
                    width: '100%',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Procesar Texto y Calcular Votos</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-apply-scan"
                className="btn btn-primary"
                onClick={handleApplyVotes}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  fontWeight: 700
                }}
              >
                Aplicar Votos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

