import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useCoordinator } from '../../hooks/useCoordinator';
import { obtenerMesasOficialesColegio } from '../../constants/localesMesasLima';
import { isAsistencia3pmEnabled } from '../../utils/helpers';
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
  Sparkles
} from 'lucide-react';

export const CoordinatorView = () => {
  const { currentUser, logout, showToast } = useApp();
  const {
    personeros,
    infoColegios,
    coordinadoresLocales,
    asistencias,
    confirmacionesCoord,
    isLoading,
    fetchCoordinatorData,
    confirmPersoneroDirect
  } = useCoordinator();
  
  const [selectedColegio, setSelectedColegio] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'PENDING'
  const [activeMainTab, setActiveMainTab] = useState('ASISTENCIA'); // 'ASISTENCIA' | 'REPORTE'
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null); // { personero, fotoUrl, hora }

  // Normalizador de texto
  const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Detección precisa de rol: Personero de Centro de Votación (antes Coordinador Local) vs Coordinador Zonal
  const tablaOrigen = (currentUser?.tabla_origen || currentUser?.origenHoja || '').toString().toLowerCase();
  const rolUser = (currentUser?.rol || '').toString().toLowerCase();
  const tipoInterfaz = (currentUser?.tipo_interfaz || '').toString().toLowerCase();

  const isCoordinadorLocal = tipoInterfaz === 'coordinador_local' || tablaOrigen === 'rcoordinadores' || rolUser.includes('local');
  const isCoordinadorZonal = !isCoordinadorLocal;

  // Validación de distrito para Coordinador Zonal (Solo Villa María del Triunfo)
  const ubNormZonal = norm(currentUser?.ubicacion || currentUser?.distrito || '');
  const isVMTZonal = ubNormZonal.includes('villa maria del triunfo') || ubNormZonal.includes('vmt');

  // Verificación de horario para Asistencia (3:00 PM)
  const isAsistenciaHabilitada = isAsistencia3pmEnabled(currentUser);

  // 2. Extraer la lista de colegios asignados
  const colegiosAsignados = useMemo(() => {
    const rawCol = currentUser?.colegio || currentUser?.local || '';
    if (!rawCol) return [];
    return rawCol
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }, [currentUser]);

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
    const asis = asistencias.find(a => (a.dni || '').toString().trim() === pDni);
    if (asis?.fecha_hora) {
      return new Date(asis.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Asistencia marcada por el Personero de Centro de Votación
  const isMarcadoPorCoord = (p) => {
    const pDni = (p.dni || p.DNI || '').toString().trim();
    return Boolean(p.confirmado_coordinador || confirmacionesCoord.some(c => (c.personero_dni || '').toString().trim() === pDni));
  };

  // 5. Resumen por colegio
  const getColegioStats = (colNombre) => {
    const targetNorm = norm(colNombre);

    const colInfo = (infoColegios || []).find(ic => {
      const cNorm = norm(ic.colegio);
      return cNorm.includes(targetNorm) || targetNorm.includes(cNorm);
    });

    const personerosCol = personeros.filter(p => {
      const pCol = norm(p.colegio);
      return pCol.includes(targetNorm) || targetNorm.includes(pCol);
    });

    const totalMesasOficial = obtenerMesasOficialesColegio(colNombre) || (colInfo?.num_mesas ? parseInt(colInfo.num_mesas, 10) : 0);
    const totalMesas = totalMesasOficial > 0 ? totalMesasOficial : Math.max(personerosCol.length, 1);

    const asistieronValidados = personerosCol.filter(p => isMarcadoPorCoord(p)).length;
    const faltan = Math.max(0, totalMesas - asistieronValidados);

    const conFoto = personerosCol.filter(p => Boolean(getPersoneroPhoto(p))).length;
    const faltanFotos = Math.max(0, totalMesas - conFoto);

    const coordLocal = (coordinadoresLocales || []).find(c => {
      const cCol = norm(c.colegio);
      return cCol.includes(targetNorm) || targetNorm.includes(cCol);
    });

    const porcentaje = totalMesas > 0 ? Math.min(100, Math.round((asistieronValidados / totalMesas) * 100)) : 0;
    const porcentajeFotos = totalMesas > 0 ? Math.min(100, Math.round((conFoto / totalMesas) * 100)) : 0;
    const isCompleto = totalMesas > 0 && asistieronValidados >= totalMesas;

    return {
      totalMesas,
      asistieronValidados,
      faltan,
      conFoto,
      faltanFotos,
      porcentaje,
      porcentajeFotos,
      isCompleto,
      coordLocal,
      personerosCol,
      direccion: colInfo?.direccion || ''
    };
  };

  // 6. Totales Globales para Coordinador Zonal
  const statsGlobales = useMemo(() => {
    let mesasTotales = 0;
    let validadosTotales = 0;
    let fotosTotales = 0;

    for (const colName of colegiosAsignados) {
      const st = getColegioStats(colName);
      mesasTotales += st.totalMesas;
      validadosTotales += st.asistieronValidados;
      fotosTotales += st.conFoto;
    }

    if (mesasTotales === 0 && personeros.length > 0) {
      mesasTotales = personeros.length;
      validadosTotales = personeros.filter(p => isMarcadoPorCoord(p)).length;
      fotosTotales = personeros.filter(p => Boolean(getPersoneroPhoto(p))).length;
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
  }, [colegiosAsignados, infoColegios, personeros, confirmacionesCoord, asistencias]);

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

  // Filtro de Reporte Fotográfico (Solo personeros que enviaron foto)
  const filteredPersonerosReporte = useMemo(() => {
    return personerosDelColegio
      .filter(p => Boolean(getPersoneroPhoto(p)))
      .filter(p => {
        const q = searchTerm.toLowerCase();
        const name = (p.nombre || '').toLowerCase();
        const dni = (p.dni || p.DNI || '').toString();
        const mesa = (p.mesa || '').toString();
        return name.includes(q) || dni.includes(q) || mesa.includes(q);
      });
  }, [personerosDelColegio, searchTerm, asistencias]);

  // Manejador del click de asistencia con validación de horario a las 3:00 PM
  const handleMarcarAsistencia = (personero) => {
    if (!isAsistenciaHabilitada) {
      showToast('🔒 La marcación de asistencia se activará a partir de las 3:00 PM.', 'warning');
      return;
    }
    confirmPersoneroDirect(personero);
  };

  return (
    <section id="view-coordinator" className="view active" style={{ display: 'block', maxWidth: '880px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── HEADER DEL USUARIO ── */}
      <div className="user-info-bar glass" style={{ borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
        <div className="user-details" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <ShieldCheck className="text-secondary" size={28} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="user-label" style={{ color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isCoordinadorLocal ? 'Personero de Centro de Votación' : 'Coordinador Zonal'} (Aprobado)
              </span>
            </div>
            <span className="user-name" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{currentUser?.nombre || 'Personero Oficial'}</span>
            <span className="user-info-text" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              DNI: <strong style={{ color: '#e2e8f0' }}>{currentUser?.dni || ''}</strong>
              {(currentUser?.celular || currentUser?.telefono) && (
                <> • Cel: <strong style={{ color: '#e2e8f0' }}>{currentUser.celular || currentUser.telefono}</strong></>
              )}
              {' '}| Distrito: <strong style={{ color: '#e2e8f0' }}>{currentUser?.ubicacion || 'Lima'}</strong>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-icon-header"
            onClick={fetchCoordinatorData}
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
      {/* ── CASO A: COORDINADOR ZONAL (TABLA rcoordinadoresz) ── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {isCoordinadorZonal && !isVMTZonal && (
        <div className="card glass" style={{ marginTop: '20px', padding: '36px 20px', textAlign: 'center', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', margin: '0 0 8px 0' }}>
            Acceso Restringido
          </h3>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
            La interfaz de <strong>Coordinador Zonal</strong> se encuentra habilitada exclusivamente para el distrito de <strong>Villa María del Triunfo</strong>.
            <br /><br />
            Tu distrito registrado en el sistema es: <strong style={{ color: '#ffffff' }}>{currentUser?.ubicacion || 'No asignado'}</strong>.
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

      {isCoordinadorZonal && isVMTZonal && (
        <>
          {/* Resumen Global Zonal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '12px' }}>
            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={14} color="#94a3b8" /> Colegios a Cargo
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {colegiosAsignados.length || 1}
              </div>
            </div>

            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} color="#94a3b8" /> Total Mesas Oficiales
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {statsGlobales.mesasTotales}
              </div>
            </div>

            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} color="#4ade80" /> Asistencia Marcada
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4ade80', marginTop: '4px' }}>
                {statsGlobales.validadosTotales} <span style={{ fontSize: '0.78rem', color: '#86efac', fontWeight: 600 }}>({statsGlobales.porcentajeGlobal}%)</span>
              </div>
            </div>

            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Camera size={14} color="#38bdf8" /> Fotos Instalación
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                {statsGlobales.fotosTotales}
              </div>
            </div>
          </div>

          {/* Nivel 1: Lista de Colegios (Vista Principal del Coordinador Zonal) */}
          {!selectedColegio && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <School size={20} color="#38bdf8" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                    Centros de Votación Asignados ({colegiosAsignados.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Toca un centro de votación para ver su detalle
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colegiosAsignados.map((colName, idx) => {
                  const stats = getColegioStats(colName);
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedColegio(colName)}
                      style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: `1px solid ${stats.isCompleto ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.2)'}`,
                        borderRadius: '16px',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                      className="colegio-card-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                              {colName}
                            </span>
                            {stats.isCompleto ? (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#4ade80',
                                border: '1px solid #10b981',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800
                              }}>
                                ✓ ASISTENCIA COMPLETA ({stats.asistieronValidados}/{stats.totalMesas})
                              </span>
                            ) : (
                              <span style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                ⏳ FALTAN {stats.faltan} MESAS POR ASISTIR
                              </span>
                            )}
                          </div>

                          {/* Personero de Centro de Votación Asignado */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#cbd5e1', fontSize: '0.84rem' }}>
                            <User size={14} color="#38bdf8" />
                            <span>
                              Personero de C.V.: <strong style={{ color: '#38bdf8' }}>{stats.coordLocal?.nombre || 'Pendiente de Asignación'}</strong>
                            </span>
                            {stats.coordLocal?.dni && (
                              <span style={{ color: '#94a3b8' }}>(DNI: {stats.coordLocal.dni})</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>
                          <span>Ver Mesas</span>
                          <ChevronRight size={18} />
                        </div>
                      </div>

                      {/* Barra de Progreso de Asistencia */}
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                          <span>Asistencia: <strong>{stats.asistieronValidados} de {stats.totalMesas} mesas</strong> • Fotos: <strong>{stats.conFoto}</strong></span>
                          <span style={{ color: stats.isCompleto ? '#4ade80' : '#38bdf8' }}>{stats.porcentaje}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${stats.porcentaje}%`,
                            background: stats.isCompleto ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #2563eb)',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ── CASO B: DETALLE DE CENTRO DE VOTACIÓN CON LAS 2 OPCIONES ── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {(isCoordinadorLocal || (isCoordinadorZonal && isVMTZonal && selectedColegio)) && (() => {
        const targetCol = activeColegioNombre;
        const stats = getColegioStats(targetCol);

        return (
          <div style={{ marginTop: isCoordinadorLocal ? '14px' : '16px' }}>
            {/* Botón Volver (solo visible para Coordinador Zonal) */}
            {isCoordinadorZonal && (
              <button
                type="button"
                onClick={() => {
                  setSelectedColegio(null);
                  setSearchTerm('');
                  setActiveFilter('ALL');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                <ArrowLeft size={16} /> Volver a mis centros de votación
              </button>
            )}

            {/* Tarjeta del Centro de Votación */}
            <div className="card glass" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Lado Izquierdo: Datos del Centro */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '14px', flexShrink: 0 }}>
                    <School size={30} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isCoordinadorLocal ? 'Mi Centro de Votación Asignado:' : 'Detalle de Centro de Votación:'}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
                      {targetCol}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {currentUser?.ubicacion || 'Lima'} {stats.direccion ? `• ${stats.direccion}` : ''}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Ficha del Personero de Centro de Votación (visible para Zonal) */}
                {isCoordinadorZonal && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    minWidth: '220px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={13} color="#38bdf8" /> Personero de Centro de Votación
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#f8fafc', marginTop: '3px' }}>
                      {stats.coordLocal?.nombre || 'Pendiente de Asignación'}
                    </div>
                    {stats.coordLocal?.dni && (
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                        DNI: <strong style={{ color: '#e2e8f0' }}>{stats.coordLocal.dni}</strong>
                        {stats.coordLocal?.celular ? ` • Cel: ${stats.coordLocal.celular}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Estadísticas Rápidas del Centro */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginTop: '14px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>Total Mesas</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>{stats.totalMesas}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 700 }}>Asistencias Marcadas</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80' }}>{stats.asistieronValidados}</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700 }}>Faltan Asistencia</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>{stats.faltan}</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>Fotos Instalación</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>{stats.conFoto}</div>
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
                background: 'rgba(15, 23, 42, 0.65)',
                padding: '6px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <button
                type="button"
                id="btn-tab-asistencia"
                onClick={() => {
                  setActiveMainTab('ASISTENCIA');
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
                  background: activeMainTab === 'ASISTENCIA' 
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                    : 'transparent',
                  color: activeMainTab === 'ASISTENCIA' ? '#ffffff' : '#94a3b8',
                  boxShadow: activeMainTab === 'ASISTENCIA' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none'
                }}
              >
                <UserCheck size={18} />
                <span>Asistencia</span>
                {stats.asistieronValidados > 0 && (
                  <span style={{
                    background: activeMainTab === 'ASISTENCIA' ? 'rgba(255,255,255,0.25)' : 'rgba(56, 189, 248, 0.2)',
                    color: activeMainTab === 'ASISTENCIA' ? '#ffffff' : '#38bdf8',
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
                  setActiveMainTab('REPORTE');
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
                  background: activeMainTab === 'REPORTE' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' 
                    : 'transparent',
                  color: activeMainTab === 'REPORTE' ? '#ffffff' : '#94a3b8',
                  boxShadow: activeMainTab === 'REPORTE' ? '0 4px 14px rgba(139, 92, 246, 0.35)' : 'none'
                }}
              >
                <Camera size={18} />
                <span>Reporte de Instalación</span>
                <span style={{
                  background: activeMainTab === 'REPORTE' ? 'rgba(255,255,255,0.25)' : 'rgba(139, 92, 246, 0.2)',
                  color: activeMainTab === 'REPORTE' ? '#ffffff' : '#c4b5fd',
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
            {activeMainTab === 'ASISTENCIA' && (
              <div style={{ marginTop: '14px' }}>
                
                {/* Banner de Estado Horario (3:00 PM) */}
                {!isAsistenciaHabilitada ? (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '14px'
                    }}
                  >
                    <Lock size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.84rem', color: '#fef3c7' }}>
                      <strong style={{ color: '#fbbf24' }}>🔒 Control de Horario:</strong> La opción de marcar asistencia de los personeros de mesa se activará automáticamente a partir de las <strong>3:00 PM (15:00 hrs)</strong>.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '14px'
                    }}
                  >
                    <CheckCircle2 size={18} color="#4ade80" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#86efac' }}>
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
                      background: activeFilter === 'ALL' ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
                      color: activeFilter === 'ALL' ? '#0f172a' : '#cbd5e1',
                      border: `1px solid ${activeFilter === 'ALL' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
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
                      background: activeFilter === 'CONFIRMED' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                      color: activeFilter === 'CONFIRMED' ? '#ffffff' : '#4ade80',
                      border: `1px solid ${activeFilter === 'CONFIRMED' ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
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
                      background: activeFilter === 'PENDING' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)',
                      color: activeFilter === 'PENDING' ? '#0f172a' : '#fbbf24',
                      border: `1px solid ${activeFilter === 'PENDING' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'}`,
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
                  <div className="input-wrapper" style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px' }}>
                    <Search className="input-icon" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar personero por nombre, DNI o mesa..."
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {/* Padrón de Personeros para Asistencia */}
                <div className="table-container glass" style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div
                    className="table-section-header"
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      borderLeft: '4px solid #38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={19} color="#38bdf8" />
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc' }}>
                        Mesas y Personeros Asignados ({filteredPersonerosAsistencia.length})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                      {stats.isCompleto ? '✓ Asistencia al 100%' : `Faltan ${stats.faltan} mesas`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                    {filteredPersonerosAsistencia.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8', fontSize: '0.92rem' }}>
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
                                ? 'rgba(16, 185, 129, 0.08)'
                                : 'rgba(15, 23, 42, 0.65)',
                              border: `1px solid ${
                                isCoordConfirmed 
                                  ? 'rgba(16, 185, 129, 0.4)' 
                                  : 'rgba(255, 255, 255, 0.08)'
                              }`,
                              borderRadius: '14px',
                              padding: '14px 16px',
                              userSelect: 'none',
                              boxShadow: isCoordConfirmed ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none'
                            }}
                          >
                            {/* Datos del Personero */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#f8fafc' }}>
                                  {p.nombre}
                                </span>

                                {/* Badge de Estado */}
                                {isCoordConfirmed ? (
                                  <span style={{
                                    background: 'rgba(16, 185, 129, 0.18)',
                                    color: '#4ade80',
                                    border: '1px solid rgba(16, 185, 129, 0.5)',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <CheckCircle size={12} /> {isCoordinadorLocal ? 'Asistencia Marcada' : 'Marcada por Personero C.V.'}
                                  </span>
                                ) : llegada.llegado ? (
                                  <span style={{
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    color: '#38bdf8',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Clock size={12} /> Instalación {llegada.hora ? `(${llegada.hora})` : ''}
                                  </span>
                                ) : (
                                  <span style={{
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245, 158, 11, 0.35)',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Clock size={12} /> Pendiente de Asistencia
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                <span>DNI: <strong style={{ color: '#cbd5e1' }}>{pDni}</strong></span>
                                <span>Mesa: <strong style={{ color: '#38bdf8' }}>{p.mesa || 'S/M'}</strong></span>
                                {p.colegio && (
                                  <span>Local: <strong style={{ color: '#f1f5f9' }}>{p.colegio}</strong></span>
                                )}
                              </div>
                            </div>

                            {/* Acción / Indicador */}
                            <div style={{ flexShrink: 0 }}>
                              {isCoordinadorLocal ? (
                                isCoordConfirmed ? (
                                  <div style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: '1px solid #10b981',
                                    color: '#ffffff',
                                    borderRadius: '10px',
                                    padding: '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.35)'
                                  }}>
                                    <CheckCircle2 size={16} color="#ffffff" />
                                    <span>Marcado</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarcarAsistencia(p);
                                    }}
                                    title={!isAsistenciaHabilitada ? 'Se activará a las 3:00 PM' : 'Marcar asistencia'}
                                    style={{
                                      background: !isAsistenciaHabilitada 
                                        ? 'rgba(245, 158, 11, 0.1)' 
                                        : 'rgba(56, 189, 248, 0.15)',
                                      border: !isAsistenciaHabilitada
                                        ? '1px solid rgba(245, 158, 11, 0.35)'
                                        : '1px solid rgba(56, 189, 248, 0.45)',
                                      color: !isAsistenciaHabilitada ? '#fbbf24' : '#38bdf8',
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
                                )
                              ) : (
                                isCoordConfirmed ? (
                                  <div style={{
                                    background: 'rgba(16, 185, 129, 0.16)',
                                    border: '1px solid rgba(16, 185, 129, 0.45)',
                                    color: '#4ade80',
                                    borderRadius: '10px',
                                    padding: '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.82rem'
                                  }}>
                                    <CheckCircle2 size={16} color="#4ade80" />
                                    <span>Asistió</span>
                                  </div>
                                ) : (
                                  <div style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#94a3b8',
                                    borderRadius: '10px',
                                    padding: '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 600,
                                    fontSize: '0.82rem'
                                  }}>
                                    <Clock size={16} color="#fbbf24" />
                                    <span style={{ color: '#cbd5e1' }}>No asistió</span>
                                  </div>
                                )
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
            {activeMainTab === 'REPORTE' && (
              <div style={{ marginTop: '14px' }}>
                
                {/* Banner Informativo del Reporte */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.12) 0%, rgba(15, 23, 42, 0.5) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
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
                    <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '10px', borderRadius: '10px' }}>
                      <Camera size={24} color="#c4b5fd" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                        Reporte Fotográfico de Instalación de Mesas
                      </h4>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        Fotografías enviadas por los personeros de mesa al confirmar la instalación de su mesa de sufragio.
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#c4b5fd'
                  }}>
                    📸 {stats.conFoto} de {stats.totalMesas} mesas registradas ({stats.porcentajeFotos}%)
                  </div>
                </div>

                {/* Barra de Búsqueda de Reporte */}
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <div className="input-wrapper" style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px' }}>
                    <Search className="input-icon" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por personero, DNI o mesa en fotos..."
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {/* Galería / Grid de Fotografías de Instalación */}
                {filteredPersonerosReporte.length === 0 ? (
                  <div className="glass" style={{ textAlign: 'center', padding: '48px 20px', borderRadius: '16px', color: '#94a3b8' }}>
                    <Camera size={42} color="#8b5cf6" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                      {searchTerm ? 'No se encontraron fotos con la búsqueda actual' : 'Aún no se han recibido fotografías de instalación'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '420px', margin: '0 auto' }}>
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
                            border: '1px solid rgba(139, 92, 246, 0.35)',
                            background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.15)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Encabezado de la Ficha */}
                          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
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
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#4ade80',
                                border: '1px solid #10b981',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <CheckCircle2 size={12} /> Foto Enviada
                              </span>
                            </div>

                            <div style={{ marginTop: '8px', fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc', lineHeight: 1.3 }}>
                              {p.nombre}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
                              DNI: <strong style={{ color: '#cbd5e1' }}>{pDni}</strong>
                              {horaEnvio && (
                                <> • Enviado a las: <strong style={{ color: '#38bdf8' }}>{horaEnvio}</strong></>
                              )}
                            </div>
                          </div>

                          {/* Imagen / Vista Previa */}
                          <div
                            style={{
                              height: '180px',
                              background: '#090d16',
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
                          <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
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
                                background: 'rgba(139, 92, 246, 0.15)',
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                color: '#c4b5fd',
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
            background: 'rgba(0, 0, 0, 0.85)',
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
              background: '#0f172a',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.95)'
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
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                    {selectedPhotoModal.personero?.nombre}
                  </h3>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
                  DNI: <strong style={{ color: '#e2e8f0' }}>{selectedPhotoModal.personero?.dni}</strong>
                  {selectedPhotoModal.hora && (
                    <> • Hora de Registro: <strong style={{ color: '#38bdf8' }}>{selectedPhotoModal.hora}</strong></>
                  )}
                  {' '}| Centro: <strong style={{ color: '#f8fafc' }}>{selectedPhotoModal.personero?.colegio || activeColegioNombre}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
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
                background: '#020617',
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
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.95)'
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={14} /> Foto oficial de instalación validada
              </span>

              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
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
    </section>
  );
};
