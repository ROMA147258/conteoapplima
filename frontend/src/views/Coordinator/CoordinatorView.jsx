import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useCoordinator } from '../../hooks/useCoordinator';
import { obtenerMesasOficialesColegio } from '../../constants/localesMesasLima';
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
  Sparkles
} from 'lucide-react';

export const CoordinatorView = () => {
  const { currentUser, logout } = useApp();
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

  // Normalizador de texto
  const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Detección precisa de origen: rcoordinadores (Local) vs rcoordinadoresz (Zonal)
  const tablaOrigen = (currentUser?.tabla_origen || currentUser?.origenHoja || '').toString().toLowerCase();
  const rolUser = (currentUser?.rol || '').toString().toLowerCase();
  const tipoInterfaz = (currentUser?.tipo_interfaz || '').toString().toLowerCase();

  const isCoordinadorLocal = tipoInterfaz === 'coordinador_local' || tablaOrigen === 'rcoordinadores' || rolUser.includes('local');
  const isCoordinadorZonal = !isCoordinadorLocal;

  // 2. Extraer la lista de colegios asignados
  const colegiosAsignados = useMemo(() => {
    const rawCol = currentUser?.colegio || currentUser?.local || '';
    if (!rawCol) return [];
    return rawCol
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }, [currentUser]);

  // Si es Coordinador Local, seleccionar su único colegio automáticamente
  useEffect(() => {
    if (isCoordinadorLocal && colegiosAsignados.length > 0 && !selectedColegio) {
      setSelectedColegio(colegiosAsignados[0]);
    }
  }, [isCoordinadorLocal, colegiosAsignados, selectedColegio]);

  // 3. Helper de estado de llegada (GPS/Foto de personero)
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

  // Asistencia marcada por el Coordinador Local
  const isMarcadoPorCoord = (p) => {
    const pDni = (p.dni || p.DNI || '').toString().trim();
    return Boolean(p.confirmado_coordinador || confirmacionesCoord.some(c => (c.personero_dni || '').toString().trim() === pDni));
  };

  // 4. Resumen por colegio
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

    const coordLocal = (coordinadoresLocales || []).find(c => {
      const cCol = norm(c.colegio);
      return cCol.includes(targetNorm) || targetNorm.includes(cCol);
    });

    const porcentaje = totalMesas > 0 ? Math.min(100, Math.round((asistieronValidados / totalMesas) * 100)) : 0;
    const isCompleto = totalMesas > 0 && asistieronValidados >= totalMesas;

    return {
      totalMesas,
      asistieronValidados,
      faltan,
      porcentaje,
      isCompleto,
      coordLocal,
      personerosCol,
      direccion: colInfo?.direccion || ''
    };
  };

  // 5. Totales Globales para Coordinador Zonal
  const statsGlobales = useMemo(() => {
    let mesasTotales = 0;
    let validadosTotales = 0;

    for (const colName of colegiosAsignados) {
      const st = getColegioStats(colName);
      mesasTotales += st.totalMesas;
      validadosTotales += st.asistieronValidados;
    }

    if (mesasTotales === 0 && personeros.length > 0) {
      mesasTotales = personeros.length;
      validadosTotales = personeros.filter(p => isMarcadoPorCoord(p)).length;
    }

    const faltanTotales = Math.max(0, mesasTotales - validadosTotales);
    const porcentajeGlobal = mesasTotales > 0 ? Math.round((validadosTotales / mesasTotales) * 100) : 0;

    return {
      mesasTotales,
      validadosTotales,
      faltanTotales,
      porcentajeGlobal
    };
  }, [colegiosAsignados, infoColegios, personeros, confirmacionesCoord]);

  // 6. Personeros del colegio activo
  const activeColegioNombre = isCoordinadorLocal ? (colegiosAsignados[0] || currentUser?.colegio || '') : selectedColegio;

  const personerosDelColegio = useMemo(() => {
    if (!activeColegioNombre) return personeros;
    const stats = getColegioStats(activeColegioNombre);
    return stats.personerosCol;
  }, [activeColegioNombre, personeros, confirmacionesCoord]);

  const filteredPersoneros = useMemo(() => {
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

  return (
    <section id="view-coordinator" className="view active" style={{ display: 'block', maxWidth: '840px', margin: '0 auto', paddingBottom: '36px' }}>
      
      {/* ── HEADER DEL COORDINADOR ── */}
      <div className="user-info-bar glass" style={{ borderRadius: '16px', padding: '14px 18px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
        <div className="user-details" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <ShieldCheck className="text-secondary" size={28} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="user-label" style={{ color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isCoordinadorLocal ? 'Coordinador de Local' : 'Coordinador Zonal'} (Aprobado)
              </span>
            </div>
            <span className="user-name" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{currentUser?.nombre || 'Coordinador Oficial'}</span>
            <span className="user-info-text" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              DNI: <strong style={{ color: '#e2e8f0' }}>{currentUser?.dni || ''}</strong> | Distrito: <strong style={{ color: '#e2e8f0' }}>{currentUser?.ubicacion || 'Lima'}</strong>
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
      {isCoordinadorZonal && (
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

            <div className="glass" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} color="#fbbf24" /> Faltan por Asistir
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
                {statsGlobales.faltanTotales}
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
                    Colegios Asignados ({colegiosAsignados.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Toca un colegio para ver su detalle
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

                          {/* Coordinador Local Asignado */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#cbd5e1', fontSize: '0.84rem' }}>
                            <User size={14} color="#38bdf8" />
                            <span>
                              Coord. Local: <strong style={{ color: '#38bdf8' }}>{stats.coordLocal?.nombre || 'Coordinador Asignado'}</strong>
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
                          <span>Asistencia marcada por Coord. Local: <strong>{stats.asistieronValidados} de {stats.totalMesas} mesas</strong></span>
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
      {/* ── CASO B: DETALLE DE COLEGIO (LOCAL O ZONAL SELECCIONADO) ── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {(selectedColegio || isCoordinadorLocal) && (() => {
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
                <ArrowLeft size={16} /> Volver a mis colegios
              </button>
            )}

            {/* Tarjeta del Colegio */}
            <div className="card glass" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Lado Izquierdo: Datos del Colegio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '14px', flexShrink: 0 }}>
                    <School size={30} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isCoordinadorLocal ? 'Mi Local Asignado:' : 'Detalle de Colegio:'}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
                      {targetCol}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {currentUser?.ubicacion || 'Lima'} {stats.direccion ? `• ${stats.direccion}` : ''}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho (Al Costado): Ficha del Coordinador Local */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  minWidth: '220px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} color="#38bdf8" /> Coordinador Local
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
              </div>

              {/* Estadísticas del Colegio */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '14px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>Total Mesas Oficiales</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>{stats.totalMesas}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 700 }}>
                    {isCoordinadorLocal ? 'Asistencias Marcadas' : 'Asistencia Marcada'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80' }}>{stats.asistieronValidados}</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700 }}>
                    {isCoordinadorLocal ? 'Faltan por Marcar' : 'Faltan por Asistir'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>{stats.faltan}</div>
                </div>
              </div>
            </div>

            {/* Filtros Rápidos */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '14px', paddingBottom: '4px' }}>
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

            {/* Padrón de Personeros */}
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
                    Mesas y Personeros Asignados ({filteredPersoneros.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  {stats.isCompleto ? '✓ Asistencia al 100%' : `Faltan ${stats.faltan} mesas por marcar`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                {filteredPersoneros.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8', fontSize: '0.92rem' }}>
                    {isLoading ? 'Cargando datos del colegio...' : 'No se encontraron personeros con los filtros actuales.'}
                  </div>
                ) : (
                  filteredPersoneros.map((p, idx) => {
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
                                <CheckCircle size={12} /> {isCoordinadorLocal ? 'Asistencia Marcada' : 'Marcada por Coord. Local'}
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
                                <Clock size={12} /> Llegó {llegada.hora ? `(${llegada.hora})` : ''} {llegada.metodo ? `• ${llegada.metodo}` : ''}
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

                        {/* Acción / Indicador según Rol */}
                        <div style={{ flexShrink: 0 }}>
                          {isCoordinadorLocal ? (
                            /* ── BOTÓN PARA COORDINADOR LOCAL (rcoordinadores): MARCA ASISTENCIA ── */
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
                                  confirmPersoneroDirect(p);
                                }}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid rgba(56, 189, 248, 0.45)',
                                  color: '#38bdf8',
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
                                <Circle size={16} />
                                <span>Marcar Asistencia</span>
                              </button>
                            )
                          ) : (
                            /* ── INDICADOR PARA COORDINADOR ZONAL (rcoordinadoresz): SOLO LECTURA ── */
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
        );
      })()}
    </section>
  );
};
