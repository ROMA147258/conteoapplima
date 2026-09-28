import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, Eye, AlertCircle, X, CheckCircle, Scale, Building } from 'lucide-react';

export const LegalPrivacyModal = ({ isOpen, onClose, initialTab = 'privacidad' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 25, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div 
        className="modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 id="legal-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>
                Marco Legal y Privacidad
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Conforme a la Ley N° 29733 de Protección de Datos Personales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs de Navegación */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          padding: '4px 16px 0'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('privacidad')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'privacidad' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'privacidad' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'privacidad' ? '600' : '400',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Lock size={16} />
            <span>Política de Privacidad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terminos')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'terminos' ? '29px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'terminos' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'terminos' ? '600' : '400',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} />
            <span>Términos y Condiciones</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('organizacion')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'organizacion' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'organizacion' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'organizacion' ? '600' : '400',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Building size={16} />
            <span>Organización y Datos</span>
          </button>
        </div>

        {/* Body del Modal */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          color: '#cbd5e1',
          flex: 1
        }}>
          {activeTab === 'privacidad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '12px 16px',
                borderRadius: '10px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <CheckCircle size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#e0f2fe' }}>
                  <strong>Principio de Minimización (Solo datos necesarios):</strong> Esta plataforma recopila exclusivamente el DNI, Nombre y Mesa de Votación estrictamente indispensables para la acreditación y control de personeros/coordinadores.
                </p>
              </div>

              <h4 style={{ margin: '8px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                1. Finalidad del Tratamiento de Datos
              </h4>
              <p style={{ margin: 0 }}>
                Los datos personales recolectados a través de esta aplicación son tratados exclusivamente para fines de verificación de identidad, registro de asistencia y transmisión segura de actas electorales para el proceso de escrutinio.
              </p>

              <h4 style={{ margin: '8px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                2. Confidencialidad y Seguridad Criptográfica
              </h4>
              <p style={{ margin: 0 }}>
                Toda la información transmitida (votos, firmas y fotografías de actas) está protegida mediante conexiones cifradas SSL/TLS y sellado criptográfico mediante algoritmos matemáticos <strong>SHA-256</strong>. Sus datos no serán cedidos, comercializados ni compartidos con terceras empresas ni redes publicitarias.
              </p>

              <h4 style={{ margin: '8px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                3. Política de Cookies y Almacenamiento Local
              </h4>
              <p style={{ margin: 0 }}>
                Esta aplicación <strong>NO utiliza cookies de seguimiento publicitario ni rastreo de terceros</strong>. Únicamente se emplean tokens técnicos de sesión en memoria local (<code>localStorage</code>) estrictamente necesarios para mantener la sesión autenticada.
              </p>

              <h4 style={{ margin: '8px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                4. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
              </h4>
              <p style={{ margin: 0 }}>
                Usted puede ejercer en cualquier momento sus derechos de rectificación o consulta de datos registrados comunicándose con el equipo de soporte técnico electoral o el Coordinador General asignado.
              </p>
            </div>
          )}

          {activeTab === 'terminos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: '4px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                1. Uso Exclusivo y Autorizado
              </h4>
              <p style={{ margin: 0 }}>
                El acceso a esta plataforma está reservado únicamente para el personal debidamente acreditado (Personeros de Mesa, Coordinadores Zonales y Distritales). Queda terminantemente prohibido el préstamo, cesión o divulgación de credenciales a terceros no autorizados.
              </p>

              <h4 style={{ margin: '8px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                2. Veracidad y Fidelidad de la Información
              </h4>
              <p style={{ margin: 0 }}>
                El usuario se compromete a ingresar los datos de las actas de escrutinio de forma exacta, transparente y fiel al documento oficial de la mesa, absteniéndose de ingresar registros simulados o adulterados.
              </p>

              <h4 style={{ margin: '8px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                3. Registro de Auditoría y Trazabilidad
              </h4>
              <p style={{ margin: 0 }}>
                Cada envío de acta, firma digital o modificación de voto queda registrado con marca de tiempo, dirección IP y firma digital del operador para efectos de transparencia y control de calidad.
              </p>

              <h4 style={{ margin: '8px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                4. Propiedad Intelectual y Derechos de Autor
              </h4>
              <p style={{ margin: 0 }}>
                El código fuente, arquitectura, diseño y marcas presentes en esta aplicación son de propiedad exclusiva de la organización. Todos los derechos reservados.
              </p>
            </div>
          )}

          {activeTab === 'organizacion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: '4px 0 0', color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                Identificación del Responsable
              </h4>
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Plataforma Oficial</span>
                  <strong style={{ color: '#fff' }}>Sistema de Control y Conteo Electoral Lima 2026</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Finalidad Operativa</span>
                  <span>Escrutinio rápido, veeduría ciudadana y fiscalización de actas electorales.</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Cumplimiento Normativo</span>
                  <span style={{ color: '#38bdf8' }}>Ley de Protección de Datos Personales N° 29733 (República del Perú).</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Canal Oficial de Soporte</span>
                  <span>soporte.electoral@lima2026.pe</span>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#fef08a'
              }}>
                Nota: Esta aplicación es una herramienta técnica independiente para el conteo paralelo y la veeduría electoral de personeros acreditados.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
