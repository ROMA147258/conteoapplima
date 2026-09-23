import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useCoordinator } from '../../hooks/useCoordinator';
import { useVotes } from '../../hooks/useVotes';
import { obtenerMesasOficialesColegio } from '../../constants/localesMesasLima';
import { isAsistencia3pmEnabled } from '../../utils/helpers';
import { ManualCountingModal } from '../../components/modals/ManualCountingModal';
import { 
  obtenerCandidatosPorUbicacion, 
  obtenerAlcaldeActual 
} from '../../constants/distritos';
import { 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  Search, 
  School, 
  UserCheck, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  User,
  Phone,
  Building2,
  Camera,
  Image as ImageIcon,
  Maximize2,
  X,
  Lock,
  Eye,
  FileCheck2,
  Sparkles,
  ClipboardList,
  ScanLine
} from 'lucide-react';

export const CoordinatorView = () => {
  const { currentUser, logout, showToast, setIsScannerModalOpen, setCurrentView } = useApp();
  const {
    personeros,
    setPersoneros,
    infoColegios,
    coordinadoresLocales,
    coordinadoresZonales,
    asistencias,
    confirmacionesCoord,
    isLoading,
    fetchCoordinatorData,
    confirmPersoneroDirect
  } = useCoordinator();

  const {
    currentVotes,
    handleVoteChange,
    transmitVotes,
    isTransmitting
  } = useVotes();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMesaForCounting, setSelectedMesaForCounting] = useState('');
  const [selectedColegioForCounting, setSelectedColegioForCounting] = useState('');
  const [selectedPersoneroForCounting, setSelectedPersoneroForCounting] = useState(null);

  const candidatosProvincial = obtenerCandidatosPorUbicacion('Lima');
  const candidatosDistrital = obtenerCandidatosPorUbicacion(currentUser?.ubicacion || 'Lima');
  const alcaldeProvincial = obtenerAlcaldeActual('Lima');
  const alcaldeDistrital = obtenerAlcaldeActual(currentUser?.ubicacion || 'Lima');
  
  const [selectedColegio, setSelectedColegio] = useState(null);
  const [selectedZonalFilter, setSelectedZonalFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchGeneralFotos, setSearchGeneralFotos] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'PENDING'
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null); // { personero, fotoUrl, hora }

  // Normalizador de texto
  const norm = (s) => (s || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Comparador inteligente de nombres de colegios
  const matchColegio = (colA, colB) => {
    if (!colA || !colB) return false;
    const cleanA = norm(colA);
    const cleanB = norm(colB);
    if (!cleanA || !cleanB) return false;
    if (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

    // Comparar números identificadores (ej: 6069, 7054, 6014, 525, etc.)
    const numA = cleanA.match(/\b\d+\b/g);
    const numB = cleanB.match(/\b\d+\b/g);
    if (numA && numB) {
      const commonNum = numA.filter(n => numB.includes(n));
      if (commonNum.length > 0) return true;
    }

    // Comparar palabras significativas (> 3 letras)
    const ignore = ['colegio', 'escuela', 'institucion', 'educativa', 'primaria', 'secundaria', 'inicial', 'sede', 'parroquial'];
    const tokA = cleanA.split(' ').filter(t => t.length > 3 && !ignore.includes(t));
    const tokB = cleanB.split(' ').filter(t => t.length > 3 && !ignore.includes(t));
    if (tokA.length > 0 && tokB.length > 0) {
      const commonTok = tokA.filter(t => tokB.includes(t));
      if (commonTok.length >= 2 || (tokA.length === 1 && commonTok.length === 1) || (tokB.length === 1 && commonTok.length === 1)) {
        return true;
      }
    }
    return false;
  };

  // 1. Detección precisa de rol: Coordinador Distrital vs Coordinador Zonal vs Personero de Centro de Votación (Coordinador Local)
  const tablaOrigen = (currentUser?.tabla_origen || currentUser?.origenHoja || '').toString().toLowerCase();
  const rolUser = (currentUser?.rol || '').toString().toLowerCase();
  const tipoInterfaz = (currentUser?.tipo_interfaz || '').toString().toLowerCase();
  const userDni = (currentUser?.dni || '').toString().trim();

  // Validación de distrito (Villa María del Triunfo vs Otros Distritos)
  const ubNormZonal = norm(currentUser?.ubicacion || currentUser?.distrito || '');
  const isVMT = ubNormZonal.includes('villa maria del triunfo') || ubNormZonal.includes('vmt');
  const isVMTZonal = isVMT;

  const isCoordinadorDistrital = tipoInterfaz === 'coordinador_distrital' || tablaOrigen === 'rcoordinadoresd' || rolUser.includes('distrital') || userDni === '43310677';
  const isCoordinadorLocal = (tipoInterfaz === 'coordinador_local' || tablaOrigen === 'rcoordinadores' || rolUser.includes('local')) && !isCoordinadorDistrital;
  const isCoordinadorZonal = isVMT && !isCoordinadorLocal && !isCoordinadorDistrital;

  const [activeDistrictTab, setActiveDistrictTab] = useState(() => (isCoordinadorDistrital && isVMT) ? 'ZONALES' : 'COLEGIOS');
  const [activeSchoolTab, setActiveSchoolTab] = useState('ASISTENCIA');

  const handleSelectColegio = (colName) => {
    setSelectedColegio(colName);
    setActiveSchoolTab('ASISTENCIA');
    setSearchTerm('');
    setActiveFilter('ALL');
  };

  // Verificación de horario para Asistencia (3:00 PM)
  const isAsistenciaHabilitada = isAsistencia3pmEnabled(currentUser);

  // 2. Extraer la lista total de colegios del distrito y los asignados
  const todosColegiosDistrito = useMemo(() => {
    const setCol = new Set();
    (infoColegios || []).forEach(ic => { if (ic.colegio) setCol.add(ic.colegio.trim()); });
    (coordinadoresLocales || []).forEach(cl => { if (cl.colegio) setCol.add(cl.colegio.trim()); });
    (coordinadoresZonales || []).forEach(cz => {
      const raw = cz.colegios || cz.colegio || '';
      raw.split(',').forEach(c => { if (c.trim()) setCol.add(c.trim()); });
    });
    (personeros || []).forEach(p => { if (p.colegio) setCol.add(p.colegio.trim()); });
    return Array.from(setCol).sort();
  }, [infoColegios, personeros, coordinadoresLocales, coordinadoresZonales]);

  const colegiosAsignados = useMemo(() => {
    if (isCoordinadorDistrital) {
      if (selectedZonalFilter) {
        const foundZonal = (coordinadoresZonales || []).find(z => (z.dni || '').toString().trim() === selectedZonalFilter.trim());
        if (foundZonal) {
          const raw = foundZonal.colegios || foundZonal.colegio || '';
          return raw.split(',').map(c => c.trim()).filter(Boolean);
        }
      }
      return todosColegiosDistrito;
    }

    // Coordinador Zonal: Por rangos (solo sus colegios asignados a su zona)
    if (isCoordinadorZonal) {
      const myDni = (currentUser?.dni || '').toString().trim();
      const foundZonal = (coordinadoresZonales || []).find(z => (z.dni || '').toString().trim() === myDni);
      const rawCol = foundZonal?.colegios || foundZonal?.colegio || currentUser?.colegios || currentUser?.colegio || currentUser?.local || '';
      if (!rawCol || rawCol.toLowerCase() === 'no aplica') return [];
      return rawCol
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);
    }

    // Coordinador Local: Solo su colegio
    const rawCol = currentUser?.colegio || currentUser?.local || '';
    if (!rawCol || rawCol.toLowerCase() === 'no aplica') return [];
    return rawCol
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }, [currentUser, isCoordinadorDistrital, isCoordinadorZonal, selectedZonalFilter, coordinadoresZonales, todosColegiosDistrito]);

  // Helper para identificar el Coordinador Zonal a cargo de un colegio
  const getZonalDeColegio = (colNombre) => {
    return (coordinadoresZonales || []).find(z => {
      const raw = z.colegios || z.colegio || '';
      return raw.split(',').some(c => matchColegio(c, colNombre));
    });
  };

  // Si es Personero de Centro de Votación, seleccionar su único colegio automáticamente
  useEffect(() => {
    if (isCoordinadorLocal && colegiosAsignados.length > 0 && !selectedColegio) {
      setSelectedColegio(colegiosAsignados[0]);
    }
  }, [isCoordinadorLocal, colegiosAsignados, selectedColegio]);

  // 3. Helper de obtención de Foto de Instalación de Mesa
  const getPersoneroPhoto = (p) => {
    if (p?.foto_url && typeof p.foto_url === 'string' && p.foto_url.trim().length > 10) {
      return p.foto_url;
    }
    const pDni = (p?.dni || p?.DNI || '').toString().trim();
    if (!pDni) return null;
    const asis = asistencias.find(a => (a.dni || '').toString().trim() === pDni && a.foto_url);
    if (asis?.foto_url && asis.foto_url.trim().length > 10) {
      return asis.foto_url;
    }
    return null;
  };

  // Helper de hora de instalación
  const getPersoneroInstalacionTime = (p) => {
    const pDni = (p?.dni || p?.DNI || '').toString().trim();
    if (pDni) {
      const asis = asistencias.find(a => (a.dni || '').toString().trim() === pDni && a.fecha_hora);
      if (asis?.fecha_hora) {
        return new Date(asis.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    if (p?.fecha_llegada) {
      return new Date(p.fecha_llegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  };

  // 4. Helper de estado de llegada
  const checkLlegada = (p) => {
    const pDni = (p.dni || p.DNI || '').toString().trim();
    if (p.ha_llegado || p.estado_llegada === 'LLEGADA_GPS' || p.estado_llegada === 'LLEGADA_FOTO') {
      return { 
        llegado: true, 
        hora: p.fecha_llegada ? new Date(p.fecha_llegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        metodo: p.estado_llegada === 'LLEGADA_GPS' ? 'GPS' : 'FOTO'
      };
    }
    const asis = asistencias.find(a => (a.dni || '').toString().trim() === pDni);
    if (asis) {
      return {
        llegado: true,
        hora: asis.fecha_hora ? new Date(asis.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        metodo: asis.ubicacion_gps ? 'GPS' : 'FOTO'
      };
    }
    return { llegado: false, hora: '', metodo: '' };
  };

  // Asistencia marcada por el Coordinador Local o Personero
  const isMarcadoPorCoord = (p) => {
    const pDni = (p?.dni || p?.DNI || '').toString().trim();
    return Boolean(
      p?.confirmado_coordinador || 
      p?.asistencia_confirmada ||
      confirmacionesCoord.some(c => (c.personero_dni || '').toString().trim() === pDni) ||
      asistencias.some(a => (a.dni || '').toString().trim() === pDni)
    );
  };

  // Helper para recopilar y unificar TODAS las fotos registradas en el distrito (1 sola foto por personero)
  const todasLasFotosDistrito = useMemo(() => {
    const mapFotos = new Map();

    // 1. De asistencias (fuente primaria de fotos de llegada/instalación registradas)
    (asistencias || []).forEach(a => {
      const url = a.foto_url || a.foto || a.fotoUrl || '';
      if (url && typeof url === 'string' && url.trim().length > 10) {
        const dni = (a.dni || '').toString().trim();
        const foundP = personeros.find(p => (p.dni || p.DNI || '').toString().trim() === dni);
        const foundCL = coordinadoresLocales.find(c => (c.dni || '').toString().trim() === dni);
        const foundCZ = coordinadoresZonales.find(c => (c.dni || '').toString().trim() === dni);

        const nombre = a.nombre || foundP?.nombre || foundCL?.nombre || foundCZ?.nombre || 'Personero / Coordinador';
        const colegio = a.colegio || a.local || foundP?.colegio || foundCL?.colegio || foundCZ?.colegio || '';
        const mesa = a.mesa || foundP?.mesa || 'No aplica';
        const hora = a.fecha_hora ? new Date(a.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const key = dni || `${a.mesa || ''}_${url.slice(-25)}`;

        mapFotos.set(key, {
          dni,
          nombre,
          colegio,
          mesa,
          hora,
          fotoUrl: url,
          raw: a
        });
      }
    });

    // 2. De personeros que tengan foto_url directa
    (personeros || []).forEach(p => {
      const url = getPersoneroPhoto(p);
      if (url && typeof url === 'string' && url.trim().length > 10) {
        const dni = (p.dni || p.DNI || '').toString().trim();
        const key = dni || `${p.mesa || ''}_${url.slice(-25)}`;
        if (!mapFotos.has(key)) {
          const hora = getPersoneroInstalacionTime(p) || '';
          mapFotos.set(key, {
            dni,
            nombre: p.nombre,
            colegio: p.colegio || '',
            mesa: p.mesa || 'S/M',
            hora,
            fotoUrl: url,
            raw: p
          });
        }
      }
    });

    // 3. De confirmaciones de coordinador que tengan foto
    (confirmacionesCoord || []).forEach(c => {
      const url = c.foto_url || c.fotoBase64 || '';
      if (url && typeof url === 'string' && url.trim().length > 10) {
        const dni = (c.personero_dni || '').toString().trim();
        const key = dni ? `coord_${dni}` : `coord_${url.slice(-25)}`;
        if (!mapFotos.has(key)) {
          mapFotos.set(key, {
            dni,
            nombre: c.personero_nombre || 'Personero',
            colegio: c.local || '',
            mesa: 'Verificación',
            hora: c.fecha_hora ? new Date(c.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            fotoUrl: url,
            raw: c
          });
        }
      }
    });

    return Array.from(mapFotos.values());
  }, [asistencias, personeros, coordinadoresLocales, coordinadoresZonales, confirmacionesCoord]);

  // Filtro de Búsqueda para el Reporte General de Fotos
  const filteredTodasLasFotos = useMemo(() => {
    if (!searchGeneralFotos.trim()) return todasLasFotosDistrito;
    const q = searchGeneralFotos.toLowerCase().trim();
    return todasLasFotosDistrito.filter(item => {
      const n = (item.nombre || '').toLowerCase();
      const d = (item.dni || '').toString();
      const m = (item.mesa || '').toString().toLowerCase();
      const c = (item.colegio || '').toLowerCase();
      return n.includes(q) || d.includes(q) || m.includes(q) || c.includes(q);
    });
  }, [todasLasFotosDistrito, searchGeneralFotos]);

  // 5. Resumen por colegio
  const getColegioStats = (colNombre) => {
    const colInfo = (infoColegios || []).find(ic => matchColegio(ic.colegio, colNombre));
    const personerosCol = personeros.filter(p => matchColegio(p.colegio, colNombre));

    const totalMesasOficial = obtenerMesasOficialesColegio(colNombre) || (colInfo?.num_mesas ? parseInt(colInfo.num_mesas, 10) : 0);
    const totalMesas = totalMesasOficial > 0 ? totalMesasOficial : Math.max(personerosCol.length, 1);
    const totalPersoneros = personerosCol.length;

    const asistieronValidados = personerosCol.filter(p => isMarcadoPorCoord(p)).length;
    const faltan = Math.max(0, totalMesas - asistieronValidados);
    const faltanPersoneros = Math.max(0, totalPersoneros - asistieronValidados);

    // Fotos de este colegio
    const fotosCol = todasLasFotosDistrito.filter(item => matchColegio(item.colegio, colNombre));
    const conFoto = fotosCol.length;
    const faltanFotos = Math.max(0, totalMesas - conFoto);

    const coordLocal = (coordinadoresLocales || []).find(c => matchColegio(c.colegio, colNombre));

    const porcentaje = totalMesas > 0 ? Math.min(100, Math.round((asistieronValidados / totalMesas) * 100)) : 0;
    const porcentajePersoneros = totalMesas > 0 ? Math.min(100, Math.round((totalPersoneros / totalMesas) * 100)) : 0;
    const porcentajeAsistencia = totalMesas > 0 ? Math.min(100, Math.round((asistieronValidados / totalMesas) * 100)) : 0;
    const porcentajeFotos = totalMesas > 0 ? Math.min(100, Math.round((conFoto / totalMesas) * 100)) : 0;
    const isCompleto = totalMesas > 0 && asistieronValidados >= totalMesas;

    return {
      totalMesas,
      totalPersoneros,
      asistieronValidados,
      faltan,
      faltanPersoneros,
      conFoto,
      faltanFotos,
      porcentaje,
      porcentajePersoneros,
      porcentajeAsistencia,
      porcentajeFotos,
      isCompleto,
      coordLocal,
      personerosCol,
      direccion: colInfo?.direccion || ''
    };
  };

  // 6. Totales Globales para Coordinador Distrital / Zonal
  const statsGlobales = useMemo(() => {
    let mesasTotales = 0;
    for (const colName of colegiosAsignados) {
      const st = getColegioStats(colName);
      mesasTotales += st.totalMesas;
    }

    // Personeros únicos validados en el distrito
    const dnisValidados = new Set();
    personeros.forEach(p => {
      const pDni = (p.dni || p.DNI || '').toString().trim();
      if (isMarcadoPorCoord(p)) dnisValidados.add(pDni);
    });
    asistencias.forEach(a => {
      const aDni = (a.dni || '').toString().trim();
      if (aDni) dnisValidados.add(aDni);
    });

    const validadosTotales = dnisValidados.size;
    const fotosTotales = todasLasFotosDistrito.length;

    if (mesasTotales === 0 && personeros.length > 0) {
      mesasTotales = personeros.length;
    }

    const faltanTotales = Math.max(0, mesasTotales - validadosTotales);
    const porcentajeGlobal = mesasTotales > 0 ? Math.round((validadosTotales / mesasTotales) * 100) : 0;

    return {
      mesasTotales,
      validadosTotales,
      faltanTotales,
      fotosTotales,
      porcentajeGlobal
    };
  }, [colegiosAsignados, infoColegios, personeros, confirmacionesCoord, asistencias, todasLasFotosDistrito]);

  // 7. Personeros del colegio activo
  const activeColegioNombre = isCoordinadorLocal ? (colegiosAsignados[0] || currentUser?.colegio || '') : selectedColegio;

  const personerosDelColegio = useMemo(() => {
    if (!activeColegioNombre) return personeros;
    const stats = getColegioStats(activeColegioNombre);
    return stats.personerosCol;
  }, [activeColegioNombre, personeros, confirmacionesCoord, asistencias]);

  // Filtro de Asistencia
  const filteredPersonerosAsistencia = useMemo(() => {
    return personerosDelColegio.filter(p => {
      const q = searchTerm.toLowerCase();
      const name = (p.nombre || '').toLowerCase();
      const dni = (p.dni || p.DNI || '').toString();
      const mesa = (p.mesa || '').toString();
      const matchesSearch = name.includes(q) || dni.includes(q) || mesa.includes(q);
      if (!matchesSearch) return false;

      const validado = isMarcadoPorCoord(p);

      if (activeFilter === 'CONFIRMED') return validado;
      if (activeFilter === 'PENDING') return !validado;
      return true;
    });
  }, [personerosDelColegio, searchTerm, activeFilter, confirmacionesCoord]);

  // Filtro de Reporte Fotográfico del colegio seleccionado
  const filteredPersonerosReporte = useMemo(() => {
    if (!activeColegioNombre) return [];
    return todasLasFotosDistrito
      .filter(item => matchColegio(item.colegio, activeColegioNombre))
      .filter(item => {
        const q = searchTerm.toLowerCase();
        const name = (item.nombre || '').toLowerCase();
        const dni = (item.dni || '').toString();
        const mesa = (item.mesa || '').toString();
        return name.includes(q) || dni.includes(q) || mesa.includes(q);
      });
  }, [todasLasFotosDistrito, activeColegioNombre, searchTerm]);

  // Manejador de apertura de Conteo Manual
  const handleOpenConteoManual = (mesa, colNombre, personeroObj = null) => {
    setSelectedMesaForCounting(mesa || '');
    setSelectedColegioForCounting(colNombre || activeColegioNombre || '');
    setSelectedPersoneroForCounting(personeroObj);
    if (mesa) localStorage.setItem('votoReal_mesa_activa', mesa);
    if (colNombre) localStorage.setItem('votoReal_colegio_activo', colNombre);
    if (personeroObj) {
      localStorage.setItem('votoReal_personero_activo', JSON.stringify(personeroObj));
    } else {
      localStorage.removeItem('votoReal_personero_activo');
    }
    setIsManualModalOpen(true);
  };

  // Manejador de apertura de Conteo OCR
  const handleOpenConteoOcr = (mesa, colNombre, personeroObj = null) => {
    if (mesa) localStorage.setItem('votoReal_mesa_activa', mesa);
    if (colNombre) localStorage.setItem('votoReal_colegio_activo', colNombre);
    if (personeroObj) {
      localStorage.setItem('votoReal_personero_activo', JSON.stringify(personeroObj));
    } else {
      localStorage.removeItem('votoReal_personero_activo');
    }
    setIsScannerModalOpen(true);
  };

  // Manejador del click de asistencia con validación de horario a las 3:00 PM
  const handleMarcarAsistencia = (personero, targetColegio = '') => {
    if (!isAsistenciaHabilitada) {
      showToast('🔒 La marcación de asistencia se activará a partir de las 3:00 PM.', 'warning');
      return;
    }
    confirmPersoneroDirect(personero, targetColegio || activeColegioNombre);
  };

  return (
    <section id="view-coordinator" className="view active" style={{ display: 'block', maxWidth: '880px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── BARRA SUPERIOR DE ACCESO Y NAVEGACIÓN TOTAL (SOLO PARA VILLA MARÍA DEL TRIUNFO) ── */}
      {isVMT && (isCoordinadorDistrital || isCoordinadorZonal) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '14px',
          padding: '10px 16px',
          marginBottom: '14px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: isCoordinadorDistrital ? 'rgba(74, 222, 128, 0.2)' : 'rgba(56, 189, 248, 0.2)', padding: '6px', borderRadius: '8px' }}>
              <ShieldCheck size={20} color={isCoordinadorDistrital ? '#4ade80' : '#38bdf8'} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: '800', color: isCoordinadorDistrital ? '#4ade80' : '#38bdf8', letterSpacing: '0.3px' }}>
                {isCoordinadorDistrital ? 'ACCESO TOTAL COORDINADORA DISTRITAL' : 'SUPERVISIÓN & CONTROL DE ASISTENCIA'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {isCoordinadorDistrital
                  ? 'Supervisa coordinadores zonales, locales y personeros. Control y conteo total en vivo.'
                  : 'Supervisa la llegada y asistencia de los personeros de tus centros de votación.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('view-counting')}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
            }}
          >
            <ClipboardList size={16} />
            <span>Conteo de Votos en Vivo</span>
          </button>
        </div>
      )}

      {/* ── HEADER DEL USUARIO ── */}
      <div className="user-info-bar glass" style={{ borderRadius: '16px', padding: '14px 18px', border: `1px solid ${isCoordinadorDistrital ? 'rgba(74, 222, 128, 0.35)' : 'rgba(56, 189, 248, 0.25)'}` }}>
        <div className="user-details" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: isCoordinadorDistrital ? 'rgba(74, 222, 128, 0.15)' : 'rgba(56, 189, 248, 0.15)', padding: '10px', borderRadius: '12px', border: `1px solid ${isCoordinadorDistrital ? 'rgba(74, 222, 128, 0.3)' : 'rgba(56, 189, 248, 0.3)'}` }}>
            <ShieldCheck className="text-secondary" size={28} color={isCoordinadorDistrital ? '#4ade80' : '#38bdf8'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="user-label" style={{ color: isCoordinadorDistrital ? '#4ade80' : '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isCoordinadorDistrital ? 'Coordinadora Distrital (Acceso Total)' : isCoordinadorLocal ? 'Personero de Centro de Votación' : 'Coordinador Zonal'} (Aprobado)
              </span>
            </div>
            <span className="user-name" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{currentUser?.nombre || 'Personero Oficial'}</span>
            <span className="user-info-text" style={{ fontSize: '0.8rem', color: '#475569' }}>
              DNI: <strong style={{ color: '#0f172a' }}>{currentUser?.dni || ''}</strong>
              {(currentUser?.celular || currentUser?.telefono) && (
                <> • Cel: <strong style={{ color: '#0f172a' }}>{currentUser.celular || currentUser.telefono}</strong></>
              )}
              {' '}| Distrito: <strong style={{ color: '#0f172a' }}>{currentUser?.ubicacion || 'Villa María del Triunfo'}</strong>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-icon-header"
            onClick={() => fetchCoordinatorData(false, true)}
            title="Refrescar datos"
            disabled={isLoading}
            style={{ borderRadius: '10px', padding: '8px' }}
          >
            <RefreshCw size={18} className={isLoading ? 'spin-icon' : ''} />
          </button>
          <button
            type="button"
            className="btn-logout-small"
            onClick={logout}
            title="Cerrar Sesión"
            style={{ borderRadius: '10px', padding: '8px 12px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ── CASO A: COORDINADOR ZONAL / DISTRITAL ── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {isCoordinadorZonal && !isVMTZonal && (
        <div className="card glass" style={{ marginTop: '20px', padding: '36px 20px', textAlign: 'center', borderRadius: '16px', border: '1px solid #fca5a5', background: '#fef2f2' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0 0 8px 0' }}>
            Acceso Restringido
          </h3>
          <p style={{ fontSize: '0.92rem', color: '#475569', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
            La interfaz de <strong>Coordinador Zonal</strong> se encuentra habilitada exclusivamente para el distrito de <strong>Villa María del Triunfo</strong>.
            <br /><br />
            Tu distrito registrado en el sistema es: <strong style={{ color: '#0f172a' }}>{currentUser?.ubicacion || 'No asignado'}</strong>.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
            style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '10px' }}
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      {(isCoordinadorDistrital || (isCoordinadorZonal && isVMTZonal)) && !selectedColegio && (
        <>
          {/* Resumen Global Distrital / Zonal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '12px' }}>
            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={14} color="#64748b" /> Centros de Votación
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {colegiosAsignados.length}
              </div>
            </div>

            {isCoordinadorDistrital && isVMT && (
              <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #bae6fd', background: '#f0f9ff' }}>
                <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} color="#0284c7" /> Coord. Zonales
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                  {coordinadoresZonales.length}
                </div>
              </div>
            )}

            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} color="#64748b" /> Mesas Oficiales
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {statsGlobales.mesasTotales}
              </div>
            </div>

            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #86efac', background: '#f0fdf4' }}>
              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} color="#16a34a" /> Asistencia Marcada
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                {statsGlobales.validadosTotales} <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>({statsGlobales.porcentajeGlobal}%)</span>
              </div>
            </div>

            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #bae6fd', background: '#f0f9ff' }}>
              <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Camera size={14} color="#0284c7" /> Fotos Instalación
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {statsGlobales.fotosTotales}
              </div>
            </div>
          </div>

          {/* Sub-Pestañas para Coordinadora Distrital / Zonal */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '16px',
              background: '#f1f5f9',
              padding: '6px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}
          >
            {isCoordinadorDistrital && isVMT && (
              <button
                type="button"
                onClick={() => setActiveDistrictTab('ZONALES')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: activeDistrictTab === 'ZONALES'
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'transparent',
                  color: activeDistrictTab === 'ZONALES' ? '#ffffff' : '#475569',
                  boxShadow: activeDistrictTab === 'ZONALES' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none'
                }}
              >
                <Users size={17} />
                <span>Coord. Zonales ({coordinadoresZonales.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveDistrictTab('COLEGIOS')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: activeDistrictTab === 'COLEGIOS'
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                  : 'transparent',
                color: activeDistrictTab === 'COLEGIOS' ? '#ffffff' : '#475569',
                boxShadow: activeDistrictTab === 'COLEGIOS' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              <School size={17} />
              <span>Centros de Votación ({colegiosAsignados.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDistrictTab('REPORTE_GENERAL')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: activeDistrictTab === 'REPORTE_GENERAL'
                  ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)'
                  : 'transparent',
                color: activeDistrictTab === 'REPORTE_GENERAL' ? '#ffffff' : '#475569',
                boxShadow: activeDistrictTab === 'REPORTE_GENERAL' ? '0 4px 14px rgba(126, 34, 206, 0.25)' : 'none'
              }}
            >
              <Camera size={17} />
              <span>Fotos Instalación ({statsGlobales.fotosTotales})</span>
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* ── SUB-PESTAÑA 1: COORDINADORES ZONALES (SUPERVISIÓN DISTRITAL) ── */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {isCoordinadorDistrital && activeDistrictTab === 'ZONALES' && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} color="#0284c7" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Coordinadores Zonales de Villa María del Triunfo ({coordinadoresZonales.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Supervisa y valida la asistencia de los coordinadores zonales
                </span>
              </div>

              {coordinadoresZonales.length === 0 ? (
                <div className="glass" style={{ padding: '32px', textAlign: 'center', borderRadius: '16px', color: '#475569', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  {isLoading ? 'Cargando coordinadores zonales...' : 'No se encontraron coordinadores zonales registrados.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {coordinadoresZonales.map((z, idx) => {
                    const zDni = (z.dni || '').toString().trim();
                    const isConfirmed = isMarcadoPorCoord(z);
                    const llegada = checkLlegada(z);
                    const colegiosZonal = (z.colegios || z.colegio || '')
                      .split(',')
                      .map(c => c.trim())
                      .filter(Boolean);

                    return (
                      <div
                        key={idx}
                        className="glass"
                        style={{
                          borderRadius: '16px',
                          padding: '16px 18px',
                          border: `1px solid ${isConfirmed ? '#86efac' : '#bae6fd'}`,
                          background: isConfirmed ? '#f0fdf4' : '#ffffff',
                          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                                {z.nombre}
                              </span>
                              <span style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                COORDINADOR ZONAL
                              </span>
                              {isConfirmed ? (
                                <span style={{
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  border: '1px solid #86efac',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}>
                                  ✓ ASISTENCIA CONFIRMADA
                                </span>
                              ) : llegada.llegado ? (
                                <span style={{
                                  background: '#e0f2fe',
                                  color: '#0284c7',
                                  border: '1px solid #bae6fd',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700
                                }}>
                                  📍 Llegada {llegada.metodo} ({llegada.hora || 'Registrada'})
                                </span>
                              ) : (
                                <span style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700
                                }}>
                                  ⏳ Pendiente Asistencia
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                              <span>DNI / Clave: <strong style={{ color: '#0f172a' }}>{zDni}</strong></span>
                              {z.celular && (
                                <span>
                                  Cel: <a
                                    href={`https://wa.me/51${z.celular.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#15803d', textDecoration: 'underline', fontWeight: 700 }}
                                  >
                                    {z.celular}
                                  </a>
                                </span>
                              )}
                              {z.correo_electronico && (
                                <span>Correo: <strong style={{ color: '#334155' }}>{z.correo_electronico}</strong></span>
                              )}
                            </div>

                            {/* Centros de Votación a Cargo */}
                            <div style={{ marginTop: '10px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>
                                Centros de Votación Asignados ({colegiosZonal.length}):
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {colegiosZonal.map((cName, cIdx) => (
                                  <span
                                    key={cIdx}
                                    style={{
                                      background: '#f1f5f9',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      padding: '2px 8px',
                                      fontSize: '0.74rem',
                                      color: '#1e293b',
                                      fontWeight: 600
                                    }}
                                  >
                                    {cName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Acciones para el Coordinador Zonal */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                            {!isConfirmed ? (
                              <button
                                type="button"
                                onClick={() => handleMarcarAsistencia(z, 'Coordinación Zonal')}
                                style={{
                                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '8px 14px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                                }}
                              >
                                <CheckCircle size={15} />
                                <span>Marcar Asistencia</span>
                              </button>
                            ) : (
                              <div style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                borderRadius: '10px',
                                padding: '6px 12px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}>
                                <CheckCircle2 size={14} /> Asistencia Validada
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedZonalFilter(zDni);
                                setActiveDistrictTab('COLEGIOS');
                              }}
                              style={{
                                background: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <School size={15} />
                              <span>Ver sus {colegiosZonal.length} Colegios</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* ── SUB-PESTAÑA 2: LISTA DE CENTROS DE VOTACIÓN ── */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {activeDistrictTab === 'COLEGIOS' && (
            <div style={{ marginTop: '16px' }}>
              {/* Filtro por Coordinador Zonal (Visible para Coordinadora Distrital) */}
              {isCoordinadorDistrital && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap' }}>
                    Filtrar por Zona:
                  </span>
                  <select
                    value={selectedZonalFilter}
                    onChange={(e) => setSelectedZonalFilter(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Todos los Coordinadores Zonales ({todosColegiosDistrito.length} centros de votación)</option>
                    {coordinadoresZonales.map((z, idx) => (
                      <option key={idx} value={(z.dni || '').toString().trim()}>
                        {z.nombre} (DNI: {z.dni})
                      </option>
                    ))}
                  </select>
                  {selectedZonalFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedZonalFilter('')}
                      style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Limpiar Filtro
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <School size={20} color="#0284c7" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    Centros de Votación ({colegiosAsignados.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Toca un centro de votación para supervisar sus mesas o registrar votos
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colegiosAsignados.map((colName, idx) => {
                  const stats = getColegioStats(colName);
                  const zonal = getZonalDeColegio(colName);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectColegio(colName)}
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${stats.isCompleto ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: '16px',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
                      }}
                      className="colegio-card-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                              {colName}
                            </span>
                            
                            {/* Badges de Conteo de Personeros y Mesas */}
                            <span style={{
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Users size={12} /> {stats.totalPersoneros} Personeros
                            </span>

                            <span style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              {stats.totalMesas} Mesas
                            </span>

                            {stats.isCompleto ? (
                              <span style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                ✓ ASISTENCIA COMPLETA ({stats.asistieronValidados}/{stats.totalMesas})
                              </span>
                            ) : (
                              <span style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                ⏳ FALTAN {stats.faltan} POR ASISTIR
                              </span>
                            )}
                          </div>

                          {/* Coordinador Local Asignado */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#475569', fontSize: '0.84rem', flexWrap: 'wrap' }}>
                            <User size={14} color="#0284c7" />
                            <span>
                              Coord. Local: <strong style={{ color: '#0369a1' }}>{stats.coordLocal?.nombre || 'Pendiente de Asignación'}</strong>
                            </span>
                            {stats.coordLocal?.dni && (
                              <span style={{ color: '#64748b' }}>(DNI: {stats.coordLocal.dni})</span>
                            )}
                            {stats.coordLocal && (
                              isMarcadoPorCoord(stats.coordLocal) ? (
                                <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.74rem' }}>✓ Asistió</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarcarAsistencia(stats.coordLocal, colName);
                                  }}
                                  style={{
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #86efac',
                                    borderRadius: '6px',
                                    padding: '2px 6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  + Marcar Asistencia Local
                                </button>
                              )
                            )}
                          </div>

                          {/* Coordinador Zonal Asignado (Visible si Distrital) */}
                          {isCoordinadorDistrital && zonal && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#64748b', fontSize: '0.78rem' }}>
                              <Building2 size={13} color="#64748b" />
                              <span>Zona a cargo de: <strong style={{ color: '#0f172a' }}>{zonal.nombre}</strong> (DNI: {zonal.dni})</span>
                            </div>
                          )}
                        </div>

                        {/* Botón Ver Personeros en Tarjeta de Colegio */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                          <div
                            onClick={() => handleSelectColegio(colName)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', padding: '6px' }}
                          >
                            <span>Ver {stats.totalPersoneros} Personeros</span>
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>

                      {/* ── 2 BARRAS DE PROGRESO INDEPENDIENTES POR COLEGIO ── */}
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* 1. Barra de Cobertura de Personeros */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#334155', marginBottom: '3px', fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              👥 <strong>Cobertura de Personeros:</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>{stats.totalPersoneros} de {stats.totalMesas} mesas registradas</span>
                            </span>
                            <span style={{ color: '#0284c7', fontWeight: 800 }}>{stats.porcentajePersoneros}%</span>
                          </div>
                          <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${stats.porcentajePersoneros}%`,
                              background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                              borderRadius: '4px',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </div>

                        {/* 2. Barra de Control de Asistencia */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#334155', marginBottom: '3px', fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ✓ <strong>Control de Asistencia:</strong> <span style={{ color: '#15803d', fontWeight: 700 }}>{stats.asistieronValidados} de {stats.totalPersoneros} personeros asistieron ({stats.asistieronValidados}/{stats.totalMesas} mesas)</span>
                            </span>
                            <span style={{ color: stats.isCompleto ? '#15803d' : '#0284c7', fontWeight: 800 }}>{stats.porcentajeAsistencia}%</span>
                          </div>
                          <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${stats.porcentajeAsistencia}%`,
                              background: stats.isCompleto ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(90deg, #22c55e 0%, #0284c7 100%)',
                              borderRadius: '4px',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* ── SUB-PESTAÑA 3: REPORTE GENERAL DE FOTOS ── */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {activeDistrictTab === 'REPORTE_GENERAL' && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '14px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#f3e8ff', padding: '10px', borderRadius: '10px' }}>
                    <Camera size={24} color="#7e22ce" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      Reporte General de Fotografías de Instalación
                    </h4>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      Fotografías registradas en tiempo real por los personeros de mesa del distrito.
                    </p>
                  </div>
                </div>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e9d5ff',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#7e22ce'
                }}>
                  📸 {statsGlobales.fotosTotales} fotos registradas
                </div>
              </div>

              {/* Barra de Búsqueda de Reporte General */}
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <div className="input-wrapper" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                  <Search className="input-icon" size={18} color="#64748b" />
                  <input
                    type="text"
                    value={searchGeneralFotos}
                    onChange={(e) => setSearchGeneralFotos(e.target.value)}
                    placeholder="Buscar por personero, DNI, local o mesa en fotos..."
                    style={{ fontSize: '0.88rem', color: '#0f172a' }}
                  />
                </div>
              </div>

              {/* Grid de fotos global */}
              {filteredTodasLasFotos.length === 0 ? (
                <div className="glass" style={{ textAlign: 'center', padding: '48px 20px', borderRadius: '16px', color: '#64748b', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <Camera size={42} color="#7e22ce" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                    {searchGeneralFotos ? 'No se encontraron fotos con la búsqueda actual' : 'Aún no se han recibido fotografías de instalación'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '420px', margin: '0 auto' }}>
                    {searchGeneralFotos ? 'Intenta buscar por otro nombre, DNI, centro o número de mesa.' : 'Las fotos enviadas por los personeros al registrar su instalación aparecerán aquí en tiempo real.'}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '14px'
                }}>
                  {filteredTodasLasFotos.map((item, idx) => {
                    const pDni = (item.dni || '').toString().trim();
                    const photoUrl = item.fotoUrl;
                    const horaEnvio = item.hora;

                    return (
                      <div
                        key={idx}
                        className="glass"
                        style={{
                          borderRadius: '14px',
                          border: '1px solid #e9d5ff',
                          background: '#ffffff',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 8px rgba(126, 34, 206, 0.08)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800 }}>
                              Mesa {item.mesa || 'S/M'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={item.colegio || ''}>
                              {item.colegio || ''}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px', fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                            {item.nombre}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '3px' }}>
                            DNI: <strong style={{ color: '#0f172a' }}>{pDni}</strong> {horaEnvio && <> • Hora: <strong style={{ color: '#0284c7' }}>{horaEnvio}</strong></>}
                          </div>
                        </div>

                        <div
                          style={{ height: '180px', background: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
                          onClick={() => setSelectedPhotoModal({
                            personero: {
                              nombre: item.nombre,
                              dni: item.dni,
                              mesa: item.mesa,
                              colegio: item.colegio
                            },
                            fotoUrl: photoUrl,
                            hora: horaEnvio
                          })}
                        >
                          <img src={photoUrl} alt={`Mesa ${item.mesa}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '4px 8px', color: '#ffffff', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Maximize2 size={12} /> Ampliar
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ── CASO B: DETALLE DE CENTRO DE VOTACIÓN CON LAS 2 OPCIONES ── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {(isCoordinadorLocal || ((isCoordinadorZonal || isCoordinadorDistrital) && selectedColegio)) && (() => {
        const targetCol = activeColegioNombre;
        const stats = getColegioStats(targetCol);

        return (
          <div style={{ marginTop: isCoordinadorLocal ? '14px' : '16px' }}>
            {/* Botón Volver (visible para Coordinador Zonal y Distrital) */}
            {(isCoordinadorZonal || isCoordinadorDistrital) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedColegio(null);
                  setActiveSchoolTab('ASISTENCIA');
                  setSearchTerm('');
                  setActiveFilter('ALL');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                <ArrowLeft size={16} /> Volver a la lista de centros de votación
              </button>
            )}

            {/* Tarjeta del Centro de Votación */}
            <div className="card glass" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #bae6fd', background: '#ffffff', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Lado Izquierdo: Datos del Centro */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                  <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '14px', flexShrink: 0 }}>
                    <School size={30} color="#0284c7" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isCoordinadorLocal ? 'Mi Centro de Votación Asignado:' : 'Detalle de Centro de Votación:'}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      {targetCol}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#0369a1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <MapPin size={14} /> {currentUser?.ubicacion || 'Lima'} {stats.direccion ? `• ${stats.direccion}` : ''}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Ficha del Coordinador Local con botón de asistencia (visible para Zonal y Distrital) */}
                {(isCoordinadorZonal || isCoordinadorDistrital) && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    minWidth: '240px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} color="#0284c7" /> Coordinador de Local
                      </div>
                      {stats.coordLocal && (
                        isMarcadoPorCoord(stats.coordLocal) ? (
                          <span style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}>
                            ✓ ASISTIÓ
                          </span>
                        ) : (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}>
                            PENDIENTE
                          </span>
                        )
                      )}
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                      {stats.coordLocal?.nombre || 'Pendiente de Asignación'}
                    </div>
                    {stats.coordLocal?.dni && (
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                        DNI: <strong style={{ color: '#0f172a' }}>{stats.coordLocal.dni}</strong>
                        {stats.coordLocal?.celular ? ` • Cel: ${stats.coordLocal.celular}` : ''}
                      </div>
                    )}
                    {stats.coordLocal && !isMarcadoPorCoord(stats.coordLocal) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarcarAsistencia(stats.coordLocal, targetCol);
                        }}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          background: '#dcfce7',
                          border: '1px solid #86efac',
                          color: '#15803d',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <CheckCircle size={14} /> Marcar Asistencia Coord. Local
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Estadísticas Rápidas del Centro */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '8px', marginTop: '14px' }}>
                <div style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #bae6fd' }}>
                  <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700 }}>👥 Personeros</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>{stats.totalPersoneros}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>🏫 Total Mesas</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalMesas}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700 }}>✓ Asistencias</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>{stats.asistieronValidados}</div>
                </div>
                <div style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: 700 }}>⏳ Faltan</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b45309' }}>{stats.faltan}</div>
                </div>
                <div style={{ background: '#faf5ff', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '0.68rem', color: '#7e22ce', fontWeight: 700 }}>📸 Fotos</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7e22ce' }}>{stats.conFoto}</div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════════ */}
            {/* ── SELECTOR DE LAS 2 OPCIONES PRINCIPALES: ASISTENCIA | REPORTE ── */}
            {/* ════════════════════════════════════════════════════════════════════════ */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '16px',
                background: '#f1f5f9',
                padding: '6px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0'
              }}
            >
              <button
                type="button"
                id="btn-tab-asistencia"
                onClick={() => {
                  setActiveSchoolTab('ASISTENCIA');
                  setSearchTerm('');
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: activeSchoolTab === 'ASISTENCIA' 
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                    : 'transparent',
                  color: activeSchoolTab === 'ASISTENCIA' ? '#ffffff' : '#475569',
                  boxShadow: activeSchoolTab === 'ASISTENCIA' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none'
                }}
              >
                <UserCheck size={18} />
                <span>Asistencia</span>
                {stats.asistieronValidados > 0 && (
                  <span style={{
                    background: activeSchoolTab === 'ASISTENCIA' ? 'rgba(255,255,255,0.25)' : '#e0f2fe',
                    color: activeSchoolTab === 'ASISTENCIA' ? '#ffffff' : '#0369a1',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {stats.asistieronValidados}/{stats.totalMesas}
                  </span>
                )}
              </button>

              <button
                type="button"
                id="btn-tab-reporte"
                onClick={() => {
                  setActiveSchoolTab('REPORTE');
                  setSearchTerm('');
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  background: activeSchoolTab === 'REPORTE' 
                    ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)' 
                    : 'transparent',
                  color: activeSchoolTab === 'REPORTE' ? '#ffffff' : '#475569',
                  boxShadow: activeSchoolTab === 'REPORTE' ? '0 4px 14px rgba(126, 34, 206, 0.25)' : 'none'
                }}
              >
                <Camera size={18} />
                <span>Reporte de Instalación</span>
                <span style={{
                  background: activeSchoolTab === 'REPORTE' ? 'rgba(255,255,255,0.25)' : '#f3e8ff',
                  color: activeSchoolTab === 'REPORTE' ? '#ffffff' : '#7e22ce',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {stats.conFoto} fotos
                </span>
              </button>
            </div>

            {/* ════════════════════════════════════════════════════════════════════════ */}
            {/* ── PESTAÑA 1: OPCIÓN ASISTENCIA (ACTIVA A LAS 3:00 PM) ── */}
            {/* ════════════════════════════════════════════════════════════════════════ */}
            {activeSchoolTab === 'ASISTENCIA' && (
              <div style={{ marginTop: '14px' }}>
                
                {/* Banner de Estado Horario (3:00 PM) */}
                {!isAsistenciaHabilitada ? (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '14px'
                    }}
                  >
                    <Lock size={22} color="#d97706" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.84rem', color: '#78350f' }}>
                      <strong style={{ color: '#b45309' }}>🔒 Control de Horario:</strong> La opción de marcar asistencia de los personeros de mesa se activará automáticamente a partir de las <strong>3:00 PM (15:00 hrs)</strong>.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '14px'
                    }}
                  >
                    <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                      <strong>✓ Asistencia Habilitada:</strong> Puedes marcar y validar la presencia de los personeros asignados a tu centro de votación.
                    </div>
                  </div>
                )}

                {/* Filtros Rápidos de Asistencia */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    style={{
                      background: activeFilter === 'ALL' ? '#0284c7' : '#ffffff',
                      color: activeFilter === 'ALL' ? '#ffffff' : '#334155',
                      border: `1px solid ${activeFilter === 'ALL' ? '#0284c7' : '#cbd5e1'}`,
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Todos ({stats.personerosCol.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('CONFIRMED')}
                    style={{
                      background: activeFilter === 'CONFIRMED' ? '#16a34a' : '#ffffff',
                      color: activeFilter === 'CONFIRMED' ? '#ffffff' : '#15803d',
                      border: `1px solid ${activeFilter === 'CONFIRMED' ? '#16a34a' : '#cbd5e1'}`,
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✅ Marcados ({stats.asistieronValidados})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('PENDING')}
                    style={{
                      background: activeFilter === 'PENDING' ? '#d97706' : '#ffffff',
                      color: activeFilter === 'PENDING' ? '#ffffff' : '#92400e',
                      border: `1px solid ${activeFilter === 'PENDING' ? '#d97706' : '#cbd5e1'}`,
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ⏳ Pendientes ({stats.faltan})
                  </button>
                </div>

                {/* Barra de Búsqueda */}
                <div className="input-group" style={{ marginTop: '12px', marginBottom: '12px' }}>
                  <div className="input-wrapper" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                    <Search className="input-icon" size={18} color="#64748b" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar personero por nombre, DNI o mesa..."
                      style={{ fontSize: '0.88rem', color: '#0f172a' }}
                    />
                  </div>
                </div>

                {/* Padrón de Personeros para Asistencia */}
                <div className="table-container glass" style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                  <div
                    className="table-section-header"
                    style={{
                      background: '#f0f9ff',
                      borderLeft: '4px solid #0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={19} color="#0284c7" />
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                        Mesas y Personeros Asignados ({filteredPersonerosAsistencia.length})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                      {stats.isCompleto ? '✓ Asistencia al 100%' : `Faltan ${stats.faltan} mesas`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                    {filteredPersonerosAsistencia.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b', fontSize: '0.92rem' }}>
                        {isLoading ? 'Cargando datos del centro de votación...' : 'No se encontraron personeros con los filtros actuales.'}
                      </div>
                    ) : (
                      filteredPersonerosAsistencia.map((p, idx) => {
                        const pDni = (p.dni || p.DNI || '').toString().trim();
                        const llegada = checkLlegada(p);
                        const isCoordConfirmed = isMarcadoPorCoord(p);

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '14px',
                              background: isCoordConfirmed
                                ? '#f0fdf4'
                                : '#f8fafc',
                              border: `1px solid ${
                                isCoordConfirmed 
                                  ? '#86efac' 
                                  : '#e2e8f0'
                              }`,
                              borderRadius: '14px',
                              padding: '14px 16px',
                              userSelect: 'none',
                              boxShadow: isCoordConfirmed ? '0 2px 6px rgba(22, 163, 74, 0.1)' : 'none'
                            }}
                          >
                            {/* Datos del Personero */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a' }}>
                                  {p.nombre}
                                </span>

                                {/* Badge de Estado */}
                                {isCoordConfirmed ? (
                                  <span style={{
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #86efac',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <CheckCircle size={12} /> {isCoordinadorLocal ? 'Asistencia Marcada' : 'Marcada por Personero C.V.'}
                                  </span>
                                ) : llegada.llegado ? (
                                  <span style={{
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    border: '1px solid #bae6fd',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Clock size={12} /> Instalación {llegada.hora ? `(${llegada.hora})` : ''}
                                  </span>
                                ) : (
                                  <span style={{
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Clock size={12} /> Pendiente de Asistencia
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                <span>DNI: <strong style={{ color: '#0f172a' }}>{pDni}</strong></span>
                                <span>Mesa: <strong style={{ color: '#0284c7' }}>{p.mesa || 'S/M'}</strong></span>
                                {p.celular && (
                                  <span>Cel: <strong style={{ color: '#0284c7' }}>{p.celular}</strong></span>
                                )}
                                {p.colegio && (
                                  <span>Local: <strong style={{ color: '#334155' }}>{p.colegio}</strong></span>
                                )}
                              </div>

                              {/* Acciones de Conteo Manual e Imagen */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                {isVMT ? (
                                  <>
                                    {/* Botón / Estado Conteo Manual (Villa María del Triunfo) */}
                                    {p.voto_manual_enviado ? (
                                      <div
                                        style={{
                                          background: '#dcfce7',
                                          border: '1px solid #86efac',
                                          color: '#15803d',
                                          borderRadius: '8px',
                                          padding: '5px 10px',
                                          fontSize: '0.76rem',
                                          fontWeight: 800,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          cursor: 'default'
                                        }}
                                        title="El conteo manual de esta mesa ya fue transmitido y está bloqueado definitivamente (1/1)"
                                      >
                                        <CheckCircle size={14} color="#15803d" />
                                        <span>✓ Manual Enviado (Bloqueado)</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenConteoManual(p.mesa, p.colegio || targetCol, p);
                                        }}
                                        style={{
                                          background: '#f0f9ff',
                                          border: '1px solid #bae6fd',
                                          color: '#0284c7',
                                          borderRadius: '8px',
                                          padding: '5px 10px',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          transition: 'all 0.2s ease'
                                        }}
                                        title="Registrar votos manualmente para esta mesa (solo 1 envío permitido)"
                                      >
                                        <ClipboardList size={14} />
                                        <span>Conteo Manual</span>
                                      </button>
                                    )}

                                    {/* Botón / Estado Conteo OCR (Villa María del Triunfo) */}
                                    {p.voto_imagen_enviado ? (
                                      <div
                                        style={{
                                          background: '#f3e8ff',
                                          border: '1px solid #e9d5ff',
                                          color: '#7e22ce',
                                          borderRadius: '8px',
                                          padding: '5px 10px',
                                          fontSize: '0.76rem',
                                          fontWeight: 800,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          cursor: 'default'
                                        }}
                                        title="El conteo por OCR de esta mesa ya fue transmitido y está bloqueado definitivamente (1/1)"
                                      >
                                        <CheckCircle size={14} color="#7e22ce" />
                                        <span>✓ OCR Enviado (Bloqueado)</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenConteoOcr(p.mesa, p.colegio || targetCol, p);
                                        }}
                                        style={{
                                          background: '#faf5ff',
                                          border: '1px solid #e9d5ff',
                                          color: '#7e22ce',
                                          borderRadius: '8px',
                                          padding: '5px 10px',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          transition: 'all 0.2s ease'
                                        }}
                                        title="Escanear acta por foto / OCR para esta mesa (solo 1 envío permitido)"
                                      >
                                        <ScanLine size={14} />
                                        <span>Conteo OCR</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {/* Estados Informativos para los demás distritos (el conteo lo hace únicamente el personero de mesa) */}
                                    {p.voto_manual_enviado && (
                                      <div
                                        style={{
                                          background: '#dcfce7',
                                          border: '1px solid #86efac',
                                          color: '#15803d',
                                          borderRadius: '8px',
                                          padding: '5px 10px',
                                          fontSize: '0.76rem',
                                          fontWeight: 800,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px'
                                        }}
                                      >
                                        <CheckCircle size={14} color="#15803d" />
                                        <span>✓ Manual Enviado</span>
                                      </div>
                                    )}
                                    {p.voto_imagen_enviado && (
                                      <div
                                        style={{
                                          background: '#f3e8ff',
                                          border: '1px solid #e9d5ff',
                                          color: '#7e22ce',
                                          borderRadius: '8px',
                                          padding: '5px 10px',
                                          fontSize: '0.76rem',
                                          fontWeight: 800,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px'
                                        }}
                                      >
                                        <CheckCircle size={14} color="#7e22ce" />
                                        <span>✓ OCR Enviado</span>
                                      </div>
                                    )}
                                    {!p.voto_manual_enviado && !p.voto_imagen_enviado && (
                                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                                        ⏳ Conteo a cargo de Personero
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Acción / Indicador de Asistencia */}
                            <div style={{ flexShrink: 0 }}>
                              {isCoordConfirmed ? (
                                <div style={{
                                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                  border: '1px solid #16a34a',
                                  color: '#ffffff',
                                  borderRadius: '10px',
                                  padding: '8px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                                }}>
                                  <CheckCircle2 size={16} color="#ffffff" />
                                  <span>Marcado</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarcarAsistencia(p, targetCol);
                                  }}
                                  title={!isAsistenciaHabilitada ? 'Se activará a las 3:00 PM' : 'Marcar asistencia'}
                                  style={{
                                    background: !isAsistenciaHabilitada 
                                      ? '#fef3c7' 
                                      : '#f0f9ff',
                                    border: !isAsistenciaHabilitada
                                      ? '1px solid #fde68a'
                                      : '1px solid #bae6fd',
                                    color: !isAsistenciaHabilitada ? '#92400e' : '#0284c7',
                                    borderRadius: '10px',
                                    padding: '8px 14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {!isAsistenciaHabilitada ? <Lock size={15} /> : <Circle size={16} />}
                                  <span>{!isAsistenciaHabilitada ? 'Activa 3:00 PM' : 'Marcar Asistencia'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════════ */}
            {/* ── PESTAÑA 2: OPCIÓN REPORTE (FOTOS DE INSTALACIÓN DE MESA) ── */}
            {/* ════════════════════════════════════════════════════════════════════════ */}
            {activeSchoolTab === 'REPORTE' && (
              <div style={{ marginTop: '14px' }}>
                
                {/* Banner Informativo del Reporte */}
                <div
                  style={{
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '14px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#f3e8ff', padding: '10px', borderRadius: '10px' }}>
                      <Camera size={24} color="#7e22ce" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                        Reporte Fotográfico de Instalación de Mesas
                      </h4>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#475569' }}>
                        Fotografías enviadas por los personeros de mesa al confirmar la instalación de su mesa de sufragio.
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e9d5ff',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#7e22ce'
                  }}>
                    📸 {stats.conFoto} de {stats.totalMesas} mesas registradas ({stats.porcentajeFotos}%)
                  </div>
                </div>

                {/* Barra de Búsqueda de Reporte */}
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <div className="input-wrapper" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                    <Search className="input-icon" size={18} color="#64748b" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por personero, DNI o mesa en fotos..."
                      style={{ fontSize: '0.88rem', color: '#0f172a' }}
                    />
                  </div>
                </div>

                {/* Galería / Grid de Fotografías de Instalación */}
                {filteredPersonerosReporte.length === 0 ? (
                  <div className="glass" style={{ textAlign: 'center', padding: '48px 20px', borderRadius: '16px', color: '#64748b', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                    <Camera size={42} color="#7e22ce" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                      {searchTerm ? 'No se encontraron fotos con la búsqueda actual' : 'Aún no se han recibido fotografías de instalación'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '420px', margin: '0 auto' }}>
                      {searchTerm ? 'Intenta buscar por otro nombre, DNI o número de mesa.' : 'Las fotos enviadas por los personeros de mesa al registrar su instalación aparecerán aquí en tiempo real.'}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '14px'
                    }}
                  >
                    {filteredPersonerosReporte.map((p, idx) => {
                      const pDni = (p.dni || p.DNI || '').toString().trim();
                      const photoUrl = getPersoneroPhoto(p);
                      const horaEnvio = getPersoneroInstalacionTime(p);

                      return (
                        <div
                          key={idx}
                          className="glass"
                          style={{
                            borderRadius: '14px',
                            border: '1px solid #e9d5ff',
                            background: '#ffffff',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 8px rgba(126, 34, 206, 0.08)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Encabezado de la Ficha */}
                          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 800
                              }}>
                                Mesa {p.mesa || 'S/M'}
                              </span>

                              <span style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #86efac',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <CheckCircle2 size={12} /> Foto Enviada
                              </span>
                            </div>

                            <div style={{ marginTop: '8px', fontWeight: 800, fontSize: '0.94rem', color: '#0f172a', lineHeight: 1.3 }}>
                              {p.nombre}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '3px' }}>
                              DNI: <strong style={{ color: '#0f172a' }}>{pDni}</strong>
                              {horaEnvio && (
                                <> • Enviado a las: <strong style={{ color: '#0284c7' }}>{horaEnvio}</strong></>
                              )}
                            </div>
                          </div>

                          {/* Imagen / Vista Previa */}
                          <div
                            style={{
                              height: '180px',
                              background: '#0f172a',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setSelectedPhotoModal({
                                personero: p,
                                fotoUrl: photoUrl,
                                hora: horaEnvio
                              });
                            }}
                          >
                            <img
                              src={photoUrl}
                              alt={`Instalación Mesa ${p.mesa}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.3s ease'
                              }}
                              className="photo-thumb-hover"
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(15, 23, 42, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s ease'
                              }}
                              className="photo-overlay-hover"
                            >
                              <div style={{
                                background: 'rgba(0,0,0,0.7)',
                                color: '#ffffff',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <Maximize2 size={14} /> Ver Ampliada
                              </div>
                            </div>
                          </div>

                          {/* Pie de Tarjeta */}
                          <div style={{ padding: '10px 14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                              {p.colegio || targetCol}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoModal({
                                personero: p,
                                fotoUrl: photoUrl,
                                hora: horaEnvio
                              })}
                              style={{
                                background: '#f3e8ff',
                                border: '1px solid #e9d5ff',
                                color: '#7e22ce',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} /> Ampliar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL / POPUP PARA VER FOTOGRAFÍA DE INSTALACIÓN EN TAMAÑO COMPLETO ── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {selectedPhotoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}>
                    Mesa {selectedPhotoModal.personero?.mesa || 'S/M'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedPhotoModal.personero?.nombre}
                  </h3>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '3px' }}>
                  DNI: <strong style={{ color: '#0f172a' }}>{selectedPhotoModal.personero?.dni}</strong>
                  {selectedPhotoModal.hora && (
                    <> • Hora de Registro: <strong style={{ color: '#0284c7' }}>{selectedPhotoModal.hora}</strong></>
                  )}
                  {' '}| Centro: <strong style={{ color: '#0f172a' }}>{selectedPhotoModal.personero?.colegio || activeColegioNombre}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Imagen en Grande */}
            <div
              style={{
                flex: 1,
                minHeight: '280px',
                maxHeight: '65vh',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                overflow: 'auto'
              }}
            >
              <img
                src={selectedPhotoModal.fotoUrl}
                alt="Foto de Instalación de Mesa de Sufragio"
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Footer del Modal */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={14} /> Foto oficial de instalación validada
              </span>

              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conteo Manual integrado para Coordinador */}
      <ManualCountingModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        mesaInput={selectedMesaForCounting}
        ubicacion={currentUser?.ubicacion || 'Lima'}
        candidatosProvincial={candidatosProvincial}
        candidatosDistrital={candidatosDistrital}
        alcaldeProvincial={alcaldeProvincial}
        alcaldeDistrital={alcaldeDistrital}
        currentVotes={currentVotes}
        onVoteChange={handleVoteChange}
        onTransmit={async (origen = 'MANUAL') => {
          const effectiveOrigen = typeof origen === 'string' ? origen : 'MANUAL';
          await transmitVotes(
            selectedMesaForCounting,
            selectedColegioForCounting || activeColegioNombre,
            currentUser?.ubicacion || 'Lima',
            effectiveOrigen,
            null,
            selectedPersoneroForCounting
          );
          setIsManualModalOpen(false);

          if (selectedPersoneroForCounting) {
            const targetDni = (selectedPersoneroForCounting.dni || selectedPersoneroForCounting.DNI || '').toString().trim();
            if (setPersoneros) {
              setPersoneros(prev => prev.map(p => {
                const pDni = (p.dni || p.DNI || '').toString().trim();
                if (pDni === targetDni) {
                  return {
                    ...p,
                    voto_manual_enviado: effectiveOrigen === 'MANUAL' ? true : p.voto_manual_enviado,
                    voto_imagen_enviado: effectiveOrigen === 'IMAGEN' ? true : p.voto_imagen_enviado
                  };
                }
                return p;
              }));
            }
          }
          await fetchCoordinatorData(true);
        }}
        isTransmitting={isTransmitting}
        isManualLocked={Boolean(selectedPersoneroForCounting?.voto_manual_enviado)}
        isSuperAdmin={false}
      />
    </section>
  );
};
