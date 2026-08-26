import React, { useState } from 'react';

const PARTY_IMAGE_MAP = {
  'SOMOS PERU': '/images/SOMOSPERU.jpg',
  'SP': '/images/SOMOSPERU.jpg',
  'RENOVACION': '/images/RENOVACIONPOPULAR.jpg',
  'RENOVACION POPULAR': '/images/RENOVACIONPOPULAR.jpg',
  'RP': '/images/RENOVACIONPOPULAR.jpg',
  'AHORA NACION': '/images/AHORANACION.jpg',
  'AN': '/images/AHORANACION.jpg',
  'AVANZA PAIS': '/images/AVANZAPAIS.jpg',
  'AVANZA': '/images/AVANZAPAIS.jpg',
  'PODEMOS': '/images/Logo_Podemos_Perú.png',
  'PODEMOS PERU': '/images/Logo_Podemos_Perú.png',
  'JP': '/images/Logo_juntos_por_el_Peru.svg.webp',
  'JUNTOS POR EL PERU': '/images/Logo_juntos_por_el_Peru.svg.webp',
  'OBRAS': '/images/PARTIDOCIVICOOBRAS.png',
  'PARTIDO CIVICO OBRAS': '/images/PARTIDOCIVICOOBRAS.png',
  'FREPAP': '/images/FREPAP.jpg',
  'ACCION POPULAR': '/images/ACCIONPOPULAR.jpg',
  'AP': '/images/ACCIONPOPULAR.jpg',
  'VENCEREMOS': '/images/Logo_Alianza_Electoral_Venceremos.png',
  'AEV': '/images/Logo_Alianza_Electoral_Venceremos.png',
  'ALIANZA ELECTORAL VENCEREMOS': '/images/Logo_Alianza_Electoral_Venceremos.png',
  'MORADO': '/images/PARTIDOMORADO.jpg',
  'PARTIDO MORADO': '/images/PARTIDOMORADO.jpg',
  'PM': '/images/PARTIDOMORADO.jpg'
};

export const PartyLogo = ({ partyKey, partyId, size = 36, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const normKey = (partyKey || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const imageSrc = PARTY_IMAGE_MAP[normKey];

  if (imageSrc && !hasError) {
    return (
      <div
        className={`party-logo-wrapper ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          flexShrink: 0
        }}
        title={partyKey}
      >
        <img
          src={imageSrc}
          alt={partyKey}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
    );
  }

  // Fallback a símbolo vectorial para partidos restantes (o si falla la carga)
  const renderSymbol = () => {
    switch (normKey) {
      case 'SOMOS PERU':
      case 'SP':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#1e3a8a" />
            <path
              d="M18 29s-9-6.2-11.5-11.2C4.5 13.6 6.8 8.5 11.5 8.5c2.7 0 5 1.7 6.5 3.8 1.5-2.1 3.8-3.8 6.5-3.8 4.7 0 7 5.1 5 9.3C27 22.8 18 29 18 29z"
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text x="18" y="19" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">SP</text>
          </svg>
        );

      case 'RENOVACION':
      case 'RP':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#0284c7" />
            <circle cx="18" cy="18" r="14" fill="#38bdf8" />
            <path
              d="M12 10h7a5 5 0 0 1 5 5c0 3.2-2.3 5-5 5h-4v6h-3V10zm3 3v4.5h3.8c1.3 0 2.2-.8 2.2-2.2s-.9-2.3-2.2-2.3H15z"
              fill="#ffffff"
            />
            <path d="M19 20l4.5 6h-3.8L16 20h3z" fill="#ffffff" />
          </svg>
        );

      case 'ESPERANZA':
      case 'FE':
      case 'FRENTE DE LA ESPERANZA':
      case 'FRENTE DE LA ESPERANZA 2021':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#15803d" />
            <path d="M17 7h2v11h-2z" fill="#facc15" />
            <path d="M13 18h10l2 11H11l2-11z" fill="#eab308" stroke="#ffffff" strokeWidth="1" />
            <line x1="15" y1="21" x2="14" y2="29" stroke="#713f12" strokeWidth="1" />
            <line x1="18" y1="21" x2="18" y2="29" stroke="#713f12" strokeWidth="1" />
            <line x1="21" y1="21" x2="22" y2="29" stroke="#713f12" strokeWidth="1" />
          </svg>
        );

      case 'VISION PERU':
      case 'VP':
      case 'VISION':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#0369a1" />
            <path d="M8 18s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" fill="#ffffff" stroke="#facc15" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="4.5" fill="#0284c7" />
            <circle cx="18" cy="18" r="2" fill="#0f172a" />
          </svg>
        );

      case 'APRA':
      case 'PARTIDO APRISTA PERUANO':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#ffffff" stroke="#dc2626" strokeWidth="2" />
            <path
              d="M18 6l3.6 8 8.4 1-6.2 5.6 1.8 8.4-7.6-4.4-7.6 4.4 1.8-8.4-6.2-5.6 8.4-1z"
              fill="#dc2626"
            />
          </svg>
        );

      case 'FP':
      case 'FUERZA POPULAR':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#ea580c" />
            <circle cx="18" cy="18" r="14" fill="#f97316" />
            <path
              d="M12 9h4v7.5l6-7.5h5l-7 8 7.5 9h-5l-6.5-8v8h-4V9z"
              fill="#ffffff"
            />
          </svg>
        );

      case 'PPC':
      case 'PARTIDO POPULAR CRISTIANO':
      case 'PARTIDO POPULAR CRISTIANO (PPC)':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#15803d" />
            <circle cx="18" cy="18" r="13" fill="#16a34a" />
            <text x="18" y="22" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">PPC</text>
          </svg>
        );

      case 'PROGRESEMOS':
      case 'PROG':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#0f766e" />
            <path d="M10 24l8-8 4 4 6-8" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
            <path d="M22 12h6v6" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );

      case 'BUEN GOBIERNO':
      case 'PBG':
      case 'PARTIDO DEL BUEN GOBIERNO':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#1e3a8a" />
            <circle cx="18" cy="18" r="13" fill="#2563eb" />
            <path d="M18 9v14M11 13h14M11 13l-3 6h6l-3-6zm14 0l-3 6h6l-3-6z" fill="none" stroke="#facc15" strokeWidth="1.8" />
          </svg>
        );

      case 'VERDE':
      case 'PDV':
      case 'PARTIDO DEMOCRATA VERDE':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#166534" />
            <path
              d="M10 26c3-10 10-16 16-16 0 6-6 13-16 16z"
              fill="#4ade80"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <path d="M12 24c4-4 8-8 12-12" stroke="#166534" strokeWidth="1.5" />
          </svg>
        );

      case 'PERU LIBRE':
      case 'PL':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#dc2626" />
            <path d="M10 26l3-8 10-10 5 5-10 10-8 3z" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
            <path d="M10 26l3-1-2-2-1 3z" fill="#0f172a" />
            <path d="M23 8l5 5" stroke="#ffffff" strokeWidth="1" />
          </svg>
        );

      case 'TIERRA VERDE':
      case 'CTTV':
      case 'COALICION TRANSFORMADORA TIERRA VERDE':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#14532d" />
            <circle cx="18" cy="18" r="13" fill="#15803d" />
            <path d="M18 26v-10M18 16c-3-4-8-3-8 1 3 4 8 0 8-1zm0 0c3-4 8-3 8 1-3 4-8 0-8-1z" fill="#86efac" stroke="#ffffff" strokeWidth="1" />
          </svg>
        );

      case 'PUEBLO CONSCIENTE':
      case 'PC':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#7c2d12" />
            <circle cx="18" cy="15" r="7" fill="#f97316" />
            <path d="M8 26l7-8 5 5 8-9v12H8z" fill="#fbbf24" />
          </svg>
        );

      case 'PPP':
      case 'PARTIDO PATRIOTICO DEL PERU':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#991b1b" />
            <path d="M11 9h14v10c0 6-7 9-7 9s-7-3-7-9V9z" fill="#ffffff" stroke="#facc15" strokeWidth="1.2" />
            <rect x="15" y="9" width="6" height="19" fill="#dc2626" />
          </svg>
        );

      case 'INTEGRIDAD':
      case 'ID':
      case 'INTEGRIDAD DEMOCRATICA':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#0f172a" />
            <path d="M18 8v16M12 12h12M12 12l-3 6h6l-3-6zm12 0l-3 6h6l-3-6z" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
          </svg>
        );

      case 'FUERZA CIUDADANA':
      case 'FC':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#c2410c" />
            <circle cx="18" cy="18" r="13" fill="#ea580c" />
            <path d="M14 26v-9a1.5 1.5 0 0 1 3 0v-2a1.5 1.5 0 0 1 3 0v-1a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1 3 0v9z" fill="#ffffff" />
          </svg>
        );

      case 'BATALLA PERU':
      case 'BP':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#1e1b4b" />
            <path d="M12 18c0-5 3-9 6-9s6 4 6 9v5h-12v-5z" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
            <line x1="18" y1="9" x2="18" y2="23" stroke="#1e1b4b" strokeWidth="2" />
          </svg>
        );

      case 'APP':
      case 'ALIANZA PARA EL PROGRESO':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#1e3a8a" />
            <circle cx="18" cy="18" r="13" fill="#2563eb" />
            <path d="M12 25l6-15 6 15h-3.5l-1.5-4h-5l-1.5 4H12zm5-7h3l-1.5-4.5L17 18z" fill="#ffffff" />
            <rect x="14" y="22" width="8" height="2" fill="#ef4444" />
          </svg>
        );

      case 'ALIANZA REGIONAL':
      case 'ARP':
      case 'ALIANZA REGIONAL POR EL PERU':
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#0369a1" />
            <circle cx="18" cy="18" r="13" fill="#0284c7" />
            <polygon points="18,9 21,15 27,16 23,20 24,26 18,23 12,26 13,20 9,16 15,15" fill="#facc15" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 36 36" width={size} height={size} className={className}>
            <rect width="36" height="36" rx="8" fill="#334155" />
            <text x="18" y="22" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              {(partyKey || 'POL').slice(0, 3)}
            </text>
          </svg>
        );
    }
  };

  return (
    <div
      className="party-logo-wrapper"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
        flexShrink: 0
      }}
      title={partyKey}
    >
      {renderSymbol()}
    </div>
  );
};

