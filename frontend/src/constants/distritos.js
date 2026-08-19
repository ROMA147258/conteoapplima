// --- LISTA DE DISTRITOS DE LIMA METROPOLITANA ---
export const DISTRITOS_LIMA = [
  "Lima",
  "Cercado de Lima",
  "San Juan de Lurigancho",
  "Ancón",
  "Ate",
  "Barranco",
  "Breña",
  "Carabayllo",
  "Chaclacayo",
  "Chorrillos",
  "Cieneguilla",
  "Comas",
  "El Agustino",
  "Independencia",
  "Jesús María",
  "La Molina",
  "La Victoria",
  "Lince",
  "Los Olivos",
  "Lurigancho-Chosica",
  "Lurín",
  "Magdalena del Mar",
  "Miraflores",
  "Pachacámac",
  "Pucusana",
  "Pueblo Libre",
  "Puente Piedra",
  "Punta Hermosa",
  "Punta Negra",
  "Rímac",
  "San Bartolo",
  "San Borja",
  "San Isidro",
  "San Juan de Miraflores",
  "San Luis",
  "San Martín de Porres",
  "San Miguel",
  "Santa Anita",
  "Santa María del Mar",
  "Santa Rosa",
  "Santiago de Surco",
  "Surquillo",
  "Villa El Salvador",
  "Villa María del Triunfo"
];

// --- CANDIDATOS A ALCALDES POR DISTRITO ---
export const CANDIDATOS_MAP = {
  "Lima": {
    "FP": "Eduardo Romero",
    "JP": "Gonzalo Alegría",
    "SOMOS PERU": "Diego Serpa",
    "FREPAP": "Juan Silva",
    "VERDE": "Yuri Castro",
    "MORADO": "Néstor de la Rosa"
  },
  "Cercado de Lima": {
    "FP": "Eduardo Romero",
    "JP": "Gonzalo Alegría",
    "SOMOS PERU": "Diego Serpa",
    "FREPAP": "Juan Silva",
    "VERDE": "Yuri Castro",
    "MORADO": "Néstor de la Rosa"
  },
  "San Juan de Lurigancho": {
    "FP": "Alex Gonzales",
    "JP": "Manuel Angulo",
    "SOMOS PERU": "Jesús Maldonado",
    "FREPAP": "Elías Vargas",
    "VERDE": "Juan Navarro",
    "MORADO": "Brenda Ortiz"
  },
  "Miraflores": {
    "FP": "Ernesto Blumen",
    "JP": "Rocío Andrade",
    "SOMOS PERU": "Carlos Canales",
    "FREPAP": "Demetrio Ccahua",
    "VERDE": "Diego Uceda",
    "MORADO": "Manuel Masías"
  },
  "San Isidro": {
    "FP": "Javier Cipriani",
    "JP": "Sofía Rossi",
    "SOMOS PERU": "Nancy Vizurraga",
    "FREPAP": "Zenón Gallegos",
    "VERDE": "Victor Hugo Bazán",
    "MORADO": "Martín Bustamante"
  },
  "Santiago de Surco": {
    "FP": "Juan Manuel del Mar",
    "JP": "Gina Casanova",
    "SOMOS PERU": "Carlos Bruce",
    "FREPAP": "Moisés Alvites",
    "VERDE": "Eduardo Caprile",
    "MORADO": "Juan Carlos Martín"
  },
  "Breña": {
    "FP": "Carlos Albertini",
    "JP": "Sandro Balvín",
    "SOMOS PERU": "Luis de la Cruz",
    "FREPAP": "Juan Espinoza",
    "VERDE": "José Luis Gil",
    "MORADO": "Isabel Rodríguez"
  }
};

export function obtenerCandidatosPorUbicacion(ubicacion) {
  if (CANDIDATOS_MAP[ubicacion]) {
    return CANDIDATOS_MAP[ubicacion];
  }

  const NOMBRES = [
    "Carlos", "Luis", "José", "Juan", "Pedro", "Manuel", "Víctor", "Jorge", 
    "María", "Ana", "Carmen", "Rosa", "Sonia", "Patricia", "Sofía", "Diana"
  ];
  
  const APELLIDOS = [
    "Quispe", "Flores", "Sánchez", "García", "Ramos", "Huamán", "Mendoza", 
    "Chávez", "Castillo", "Villanueva", "Paredes", "Salazar", "Rojas", "Díaz"
  ];

  let seed = 0;
  for (let i = 0; i < ubicacion.length; i++) {
    seed += ubicacion.charCodeAt(i);
  }

  const generarNombre = (indicePartida) => {
    const nombreIdx = (seed + indicePartida * 3) % NOMBRES.length;
    const apellidoIdx1 = (seed + indicePartida * 7) % APELLIDOS.length;
    const apellidoIdx2 = (seed + indicePartida * 11) % APELLIDOS.length;
    return `${NOMBRES[nombreIdx]} ${APELLIDOS[apellidoIdx1]} ${APELLIDOS[apellidoIdx2]}`;
  };

  return {
    "FP": generarNombre(1),
    "JP": generarNombre(2),
    "SOMOS PERU": generarNombre(3),
    "FREPAP": generarNombre(4),
    "VERDE": generarNombre(5),
    "MORADO": generarNombre(6)
  };
}

export const ALCALDES_ACTUALES_MAP = {
  "Lima": "Rafael López Aliaga (Renovación Popular)",
  "Cercado de Lima": "Rafael López Aliaga (Renovación Popular)",
  "San Juan de Lurigancho": "Jesús Maldonado Amao (Somos Perú)",
  "Breña": "Luis Felipe de la Mata Martínez (Podemos Perú)",
  "Miraflores": "Carlos Canales Anchorena (Renovación Popular)",
  "San Isidro": "Nancy Vizurraga (Somos Perú)",
  "Santiago de Surco": "Carlos Bruce (Avanza País)",
  "Ancón": "Samuel Daza (Podemos Perú)",
  "Ate": "Franco Vidal (Avanza País)",
  "Barranco": "Jessica Vargas Gómez (Renovación Popular)",
  "Carabayllo": "Pablo Mendoza Cueva (Somos Perú)",
  "Chaclacayo": "Sergio Baigorria (Renovación Popular)",
  "Chorrillos": "Fernando Velasco (Alianza para el Progreso)",
  "Cieneguilla": "Emilio Chávez Huaringa (Podemos Perú)",
  "Comas": "Ulises Villegas Rojas (Somos Perú)",
  "El Agustino": "Richard Soria Fuerte (Podemos Perú)",
  "Independencia": "Alfredo Reynaga Ramírez (Somos Perú)",
  "Jesús María": "Jesús Gálvez Olivares (Renovación Popular)",
  "La Molina": "Esteban Uceda Guerra García (Renovación Popular)",
  "La Victoria": "Rubén Cano Altez (Renovación Popular)",
  "Lince": "Malca Schaiderman (Renovación Popular)",
  "Los Olivos": "Luis Felipe Castillo Oliva (Podemos Perú)",
  "Lurigancho-Chosica": "Oswaldo Vargas (Juntos por el Perú)",
  "Lurín": "Juan Marticorena (Alianza para el Progreso)",
  "Magdalena del Mar": "Francis Allison (Alianza para el Progreso)",
  "Pachacámac": "Enrique Cabrera (Alianza para el Progreso)",
  "Pucusana": "Juan José Cuya (Somos Perú)",
  "Pueblo Libre": "Mónica Tello López (Renovación Popular)",
  "Puente Piedra": "Rennan Espinoza (Somos Perú)",
  "Punta Hermosa": "Carlos Fernández (Avanza País)",
  "Punta Negra": "Eulogio Huayhua (Alianza para el Progreso)",
  "Rímac": "Néstor de la Rosa Villegas (Podemos Perú)",
  "San Bartolo": "August Carbajal Schumacher (Avanza País)",
  "San Borja": "Marco Antonio Álvarez Vargas (Renovación Popular)",
  "San Juan de Miraflores": "Delia Castro Pichihua (Alianza para el Progreso)",
  "San Luis": "Ricardo Perez Castro (Renovación Popular)",
  "San Martín de Porres": "Hernán Sifuentes Barca (Podemos Perú)",
  "San Miguel": "Eduardo Bless (Avanza País)",
  "Santa Anita": "Olimpio Alegría (Alianza para el Progreso)",
  "Santa María del Mar": "Hugo Monteverde (Acción Popular)",
  "Santa Rosa": "George Robles (Podemos Perú)",
  "Surquillo": "Cintia Loayza (Renovación Popular)",
  "Villa El Salvador": "Guido Iñigo Peralta (Alianza para el Progreso)",
  "Villa María del Triunfo": "Eloy Chávez Hernandez (Alianza para el Progreso)"
};

export function obtenerAlcaldeActual(ubicacion) {
  return ALCALDES_ACTUALES_MAP[ubicacion] || "No determinado";
}

export const PARTIDO_ID_MAP = {
  "FP": "fp",
  "JP": "jp",
  "SOMOS PERU": "sp",
  "FREPAP": "frepap",
  "VERDE": "verde",
  "MORADO": "morado"
};

export const PARTIDO_NOMBRES_LARGOS = {
  "FP": "Fuerza Popular",
  "JP": "Juntos por el Perú",
  "SOMOS PERU": "Somos Perú",
  "FREPAP": "Frepap",
  "VERDE": "Partido Verde",
  "MORADO": "Partido Morado"
};

export function obtenerPartidoDeCandidato(name, ubicacion) {
  if (!name) return null;
  const cleanName = name.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();

  const candProv = obtenerCandidatosPorUbicacion("Lima");
  for (const [party, candName] of Object.entries(candProv)) {
    const cleanCand = candName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
    if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
      return party;
    }
  }

  if (ubicacion) {
    const candDist = obtenerCandidatosPorUbicacion(ubicacion);
    for (const [party, candName] of Object.entries(candDist)) {
      const cleanCand = candName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
      if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
        return party;
      }
    }
  }

  return null;
}

export function obtenerNombreRealPartido(name, currentDistrict) {
  if (!name) return null;
  
  const district = currentDistrict || 'ATE';
  
  const partyFromCandidate = obtenerPartidoDeCandidato(name, district);
  if (partyFromCandidate) {
    return partyFromCandidate;
  }

  const clean = name.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();

  for (const [partyKey, longName] of Object.entries(PARTIDO_NOMBRES_LARGOS)) {
    const cleanLongName = longName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
    if (cleanLongName && (clean.includes(cleanLongName) || cleanLongName.includes(clean))) {
      return partyKey;
    }
  }

  const sortedParties = Object.keys(PARTIDO_ID_MAP).sort((a, b) => b.length - a.length);
  for (const partyKey of sortedParties) {
    const cleanPartyKey = partyKey.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
    if (cleanPartyKey && (clean.includes(cleanPartyKey) || cleanPartyKey.includes(clean))) {
      return partyKey;
    }
  }

  if (clean.includes('SOMOS') || clean.includes('SP')) {
    return 'SOMOS PERU';
  }

  return null;
}

export function generarLocalesYMesas(distrito) {
  let seed = 0;
  for (let i = 0; i < distrito.length; i++) {
    seed += distrito.charCodeAt(i);
  }
  
  const prefijos = ["I.E. Emblema", "I.E.", "Colegio Nacional", "Complejo Educativo", "I.E. Particular"];
  const nombres = [
    "Juana Alarco", "Fe y Alegría N° 25", "Mercedes Cabello", "Antenor Orrego", "Daniel A. Carrión",
    "Ricardo Palma", "Túpac Amaru", "Alfonso Ugarte", "San Juan Bautista", "Coronel Bolognesi",
    "José María Arguedas", "Ramón Castilla", "Nuestra Sra. de la Merced", "Miguel Grau", "Jorge Basadre"
  ];
  
  const numLocales = 4 + (seed % 5);
  const locales = [];
  
  for (let i = 0; i < numLocales; i++) {
    const prefIdx = (seed + i * 11) % prefijos.length;
    const nomIdx = (seed + i * 17) % nombres.length;
    const sufijo = (seed + i * 3) % 2 === 0 ? ` N° ${(seed + i * 23) % 400 + 100}` : "";
    
    const schoolName = `${prefijos[prefIdx]} ${nombres[nomIdx]}${sufijo}`;
    
    const numMesas = 4 + (seed + i * 7) % 8;
    const mesas = [];
    
    const baseMesa = 110000 + ((seed * 17 + i * 59) % 80000);
    for (let m = 0; m < numMesas; m++) {
      mesas.push(baseMesa + m);
    }
    
    locales.push({
      nombre: schoolName,
      mesas: mesas
    });
  }
  
  return locales;
}
