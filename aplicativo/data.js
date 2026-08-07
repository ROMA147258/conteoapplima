// ── DATOS ELECTORALES – Estructura ONPE ──
const PARTIES = {
  FP: { label: 'Fuerza Popular', color: '#c41e3a' },
  JP: { label: 'Juntos por el Perú', color: '#e07b39' },
  SP: { label: 'Somos Perú', color: '#1a8a7d' },
  FR: { label: 'FREPAP', color: '#2c5282' },
  VE: { label: 'Verde', color: '#38a169' },
  MO: { label: 'Morado', color: '#6b46c1' },
};
const PARTY_KEYS = Object.keys(PARTIES);
const PARTY_COLORS = PARTY_KEYS.map(k => PARTIES[k].color);
const PARTY_LABELS = PARTY_KEYS.map(k => PARTIES[k].label);

const LIMA_METRO_DISTRITOS = [
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla',
  'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima',
  'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac',
  'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
  'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
  'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
  'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
];

const PROVINCIAS = [
  { id: 'lima-metropolitana', name: 'Lima Metropolitana', distritos: LIMA_METRO_DISTRITOS }
];

const LIMA_DISTRITOS = PROVINCIAS.flatMap(p => p.distritos);

function randomVotos(scale = 1) {
  const v = PARTY_KEYS.map(() => Math.floor(Math.random() * 1200 * scale) + 100);
  return Object.fromEntries(PARTY_KEYS.map((k, i) => [k, v[i]]));
}

function totalVotos(data) {
  return Object.values(data).reduce((a, b) => a + b, 0);
}

// Generar colegios y mesas por distrito
const COLEGIOS_POR_DISTRITO = {};
const MESA_DATA = {};
const DISTRICT_DATA = {};

let mesaCounter = 120401;

function colegiosForDistrito(distrito, provinciaId) {
  const known = COLEGIOS_REALES[distrito];
  if (known) return known;
  const base = provinciaId === 'lima-metropolitana' ? 6 : 3;
  const tipos = ['I.E. Emblemática', 'I.E.N.', 'I.E. Particular', 'Colegio Nacional', 'I.E. Técnico Industrial', 'I.E. San', 'I.E. Fe y Alegría', 'I.E. Innova Schools'];
  return tipos.slice(0, base + (distrito.length % 3)).map((t, i) =>
    i < 2 ? `${t} ${distrito}` : `${t} ${distrito} N° ${1200 + i}`
  );
}

const COLEGIOS_REALES = {
  // LIMA METROPOLITANA
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
  'Ate': ['I.E. Ate', 'I.E. Fe y Alegría N° 5', 'I.E. San Juan Bautista Ate', 'I.E. San Martín de Porres Ate', 'I.E. San Pedro Ate', 'I.E. San Carlos Ate'],
  'Rímac': ['I.E. Rímac', 'I.E. San Juan Bautista Rímac', 'I.E. San Martín de Porres Rímac', 'I.E. San Pedro Rímac', 'I.E. San Carlos Rímac', 'I.E. Fe y Alegría N° 6'],
  'Lima': ['I.E. Alfonso Ugarte', 'I.E. San Juan Bautista Lima', 'I.E. San Carlos Lima', 'I.E. San Pedro Lima', 'I.E. San Martín de Porres Lima', 'I.E. Fe y Alegría N° 7'],
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
  'Ancón': ['I.E. Ancón', 'I.E. San Juan Bautista Ancón', 'I.E. San Pedro Ancón'],
  'Pucusana': ['I.E. Pucusana', 'I.E. San Juan Bautista Pucusana', 'I.E. San Pedro Pucusana'],
  'Punta Hermosa': ['I.E. Punta Hermosa', 'I.E. San Juan Bautista Punta Hermosa'],
  'Punta Negra': ['I.E. Punta Negra', 'I.E. San Juan Bautista Punta Negra'],
  'San Bartolo': ['I.E. San Bartolo', 'I.E. San Juan Bautista San Bartolo', 'I.E. San Pedro San Bartolo'],
  'Santa María del Mar': ['I.E. Santa María del Mar', 'I.E. San Juan Bautista SMM'],
  'Santa Rosa': ['I.E. Santa Rosa', 'I.E. San Juan Bautista Santa Rosa', 'I.E. San Pedro Santa Rosa'],

};


const MESAS_REALES_ANCON_ATE = [
  // [Distrito, Colegio, MesaInicio, MesaFin]
  ["Ancón", "IE 3069 GENERALISIMO JOSE DE SAN MARTIN", 36999, 37019],
  ["Ancón", "IE 2066 ALMIRANTE MIGUEL GRAU", 37020, 37045],
  ["Ancón", "IE CARLOS GUTIERREZ MERINO", 37046, 37059],
  ["Ancón", "IE 3098 CESAR VALLEJO", 37060, 37080],
  ["Ancón", "IE 8193", 37081, 37081],
  ["Ancón", "IE 8194", 37082, 37082],
  ["Ancón", "IE 8195", 37083, 37083],
  ["Ancón", "IE 8196", 37084, 37084],
  ["Ancón", "IE 8197", 37085, 37085],
  ["Ancón", "IE 8198", 37086, 37086],
  ["Ancón", "IE 8199", 37087, 37087],
  ["Ancón", "IE 8200", 37088, 37088],
  ["Ancón", "IEP MY EP MARKO JARA SCHENONE", 37089, 37102],
  ["Ancón", "IE NUESTRA SEÑORA DE LA PAZ", 37103, 37117],
  ["Ancón", "IEP DIOS ES AMOR", 37118, 37138],
  ["Ancón", "IEP EL CARMELO", 37139, 37162],
  
  ["Ate", "IE 0024 PEDRO ENRIQUE GONZALES SOTO", 37163, 37174],
  ["Ate", "IE 0026 AICHI NAGOYA", 37175, 37186],
  ["Ate", "IE 0032 RAUL PORRAS BARRENECHEA", 37187, 37194],
  ["Ate", "IE 0034", 37195, 37201],
  ["Ate", "IE 0067 SANTA ELENA", 37202, 37206],
  ["Ate", "IE 0074 FERNANDO BELAUNDE TERRY", 37207, 37224],
  ["Ate", "IE 1135 SANTA CLARA", 37225, 37233],
  ["Ate", "IE 1136 JOHN F. KENNEDY", 37234, 37241],
  ["Ate", "IE 1138 JOSE ABELARDO QUIÑONES", 37242, 37257],
  ["Ate", "IE 1142 SEÑOR DE LOS MILAGROS", 37258, 37264],
  ["Ate", "IE 1143 DOMINGO FAUSTINO SARMIENTO", 37265, 37282],
  ["Ate", "IE 1203 DIVINO NIÑO JESUS DE MANYLSA", 37283, 37290],
  ["Ate", "IE 1209 GRAN MARISCAL TORIBIO DE LUZURIAGA", 37291, 37303],
  ["Ate", "IE 1212 GRUMETE MEDINA", 37304, 37315],
  ["Ate", "IE 1213 LA GLORIA", 37316, 37335],
  ["Ate", "IE 1222 HUSARES DE JUNIN", 37336, 37350],
  ["Ate", "IE 1226 SOL DE VITARTE", 37351, 37366],
  ["Ate", "IE 1227 INDIRA GANDHI", 37367, 37383],
  ["Ate", "IE 1228 LEONCIO PRADO GUTIERREZ", 37384, 37394],
  ["Ate", "IE 1228 LEONCIO PRADO GUTIERREZ- SECUNDARIA", 37395, 37404],
  ["Ate", "IE 1229 JULIO ALBERTO PONCE ANTUNEZ DE MAYOLO", 37405, 37416],
  ["Ate", "IE 1231 JOSE LUIS BUSTAMANTE Y RIVERO", 37417, 37424],
  ["Ate", "IE 1236 ALFONSO BARRANTES LINGAN", 37425, 37445],
  ["Ate", "IE 1237 JORGE DIOMEDES GILES LLANOS", 37446, 37459],
  ["Ate", "IE 1239 FORTALEZA", 37460, 37464],
  ["Ate", "IE 1244 MICAELA BASTIDAS", 37465, 37477],
  ["Ate", "IE 1245 JOSE CARLOS MARIATEGUI", 37478, 37497],
  ["Ate", "IE 1248 5 DE ABRIL", 37498, 37530],
  ["Ate", "IE 1249 JAVIER HERAUD", 37531, 37534],
  ["Ate", "IE 1251 PERUANO SUIZO", 37535, 37548],
  ["Ate", "IE 1255 WALTER PEÑALOZA RAMELLA", 37549, 37579],
  ["Ate", "IE 1257 REINO UNIDO DE GRAN BRETAÑA", 37580, 37589],
  ["Ate", "IE 1258 SEBASTIAN LORENTE IBAÑEZ", 37590, 37595],
  ["Ate", "IE 1260 EL AMAUTA", 37596, 37622],
  ["Ate", "IE 1262 EL AMAUTA JOSE CARLOS MARIATEGUI", 37623, 37639],
  ["Ate", "IE 1268 GUSTAVO MOHME LLONA", 37640, 37653],
  ["Ate", "IE 1279", 37654, 37669],
  ["Ate", "IE 6039 FERNANDO CARBAJAL SEGURA", 37670, 37698],
  ["Ate", "IE AKIRA KATO", 37699, 37704],
  ["Ate", "IE 0029 CORONEL PNP MARCO PUENTE LLANOS", 37705, 37716],
  ["Ate", "IE COLEGIO NACIONAL DE VITARTE", 37717, 37735],
  ["Ate", "IE FE Y ALEGRIA 53", 37736, 37750],
  ["Ate", "IE JULIO C TELLO", 37751, 37768],
  ["Ate", "IE 1264 JUAN ANDRES VIVANCO AMORIN", 37769, 37795],
  ["Ate", "IE MIXTO HUAYCAN", 37796, 37822],
  ["Ate", "IE NUESTRA SEÑORA DE LA ESPERANZA", 37823, 37832],
  ["Ate", "IE RICARDO PALMA", 37833, 37841],
  ["Ate", "IE 046 VICTOR RAUL HAYA DE LA TORRE INEI", 37842, 37859],
  ["Ate", "IE EDELMIRA DEL PANDO", 37860, 37879],
  ["Ate", "IE 0025 SAN MARTIN DE PORRES", 37880, 37907],
  ["Ate", "IEP INCA GARCILASO DE LA VEGA", 37908, 37929],
  ["Ate", "IEP SAN IGNACIO SCHOOL", 37930, 37940],
  ["Ate", "IE 167 LAS PIEDRITAS", 37941, 37950],
  ["Ate", "IE 1263 PURUCHUCO", 37951, 37968],
  ["Ate", "CEBE 13 JESÚS AMIGO", 37969, 37975],
  ["Ate", "IEP SANTIAGO APOSTOL", 37976, 37997],
  ["Ate", "IE 1215 SAN JUAN DE PARIACHI", 37998, 38006],
  ["Ate", "IE 1270 JUAN EL BAUTISTA", 38007, 38016],
  ["Ate", "IE 1281 SANTA MARIA", 38017, 38021],
  ["Ate", "IE 1208 SAN FRANCISCO DE ASIS", 38022, 38031],
  ["Ate", "IE 1254 MARIA REICHE NEWMANN", 38032, 38050],
  ["Ate", "IE 1265 SANTA ROSA DE LIMA", 38051, 38058],
  ["Ate", "IE 1271 COLEGIO SAN JUAN BAUTISTA", 38059, 38067],
  ["Ate", "IE 1283 OKINAWA", 38068, 38079],
  ["Ate", "IE 1288 ALBERT EINSTEIN", 38080, 38086]
];

function padZero6(num) {
  return String(num).padStart(6, '0');
}

// ALIASES Y NORMALIZACIÓN DE DISTRITOS
const DISTRICT_ALIASES = {
  'Cercado de Lima': 'Lima',
  'Lurigancho-Chosica': 'Lurigancho',
  'Lurigancho Chosica': 'Lurigancho',
  'San Juan de Lurigancho (SJL)': 'San Juan de Lurigancho',
  'Villa El Salvador (VES)': 'Villa El Salvador',
  'Villa María del Triunfo (VMT)': 'Villa María del Triunfo',
};

function normalizeDistrito(name) {
  if (!name) return null;
  const trimmed = name.toString().trim();
  if (DISTRICT_ALIASES[trimmed]) return DISTRICT_ALIASES[trimmed];
  if (DISTRICT_DATA[trimmed]) return trimmed;
  const found = LIMA_DISTRITOS.find(d => d.toLowerCase() === trimmed.toLowerCase());
  return found || trimmed;
}

function getZeroVotesObj() {
  const obj = {};
  PARTY_KEYS.forEach(k => { obj[k] = 0; });
  return obj;
}

// Inicializar por defecto con datos generados (fallback offline inicial)
function initializeDefaultElectoralStructure() {
  PROVINCIAS.forEach(p => {
    p.distritos.forEach(d => {
      let distVotos = {};
      PARTY_KEYS.forEach(k => { distVotos[k] = 0; });
      let totalMesas = 0;
      let colegios = [];

      if (d === "Ancón" || d === "Ate") {
        const reales = MESAS_REALES_ANCON_ATE.filter(item => item[0] === d);
        colegios = [...new Set(reales.map(item => item[1]))];
        COLEGIOS_POR_DISTRITO[d] = colegios;

        reales.forEach(item => {
          const col = item[1];
          const start = item[2];
          const end = item[3];
          for (let m = start; m <= end; m++) {
            const mesaNum = padZero6(m);
            const key = `${d}|${col}|${mesaNum}`;
            const v = randomVotos(0.15);
            MESA_DATA[key] = { votos: v, distrito: d, colegio: col, mesa: mesaNum };
            PARTY_KEYS.forEach(k => { distVotos[k] += v[k]; });
            totalMesas++;
          }
        });
      } else {
        colegios = colegiosForDistrito(d, p.id);
        COLEGIOS_POR_DISTRITO[d] = colegios;

        colegios.forEach(col => {
          const mesasPorColegio = ((d.length + col.length) % 4) + 4; // 4 a 7 mesas
          for (let m = 1; m <= mesasPorColegio; m++) {
            const mesaNum = String(mesaCounter++);
            const key = `${d}|${col}|${mesaNum}`;
            const v = randomVotos(0.15);
            MESA_DATA[key] = { votos: v, distrito: d, colegio: col, mesa: mesaNum };
            PARTY_KEYS.forEach(k => { distVotos[k] += v[k]; });
            totalMesas++;
          }
        });
      }

      DISTRICT_DATA[d] = {
        votos: distVotos,
        mesas: totalMesas,
        mesasEsc: Math.floor(totalMesas * 0.85),
        colegios: colegios,
        provincia: p.name
      };
    });
  });
  mergeCachedUsersIntoElectoralStructure();
}

function mergeCachedUsersIntoElectoralStructure() {
  try {
    const cachedDbStr = localStorage.getItem('votoReal_usuariosDb');
    if (cachedDbStr) {
      const cachedDb = JSON.parse(cachedDbStr);
      if (Array.isArray(cachedDb)) {
        cachedDb.forEach(u => {
          const distrito = normalizeDistrito(u.ubicacion || u.distrito);
          if (!distrito) return;
          const col = u.colegio;
          if (!col) return;
          let mesaNum = String(u.mesa || '').trim();
          if (!mesaNum) return;
          if (/^\d+$/.test(mesaNum)) {
            mesaNum = mesaNum.padStart(6, '0');
          }
          
          const key = `${distrito}|${col}|${mesaNum}`;
          if (!MESA_DATA[key]) {
            if (!COLEGIOS_POR_DISTRITO[distrito]) {
              COLEGIOS_POR_DISTRITO[distrito] = [];
            }
            if (!COLEGIOS_POR_DISTRITO[distrito].includes(col)) {
              COLEGIOS_POR_DISTRITO[distrito].push(col);
            }
            if (DISTRICT_DATA[distrito]) {
              if (!DISTRICT_DATA[distrito].colegios.includes(col)) {
                DISTRICT_DATA[distrito].colegios.push(col);
              }
              DISTRICT_DATA[distrito].mesas++;
            }
            MESA_DATA[key] = {
              votos: getZeroVotesObj(),
              distrito: distrito,
              colegio: col,
              mesa: mesaNum
            };
          }
        });
      }
    }
  } catch (e) {
    console.warn("Error merging cached users into electoral structure:", e);
  }
}

// Inicializar la estructura electoral dinámicamente desde el Google Sheet
function initializeElectoralStructure(mesasEstructura) {
  // Limpiar estructuras de mesas previas
  Object.keys(MESA_DATA).forEach(key => delete MESA_DATA[key]);
  
  // Limpiar/reestablecer estructuras por distrito
  PROVINCIAS.forEach(p => {
    p.distritos.forEach(d => {
      COLEGIOS_POR_DISTRITO[d] = [];
      DISTRICT_DATA[d] = {
        votos: getZeroVotesObj(),
        mesas: 0,
        mesasEsc: 0,
        colegios: [],
        provincia: p.name
      };
    });
  });

  if (!Array.isArray(mesasEstructura) || mesasEstructura.length === 0) {
    initializeDefaultElectoralStructure();
    return;
  }

  mesasEstructura.forEach(item => {
    const distrito = normalizeDistrito(item.distrito);
    if (!distrito) return;

    const col = item.colegio || `Local de votación ${distrito}`;
    let mesaNum = String(item.mesa || '').trim();
    if (!mesaNum) return;
    if (/^\d+$/.test(mesaNum)) {
      mesaNum = mesaNum.padStart(6, '0');
    }

    // Agregar colegio a COLEGIOS_POR_DISTRITO
    if (!COLEGIOS_POR_DISTRITO[distrito]) {
      COLEGIOS_POR_DISTRITO[distrito] = [];
    }
    if (!COLEGIOS_POR_DISTRITO[distrito].includes(col)) {
      COLEGIOS_POR_DISTRITO[distrito].push(col);
    }

    // Actualizar DISTRICT_DATA
    if (DISTRICT_DATA[distrito]) {
      if (!DISTRICT_DATA[distrito].colegios.includes(col)) {
        DISTRICT_DATA[distrito].colegios.push(col);
      }
      DISTRICT_DATA[distrito].mesas++;
    }

    const key = `${distrito}|${col}|${mesaNum}`;
    MESA_DATA[key] = {
      votos: getZeroVotesObj(),
      distrito: distrito,
      colegio: col,
      mesa: mesaNum
    };
  });
  mergeCachedUsersIntoElectoralStructure();
}

// Inicializar por defecto (intentar primero con localStorage, luego con default)
try {
  const rawStructure = localStorage.getItem('vr_mesas_estructura');
  if (rawStructure) {
    const parsed = JSON.parse(rawStructure);
    if (Array.isArray(parsed) && parsed.length > 0) {
      initializeElectoralStructure(parsed);
    } else {
      initializeDefaultElectoralStructure();
    }
  } else {
    initializeDefaultElectoralStructure();
  }
} catch (e) {
  console.warn("No se pudo restaurar estructura electoral desde localStorage:", e);
  initializeDefaultElectoralStructure();
}


function getColegioVotos(distrito, colegio) {
  const totals = {};
  PARTY_KEYS.forEach(k => { totals[k] = 0; });
  Object.entries(MESA_DATA).forEach(([key, data]) => {
    if (data.distrito === distrito && data.colegio === colegio) {
      PARTY_KEYS.forEach(k => { totals[k] += data.votos[k]; });
    }
  });
  return totals;
}

function getMesaVotos(distrito, colegio, mesa) {
  const key = `${distrito}|${colegio}|${mesa}`;
  return MESA_DATA[key]?.votos || randomVotos(0.05);
}

function getProvinciaVotos(provinciaId) {
  const prov = PROVINCIAS.find(p => p.id === provinciaId);
  if (!prov) return randomVotos(5);
  const totals = {};
  PARTY_KEYS.forEach(k => { totals[k] = 0; });
  prov.distritos.forEach(d => {
    if (DISTRICT_DATA[d]) PARTY_KEYS.forEach(k => { totals[k] += DISTRICT_DATA[d].votos[k]; });
  });
  return totals;
}

function lideres(filter) {
  if (!filter || filter.level === 'lima') {
    const totals = {};
    PARTY_KEYS.forEach(k => { totals[k] = 0; });
    Object.values(DISTRICT_DATA).forEach(d => PARTY_KEYS.forEach(k => { totals[k] += d.votos[k]; }));
    return totals;
  }
  if (filter.level === 'provincia') return getProvinciaVotos(filter.provincia);
  if (filter.level === 'distrito' && filter.distrito) return { ...DISTRICT_DATA[filter.distrito].votos };
  if (filter.level === 'colegio' && filter.distrito && filter.colegio) return getColegioVotos(filter.distrito, filter.colegio);
  if (filter.level === 'mesa' && filter.distrito && filter.colegio && filter.mesa) return getMesaVotos(filter.distrito, filter.colegio, filter.mesa);
  return lideres();
}

function getFilterContext() {
  return window.VR_FILTER || { level: 'lima' };
}

function getLeader(votos) {
  return PARTY_KEYS.reduce((a, b) => votos[a] > votos[b] ? a : b);
}

function getPct(votos, party) {
  const t = totalVotos(votos);
  return t > 0 ? ((votos[party] / t) * 100).toFixed(1) : '0.0';
}
