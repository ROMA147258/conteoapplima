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
  'ESPERANZA': '/images/Frente_de_la_Esperanza_2021_(logo).svg.webp',
  'FE': '/images/Frente_de_la_Esperanza_2021_(logo).svg.webp',
  'FRENTE DE LA ESPERANZA': '/images/Frente_de_la_Esperanza_2021_(logo).svg.webp',
  'FRENTE DE LA ESPERANZA 2021': '/images/Frente_de_la_Esperanza_2021_(logo).svg.webp',
  'VENCEREMOS': '/images/Logo_Alianza_Electoral_Venceremos.png',
  'AEV': '/images/Logo_Alianza_Electoral_Venceremos.png',
  'ALIANZA ELECTORAL VENCEREMOS': '/images/Logo_Alianza_Electoral_Venceremos.png',
  'VISION PERU': '/images/simbolo-440x429x4x0x436x429x1711547025.jpeg',
  'VP': '/images/simbolo-440x429x4x0x436x429x1711547025.jpeg',
  'VISION': '/images/simbolo-440x429x4x0x436x429x1711547025.jpeg',
  'APRA': '/images/APRA_Peru_logo.svg.webp',
  'PARTIDO APRISTA PERUANO': '/images/APRA_Peru_logo.svg.webp',
  'FP': '/images/Logo_of_the_Popular_Force_(2024).svg.webp',
  'FUERZA POPULAR': '/images/Logo_of_the_Popular_Force_(2024).svg.webp',
  'PPC': '/images/Logo_Oficial_PPC.png',
  'PARTIDO POPULAR CRISTIANO': '/images/Logo_Oficial_PPC.png',
  'PARTIDO POPULAR CRISTIANO (PPC)': '/images/Logo_Oficial_PPC.png',
  'PROGRESEMOS': '/images/Logo_de_Progresemos.jpg',
  'PROG': '/images/Logo_de_Progresemos.jpg',
  'MORADO': '/images/PARTIDOMORADO.jpg',
  'PARTIDO MORADO': '/images/PARTIDOMORADO.jpg',
  'PM': '/images/PARTIDOMORADO.jpg',
  'BUEN GOBIERNO': '/images/PBG_Logo.jpg',
  'PBG': '/images/PBG_Logo.jpg',
  'PARTIDO DEL BUEN GOBIERNO': '/images/PBG_Logo.jpg',
  'VERDE': '/images/Demócrata_Verde_(logo).svg.webp',
  'PDV': '/images/Demócrata_Verde_(logo).svg.webp',
  'PARTIDO DEMOCRATA VERDE': '/images/Demócrata_Verde_(logo).svg.webp',
  'PERU LIBRE': '/images/Perú_Libre_logo.svg.webp',
  'PL': '/images/Perú_Libre_logo.svg.webp',
  'PUEBLO CONSCIENTE': '/images/SIMBOLO-PUEBLO-CONSCIENTE.jpg',
  'PC': '/images/SIMBOLO-PUEBLO-CONSCIENTE.jpg',
  'PPP': '/images/Partido_Patriótico_del_Perú_(logo).svg.webp',
  'PARTIDO PATRIOTICO DEL PERU': '/images/Partido_Patriótico_del_Perú_(logo).svg.webp',
  'FUERZA CIUDADANA': '/images/Fuerza_Ciudadana_Perú.png',
  'FC': '/images/Fuerza_Ciudadana_Perú.png',
  'BATALLA PERU': '/images/BATALLAPERU.png',
  'BP': '/images/BATALLAPERU.png'
};

export const PartyLogo = ({ partyKey, partyId, size = 42, className = '' }) => {
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
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '2px',
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
            objectFit: 'contain',
            borderRadius: '7px'
          }}
        />
      </div>
    );
  }

  // Emblemas vectoriales de máxima definición para todos los partidos políticos
  const renderSymbol = () => {
    switch (normKey) {
      case 'SOMOS PERU':
      case 'SP':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#1e3a8a" />
            <path
              d="M20 32s-10-6.8-12.8-12.4C4.8 14.5 7.4 9 12.8 9c3 0 5.6 1.9 7.2 4.2 1.6-2.3 4.2-4.2 7.2-4.2 5.4 0 8 5.5 5.6 10.6C30 25.2 20 32 20 32z"
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text x="20" y="21" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">SP</text>
          </svg>
        );

      case 'RENOVACION':
      case 'RP':
      case 'RENOVACION POPULAR':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#0284c7" />
            <circle cx="20" cy="20" r="16" fill="#38bdf8" />
            <path
              d="M13 11h8a5.5 5.5 0 0 1 5.5 5.5c0 3.5-2.5 5.5-5.5 5.5h-4.5v7H13V11zm3.5 3.5v4.5h4.2c1.4 0 2.4-.9 2.4-2.3s-1-2.2-2.4-2.2H16.5z"
              fill="#ffffff"
            />
            <path d="M21 22l5 7h-4.2l-4.3-7h3.5z" fill="#ffffff" />
          </svg>
        );

      case 'AHORA NACION':
      case 'AN':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#ea580c" />
            <circle cx="20" cy="20" r="15" fill="#fb923c" />
            <path d="M20 7l2.5 5 5.5.6-4 3.8 1.2 5.6-5.2-3-5.2 3 1.2-5.6-4-3.8 5.5-.6z" fill="#ffffff" />
            <text x="20" y="31" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">AN</text>
          </svg>
        );

      case 'AVANZA PAIS':
      case 'AVANZA':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#1e293b" />
            <rect x="9" y="12" width="22" height="15" rx="3" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
            <rect x="13" y="14" width="6" height="5" rx="1" fill="#f8fafc" />
            <rect x="21" y="14" width="6" height="5" rx="1" fill="#f8fafc" />
            <circle cx="14" cy="28" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            <circle cx="26" cy="28" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            <path d="M17 8h6v4h-6z" fill="#f59e0b" />
          </svg>
        );

      case 'PODEMOS':
      case 'PODEMOS PERU':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#b91c1c" />
            <circle cx="20" cy="20" r="16" fill="#dc2626" />
            <path
              d="M13 10h8a7 7 0 0 1 7 7 7 7 0 0 1-7 7h-4v6H13V10zm4 4v6h4c1.8 0 3.2-1.4 3.2-3s-1.4-3-3.2-3H17z"
              fill="#ffffff"
            />
          </svg>
        );

      case 'JP':
      case 'JUNTOS POR EL PERU':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#15803d" />
            <circle cx="20" cy="20" r="15" fill="#22c55e" />
            <path d="M20 9l2 3.5 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5z" fill="#eab308" />
            <text x="20" y="30" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">JP</text>
          </svg>
        );

      case 'OBRAS':
      case 'PARTIDO CIVICO OBRAS':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#c2410c" />
            <path d="M12 28l8-8 2.5 2.5-8 8z" fill="#ffffff" />
            <path d="M20 18l5-5 5 5-5 5z" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="11" cy="29" r="2.5" fill="#ffffff" />
            <text x="20" y="36" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">OBRAS</text>
          </svg>
        );

      case 'FREPAP':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#1d4ed8" />
            <circle cx="20" cy="20" r="15" fill="#eab308" />
            <path
              d="M9 20c3.5-4.5 11.5-7 18.5-3.5 2.5 1.2 4.5 3.5 6.8 4.5-2.3 1.2-4.5 3.5-6.8 4.5-7 3.5-15 1-18.5-3.5zm21-1a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z"
              fill="#1e3a8a"
            />
          </svg>
        );

      case 'ACCION POPULAR':
      case 'AP':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#dc2626" />
            <path d="M20 6l7 8h-4.5v10h-5V14H13l7-8z" fill="#ffffff" />
            <rect x="17.5" y="24" width="5" height="9" fill="#ffffff" />
            <text x="20" y="37" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">AP</text>
          </svg>
        );

      case 'ESPERANZA':
      case 'FE':
      case 'FRENTE DE LA ESPERANZA':
      case 'FRENTE DE LA ESPERANZA 2021':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#15803d" />
            <path d="M19 7h2.5v12H19z" fill="#facc15" />
            <path d="M14 19h12l2.5 13H11.5L14 19z" fill="#eab308" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="16" y1="22" x2="15" y2="31" stroke="#713f12" strokeWidth="1.2" />
            <line x1="20" y1="22" x2="20" y2="31" stroke="#713f12" strokeWidth="1.2" />
            <line x1="24" y1="22" x2="25" y2="31" stroke="#713f12" strokeWidth="1.2" />
          </svg>
        );

      case 'VENCEREMOS':
      case 'AEV':
      case 'ALIANZA ELECTORAL VENCEREMOS':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#b91c1c" />
            <path d="M12 9l8 16 8-16h-4.5l-3.5 8-3.5-8z" fill="#ffffff" />
            <circle cx="20" cy="30" r="3" fill="#facc15" />
          </svg>
        );

      case 'VISION PERU':
      case 'VP':
      case 'VISION':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#0369a1" />
            <path d="M8 20s5-8 12-8 12 8 12 8-5 8-12 8-12-8-12-8z" fill="#ffffff" stroke="#facc15" strokeWidth="2" />
            <circle cx="20" cy="20" r="5.5" fill="#0284c7" />
            <circle cx="20" cy="20" r="2.5" fill="#0f172a" />
          </svg>
        );

      case 'APRA':
      case 'PARTIDO APRISTA PERUANO':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#ffffff" stroke="#dc2626" strokeWidth="2.5" />
            <path
              d="M20 7l4 9 9.5 1.2-7 6.4 2 9.4-8.5-5-8.5 5 2-9.4-7-6.4 9.5-1.2z"
              fill="#dc2626"
            />
          </svg>
        );

      case 'FP':
      case 'FUERZA POPULAR':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#ea580c" />
            <circle cx="20" cy="20" r="16" fill="#f97316" />
            <path
              d="M13 10h4.5v8.5l7-8.5h6l-8 9 8.5 10.5h-6l-7.5-9v9H13V10z"
              fill="#ffffff"
            />
          </svg>
        );

      case 'PPC':
      case 'PARTIDO POPULAR CRISTIANO':
      case 'PARTIDO POPULAR CRISTIANO (PPC)':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#15803d" />
            <circle cx="20" cy="20" r="15" fill="#16a34a" />
            <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">PPC</text>
          </svg>
        );

      case 'PROGRESEMOS':
      case 'PROG':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#0f766e" />
            <path d="M11 27l9-9 4.5 4.5 7.5-10" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 12.5h7v7" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'MORADO':
      case 'PM':
      case 'PARTIDO MORADO':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#6b21a8" />
            <circle cx="20" cy="20" r="16" fill="#7e22ce" />
            <path
              d="M11 29V11h4.5l4.5 8.5 4.5-8.5H29v18h-4v-11.5l-5 8.5h-1l-5-8.5V29H11z"
              fill="#ffffff"
            />
          </svg>
        );

      case 'BUEN GOBIERNO':
      case 'PBG':
      case 'PARTIDO DEL BUEN GOBIERNO':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#1e3a8a" />
            <circle cx="20" cy="20" r="15" fill="#2563eb" />
            <path d="M20 10v16M12 14h16M12 14l-3.5 7h7L12 14zm16 0l-3.5 7h7L28 14z" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'VERDE':
      case 'PDV':
      case 'PARTIDO DEMOCRATA VERDE':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#166534" />
            <path
              d="M11 29c3.5-11.5 11.5-18 18-18 0 7-7 15-18 18z"
              fill="#4ade80"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <path d="M13.5 26.5c4.5-4.5 9-9 13.5-13.5" stroke="#166534" strokeWidth="2" />
          </svg>
        );

      case 'PERU LIBRE':
      case 'PL':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#dc2626" />
            <path d="M11 29l3.5-9 11.5-11.5 6 6-11.5 11.5-9.5 3z" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M11 29l3.5-1-2.5-2.5-1 3.5z" fill="#0f172a" />
            <path d="M26 8.5l6 6" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        );

      case 'TIERRA VERDE':
      case 'CTTV':
      case 'COALICION TRANSFORMADORA TIERRA VERDE':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#14532d" />
            <circle cx="20" cy="20" r="15" fill="#15803d" />
            <path d="M20 29v-12M20 17c-3.5-4.5-9-3.5-9 1 3.5 4.5 9 0 9-1zm0 0c3.5-4.5 9-3.5 9 1-3.5 4.5-9 0-9-1z" fill="#86efac" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        );

      case 'PUEBLO CONSCIENTE':
      case 'PC':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#7c2d12" />
            <circle cx="20" cy="16" r="8" fill="#f97316" />
            <path d="M9 29l8-9 5.5 5.5 8.5-10v13.5H9z" fill="#fbbf24" />
          </svg>
        );

      case 'PPP':
      case 'PARTIDO PATRIOTICO DEL PERU':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#991b1b" />
            <path d="M12 10h16v11c0 7-8 10-8 10s-8-3-8-10V10z" fill="#ffffff" stroke="#facc15" strokeWidth="1.5" />
            <rect x="16.5" y="10" width="7" height="21" fill="#dc2626" />
          </svg>
        );

      case 'INTEGRIDAD':
      case 'ID':
      case 'INTEGRIDAD DEMOCRATICA':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#0f172a" />
            <path d="M20 9v18M13 13.5h14M13 13.5l-3.5 7h7l-3.5-7zm14 0l-3.5 7h7l-3.5-7z" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'FUERZA CIUDADANA':
      case 'FC':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#c2410c" />
            <circle cx="20" cy="20" r="15" fill="#ea580c" />
            <path d="M15 29v-10a1.8 1.8 0 0 1 3.5 0v-2a1.8 1.8 0 0 1 3.5 0v-1a1.8 1.8 0 0 1 3.5 0v3.5a1.8 1.8 0 0 1 3.5 0v9.5z" fill="#ffffff" />
          </svg>
        );

      case 'BATALLA PERU':
      case 'BP':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#1e1b4b" />
            <path d="M13 20c0-6 3.5-10 7-10s7 4 7 10v6h-14v-6z" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="20" y1="10" x2="20" y2="26" stroke="#1e1b4b" strokeWidth="2.5" />
          </svg>
        );

      case 'APP':
      case 'ALIANZA PARA EL PROGRESO':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#1e3a8a" />
            <circle cx="20" cy="20" r="15" fill="#2563eb" />
            <path d="M13 28l7-17 7 17h-4l-1.8-4.5h-5.4L17 28H13zm5.6-8h4.8l-2.4-5.5L18.6 20z" fill="#ffffff" />
            <rect x="15" y="24.5" width="10" height="2.5" fill="#ef4444" />
          </svg>
        );

      case 'ALIANZA REGIONAL':
      case 'ARP':
      case 'ALIANZA REGIONAL POR EL PERU':
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#0369a1" />
            <circle cx="20" cy="20" r="15" fill="#0284c7" />
            <polygon points="20,10 23.5,16.5 30.5,17.5 25.5,22 27,29 20,25.5 13,29 14.5,22 9.5,17.5 16.5,16.5" fill="#facc15" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
            <rect width="40" height="40" rx="10" fill="#334155" />
            <text x="20" y="25" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
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
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
        flexShrink: 0
      }}
      title={partyKey}
    >
      {renderSymbol()}
    </div>
  );
};
