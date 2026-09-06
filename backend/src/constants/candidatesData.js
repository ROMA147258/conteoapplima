// Catálogo oficial de candidatos para Lima Metropolitana y sus 43 Distritos

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
  },
  "MIRAFLORES": {
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
  },
  "SANTIAGO DE SURCO": {
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
  },
  "SAN BORJA": {
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
  },
  "SAN ISIDRO": {
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
  },
  "PUEBLO LIBRE": {
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
  },
  "SAN JUAN DE LURIGANCHO": {
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
  },
  "ATE": {
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
  },
  "COMAS": {
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
  },
  "LOS OLIVOS": {
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
  },
  "SAN MARTIN DE PORRES": {
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
  },
  "LA MOLINA": {
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
  },
  "JESUS MARIA": {
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
  },
  "LINCE": {
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
  },
  "MAGDALENA DEL MAR": {
    "SOMOS PERU": "Alberto Sánchez Aizcorbe Carranza",
    "RENOVACION": "Víctor Raúl Paulini Sánchez",
    "APP": "Johan Fritz Chávez Sifuentes",
    "AVANZA PAIS": "Carla Robbiano Montes de Allison",
    "ACCION POPULAR": "Diego Fernando Uceda Guerra-García",
    "PODEMOS": "Carlos Alfonso Gómez de la Torre",
    "PPC": "Javier Eduardo Ismodes",
    "FP": "Raúl Madueño",
    "MORADO": "Carmen Rosa López"
  },
  "SAN MIGUEL": {
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
  },
  "CHORRILLOS": {
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
  },
  "BARRANCO": {
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
  },
  "BREÑA": {
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
  },
  "RIMAC": {
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
  },
  "LA VICTORIA": {
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
  },
  "VILLA EL SALVADOR": {
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
  },
  "VILLA MARIA DEL TRIUNFO": {
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
  },
  "SAN JUAN DE MIRAFLORES": {
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
  },
  "CARABAYLLO": {
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
  },
  "PUENTE PIEDRA": {
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
  },
  "SANTA ANITA": {
    "SOMOS PERU": "José Luis Nole Palomino",
    "RENOVACION": "Antero Maurine Pickmans Arenaza",
    "ACCION POPULAR": "Flora Maribel Fernández Rengifo",
    "PERU PRIMERO": "Manuel Edgardo Mamani Rodríguez",
    "AVANZA PAIS": "Eduardo Rímachi Martínez",
    "PODEMOS": "Leonor Chumbimune Cajahuaringa",
    "APP": "Olimpio Alegría Calderón",
    "FP": "Carlos Martínez",
    "PPC": "Hugo Ramos"
  },
  "INDEPENDENCIA": {
    "SOMOS PERU": "Alfredo Reynaga Ramírez",
    "PODEMOS": "Gregorio Bernardino Quispe Alvino",
    "PERU PRIMERO": "Sandra Gutiérrez Aibar",
    "RENOVACION": "Benigno Calderón",
    "AVANZA PAIS": "Víctor Yuri Vílchez",
    "ACCION POPULAR": "Raúl Díaz",
    "APP": "Evans Sifuentes",
    "FP": "Yuri Pando",
    "PPC": "Carmen Rosa Ortiz"
  },
  "SAN LUIS": {
    "SOMOS PERU": "David Rojas Maza",
    "RENOVACION": "Ricardo Pérez Castro",
    "ACCION POPULAR": "Christian Pardo",
    "AVANZA PAIS": "Zee Carlos Corrales",
    "PODEMOS": "Ronald Fuentes",
    "PPC": "Marilú Zevallos",
    "APP": "Víctor Alegría",
    "FP": "Jorge Morante"
  },
  "CHACLACAYO": {
    "SOMOS PERU": "Manuel Campos Sologuren",
    "RENOVACION": "Sergio Antonio Baigorria Seas",
    "AVANZA PAIS": "Leonidas Altamirano",
    "ACCION POPULAR": "Luis Bueno Quino",
    "PODEMOS": "Vilma Coronado",
    "APP": "Javier Huamaní",
    "FP": "Carlos Rossi",
    "PPC": "Enrique Palomino"
  },
  "LURIGANCHO": {
    "SOMOS PERU": "Víctor Castillo Sánchez",
    "JP": "Oswaldo Hernán Vargas Cuellar",
    "PODEMOS": "Hugo Pariona",
    "RENOVACION": "Raúl Porturas",
    "AVANZA PAIS": "Carlos Rivera",
    "ACCION POPULAR": "Fernando Morales",
    "APP": "Luis Gonzales",
    "FP": "David Palacios",
    "PPC": "Santos Quispe"
  },
  "LURIN": {
    "SOMOS PERU": "Rosa Torrejón",
    "APP": "Juan Raúl Marticorena Cuba",
    "RENOVACION": "José Arakaki",
    "AVANZA PAIS": "Francisco Silva",
    "PODEMOS": "Luis Chumpitaz",
    "ACCION POPULAR": "Víctor Palacios",
    "FP": "Jorge Arroyo",
    "PPC": "Manuel Delgado"
  },
  "PACHACAMAC": {
    "SOMOS PERU": "Hugo Ramos Lescano",
    "APP": "Enrique Valentín Cabrera Sulca",
    "RENOVACION": "Shirley Susan Ramos",
    "PODEMOS": "Marcos Antonio",
    "AVANZA PAIS": "Guillermo Panta",
    "ACCION POPULAR": "César Mendoza",
    "FP": "Elena Carrión"
  },
  "CIENEGUILLA": {
    "SOMOS PERU": "Edwin Subilete",
    "PODEMOS": "Emilio Chávez Huaringa",
    "RENOVACION": "Manuel Lara",
    "AVANZA PAIS": "Mirtha Hualpa",
    "APP": "Carlos Sandoval",
    "ACCION POPULAR": "Pedro Vargas"
  },
  "ANCON": {
    "SOMOS PERU": "John Barrera Cavassa",
    "PODEMOS": "Samuel Marcos Daza Taype",
    "RENOVACION": "Felipe Arakaki Shapiama",
    "AVANZA PAIS": "Carlos Morales",
    "ACCION POPULAR": "David Gómez",
    "APP": "Pedro Salcedo",
    "FP": "María Elena López"
  },
  "SANTA ROSA": {
    "SOMOS PERU": "Alan Carrasco Bobadilla",
    "PODEMOS": "George Robles Soto",
    "RENOVACION": "Raúl Poma",
    "AVANZA PAIS": "Luis García",
    "ACCION POPULAR": "Mario Huamán",
    "APP": "Jorge Chávez"
  },
  "PUCUSANA": {
    "SOMOS PERU": "Juan José Cuya Espinoza",
    "RENOVACION": "Lidia Carrillo",
    "AVANZA PAIS": "Carlos Chauca",
    "PODEMOS": "Enrique Delgado",
    "APP": "Pedro Rivas",
    "ACCION POPULAR": "Julio Quispe"
  },
  "PUNTA HERMOSA": {
    "SOMOS PERU": "Jorge Olaechea",
    "AVANZA PAIS": "Carlos Guillermo Fernández Otero",
    "RENOVACION": "Guillermo Samaniego",
    "PPC": "Richard Vega",
    "PODEMOS": "Víctor Castillo",
    "ACCION POPULAR": "Luis Paredes"
  },
  "PUNTA NEGRA": {
    "SOMOS PERU": "José Delgado",
    "APP": "Eulogio Huayhua Huayhua",
    "AVANZA PAIS": "Víctor Saman",
    "RENOVACION": "Julia Ramos",
    "PODEMOS": "Carlos Valdivia",
    "ACCION POPULAR": "Jorge Silva"
  },
  "SAN BARTOLO": {
    "SOMOS PERU": "Jorge Luis Infante",
    "AVANZA PAIS": "August Carbajal Schumacher",
    "RENOVACION": "Martha Valdivia",
    "PODEMOS": "Elliott Ramos",
    "APP": "Carlos Mendoza",
    "ACCION POPULAR": "Raúl Sánchez"
  },
  "SANTA MARIA DEL MAR": {
    "SOMOS PERU": "Jhair Medina",
    "ACCION POPULAR": "Hugo Alberto Monteverde Cerrutti",
    "AVANZA PAIS": "Alberto Hurtado",
    "RENOVACION": "Susana Vidal",
    "PODEMOS": "Manuel Rojas",
    "APP": "Fernando Gálvez"
  },
  "EL AGUSTINO": {
    "SOMOS PERU": "Jorge García",
    "PODEMOS": "Richard Robert Soria Fuerte",
    "APP": "Víctor Salcedo",
    "RENOVACION": "Carlos Ramos",
    "AVANZA PAIS": "Carmen Rosa Morales",
    "ACCION POPULAR": "Manuel Zapata",
    "FP": "Víctor Alva"
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

module.exports = {
  CANDIDATOS_PROVINCIAL,
  CANDIDATOS_DISTRITALES,
  normalizeDistrict,
  normalizeParty,
  getOfficialCandidate
};
