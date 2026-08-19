-- =====================================================================
-- MIGRACIÓN 007: Carga Masiva Idempotente de Locales y Mesas de ATE
-- Base de Datos: conteo
-- Total Locales: 123 | Total Mesas a Generar: 1650
-- =====================================================================

USE conteo;
GO

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Tabla temporal de locales con cantidad de mesas
    IF OBJECT_ID('tempdb..#LocalesAte') IS NOT NULL DROP TABLE #LocalesAte;
    CREATE TABLE #LocalesAte (
        id_local INT IDENTITY(1,1) PRIMARY KEY,
        departamento VARCHAR(100),
        provincia VARCHAR(100),
        distrito VARCHAR(100),
        colegio VARCHAR(255),
        direccion NVARCHAR(500),
        latitud VARCHAR(50),
        longitud VARCHAR(50),
        coordenadas_gps VARCHAR(100),
        cantidad_mesas INT
    );

    -- Inserción de catálogo de locales
    INSERT INTO #LocalesAte (departamento, provincia, distrito, colegio, direccion, latitud, longitud, coordenadas_gps, cantidad_mesas)
    VALUES
    ('LIMA', 'LIMA', 'ATE', 'IE 1208 SAN FRANCISCO DE ASIS', 'Distrito de Ate, Lima', '-12.043000', '-76.927700', 'Lat: -12.043000, Lng: -76.927700', 10),
    ('LIMA', 'LIMA', 'ATE', 'IE 1254 MARIA REICHE NEWMANN', 'Distrito de Ate, Lima', '-12.040800', '-76.912300', 'Lat: -12.040800, Lng: -76.912300', 19),
    ('LIMA', 'LIMA', 'ATE', 'IE 1265 SANTA ROSA DE LIMA', 'Distrito de Ate, Lima', '-12.038600', '-76.896900', 'Lat: -12.038600, Lng: -76.896900', 8),
    ('LIMA', 'LIMA', 'ATE', 'IE 1271 COLEGIO SAN JUAN BAUTISTA', 'Distrito de Ate, Lima', '-12.036400', '-76.932100', 'Lat: -12.036400, Lng: -76.932100', 9),
    ('LIMA', 'LIMA', 'ATE', 'IE 1283 OKINAWA', 'Distrito de Ate, Lima', '-12.034200', '-76.916700', 'Lat: -12.034200, Lng: -76.916700', 12),
    ('LIMA', 'LIMA', 'ATE', 'IE 1288 ALBERT EINSTEIN', 'Distrito de Ate, Lima', '-12.032000', '-76.901300', 'Lat: -12.032000, Lng: -76.901300', 7),
    ('LIMA', 'LIMA', 'ATE', 'IE 1289', 'Distrito de Ate, Lima', '-12.029800', '-76.936500', 'Lat: -12.029800, Lng: -76.936500', 8),
    ('LIMA', 'LIMA', 'ATE', 'IE 154 LOS CLAVELES', 'Distrito de Ate, Lima', '-12.027600', '-76.921100', 'Lat: -12.027600, Lng: -76.921100', 4),
    ('LIMA', 'LIMA', 'ATE', 'IE 171 VIRGEN DEL CARMEN', 'Distrito de Ate, Lima', '-12.025400', '-76.905700', 'Lat: -12.025400, Lng: -76.905700', 6),
    ('LIMA', 'LIMA', 'ATE', 'IE 185 SEÑOR DE LOS MILAGROS', 'Distrito de Ate, Lima', '-12.023200', '-76.940900', 'Lat: -12.023200, Lng: -76.940900', 5),
    ('LIMA', 'LIMA', 'ATE', 'IE 207 DIVINO NIÑO JESUS', 'Distrito de Ate, Lima', '-12.021000', '-76.925500', 'Lat: -12.021000, Lng: -76.925500', 7),
    ('LIMA', 'LIMA', 'ATE', 'IEP ALFRED NOBEL', 'Distrito de Ate, Lima', '-12.018800', '-76.910100', 'Lat: -12.018800, Lng: -76.910100', 32),
    ('LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE VITARTE', 'Distrito de Ate, Lima', '-12.016600', '-76.894700', 'Lat: -12.016600, Lng: -76.894700', 19),
    ('LIMA', 'LIMA', 'ATE', 'IEP INTERNACIONAL ELIM HUAYCAN', 'Distrito de Ate, Lima', '-12.014400', '-76.929900', 'Lat: -12.014400, Lng: -76.929900', 10),
    ('LIMA', 'LIMA', 'ATE', 'IEP LOS ANGELES', 'Distrito de Ate, Lima', '-12.012200', '-76.914500', 'Lat: -12.012200, Lng: -76.914500', 10),
    ('LIMA', 'LIMA', 'ATE', 'IEP NEW SCHOOL', 'Distrito de Ate, Lima', '-12.010000', '-76.899100', 'Lat: -12.010000, Lng: -76.899100', 20),
    ('LIMA', 'LIMA', 'ATE', 'IEP EDUARDO PALACI', 'Distrito de Ate, Lima', '-12.007800', '-76.934300', 'Lat: -12.007800, Lng: -76.934300', 11),
    ('LIMA', 'LIMA', 'ATE', 'IEP SALECIAN INNOVA (EX ALEXANDER GRAHAM BELL)', 'Distrito de Ate, Lima', '-12.005600', '-76.918900', 'Lat: -12.005600, Lng: -76.918900', 5),
    ('LIMA', 'LIMA', 'ATE', 'IEP SANTA TERESITA', 'Distrito de Ate, Lima', '-12.045200', '-76.903500', 'Lat: -12.045200, Lng: -76.903500', 7),
    ('LIMA', 'LIMA', 'ATE', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', 'Distrito de Ate, Lima', '-12.043000', '-76.938700', 'Lat: -12.043000, Lng: -76.938700', 12),
    ('LIMA', 'LIMA', 'ATE', 'IE 0026 AICHI NAGOYA', 'Distrito de Ate, Lima', '-12.040800', '-76.923300', 'Lat: -12.040800, Lng: -76.923300', 12),
    ('LIMA', 'LIMA', 'ATE', 'IE 0032 RAUL PORRAS BARRENECHEA', 'Distrito de Ate, Lima', '-12.038600', '-76.907900', 'Lat: -12.038600, Lng: -76.907900', 8),
    ('LIMA', 'LIMA', 'ATE', 'IE 0034', 'Distrito de Ate, Lima', '-12.036400', '-76.943100', 'Lat: -12.036400, Lng: -76.943100', 17),
    ('LIMA', 'LIMA', 'ATE', 'IE 0067 SANTA ELENA', 'Distrito de Ate, Lima', '-12.034200', '-76.927700', 'Lat: -12.034200, Lng: -76.927700', 5),
    ('LIMA', 'LIMA', 'ATE', 'IE 0074 FERNANDO BELAUNDE TERRY', 'Distrito de Ate, Lima', '-12.032000', '-76.912300', 'Lat: -12.032000, Lng: -76.912300', 18),
    ('LIMA', 'LIMA', 'ATE', 'IE 1135 SANTA CLARA', 'Distrito de Ate, Lima', '-12.029800', '-76.896900', 'Lat: -12.029800, Lng: -76.896900', 9),
    ('LIMA', 'LIMA', 'ATE', 'IE 1136 JOHN F. KENNEDY', 'Distrito de Ate, Lima', '-12.027600', '-76.932100', 'Lat: -12.027600, Lng: -76.932100', 8),
    ('LIMA', 'LIMA', 'ATE', 'IE 1138 JOSE ABELARDO QUIÑONES', 'Distrito de Ate, Lima', '-12.025400', '-76.916700', 'Lat: -12.025400, Lng: -76.916700', 16),
    ('LIMA', 'LIMA', 'ATE', 'IE 1142 SEÑOR DE LOS MILAGROS', 'Distrito de Ate, Lima', '-12.023200', '-76.901300', 'Lat: -12.023200, Lng: -76.901300', 7),
    ('LIMA', 'LIMA', 'ATE', 'IE 1143 DOMINGO FAUSTINO SARMIENTO', 'Distrito de Ate, Lima', '-12.021000', '-76.936500', 'Lat: -12.021000, Lng: -76.936500', 18),
    ('LIMA', 'LIMA', 'ATE', 'IE 1203 DIVINO NIÑO JESUS DE MANYLSA', 'Distrito de Ate, Lima', '-12.018800', '-76.921100', 'Lat: -12.018800, Lng: -76.921100', 7),
    ('LIMA', 'LIMA', 'ATE', 'IE 1209 GRAN MARISCAL TORIBIO DE LUZURIAGA', 'Distrito de Ate, Lima', '-12.016600', '-76.905700', 'Lat: -12.016600, Lng: -76.905700', 14),
    ('LIMA', 'LIMA', 'ATE', 'IE 1212 GRUMETE MEDINA', 'Distrito de Ate, Lima', '-12.014400', '-76.940900', 'Lat: -12.014400, Lng: -76.940900', 12),
    ('LIMA', 'LIMA', 'ATE', 'IE 1213 LA GLORIA', 'Distrito de Ate, Lima', '-12.012200', '-76.925500', 'Lat: -12.012200, Lng: -76.925500', 20),
    ('LIMA', 'LIMA', 'ATE', 'IE 1222 HUSARES DE JUNIN', 'Distrito de Ate, Lima', '-12.010000', '-76.910100', 'Lat: -12.010000, Lng: -76.910100', 15),
    ('LIMA', 'LIMA', 'ATE', 'IE 1226 SOL DE VITARTE', 'Distrito de Ate, Lima', '-12.007800', '-76.894700', 'Lat: -12.007800, Lng: -76.894700', 16),
    ('LIMA', 'LIMA', 'ATE', 'IE 1227 INDIRA GANDHI', 'Distrito de Ate, Lima', '-12.005600', '-76.929900', 'Lat: -12.005600, Lng: -76.929900', 17),
    ('LIMA', 'LIMA', 'ATE', 'IE 1228 LEONCIO PRADO GUTIERREZ', 'Distrito de Ate, Lima', '-12.045200', '-76.914500', 'Lat: -12.045200, Lng: -76.914500', 11),
    ('LIMA', 'LIMA', 'ATE', 'IE 1229 JULIO ALBERTO PONCE ANTUNEZ DE MAYOLO', 'Distrito de Ate, Lima', '-12.043000', '-76.899100', 'Lat: -12.043000, Lng: -76.899100', 12),
    ('LIMA', 'LIMA', 'ATE', 'IE 1231 JOSE LUIS BUSTAMANTE Y RIVERO', 'Distrito de Ate, Lima', '-12.040800', '-76.934300', 'Lat: -12.040800, Lng: -76.934300', 8),
    ('LIMA', 'LIMA', 'ATE', 'IE 1236 ALFONSO BARRANTES LINGAN', 'Distrito de Ate, Lima', '-12.038600', '-76.918900', 'Lat: -12.038600, Lng: -76.918900', 21),
    ('LIMA', 'LIMA', 'ATE', 'IE 1237 JORGE DIOMEDES GILES LLANOS', 'Distrito de Ate, Lima', '-12.036400', '-76.903500', 'Lat: -12.036400, Lng: -76.903500', 14),
    ('LIMA', 'LIMA', 'ATE', 'IE 1239 FORTALEZA', 'Distrito de Ate, Lima', '-12.034200', '-76.938700', 'Lat: -12.034200, Lng: -76.938700', 5),
    ('LIMA', 'LIMA', 'ATE', 'IE 1244 MICAELA BASTIDAS', 'Distrito de Ate, Lima', '-12.032000', '-76.923300', 'Lat: -12.032000, Lng: -76.923300', 13),
    ('LIMA', 'LIMA', 'ATE', 'IE 1245 JOSE CARLOS MARIATEGUI', 'Distrito de Ate, Lima', '-12.029800', '-76.907900', 'Lat: -12.029800, Lng: -76.907900', 20),
    ('LIMA', 'LIMA', 'ATE', 'IE 1248 5 DE ABRIL', 'Distrito de Ate, Lima', '-12.027600', '-76.943100', 'Lat: -12.027600, Lng: -76.943100', 33),
    ('LIMA', 'LIMA', 'ATE', 'IE 1290 NUEVA AMERICA', 'Distrito de Ate, Lima', '-12.025400', '-76.927700', 'Lat: -12.025400, Lng: -76.927700', 17),
    ('LIMA', 'LIMA', 'ATE', 'IE 1249 JAVIER HERAUD', 'Distrito de Ate, Lima', '-12.023200', '-76.912300', 'Lat: -12.023200, Lng: -76.912300', 4),
    ('LIMA', 'LIMA', 'ATE', 'IE 1251 PERUANO SUIZO', 'Distrito de Ate, Lima', '-12.021000', '-76.896900', 'Lat: -12.021000, Lng: -76.896900', 14),
    ('LIMA', 'LIMA', 'ATE', 'IE 1255 WALTER PEÑALOZA RAMELLA', 'Distrito de Ate, Lima', '-12.018800', '-76.932100', 'Lat: -12.018800, Lng: -76.932100', 31),
    ('LIMA', 'LIMA', 'ATE', 'IE 1257 REINO UNIDO DE GRAN BRETAÑA', 'Distrito de Ate, Lima', '-12.016600', '-76.916700', 'Lat: -12.016600, Lng: -76.916700', 10),
    ('LIMA', 'LIMA', 'ATE', 'IE 1258 SEBASTIAN LORENTE IBAÑEZ', 'Distrito de Ate, Lima', '-12.014400', '-76.901300', 'Lat: -12.014400, Lng: -76.901300', 6),
    ('LIMA', 'LIMA', 'ATE', 'IE 1260 EL AMAUTA', 'Distrito de Ate, Lima', '-12.012200', '-76.936500', 'Lat: -12.012200, Lng: -76.936500', 27),
    ('LIMA', 'LIMA', 'ATE', 'IE 1262 EL AMAUTA JOSE CARLOS MARIATEGUI', 'Distrito de Ate, Lima', '-12.010000', '-76.921100', 'Lat: -12.010000, Lng: -76.921100', 17),
    ('LIMA', 'LIMA', 'ATE', 'IE 1268 GUSTAVO MOHME LLONA', 'Distrito de Ate, Lima', '-12.007800', '-76.905700', 'Lat: -12.007800, Lng: -76.905700', 14),
    ('LIMA', 'LIMA', 'ATE', 'IE 1279', 'Distrito de Ate, Lima', '-12.005600', '-76.940900', 'Lat: -12.005600, Lng: -76.940900', 16),
    ('LIMA', 'LIMA', 'ATE', 'IE 6039 FERNANDO CARBAJAL SEGURA', 'Distrito de Ate, Lima', '-12.045200', '-76.925500', 'Lat: -12.045200, Lng: -76.925500', 29),
    ('LIMA', 'LIMA', 'ATE', 'IE AKIRA KATO', 'Distrito de Ate, Lima', '-12.043000', '-76.910100', 'Lat: -12.043000, Lng: -76.910100', 6),
    ('LIMA', 'LIMA', 'ATE', 'IE 0029 CORONEL PNP MARCO PUENTE LLANOS', 'Distrito de Ate, Lima', '-12.040800', '-76.894700', 'Lat: -12.040800, Lng: -76.894700', 11),
    ('LIMA', 'LIMA', 'ATE', 'IE COLEGIO NACIONAL DE VITARTE', 'Distrito de Ate, Lima', '-12.038600', '-76.929900', 'Lat: -12.038600, Lng: -76.929900', 19),
    ('LIMA', 'LIMA', 'ATE', 'IE FE Y ALEGRIA 53', 'Distrito de Ate, Lima', '-12.036400', '-76.914500', 'Lat: -12.036400, Lng: -76.914500', 16),
    ('LIMA', 'LIMA', 'ATE', 'IE JULIO C TELLO', 'Distrito de Ate, Lima', '-12.034200', '-76.899100', 'Lat: -12.034200, Lng: -76.899100', 18),
    ('LIMA', 'LIMA', 'ATE', 'IE 1264 JUAN ANDRES VIVANCO AMORIN', 'Distrito de Ate, Lima', '-12.032000', '-76.934300', 'Lat: -12.032000, Lng: -76.934300', 27),
    ('LIMA', 'LIMA', 'ATE', 'IE MIXTO HUAYCAN', 'Distrito de Ate, Lima', '-12.029800', '-76.918900', 'Lat: -12.029800, Lng: -76.918900', 27),
    ('LIMA', 'LIMA', 'ATE', 'IE NUESTRA SEÑORA DE LA ESPERANZA', 'Distrito de Ate, Lima', '-12.027600', '-76.903500', 'Lat: -12.027600, Lng: -76.903500', 10),
    ('LIMA', 'LIMA', 'ATE', 'IE RICARDO PALMA', 'Distrito de Ate, Lima', '-12.025400', '-76.938700', 'Lat: -12.025400, Lng: -76.938700', 9),
    ('LIMA', 'LIMA', 'ATE', 'IE 046 VICTOR RAUL HAYA DE LA TORRE INEI', 'Distrito de Ate, Lima', '-12.023200', '-76.923300', 'Lat: -12.023200, Lng: -76.923300', 18),
    ('LIMA', 'LIMA', 'ATE', 'IE EDELMIRA DEL PANDO', 'Distrito de Ate, Lima', '-12.021000', '-76.907900', 'Lat: -12.021000, Lng: -76.907900', 20),
    ('LIMA', 'LIMA', 'ATE', 'IE 0025 SAN MARTIN DE PORRES', 'Distrito de Ate, Lima', '-12.018800', '-76.943100', 'Lat: -12.018800, Lng: -76.943100', 28),
    ('LIMA', 'LIMA', 'ATE', 'IEP INCA GARCILASO DE LA VEGA', 'Distrito de Ate, Lima', '-12.016600', '-76.927700', 'Lat: -12.016600, Lng: -76.927700', 33),
    ('LIMA', 'LIMA', 'ATE', 'IEP SAN IGNACIO SCHOOL', 'Distrito de Ate, Lima', '-12.014400', '-76.912300', 'Lat: -12.014400, Lng: -76.912300', 11),
    ('LIMA', 'LIMA', 'ATE', 'IEP CRISTO REINA I', 'Distrito de Ate, Lima', '-12.012200', '-76.896900', 'Lat: -12.012200, Lng: -76.896900', 9),
    ('LIMA', 'LIMA', 'ATE', 'IEP JOSE MARIA ARGUEDAS ALTAMIRANO', 'Distrito de Ate, Lima', '-12.010000', '-76.932100', 'Lat: -12.010000, Lng: -76.932100', 7),
    ('LIMA', 'LIMA', 'ATE', 'IEP SANTISIMO SALVADOR', 'Distrito de Ate, Lima', '-12.007800', '-76.916700', 'Lat: -12.007800, Lng: -76.916700', 5),
    ('LIMA', 'LIMA', 'ATE', 'IEP CIENCIAS APLICADAS ALBERT EINSTEIN', 'Distrito de Ate, Lima', '-12.005600', '-76.901300', 'Lat: -12.005600, Lng: -76.901300', 11),
    ('LIMA', 'LIMA', 'ATE', 'IEP COLEGIO MAYOR SISTEMA SAN MARCOS', 'Distrito de Ate, Lima', '-12.045200', '-76.936500', 'Lat: -12.045200, Lng: -76.936500', 28),
    ('LIMA', 'LIMA', 'ATE', 'IE 167 LAS PIEDRITAS', 'Distrito de Ate, Lima', '-12.043000', '-76.921100', 'Lat: -12.043000, Lng: -76.921100', 10),
    ('LIMA', 'LIMA', 'ATE', 'IE 1263 PURUCHUCO', 'Distrito de Ate, Lima', '-12.040800', '-76.905700', 'Lat: -12.040800, Lng: -76.905700', 18),
    ('LIMA', 'LIMA', 'ATE', 'CEBE 13 JESÚS AMIGO', 'Distrito de Ate, Lima', '-12.038600', '-76.940900', 'Lat: -12.038600, Lng: -76.940900', 7),
    ('LIMA', 'LIMA', 'ATE', 'IEP ALFONSO UGARTE HUAYCAN', 'Distrito de Ate, Lima', '-12.036400', '-76.925500', 'Lat: -12.036400, Lng: -76.925500', 6),
    ('LIMA', 'LIMA', 'ATE', 'IEP JOHN DALTON', 'Distrito de Ate, Lima', '-12.034200', '-76.910100', 'Lat: -12.034200, Lng: -76.910100', 6),
    ('LIMA', 'LIMA', 'ATE', 'IEP PEDRO RUIZ GALLO', 'Distrito de Ate, Lima', '-12.032000', '-76.894700', 'Lat: -12.032000, Lng: -76.894700', 5),
    ('LIMA', 'LIMA', 'ATE', 'IEP ROSA DE LA MERCED', 'Distrito de Ate, Lima', '-12.029800', '-76.929900', 'Lat: -12.029800, Lng: -76.929900', 22),
    ('LIMA', 'LIMA', 'ATE', 'IEP SAN JUAN', 'Distrito de Ate, Lima', '-12.027600', '-76.914500', 'Lat: -12.027600, Lng: -76.914500', 11),
    ('LIMA', 'LIMA', 'ATE', 'IEP KAROL WOJTYLA - SECUNDARIA', 'Distrito de Ate, Lima', '-12.025400', '-76.899100', 'Lat: -12.025400, Lng: -76.899100', 5),
    ('LIMA', 'LIMA', 'ATE', 'IEP MAESTRO DIVINO', 'Distrito de Ate, Lima', '-12.023200', '-76.934300', 'Lat: -12.023200, Lng: -76.934300', 9),
    ('LIMA', 'LIMA', 'ATE', 'IEP SAN BASILIO', 'Distrito de Ate, Lima', '-12.021000', '-76.918900', 'Lat: -12.021000, Lng: -76.918900', 10),
    ('LIMA', 'LIMA', 'ATE', 'IEP VANGUARDIA ESTUDIANTIL', 'Distrito de Ate, Lima', '-12.018800', '-76.903500', 'Lat: -12.018800, Lng: -76.903500', 8),
    ('LIMA', 'LIMA', 'ATE', 'IEP SAN LUIS REY DE FRANCIA', 'Distrito de Ate, Lima', '-12.016600', '-76.938700', 'Lat: -12.016600, Lng: -76.938700', 7),
    ('LIMA', 'LIMA', 'ATE', 'IEP UNION LATINO', 'Distrito de Ate, Lima', '-12.014400', '-76.923300', 'Lat: -12.014400, Lng: -76.923300', 9),
    ('LIMA', 'LIMA', 'ATE', 'IEP SACRO COURE', 'Distrito de Ate, Lima', '-12.012200', '-76.907900', 'Lat: -12.012200, Lng: -76.907900', 10),
    ('LIMA', 'LIMA', 'ATE', 'IEP TARPUY MODERNO', 'Distrito de Ate, Lima', '-12.010000', '-76.943100', 'Lat: -12.010000, Lng: -76.943100', 7),
    ('LIMA', 'LIMA', 'ATE', 'IEP CIENTIFICO ISAAC NEWTON', 'Distrito de Ate, Lima', '-12.007800', '-76.927700', 'Lat: -12.007800, Lng: -76.927700', 8),
    ('LIMA', 'LIMA', 'ATE', 'IEP TÉCNICO PERUANO CHINO SAN FRANCISCO DE ASIS', 'Distrito de Ate, Lima', '-12.005600', '-76.912300', 'Lat: -12.005600, Lng: -76.912300', 16),
    ('LIMA', 'LIMA', 'ATE', 'IEP LUCERITO DE AMOR', 'Distrito de Ate, Lima', '-12.045200', '-76.896900', 'Lat: -12.045200, Lng: -76.896900', 7),
    ('LIMA', 'LIMA', 'ATE', 'IEP SAN ANTONIO DE UMARO', 'Distrito de Ate, Lima', '-12.043000', '-76.932100', 'Lat: -12.043000, Lng: -76.932100', 6),
    ('LIMA', 'LIMA', 'ATE', 'IEP SALESIAN INNOVA SCHOOL', 'Distrito de Ate, Lima', '-12.040800', '-76.916700', 'Lat: -12.040800, Lng: -76.916700', 9),
    ('LIMA', 'LIMA', 'ATE', 'IEP CORAZON DE JESUS DE SANTA CLARA', 'Distrito de Ate, Lima', '-12.038600', '-76.901300', 'Lat: -12.038600, Lng: -76.901300', 8),
    ('LIMA', 'LIMA', 'ATE', 'IEP INTERNACIONAL ELIM', 'Distrito de Ate, Lima', '-12.036400', '-76.936500', 'Lat: -12.036400, Lng: -76.936500', 5),
    ('LIMA', 'LIMA', 'ATE', 'IEP ANNA JARVIS', 'Distrito de Ate, Lima', '-12.034200', '-76.921100', 'Lat: -12.034200, Lng: -76.921100', 5),
    ('LIMA', 'LIMA', 'ATE', 'IEP JOSÉ INGENIEROS', 'Distrito de Ate, Lima', '-12.032000', '-76.905700', 'Lat: -12.032000, Lng: -76.905700', 9),
    ('LIMA', 'LIMA', 'ATE', 'IEP SALESIAN COLLEGE', 'Distrito de Ate, Lima', '-12.029800', '-76.940900', 'Lat: -12.029800, Lng: -76.940900', 12),
    ('LIMA', 'LIMA', 'ATE', 'IEP SANTA CATALINA', 'Distrito de Ate, Lima', '-12.027600', '-76.925500', 'Lat: -12.027600, Lng: -76.925500', 9),
    ('LIMA', 'LIMA', 'ATE', 'IEP NUESTRA SEÑORA DE GUADALUPE', 'Distrito de Ate, Lima', '-12.025400', '-76.910100', 'Lat: -12.025400, Lng: -76.910100', 5),
    ('LIMA', 'LIMA', 'ATE', 'IEP HOWARD SCHOOL', 'Distrito de Ate, Lima', '-12.023200', '-76.894700', 'Lat: -12.023200, Lng: -76.894700', 7),
    ('LIMA', 'LIMA', 'ATE', 'IEP SANTISIMA VIRGEN DE GUADALUPE DE LAS AMERICAS', 'Distrito de Ate, Lima', '-12.021000', '-76.929900', 'Lat: -12.021000, Lng: -76.929900', 8),
    ('LIMA', 'LIMA', 'ATE', 'IEP INTERNACIONAL DEL PACIFICO', 'Distrito de Ate, Lima', '-12.018800', '-76.914500', 'Lat: -12.018800, Lng: -76.914500', 8),
    ('LIMA', 'LIMA', 'ATE', 'IEP PACIFICO', 'Distrito de Ate, Lima', '-12.016600', '-76.899100', 'Lat: -12.016600, Lng: -76.899100', 11),
    ('LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS DE HUAYCAN', 'Distrito de Ate, Lima', '-12.014400', '-76.934300', 'Lat: -12.014400, Lng: -76.934300', 13),
    ('LIMA', 'LIMA', 'ATE', 'IEP LAS AMERICAS DE ATE', 'Distrito de Ate, Lima', '-12.012200', '-76.918900', 'Lat: -12.012200, Lng: -76.918900', 17),
    ('LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS DE ATE', 'Distrito de Ate, Lima', '-12.010000', '-76.903500', 'Lat: -12.010000, Lng: -76.903500', 36),
    ('LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS APEIRON ATE INGENIEROS', 'Distrito de Ate, Lima', '-12.007800', '-76.938700', 'Lat: -12.007800, Lng: -76.938700', 17),
    ('LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS DE SALAMANCA', 'Distrito de Ate, Lima', '-12.005600', '-76.923300', 'Lat: -12.005600, Lng: -76.923300', 17),
    ('LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOL - ATE PURUCHUCO', 'Distrito de Ate, Lima', '-12.045200', '-76.907900', 'Lat: -12.045200, Lng: -76.907900', 27),
    ('LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE MAYORAZGO', 'Distrito de Ate, Lima', '-12.043000', '-76.943100', 'Lat: -12.043000, Lng: -76.943100', 29),
    ('LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE SANTA CLARA', 'Distrito de Ate, Lima', '-12.040800', '-76.927700', 'Lat: -12.040800, Lng: -76.927700', 36),
    ('LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE SANTA MARIA', 'Distrito de Ate, Lima', '-12.038600', '-76.912300', 'Lat: -12.038600, Lng: -76.912300', 21),
    ('LIMA', 'LIMA', 'ATE', 'IE 1228 LEONCIO PRADO GUTIERREZ- SECUNDARIA', 'Distrito de Ate, Lima', '-12.036400', '-76.896900', 'Lat: -12.036400, Lng: -76.896900', 10),
    ('LIMA', 'LIMA', 'ATE', 'IE MANUEL GONZALES PRADA', 'Distrito de Ate, Lima', '-12.034200', '-76.932100', 'Lat: -12.034200, Lng: -76.932100', 23),
    ('LIMA', 'LIMA', 'ATE', 'IEP SANTIAGO APOSTOL', 'Distrito de Ate, Lima', '-12.032000', '-76.916700', 'Lat: -12.032000, Lng: -76.916700', 22),
    ('LIMA', 'LIMA', 'ATE', 'IE 1215 SAN JUAN DE PARIACHI', 'Distrito de Ate, Lima', '-12.029800', '-76.901300', 'Lat: -12.029800, Lng: -76.901300', 9),
    ('LIMA', 'LIMA', 'ATE', 'IE 1270 JUAN EL BAUTISTA', 'Distrito de Ate, Lima', '-12.027600', '-76.936500', 'Lat: -12.027600, Lng: -76.936500', 10),
    ('LIMA', 'LIMA', 'ATE', 'IE 1281 SANTA MARIA', 'Distrito de Ate, Lima', '-12.025400', '-76.921100', 'Lat: -12.025400, Lng: -76.921100', 5);

    -- 2. Generador recursivo de mesas mediante CTE
    ;WITH Digitos AS (
        SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
        UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
        UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
        UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
        UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
        UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
        UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35
        UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40
        UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45
        UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50
    ),
    MesasGeneradas AS (
        SELECT 
            L.departamento,
            L.provincia,
            L.distrito,
            L.colegio,
            L.direccion,
            L.latitud,
            L.longitud,
            L.coordenadas_gps,
            -- Generación de número de mesa único de 6 dígitos: (id_local * 100 + n)
            RIGHT('000000' + CAST((L.id_local * 100 + D.n) AS VARCHAR(10)), 6) AS numero_mesa,
            'DISPONIBLE' AS estado
        FROM #LocalesAte L
        CROSS JOIN Digitos D
        WHERE D.n <= L.cantidad_mesas
    )
    -- Inserción idempotente que evita duplicados
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, provincia, departamento, latitud, longitud, coordenadas_gps, estado, direccion)
    SELECT 
        MG.numero_mesa,
        MG.distrito,
        MG.colegio,
        MG.provincia,
        MG.departamento,
        MG.latitud,
        MG.longitud,
        MG.coordenadas_gps,
        MG.estado,
        MG.direccion
    FROM MesasGeneradas MG
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.Mesas M 
        WHERE M.numero_mesa = MG.numero_mesa 
           OR (M.colegio = MG.colegio AND M.numero_mesa = MG.numero_mesa)
    );

    COMMIT TRANSACTION;
    PRINT '✅ Migración 007 ejecutada con éxito. Mesas de ATE insertadas correctamente.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH;
GO
