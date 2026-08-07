/**
 * GOOGLE APPS SCRIPT - SINGLE CONSOLIDATED BACKEND SCRIPT
 * ESTRUCTURA: ID EN COLUMNA A PARA PESTAÑAS (USUARIOS Y VOTOS)
 * NUEVO: PESTAÑA "Mesas" PREPOBLADA CON ESTRUCTURA ELECTORAL DESDE DATA.JS
 * 
 * Instrucciones de instalación:
 * 1. Abre tu hoja de cálculo de Google.
 * 2. Ve a Extensiones > Apps Script.
 * 3. Reemplaza todo el código existente por este único archivo.
 * 4. Ejecuta la función "inicializarHojasNueva" para crear y formatear todas las pestañas.
 * 5. Haz clic en "Implementar" > "Nueva implementación" (como Aplicación Web, acceso para "Cualquiera").
 * 6. Copia la URL obtenida y configúrala en tu aplicativo móvil.
 */

var colegiosReales = {
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
  
  // LIMA METROPOLITANA FINALIZADO
};

function inicializarHojasNueva() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var provinciasData = [
    { id: 'lima-metropolitana', name: 'Lima Metropolitana', distritos: [
      'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla',
      'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima',
      'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac',
      'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
      'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
      'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
      'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
    ]}
  ];

  // 1. PESTAÑA: Votos_Detalle (40 columnas, ID en Columna A)
  var sheet = ss.getSheetByName("Votos_Detalle");
  if (!sheet) {
    sheet = ss.insertSheet("Votos_Detalle");
  }
  
  sheet.clear();
  sheet.appendRow([
    "ID",
    "Fecha/Hora", 
    "Personero", 
    "DNI", 
    "Departamento",
    "Provincia",
    "Ubicación (Distrito)", 
    "Colegio",
    "Número de Mesa", 
    "Origen",
    
    // PROVINCIAL (LIMA METROPOLITANA)
    "P_FP (Eduardo Romero) - Candidato", "P_FP (Eduardo Romero) - Votos", 
    "P_JP (Gonzalo Alegría) - Candidato", "P_JP (Gonzalo Alegría) - Votos", 
    "P_SP (Christian Pardo) - Candidato", "P_SP (Diego Serpa) - Votos", 
    "P_FREPAP (Juan Silva) - Candidato", "P_FREPAP (Juan Silva) - Votos", 
    "P_VERDE (Yuri Castro) - Candidato", "P_VERDE (Yuri Castro) - Votos", 
    "P_MORADO (Néstor de la Rosa) - Candidato", "P_MORADO (Néstor de la Rosa) - Votos", 
    "P_NULOS",
    "P_VACIOS",
    "P_TOTAL VOTOS",
    
    // DISTRITAL (LOCAL)
    "D_FP_Candidato", "D_FP_Votos", 
    "D_JP_Candidato", "D_JP_Votos", 
    "D_SP_Candidato", "D_SP_Votos", 
    "D_FREPAP_Candidato", "D_FREPAP_Votos", 
    "D_VERDE_Candidato", "D_VERDE_Votos", 
    "D_MORADO_Candidato", "D_MORADO_Votos", 
    "D_NULOS",
    "D_VACIOS",
    "D_TOTAL VOTOS"
  ]);
  
  // Dar estilo a cabecera Votos_Detalle (40 columnas)
  var rangeVotos = sheet.getRange(1, 1, 1, 40);
  rangeVotos.setFontWeight("bold");
  rangeVotos.setBackground("#1e293b");
  rangeVotos.setFontColor("#ffffff");
  
  // Fila de Prueba: Diego Torres Ramos en Ate (Mesa 120401)
  sheet.appendRow([
    "1",
    new Date(),
    "Diego Torres Ramos",
    "123456789",
    "Lima",
    "Lima",
    "Ate",
    "I.E. Ate",
    "120401",
    "MANUAL",
    
    // Provincial
    "Eduardo Romero", 0,
    "Gonzalo Alegría", 0,
    "Diego Serpa", 0,
    "Juan Silva", 0,
    "Yuri Castro", 0,
    "Néstor de la Rosa", 0,
    0, // P_NULOS
    0, // P_VACIOS
    0, // Total Provincial
    
    // Distrital (Ate)
    "Patricia Villanueva Díaz", 0,
    "Carlos Sánchez Paredes", 0,
    "Juan Villanueva Chávez", 0,
    "Víctor Sánchez Ramos", 0,
    "Ana Villanueva Flores", 0,
    "Sonia Sánchez Rojas", 0,
    0, // D_NULOS
    0, // D_VACIOS
    0  // Total Distrital
  ]);
  
  // Función auxiliar para normalizar texto (ignorar tildes, mayúsculas y espacios extra)
  function normalizarTexto(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // Función auxiliar para asegurar que la hoja tenga filas suficientes antes de setValues
  function asegurarFilasSuficientes(hoja, filasRequeridas) {
    var maxRows = hoja.getMaxRows();
    if (maxRows < filasRequeridas) {
      hoja.insertRowsAfter(maxRows, filasRequeridas - maxRows);
    }
  }

var COORDENADAS_DISTRITOS_PERU = {
  // Lima Metropolitana
  'Ate': { lat: -12.0254, lon: -76.9189 },
  'Ancón': { lat: -11.7745, lon: -77.1550 },
  'Miraflores': { lat: -12.1245, lon: -77.0260 },
  'San Isidro': { lat: -12.0970, lon: -77.0360 },
  'Santiago de Surco': { lat: -12.1400, lon: -76.9900 },
  'La Molina': { lat: -12.0850, lon: -76.9500 },
  'San Borja': { lat: -12.1000, lon: -77.0000 },
  'Los Olivos': { lat: -11.9700, lon: -77.0700 },
  'Comas': { lat: -11.9300, lon: -77.0500 },
  'San Juan de Lurigancho': { lat: -11.9800, lon: -77.0000 },
  'Villa El Salvador': { lat: -12.2100, lon: -76.9300 },
  'Villa María del Triunfo': { lat: -12.1600, lon: -76.9400 },
  'Rímac': { lat: -12.0300, lon: -77.0200 },
  'Lima': { lat: -12.0463, lon: -77.0427 },
  'Breña': { lat: -12.0550, lon: -77.0500 },
  'La Victoria': { lat: -12.0650, lon: -77.0250 },
  'Independencia': { lat: -11.9900, lon: -77.0500 },
  'San Miguel': { lat: -12.0800, lon: -77.0900 },
  'Magdalena del Mar': { lat: -12.0900, lon: -77.0700 },
  'Pueblo Libre': { lat: -12.0750, lon: -77.0600 },
  'Jesús María': { lat: -12.0700, lon: -77.0450 },
  'Lince': { lat: -12.0850, lon: -77.0350 },
  'Barranco': { lat: -12.1450, lon: -77.0200 },
  'Chorrillos': { lat: -12.1800, lon: -77.0100 },
  'Surquillo': { lat: -12.1100, lon: -77.0200 },
  'San Luis': { lat: -12.0750, lon: -77.0000 },
  'El Agustino': { lat: -12.0450, lon: -76.9900 },
  'Santa Anita': { lat: -12.0400, lon: -76.9600 },
  'San Juan de Miraflores': { lat: -12.1500, lon: -76.9600 },
  'San Martín de Porres': { lat: -12.0100, lon: -77.0700 },
  'Carabayllo': { lat: -11.8900, lon: -77.0300 },
  'Puente Piedra': { lat: -11.8700, lon: -77.0700 },
  'Lurigancho': { lat: -11.9900, lon: -76.8500 },
  'Lurín': { lat: -12.2700, lon: -76.8700 },
  'Pachacámac': { lat: -12.2300, lon: -76.8500 }
};

function generarCoordenadasColegioScript(distrito, colegio) {
  var base = COORDENADAS_DISTRITOS_PERU[distrito];
  if (!base) {
    base = { lat: -12.0463, lon: -77.0427 };
  }
  var seed = 0;
  var str = (colegio || "") + (distrito || "");
  for (var i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) & 0xFFFFFFFF;
  }
  var offsetLat = ((Math.abs(seed) % 1000) - 500) / 100000;
  var offsetLon = ((Math.abs(Math.floor(seed / 1000)) % 1000) - 500) / 100000;
  
  var latFinal = (base.lat + offsetLat).toFixed(6);
  var lonFinal = (base.lon + offsetLon).toFixed(6);
  return latFinal + ", " + lonFinal;
}

  // 2. PESTAÑA: Usuarios (6 columnas, ID en Columna A) - Personeros de Mesa
  var userSheet = ss.getSheetByName("Usuarios");
  if (!userSheet) {
    userSheet = ss.insertSheet("Usuarios");
  }
  
  userSheet.clear();
  userSheet.appendRow(["ID", "Nombre", "DNI", "Distrito", "Colegio", "Mesa"]);
  
  // Dar estilo a cabecera Usuarios
  var rangeUser = userSheet.getRange(1, 1, 1, 6);
  rangeUser.setFontWeight("bold");
  rangeUser.setBackground("#0284c7");
  rangeUser.setFontColor("#ffffff");

  // 2B. PESTAÑA: Usuarios1 (6 columnas, ID en Columna A) - Coordinadores de Local
  var coordUserSheet = ss.getSheetByName("Usuarios1");
  if (!coordUserSheet) {
    coordUserSheet = ss.insertSheet("Usuarios1");
  }
  
  coordUserSheet.clear();
  coordUserSheet.appendRow(["ID", "Nombre", "DNI", "Distrito", "Colegio", "Mesa"]);
  
  // Dar estilo a cabecera Usuarios1 (Coordinadores - Tono Púrpura)
  var rangeCoordUser = coordUserSheet.getRange(1, 1, 1, 6);
  rangeCoordUser.setFontWeight("bold");
  rangeCoordUser.setBackground("#7c3aed");
  rangeCoordUser.setFontColor("#ffffff");
  
  // Generar la estructura completa de Mesas asegurando cobertura en Lima Metropolitana
  var listMesas = [];
  var mesaCounter = 36999;
  var listaElectoral = obtenerListaElectoralOficialExcel() || [];
  
  provinciasData.forEach(function(p) {
    p.distritos.forEach(function(d) {
      // Buscar colegios en la lista electoral oficial con normalización de tildes
      var targetClean = normalizarTexto(d);
      var reales = listaElectoral.filter(function(item) {
        return normalizarTexto(item[1]) === targetClean;
      });
      
      if (reales && reales.length > 0) {
        reales.forEach(function(item) {
          var prov = item[0] || p.name;
          var dist = item[1] || d;
          var col = item[2] || "LOCAL ELECTORAL";
          var dir = item[3] || (col + ", " + dist);
          var totalMesasLocal = parseInt(item[4], 10) || 1;
          
          for (var m = 1; m <= totalMesasLocal; m++) {
            var mesaStr = padZero6(mesaCounter);
            listMesas.push({
              provincia: prov,
              distrito: dist,
              colegio: col,
              ubicacionColegio: dir,
              mesa: mesaStr
            });
            mesaCounter++;
          }
        });
      } else {
        var colegios = colegiosReales[d] || [];
        if (colegios.length === 0) {
          var base = 6;
          var tipos = ['I.E. Emblemática', 'I.E.N.', 'I.E. Particular', 'Colegio Nacional', 'I.E. Técnico Industrial', 'I.E. San', 'I.E. Fe y Alegría', 'I.E. Innova Schools'];
          var count = base + (d.length % 3);
          var sliceTipos = tipos.slice(0, count);
          colegios = sliceTipos.map(function(t, i) {
            return i < 2 ? (t + " " + d) : (t + " " + d + " N° " + (1200 + i));
          });
        }
        
        colegios.forEach(function(col) {
          var mesasPorColegio = ((d.length + col.length) % 4) + 4;
          for (var m = 1; m <= mesasPorColegio; m++) {
            var mesaStr = padZero6(mesaCounter);
            var ubCol = col + ", " + d + ", " + p.name;
            listMesas.push({
              provincia: p.name,
              distrito: d,
              colegio: col,
              ubicacionColegio: ubCol,
              mesa: mesaStr
            });
            mesaCounter++;
          }
        });
      }
    });
  });

  // Generar filas para Usuarios (Personeros de Mesa)
  var nombresBase = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Carmen", "Jose", "Rosa", "Pedro", "Sofia", "Jorge", "Lucia", "Miguel", "Elena", "Francisco", "Teresa", "Manuel", "Isabel", "Fernando", "Patricia", "Roberto", "Sonia", "Ricardo", "Silvia", "Hugo", "Gabriela", "Eduardo", "Beatriz", "Diego", "Monica", "Javier", "Laura", "Daniel", "Claudia", "Alejandro", "Alicia", "Raul", "Julia", "Oscar", "Marta", "Gonzalo", "Valeria", "Emilio", "Adriana", "Héctor", "Natalia", "Renato", "Camila", "Marcos", "Vanessa"];
  var apellidosBase1 = ["Quispe", "Flores", "Sánchez", "García", "Rodríguez", "Rojas", "Huamán", "Díaz", "Chávez", "Mamani", "Gómez", "López", "Gonzales", "Pérez", "Torres", "Ramírez", "Ramos", "Espinoza", "Mendoza", "Ruiz", "Castillo", "Vargas", "Gutiérrez", "Castro", "Romero", "Morales", "Herrera", "Fernández", "Medina", "Salazar", "Reyes", "Arias", "Aguilar", "Ortiz", "Silva", "Valenzuela", "Carrasco", "Alvarado", "Ortega", "Guerrero"];
  var apellidosBase2 = ["Palomino", "Dávila", "Bustamante", "Cárdenas", "Paredes", "Córdova", "Vilca", "Paredes", "Salas", "Ccama", "Meza", "Miranda", "Vásquez", "Navarro", "Soto", "Pacheco", "Guzmán", "Delgado", "Villanueva", "Solis", "Peña", "Noriega", "Valdez", "Acosta", "Bermúdez", "Zapata", "Farfán", "Mora", "Montes", "Cabrera", "Pinto", "Abarca", "Zeballos", "Lozano", "Tello", "Cisneros", "Maldonado", "Coronel", "Ríos", "Sarmiento"];

  var userRows = [];
  var userCounter = 1;

  // 1 Personero único por cada Mesa (DNI de 8 dígitos: 10000001, 10000002...)
  listMesas.forEach(function(item) {
    var idVal = userCounter.toString();
    var dniStr = (10000000 + userCounter).toString();
    
    var nIdx = (userCounter - 1) % nombresBase.length;
    var a1Idx = ((userCounter - 1) * 7 + Math.floor((userCounter - 1) / nombresBase.length)) % apellidosBase1.length;
    var a2Idx = ((userCounter - 1) * 13 + Math.floor((userCounter - 1) / apellidosBase1.length)) % apellidosBase2.length;
    
    var nombre = nombresBase[nIdx] + " " + apellidosBase1[a1Idx] + " " + apellidosBase2[a2Idx];
    
    userRows.push([idVal, nombre, dniStr, item.distrito, item.colegio, item.mesa]);
    userCounter++;
  });

  // Super Administrador (DNI de 8 dígitos: 99999999) en hoja Usuarios
  userRows.push([userCounter.toString(), "Super Administrador", "99999999", "", "", ""]);
  userCounter++;
  
  // 1 Coordinador por cada Colegio / Local de Votación en la hoja Usuarios1 (DNI: 20000001, 20000002...)
  var coordRows = [];
  var colegiosUnicosMap = {};
  var coordCount = 1;
  listMesas.forEach(function(item) {
    var keyCol = item.distrito + "|" + item.colegio;
    if (!colegiosUnicosMap[keyCol]) {
      colegiosUnicosMap[keyCol] = true;
      var cNomIdx = (coordCount - 1) % nombresBase.length;
      var cA1Idx = ((coordCount - 1) * 3) % apellidosBase1.length;
      var coordNombre = "Coord. " + nombresBase[cNomIdx] + " " + apellidosBase1[cA1Idx];
      var coordDni = (20000000 + coordCount).toString();
      coordRows.push([coordCount.toString(), coordNombre, coordDni, item.distrito, item.colegio, ""]);
      coordCount++;
    }
  });
 
  // Escribir a la hoja Usuarios (Personeros + Admin)
  if (userRows.length > 0) {
    asegurarFilasSuficientes(userSheet, userRows.length + 10);
    userSheet.getRange(2, 1, userRows.length, 6).setValues(userRows);
  }
  
  // Escribir a la hoja Usuarios1 (Coordinadores)
  if (coordRows.length > 0) {
    asegurarFilasSuficientes(coordUserSheet, coordRows.length + 10);
    coordUserSheet.getRange(2, 1, coordRows.length, 6).setValues(coordRows);
  }
  
  // 3. PESTAÑA: Mesas (Estructura electoral completa con Coordenadas GPS por Colegio)
  var mesasSheet = ss.getSheetByName("Mesas");
  if (!mesasSheet) {
    mesasSheet = ss.insertSheet("Mesas");
  }
  
  mesasSheet.clear();
  mesasSheet.appendRow([
    "Provincia",
    "Distrito",
    "Colegio",
    "Ubicación del Colegio",
    "Número de Mesa",
    "Coordenadas GPS"
  ]);
  
  var rangeMesas = mesasSheet.getRange(1, 1, 1, 6);
  rangeMesas.setFontWeight("bold");
  rangeMesas.setBackground("#0f766e");
  rangeMesas.setFontColor("#ffffff");
 
  var rowsToAppend = [];
  listMesas.forEach(function(item) {
    var ubCol = item.ubicacionColegio || (item.colegio + ", " + item.distrito + ", " + item.provincia);
    var coords = generarCoordenadasColegioScript(item.distrito, item.colegio);
    rowsToAppend.push([item.provincia, item.distrito, item.colegio, ubCol, item.mesa, coords]);
  });
  
  if (rowsToAppend.length > 0) {
    var numRows = rowsToAppend.length;
    var numCols = rowsToAppend[0].length;
    asegurarFilasSuficientes(mesasSheet, numRows + 10);
    mesasSheet.getRange(2, 1, numRows, numCols).setValues(rowsToAppend);
  }
  
  // 4. PESTAÑA: Asistencia (ID, Fecha/Hora, Nombre, DNI, Distrito, Local, Mesa, Foto, Ubicación GPS, 1ra Confirmación, 2da Confirmación)
  var asistenciaSheet = ss.getSheetByName("Asistencia");
  if (!asistenciaSheet) {
    asistenciaSheet = ss.insertSheet("Asistencia");
  }
  asistenciaSheet.clear();
  var headersAsistencia = ["ID", "Fecha/Hora", "Nombre", "DNI", "Distrito", "Local", "Mesa", "Foto", "Ubicación GPS", "1ra Confirmación", "2da Confirmación"];
  asistenciaSheet.appendRow(headersAsistencia);
  var rangeAsistencia = asistenciaSheet.getRange(1, 1, 1, headersAsistencia.length);
  rangeAsistencia.setFontWeight("bold");
  rangeAsistencia.setBackground("#4f46e5");
  rangeAsistencia.setFontColor("#ffffff");
  
  // 5. PESTAÑA: Coordinadores (ID, Fecha/Hora, Personero Nombre, Personero DNI, Distrito, Local, Coordinador Nombre, Coordinador DNI, Confirmacion)
  var coordinadoresSheet = ss.getSheetByName("Coordinadores");
  if (!coordinadoresSheet) {
    coordinadoresSheet = ss.insertSheet("Coordinadores");
  }
  coordinadoresSheet.clear();
  coordinadoresSheet.appendRow([
    "ID",
    "Fecha/Hora",
    "Personero Nombre",
    "Personero DNI",
    "Distrito",
    "Local",
    "Coordinador Nombre",
    "Coordinador DNI",
    "Confirmacion"
  ]);
  var rangeCoordinadores = coordinadoresSheet.getRange(1, 1, 1, 9);
  rangeCoordinadores.setFontWeight("bold");
  rangeCoordinadores.setBackground("#0284c7");
  rangeCoordinadores.setFontColor("#ffffff");
  
  Logger.log("¡Inicialización de 37 columnas (Votos), 6 columnas (Usuarios), estructura de Mesas, Asistencia y Coordinadores completada!");
}

function doPost(e) {
  var response = { success: false, message: "" };
  
  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }
    
    var action = data.action;
    
    if (action === "registrar_votos") {
      response = registrarVotosMultinivel(
        data.brigadista, 
        data.dni, 
        data.ubicacion, 
        data.mesa, 
        data.votos,
        data.origen,
        data.votos_nulos,
        data.votos_vacios,
        data.votos_dist_nulos,
        data.votos_dist_vacios,
        data.departamento,
        data.provincia,
        data.colegio
      );
    } else if (action === "obtener_usuarios" || action === "read") {
      response = obtenerUsuariosSheet();
    } else if (action === "obtener_reporte" || action === "read_reporte") {
      response = handleObtenerReporte();
    } else if (action === "login") {
      response = loginSheet(data.dni || data.nombre, data.nombre || data.dni);
    } else if (action === "registrar_asistencia") {
      response = registrarAsistenciaSheet(
        data.nombre,
        data.dni,
        data.distrito,
        data.local,
        data.mesa,
        data.confirmacion,
        data.fotoBase64,
        data.fotoNombre,
        data.ubicacionGps
      );
    } else if (action === "obtener_asistencia") {
      response = obtenerAsistenciaSheet();
    } else if (action === "confirmar_asistencia_llegada") {
      response = confirmarAsistenciaLlegadaSheet(
        data.nombre,
        data.dni,
        data.distrito,
        data.colegio || data.local,
        data.mesa,
        data.lat,
        data.lon
      );
    } else if (action === "confirmar_coordinador") {
      response = confirmarCoordinadorSheet(
        data.personeroNombre,
        data.personeroDni,
        data.distrito,
        data.local,
        data.coordinadorNombre,
        data.coordinadorDni,
        data.confirmacion,
        data.fotoBase64,
        data.fotoNombre
      );
    } else if (action === "obtener_coordinadores") {
      response = obtenerCoordinadoresSheet();
    } else if (action === "obtener_mesas") {
      response = obtenerMesasSheet();
    } else {
      response.message = "Acción no reconocida";
    }
    
  } catch (error) {
    response.message = "Error en el servidor: " + error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e ? (e.parameter.action || "") : "";
  if (action === "obtener_usuarios" || action === "read") {
    var res = obtenerUsuariosSheet();
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "login") {
    var dniParam = (e.parameter.dni || "").toString().trim();
    var nombreParam = (e.parameter.nombre || "").toString().trim();
    var resLogin = loginSheet(dniParam, nombreParam);
    return ContentService.createTextOutput(JSON.stringify(resLogin))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "obtener_asistencia") {
    var res = obtenerAsistenciaSheet();
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "obtener_coordinadores") {
    var res = obtenerCoordinadoresSheet();
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return handleObtenerReporte();
}

function loginSheet(dniInput, nombreInput) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var searchDni = (dniInput || "").toString().toLowerCase().trim();
  var searchNombre = (nombreInput || "").toString().toLowerCase().trim();

  if (!searchDni && !searchNombre) {
    return { success: false, message: "DNI o Nombre requerido" };
  }

  // Responder al warm-up del cliente de forma inmediata (sin tocar hojas)
  if (searchDni === "__warmup__") {
    return { success: false, message: "warmup" };
  }

  // Superadministrador — shortcut local
  if (
    searchDni === "99999999" ||
    searchDni === "admin#2026$secure!votoreal" ||
    searchDni === "admin" ||
    searchNombre.indexOf("super admin") !== -1
  ) {
    return {
      success: true,
      user: {
        id: "admin-1",
        nombre: "Super Administrador",
        dni: "99999999",
        ubicacion: "LIMA",
        colegio: "CENTRAL",
        mesa: "",
        origenHoja: ""
      }
    };
  }

  // ── BÚSQUEDA POR DNI: TextFinder sobre columna C (la más rápida en GAS) ──
  // No carga toda la hoja — sólo busca en la columna del DNI
  var sheetNames = ["Usuarios", "Usuarios1"];

  if (searchDni) {
    for (var s = 0; s < sheetNames.length; s++) {
      var sheet = ss.getSheetByName(sheetNames[s]);
      if (!sheet) continue;

      var lastRow = sheet.getLastRow();
      if (lastRow < 2) continue;

      // Buscar sólo en columna C (índice 3 en notación A1 = columna DNI)
      var dniRange = sheet.getRange(2, 3, lastRow - 1, 1);
      var finder = dniRange.createTextFinder(searchDni).matchEntireCell(true);
      var found = finder.findNext();

      if (found) {
        var row = found.getRow();
        var rowData = sheet.getRange(row, 1, 1, 6).getValues()[0];
        return {
          success: true,
          user: {
            id: rowData[0] ? rowData[0].toString().trim() : "",
            nombre: rowData[1] ? rowData[1].toString().trim() : "",
            dni: rowData[2] ? rowData[2].toString().trim() : "",
            ubicacion: rowData[3] ? rowData[3].toString().trim() : "",
            colegio: rowData[4] ? rowData[4].toString().trim() : "",
            mesa: rowData[5] ? rowData[5].toString().trim() : "",
            origenHoja: sheetNames[s]
          }
        };
      }
    }
  }

  // ── BÚSQUEDA POR NOMBRE: sólo si no se buscó por DNI ────────────────────
  if (!searchDni && searchNombre) {
    var words = searchNombre.split(/\s+/).filter(function(w) { return w.length >= 2; });
    for (var s = 0; s < sheetNames.length; s++) {
      var sheet = ss.getSheetByName(sheetNames[s]);
      if (!sheet) continue;

      var lastRow = sheet.getLastRow();
      if (lastRow < 2) continue;

      // Cargar sólo columnas A-F (sólo las que necesitamos)
      var allRows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
      for (var i = 0; i < allRows.length; i++) {
        var r = allRows[i];
        var rNombre = r[1] ? r[1].toString().toLowerCase() : "";
        var allMatch = words.every(function(w) { return rNombre.indexOf(w) !== -1; });
        if (allMatch && rNombre) {
          return {
            success: true,
            user: {
              id: r[0] ? r[0].toString().trim() : "",
              nombre: r[1] ? r[1].toString().trim() : "",
              dni: r[2] ? r[2].toString().trim() : "",
              ubicacion: r[3] ? r[3].toString().trim() : "",
              colegio: r[4] ? r[4].toString().trim() : "",
              mesa: r[5] ? r[5].toString().trim() : "",
              origenHoja: sheetNames[s]
            }
          };
        }
      }
    }
  }

  return { success: false, message: "Usuario o DNI no encontrado en las hojas de Usuarios" };
}

function obtenerUsuariosSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var response = { success: true, usuarios: [] };
  var list = [];
  
  var sheetNames = ["Usuarios", "Usuarios1"];
  for (var s = 0; s < sheetNames.length; s++) {
    var sheet = ss.getSheetByName(sheetNames[s]);
    if (!sheet) continue;
    
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var id = r[0] ? r[0].toString().trim() : "";
      var nombre = r[1] ? r[1].toString().trim() : "";
      var dni = r[2] ? r[2].toString().trim() : "";
      var distrito = r[3] ? r[3].toString().trim() : "";
      var colegio = r[4] ? r[4].toString().trim() : "";
      var mesa = r[5] ? r[5].toString().trim() : "";
      
      if (nombre || dni) {
        list.push({ 
          id: id, 
          nombre: nombre, 
          dni: dni, 
          ubicacion: distrito,
          colegio: colegio,
          mesa: mesa,
          origenHoja: sheetNames[s]
        });
      }
    }
  }
  
  response.usuarios = list;
  return response;
}

function validarUsuarioMesa(dni, mesa) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dniStr = dni ? dni.toString().trim() : "";
  var mesaStr = mesa ? mesa.toString().trim() : "";
  
  if (!dniStr) return true;
  if (dniStr === "Admin#2026$Secure!VotoReal" || dniStr.toLowerCase().indexOf("coord") === 0) {
    return true;
  }
  
  if (/^\d+$/.test(mesaStr)) {
    mesaStr = ("000000" + mesaStr).substring(("000000" + mesaStr).length - 6);
  }
  
  var sheetNames = ["Usuarios", "Usuarios1"];
  for (var s = 0; s < sheetNames.length; s++) {
    var sheet = ss.getSheetByName(sheetNames[s]);
    if (!sheet) continue;
    
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var rowDni = rows[i][2] ? rows[i][2].toString().trim() : "";
      var rowMesa = rows[i][5] ? rows[i][5].toString().trim() : "";
      
      if (/^\d+$/.test(rowMesa)) {
        rowMesa = ("000000" + rowMesa).substring(("000000" + rowMesa).length - 6);
      }
      
      if (rowDni === dniStr) {
        if (rowMesa && rowMesa !== mesaStr) {
          return false;
        }
        return true;
      }
    }
  }
  return true;
}

function registrarAsistenciaSheet(nombre, dni, distrito, local, mesa, arg6, arg7, arg8, arg9) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Asistencia");
  var headers = ["ID", "Fecha/Hora", "Nombre", "DNI", "Distrito", "Local", "Mesa", "Foto", "Ubicación GPS", "1ra Confirmación", "2da Confirmación"];
  
  if (!sheet) {
    sheet = ss.insertSheet("Asistencia");
  }
  
  // Forzar actualización de la fila 1 de encabezados para eliminar columnas antiguas
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var rangeHeader = sheet.getRange(1, 1, 1, headers.length);
  rangeHeader.setFontWeight("bold");
  rangeHeader.setBackground("#4f46e5");
  rangeHeader.setFontColor("#ffffff");
  
  var dniStr = dni ? dni.toString().trim() : "";
  var mesaStr = mesa ? mesa.toString().trim() : "";

  if (!validarUsuarioMesa(dniStr, mesaStr)) {
    return {
      success: false,
      message: "Mesa no autorizada: El número de mesa no corresponde a tu mesa asignada."
    };
  }
  
  // Detectar inteligentemente la foto en base64 según el orden de parámetros
  var fotoBase64 = "";
  var fotoNombre = "";
  if (typeof arg6 === "string" && (arg6.indexOf("data:image") === 0 || arg6.length > 300)) {
    fotoBase64 = arg6;
    fotoNombre = arg7 || "";
  } else if (typeof arg7 === "string" && (arg7.indexOf("data:image") === 0 || arg7.length > 300)) {
    fotoBase64 = arg7;
    fotoNombre = arg8 || "";
  }
  
  // Guardar la foto en Google Drive si viene en base64
  var fileUrl = "";
  if (fotoBase64) {
    fileUrl = saveBase64File(fotoBase64, fotoNombre || ("asistencia_brig_" + dniStr + ".jpg"));
  }
  var cellFormula = fileUrl ? '=HYPERLINK("' + fileUrl + '", "Ver Foto")' : "";
  
  // Buscar si ya existe este DNI en Asistencia
  var rows = sheet.getDataRange().getValues();
  var foundRowIndex = -1;
  
  for (var i = 1; i < rows.length; i++) {
    var rowDni = rows[i][3] ? rows[i][3].toString().trim() : "";
    if (rowDni === dniStr) {
      foundRowIndex = i + 1;
      break;
    }
  }
  
  var formattedDate = Utilities.formatDate(new Date(), "America/Lima", "dd/MM/yyyy HH:mm:ss");
  
  if (foundRowIndex !== -1) {
    sheet.getRange(foundRowIndex, 2).setValue(formattedDate);
    sheet.getRange(foundRowIndex, 3).setValue(nombre);
    sheet.getRange(foundRowIndex, 5).setValue(distrito);
    sheet.getRange(foundRowIndex, 6).setValue(local);
    sheet.getRange(foundRowIndex, 7).setValue(mesaStr);
    sheet.getRange(foundRowIndex, 8).setValue(cellFormula);
    
    // No recolectar GPS en 1ra confirmación (se recolecta en 2da confirmación a las 4:45 PM)
    var currentGps = sheet.getRange(foundRowIndex, 9).getValue();
    if (!currentGps) {
      sheet.getRange(foundRowIndex, 9).setValue("");
    }
    sheet.getRange(foundRowIndex, 10).setValue("CONFIRMADA");
    
    // 2da Confirmación se mantiene en blanco hasta presionar el botón a las 4:45 PM
    var valConf2 = sheet.getRange(foundRowIndex, 11).getValue();
    if (!valConf2 || valConf2 === "NO CONFIRMADA") {
      sheet.getRange(foundRowIndex, 11).setValue("");
    }
    
    var fotoExistente = fileUrl;
    if (!fotoExistente) {
      var cellFormulaExistente = sheet.getRange(foundRowIndex, 8).getFormula();
      if (cellFormulaExistente) {
        var match = cellFormulaExistente.match(/HYPERLINK\("([^"]+)"/i);
        if (match && match[1]) {
          fotoExistente = match[1];
        }
      }
      if (!fotoExistente) {
        fotoExistente = sheet.getRange(foundRowIndex, 8).getValue().toString().trim();
      }
    }
    
    return {
      success: true,
      message: "1ra Confirmación registrada en Google Sheets para DNI " + dniStr,
      fotoUrl: fotoExistente
    };
  } else {
    var maxId = 0;
    for (var i = 1; i < rows.length; i++) {
      var val = parseInt(rows[i][0]);
      if (!isNaN(val) && val > maxId) {
        maxId = val;
      }
    }
    var newId = (maxId + 1).toString();
    
    sheet.appendRow([
      newId,
      formattedDate,
      nombre,
      dniStr,
      distrito,
      local,
      mesaStr,
      cellFormula,
      "",             // Ubicación GPS: Vacío en 1ra confirmación
      "CONFIRMADA",   // 1ra Confirmación: CONFIRMADA
      ""              // 2da Confirmación: Vacía (nada) hasta desbloquear el botón a las 4:45 PM
    ]);
    
    return {
      success: true,
      message: "1ra Confirmación registrada para DNI " + dniStr,
      fotoUrl: fileUrl
    };
  }
}

function confirmarAsistenciaLlegadaSheet(nombre, dni, distrito, colegio, mesa, lat, lon) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Asistencia");
  var headers = ["ID", "Fecha/Hora", "Nombre", "DNI", "Distrito", "Local", "Mesa", "Foto", "Ubicación GPS", "1ra Confirmación", "2da Confirmación"];

  if (!sheet) {
    sheet = ss.insertSheet("Asistencia");
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var rangeHeader = sheet.getRange(1, 1, 1, headers.length);
  rangeHeader.setFontWeight("bold");
  rangeHeader.setBackground("#4f46e5");
  rangeHeader.setFontColor("#ffffff");

  var dniStr = dni ? dni.toString().trim() : "";
  var formattedDate = Utilities.formatDate(new Date(), "America/Lima", "dd/MM/yyyy HH:mm:ss");
  var gpsStr = (lat && lon) ? ("Lat: " + lat + ", Lng: " + lon) : "Lat: -12.039458, Lng: -77.090072";

  var rows = sheet.getDataRange().getValues();
  var foundRowIndex = -1;

  for (var i = 1; i < rows.length; i++) {
    var rowDni = rows[i][3] ? rows[i][3].toString().trim() : "";
    if (rowDni === dniStr) {
      foundRowIndex = i + 1;
      break;
    }
  }

  if (foundRowIndex !== -1) {
    sheet.getRange(foundRowIndex, 2).setValue(formattedDate);
    sheet.getRange(foundRowIndex, 9).setValue(gpsStr);
    sheet.getRange(foundRowIndex, 10).setValue("CONFIRMADA");
    sheet.getRange(foundRowIndex, 11).setValue("CONFIRMADA");
  } else {
    var maxId = 0;
    for (var i = 1; i < rows.length; i++) {
      var val = parseInt(rows[i][0]);
      if (!isNaN(val) && val > maxId) maxId = val;
    }
    var newId = (maxId + 1).toString();
    sheet.appendRow([
      newId,
      formattedDate,
      nombre,
      dniStr,
      distrito,
      colegio,
      mesa || "",
      "",
      gpsStr,
      "CONFIRMADA",
      "CONFIRMADA"
    ]);
  }

  return {
    success: true,
    message: "2da Confirmación registrada en Google Sheets para DNI " + dniStr
  };
}

function obtenerAsistenciaSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Asistencia");
  var response = { success: true, asistencia: [] };
  var headers = ["ID", "Fecha/Hora", "Nombre", "DNI", "Distrito", "Local", "Mesa", "Foto", "Ubicación GPS", "1ra Confirmación", "2da Confirmación"];
  
  if (!sheet) {
    sheet = ss.insertSheet("Asistencia");
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold");
    range.setBackground("#4f46e5");
    range.setFontColor("#ffffff");
    return response;
  }
  
  var rows = sheet.getDataRange().getValues();
  var formulas = [];
  if (rows.length > 1) {
    formulas = sheet.getRange(1, 8, rows.length, 1).getFormulas();
  }
  var list = [];
  
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var id = r[0] ? r[0].toString().trim() : "";
    var fechaHora = r[1] ? r[1].toString().trim() : "";
    var nombre = r[2] ? r[2].toString().trim() : "";
    var dni = r[3] ? r[3].toString().trim() : "";
    var distrito = r[4] ? r[4].toString().trim() : "";
    var local = r[5] ? r[5].toString().trim() : "";
    var mesa = r[6] ? r[6].toString().trim() : "";
    
    var foto = "";
    if (formulas[i] && formulas[i][0]) {
      var cellFormula = formulas[i][0].toString().trim();
      var match = cellFormula.match(/HYPERLINK\("([^"]+)"/i);
      if (match && match[1]) {
        foto = match[1];
      }
    }
    if (!foto) {
      foto = r[7] ? r[7].toString().trim() : "";
    }
    var ubicacionGps = r[8] ? r[8].toString().trim() : "";
    var confirmacion1 = r[9] ? r[9].toString().trim() : "NO CONFIRMADA";
    var confirmacion2 = r[10] ? r[10].toString().trim() : "NO CONFIRMADA";
    
    if (dni) {
      list.push({
        id: id,
        fechaHora: fechaHora,
        nombre: nombre,
        dni: dni,
        distrito: distrito,
        local: local,
        mesa: mesa,
        confirmacion: confirmacion1 === "CONFIRMADA" ? "SI" : "NO",
        foto: foto,
        ubicacionGps: ubicacionGps,
        estadoLlegada: confirmacion2 === "CONFIRMADA" ? "Presente en horario de conteo (4:45 PM)" : "Presente a tiempo (antes de las 5:00 PM)",
        confirmacion1: confirmacion1,
        confirmacion2: confirmacion2
      });
    }
  }
  
  response.asistencia = list;
  return response;
}

function confirmarCoordinadorSheet(personeroNombre, personeroDni, distrito, local, coordinadorNombre, coordinadorDni, confirmacion, fotoBase64, fotoNombre) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Coordinadores");
  
  if (!sheet) {
    sheet = ss.insertSheet("Coordinadores");
    sheet.appendRow(["ID", "Fecha/Hora", "Personero Nombre", "Personero DNI", "Distrito", "Local", "Coordinador Nombre", "Coordinador DNI", "Confirmacion"]);
    var range = sheet.getRange(1, 1, 1, 9);
    range.setFontWeight("bold");
    range.setBackground("#0284c7");
    range.setFontColor("#ffffff");
  }
  
  var pDniStr = personeroDni ? personeroDni.toString().trim() : "";
  var cDniStr = coordinadorDni ? coordinadorDni.toString().trim() : "";
  
  // Guardar la foto en Google Drive si viene en base64
  var valorConfirmacion = confirmacion || "SI";
  var fileUrl = "";
  if (fotoBase64) {
    fileUrl = saveBase64File(fotoBase64, fotoNombre || ("foto_" + pDniStr + ".jpg"));
    if (fileUrl) {
      valorConfirmacion = '=HYPERLINK("' + fileUrl + '", "Ver Foto")';
    }
  }
  
  var rows = sheet.getDataRange().getValues();
  var foundRowIndex = -1;
  
  for (var i = 1; i < rows.length; i++) {
    var rowDni = rows[i][3] ? rows[i][3].toString().trim() : "";
    if (rowDni === pDniStr) {
      foundRowIndex = i + 1;
      break;
    }
  }
  
  var formattedDate = Utilities.formatDate(new Date(), "America/Lima", "dd/MM/yyyy HH:mm:ss");
  
  if (foundRowIndex !== -1) {
    sheet.getRange(foundRowIndex, 2).setValue(formattedDate);
    sheet.getRange(foundRowIndex, 3).setValue(personeroNombre);
    sheet.getRange(foundRowIndex, 5).setValue(distrito);
    sheet.getRange(foundRowIndex, 6).setValue(local);
    sheet.getRange(foundRowIndex, 7).setValue(coordinadorNombre);
    sheet.getRange(foundRowIndex, 8).setValue(cDniStr);
    sheet.getRange(foundRowIndex, 9).setValue(valorConfirmacion);
    
    var rowRange = sheet.getRange(foundRowIndex, 1, 1, 9);
    if (confirmacion === "NO") {
      rowRange.setFontLine("line-through");
      rowRange.setFontColor("#ef4444");
    } else {
      rowRange.setFontLine("none");
      rowRange.setFontColor("#000000");
    }
    
    return {
      success: true,
      message: "Confirmación de coordinador actualizada para personero " + pDniStr,
      fotoUrl: fileUrl
    };
  } else {
    var maxId = 0;
    for (var i = 1; i < rows.length; i++) {
      var val = parseInt(rows[i][0]);
      if (!isNaN(val) && val > maxId) {
        maxId = val;
      }
    }
    var newId = (maxId + 1).toString();
    
    sheet.appendRow([
      newId,
      formattedDate,
      personeroNombre,
      pDniStr,
      distrito,
      local,
      coordinadorNombre,
      cDniStr,
      valorConfirmacion
    ]);
    
    var lastRow = sheet.getLastRow();
    var rowRange = sheet.getRange(lastRow, 1, 1, 9);
    if (confirmacion === "NO") {
      rowRange.setFontLine("line-through");
      rowRange.setFontColor("#ef4444");
    } else {
      rowRange.setFontLine("none");
      rowRange.setFontColor("#000000");
    }
    
    return {
      success: true,
      message: "Confirmación de coordinador registrada para personero " + pDniStr,
      fotoUrl: fileUrl
    };
  }
}

function obtenerCoordinadoresSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Coordinadores");
  var response = { success: true, coordinadores: [] };
  
  if (!sheet) {
    return response;
  }
  
  var rows = sheet.getDataRange().getValues();
  var list = [];
  
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var id = r[0] ? r[0].toString().trim() : "";
    var fechaHora = r[1] ? r[1].toString().trim() : "";
    var personeroNombre = r[2] ? r[2].toString().trim() : "";
    var personeroDni = r[3] ? r[3].toString().trim() : "";
    var distrito = r[4] ? r[4].toString().trim() : "";
    var local = r[5] ? r[5].toString().trim() : "";
    var coordinadorNombre = r[6] ? r[6].toString().trim() : "";
    var coordinadorDni = r[7] ? r[7].toString().trim() : "";
    var confirmacion = r[8] ? r[8].toString().trim() : "";
    
    if (personeroDni) {
      list.push({
        id: id,
        fechaHora: fechaHora,
        personeroNombre: personeroNombre,
        personeroDni: personeroDni,
        distrito: distrito,
        local: local,
        coordinadorNombre: coordinadorNombre,
        coordinadorDni: coordinadorDni,
        confirmacion: confirmacion
      });
    }
  }
  
  response.coordinadores = list;
  return response;
}

function obtenerInfoMesa(mesaStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var res = { departamento: "Lima", provincia: "Lima", distrito: "", colegio: "", ubicacionColegio: "" };
  var sheet = ss.getSheetByName("Mesas");
  if (!sheet) return res;
  
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var m = (r.length >= 5 && r[4]) ? r[4].toString().trim() : (r[3] ? r[3].toString().trim() : "");
    if (/^\d+$/.test(m)) m = padZero6(m);
    if (m === mesaStr) {
      res.provincia = r[0] ? r[0].toString().trim() : "Lima";
      res.distrito = r[1] ? r[1].toString().trim() : "";
      res.colegio = r[2] ? r[2].toString().trim() : "";
      res.ubicacionColegio = (r.length >= 5) ? (r[3] ? r[3].toString().trim() : "") : "";
      break;
    }
  }
  return res;
}

function registrarVotosMultinivel(brigadista, dni, ubicacion, mesa, votos, origen, votos_nulos, votos_vacios, votos_dist_nulos, votos_dist_vacios, departamento, provincia, colegio) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Votos_Detalle");
  var headers = [
    "ID", "Fecha/Hora", "Personero", "DNI", "Departamento", "Provincia", "Ubicación (Distrito)", "Colegio", "Número de Mesa", "Origen",
    "P_FP (Eduardo Romero) - Candidato", "P_FP (Eduardo Romero) - Votos",
    "P_JP (Gonzalo Alegría) - Candidato", "P_JP (Gonzalo Alegría) - Votos",
    "P_SP (Christian Pardo) - Candidato", "P_SP (Diego Serpa) - Votos",
    "P_FREPAP (Juan Silva) - Candidato", "P_FREPAP (Juan Silva) - Votos",
    "P_VERDE (Yuri Castro) - Candidato", "P_VERDE (Yuri Castro) - Votos",
    "P_MORADO (Néstor de la Rosa) - Candidato", "P_MORADO (Néstor de la Rosa) - Votos",
    "P_NULOS", "P_VACIOS", "P_TOTAL VOTOS",
    "D_FP_Candidato", "D_FP_Votos",
    "D_JP_Candidato", "D_JP_Votos",
    "D_SP_Candidato", "D_SP_Votos",
    "D_FREPAP_Candidato", "D_FREPAP_Votos",
    "D_VERDE_Candidato", "D_VERDE_Votos",
    "D_MORADO_Candidato", "D_MORADO_Votos",
    "D_NULOS", "D_VACIOS", "D_TOTAL VOTOS"
  ];
  
  if (!sheet) {
    sheet = ss.insertSheet("Votos_Detalle");
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold");
    range.setBackground("#1e293b");
    range.setFontColor("#ffffff");
  } else {
    for (var colIdx = 0; colIdx < headers.length; colIdx++) {
      var cell = sheet.getRange(1, colIdx + 1);
      var currentVal = cell.getValue() ? cell.getValue().toString().trim() : "";
      if (!currentVal) {
        cell.setValue(headers[colIdx]);
        cell.setFontWeight("bold");
        cell.setBackground("#1e293b");
        cell.setFontColor("#ffffff");
      }
    }
  }
  
  if (!mesa) {
    return { success: false, message: "El número de mesa es requerido" };
  }
  
  var mesaStr = mesa.toString().trim();
  if (/^\d+$/.test(mesaStr)) {
    mesaStr = padZero6(mesaStr);
  }

  var dniStr = dni ? dni.toString().trim() : "";
  if (!validarUsuarioMesa(dniStr, mesaStr)) {
    return {
      success: false,
      message: "Mesa no autorizada: El número de mesa no corresponde a tu mesa asignada."
    };
  }

  var infoMesa = obtenerInfoMesa(mesaStr);
  var depVal = departamento || "Lima";
  var provVal = provincia || infoMesa.provincia || "Lima";
  var colVal = colegio || infoMesa.colegio || "";

  var timestamp = new Date();
  var origenStr = origen ? origen.toString().trim().toUpperCase() : "MANUAL";
  
  var vNulos = parseInt(votos_nulos) || 0;
  var vVacios = parseInt(votos_vacios) || 0;
  var vDistNulos = parseInt(votos_dist_nulos) || 0;
  var vDistVacios = parseInt(votos_dist_vacios) || 0;

  // Votos Provinciales (Lima)
  var prov = votos.provincial || {};
  var pFP = prov["FP"] || {};
  var pJP = prov["JP"] || {};
  var pSP = prov["SOMOS PERU"] || {};
  var pFREPAP = prov["FREPAP"] || {};
  var pVERDE = prov["VERDE"] || {};
  var pMORADO = prov["MORADO"] || {};
  
  var pFP_cand = pFP.candidato || "";
  var pFP_votos = parseInt(pFP.votos) || 0;
  var pJP_cand = pJP.candidato || "";
  var pJP_votos = parseInt(pJP.votos) || 0;
  var pSP_cand = pSP.candidato || "";
  var pSP_votos = parseInt(pSP.votos) || 0;
  var pFREPAP_cand = pFREPAP.candidato || "";
  var pFREPAP_votos = parseInt(pFREPAP.votos) || 0;
  var pVERDE_cand = pVERDE.candidato || "";
  var pVERDE_votos = parseInt(pVERDE.votos) || 0;
  var pMORADO_cand = pMORADO.candidato || "";
  var pMORADO_votos = parseInt(pMORADO.votos) || 0;
  
  var pTotal = pFP_votos + pJP_votos + pSP_votos + pFREPAP_votos + pVERDE_votos + pMORADO_votos + vNulos + vVacios;
  
  // Votos Distritales
  var dist = votos.distrital || {};
  var dFP = dist["FP"] || {};
  var dJP = dist["JP"] || {};
  var dSP = dist["SOMOS PERU"] || {};
  var dFREPAP = dist["FREPAP"] || {};
  var dVERDE = dist["VERDE"] || {};
  var dMORADO = dist["MORADO"] || {};
  
  var dFP_cand = dFP.candidato || "";
  var dFP_votos = parseInt(dFP.votos) || 0;
  var dJP_cand = dJP.candidato || "";
  var dJP_votos = parseInt(dJP.votos) || 0;
  var dSP_cand = dSP.candidato || "";
  var dSP_votos = parseInt(dSP.votos) || 0;
  var dFREPAP_cand = dFREPAP.candidato || "";
  var dFREPAP_votos = parseInt(dFREPAP.votos) || 0;
  var dVERDE_cand = dVERDE.candidato || "";
  var dVERDE_votos = parseInt(dVERDE.votos) || 0;
  var dMORADO_cand = dMORADO.candidato || "";
  var dMORADO_votos = parseInt(dMORADO.votos) || 0;
  
  var dTotal = dFP_votos + dJP_votos + dSP_votos + dFREPAP_votos + dVERDE_votos + dMORADO_votos + vDistNulos + vDistVacios;
  
  var rows = sheet.getDataRange().getValues();
  var foundRowIndex = -1;
  var nextId = rows.length; 
  
  for (var i = 1; i < rows.length; i++) {
    // Número de Mesa en Col I (8) y Origen en Col J (9)
    var rowMesa = rows[i][8] ? rows[i][8].toString().trim() : "";
    if (/^\d+$/.test(rowMesa)) {
      rowMesa = padZero6(rowMesa);
    }
    var rowOrigen = rows[i][9] ? rows[i][9].toString().trim().toUpperCase() : "";
    
    if (rowMesa === mesaStr && rowOrigen === origenStr) {
      foundRowIndex = i + 1; 
      break;
    }
  }
  
  if (foundRowIndex !== -1) {
    sheet.getRange(foundRowIndex, 2).setValue(timestamp);
    sheet.getRange(foundRowIndex, 3).setValue(brigadista);
    sheet.getRange(foundRowIndex, 4).setValue(dni);
    sheet.getRange(foundRowIndex, 5).setValue(depVal);
    sheet.getRange(foundRowIndex, 6).setValue(provVal);
    sheet.getRange(foundRowIndex, 7).setValue(ubicacion);
    sheet.getRange(foundRowIndex, 8).setValue(colVal);
    sheet.getRange(foundRowIndex, 9).setValue(mesaStr);
    sheet.getRange(foundRowIndex, 10).setValue(origenStr); 
    
    // Provincial columns
    sheet.getRange(foundRowIndex, 11).setValue(pFP_cand);
    sheet.getRange(foundRowIndex, 12).setValue(pFP_votos);
    sheet.getRange(foundRowIndex, 13).setValue(pJP_cand);
    sheet.getRange(foundRowIndex, 14).setValue(pJP_votos);
    sheet.getRange(foundRowIndex, 15).setValue(pSP_cand);
    sheet.getRange(foundRowIndex, 16).setValue(pSP_votos);
    sheet.getRange(foundRowIndex, 17).setValue(pFREPAP_cand);
    sheet.getRange(foundRowIndex, 18).setValue(pFREPAP_votos);
    sheet.getRange(foundRowIndex, 19).setValue(pVERDE_cand);
    sheet.getRange(foundRowIndex, 20).setValue(pVERDE_votos);
    sheet.getRange(foundRowIndex, 21).setValue(pMORADO_cand);
    sheet.getRange(foundRowIndex, 22).setValue(pMORADO_votos);
    sheet.getRange(foundRowIndex, 23).setValue(vNulos);
    sheet.getRange(foundRowIndex, 24).setValue(vVacios);
    sheet.getRange(foundRowIndex, 25).setValue(pTotal);
    
    // Distrital columns
    sheet.getRange(foundRowIndex, 26).setValue(dFP_cand);
    sheet.getRange(foundRowIndex, 27).setValue(dFP_votos);
    sheet.getRange(foundRowIndex, 28).setValue(dJP_cand);
    sheet.getRange(foundRowIndex, 29).setValue(dJP_votos);
    sheet.getRange(foundRowIndex, 30).setValue(dSP_cand);
    sheet.getRange(foundRowIndex, 31).setValue(dSP_votos);
    sheet.getRange(foundRowIndex, 32).setValue(dFREPAP_cand);
    sheet.getRange(foundRowIndex, 33).setValue(dFREPAP_votos);
    sheet.getRange(foundRowIndex, 34).setValue(dVERDE_cand);
    sheet.getRange(foundRowIndex, 35).setValue(dVERDE_votos);
    sheet.getRange(foundRowIndex, 36).setValue(dMORADO_cand);
    sheet.getRange(foundRowIndex, 37).setValue(dMORADO_votos);
    sheet.getRange(foundRowIndex, 38).setValue(vDistNulos);
    sheet.getRange(foundRowIndex, 39).setValue(vDistVacios);
    sheet.getRange(foundRowIndex, 40).setValue(dTotal);
    
    aplicarFormatoCondicional(sheet);
    eliminarDuplicados(sheet);
    
    return { 
      success: true, 
      message: "Resultados actualizados para la Mesa " + mesaStr + " (" + ubicacion + ")" 
    };
  } else {
    sheet.appendRow([
      nextId,
      timestamp, 
      brigadista, 
      dni, 
      depVal,
      provVal,
      ubicacion, 
      colVal,
      mesaStr, 
      origenStr, 
      // Provincial candidates, votes, metrics & total
      pFP_cand, pFP_votos,
      pJP_cand, pJP_votos,
      pSP_cand, pSP_votos,
      pFREPAP_cand, pFREPAP_votos,
      pVERDE_cand, pVERDE_votos,
      pMORADO_cand, pMORADO_votos,
      vNulos,
      vVacios,
      pTotal,
      // Distrital candidates, votes, metrics & total
      dFP_cand, dFP_votos,
      dJP_cand, dJP_votos,
      dSP_cand, dSP_votos,
      dFREPAP_cand, dFREPAP_votos,
      dVERDE_cand, dVERDE_votos,
      dMORADO_cand, dMORADO_votos,
      vDistNulos,
      vDistVacios,
      dTotal
    ]);
    
    aplicarFormatoCondicional(sheet);
    eliminarDuplicados(sheet);
    
    return { 
      success: true, 
      message: "Resultados transmitidos con éxito para la Mesa " + mesaStr + " (" + ubicacion + ")" 
    };
  }
}

function obtenerMesasSheet() {
  SpreadsheetApp.flush();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mesasSheet = ss.getSheetByName("Mesas");
  if (!mesasSheet) return { success: true, mesas_estructura: [] };
  
  var mRows = mesasSheet.getDataRange().getValues();
  var listMesas = [];
  for (var i = 1; i < mRows.length; i++) {
    var r = mRows[i];
    var provincia = r[0] ? r[0].toString().trim() : "";
    var distrito = r[1] ? r[1].toString().trim() : "";
    var colegio = r[2] ? r[2].toString().trim() : "";
    var ubicacionColegio = (r.length >= 4 && r[3]) ? r[3].toString().trim() : "";
    var mesaNum = (r.length >= 5 && r[4]) ? r[4].toString().trim() : "";
    var coordsGps = (r.length >= 6 && r[5]) ? r[5].toString().trim() : "";
    
    if (/^\d+$/.test(mesaNum)) mesaNum = padZero6(mesaNum);
    
    if (distrito || colegio || mesaNum) {
      listMesas.push({
        provincia: provincia,
        distrito: distrito,
        colegio: colegio,
        ubicacionColegio: ubicacionColegio,
        mesa: mesaNum,
        coordenadasGps: coordsGps
      });
    }
  }
  return { success: true, mesas_estructura: listMesas };
}

function handleObtenerReporte() {
  SpreadsheetApp.flush();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Votos_Detalle");
  var response = { success: true, totales_provincial: {}, totales_distrital: {}, mesas: [] };
  
  // Leer la estructura de colegios y mesas desde la pestaña "Mesas"
  var mesasSheet = ss.getSheetByName("Mesas");
  if (!mesasSheet) {
    mesasSheet = ss.insertSheet("Mesas");
  }
  
  var listMesas = [];
  var mesaMap = {};
  
  if (mesasSheet) {
    var mRows = mesasSheet.getDataRange().getValues();
    for (var i = 1; i < mRows.length; i++) {
      var r = mRows[i];
      var provincia = r[0] ? r[0].toString().trim() : "";
      var distrito = r[1] ? r[1].toString().trim() : "";
      var colegio = r[2] ? r[2].toString().trim() : "";
      var ubicacionColegio = (r.length >= 5) ? (r[3] ? r[3].toString().trim() : "") : "";
      var mesaNum = (r.length >= 5 && r[4]) ? r[4].toString().trim() : (r[3] ? r[3].toString().trim() : "");
      var coordsGps = (r.length >= 6 && r[5]) ? r[5].toString().trim() : "";
      if (/^\d+$/.test(mesaNum)) {
        mesaNum = padZero6(mesaNum);
      }
      if (distrito && mesaNum) {
        listMesas.push({
          provincia: provincia,
          distrito: distrito,
          colegio: colegio || ("Local de votación " + distrito),
          ubicacionColegio: ubicacionColegio || ("Local de votación " + colegio + ", " + distrito),
          mesa: mesaNum,
          coordenadasGps: coordsGps
        });
        mesaMap[mesaNum] = true;
      }
    }
  }

  // Combinar mesas y colegios creados dinámicamente en la pestaña de Usuarios
  var usuariosSheet = ss.getSheetByName("Usuarios");
  if (usuariosSheet) {
    var uRows = usuariosSheet.getDataRange().getValues();
    for (var j = 1; j < uRows.length; j++) {
      var ur = uRows[j];
      var uDistrito = ur[3] ? ur[3].toString().trim() : "";
      var uColegio = ur[4] ? ur[4].toString().trim() : "";
      var uMesaNum = ur[5] ? ur[5].toString().trim() : "";
      if (/^\d+$/.test(uMesaNum)) {
        uMesaNum = padZero6(uMesaNum);
      }
      if (uDistrito && uMesaNum) {
        if (!mesaMap[uMesaNum]) {
          listMesas.push({
            provincia: "Lima Metropolitana",
            distrito: uDistrito,
            colegio: uColegio || ("Local de votación " + uDistrito),
            mesa: uMesaNum
          });
          mesaMap[uMesaNum] = true;
        }
      }
    }
  }

  if (listMesas.length > 0) {
    response.mesas_estructura = listMesas;
  }

  if (!sheet) {
    return response;
  }
  
  var rows = sheet.getDataRange().getValues();
  var tpFP = 0, tpJP = 0, tpSP = 0, tpFREPAP = 0, tpVERDE = 0, tpMORADO = 0, tpNulos = 0, tpVacios = 0, tpTotal = 0;
  var tdFP = 0, tdJP = 0, tdSP = 0, tdFREPAP = 0, tdVERDE = 0, tdMORADO = 0, tdNulos = 0, tdVacios = 0, tdTotal = 0;
  var mesas = [];
  
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    
    // Provincial
    var vpFP = parseInt(r[11]) || 0;
    var vpJP = parseInt(r[13]) || 0;
    var vpSP = parseInt(r[15]) || 0;
    var vpFREPAP = parseInt(r[17]) || 0;
    var vpVERDE = parseInt(r[19]) || 0;
    var vpMORADO = parseInt(r[21]) || 0;
    var vpNulos = parseInt(r[22]) || 0;
    var vpVacios = parseInt(r[23]) || 0;
    var vpTotal = parseInt(r[24]) || 0;
    
    tpFP += vpFP;
    tpJP += vpJP;
    tpSP += vpSP;
    tpFREPAP += vpFREPAP;
    tpVERDE += vpVERDE;
    tpMORADO += vpMORADO;
    tpNulos += vpNulos;
    tpVacios += vpVacios;
    tpTotal += vpTotal;
    
    // Distrital
    var vdFP = parseInt(r[26]) || 0;
    var vdJP = parseInt(r[28]) || 0;
    var vdSP = parseInt(r[30]) || 0;
    var vdFREPAP = parseInt(r[32]) || 0;
    var vdVERDE = parseInt(r[34]) || 0;
    var vdMORADO = parseInt(r[36]) || 0;
    var vdNulos = parseInt(r[37]) || 0;
    var vdVacios = parseInt(r[38]) || 0;
    var vdTotal = parseInt(r[39]) || 0;
    
    tdFP += vdFP;
    tdJP += vdJP;
    tdSP += vdSP;
    tdFREPAP += vdFREPAP;
    tdVERDE += vdVERDE;
    tdMORADO += vdMORADO;
    tdNulos += vdNulos;
    tdVacios += vdVacios;
    tdTotal += vdTotal;
    
    mesas.push({
      fecha: r[1],
      brigadista: r[2],
      dni: r[3],
      departamento: r[4] || "Lima",
      provincia: r[5] || "Lima",
      ubicacion: r[6],
      colegio: r[7] || "",
      mesa: r[8],
      origen: r[9] || "MANUAL",
      votos_provincial: { FP: vpFP, JP: vpJP, SP: vpSP, FREPAP: vpFREPAP, VERDE: vpVERDE, MORADO: vpMORADO, NULOS: vpNulos, VACIOS: vpVacios, total: vpTotal },
      votos_distrital: { FP: vdFP, JP: vdJP, SP: vdSP, FREPAP: vdFREPAP, VERDE: vdVERDE, MORADO: vdMORADO, NULOS: vdNulos, VACIOS: vdVacios, total: vdTotal }
    });
  }
  
  response.totales_provincial = {
    FP: tpFP, JP: tpJP, SOMOS_PERU: tpSP, FREPAP: tpFREPAP, VERDE: tpVERDE, MORADO: tpMORADO, NULOS: tpNulos, VACIOS: tpVacios, total: tpTotal
  };
  response.totales_distrital = {
    FP: tdFP, JP: tdJP, SOMOS_PERU: tdSP, FREPAP: tdFREPAP, VERDE: tdVERDE, MORADO: tdMORADO, NULOS: tdNulos, VACIOS: tdVacios, total: tdTotal
  };
  response.mesas_escrutadas = mesas.length;
  response.mesas = mesas;
  
  return response;
}

function aplicarFormatoCondicional(sheet) {
  try {
    sheet.clearConditionalFormatRules();
    
    var rules = [];
    
    var ruleManual = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("MANUAL")
      .setBackground("#e0f2fe") 
      .setFontColor("#0369a1")  
      .setRanges([sheet.getRange("J2:J10000")])
      .build();
    rules.push(ruleManual);
    
    var ruleImagen = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("IMAGEN")
      .setBackground("#f3e8ff") 
      .setFontColor("#6b21a8")  
      .setRanges([sheet.getRange("J2:J10000")])
      .build();
    rules.push(ruleImagen);
    
    sheet.setConditionalFormatRules(rules);
  } catch (err) {
    Logger.log("Error al aplicar formato condicional: " + err.toString());
  }
}

function padZero6(num) {
  var s = "000000" + num;
  return s.substring(s.length - 6);
}

function obtenerMesasRealesAnconYAte() {
  var rawData = [
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
  
  var expanded = [];
  rawData.forEach(function(item) {
    var dist = item[0];
    var col = item[1];
    var start = item[2];
    var end = item[3];
    var dir = item[4] || ("Local de votación " + col + ", " + dist);
    for (var m = start; m <= end; m++) {
      expanded.push([dist, col, dir, padZero6(m)]);
    }
  });
  return expanded;
}

function eliminarDuplicados(sheet) {
  try {
    var data = sheet.getDataRange().getValues();
    var uniqueKeys = {};
    var rowsToDelete = [];
    
    // Recorremos de abajo hacia arriba para mantener el registro más reciente
    for (var i = data.length - 1; i >= 1; i--) {
      var mesa = data[i][8] ? data[i][8].toString().trim() : "";
      if (/^\d+$/.test(mesa)) {
        mesa = padZero6(mesa);
      }
      var origen = data[i][9] ? data[i][9].toString().trim().toUpperCase() : "";
      
      if (mesa && origen) {
        var key = mesa + "_" + origen;
        if (uniqueKeys[key]) {
          rowsToDelete.push(i + 1); // 1-indexed row number
        } else {
          uniqueKeys[key] = true;
        }
      }
    }
    
    // Eliminar las filas de abajo hacia arriba para no alterar los índices
    rowsToDelete.forEach(function(rowNum) {
      sheet.deleteRow(rowNum);
    });
  } catch (err) {
    Logger.log("Error al eliminar duplicados: " + err.toString());
  }
}

function saveBase64File(base64Data, fileName) {
  try {
    var folderName = "VotoReal_Fotos_Asistencia";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (errSharing) {
        Logger.log("No se pudo establecer permisos para la carpeta: " + errSharing.toString());
      }
    }
    
    var contentPart = base64Data;
    var contentType = "image/jpeg";
    
    if (base64Data.indexOf(",") !== -1) {
      var parts = base64Data.split(",");
      contentPart = parts[1];
      var metaPart = parts[0];
      if (metaPart.indexOf(":") !== -1 && metaPart.indexOf(";") !== -1) {
        contentType = metaPart.split(";")[0].split(":")[1];
      }
    }
    
    var decoded = Utilities.base64Decode(contentPart);
    var blob = Utilities.newBlob(decoded, contentType, fileName);
    var file = folder.createFile(blob);
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (errSharing) {
      Logger.log("No se pudo establecer permisos para el archivo: " + errSharing.toString());
    }
    
    return file.getUrl();
  } catch (e) {
    Logger.log("Error en saveBase64File: " + e.toString());
    return "";
  }
}

/**
 * Retorna la estructura electoral completa de locales y número de mesas importada de mesas.xlsx
 * Array de: [Provincia, Distrito, Colegio/Local, Dirección, CantidadTotalMesas]
 */

/**
 * Retorna la estructura electoral completa de locales y número de mesas importada de mesas.xlsx (1986 locales, 26353 mesas)
 * Array de: [Provincia, Distrito, Colegio/Local, Dirección, CantidadTotalMesas]
 */
function obtenerListaElectoralOficialExcel() {
  return [["LIMA","ANCON","IE 8193","AV LEONCIO PRADO SN",8],["LIMA","ANCON","IEP MY EP MARKO JARA SCHENONE","AV MARKO JARA SCHENONE MZ R KM 38.5",14],["LIMA","ANCON","IE 3069 GENERALISIMO JOSE DE SAN MARTIN","AV JULIO C TELLO SN",21],["LIMA","ANCON","IE 2066 ALMIRANTE MIGUEL GRAU","AV LOS EUCALIPTOS SN",26],["LIMA","ANCON","IE CARLOS GUTIERREZ MERINO","PROL LOA 875",14],["LIMA","ANCON","IE NUESTRA SEÑORA DE LA PAZ","AV AMAZONAS SN",15],["LIMA","ANCON","IEP DIOS ES AMOR","MZ D LT 8",21],["LIMA","ANCON","IEP EL CARMELO","MZ A LT 1-2 URB LA PERA",15],["LIMA","ANCON","IE 3098 CESAR VALLEJO","AV B SN LOS ROSALES",21],["LIMA","ANCON","IE EN CONVENIO 3721 SANTA ROSA","AV LAS COLINAS SN",9],["LIMA","ATE","IE 1208 SAN FRANCISCO DE ASIS","CALLE CAMINO REAL MZ N LT 3",10],["LIMA","ATE","IE 1254 MARIA REICHE NEWMANN","AV MONTEVERDE SN MZ X LOTE 2 AA HH ALFA OMEGA",19],["LIMA","ATE","IE 1265 SANTA ROSA DE LIMA","PRL ZONA N UCV 176",8],["LIMA","ATE","IE 1271 COLEGIO SAN JUAN BAUTISTA","AV JOSE CARLOS MARIATEGUI SN ZONA P",9],["LIMA","ATE","IE 1283 OKINAWA","COOPERATIVA RAMIRO PRIALE MZ D LOTE 37",12],["LIMA","ATE","IE 1288 ALBERT EINSTEIN","ASOCIACION ROSAL DE SANTA ANITA ETAPA 2 MZ B LOTE 7",7],["LIMA","ATE","IE 1289","UCV 206 C LOTE 189 ZONA R",8],["LIMA","ATE","IE 154 LOS CLAVELES","CALLE ASOCIACION LOS CLAVELES SN",4],["LIMA","ATE","IE 171 VIRGEN DEL CARMEN","PJE SN UCV 107 ZONA G",6],["LIMA","ATE","IE 185 SEÑOR DE LOS MILAGROS","CALLE 11 UCV 124 ZONA H - HUAYCAN",5],["LIMA","ATE","IE 207 DIVINO NIÑO JESUS","AV JOSE CARLOS MARIATEGUI SN ZONA P",7],["LIMA","ATE","IEP ALFRED NOBEL","AV MARCO PUENTE LLANOS MZ G LT 2A",32],["LIMA","ATE","IEP INNOVA SCHOOLS - ATE VITARTE","AV 26 DE MAYO MZ C TL 26 URB ZAVALETA",19],["LIMA","ATE","IEP INTERNACIONAL ELIM HUAYCAN","AV LOS INCAS MZ I LT 1 URB EL DESCANSO - HUAYCAN",10],["LIMA","ATE","IEP LOS ANGELES","MZ V LOTE 16 COOPERATIVA MANYLSA",10],["LIMA","ATE","IEP NEW SCHOOL","PROL AV 15 DE JULIO LOTE 49-50-51 ZONA D HUAYCAN",20],["LIMA","ATE","IEP EDUARDO PALACI","AV PROGRESO 1032 SAN GREGORIO",11],["LIMA","ATE","IEP SALECIAN INNOVA (EX ALEXANDER GRAHAM BELL)","MZ H LOTE 22-23 RESIDENCIAL EL LUCUMO - HUAYCAN",5],["LIMA","ATE","IEP SANTA TERESITA","CALLE SANTA TERESA 122",7],["LIMA","ATE","IE 0024 PEDRO ENRIQUE GONZALES SOTO","AV JOSE CARLOS MARIATEGUI 835",12],["LIMA","ATE","IE 0026 AICHI NAGOYA","CALLE LOS JAZMINES SN AAHH 25 DE JULIO",12],["LIMA","ATE","IE 0032 RAUL PORRAS BARRENECHEA","CALLE 6 SN",8],["LIMA","ATE","IE 0034","CARRETERA CENTRAL 7.5 KM",17],["LIMA","ATE","IE 0067 SANTA ELENA","AV SIMON BOLIVAR 160",5],["LIMA","ATE","IE 0074 FERNANDO BELAUNDE TERRY","AV MARISCAL DOMINGO NIETO 203",18],["LIMA","ATE","IE 1135 SANTA CLARA","AV SANTA ROSA SN",9],["LIMA","ATE","IE 1136 JOHN F. KENNEDY","JR DIEGO FERNANDEZ 237 SALAMANCA",8],["LIMA","ATE","IE 1138 JOSE ABELARDO QUIÑONES","JR MELITON CARBAJAL 200 - VALDIVIEZO",16],["LIMA","ATE","IE 1142 SEÑOR DE LOS MILAGROS","MZ C3 3ERA ETAPA CERES",7],["LIMA","ATE","IE 1143 DOMINGO FAUSTINO SARMIENTO","PLAZA PRINCIPAL DE VITARTE SN",18],["LIMA","ATE","IE 1203 DIVINO NIÑO JESUS DE MANYLSA","MZ O LT 1 - COOP. MANYLSA",7],["LIMA","ATE","IE 1209 GRAN MARISCAL TORIBIO DE LUZURIAGA","CALLE VULCANO 116 - URB OLIMPO",14],["LIMA","ATE","IE 1212 GRUMETE MEDINA","PJE JUAN SIFUENTES 205",12],["LIMA","ATE","IE 1213 LA GLORIA","CALLE B GLORIA GRANDE PARQUE CENTRAL KM 14",20],["LIMA","ATE","IE 1222 HUSARES DE JUNIN","CALLE SAN MARTIN MZ F LT13 URB TILDA",15],["LIMA","ATE","IE 1226 SOL DE VITARTE","CALLE ALFA SN MZ D LT 1 - SECTOR E",16],["LIMA","ATE","IE 1227 INDIRA GANDHI","CALLE RIO NAPO SN",17],["LIMA","ATE","IE 1228 LEONCIO PRADO GUTIERREZ","CALLE LOS CLAVELES 300",11],["LIMA","ATE","IE 1229 JULIO ALBERTO PONCE ANTUNEZ DE MAYOLO","CALLE CUZCO 199 COOP 27 ABRIL",12],["LIMA","ATE","IE 1231 JOSE LUIS BUSTAMANTE Y RIVERO","JR MONTEVIDEO MZ F LT 2",8],["LIMA","ATE","IE 1236 ALFONSO BARRANTES LINGAN","CALLE 1 ZONA A HUAYCAN SN",21],["LIMA","ATE","IE 1237 JORGE DIOMEDES GILES LLANOS","CALLE F SN HORACIO ZEVALLOS",14],["LIMA","ATE","IE 1239 FORTALEZA","CALLE LA UNION SN Y JR BOLOGNESI",5],["LIMA","ATE","IE 1244 MICAELA BASTIDAS","PROL AV LOS PORTALES DE PURUCHUCO PUERTA 3",13],["LIMA","ATE","IE 1245 JOSE CARLOS MARIATEGUI","ZONA N - HUAYCAN",20],["LIMA","ATE","IE 1248 5 DE ABRIL","AV 15 DE JULIO ZONA G HUAYCAN",33],["LIMA","ATE","IE 1290 NUEVA AMERICA","MZ H LT 1Y2 ASOCIACION DE RESIDENTES NUEVO AMERICA",17],["LIMA","ATE","IE 1249 JAVIER HERAUD","CALLE PRINCIPAL SN MZ L LT 7",4],["LIMA","ATE","IE 1251 PERUANO SUIZO","MZ R LT 5 ASOCIACION DE VIVIENDA HIJOS DE APURIMAC ZONA 3",14],["LIMA","ATE","IE 1255 WALTER PEÑALOZA RAMELLA","UCV 126 LT 26 ZONA H - HUAYCAN",31],["LIMA","ATE","IE 1257 REINO UNIDO DE GRAN BRETAÑA","CALLE 7 SN ZONA D HUAYCAN",10],["LIMA","ATE","IE 1258 SEBASTIAN LORENTE IBAÑEZ","AV 15 DE JULIO SN ZONA E HUAYCAN",6],["LIMA","ATE","IE 1260 EL AMAUTA","CALLE 9 ZONA L - AV SAN MARCOS SN - HUAYCAN",27],["LIMA","ATE","IE 1262 EL AMAUTA JOSE CARLOS MARIATEGUI","AV SAN JUAN BAUTISTA SN",17],["LIMA","ATE","IE 1268 GUSTAVO MOHME LLONA","AV 15 DE JULIO LOTE 4 ZONA K HUAYCÁN",14],["LIMA","ATE","IE 1279","AV PROLONGACION 15 DE JUNIO SN ZONA R HUAYCAN",16],["LIMA","ATE","IE 6039 FERNANDO CARBAJAL SEGURA","AV MARGINAL SN - EL CARMEN DE MONTERRICO",29],["LIMA","ATE","IE AKIRA KATO","HORACIO ZEBALLOS SN GRUPO J - HUAYCAN",6],["LIMA","ATE","IE 0029 CORONEL PNP MARCO PUENTE LLANOS","CALLE SAN PEDRO MZ H SN ASOCIACION VILLA VITARTE",11],["LIMA","ATE","IE COLEGIO NACIONAL DE VITARTE","JR SANTA MARIA 26 DE MAYO SN",19],["LIMA","ATE","IE FE Y ALEGRIA 53","UCV 56 ZONA C HUAYCAN",16],["LIMA","ATE","IE JULIO C TELLO","PROL HUAROCHIRI SN PARQUE 5 ASOCIACIÓN DE VIVIENDA FORTALEZA",18],["LIMA","ATE","IE 1264 JUAN ANDRES VIVANCO AMORIN","CALLE ITALIA 130 - LOS PORTALES DE JAVIER PRADO",27],["LIMA","ATE","IE MIXTO HUAYCAN","AV PROL 15 DE JULIO ZONA D HUAYCAN",27],["LIMA","ATE","IE NUESTRA SEÑORA DE LA ESPERANZA","CALLE SULLANA SN",10],["LIMA","ATE","IE RICARDO PALMA","CALLE DURANGO SN",9],["LIMA","ATE","IE 046 VICTOR RAUL HAYA DE LA TORRE INEI","CALLE  PRINCIPAL SN",18],["LIMA","ATE","IE EDELMIRA DEL PANDO","PASAJE SANTA TERESA SN",20],["LIMA","ATE","IE 0025 SAN MARTIN DE PORRES","AV PROGRESO SN",28],["LIMA","ATE","IEP INCA GARCILASO DE LA VEGA","AV LOS VIRREYES 2055 III ETAPA CERES",33],["LIMA","ATE","IEP SAN IGNACIO SCHOOL","CALLE AMAZONAS MZ F LT 1",11],["LIMA","ATE","IEP CRISTO REINA I","AV CENTRAL 601",9],["LIMA","ATE","IEP JOSE MARIA ARGUEDAS ALTAMIRANO","MZ A LT 29 Y 30 RESIDENCIAL PARIACHI 1RA ETAPA",7],["LIMA","ATE","IEP SANTISIMO SALVADOR","PROL JAVIER PRADO SN MZ C LT 22-23",5],["LIMA","ATE","IEP CIENCIAS APLICADAS ALBERT EINSTEIN","UCV 26 LOTE 1 ZONA B HUAYCAN",11],["LIMA","ATE","IEP COLEGIO MAYOR SISTEMA SAN MARCOS","AV JOSE CARLOS MARIATEGUI 839 MZ F LOTE 62",28],["LIMA","ATE","IE 167 LAS PIEDRITAS","AV JOSE CARLOS MARIATEGUI ZONA B",10],["LIMA","ATE","IE 1263 PURUCHUCO","AV PRINCIPAL MZ U LOTE 1 ZONA 1",18],["LIMA","ATE","CEBE 13 JESÚS AMIGO","CALLE COPHENAGUE 104",7],["LIMA","ATE","IEP ALFONSO UGARTE HUAYCAN","UCV 1 LT 3 ZONA A HUAYCAN",6],["LIMA","ATE","IEP JOHN DALTON","CALLE MALAGA 330 URB MAYORAZGO III ETAPA",6],["LIMA","ATE","IEP PEDRO RUIZ GALLO","UCV 8 LT 54 ZONA A HUAYCAN",5],["LIMA","ATE","IEP ROSA DE LA MERCED","CALLE HUSARES DE JUNIN 818",22],["LIMA","ATE","IEP SAN JUAN","CALLE HUAYUCCARI 280",11],["LIMA","ATE","IEP KAROL WOJTYLA - SECUNDARIA","AV NUDO DE VILCANOTA MZ Ñ LT 11-12-13",5],["LIMA","ATE","IEP MAESTRO DIVINO","AV NICOLÁS AYLLÓN 622",9],["LIMA","ATE","IEP SAN BASILIO","AV LAS PALMAS 140",10],["LIMA","ATE","IEP VANGUARDIA ESTUDIANTIL","CALLE OLLANTAYTAMBO 153",8],["LIMA","ATE","IEP SAN LUIS REY DE FRANCIA","JR LOS ALCANFORES 334",7],["LIMA","ATE","IEP UNION LATINO","MZ F LT 8LAS PRADERAS DE PARIACHI II ETAPA",9],["LIMA","ATE","IEP SACRO COURE","MZ E1 LT 2  4 Y 5 TERCERA ETAPA PRADERAS PARIACHI",10],["LIMA","ATE","IEP TARPUY MODERNO","CALLE LAS MERCEDES MZ C LT 1 URB LAS NIEVES",7],["LIMA","ATE","IEP CIENTIFICO ISAAC NEWTON","MZ M LT 4 URB TILDA",8],["LIMA","ATE","IEP TÉCNICO PERUANO CHINO SAN FRANCISCO DE ASIS","AREA DE SERVICIO 9 LT 4 ZONA G HUAYCAN",16],["LIMA","ATE","IEP LUCERITO DE AMOR","AV SINCHI ROCA MZ 35 LT B – SANTA CLARA",7],["LIMA","ATE","IEP SAN ANTONIO DE UMARO","CALLE D MZ E LT 8 VILLA VITARTE",6],["LIMA","ATE","IEP SALESIAN INNOVA SCHOOL","GRUPO B MZ L LT 2 Y 3 13 Y 14",9],["LIMA","ATE","IEP CORAZON DE JESUS DE SANTA CLARA","AV INDEPENDENCIA 309",8],["LIMA","ATE","IEP INTERNACIONAL ELIM","CALLE VISTA ALEGRE MZ M1 LT 44",5],["LIMA","ATE","IEP ANNA JARVIS","UCV 30 LT 51 ZONA B HUAYCAN",5],["LIMA","ATE","IEP JOSÉ INGENIEROS","AV JOSE CARLOS MARIATEGUI LT 8 Y 9 ZONA P",9],["LIMA","ATE","IEP SALESIAN COLLEGE","UCV 74 LT 50 51 ZONA E HUAYCAN",12],["LIMA","ATE","IEP SANTA CATALINA","CALLE VENEZUELA MZ F LT 31-32 LA FLORIDA",9],["LIMA","ATE","IEP NUESTRA SEÑORA DE GUADALUPE","MZ F LT 18- 19 COOPERATIVA LAS PALMERAS",5],["LIMA","ATE","IEP HOWARD SCHOOL","CALLE CRUZ DEL SUR 327 - 331",7],["LIMA","ATE","IEP SANTISIMA VIRGEN DE GUADALUPE DE LAS AMERICAS","MZ B1 LT 3,4 ASOC LAS AMERICAS",8],["LIMA","ATE","IEP INTERNACIONAL DEL PACIFICO","GLORIA BAJA MZ M LT 7-8-9-10",8],["LIMA","ATE","IEP PACIFICO","CALLE LOS VOLCANES SN MZ Q LOTE 35",11],["LIMA","ATE","IEP SACO OLIVEROS DE HUAYCAN","AV ANDRES AVELINO CACERES MZ A LT 3",13],["LIMA","ATE","IEP LAS AMERICAS DE ATE","JR COLOMBIA SN MZ C1 LT 4 ASOC LAS AMERICAS",17],["LIMA","ATE","IEP SACO OLIVEROS DE ATE","PSJE. SORIA 190",36],["LIMA","ATE","IEP SACO OLIVEROS APEIRON ATE INGENIEROS","AV LOS INGENIEROS 417",17],["LIMA","ATE","IEP SACO OLIVEROS DE SALAMANCA","AV LOS PARACAS 895",17],["LIMA","ATE","IEP INNOVA SCHOOL - ATE PURUCHUCO","CALLE HELSINKI LT 3A SECTOR VILLA ALEGRE URB MAYORAZGO Y BARBA",27],["LIMA","ATE","IEP INNOVA SCHOOLS - ATE MAYORAZGO","AV JAVIER PRADO MZ 2 LT 6 SUB 1 SN MZ B LT A",29],["LIMA","ATE","IEP INNOVA SCHOOLS - ATE SANTA CLARA","AV ALFONSO UGARTE 1992 SANTA CLARA",36],["LIMA","ATE","IEP INNOVA SCHOOLS - ATE SANTA MARIA","CALLE FRANCISCO BOLOGNESI 510",21],["LIMA","ATE","IE 1228 LEONCIO PRADO GUTIERREZ- SECUNDARIA","CALLE LOS BOSQUEZ S/N ASOCIACIÓN VIRGEN DEL CARMEN",10],["LIMA","ATE","IE MANUEL GONZALES PRADA","AV. ANDRES AVELINO CÁCERES S/N ZONA O HUAYCAN",23],["LIMA","ATE","IEP SANTIAGO APOSTOL","JR CAHUIDE SN MZ E LOTE 19-20 URBANIZACIÓN EL SOL DE SANTA CLARA",22],["LIMA","ATE","IE 1215 SAN JUAN DE PARIACHI","CARRETERA CENTRAL KM 13 CCPP SAN JUAN DE PARIACHI",9],["LIMA","ATE","IE 1270 JUAN EL BAUTISTA","CALLE ALTO PERU UCV 171 B LOTE 80 ZONA M",10],["LIMA","ATE","IE 1281 SANTA MARIA","CALLE SANTA MARIA SN MZA LOTE AE AAHH SANTA MARIA",5],["LIMA","BARRANCO","CEBE 02 LAURA ALVA SALDAÑA","AV GENERAL EDMUNDO AGUILAR PASTOR 300",15],["LIMA","BARRANCO","IE 6051 MERCEDES INDACOCHEA","AV PANAMERICANA SUR 386",30],["LIMA","BARRANCO","IE 7043 CORAZON DE JESUS","JR 28 DE JULIO 275",6],["LIMA","BARRANCO","IE PARROQUIAL SANTA ROSA","JR TACNA 320",10],["LIMA","BARRANCO","IEP CARMELITAS NEW SCHOOL","JR TEJADITAS 385",6],["LIMA","BARRANCO","IE 7048 MANUEL MONTERO BERNALES","AV MIRAFLORES 406",7],["LIMA","BARRANCO","IE 7049 CAP FAP JOSE ABELARDO QUIÑONES GONZALES","AV JORGE CHAVEZ 489",10],["LIMA","BARRANCO","IE EMBLEMATICA 6052 JOSE MARIA EGUREN","AV MANUEL DE LA FUENTE CHAVEZ 506",30],["LIMA","BARRANCO","IE ENRIQUE ARNAEZ NAVEDA","AV LIMA 209",7],["LIMA","BARRANCO","IE 7053 REINO DE ESPAÑA","AV SAN MARTIN 131",10],["LIMA","BARRANCO","IE 7047 TACNA","CALLE GARCIA Y GARCIA 140",14],["LIMA","BARRANCO","IE 7050 NICANOR RIVERA CACERES","AV MIRAFLORES 200",6],["LIMA","BREÑA","IE 1008 VIRGEN DE LOURDES","JR RECUAY 439",2],["LIMA","BREÑA","IE 1014 REPUBLICA ORIENTAL DEL URUGUAY","JR JORGE CHAVEZ 628",4],["LIMA","BREÑA","IEP COLEGIO LA SALLE","CALLE JORGE CHAVEZ SN",47],["LIMA","BREÑA","IEP ACEP PERUANO CHINO DIEZ DE OCTUBRE","AV MARIANO CORNEJO 1090",7],["LIMA","BREÑA","CEBA PRONOEPSA","JR REPUBLICA DE PORTUGAL 525",4],["LIMA","BREÑA","IE 0002 HERMANO ANSELMO MARIA","AV BOLIVIA 532",10],["LIMA","BREÑA","IE 0004 MARIANO MELGAR PRIMARIA","JR JUSTA GARCIA ROBLEDO 246",11],["LIMA","BREÑA","IE 1003 REPUBLICA DE COLOMBIA","JR CHAMAYA 424",6],["LIMA","BREÑA","IE 1005 JORGE CHAVEZ DARTNELL","JR JORGE CHAVEZ 649",5],["LIMA","BREÑA","IE 1006 MARISCAL ANDRES AVELINO CACERES","JR RECUAY 271",6],["LIMA","BREÑA","IE 1017 SEÑOR DE LOS MILAGROS","JR NAPO 1129",12],["LIMA","BREÑA","IE 1019 CHAVIN","JR CHAVIN 195",8],["LIMA","BREÑA","CEBE BEATRIZ CISNEROS","AV ARICA 1221",5],["LIMA","BREÑA","IE EMBLEMATICA MARIANO MELGAR","PJE MARIANO MELGAR 155",40],["LIMA","BREÑA","IE MICAELA BASTIDAS","JR RESTAURACION  CUADRA 7",20],["LIMA","BREÑA","IEP PARROQUIAL LUZ CASANOVA","JR JUSTA GARCIA ROBLEDO 491",9],["LIMA","BREÑA","IE 0005 ROSA DE SANTA MARIA","JR CARHUAZ 326",70],["LIMA","BREÑA","IEP ESPAÑA ADVENTISTA","AV ESPAÑA 617",7],["LIMA","BREÑA","IEP HERMANO NOE ZEVALLOS ORTEGA","JR OLMEDO 590",15],["LIMA","BREÑA","IE 03 INMACULADA CONCEPCION","AV TINGO MARIA 1655",2],["LIMA","BREÑA","IE 002 MUNDO DE COLORES","JR YAVARI 243",2],["LIMA","BREÑA","IEI 075 SANTA MARIA DE GUADALUPE","JR CHAMAYA 476",1],["LIMA","BREÑA","IE 001 SAN JUDAS TADEO","JR FEDERICO VILLARREAL N 139",3],["LIMA","BREÑA","IEP MARIA DE LA PROVIDENCIA","JR JUSTA GARCIA ROBLEDO SN CUADRA 3",3],["LIMA","BREÑA","UNIVERSIDAD INTERAMERICANA DE DESARROLLO","AV BOLIVIA 626",21],["LIMA","BREÑA","IEP ALBERT EINSTEIN","AV BOLIVIA 678",18],["LIMA","BREÑA","IEP ALBERT EINSTEIN  I","JR PORTUGAL 281",7],["LIMA","BREÑA","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 08","JR IQUIQUE 127",4],["LIMA","BREÑA","CAMPO DEPORTIVO PARIACOTO","JR PARIACOTO 801",4],["LIMA","BREÑA","CETPRO PROMAE BREÑA","JR FRANCISCO MAZZOCHIO 179",2],["LIMA","CARABAYLLO","IE 3512 MARIA PARADO DE BELLIDO","KM 34.5 CARRETERA A CANTA",11],["LIMA","CARABAYLLO","IE 3519 PHILIP P. SAUNDERS","AV HUARANGAL SN",11],["LIMA","CARABAYLLO","IE 8163 SANTIAGO APOSTOL DE PUNCHAUCA","CARRETERA A CANTA SN",5],["LIMA","CARABAYLLO","IE 8171 SAN FRANCISCO","MZ H LT 11",6],["LIMA","CARABAYLLO","IE 8175 CORAZON SAGRADO DE JESUS","AV TUPAC AMARU KM 23",14],["LIMA","CARABAYLLO","IE 8190 PRIMARIA","JR MARIA PARADO DE BELLIDO SN",9],["LIMA","CARABAYLLO","IEP ALBERT EINSTEIN","CALLE LENIN 108",13],["LIMA","CARABAYLLO","IEP HONORES DE CARABAYLLO","MZ A LT 13-14 AV CAUDIVILLA",10],["LIMA","CARABAYLLO","IEP CRAMEX","AV TUPAC AMARU SN - PARCELA 285",35],["LIMA","CARABAYLLO","IE 8190 DEMOCRACIA Y LIBERTAD","JR OSCAR BENAVIDES SN",12],["LIMA","CARABAYLLO","IEP BLAS PASCAL","JR MIGUEL GRAU 429",8],["LIMA","CARABAYLLO","IEP SKINNER","MZ B LT 2-3-7 Y 8 URB CAROLINA",18],["LIMA","CARABAYLLO","IEP ALMA MATER EIRL","JR ANDRES AVELINO CACERES 365",7],["LIMA","CARABAYLLO","IEP EMANUEL","AV JOSE CARLOS MARIATEGUI 186 URB LUCYANA",6],["LIMA","CARABAYLLO","IEP SANTIAGO ANTUNEZ DE MAYOLO","CALLE LOS NOGALES MZ D5 LT 40 URB SAN ANTONIO",6],["LIMA","CARABAYLLO","IEP SANTO DOMINGO EL MAESTRO","AV 5 MZ 69 LT 21-28 TORRE BLANCA",22],["LIMA","CARABAYLLO","IEP SAN ANTONIO DEL ROSARIO","KM 30.5 DE LA CARRETERA A CANTA MARGEN DERECHA",10],["LIMA","CARABAYLLO","IE 8161 MANUEL SCORZA TORRE","CALLE 5 SN",16],["LIMA","CARABAYLLO","CEBE SANTA ROSA DE LIMA","JR SAN LUIS GONZAGA SN",7],["LIMA","CARABAYLLO","IE 2025 PRIMARIA","AVENIDA MANUEL PRADO CDRA 8 SN",13],["LIMA","CARABAYLLO","IE 2037 CIRO ALEGRIA","AV TUPAC AMARU SN",36],["LIMA","CARABAYLLO","IE 2050 REPUBLICA DE ARGENTINA","AV JOSE SACO ROJAS SN",16],["LIMA","CARABAYLLO","IE 2051 EL PROGRESO","JR IGNACIO PRADO 218",9],["LIMA","CARABAYLLO","IE 2080 ANDRES BELLO","AV EL CARMEN SN",9],["LIMA","CARABAYLLO","IE 2084 TROMPETEROS","AV MARIA PARADO DE BELLIDO 195",17],["LIMA","CARABAYLLO","IE 3054 LA FLOR","JR INDUSTRIAL 291",14],["LIMA","CARABAYLLO","IE 3057 SANTA ROSA DE CARABAYLLO","AV TUPAC AMARU 3333",20],["LIMA","CARABAYLLO","IE 3058 VIRGEN DE FATIMA","AV AMADOR MERINO REYNA SN",15],["LIMA","CARABAYLLO","IE 3079 NUESTRA SEÑORA DE LAS MERCEDES","CALLE NICOLASA TORRES SN",19],["LIMA","CARABAYLLO","IE 5174 JUAN PABLO II","CALLE SAN PEDRO SN",15],["LIMA","CARABAYLLO","IE 8155 VICTOR RAUL HAYA DE LA TORRE","JR AUGUSTO SALAVERRY SN",8],["LIMA","CARABAYLLO","IE 8168 LOS ANGELES DE NARANJAL","MZ E LT 02 LOS ANGELES DE NARANJAL",16],["LIMA","CARABAYLLO","IE 8174","JR ANTISUYO SN",6],["LIMA","CARABAYLLO","IE 315 LOS ANGELES Y MARIA","JR SIEMPRE VIVAS SN URB SANTA ISABEL",8],["LIMA","CARABAYLLO","IE JOSE MARIA ARGUEDAS","AV SANCHEZ CERRO SN",36],["LIMA","CARABAYLLO","IE RAUL PORRAS BARRENECHEA","JR LIMA SN CUADRA 4",16],["LIMA","CARABAYLLO","IE SANTA ISABEL","JR LOS ALHELIES SN URB SANTA ISABEL",16],["LIMA","CARABAYLLO","IE TUNGASUCA","AV MARIANO CONDORCANQUI SN URB TUNGASUCA",15],["LIMA","CARABAYLLO","IEI LUIS ENRIQUE I","AV MANUEL PRADO SN 4TO SECTOR EL PROGRESO",8],["LIMA","CARABAYLLO","IEP NUESTRA SEÑORA DE COPACABANA-INICIAL","JR ANDRES AVELINO CACERES 273",14],["LIMA","CARABAYLLO","IEP NUESTRA SEÑORA DE COPACABANA SECUNDARIA","JR ANDRES AVELINO CACERES 225",16],["LIMA","CARABAYLLO","IEP MI CELESTIAL NIÑO JESUS","AV 3 SN ASOC 11 DE NOVIEMBRE MZ A LT 1A",7],["LIMA","CARABAYLLO","IEP VIRGEN DEL CARMEN DE LUMBRERAS","MZ G LT 26-27 ASOC SAN JOSE DE CARABAYLLO",16],["LIMA","CARABAYLLO","IEP MIGUEL ANGEL","MZ D LT 20 URB CAROLINA",9],["LIMA","CARABAYLLO","IEP SCHOOL KING","AV LOMAS DE CARABAYLLO MZ C LT 1-2-3 Y 4",14],["LIMA","CARABAYLLO","IEP INGENIERIA DE TORRE BLANCA","AV TUPAC AMARU 12277 -",17],["LIMA","CARABAYLLO","IEP MARIA AUXILIADORA","AV JOSE SACO ROJAS KM 2.2 SN",10],["LIMA","CARABAYLLO","IE 8184 SAN BENITO","AV LOS CONSTRUCTORES MZ W1 LT 1 - 2 - 3",15],["LIMA","CARABAYLLO","IEP THALES DE MILETO","CALLE E MZ D1 LT 17-18-19 RES LUCYANA",23],["LIMA","CARABAYLLO","IE 8188 FE Y ESPERANZA","AV LOS CONSTRUCTORES SN ASOC VIV CRUZ DEL NORTE",12],["LIMA","CARABAYLLO","IE 3507 CAUDIVILLA","AV CAUDIVILLA MZ A LT 5 ASOC CAUDIVILLA",10],["LIMA","CARABAYLLO","IEP SAN ANTONIO DE CARABAYLLO","PROL LOS LAURELES MZ U1 LT 03 LOS ALAMOS",16],["LIMA","CARABAYLLO","IEP SAN JUAN","MZ B LT 16 ASOC ANGELES DE CHILLON",7],["LIMA","CARABAYLLO","IEP GENERAL OLLANTAY","PROL SANCHEZ CERRO 317",11],["LIMA","CARABAYLLO","IEP INNOVA SCHOOLS - CARABAYLLO ENACE","JR ALIPIO PONCE MZ 31 LT 1 AL 6 LUCYANA",14],["LIMA","CARABAYLLO","IEP SANTO DOMINGO DE GUZMAN","MZ Q LT 9 AL 15 Y DEL 23 AL 30 SANTO DOMINGO",42],["LIMA","CARABAYLLO","IEP JUAN PABLO II","JR LAS BEGONIAS 153",18],["LIMA","CARABAYLLO","IEP UNIVERSITY REYES DE CARABAYLLO","PREDIO CAUDEVILLA HUACOY Y PUNCHAUCA PARCELA 120",10],["LIMA","CARABAYLLO","IEP INNOVA SCHOOLS - CARABAYLLO SAN ANTONIO","JR LOS EUCALIPTOS SN",25],["LIMA","CHACLACAYO","IE 0053 SAN VICENTE DE PAUL","AV EL SOL 599",16],["LIMA","CHACLACAYO","IE 1218 SAN LUIS MARIA DE MONTFORT","HUASCATA MZ M",18],["LIMA","CHACLACAYO","IE 1189 ALBERTO RIVERA Y PIEROLA","AV NICOLAS AYLLON 162",16],["LIMA","CHACLACAYO","IE 1199 MARISCAL RAMON CASTILLA","AV UNION SN",29],["LIMA","CHACLACAYO","IE 1217 JORGE BASADRE GROHMANN","CALLE LAS AZUCENAS 246",16],["LIMA","CHACLACAYO","IE 787 ALMIRANTE MIGUEL GRAU","KM 19.5 CARRETERA CENTRAL",20],["LIMA","CHACLACAYO","IE FELIPE SANTIAGO ESTENOS","CALLE LA LADERA 132",16],["LIMA","CHACLACAYO","IE 1192 FLORENTINO PRAT","AV NICOLAS AYLLON 2032",8],["LIMA","CHORRILLOS","IE 6075 JOSE MARIA ARGUEDAS","AV 24 DE OCTUBRE SN",19],["LIMA","CHORRILLOS","IE 6091 CESAR VALLEJO","AV JORGE BASADRE SN",17],["LIMA","CHORRILLOS","IE 6153 CAP EP AUGUSTO J. GUTIERREZ MENDOZA","AV JUAN VELASCO ALVARADO SN",7],["LIMA","CHORRILLOS","IE 7052 MARIA INMACULADA","AV JOSE OLAYA 176",6],["LIMA","CHORRILLOS","IE 7077 LOS REYES ROJOS","AV ARMATAMBO 125",18],["LIMA","CHORRILLOS","IE ARQUITECTO FERNANDO BELAUNDE TERRY","AV ALAMEDA SUR SN",10],["LIMA","CHORRILLOS","CEBE 12 BEATO EDMUNDO RICE","CALLE VICTOR HUMAREDA SN SANTA LEONOR",10],["LIMA","CHORRILLOS","IEI PARROQUIAL JESUS MAESTRO","JR CARHUARAZO MZ G LT 3",7],["LIMA","CHORRILLOS","IEP CHRISTIAN BARNARD","JR CARHUARAZO MZ E 9 LOTE 5B",5],["LIMA","CHORRILLOS","IEP EL SEMBRADOR","AV CORDILLERA OCCIDENTAL SN",5],["LIMA","CHORRILLOS","IEP ISAAC NEWTON - LA CAMPIÑA","AV LOS PROCERES MZ E LT 9",5],["LIMA","CHORRILLOS","IEP LA CASA DE CARTON","AV ALAMEDA LA ENCANTADA MZ H LOTE 12",6],["LIMA","CHORRILLOS","IEP MARIA REICHE GROSSE NEUMAN","CALLE LOS ROSALES MZ C LT 8",6],["LIMA","CHORRILLOS","IEP SEÑOR DE LUREN","AV SANTA ROSA SN",9],["LIMA","CHORRILLOS","IE LOS INKAS","CALLE 1 Y 7 DE LA ASOCIACION LOS INKAS",10],["LIMA","CHORRILLOS","IEI MILAGRITOS DE JESUS","AV SAN MARTIN SN",6],["LIMA","CHORRILLOS","CETPRO PILOTO JOSE PARDO","AV JOSE OLAYA 217",5],["LIMA","CHORRILLOS","IE PRITE - BUENOS AIRES DE VILLA","AV 28 DE JULIO MZ 26 LT 21",6],["LIMA","CHORRILLOS","IEP MARIANO SANTOS MATEO","CALLE LA CHIRA SN MZ N2 LOTE 2",5],["LIMA","CHORRILLOS","IEP PALAS ATENEA","CALLE PALAS ATENEA 124",19],["LIMA","CHORRILLOS","IEP PROLOG CHORRILLOS - SECUNDARIA","CALLE MARTINICA SN",8],["LIMA","CHORRILLOS","IE 7103 PEDRO PAULET MOSTAJO","CALLE MORRO DE ARICA SN",4],["LIMA","CHORRILLOS","IEP LOS INGENIEROS DE SAN MARCOS","AV LA ALAMEDA SAN MARCOS PARCELA I1 E MZ AG LT 1",10],["LIMA","CHORRILLOS","COLEGIO PARROQUIAL NIÑO JESUS DE PRAGA","AV ALEJANDRO MIGUEL IGLESIAS 451",15],["LIMA","CHORRILLOS","IE 6085 BRIGIDA SILVA DE OCHOA","AV ESCUELA MILITAR 851",25],["LIMA","CHORRILLOS","IE 6090 JOSE OLAYA BALANDRA","AV MACHU PICCHU SN",32],["LIMA","CHORRILLOS","IE 6094 SANTA ROSA","AV SAN FELIPE SN CUADRA 1 SN",23],["LIMA","CHORRILLOS","IE 7034 ENRIQUE NERINI COLLAZOS","CALLE JULIO CALERO CUADRA 3 SN",13],["LIMA","CHORRILLOS","IE 7036 ANGELICA RECHARTE CORRALES","AV JOSE OLAYA 224",7],["LIMA","CHORRILLOS","IE 7037 ARIOSTO MATELLINI ESPINOZA - SECUNDARIA","JR TAMBO REAL MZ G LT 15",9],["LIMA","CHORRILLOS","IE 7038 CORAZON DE JESUS DE ARMATAMBO","AV JULIO C TELLO MZ 9 LT 1",19],["LIMA","CHORRILLOS","IE 7039 MANUEL SCORZA TORRES","CALLE LAS VIOLETAS MZ D LT 4",17],["LIMA","CHORRILLOS","IE 7042 SANTA TERESA DE VILLA","AV ELIAS AGUIRRE CDRA 4 AAHH SANTA TERESA",17],["LIMA","CHORRILLOS","IE 7044 SAN MARTIN DE PORRES","CALLE SATURNINO DEL CASTILLO 261",14],["LIMA","CHORRILLOS","IE 7064 MARIA AUXILIADORA","CALLE SAN JUAN SN",18],["LIMA","CHORRILLOS","IE 7066 ANDRES AVELINO CACERES","AV 12 DE OCTUBRE SN",23],["LIMA","CHORRILLOS","IE 7075 JUAN PABLO II","CALLE 8 SN",20],["LIMA","CHORRILLOS","IE 7076 BRISAS DE VILLA","CALLE LAS BRISAS SN",31],["LIMA","CHORRILLOS","IE GENERAL EMILIO SOYER CABERO","AV ESCUELA MILITAR 1151",30],["LIMA","CHORRILLOS","IE SAGRADO CORAZON","CALLE ENRIQUE NERINI 190",16],["LIMA","CHORRILLOS","IE SAN PEDRO DE CHORRILLOS","CALLE LOS ESTUDIANTES SN",18],["LIMA","CHORRILLOS","IE TUPAC AMARU II","AV SANTA ROSA SN",13],["LIMA","CHORRILLOS","IE VIRGEN DEL MORRO SOLAR","PROL ARIOSTO MATELLINI SN",24],["LIMA","CHORRILLOS","IE JOSE DE LA RIVA AGUERO Y OSMA","AV CARLOS ALCORTA 251",10],["LIMA","CHORRILLOS","IESTP ANTENOR ORREGO ESPINOZA","AV CIRO ALEGRIA SN",18],["LIMA","CHORRILLOS","IEI 59 SANTA LUCIA","AV JUAN CANCIO MONTARELLA 389",6],["LIMA","CHORRILLOS","IE FE Y ALEGRIA 34","AV VILCABAMBA MZ 68 LT 1",7],["LIMA","CHORRILLOS","IEP MARIA INMACULADA","AV CORDILLERA NEGRA MZ E LT 1 - LAS DELICIAS DE VILLA",7],["LIMA","CHORRILLOS","IEP SANTA MARIA DE MATELLINI","AV LOS TROVADORES MZ I2 LT 34 - 35",6],["LIMA","CHORRILLOS","IEP EL BUEN MAESTRO","AV EL SOL MZ Y LT 9C",5],["LIMA","CHORRILLOS","IEP LOS INGENIEROS DE MATELLINI","AV LAS GAVIOTAS Y CALLE LOS GORRIONES 688",6],["LIMA","CHORRILLOS","IEP SANTA TERESA DE JESUS","AV CORDILLERA CENTRAL MZ B 8 LOTE 10 3RA ZONA DELICIAS DE VILLA",7],["LIMA","CHORRILLOS","IEP ANGELES DE JESUS","AV BUENOS AIRES DE VILLA MZ 41 LT 15",5],["LIMA","CHORRILLOS","COLEGIO PAMER CHORRILLOS","AV ALAMEDA SUR 540",9],["LIMA","CHORRILLOS","IEP ABRAHAM MASLOW","ASOCIACIÓN VILLA PALMERAS MZ B LT 13",7],["LIMA","CHORRILLOS","IEP SAN DANIEL","AV ANDRES AVELINO CACERES MZ G LT 35 Y 36",6],["LIMA","CHORRILLOS","IEP EL REY DAVID","MZ M LOTE 25 ASOC MONTECARMELO",5],["LIMA","CHORRILLOS","IE 6092 LOS REYES CATOLICOS","AV SANTA TERESA SN CUADRA 4",7],["LIMA","CHORRILLOS","COLEGIO SAN ALFONSO","JR LOS CANCHIS 145",10],["LIMA","CHORRILLOS","CEP SAN ALFONSO MARIA","CALLE BARATARIA 106",8],["LIMA","CHORRILLOS","COLEGIO MATER ADMIRABILIS","JR PLÉYADES MZ T1 LT 9A 5TA ZONA - LA CAMPIÑA",5],["LIMA","CHORRILLOS","IEP SACO OLIVEROS DE SANTA ISABEL","CALLE PALAS ATENEA MZ S LT 23",19],["LIMA","CHORRILLOS","IEP MI BUEN JESUS","AV LOS INCAS MZ H3 LT 3B",4],["LIMA","CHORRILLOS","IEP HOGAR DEL NIÑO JESUS","CALLE 14 MZ M1 LOTE 25 SAN GENARO",4],["LIMA","CHORRILLOS","IEP LEONCIO PRADO HIGH SCHOOL","CALLE SN MZ 67 LOTE 6",6],["LIMA","CHORRILLOS","IEP PROLOG DE CHORRILLOS - PRIMARIA","AV. CORDILLERA BLANCA MZ 16 LT08, TERCERA ZONA DEICIAS DE VILLA",7],["LIMA","CHORRILLOS","IEP PROLOG DE DELICIAS","AV CORDILLERA VILCANOTA SN MZ F 14 LT 10 URB DELICIAS DE VILLA",24],["LIMA","CHORRILLOS","IEP INNOVA SCHOOLS - CHORRILLOS HORIZONTES","AV ALAMEDA HORIZONTES 310",19],["LIMA","CHORRILLOS","IEP INNOVA SCHOOLS - CHORRILLOS VILLA","CALLE ALAMEDA DON AGUSTO 148",21],["LIMA","CHORRILLOS","IEP INNOVA SCHOOLS - CHORRILLOS LOS FAISANES","AV LOS FAISANES CUADRA 9 SN",23],["LIMA","CHORRILLOS","IEP INNOVA SCHOOLS - CHORRILLOS UNIVERSO 2","CALLE UNIVERSO MZ V LOTE 11 URB LA CAMPIÑA 5TA ZONA",12],["LIMA","CHORRILLOS","IEP INNOVA SCHOOLS - CHORRILLOS UNIVERSO 1","PJE HUANUCO SN MZ S LOTE 21 - B",8],["LIMA","CHORRILLOS","IEP INNOVA SCHOOLS - CHORRILLOS LA CAMPIÑA","PJE VESTA 183",24],["LIMA","CHORRILLOS","IEI LOS CAPULLITOS DE JESUS","CALLE 12 CUADRA 1 SN",4],["LIMA","CIENEGUILLA","IE 219 CESAR AUGUSTO MENDOZA FALCON","AV LOS CIPRESES MZ M1 LOTE 1",3],["LIMA","CIENEGUILLA","IE VICTOR RAUL HAYA DE LA TORRE","PRL CARRETERA LIMA HUAROCHIRI KM 26.5",14],["LIMA","CIENEGUILLA","IE 6018 INMACULADA CONCEPCIÓN HUARANGAL","CALLE CAMINO REAL SN",13],["LIMA","CIENEGUILLA","IE 6088 ROSA DE SANTA MARIA DE CIENEGUILLA","AV SAN MARTIN SN",18],["LIMA","CIENEGUILLA","IE JESUS SACRAMENTADO","AV NUEVA TOLEDO SN LOTE 103",19],["LIMA","CIENEGUILLA","IEP CAMINITOS DEL SABER","AV CAPAC YUPANQUI ZONA A MZ E1 LT 5",12],["LIMA","CIENEGUILLA","IE 6054 QHAPAQ ÑAN","PARQUE PLAZA PRINCIPAL SN - HUAYCAN DE CIENEGUILLA",8],["LIMA","CIENEGUILLA","IEP NEW ALBERT EINSTEIN SCHOOL  SECUNDARIA","AV MAYTA CAPAC MZ A LOTE 03",16],["LIMA","COMAS","IEI 12 INICIAL","JR BLASCO NUÑEZ DE VELA SN",5],["LIMA","COMAS","IE 2005","AV EL RETABLO CUADRA 9 SN",10],["LIMA","COMAS","IE 2030","JR 1 DE MAYO 502",6],["LIMA","COMAS","IE 2033 NUESTRA SEÑORA DE FATIMA","PJE CERVANTES SN",7],["LIMA","COMAS","IE 2035 FERNANDO BELAUNDE TERRY","JR HUAYNA CAPAC SN",5],["LIMA","COMAS","IE 2042 FRAY MARTIN DE PORRES","AV SAN MARTIN 1262",7],["LIMA","COMAS","IE 2043 SANGARARA","JR UNION 551",8],["LIMA","COMAS","IE 2047","JR HABANA SN",9],["LIMA","COMAS","IE 2072 LEV SEMIONOVICH VIGOTSKI","JR LOS JAZMINES MZ C LT 9 URB SOL CHACRACERRO",7],["LIMA","COMAS","IE 3076 SANTA ROSA","AV 28 DE JULIO SN",22],["LIMA","COMAS","IE 326 MARIA MONTESSORI","CALLE LA HABANA CDRA 1 SN",4],["LIMA","COMAS","IEI 371","JR FRANCISCO OLAZABAL SN",4],["LIMA","COMAS","IE 8156 PERUANO ALEMAN","MZV LT 41 LA ALBORADA CALLE LOS JASMINEZ SN",6],["LIMA","COMAS","IE 8186 MARIA JESUS ESPINOZA MATOS","MZ M LT1 3ERA ETAPA TUNGASUCA",8],["LIMA","COMAS","IEI 861","CALLE 22 110",3],["LIMA","COMAS","IEP BAUTISTA FILADELFIA","JR COLMENA 313 AL 325",14],["LIMA","COMAS","IEP DIVINA MISERICORDIA","AV ALAMEDA DEL PINAR MZ LL LT 19-20-21-22",18],["LIMA","COMAS","IEP MARCELINO CHAMPAGNAT","CALLE LAS BEGONIAS MZ W LT 4",6],["LIMA","COMAS","IEP MARIA GORETTI","MZ C1 LT 17-18 URB EL ALAMO",13],["LIMA","COMAS","IEP MI SEGUNDO HOGAR JIREH","JR LOS DIAMANTES 216",4],["LIMA","COMAS","IEP TECHNOLOGY SCHOOLS - RETABLO","PJE 47 MZ C LT 9 URB EL RETABLO",32],["LIMA","COMAS","IE LA ALBORADA FRANCESA","CALLE LOS NARANJOS MZ B2 ZONA B SN",8],["LIMA","COMAS","IE LIBERTAD","JR VENUS SN",22],["LIMA","COMAS","CEBE LOS VIÑEDOS","CALLE LOS NARDOS MZ U LT 2",8],["LIMA","COMAS","IEI LUIS ENRIQUE XVII","JR HUSARES DE JUNIN SN",4],["LIMA","COMAS","IEI LA PASCANA","JR ABRAHAM VALDELOMAR CUADRA 3 SN",7],["LIMA","COMAS","IEP ANGELITOS DE SANTA MARIA","AV FELIPE PINGLO ALVA 349",9],["LIMA","COMAS","IEP HOWARD GARDNER","MZ G LT 10 URB LA HACIENDA",3],["LIMA","COMAS","IEP GENES 2","AV UNIVERSITARIA 8257",9],["LIMA","COMAS","IEP GENES PRIMAVERA","CALLE 2 MZG LT 26 COOPERATIVA PRIMAVERA",4],["LIMA","COMAS","IEP AL GORE","AV REPUBLICA DEL PERU 1179",8],["LIMA","COMAS","IEP RENE DESCARTES","AV RETABLO 162",7],["LIMA","COMAS","IEP SANTA MARIA DE JESUS","JR CAJAMARCA SN",4],["LIMA","COMAS","IE 2007 SAN MARTIN DE PORRES","AV REVOLUCION 1500",6],["LIMA","COMAS","IE 2016 FRANCISCO BOLOGNESI","JR RAMON TRELLES MZ 4 LT 17-18",5],["LIMA","COMAS","IE 2020 MAESTRO JOSE ANTONCIO ENCINAS","PROL LA MAR CDRA 3 SN EL RETABLO",7],["LIMA","COMAS","IE 2022 SINCHI ROCA","JR CAHUIDE SN",21],["LIMA","COMAS","IE 2040 REPUBLICA DE CUBA","AV TUPAC AMARU KM 15 1/2",28],["LIMA","COMAS","IE 2048 JOSE CARLOS MARIATEGUI","JR EDUARDO CORREA SN",29],["LIMA","COMAS","IE 2059 SUECIA","AV MIGUEL GRAU CDRA 3 SN AÑO NUEVO",19],["LIMA","COMAS","IE 2077 SAN MARTIN DE PORRES","JR GERMAN LAPEYRE SN",15],["LIMA","COMAS","IE 2085 SAN AGUSTIN","JR MATEO PUMACAHUA CDRA 3 SN",22],["LIMA","COMAS","IE PERU HOLANDA","AV TUPAC AMARU 200",18],["LIMA","COMAS","IE 2097","JR SAN MIGUEL 198",11],["LIMA","COMAS","IE 2100 JUAN VELASCO ALVARADO","JR BOGOTA 492",21],["LIMA","COMAS","IE 3055 TUPAC AMARU","JR ABRAHAM VALDELOMAR SN",39],["LIMA","COMAS","IE 3060 ALFONSO UGARTE VERNAL","JR LEON PINEDO SN 2DA CDRA",13],["LIMA","COMAS","IE 3061 JORGE CHAVEZ DARTNELL","CALLE 21 DE SETIEMBRE SN",8],["LIMA","COMAS","IE 3062 SANTA ROSA","CALLE REAL 161",11],["LIMA","COMAS","IE 3064","JR JUNIN SN",7],["LIMA","COMAS","IE 3065 VIRGEN DEL CARMEN","JR 6 DE AGOSTO CDRA 6 SN PUEBLO JOVEN EL CARMEN",15],["LIMA","COMAS","IE 3066 SEÑOR DE LOS MILAGROS","CALLE LOS CIPRECES SN",11],["LIMA","COMAS","IE 3077 EL ALAMO","CALLE M MZ B10 LT 1 URB EL ALAMO",5],["LIMA","COMAS","IE 3082 SEÑOR DE LOS MILAGROS","CALLE 7 SN",9],["LIMA","COMAS","IE 3096 FRANZ TAMAYO SOLARES","CALLE 7 SN COOPERATIVA PRIMAVERA",14],["LIMA","COMAS","IE 8157 REPUBLICA DE FRANCIA","CALLE LAS MAGNOLIAS MZ D-1 URB LA ALBORADA",5],["LIMA","COMAS","IE 8160 LOS CHASQUIS","CALLE 21 URB E RETABLO",13],["LIMA","COMAS","IE 8162","CALLE LOS TOPACIOS SN URB SAN EULOGIO",7],["LIMA","COMAS","IE 8173 SANTA ISOLINA","PARQUE 1 SANTA ISOLINA",10],["LIMA","COMAS","IE EMBLEMATICA CARLOS WIESSE","AV TUPAC AMARU 1520",15],["LIMA","COMAS","IE EL AMAUTA","CALLE 36 MZ J1 LT1",7],["LIMA","COMAS","CEBE LUIS BRAILE","AV EL MAESTRO PERUANO 340 - 380",12],["LIMA","COMAS","IE ESTHER FESTINI DE RAMOS OCAMPO","PARQUE EL PARRAL N 2",10],["LIMA","COMAS","IE FE Y ALEGRIA 10","AV TUPAC AMARU KM 14.5 SN",13],["LIMA","COMAS","IE FE Y ALEGRIA 13","JR VISTA ALEGRE SN",16],["LIMA","COMAS","IE FE Y ALEGRIA 8","JR ANGEL MORALES SN",12],["LIMA","COMAS","IE JOSE MARTI","JR MONTEVIDEO CUADRA 2 SN",8],["LIMA","COMAS","IE JUAN PABLO VIZCARDO Y GUZMAN","JR UNION SN",11],["LIMA","COMAS","IE MARISCAL ANDRES AVELINO CACERES DORREGARAY","JR CIRO ALEGRIA SN MZ Z ZONA I",25],["LIMA","COMAS","IE PERUANO SUIZO","CALLE 13A SN",8],["LIMA","COMAS","IE RAMON CASTILLA","PJE SANTA CRUZ 224",9],["LIMA","COMAS","IE SAN CARLOS","JR SAN RAMON SN",10],["LIMA","COMAS","IE SAN FELIPE","JR PACIFICO CDRA 8 SN URB SAN FELIPE",24],["LIMA","COMAS","IE ESTADOS UNIDOS","AV MAESTRO PERUANO CUADRA 1",18],["LIMA","COMAS","IEP MARIO VARGAS LLOSA","MZ C1 LT 7 - 8 COOPERATIVA PRIMAVERA",10],["LIMA","COMAS","IESTP CARLOS CUETO FERNANDINI","AV EL PARRAL CUADRA 1 SN",13],["LIMA","COMAS","IEP HONORES DEL RETABLO","AV UNIVERSITARIA NORTE 7475",7],["LIMA","COMAS","IEP PITAGORAS DE COMAS","CALLE LAS MUSAS 144",6],["LIMA","COMAS","IEP SANTO TOMAS","COOP DE VIVIENDA AÑO NUEVO MZ U LOTE 65",4],["LIMA","COMAS","IE 8170 CESAR VALLEJO","AV JOSE CARLOS MARIATEGUI SN",9],["LIMA","COMAS","IEI LUIS ENRIQUE II","JR TEODORO GARRIDO CUADRA 14",3],["LIMA","COMAS","IEP MARIA MONTESSORI STOPPIANI","AV MICAELA BASTIDAS 503",16],["LIMA","COMAS","IE 3097 LA NACION DE SAN JUDAS TADEO","AAHH 2 DE AGOSTO MZ Q LOTE 6 ZONA E",4],["LIMA","COMAS","IEI 368 ANGELITOS DE JESUS","PARQUE 1 SN MZ G LOTE 1 URB EL PINAR",3],["LIMA","COMAS","IEI CUNA JARDIN SANGARARA","CALLE 32 LOS NARANJOS SN URB EL PINAR",4],["LIMA","COMAS","IE 8181 HEROES DEL ALTO CENEPA","AV B 791",10],["LIMA","COMAS","IEP CANTOR COLLEGE","AV METROPOLITANA 630",11],["LIMA","COMAS","IEP CIENCIAS Y HUMANIDADES","AV METROPOLITANA 539",5],["LIMA","COMAS","IEP GENES EL PINAR","CALLE LOS NARANJOS SN MZ H LT 8 Y 9",16],["LIMA","COMAS","IE 2026 SIMON BOLIVAR","PJE ELIAS AGUIRRE 131",20],["LIMA","COMAS","IEP JESUCRISTO REY DE REYES","AV SINCHI ROCA 1187",4],["LIMA","COMAS","IE 2075 CRISTO HIJO DE DIOS","AV MILAGRO DE JESUS SN",15],["LIMA","COMAS","IE 8158 ISABEL FLORES DE OLIVA","CRUCE DE LA CALLE LOS NARANJOS CON CALLE 58",7],["LIMA","COMAS","IE 3085 VILCA APAZA","CALLE JOSE MARIA PAGADOR SN",8],["LIMA","COMAS","IE 2046 VIRGEN DE LAS MERCEDES","JR LA MERCED 101",5],["LIMA","COMAS","IE 2049","JR PIURA SN",6],["LIMA","COMAS","IEP ALFRED BERNHARD NOBEL","JR PUQUIO 189",5],["LIMA","COMAS","IE CORONEL JOSÉ GALVEZ","JR MICAELA BASTIDAS 1199",10],["LIMA","COMAS","IEP CRISTO RAMOS","JR PERU 381",10],["LIMA","COMAS","IEP DANIEL GOLEMAN","CALLE LAS MARGARITAS 333 - 335",5],["LIMA","COMAS","IEP DIEGO THOMSON","JR PERU 475",8],["LIMA","COMAS","IEP DIOS SUPREMO","CALLE 13 B MZ K LT 14 URB CARABAYLLO",4],["LIMA","COMAS","IEP DIVINO NIÑO DIOS","JR PACHACUTEC 280",6],["LIMA","COMAS","IEP ELEGIDOS DE JESUS","AV PEDRO DE LA GASCA 453",5],["LIMA","COMAS","IE GUIAME SAN MARTIN DE PORRAS","AV METROPOLITANA 1094",5],["LIMA","COMAS","IEP IVAN PAVLOV","JR TACNA 313",9],["LIMA","COMAS","IE 2038 INCA GARCILASO DE LA VEGA","JR SANTA CRUZ 222",17],["LIMA","COMAS","IEP JAIME WHITE","AV MANUEL GONZALES PRADA 139",5],["LIMA","COMAS","IEP JESUS EL MAESTRO","JR LOS CLAVELES 224",15],["LIMA","COMAS","IEP MARIA REICHE","CALLE MARIA REICHE MZ D LOTE 34",6],["LIMA","COMAS","IEP PAUL GROUSSAC - PRIMARIA","AV REPUBLICA DEL PERU 1259",8],["LIMA","COMAS","IEP SANTA MARTA SCHOOL","JR LOS PINOS 298",5],["LIMA","COMAS","IE 2060 VIRGEN DE GUADALUPE","JR MICAELA BASTIDAS 998",17],["LIMA","COMAS","IEP FRANKLIN DELANO ROOSEVELT","CALLE RIO CAPLINA 133",7],["LIMA","COMAS","IEP LA CATOLICA DE COLLIQUE","JR SANTA CLARA MZ E LT 8",5],["LIMA","COMAS","IEP LUZ Y ESPERANZA","AV BELAUNDE ESTE 1860",5],["LIMA","COMAS","IEP PAUL GROUSSAC","CALLE LOS PROCERES 179",8],["LIMA","COMAS","IEP MI BUEN JESUS","PJE 14 111-133-137",10],["LIMA","COMAS","IEP COLEGIO INGENIERIA - SEDE TRAPICHE","MZ V2 LOTE 12 - II ETAPA VIPOL",6],["LIMA","COMAS","IEP MATEMATICO HONORES EL PINAR","CALLE 6 MZ O LOTE 1",8],["LIMA","COMAS","IEP MONSERRAT - SEDE SAN FELIPE","JR CAJAMARCA SN",7],["LIMA","COMAS","IEP SAN JUAN BAUTISTA","CALLE SAN GENARO SN",17],["LIMA","COMAS","IEP  PROLOG","CALLE LOS CEDROS 165",8],["LIMA","COMAS","IEP RENE CRUCHET","CALLE LOS OLIVOS 138",4],["LIMA","COMAS","IEP SACO OLIVEROS","CALLE LOS FRUTALES MZ A1 LT 21",34],["LIMA","COMAS","IEP SAN JOSE DE COMAS","AV BELAUNDE 1708",7],["LIMA","COMAS","IEP LA FE DE MARIA","JR ABRAHAM VALDELOMAR 571 - 596",14],["LIMA","COMAS","IEP GETSEMANI","JR JORGE CHAVEZ 221",4],["LIMA","COMAS","IE 2031 JOSE VALVERDE CARO","AV 3 DE OCTUBRE 1950",16],["LIMA","COMAS","IE 2055 PRIMERO DE ABRIL","AV SAN JUAN BAUTISTA MZ R LT 7",9],["LIMA","COMAS","IEP MILAGROSO SAN MARTIN","JR ANDRES MEDINA 211",8],["LIMA","COMAS","IEP SAN FRANCISCO","AV SANTA ROSA 767 - 3ERA ZONA",4],["LIMA","COMAS","IEP MARIA GORETTI DEL ALAMO","MZ D1 LT 19-20 AV COLLIQUE",9],["LIMA","COMAS","IEI 373","JR PAGADOR SN MZ L-3 LT 19",4],["LIMA","COMAS","IEP SOR ANA DE LOS ANGELES","JR CUSCO 123",8],["LIMA","COMAS","IEP SANTA URSULA DE LAS VEGAS","JR LOS ANGELES 195",4],["LIMA","COMAS","IEP MILAGRITOS DE JESUS","MZ T LT 14 COOPERATIVA DE VIVIENDA PRIMAVERA",4],["LIMA","COMAS","IE 2045","JR ATAHUALPA SN",4],["LIMA","COMAS","COLEGIO TECNICO EXPERIMENTAL JESUS OBRERO","AV REPUBLICA DEL PERÚ 862",11],["LIMA","COMAS","IEP DULCE CORAZÓN DE MARÍA","AV 3 DE OCTUBRE 1801",5],["LIMA","COMAS","IEP INNOVA SCHOOLS SEDE CONDORCANQUI","CALLE IZAGA LOTE 159 A URB CHACRA CENTRO",36],["LIMA","COMAS","IEP INNOVA SCHOOLS SEDE RETABLO","AV VICTOR ANDRES BELAUNDE MZ D LOTE 1",31],["LIMA","COMAS","IEP INGENIERIA DEL RETABLO","AV. JOSE DE LA TORRE UGARTE N°100",8],["LIMA","EL AGUSTINO","IE 046 LOS LIBERTADORES DE AYACUCHO","PJE LOS ANGELES SN",10],["LIMA","EL AGUSTINO","IEI 068 BETHANIA","JR LOS ARTESANOS 140",5],["LIMA","EL AGUSTINO","IE 114 VIRGEN DE CHAPI","JR MELITON CARBAJAL 547",4],["LIMA","EL AGUSTINO","IE 1186 SANTA ROSA DE LIMA MILAGROSA","AV GARCILAZO DE LA VEGA 1151",4],["LIMA","EL AGUSTINO","IE 134 RAMIRO PRIALE","CALLE 7 DE JUNIO 214",9],["LIMA","EL AGUSTINO","ESTADIO MUNICIPAL MARCELINO CCAICO ARONE","AV LAS MAGNOLIAS CDRA 2 SN",26],["LIMA","EL AGUSTINO","IEI HOGAR SAN MARTIN","CALLE GUADALUPE SN",4],["LIMA","EL AGUSTINO","IEP NOTABLE SANTISIMA DE LAS MERCEDES","AV FERROCARRIL MZ H LT 03",12],["LIMA","EL AGUSTINO","IEP SACO OLIVEROS EL AGUSTINO","CALLE LOS MIRLOS SN",25],["LIMA","EL AGUSTINO","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 10","JR RIO CHEPEN 114",44],["LIMA","EL AGUSTINO","IEP ABC CENTER SCHOOL","AV GARCILAZO DE LA VEGA 367 SAN PEDRO",6],["LIMA","EL AGUSTINO","IE 0009 JOSE MARIA ARGUEDAS","PJE NAZARETH SN ASOC DE VIVIENDA CANAAN",6],["LIMA","EL AGUSTINO","IE 0049 ANTONIA MORENO DE CACERES","JR ALONSO PALOMINO 228",8],["LIMA","EL AGUSTINO","IE 0085 JOSE DE LA TORRE UGARTE","CALLE LOS ALGARROBOS SN",19],["LIMA","EL AGUSTINO","IE 0093 FERNANDO BELAUNDE TERRY","AV LOS ALGARROBOS SN",5],["LIMA","EL AGUSTINO","IE 017 CUNA JARDIN","JR MARIANO BALDARRAGO SN",7],["LIMA","EL AGUSTINO","IE 047 SEÑOR DE LOS MILAGROS","AV GARCILASO DE LA VEGA 320",4],["LIMA","EL AGUSTINO","IE 1025 MARIA PARADO DE BELLIDO","JR CAJACAY SN",12],["LIMA","EL AGUSTINO","IE 1044 MARIA REICHE NEWMANN","CALLE LOS CARTUCHOS SN",24],["LIMA","EL AGUSTINO","IE 1045 NUESTRA SEÑORA DE FATIMA","CALLE AGUAS VERDES SN CON RIO CORREINTES SN",15],["LIMA","EL AGUSTINO","IE 1047 JUANA INFANTES VERA","CALLE AGUAJAL SN",10],["LIMA","EL AGUSTINO","IE 112 HEROES DE LA BREÑA","CALLE CARACOL 1040",21],["LIMA","EL AGUSTINO","IE 115 TORIBIO RODRIGUEZ DE MENDOZA","JR LOS LIRIOS 105",10],["LIMA","EL AGUSTINO","IE 1168 GRAN MARISCAL RAMON CASTILLA","AV RIVA AGUERO 1575",11],["LIMA","EL AGUSTINO","IE 1169 ALMIRANTE MIGUEL GRAU SEMINARIO","AV INCA RIPAC SN",10],["LIMA","EL AGUSTINO","IE 1170 JOSE DE LA RIVA AGUERO Y OSMA","CALLE BALBOA SN",10],["LIMA","EL AGUSTINO","IE 1171 JORGE BASADRE GROHMANN","AV INDEPENDIENTE 586",13],["LIMA","EL AGUSTINO","IE 1187 SAN CAYETANO","JR SIMON BOLIVAR 125",3],["LIMA","EL AGUSTINO","IE 127 SAN JOSE","JR LOS BRILLANTES CUADRA UNO SN",10],["LIMA","EL AGUSTINO","IE FE Y ALEGRIA 39","JR RIO CHEPEN SN URB VILLA HERMOSA",15],["LIMA","EL AGUSTINO","IE GRAN MARISCAL ANDRES AVELINO CACERES DORREGARAY","AV RIVA AGUERO 176",39],["LIMA","EL AGUSTINO","IE JOSE CARLOS MARIATEGUI","AV RIVA AGUERO 1758",42],["LIMA","EL AGUSTINO","IE LA PRADERA II","CALLE LAS DUNAS SN MZ RR LT 23",12],["LIMA","EL AGUSTINO","IE NICOLAS DE PIEROLA","JR PATIVILCA SN",14],["LIMA","EL AGUSTINO","IEP PARROQUIAL APOSTOL SAN PEDRO","AV GARCILAZO DE LA VEGA 300",12],["LIMA","EL AGUSTINO","IEP SAN MIGUEL EMPRENDEDOR","PJE SAN MIGUEL 119",6],["LIMA","EL AGUSTINO","IEP IGNACIO MERINO","JR MARISCAL CACERES 298",6],["LIMA","EL AGUSTINO","IEP SANTA ISABEL","PJE JOSE ORBEGOZO 547",5],["LIMA","EL AGUSTINO","CEBE HIPOLITO UNANUE","AV FERROCARRIL MZ C LT 34",4],["LIMA","EL AGUSTINO","IEP SAN ANTONIO","JR CHAVINA 1273",4],["LIMA","EL AGUSTINO","IEP CRISTO LIBERTADOR","MZ N LOTE 8 -9 ASOC DE VIV ANCIETA",6],["LIMA","EL AGUSTINO","IEP ALEXANDER FLEMING","CALLE LAS GAVIOTAS 274",8],["LIMA","EL AGUSTINO","IE 0098 PERU JAPON","AV INDEPENDENCIA SN MZ D LOTE 19",8],["LIMA","EL AGUSTINO","IEP APPU NUEVO PERU","AV RIVA AGUERO 1137",10],["LIMA","EL AGUSTINO","IEP APPU NUEVO PERU - ANEXO","JR ALFONSO UGARTE 224",18],["LIMA","EL AGUSTINO","IE 048 SAN JUAN BOSCO","AV 15 DE ABRIL 344",7],["LIMA","EL AGUSTINO","IEP EL SEMBRADOR","JR JOSE QUÑONES 448",9],["LIMA","INDEPENDENCIA","IEI 0005","AV LEALTAD 477",2],["LIMA","INDEPENDENCIA","IEI 0314 TUPAC AMARU","CALLE 31 SN",2],["LIMA","INDEPENDENCIA","IEI 0390-1 EL ERMITAÑO","AV LOS JAZMINES CUADRA 5",2],["LIMA","INDEPENDENCIA","IE 2054 NUESTRA SEÑORA DE FATIMA","CALLE LAS ENCINAS SN",6],["LIMA","INDEPENDENCIA","IE 3053 VIRGEN DEL CARMEN","AV 23 DE DICIEMBRE SN",4],["LIMA","INDEPENDENCIA","IE 3056 GRAN BRETAÑA","AV CORICANCHA 465",19],["LIMA","INDEPENDENCIA","IEP JESUS EL BUEN PASTOR","CALLE AMAUTA 193",15],["LIMA","INDEPENDENCIA","IEP ROSA DE AMERICA","AV LAS AMERICAS 475",2],["LIMA","INDEPENDENCIA","IEP SOL DE ALEGRIA","JR HUATANAY 298",4],["LIMA","INDEPENDENCIA","PRITE LUIS AQUILES GUERRA","JR JERUSALEN SN",3],["LIMA","INDEPENDENCIA","IE 2032 MANUEL SCORZA TORRES","JR SANCHEZ CERRO SN",19],["LIMA","INDEPENDENCIA","IEP SAN ANTONIO DE PADUA PRIMARIA","JR CANCHAS 199",11],["LIMA","INDEPENDENCIA","IEP SAN ANTONIO DE PADUA SECUNDARIA","AV INDOAMERICA 510",4],["LIMA","INDEPENDENCIA","IE 2041 INCA GARCILASO DE LA VEGA","AV CHINCHAYSUYO 395",5],["LIMA","INDEPENDENCIA","IE 2052 MARIA AUXILIADORA","JR TUNGASUCA 500",12],["LIMA","INDEPENDENCIA","IE 2053 FRANCISCO BOLOGNESI CERVANTES","AV CESAR VALLEJO 1137",16],["LIMA","INDEPENDENCIA","IE 2056 JOSE GALVEZ","AV LOS FICUS 317",6],["LIMA","INDEPENDENCIA","IE 2057 JOSE GABRIEL CONDORCANQUI","AV CAJABAMBA SN",26],["LIMA","INDEPENDENCIA","IE 2058 VIRGEN DE LA MEDALLA MILAGROSA","AV CORICANCHA SN",21],["LIMA","INDEPENDENCIA","IE 2070 NUESTRA SEÑORA DEL CARMEN","AV LOS ALISOS SN",17],["LIMA","INDEPENDENCIA","IE 3049 IMPERIO DEL TAHUANTINSUYO","AV HURIN CUZCO SN",29],["LIMA","INDEPENDENCIA","IE 3050 ALBERTO HURTADO ABADIA","AV TUPAC AMARU 338",8],["LIMA","INDEPENDENCIA","IE 3051 EL MILAGRO","AV 21 DE JUNIO SN",12],["LIMA","INDEPENDENCIA","IE 3063 PATRICIA NATIVIDAD SANCHEZ","AV LAS GLADIOLAS 280",11],["LIMA","INDEPENDENCIA","IE 3094 RAMIRO PRIALE PRIALE","CALLE H1 LT2",14],["LIMA","INDEPENDENCIA","IE 3094-1 J WILLIAM FULBRIGHT","AV HUANACAURE 300",24],["LIMA","INDEPENDENCIA","IE INDEPENDENCIA","AV LOS PINOS 401",19],["LIMA","INDEPENDENCIA","IE LIBERTADOR SAN MARTIN","AV INDOAMERICA 752",12],["LIMA","INDEPENDENCIA","IE REPUBLICA DE COLOMBIA","AV INDOAMERICA SN",16],["LIMA","INDEPENDENCIA","IE 3048 SANTIAGO ANTUNEZ DE MAYOLO","AV LOS JAZMINES 385",11],["LIMA","INDEPENDENCIA","IE 3052","JR LOS EUCALIPTOS 203",15],["LIMA","INDEPENDENCIA","IE 2036 MARIA AUXILIADORA","JR LA REFORMA SN",2],["LIMA","INDEPENDENCIA","IE 2044 VIRGEN DE FATIMA","AV CERRO LOS INCAS SN",6],["LIMA","INDEPENDENCIA","IE 2061 SAN MARTIN DE PORRES","JR LOS INCAS 485",19],["LIMA","INDEPENDENCIA","CORPORACION EDUCATIVA MADRE TERESA DE CALCUTA","CALLE LOS GUAYABOS 199",7],["LIMA","INDEPENDENCIA","IEP CAMBRIGDE COLLEGE","AV LOS SAUCES 334",3],["LIMA","INDEPENDENCIA","IEP JUAN LANDAZURI RICKETTS","JR YAURI 192",5],["LIMA","INDEPENDENCIA","IEP SAN FRANCISCO SOLANO","AV CESAR VALLEJO 1264",7],["LIMA","INDEPENDENCIA","IEP ALFRED BINET MASTER","CALLE 33 199",4],["LIMA","INDEPENDENCIA","IEP JOSE MARIA ARGUEDAS - SECUNDARIA","JR PALLCAMARCA 293",6],["LIMA","INDEPENDENCIA","IEP MONTESSORI SCHOOL","CALLE 32 175",7],["LIMA","INDEPENDENCIA","IEI 0386 VICTOR RAUL HAYA DE LA TORRE","CALLE 1 SECTOR ALAN GARCIA MZ A LOTE 35",6],["LIMA","INDEPENDENCIA","IEP SANTISIMO REDENTOR","JR TINTA 226",8],["LIMA","INDEPENDENCIA","IEP RICARDO PALMA PRIMARIA","JR PALLCAMARCA 302",5],["LIMA","INDEPENDENCIA","IE 0324 SAN JUDAS TADEO","JR YAURI SN",4],["LIMA","INDEPENDENCIA","IEP CATOLICA HIGH SCHOOL","JR HUAYNA CAPAC 138",4],["LIMA","INDEPENDENCIA","IE 390 -3 TAHUANTINSUYO","AV CORICANCHA 3ERA ZONA SN",5],["LIMA","INDEPENDENCIA","IE 2039 JORGE VICTOR CASTILLA MONTERO","CALLE LAS MAGNOLIAS SN",13],["LIMA","INDEPENDENCIA","IE 2034 REPUBLICA DE IRLANDA","JR EDUCACION SN",5],["LIMA","INDEPENDENCIA","IEI 0390-2 EL MILAGRO","LEALTAD SN",4],["LIMA","INDEPENDENCIA","IEP MILAGROSO SAN MARTIN","AV LOS FICUS 130",4],["LIMA","INDEPENDENCIA","IEP PEQUEÑOS BRITANICOS","JR INCA YUPANQUI 342 - 1ERA ZONA DE TAHUANTINSUYO",2],["LIMA","INDEPENDENCIA","IEP HENRY WALLON","JR JOSE FAUSTINO SANCHEZ CARRIÓN 354",3],["LIMA","INDEPENDENCIA","IEP EBENEZER","CALLE LOS PENSAMIENTOS 261",5],["LIMA","INDEPENDENCIA","IEP TECHNOLOGY SCHOOLS DE INDEPENDENCIA","JR HUATANAY 305",10],["LIMA","INDEPENDENCIA","IEP CESAR VALLEJO DE PAYET","JR HUAYTAPAMPA 507",7],["LIMA","INDEPENDENCIA","IEP HUSARES DE JUNIN","CALLE 14 124",9],["LIMA","INDEPENDENCIA","INSTITUTO DE EMPRENDEDORES - USIL","AV INDUSTRIAL 384",16],["LIMA","INDEPENDENCIA","IEP MANUEL SCORZA","AV 17 DE NOVIEMBRE 225",2],["LIMA","INDEPENDENCIA","IEI 0055 SAGRADO CORAZON DE JESUS","CALLE LOS NARANJOS CDRA 1 SN EL ERMITAÑO",4],["LIMA","INDEPENDENCIA","IEP SAN MARCOS SCHOOLS","JR PALLCAMARCA 462",7],["LIMA","INDEPENDENCIA","I.E.P. RICARDO PALMA SECUNDARIA","JIRON PALLCAMARCA 287",5],["LIMA","INDEPENDENCIA","I.E.P. PEQUEÑOS BRITANICOS","JR HUAYTAPAMPA 693 URB TUPAC AMARU",3],["LIMA","INDEPENDENCIA","I.E.P. SAN JUDAS TADEO DE PAYET","JIRON PAMPACANCHA 472",5],["LIMA","INDEPENDENCIA","I.E.INDEPENDENCIA","AV LOS PINOS 401",7],["LIMA","INDEPENDENCIA","IEP BICENTENARIO","JR COLQUEPATA 385",7],["LIMA","INDEPENDENCIA","I.E.P. SAGRADA FAMILIA KIDS","CALLE 11 141 URB TUPAC AMARU",5],["LIMA","INDEPENDENCIA","I.E.P. LA CATOLICA","JIRON INCA YUPANQUI 398",7],["LIMA","JESUS MARIA","CONCHA ACUSTICA DEL CAMPO DE MARTE","AV HORACIO URTEAGA 535",30],["LIMA","JESUS MARIA","CEBE 08 PERU HOLANDA","AV MELLO FRANCO 850",11],["LIMA","JESUS MARIA","IEP JOSEPH AND MERY HIGH SCHOOL","AV ARNALDO MARQUEZ 551",24],["LIMA","JESUS MARIA","IEP SAN ANTONIO DE PADUA","AV ESTADOS UNIDOS 569",20],["LIMA","JESUS MARIA","IE 1098 CAP FAP JOSE ABELARDO QUIÑONES","AV ARNALDO MARQUEZ 1698",7],["LIMA","JESUS MARIA","IE DIEGO FERRE","JR TALARA 260",16],["LIMA","JESUS MARIA","IE GABRIELA MISTRAL","AV ARNALDO MARQUEZ 2139",5],["LIMA","JESUS MARIA","IE TERESA GONZALES DE FANNING - SECUNDARIA","AV JAVIER MARIATEGUI 1063",60],["LIMA","JESUS MARIA","IE TERESA GONZALES DE FANNING - PRIMARIA","AV HUSARES DE JUNIN 1257",25],["LIMA","JESUS MARIA","UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS - UNIDAD DE POSTGRADO DE DERECHO","JR PUMACAHUA 974",10],["LIMA","JESUS MARIA","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 04","CALLE PAEZ 140",24],["LIMA","JESUS MARIA","UNIVERSIDAD SAN MARTIN DE PORRES - FACULTAD DE MEDICINA HUMANA","AV GENERAL SALAVERRY 1144",13],["LIMA","JESUS MARIA","PARQUE PRÓCERES DE LA INDEPENDENCIA","AV AV GENERAL SALAVERRY CUADRA 16",20],["LIMA","JESUS MARIA","CLUB LAWN TENNIS DE LA EXPOSICION","AV 28 DE JULIO 744",19],["LIMA","JESUS MARIA","IEP BRASIL","AV BRASIL 2339",8],["LIMA","JESUS MARIA","CENTRO DE ESTUDIOS PREUNIVERSITARIOS DE LA UNIVERSIDAD NACIONAL AGRARIA LA MOLINA","JR ALMIRANTE GUISSE 939",22],["LIMA","JESUS MARIA","IEP SANTA MARIA DE LA GRACIA","AV BRASIL 963",8],["LIMA","JESUS MARIA","IEP COLEGIO SAN FELIPE","AV GREGORIO ESCOBEDO 895",31],["LIMA","JESUS MARIA","IEI DOMINGUITO SAVIO MINSA","JR RAMON DAGNINO 360",11],["LIMA","JESUS MARIA","DEPORSUR CAMPO DE MARTE","JR NAZCA CUADRA 6 SN PUERTA 3",12],["LIMA","JESUS MARIA","CAMARA DE COMERCIO DE LIMA","AV SAN FELIPE 630",28],["LIMA","JESUS MARIA","IEP SACO OLIVEROS - CUBA","AV CUBA 531 Y 543",27],["LIMA","LA MOLINA","IE 112 VIRGEN DEL CARMEN","CALLE ONTARIO SN",7],["LIMA","LA MOLINA","IEP SAN ANDRES","CALLE BALCANES MZ L1 LT 04",5],["LIMA","LA MOLINA","COLEGIO VILLA CARITAS","CALLE HURON 409 URB RINCONADA DEL LAGO 2DA ETAPA",13],["LIMA","LA MOLINA","IEP SIGMA","AV LOS FRUTALES 953",4],["LIMA","LA MOLINA","IEM DESCUBRIENDO","CALLE EL HARAS 392",4],["LIMA","LA MOLINA","IE 1140 AURELIO MIRO QUESADA SOSA","CALLE 11 SN",23],["LIMA","LA MOLINA","IE 1207 SAGRADO CORAZON DE JESUS","AV LA MOLINA 2080",7],["LIMA","LA MOLINA","IE 1230 SULPICIO GARCIA PEÑALOZA","AV LOS OLIVOS MZ M LT 17",18],["LIMA","LA MOLINA","IE 1278 LA MOLINA","JR CUZCO 416",20],["LIMA","LA MOLINA","IE CAPITAN FAP JOSE ABELARDO QUIÑONES GONZALES","AV SEPARADORA INDUSTRIAL SN",40],["LIMA","LA MOLINA","IEI 140 VIÑA ALTA","CALLE LOS ABEDULES SN",5],["LIMA","LA MOLINA","IE 1235 UNION LATINOAMERICANA","CALLE LA CULTURA SN",16],["LIMA","LA MOLINA","IE PNP MAYOR FELIX TELLO ROJAS","JR CUBA 221 URB SANTA PATRICIA",25],["LIMA","LA MOLINA","IE 1220 SAN JOSE MARELLO","AV MADRE SELVA SN",17],["LIMA","LA MOLINA","IEP COOP. SERV. EDUC. ING. CARLOS LISSON BEINGOLEA LTDA.","CALLE LOS ELECTRONICOS 210",16],["LIMA","LA MOLINA","UNIVERSIDAD FEMENINA DEL SAGRADO CORAZON","AV LOS FRUTALES 954",6],["LIMA","LA MOLINA","UNIVERSIDAD NACIONAL AGRARIA LA MOLINA","PROL AV LA MOLINA SN",65],["LIMA","LA MOLINA","ESTADIO BICENTENARIO","AV LA MOLINA SN",15],["LIMA","LA MOLINA","LOSA DEPORTIVA COVIMA JOSE CARLOS MARIATEGUI","CALLE VICTOR ANDRES BELAUNDE SN CUADRA 1",10],["LIMA","LA MOLINA","ESCUELA SUPERIOR DE GUERRA AEREA","CALLE 3 SN",20],["LIMA","LA MOLINA","IEP SAN AGUSTIN DE LA MOLINA","CALLE RIO DE JANEIRO 120",10],["LIMA","LA MOLINA","IEP VIÑA ALTA (GESTIÓN COMUNAL)","AV LOS OLIVOS MZ M LT 16 PPJJ VIÑA ALTA",8],["LIMA","LA MOLINA","IEP HUMANITAS","CALLE CRISTOBAL COLON MZ A LT 17 Y 18",5],["LIMA","LA MOLINA","IEP COLEGIO BRUNING","CALLE BERNARDO ALCEDO 260",14],["LIMA","LA MOLINA","IEP ALBERT EINSTEIN","JR RICARDO PALMA 252 URB COVIMA",3],["LIMA","LA MOLINA","IEP NEWTON COLLEGE","AV RICARDO ELIAS APARICIO 240",15],["LIMA","LA MOLINA","IE 0028 JESUS Y MARÍA","CALLE CAMINO REAL SN",11],["LIMA","LA MOLINA","IE 1286 HEROES DEL CENEPA","CALLE RIO RIN SN",7],["LIMA","LA MOLINA","IEP COLEGIO JEAN LE BOULCH","JR RODRIGO DE TRIANA 150",12],["LIMA","LA MOLINA","PARROQUIA SANTA MARIA DE GUADALUPE DE LA MOLINA","MZ A LT 2 URB LAS PRADERAS DE LA MOLINA",5],["LIMA","LA MOLINA","IEP CENTRO EDUCATIVO PARTICULAR REINA DEL MUNDO","AV RINCONADA DEL LAGO 675",9],["LIMA","LA MOLINA","PARROQUIA INMACULADO CORAZON","ALAMEDA DE LA PAZ SN CDRA 3 - URB EL REMANSO",10],["LIMA","LA MOLINA","IEP NIVEL A","AV JAVIER PRADO ESTE 4639",6],["LIMA","LA MOLINA","IE B.F SKINNER","AV LA MOLINA 3795 URB SOL DE LA MOLINA",9],["LIMA","LA MOLINA","UNIVERSIDAD  SAN MARTIN DE PORRES - FACULTAD DE INGENIERIA Y ARQUITECTURA","AV LA FONTANA 1250 URB SANTA PATRICIA",25],["LIMA","LA MOLINA","ESCUELA DE POSGRADO WALTER PEÑALOZA RAMELLA","CALLE LOS AGRICOLAS 289-URB LAS ACACIAS",13],["LIMA","LA MOLINA","CEBE 14 ROTARY CLUB - LA MOLINA","CALLE LAS HUACAS MZ V1 LT 2 - URB LA ENSENADA",4],["LIMA","LA MOLINA","IEP LEARNING SCHOOL","CALLE MADRE DIOS 395",11],["LIMA","LA MOLINA","COLEGIO COOPERATIVO SANTA FELICIA","CALLE LOS MADRIGALES 155",7],["LIMA","LA MOLINA","IE SANTA MARIA EUFRASIA","AV LAS PALMERAS 591",11],["LIMA","LA MOLINA","CEBE JUAN PABLO II","CALLE LAS AMAPOLAS LOS CAÑAVERALES 190",4],["LIMA","LA MOLINA","COMPLEJO DEPORTIVO EL VALLE","CALLE RIO UCAYALI SN CDRA 2",10],["LIMA","LA MOLINA","COMPLEJO DEPORTIVO MUNICIPAL CESAR VIDAURRE REINA FARJE","AV LA MOLINA SN CDRA 45",15],["LIMA","LA MOLINA","BIBLIOTECA PLAZA BICENTENARIO","CALLE LOS RUBIES SN",11],["LIMA","LA VICTORIA","IE 055 ROSA DE AMERICA","JR VICTOR ALZAMORA 354 CERRO SAN COSME",7],["LIMA","LA VICTORIA","IEI 104 VIRGEN DE LA PUERTA","AV ISABEL LA CATOLICA 850",1],["LIMA","LA VICTORIA","IEI 109 SAN JOSE","JR HECTOR ARELLANO 298",3],["LIMA","LA VICTORIA","IE 0501 MONSEÑOR DAMASO LEBERGERE","AV LA CUMBRE SN",8],["LIMA","LA VICTORIA","IEP SACO OLIVEROS","CALLE BELGICA 654",18],["LIMA","LA VICTORIA","IEP NIÑOS FELICES","URB BALCONCILLO 138-142-144 PARQUE CORONEL MIGUEL LUNA",3],["LIMA","LA VICTORIA","IEI SANTA BERNARDITA","JR HECTOR ARELLANO 221",4],["LIMA","LA VICTORIA","CEBE 10 SOLIDARIDAD","AV SAN LUIS 520",3],["LIMA","LA VICTORIA","IE PARROQUIAL SAN RICARDO","JR ABTAO 1200",6],["LIMA","LA VICTORIA","IEP SAN JOSE","AV PARQUE 12 DE OCTUBRE 2348",25],["LIMA","LA VICTORIA","IE 093 MANUELA FELICIA GOMEZ","JR MENDOZA MERINO 523",16],["LIMA","LA VICTORIA","IE 1105 LA SAGRADA FAMILIA","JR HIPOLITO UNANUE 990",26],["LIMA","LA VICTORIA","IE 1107 JAVIER PRADO","AV BAUSATE Y MESA CDRA 10 SN",14],["LIMA","LA VICTORIA","IE 1110 REPUBLICA DE PANAMA","AV BAUSATE Y MEZA 328",15],["LIMA","LA VICTORIA","IE 1117 ANDRES AVELINO ARAMBURU","AV JOSE GALVEZ 899",4],["LIMA","LA VICTORIA","IE 1119 NUESTRA SEÑORA DEL ROSARIO DE FATIMA","JR ABTAO 1101",6],["LIMA","LA VICTORIA","IE 1123 SAGRADO CORAZON DE JESUS","JR ANTONIO RAIMONDI 978",14],["LIMA","LA VICTORIA","IE 1127 LINCOLN","PARQUE LINCOLN SN",10],["LIMA","LA VICTORIA","IE 1129 CORAZON DE JESUS","JR FEDERICO BARRETO 287",11],["LIMA","LA VICTORIA","IE 1131 ROMULO A CORDOVA HUAMAN","JR FRANCISCO RIVAS 980",8],["LIMA","LA VICTORIA","IE 1201 PAUL HARRIS","JR FRANCIA 1165",10],["LIMA","LA VICTORIA","IE ANGELICA PALMA ROMAN","JR MARIANO ARAGONEZ 220",11],["LIMA","LA VICTORIA","IE EMBLEMATICA CESAR A VALLEJO","AV MEXICO 2087",39],["LIMA","LA VICTORIA","IE EMBLEMATICA ISABEL LA CATOLICA","AV ISABEL LA CATOLICA 872",40],["LIMA","LA VICTORIA","IE EMBLEMATICA 1120 PEDRO ADOLFO LABARTHE EFFIO","AV MEXICO 2048",49],["LIMA","LA VICTORIA","IE PARROQUIAL REINA DE LAS AMERICAS - INICIAL PRIMARIA","PARQUE UNION PANAMERICANA SN",9],["LIMA","LA VICTORIA","IE PARROQUIAL REINA DE LAS AMERICAS SECUNDARIA","AV CANADA CUADRA 4 SN",15],["LIMA","LA VICTORIA","IE ROSA DOMINGA PEREZ LIENDO","JR FRANCISCO ALMENARA 432",7],["LIMA","LA VICTORIA","IE TUPAC AMARU","AV DEL AIRE 601",24],["LIMA","LA VICTORIA","IE 1112 VICTOR ANDRES BELAUNDE","AV SAN EUGENIO 600",30],["LIMA","LA VICTORIA","IEP SAN NORBERTO - PRIMARIA","AV SANTA CATALINA 450-B",13],["LIMA","LA VICTORIA","IST PUBLICO ARTURO SABROSO MONTOYA","JR ANTONIO RAIMONDI 1020",5],["LIMA","LA VICTORIA","ISTP JOSE PARDO","AV GRAU 620",12],["LIMA","LA VICTORIA","UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS - ESCUELA DE OBSTETRICIA Y ESCUELA DE NUTRICIÓN","AV GRAU 1110",13],["LIMA","LA VICTORIA","IEP SANTA LUISA DE MARILLAC","CALLE LAS AGATAS 300",2],["LIMA","LA VICTORIA","IEP DORA MAYER ZULEN","CALLE PIETRO VITORELLI 123",7],["LIMA","LA VICTORIA","IEP DOMINGO SAVIO - SECUNDARIA","AV SANTA CATALINA 690",7],["LIMA","LA VICTORIA","IEP DOMINGO SAVIO - INICIAL PRIMARIA","AV SANTA CATALINA 648",7],["LIMA","LA VICTORIA","IE REGINA DECOR CARMELI","JR LOS JASPES 118 URB BALCONCILLO",7],["LIMA","LA VICTORIA","IEP CRISTO MORADO","JR LOS MOCHICAS 626",3],["LIMA","LA VICTORIA","ESCUELA NACIONAL DE ARTES GRAFICAS","JR GARCIA NARANJO 647",6],["LIMA","LA VICTORIA","IE 020 MADRE TERESA DE CALCUTA","AV SAN LUIS 500",4],["LIMA","LA VICTORIA","IE EMBLEMATICA GENERAL FELIPE SANTIAGO SALAVERRY","JR CISNEROS 595",7],["LIMA","LA VICTORIA","IEP SEÑOR DE LUREN","JR LUIS GIRIBALDI 235",11],["LIMA","LA VICTORIA","IE 1030 REPUBLICA DE BOLIVIA","AV 28 DE JULIO 1443",4],["LIMA","LA VICTORIA","CETPRO MANUELA FELICIA GOMEZ","JR MENDOZA MERINO 590",2],["LIMA","LA VICTORIA","IEP ASSIRI","JR ENRIQUE BARREDA 185",6],["LIMA","LA VICTORIA","IE PARROQUIAL MONS MARCOS LIBARDONI","JR 3 DE FEBRERO 1073 URB APOLO",11],["LIMA","LA VICTORIA","IE 1111 JOSE ANTONIO ENCINAS","JR SEBASTIAN BARRANCA 1755",24],["LIMA","LA VICTORIA","IEP REGINA DECOR CARMELI - PRIMARIA","JR LOS JASPES 151",10],["LIMA","LA VICTORIA","IEP JESUS SALVADOR","AV LAS AMERICAS 354",3],["LIMA","LA VICTORIA","IEP BUONARROTI","CALLE MAX GONZALES OLAECHEA 240",8],["LIMA","LA VICTORIA","IEP SAN FRANCISCO","CALLE LOS CORALES 194",6],["LIMA","LA VICTORIA","IEP LUZ DE MARIA","JR LOS TOPACIOS 416",10],["LIMA","LA VICTORIA","IEP SEÑOR DE GUALAMITA","PSJ LOS COLLAS 641",10],["LIMA","LA VICTORIA","IEI 56 NUESTRA SEÑORA MARIA AUXILIADORA","JR JULIO RIVERO 393",6],["LIMA","LA VICTORIA","IEP LUCERITOS DEL FUTURO","PSJ LUIS DE VELASCO 1956",2],["LIMA","LIMA","IE CEBE 06 REPUBLICA DOMINICANA","CALLE CLAVERO Y MUGA 2505",11],["LIMA","LIMA","IE 101 1166 LIBERTADOR SIMON BOLIVAR","AV ENRIQUE MEIGGS SN CUADRA 5 (RIEL DEL TREN)",20],["LIMA","LIMA","IE 1016 JOHN F. KENNEDY","AV VENEZUELA SN CUADRA 27",7],["LIMA","LIMA","IE 1037 RAMON ESPINOSA","JR ANCASH 1254",25],["LIMA","LIMA","IE 1145 REPUBLICA DE VENEZUELA","JR CALLAO 773",7],["LIMA","LIMA","IE 1152 - 108 DOS DE MAYO","JR GENERAL BUENDIA 519",7],["LIMA","LIMA","IE 1153 REPUBLICA DE CANADA","AV MORALES DUAREZ 342",7],["LIMA","LIMA","IE 1156 JOSE SEBASTIAN BARRANCA LOVERA","JR HUARANCAYO 168",7],["LIMA","LIMA","IE 1160 JOSE FAUSTINO SANCHEZ CARRION","JR REPUBLICA DEL ECUADOR 605",6],["LIMA","LIMA","IE 1161","JR CRESPO Y CASTILLO 1377",5],["LIMA","LIMA","IE 25 NUESTRA SEÑORA DE LA INMACULADA CONCEPCION","JR JUNIN 1238",16],["LIMA","LIMA","IE VISION MUNDIAL","MZ L LOTE 1 Y 2 AAHH NUEVA CAJA DE AGUA",7],["LIMA","LIMA","IEP SANTO TOMAS DE AQUINO","CALLE RINCONADA SANTO DOMINGO 209",12],["LIMA","LIMA","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL ESCUELA DE POST GRADO","JR PROLONGACION CAMANA 1014",14],["LIMA","LIMA","UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS - FACULTAD DE MEDICINA","AV GRAU 755",30],["LIMA","LIMA","IE 0022 REPUBLICA DE GUATEMALA","JR MANUEL PARDO 225",17],["LIMA","LIMA","IE 0035 NUESTRA SEÑORA DE LA VISITACION","JR GUILLERMO DANSEY 669-611",14],["LIMA","LIMA","IE 0099 OSCAR MIRO QUESADA DE LA GUERRA","JR PARURO 231",9],["LIMA","LIMA","IE 1001 JOSE JIMENEZ BORJA","JR WASHINGTON 1454",16],["LIMA","LIMA","IE 1035 GENERAL JOSE DEL CARMEN MARIN ARISTA","AV NICOLAS DE PIEROLA 1533",28],["LIMA","LIMA","IE 1036 REPUBLICA DE COSTA RICA","JR DESAGUADERO 490",14],["LIMA","LIMA","IE 1040 REPUBLICA DE HAITI","JR AZANGARO 876",7],["LIMA","LIMA","IE 1049 JUANA ALARCO DE DAMMERT","JR PUNO 421",10],["LIMA","LIMA","IE 105 PEDRO CORONADO ARRASCUE","AV ALFONSO UGARTE 120",12],["LIMA","LIMA","IE 111 SAN JOSE DE ARTESANOS","JR AYACUCHO 179",11],["LIMA","LIMA","IE 1146 REPUBLICA DE PARAGUAY","AV EMANCIPACION 731",18],["LIMA","LIMA","IE 1148 JUANA INFANTES VERA","BLOCK 52 A UNIDAD VECINAL 03",17],["LIMA","LIMA","IE 1149 SAGRADO CORAZON DE JESUS","AV OSCAR R BENAVIDES 262 EX COLONIAL",8],["LIMA","LIMA","IE 1150 ABRAHAM ZEA CARREON","JR NICOLAS RODRIGO SN",14],["LIMA","LIMA","IE 1154 NUESTRA SEÑORA DEL CARMEN","JR ELVIRA GARCIA Y GARCIA SN",15],["LIMA","LIMA","IE 1168 HEROES DEL CENEPA","JR HUALLAGA 878",20],["LIMA","LIMA","IE EMBLEMATICA HIPOLITO UNANUE","JR ELVIRA GARCIA Y GARCIA SN",44],["LIMA","LIMA","IE JUAN PABLO VIZCARDO Y GUZMAN","AV PEDRO GAREZON SN",16],["LIMA","LIMA","IE NUESTRA SEÑORA DE MONTSERRAT","JR CONDE DE SUPERUNDA 466",9],["LIMA","LIMA","IE PNP CAP ALIPIO PONCE VASQUEZ","JR OROPESA SN CUADRA 1",12],["LIMA","LIMA","IE PNP TUPAC AMARU","JR DESAGUADERO 371",12],["LIMA","LIMA","IEP SANTISIMO SALVADOR","JR ANCASH 880",14],["LIMA","LIMA","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 01","JR CAÑETE 651",40],["LIMA","LIMA","UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS","AV UNIVERSITARIA CON AV VENEZUELA",100],["LIMA","LIMA","IE ARGENTINA","AV ALFONSO UGARTE 1011",21],["LIMA","LIMA","IEP SANTISIMA TRINIDAD","JR GUALBERTO GUEVARA SN",22],["LIMA","LIMA","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 07","AV COLONIAL 450",32],["LIMA","LIMA","IE SIMON BOLIVAR","JR SANTA JUSTINA SN",12],["LIMA","LIMA","IE 0095 MARIA AUXILIADORA","AV MATERIALES 2005",8],["LIMA","LIMA","IE 1021 REPUBLICA FEDERAL DE ALEMANIA","AV BELISARIO SOSA PELAEZ 1550",17],["LIMA","LIMA","IE PEDRO GALVEZ EGUSQUIZA","CALLE EMILIO GARCIA ROSELL 670",9],["LIMA","LIMA","IE 117 PASCUAL ALEGRE GONZALES","CALLE LAS FABRICAS SN",10],["LIMA","LIMA","IE 1157 JULIO CÉSAR TELLO ROJAS","AV JOAQUIN CAPELLO 3110",22],["LIMA","LIMA","IE 1028 REPÚBLICA ARGENTINA","JR LUIS SOTOMAYOR 131",7],["LIMA","LIMA","IE LUIS ARMANDO CABELLO HURTADO","PJE ALTO DE LA ALIANZA SN",29],["LIMA","LIMA","IEP SACO OLIVEROS - CIPRESES ELIO","CALLE EUGENIO PAREDES 2448 - 2450",29],["LIMA","LIMA","CENTRO DE IDIOMAS VIRGEN DE LAS MERCEDES - CIVIME","AV AREQUIPA 1080",27],["LIMA","LIMA","IEP INNOVA SCHOOLS CERCADO","CALLE SANCHEZ PINILLOS 386 CERCADO DE LIMA",30],["LIMA","LIMA","IEP INNOVA SCHOOLS BERTELLO","AV ALEJANDRO BERTELLO 298 CERCADO DE LIMA",29],["LIMA","LIMA","IE NUESTRA SEÑORA DE GUADALUPE","AV ALFONSO UGARTE 1227",49],["LIMA","LIMA","IEP SACO OLIVEROS SANTA BEATRIZ","JR TEODORO CÁRDENAS 457",19],["LIMA","LINCE","COMPLEJO DEPORTIVO FRANCISCO LAZO","AV FRANCISCO LAZO 2034",13],["LIMA","LINCE","COMPLEJO POLIDEPORTIVO MARISCAL CASTILLA","AV CESAR VALLEJO SN",24],["LIMA","LINCE","COLEGIO DE APLICACION SAN MARCOS","JR CAPAC YUPANQUI 1700",6],["LIMA","LINCE","CE PARROQUIAL SANTA ROSA DE LIMA","CALLE ALMIRANTE GUISSE 2150",41],["LIMA","LINCE","IE 1057 JOSE BAQUIJANO Y CARRILLO","JR MANUEL GOMEZ 651",32],["LIMA","LINCE","IE 1059 MARIA INMACULADA","AV MILITAR 1862",16],["LIMA","LINCE","IE 1070 MELITON CARVAJAL","AV LEONIDAS YEROVI 2120",57],["LIMA","LINCE","IE REPUBLICA DE CHILE","JR RISSO 477",10],["LIMA","LINCE","IEP ALBERTO BENJAMIN SIMPSON","AV AREQUIPA 2335",14],["LIMA","LINCE","IEP SACO OLIVEROS DE LINCE","JR MANUEL GOMEZ 245",17],["LIMA","LINCE","IEE 1070 MELITON CARVAJAL - ESTADIO","AV PROL IQUITOS 2139",41],["LIMA","LINCE","IEI 005 JESUSITO MILAGROSO","AV MILITAR 1886",9],["LIMA","LINCE","IE PARROQUIAL SAN TARCISIO","JR MAMA OCLLO 1860",11],["LIMA","LINCE","IEI KIDS HOUSE","AV ALBERTO ALEXANDER 2395",3],["LIMA","LOS OLIVOS","IE 2005 LOS OLIVOS","CALLE 7 SN - AAHH DANIEL ALCIDES CARRION",6],["LIMA","LOS OLIVOS","IE 3047","CALLE 7 MZ M - RIO SANTA",7],["LIMA","LOS OLIVOS","IEP SACO OLIVEROS","CALLE CIPRIANO RUIZ SN",36],["LIMA","LOS OLIVOS","IEP SAN VICENTE FERRER","CALLE 5 URB PROLIMA LOS OLIVOS",11],["LIMA","LOS OLIVOS","IEP JOSE MARIA ESCRIVA DE BALAGUER","MZ E LT 9 Y 10 - LOS OLIVOS DE PRO",7],["LIMA","LOS OLIVOS","IEP PITAGORAS","CALLE MAX PALMA ARRUE SN",19],["LIMA","LOS OLIVOS","IEP NUESTRA SEÑORA DE FATIMA","AV HUAYLAS SN CUADRA 48",15],["LIMA","LOS OLIVOS","IEP CRISTO REY DE REYES","CALLE 8 MZ Q LT 10 - 12",16],["LIMA","LOS OLIVOS","IEP BARBARA D´ACHILLE SCHOOL","CALLE ELEODORO ZEVALLOS 221",11],["LIMA","LOS OLIVOS","IEP MANUEL ASCENCIO SEGURA","CALLE LAS GUIRNALDAS MZ S LOTE 18",9],["LIMA","LOS OLIVOS","IEP CORAZÓN DE JESÚS","CALLE LOS ALHELIS MZ F LOTE 12-13",13],["LIMA","LOS OLIVOS","IEP CORAZON DE JESUS","AV RIO MARAÑON 442",7],["LIMA","LOS OLIVOS","IEP MATEMATICO SAN DIEGO","CALLE LOS JAZMINES MZ I1 LT 22",9],["LIMA","LOS OLIVOS","IEP GENES DE LOS OLIVOS","AV UNIVERSITARIA 5306",27],["LIMA","LOS OLIVOS","IEP ALEXANDER VON HUMBOLDT","AV UNIVERSITARIA 5996",11],["LIMA","LOS OLIVOS","CEBE MANUEL DUATO","JR PACIFICO SN",23],["LIMA","LOS OLIVOS","IE 2004 SEÑOR DE LOS MILAGROS","CALLE 6 MZ Q LOTE 1",7],["LIMA","LOS OLIVOS","IE 2006 SANTA ROSA DE LIMA","CALLE SANTA SOFIA SN",8],["LIMA","LOS OLIVOS","IE 2007 ROSA DE LAS AMERICAS","CALLE LOS LAURELES SN",13],["LIMA","LOS OLIVOS","IE 2015 MANUEL GONZALEZ PRADA","JR MANUEL GONZALES PRADA CUADRA 3",19],["LIMA","LOS OLIVOS","IE 2022 PEDRO ABRAHAM VALDELOMAR PINTO","AV PROCERES DE HUANDOY SN",16],["LIMA","LOS OLIVOS","IE 2024","CALLE LOS NARANJOS SN",29],["LIMA","LOS OLIVOS","IE 2025 INMACULADA CONCEPCION","MZ Q4 LT 1 URB PUERTA DE PRO",20],["LIMA","LOS OLIVOS","IE 2071 CESAR VALLEJO","JR DANIEL HERNANDEZ 380",15],["LIMA","LOS OLIVOS","IE 2078 NUESTRA SEÑORA DE LOURDES","CALLE SAN HERNAN SN",26],["LIMA","LOS OLIVOS","IE 2087 REPUBLICA ORIENTAL DEL URUGUAY","JR RIO PAUCARTAMBO MZ B LT 7",13],["LIMA","LOS OLIVOS","IE 2089 MICAELA BASTIDAS","JR LAS ACUARINAS SN CUADRA 2",19],["LIMA","LOS OLIVOS","IE 2090 VIRGEN DE LA PUERTA","JR LOS GERANEOS MZ K LT 16",20],["LIMA","LOS OLIVOS","IE 2091 MARISCAL ANDRES AVELINO CACERES","JR LAS HIEDRAS SN",19],["LIMA","LOS OLIVOS","IE 2092 CRISTO MORADO","JR ESCORPIO SN",9],["LIMA","LOS OLIVOS","IE 2095 HERNAN BUSES DE LA GUERRA","JR LA HONESTIDAD 8000 URB PRO",29],["LIMA","LOS OLIVOS","IE 2096 PERU JAPON","JR PARIAHUANCA SN",15],["LIMA","LOS OLIVOS","IE 3029 SOL DE ORO","JR LA LUNA 7190",12],["LIMA","LOS OLIVOS","IE 3040 20 DE ABRIL","AV A MZ 57",15],["LIMA","LOS OLIVOS","IE 3078 HEROES DEL CENEPA","CALLE 9 SN",10],["LIMA","LOS OLIVOS","IE 3080 PERU CANADA","CALLE CIPRIANO RUIZ SN",25],["LIMA","LOS OLIVOS","IE 3084 ENRIQUE GUZMAN Y VALLE","AV NARANJAL CUADRA 9",23],["LIMA","LOS OLIVOS","IE 3087 CARLOS CUETO FERNANDINI","PJE ALAMEDA CENTRAL SN",18],["LIMA","LOS OLIVOS","IE 3091 HUACA DE ORO","CALLE INVOCACION MZ BB4 LT 15 - 4TO SECTOR",13],["LIMA","LOS OLIVOS","IE ALFREDO REBAZA ACOSTA","AV EL TREBOL SN CDRA 12",23],["LIMA","LOS OLIVOS","IE ENRIQUE MILLA OCHOA","CALLE 1 SN",23],["LIMA","LOS OLIVOS","IE GRAN MARISCAL TORIBIO DE LUZURIAGA","AV MARCARA 5280",19],["LIMA","LOS OLIVOS","IE JORGE BASADRE GROHMANN","AV ALAMEDA CENTRAL SN",15],["LIMA","LOS OLIVOS","IE JOSE ABELARDO QUIÑONES GONZALES","JR TOMAS CATARI Y ANTONIO CABO SN",8],["LIMA","LOS OLIVOS","IE NUEVO PERU","CALLE 37 SN",14],["LIMA","LOS OLIVOS","IE PALMAS REALES","CALLE 3 MZ C LTE 21 - URB PALMAS VERDES",15],["LIMA","LOS OLIVOS","IE PROYECTO INTEGRAL CHAVARRIA","CALLE GERMAN CARO RIOS MZ I LTE 55",11],["LIMA","LOS OLIVOS","IE 3095 PERU KAWACHI","JR JOSE CARLOS MARIATEGUI SN MUNICIPAL CHILLON",17],["LIMA","LOS OLIVOS","INSTITUTO DE EDUCACION SUPERIOR TECNOLOGICO PUBLICO MANUEL AREVALO CACERES","AV LOS ALISOS 858",7],["LIMA","LOS OLIVOS","IEP SAN MARCOS","CALLE LOS TOPACIOS SN MZ R LT 2",10],["LIMA","LOS OLIVOS","IEP MANUEL SCORZA","JR RIO LURIN 175",7],["LIMA","LOS OLIVOS","IEP SAN IGNACIO DE LOS OLIVOS","AV SANTA ELVIRA MZ C LT 1 URB LOS OLIVOS",14],["LIMA","LOS OLIVOS","CEP NUESTRA SEÑORA DE MONSERRAT","COOPERATIVA DE VIVIENDA CAJABAMBA MZ A LOTE 9",11],["LIMA","LOS OLIVOS","UNIVERSIDAD CATOLICA SEDES SAPIENTIAE","CALLE CONSTELACIONES SN",9],["LIMA","LOS OLIVOS","IEP SACO OLIVEROS DE PRO","CALLE 30 MZ W5 LOTE 40",7],["LIMA","LOS OLIVOS","IEP LICEO SAN JUAN","AV LOS ALISOS 1361",23],["LIMA","LOS OLIVOS","IEP SAN ANDRES","CALLE 5 MZ H LT 18",11],["LIMA","LOS OLIVOS","IEP HANS CHRISTIAN","CALLE 10 MZ M4 LT 48",7],["LIMA","LOS OLIVOS","IEP NUESTRA SEÑORA DE LAS MERCEDES","CALLE MALLASH 4999",7],["LIMA","LOS OLIVOS","IEP SAN JUAN BAUTISTA","CALLE 8 MZ J LT 1",13],["LIMA","LOS OLIVOS","CEPD EL BUEN PASTOR","JR ARIES 782 - URB MERCURIO",35],["LIMA","LOS OLIVOS","IEP INNOVA SCHOOLS SEDE SANTA ANA","CALLE 14 SN",40],["LIMA","LOS OLIVOS","IEP INNOVA SCHOOLS SEDE VILLA SOL","CALLE JUSTO ARIAS ARAGUEZ MZ G LT 23",17],["LIMA","LURIGANCHO","IE 1224","CALLE SAN JUAN SN EL PARAISO DE HUACHIPA",11],["LIMA","LURIGANCHO","IE 1234 ROSA SANTANA PISCONTE","AV SALAZAR BONDY 196 3ERA ZONA AH NICOLAS DE PIEROLA",8],["LIMA","LURIGANCHO","IE 1267  LA CAMPIÑA","AAHH CASA HUERTA MZ O LOTE 2 SECTOR A",31],["LIMA","LURIGANCHO","IE 1275","MZ Q LOTE 02 CAJAMARQUILLA",7],["LIMA","LURIGANCHO","IE 1282 AYMON LA CRUZ LOPEZ","CALLE LAS MORAS SN ENCALADA HUACHIPA",8],["LIMA","LURIGANCHO","IEP COLEGIO UNION","AV BERNARDO BALAGUER SN",28],["LIMA","LURIGANCHO","IEP CUSSI SCHOOL","AV 24 DE SETIEMBRE MZ G LOTE 15",8],["LIMA","LURIGANCHO","IEP EMANUEL","CALLE 2 SN MZ J LOTE 2 HUACHIPA NORTE",18],["LIMA","LURIGANCHO","IEP FRANCOIS VIETE","MZ J LOTE 16 ASOCIACION CAMPO SOL CARAPONGO",11],["LIMA","LURIGANCHO","IEP KOREB SCHOOL","MZ I1 LT 45 URB SAN ANTONIO DE CARAPONGO",8],["LIMA","LURIGANCHO","UNIVERSIDAD PERUANA UNION","AV CUSIPATA SN - PUERTA 2",22],["LIMA","LURIGANCHO","COLEGIO EXPERIMENTAL DE APLICACION DE LA UNE","AV ENRIQUE GUZMAN Y VALLE SN",47],["LIMA","LURIGANCHO","IE 0033 VIRGILIO ESPINOZA BARRIOS","CALLE LOS BRILLANTES MZ C LOTE 12",10],["LIMA","LURIGANCHO","IE 0052 VIRGEN DE FATIMA","JR COLOMBIA SN  SAN FERNANDO BAJO",7],["LIMA","LURIGANCHO","IE 0055 MANUEL GONZALES PRADA","AV ANDRES AVELINO CACERES SN CUADRA 3",18],["LIMA","LURIGANCHO","IE 0058 CUSCO","JR CASMA 598",12],["LIMA","LURIGANCHO","IE 1193 EMILIO DEL SOLAR","JR TACNA 319",10],["LIMA","LURIGANCHO","IE 1198 LA RIBERA","JR DEACON Y WIESSE 215",8],["LIMA","LURIGANCHO","IE 1200 SANTA MARIA","CALLE LAS MAGNOLIAS 210-216",13],["LIMA","LURIGANCHO","IE 1205 ABELARDO QUIÑONEZ","AV PLAZA PRINCIPAL SN",6],["LIMA","LURIGANCHO","IE 1233 MANUEL FERNANDO CABREL NICHO","CALLE ICA SN",14],["LIMA","LURIGANCHO","IE MIXTO JOSEFA CARRILLO Y ALBORNOZ","AV PROL BOLIVIA SN",16],["LIMA","LURIGANCHO","IE 41 FE Y ALEGRIA CALASANZ","AV VIRGEN DEL CARMEN SN 1ERA ETAPA",7],["LIMA","LURIGANCHO","IE PABLO PATRON","AV PROL BOLIVIA 679",16],["LIMA","LURIGANCHO","IEP SAN ISIDRO PATRON DE JICAMARCA","CALLE LAS FLORES MZ J LOTE 32",8],["LIMA","LURIGANCHO","IEP NUESTRA SEÑORA DE LOURDES","AV LIMA SUR 439",9],["LIMA","LURIGANCHO","IEP SAN ISIDRO","JR JUNIN 175",10],["LIMA","LURIGANCHO","IEP SANTA ISABEL","AV BUENOS AIRES MZ K LOTE 8",6],["LIMA","LURIGANCHO","IE 0065 MARISCAL ANDRES A. CACERES","AV JOSE SANTOS CHOCANO MZ 30 LT 2",9],["LIMA","LURIGANCHO","IE 0027 SAN ANTONIO DE JICAMARCA","AV MIGUEL GRAU SN",29],["LIMA","LURIGANCHO","IE 0059 SANTA MARIA GORETTI","AV BERNARDO BALAGUER SN",9],["LIMA","LURIGANCHO","IEP JESUS DE NAZARETH","MZ G LT 3 - 4 LAS PRADERAS DE HUACHIPA",8],["LIMA","LURIGANCHO","CESAL","AV COLECTORA SN MZ E LOTE 47 EXFUNDO NIEVERIA",6],["LIMA","LURIGANCHO","IEP WISE HOUSE SCHOOL","ASOC NUEVO HORIZONTE MZ H LOTE 1 CARAPONGO",12],["LIMA","LURIGANCHO","IEP JESÚS DE NAZARETH - BELEN","MZ D LOTE 4 ASOCIACION CASA HUERTA 1 DE MAYO",10],["LIMA","LURIGANCHO","IE 0051 JOSE FAUSTINO SANCHEZ CARRION","AV LAS CRUCES SN ASOCIACION CAMPO SOL - CARAPONGO",38],["LIMA","LURIGANCHO","CEBE SOLIDARIDAD","AV LOS CANARIOS MZ O2 LOTE 5",9],["LIMA","LURIGANCHO","IEP SANTIAGO ANTUNEZ DE MAYOLO","AV LAS TORRES LOTE 14-B",9],["LIMA","LURIGANCHO","IE SEMILLITAS DEL VALLECITO","AV PRINCIPAL MZ P4 LOTE1 ETAPA IV",3],["LIMA","LURIGANCHO","IE VIRGEN DEL CARMEN","MZ J3 LOTE 1 IV ETAPA AAHH VIRGEN DEL CARMEN",3],["LIMA","LURIGANCHO","IEP NUEVO MUNDO","AV NICOLAS AYLLON CARRETERA CENTRAL KM 28.5 B-3",26],["LIMA","LURIN","IE 7078 VIRGEN DE CHAPI","CALLE LAS CASUARINAS 208",9],["LIMA","LURIN","IE 7085 SANTA ROSA","EX FUNDO SANTA ROSA SN",5],["LIMA","LURIN","IE 7098 RODRIGO LARA BONILLA","AV JORGE BASADRE GROHMANN SN",20],["LIMA","LURIN","IE 7104 RAMIRO PRIALE PRIALE","JR TRUJILLO SN",12],["LIMA","LURIN","IE PARROQUIAL SAN JUAN DE CRUZ","CALLE 14 MZ E LT 5 - 6 Y 23 - 24",11],["LIMA","LURIN","IEP SAN MARCOS SUR - SECUNDARIA","URB NUEVO LURIN MZ M LT 6",12],["LIMA","LURIN","IE 6008 JOSE ANTONIO DAPELO - LURIN","JR RAMON CASTILLA CUADRA 1 SN",16],["LIMA","LURIN","IE 6023 JULIO C. TELLO ROJAS","JR JACARANDA SN",22],["LIMA","LURIN","IE 6031 SANTA MARIA DE LURIN","CALLE RAMON CASTILLA SN",12],["LIMA","LURIN","IE 6154 MAYOR EP MARCO JARA SCHENONE","AV ANTIGUA PANAMERICANA SUR KM 39.5",6],["LIMA","LURIN","IE 7056 SAN MARTIN DE PORRES","JR RAMON CASTILLA CUADRA 1 SN",16],["LIMA","LURIN","IE JOSE FAUSTINO SANCHEZ CARRION","JR RAMON CASTILLA CUADRA 5 SN",19],["LIMA","LURIN","IEP SAN PEDRO SANTISIMA TRINIDAD","AV SAN PEDRO - EX FUNDO QUINTANILLA SN",25],["LIMA","LURIN","IE 7239 SANTISIMO SALVADOR","MZ E-F LT SN",21],["LIMA","LURIN","IE 7267 SEÑOR DE LOS MILAGROS","CALLE 2 MZ B8 LT 01",10],["LIMA","LURIN","IE 6026 VIRGEN DE FATIMA","PJE LOS ROSALES 305",10],["LIMA","LURIN","IE MIGUEL GRAU SEMINARIO","AV ANGAMOS SN",21],["LIMA","MAGDALENA DEL MAR","IEP ATUSPARIA","JR COMANDANTE JIMENEZ 244",10],["LIMA","MAGDALENA DEL MAR","IE 1088 FRANCISCO BOLOGNESI","AV SUCRE 445",22],["LIMA","MAGDALENA DEL MAR","IE 1090 CRNL FAP MARCO ANTONIO SCHENONE OLIVA","JR GRAU SN CUADRA 2",3],["LIMA","MAGDALENA DEL MAR","IE 1094 JACARANDA","JR TRUJILLO SN CUADRA 4",9],["LIMA","MAGDALENA DEL MAR","IE 1104 CORONEL FAP VICTOR MALDONADO BEGAZO","JR LIBERTAD 970",8],["LIMA","MAGDALENA DEL MAR","IE 1214 SEÑOR DE LOS MILAGROS","AV SUCRE 1130",10],["LIMA","MAGDALENA DEL MAR","IE 072 SAN MARTIN DE PORRES","AV SUCRE 1277",11],["LIMA","MAGDALENA DEL MAR","IE EMBLEMATICA MIGUEL GRAU","JR LIBERTAD 1025",29],["LIMA","MAGDALENA DEL MAR","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 06","JR YUNGAY 202",30],["LIMA","MAGDALENA DEL MAR","IEP PARROQUIAL SAN JUAN MARIA VIANNEY","JR RICARDO REY BASADRE 158",18],["LIMA","MAGDALENA DEL MAR","HOSPITAL NACIONAL VICTOR LARCO HERRERA","JR RAYMOND SN",25],["LIMA","MAGDALENA DEL MAR","CEBE 001 CORAZÓN DE MARIA","JR ESTHER FESTINI 109",4],["LIMA","MAGDALENA DEL MAR","CEBE 014 LA SAGRADA FAMILIA","JR SAN MARTIN 385",8],["LIMA","MAGDALENA DEL MAR","IEI 106 JUAN RAGGIO CHICHIZOLA","JR GRAU 245",5],["LIMA","MAGDALENA DEL MAR","IE 012 REPUBLICA DOMINICANA","JR ALBERTO YABAR SN CUADRA 1",4],["LIMA","MAGDALENA DEL MAR","CEPRE UNI","AV JAVIER PRADO OESTE 730",22],["LIMA","MAGDALENA DEL MAR","CETPRO MAGDALENA","JR LEONCIO PRADO 686",8],["LIMA","MAGDALENA DEL MAR","CETPRO PROMAE MAGDALENA","JR LEONCIO PRADO 1015",6],["LIMA","MAGDALENA DEL MAR","COLISEO DEPORTIVO ALDO CHAMOCHUMBI","AV COMANDANTE ESPINAR 300",11],["LIMA","MAGDALENA DEL MAR","SEDE MUNICIPAL ALFONSO UGARTE","AV ALFONSO UGARTE 661",12],["LIMA","MIRAFLORES","IE 42 ELIZABETH ESPEJO DE MARROQUIN","CALLE ARCE DE LA OLIVA 225",3],["LIMA","MIRAFLORES","IEP MARKHAM COLLAGE","AV REPUBLICA DE PANAMA SN",38],["LIMA","MIRAFLORES","CEBE 4 MIRAFLORES","AV TOMAS MARZANO CDRA 26",10],["LIMA","MIRAFLORES","IE 6003 REBECA CARRION CACHOT","CALLE JOAQUIN COPELO SN",6],["LIMA","MIRAFLORES","IE 7001 ANDRES BELLO","CALLE GENERAL SUAREZ 636",5],["LIMA","MIRAFLORES","IE 7003 MANUEL FERNANDO BONILLA","CALLE MANUEL BONILLA 282",21],["LIMA","MIRAFLORES","IE 7008 SCIPION E LLONA","CALLE ENRIQUE PALACIOS SN",29],["LIMA","MIRAFLORES","COLEGIO ADVENTISTA MIRAFLORES","AV COMANDANTE ESPINAR 750",14],["LIMA","MIRAFLORES","IEP ESCUELA ADVENTISTA UNION MIRAFLORES","AV COMANDANTE ESPINAR 780",19],["LIMA","MIRAFLORES","IE 6050 EMBLEMATICA JUANA ALARCO DE DAMMERT PRIMARIA","CALLE CAP PERCY PHILLIPPS CUBA SN",16],["LIMA","MIRAFLORES","IE 6050 EMBLEMATICA JUANA ALARCO DE DAMMERT","AV ALFREDO BENAVIDES 2315",36],["LIMA","MIRAFLORES","IE FEDERICO VILLARREAL","AV MAYOR ENRIQUE CABALLERO ORREGO 376",34],["LIMA","MIRAFLORES","COLEGIO INMACULADO CORAZON","CALLE JULIO BECERRA 130",30],["LIMA","MIRAFLORES","IEP NUESTRA SEÑORA DEL CARMEN PRIMARIA","CALLE 15 DE ENERO 330",37],["LIMA","MIRAFLORES","IEP NUESTRA SEÑORA DEL CARMEN SECUNDARIA","AV ALFREDO BENAVIDES 1665",39],["LIMA","MIRAFLORES","IEP SANTA RITA DE CASIA","CALLE SOR TITA 231",9],["LIMA","MIRAFLORES","UNIVERSIDAD DE PIURA","CALLE BELLAVISTA 167",6],["LIMA","MIRAFLORES","IEP ADVIENTO","CALLE MARIA PARADO DE BELLIDO 124",9],["LIMA","MIRAFLORES","IEP MARIA DE LAS MERCEDES","CALLE CAHUIDE 241",18],["LIMA","MIRAFLORES","CEBA SAN AGUSTIN DE MIRAFLORES","AV AREQUIPA 4501",3],["LIMA","MIRAFLORES","IEP LA REPARACIÓN","CALLE LA LIBERTAD 151",10],["LIMA","MIRAFLORES","IE 15 VIRGEN DE LOURDES","CALLE JOSE GALVEZ 255",2],["LIMA","MIRAFLORES","IDIOMAS PUCP - MIRAFLORES","AV ALFREDO BENAVIDES 1678",3],["LIMA","MIRAFLORES","IEP NIDO LOS ANGELES","CALLE LOS ANGELES 150",5],["LIMA","MIRAFLORES","IEP SANTANDER DE MIRAFLORES","PJE JOSE PAYAN 110",3],["LIMA","MIRAFLORES","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 05","CALLE ROMA 350",6],["LIMA","MIRAFLORES","IGLESIA BAUTISTA EBENEZER","AV AYACUCHO 230",6],["LIMA","MIRAFLORES","COLEGIO DE INGENIEROS DEL PERU - CONSEJO NACIONAL","AV AREQUIPA 4947",6],["LIMA","MIRAFLORES","COLEGIO MEDICO DEL PERU","AV 28 DE JULIO 776",34],["LIMA","MIRAFLORES","SANTUARIO DEL COLEGIO MEDICO DE LIMA","MALECON DE LA RESERVA 791",11],["LIMA","MIRAFLORES","COLEGIO DE ABOGADOS DE LIMA","CALLE SANTANDER SN",10],["LIMA","MIRAFLORES","IE EMBLEMATICA 6050 JUANA ALARCO DE DAMMERT INICIAL","CALLE GERMAN APARICIO GOMEZ SANCHEZ SN",2],["LIMA","PACHACAMAC","IE 6100 SANTA MARIA REYNA","CALLE SN - CP QUEBRADA VERDE",12],["LIMA","PACHACAMAC","IE 667 RAYITO DE LUZ","CALLE 23 MZF6 SECTOR F",7],["LIMA","PACHACAMAC","IE 7259 VICTOR R. HAYA DE LA TORRE","AV LOS CLAVELES ALTO SN",29],["LIMA","PACHACAMAC","IE 7261 SANTA ROSA DE COLLANAC","AV SANTA ROSA DE COLLANAC SN",12],["LIMA","PACHACAMAC","IE 7262 MI NUEVO PERU","CALLE 5 SN",13],["LIMA","PACHACAMAC","IE 7266 LAS MERCEDES","CALLE GRUPO 5 PORTADA 2",15],["LIMA","PACHACAMAC","IE 7263 ROXANITA CASTRO WITTING - SECUNDARIA","CALLE 64 SN",11],["LIMA","PACHACAMAC","IEP SEÑOR DE LA ASCENSION","AV LA UNION SN R13 LT 17 C",20],["LIMA","PACHACAMAC","IEP CHARLES FINNEY","MZ H1LT 6 SECTOR H HM",8],["LIMA","PACHACAMAC","IEP EL UNIVERSO DE CESAR VALLEJO","CALLE MARIA MERCEDES MZG LT 25",9],["LIMA","PACHACAMAC","IE LOS JARDINES DE MANCHAY","AV LOS CRISANTEMOS SN",14],["LIMA","PACHACAMAC","IE 6006 SANTISIMA VIRGEN DE LOURDES","JR LOS NARANJOS SN MZ 35 LT 10",20],["LIMA","PACHACAMAC","IE 6007","JR PASAJE LOS INCAS SN",9],["LIMA","PACHACAMAC","IE 6028 JUAN VELASCO ALVARADO","AV PAUL POBLET LIND SN",8],["LIMA","PACHACAMAC","IE ROXANITA CASTRO WITTING - PRIMARIA","AV LAS PALMERAS SN",7],["LIMA","PACHACAMAC","IE 7102 SAN FRANCISCO DE ASIS","AV MANCHAY SN MZ F LT 1",14],["LIMA","PACHACAMAC","IE ACCION CONJUNTA SAN SALVADOR","AV ALAMEDA DEL DESCANSO SN",14],["LIMA","PACHACAMAC","IE ISAIAS ARDILES","AV EL DESCANSO SN",16],["LIMA","PACHACAMAC","IEP SANTISIMA VIRGEN DIVINA PASTORA","AV 1 DE MAYO MZ MZ I2 LT 1",11],["LIMA","PACHACAMAC","IE 7260 SEÑOR DE LOS MILAGROS","AV VICTOR MALASQUEZ SN",13],["LIMA","PACHACAMAC","COLEGIO MATEMATICO VIRGEN DEL CARMEN - PACHACAMAC","AV MANUEL VALLE 423 URB CASABLANCA",9],["LIMA","PACHACAMAC","IE 7258","AV LOS EUCALIPTOS MZ A LT 5 CPR LAS PALMAS",10],["LIMA","PACHACAMAC","IEP VIRGEN DE LA PUERTA","MZ C4 LT 12-13 SECTOR C HUERTOS DE MANCHAY",16],["LIMA","PACHACAMAC","IE PARROQUIAL VIRGEN DEL ROSARIO","AV MANCHAY SN MZ N7 LT 7A",13],["LIMA","PACHACAMAC","IE 7265 JOSE CARLOS MARIATEGUI","ALTO CLAVELES MZC8 LOTE 5",5],["LIMA","PUCUSANA","IE 6009 MIGUEL GRAU SEMINARIO","JR ANTONIO RAYMONDI SN",7],["LIMA","PUCUSANA","IEP DIVINO NIÑO JESUS DE PUCUSANA PRIMARIA","JR MANAOS 201 A MZ 26 LT 19",3],["LIMA","PUCUSANA","IEP LA MERCED DE PUCUSANA- PRIMARIA","MZ L 1 - 20 AAHH NUEVO PUCUSANA",3],["LIMA","PUCUSANA","IEI 550 REPUBLICA DEL JAPON","MZ D LT 13 AAHH NUEVA PUCUSANA",4],["LIMA","PUCUSANA","IE MANUEL SCORZA","MZ D SN NUEVO PUCUSANA",9],["LIMA","PUCUSANA","IE 6010 HILDA B. CARRILLO","JR UNION SN",9],["LIMA","PUCUSANA","IE MANUEL CALVO Y PEREZ","MZ S LT 1 CERRO COLORADO",9],["LIMA","PUEBLO LIBRE","IE 1074 REPUBLICA DE IRLANDA","JR MAIPU 302",6],["LIMA","PUEBLO LIBRE","IE 1076 RABINDRANATH TAGORE","JR MARTIN OVIEDO SN CUADRA 2",4],["LIMA","PUEBLO LIBRE","IEI 012 AUGUSTO PEREZ ARANIBAR","JR GENERAL LUNA IGLESIAS 196",6],["LIMA","PUEBLO LIBRE","COMPLEJO DEPORTIVO MAMA OCLLO","AV COLOMBIA 300",25],["LIMA","PUEBLO LIBRE","CETPRO FRANCISCO GARCIA CALDERON","AV SAN MARTIN 1377",3],["LIMA","PUEBLO LIBRE","IEP CRISTO REY","CALLE PARACAS 425",9],["LIMA","PUEBLO LIBRE","IESTP NACIONES UNIDAS","AV LA MARINA SN CUADRA 11",6],["LIMA","PUEBLO LIBRE","IEI 059 ANDRES BELLO","AV LA MARINA 1176",5],["LIMA","PUEBLO LIBRE","IDIOMAS PUCP","AV UNIVERSITARIA 1921",32],["LIMA","PUEBLO LIBRE","CEP EL CARMELO","CALLE ALFREDO MALDONADO SN",7],["LIMA","PUEBLO LIBRE","IE JOSE SANTOS CHOCANO","JR GALLESE 246",7],["LIMA","PUEBLO LIBRE","IE 1103 EMBLEMATICA ELVIRA GARCIA Y GARCIA","AV DEL RIO 155",38],["LIMA","PUEBLO LIBRE","IE 0011 MADRE LORETO GABARRE CIPRES","AV JOSE LEGUIA Y MELENDEZ SN",6],["LIMA","PUEBLO LIBRE","IE 0014 ANDRES BELLO","AV LA MARINA SN CUADRA 11",21],["LIMA","PUEBLO LIBRE","IE 1073 HERMANN BUSE DE LA GUERRA","AV GENERAL MANUEL VIVANCO 720",6],["LIMA","PUEBLO LIBRE","UNIVERSIDAD POLITECNICA DEL PERU","JR PEDRO RUIZ GALLO 251",21],["LIMA","PUEBLO LIBRE","UNIVERSIDAD NACIONAL FEDERICO VILLARREAL SEDE LOCAL 09","CALLE SAN MARCOS 351",3],["LIMA","PUEBLO LIBRE","ISET JUAN XIII","JR ALFREDO CADENAS 290",9],["LIMA","PUEBLO LIBRE","IE 0013 BERNARDO O HIGGINS","CALLE SAN MARCOS 380",5],["LIMA","PUEBLO LIBRE","IEP JORGE POLAR","CALLE CHEPEN 121",24],["LIMA","PUEBLO LIBRE","IE 04 NIÑO JESUS DE PRAGA","JR PARQUE ORQUIDEAS 163",6],["LIMA","PUEBLO LIBRE","INSTITUTO SUPERIOR CEPEA","AV BRASIL 1360",27],["LIMA","PUEBLO LIBRE","IEP EXPLORANDO","PARQUE JUSTA DORREGARAY 37",4],["LIMA","PUEBLO LIBRE","COMPLEJO DEPORTIVO DANIEL PEREDO","JR JOSE MANUEL UGARTECHE CUADRA 1",24],["LIMA","PUEBLO LIBRE","COMPLEJO DEPORTIVO TUPAC AMARU","CALLE HUAILLU ANCCO SN",31],["LIMA","PUEBLO LIBRE","ESCUELA NACIONAL DE ARCHIVISTICA","JR RODRIGUEZ DE MENDOZA 153",2],["LIMA","PUENTE PIEDRA","IE 2064 REPUBLICA FEDERAL DE ALEMANIA","AV SAN PEDRO DE CHOQUE AAHH SAN PEDRO",12],["LIMA","PUENTE PIEDRA","IEI 350","AV LAS ACACIAS CON CONQUISTADORES SN",8],["LIMA","PUENTE PIEDRA","IE 5165 REPUBLICA DE SUECIA","CALLE HUSARES DE JUNIN SN MZ S LOTE 6 Y 7",15],["LIMA","PUENTE PIEDRA","IE 5169 RAMIRO PRIALE PRIALE","JR HUARAZ MZ D LT 01 ASOC VIV ANTONIO RAYMONDI",9],["LIMA","PUENTE PIEDRA","IE 5172 HIJOS DE LUYA","JR AREQUIPA SN",14],["LIMA","PUENTE PIEDRA","IE 5178 VICTOR ANDRES BELAUNDE","AV TARAPACA SN",17],["LIMA","PUENTE PIEDRA","IE 8180 CELSO LINO RICALDI","CALLE SAN MARTIN MZ K LOTE 34",12],["LIMA","PUENTE PIEDRA","IE 8183 PITAGORAS","CALLE 6 MZ Y1 SN AAHH LOMAS DE ZAPALLAL",25],["LIMA","PUENTE PIEDRA","IE 8191 VIRGEN DE ARANZAZU","MZ Z4 LT 11 2DA DE PANCHA PAULA",8],["LIMA","PUENTE PIEDRA","IE 8194 LOS DISCIPULOS DE JESUS","MZ Z1 LOTE 172-173 AAHH LADERAS DE CHILLON",10],["LIMA","PUENTE PIEDRA","IEP GENES DEL NORTE","URB LEONCIO PRADO MZ N LT 169",17],["LIMA","PUENTE PIEDRA","IEP CRISTO REY EL SALVADOR","CALLE 4 MZ C LT 1 URB LOS HUERTOS DE COPACABANA",8],["LIMA","PUENTE PIEDRA","IEP DESPERTAR","MZ X LT 14 ASOC LAS FRESAS",10],["LIMA","PUENTE PIEDRA","IEP CASTILLO DEL REY","MZ H LT 41 -43 AAVV VALLE CHILLON",13],["LIMA","PUENTE PIEDRA","IEP CESAR VALLEJO","MZ A LT 6",6],["LIMA","PUENTE PIEDRA","IEP LAS AMERICAS","CALLE LOS LIRIOS MZ A LT 7 AAHH LOS LIRIOS",13],["LIMA","PUENTE PIEDRA","IE TECHNOLOGY SCHOOLS LAS VIÑAS","MZ D LT 4",11],["LIMA","PUENTE PIEDRA","IEP JULIO RAMON RIBEYRO","CALLE 3 MZ M LOTE 37-40",9],["LIMA","PUENTE PIEDRA","IEP LOS AMAUTAS DE ZAPALLAL","AV ANCON ASOC DE VIV LAS MAGNOLIAS MZ I LT 13",14],["LIMA","PUENTE PIEDRA","IEP MARIA REYNA DE LA PAZ","JR HUANCAYO 491 AAHH SANTA ROSA",9],["LIMA","PUENTE PIEDRA","IEP TESLA SCHOOL","CALLE LOS NARANJOS LT 197 - ZONA CALICHE",13],["LIMA","PUENTE PIEDRA","IEP VIRGEN DE GUADALUPE","AV SAN FRANCISCO SN MZ G LT 4-5",13],["LIMA","PUENTE PIEDRA","IEP SAN MIGUEL ARCANGEL","CALLE TRINITARIAS MZ 24 LT 01 -196",17],["LIMA","PUENTE PIEDRA","IEP SANTA MONICA","AV LAS TORRES MZ A LOTE 3 ASOC LAS FRESAS",7],["LIMA","PUENTE PIEDRA","IEP DANIEL ALCIDES CARRION","LAS MAGNOLIAS DE COPACABANA MZ I LT 22",9],["LIMA","PUENTE PIEDRA","IEP CIENCIAS SIGLO XXI","PROL URB PANCHA PAULA MZ A2 LOTE 13-14",12],["LIMA","PUENTE PIEDRA","IE 2067 LEONCIO PRADO","AV LEONCIO PRADO SN",13],["LIMA","PUENTE PIEDRA","IE 2068 JOSE MARIA ARGUEDAS","AV INDEPENDENCIA SN",13],["LIMA","PUENTE PIEDRA","IE 2069 SANTA ROSA","JR JOSE BALTA 300",12],["LIMA","PUENTE PIEDRA","IE 2081 PERU SUIZA","AV LAS PALMERAS SN",28],["LIMA","PUENTE PIEDRA","IE 3070 MARIA DE LOS ANGELES","AV BUENOS AIRES SN CUADRA 17 MZ K LT 9",17],["LIMA","PUENTE PIEDRA","IE 3071 MANUEL TOBIAS GARCIA CERRON","CALLE 9 DEJUNIO SN",33],["LIMA","PUENTE PIEDRA","IE 3073 EL DORADO","CALLE 3 SN",17],["LIMA","PUENTE PIEDRA","IE 3088 VISTA ALEGRE","CALLE LAS CONCHITAS SN",27],["LIMA","PUENTE PIEDRA","IE 3092 KUMAMOTO I","AV 15 DE JUNIO SN",21],["LIMA","PUENTE PIEDRA","IE 3711 FE Y ALEGRIA 12","JR AYACUCHO SN CUADRA 3",11],["LIMA","PUENTE PIEDRA","IE 3719 PARROQUIAL SANTISIMA TRINIDAD","AV SAENZ PEÑA SN",9],["LIMA","PUENTE PIEDRA","IE 5168 ROSA LUZ","JR LAS ORQUIDEAS 319",18],["LIMA","PUENTE PIEDRA","IE 5170 PERU ITALIA","CALLE 2 SN",13],["LIMA","PUENTE PIEDRA","IE 5173 GUSTAVO MOHME LLONA","AV TIWINZA SN MZ P LT 26",9],["LIMA","PUENTE PIEDRA","IE 5176 MARIA REICHE GROSSE","CALLE 2 MZ F",9],["LIMA","PUENTE PIEDRA","IE 5177 ALAMEDA DEL NORTE","CALLE LOS PINOS SN",17],["LIMA","PUENTE PIEDRA","IE 5179 LOS PINOS","MZ L LT 16",12],["LIMA","PUENTE PIEDRA","IE AUGUSTO B. LEGUIA","AV BUENOS AIRES SN",32],["LIMA","PUENTE PIEDRA","IEP MIGUEL DE CERVANTES","AV BUENOS AIRES SN",21],["LIMA","PUENTE PIEDRA","IEP ALFRED NOBEL","AV HEROES DEL CENEPA 952",9],["LIMA","PUENTE PIEDRA","IEP LOS CERVANTINOS","CALLE SN MZ J LOTE 3 - 5",11],["LIMA","PUENTE PIEDRA","IEP SOPHIANUM ZAPALLAL SAC","AV BUENOS AIRES 2665",19],["LIMA","PUENTE PIEDRA","IEP EL ROBLE","MZ G LT 1 - 2 Y 6 URB EL ROBLE",10],["LIMA","PUENTE PIEDRA","IEP SANTA ELENA","AV MALECON CHILLON SN",10],["LIMA","PUENTE PIEDRA","IEP JOHN A. MACKAY","AV BUENOS AIRES 1123",9],["LIMA","PUENTE PIEDRA","IEP SAN MARTIN DE PORRES","MZ K LT 9 AAHH BELLA AURORA",8],["LIMA","PUENTE PIEDRA","IEP MI AMIGO JESÚS","AV ANCON MZ B LT 38",12],["LIMA","PUENTE PIEDRA","IEP CIENCIAS Y HUMANIDADES","AV COPACABANA MZ B LT 6",8],["LIMA","PUENTE PIEDRA","IEI MODULO LA ENSENADA DE CHILLON","AV LAS ACACIAS SN",4],["LIMA","PUENTE PIEDRA","IE 5187","CALLE 22 LT L - LL",7],["LIMA","PUENTE PIEDRA","IE 5182 SEÑOR DE LOS MILAGROS","CALLE 2 SN MZ B",7],["LIMA","PUENTE PIEDRA","IE 5181 JOSE OLAYA BALANDRA","AV LOS NARANJOS MZ B LOTE 23",6],["LIMA","PUENTE PIEDRA","IE 5171 TUPAC AMARU II","MZ J LT 1 Y 2",5],["LIMA","PUENTE PIEDRA","IE 5166 BELLA AURORA","JR FRANCISCO BOLOGNESI SN",14],["LIMA","PUENTE PIEDRA","IE 2076 ABRAHAM LINCOLN","JR SAN LUCAS SN",14],["LIMA","PUENTE PIEDRA","IE 5167 VICTOR RAUL HAYA DE LA TORRE","JR JUAN PABLO II SN",7],["LIMA","PUENTE PIEDRA","IEP SAN AGUSTIN","CALLE LAS PONCIANAS MZ K LT 46",6],["LIMA","PUENTE PIEDRA","COLEGIO CRISTIANO JEDIMA","AV SAN LORENZO 732",17],["LIMA","PUENTE PIEDRA","IEP SANTISIMO CORAZON DE JESUS","CALLE SAN MARTIN SN MZ C LT 3A",13],["LIMA","PUENTE PIEDRA","IEP CERVANTES SCHOOL","MZ A LT 1 AL 4 RESIDENCIAL LA FLORESTA",22],["LIMA","PUENTE PIEDRA","IE 2065 JOSE ANTONIO ENCINAS","CALLE 9 DE JUNIO 151 CERCADO PUENTE DE PIEDRA",10],["LIMA","PUENTE PIEDRA","IEP SAN AGUSTIN - M","URB LAS BEGONIAS MZ B LT 10",7],["LIMA","PUENTE PIEDRA","IEP DIVINO CORAZÓN DE JESUS","ASOC PANAMERICANA MZ B LT 1-2",11],["LIMA","PUNTA HERMOSA","IE 6030 VICTOR A. BELAUNDE DIEZ CANSECO","AV GASTON GARCIA RADA SN",24],["LIMA","PUNTA HERMOSA","IEI 654 NUESTRA SEÑORA DEL CARMEN","CARRETERA PANAMERICANA SUR KM 43 MZ F1 LT 17-18-19-20",4],["LIMA","PUNTA HERMOSA","IEI 546 SANTISIMA CRUZ","CALLE CABO BLANCO SN",4],["LIMA","PUNTA NEGRA","IE 6027 CAP FAP RUDDY ECHEGARAY FAJARDO","AV EL ATUN SN",8],["LIMA","PUNTA NEGRA","IE SAN JOSE","AV LOS CISNES SN",7],["LIMA","PUNTA NEGRA","IEP DIVINA SANTA RITA DE CASIA","MZ F LT 1 - 6 URB ROCIO DEL MAR",10],["LIMA","RIMAC","IE 049 NUESTRA SEÑORA DE GUADALUPE","PJE CECILIA DEL RISCO SN",8],["LIMA","RIMAC","IE 3001 ESTADOS UNIDOS MEXICANOS","JR CHICLAYO 461",8],["LIMA","RIMAC","IE ESTHER CACERES SALGADO","PJE CECILIA DEL RISCO SN",23],["LIMA","RIMAC","IEP CESAR VALLEJO","MZ D LOTE 26 COOPERATIVA DE VIVIENDA 9 DE DICIEMBRE",7],["LIMA","RIMAC","IEP EL NIÑO JESUS DEL RIMAC","AV FRANCISCO PIZARRO 968 - 970",13],["LIMA","RIMAC","IEP NUESTRA SEÑORA DE LAS MERCEDES DEL BOSQUE - PRIMARIA","CALLE MONSERRATE 132",9],["LIMA","RIMAC","IEPGPE TTE CRL ALFREDO BONIFAZ FONSECA","AV MORRO DE ARICA 547",30],["LIMA","RIMAC","IE 2002 MARISCAL RAMON CASTILLA","JR CORONEL ELESPURO SN",16],["LIMA","RIMAC","IE 2073 RICARDO BENTIN PRIMARIA","AV RICARDO BENTIN 391",13],["LIMA","RIMAC","IE 2083 VIRGEN DEL CARMEN","PJE CECILIA DEL RISCO SN",15],["LIMA","RIMAC","IE 2099 ROSA MERINO","PJE LEONCIO PRADO SN",12],["LIMA","RIMAC","IE 3004 ESPAÑA","JR ATAHUALPA 127",13],["LIMA","RIMAC","IE 3014 LEONCIO PRADO","AV SAMUEL ALCAZAR SN",9],["LIMA","RIMAC","IE 3015 LOS ANGELES DE JESUS","AV EL SOL 598",13],["LIMA","RIMAC","IE 3021 SAN JUAN MACIAS","JR TRUJILLO SN",12],["LIMA","RIMAC","IE CARLOS PAREJA PAZ SOLDAN","CALLE LOS DESCALZOS SN",9],["LIMA","RIMAC","IE LUCIE RYNNING DE ANTUNEZ DE MAYOLO","JR ATAHUALPA 177",13],["LIMA","RIMAC","IE EMBLEMÁTICO MARÍA PARADO DE BELLIDO","CALLE ANTON SANCHEZ SN",50],["LIMA","RIMAC","IE EMBLEMÁTICA MERCEDES CABELLO DE CARBONERA","AV TUPAC AMARU 220",40],["LIMA","RIMAC","IE NACIONAL RIMAC","AV BRAULIO SANCHO DAVILA SN",25],["LIMA","RIMAC","IE RICARDO BENTIN SECUNDARIA","AV RICARDO BENTIN SN",35],["LIMA","RIMAC","UNIVERSIDAD NACIONAL DE INGENIERIA","AV TUPAC AMARU 210",40],["LIMA","RIMAC","IEP ENRIQUE NAPOLEON ESPINOSA PRIMARIA","AV RICARDO BENTIN 705",5],["LIMA","RIMAC","IEP ENRIQUE NAPOLEON ESPINOSA SECUNDARIA","AV RICARDO BENTIN 550",7],["LIMA","RIMAC","IE 2063 CORONEL JOSE FELIX BOGADO","MZ 22 LT UNICO 2DA ZONA SAN JUAN DE AMANCAES",20],["LIMA","RIMAC","IE 3012 JESUS DIVINO MAESTRO","PJE SATURNO 197",9],["LIMA","RIMAC","IE 3010 RAMÓN CASTILLA","JR MANCO INCA 342",11],["LIMA","RIMAC","IEI 389 VIRGEN DE LOURDES","JR CHICLAYO 436",4],["LIMA","RIMAC","CEBE RICARDO BENTIN","AV GUARDIA REPUBLICANA SN",8],["LIMA","RIMAC","IE 3019 PATRICIA TERESA RODRIGUEZ","AV LAS MERDECES 148",6],["LIMA","RIMAC","IE 3006 JOSE ERNESTO ECHENIQUE RODRIGUEZ","AV ALFONSO UGARTE 601",6],["LIMA","RIMAC","IE 3003 SAN CRISTOBAL","CALLE 10 SN HUERTA GUINEA",12],["LIMA","RIMAC","IEP CRISTO SALVADOR DEL RIMAC","CALLE AQUILINO SAN JARA MZ A LOTE 7",8],["LIMA","RIMAC","IE 3013","AV HECTOR GARCIA RIBEYRO 328",10],["LIMA","RIMAC","IEP NUESTRA SEÑORA DE LAS MERCEDES DEL BOSQUE - SECUNDARIA","CALLE 14 292-298 URB LA FLORIDA",9],["LIMA","RIMAC","IEP SAN JUAN BAUTISTA","MZ A LOTE 9 COOPERATIVA 9 DE DICIEMBRE",7],["LIMA","RIMAC","IEP INNOVA SCHOOLS RIMAC 2 SPORTING CRISTAL","AV ABELARDO GAMARRA SN URB EL BOSQUE",7],["LIMA","RIMAC","IEP INNOVA SCHOOLS - SANTO TORIBIO","JR VIRU 495",25],["LIMA","SAN BARTOLO","IE VICTOR MORON MUÑOZ","AV SAN JOSE SN",18],["LIMA","SAN BARTOLO","IEP MARIA ROSTWOROWSKY","AV PANAMERICANA LT 138 B TERCERA ETAPA",6],["LIMA","SAN BORJA","IEI 554 VIRGEN DE LOURDES","AV ARQUEOLOGIA SUPERMANZANA MZ G LT 18",5],["LIMA","SAN BORJA","COMPLEJO POLIDEPORTIVO LIMATAMBO","AV  MALACHOWSKY 560",37],["LIMA","SAN BORJA","COMPLEJO POLIDEPORTIVO SAN JUAN MASIAS","CALLE ALGUACIL SN",10],["LIMA","SAN BORJA","IEI NIÑO JESUS DE PRAGA","CALLE ANDREA DEL SARTO 300",3],["LIMA","SAN BORJA","UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS - FACULTAD DE MEDICINA VETERINARIA","AV CIRCUNVALACIÓN CUADRA 28",20],["LIMA","SAN BORJA","CEBE MARIA AUXILIADORA","AV PAUL LINDER SN CUADRA 5",7],["LIMA","SAN BORJA","CEP SAN FRANCISCO DE BORJA","CALLE VELASQUEZ SN CDRA 3",34],["LIMA","SAN BORJA","IE 6079 SANTISIMA NIÑA MARIA","CALLE PRIETO MASCAGNI 101",13],["LIMA","SAN BORJA","IE 7029 VIRGEN MILAGROSA","JR JUSTO PASTOR DAVILA 137",9],["LIMA","SAN BORJA","IE 7083 MANUEL GONZALES PRADA - PRIMARIA","PJE ABELARDO GAMARRA 160",11],["LIMA","SAN BORJA","IE 7083 MANUEL GONZALES PRADA - SECUNDARIA","CALLE COMERCIO 193",16],["LIMA","SAN BORJA","IE 7089 ROMEO LUNA VICTORIA","JR EDUARDO ORDOÑEZ 300",26],["LIMA","SAN BORJA","IEI 522 MARIA INMACULADA","AV PAUL LINDER 300",8],["LIMA","SAN BORJA","IEI 528 ALEGRIA DE JESUS","CALLE CLAUDE SAHUT SN",4],["LIMA","SAN BORJA","IEP SANTISIMO NOMBRE DE JESUS","CALLE ESMERALDA 135",20],["LIMA","SAN BORJA","IE LICEO NAVAL ALMIRANTE GUISE","CALLE MONTI 350",40],["LIMA","SAN BORJA","BIBLIOTECA NACIONAL DEL PERÚ","AV DE LA POESIA 160",20],["LIMA","SAN BORJA","ESCUELA SUPERIOR TECNICA SENCICO","AV DE LA POESIA 351",20],["LIMA","SAN BORJA","IEP AMADO DE DIOS - SECUNDARIA","AV AVIACION MZ B LT 6 URB PAPA JUAN  XXIII",5],["LIMA","SAN BORJA","IEP AMADO DE DIOS - PRIMARIA","AV AVIACION MZ B LT 26 URB PAPA JUAN  XXIII",7],["LIMA","SAN BORJA","IEP LIBERTADOR SAN MARTIN","CALLE JOHANN STRAUSS 478",16],["LIMA","SAN BORJA","UNIVERSIDAD PRIVADA SAN JUAN BAUTISTA","AV SAN LUIS 1923",19],["LIMA","SAN BORJA","IEP MARIA REICHE","CALLE BARTOLOME BERMEJO 148",9],["LIMA","SAN BORJA","IEP MARK TWAIN SCHOOL - PRIMARIA","CALLE 29  URB MARISCAL CASTILLA",6],["LIMA","SAN BORJA","IEP MARK TWAIN SCHOOL - SECUNDARIA","CALLE 29 ESQUINA CALLE 26 198",10],["LIMA","SAN BORJA","IEI MINISTERIO DE TRANSPORTES Y COMUNICACIONES","CALLE DE LA CIENCIA 205 URB TORRES DE SAN BORJA",9],["LIMA","SAN BORJA","INSTITUTO DE IDIOMAS PUCP","AV PRIMAVERA 907",9],["LIMA","SAN BORJA","COMPLEJO DEPORTIVO ROSA TORO","AV ROSA TORO 1315",27],["LIMA","SAN ISIDRO","COLEGIO DE LOS SAGRADOS CORAZONES BELEN","AV ALVAREZ CALDERON 761",38],["LIMA","SAN ISIDRO","IE PARROQUIAL REINA DE LA PAZ","CALLE ALFREDO SALAZAR 1290",22],["LIMA","SAN ISIDRO","COLEGIO MARIA REINA MARIANISTAS","AV PARDO Y ALIAGA 321",13],["LIMA","SAN ISIDRO","IE 1051 EL OLIVAR","PROL ARENALES 300",8],["LIMA","SAN ISIDRO","IE EMBLEMATICA ALFONSO UGARTE","AV PASEO DE LA REPUBLICA 3530",61],["LIMA","SAN ISIDRO","IE 138 MI CASITA DE SORPRESAS DEL MINISTERIO DEL INTERIOR","CALLE 32 147 CORPAC",7],["LIMA","SAN ISIDRO","IE EMBLEMATICA ALFONSO UGARTE - ESTADIO","CALLE CHACARILLA SN",65],["LIMA","SAN ISIDRO","ESTACIONAMIENTO PETROPERU","AV DEL PARQUE 120",55],["LIMA","SAN ISIDRO","UNIVERSIDAD TECNOLOGICA DEL PERU - ESCUELA DE POSTGRADO","AV SALAVERRY 2449",12],["LIMA","SAN JUAN DE LURIGANCHO","IE 0043 SAN CRISTOBAL","AV RIMAC SN",5],["LIMA","SAN JUAN DE LURIGANCHO","IEI 0060 CORAZON DE JESUS","AV LOS CISNES MZ D LT 27 ASCARRUNZ ALTO",5],["LIMA","SAN JUAN DE LURIGANCHO","IEI 062 SEÑOR DE LOS MILAGROS","PJE SANTA ROSA SN",5],["LIMA","SAN JUAN DE LURIGANCHO","IE 0070 HUASCAR","ENTRE LA MZ 7 Y MZ 9 DEL GRUPO 9 SECTOR A - HUASCAR",6],["LIMA","SAN JUAN DE LURIGANCHO","IE 0073 ARRIBA PERU","MZ 23 A LOTE 1 SEGUNDO PARQUE CENTRAL ARRIBA PERU",5],["LIMA","SAN JUAN DE LURIGANCHO","IEI 0079 CUNA JARDIN","JR VALLE DE CONDEBAMBA SN",4],["LIMA","SAN JUAN DE LURIGANCHO","IEI 0084 VIRGEN MARIA","JR BIGUA SN INCA MACO CAPAC",7],["LIMA","SAN JUAN DE LURIGANCHO","IE 0104","AV HEROES DEL CENEPA SN MZ L1 AH SANTA MARIA",5],["LIMA","SAN JUAN DE LURIGANCHO","IEI 0111 SANTA ROSA DE LIMA","JR COMANDANTE SOBERON SN MZ O5 - MZ O12",5],["LIMA","SAN JUAN DE LURIGANCHO","IEI 0115-02 NIÑO JESUS MARISCAL CHAPERITO","AV DEL PARQUE SN - II ETAPA AAHH 10 DE OCTUBRE",5],["LIMA","SAN JUAN DE LURIGANCHO","IEI 115 -10 MUNDO DEL SABER","CALLE MZ 5 - MZ 12 LT E - 16 CALLE COMANDANTE SOBERON",4],["LIMA","SAN JUAN DE LURIGANCHO","IEI 0115 - 11","AAHH JOSE CARLOS MARIATEGUI MZ X LOTE 3 ETAPA V",6],["LIMA","SAN JUAN DE LURIGANCHO","IEI 115 15 NIÑO JESUS","AV LOS GRANADOS SN",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 0141 VIRGEN DE COCHARCAS","MZ K LOTE 7 COOP VIVIENDA LA UNIÓN",10],["LIMA","SAN JUAN DE LURIGANCHO","IE 0156 EL PORVENIR","MZ F SN ASOC DE VIVIENDA EL PORVENIR URB CANTO GRANDE",9],["LIMA","SAN JUAN DE LURIGANCHO","IE 0167 MARIA REICHE","MZ Z AAHH CIUDAD DE LOS CONSTRUCTORES",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 0171 BUENOS AIRES","CALLE RUAM SN",5],["LIMA","SAN JUAN DE LURIGANCHO","IE 171-10 HANNI ROLFES","JR LOS GRANADOS MZ Q2 LOTE 1",12],["LIMA","SAN JUAN DE LURIGANCHO","IEI 098","AAHH HUANTA MZ P LOTE 1",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 10 DE MARZO","CALLE 2 PSJE 2 SN AH 10 DE MARZO",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 102","AV MIGUEL GRAU SN",9],["LIMA","SAN JUAN DE LURIGANCHO","IE 115-5 REPUBLICA HELENICA","CALLE LOS ZAFIROS SN",8],["LIMA","SAN JUAN DE LURIGANCHO","IE 117 SIGNOS DE FE","MZ B LOTE 01 - AAHH MANOS DE DIOS",26],["LIMA","SAN JUAN DE LURIGANCHO","IE 121 VIRGEN DE FATIMA","AV NUEVO PERU MZ D LOTE 7 8 PUEBLO JOVEN NUEVO PERU",8],["LIMA","SAN JUAN DE LURIGANCHO","IE 171 - 4 CONSUELO SOLEDAD CRISANTO SALINAS","MZ P LOTE 02 AAHH CESAR VALLEJO",9],["LIMA","SAN JUAN DE LURIGANCHO","IE 27 DE MARZO","PJE PROGRESO SN MZ O LOTE CE",4],["LIMA","SAN JUAN DE LURIGANCHO","IE CASA BLANCA DE JESUS","JR DELTA SN AAHH SU SANTIDAD JUAN PABLO II",20],["LIMA","SAN JUAN DE LURIGANCHO","IEP ARCA DE NOE","JR NEVADO HUASCARAN 311",12],["LIMA","SAN JUAN DE LURIGANCHO","IEP CAMBRIDGE","AV PROCERES DE LA INDEPENDENCIA 3680",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP COLEGIO PRIVADO UNI","AV 13 DE ENERO 2115 2117 LA HUAYRONA ETAPA I",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP CORAZON DE MARIA","JR FAUSTINO SANCHEZ CARRION SN",12],["LIMA","SAN JUAN DE LURIGANCHO","IEP HEROES DEL PACIFICO","MZ V1 LOTE 14 AH ENRIQUE MONTENEGRO",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP INNOVA SCHOOLS SJL EL PARQUE","AV EL PARQUE 760 URB CANTO GRANDE",26],["LIMA","SAN JUAN DE LURIGANCHO","IEP JUAN PABLO PEREGRINO","AV SAN MARTIN 169",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP LICEO FERMIN TANGUIS","AV CANTO GRANDE 308",39],["LIMA","SAN JUAN DE LURIGANCHO","IEP MUNDO DE COLORES SANTA ROSA","AV SANTA ROSA 1507 URB MANCO CAPAC 2DA ETAPA",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP PEDRO PAULET","JR RIO VILCANOTA 266",11],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN BENITO","JR LAS ORTIGAS 724",10],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN JUAN BAUTISTA DE LA SALLE","CALLE LOS PALMITOS 953",13],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN PEDRO","JR LOS BELEÑOS 275",10],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN VICENTE","AV CANTO GRANDE 2278",12],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTA MARIA DE FATIMA","JR CIRCUNVALACION MZ 3 LOTE 17",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTIAGO ANTUNEZ DE MAYOLO","PROL JR TEMPLO DEL SOL 588",9],["LIMA","SAN JUAN DE LURIGANCHO","IE SOLIDARIDAD III","AV LOS PROCERES MZ R LOTE 15",6],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTA MARIA VIRGEN DEL CARMEN","CALLE 3 MZ J1 LOTE 30 AAHH SANTA MARIA",6],["LIMA","SAN JUAN DE LURIGANCHO","IEP WISDOM SCHOOL","CALLE 8 MZ T1 LT 4A COOP SAN PEDRO",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN ANTONIO ABAD","JR BARCELONA 1503 AH TRABAJADORES DEL HOSPITAL DEL NIÑO",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP FLORA TRISTAN","JR LAS MANDRAGORAS 737",10],["LIMA","SAN JUAN DE LURIGANCHO","IEP JOSE INGENIEROS II","JR LOS RUBIES 1973 URB SAN HILARION 1ERA ETAPA",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP BENJAMIN FRANKLIN","CALLE LOS CEDROS MZ G LT 18 COOP EL VALLE CAMPOY",12],["LIMA","SAN JUAN DE LURIGANCHO","IEP CORAZON DE MARIA MILAGROSA","AV FERNANDO WIESSE MZ-K15 LOTE 17",19],["LIMA","SAN JUAN DE LURIGANCHO","IEP NIVEL A","MZ I LOTE 18-19 GRUPO 4 CRUZ DE MOTUPE",14],["LIMA","SAN JUAN DE LURIGANCHO","IEP ORION","MZ I LT 10 GRUPO 4 AAHH CRUZ DE MOTUPE CALLE 29",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAGRADO CORAZON DE JESUS","MZ Ñ LT 11 SECTOR 3 PJ ENRIQUE MONTENEGRO",10],["LIMA","SAN JUAN DE LURIGANCHO","IE CESAR VALLEJO","MZ V LOTE 1 AH CESAR VALLEJO",11],["LIMA","SAN JUAN DE LURIGANCHO","CEBE SEÑOR DE LA ESPERANZA","CALLE 12 SN",5],["LIMA","SAN JUAN DE LURIGANCHO","IEP APPU SAN CARLOS","JR LAS ARCILLAS 2762 URB SAN CARLOS",5],["LIMA","SAN JUAN DE LURIGANCHO","IEP ANDRES BELLO","JR CANTERAS MZ O1 LT OUV1 - SANTA MARIA",6],["LIMA","SAN JUAN DE LURIGANCHO","IEP COLEGIO BIBLICO CATOLICO","AV GRAN CHIMÚ 1857",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP SUDAMERICANO","CALLE MZ B1 LT 12 LOS CIPRESES",6],["LIMA","SAN JUAN DE LURIGANCHO","IEP APRENDAMOS DE JESUS","MZ A LT6 PUEBLO JOVEN PROYECTOS ESPECIALES 1 ETAPA",13],["LIMA","SAN JUAN DE LURIGANCHO","IEP DIVINA MISERICORDIA","AV EL SOL 376",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP JUAN PABLO II","AV LOS JARDINES 426",6],["LIMA","SAN JUAN DE LURIGANCHO","IEP MARIA DE LA MERCED","CALLE REAL SN",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP RIOS DE AGUA VIVA","JR LOS YUPANQUIS 486",10],["LIMA","SAN JUAN DE LURIGANCHO","IE FE Y ALEGRIA 37","MZ M1 P1 Q1 AAHH ENRIQUE MONTENEGRO SECTOR 5",14],["LIMA","SAN JUAN DE LURIGANCHO","CEBE SAN MATIAS DE JESUS","AV GRAN CHIMU 1780",15],["LIMA","SAN JUAN DE LURIGANCHO","CETPRO BAYOVAR","AV 1 DE MAYO SN MZ 32A LT 2 AAHH BAYOVAR",3],["LIMA","SAN JUAN DE LURIGANCHO","IE 0045 SAN ANTONIO","PJE TUMBES SN",7],["LIMA","SAN JUAN DE LURIGANCHO","IE 0071 NUESTRA SEÑORA DE LA MERCED","AV CANTO GRANDE SN",27],["LIMA","SAN JUAN DE LURIGANCHO","IE 0073 BENITO JUAREZ","JR LOS AMAUTAS 1560",18],["LIMA","SAN JUAN DE LURIGANCHO","IE 0086 JOSE MARIA ARGUEDAS","CALLE LAS GARDENIAS SN",27],["LIMA","SAN JUAN DE LURIGANCHO","IE 0087 JOSE MARIA ARGUEDAS","JR GERMANIO SN",22],["LIMA","SAN JUAN DE LURIGANCHO","IE 0088 NUESTRA SEÑORA DEL CARMEN","AV PRIMAVERA DE CAMPOY SN",12],["LIMA","SAN JUAN DE LURIGANCHO","IE 0089 MANUEL GONZALES PRADA","AV PRINCIPAL SN MZ D LT6 - CAMPOY",19],["LIMA","SAN JUAN DE LURIGANCHO","IE 0090 DANIEL ALCIDES CARRION","AV PRINCIPAL SN",17],["LIMA","SAN JUAN DE LURIGANCHO","IE 0091 SANTA FE","JR LOS ROSALES MZ D LT 13 PJ SANTA FE",17],["LIMA","SAN JUAN DE LURIGANCHO","IE 0092 ALFRED NOBEL","JR LAS GRAVAS 2032",23],["LIMA","SAN JUAN DE LURIGANCHO","IE 116 ABRAHAM VALDELOMAR","AV CANTO GRANDE SN",30],["LIMA","SAN JUAN DE LURIGANCHO","IE 0136 SANTA ROSA MILAGROSA","JR RIO TUMBES SN",10],["LIMA","SAN JUAN DE LURIGANCHO","IE 143 SOLIDARIDAD II","AV PROCERES SN",11],["LIMA","SAN JUAN DE LURIGANCHO","IE 145 INDEPENDENCIA AMERICANA - SECUNDARIA","PJE TRES CRUCES SN - HUASCAR",9],["LIMA","SAN JUAN DE LURIGANCHO","IE 0146 SU SANTIDAD JUAN PABLO II","JR PARALELO SN",35],["LIMA","SAN JUAN DE LURIGANCHO","IE 151 MICAELA BASTIDAS","CALLE 60",33],["LIMA","SAN JUAN DE LURIGANCHO","IE 0152 JOSE CARLOS MARIATEGUI","AV AMPLIACIÓN OESTE SN",39],["LIMA","SAN JUAN DE LURIGANCHO","IE 0155 JOSE ANTONIO ENCINAS FRANCO","JR LAS ACACIAS SN",7],["LIMA","SAN JUAN DE LURIGANCHO","IE 158 SANTA MARIA","CALLE D SN AAHH SANTA MARIA",33],["LIMA","SAN JUAN DE LURIGANCHO","IE 171 01 JUAN VELASCO ALVARADO","CALLE MARIANO NECOCHEA SN - EX LOSA DEPORTIVA MZ R Y S",23],["LIMA","SAN JUAN DE LURIGANCHO","IE 100","JR CENTAURO 2502 - PARQUE STA ELIZABETH",20],["LIMA","SAN JUAN DE LURIGANCHO","IE 109 INCA MANCO CAPAC","JR LOS APATITOS SN",20],["LIMA","SAN JUAN DE LURIGANCHO","IE 110 SAN MARCOS","JR LOS RUISEÑORES SN",9],["LIMA","SAN JUAN DE LURIGANCHO","IE 1172 CIRO ALEGRIA","JR VILLAC UMO 441",18],["LIMA","SAN JUAN DE LURIGANCHO","IE 1173 JULIO C TELLO","JR PLAZA PRINCIPAL SN EL PUEBLITO",18],["LIMA","SAN JUAN DE LURIGANCHO","IE 1174 VIRGEN DEL CARMEN","JR LOS AMAUTAS 248 - ZARATE",25],["LIMA","SAN JUAN DE LURIGANCHO","IE 1178 JAVIER HERAUD","JR AREQUIPA SN",17],["LIMA","SAN JUAN DE LURIGANCHO","IE 1179 TOMAS ALVA EDISON","JR YACHAYHUASI SN",15],["LIMA","SAN JUAN DE LURIGANCHO","IE 1181 ALBERT EINSTEIN","JR LOS EBANOS SN",17],["LIMA","SAN JUAN DE LURIGANCHO","IE 1183 SAUL CANTORAL HUAMANI","AV SAUL CANTORAL HUAMANI SN",17],["LIMA","SAN JUAN DE LURIGANCHO","IE 119 CANTO BELLO","AV CANTO BELLO SN",18],["LIMA","SAN JUAN DE LURIGANCHO","IE 0120 MANUEL ROBLES ALARCON","AV 1 DE MAYO SN",24],["LIMA","SAN JUAN DE LURIGANCHO","IE 122 ANDRES AVELINO CACERES","JR PALLKA SN",22],["LIMA","SAN JUAN DE LURIGANCHO","IE 125 RICARDO PALMA","AV JOSE CARLOS MARIATEGUI SN",27],["LIMA","SAN JUAN DE LURIGANCHO","IE 126 JAVIER PEREZ DE CUELLAR","PARQUE 01 SOLIDARIDAD - LA HUAYRONA",14],["LIMA","SAN JUAN DE LURIGANCHO","IE 128 LA LIBERTAD","JR ENERGITAS SN",13],["LIMA","SAN JUAN DE LURIGANCHO","IE 130 HEROES DE CENEPA","JR LA RIMARINAS SN URB SAN HILARION",18],["LIMA","SAN JUAN DE LURIGANCHO","IE 131 MONITOR HUASCAR","PJE AMAZONAS SN",13],["LIMA","SAN JUAN DE LURIGANCHO","IE 132 TORIBIO DE LUZURIAGA Y MEJIA SECUNDARIA","JR NEVADO DE HUASCARAN",5],["LIMA","SAN JUAN DE LURIGANCHO","IE 134 MARIO FLORIAN","JR LAS SENSITIVAS CDRA 3",15],["LIMA","SAN JUAN DE LURIGANCHO","IE 135 TORIBIO RODRIGUEZ DE MENDOZA","JR RIO SANTA SN",7],["LIMA","SAN JUAN DE LURIGANCHO","IE 137 MIGUEL GRAU SEMINARIO","JR PLUTON SN",35],["LIMA","SAN JUAN DE LURIGANCHO","IE 138 PROCERES DE LA INDEPENDENCIA","JR REJALGAR 785",20],["LIMA","SAN JUAN DE LURIGANCHO","IE 139 GRAN AMAUTA MARIATEGUI","CALLE C AAHH SANTA MARIA",18],["LIMA","SAN JUAN DE LURIGANCHO","IE 140 SANTIAGO ANTUNEZ DE MAYOLO","AV REPUBLICA DE POLONIA SN",17],["LIMA","SAN JUAN DE LURIGANCHO","IE 0142 MARTIR DANIEL ALCIDES CARRION - SECUNDARIA","AV CENTRAL SN",18],["LIMA","SAN JUAN DE LURIGANCHO","IE 0144 LOS ALAMOS","CALLE RIO PASTAZA SN",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 0147 CAP LUIS ALBERTO GARCIA ROJAS","JR LOS JOBOS 460",15],["LIMA","SAN JUAN DE LURIGANCHO","IE 0148 MAESTRO VICTOR RAUL HAYA DE LA TORRE","CALLE ROTHERDAM MZ 14C LT 1 AAHH ARRIBA PERU",19],["LIMA","SAN JUAN DE LURIGANCHO","IE 149 CAPITAN PNP JORGE CIEZA LACHOS","JR SOCHIN SN",8],["LIMA","SAN JUAN DE LURIGANCHO","IE 153 ALEJANDRO SANCHEZ ARTEAGA","AV REPUBLICA DE POLONIA MZ W4 LT 1",7],["LIMA","SAN JUAN DE LURIGANCHO","IE 0105 YOY MARINA GARATE BARDALES","PARQUE PRINCIPAL SN GRUPO 2 CRUZ DE MOTUPE",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 154 CARLOS NORIEGA JIMENEZ","CALLE 12 MZ M LT 13 ASOCIACION DE VIVIENDA ISRAEL",12],["LIMA","SAN JUAN DE LURIGANCHO","IE 159 GLORIOSO 10 DE OCTUBRE","CALLE S MARTINEZ SN",25],["LIMA","SAN JUAN DE LURIGANCHO","IE 0160 SOLIDARIDAD I","MZ S LT 6 III ETAPA CAMPOY",14],["LIMA","SAN JUAN DE LURIGANCHO","IE 161 MOISES COLONIA TRINIDAD","JR FERNANDO DE ARAGON II SN",15],["LIMA","SAN JUAN DE LURIGANCHO","IE 162 SAN JOSE OBRERO","AV AMPLIACIÓN ESTE SN",23],["LIMA","SAN JUAN DE LURIGANCHO","IE 0163 TTE CORONEL NESTOR ESCUDERO OTERO","JR MAR JONCO SN AAHH ENRIQUE MONTENEGRO",29],["LIMA","SAN JUAN DE LURIGANCHO","IE 168 AMISTAD PERU JAPON","JR LAS GRAVAS SN",7],["LIMA","SAN JUAN DE LURIGANCHO","IE 169","AV JORGE BASADRE SN",11],["LIMA","SAN JUAN DE LURIGANCHO","IE ANTONIA MORENO DE CACERES","JR AUGUSTO B LEGUIA SN",27],["LIMA","SAN JUAN DE LURIGANCHO","IE FE Y ALEGRIA 26","AV NACIONES UNIDAS SN MZ 40 - AAHH ARRIBA PERU",18],["LIMA","SAN JUAN DE LURIGANCHO","IE FE Y ALEGRIA 32","AV EL MERCADO SN AAHH SU SANTIDAD JUAN PABLO II",15],["LIMA","SAN JUAN DE LURIGANCHO","IE FE Y ALEGRIA 5","PJE HIPOLITO UNANUE 105",19],["LIMA","SAN JUAN DE LURIGANCHO","IE FE Y ALEGRIA 4","PJE RAUL PORRAS BARRENECHEA SN",17],["LIMA","SAN JUAN DE LURIGANCHO","IE FRANCISCO BOLOGNESI CERVANTES - SECUNDARIA","AV SAN MARTIN SN",13],["LIMA","SAN JUAN DE LURIGANCHO","IE PNP CABO GC MARTIN F ESQUICHA BERNEDO","AV LAS LOMAS SN MANGOMARCA",7],["LIMA","SAN JUAN DE LURIGANCHO","IE NICOLAS COPERNICO","AV FERNANDO WIESSE SN",32],["LIMA","SAN JUAN DE LURIGANCHO","IE RAMIRO PRIALE PRIALE","JR CONTADORES SN COOPERATIVA LA UNION",10],["LIMA","SAN JUAN DE LURIGANCHO","IEI 041 EL BOSQUECITO","AV LOS CIRUELOS SN",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP INCA GARCILASO DE LA VEGA","AV CANTO GRANDE 198",10],["LIMA","SAN JUAN DE LURIGANCHO","IEP MARISCAL CACERES","AV HEROES DEL CENEPA MZ O6 LT 31",14],["LIMA","SAN JUAN DE LURIGANCHO","IEP PITAGORAS EL MATEMATICO","JR ARENISCAS SN MZ X LT 11 URB LA HUAYRONA",10],["LIMA","SAN JUAN DE LURIGANCHO","IESTP MANUEL SEOANE CORRALES","AV FERNANDO WIESSE SN - CUADRA 44",18],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTO DOMINGO DE GUZMAN - PRIMARIA","JR JOSE ANTONIO ENCINAS 430 - 2",30],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTO DOMINGO DE GUZMAN - SECUNDARIA","JR JOSE ANTONIO ENCINAS 470",27],["LIMA","SAN JUAN DE LURIGANCHO","IE 0036 MADRE MARIA AUXILIADORA","PJE RAUL PORRAS BARRENECHEA SN",6],["LIMA","SAN JUAN DE LURIGANCHO","IE 0069 MACHU PICCHU","JR QUILLABAMBA 281",9],["LIMA","SAN JUAN DE LURIGANCHO","IE EMBLEMATICA ANTENOR ORREGO ESPINOZA","AV GRAN CHIMU SN",19],["LIMA","SAN JUAN DE LURIGANCHO","IE 171-02 LAS TERRAZAS","AV LOS LIBERTADORES SN",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP CRISTIANO INTERNACIONAL ELIM","JR LOS OLMOS 128",19],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTA RITA DE CASIA","AV EL SOL 134",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP ILUSTRE RICARDO PALMA","CALLE LOS GLADIOLOS 736",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN MATEO","AV CENTRAL 3814",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN RAFAEL - SECUNDARIA","CALLE MARIA PARADO DE BELLIDO SN",10],["LIMA","SAN JUAN DE LURIGANCHO","IEP JUAN ESPINOZA MEDRANO","JR ESTE SN MZ C10 LT 26 27 28",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP CRECIENDO CON AMOR","AV LOS EUCALIPTOS 313",13],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTA CUARESMA","JR LAS PERLAS 1871 -1873",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP JOSE ABELARDO QUIÑONES GONZALES","JR TUPAC CATARI SN AAHH JUAN PABLO II",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP JESUS DIVINO MAESTRO","AV SAUL CANTORAL HUAMANI SN MZ E LT 3",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP HIGH SCHOOL BABY KINDER - SECUNDARIA","CALLE MANUEL PRADO SN MZ I9 LT 15-16",5],["LIMA","SAN JUAN DE LURIGANCHO","IEP MAVE SCHOOL","JR SAN ENRIQUE 967A",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTA CUARESMA II","JR LAS PERLAS 1881-1883",13],["LIMA","SAN JUAN DE LURIGANCHO","IEP CRISTO NAZARENO","JR LAS MARGANITAS 1790",6],["LIMA","SAN JUAN DE LURIGANCHO","IEP ANNA D´AMBROSIO","AV CIRCUNVALACION 5546",11],["LIMA","SAN JUAN DE LURIGANCHO","IEP FEDERICO VILLARREAL","AV EL MURO MZ A1 LOTE 10",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTA TERESITA DE ALENZON","CALLE LOS CEDRONES 928",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP MATER PURISSIMA","AV RIMAC 119",11],["LIMA","SAN JUAN DE LURIGANCHO","IEP ANGELES DE LA VIRGEN DE FATIMA - LA ESCALERITA","MZ 163 LOTE 34 - GRUPO 18 - HUASCAR",5],["LIMA","SAN JUAN DE LURIGANCHO","IEP LOS NIÑOS DE HELAMAN","JR INTERMEDIO MZ Q10 LT 1",5],["LIMA","SAN JUAN DE LURIGANCHO","IEP PITAGORAS SJL","AV AMPLIACION MZ I4 LOTE 35",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP ADVENTISTA EL BUEN PASTOR","CALLE EL COLLAR 467 Y PJE SN URB CANTO REY",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP VICTORIA BARCIA BONIFFATTI","JR LAS CHULPAS 521",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN RAFAEL - PRIMARIA","CALLE MARIA PARADO DE BELLIDO 244 (PUERTA 3)",12],["LIMA","SAN JUAN DE LURIGANCHO","IEP MASTER UNI","CALLE CHECTUYOC MZ H1 LT 4",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP MARIA MONTESSORI","MZ M9 LT 12-13-14 Y 15 - MARISCAL CACERES",13],["LIMA","SAN JUAN DE LURIGANCHO","IEP PIERRE DE FERMAT","AV CANTO GRANDE SN",11],["LIMA","SAN JUAN DE LURIGANCHO","IEP FERMIN TANGUIS - CAMPOY","CALLE 14 MZ Ñ LOTE 8",5],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN FELIPE","CALLE LOS NOGALES 469",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAGRADO CORAZON","CALLE 24 MZ P1 LT12",11],["LIMA","SAN JUAN DE LURIGANCHO","IEP SM MENTOR SCHOOL","CALLE SN MZ W LT 6 AAHH PEREZ DE CUELLAR II ETAPA",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP SIGMA","CALLE SEBASTIAN PAGADOR MZ O6 LT 6",7],["LIMA","SAN JUAN DE LURIGANCHO","IEP SACO OLIVEROS DE NUEVO SAN JUAN","CALLE LAS LIANAS SN",31],["LIMA","SAN JUAN DE LURIGANCHO","IEP VASILI SUJOMLINSKY","JR TEMPLO DEL SOL MZ Ñ1 LT 29",17],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN ANTONIO DE PADUA - SECUNDARIA","MZ A4 LT 14 -15-16 - MARISCAL CACERES",17],["LIMA","SAN JUAN DE LURIGANCHO","IEP ANGLO AMERICANO","AV PIEDRA LUNA MZ N LT1",13],["LIMA","SAN JUAN DE LURIGANCHO","IEI 037 SANTA ROSA","JR YACHAYHUASI SN - FUNDO ZARATE",4],["LIMA","SAN JUAN DE LURIGANCHO","IEE 1182 - EL BOSQUE","AV LOS CIRUELOS 898 - URB CANTO REY",31],["LIMA","SAN JUAN DE LURIGANCHO","IEP LU SIN SCHOOL","MZ F11 LT 40 Y 41- MARISCAL CACERES",10],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN CRISTOBAL SALVADOR","JR ENRIQUE LUNA MZ I13 LT 4",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP GUILLERMO SHAKESPEARE","CALLE GUZMAN BLANCO MZ T5 LT 25",15],["LIMA","SAN JUAN DE LURIGANCHO","IE 166 KAROL WOJTYLA","JR J SN - AAHH CIUDAD CONSTRUCTORES",11],["LIMA","SAN JUAN DE LURIGANCHO","IEP CHRISTIAAN NEETHLING BARNARD","MAR DE BERING SN MZ V1 LT 1 SECTOR C",13],["LIMA","SAN JUAN DE LURIGANCHO","IEP NUEVO PITAGORAS","JR TURMALINAS 518",9],["LIMA","SAN JUAN DE LURIGANCHO","IEP JOSEPH NOVAK SCHOOL","CALLE LOS CIRUELOS 232 - URB SEMI RUSTICA",10],["LIMA","SAN JUAN DE LURIGANCHO","IEI CUNA JARDIN PADRE CARLOS","CALLE 8 MZ J LOTE 11 - III ETAPA",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 164 EL AMAUTA - SECUNDARIA","AV HEROES DEL CENEPA SN",8],["LIMA","SAN JUAN DE LURIGANCHO","IE TUPAC AMARU II","MZ I LT 21 2 ETAPA GRUPO 7 PJ CRUZ DE MOTUPE",6],["LIMA","SAN JUAN DE LURIGANCHO","IE 132 TORIBIO DE LUZURIAGA Y MEJIA PRIMARIA","JR NEVADO HUANDOY SN PARQUE DE LA COMISARIA SANTA ELIZABETH",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP CIRCULO A1 SCHOOL","JR LOS MEDICOS LT2",11],["LIMA","SAN JUAN DE LURIGANCHO","IE 171-05 LOS ANGELES","JR LAS NEBULOSAS SN",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP JOSE INGENIEROS","JR ISABEL 1 MZ B LOTE 32",10],["LIMA","SAN JUAN DE LURIGANCHO","IEP SAN ANTONIO DE PADUA - PRIMARIA","MZ A5 LT 18 Y 19 - MARISCAL CACERES",7],["LIMA","SAN JUAN DE LURIGANCHO","IE 145 INDEPENDENCIA AMERICANA - PRIMARIA","PJE TRES CRUCES SN - HUASCAR",18],["LIMA","SAN JUAN DE LURIGANCHO","IE FRANCISCO BOLOGNESI CERVANTES - INICIAL","PJE AYAVIRI SN",4],["LIMA","SAN JUAN DE LURIGANCHO","IEP SANTA MARIA Y JESUS","JR MARISCAL MILLER 137 URB SAN RAFAEL",8],["LIMA","SAN JUAN DE LURIGANCHO","IEP YACHAY HUASI","JR LIBERTAD MZ 40 LT 4 GRUPO 8 HUASCAR 2",6],["LIMA","SAN JUAN DE LURIGANCHO","IEI JOYITAS DE MARIA I","JR LANGUI SN COOPERATIVA CANTO GRANDE",4],["LIMA","SAN JUAN DE LURIGANCHO","IE FRANCISCO BOLOGNESI CERVANTES - PRIMARIA","JR LANGUI SN",12],["LIMA","SAN JUAN DE LURIGANCHO","IEP SACO OLIVEROS SEDE EL ROSARIO","JR EL ROSARIO 670",13],["LIMA","SAN JUAN DE LURIGANCHO","IEI 115 - 21","CALLE 27 SN III ZONA DE JUAN PABLO II",4],["LIMA","SAN JUAN DE LURIGANCHO","IE 157 CAP FAP JOSE ABELARDO QUIÑONES","AV SAN MARTIN SN SECTOR II DE JUAN PABLO II",14],["LIMA","SAN JUAN DE LURIGANCHO","IE 170 SANTA ROSA DEL SAUCE","AV LAS ROSAS SN AAHH SANTA ROSA DEL SAUCE",9],["LIMA","SAN JUAN DE LURIGANCHO","CENTRO PREUNIVERSITARIO DE LA UNMSM CENTRO DE IDIOMAS Y EP DE INGENIERIA AGROINDUSTRIAL","AV FERNANDO WIESSE 4756",25],["LIMA","SAN JUAN DE LURIGANCHO","IEP MEGA UNI SCHOOLS","AV CANTO GRANDE SN MZ J2 LT 29 VILLA HERMOSA",19],["LIMA","SAN JUAN DE LURIGANCHO","IE 0142 MARTIR DANIEL ALCIDES CARRION - PRIMARIA","AV RIO SANTIAGO 514",6],["LIMA","SAN JUAN DE LURIGANCHO","IEP INNOVA SCHOOLS SJL ARABISCOS","CALLE LOS HINOJOS 1237 LOS JARDINES DE SAN JUAN",13],["LIMA","SAN JUAN DE LURIGANCHO","IEP INNOVA SCHOOLS SJL EL SOL","CALLE LOS MANGOS 221 URB CANTO GRANDE",29],["LIMA","SAN JUAN DE LURIGANCHO","IEP INNOVA SCHOOLS - SEDE CAMPOY","CALLE 5 MZ M LT 38 3B – A CAMPOY 1 ETAPA",34],["LIMA","SAN JUAN DE LURIGANCHO","IE 164 EL AMAUTA - PRIMARIA","MZ F LT 2 Y 3 - AAHH JAIME ZUBIETA",5],["LIMA","SAN JUAN DE LURIGANCHO","IE 150 HÉROES DE LA BREÑA","JR HÉROES DE LA BREÑA SN",6],["LIMA","SAN JUAN DE MIRAFLORES","IE 6078 SANTA ROSA","JR ANTONIO OLIVEIRA SN",8],["LIMA","SAN JUAN DE MIRAFLORES","IE 7219 ARISTOTELES","CALLE LOS DATILES SN",5],["LIMA","SAN JUAN DE MIRAFLORES","IE 7230","FLORES DE VILLA MZ A LT 2",22],["LIMA","SAN JUAN DE MIRAFLORES","IEP DIVINO MAESTRO DE PAMPLONA","AV SOLIDARIDAD SN MZ T3 LT 21 PAMPLONA",6],["LIMA","SAN JUAN DE MIRAFLORES","IE FE Y ALEGRIA 65","AV EL MIRADOR II SN NUEVA RINCONADA",33],["LIMA","SAN JUAN DE MIRAFLORES","IEP FERMIN TANGUIS","JOAQUIN BERNAL 370 ZONA A",32],["LIMA","SAN JUAN DE MIRAFLORES","IEP LA VILLA DE SAN FRANCISCO","JR LOS CORALES 1194",8],["LIMA","SAN JUAN DE MIRAFLORES","IEP LUZ Y ESPERANZA","CALLE LOS EUCALIPTOS MZ H LT 9",19],["LIMA","SAN JUAN DE MIRAFLORES","IEP JESUS OBRERO","SECTOR 5 DE MAYO MZ N6 LT 8",8],["LIMA","SAN JUAN DE MIRAFLORES","IE 7227 HORACIO ZEBALLOS GAMEZ","AV MAGISTERIAL URB HORACIO ZEBALLOS SN",11],["LIMA","SAN JUAN DE MIRAFLORES","IE PARROQUIAL VIRGEN DE LA ASUNCION","AV SAN JUAN CUADRA 11 MZ S1A",9],["LIMA","SAN JUAN DE MIRAFLORES","IEP SAN MARCOS PRIMARIA","JR ANDRES GUZMAN 743",7],["LIMA","SAN JUAN DE MIRAFLORES","IESTP FE Y ALEGRIA 75","AV SAN JUAN 1538",9],["LIMA","SAN JUAN DE MIRAFLORES","IEP RVDO HNO GASTON MARIA SA","AV LOS HEROES 940",10],["LIMA","SAN JUAN DE MIRAFLORES","IEP PARROQUIAL SAN MARTINCITO DE PORRES","AV CONFRATERNIDAD MZ A10 LT 1",16],["LIMA","SAN JUAN DE MIRAFLORES","IE 7211 VIRGEN INMACULADA","MZ A LT AV MIGUEL IGLESIAS",8],["LIMA","SAN JUAN DE MIRAFLORES","IEP EL MUNDO DEL DIVINO NIÑO","CALLE 10 LT 20 A1 SUB LT 08",9],["LIMA","SAN JUAN DE MIRAFLORES","IE 629 6034 CESAR CARBONELL RODRIGUEZ","JR ISMAEL PAGADOR SN",19],["LIMA","SAN JUAN DE MIRAFLORES","IE 6037 INCA PACHACUTEC - PRIMARIA","AV LOS HEROES 921",15],["LIMA","SAN JUAN DE MIRAFLORES","IE 6037 INCA PACHACUTEC - SECUNDARIA","JR ENRIQUE DEL VILLLAR SN",20],["LIMA","SAN JUAN DE MIRAFLORES","IE 6038 OLLANTAY","CALLE SN",30],["LIMA","SAN JUAN DE MIRAFLORES","IE 6041 ALFONSO UGARTE","CALLE 2 SN",10],["LIMA","SAN JUAN DE MIRAFLORES","IE 6089 JORGE BASADRE GROHMANN","AV CONFRATERNIDAD MZ 43 - 44 PAMPLONA ALTA",23],["LIMA","SAN JUAN DE MIRAFLORES","IE 6096 ANTONIO RAIMONDI","AV PEDRO SILVA 1095 ZONA C",13],["LIMA","SAN JUAN DE MIRAFLORES","IE 6151 SAN LUIS GONZAGA","JR FRANCISCO BOLOGNESI SN",30],["LIMA","SAN JUAN DE MIRAFLORES","IE 7035 LEONCIO PRADO","JR PUNO MZ P LOTE 10",27],["LIMA","SAN JUAN DE MIRAFLORES","IE 7059 JOSE ANTONIO ENCINAS FRANCO","CALLE SN",21],["LIMA","SAN JUAN DE MIRAFLORES","IE 7060 ANDRES AVELINO CACERES","AV LOS LIBERTADORES SN",13],["LIMA","SAN JUAN DE MIRAFLORES","IE 7062 NACIONES UNIDAS","JR JOAQUIN BERNAL SN",30],["LIMA","SAN JUAN DE MIRAFLORES","IE 7063 ANDRES AVELINO CACERES","JR JESUS MORALES 416 - ZONA B",18],["LIMA","SAN JUAN DE MIRAFLORES","IE 7067 TORIBIO SEMINARIO","JR BUENAVENTURA REY SN",18],["LIMA","SAN JUAN DE MIRAFLORES","IE 7069 CESAR VALLEJO","AV GABRIEL TORRES 200",23],["LIMA","SAN JUAN DE MIRAFLORES","IE 7079 RAMIRO PRIALE PRIALE","AV MIGUEL IGLESIAS SN",27],["LIMA","SAN JUAN DE MIRAFLORES","IE 7082 JUAN DE ESPINOSA MEDRANO","AV 5 DE MAYO SN",11],["LIMA","SAN JUAN DE MIRAFLORES","IE 7087 EL NAZARENO","JR BELEN SN MZ H1 LT 1",17],["LIMA","SAN JUAN DE MIRAFLORES","IE 7099 HECTOR PRETELL CARBONEL","AV ANDRES AVELINO CACERES SN",8],["LIMA","SAN JUAN DE MIRAFLORES","IE 7207 MARISCAL RAMON CASTILLA","CALLE CIPRESES CDRA 3",25],["LIMA","SAN JUAN DE MIRAFLORES","IE 7221 LA RINCONADA","AV EDILBERTO RAMOS SN",13],["LIMA","SAN JUAN DE MIRAFLORES","IE 7223 MIGUEL COLINA MARIE","CALLE LAS BEGONIAS SN",5],["LIMA","SAN JUAN DE MIRAFLORES","IE CESAR VALLEJO","AV NEPOMUCENO VARGAS CUADRA 3 SN",14],["LIMA","SAN JUAN DE MIRAFLORES","IE DE ACCION CONJUNTA PADRE ILUMINATO","AV PEDRO MIOTTA 221",25],["LIMA","SAN JUAN DE MIRAFLORES","IE FE Y ALEGRIA 3","AV NEPOMUCENO VARGAS 567",24],["LIMA","SAN JUAN DE MIRAFLORES","IE JAVIER HERAUD","AV SAN JUAN 690",35],["LIMA","SAN JUAN DE MIRAFLORES","IE JULIO CESAR ESCOBAR","CALLE GENARO NUMA LLONA SN",10],["LIMA","SAN JUAN DE MIRAFLORES","IE EMBLEMATICA SAN JUAN","AV GUILLERMO BILLINGHURST 812",30],["LIMA","SAN JUAN DE MIRAFLORES","IE PARROQUIAL NIÑO JESUS","AV SAN JUAN SN",27],["LIMA","SAN JUAN DE MIRAFLORES","IEP MANUEL ANTONIO RAMIREZ BARINAGA","AV SAN JUAN 888",32],["LIMA","SAN JUAN DE MIRAFLORES","IEP SACO OLIVEROS","AV BELISARIO SUAREZ 363",18],["LIMA","SAN JUAN DE MIRAFLORES","IESTP GILDA LILIANA BALLIVIAN ROSADO","AV VARGAS MACHUCA 315",12],["LIMA","SAN JUAN DE MIRAFLORES","IE 7041 VIRGEN DE LA MERCED","PRIMERA ETAPA DE VILLA SOLIDARIDAD",15],["LIMA","SAN JUAN DE MIRAFLORES","IEP ALFRED MARSHALL","CALLE LOS CLAVELES MZ G LT 7-8",9],["LIMA","SAN JUAN DE MIRAFLORES","IEP ISAAC NEWTON","MZ D LT 21-22 - COOPERATIVA UMAMARCA",9],["LIMA","SAN JUAN DE MIRAFLORES","IEP SANTA URSULA","JR FELIPE OLIVA 183",10],["LIMA","SAN JUAN DE MIRAFLORES","IE 7212 - 627 BLANCA VARELA GONZALES","CALLE LEONCIO PRADO SN MZ D LOTE 1",5],["LIMA","SAN JUAN DE MIRAFLORES","IE 7208 EL PACIFICO","JR MARISCAL CASTILLA MZ A LT 1",11],["LIMA","SAN JUAN DE MIRAFLORES","IE 7209 VIRGEN DE LAS MERCEDES","CALLE 6 SECTOR 3 MZ A2 LT 27",7],["LIMA","SAN JUAN DE MIRAFLORES","IE 7081 JOSE MARIA ARGUEDAS","AV INDEPENDENCIA SN",16],["LIMA","SAN JUAN DE MIRAFLORES","IE 7100","AV ANDRES AVELINO CACERES SN",12],["LIMA","SAN JUAN DE MIRAFLORES","CEBE NUESTRA SEÑORA DE GUADALUPE","CALLE TOMAS GUZMAN 600",10],["LIMA","SAN JUAN DE MIRAFLORES","IEP PAULO FREIRE","JR JUAN NEYRA 349",10],["LIMA","SAN JUAN DE MIRAFLORES","IE 637 VALLE SHAROM DE SJM","CALLE LOS CIPRECES MZ I LOTE 13",5],["LIMA","SAN JUAN DE MIRAFLORES","IEP SAN JUAN APOSTOL","AV TOMAS GUZMAN 233",7],["LIMA","SAN JUAN DE MIRAFLORES","IEP SACO OLIVEROS SEDE JULIO BELLIDO","JR JULIO BELLIDO 651",9],["LIMA","SAN JUAN DE MIRAFLORES","IEP SACO OLIVEROS SECUNDARIA MIGUEL IGLESIAS","AV MIGUEL IGLESIAS PARADERO 14 Y 28",11],["LIMA","SAN JUAN DE MIRAFLORES","IEP MI SAN MARTINCITO","JR JUAN NEYRA 397 PAMPLONA BAJA",9],["LIMA","SAN JUAN DE MIRAFLORES","IE 7070 DRA MARIA REICHE GROSSE NEUMAN","AV SAN JUAN 383",19],["LIMA","SAN JUAN DE MIRAFLORES","IE 7061 LOS HEROES DE SAN JUAN","JR JOAQUIN BERNAL SN",20],["LIMA","SAN JUAN DE MIRAFLORES","IE 6046 VIRGEN DE FATIMA","JR FRANCISCO VALLEJO CDRA 4 SN – PAMPLONA BAJA",11],["LIMA","SAN JUAN DE MIRAFLORES","IEP INNOVA SCHOOLS - SAN JUAN DE MIRAFLORES","AV PEDRO MIOTA 208",30],["LIMA","SAN JUAN DE MIRAFLORES","IE 6045 DOLORES CAVERO DE GRAU","JR MARIANO PASTOR SEVILLA SN",17],["LIMA","SAN LUIS","IE 0082 LA CANTUTA","AV MARISCAL SANTA CRUZ 165",11],["LIMA","SAN LUIS","IE 0083 SAN JUAN MACIAS - PRIMARIA","JR RIO PIURA 502",12],["LIMA","SAN LUIS","IE 0083 SAN JUAN MACIAS","PJE KIKIJANA SN CRUCE CON JR POMACANCHI SN",8],["LIMA","SAN LUIS","IE 1128 SAN LUIS","CALLE FRANCISCO VIDAL DE LAOS 601",27],["LIMA","SAN LUIS","IE 1133 SANTISIMA VIRGEN DE FATIMA","JR JUAN PAULI 226",13],["LIMA","SAN LUIS","IE 1204 VILLA JARDIN","JR LA CAPEA 150",12],["LIMA","SAN LUIS","IE 1216 MIGUEL GRAU SEMINARIO","JR RIO ICA 249",13],["LIMA","SAN LUIS","IE LOS EDUCADORES","AV DEL AIRE 1249",27],["LIMA","SAN LUIS","IEP MELVIN JONES","JR RIO NAZCA 156",6],["LIMA","SAN LUIS","IE ESPECIAL - PAENFTS","CALLE JOSE GABRIEL AGUILAR 193",9],["LIMA","SAN LUIS","IEP SANTA MARIA DE LA MERCED","AV SAN JUAN 596 - 598",9],["LIMA","SAN LUIS","IEP NAZARENO","JR RIO RIMAC 150 URB LAS MORAS",10],["LIMA","SAN LUIS","IEP JESUS EL BUEN PASTOR","JR ALAVA 209 URB JAVIER PRADO",7],["LIMA","SAN LUIS","CETPRO SAN LUIS","YEN ESCOBEDO GARRO 381 URB LA VIÑA",7],["LIMA","SAN LUIS","IEP SACO OLIVEROS - SAN LUIS","CALLE GERONA 123",14],["LIMA","SAN LUIS","IEP SACO OLIVEROS SECUNDARIA – SAN LUIS","CALLE BADAJOZ 246",6],["LIMA","SAN MARTIN DE PORRES","IEI 0003 NUESTRA SEÑORA DEL ROSARIO","AV B Y ESQUINA CA 17 SN",8],["LIMA","SAN MARTIN DE PORRES","IEI 0009","JR LOS RUIBARES CUADRA 2",3],["LIMA","SAN MARTIN DE PORRES","IEI 0081 LA SONRISA DE DIOS","JR LEONARDO ORTIZ SALCEDO SN",5],["LIMA","SAN MARTIN DE PORRES","IE 2013 SANTA ROSA DE LIMA","JR PACLLON 311",3],["LIMA","SAN MARTIN DE PORRES","IE 2040 JULIO VIZCARRA AYALA","MZ D-G LOTE 7 Y 1",7],["LIMA","SAN MARTIN DE PORRES","IE 2075 NUEVO AMANECER","PJE 28 34 35 PSJE NUEVO AMANECER SN",7],["LIMA","SAN MARTIN DE PORRES","IE 3022 JOSE SABOGAL","AV JUAN XXIII 379",23],["LIMA","SAN MARTIN DE PORRES","IEP CHRISTIAN BARNARD COLLEGE","MZ E LOTE 12 JR SATURNO URB VIPOL DE NARANJAL",9],["LIMA","SAN MARTIN DE PORRES","IEP CADILLO","AV LOS SAUCES MZ D",17],["LIMA","SAN MARTIN DE PORRES","IEP HAPPY PLACE","AV SANTA ANA 857",8],["LIMA","SAN MARTIN DE PORRES","IEP HARVARD SCHOOL SMP","JR THOMAS COCHRANE SN MZ F LOTE 4",5],["LIMA","SAN MARTIN DE PORRES","IEP INNOVA SCHOOLS - SAN MARTIN DE PORRES","JR CHACO 1400",20],["LIMA","SAN MARTIN DE PORRES","IEP JUAN PABLO PEREGRINO DE LA PAZ","CALLE 5 MZ F LOTE 28-29",14],["LIMA","SAN MARTIN DE PORRES","IEP LAS GARDENIAS DE SANTA ROSA","CALLE 10 MZ F LOTE 20-21-22",18],["LIMA","SAN MARTIN DE PORRES","IEP LICEO SAN AGUSTIN","MZ B LOTE 1-7,13-14, 17 ASOC MONTE LOS OLIVOS",45],["LIMA","SAN MARTIN DE PORRES","IEP LORD BRAIN","MZ C LT 39 URB MAYORAZGO II",15],["LIMA","SAN MARTIN DE PORRES","IEP MI BUEN JESUS","JR LORETO 3898",10],["LIMA","SAN MARTIN DE PORRES","IEP MONITOR HUASCAR","MZ H LT 19 ASOC LOS JARDINES DE NARANJAL",25],["LIMA","SAN MARTIN DE PORRES","IEPR NUESTRA SEÑORA DE LA PAZ","CALLE MANUEL CLAVERO 2241",12],["LIMA","SAN MARTIN DE PORRES","IEP NUESTRA SEÑORA DEL CARMEN DE PALAO","CALLE PIERRE CONSTANT CHEVALLY 323",10],["LIMA","SAN MARTIN DE PORRES","IEP PRISMA LIMA NORTE","AV MARIANO USTARIZ Y RIVERO MZ P LOTE 30",9],["LIMA","SAN MARTIN DE PORRES","IEP REINA DE LA PAZ","CALLE MIGUEL GRAU MZ B LOTE 8",8],["LIMA","SAN MARTIN DE PORRES","IEP ROMA","AV CANTA CALLAO MZ B LOTE 15",7],["LIMA","SAN MARTIN DE PORRES","IEP SACO OLIVEROS - APEIRON","AV SALAVERRY 300",25],["LIMA","SAN MARTIN DE PORRES","IEP SACO OLIVEROS DE CANTA CALLAO","MZ A LT 7 LOCALIDAD VIRGEN DE LA SOLEDAD",20],["LIMA","SAN MARTIN DE PORRES","IEP SAN IGNACIO DE LOYOLA","MZ L LOTE 1-5 URB KAMA ETAPA I",13],["LIMA","SAN MARTIN DE PORRES","IEP SANTA ANGELA DEL ROSARIO I","MZ A LOTE 2-3 ETAPA I - URB SEÑOR DE LOS MILAGROS",12],["LIMA","SAN MARTIN DE PORRES","IEP SANTA MARIA PURISIMA","MZ B LT 1,2,3 - URB VILLA TERESA ETAPA II",13],["LIMA","SAN MARTIN DE PORRES","IEP SANTISIMA VIRGEN DEL CAMINO","AV LOS PINOS 149 URB VALDIVIEZO",6],["LIMA","SAN MARTIN DE PORRES","IEP SCHOOL TALENT","JR CARLOS DE LOS HEROS 109",7],["LIMA","SAN MARTIN DE PORRES","IEP VIRGEN DE GUADALUPE","CALLE VIRGEN DE GUADALUPE 378",5],["LIMA","SAN MARTIN DE PORRES","PRITE ANTARES","JR GERMAN STIGLICH MZ A LOTE 4",3],["LIMA","SAN MARTIN DE PORRES","IEP SAN FRANCISCO DE CAYRAN","CALLE 11 MZ E1 LOTE 41-42 ASOC SAN FRANCISCO DE CAYRAN ETAPA II",15],["LIMA","SAN MARTIN DE PORRES","IEP VIRGEN DEL ROSARIO DEL NARANJAL","MZ C LOTE 5-6-16-17-18 PROGRAMA DE VIVIENDA VIRGEN DEL ROSARIO",14],["LIMA","SAN MARTIN DE PORRES","IEP CAPITAN PNP HUGO GRANDEZ OCMIN","AV COLECTORA MZ C LOTE 4 -5",5],["LIMA","SAN MARTIN DE PORRES","IEP SAN AGUSTIN DE ANTARES","AV GUILLERMO MOORE 281 MZ O LT 14",4],["LIMA","SAN MARTIN DE PORRES","IEP VIRGENCITA DE GUADALUPE","MZ E LOTE 16 ETAPA V ASOC MONTE DE LOS OLIVOS",6],["LIMA","SAN MARTIN DE PORRES","IEP APOSTOL SANTIAGO EL MAYOR","JR LOS GIRASOLES MZ E LOTE 1-2",5],["LIMA","SAN MARTIN DE PORRES","IEP CRISTO MISERICORDIOSO","AV EL SOL DE NARANJAL MZ A LOTE 23",12],["LIMA","SAN MARTIN DE PORRES","IEP MASTER CIENCIAS II","JR JUAN PICHERT 168",5],["LIMA","SAN MARTIN DE PORRES","IEP SIGLO XXI","AV EL OLIVAR MZ D LOTE 10 URB MANANTIAL DE NARANJAL",7],["LIMA","SAN MARTIN DE PORRES","IE 2020 SEÑOR DE LOS MILAGROS","CALLE B SN URB FILADELFIA",7],["LIMA","SAN MARTIN DE PORRES","CEBE SAN MARTIN DE PORRES","AV JOSE GRANDA 2929",9],["LIMA","SAN MARTIN DE PORRES","IE 2002 VIRGEN MARIA DEL ROSARIO","AV CRUZ PAMPA SN MZ F LT 17 EX HACIENDA NARANJAL",16],["LIMA","SAN MARTIN DE PORRES","IE 2003 LIBERTADOR JOSE DE SAN MARTIN","JR SIMON BOLIVAR MZ B LT 14 URB LOS LIBERTADORES",18],["LIMA","SAN MARTIN DE PORRES","IE 2008 EL ROSARIO","JR MANUEL GONZALES 1032",5],["LIMA","SAN MARTIN DE PORRES","IE 2009 FE Y ALEGRIA 2","JR PEDRO IRIGOYEN SN",11],["LIMA","SAN MARTIN DE PORRES","IE 2010 ALBERT EINSTEIN","JR BERNARDO TORRE TAGLE 3836",4],["LIMA","SAN MARTIN DE PORRES","IE 2012 LAMPA DE ORO","CALLE 29 DE MARZO SN",9],["LIMA","SAN MARTIN DE PORRES","IE 2018 MARIA VICTORIA MARCHENA RODRIGUEZ","JR RIOBAMBA 2801",3],["LIMA","SAN MARTIN DE PORRES","PRITE FRAY PEDRO URRACA","JR BARRANQUITA 1189",5],["LIMA","SAN MARTIN DE PORRES","IE 2021 NUESTRA SEÑORA DEL CARMEN","JR HUAMANPOMA 891",3],["LIMA","SAN MARTIN DE PORRES","IE 2023 AUGUSTO SALAZAR BONDY","AV PERU 1997",25],["LIMA","SAN MARTIN DE PORRES","IE 2026 SAN DIEGO","MZ B ETAPA II SAN DIEGO",15],["LIMA","SAN MARTIN DE PORRES","IE 2027 JOSE MARIA ARGUEDAS","JR ALHELI 1165",18],["LIMA","SAN MARTIN DE PORRES","IE 2028 PERUANO BRITANICO","AV VICTOR RAUL HAYA DE LA TORRE MZ B1 LT 10 AAHH CERRO CANDELA",19],["LIMA","SAN MARTIN DE PORRES","IE 2029 SIMON BOLIVAR","JR SANTA MARITZA CUADRA 1",12],["LIMA","SAN MARTIN DE PORRES","IE 2030 VIRGEN DEL CARMEN","JR SANTA CRUZ 225",7],["LIMA","SAN MARTIN DE PORRES","IE 2031 VIRGEN DE FATIMA","PARQUE 1 SN- VIVIENDA COOP DE VIRGEN DE FATIMA",9],["LIMA","SAN MARTIN DE PORRES","IE 2033 CARLOS HIRAOKA TORRES","CALLE PARQUE SAN JUAN DE SALINA 9",5],["LIMA","SAN MARTIN DE PORRES","IE 2034 VIRGEN DE FATIMA","JR VERONA 440",4],["LIMA","SAN MARTIN DE PORRES","IE 2072 MARIO VARGAS LLOSA","CALLE HUMBOLD MZ R LT 1",6],["LIMA","SAN MARTIN DE PORRES","IE 2074 VIRGEN PEREGRINA DEL ROSARIO","ASOC VIRGEN DEL ROSARIO MZ E SN",20],["LIMA","SAN MARTIN DE PORRES","IE 2082 HEROES DEL PACIFICO","PJE LEON VELARDE SN",6],["LIMA","SAN MARTIN DE PORRES","IE 2088 REPUBLICA FEDERAL DE ALEMANIA","AV TANTAMAYO SN VIRGEN DE LAS MERCEDES CHUQUITANTA",16],["LIMA","SAN MARTIN DE PORRES","IE 2094 INCA PACHACUTEC","JR AGUSTIN GAMARRA 3230",7],["LIMA","SAN MARTIN DE PORRES","IE 2101 MARIA AUXILIADORA","CALLE CALIFORNIA SN",5],["LIMA","SAN MARTIN DE PORRES","IE 3028 YACHAY WASI","CALLE 13 MZ N",5],["LIMA","SAN MARTIN DE PORRES","IE 3030 SANTISIMA CRUZ","AV ZARUMILLA 884",7],["LIMA","SAN MARTIN DE PORRES","IE 3032 VILLA ANGELICA","JR BELLO HORIZONTE 2323",11],["LIMA","SAN MARTIN DE PORRES","IE 3034 PAULO FREIRE","AV ZARUMILLA 661",3],["LIMA","SAN MARTIN DE PORRES","IE 3035 BELLA LETICIA","JR HAITI CUADRA 6",6],["LIMA","SAN MARTIN DE PORRES","IE 3036 JOSE ANDRES RAZURI","AV 12 DE OCTUBRE 955",7],["LIMA","SAN MARTIN DE PORRES","IE 3037 GRAN AMAUTA","AV PERU 3500",27],["LIMA","SAN MARTIN DE PORRES","IE 3038 PATRICIA CARMEN GUZMAN","JR SAN MARTIN 3809",4],["LIMA","SAN MARTIN DE PORRES","IE 3039 JAVIER HERAUD","JR PACASMAYO 3900",14],["LIMA","SAN MARTIN DE PORRES","IE 3041 ANDRES BELLO","AV MARIANO IGNACIO PRADO 3199",27],["LIMA","SAN MARTIN DE PORRES","IE 3042 JESUS EL SALVADOR","JR EL SALVADOR 441",8],["LIMA","SAN MARTIN DE PORRES","IE 3043 RAMON CASTILLA","AV JOSE MARIA CORDOVA 3500",24],["LIMA","SAN MARTIN DE PORRES","IE 3044 RICARDO PALMA","JR GERARDO DIANDERAS 2432",7],["LIMA","SAN MARTIN DE PORRES","IE 3045 JOSE CARLOS MARIATEGUI LA CHIRA","JR MARIA PARADO DE BELLIDO SN",23],["LIMA","SAN MARTIN DE PORRES","IE 3046 SAN MARTIN DE PORRES","PJE CHICLAYO SN",18],["LIMA","SAN MARTIN DE PORRES","IE 3081 ALMIRANTE MIGUEL GRAU SEMINARIO","JR BENJAMIN QUIROGA CUADRA 3",14],["LIMA","SAN MARTIN DE PORRES","IE 3082 PARAISO FLORIDO","CALLE 3 SN",5],["LIMA","SAN MARTIN DE PORRES","IE 0051 CLORINDA MATTO DE TURNER","JR JOSE LARREA Y LAREDO 498",8],["LIMA","SAN MARTIN DE PORRES","IEI 0005","CALLE VIRGEN DE GUADALUPE SN",4],["LIMA","SAN MARTIN DE PORRES","IEP EL NAZARENO","MZ V LT 19, 20, 21, 41, 42, 43",18],["LIMA","SAN MARTIN DE PORRES","IEP ENCINAS SCHOOL","JR CAJABAMBA SN",11],["LIMA","SAN MARTIN DE PORRES","IEP JOSE MARTI","MZ A LT 19 - 20 URB LOS REYES",9],["LIMA","SAN MARTIN DE PORRES","IE EL PACIFICO","CALLE TOBIAS MEYER MZ J LT 20",14],["LIMA","SAN MARTIN DE PORRES","IE 3701 FE Y ALEGRIA 1","AV JOSE GRANDA 2202",12],["LIMA","SAN MARTIN DE PORRES","IE ISABEL CHIMPU OCLLO","JR HUARAZ 882",25],["LIMA","SAN MARTIN DE PORRES","IE LOS ALISOS","JR EL OLIVAR MZ R LT 1",5],["LIMA","SAN MARTIN DE PORRES","IE LOS JAZMINES DEL NARANJAL","CALLE LAS ALMENDRAS SN",14],["LIMA","SAN MARTIN DE PORRES","IE PNP JESUS VERA FERNANDEZ","JR ELISEO HERRERA ZAPATA SN",7],["LIMA","SAN MARTIN DE PORRES","IE PNP JOSE HECTOR RODRIGUEZ TRIGOSO","URB SAN AMADEO DE GARAGAY SN",9],["LIMA","SAN MARTIN DE PORRES","IE 2001 PNP SANTA ROSA DE LIMA","CALLE SANTA ANA CDRA 06 MZ N LT 2",15],["LIMA","SAN MARTIN DE PORRES","IE SAN MARTIN DE PORRES","AV CAQUETA 805",22],["LIMA","SAN MARTIN DE PORRES","IEI 0057","PJE LOS LEONES 175",3],["LIMA","SAN MARTIN DE PORRES","IEI 0065","AV TUPAC AMARU SN",4],["LIMA","SAN MARTIN DE PORRES","IEI 342 MARIA Y JESUS","CALLE A SN",3],["LIMA","SAN MARTIN DE PORRES","IEI 0387 NUESTRA SEÑORA DE LAS MERCEDES","CALLE ANTONIO ULLOA SN URB EL PACIFICO",5],["LIMA","SAN MARTIN DE PORRES","IEI 0358 NIÑO JESUS DE PRAGA","MZ B LT 13 LOS LIBERTADORES",6],["LIMA","SAN MARTIN DE PORRES","IE 3033 ANDRES AVELINO CACERES","JR PUNO 3379",17],["LIMA","SAN MARTIN DE PORRES","IEP CESAR VALLEJO","CALLE CINCO SN",11],["LIMA","SAN MARTIN DE PORRES","IEP CESAR VALLEJO MENDOZA","JR PINAR DEL RIO 2131",14],["LIMA","SAN MARTIN DE PORRES","IEP GENES DE SAN MARTIN DE PORRES","MZ L LT 03 COOP VIRGEN DE FATIMA",9],["LIMA","SAN MARTIN DE PORRES","IEP SANTO DOMINGO EL PREDICADOR","CALLE 1 MZ A LT 3-4 LOS JARDINES DEL NARANJAL",32],["LIMA","SAN MARTIN DE PORRES","IST PUBLICO LUIS NEGREIROS VEGA","AV JOSE GRANDA SN",7],["LIMA","SAN MARTIN DE PORRES","IEP TOMAS ARIETA CRUZ SECUNDARIA","AV SANTA ROSA MZ A LT 7 MONTECARLO I ETAPA",3],["LIMA","SAN MARTIN DE PORRES","IEP HONORES DE BERTELLO","AV CARLOS IZAGUIRRE MZ B LT 11 12 13 14",13],["LIMA","SAN MARTIN DE PORRES","IEP PALMER SCHOOL","URB LOS REYES MZ C LT 11",20],["LIMA","SAN MARTIN DE PORRES","IEP HONORES SAN MARTIN","AV PROLONGACION SAN DIEGO DE ALCALA MZ A LT 11 AL 23",9],["LIMA","SAN MARTIN DE PORRES","IEP JOHANN W GOETHE","MZ M LT 10 AV EL SOL DE NARANJAL",6],["LIMA","SAN MARTIN DE PORRES","IEP NEWTON SAN DIEGO","MZ B LT 3 4 5 URB VALLE AZUL DE SAN DIEGO",6],["LIMA","SAN MARTIN DE PORRES","IE 3054 VIRGEN DE LAS MERCEDES","PARQUE FILADELFIA 1",6],["LIMA","SAN MARTIN DE PORRES","IEP MILAGROSO SAN BENITO","JR SAN MARTIN 4000",5],["LIMA","SAN MARTIN DE PORRES","IEP SANTO DOMINGO","MZ G LOTE 03 COOP LOS ESTIBADORES",4],["LIMA","SAN MARTIN DE PORRES","IEP SAN AGUSTIN DE INGENIERIA","JR ANTONIO GARLAND 617",5],["LIMA","SAN MARTIN DE PORRES","IEP HONORES OQUENDO","AV LOS ALISOS MZ A LT 8-18 URB SANTA CATALINA DE OQUENDO",23],["LIMA","SAN MARTIN DE PORRES","IE 2079 ANTONIO RAYMONDI","JR SAN BERNARDO SN URB SANTA LUISA 1ERA ETAPA",16],["LIMA","SAN MARTIN DE PORRES","IEP MIGUEL ANGEL","JR LOS MELOCOTONES 279 URB NARANJAL",9],["LIMA","SAN MARTIN DE PORRES","IEP ALFREDO REBAZA ACOSTA","AV PERU 2506",9],["LIMA","SAN MARTIN DE PORRES","IE CORONEL JUAN VALER SANDOVAL","JR JACOBO QUETELET SN",4],["LIMA","SAN MARTIN DE PORRES","IEI 347 LUIS ENRIQUE XII","AV VICTOR RAUL HAYA DE LA TORRE MZ B1 LT 11",11],["LIMA","SAN MARTIN DE PORRES","IEP SAN MIGUEL ARCÁNGEL","CALLE YURUMAYO MZ  I LOTE 3",11],["LIMA","SAN MARTIN DE PORRES","IEP SAN AGUSTÍN DE ANTARES","CALLE THOMAS ESTEVES SN",6],["LIMA","SAN MARTIN DE PORRES","IEP ANGELITOS DE MI TERRUÑO","MZ I LT 36 URB MI TERRUÑO",4],["LIMA","SAN MARTIN DE PORRES","IEP BERNARDO BOULAY TURNER","CALLE LAS RETAMAS MZ C LT 5",7],["LIMA","SAN MARTIN DE PORRES","COLEGIOS MATER DEI","AV BERTELLO SN MZ I LT 14-15",5],["LIMA","SAN MARTIN DE PORRES","IEI CONDEVILLA SEÑOR II","JR FELIX DEL VALLE 500",4],["LIMA","SAN MARTIN DE PORRES","IEP KINDER CAMINITOS DEL SABER","CALLE LOS NARDOS 114",5],["LIMA","SAN MARTIN DE PORRES","IEI MESA REDONDA","AV SANCHEZ CERRO SN",4],["LIMA","SAN MARTIN DE PORRES","IEP NEIL ARMSTRONG","AV PACASMAYO MZ G LT 20-21 URB FILADELFIA",5],["LIMA","SAN MARTIN DE PORRES","IEP NUESTRA SEÑORA DE LA NATIVIDAD","JR MACARA 118",10],["LIMA","SAN MARTIN DE PORRES","IEP JUANA MARLENE URIBE ROMERO","ASOC SANTA ISABEL MZ A LT 26 - 27",9],["LIMA","SAN MARTIN DE PORRES","IEP MILAGROS DE DIOS","JR JUAN CHACORNAL 164",8],["LIMA","SAN MARTIN DE PORRES","IEP MISIONERO FRANCISCO PENZOTTI II","CALLE LOS NOGALES MZ A LT 23 LOS ROBLES DE SANTA ROSA",7],["LIMA","SAN MARTIN DE PORRES","IEP COLEGIO REINO DE LOS CIELOS","AV LUNA PIZARRO 441",9],["LIMA","SAN MARTIN DE PORRES","IEP BEATO JUAN PABLO II","CALLE AMAKELLA 2DA ETAPA",6],["LIMA","SAN MARTIN DE PORRES","IEP DANIEL COMBONI","MZ E LT 5 6 - SAN REMO II",8],["LIMA","SAN MARTIN DE PORRES","IEP ESCUELA DEL BUEN SABER","AV PACASMAYO SN MZ D LOTE 2",4],["LIMA","SAN MARTIN DE PORRES","IEP SIEMPRE ADELANTE","AV CANTA CALLAO MZ E LT 34 URB MONTE DE LOS OLIVOS",5],["LIMA","SAN MARTIN DE PORRES","IEP BH SCHOOL","CALLE SN MZ D LT 29-30",13],["LIMA","SAN MARTIN DE PORRES","IEP ASOCIACIÓN EDUCATIVA FQR COLEGIO SANTA ELENA","JR DIEZ CANSECO 130",3],["LIMA","SAN MARTIN DE PORRES","IEP JUAN ESPINOZA MEDRANO","CALLE MONTEVIDEO 1042",4],["LIMA","SAN MARTIN DE PORRES","IEP JESUS DIVINO MAESTRO","MZ A LT 13 - 15 URB SANTA MARIA DEL VALLE",9],["LIMA","SAN MARTIN DE PORRES","IEP SAN REMO","MZ C LT 7A SAN REMO",9],["LIMA","SAN MARTIN DE PORRES","IE 3023 PEDRO PAULET MOSTAJO","JR PEDRO PAULET SN",10],["LIMA","SAN MARTIN DE PORRES","IEP INNOVA VIGOSTKY SCHOOL","MZ E LT 13",3],["LIMA","SAN MARTIN DE PORRES","IEP SACO OLIVEROS DE NARANJAL","CALLE LLATA MZ A SUB LT 9 - B",15],["LIMA","SAN MARTIN DE PORRES","IEP SAN MARCOS DEL ROSARIO","LOS MARMOLES MZ D LT 7",5],["LIMA","SAN MARTIN DE PORRES","IEP SAN FELIPE","CALLE LAS VIOLETAS MZ D LT 33 35",8],["LIMA","SAN MARTIN DE PORRES","IEP EL BUEN PASTOR DE LAS GARDENIAS","MZ F LT 1 - 2 URB LAS GARDENIAS DE NARANJAL",4],["LIMA","SAN MARTIN DE PORRES","IEP DANTE ALIGHIERI","CALLE 19 MZ A LT 30 ASOC VIRGEN DEL ROSARIO",9],["LIMA","SAN MARTIN DE PORRES","IEP JUAN PABLO","URB LOS ALISOS MZ B LT 25-26",15],["LIMA","SAN MARTIN DE PORRES","ESCUELA EUROPEA DEL PERU","AV TANTAMAYO MZ A LT 6 - 9",15],["LIMA","SAN MARTIN DE PORRES","IEP AMISTAD","CANTA CALLAO MZ D LT 36-37 ASOC SANTA MARIA DEL VALLE III ETAPA 3",7],["LIMA","SAN MARTIN DE PORRES","IEP CARDANO VIETE INGENIEROS DE III HORIZONTES","CALLE 1 MZ B LOTE 13 - 14",11],["LIMA","SAN MARTIN DE PORRES","IEP CARDANO VIETA INGENIEROS","MZ D LT 37-38 ASOCIACION LOS OLIVOS",10],["LIMA","SAN MARTIN DE PORRES","IEP SANTA TERESA DE JESUS - SOPHIANUM","AV ALCIDES VIGO Z Y LOTE 6",13],["LIMA","SAN MARTIN DE PORRES","IE SEBASTIAN SALAZAR BONDY","JR LAS TORONJAS 252",7],["LIMA","SAN MARTIN DE PORRES","IEP FRANCISCA DIEZ CANSECO DE CASTILLA","MZ C LOTE 2-3 PROGRAMA DE VIVIENDA SAN VALENTIN",8],["LIMA","SAN MARTIN DE PORRES","CETPRO ROSA DE AMERICA","JR ANTON SANCHEZ 312",7],["LIMA","SAN MARTIN DE PORRES","IEI 338 MANITOS CREATIVAS","JR JUAN LUIS HAGUE SN",3],["LIMA","SAN MARTIN DE PORRES","IEP GENES GAMARRA","CALLE GERMAN STIGLICH MZ A SUBLOTE 3-A1 URB ANTARES",17],["LIMA","SAN MARTIN DE PORRES","IEP INNOVA SCHOOLS -  CANTA CALLAO","CALLE YURUMAYO MZ E LT 2 URB HUERTOS DE NARANJAL",32],["LIMA","SAN MARTIN DE PORRES","IEP SAN ANTONIO INGENIERIA","JR CARLOS GRANDA 101 URB INGENIERIA",3],["LIMA","SAN MARTIN DE PORRES","CETPRO PROMAE CONDEVILLA","JR  MAX UHLE 2402",7],["LIMA","SAN MARTIN DE PORRES","IEP PERU REY","AV 12 DE OCTUBRE 789",6],["LIMA","SAN MARTIN DE PORRES","IE EMBLEMATICA JOSE GRANDA","AV UNIVERSITARIA 222",42],["LIMA","SAN MARTIN DE PORRES","IE 2073 JOSE OLAYA BALANDRA","JR LOS CIPRECES SN",14],["LIMA","SAN MIGUEL","IE 096 EMILIA BARCIA BONIFFATTI","CALLE LOS NARANJALES SN MZ Q LOTE 6",10],["LIMA","SAN MIGUEL","IEP INNOVA SCHOOLS - SEDE SAN MIGUEL 2","JR LIBERTAD 335",10],["LIMA","SAN MIGUEL","IEI JARDIN DE LA INFANCIA N 1 DE LIMA","JR PROLONGACION CUZCO 1212",6],["LIMA","SAN MIGUEL","CEGNE SANTA ANA","JR SUCRE 675",17],["LIMA","SAN MIGUEL","PONTIFICIA UNIVERSIDAD CATOLICA DEL PERU","AV RIVA AGUERO SN - PUERTA 10",49],["LIMA","SAN MIGUEL","CEP PERUANO CHINO JUAN XXIII","JR MARISCAL RAMON CASTILLA 842",18],["LIMA","SAN MIGUEL","IE 0024 ROSA IRENE INFANTE DE CANALES","CALLE HERMELINDA CARRERA SN",6],["LIMA","SAN MIGUEL","IEP SANTO DOMINGO EL APOSTOL","AV LA PAZ 2249",58],["LIMA","SAN MIGUEL","IE NUESTRA SEÑORA DEL CARMEN","AV LA LIBERTAD 2021",5],["LIMA","SAN MIGUEL","IE 016 ALMIRANTE MIGUEL GRAU","AV FEDERICO GALLESE 700",6],["LIMA","SAN MIGUEL","IE 1086 JESUS REDENTOR","CALLE MANCO II SN",21],["LIMA","SAN MIGUEL","IE EMBLEMATICA BARTOLOME HERRERA","AV LA MARINA CUADRA 12 SN",22],["LIMA","SAN MIGUEL","IE 1087 GENERAL ROQUE SAENZ PEÑA","AV LA PAZ 675",24],["LIMA","SAN MIGUEL","IEP BUENAS NUEVAS","JR GENERALISIMO SAN MARTIN 777",9],["LIMA","SAN MIGUEL","IESTP MARIA ROSARIO ARAOZ PINTO","CALLE JOSE MARTI 155",39],["LIMA","SAN MIGUEL","IEP AMADEUS MOZART","AV INSURGENTES 1020",6],["LIMA","SAN MIGUEL","IEP INMACULADO CORAZON DE MARIA","CALLE LONDRES 184",16],["LIMA","SAN MIGUEL","IEP NUESTRA SEÑORA DEL CARMEN","CALLE HUANDOY 578",6],["LIMA","SAN MIGUEL","IEP MI PEQUEÑITA LUZ","AV LIBERTAD 2916",5],["LIMA","SAN MIGUEL","IEP SANTISIMA MADRE MARIA","CALLE MARIANA ECHEVARRIA 111",5],["LIMA","SAN MIGUEL","IEP CORAZON DE JESUS","JR PASCUAL DE ANDAGOYA 265",12],["LIMA","SAN MIGUEL","IEP HOGAR DEL NIÑO SANTA MARIA MADRE DE DIOS","AV LIBERTAD 1955",6],["LIMA","SAN MIGUEL","COLEGIO SACO OLIVEROS DE SAN MIGUEL","AV LIBERTAD 1250",30],["LIMA","SAN MIGUEL","INSTITUTO DE EDUCACION SUPERIOR PEDAGOGICO PRIVADO SAN MARCELO","AV PIO XII 270",12],["LIMA","SAN MIGUEL","IE LICEO NAVAL CONTALMIRANTE MONTERO","AV VENEZUELA CUADRA 34 SN",47],["LIMA","SAN MIGUEL","CETPRO SAN MIGUEL","AV LIBERTAD 1951",8],["LIMA","SAN MIGUEL","IEP INNOVA SCHOOLS - SEDE LA PAZ 1","CALLE RICARDO PALMA 177",19],["LIMA","SAN MIGUEL","IEP INNOVA SCHOOLS - SEDE LA PAZ 2","AV LA PAZ MZ 29 LOTE 423",10],["LIMA","SAN MIGUEL","IEP INNOVA SCHOOLS - SEDE SAN MIGUEL 1","AV LIBERTAD 860",15],["LIMA","SAN MIGUEL","IE SANTA MARIA DE MARANGA","PJE LOS CORDELES MZ N LT 1",7],["LIMA","SANTA ANITA","IEI 065","CALLE PALPA SN",2],["LIMA","SANTA ANITA","IEI 111 SAN ANITA","CALLE PARDILLO 100",3],["LIMA","SANTA ANITA","CEBA DON BOSCO","JR LOS ROBLES 101",4],["LIMA","SANTA ANITA","IEP JUAN ESPINOZA MEDRANO","MZ D LOTE 41-47 ASOCIACION LA ENCALADA",20],["LIMA","SANTA ANITA","IEP SACO OLIVEROS HELICOIDAL","CALLE LAS VEGAS SN MZ A-25 LOTE 10",47],["LIMA","SANTA ANITA","IE JUAN VALER SANDOVAL","CALLE LA ENCALADA SN",5],["LIMA","SANTA ANITA","IEP SAN LUIS GONZAGA","MZ A 27 LOTE 21 ASOCIACION CULTURA PERUANA MODERNA",4],["LIMA","SANTA ANITA","IEP LUMBRERAS DE SANTA ANITA","AV FRANCISCO BOLOGNESI 1089",4],["LIMA","SANTA ANITA","IEP SANTA MARIA DE JESUS - PRIMARIA","CALLE 11 MZ G LOTE 12 URB SAN CARLOS 11",7],["LIMA","SANTA ANITA","IEP SANTA MARIA DE JESUS - SECUNDARIA","CALLE 11 MZ G LOTE 05 URB SAN CARLOS 11",4],["LIMA","SANTA ANITA","IEI 055 LAS CARMELITAS","AV CESAR VALLEJO MZ B LOTE 1",2],["LIMA","SANTA ANITA","IE 0096 ENRIQUE PALACIOS MENDIBURO","JR JOSE MELITON RODRIGUEZ SN",6],["LIMA","SANTA ANITA","IE 0124 GLORIOSA LEGION CACERES","PARQUE MANUEL CORREA SN",11],["LIMA","SANTA ANITA","IE 106 ABRAHAM VALDELOMAR","CALLE ALFREDO MALDONADO SN",22],["LIMA","SANTA ANITA","IE 107 DANIEL ALCIDES CARRION GARCIA","AV LOS CHANCAS SN CUADRA 3",34],["LIMA","SANTA ANITA","IE 108 SANTA ROSA DE QUIVES","JR LAS PALMERAS 375",11],["LIMA","SANTA ANITA","IE 1137 JOSE ANTONIO ENCINAS","CALLE LAS GRULLAS 800",31],["LIMA","SANTA ANITA","IE 1211 JOSE MARIA ARGUEDAS ALTAMIRANO","JR LAS VIOLETAS SN",11],["LIMA","SANTA ANITA","IE 1221 MARIA PARADO DE BELLIDO","CALLE PARQUE 1 SAN CARLOS",26],["LIMA","SANTA ANITA","IE 1225 MARIANO MELGAR","CALLE SAN SEBASTIAN SN",13],["LIMA","SANTA ANITA","IE 123 LOS ARBOLES","AV JOSE CARLOS MARIATEGUI SN",10],["LIMA","SANTA ANITA","IE 1256 ALFONSO UGARTE","JR JOSE SANTOS CHOCANO SN",14],["LIMA","SANTA ANITA","IE 129 YAMAGUCHI","CALLE LOS SAUCES 144",13],["LIMA","SANTA ANITA","IE 101 SHUJI KITAMURA","AV JOSE CARLOS MARIATEGUI 355",36],["LIMA","SANTA ANITA","IE 133 JULIO C. TELLO","AV FRANCISCO BOLOGNESI 1082",13],["LIMA","SANTA ANITA","IEI 053 SANTA ROSITA","JR LOS ALAMOS 142 ALTO DE LOS FICUS",6],["LIMA","SANTA ANITA","IEP ALFONSO UGARTE","JR LOS PINOS 514",38],["LIMA","SANTA ANITA","IEP SAN AGUSTIN","MZ A LOTE 6 URB ENCALADA 1ERA ETAPA",21],["LIMA","SANTA ANITA","UNIVERSIDAD SAN MARTIN DE PORRES","CALLE LAS CALANDRIAS 291",65],["LIMA","SANTA ANITA","IE 1210 SAN MARCOS","AV ENCALADA SN",3],["LIMA","SANTA ANITA","IE 0097 PATRICIA ANTONIA LOPEZ","JR APURIMAC 160",7],["LIMA","SANTA ANITA","IE 1273 MI PERU","URB ALAMEDA DE ATE 2DA ETAPA",5],["LIMA","SANTA ANITA","IEP VIRGEN DE FATIMA MILAGROSA","AV ENCALADA 367",11],["LIMA","SANTA ANITA","IE 1219 JOSE CARLOS MARIATEGUI","AV LAS VIOLETAS SN MZ J LOTE 22",7],["LIMA","SANTA ANITA","IEP CESAR VALLEJO DE LAS PRADERAS - SECUNDARIA","CALLE LAS MORAS MZ F LT 33-34 URB LAS PRADERAS I ETAPA",8],["LIMA","SANTA ANITA","IEP CESAR VALLEJO DE LAS PRADERAS INICIAL - PRIMARIA","CALLE LAS PRADERAS I ETAPA SN",4],["LIMA","SANTA ANITA","IEI 153 INMACULADA CONCEPCION","MZ Q LT 10 URB ALAMEDA DE ATE II ETAPA",4],["LIMA","SANTA ANITA","IEI 064 SEÑOR DE LOS MILAGROS","MZ L LT 12 COOPERATIVA ANDAHUAYLAS",5],["LIMA","SANTA ANITA","IEI 186 VIÑA SAN FRANCISCO","JR MATTO DE TURNER MZ Ñ LOTE 2 COOP DE VIVIENDA VIÑA SAN FRANCISO",4],["LIMA","SANTA ANITA","IEI 152","CALLE LOS MANGOS MZ B LT 1",3],["LIMA","SANTA ANITA","IEI SEMILLITAS DEL SABER","CALLE 9 MZ M LT 3-4",3],["LIMA","SANTA ANITA","IEP UNIVERSITY SANTA ANITA","JR MARIA PARADO DE BELLIDO 1274",8],["LIMA","SANTA ANITA","IEP WILLIAM SHAKESPEARE","CALLE MZ Ñ LT 17 URB ALAMEDA DE ATE",5],["LIMA","SANTA ANITA","IEP SANTA ANA","JR LAS AVUTARDAS MZ P LT 23",6],["LIMA","SANTA ANITA","IEP LUMEN DEI ITINERIS","JR LOS AYMARAS 166-168",3],["LIMA","SANTA ANITA","IEP RICARDO PALMA SORIANO","JR LUIS DE LA PUENTE UCEDA 172",7],["LIMA","SANTA ANITA","IEP MIXTO EVILA GONZALES","JR JOSE MARIA ARGUEDAS 151 - 159",3],["LIMA","SANTA ANITA","IEP SAN JUAN MACIAS","MZ C LT 10 - COOPERATIVA JULIO C TELLO",9],["LIMA","SANTA ANITA","IE 1253 FRANCISCO BOLOGNESI","AV ENCALADA MZ M COOPERATIVA PACHACUTEC",8],["LIMA","SANTA ANITA","IEP MEDRANITO KIDS - PRIMARIA","MZ B LOTE 4 - 10 URB LOS JARDINES DE LA ENCALADA",10],["LIMA","SANTA ANITA","IEI 056 VIRGEN DE FATIMA","AV MANUEL DE LA TORRE CUADRA 6 SN",2],["LIMA","SANTA ANITA","CASA DE LA JUVENTUD","JR AVUTARDAS CUADRA 7 SN COOP MIGUEL GRAU",3],["LIMA","SANTA ANITA","IEP PATRON SAN ISIDRO DE SANTA ANITA","AV HUAROCHIRI SN MZ C LT 1-2 URB VILLA LA OROYA",13],["LIMA","SANTA ANITA","IE HORACIO ZEBALLOS GAMEZ","CALLE 27 MZ J LT 12 URB LAS PRADERAS",6],["LIMA","SANTA MARIA DEL MAR","IEP PARROQUIAL LA RESURRECCION DEL SEÑOR","PARQUE CENTRAL 1 MZ C LT 2",6],["LIMA","SANTA ROSA","IEI 611","AV HEROES NAVALES SN",2],["LIMA","SANTA ROSA","IEP CORAZON DE SANTA MARIA","MZ U7 LOTE 05 - 08",5],["LIMA","SANTA ROSA","IEP INKA´S COLLEGE","CALLE 9 MZ B1 LT 2",6],["LIMA","SANTA ROSA","IE 892 - 8187 LA ARBOLEDA","CALLE 2 Y 4 SN",12],["LIMA","SANTA ROSA","IE PROFAM","CALLE SN - MZ F4 LTE 1",3],["LIMA","SANTA ROSA","IEP MONTESSORI DE SANTA ROSA","JR CONCORDIA 172 - 174",9],["LIMA","SANTA ROSA","IEP NUESTRO MARAVILLOSO MUNDO","MZ B LOTE 5 Y 6",7],["LIMA","SANTA ROSA","IE 8185 JESÚS EL NAZARENO","CALLE SAN FRANCISCO SN MZ W AAHH PARCELA C",5],["LIMA","SANTA ROSA","IEP SAN ANTONIO MARIA CLARET","MZ L LT 25 URB COOVITIOMAR",5],["LIMA","SANTA ROSA","IEP MIGUEL DE CERVANTES - SANTA ROSA","ENTRADA AL KARTODROMO SN PARCELA CLUB HIPICO",8],["LIMA","SANTA ROSA","IEP NUESTRO MARAVILLOSO MUNDO - PRIMARIA","MZ C LT 22 ASOC SANTA ROSA",5],["LIMA","SANTIAGO DE SURCO","PONTIFICIA UNIVERSIDAD CATOLICA DEL PERU - ESCUELA DE NEGOCIOS CENTRUM PUCP","JR DANIEL ALOMIA ROBLES 125",10],["LIMA","SANTIAGO DE SURCO","IEP COLEGIO DE LA INMACULADA JESUITAS","CALLE HERMANOS SANTO GARCIA SN",20],["LIMA","SANTIAGO DE SURCO","IEP CORAZON INMACULADO","JR TALARA 154",4],["LIMA","SANTIAGO DE SURCO","IEP FRANCO PERUANO","PJE FRANCO PERUANO SN",15],["LIMA","SANTIAGO DE SURCO","IEP CRISTO MILAGROSO","AV COMBATE DE ANGAMOS 240",5],["LIMA","SANTIAGO DE SURCO","POLIDEPORTIVO SAGITARIO","AV LAS GAVIOTAS SN CUADRA 17",10],["LIMA","SANTIAGO DE SURCO","IEP DE MARIA","CALLE A MZ B LOTE 13",6],["LIMA","SANTIAGO DE SURCO","IE 6086 SANTA ISABEL DE VILLA","AV JOSE OLAYA SN",5],["LIMA","SANTIAGO DE SURCO","IEP NUESTRA SEÑORA DE LA RECONCILIACION","AV MANUEL OLGUIN 749",17],["LIMA","SANTIAGO DE SURCO","IE 7068 ABRAHAM ROLDAN POMA - INICIAL","CALLE TAMBO COLORADO 125",4],["LIMA","SANTIAGO DE SURCO","COLEGIO CHAMPAGNAT","AV PASEO DE LA REPUBLICA 7930",40],["LIMA","SANTIAGO DE SURCO","IEP COLEGIO SANTA MARIA MARIANISTAS","AV LA FLORESTA 250",26],["LIMA","SANTIAGO DE SURCO","IE 6043 PEDRO VENTURO","AV HIGUERETA 479",8],["LIMA","SANTIAGO DE SURCO","IE 6047 JOSE MARIA ARGUEDAS","AV EL CARMEN SN",16],["LIMA","SANTIAGO DE SURCO","IE 6082 LOS PROCERES","ALAMEDA CORONEL ANDRES RAZURI SN",44],["LIMA","SANTIAGO DE SURCO","IE 7058 MARIA DE FATIMA","JR. ARICA CUADRA 2 SN",7],["LIMA","SANTIAGO DE SURCO","IE 7068 ABRAHAM ROLDAN POMA - PRIMARIA","AV CAMILO CARRILLO SN",19],["LIMA","SANTIAGO DE SURCO","IE 7086 LOS PRECURSORES","AV PASEO DE LA REPUBLICA SN",43],["LIMA","SANTIAGO DE SURCO","IE 7087 SANTIAGO DE SURCO","CALLE LOMA REAL SN",12],["LIMA","SANTIAGO DE SURCO","IE TECNICO FAP. MANUEL POLO JIMENEZ - SECUNDARIA","JR TENIENTE CORONEL FAP JORGE CHAMOD BIGGS",32],["LIMA","SANTIAGO DE SURCO","IE 6044 JORGE CHAVEZ","JR MIGUEL GRAU 500",34],["LIMA","SANTIAGO DE SURCO","IE PNP CAP ALCIDES VIGO HURTADO","JR VILLA CARRILLO 287",18],["LIMA","SANTIAGO DE SURCO","MONTERRICO IE APLICACION","CALLE MONTERRICO CHICO SN CDRA 1",10],["LIMA","SANTIAGO DE SURCO","IEI 086 NUESTRA SEÑORA DEL CARMEN","JR ARICA 240",3],["LIMA","SANTIAGO DE SURCO","IEI 087 CORAZON DE MARIA","CALLE ALAMEDA DOMINGO TRISTAN Y MOSCOSO 502",4],["LIMA","SANTIAGO DE SURCO","IEI VICTORIA BARCIA BONIFFATTI","JR VILLA CARRILLO 140",10],["LIMA","SANTIAGO DE SURCO","IEP COLEGIO MIXTO SANTA TERESITA","AV SURCO 255",27],["LIMA","SANTIAGO DE SURCO","IEP HORACIO PATIÑO CRUZATTI","AV LAS NAZARENAS 401",22],["LIMA","SANTIAGO DE SURCO","IEP SANTA MARIA DE SURCO","JOSE GALVEZ 371",8],["LIMA","SANTIAGO DE SURCO","UNIVERSIDAD DE LIMA 1","AV MANUEL OLGUIN 125",33],["LIMA","SANTIAGO DE SURCO","UNIVERSIDAD MARCELINO CHAMPAGNAT","AV MARISCAL RAMON CASTILLA 1270",27],["LIMA","SANTIAGO DE SURCO","UNIVERSIDAD RICARDO PALMA","AV BENAVIDES 5440",80],["LIMA","SANTIAGO DE SURCO","CLUB SOCIAL DEPORTIVO CULTURAL ZETA SANTA ROSA","JR JOSE MARIA CORBACHO CUADRA 3",8],["LIMA","SANTIAGO DE SURCO","ASOCIACION DE PROPIETARIOS DE LA URB LA CAPULLANA LOSA 1","CALLE TAMARINDO SN",10],["LIMA","SANTIAGO DE SURCO","ASOCIACION DE PROPIETARIOS DE LA URB LA CAPULLANA - LOSA 2","CALLE QUERECOTILLO SN",10],["LIMA","SANTIAGO DE SURCO","IE 6087 PABLO MARIA GUZMAN","JR CINERARIA SN",10],["LIMA","SANTIAGO DE SURCO","CAMPO DEPORTIVO EL TANQUE","PJE PLANETA 200",15],["LIMA","SANTIAGO DE SURCO","ESTACIONAMIENTO 1 - UNIVERSIDAD DE LIMA","JR CRUZ DEL SUR SN",25],["LIMA","SANTIAGO DE SURCO","ESTACIONAMIENTO 2 - UNIVERSIDAD DE LIMA","JR CRUZ DEL SUR SN",39],["LIMA","SANTIAGO DE SURCO","IEP SANTISIMA VIRGEN DE CHAPI","AV SANTIAGO DE SURCO 4955",5],["LIMA","SANTIAGO DE SURCO","IEP SANTA TERESITA DEL NIÑO JESUS","PROL JUAN PAZOS 411",4],["LIMA","SANTIAGO DE SURCO","IEI 557 WARMA KUYAY","CALLE LOMA DE LAS CLIVIAS SN",4],["LIMA","SANTIAGO DE SURCO","CEBE SURCO","CALLE LOMA FLOR 162",4],["LIMA","SANTIAGO DE SURCO","IE 6097 MATEO PUMACAHUA","AV SANTA ROSA SN",31],["LIMA","SANTIAGO DE SURCO","UNIVERSIDAD DE LIMA 2","JR CRUZ DEL SUR SN",36],["LIMA","SANTIAGO DE SURCO","IEP SAN MARCOS DE MONTERRICO","CALLE LAS AZUCENAS 108",6],["LIMA","SANTIAGO DE SURCO","IE TECNICO FAP MANUEL POLO JIMENEZ - PRIMARIA","CALLE COHETE 102",27],["LIMA","SANTIAGO DE SURCO","IEP LA VILLA DE SAN JOSE","AV MARIA PARADO DE BELLIDO MZ C LOTE 22",7],["LIMA","SANTIAGO DE SURCO","IEP INNOVA SCHOOLS SURCO - AMBROSIO","JR VENEGAS 896",40],["LIMA","SANTIAGO DE SURCO","IE TECNICO FAP MANUEL POLO JIMENEZ - INICIAL","CALLE MENDEZ IBAÑEZ SN",9],["LIMA","SANTIAGO DE SURCO","IEP ST GOSPA SCHOOL","AV JORGE CHAVEZ 1124",14],["LIMA","SANTIAGO DE SURCO","COLEGIO VIRGEN DE LA ASUNCION","JR MONTE ALGARROBO MZ J1 LT 18",15],["LIMA","SANTIAGO DE SURCO","PARROQUIA SAN ROQUE","CALLE EL COHETE SN",5],["LIMA","SANTIAGO DE SURCO","ASOCIACION VIPSE","SANTIAGO ANTUNEZ DE MAYOLO 670",10],["LIMA","SANTIAGO DE SURCO","IEI 555 INMACULADA CONCEPCION","PJE FELIPE PARDO Y ALIAGA SN",4],["LIMA","SANTIAGO DE SURCO","CETPRO CARLOS CUETO FERNANDINI","CALLE ROSA MERCEDES MZ A",8],["LIMA","SANTIAGO DE SURCO","IEP SACO OLIVEROS - MONTERRICO","AV CRISTOBAL DE PERALTA 410",22],["LIMA","SANTIAGO DE SURCO","ESCUELA DE EDUCACION SUPERIOR PEDAGOGICA PUBLICA MONTERRICO","JR MORRO SOLAR 982",40],["LIMA","SANTIAGO DE SURCO","COLEGIO TRENER 1 SURCO","CALLE CRISTOBAL DE PERALTA 1081",33],["LIMA","SANTIAGO DE SURCO","COLEGIO TRENER 2","JR CRISTOBAL DE PERALTA SUR 527",8],["LIMA","SANTIAGO DE SURCO","LOSA DEPORTIVA MEDALLA MILAGROSA","JR MONTE ALAMOS CUADRA 5 URB MONTERRICO SUR",10],["LIMA","SANTIAGO DE SURCO","IEP NUEVO MUNDO","AV VILLA CARRILLO 320",9],["LIMA","SANTIAGO DE SURCO","ESTADIO JULIO MONTJOY","JR SANTO CRISTO SN",46],["LIMA","SANTIAGO DE SURCO","POLIDEPORTIVO LOMA AMARILLA","AV LOMA UMBROSO SN",10],["LIMA","SANTIAGO DE SURCO","CENTRO DE CONVENCIONES PARQUE DE LA AMISTAD","CALLE SACRAMENTO SN",38],["LIMA","SANTIAGO DE SURCO","IEI URPI WASSI","JR TALARA 115",3],["LIMA","SURQUILLO","CASA DEL ADULTO MAYOR I","CALLE EL CARMEN 497",5],["LIMA","SURQUILLO","COMPLEJO DEPORTIVO PAUL HARRIS - MOROCOCHA","CALLE PORTOCARRERO SN",25],["LIMA","SURQUILLO","CASA DE LA JUVENTUD","AV REPUBLICA DE PANAMA 5300",5],["LIMA","SURQUILLO","CEBE ESPECIAL SURQUILLO","CALLE DIDEROT 313",13],["LIMA","SURQUILLO","IE 7012 JESUS DE LA MISERICORDIA","JR MANUEL IRRIBARREN 840",8],["LIMA","SURQUILLO","IE 7014 VASIL LEVSKI","CALLE LAS MAGNOLIAS SN URB LOS SAUCES II",17],["LIMA","SURQUILLO","IE 7027 NUESTRA SEÑORA DE LA ALEGRIA","CALLE FRANCISO MORENO 450",8],["LIMA","SURQUILLO","IE 7028 MARCO ANTONIO SCHENONE OLIVA","PJE SAN FELIPE SN",7],["LIMA","SURQUILLO","IE 7031 REYNA DE LA FAMILIA","CALLE DAUDET SN",9],["LIMA","SURQUILLO","IE EMBLEMATICA RICARDO PALMA","AV ANGAMOS ESTE CUADRA 15",40],["LIMA","SURQUILLO","IE NUESTRA SEÑORA DE LOURDES","AV ANGAMOS ESTE 1957",14],["LIMA","SURQUILLO","IE LA DIVINA PROVIDENCIA","AV ANGAMOS ESTE 2296",21],["LIMA","SURQUILLO","ESTADIO MUNICIPAL CARLOS A. MOSCOSO 2","AV TOMAS MARSANO 1100",50],["LIMA","SURQUILLO","IEP PRITE ALEGRIA EN EL CORAZON","CALLE HARRINGTON 306 URB LA CALERA DE LA MERCED",5],["LIMA","SURQUILLO","CEBE SANTA MARIA DE GUADALUPE","CALLE VARSOVIA 310",14],["LIMA","SURQUILLO","IE 7022 ALBERT EINSTEIN","AV ALBERT EINSTEIN 474",9],["LIMA","SURQUILLO","IEP SANTA MARIA COLLEGE","CALLE ANDRES LUNA 256",6],["LIMA","SURQUILLO","CEIGNE VIRGEN DE LA PAZ SURQUILLO","CALLE JOSE NEYRA MZ E 1 LT 2",5],["LIMA","SURQUILLO","IE 7024 SAN LORENZO","JR SAN LORENZO 972",9],["LIMA","SURQUILLO","ESTADIO MUNICIPAL CARLOS A. MOSCOSO 2B","AV TOMAS MARSANO 1100",47],["LIMA","SURQUILLO","CUNA JARDIN APRENDIENDO JUNTOS","CALLE LOS PAUJILES 161-163",6],["LIMA","SURQUILLO","IEI 053 MI NIÑITO JESUS","PJE ESCORPION MZ D LT 7",5],["LIMA","SURQUILLO","IEI 079 VIRGEN DEL CARMEN","CALLE PIRANDELLO SN CUADRA 1",3],["LIMA","SURQUILLO","IEI 556 NIÑO JESUS DE DAMMERT MUELLE","PLAZA DE LA INTEGRACION SN",6],["LIMA","VILLA EL SALVADOR","IE 7077 VIRGEN DEL CARMEN","AV EL SOL SEIS MZ G1 LOTE 2",10],["LIMA","VILLA EL SALVADOR","IE 7216 VILLA DE JESUS","SECTOR 5 ASOCIACION DE VIVIENDA VILLA DE JESUS MZ L LT 1",10],["LIMA","VILLA EL SALVADOR","IE 7232 DANIEL ALCIDES CARRION","SECTOR 6 GRUPO 11 PARQUE CENTRAL MZ Q",7],["LIMA","VILLA EL SALVADOR","IE 7237 PERU VALLADOLID","SECTOR 2 GRUPO 10 MZ F1 PRIMA SN",13],["LIMA","VILLA EL SALVADOR","IE 7240 JESUS DE NAZARETH","AAHH EDILBERTO RAMOS 1 SECTOR 1",30],["LIMA","VILLA EL SALVADOR","IE 7243 REY JUAN CARLOS DE BORBON","MZ A3 LOTE 45 ETAPA IV",10],["LIMA","VILLA EL SALVADOR","IE 7238 SOLIDARIDAD PERU ALEMANIA","MZ E SN SECTOR 9 GRUPO 5",10],["LIMA","VILLA EL SALVADOR","IEP ADVENTISTA SALVADOR","AV MICAELA BASTIDAS SECTOR 1 GRUPO 24 MZ B LT2",20],["LIMA","VILLA EL SALVADOR","IEP ASCENSION SCHOOL UNICACHI","AV LOS ALGARROBOS MZ E PARCELA 4",6],["LIMA","VILLA EL SALVADOR","IEP AVANTGARD COLLEGE","AV JUAN VELASCO ALVARADO LT 29 - 30",21],["LIMA","VILLA EL SALVADOR","IEP PASCAL BLAISE","AV SEPARADORA INDUSTRIAL SECTOR 9 GRUPO 3 MZ P LOTE 1-16",10],["LIMA","VILLA EL SALVADOR","IEP HOWARD GARDNER","SECTOR 1 GRUPO 7 MZ P LOTE 13",9],["LIMA","VILLA EL SALVADOR","IEP INNOVA SCHOOLS - VES LADERAS DE VILLA","PROL MATEO PUMACAHUA SN",12],["LIMA","VILLA EL SALVADOR","IEP JULIO CESAR TELLO DE OASIS","GRUPO 1 MZ J LT 7 SECTOR 10",15],["LIMA","VILLA EL SALVADOR","IEP LA CATOLICA","MZ J LOTE 1 Y 2 OASIS",10],["LIMA","VILLA EL SALVADOR","IEP LA MERCED","MZ G2 LT1 AGRUPAMIENTO PACHACAMAC PARCELA 2A FRACCION 5-6",23],["LIMA","VILLA EL SALVADOR","IEP MARIA INMACULADA CONCEPCION","CUARTA ETAPA BARRIO 3 SECTOR 2 MANZANA G PRIMA LT 23-24",8],["LIMA","VILLA EL SALVADOR","IEP MI DULCE JESUS","SECTOR 6 GRUPO 7 MZ M LOTE 15 Y 16",12],["LIMA","VILLA EL SALVADOR","IEP MILITARIZADO MAX UHLE","MZ E LT 8",10],["LIMA","VILLA EL SALVADOR","IEP NUESTRA SEÑORA DE LA MERCED","AV PASTOR SEVILLA SECTOR 1 GRUPO 26 MZ J LOTE 22",20],["LIMA","VILLA EL SALVADOR","IEP PROLOG DE VILLA EL SALVADOR - PRIMARIA","SECTOR 3 GRUPO 12 MZ I LOTE 8",10],["LIMA","VILLA EL SALVADOR","IEP PROLOG DE VILLA EL SALVADOR - SECUNDARIA","MZ L LOTE 13 SECTOR 3 GRUPO 12",12],["LIMA","VILLA EL SALVADOR","IEP SAN AGUSTIN DE VILLA","SECTOR 01 GRUPO 19 MZ A LOTE 10",10],["LIMA","VILLA EL SALVADOR","IEP SAN IGNACIO DE LOYOLA","SECTOR 3 GRUPO 31 MZ A7 LT 3 - AV MARIANO PASTOR SEVILLA SN",10],["LIMA","VILLA EL SALVADOR","IEP SEBASTIAN LORENTE","SECTOR 7 GRUPO 2 MZ N LOTE 5 AV JOSE OLAYA",10],["LIMA","VILLA EL SALVADOR","IEP JORGE CHAVEZ","IV ETAPA SECTOR 2 BARRIO 1 MZ O LOTE 9 AL 13",9],["LIMA","VILLA EL SALVADOR","IEP MONTESSORI DE VILLA","SECTOR 3 GRUPO 14 MZ C LOTE 1 - 2",9],["LIMA","VILLA EL SALVADOR","IEP SAN LORENZO","MZ ZC LOTE 29 - 30 Y 31 URB PACHACAMAC III ETAPA",10],["LIMA","VILLA EL SALVADOR","IEP PERUANO FRANCES","SECTOR 2 GRUPO 23 A MZ J LT 17",8],["LIMA","VILLA EL SALVADOR","IEP CIENCIAS","AV EL SOL SN SECTOR 1 GRUPO 20 MZ M LT 13",10],["LIMA","VILLA EL SALVADOR","IEP EL NAZARENO DE VILLA - SECUNDARIA","SECTOR 9 GRUPO 2 MZ E LOTE 1",6],["LIMA","VILLA EL SALVADOR","IEP BENJAMIN FRANKLIN","PJE VC MZ ZC COMERCIAL LT 25 III ETAPA URB PACHACAMAC",9],["LIMA","VILLA EL SALVADOR","IEP EL MUNDO NUEVO DE VILLA","SECTOR 6 GRUPO 9 MZ M LT 18",10],["LIMA","VILLA EL SALVADOR","IEP EMMANUEL","CALLE B MZ D LT 36",15],["LIMA","VILLA EL SALVADOR","ISP ANTONIO RAYMONDI","SECTOR 3 GRUPO 20 MZ P LT 13-14",9],["LIMA","VILLA EL SALVADOR","IEP ROSA DE SANTA MARIA DE VILLA","SECTOR 2 GRUPO 7 MZ E LOTE 14",6],["LIMA","VILLA EL SALVADOR","IE 7234 LAS PALMERAS","AV LAS PALMERAS MZ L – LT 1",10],["LIMA","VILLA EL SALVADOR","CETPRO CFT PROMAE VES","AV BOLIVAR 697-1 SECTOR 3",30],["LIMA","VILLA EL SALVADOR","IE 6062 PERU EEUU","AV MICAELA BASTIDAS SN",20],["LIMA","VILLA EL SALVADOR","IE 6063 JOSE CARLOS MARIATEGUI","AV EL SOL SN SECTOR 2",30],["LIMA","VILLA EL SALVADOR","IE 6065 PERU INGLATERRA","AV SANTA ROSA SN",30],["LIMA","VILLA EL SALVADOR","IE 6067 JUAN VELASCO ALVARADO","SECTOR 3 GRUPO 11",18],["LIMA","VILLA EL SALVADOR","IE 6068 MANUEL GONZALES PRADA","AV LOS ALAMOS SECTOR 3 GRUPO 17",13],["LIMA","VILLA EL SALVADOR","IE 6069 PACHACUTEC","AV LAS AMERICAS SN SECTOR 3 GRUPO 14",30],["LIMA","VILLA EL SALVADOR","IE 6070 HEROES DEL ALTO CENEPA","AV LOS ALAMOS SECTOR 1 GRUPO 11",20],["LIMA","VILLA EL SALVADOR","IE 6071 REPUBLICA FEDERAL DE ALEMANIA","AV MARIA ELENA MOYANO SECTOR 6 GRUPO 7A",20],["LIMA","VILLA EL SALVADOR","IE 6076 REPUBLICA DE NICARAGUA","AV MICAELA BASTIDAS SN",21],["LIMA","VILLA EL SALVADOR","IE 6080 ROSA DE AMERICA","AV REVOLUCIÓN SECTOR 1 GRUPO 14 MZ Q LT 1",20],["LIMA","VILLA EL SALVADOR","IE 6099 PERU ESPAÑA","SECTOR 6 GRUPO 2 - A",20],["LIMA","VILLA EL SALVADOR","IE 7072 SAN MARTIN DE PORRES","AV REVOLUCION SN SECTOR 1 GRUPO 10",30],["LIMA","VILLA EL SALVADOR","IE 7084 PERUANO SUIZO","MZ S LT 1 PRIMERA ETAPA",30],["LIMA","VILLA EL SALVADOR","IE 7090 FORJADORES DEL PERU","AV 21 DE JUNIO SN",12],["LIMA","VILLA EL SALVADOR","IE 7091 REPUBLICA DEL PERU","SECTOR 7 GRUPO 1 MZ E",30],["LIMA","VILLA EL SALVADOR","IE 7092 JUAN PABLO II","AV CENTRAL SN",10],["LIMA","VILLA EL SALVADOR","IE 7093 REPUBLICA DE FRANCIA","AV MICAELA BASTIDAS SN",25],["LIMA","VILLA EL SALVADOR","IE 7094 SASAKAWA","AV EL SOL SN SECTOR 8",23],["LIMA","VILLA EL SALVADOR","IE 7095 PERU ITALIA","CALLE LOS TULIPANES SN SECTOR 1 GRUPO 21 A",9],["LIMA","VILLA EL SALVADOR","IE 7096 PRINCIPE DE ASTURIAS","AV CESAR VALLEJO SECTOR 6 GRUPO 5 - A",30],["LIMA","VILLA EL SALVADOR","IE 7097 VILLA AMSTELVEEN","SECTOR 3 GRUPO 8 MZ J1 LT 4",12],["LIMA","VILLA EL SALVADOR","IE 7213 PERUANO JAPONES","AV 200 MILLAS SN",20],["LIMA","VILLA EL SALVADOR","IE 7228 PERUANO CANADIENSE","AV PERUANO CANADIENSE SN CUARTA ETAPA PACHACAMAC",5],["LIMA","VILLA EL SALVADOR","IE FE Y ALEGRIA 17","AV REVOLUCION SN",18],["LIMA","VILLA EL SALVADOR","IE REPUBLICA DE BOLIVIA","SECTOR 1 GRUPO 13 MZ J1 LT 01",20],["LIMA","VILLA EL SALVADOR","IE 6066 VILLA EL SALVADOR","AV LOS ALAMOS SN SECTOR 2 GRUPO 15",30],["LIMA","VILLA EL SALVADOR","IEP PAMER","SECTOR 3 GRUPO 16 MZ I LT 12",12],["LIMA","VILLA EL SALVADOR","IEP SACO OLIVEROS DE VILLA EL SALVADOR","PJE SN SECTOR 1 GRUPO 13 MZ J1 LT 1",30],["LIMA","VILLA EL SALVADOR","EESPP MANUEL GONZALES PRADA","AV 3 DE OCTUBRE SN",9],["LIMA","VILLA EL SALVADOR","IESTP JULIO CESAR TELLO","AV BOLIVAR MZ A LT 1 SECTOR 3 GRUPO RESIDENCIAL 100",12],["LIMA","VILLA EL SALVADOR","IEP CORAZON DE JESUS DE OASIS","MZ D LT 13 GRUPO 4 SECTOR 10",10],["LIMA","VILLA EL SALVADOR","IE 7224 ELIAS AGUIRRE","BARRIO 2 IV ETAPA URB PACHACAMAC",18],["LIMA","VILLA EL SALVADOR","IE 7242 DIVINO MAESTRO","AV 6 DE AGOSTO SN PARCELA 3A",12],["LIMA","VILLA EL SALVADOR","IE 7215 NACIONES UNIDAS PRIMARIA","MZ K 4TA ETAPA URB PACHACAMAC SECTOR 2",8],["LIMA","VILLA EL SALVADOR","IEP JAVIER PEREZ DE CUELLAR","AV MATEO PUMACAHUA MZ A1 LOTE 3",9],["LIMA","VILLA EL SALVADOR","IE 6004 SANTIAGO ANTUNEZ DE MAYOLO SECUNDARIA","MZ Ñ LOTE 3 SECTOR 5",10],["LIMA","VILLA EL SALVADOR","IEP MILITARIZADO MAX UHLE - CALIFORNIA","AV LOS ALGARROBOS MZ Q LT 1-2-3",8],["LIMA","VILLA EL SALVADOR","IEP INNOVA SCHOOLS - VES VALLEJO","CALLE 6 SN LT 38 VILLA EL SALVADOR",20],["LIMA","VILLA MARIA DEL TRIUNFO","IEI 552","AV FLORA TRISTAN SN",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6059 SAGRADO CORAZON DE JESUS","JR COTAHUASI 120",24],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6072","CALLE LAS BEGONIAS SN",8],["LIMA","VILLA MARIA DEL TRIUNFO","IEI 652 01 EL PARAISO","AV PARAISO SN",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7217 OLIMPIA GERALDINA MELENDEZ PERALTA","CALLE 5 MZ COLEGIO",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7220","AV CAMINOS DEL INCA PARAISO SN",10],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7231","AV PROLONGACION PACHACUTEC SN",12],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7233 MATSU UTSUMI","AV CASAGRANDE SN AH PUYUSCA",25],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7245 SAN JOSE OBRERO","AV LA UNION SN MZ F1 LOTE 1",8],["LIMA","VILLA MARIA DEL TRIUNFO","IEP SANTA MARIA DEL CAMINO","AV LOS PROCERES 535",8],["LIMA","VILLA MARIA DEL TRIUNFO","CEP JESUS MI REDENTOR - SECUNDARIA","AV FRANCISCO DE ZELA 415 - 417",9],["LIMA","VILLA MARIA DEL TRIUNFO","IEPA EL REDENTOR","JR FAUSTINO SANCHEZ CARRION 148",13],["LIMA","VILLA MARIA DEL TRIUNFO","IEP ANGELES DE JESUS - SEDE 2","AV MICAELA BASTIDA 214",6],["LIMA","VILLA MARIA DEL TRIUNFO","IEP FRIEDRICH WOHLER","CALLE TARAPACA 180",10],["LIMA","VILLA MARIA DEL TRIUNFO","CEP JESUS MI REDENTOR - PRIMARIA","AV SIMON BOLIVAR 1170",8],["LIMA","VILLA MARIA DEL TRIUNFO","IEP LA CATOLICA","JR IQUITOS 253",17],["LIMA","VILLA MARIA DEL TRIUNFO","IEP MATER ADMIRABILIS","JR LATINOAMERICA 332",15],["LIMA","VILLA MARIA DEL TRIUNFO","IEP MARIA DE LOS ANGELES","JR UNION 551",12],["LIMA","VILLA MARIA DEL TRIUNFO","IEP MARIA MONTESSORI","JR MARAÑON 159 JOSE GALVEZ MZ 61 LT 5",13],["LIMA","VILLA MARIA DEL TRIUNFO","IEP PROLOG DE VILLA MARIA","AV VILLA MARIA 291",12],["LIMA","VILLA MARIA DEL TRIUNFO","IEP REDIMER JESUS","CALLE JOSE OLAYA 224",5],["LIMA","VILLA MARIA DEL TRIUNFO","IEP SIERVOS DE JESUS","PJE MONTE DE LOS OLIVOS MZ K 2 LOTE 8 - 9",8],["LIMA","VILLA MARIA DEL TRIUNFO","CETPRO JOSE GALVEZ BARRENECHEA","AV LIMA 503 JOSE GALVEZ",5],["LIMA","VILLA MARIA DEL TRIUNFO","IEP KERPEN HORREN","AV AGRICULTURA SN",7],["LIMA","VILLA MARIA DEL TRIUNFO","IE MANUEL CASALINO GRIEVE","JR LAS MARGARITAS SN",8],["LIMA","VILLA MARIA DEL TRIUNFO","IEP PROLOG DE NUEVA ESPERANZA","AV 26 DE NOVIEMBRE 1149",20],["LIMA","VILLA MARIA DEL TRIUNFO","IEP REINA CARMELITA","AV MIGUEL GRAU 2205",8],["LIMA","VILLA MARIA DEL TRIUNFO","IEP SAN IGNACIO DE NUEVA ESPERANZA","JR LIBERTAD 196",11],["LIMA","VILLA MARIA DEL TRIUNFO","IEP HENDRICK ANTOON LORENTZ","PJE CHILETE 183 CESAR VALLEJO",5],["LIMA","VILLA MARIA DEL TRIUNFO","IEP CRISTOBAL COLON","AV 26 DE NOVIEMBRE 1721",5],["LIMA","VILLA MARIA DEL TRIUNFO","COLEGIO CIENTIFICO NIKOLA TESLA","MZ F LT 7 AAHH 19 DE JULIO",5],["LIMA","VILLA MARIA DEL TRIUNFO","IEP HIRAM BINGHAM","JR SANTA CRUZ 372",6],["LIMA","VILLA MARIA DEL TRIUNFO","IEP LINCOLN DEL TRIUNFO","AV JORGE CHAVEZ 281",6],["LIMA","VILLA MARIA DEL TRIUNFO","IEP CESAR ABRAHAM VALLEJO MENDOZA","AV JOSE CARLOS MARIATEGUI 1925",8],["LIMA","VILLA MARIA DEL TRIUNFO","COLEGIO EXPHADIS - EX MELITON CARBAJAL","JR LA CONVENCION SN",8],["LIMA","VILLA MARIA DEL TRIUNFO","IEP JUAN GUTEMBERG","AV DANIEL ALCIDES CARRION 858",5],["LIMA","VILLA MARIA DEL TRIUNFO","IEP ALMIRANTE MIGUEL GRAU SEMINARIO - SECUNDARIA","AV SAN FRANCISCO 386",19],["LIMA","VILLA MARIA DEL TRIUNFO","IEP MIGUEL GRAU - PRIMARIA","AV SIMON BOLIVAR MZ 2 L LT 6",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE PARROQUIAL NUESTRO SALVADOR","AV JUAN GUERRERO QUIMPER 1300",40],["LIMA","VILLA MARIA DEL TRIUNFO","IEP CRISTO AMIGO - SECUNDARIA","CALLE SAN LUIS MZ A LT 1",11],["LIMA","VILLA MARIA DEL TRIUNFO","IEP CRISTO AMIGO - PRIMARIA","JR SAENZ PEÑA 147",6],["LIMA","VILLA MARIA DEL TRIUNFO","IEI 525 REYNA DEL CARMEN","JR ICA 150",9],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6011 SANTISIMA VIRGEN DE FATIMA","AV 28 DE JULIO N° 790",18],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6014 VIRGEN DEL CARMEN","JR TORIBIO RODRIGUEZ DE MENDOZA 252",9],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6015 SANTISIMO SAGRADO CORAZON DE JESUS","AV LIMA 1005",13],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6017 SANTA ROSA BAJA","JR 9 DE AGOSTO SN",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6019 MARIANO MELGAR","AV LA UNION 1115",30],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6020 MICAELA BASTIDAS","JR HUAYNA CAPAC SN",24],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6022","AV EL SOL 205",5],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6024 JOSE MARIA ARGUEDAS","CALLE SAN FRANCISCO SN",24],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6025 652 - 20","AV 8 DE OCTUBRE 365",15],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6029 BARTOLOME MITRE","JR AMAZONAS 252",10],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6032 ALMIRANTE MIGUEL GRAU SEMINARIO","AV 26 DE NOVIEMBRE 076",15],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6056 SANTA ROSA ALTA","AV SANTA ROSA 900",24],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6057 VIRGEN DE LOURDES","JR CASMA 215",12],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6060 JULIO C TELLO","AV PACHACUTEC 4355",30],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6073 JORGE BASADRE GROHMANN - PRIMARIA","AV GUILLERMO BILLINGHURST 640",18],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6073 JORGE BASADRE GROHMANN - SECUNDARIA","AV RICARDO PALMA 600",15],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6081 MANUEL SCORZA TORRES","AV SIMON BOLIVAR SN",28],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6084 SAN MARTIN DE PORRES","JR RICARDO PALMA SN",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6093 JUAN VALER SANDOVAL","AV MIGUEL GRAU SN",21],["LIMA","VILLA MARIA DEL TRIUNFO","IE 6152 STELLA MARIS","JR PASEO ATAHUALPA 150",31],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7054 VILLA MARIA DEL TRIUNFO","AV VILLA MARIA 800",39],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7055 TUPAC AMARU II","AV EL TRIUNFO CDRA 7 SN",32],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7057 SOBERANA ORDEN MILITAR DE MALTA","AV PANDO EGUZQUIZA 501",33],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7073 SANTA ROSA DE LIMA","AV MARIA PARADO DE BELLIDO 180 - 2",32],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7080 JORGE BERNALES SALAS","JR INDEPENDENCIA 196 - VALLECITO BAJO",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7088 GERONIMO CAFFERATA MARAZZI","AV FLORA TRISTAN 1050",16],["LIMA","VILLA MARIA DEL TRIUNFO","IE PARROQUIAL LOS CAMINANTES","JR SUCRE 300 JOSE GALVEZ",13],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7106 VILLA LIMATAMBO","AV PROL JOSE CARLOS MARIATEGUI 3467",33],["LIMA","VILLA MARIA DEL TRIUNFO","IE FE Y ALEGRIA 23","AV GARCILASO DE LA VEGA 156",13],["LIMA","VILLA MARIA DEL TRIUNFO","IE FE Y ALEGRIA 24","AV JOSE CARLOS MARIATEGUI 2855",12],["LIMA","VILLA MARIA DEL TRIUNFO","IE JOSE CARLOS MARIATEGUI","AV PRIMAVERA 1245",7],["LIMA","VILLA MARIA DEL TRIUNFO","IE MARISCAL ELOY GASPAR URETA","AV 26 DE NOVIEMBRE 102 - A",18],["LIMA","VILLA MARIA DEL TRIUNFO","I.E. REPUBLICA DE ECUADOR","JR. EL TRIUNFO S/N",21],["LIMA","VILLA MARIA DEL TRIUNFO","IESTP JUAN VELASCO ALVARADO","AV JOSE OLAYA 120",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE TUPAC AMARU","PROL AV VILLA MARÍA 191",35],["LIMA","VILLA MARIA DEL TRIUNFO","IESTP VILLA MARIA","AV PROL VILLA MARIA 492",6],["LIMA","VILLA MARIA DEL TRIUNFO","IESTP SAN FRANCISCO DE ASIS","JR FRANCISCO BOLOGNESI 592",5],["LIMA","VILLA MARIA DEL TRIUNFO","IEP NAZARENO","JR JOSE DE SAN MARTIN SN",6],["LIMA","VILLA MARIA DEL TRIUNFO","IEP TERESA DE LOS REYES","AV JOSE CARLOS MARIATEGUI 2305",9],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7226 - 562 JOSE OLAYA BALANDRA","AV LOS INCAS MZ 15 LT 6 SECTOR 3",26],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7218 PAPA JUAN PABLO II","CALLE JAVIER HERAUD SN",6],["LIMA","VILLA MARIA DEL TRIUNFO","IEP LISCAY","MZA. E LT. 20 CALLE 4 GRUPO RESIDENCIAL 1",5],["LIMA","VILLA MARIA DEL TRIUNFO","IEP MIGUEL GRAU INICIAL","CALLE LA CONCORDIA SN MZA 2J LT. 5A",6],["LIMA","VILLA MARIA DEL TRIUNFO","IEP SAN JUAN","AV 02 DE MAYO 663 - NUEVA ESPERANZA",13],["LIMA","VILLA MARIA DEL TRIUNFO","IEP COLEGIOS PROLOG SECUNDARIA - JOSE GALVEZ","AV MANCO CAPAC MZ Z 110 LOTE 9",6],["LIMA","VILLA MARIA DEL TRIUNFO","IE 7214","JR MARIANO NECOCHEA SN",5],["LIMA","VILLA MARIA DEL TRIUNFO","IE EMBLEMATICA JUAN GUERRERO QUIMPER","AV MARIAM QUIMPER 850",39]];
}