import pg from 'pg';
const { Pool } = pg;

// Conexión directa a Neon PostgreSQL
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_SERVER || 'ep-super-silence-axywhu8v-pooler.c-4.us-east-2.aws.neon.tech',
      user: process.env.DB_USER || 'neondb_owner',
      password: process.env.DB_PASSWORD || 'npg_b5gvlBUs0NSe',
      database: process.env.DB_NAME || 'neondb',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000
    });
  }
  return pool;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let payload = {};
  if (req.method === 'GET') {
    payload = { ...req.query };
  } else if (req.method === 'POST') {
    if (req.body && typeof req.body === 'object') {
      payload = req.body;
    } else if (typeof req.body === 'string' && req.body.trim()) {
      try {
        payload = JSON.parse(req.body);
      } catch (e) {
        payload = { ...req.query };
      }
    } else {
      payload = { ...req.query };
    }
  }

  const action = payload.action;
  if (!action) {
    return res.status(200).json({ success: false, message: 'No se especificó ninguna acción' });
  }

  const db = getPool();

  try {
    switch (action) {
      // 1. LOGIN
      case 'login': {
        const identifier = (payload.usuario || payload.dni || payload.user || '').toString().trim();
        if (!identifier) {
          return res.status(200).json({ success: false, status: 'error', message: 'Por favor ingresa tu DNI.' });
        }

        // Admin check
        if (identifier === 'Admin#2026$Secure!VotoReal' || identifier === '99999999') {
          return res.status(200).json({
            success: true,
            status: 'success',
            role: 'Admin',
            token: 'TOKEN-ADMIN-2026',
            user: { dni: identifier, nombre: 'Super Administrador', rol: 'Admin', ubicacion: 'Lima', colegio: 'CENTRAL', mesa: '' }
          });
        }

        const userRes = await db.query('SELECT * FROM usuarios WHERE TRIM(dni) = $1 LIMIT 1', [identifier]);
        if (userRes.rows.length > 0) {
          const u = userRes.rows[0];
          // Verificar si ya envió votos
          const votoManualRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'MANUAL\' LIMIT 1', [identifier]);
          const votoImagenRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'IMAGEN\' LIMIT 1', [identifier]);

          return res.status(200).json({
            success: true,
            status: 'success',
            role: u.rol || 'Personero',
            token: `TOKEN-${u.dni}`,
            user: {
              ...u,
              voto_manual_enviado: votoManualRes.rows.length > 0,
              voto_imagen_enviado: votoImagenRes.rows.length > 0
            }
          });
        }

        // Buscar en rpersoneros
        const rpersRes = await db.query('SELECT * FROM rpersoneros WHERE TRIM(dni) = $1 LIMIT 1', [identifier]);
        if (rpersRes.rows.length > 0) {
          const rp = rpersRes.rows[0];
          const votoManualRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'MANUAL\' LIMIT 1', [identifier]);
          const votoImagenRes = await db.query('SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = \'IMAGEN\' LIMIT 1', [identifier]);

          return res.status(200).json({
            success: true,
            status: 'success',
            role: 'Personero',
            token: `TOKEN-${rp.dni}`,
            user: {
              dni: rp.dni,
              nombre: rp.nombres_y_apellidos,
              rol: 'Personero',
              ubicacion: rp.distrito_asignado || rp.distrito_donde_vota || 'Lima',
              colegio: rp.local_de_votacion_asignado || rp.local_de_votacion || '',
              mesa: rp.mesa_asignada || rp.mesa_de_sufragio || '',
              voto_manual_enviado: votoManualRes.rows.length > 0,
              voto_imagen_enviado: votoImagenRes.rows.length > 0
            }
          });
        }

        return res.status(200).json({
          success: false,
          status: 'error',
          message: 'DNI no encontrado en el padrón oficial.'
        });
      }

      // 2. REGISTRAR VOTOS
      case 'registrar_votos': {
        const dni = (payload.dni || '').toString().trim();
        const personero = (payload.brigadista || payload.personero || payload.nombre || '').toString().trim();
        const departamento = payload.departamento || 'Lima';
        const provincia = payload.provincia || 'Lima';
        const ubicacion = payload.ubicacion || payload.distrito || 'Lima';
        const colegio = payload.colegio || payload.local || '';
        const numero_mesa = (payload.mesa || payload.numero_mesa || '').toString().trim();
        const origen = (payload.origen || 'MANUAL').toString().trim().toUpperCase();

        const prov = payload.votos ? (payload.votos.provincial || {}) : {};
        const dist = payload.votos ? (payload.votos.distrital || {}) : {};

        const extractVote = (item) => {
          if (item === undefined || item === null) return 0;
          if (typeof item === 'object') return parseInt(item.votos ?? item.val ?? item.value ?? 0, 10) || 0;
          return parseInt(item, 10) || 0;
        };

        const CANDIDATOS_PROVINCIAL = {
          "SOMOS PERU": "Carlos Ricardo Bruce Montes de Oca",
          "RENOVACION": "Rafael López Aliaga",
          "AHORA NACION": "Susel Ana María Paredes Piqué",
          "AVANZA PAIS": "Francis James Allison Oyague",
          "PODEMOS": "Daniel Belizario Urresti Elera",
          "JP": "Oswaldo Hernán Vargas Cuellar",
          "OBRAS": "Ricardo Pablo Belmont Cassinelli",
          "FREPAP": "Segundo Valdez Zavala",
          "ACCION POPULAR": "Carlos Alberto Tejada Noriega",
          "ESPERANZA": "Elizabeth María del Rosario León Chinchay",
          "VENCEREMOS": "Juan Carlos Alvarado Mestanza",
          "VISION PERU": "Santiago Rosendo Abarca León",
          "APRA": "Mónica Yadira Yaya Luyo",
          "FP": "Samuel Marcos Daza Taype",
          "PPC": "Edgardo Renán de Pomar Vizcarra",
          "PROGRESEMOS": "Luis Miguel Llanos Carrillo",
          "MORADO": "Victoria Betzabé La Cruz Garcés",
          "BUEN GOBIERNO": "Carlos Francisco Gallardo Neyra",
          "VERDE": "Flor de María Hurtado Valdez",
          "PERU LIBRE": "Rubén José Ramírez Mateo",
          "TIERRA VERDE": "Yehude Simon Munaro",
          "PUEBLO CONSCIENTE": "Luis Alberto Huette Tolentino",
          "PPP": "Sandro Caller Gutiérrez",
          "INTEGRIDAD": "Jessica Viviana Linares Romero",
          "FUERZA CIUDADANA": "Rubén Daniel Bonilla Espinoza",
          "BATALLA PERU": "Samir Frank Quispe Caballero"
        };

        const CANDIDATOS_DISTRITALES = {
          "SURQUILLO": {
            "ACCION POPULAR": "Phil Dempster Barriga Vásquez", "PRIN": "María Teresa Maestre Mejía", "RENOVACION": "Ruth Haydee Meza Saldarriaga", "PPC": "Renzo Jesús Gutiérrez Portillo", "AVANZA PAIS": "José Luis Huamaní Gonzales", "PAIS PARA TODOS": "Jessica Ofelia Barrera Mendoza", "AHORA NACION": "Dennis Alvarado Carrasco", "SOMOS PERU": "Sandra Liz Gutiérrez Cuba", "PODEMOS": "Miguel Ángel Ccamac Ortiz", "APP": "Jorge Luis Huamán", "FP": "Carlos Eduardo Mendoza", "JP": "María Elena Castillo", "MORADO": "Luis Alberto Morales", "ESPERANZA": "Patricia Salazar", "APRA": "Víctor Manuel Rojas"
          },
          "MIRAFLORES": {
            "AVANZA PAIS": "Jorge Vicente Martín Muñoz Wells", "SOMOS PERU": "Alexander Enrique Von Ehren Campos", "MORADO": "Mario Renato Otiniano Buquich", "RENOVACION": "Amílcar Alessio Cantella Vega", "PPC": "María Soledad Ferreyros Castañeda", "ACCION POPULAR": "Carlos Alcides Zúñiga Arce", "AHORA NACION": "Ricardo Enrique Giesecke Sara Lafosse", "LIBERTAD POPULAR": "Daniel Rodríguez Zanabria", "BUEN GOBIERNO": "José Ricardo Portugal Quiroz", "PODEMOS": "Ernesto Blumen", "FP": "Rocío Andrade", "APP": "Manuel Masías Oyanguren"
          },
          "SANTIAGO DE SURCO": {
            "RENOVACION": "Juan Alejandro Palma Aurazo", "SOMOS PERU": "Arturo Miguel Guillermo Bobbio Carranza", "MORADO": "Betty Fani Fernández Gallarday", "AHORA NACION": "José Manuel Fernández Chávez", "PROGRESEMOS": "Oscar Mario Aco Miranda", "PPC": "David Ignacio Vera Trujillo", "UNIDAD Y PAZ": "Hugo Roberto Encalada Chumbile", "APP": "Jean Pierre Combe Portocarrero", "ACCION POPULAR": "Oswaldo Martín Moreno Rivera", "PAIS PARA TODOS": "José Carlos Bolívar Mejía", "PODEMOS": "Ruth Candelaria Bisbal Oyague", "AVANZA PAIS": "Carlos Bruce", "FP": "Juan Manuel del Mar"
          },
          "SAN BORJA": {
            "SOMOS PERU": "Gina Valeria Casanova Mera", "AVANZA PAIS": "Roberth Edwuard Montoya Puente", "LIBERTAD POPULAR": "Edgard Núñez Quipuzco", "ACCION POPULAR": "Alberto Tejada Conroy", "RENOVACION": "Javier Martín Diez Gaspard", "ADP": "Joel Edmundo Miranda Villanueva", "APRA": "Juan Fernando Pilco Castañeda", "PPC": "Willyans José Soriano Cabrera", "PODEMOS": "Marco Antonio Álvarez", "FP": "María Luisa Morales", "APP": "Carlos Alberto Ramos"
          },
          "SAN ISIDRO": {
            "SOMOS PERU": "Víctor Hugo Bazán Pastor", "ACCION POPULAR": "Carlomagno Chacón Gómez", "APP": "Zuleika Vannessa Benel Zevallos", "AVANZA PAIS": "César Augusto Combina Salvatierra", "RENOVACION": "Javier Paino", "VISION PERU": "Walter Alfonso Cavero Villanes", "PODEMOS": "Daniel Martín Amaya Carranza", "PPC": "Fidel Bratzo García Durante", "FP": "Javier Cipriani", "MORADO": "Martín Bustamante"
          },
          "PUEBLO LIBRE": {
            "SOMOS PERU": "Jhonel Jorge Leguía Jamis", "RENOVACION": "Cecilia Acosta Cajaleon", "PODEMOS": "Daniel Martín Amaya Carranza", "MORADO": "Miguel Stefano Ruiz Gutiérrez", "ACCION POPULAR": "Carlos Enrique Arana Urteaga", "VISION PERU": "Walter Alfonso Cavero Villanes", "AVANZA PAIS": "José Luis Casas Carrión", "APRA": "Josmell Absalón Muñoz Barranzuela", "ESPERANZA": "Fabiola Lucero Silva Montero", "ALIANZA REGIONAL": "Hilgo Antonio Manchego Ormeño", "AHORA NACION": "Oscar Raúl Cabello Acosta", "PPC": "Fidel Bratzo García Durante"
          },
          "SAN JUAN DE LURIGANCHO": {
            "SOMOS PERU": "Jesús Maldonado Amao", "PAIS PARA TODOS": "Miguel Oswaldo Huacre Méndez", "BUEN GOBIERNO": "Carlos Jaime De La Torre Mendoza", "APP": "Juan Valentín Navarro Jiménez", "AVANZA PAIS": "Héctor Joaquín Alejandro Bustamante", "RENOVACION": "Américo Zegarra Acuña", "VERDE": "Alex Gonzales Castillo", "AHORA NACION": "Elsa Virginia Alarcón Suárez", "OBRAS": "Edwin Mejía Cerdán", "ACCION POPULAR": "Luis Gino Blanco Aldama", "PODEMOS": "José Luis Luna Morales", "FP": "Manuel Angulo", "MORADO": "Brenda Ortiz"
          },
          "ATE": {
            "SOMOS PERU": "Simón Ortiz Talaverano", "PODEMOS": "Edde Cuellar Alegría", "AVANZA PAIS": "Manuel Gaudencio Vidal Camargo", "MORADO": "Jorge Antonio Salazar Velásquez", "PPC": "José Luis Hurtado Apaico", "PERU PRIMERO": "Joel José Núñez Mendoza", "RENOVACION": "Elizabeth Nancy Cabezas Flores", "FREPAP": "Misael Meneses Flores", "AHORA NACION": "Luis Eusebio Poma Tacuri", "ACCION POPULAR": "Arturo Jonell Peña Sánchez", "APP": "Franco Vidal Morales"
          },
          "COMAS": {
            "SOMOS PERU": "Ana Yuriko Niño de Guzmán Tengan", "AVANZA PAIS": "Raúl Díaz Pérez", "PODEMOS": "Carmen Mónica Acuña Jara", "RENOVACION": "Jean Pool Granados Lazo", "PERU MODERNO": "Nerio Wilson Sánchez Quiroz", "PTE PERU": "Javier Sósimo Carrasco Condori", "PPC": "Juan Carlos Condori Chávez", "AHORA NACION": "César Augusto Cosiche Tenorio", "ACCION POPULAR": "Pierre Orlando Apian Castillo", "FP": "Samuel Horacio Guerrero Castillo", "APP": "Roxana Marylia Ari Acuña", "MORADO": "Josmell Max Peralta Peña"
          },
          "LOS OLIVOS": {
            "SOMOS PERU": "Erick Melchor Torres", "RENOVACION": "Luis Sigfredo Milla Soto", "ACCION POPULAR": "Franco Enrique Cortez Gutiérrez", "JP": "Heidelberger Willians Davis Suyon Díaz", "PROGRESEMOS": "Segundo Marcos De La Cruz Vega", "OBRAS": "Wilder Leoncio Torpoco Huayta", "AVANZA PAIS": "Felipe Baldomero Castillo Alfaro", "PERU LIBRE": "María Rosario Silvestre Vílchez", "LIBERTAD POPULAR": "Ángel Solís Vergaray", "PODEMOS": "Luis Felipe Castillo Oliva", "APP": "Pedro Del Rosario"
          },
          "SAN MARTIN DE PORRES": {
            "SOMOS PERU": "Luis Paul Cárdenas Sánchez", "APRA": "Luis César Navarro Maldonado", "PERU PRIMERO": "Víctor Vicente Santander Salvador", "AHORA NACION": "Aquiles Cirilo Collasos Villanueva", "MORADO": "Luis Alberto Flores Roldán", "PROGRESEMOS": "Anndy Miguel Durán Núñez", "RENOVACION": "Peter Omar Jaime Cori", "VERDE": "Carlos Alberto Albújar Corazón", "FE EN EL PERU": "César Augusto Vargas Gutiérrez", "AVANZA PAIS": "Adolfo Israel Mattos Piaggio", "ACCION POPULAR": "Julio Abraham Chávez Chiong", "PODEMOS": "Diego Armando López Jara", "APP": "Hernán Sifuentes Barca"
          },
          "LA MOLINA": {
            "SOMOS PERU": "Juan Carlos Martín Zurek Pardo Figueroa", "AVANZA PAIS": "Sergio Joan Castromonte Chaparro", "APP": "María Perla Espinoza Aquino", "FE EN EL PERU": "María-Pía Paz de la Barra Freigeiro", "VISION PERU": "Edwin Aníbal Mendoza Ramírez", "RENOVACION": "Lizzi del Rocío Sueldo Matos", "ACCION POPULAR": "Edmundo del Águila Herrera", "ADP": "Julio Adolfo Tovar Uribe", "AHORA NACION": "Flor de María Tadeo Romero", "PROGRESEMOS": "José Miguel Rodríguez Tasayco", "PODEMOS": "Cristopher Eldin Clemente Pérez", "PPC": "Meisy Blanca Rosa Núñez Ruiz"
          },
          "JESUS MARIA": {
            "SOMOS PERU": "Luiz Carlos Reátegui del Águila", "ACCION POPULAR": "Jorge Luis Quintana García Godos", "AHORA NACION": "Raphael Christian Valencia Diestra", "AVANZA PAIS": "Luis Enrique Ocrospoma Pella", "RENOVACION": "Daniel Ricardo Li León", "APP": "Renato Aldo Rossini Valenzuela", "ESPERANZA": "María del Pilar Albarracín Valverde", "APRA": "María Luisa Lanatta Pino", "FP": "Roberto Antonio Aymar Silva", "PODEMOS": "Ernesto Enrique Delhonte Cagna", "PPC": "Julissa Rocío Fernández Fernández", "OBRAS": "José Luis Herrera Urueta"
          },
          "LINCE": {
            "SOMOS PERU": "José Antonio Aliaga Pajares", "AHORA NACION": "Nidia Alegría Herrera", "PODEMOS": "Luis Miguel Alonzo Ramírez", "PERU PRIMERO": "Arturo Ronald Bejarano Gurmendi", "PAIS PARA TODOS": "Miguel Ángel Espinoza Saavedra", "AVANZA PAIS": "Luis Ernesto Flores Reátegui", "FP": "Otilia Merino García", "ACCION POPULAR": "Víctor Manuel Noriega Salazar", "RENOVACION": "Mirtha Sebastiana Uribe Soriano", "APRA": "Yvan Alexis Villavicencio Alvildo", "PPC": "Eduardo Danilo Albarracín Ugarte", "APP": "Malca Schaiderman"
          },
          "MAGDALENA DEL MAR": {
            "SOMOS PERU": "Alberto Sánchez Aizcorbe Carranza", "RENOVACION": "Víctor Raúl Paulini Sánchez", "APP": "Johan Fritz Chávez Sifuentes", "AVANZA PAIS": "Carla Robbiano Montes de Allison", "ACCION POPULAR": "Diego Fernando Uceda Guerra-García", "PODEMOS": "Carlos Alfonso Gómez de la Torre", "PPC": "Javier Eduardo Ismodes", "FP": "Raúl Madueño", "MORADO": "Carmen Rosa López"
          },
          "SAN MIGUEL": {
            "SOMOS PERU": "Carolina Mannucci Arámbulo", "ACCION POPULAR": "Juan José Guevara Bonilla", "APRA": "Santiago Nicolás Barreda Arias", "PROGRESEMOS": "Napoleón Roberto Martínez Merizalde Huatuco", "RENOVACION": "Marcos Enrique Cabrera Porras", "BUEN GOBIERNO": "Michael Alberto Paredes Torres", "PERU MODERNO": "Jorge Luis Moreno Morán", "AVANZA PAIS": "Eduardo Bless Cabrejas", "PODEMOS": "Salvador Heresi Chicoma", "APP": "Ángel Romero"
          },
          "CHORRILLOS": {
            "SOMOS PERU": "Ricardo Vásquez", "APP": "Henry Herrera", "ACCION POPULAR": "Luis Jiménez", "PROGRESEMOS": "Dionisio Navarro", "AVANZA PAIS": "Richard Cortez", "MORADO": "Kruger Vidal", "RENOVACION": "Roberto Pizarro", "FP": "María Neyra", "PODEMOS": "Jorge Guzmán", "FE EN EL PERU": "Ricardo Bejarano", "PPC": "Fernando Velasco Huamán"
          },
          "BARRANCO": {
            "SOMOS PERU": "Felipe Mezarina Tong", "PPC": "Jorge Ruiz de Somocurcio", "ACCION POPULAR": "María Luisa Cardoso", "PROGRESEMOS": "Nicole Muñoz", "LIBERTAD POPULAR": "José Rodríguez Cárdenas", "MORADO": "Enrique Delucchi", "RENOVACION": "Manuel Espinoza", "AVANZA PAIS": "Angélica Noguerol", "PODEMOS": "Jessica Vargas Gómez", "APP": "Gonzalo Rodríguez"
          },
          "BREÑA": {
            "SOMOS PERU": "Luis Ojeda", "LIBERTAD POPULAR": "Jorge Sarmiento", "UNIDAD Y PAZ": "Diana León", "RENOVACION": "Isabel Rodríguez", "PUEBLO CONSCIENTE": "Haydy Breña", "PODEMOS": "Luis De la Mata", "PERU PRIMERO": "Arturo Maura", "AVANZA PAIS": "Iván Chang", "ACCION POPULAR": "Carlos Albertini", "JP": "Sandro Balvín", "APP": "Gílmer García"
          },
          "RIMAC": {
            "SOMOS PERU": "Pedro Morales", "ACCION POPULAR": "Javier Revilla", "AVANZA PAIS": "Enrique Peramás", "BUEN GOBIERNO": "Roberto Telles", "AHORA NACION": "Jonathan Seña", "ESPERANZA": "Jérico Mosquera", "RENOVACION": "Isabel Ayala", "PRIN": "Antonio Cocha", "PPC": "Efigenia Arnao", "APRA": "Felicidad Salhuana", "PODEMOS": "Néstor de la Rosa Villegas", "FP": "Walter Salinas"
          },
          "LA VICTORIA": {
            "SOMOS PERU": "Alberto Fernando Moreno Mejía", "PERU PRIMERO": "Aldo Horacio Rosales Pacheco", "OBRAS": "Alejandro Nilo Pérez Moreno", "PPC": "César Rafael Ibarra Nureña", "PAIS PARA TODOS": "Florencio Froilán Fierro Flores", "APP": "Joaquín Reynaldo Albarracín Ramos", "AVANZA PAIS": "Joe Zanabria Soberón", "ACCION POPULAR": "Luis Álvaro Pletikosic Guzmán", "ESPERANZA": "María Teresa Rosas García", "PODEMOS": "Mesías Máximo Gonzales Sánchez", "AHORA NACION": "Nilda Esperanza Carranza Rodríguez", "RENOVACION": "Susana Liliana Saldaña Ramos", "BATALLA PERU": "Walter Ciro Pérez Noreña"
          },
          "VILLA EL SALVADOR": {
            "SOMOS PERU": "Clodoaldo Kevin Yñigo Peralta", "RENOVACION": "Alberto Luis Peralta Huatuco", "ACCION POPULAR": "José Luis Flores Llauca", "APP": "Marcelino Huamán Cano", "FP": "Ricardo Gil Espadín", "OBRAS": "Nils René Antonio Siccos", "PERU PRIMERO": "Milton Tomás Lluque Sosa", "MORADO": "Migman Pinchi Caro", "BUEN GOBIERNO": "Yolanda Inés Peña Valdivia", "PODEMOS": "Guido Iñigo Peralta", "AVANZA PAIS": "Santiago Mozo"
          },
          "VILLA MARIA DEL TRIUNFO": {
            "SOMOS PERU": "Guido Iñigo Peralta", "JP": "René Alfredo Yucra Verástegui", "PPC": "Cresencio Gonzales Ccapcha", "PAIS PARA TODOS": "Juan Carlos Medina Morillo", "SALVEMOS AL PERU": "Magaly Rosy Copez Gutiérrez", "AVANZA PAIS": "David Andrés Morales Cárdenas", "RENOVACION": "Robert Joel Ludeña Guerra", "PODEMOS": "Carlos Francisco Hinostroza Rodríguez", "APP": "Eloy Chávez Hernández", "ACCION POPULAR": "Washington Ipenza"
          },
          "SAN JUAN DE MIRAFLORES": {
            "SOMOS PERU": "Daniel Castro Pichihua", "VISION PERU": "Andy Alan Vilca Huamán", "AHORA NACION": "Olis Yaranga Jacinto", "APP": "Luis Dante Mendieta Flores", "PERU PRIMERO": "Michel Melchor Sanabria Ruiz", "ESPERANZA": "Edgar Wuillington Mejía Rodríguez", "RENOVACION": "Mabel Karina Leandro Melgarejo", "FP": "Anatoly Renán Bedriñana Córdova", "PODEMOS": "Martín José Palomino Córdova", "PRIN": "Edilberto Lucio Quispe Rodríguez", "AVANZA PAIS": "Javier Altamirano"
          },
          "CARABAYLLO": {
            "SOMOS PERU": "Rosario Peláez Ramírez", "APP": "Juan Ladislao Espinoza Ortiz", "JP": "Juan Carlos Huayanay Mormontoy", "ACCION POPULAR": "Carlos Faustino Núñez Calderón", "OBRAS": "Alejandro Hipólito Ramos Rivera", "RENOVACION": "Nandy Janeth Córdova Morales", "PRIN": "Renso Evert Aguilar Velarde", "PPC": "Dennis Antonio Huapaya Bravo", "PERU PRIMERO": "Claudio Rodríguez Mansilla", "AHORA NACION": "Ignacio Jorge Sebastián Távara Arroyo", "FP": "Bélica Julia Bravo Alcántara", "FREPAP": "Héctor Manuel Cochón Barrientos", "PODEMOS": "Wilmer Roberto Valverde Valverde", "AVANZA PAIS": "Joe Peter Robles Escobedo", "PAIS PARA TODOS": "Pablo Alejandro González Villanueva"
          },
          "PUENTE PIEDRA": {
            "SOMOS PERU": "Rennán Santiago Espinoza Venegas", "PODEMOS": "Fernando Guillermo Agurto Montesinos", "ACCION POPULAR": "Juan Carlos Merino Huamán", "AVANZA PAIS": "Milton Fernando Jiménez Salazar", "APP": "Judith Marisol Ramírez Rodríguez", "RENOVACION": "Esteban Felizardo Monzón Fernández", "PPC": "Carlos Enrique Mendoza", "FP": "Maritza Elizabeth Vargas", "AHORA NACION": "Pedro Huertas", "MORADO": "Luis Alberto Díaz"
          },
          "SANTA ANITA": {
            "SOMOS PERU": "José Luis Nole Palomino", "RENOVACION": "Antero Maurine Pickmans Arenaza", "ACCION POPULAR": "Flora Maribel Fernández Rengifo", "PERU PRIMERO": "Manuel Edgardo Mamani Rodríguez", "AVANZA PAIS": "Eduardo Rímachi Martínez", "PODEMOS": "Leonor Chumbimune Cajahuaringa", "APP": "Olimpio Alegría Calderón", "FP": "Carlos Martínez", "PPC": "Hugo Ramos"
          },
          "INDEPENDENCIA": {
            "SOMOS PERU": "Alfredo Reynaga Ramírez", "PODEMOS": "Gregorio Bernardino Quispe Alvino", "PERU PRIMERO": "Sandra Gutiérrez Aibar", "RENOVACION": "Benigno Calderón", "AVANZA PAIS": "Víctor Yuri Vílchez", "ACCION POPULAR": "Raúl Díaz", "APP": "Evans Sifuentes", "FP": "Yuri Pando", "PPC": "Carmen Rosa Ortiz"
          },
          "SAN LUIS": {
            "SOMOS PERU": "David Rojas Maza", "RENOVACION": "Ricardo Pérez Castro", "ACCION POPULAR": "Christian Pardo", "AVANZA PAIS": "Zee Carlos Corrales", "PODEMOS": "Ronald Fuentes", "PPC": "Marilú Zevallos", "APP": "Víctor Alegría", "FP": "Jorge Morante"
          },
          "CHACLACAYO": {
            "SOMOS PERU": "Manuel Campos Sologuren", "RENOVACION": "Sergio Antonio Baigorria Seas", "AVANZA PAIS": "Leonidas Altamirano", "ACCION POPULAR": "Luis Bueno Quino", "PODEMOS": "Vilma Coronado", "APP": "Javier Huamaní", "FP": "Carlos Rossi", "PPC": "Enrique Palomino"
          },
          "LURIGANCHO": {
            "SOMOS PERU": "Víctor Castillo Sánchez", "JP": "Oswaldo Hernán Vargas Cuellar", "PODEMOS": "Hugo Pariona", "RENOVACION": "Raúl Porturas", "AVANZA PAIS": "Carlos Rivera", "ACCION POPULAR": "Fernando Morales", "APP": "Luis Gonzales", "FP": "David Palacios", "PPC": "Santos Quispe"
          },
          "LURIN": {
            "SOMOS PERU": "Rosa Torrejón", "APP": "Juan Raúl Marticorena Cuba", "RENOVACION": "José Arakaki", "AVANZA PAIS": "Francisco Silva", "PODEMOS": "Luis Chumpitaz", "ACCION POPULAR": "Víctor Palacios", "FP": "Jorge Arroyo", "PPC": "Manuel Delgado"
          },
          "PACHACAMAC": {
            "SOMOS PERU": "Hugo Ramos Lescano", "APP": "Enrique Valentín Cabrera Sulca", "RENOVACION": "Shirley Susan Ramos", "PODEMOS": "Marcos Antonio", "AVANZA PAIS": "Guillermo Panta", "ACCION POPULAR": "César Mendoza", "FP": "Elena Carrión"
          },
          "CIENEGUILLA": {
            "SOMOS PERU": "Edwin Subilete", "PODEMOS": "Emilio Chávez Huaringa", "RENOVACION": "Manuel Lara", "AVANZA PAIS": "Mirtha Hualpa", "APP": "Carlos Sandoval", "ACCION POPULAR": "Pedro Vargas"
          },
          "ANCON": {
            "SOMOS PERU": "John Barrera Cavassa", "PODEMOS": "Samuel Marcos Daza Taype", "RENOVACION": "Felipe Arakaki Shapiama", "AVANZA PAIS": "Carlos Morales", "ACCION POPULAR": "David Gómez", "APP": "Pedro Salcedo", "FP": "María Elena López"
          },
          "SANTA ROSA": {
            "SOMOS PERU": "Alan Carrasco Bobadilla", "PODEMOS": "George Robles Soto", "RENOVACION": "Raúl Poma", "AVANZA PAIS": "Luis García", "ACCION POPULAR": "Mario Huamán", "APP": "Jorge Chávez"
          },
          "PUCUSANA": {
            "SOMOS PERU": "Juan José Cuya Espinoza", "RENOVACION": "Lidia Carrillo", "AVANZA PAIS": "Carlos Chauca", "PODEMOS": "Enrique Delgado", "APP": "Pedro Rivas", "ACCION POPULAR": "Julio Quispe"
          },
          "PUNTA HERMOSA": {
            "SOMOS PERU": "Jorge Olaechea", "AVANZA PAIS": "Carlos Guillermo Fernández Otero", "RENOVACION": "Guillermo Samaniego", "PPC": "Richard Vega", "PODEMOS": "Víctor Castillo", "ACCION POPULAR": "Luis Paredes"
          },
          "PUNTA NEGRA": {
            "SOMOS PERU": "José Delgado", "APP": "Eulogio Huayhua Huayhua", "AVANZA PAIS": "Víctor Saman", "RENOVACION": "Julia Ramos", "PODEMOS": "Carlos Valdivia", "ACCION POPULAR": "Jorge Silva"
          },
          "SAN BARTOLO": {
            "SOMOS PERU": "Jorge Luis Infante", "AVANZA PAIS": "August Carbajal Schumacher", "RENOVACION": "Martha Valdivia", "PODEMOS": "Elliott Ramos", "APP": "Carlos Mendoza", "ACCION POPULAR": "Raúl Sánchez"
          },
          "SANTA MARIA DEL MAR": {
            "SOMOS PERU": "Jhair Medina", "ACCION POPULAR": "Hugo Alberto Monteverde Cerrutti", "AVANZA PAIS": "Alberto Hurtado", "RENOVACION": "Susana Vidal", "PODEMOS": "Manuel Rojas", "APP": "Fernando Gálvez"
          },
          "EL AGUSTINO": {
            "SOMOS PERU": "Jorge García", "PODEMOS": "Richard Robert Soria Fuerte", "APP": "Víctor Salcedo", "RENOVACION": "Carlos Ramos", "AVANZA PAIS": "Carmen Rosa Morales", "ACCION POPULAR": "Manuel Zapata", "FP": "Víctor Alva"
          }
        };

        const normalizeStr = (s) => (s || '').toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        function normalizeDistrict(dist) {
          const norm = normalizeStr(dist);
          if (norm.includes('VILLA MARIA') || norm.includes('VMT')) return 'VILLA MARIA DEL TRIUNFO';
          if (norm.includes('SAN JUAN DE LURIGANCHO') || norm === 'SJL') return 'SAN JUAN DE LURIGANCHO';
          if (norm.includes('SAN JUAN DE MIRAFLORES') || norm === 'SJM') return 'SAN JUAN DE MIRAFLORES';
          if (norm.includes('SAN MARTIN DE PORRES') || norm === 'SMP') return 'SAN MARTIN DE PORRES';
          if (norm.includes('VILLA EL SALVADOR') || norm === 'VES') return 'VILLA EL SALVADOR';
          if (norm.includes('MAGDALENA')) return 'MAGDALENA DEL MAR';
          if (norm.includes('SANTIAGO DE SURCO') || norm === 'SURCO') return 'SANTIAGO DE SURCO';
          if (norm.includes('CHOSICA') || norm.includes('LURIGANCHO')) return 'LURIGANCHO';
          if (norm.includes('BRENA') || norm.includes('BREÑA')) return 'BREÑA';
          if (norm.includes('RIMAC') || norm.includes('RÍMAC')) return 'RIMAC';
          if (norm.includes('JESUS MARIA') || norm.includes('JESÚS MARÍA')) return 'JESUS MARIA';
          if (norm.includes('LIMA') || norm.includes('CERCADO')) return 'LIMA';
          return norm;
        }

        function normalizeParty(party) {
          const norm = normalizeStr(party);
          if (norm === 'SP' || norm.includes('SOMOS')) return 'SOMOS PERU';
          if (norm === 'RP' || norm.includes('RENOVACION') || norm.includes('RENOVACIÓN')) return 'RENOVACION';
          if (norm === 'AN' || norm.includes('AHORA NACION') || norm.includes('AHORA NACIÓN')) return 'AHORA NACION';
          if (norm === 'AVANZA' || norm.includes('AVANZA PAIS') || norm.includes('AVANZA PAÍS')) return 'AVANZA PAIS';
          if (norm.includes('PODEMOS')) return 'PODEMOS';
          if (norm === 'JP' || norm.includes('JUNTOS POR EL')) return 'JP';
          if (norm.includes('OBRAS')) return 'OBRAS';
          if (norm.includes('FREPAP')) return 'FREPAP';
          if (norm === 'AP' || norm.includes('ACCION POPULAR') || norm.includes('ACCIÓN POPULAR')) return 'ACCION POPULAR';
          if (norm === 'FE' || norm.includes('ESPERANZA')) return 'ESPERANZA';
          if (norm === 'AEV' || norm.includes('VENCEREMOS')) return 'VENCEREMOS';
          if (norm === 'VP' || norm.includes('VISION') || norm.includes('VISIÓN')) return 'VISION PERU';
          if (norm === 'APRA' || norm.includes('APRISTA')) return 'APRA';
          if (norm === 'FP' || norm.includes('FUERZA POPULAR')) return 'FP';
          if (norm === 'PPC' || norm.includes('POPULAR CRISTIANO')) return 'PPC';
          if (norm === 'PROG' || norm.includes('PROGRESEMOS')) return 'PROGRESEMOS';
          if (norm === 'PM' || norm.includes('MORADO')) return 'MORADO';
          if (norm === 'PBG' || norm.includes('BUEN GOBIERNO')) return 'BUEN GOBIERNO';
          if (norm === 'PDV' || norm.includes('VERDE')) return 'VERDE';
          if (norm === 'PL' || norm.includes('PERU LIBRE') || norm.includes('PERÚ LIBRE')) return 'PERU LIBRE';
          if (norm === 'CTTV' || norm.includes('TIERRA VERDE')) return 'TIERRA VERDE';
          if (norm === 'PC' || norm.includes('PUEBLO CONSCIENTE')) return 'PUEBLO CONSCIENTE';
          if (norm === 'PPP' || norm.includes('PATRIOTICO') || norm.includes('PATRIÓTICO')) return 'PPP';
          if (norm === 'ID' || norm.includes('INTEGRIDAD')) return 'INTEGRIDAD';
          if (norm === 'FC' || norm.includes('FUERZA CIUDADANA')) return 'FUERZA CIUDADANA';
          if (norm === 'BP' || norm.includes('BATALLA')) return 'BATALLA PERU';
          if (norm === 'APP' || norm.includes('PROGRESO')) return 'APP';
          if (norm === 'ARP' || norm.includes('ALIANZA REGIONAL')) return 'ALIANZA REGIONAL';
          if (norm === 'PPT' || norm.includes('PAIS PARA TODOS') || norm.includes('PAÍS PARA TODOS')) return 'PAIS PARA TODOS';
          if (norm === 'PRIN') return 'PRIN';
          if (norm === 'SAP' || norm.includes('SALVEMOS AL PERU') || norm.includes('SALVEMOS AL PERÚ')) return 'SALVEMOS AL PERU';
          if (norm === 'LP' || norm.includes('LIBERTAD POPULAR')) return 'LIBERTAD POPULAR';
          if (norm === 'PP' || norm.includes('PERU PRIMERO') || norm.includes('PERÚ PRIMERO')) return 'PERU PRIMERO';
          if (norm === 'PMOD' || norm.includes('PERU MODERNO') || norm.includes('PERÚ MODERNO')) return 'PERU MODERNO';
          return norm;
        }

        function getOfficialCandidate(tipoEleccion, distrito, partyKey) {
          const normParty = normalizeParty(partyKey);
          if (tipoEleccion === 'PROVINCIAL') {
            return CANDIDATOS_PROVINCIAL[normParty] || '';
          }
          const normDist = normalizeDistrict(distrito);
          const districtMap = CANDIDATOS_DISTRITALES[normDist];
          if (districtMap && districtMap[normParty]) {
            return districtMap[normParty];
          }
          for (const [dKey, dMap] of Object.entries(CANDIDATOS_DISTRITALES)) {
            if (normDist.includes(dKey) || dKey.includes(normDist)) {
              if (dMap[normParty]) return dMap[normParty];
            }
          }
          return '';
        }

        const extractCand = (item, partyKey, tipoEleccion) => {
          if (item && typeof item === 'object' && item.candidato) {
            const c = (item.candidato || '').toString().trim();
            if (c && !c.toLowerCase().startsWith('candidato ')) {
              return c;
            }
          } else if (typeof item === 'string') {
            const c = item.trim();
            if (c && !c.toLowerCase().startsWith('candidato ')) {
              return c;
            }
          }
          return getOfficialCandidate(tipoEleccion, payload.ubicacion || payload.distrito || '', partyKey);
        };

        // Provincial
        const p_sp_v = extractVote(prov["SOMOS PERU"] || prov.SP);
        const p_rp_v = extractVote(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP);
        const p_an_v = extractVote(prov["AHORA NACION"] || prov.AN);
        const p_avanza_v = extractVote(prov["AVANZA PAIS"] || prov.AVANZA);
        const p_podemos_v = extractVote(prov.PODEMOS || prov["PODEMOS PERU"]);
        const p_jp_v = extractVote(prov.JP || prov["JUNTOS POR EL PERU"]);
        const p_obras_v = extractVote(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"]);
        const p_frepap_v = extractVote(prov.FREPAP);
        const p_ap_v = extractVote(prov["ACCION POPULAR"] || prov.AP);
        const p_esperanza_v = extractVote(prov.ESPERANZA || prov.FE);
        const p_venceremos_v = extractVote(prov.VENCEREMOS || prov.AEV);
        const p_vision_v = extractVote(prov["VISION PERU"] || prov.VP || prov.VISION);
        const p_apra_v = extractVote(prov.APRA);
        const p_fp_v = extractVote(prov.FP || prov["FUERZA POPULAR"]);
        const p_ppc_v = extractVote(prov.PPC);
        const p_progresemos_v = extractVote(prov.PROGRESEMOS || prov.PROG);
        const p_morado_v = extractVote(prov.MORADO || prov.PM);
        const p_buen_gobierno_v = extractVote(prov["BUEN GOBIERNO"] || prov.PBG);
        const p_verde_v = extractVote(prov.VERDE || prov.PDV);
        const p_peru_libre_v = extractVote(prov["PERU LIBRE"] || prov.PL);
        const p_tierra_verde_v = extractVote(prov["TIERRA VERDE"] || prov.CTTV);
        const p_pueblo_consciente_v = extractVote(prov["PUEBLO CONSCIENTE"] || prov.PC);
        const p_ppp_v = extractVote(prov.PPP);
        const p_integridad_v = extractVote(prov.INTEGRIDAD || prov.ID);
        const p_fuerza_ciudadana_v = extractVote(prov["FUERZA CIUDADANA"] || prov.FC);
        const p_batalla_v = extractVote(prov["BATALLA PERU"] || prov.BP);
        const p_app_v = extractVote(prov.APP);
        const p_alianza_regional_v = extractVote(prov["ALIANZA REGIONAL"] || prov.ARP);

        const p_nulos = parseInt(payload.votos_nulos ?? prov.NULOS ?? 0, 10) || 0;
        const p_blanco = parseInt(payload.votos_blancos ?? payload.votos_vacios ?? prov.BLANCO ?? prov.VACIOS ?? 0, 10) || 0;
        const p_impugnados = parseInt(payload.votos_impugnados ?? prov.IMPUGNADOS ?? 0, 10) || 0;

        let p_cands_sum = 0;
        Object.keys(prov).forEach(k => {
          if (!['NULOS', 'BLANCO', 'VACIOS', 'IMPUGNADOS'].includes(k.toUpperCase())) {
            p_cands_sum += extractVote(prov[k]);
          }
        });
        const p_tot = p_cands_sum + p_nulos + p_blanco + p_impugnados;

        // Distrital
        const d_sp_v = extractVote(dist["SOMOS PERU"] || dist.SP);
        const d_rp_v = extractVote(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP);
        const d_an_v = extractVote(dist["AHORA NACION"] || dist.AN);
        const d_avanza_v = extractVote(dist["AVANZA PAIS"] || dist.AVANZA);
        const d_podemos_v = extractVote(dist.PODEMOS || dist["PODEMOS PERU"]);
        const d_jp_v = extractVote(dist.JP || dist["JUNTOS POR EL PERU"]);
        const d_obras_v = extractVote(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"]);
        const d_frepap_v = extractVote(dist.FREPAP);
        const d_ap_v = extractVote(dist["ACCION POPULAR"] || dist.AP);
        const d_esperanza_v = extractVote(dist.ESPERANZA || dist.FE);
        const d_venceremos_v = extractVote(dist.VENCEREMOS || dist.AEV);
        const d_vision_v = extractVote(dist["VISION PERU"] || dist.VP || dist.VISION);
        const d_apra_v = extractVote(dist.APRA);
        const d_fp_v = extractVote(dist.FP || dist["FUERZA POPULAR"]);
        const d_ppc_v = extractVote(dist.PPC);
        const d_progresemos_v = extractVote(dist.PROGRESEMOS || dist.PROG);
        const d_morado_v = extractVote(dist.MORADO || dist.PM);
        const d_buen_gobierno_v = extractVote(dist["BUEN GOBIERNO"] || dist.PBG);
        const d_verde_v = extractVote(dist.VERDE || dist.PDV);
        const d_peru_libre_v = extractVote(dist["PERU LIBRE"] || dist.PL);
        const d_tierra_verde_v = extractVote(dist["TIERRA VERDE"] || dist.CTTV);
        const d_pueblo_consciente_v = extractVote(dist["PUEBLO CONSCIENTE"] || dist.PC);
        const d_ppp_v = extractVote(dist.PPP);
        const d_integridad_v = extractVote(dist.INTEGRIDAD || dist.ID);
        const d_fuerza_ciudadana_v = extractVote(dist["FUERZA CIUDADANA"] || dist.FC);
        const d_batalla_v = extractVote(dist["BATALLA PERU"] || dist.BP);
        const d_app_v = extractVote(dist.APP);
        const d_alianza_regional_v = extractVote(dist["ALIANZA REGIONAL"] || dist.ARP);

        const d_nulos = parseInt(payload.votos_dist_nulos ?? dist.NULOS ?? 0, 10) || 0;
        const d_blanco = parseInt(payload.votos_dist_blancos ?? payload.votos_dist_vacios ?? dist.BLANCO ?? dist.VACIOS ?? 0, 10) || 0;
        const d_impugnados = parseInt(payload.votos_dist_impugnados ?? dist.IMPUGNADOS ?? 0, 10) || 0;

        let d_cands_sum = 0;
        Object.keys(dist).forEach(k => {
          if (!['NULOS', 'BLANCO', 'VACIOS', 'IMPUGNADOS'].includes(k.toUpperCase())) {
            d_cands_sum += extractVote(dist[k]);
          }
        });
        const d_tot = d_cands_sum + d_nulos + d_blanco + d_impugnados;

        const votosJson = JSON.stringify(payload.votos || { provincial: prov, distrital: dist });

        const sql = `
          INSERT INTO votos_detalle (
            personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
            p_sp_candidato, p_sp_votos, p_rp_candidato, p_rp_votos, p_an_candidato, p_an_votos,
            p_avanza_candidato, p_avanza_votos, p_podemos_candidato, p_podemos_votos, p_jp_candidato, p_jp_votos,
            p_obras_candidato, p_obras_votos, p_frepap_candidato, p_frepap_votos, p_ap_candidato, p_ap_votos,
            p_esperanza_candidato, p_esperanza_votos, p_venceremos_candidato, p_venceremos_votos, p_vision_candidato, p_vision_votos,
            p_apra_candidato, p_apra_votos, p_fp_candidato, p_fp_votos, p_ppc_candidato, p_ppc_votos,
            p_progresemos_candidato, p_progresemos_votos, p_morado_candidato, p_morado_votos, p_buen_gobierno_candidato, p_buen_gobierno_votos,
            p_verde_candidato, p_verde_votos, p_peru_libre_candidato, p_peru_libre_votos, p_tierra_verde_candidato, p_tierra_verde_votos,
            p_pueblo_consciente_candidato, p_pueblo_consciente_votos, p_ppp_candidato, p_ppp_votos, p_integridad_candidato, p_integridad_votos,
            p_fuerza_ciudadana_candidato, p_fuerza_ciudadana_votos, p_batalla_candidato, p_batalla_votos, p_app_candidato, p_app_votos,
            p_alianza_regional_candidato, p_alianza_regional_votos,
            p_nulos, p_vacios, p_blanco, p_impugnados, p_total_votos,
            d_sp_candidato, d_sp_votos, d_rp_candidato, d_rp_votos, d_an_candidato, d_an_votos,
            d_avanza_candidato, d_avanza_votos, d_podemos_candidato, d_podemos_votos, d_jp_candidato, d_jp_votos,
            d_obras_candidato, d_obras_votos, d_frepap_candidato, d_frepap_votos, d_ap_candidato, d_ap_votos,
            d_esperanza_candidato, d_esperanza_votos, d_venceremos_candidato, d_venceremos_votos, d_vision_candidato, d_vision_votos,
            d_apra_candidato, d_apra_votos, d_fp_candidato, d_fp_votos, d_ppc_candidato, d_ppc_votos,
            d_progresemos_candidato, d_progresemos_votos, d_morado_candidato, d_morado_votos, d_buen_gobierno_candidato, d_buen_gobierno_votos,
            d_verde_candidato, d_verde_votos, d_peru_libre_candidato, d_peru_libre_votos, d_tierra_verde_candidato, d_tierra_verde_votos,
            d_pueblo_consciente_candidato, d_pueblo_consciente_votos, d_ppp_candidato, d_ppp_votos, d_integridad_candidato, d_integridad_votos,
            d_fuerza_ciudadana_candidato, d_fuerza_ciudadana_votos, d_batalla_candidato, d_batalla_votos, d_app_candidato, d_app_votos,
            d_alianza_regional_candidato, d_alianza_regional_votos,
            d_nulos, d_vacios, d_blanco, d_impugnados, d_total_votos, votos_json, fecha_hora
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
            $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
            $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56,
            $57, $58, $59, $60, $61, $62, $63, $64,
            $65, $66, $67, $68, $69,
            $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81,
            $82, $83, $84, $85, $86, $87, $88, $89, $90, $91, $92, $93,
            $94, $95, $96, $97, $98, $99, $100, $101, $102, $103, $104, $105,
            $106, $107, $108, $109, $110, $111, $112, $113, $114, $115, $116, $117,
            $118, $119, $120, $121, $122, $123, $124, $125,
            $126, $127, $128, $129, $130, $131, CURRENT_TIMESTAMP
          )
          ON CONFLICT (dni, origen) DO UPDATE SET
            personero = EXCLUDED.personero,
            departamento = EXCLUDED.departamento,
            provincia = EXCLUDED.provincia,
            ubicacion = EXCLUDED.ubicacion,
            colegio = EXCLUDED.colegio,
            numero_mesa = EXCLUDED.numero_mesa,
            p_sp_candidato = EXCLUDED.p_sp_candidato, p_sp_votos = EXCLUDED.p_sp_votos,
            p_rp_candidato = EXCLUDED.p_rp_candidato, p_rp_votos = EXCLUDED.p_rp_votos,
            p_an_candidato = EXCLUDED.p_an_candidato, p_an_votos = EXCLUDED.p_an_votos,
            p_avanza_candidato = EXCLUDED.p_avanza_candidato, p_avanza_votos = EXCLUDED.p_avanza_votos,
            p_podemos_candidato = EXCLUDED.p_podemos_candidato, p_podemos_votos = EXCLUDED.p_podemos_votos,
            p_jp_candidato = EXCLUDED.p_jp_candidato, p_jp_votos = EXCLUDED.p_jp_votos,
            p_obras_candidato = EXCLUDED.p_obras_candidato, p_obras_votos = EXCLUDED.p_obras_votos,
            p_frepap_candidato = EXCLUDED.p_frepap_candidato, p_frepap_votos = EXCLUDED.p_frepap_votos,
            p_ap_candidato = EXCLUDED.p_ap_candidato, p_ap_votos = EXCLUDED.p_ap_votos,
            p_esperanza_candidato = EXCLUDED.p_esperanza_candidato, p_esperanza_votos = EXCLUDED.p_esperanza_votos,
            p_venceremos_candidato = EXCLUDED.p_venceremos_candidato, p_venceremos_votos = EXCLUDED.p_venceremos_votos,
            p_vision_candidato = EXCLUDED.p_vision_candidato, p_vision_votos = EXCLUDED.p_vision_votos,
            p_apra_candidato = EXCLUDED.p_apra_candidato, p_apra_votos = EXCLUDED.p_apra_votos,
            p_fp_candidato = EXCLUDED.p_fp_candidato, p_fp_votos = EXCLUDED.p_fp_votos,
            p_ppc_candidato = EXCLUDED.p_ppc_candidato, p_ppc_votos = EXCLUDED.p_ppc_votos,
            p_progresemos_candidato = EXCLUDED.p_progresemos_candidato, p_progresemos_votos = EXCLUDED.p_progresemos_votos,
            p_morado_candidato = EXCLUDED.p_morado_candidato, p_morado_votos = EXCLUDED.p_morado_votos,
            p_buen_gobierno_candidato = EXCLUDED.p_buen_gobierno_candidato, p_buen_gobierno_votos = EXCLUDED.p_buen_gobierno_votos,
            p_verde_candidato = EXCLUDED.p_verde_candidato, p_verde_votos = EXCLUDED.p_verde_votos,
            p_peru_libre_candidato = EXCLUDED.p_peru_libre_candidato, p_peru_libre_votos = EXCLUDED.p_peru_libre_votos,
            p_tierra_verde_candidato = EXCLUDED.p_tierra_verde_candidato, p_tierra_verde_votos = EXCLUDED.p_tierra_verde_votos,
            p_pueblo_consciente_candidato = EXCLUDED.p_pueblo_consciente_candidato, p_pueblo_consciente_votos = EXCLUDED.p_pueblo_consciente_votos,
            p_ppp_candidato = EXCLUDED.p_ppp_candidato, p_ppp_votos = EXCLUDED.p_ppp_votos,
            p_integridad_candidato = EXCLUDED.p_integridad_candidato, p_integridad_votos = EXCLUDED.p_integridad_votos,
            p_fuerza_ciudadana_candidato = EXCLUDED.p_fuerza_ciudadana_candidato, p_fuerza_ciudadana_votos = EXCLUDED.p_fuerza_ciudadana_votos,
            p_batalla_candidato = EXCLUDED.p_batalla_candidato, p_batalla_votos = EXCLUDED.p_batalla_votos,
            p_app_candidato = EXCLUDED.p_app_candidato, p_app_votos = EXCLUDED.p_app_votos,
            p_alianza_regional_candidato = EXCLUDED.p_alianza_regional_candidato, p_alianza_regional_votos = EXCLUDED.p_alianza_regional_votos,
            p_nulos = EXCLUDED.p_nulos, p_vacios = EXCLUDED.p_vacios, p_blanco = EXCLUDED.p_blanco, p_impugnados = EXCLUDED.p_impugnados, p_total_votos = EXCLUDED.p_total_votos,
            d_sp_candidato = EXCLUDED.d_sp_candidato, d_sp_votos = EXCLUDED.d_sp_votos,
            d_rp_candidato = EXCLUDED.d_rp_candidato, d_rp_votos = EXCLUDED.d_rp_votos,
            d_an_candidato = EXCLUDED.d_an_candidato, d_an_votos = EXCLUDED.d_an_votos,
            d_avanza_candidato = EXCLUDED.d_avanza_candidato, d_avanza_votos = EXCLUDED.d_avanza_votos,
            d_podemos_candidato = EXCLUDED.d_podemos_candidato, d_podemos_votos = EXCLUDED.d_podemos_votos,
            d_jp_candidato = EXCLUDED.d_jp_candidato, d_jp_votos = EXCLUDED.d_jp_votos,
            d_obras_candidato = EXCLUDED.d_obras_candidato, d_obras_votos = EXCLUDED.d_obras_votos,
            d_frepap_candidato = EXCLUDED.d_frepap_candidato, d_frepap_votos = EXCLUDED.d_frepap_votos,
            d_ap_candidato = EXCLUDED.d_ap_candidato, d_ap_votos = EXCLUDED.d_ap_votos,
            d_esperanza_candidato = EXCLUDED.d_esperanza_candidato, d_esperanza_votos = EXCLUDED.d_esperanza_votos,
            d_venceremos_candidato = EXCLUDED.d_venceremos_candidato, d_venceremos_votos = EXCLUDED.d_venceremos_votos,
            d_vision_candidato = EXCLUDED.d_vision_candidato, d_vision_votos = EXCLUDED.d_vision_votos,
            d_apra_candidato = EXCLUDED.d_apra_candidato, d_apra_votos = EXCLUDED.d_apra_votos,
            d_fp_candidato = EXCLUDED.d_fp_candidato, d_fp_votos = EXCLUDED.d_fp_votos,
            d_ppc_candidato = EXCLUDED.d_ppc_candidato, d_ppc_votos = EXCLUDED.d_ppc_votos,
            d_progresemos_candidato = EXCLUDED.d_progresemos_candidato, d_progresemos_votos = EXCLUDED.d_progresemos_votos,
            d_morado_candidato = EXCLUDED.d_morado_candidato, d_morado_votos = EXCLUDED.d_morado_votos,
            d_buen_gobierno_candidato = EXCLUDED.d_buen_gobierno_candidato, d_buen_gobierno_votos = EXCLUDED.d_buen_gobierno_votos,
            d_verde_candidato = EXCLUDED.d_verde_candidato, d_verde_votos = EXCLUDED.d_verde_votos,
            d_peru_libre_candidato = EXCLUDED.d_peru_libre_candidato, d_peru_libre_votos = EXCLUDED.d_peru_libre_votos,
            d_tierra_verde_candidato = EXCLUDED.d_tierra_verde_candidato, d_tierra_verde_votos = EXCLUDED.d_tierra_verde_votos,
            d_pueblo_consciente_candidato = EXCLUDED.d_pueblo_consciente_candidato, d_pueblo_consciente_votos = EXCLUDED.d_pueblo_consciente_votos,
            d_ppp_candidato = EXCLUDED.d_ppp_candidato, d_ppp_votos = EXCLUDED.d_ppp_votos,
            d_integridad_candidato = EXCLUDED.d_integridad_candidato, d_integridad_votos = EXCLUDED.d_integridad_votos,
            d_fuerza_ciudadana_candidato = EXCLUDED.d_fuerza_ciudadana_candidato, d_fuerza_ciudadana_votos = EXCLUDED.d_fuerza_ciudadana_votos,
            d_batalla_candidato = EXCLUDED.d_batalla_candidato, d_batalla_votos = EXCLUDED.d_batalla_votos,
            d_app_candidato = EXCLUDED.d_app_candidato, d_app_votos = EXCLUDED.d_app_votos,
            d_alianza_regional_candidato = EXCLUDED.d_alianza_regional_candidato, d_alianza_regional_votos = EXCLUDED.d_alianza_regional_votos,
            d_nulos = EXCLUDED.d_nulos, d_vacios = EXCLUDED.d_vacios, d_blanco = EXCLUDED.d_blanco, d_impugnados = EXCLUDED.d_impugnados, d_total_votos = EXCLUDED.d_total_votos,
            votos_json = EXCLUDED.votos_json,
            fecha_hora = CURRENT_TIMESTAMP
        `;

        const params = [
          personero, dni, departamento, provincia, ubicacion, colegio, numero_mesa, origen,
          extractCand(prov["SOMOS PERU"] || prov.SP, "SOMOS PERU", "PROVINCIAL"), p_sp_v,
          extractCand(prov.RENOVACION || prov["RENOVACION POPULAR"] || prov.RP, "RENOVACION", "PROVINCIAL"), p_rp_v,
          extractCand(prov["AHORA NACION"] || prov.AN, "AHORA NACION", "PROVINCIAL"), p_an_v,
          extractCand(prov["AVANZA PAIS"] || prov.AVANZA, "AVANZA PAIS", "PROVINCIAL"), p_avanza_v,
          extractCand(prov.PODEMOS || prov["PODEMOS PERU"], "PODEMOS", "PROVINCIAL"), p_podemos_v,
          extractCand(prov.JP || prov["JUNTOS POR EL PERU"], "JP", "PROVINCIAL"), p_jp_v,
          extractCand(prov.OBRAS || prov["PARTIDO CIVICO OBRAS"], "OBRAS", "PROVINCIAL"), p_obras_v,
          extractCand(prov.FREPAP, "FREPAP", "PROVINCIAL"), p_frepap_v,
          extractCand(prov["ACCION POPULAR"] || prov.AP, "ACCION POPULAR", "PROVINCIAL"), p_ap_v,
          extractCand(prov.ESPERANZA || prov.FE || prov["FRENTE DE LA ESPERANZA"], "ESPERANZA", "PROVINCIAL"), p_esperanza_v,
          extractCand(prov.VENCEREMOS || prov.AEV || prov["ALIANZA ELECTORAL VENCEREMOS"], "VENCEREMOS", "PROVINCIAL"), p_venceremos_v,
          extractCand(prov["VISION PERU"] || prov.VP || prov.VISION, "VISION PERU", "PROVINCIAL"), p_vision_v,
          extractCand(prov.APRA || prov["PARTIDO APRISTA PERUANO"], "APRA", "PROVINCIAL"), p_apra_v,
          extractCand(prov.FP || prov["FUERZA POPULAR"], "FP", "PROVINCIAL"), p_fp_v,
          extractCand(prov.PPC || prov["PARTIDO POPULAR CRISTIANO"], "PPC", "PROVINCIAL"), p_ppc_v,
          extractCand(prov.PROGRESEMOS || prov.PROG, "PROGRESEMOS", "PROVINCIAL"), p_progresemos_v,
          extractCand(prov.MORADO || prov.PM || prov["PARTIDO MORADO"], "MORADO", "PROVINCIAL"), p_morado_v,
          extractCand(prov["BUEN GOBIERNO"] || prov.PBG || prov["PARTIDO DEL BUEN GOBIERNO"], "BUEN GOBIERNO", "PROVINCIAL"), p_buen_gobierno_v,
          extractCand(prov.VERDE || prov.PDV || prov["PARTIDO DEMOCRATA VERDE"], "VERDE", "PROVINCIAL"), p_verde_v,
          extractCand(prov["PERU LIBRE"] || prov.PL, "PERU LIBRE", "PROVINCIAL"), p_peru_libre_v,
          extractCand(prov["TIERRA VERDE"] || prov.CTTV, "TIERRA VERDE", "PROVINCIAL"), p_tierra_verde_v,
          extractCand(prov["PUEBLO CONSCIENTE"] || prov.PC, "PUEBLO CONSCIENTE", "PROVINCIAL"), p_pueblo_consciente_v,
          extractCand(prov.PPP || prov["PARTIDO PATRIOTICO DEL PERU"], "PPP", "PROVINCIAL"), p_ppp_v,
          extractCand(prov.INTEGRIDAD || prov.ID || prov["INTEGRIDAD DEMOCRATICA"], "INTEGRIDAD", "PROVINCIAL"), p_integridad_v,
          extractCand(prov["FUERZA CIUDADANA"] || prov.FC, "FUERZA CIUDADANA", "PROVINCIAL"), p_fuerza_ciudadana_v,
          extractCand(prov["BATALLA PERU"] || prov.BP, "BATALLA PERU", "PROVINCIAL"), p_batalla_v,
          extractCand(prov.APP || prov["ALIANZA PARA EL PROGRESO"], "APP", "PROVINCIAL"), p_app_v,
          extractCand(prov["ALIANZA REGIONAL"] || prov.ARP || prov["ALIANZA REGIONAL POR EL PERU"], "ALIANZA REGIONAL", "PROVINCIAL"), p_alianza_regional_v,
          p_nulos, p_blanco, p_blanco, p_impugnados, p_tot,
          extractCand(dist["SOMOS PERU"] || dist.SP, "SOMOS PERU", "DISTRITAL"), d_sp_v,
          extractCand(dist.RENOVACION || dist["RENOVACION POPULAR"] || dist.RP, "RENOVACION", "DISTRITAL"), d_rp_v,
          extractCand(dist["AHORA NACION"] || dist.AN, "AHORA NACION", "DISTRITAL"), d_an_v,
          extractCand(dist["AVANZA PAIS"] || dist.AVANZA, "AVANZA PAIS", "DISTRITAL"), d_avanza_v,
          extractCand(dist.PODEMOS || dist["PODEMOS PERU"], "PODEMOS", "DISTRITAL"), d_podemos_v,
          extractCand(dist.JP || dist["JUNTOS POR EL PERU"], "JP", "DISTRITAL"), d_jp_v,
          extractCand(dist.OBRAS || dist["PARTIDO CIVICO OBRAS"], "OBRAS", "DISTRITAL"), d_obras_v,
          extractCand(dist.FREPAP, "FREPAP", "DISTRITAL"), d_frepap_v,
          extractCand(dist["ACCION POPULAR"] || dist.AP, "ACCION POPULAR", "DISTRITAL"), d_ap_v,
          extractCand(dist.ESPERANZA || dist.FE || dist["FRENTE DE LA ESPERANZA"], "ESPERANZA", "DISTRITAL"), d_esperanza_v,
          extractCand(dist.VENCEREMOS || dist.AEV || dist["ALIANZA ELECTORAL VENCEREMOS"], "VENCEREMOS", "DISTRITAL"), d_venceremos_v,
          extractCand(dist["VISION PERU"] || dist.VP || dist.VISION, "VISION PERU", "DISTRITAL"), d_vision_v,
          extractCand(dist.APRA || dist["PARTIDO APRISTA PERUANO"], "APRA", "DISTRITAL"), d_apra_v,
          extractCand(dist.FP || dist["FUERZA POPULAR"], "FP", "DISTRITAL"), d_fp_v,
          extractCand(dist.PPC || dist["PARTIDO POPULAR CRISTIANO"], "PPC", "DISTRITAL"), d_ppc_v,
          extractCand(dist.PROGRESEMOS || dist.PROG, "PROGRESEMOS", "DISTRITAL"), d_progresemos_v,
          extractCand(dist.MORADO || dist.PM || dist["PARTIDO MORADO"], "MORADO", "DISTRITAL"), d_morado_v,
          extractCand(dist["BUEN GOBIERNO"] || dist.PBG || dist["PARTIDO DEL BUEN GOBIERNO"], "BUEN GOBIERNO", "DISTRITAL"), d_buen_gobierno_v,
          extractCand(dist.VERDE || dist.PDV || dist["PARTIDO DEMOCRATA VERDE"], "VERDE", "DISTRITAL"), d_verde_v,
          extractCand(dist["PERU LIBRE"] || dist.PL, "PERU LIBRE", "DISTRITAL"), d_peru_libre_v,
          extractCand(dist["TIERRA VERDE"] || dist.CTTV, "TIERRA VERDE", "DISTRITAL"), d_tierra_verde_v,
          extractCand(dist["PUEBLO CONSCIENTE"] || dist.PC, "PUEBLO CONSCIENTE", "DISTRITAL"), d_pueblo_consciente_v,
          extractCand(dist.PPP || dist["PARTIDO PATRIOTICO DEL PERU"], "PPP", "DISTRITAL"), d_ppp_v,
          extractCand(dist.INTEGRIDAD || dist.ID || dist["INTEGRIDAD DEMOCRATICA"], "INTEGRIDAD", "DISTRITAL"), d_integridad_v,
          extractCand(dist["FUERZA CIUDADANA"] || dist.FC, "FUERZA CIUDADANA", "DISTRITAL"), d_fuerza_ciudadana_v,
          extractCand(dist["BATALLA PERU"] || dist.BP, "BATALLA PERU", "DISTRITAL"), d_batalla_v,
          extractCand(dist.APP || dist["ALIANZA PARA EL PROGRESO"], "APP", "DISTRITAL"), d_app_v,
          extractCand(dist["ALIANZA REGIONAL"] || dist.ARP || dist["ALIANZA REGIONAL POR EL PERU"], "ALIANZA REGIONAL", "DISTRITAL"), d_alianza_regional_v,
          d_nulos, d_blanco, d_blanco, d_impugnados, d_tot,
          votosJson
        ];

        await db.query(sql, params);
        return res.status(200).json({ success: true, message: 'Votos registrados correctamente en la base de datos.' });
      }

      // 3. ASISTENCIA
      case 'registrar_asistencia': {
        const { nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps } = payload;
        await db.query(`
          INSERT INTO asistencia (nombre, dni, distrito, local, mesa, confirmacion, foto_url, ubicacion_gps, fecha_hora)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `, [nombre, dni, distrito, local, mesa, confirmacion || 'SI', foto_url || '', ubicacion_gps || '']);
        return res.status(200).json({ success: true, message: 'Asistencia registrada con éxito.' });
      }

      // 4. SEGUNDA LLEGADA GPS
      case 'confirmar_asistencia_llegada': {
        const { nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado } = payload;
        await db.query(`
          INSERT INTO asistenciallegada (nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido, estado, fecha_registro)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        `, [nombre, dni, distrito, colegio, mesa, latitud, longitud, distancia_metros, radio_permitido || 50, estado || 'CONFIRMADO 2DA LLEGADA']);
        return res.status(200).json({ success: true, message: 'Segunda llegada GPS confirmada.' });
      }

      // 5. REPORTE
      case 'obtener_reporte':
      case 'read_reporte': {
        const votosRes = await db.query('SELECT * FROM votos_detalle ORDER BY id DESC');
        const mesasRes = await db.query('SELECT * FROM mesas ORDER BY id ASC');
        return res.status(200).json({
          success: true,
          votos: votosRes.rows,
          mesas: mesasRes.rows
        });
      }

      // 6. ASISTENCIA Y ESTADO DE VOTOS POR DNI
      case 'obtener_asistencia_por_dni': {
        const dniQuery = (payload.dni || '').toString().trim();
        if (!dniQuery) {
          return res.status(200).json({ success: false, message: 'Se requiere DNI' });
        }

        const asisRes = await db.query('SELECT * FROM asistencia WHERE TRIM(dni) = $1 ORDER BY id DESC LIMIT 1', [dniQuery]);
        const llegadaRes = await db.query('SELECT * FROM asistenciallegada WHERE TRIM(dni) = $1 ORDER BY id DESC LIMIT 1', [dniQuery]);
        const votoManualRes = await db.query("SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = 'MANUAL' ORDER BY id DESC LIMIT 1", [dniQuery]);
        const votoImagenRes = await db.query("SELECT * FROM votos_detalle WHERE TRIM(dni) = $1 AND origen = 'IMAGEN' ORDER BY id DESC LIMIT 1", [dniQuery]);

        const asistencia_confirmada = Boolean(asisRes.rows && asisRes.rows.length > 0);
        const llegada_confirmada = Boolean(llegadaRes.rows && llegadaRes.rows.length > 0);
        const voto_manual_enviado = Boolean(votoManualRes.rows && votoManualRes.rows.length > 0);
        const voto_imagen_enviado = Boolean(votoImagenRes.rows && votoImagenRes.rows.length > 0);

        return res.status(200).json({
          success: true,
          asistencia: asisRes.rows[0] || null,
          asistencia_confirmada,
          llegada: llegadaRes.rows[0] || null,
          llegada_confirmada,
          voto_manual: votoManualRes.rows[0] || null,
          voto_manual_enviado,
          voto_imagen: votoImagenRes.rows[0] || null,
          voto_imagen_enviado
        });
      }

      default:
        return res.status(200).json({ success: false, message: `Acción '${action}' no reconocida` });
    }
  } catch (err) {
    console.error('[API Handler Error]', err);
    return res.status(500).json({ success: false, message: 'Error en base de datos: ' + err.message });
  }
}
