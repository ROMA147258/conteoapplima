import React, { useState } from 'react';
import { User, IdCard, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LegalPrivacyModal } from '../../components/modals/LegalPrivacyModal';

export const LoginView = () => {
  const { login } = useAuth();
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('privacidad');

  const openLegalModal = (tab) => {
    setLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!nombre.trim() && !dni.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(nombre, dni);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="view-login" className="view active" style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="card glass">
        <div className="card-header text-center">
          <h2>Acceso al Sistema</h2>
          <p className="subtitle">Registra tus datos de control electoral</p>
        </div>

        <form id="form-login" className="interactive-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="login-nombre">Nombre y Apellido</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} aria-hidden="true" />
              <input
                type="text"
                id="login-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Primer nombre y primer apellido"
                autoComplete="name"
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="login-dni">DNI / Clave de Acceso</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <IdCard className="input-icon" size={18} aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                id="login-dni"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="DNI (o Clave si eres Coordinador)"
                autoComplete="current-password"
                maxLength="30"
                style={{ paddingRight: '44px' }}
                required
                aria-required="true"
              />
              <button
                type="button"
                className="btn-input-action"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? "Ocultar clave" : "Ver clave"}
                aria-label={showPassword ? "Ocultar clave" : "Ver clave"}
                tabIndex="0"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? '#0284c7' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            className="btn btn-primary btn-block glow"
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span>Verificando...</span>
              </div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>

          {/* Aviso de Consentimiento Legal y Privacidad */}
          <div style={{
            marginTop: '16px',
            fontSize: '0.78rem',
            textAlign: 'center',
            color: '#94a3b8',
            lineHeight: '1.4'
          }}>
            <p style={{ margin: 0 }}>
              Al ingresar, aceptas los{' '}
              <button
                type="button"
                onClick={() => openLegalModal('terminos')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: 'inherit',
                  fontFamily: 'inherit'
                }}
              >
                Términos de Uso
              </button>
              {' '}y la{' '}
              <button
                type="button"
                onClick={() => openLegalModal('privacidad')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: 'inherit',
                  fontFamily: 'inherit'
                }}
              >
                Política de Privacidad
              </button>
              .
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '6px',
              color: '#64748b'
            }}>
              <ShieldCheck size={14} color="#38bdf8" aria-hidden="true" />
              <span>Protección de Datos Personales (Ley N° 29733)</span>
            </div>
          </div>
        </form>
      </div>

      <div className="footer-note text-center" style={{ marginTop: '20px' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
          Elecciones de Alcaldía — Control y Fiscalización de Actas
        </p>
        <button
          type="button"
          onClick={() => openLegalModal('organizacion')}
          style={{
            marginTop: '4px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.75rem',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          © 2026 Plataforma Electoral · Ver Marco Legal y Organización
        </button>
      </div>

      {/* Modal de Privacidad y Términos */}
      <LegalPrivacyModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalTab}
      />
    </section>
  );
};

