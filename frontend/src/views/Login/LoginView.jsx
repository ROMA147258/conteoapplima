import React, { useState } from 'react';
import { User, IdCard, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginView = () => {
  const { login } = useAuth();
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await login(nombre, dni);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="view-login" className="view active">
      <div className="card glass">
        <div className="card-header text-center">
          <h2>Acceso al Sistema</h2>
          <p className="subtitle">Registra tus datos de control electoral</p>
        </div>

        <form id="form-login" className="interactive-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-nombre">Nombre y Apellido</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                id="login-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Primer nombre y primer apellido"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="login-dni">DNI / Clave de Acceso</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <IdCard className="input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="login-dni"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ingresa tu DNI de 8 dígitos"
                autoComplete="current-password"
                maxLength="30"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                className="btn-input-action"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? "Ocultar clave" : "Ver clave"}
                aria-label={showPassword ? "Ocultar clave" : "Ver clave"}
                tabIndex="-1"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            className="btn btn-primary btn-block glow"
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span>Verificando...</span>
              </div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="footer-note text-center">
        <p>Elecciones de Alcaldía - Control de Actas</p>
      </div>
    </section>
  );
};
