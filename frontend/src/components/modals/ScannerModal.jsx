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
import { PartyLogo } from '../common/PartyLogo';
import { checkIsSuperAdmin } from '../../utils/helpers';

// Componente visual para cada slot de foto (Slot 1 / Slot 2)
const PhotoSlotCard = ({
  slotNumber,
  title,
  image,
  color = '#0284c7',
  isProcessing,
  isLocked,
  inputId,
  onFileChange,
  onRemove
}) => {
  return (
    <div
      style={{
        background: image ? '#ffffff' : '#f8fafc',
        border: image ? `1.5px solid ${color}` : '1.5px dashed #cbd5e1',
        borderRadius: '10px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: image ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: image ? color : '#475569' }}>
          {title}
        </span>
        {image && !isLocked && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={onRemove}
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '3px 6px',
              color: '#dc2626',
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
        <div style={{ position: 'relative', width: '100%', height: '95px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0', border: '1px solid #cbd5e1' }}>
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
                background: 'rgba(15, 23, 42, 0.85)',
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
            background: '#f1f5f9',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#475569',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: (isLocked || isProcessing) ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            padding: '6px'
          }}
        >
          <Camera size={22} color={color} style={{ opacity: 0.9 }} />
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
  const isCoord = Boolean(
    (currentUser?.rol || '').toLowerCase().includes('coordinador') ||
    (currentUser?.tipo_interfaz || '').includes('coordinador_') ||
    (currentUser?.tabla_origen || '').includes('rcoordinadores')
  );

  let activePersonero = null;
  try {
    activePersonero = JSON.parse(localStorage.getItem('votoReal_personero_activo') || 'null');
  } catch (e) {}

  const targetDni = (activePersonero?.dni || activePersonero?.DNI || currentUser?.dni || '').toString().trim();
  const userDistrict = activePersonero?.ubicacion || activePersonero?.distrito || currentUser?.ubicacion || 'BREÑA';

  // Bloqueo exclusivo de OCR (solo si este personero específico ya transmitió voto_imagen_enviado):
  const isLocked = !isSuperAdmin && (
    activePersonero
      ? Boolean(
          activePersonero.voto_imagen_enviado ||
          (typeof localStorage !== 'undefined' && localStorage.getItem(`votoReal_ocrLocked_${targetDni}`) === 'true')
        )
      : Boolean(
          (!isCoord && isHookOcrLocked) ||
          currentUser?.voto_imagen_enviado ||
          (typeof localStorage !== 'undefined' && localStorage.getItem(`votoReal_ocrLocked_${currentUser?.dni}`) === 'true')
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

  // Resetear fotos y votos cuando cambia el usuario (DNI) para aislamiento total entre cuentas
  useEffect(() => {
    setProvImages([null, null]);
    setDistImages([null, null]);
    setActiveStep('PROVINCIAL');
    setProvVotes(ocrVotes?.provincial ? { ...ocrVotes.provincial } : {});
    setDistVotes(ocrVotes?.distrital ? { ...ocrVotes.distrital } : {});
  }, [currentUser?.dni]);

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

    setProvImages([null, null]);
    setDistImages([null, null]);
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.2), 0 0 35px rgba(168, 85, 247, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header del Modal */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f3e8ff',
                border: '1px solid #d8b4fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7e22ce'
              }}
            >
              <ScanLine size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Escáner de Actas con IA <Sparkles size={14} color="#7e22ce" />
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontWeight: 500 }}>
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
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
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
            gap: '12px',
            background: '#ffffff'
          }}
        >
          {/* Banner de Bloqueo si ya fue transmitido */}
          {isLocked && (
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', borderRadius: '10px', padding: '10px 14px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒 <strong>ACTA BLOQUEADA:</strong> Los votos de esta mesa ya fueron transmitidos. No se permite reenviar ni modificar.</span>
            </div>
          )}

          {/* PESTAÑAS SEPARADAS: LIMA VS DISTRITAL */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '6px' }}>
            
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
                color: activeStep === 'PROVINCIAL' ? '#ffffff' : '#475569',
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
                color: activeStep === 'DISTRITAL' ? '#ffffff' : '#475569',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f5f3ff', border: '1px solid #c084fc', borderRadius: '10px' }}>
              <Loader2 size={20} className="animate-spin" color="#7c3aed" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#6b21a8' }}>
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
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={16} /> Actas de Lima Metropolitana (Máximo 2 fotos)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bae6fd', fontWeight: 700 }}>
                    {provCount} / 2 fotos cargadas
                  </span>
                </div>

                {/* Grid de 2 Slots de Fotos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <PhotoSlotCard
                    slotNumber={1}
                    title="Foto 1 (Hoja 1 / Principal)"
                    image={provImages[0]}
                    color="#0284c7"
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
                    color="#0284c7"
                    isProcessing={isProcessing}
                    isLocked={isLocked}
                    inputId="prov-slot-input-1"
                    onFileChange={(e) => handleProvSlotFile(e, 1)}
                    onRemove={() => handleRemoveProvImage(1)}
                  />
                </div>

              </div>

              {/* TABLA DE CANDIDATOS DE LIMA METROPOLITANA (SOLO LECTURA OCR) */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Table size={16} color="#0369a1" /> Votos Extraídos por Imagen: Lima Metropolitana
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                    Total: <strong style={{ color: '#0284c7' }}>{totalProv} votos</strong>
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
                          background: hasV ? '#f0fdf4' : '#ffffff',
                          border: hasV ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                          borderRadius: '8px',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '22px' }}>
                            #{c.num}
                          </span>
                          <PartyLogo partyKey={c.key} partyId={c.partyId} size={32} />
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.candidato}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7' }}>
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
                            border: hasV ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                            background: hasV ? '#dcfce7' : '#f8fafc',
                            color: hasV ? '#15803d' : '#64748b'
                          }}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  })}

                  {/* Votos Nulos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b91c1c' }}>❌ VOTOS NULOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f87171', background: '#fee2e2', color: '#b91c1c' }}>
                      {typeof provVotes.NULOS === 'object' ? (provVotes.NULOS?.votos ?? 0) : (provVotes.NULOS ?? 0)}
                    </div>
                  </div>

                  {/* Votos en Blanco */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569' }}>⚪ VOTOS EN BLANCO:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#0f172a' }}>
                      {typeof provVotes.BLANCO === 'object' ? (provVotes.BLANCO?.votos ?? 0) : (provVotes.BLANCO ?? 0)}
                    </div>
                  </div>

                  {/* Votos Impugnados */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309' }}>⚠️ VOTOS IMPUGNADOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: '#fef3c7', color: '#b45309' }}>
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
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7e22ce', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} /> Actas Distritales: {userDistrict} (Máximo 2 fotos)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#7e22ce', background: '#f3e8ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e9d5ff', fontWeight: 700 }}>
                    {distCount} / 2 fotos cargadas
                  </span>
                </div>

                {/* Grid de 2 Slots de Fotos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <PhotoSlotCard
                    slotNumber={1}
                    title="Foto 1 (Hoja 1 / Principal)"
                    image={distImages[0]}
                    color="#7c3aed"
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
                    color="#7c3aed"
                    isProcessing={isProcessing}
                    isLocked={isLocked}
                    inputId="dist-slot-input-1"
                    onFileChange={(e) => handleDistSlotFile(e, 1)}
                    onRemove={() => handleRemoveDistImage(1)}
                  />
                </div>

              </div>

              {/* TABLA DE CANDIDATOS DISTRITALES (SOLO LECTURA OCR) */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#7e22ce', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Table size={16} color="#7e22ce" /> Votos Extraídos por Imagen: {userDistrict}
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                    Total: <strong style={{ color: '#7e22ce' }}>{totalDist} votos</strong>
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
                          background: hasV ? '#f0fdf4' : '#ffffff',
                          border: hasV ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                          borderRadius: '8px',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '22px' }}>
                            #{c.num}
                          </span>
                          <PartyLogo partyKey={c.key} partyId={c.partyId} size={32} />
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.candidato}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#7e22ce' }}>
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
                            border: hasV ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                            background: hasV ? '#dcfce7' : '#f8fafc',
                            color: hasV ? '#15803d' : '#64748b'
                          }}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  })}

                  {/* Votos Nulos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b91c1c' }}>❌ VOTOS NULOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f87171', background: '#fee2e2', color: '#b91c1c' }}>
                      {typeof distVotes.NULOS === 'object' ? (distVotes.NULOS?.votos ?? 0) : (distVotes.NULOS ?? 0)}
                    </div>
                  </div>

                  {/* Votos en Blanco */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>⚪ VOTOS EN BLANCO:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#0f172a' }}>
                      {typeof distVotes.BLANCO === 'object' ? (distVotes.BLANCO?.votos ?? 0) : (distVotes.BLANCO ?? 0)}
                    </div>
                  </div>

                  {/* Votos Impugnados */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#b45309' }}>⚠️ VOTOS IMPUGNADOS:</span>
                    <div style={{ minWidth: '58px', textAlign: 'center', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: '#fef3c7', color: '#b45309' }}>
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
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
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
              background: (totalProv > 0 || totalDist > 0) ? 'linear-gradient(135deg, #10b981, #059669)' : '#cbd5e1',
              color: (totalProv > 0 || totalDist > 0) ? '#ffffff' : '#64748b',
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
