// --- LISTA DE DISTRITOS DE LIMA METROPOLITANA (43 DISTRITOS) ---
export const DISTRITOS_LIMA = [
  "BREÑA",
  "CARABAYLLO",
  "CHORRILLOS",
  "BARRANCO",
  "INDEPENDENCIA",
  "LA MOLINA",
  "LA VICTORIA",
  "SAN LUIS",
  "JESUS MARIA",
  "LIMA",
  "ATE",
  "EL AGUSTINO",
  "ANCON",
  "PUENTE PIEDRA",
  "SANTA ROSA",
  "COMAS",
  "RIMAC",
  "LINCE",
  "MAGDALENA DEL MAR",
  "SAN ISIDRO",
  "MIRAFLORES",
  "SURQUILLO",
  "SANTIAGO DE SURCO",
  "LURIN",
  "PACHACAMAC",
  "PUCUSANA",
  "PUNTA HERMOSA",
  "PUNTA NEGRA",
  "SAN BARTOLO",
  "SANTA MARIA DEL MAR",
  "CIENEGUILLA",
  "VILLA MARIA DEL TRIUNFO",
  "LOS OLIVOS",
  "CHACLACAYO",
  "LURIGANCHO",
  "PUEBLO LIBRE",
  "SAN BORJA",
  "SAN JUAN DE LURIGANCHO",
  "SAN JUAN DE MIRAFLORES",
  "SAN MARTIN DE PORRES",
  "SAN MIGUEL",
  "SANTA ANITA",
  "VILLA EL SALVADOR"
];

// --- DATOS MAESTROS DE PARTIDOS Y ORGANIZACIONES POLÍTICAS ---
export const PARTIDOS_DATA = {
  "SOMOS PERU": { shortName: "SP", partyId: "sp", partyLong: "Somos Perú" },
  "RENOVACION": { shortName: "RP", partyId: "rp", partyLong: "Renovación Popular" },
  "AHORA NACION": { shortName: "AN", partyId: "ahora-nacion", partyLong: "Ahora Nación" },
  "AVANZA PAIS": { shortName: "AVANZA", partyId: "avanza", partyLong: "Avanza País" },
  "PODEMOS": { shortName: "PODEMOS", partyId: "podemos", partyLong: "Podemos Perú" },
  "ACCION POPULAR": { shortName: "AP", partyId: "ap", partyLong: "Acción Popular" },
  "PPC": { shortName: "PPC", partyId: "ppc", partyLong: "Partido Popular Cristiano (PPC)" },
  "APP": { shortName: "APP", partyId: "app", partyLong: "Alianza para el Progreso" },
  "FP": { shortName: "FP", partyId: "fp", partyLong: "Fuerza Popular" },
  "JP": { shortName: "JP", partyId: "jp", partyLong: "Juntos por el Perú" },
  "FREPAP": { shortName: "FREPAP", partyId: "frepap", partyLong: "FREPAP" },
  "ESPERANZA": { shortName: "FE", partyId: "esperanza", partyLong: "Frente de la Esperanza 2021" },
  "MORADO": { shortName: "PM", partyId: "morado", partyLong: "Partido Morado" },
  "APRA": { shortName: "APRA", partyId: "apra", partyLong: "Partido Aprista Peruano" },
  "PRIN": { shortName: "PRIN", partyId: "prin", partyLong: "Partido Político PRIN" },
  "PAIS PARA TODOS": { shortName: "PPT", partyId: "pais-para-todos", partyLong: "Partido País para Todos" },
  "BUEN GOBIERNO": { shortName: "PBG", partyId: "buen-gobierno", partyLong: "Partido del Buen Gobierno" },
  "VERDE": { shortName: "PDV", partyId: "verde", partyLong: "Partido Demócrata Verde" },
  "PERU LIBRE": { shortName: "PL", partyId: "peru-libre", partyLong: "Perú Libre" },
  "PERU PRIMERO": { shortName: "PP", partyId: "peru-primero", partyLong: "Partido Político Perú Primero" },
  "PERU MODERNO": { shortName: "PMOD", partyId: "peru-moderno", partyLong: "Perú Moderno" },
  "LIBERTAD POPULAR": { shortName: "LP", partyId: "libertad-popular", partyLong: "Libertad Popular" },
  "PROGRESEMOS": { shortName: "PROG", partyId: "progresemos", partyLong: "Progresemos" },
  "OBRAS": { shortName: "OBRAS", partyId: "obras", partyLong: "Partido Cívico Obras" },
  "VISION PERU": { shortName: "VP", partyId: "vision", partyLong: "Visión Perú" },
  "FE EN EL PERU": { shortName: "FEP", partyId: "fe-en-el-peru", partyLong: "Fe en el Perú" },
  "UNIDAD Y PAZ": { shortName: "UYP", partyId: "unidad-y-paz", partyLong: "Partido Unidad y Paz" },
  "BATALLA PERU": { shortName: "BP", partyId: "batalla", partyLong: "Batalla Perú" },
  "TIERRA VERDE": { shortName: "CTTV", partyId: "tierra-verde", partyLong: "Coalición Transformadora Tierra Verde" },
  "PUEBLO CONSCIENTE": { shortName: "PC", partyId: "pueblo-consciente", partyLong: "Pueblo Consciente" },
  "PPP": { shortName: "PPP", partyId: "ppp", partyLong: "Partido Patriótico del Perú" },
  "INTEGRIDAD": { shortName: "ID", partyId: "integridad", partyLong: "Integridad Democrática" },
  "FUERZA CIUDADANA": { shortName: "FC", partyId: "fuerza-ciudadana", partyLong: "Fuerza Ciudadana" },
  "SALVEMOS AL PERU": { shortName: "SAP", partyId: "salvemos-al-peru", partyLong: "Salvemos al Perú" },
  "PTE PERU": { shortName: "PTE", partyId: "pte-peru", partyLong: "Partido de los Trabajadores y Emprendedores (PTE)" },
  "ADP": { shortName: "ADP", partyId: "adp", partyLong: "Partido Político ADP / Adelante Perú" },
  "VENCEREMOS": { shortName: "AEV", partyId: "venceremos", partyLong: "Alianza Electoral Venceremos" },
  "ALIANZA REGIONAL": { shortName: "ARP", partyId: "alianza-regional", partyLong: "Alianza Regional por el Perú" }
};

// --- CANDIDATOS A ALCALDES DE LIMA METROPOLITANA (PROVINCIAL) ---
export const CANDIDATOS_OFICIALES_LIMA_METROPOLITANA = [
  { num: 1, key: "SOMOS PERU", shortName: "SP", partyId: "sp", partyLong: "Somos Perú", candidato: "Carlos Ricardo Bruce Montes de Oca", organizacion: "Somos Perú" },
  { num: 2, key: "RENOVACION", shortName: "RP", partyId: "rp", partyLong: "Renovación Popular", candidato: "Rafael López Aliaga", organizacion: "Renovación Popular" },
  { num: 3, key: "AHORA NACION", shortName: "AN", partyId: "ahora-nacion", partyLong: "Ahora Nación", candidato: "Susel Ana María Paredes Piqué", organizacion: "Ahora Nación" },
  { num: 4, key: "AVANZA PAIS", shortName: "AVANZA", partyId: "avanza", partyLong: "Avanza País", candidato: "Francis James Allison Oyague", organizacion: "Avanza País" },
  { num: 5, key: "PODEMOS", shortName: "PODEMOS", partyId: "podemos", partyLong: "Podemos Perú", candidato: "Daniel Belizario Urresti Elera", organizacion: "Podemos Perú" },
  { num: 6, key: "JP", shortName: "JP", partyId: "jp", partyLong: "Juntos por el Perú", candidato: "Oswaldo Hernán Vargas Cuellar", organizacion: "Juntos por el Perú" },
  { num: 7, key: "OBRAS", shortName: "OBRAS", partyId: "obras", partyLong: "Partido Cívico Obras", candidato: "Ricardo Pablo Belmont Cassinelli", organizacion: "Partido Cívico Obras" },
  { num: 8, key: "FREPAP", shortName: "FREPAP", partyId: "frepap", partyLong: "FREPAP", candidato: "Segundo Valdez Zavala", organizacion: "FREPAP" },
  { num: 9, key: "ACCION POPULAR", shortName: "AP", partyId: "ap", partyLong: "Acción Popular", candidato: "Carlos Alberto Tejada Noriega", organizacion: "Acción Popular" },
  { num: 10, key: "ESPERANZA", shortName: "FE", partyId: "esperanza", partyLong: "Frente de la Esperanza 2021", candidato: "Elizabeth María del Rosario León Chinchay", organizacion: "Frente de la Esperanza 2021" },
  { num: 11, key: "VENCEREMOS", shortName: "AEV", partyId: "venceremos", partyLong: "Alianza Electoral Venceremos", candidato: "Juan Carlos Alvarado Mestanza", organizacion: "Alianza Electoral Venceremos" },
  { num: 12, key: "VISION PERU", shortName: "VP", partyId: "vision", partyLong: "Visión Perú", candidato: "Santiago Rosendo Abarca León", organizacion: "Visión Perú" },
  { num: 13, key: "APRA", shortName: "APRA", partyId: "apra", partyLong: "Partido Aprista Peruano", candidato: "Mónica Yadira Yaya Luyo", organizacion: "Partido Aprista Peruano" },
  { num: 14, key: "FP", shortName: "FP", partyId: "fp", partyLong: "Fuerza Popular", candidato: "Samuel Marcos Daza Taype", organizacion: "Fuerza Popular" },
  { num: 15, key: "PPC", shortName: "PPC", partyId: "ppc", partyLong: "Partido Popular Cristiano (PPC)", candidato: "Edgardo Renán de Pomar Vizcarra", organizacion: "Partido Popular Cristiano (PPC)" },
  { num: 16, key: "PROGRESEMOS", shortName: "PROG", partyId: "progresemos", partyLong: "Progresemos", candidato: "Luis Miguel Llanos Carrillo", organizacion: "Progresemos" },
  { num: 17, key: "MORADO", shortName: "PM", partyId: "morado", partyLong: "Partido Morado", candidato: "Victoria Betzabé La Cruz Garcés", organizacion: "Partido Morado" },
  { num: 18, key: "BUEN GOBIERNO", shortName: "PBG", partyId: "buen-gobierno", partyLong: "Partido del Buen Gobierno", candidato: "Carlos Francisco Gallardo Neyra", organizacion: "Partido del Buen Gobierno" },
  { num: 19, key: "VERDE", shortName: "PDV", partyId: "verde", partyLong: "Partido Demócrata Verde", candidato: "Flor de María Hurtado Valdez", organizacion: "Partido Demócrata Verde" },
  { num: 20, key: "PERU LIBRE", shortName: "PL", partyId: "peru-libre", partyLong: "Perú Libre", candidato: "Rubén José Ramírez Mateo", organizacion: "Perú Libre" },
  { num: 21, key: "TIERRA VERDE", shortName: "CTTV", partyId: "tierra-verde", partyLong: "Coalición Transformadora Tierra Verde", candidato: "Yehude Simon Munaro", organizacion: "Coalición Transformadora Tierra Verde" },
  { num: 22, key: "PUEBLO CONSCIENTE", shortName: "PC", partyId: "pueblo-consciente", partyLong: "Pueblo Consciente", candidato: "Luis Alberto Huette Tolentino", organizacion: "Pueblo Consciente" },
  { num: 23, key: "PPP", shortName: "PPP", partyId: "ppp", partyLong: "Partido Patriótico del Perú", candidato: "Sandro Caller Gutiérrez", organizacion: "Partido Patriótico del Perú" },
  { num: 24, key: "INTEGRIDAD", shortName: "ID", partyId: "integridad", partyLong: "Integridad Democrática", candidato: "Jessica Viviana Linares Romero", organizacion: "Integridad Democrática" },
  { num: 25, key: "FUERZA CIUDADANA", shortName: "FC", partyId: "fuerza-ciudadana", partyLong: "Fuerza Ciudadana", candidato: "Rubén Daniel Bonilla Espinoza", organizacion: "Fuerza Ciudadana" },
  { num: 26, key: "BATALLA PERU", shortName: "BP", partyId: "batalla", partyLong: "Batalla Perú", candidato: "Samir Frank Quispe Caballero", organizacion: "Batalla Perú" }
];

// Helper para construir listas completas distritales
const buildDistrictList = (overrideMap) => {
  const defaultParties = [
    "SOMOS PERU",
    "RENOVACION",
    "AVANZA PAIS",
    "PODEMOS",
    "ACCION POPULAR",
    "PPC",
    "AHORA NACION",
    "APP",
    "FP",
    "JP",
    "FREPAP",
    "ESPERANZA",
    "MORADO",
    "APRA",
    "PRIN",
    "PAIS PARA TODOS",
    "BUEN GOBIERNO",
    "VERDE",
    "PERU LIBRE",
    "PERU PRIMERO",
    "PERU MODERNO",
    "LIBERTAD POPULAR",
    "PROGRESEMOS",
    "OBRAS",
    "VISION PERU"
  ];

  // Ordenar priorizando los definidos en overrideMap
  const allKeys = [...new Set([...Object.keys(overrideMap), ...defaultParties])];

  return allKeys.map((key, idx) => {
    const meta = PARTIDOS_DATA[key] || {
      shortName: key.slice(0, 4),
      partyId: key.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      partyLong: key
    };

    const candName = overrideMap[key] || `Candidato ${meta.partyLong}`;

    return {
      num: idx + 1,
      key: key,
      shortName: meta.shortName,
      partyId: meta.partyId,
      partyLong: meta.partyLong,
      candidato: candName,
      organizacion: meta.partyLong
    };
  });
};

// --- CANDIDATOS OFICIALES POR DISTRITO (COMPLETOS CON SOMOS PERÚ Y TODOS LOS PARTIDOS) ---

// 1. SURQUILLO (9 candidatos oficiales dados + lista completa de organizaciones)
export const CANDIDATOS_OFICIALES_SURQUILLO = buildDistrictList({
  "ACCION POPULAR": "Phil Dempster Barriga Vásquez",
  "PRIN": "María Teresa Maestre Mejía",
  "RENOVACION": "Ruth Haydee Meza Saldarriaga",
  "PPC": "Renzo Jesús Gutiérrez Portillo",
  "AVANZA PAIS": "José Luis Huamaní Gonzales",
  "PAIS PARA TODOS": "Jessica Ofelia Barrera Mendoza",
  "AHORA NACION": "Dennis Alvarado Carrasco",
  "SOMOS PERU": "Sandra Liz Gutiérrez Cuba",
  "PODEMOS": "Miguel Ángel Ccamac Ortiz",
  "APP": "Jorge Luis Huamán",
  "FP": "Carlos Eduardo Mendoza",
  "JP": "María Elena Castillo",
  "MORADO": "Luis Alberto Morales",
  "ESPERANZA": "Patricia Salazar",
  "APRA": "Víctor Manuel Rojas"
});

// 2. MIRAFLORES
export const CANDIDATOS_OFICIALES_MIRAFLORES = buildDistrictList({
  "AVANZA PAIS": "Jorge Vicente Martín Muñoz Wells",
  "SOMOS PERU": "Alexander Enrique Von Ehren Campos",
  "MORADO": "Mario Renato Otiniano Buquich",
  "RENOVACION": "Amílcar Alessio Cantella Vega",
  "PPC": "María Soledad Ferreyros Castañeda",
  "ACCION POPULAR": "Carlos Alcides Zúñiga Arce",
  "AHORA NACION": "Ricardo Enrique Giesecke Sara Lafosse",
  "LIBERTAD POPULAR": "Daniel Rodríguez Zanabria",
  "BUEN GOBIERNO": "José Ricardo Portugal Quiroz",
  "PODEMOS": "Ernesto Blumen",
  "FP": "Rocío Andrade",
  "APP": "Manuel Masías Oyanguren"
});

// 3. SANTIAGO DE SURCO
export const CANDIDATOS_OFICIALES_SANTIAGO_DE_SURCO = buildDistrictList({
  "RENOVACION": "Juan Alejandro Palma Aurazo",
  "SOMOS PERU": "Arturo Miguel Guillermo Bobbio Carranza",
  "MORADO": "Betty Fani Fernández Gallarday",
  "AHORA NACION": "José Manuel Fernández Chávez",
  "PROGRESEMOS": "Oscar Mario Aco Miranda",
  "PPC": "David Ignacio Vera Trujillo",
  "UNIDAD Y PAZ": "Hugo Roberto Encalada Chumbile",
  "APP": "Jean Pierre Combe Portocarrero",
  "ACCION POPULAR": "Oswaldo Martín Moreno Rivera",
  "PAIS PARA TODOS": "José Carlos Bolívar Mejía",
  "PODEMOS": "Ruth Candelaria Bisbal Oyague",
  "AVANZA PAIS": "Carlos Bruce",
  "FP": "Juan Manuel del Mar"
});

// 4. SAN BORJA
export const CANDIDATOS_OFICIALES_SAN_BORJA = buildDistrictList({
  "SOMOS PERU": "Gina Valeria Casanova Mera",
  "AVANZA PAIS": "Roberth Edwuard Montoya Puente",
  "LIBERTAD POPULAR": "Edgard Núñez Quipuzco",
  "ACCION POPULAR": "Alberto Tejada Conroy",
  "RENOVACION": "Javier Martín Diez Gaspard",
  "ADP": "Joel Edmundo Miranda Villanueva",
  "APRA": "Juan Fernando Pilco Castañeda",
  "PPC": "Willyans José Soriano Cabrera",
  "PODEMOS": "Marco Antonio Álvarez",
  "FP": "María Luisa Morales",
  "APP": "Carlos Alberto Ramos"
});

// 5. SAN ISIDRO
export const CANDIDATOS_OFICIALES_SAN_ISIDRO = buildDistrictList({
  "SOMOS PERU": "Víctor Hugo Bazán Pastor",
  "ACCION POPULAR": "Carlomagno Chacón Gómez",
  "APP": "Zuleika Vannessa Benel Zevallos",
  "AVANZA PAIS": "César Augusto Combina Salvatierra",
  "RENOVACION": "Javier Paino",
  "VISION PERU": "Walter Alfonso Cavero Villanes",
  "PODEMOS": "Daniel Martín Amaya Carranza",
  "PPC": "Fidel Bratzo García Durante",
  "FP": "Javier Cipriani",
  "MORADO": "Martín Bustamante"
});

// 6. PUEBLO LIBRE
export const CANDIDATOS_OFICIALES_PUEBLO_LIBRE = buildDistrictList({
  "SOMOS PERU": "Jhonel Jorge Leguía Jamis",
  "RENOVACION": "Cecilia Acosta Cajaleon",
  "PODEMOS": "Daniel Martín Amaya Carranza",
  "MORADO": "Miguel Stefano Ruiz Gutiérrez",
  "ACCION POPULAR": "Carlos Enrique Arana Urteaga",
  "VISION PERU": "Walter Alfonso Cavero Villanes",
  "AVANZA PAIS": "José Luis Casas Carrión",
  "APRA": "Josmell Absalón Muñoz Barranzuela",
  "ESPERANZA": "Fabiola Lucero Silva Montero",
  "ALIANZA REGIONAL": "Hilgo Antonio Manchego Ormeño",
  "AHORA NACION": "Oscar Raúl Cabello Acosta",
  "PPC": "Fidel Bratzo García Durante"
});

// 7. SAN JUAN DE LURIGANCHO
export const CANDIDATOS_OFICIALES_SAN_JUAN_DE_LURIGANCHO = buildDistrictList({
  "SOMOS PERU": "Jesús Maldonado Amao",
  "PAIS PARA TODOS": "Miguel Oswaldo Huacre Méndez",
  "BUEN GOBIERNO": "Carlos Jaime De La Torre Mendoza",
  "APP": "Juan Valentín Navarro Jiménez",
  "AVANZA PAIS": "Héctor Joaquín Alejandro Bustamante",
  "RENOVACION": "Américo Zegarra Acuña",
  "VERDE": "Alex Gonzales Castillo",
  "AHORA NACION": "Elsa Virginia Alarcón Suárez",
  "OBRAS": "Edwin Mejía Cerdán",
  "ACCION POPULAR": "Luis Gino Blanco Aldama",
  "PODEMOS": "José Luis Luna Morales",
  "FP": "Manuel Angulo",
  "MORADO": "Brenda Ortiz"
});

// 8. ATE
export const CANDIDATOS_OFICIALES_ATE = buildDistrictList({
  "SOMOS PERU": "Simón Ortiz Talaverano",
  "PODEMOS": "Edde Cuellar Alegría",
  "AVANZA PAIS": "Manuel Gaudencio Vidal Camargo",
  "MORADO": "Jorge Antonio Salazar Velásquez",
  "PPC": "José Luis Hurtado Apaico",
  "PERU PRIMERO": "Joel José Núñez Mendoza",
  "RENOVACION": "Elizabeth Nancy Cabezas Flores",
  "FREPAP": "Misael Meneses Flores",
  "AHORA NACION": "Luis Eusebio Poma Tacuri",
  "ACCION POPULAR": "Arturo Jonell Peña Sánchez",
  "APP": "Franco Vidal Morales"
});

// 9. COMAS
export const CANDIDATOS_OFICIALES_COMAS = buildDistrictList({
  "SOMOS PERU": "Ana Yuriko Niño de Guzmán Tengan",
  "AVANZA PAIS": "Raúl Díaz Pérez",
  "PODEMOS": "Carmen Mónica Acuña Jara",
  "RENOVACION": "Jean Pool Granados Lazo",
  "PERU MODERNO": "Nerio Wilson Sánchez Quiroz",
  "PTE PERU": "Javier Sósimo Carrasco Condori",
  "PPC": "Juan Carlos Condori Chávez",
  "AHORA NACION": "César Augusto Cosiche Tenorio",
  "ACCION POPULAR": "Pierre Orlando Apian Castillo",
  "FP": "Samuel Horacio Guerrero Castillo",
  "APP": "Roxana Marylia Ari Acuña",
  "MORADO": "Josmell Max Peralta Peña"
});

// 10. LOS OLIVOS
export const CANDIDATOS_OFICIALES_LOS_OLIVOS = buildDistrictList({
  "SOMOS PERU": "Erick Melchor Torres",
  "RENOVACION": "Luis Sigfredo Milla Soto",
  "ACCION POPULAR": "Franco Enrique Cortez Gutiérrez",
  "JP": "Heidelberger Willians Davis Suyon Díaz",
  "PROGRESEMOS": "Segundo Marcos De La Cruz Vega",
  "OBRAS": "Wilder Leoncio Torpoco Huayta",
  "AVANZA PAIS": "Felipe Baldomero Castillo Alfaro",
  "PERU LIBRE": "María Rosario Silvestre Vílchez",
  "LIBERTAD POPULAR": "Ángel Solís Vergaray",
  "PODEMOS": "Luis Felipe Castillo Oliva",
  "APP": "Pedro Del Rosario"
});

// 11. SAN MARTIN DE PORRES
export const CANDIDATOS_OFICIALES_SAN_MARTIN_DE_PORRES = buildDistrictList({
  "SOMOS PERU": "Luis Paul Cárdenas Sánchez",
  "APRA": "Luis César Navarro Maldonado",
  "PERU PRIMERO": "Víctor Vicente Santander Salvador",
  "AHORA NACION": "Aquiles Cirilo Collasos Villanueva",
  "MORADO": "Luis Alberto Flores Roldán",
  "PROGRESEMOS": "Anndy Miguel Durán Núñez",
  "RENOVACION": "Peter Omar Jaime Cori",
  "VERDE": "Carlos Alberto Albújar Corazón",
  "FE EN EL PERU": "César Augusto Vargas Gutiérrez",
  "AVANZA PAIS": "Adolfo Israel Mattos Piaggio",
  "ACCION POPULAR": "Julio Abraham Chávez Chiong",
  "PODEMOS": "Diego Armando López Jara",
  "APP": "Hernán Sifuentes Barca"
});

// 12. LA MOLINA
export const CANDIDATOS_OFICIALES_LA_MOLINA = buildDistrictList({
  "SOMOS PERU": "Juan Carlos Martín Zurek Pardo Figueroa",
  "AVANZA PAIS": "Sergio Joan Castromonte Chaparro",
  "APP": "María Perla Espinoza Aquino",
  "FE EN EL PERU": "María-Pía Paz de la Barra Freigeiro",
  "VISION PERU": "Edwin Aníbal Mendoza Ramírez",
  "RENOVACION": "Lizzi del Rocío Sueldo Matos",
  "ACCION POPULAR": "Edmundo del Águila Herrera",
  "ADP": "Julio Adolfo Tovar Uribe",
  "AHORA NACION": "Flor de María Tadeo Romero",
  "PROGRESEMOS": "José Miguel Rodríguez Tasayco",
  "PODEMOS": "Cristopher Eldin Clemente Pérez",
  "PPC": "Meisy Blanca Rosa Núñez Ruiz"
});

// 13. JESUS MARIA
export const CANDIDATOS_OFICIALES_JESUS_MARIA = buildDistrictList({
  "SOMOS PERU": "Luiz Carlos Reátegui del Águila",
  "ACCION POPULAR": "Jorge Luis Quintana García Godos",
  "AHORA NACION": "Raphael Christian Valencia Diestra",
  "AVANZA PAIS": "Luis Enrique Ocrospoma Pella",
  "RENOVACION": "Daniel Ricardo Li León",
  "APP": "Renato Aldo Rossini Valenzuela",
  "ESPERANZA": "María del Pilar Albarracín Valverde",
  "APRA": "María Luisa Lanatta Pino",
  "FP": "Roberto Antonio Aymar Silva",
  "PODEMOS": "Ernesto Enrique Delhonte Cagna",
  "PPC": "Julissa Rocío Fernández Fernández",
  "OBRAS": "José Luis Herrera Urueta"
});

// 14. LINCE
export const CANDIDATOS_OFICIALES_LINCE = buildDistrictList({
  "SOMOS PERU": "José Antonio Aliaga Pajares",
  "AHORA NACION": "Nidia Alegría Herrera",
  "PODEMOS": "Luis Miguel Alonzo Ramírez",
  "PERU PRIMERO": "Arturo Ronald Bejarano Gurmendi",
  "PAIS PARA TODOS": "Miguel Ángel Espinoza Saavedra",
  "AVANZA PAIS": "Luis Ernesto Flores Reátegui",
  "FP": "Otilia Merino García",
  "ACCION POPULAR": "Víctor Manuel Noriega Salazar",
  "RENOVACION": "Mirtha Sebastiana Uribe Soriano",
  "APRA": "Yvan Alexis Villavicencio Alvildo",
  "PPC": "Eduardo Danilo Albarracín Ugarte",
  "APP": "Malca Schaiderman"
});

// 15. MAGDALENA DEL MAR
export const CANDIDATOS_OFICIALES_MAGDALENA_DEL_MAR = buildDistrictList({
  "SOMOS PERU": "Alberto Sánchez Aizcorbe Carranza",
  "RENOVACION": "Víctor Raúl Paulini Sánchez",
  "APP": "Johan Fritz Chávez Sifuentes",
  "AVANZA PAIS": "Carla Robbiano Montes de Allison",
  "ACCION POPULAR": "Diego Fernando Uceda Guerra-García",
  "PODEMOS": "Carlos Alfonso Gómez de la Torre",
  "PPC": "Javier Eduardo Ismodes",
  "FP": "Raúl Madueño",
  "MORADO": "Carmen Rosa López"
});

// 16. SAN MIGUEL
export const CANDIDATOS_OFICIALES_SAN_MIGUEL = buildDistrictList({
  "SOMOS PERU": "Carolina Mannucci Arámbulo",
  "ACCION POPULAR": "Juan José Guevara Bonilla",
  "APRA": "Santiago Nicolás Barreda Arias",
  "PROGRESEMOS": "Napoleón Roberto Martínez Merizalde Huatuco",
  "RENOVACION": "Marcos Enrique Cabrera Porras",
  "BUEN GOBIERNO": "Michael Alberto Paredes Torres",
  "PERU MODERNO": "Jorge Luis Moreno Morán",
  "AVANZA PAIS": "Eduardo Bless Cabrejas",
  "PODEMOS": "Salvador Heresi Chicoma",
  "APP": "Ángel Romero"
});

// 17. CHORRILLOS
export const CANDIDATOS_OFICIALES_CHORRILLOS = buildDistrictList({
  "SOMOS PERU": "Ricardo Vásquez",
  "APP": "Henry Herrera",
  "ACCION POPULAR": "Luis Jiménez",
  "PROGRESEMOS": "Dionisio Navarro",
  "AVANZA PAIS": "Richard Cortez",
  "MORADO": "Kruger Vidal",
  "RENOVACION": "Roberto Pizarro",
  "FP": "María Neyra",
  "PODEMOS": "Jorge Guzmán",
  "FE EN EL PERU": "Ricardo Bejarano",
  "PPC": "Fernando Velasco Huamán"
});

// 18. BARRANCO
export const CANDIDATOS_OFICIALES_BARRANCO = buildDistrictList({
  "SOMOS PERU": "Felipe Mezarina Tong",
  "PPC": "Jorge Ruiz de Somocurcio",
  "ACCION POPULAR": "María Luisa Cardoso",
  "PROGRESEMOS": "Nicole Muñoz",
  "LIBERTAD POPULAR": "José Rodríguez Cárdenas",
  "MORADO": "Enrique Delucchi",
  "RENOVACION": "Manuel Espinoza",
  "AVANZA PAIS": "Angélica Noguerol",
  "PODEMOS": "Jessica Vargas Gómez",
  "APP": "Gonzalo Rodríguez"
});

// 19. BREÑA
export const CANDIDATOS_OFICIALES_BREÑA = buildDistrictList({
  "SOMOS PERU": "Luis Ojeda",
  "LIBERTAD POPULAR": "Jorge Sarmiento",
  "UNIDAD Y PAZ": "Diana León",
  "RENOVACION": "Isabel Rodríguez",
  "PUEBLO CONSCIENTE": "Haydy Breña",
  "PODEMOS": "Luis De la Mata",
  "PERU PRIMERO": "Arturo Maura",
  "AVANZA PAIS": "Iván Chang",
  "ACCION POPULAR": "Carlos Albertini",
  "JP": "Sandro Balvín",
  "APP": "Gílmer García"
});

// 20. RIMAC
export const CANDIDATOS_OFICIALES_RIMAC = buildDistrictList({
  "SOMOS PERU": "Pedro Morales",
  "ACCION POPULAR": "Javier Revilla",
  "AVANZA PAIS": "Enrique Peramás",
  "BUEN GOBIERNO": "Roberto Telles",
  "AHORA NACION": "Jonathan Seña",
  "ESPERANZA": "Jérico Mosquera",
  "RENOVACION": "Isabel Ayala",
  "PRIN": "Antonio Cocha",
  "PPC": "Efigenia Arnao",
  "APRA": "Felicidad Salhuana",
  "PODEMOS": "Néstor de la Rosa Villegas",
  "FP": "Walter Salinas"
});

// 21. LA VICTORIA
export const CANDIDATOS_OFICIALES_LA_VICTORIA = buildDistrictList({
  "SOMOS PERU": "Alberto Fernando Moreno Mejía",
  "PERU PRIMERO": "Aldo Horacio Rosales Pacheco",
  "OBRAS": "Alejandro Nilo Pérez Moreno",
  "PPC": "César Rafael Ibarra Nureña",
  "PAIS PARA TODOS": "Florencio Froilán Fierro Flores",
  "APP": "Joaquín Reynaldo Albarracín Ramos",
  "AVANZA PAIS": "Joe Zanabria Soberón",
  "ACCION POPULAR": "Luis Álvaro Pletikosic Guzmán",
  "ESPERANZA": "María Teresa Rosas García",
  "PODEMOS": "Mesías Máximo Gonzales Sánchez",
  "AHORA NACION": "Nilda Esperanza Carranza Rodríguez",
  "RENOVACION": "Susana Liliana Saldaña Ramos",
  "BATALLA PERU": "Walter Ciro Pérez Noreña"
});

// 22. VILLA EL SALVADOR
export const CANDIDATOS_OFICIALES_VILLA_EL_SALVADOR = buildDistrictList({
  "SOMOS PERU": "Clodoaldo Kevin Yñigo Peralta",
  "RENOVACION": "Alberto Luis Peralta Huatuco",
  "ACCION POPULAR": "José Luis Flores Llauca",
  "APP": "Marcelino Huamán Cano",
  "FP": "Ricardo Gil Espadín",
  "OBRAS": "Nils René Antonio Siccos",
  "PERU PRIMERO": "Milton Tomás Lluque Sosa",
  "MORADO": "Migman Pinchi Caro",
  "BUEN GOBIERNO": "Yolanda Inés Peña Valdivia",
  "PODEMOS": "Guido Iñigo Peralta",
  "AVANZA PAIS": "Santiago Mozo"
});

// 23. VILLA MARIA DEL TRIUNFO
export const CANDIDATOS_OFICIALES_VILLA_MARIA_DEL_TRIUNFO = buildDistrictList({
  "SOMOS PERU": "Guido Iñigo Peralta",
  "JP": "René Alfredo Yucra Verástegui",
  "PPC": "Cresencio Gonzales Ccapcha",
  "PAIS PARA TODOS": "Juan Carlos Medina Morillo",
  "SALVEMOS AL PERU": "Magaly Rosy Copez Gutiérrez",
  "AVANZA PAIS": "David Andrés Morales Cárdenas",
  "RENOVACION": "Robert Joel Ludeña Guerra",
  "PODEMOS": "Carlos Francisco Hinostroza Rodríguez",
  "APP": "Eloy Chávez Hernández",
  "ACCION POPULAR": "Washington Ipenza"
});

// 24. SAN JUAN DE MIRAFLORES
export const CANDIDATOS_OFICIALES_SAN_JUAN_DE_MIRAFLORES = buildDistrictList({
  "SOMOS PERU": "Daniel Castro Pichihua",
  "VISION PERU": "Andy Alan Vilca Huamán",
  "AHORA NACION": "Olis Yaranga Jacinto",
  "APP": "Luis Dante Mendieta Flores",
  "PERU PRIMERO": "Michel Melchor Sanabria Ruiz",
  "ESPERANZA": "Edgar Wuillington Mejía Rodríguez",
  "RENOVACION": "Mabel Karina Leandro Melgarejo",
  "FP": "Anatoly Renán Bedriñana Córdova",
  "PODEMOS": "Martín José Palomino Córdova",
  "PRIN": "Edilberto Lucio Quispe Rodríguez",
  "AVANZA PAIS": "Javier Altamirano"
});

// 25. CARABAYLLO
export const CANDIDATOS_OFICIALES_CARABAYLLO = buildDistrictList({
  "SOMOS PERU": "Rosario Peláez Ramírez",
  "APP": "Juan Ladislao Espinoza Ortiz",
  "JP": "Juan Carlos Huayanay Mormontoy",
  "ACCION POPULAR": "Carlos Faustino Núñez Calderón",
  "OBRAS": "Alejandro Hipólito Ramos Rivera",
  "RENOVACION": "Nandy Janeth Córdova Morales",
  "PRIN": "Renso Evert Aguilar Velarde",
  "PPC": "Dennis Antonio Huapaya Bravo",
  "PERU PRIMERO": "Claudio Rodríguez Mansilla",
  "AHORA NACION": "Ignacio Jorge Sebastián Távara Arroyo",
  "FP": "Bélica Julia Bravo Alcántara",
  "FREPAP": "Héctor Manuel Cochón Barrientos",
  "PODEMOS": "Wilmer Roberto Valverde Valverde",
  "AVANZA PAIS": "Joe Peter Robles Escobedo",
  "PAIS PARA TODOS": "Pablo Alejandro González Villanueva"
});

// 26. PUENTE PIEDRA
export const CANDIDATOS_OFICIALES_PUENTE_PIEDRA = buildDistrictList({
  "SOMOS PERU": "Rennán Santiago Espinoza Venegas",
  "PODEMOS": "Fernando Guillermo Agurto Montesinos",
  "ACCION POPULAR": "Juan Carlos Merino Huamán",
  "AVANZA PAIS": "Milton Fernando Jiménez Salazar",
  "APP": "Judith Marisol Ramírez Rodríguez",
  "RENOVACION": "Esteban Felizardo Monzón Fernández",
  "PPC": "Carlos Enrique Mendoza",
  "FP": "Maritza Elizabeth Vargas",
  "AHORA NACION": "Pedro Huertas",
  "MORADO": "Luis Alberto Díaz"
});

// 27. SANTA ANITA
export const CANDIDATOS_OFICIALES_SANTA_ANITA = buildDistrictList({
  "SOMOS PERU": "José Luis Nole Palomino",
  "RENOVACION": "Antero Maurine Pickmans Arenaza",
  "ACCION POPULAR": "Flora Maribel Fernández Rengifo",
  "PERU PRIMERO": "Manuel Edgardo Mamani Rodríguez",
  "AVANZA PAIS": "Eduardo Rímachi Martínez",
  "PODEMOS": "Leonor Chumbimune Cajahuaringa",
  "APP": "Olimpio Alegría Calderón",
  "FP": "Carlos Martínez",
  "PPC": "Hugo Ramos"
});

// 28. INDEPENDENCIA
export const CANDIDATOS_OFICIALES_INDEPENDENCIA = buildDistrictList({
  "SOMOS PERU": "Alfredo Reynaga Ramírez",
  "PODEMOS": "Gregorio Bernardino Quispe Alvino",
  "PERU PRIMERO": "Sandra Gutiérrez Aibar",
  "RENOVACION": "Benigno Calderón",
  "AVANZA PAIS": "Víctor Yuri Vílchez",
  "ACCION POPULAR": "Raúl Díaz",
  "APP": "Evans Sifuentes",
  "FP": "Yuri Pando",
  "PPC": "Carmen Rosa Ortiz"
});

// 29. SAN LUIS
export const CANDIDATOS_OFICIALES_SAN_LUIS = buildDistrictList({
  "SOMOS PERU": "David Rojas Maza",
  "RENOVACION": "Ricardo Pérez Castro",
  "ACCION POPULAR": "Christian Pardo",
  "AVANZA PAIS": "Zee Carlos Corrales",
  "PODEMOS": "Ronald Fuentes",
  "PPC": "Marilú Zevallos",
  "APP": "Víctor Alegría",
  "FP": "Jorge Morante"
});

// 30. CHACLACAYO
export const CANDIDATOS_OFICIALES_CHACLACAYO = buildDistrictList({
  "SOMOS PERU": "Manuel Campos Sologuren",
  "RENOVACION": "Sergio Antonio Baigorria Seas",
  "AVANZA PAIS": "Leonidas Altamirano",
  "ACCION POPULAR": "Luis Bueno Quino",
  "PODEMOS": "Vilma Coronado",
  "APP": "Javier Huamaní",
  "FP": "Carlos Rossi",
  "PPC": "Enrique Palomino"
});

// 31. LURIGANCHO (CHOSICA)
export const CANDIDATOS_OFICIALES_LURIGANCHO = buildDistrictList({
  "SOMOS PERU": "Víctor Castillo Sánchez",
  "JP": "Oswaldo Hernán Vargas Cuellar",
  "PODEMOS": "Hugo Pariona",
  "RENOVACION": "Raúl Porturas",
  "AVANZA PAIS": "Carlos Rivera",
  "ACCION POPULAR": "Fernando Morales",
  "APP": "Luis Gonzales",
  "FP": "David Palacios",
  "PPC": "Santos Quispe"
});

// 32. LURIN
export const CANDIDATOS_OFICIALES_LURIN = buildDistrictList({
  "SOMOS PERU": "Rosa Torrejón",
  "APP": "Juan Raúl Marticorena Cuba",
  "RENOVACION": "José Arakaki",
  "AVANZA PAIS": "Francisco Silva",
  "PODEMOS": "Luis Chumpitaz",
  "ACCION POPULAR": "Víctor Palacios",
  "FP": "Jorge Arroyo",
  "PPC": "Manuel Delgado"
});

// 33. PACHACAMAC
export const CANDIDATOS_OFICIALES_PACHACAMAC = buildDistrictList({
  "SOMOS PERU": "Hugo Ramos Lescano",
  "APP": "Enrique Valentín Cabrera Sulca",
  "RENOVACION": "Shirley Susan Ramos",
  "PODEMOS": "Marcos Antonio",
  "AVANZA PAIS": "Guillermo Panta",
  "ACCION POPULAR": "César Mendoza",
  "FP": "Elena Carrión"
});

// 34. CIENEGUILLA
export const CANDIDATOS_OFICIALES_CIENEGUILLA = buildDistrictList({
  "SOMOS PERU": "Edwin Subilete",
  "PODEMOS": "Emilio Chávez Huaringa",
  "RENOVACION": "Manuel Lara",
  "AVANZA PAIS": "Mirtha Hualpa",
  "APP": "Carlos Sandoval",
  "ACCION POPULAR": "Pedro Vargas"
});

// 35. ANCON
export const CANDIDATOS_OFICIALES_ANCON = buildDistrictList({
  "SOMOS PERU": "John Barrera Cavassa",
  "PODEMOS": "Samuel Marcos Daza Taype",
  "RENOVACION": "Felipe Arakaki Shapiama",
  "AVANZA PAIS": "Carlos Morales",
  "ACCION POPULAR": "David Gómez",
  "APP": "Pedro Salcedo",
  "FP": "María Elena López"
});

// 36. SANTA ROSA
export const CANDIDATOS_OFICIALES_SANTA_ROSA = buildDistrictList({
  "SOMOS PERU": "Alan Carrasco Bobadilla",
  "PODEMOS": "George Robles Soto",
  "RENOVACION": "Raúl Poma",
  "AVANZA PAIS": "Luis García",
  "ACCION POPULAR": "Mario Huamán",
  "APP": "Jorge Chávez"
});

// 37. PUCUSANA
export const CANDIDATOS_OFICIALES_PUCUSANA = buildDistrictList({
  "SOMOS PERU": "Juan José Cuya Espinoza",
  "RENOVACION": "Lidia Carrillo",
  "AVANZA PAIS": "Carlos Chauca",
  "PODEMOS": "Enrique Delgado",
  "APP": "Pedro Rivas",
  "ACCION POPULAR": "Julio Quispe"
});

// 38. PUNTA HERMOSA
export const CANDIDATOS_OFICIALES_PUNTA_HERMOSA = buildDistrictList({
  "SOMOS PERU": "Jorge Olaechea",
  "AVANZA PAIS": "Carlos Guillermo Fernández Otero",
  "RENOVACION": "Guillermo Samaniego",
  "PPC": "Richard Vega",
  "PODEMOS": "Víctor Castillo",
  "ACCION POPULAR": "Luis Paredes"
});

// 39. PUNTA NEGRA
export const CANDIDATOS_OFICIALES_PUNTA_NEGRA = buildDistrictList({
  "SOMOS PERU": "José Delgado",
  "APP": "Eulogio Huayhua Huayhua",
  "AVANZA PAIS": "Víctor Saman",
  "RENOVACION": "Julia Ramos",
  "PODEMOS": "Carlos Valdivia",
  "ACCION POPULAR": "Jorge Silva"
});

// 40. SAN BARTOLO
export const CANDIDATOS_OFICIALES_SAN_BARTOLO = buildDistrictList({
  "SOMOS PERU": "Jorge Luis Infante",
  "AVANZA PAIS": "August Carbajal Schumacher",
  "RENOVACION": "Martha Valdivia",
  "PODEMOS": "Elliott Ramos",
  "APP": "Carlos Mendoza",
  "ACCION POPULAR": "Raúl Sánchez"
});

// 41. SANTA MARIA DEL MAR
export const CANDIDATOS_OFICIALES_SANTA_MARIA_DEL_MAR = buildDistrictList({
  "SOMOS PERU": "Jhair Medina",
  "ACCION POPULAR": "Hugo Alberto Monteverde Cerrutti",
  "AVANZA PAIS": "Alberto Hurtado",
  "RENOVACION": "Susana Vidal",
  "PODEMOS": "Manuel Rojas",
  "APP": "Fernando Gálvez"
});

// 42. EL AGUSTINO
export const CANDIDATOS_OFICIALES_EL_AGUSTINO = buildDistrictList({
  "SOMOS PERU": "Jorge García",
  "PODEMOS": "Richard Robert Soria Fuerte",
  "APP": "Víctor Salcedo",
  "RENOVACION": "Carlos Ramos",
  "AVANZA PAIS": "Carmen Rosa Morales",
  "ACCION POPULAR": "Manuel Zapata",
  "FP": "Víctor Alva"
});

// --- MAPEO DE LISTAS DISTRITALES ---
export const LISTAS_DISTRITALES_OFICIALES = {
  "surquillo": CANDIDATOS_OFICIALES_SURQUILLO,
  "miraflores": CANDIDATOS_OFICIALES_MIRAFLORES,
  "santiago de surco": CANDIDATOS_OFICIALES_SANTIAGO_DE_SURCO,
  "surco": CANDIDATOS_OFICIALES_SANTIAGO_DE_SURCO,
  "san borja": CANDIDATOS_OFICIALES_SAN_BORJA,
  "san isidro": CANDIDATOS_OFICIALES_SAN_ISIDRO,
  "pueblo libre": CANDIDATOS_OFICIALES_PUEBLO_LIBRE,
  "san juan de lurigancho": CANDIDATOS_OFICIALES_SAN_JUAN_DE_LURIGANCHO,
  "sjl": CANDIDATOS_OFICIALES_SAN_JUAN_DE_LURIGANCHO,
  "ate": CANDIDATOS_OFICIALES_ATE,
  "ate vitarte": CANDIDATOS_OFICIALES_ATE,
  "comas": CANDIDATOS_OFICIALES_COMAS,
  "los olivos": CANDIDATOS_OFICIALES_LOS_OLIVOS,
  "san martin de porres": CANDIDATOS_OFICIALES_SAN_MARTIN_DE_PORRES,
  "smp": CANDIDATOS_OFICIALES_SAN_MARTIN_DE_PORRES,
  "la molina": CANDIDATOS_OFICIALES_LA_MOLINA,
  "jesus maria": CANDIDATOS_OFICIALES_JESUS_MARIA,
  "lince": CANDIDATOS_OFICIALES_LINCE,
  "magdalena del mar": CANDIDATOS_OFICIALES_MAGDALENA_DEL_MAR,
  "magdalena": CANDIDATOS_OFICIALES_MAGDALENA_DEL_MAR,
  "san miguel": CANDIDATOS_OFICIALES_SAN_MIGUEL,
  "chorrillos": CANDIDATOS_OFICIALES_CHORRILLOS,
  "barranco": CANDIDATOS_OFICIALES_BARRANCO,
  "brena": CANDIDATOS_OFICIALES_BREÑA,
  "breña": CANDIDATOS_OFICIALES_BREÑA,
  "rimac": CANDIDATOS_OFICIALES_RIMAC,
  "la victoria": CANDIDATOS_OFICIALES_LA_VICTORIA,
  "villa el salvador": CANDIDATOS_OFICIALES_VILLA_EL_SALVADOR,
  "ves": CANDIDATOS_OFICIALES_VILLA_EL_SALVADOR,
  "villa maria del triunfo": CANDIDATOS_OFICIALES_VILLA_MARIA_DEL_TRIUNFO,
  "vmt": CANDIDATOS_OFICIALES_VILLA_MARIA_DEL_TRIUNFO,
  "san juan de miraflores": CANDIDATOS_OFICIALES_SAN_JUAN_DE_MIRAFLORES,
  "sjm": CANDIDATOS_OFICIALES_SAN_JUAN_DE_MIRAFLORES,
  "carabayllo": CANDIDATOS_OFICIALES_CARABAYLLO,
  "puente piedra": CANDIDATOS_OFICIALES_PUENTE_PIEDRA,
  "santa anita": CANDIDATOS_OFICIALES_SANTA_ANITA,
  "independencia": CANDIDATOS_OFICIALES_INDEPENDENCIA,
  "san luis": CANDIDATOS_OFICIALES_SAN_LUIS,
  "chaclacayo": CANDIDATOS_OFICIALES_CHACLACAYO,
  "lurigancho": CANDIDATOS_OFICIALES_LURIGANCHO,
  "chosica": CANDIDATOS_OFICIALES_LURIGANCHO,
  "lurigancho-chosica": CANDIDATOS_OFICIALES_LURIGANCHO,
  "lurin": CANDIDATOS_OFICIALES_LURIN,
  "pachacamac": CANDIDATOS_OFICIALES_PACHACAMAC,
  "cieneguilla": CANDIDATOS_OFICIALES_CIENEGUILLA,
  "ancon": CANDIDATOS_OFICIALES_ANCON,
  "santa rosa": CANDIDATOS_OFICIALES_SANTA_ROSA,
  "pucusana": CANDIDATOS_OFICIALES_PUCUSANA,
  "punta hermosa": CANDIDATOS_OFICIALES_PUNTA_HERMOSA,
  "punta negra": CANDIDATOS_OFICIALES_PUNTA_NEGRA,
  "san bartolo": CANDIDATOS_OFICIALES_SAN_BARTOLO,
  "santa maria del mar": CANDIDATOS_OFICIALES_SANTA_MARIA_DEL_MAR,
  "el agustino": CANDIDATOS_OFICIALES_EL_AGUSTINO,
  "lima": CANDIDATOS_OFICIALES_LIMA_METROPOLITANA,
  "cercado de lima": CANDIDATOS_OFICIALES_LIMA_METROPOLITANA
};

export function obtenerListaCandidatosProvincial() {
  return CANDIDATOS_OFICIALES_LIMA_METROPOLITANA;
}

export function obtenerListaCandidatosDistrital(ubicacion) {
  const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const target = norm(ubicacion);

  if (LISTAS_DISTRITALES_OFICIALES[target]) {
    return LISTAS_DISTRITALES_OFICIALES[target];
  }

  for (const [distKey, list] of Object.entries(LISTAS_DISTRITALES_OFICIALES)) {
    if (target.includes(distKey) || distKey.includes(target)) {
      return list;
    }
  }

  // Fallback si no encuentra distrito: retorna lista completa de partidos con Somos Perú en primer lugar
  return buildDistrictList({
    "SOMOS PERU": "Candidato Somos Perú",
    "RENOVACION": "Candidato Renovación Popular",
    "AVANZA PAIS": "Candidato Avanza País",
    "PODEMOS": "Candidato Podemos Perú",
    "ACCION POPULAR": "Candidato Acción Popular",
    "PPC": "Candidato PPC"
  });
}

// Mapa rápido clave-candidato para compatibilidad
export const CANDIDATOS_MAP = {
  "Surquillo": {
    "SOMOS PERU": "Sandra Liz Gutiérrez Cuba",
    "ACCION POPULAR": "Phil Dempster Barriga Vásquez",
    "PRIN": "María Teresa Maestre Mejía",
    "RENOVACION": "Ruth Haydee Meza Saldarriaga",
    "PPC": "Renzo Jesús Gutiérrez Portillo",
    "AVANZA PAIS": "José Luis Huamaní Gonzales",
    "PAIS PARA TODOS": "Jessica Ofelia Barrera Mendoza",
    "AHORA NACION": "Dennis Alvarado Carrasco",
    "PODEMOS": "Miguel Ángel Ccamac Ortiz"
  },
  "Lima": {
    "SOMOS PERU": "Carlos Ricardo Bruce Montes de Oca",
    "RENOVACION": "Rafael López Aliaga",
    "AHORA NACION": "Susel Ana María Paredes Piqué",
    "AVANZA PAIS": "Francis James Allison Oyague",
    "PODEMOS": "Daniel Belizario Urresti Elera",
    "FP": "Samuel Marcos Daza Taype"
  },
  "Pueblo Libre": {
    "SOMOS PERU": "Jhonel Jorge Leguía Jamis",
    "RENOVACION": "Cecilia Acosta Cajaleon",
    "PODEMOS": "Daniel Martín Amaya Carranza",
    "MORADO": "Miguel Stefano Ruiz Gutiérrez",
    "ACCION POPULAR": "Carlos Enrique Arana Urteaga",
    "AVANZA PAIS": "José Luis Casas Carrión"
  },
  "San Isidro": {
    "SOMOS PERU": "Víctor Hugo Bazán Pastor",
    "ACCION POPULAR": "Carlomagno Chacón Gómez",
    "APP": "Zuleika Vannessa Benel Zevallos",
    "AVANZA PAIS": "César Augusto Combina Salvatierra",
    "RENOVACION": "Javier Paino",
    "PODEMOS": "Daniel Martín Amaya Carranza"
  },
  "San Juan de Lurigancho": {
    "SOMOS PERU": "Jesús Maldonado Amao",
    "PAIS PARA TODOS": "Miguel Oswaldo Huacre Méndez",
    "APP": "Juan Valentín Navarro Jiménez",
    "AVANZA PAIS": "Héctor Joaquín Alejandro Bustamante",
    "RENOVACION": "Américo Zegarra Acuña",
    "ACCION POPULAR": "Luis Gino Blanco Aldama",
    "PODEMOS": "José Luis Luna Morales"
  },
  "Miraflores": {
    "SOMOS PERU": "Alexander Enrique Von Ehren Campos",
    "AVANZA PAIS": "Jorge Vicente Martín Muñoz Wells",
    "MORADO": "Mario Renato Otiniano Buquich",
    "RENOVACION": "Amílcar Alessio Cantella Vega",
    "ACCION POPULAR": "Carlos Alcides Zúñiga Arce",
    "AHORA NACION": "Ricardo Enrique Giesecke Sara Lafosse"
  },
  "Santiago de Surco": {
    "SOMOS PERU": "Arturo Miguel Guillermo Bobbio Carranza",
    "RENOVACION": "Juan Alejandro Palma Aurazo",
    "MORADO": "Betty Fani Fernández Gallarday",
    "AHORA NACION": "José Manuel Fernández Chávez",
    "ACCION POPULAR": "Oswaldo Martín Moreno Rivera",
    "PODEMOS": "Ruth Candelaria Bisbal Oyague"
  },
  "Breña": {
    "SOMOS PERU": "Luis Ojeda",
    "RENOVACION": "Isabel Rodríguez",
    "PODEMOS": "Luis De la Mata",
    "AVANZA PAIS": "Iván Chang",
    "ACCION POPULAR": "Carlos Albertini",
    "JP": "Sandro Balvín"
  },
  "La Victoria": {
    "SOMOS PERU": "Alberto Fernando Moreno Mejía",
    "PERU PRIMERO": "Aldo Horacio Rosales Pacheco",
    "OBRAS": "Alejandro Nilo Pérez Moreno",
    "PPC": "César Rafael Ibarra Nureña",
    "PAIS PARA TODOS": "Florencio Froilán Fierro Flores",
    "APP": "Joaquín Reynaldo Albarracín Ramos",
    "AVANZA PAIS": "Joe Zanabria Soberón",
    "ACCION POPULAR": "Luis Álvaro Pletikosic Guzmán",
    "ESPERANZA": "María Teresa Rosas García",
    "PODEMOS": "Mesías Máximo Gonzales Sánchez",
    "AHORA NACION": "Nilda Esperanza Carranza Rodríguez",
    "RENOVACION": "Susana Liliana Saldaña Ramos",
    "BATALLA PERU": "Walter Ciro Pérez Noreña"
  }
};

export function obtenerCandidatosPorUbicacion(ubicacion) {
  const list = obtenerListaCandidatosDistrital(ubicacion);
  const obj = {};
  list.forEach(c => {
    obj[c.key] = c.candidato;
  });
  return obj;
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
  "Lurigancho": "Oswaldo Vargas (Juntos por el Perú)",
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
  "San Luis": "Ricardo Pérez Castro (Renovación Popular)",
  "San Martín de Porres": "Hernán Sifuentes Barca (Podemos Perú)",
  "San Miguel": "Eduardo Bless (Avanza País)",
  "Santa Anita": "Olimpio Alegría (Alianza para el Progreso)",
  "Santa María del Mar": "Hugo Monteverde (Acción Popular)",
  "Santa Rosa": "George Robles (Podemos Perú)",
  "Surquillo": "Cintia Loayza (Renovación Popular)",
  "Villa El Salvador": "Guido Iñigo Peralta (Alianza para el Progreso)",
  "Villa María del Triunfo": "Eloy Chávez Hernández (Alianza para el Progreso)"
};

export function obtenerAlcaldeActual(ubicacion) {
  const norm = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const target = norm(ubicacion);
  for (const [k, v] of Object.entries(ALCALDES_ACTUALES_MAP)) {
    if (norm(k) === target) return v;
  }
  return "No determinado";
}

export const PARTIDO_ID_MAP = {
  "SOMOS PERU": "sp",
  "RENOVACION": "rp",
  "AHORA NACION": "ahora-nacion",
  "AVANZA PAIS": "avanza",
  "PODEMOS": "podemos",
  "ACCION POPULAR": "ap",
  "PPC": "ppc",
  "APP": "app",
  "FP": "fp",
  "JP": "jp",
  "FREPAP": "frepap",
  "ESPERANZA": "esperanza",
  "MORADO": "morado",
  "APRA": "apra",
  "PRIN": "prin",
  "PAIS PARA TODOS": "pais-para-todos",
  "BUEN GOBIERNO": "buen-gobierno",
  "VERDE": "verde",
  "PERU LIBRE": "peru-libre",
  "PERU PRIMERO": "peru-primero",
  "PERU MODERNO": "peru-moderno",
  "LIBERTAD POPULAR": "libertad-popular",
  "PROGRESEMOS": "progresemos",
  "OBRAS": "obras",
  "VISION PERU": "vision",
  "FE EN EL PERU": "fe-en-el-peru",
  "UNIDAD Y PAZ": "unidad-y-paz",
  "BATALLA PERU": "batalla",
  "TIERRA VERDE": "tierra-verde",
  "PUEBLO CONSCIENTE": "pueblo-consciente",
  "PPP": "ppp",
  "INTEGRIDAD": "integridad",
  "FUERZA CIUDADANA": "fuerza-ciudadana",
  "SALVEMOS AL PERU": "salvemos-al-peru",
  "PTE PERU": "pte-peru",
  "ADP": "adp",
  "VENCEREMOS": "venceremos",
  "ALIANZA REGIONAL": "alianza-regional"
};

export const PARTIDO_NOMBRES_LARGOS = {
  "SOMOS PERU": "Somos Perú",
  "RENOVACION": "Renovación Popular",
  "AHORA NACION": "Ahora Nación",
  "AVANZA PAIS": "Avanza País",
  "PODEMOS": "Podemos Perú",
  "ACCION POPULAR": "Acción Popular",
  "PPC": "Partido Popular Cristiano (PPC)",
  "APP": "Alianza para el Progreso",
  "FP": "Fuerza Popular",
  "JP": "Juntos por el Perú",
  "FREPAP": "FREPAP",
  "ESPERANZA": "Frente de la Esperanza 2021",
  "MORADO": "Partido Morado",
  "APRA": "Partido Aprista Peruano",
  "PRIN": "Partido Político PRIN",
  "PAIS PARA TODOS": "Partido País para Todos",
  "BUEN GOBIERNO": "Partido del Buen Gobierno",
  "VERDE": "Partido Demócrata Verde",
  "PERU LIBRE": "Perú Libre",
  "PERU PRIMERO": "Partido Político Perú Primero",
  "PERU MODERNO": "Perú Moderno",
  "LIBERTAD POPULAR": "Libertad Popular",
  "PROGRESEMOS": "Progresemos",
  "OBRAS": "Partido Cívico Obras",
  "VISION PERU": "Visión Perú",
  "FE EN EL PERU": "Fe en el Perú",
  "UNIDAD Y PAZ": "Partido Unidad y Paz",
  "BATALLA PERU": "Batalla Perú",
  "TIERRA VERDE": "Coalición Transformadora Tierra Verde",
  "PUEBLO CONSCIENTE": "Pueblo Consciente",
  "PPP": "Partido Patriótico del Perú",
  "INTEGRIDAD": "Integridad Democrática",
  "FUERZA CIUDADANA": "Fuerza Ciudadana",
  "SALVEMOS AL PERU": "Salvemos al Perú",
  "PTE PERU": "Partido de los Trabajadores y Emprendedores (PTE)",
  "ADP": "Partido Político ADP / Adelante Perú",
  "VENCEREMOS": "Alianza Electoral Venceremos",
  "ALIANZA REGIONAL": "Alianza Regional por el Perú"
};

export function obtenerPartidoDeCandidato(name, ubicacion) {
  if (!name) return null;
  const cleanName = name.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();

  // 1. Buscar en listas distritales si se proporciona ubicación
  if (ubicacion) {
    const listDist = obtenerListaCandidatosDistrital(ubicacion);
    for (const c of listDist) {
      if (c.key && c.candidato) {
        const cleanCand = c.candidato.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
        if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
          return c.key;
        }
      }
    }
  }

  // 2. Buscar en lista provincial
  for (const c of CANDIDATOS_OFICIALES_LIMA_METROPOLITANA) {
    if (c.key && c.candidato) {
      const cleanCand = c.candidato.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
      if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
        return c.key;
      }
    }
  }

  // 3. Buscar en todas las listas distritales
  for (const list of Object.values(LISTAS_DISTRITALES_OFICIALES)) {
    for (const c of list) {
      if (c.key && c.candidato) {
        const cleanCand = c.candidato.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-_]+/g, '').trim();
        if (cleanCand && (cleanName.includes(cleanCand) || cleanCand.includes(cleanName))) {
          return c.key;
        }
      }
    }
  }

  return null;
}

export function obtenerNombreRealPartido(name, currentDistrict) {
  if (!name) return null;
  
  const district = currentDistrict || 'SURQUILLO';
  
  const partyFromCandidate = obtenerPartidoDeCandidato(name, district);
  if (partyFromCandidate) {
    return partyFromCandidate;
  }

  const clean = name.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Coincidencias específicas
  if (clean.includes('SOMOS') || clean.includes('SP') || clean.includes('CORAZON') || clean.includes('CORAZÓN')) return 'SOMOS PERU';
  if (clean.includes('PRIN')) return 'PRIN';
  if (clean.includes('PAIS PARA TODOS') || clean.includes('PAÍS PARA TODOS') || clean.includes('PPT')) return 'PAIS PARA TODOS';
  if (clean.includes('PERU PRIMERO') || clean.includes('PERÚ PRIMERO')) return 'PERU PRIMERO';
  if (clean.includes('LIBERTAD POPULAR')) return 'LIBERTAD POPULAR';
  if (clean.includes('FE EN EL PERU') || clean.includes('FE EN EL PERÚ')) return 'FE EN EL PERU';
  if (clean.includes('UNIDAD Y PAZ')) return 'UNIDAD Y PAZ';
  if (clean.includes('SALVEMOS AL PERU') || clean.includes('SALVEMOS AL PERÚ')) return 'SALVEMOS AL PERU';

  for (const [partyKey, longName] of Object.entries(PARTIDO_NOMBRES_LARGOS)) {
    const cleanLongName = longName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (cleanLongName && (clean.includes(cleanLongName) || cleanLongName.includes(clean))) {
      return partyKey;
    }
  }

  const sortedParties = Object.keys(PARTIDO_ID_MAP).sort((a, b) => b.length - a.length);
  for (const partyKey of sortedParties) {
    const cleanPartyKey = partyKey.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (cleanPartyKey && (clean.includes(cleanPartyKey) || cleanPartyKey.includes(clean))) {
      return partyKey;
    }
  }

  return null;
}
