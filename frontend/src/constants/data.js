// ── DATOS ELECTORALES – Estructura ONPE ──
export const PARTIES = {
  FP: { label: 'Fuerza Popular', color: '#c41e3a' },
  JP: { label: 'Juntos por el Perú', color: '#e07b39' },
  SP: { label: 'Somos Perú', color: '#1a8a7d' },
  FR: { label: 'FREPAP', color: '#2c5282' },
  VE: { label: 'Verde', color: '#38a169' },
  MO: { label: 'Morado', color: '#6b46c1' },
};

export const PARTY_KEYS = Object.keys(PARTIES);
export const PARTY_COLORS = PARTY_KEYS.map(k => PARTIES[k].color);
export const PARTY_LABELS = PARTY_KEYS.map(k => PARTIES[k].label);

export const PARTIES_CONFIG = {
  "FP": { color: "#ea580c", label: "Fuerza Popular", short: "FP" },
  "JP": { color: "#059669", label: "Juntos por el Perú", short: "JP" },
  "SOMOS PERU": { color: "#1e3a8a", label: "Somos Perú", short: "SOMOS PERÚ" },
  "FREPAP": { color: "#0284c7", label: "Frepap", short: "FREPAP" },
  "VERDE": { color: "#16a34a", label: "Partido Verde", short: "VERDE" },
  "MORADO": { color: "#7c3aed", label: "Partido Morado", short: "MORADO" }
};

export const COLEGIOS_REALES = {
  'Miraflores': ['Markham College', 'I.E. San Antonio de Miraflores', 'Colegio San Agustín', 'I.E. Alfonso Ugarte', 'I.E. San Ignacio de Loyola', 'Colegio Carmelitas', 'I.E. Fe y Alegría N° 24'],
  'San Isidro': ['Colegio San Agustín', 'I.E. San Felipe', 'Reina de las Américas', 'I.E. San Juan Bautista', 'San Silvestre School', 'I.E. San Jorge', 'Colegio Alpamayo'],
  'Santiago de Surco': ['I.E. San Ignacio de Recalde', 'Colegio San Agustín de Surco', 'I.E. Fe y Alegría N° 25', 'I.E. San Juan Bautista de La Salle', 'Colegio Claretiano', 'I.E. San Juan Apóstol', 'I.E. San Carlos'],
  'La Molina': ['I.E. La Molina Vieja', 'Colegio San Pedro', 'I.E. Fe y Alegría N° 44', 'I.E. San Carlos', 'Universidad Agraria (local)', 'I.E. San Martín de Porres La Molina'],
  'San Borja': ['I.E. San Borja', 'Colegio San Agustino', 'I.E. San Juan Bautista', 'I.E. San Carlos', 'I.E. San Pedro Claver', 'I.E. San Martín de Porres San Borja'],
  'Los Olivos': ['I.E. Los Olivos', 'I.E. Fe y Alegría N° 3', 'I.E. San Juan Bautista Los Olivos', 'I.E. San Martín de Porres Los Olivos', 'I.E. San Juan Bosco', 'I.E. San Pedro Los Olivos', 'I.E. San Carlos Los Olivos'],
  'Comas': ['I.E. Comas', 'I.E. Fe y Alegría N° 1', 'I.E. San Juan Bosco Comas', 'I.E. San Martín de Porres Comas', 'I.E. San Pedro Comas', 'I.E. San Carlos Comas'],
  'San Juan de Lurigancho': ['I.E. SJL', 'I.E. Fe y Alegría N° 48', 'I.E. San Juan Bautista SJL', 'I.E. San Martín de Porres SJL', 'I.E. San Pedro SJL', 'I.E. San Carlos SJL', 'I.E. San Juan Bosco SJL', 'I.E. San Ignacio SJL'],
  'Villa El Salvador': ['I.E. VES', 'I.E. Fe y Alegría N° 2', 'I.E. San Juan Bosco VES', 'I.E. San Martín de Porres VES', 'I.E. San Pedro VES', 'I.E. San Carlos VES'],
  'Villa María del Triunfo': ['I.E. VMT', 'I.E. Fe y Alegría N° 4', 'I.E. San Juan Bosco VMT', 'I.E. San Martín de Porres VMT', 'I.E. San Pedro VMT', 'I.E. San Carlos VMT'],
  'Ate': ['IE 0024 PEDRO ENRIQUE GONZALES SOTO', 'IE 0026 AICHI NAGOYA', 'IE 0032 RAUL PORRAS BARRENECHEA', 'IE 0074 FERNANDO BELAUNDE TERRY', 'I.E. Ate', 'I.E. Fe y Alegría N° 5', 'I.E. San Juan Bautista Ate', 'I.E. San Martín de Porres Ate', 'I.E. San Pedro Ate', 'I.E. San Carlos Ate'],
  'Rímac': ['I.E. Rímac', 'I.E. San Juan Bautista Rímac', 'I.E. San Martín de Porres Rímac', 'I.E. San Pedro Rímac', 'I.E. San Carlos Rímac', 'I.E. Fe y Alegría N° 6'],
  'Lima': ['IE EMBLEMATICA GUADALUPE', 'I.E. Alfonso Ugarte', 'I.E. San Juan Bautista Lima', 'I.E. San Carlos Lima', 'I.E. San Pedro Lima', 'I.E. San Martín de Porres Lima', 'I.E. Fe y Alegría N° 7'],
  'Breña': ['I.E. Breña', 'I.E. San Juan Bautista Breña', 'I.E. San Martín de Porres Breña', 'I.E. San Pedro Breña', 'I.E. San Carlos Breña'],
  'La Victoria': ['I.E. La Victoria', 'I.E. San Juan Bautista La Victoria', 'I.E. San Martín de Porres La Victoria', 'I.E. San Pedro La Victoria', 'I.E. San Carlos La Victoria'],
  'Independencia': ['I.E. Independencia', 'I.E. Fe y Alegría N° 8', 'I.E. San Juan Bautista Independencia', 'I.E. San Martín de Porres Independencia', 'I.E. San Pedro Independencia'],
  'San Miguel': ['I.E. San Miguel', 'I.E. San Juan Bautista San Miguel', 'I.E. San Martín de Porres San Miguel', 'I.E. San Pedro San Miguel', 'I.E. San Carlos San Miguel'],
  'Magdalena del Mar': ['I.E. Magdalena', 'I.E. San Juan Bautista Magdalena', 'I.E. San Martín de Porres Magdalena', 'I.E. San Pedro Magdalena', 'I.E. San Carlos Magdalena'],
  'Pueblo Libre': ['I.E. Pueblo Libre', 'I.E. San Juan Bautista Pueblo Libre', 'I.E. San Martín de Porres Pueblo Libre', 'I.E. San Pedro Pueblo Libre', 'I.E. San Carlos Pueblo Libre'],
  'Jesús María': ['I.E. Jesús María', 'I.E. San Juan Bautista Jesús María', 'I.E. San Martín de Porres Jesús María', 'I.E. San Pedro Jesús María', 'I.E. San Carlos Jesús María'],
  'Lince': ['I.E. Lince', 'I.E. San Juan Bautista Lince', 'I.E. San Martín de Porres Lince', 'I.E. San Pedro Lince', 'I.E. San Carlos Lince'],
  'Barranco': ['I.E. Barranco', 'I.E. San Juan Bautista Barranco', 'I.E. San Martín de Porres Barranco', 'I.E. San Pedro Barranco', 'I.E. San Carlos Barranco'],
  'Chorrillos': ['I.E. Chorrillos', 'I.E. San Juan Bautista Chorrillos', 'I.E. San Martín de Porres Chorrillos', 'I.E. San Pedro Chorrillos', 'I.E. San Carlos Chorrillos'],
  'Surquillo': ['I.E. Surquillo', 'I.E. San Juan Bautista Surquillo', 'I.E. San Martín de Porres Surquillo', 'I.E. San Pedro Surquillo', 'I.E. San Carlos Surquillo'],
  'San Luis': ['I.E. San Luis', 'I.E. San Juan Bautista San Luis', 'I.E. San Martín de Porres San Luis', 'I.E. San Pedro San Luis', 'I.E. San Carlos San Luis'],
  'El Agustino': ['I.E. El Agustino', 'I.E. Fe y Alegría N° 9', 'I.E. San Juan Bautista El Agustino', 'I.E. San Martín de Porres El Agustino', 'I.E. San Pedro El Agustino'],
  'Santa Anita': ['I.E. Santa Anita', 'I.E. Fe y Alegría N° 10', 'I.E. San Juan Bautista Santa Anita', 'I.E. San Martín de Porres Santa Anita', 'I.E. San Pedro Santa Anita'],
  'San Juan de Miraflores': ['I.E. SJM', 'I.E. Fe y Alegría N° 11', 'I.E. San Juan Bautista SJM', 'I.E. San Martín de Porres SJM', 'I.E. San Pedro SJM', 'I.E. San Carlos SJM'],
  'San Martín de Porres': ['I.E. SMP', 'I.E. Fe y Alegría N° 12', 'I.E. San Juan Bautista SMP', 'I.E. San Martín de Porres SMP', 'I.E. San Pedro SMP', 'I.E. San Carlos SMP'],
  'Carabayllo': ['I.E. Carabayllo', 'I.E. Fe y Alegría N° 13', 'I.E. San Juan Bautista Carabayllo', 'I.E. San Martín de Porres Carabayllo', 'I.E. San Pedro Carabayllo'],
  'Puente Piedra': ['I.E. Puente Piedra', 'I.E. Fe y Alegría N° 14', 'I.E. San Juan Bautista Puente Piedra', 'I.E. San Martín de Porres Puente Piedra', 'I.E. San Pedro Puente Piedra'],
  'Lurigancho': ['I.E. Lurigancho', 'I.E. Fe y Alegría N° 15', 'I.E. San Juan Bautista Lurigancho', 'I.E. San Martín de Porres Lurigancho', 'I.E. San Pedro Lurigancho'],
  'Lurín': ['I.E. Lurín', 'I.E. San Juan Bautista Lurín', 'I.E. San Martín de Porres Lurín', 'I.E. San Pedro Lurín', 'I.E. San Carlos Lurín'],
  'Pachacámac': ['I.E. Pachacámac', 'I.E. San Juan Bautista Pachacámac', 'I.E. San Martín de Porres Pachacámac', 'I.E. San Pedro Pachacámac', 'I.E. San Carlos Pachacámac'],
  'Chaclacayo': ['I.E. Chaclacayo', 'I.E. San Juan Bautista Chaclacayo', 'I.E. San Martín de Porres Chaclacayo', 'I.E. San Pedro Chaclacayo'],
  'Cieneguilla': ['I.E. Cieneguilla', 'I.E. San Juan Bautista Cieneguilla', 'I.E. San Martín de Porres Cieneguilla', 'I.E. San Pedro Cieneguilla'],
  'Ancón': ['IE 3069 GENERALISIMO JOSE DE SAN MARTIN', 'IE 2066 ALMIRANTE MIGUEL GRAU', 'I.E. Ancón', 'I.E. San Juan Bautista Ancón', 'I.E. San Pedro Ancón'],
  'Pucusana': ['I.E. Pucusana', 'I.E. San Juan Bautista Pucusana', 'I.E. San Pedro Pucusana'],
  'Punta Hermosa': ['I.E. Punta Hermosa', 'I.E. San Juan Bautista Punta Hermosa'],
  'Punta Negra': ['I.E. Punta Negra', 'I.E. San Juan Bautista Punta Negra'],
  'San Bartolo': ['I.E. San Bartolo', 'I.E. San Juan Bautista San Bartolo', 'I.E. San Pedro San Bartolo'],
  'Santa María del Mar': ['I.E. Santa María del Mar', 'I.E. San Juan Bautista SMM'],
  'Santa Rosa': ['I.E. Santa Rosa', 'I.E. San Juan Bautista Santa Rosa', 'I.E. San Pedro Santa Rosa']
};

export const COLEGIOS_GPS_MAP = {
  'IE 0024 PEDRO ENRIQUE GONZALES SOTO': { lat: -12.0254, lon: -76.9189, distrito: 'Ate' },
  'IE 0026 AICHI NAGOYA': { lat: -12.0260, lon: -76.9195, distrito: 'Ate' },
  'IE 0032 RAUL PORRAS BARRENECHEA': { lat: -12.0270, lon: -76.9210, distrito: 'Ate' },
  'IE 0074 FERNANDO BELAUNDE TERRY': { lat: -12.0280, lon: -76.9220, distrito: 'Ate' },
  'IE 3069 GENERALISIMO JOSE DE SAN MARTIN': { lat: -11.7745, lon: -77.1550, distrito: 'Ancón' },
  'IE 2066 ALMIRANTE MIGUEL GRAU': { lat: -11.7750, lon: -77.1560, distrito: 'Ancón' },
  'IE EMBLEMATICA GUADALUPE': { lat: -12.0463, lon: -77.0427, distrito: 'Lima' },
  'IE JUANA ALARCO DE D script': { lat: -12.1245, lon: -77.0260, distrito: 'Miraflores' },
  'IE MANUEL POLO JIMENEZ': { lat: -12.1400, lon: -76.9900, distrito: 'Surco' }
};

export function buscarColegioPorMesa(mesaNum, mesasEstructura = []) {
  if (!mesaNum) return null;
  const mesaStr = mesaNum.toString().trim();
  const cleanMesa = mesaStr.replace(/\D/g, '');
  const paddedMesa = cleanMesa.padStart(6, '0');

  // 1. Check in mesasEstructura
  if (Array.isArray(mesasEstructura)) {
    const found = mesasEstructura.find(m => {
      const num = (m.mesa || m.numero_mesa || '').toString().trim().replace(/\D/g, '');
      return num === cleanMesa || num === paddedMesa;
    });
    if (found) return found;
  }

  // 2. Known standard mesas
  const MESA_MAP = {
    '063769': { colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', distrito: 'Ate' },
    '63769': { colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', distrito: 'Ate' },
    '037163': { colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', distrito: 'Ate' },
    '37163': { colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', distrito: 'Ate' },
    '037175': { colegio: 'IE 0026 AICHI NAGOYA', distrito: 'Ate' },
    '37175': { colegio: 'IE 0026 AICHI NAGOYA', distrito: 'Ate' },
    '037187': { colegio: 'IE 0032 RAUL PORRAS BARRENECHEA', distrito: 'Ate' },
    '37187': { colegio: 'IE 0032 RAUL PORRAS BARRENECHEA', distrito: 'Ate' },
    '037207': { colegio: 'IE 0074 FERNANDO BELAUNDE TERRY', distrito: 'Ate' },
    '37207': { colegio: 'IE 0074 FERNANDO BELAUNDE TERRY', distrito: 'Ate' },
    '036999': { colegio: 'IE 3069 GENERALISIMO JOSE DE SAN MARTIN', distrito: 'Ancón' },
    '36999': { colegio: 'IE 3069 GENERALISIMO JOSE DE SAN MARTIN', distrito: 'Ancón' },
    '037020': { colegio: 'IE 2066 ALMIRANTE MIGUEL GRAU', distrito: 'Ancón' },
    '37020': { colegio: 'IE 2066 ALMIRANTE MIGUEL GRAU', distrito: 'Ancón' },
    '010001': { colegio: 'IE EMBLEMATICA GUADALUPE', distrito: 'Lima' },
    '10001': { colegio: 'IE EMBLEMATICA GUADALUPE', distrito: 'Lima' },
    '020001': { colegio: 'IE JUANA ALARCO DE D script', distrito: 'Miraflores' },
    '20001': { colegio: 'IE JUANA ALARCO DE D script', distrito: 'Miraflores' },
    '030001': { colegio: 'IE MANUEL POLO JIMENEZ', distrito: 'Surco' },
    '30001': { colegio: 'IE MANUEL POLO JIMENEZ', distrito: 'Surco' }
  };

  return MESA_MAP[cleanMesa] || MESA_MAP[paddedMesa] || null;
}
