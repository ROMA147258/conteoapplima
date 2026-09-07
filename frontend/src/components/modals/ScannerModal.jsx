import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useVotes } from '../../hooks/useVotes';
import { 
  ScanLine, 
  Building, 
  MapPin, 
  Trash2, 
  Loader2, 
  Table, 
  Camera, 
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { analizarImagenActa, procesarTextoOCR } from '../../services/ocrPipeline';
import { 
  obtenerListaCandidatosProvincial, 
  obtenerListaCandidatosDistrital 
} from '../../constants/distritos';
import { checkIsSuperAdmin } from '../../utils/helpers';

// Componente visual para cada slot de foto (Slot 1 / Slot 2)
const PhotoSlotCard = ({
  slotNumber,
  title,
  image,
  color = '#38bdf8',
  isProcessing,
  isLocked,
  inputId,
  onFileChange,
  onRemove
}) => {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: image ? `1px solid ${color}` : '1px dashed rgba(255, 255, 255, 0.18)',
        borderRadius: '10px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: image ? color : '#94a3b8' }}>
          {title}
        </span>
        {image && !isLocked && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={onRemove}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 6px',
              color: '#fca5a5',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Eliminar foto"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {image ? (
        <div style={{ position: 'relative', width: '100%', height: '95px', borderRadius: '8px', overflow: 'hidden', background: '#090d16' }}>
          <img
            src={image}
            alt={`Foto ${slotNumber}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {!isLocked && (
            <label
              htmlFor={inputId}
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                background: 'rgba(0, 0, 0, 0.85)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Camera size={11} /> Cambiar
            </label>
          )}
        </div>
      ) : (
        <label
          htmlFor={isLocked || isProcessing ? "" : inputId}
          style={{
            height: '95px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#94a3b8',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: (isLocked || isProcessing) ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            padding: '6px'
          }}
        >
          <Camera size={22} color={color} style={{ opacity: 0.8 }} />
          <span>Tomar / Subir Foto {slotNumber}</span>
        </label>
      )}

      <input
        type="file"
        id={inputId}
        accept="image/*"
        disabled={isLocked || isProcessing}
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
    </div>
  );
};

export const ScannerModal = () => {
  const { 
    isScannerModalOpen, 
    setIsScannerModalOpen, 
    currentUser, 
    setOcrVotes, 
    ocrVotes, 
    setOcrRawDetail, 
    showToast 
  } = useApp();

  const { transmitVotes, isTransmitting, isOcrLocked: isHookOcrLocked } = useVotes();

  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const userDistrict = currentUser?.ubicacion || 'BREÑA';
  const isLocked = !isSuperAdmin && (
    isHookOcrLocked ||
    Boolean(
      currentUser?.voto_imagen_enviado !== undefined
        ? currentUser.voto_imagen_enviado
        : (typeof localStorage !== 'undefined' && localStorage.getItem(`votoReal_ocrLocked_${currentUser?.dni}`) === 'true')
    )
  );

  // Pestaña activa: 'PROVINCIAL' (Lima) o 'DISTRITAL' (Distrito)
  const [activeStep, setActiveStep] = useState('PROVINCIAL');

  // Si ya se confirmaron votos previamente
  const hasSavedProv = ocrVotes?.provincial && Object.values(ocrVotes.provincial).some(v => Number(v) > 0);
  const hasSavedDist = ocrVotes?.distrital && Object.values(ocrVotes.distrital).some(v => Number(v) > 0);

  // Fotos Lima Metropolitana (Hasta 2 fotos: [Foto 1, Foto 2])
  const [provImages, setProvImages] = useState([null, null]);
  const [provVotes, setProvVotes] = useState(() => (hasSavedProv ? { ...ocrVotes.provincial } : {}));

  // Fotos Distrital (Hasta 2 fotos: [Foto 1, Foto 2])
  const [distImages, setDistImages] = useState([null, null]);
  const [distVotes, setDistVotes] = useState(() => (hasSavedDist ? { ...ocrVotes.distrital } : {}));

  // Sincronizar estado local al abrir el modal (sin sobrescribir hasta presionar Finalizar)
  useEffect(() => {
    if (isScannerModalOpen) {
      setProvVotes(ocrVotes?.provincial ? { ...ocrVotes.provincial } : {});
      setDistVotes(ocrVotes?.distrital ? { ...ocrVotes.distrital } : {});
    }
  }, [isScannerModalOpen, ocrVotes]);

  // Estado de escaneo
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');

  const provincialCandidates = obtenerListaCandidatosProvincial();
  const distritalCandidates = obtenerListaCandidatosDistrital(userDistrict);

  if (!isScannerModalOpen) return null;

  // Helper para convertir archivo a Base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  // Helper para combinar votos de actas de múltiples fotos
  const mergeVotes = (currentVotes, newVotes) => {
    const merged = { ...currentVotes };
    for (const [key, val] of Object.entries(newVotes || {})) {
      const num = Number(val) || 0;
      if (num > 0 || merged[key] === undefined) {
        merged[key] = num;
      }
    }
    return merged;
  };

  // Escaneo por lote con Gemini Vision - Inicia limpio desde {} para que al borrar una foto no queden votos fantasmas
  const scanBatchImages = async (base64List, seccion) => {
    const validImages = (base64List || []).filter(Boolean);
    const isProv = seccion === 'provincial';
    const label = isProv ? 'Lima Metropolitana' : `Distrital (${userDistrict})`;

    if (validImages.length === 0) {
      if (isProv) setProvVotes({});
      else setDistVotes({});
      return;
    }

    setIsProcessing(true);
    try {
      let freshVotes = {};
      let fullRaw = '';

      for (let i = 0; i < validImages.length; i++) {
        const img = validImages[i];
        const fotoNum = validImages.length > 1 ? `Foto ${i + 1} de ${validImages.length}` : 'Foto';
        setProcessingMsg(`Escaneando ${fotoNum} de ${label}...`);
        
        const result = await analizarImagenActa(img, {
          currentDistrict: userDistrict,
          seccion: seccion
        });

        const parsed = procesarTextoOCR(result.rawText, userDistrict);
        const detected = isProv
          ? ((parsed.provincial && Object.keys(parsed.provincial).length > 0) ? parsed.provincial : parsed.distrital || {})
          : ((parsed.distrital && Object.keys(parsed.distrital).length > 0) ? parsed.distrital : parsed.provincial || {});

        freshVotes = mergeVotes(freshVotes, detected);
        fullRaw += `\n=== ${isProv ? 'PROVINCIAL' : 'DISTRITAL'} (${fotoNum}) ===\n` + result.rawText;
      }

      if (isProv) {
        setProvVotes(freshVotes);
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + fullRaw);
      } else {
        setDistVotes(freshVotes);
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + fullRaw);
      }

      showToast(`¡Votos de ${label} extraídos por IA!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Error al escanear acta de ${label}.`, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  // Manejar subida masiva / múltiple de Lima (máx 2 fotos)
  const handleProvBatchFiles = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    e.target.value = '';

    if (fileList.length > 2) {
      showToast('Se seleccionaron las 2 primeras fotos (máximo 2 por sección).', 'info');
    }

    const selectedFiles = fileList.slice(0, 2);
    const base64List = await Promise.all(selectedFiles.map(readFileAsBase64));

    const updated = [...provImages];
    if (base64List.length === 1) {
      if (updated[0] && !updated[1]) {
        updated[1] = base64List[0];
      } else {
        updated[0] = base64List[0];
      }
    } else {
      updated[0] = base64List[0];
      updated[1] = base64List[1];
    }

    setProvImages(updated);
    await scanBatchImages(updated.filter(Boolean), 'provincial');
  };

  // Manejar subida por slot individual de Lima
  const handleProvSlotFile = async (e, slotIndex) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    e.target.value = '';

    const selectedFiles = fileList.slice(0, 2);
    const base64List = await Promise.all(selectedFiles.map(readFileAsBase64));

    const updated = [...provImages];
    if (base64List.length === 1) {
      updated[slotIndex] = base64List[0];
    } else {
      updated[0] = base64List[0];
      updated[1] = base64List[1];
    }

    setProvImages(updated);
    await scanBatchImages(updated.filter(Boolean), 'provincial');
  };

  // Eliminar foto de Lima y reescanear fotos restantes desde cero
  const handleRemoveProvImage = async (index) => {
    const updated = [...provImages];
    updated[index] = null;
    setProvImages(updated);

    const remaining = updated.filter(Boolean);
    if (remaining.length === 0) {
      setProvVotes({});
    } else {
      await scanBatchImages(remaining, 'provincial');
    }
    showToast(`Foto ${index + 1} de Lima Metropolitana eliminada.`, 'info');
  };

  // Manejar subida masiva / múltiple Distrital (máx 2 fotos)
  const handleDistBatchFiles = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    e.target.value = '';

    if (fileList.length > 2) {
      showToast('Se seleccionaron las 2 primeras fotos (máximo 2 por sección).', 'info');
    }

    const selectedFiles = fileList.slice(0, 2);
    const base64List = await Promise.all(selectedFiles.map(readFileAsBase64));

    const updated = [...distImages];
    if (base64List.length === 1) {
      if (updated[0] && !updated[1]) {
        updated[1] = base64List[0];
      } else {
        updated[0] = base64List[0];
      }
    } else {
      updated[0] = base64List[0];
      updated[1] = base64List[1];
    }

    setDistImages(updated);
    await scanBatchImages(updated.filter(Boolean), 'distrital');
  };

  // Manejar subida por slot individual Distrital
  const handleDistSlotFile = async (e, slotIndex) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    e.target.value = '';

    const selectedFiles = fileList.slice(0, 2);
    const base64List = await Promise.all(selectedFiles.map(readFileAsBase64));

    const updated = [...distImages];
    if (base64List.length === 1) {
      updated[slotIndex] = base64List[0];
    } else {
      updated[0] = base64List[0];
      updated[1] = base64List[1];
    }

    setDistImages(updated);
    await scanBatchImages(updated.filter(Boolean), 'distrital');
  };

  // Eliminar foto Distrital y reescanear fotos restantes desde cero
  const handleRemoveDistImage = async (index) => {
    const updated = [...distImages];
    updated[index] = null;
    setDistImages(updated);

    const remaining = updated.filter(Boolean);
    if (remaining.length === 0) {
      setDistVotes({});
    } else {
      await scanBatchImages(remaining, 'distrital');
    }
    showToast(`Foto ${index + 1} de ${userDistrict} eliminada.`, 'info');
  };

  // FINALIZAR CONTEO POR IMAGEN: Transmite los votos de IA a la base de datos
  const handleFinalizar = async () => {
    const payloadVotes = {
      provincial: { ...provVotes },
      distrital: { ...distVotes }
    };
    setOcrVotes(payloadVotes);

    const hasVotes = (totalProv + totalDist) > 0;

    if (hasVotes && (!isLocked || isSuperAdmin)) {
      const targetMesa = (
        currentUser?.mesa || 
        (typeof localStorage !== 'undefined' ? (localStorage.getItem('votoReal_mesa_activa') || localStorage.getItem(`votoReal_attMesa_${currentUser?.dni}`)) : '') || 
        ''
      ).trim();

      const targetColegio = (
        currentUser?.colegio || 
        (typeof localStorage !== 'undefined' ? (localStorage.getItem('votoReal_colegio_activo') || localStorage.getItem(`votoReal_attColegio_${currentUser?.dni}`)) : '') || 
        ''
      ).trim();

      if (targetMesa) {
        await transmitVotes(targetMesa, targetColegio, userDistrict, 'IMAGEN', payloadVotes);
      } else {
        showToast('✅ Conteo por imagen finalizado y guardado en la mesa.', 'success');
      }
    } else {
      showToast('✅ Conteo por imagen finalizado y guardado en la mesa.', 'success');
    }

    setIsScannerModalOpen(false);
  };

  const provCount = provImages.filter(Boolean).length;
  const distCount = distImages.filter(Boolean).length;

  const totalProv = Object.values(provVotes).reduce((a, b) => a + (typeof b === 'object' ? (Number(b?.votos) || 0) : (Number(b) || 0)), 0);
  const totalDist = Object.values(distVotes).reduce((a, b) => a + (typeof b === 'object' ? (Number(b?.votos) || 0) : (Number(b) || 0)), 0);

  return createPortal(
    <div
      className="modal-portal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '12px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing && !isTransmitting) {
          setIsScannerModalOpen(false);
        }
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(160deg, rgba(30, 27, 46, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(168, 85, 247, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header del Modal */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(124, 58, 237, 0.35))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc'
              }}
            >
              <ScanLine size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Escáner de Actas con IA <Sparkles size={14} color="#c084fc" />
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span>Lima Metropolitana (Máx. 2 fotos)</span>
                <span>•</span>
                <span>Distrital: {userDistrict} (Máx. 2 fotos)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing || isTransmitting}
            onClick={() => setIsScannerModalOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: (isProcessing || isTransmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Cerrar escáner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div
          style={{
            padding: '16px 18px',
            overflowY: 'auto',
            maxHeight: 'calc(94vh - 140px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Banner de Bloqueo si ya fue transmitido */}
          {isLocked && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒 <strong>ACTA BLOQUEADA:</strong> Los votos de esta mesa ya fueron transmitidos. No se permite reenviar ni modificar.</span>
            </div>
          )}

          {/* PESTAÑAS SEPARADAS: LIMA VS DISTRITAL */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '6px' }}>
            
            {/* Botón Pestaña 1: Lima */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => !isProcessing && setActiveStep('PROVINCIAL')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeStep === 'PROVINCIAL' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                color: activeStep === 'PROVINCIAL' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Building size={16} />
              <span>Lima Metropolitana {provCount > 0 && `(${provCount}/2)`}</span>
            </button>

            {/* Botón Pestaña 2: Distrital */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => !isProcessing && setActiveStep('DISTRITAL')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeStep === 'DISTRITAL' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'transparent',
                color: activeStep === 'DISTRITAL' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <MapPin size={16} />
              <span>{userDistrict} {distCount > 0 && `(${distCount}/2)`}</span>
            </button>
          </div>

          {/* Loader durante el análisis */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', borderRadius: '10px' }}>
              <Loader2 size={20} className="animate-spin" color="#c084fc" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                {processingMsg}
              </span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* VISTA 1: FOTOS Y TABLA DE LIMA METROPOLITANA (PROVINCIAL) */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {activeStep === 'PROVINCIAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* SLOTS DE FOTO PARA LIMA */}
              <div style={{
                background: 'rgba(2, 132, 199, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={16} /> Actas de Lima Metropolitana (Máximo 2 fotos)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    {provCount} / 2 fotos cargadas
                  </span>
                </div>

                {/* Grid de 2 Slots de Fotos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <PhotoSlotCard
                    slotNumber={1}
                    title="Foto 1 (Hoja 1 / Principal)"
                    image={provImages[0]}
                    color="#38bdf8"
                    isProcessing={isProcessing}
                    isLocked={isLocked}
                    inputId="prov-slot-input-0"
                    onFileChange={(e) => handleProvSlotFile(e, 0)}
                    onRemove={() => handleRemoveProvImage(0)}
                  />

                  <PhotoSlotCard
                    slotNumber={2}
                    title="Foto 2 (Hoja 2 / Opcional)"
                    image={provImages[1]}
                    color="#38bdf8"
                    isProcessing={isProcessing}
                    isLocked={isLocked}
                    inputId="prov-slot-input-1"
                    onFileChange={(e) => handleProvSlotFile(e, 1)}
                    onRemove={() => handleRemoveProvImage(1)}
                  />
                </div>

                {/* Botón de selección rápida para subir hasta 2 fotos a la vez */}
                {!isLocked && (
                  <label
                    htmlFor={isProcessing ? "" : "prov-batch-file-input"}
                    style={{
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      pointerEvents: isProcessing ? 'none' : 'auto',
                      opacity: isProcessing ? 0.45 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px dashed #38bdf8',
                      color: '#e0f2fe',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Camera size={16} color="#38bdf8" />
                    <span>{provCount === 0 ? '📷 Seleccionar hasta 2 fotos de Lima a la vez' : '📷 Cambiar / Reemplazar fotos de Lima (Máx. 2)'}</span>
                    <input
                      type="file"
                      id="prov-batch-file-input"
                      accept="image/*"
                      multiple
                      disabled={isProcessing}
                      style={{ display: 'none' }}
                      onChange={handleProvBatchFiles}
                    />
                  </label>
                )}
              </div>

              {/* TABLA DE CANDIDATOS DE LIMA METROPOLITANA (SOLO LECTURA OCR) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Table size={16} color="#38bdf8" /> Votos Extraídos por Imagen: Lima Metropolitana
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                    Total: <strong style={{ color: '#38bdf8' }}>{totalProv} votos</strong>
                  </span>
                </div>

                {/* Lista de Filas - Solo lectura */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {provincialCandidates.map(c => {
                    const rawVal = provVotes[c.key];
                    const val = typeof rawVal === 'object' ? (rawVal?.votos ?? 0) : (rawVal ?? 0);
                    const hasV = Number(val) > 0;
                    return (
                      <div
                        key={`prov-row-${c.key}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          background: hasV ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                          border: hasV ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '22px' }}>
                            #{c.num}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.candidato}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#38bdf8' }}>
                              {c.partyLong || c.organizacion}
                            </span>
                          </div>
                        </div>

                        {/* Valor de voto extraído por IA (Solo Lectura) */}
                        <div
                          style={{
                            minWidth: '58px',
                            textAlign: 'center',
                            padding: '5px 8px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border: hasV ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                            background: hasV ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.9)',
                            color: hasV ? '#38bdf8' : '#64748b'
                          }}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  })}

                  {/* Votos Nulos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fca5a5' }}>❌ VOTOS NULOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
                      {typeof provVotes.NULOS === 'object' ? (provVotes.NULOS?.votos ?? 0) : (provVotes.NULOS ?? 0)}
                    </div>
                  </div>

                  {/* Votos en Blanco */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#cbd5e1' }}>⚪ VOTOS EN BLANCO:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
                      {typeof provVotes.BLANCO === 'object' ? (provVotes.BLANCO?.votos ?? 0) : (provVotes.BLANCO ?? 0)}
                    </div>
                  </div>

                  {/* Votos Impugnados */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fcd34d' }}>⚠️ VOTOS IMPUGNADOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' }}>
                      {typeof provVotes.IMPUGNADOS === 'object' ? (provVotes.IMPUGNADOS?.votos ?? 0) : (provVotes.IMPUGNADOS ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* VISTA 2: FOTOS Y TABLA DISTRITAL */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {activeStep === 'DISTRITAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* SLOTS DE FOTO PARA DISTRITO */}
              <div style={{
                background: 'rgba(124, 58, 237, 0.06)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} /> Actas Distritales: {userDistrict} (Máximo 2 fotos)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    {distCount} / 2 fotos cargadas
                  </span>
                </div>

                {/* Grid de 2 Slots de Fotos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <PhotoSlotCard
                    slotNumber={1}
                    title="Foto 1 (Hoja 1 / Principal)"
                    image={distImages[0]}
                    color="#c084fc"
                    isProcessing={isProcessing}
                    isLocked={isLocked}
                    inputId="dist-slot-input-0"
                    onFileChange={(e) => handleDistSlotFile(e, 0)}
                    onRemove={() => handleRemoveDistImage(0)}
                  />

                  <PhotoSlotCard
                    slotNumber={2}
                    title="Foto 2 (Hoja 2 / Opcional)"
                    image={distImages[1]}
                    color="#c084fc"
                    isProcessing={isProcessing}
                    isLocked={isLocked}
                    inputId="dist-slot-input-1"
                    onFileChange={(e) => handleDistSlotFile(e, 1)}
                    onRemove={() => handleRemoveDistImage(1)}
                  />
                </div>

                {/* Botón de selección rápida para subir hasta 2 fotos a la vez */}
                {!isLocked && (
                  <label
                    htmlFor={isProcessing ? "" : "dist-batch-file-input"}
                    style={{
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      pointerEvents: isProcessing ? 'none' : 'auto',
                      opacity: isProcessing ? 0.45 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(168, 85, 247, 0.12)',
                      border: '1px dashed #c084fc',
                      color: '#f3e8ff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Camera size={16} color="#c084fc" />
                    <span>{distCount === 0 ? `📷 Seleccionar hasta 2 fotos de ${userDistrict} a la vez` : `📷 Cambiar / Reemplazar fotos de ${userDistrict} (Máx. 2)`}</span>
                    <input
                      type="file"
                      id="dist-batch-file-input"
                      accept="image/*"
                      multiple
                      disabled={isProcessing}
                      style={{ display: 'none' }}
                      onChange={handleDistBatchFiles}
                    />
                  </label>
                )}
              </div>

              {/* TABLA DE CANDIDATOS DISTRITALES (SOLO LECTURA OCR) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Table size={16} color="#c084fc" /> Votos Extraídos por Imagen: {userDistrict}
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                    Total: <strong style={{ color: '#c084fc' }}>{totalDist} votos</strong>
                  </span>
                </div>

                {/* Lista de Filas - Solo lectura */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {distritalCandidates.map(c => {
                    const rawVal = distVotes[c.key];
                    const val = typeof rawVal === 'object' ? (rawVal?.votos ?? 0) : (rawVal ?? 0);
                    const hasV = Number(val) > 0;
                    return (
                      <div
                        key={`dist-row-${c.key}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          background: hasV ? 'rgba(168, 85, 247, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                          border: hasV ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '22px' }}>
                            #{c.num}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.candidato}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#c084fc' }}>
                              {c.partyLong || c.organizacion}
                            </span>
                          </div>
                        </div>

                        {/* Valor de voto extraído por IA (Solo Lectura) */}
                        <div
                          style={{
                            minWidth: '58px',
                            textAlign: 'center',
                            padding: '5px 8px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border: hasV ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                            background: hasV ? 'rgba(168, 85, 247, 0.2)' : 'rgba(15, 23, 42, 0.9)',
                            color: hasV ? '#c084fc' : '#64748b'
                          }}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  })}

                  {/* Votos Nulos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fca5a5' }}>❌ VOTOS NULOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
                      {typeof distVotes.NULOS === 'object' ? (distVotes.NULOS?.votos ?? 0) : (distVotes.NULOS ?? 0)}
                    </div>
                  </div>

                  {/* Votos en Blanco */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1' }}>⚪ VOTOS EN BLANCO:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
                      {typeof distVotes.BLANCO === 'object' ? (distVotes.BLANCO?.votos ?? 0) : (distVotes.BLANCO ?? 0)}
                    </div>
                  </div>

                  {/* Votos Impugnados */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fcd34d' }}>⚠️ VOTOS IMPUGNADOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' }}>
                      {typeof distVotes.IMPUGNADOS === 'object' ? (distVotes.IMPUGNADOS?.votos ?? 0) : (distVotes.IMPUGNADOS ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Botón Finalizar */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            gap: '10px'
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            disabled={isProcessing || isTransmitting}
            onClick={() => !isProcessing && !isTransmitting && handleFinalizar()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              fontSize: '0.92rem',
              fontWeight: 800,
              borderRadius: '10px',
              background: (totalProv > 0 || totalDist > 0) ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
              cursor: (isProcessing || isTransmitting) ? 'not-allowed' : 'pointer',
              boxShadow: (totalProv > 0 || totalDist > 0) ? '0 4px 15px rgba(16, 185, 129, 0.35)' : 'none',
              opacity: (isProcessing || isTransmitting) ? 0.7 : 1
            }}
          >
            {isTransmitting ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <Check size={18} />
            )}
            <span>{isTransmitting ? 'Transmitiendo a Base de Datos...' : 'Finalizar Conteo por Imagen y Guardar'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
