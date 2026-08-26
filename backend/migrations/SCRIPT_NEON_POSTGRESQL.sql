-- =====================================================================
-- SCRIPT COMPLETO PARA NEON POSTGRESQL (VotoReal Lima)
-- Compatible 100% con Neon SQL Editor / psql
-- =====================================================================

-- =====================================================================
-- 1. CREACIÓN DE TABLAS PRINCIPALES
-- =====================================================================

-- 1.1 Tabla Asistencia
CREATE TABLE IF NOT EXISTS asistencia (
    id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre VARCHAR(150),
    dni VARCHAR(50),
    distrito VARCHAR(100),
    local VARCHAR(200),
    mesa VARCHAR(20),
    confirmacion VARCHAR(20) DEFAULT 'SI',
    foto_url TEXT,
    ubicacion_gps VARCHAR(100)
);

-- 1.2 Tabla AsistenciaLlegada (2da Llegada GPS)
CREATE TABLE IF NOT EXISTS asistenciallegada (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    dni VARCHAR(50),
    distrito VARCHAR(100),
    colegio VARCHAR(255),
    mesa VARCHAR(50),
    latitud VARCHAR(50),
    longitud VARCHAR(50),
    distancia_metros DOUBLE PRECISION,
    radio_permitido INT DEFAULT 50,
    estado VARCHAR(50) DEFAULT 'CONFIRMADO 2DA LLEGADA',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Tabla AuditLogs
CREATE TABLE IF NOT EXISTS auditlogs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100),
    useridentifier VARCHAR(100),
    role VARCHAR(50),
    details TEXT,
    ipaddress VARCHAR(50),
    useragent TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.4 Tabla Colegios
CREATE TABLE IF NOT EXISTS colegios (
    id SERIAL PRIMARY KEY,
    ubigeo VARCHAR(20),
    departamento VARCHAR(100) DEFAULT 'Lima',
    provincia VARCHAR(100) DEFAULT 'Lima',
    distrito VARCHAR(100) NOT NULL,
    colegio VARCHAR(200) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    num_mesas INT DEFAULT 0,
    latitud VARCHAR(50),
    longitud VARCHAR(50),
    coordenadas_gps VARCHAR(100),
    radio_metros INT DEFAULT 50,
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.5 Tabla Coordinadores
CREATE TABLE IF NOT EXISTS coordinadores (
    id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    personero_nombre VARCHAR(150),
    personero_dni VARCHAR(50),
    distrito VARCHAR(100),
    local VARCHAR(200),
    coordinador_nombre VARCHAR(150),
    coordinador_dni VARCHAR(50),
    confirmacion VARCHAR(20) DEFAULT 'SI',
    foto_url TEXT
);

-- 1.6 Tabla Distritos
CREATE TABLE IF NOT EXISTS distritos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    meta INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
);

-- 1.7 Tabla LocalesVotacion
CREATE TABLE IF NOT EXISTS localesvotacion (
    id SERIAL PRIMARY KEY,
    distrito VARCHAR(100) NOT NULL,
    nombrelocal VARCHAR(200) NOT NULL,
    direccion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE
);

-- 1.8 Tabla PersoneroMesa (Relación 1:1)
CREATE TABLE IF NOT EXISTS personeromesa (
    id SERIAL PRIMARY KEY,
    personero_id INT,
    personero_dni VARCHAR(50) NOT NULL,
    mesa_id INT,
    numero_mesa VARCHAR(50) NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'ASIGNADO',
    CONSTRAINT uq_personeromesa_personerodni UNIQUE (personero_dni),
    CONSTRAINT uq_personeromesa_numeromesa UNIQUE (numero_mesa)
);

-- 1.9 Tabla Rcoordinadores
CREATE TABLE IF NOT EXISTS rcoordinadores (
    id SERIAL PRIMARY KEY,
    fecha_de_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombres_y_apellidos VARCHAR(150),
    dni VARCHAR(50) NOT NULL,
    celular VARCHAR(50),
    correo_electronico VARCHAR(150),
    usa_whatsapp_en_su_celular VARCHAR(20),
    numero_whatsapp_alterno VARCHAR(50),
    distrito_donde_vota VARCHAR(100),
    mesa_de_sufragio VARCHAR(50),
    local_de_votacion VARCHAR(200),
    rol_a_desempenar VARCHAR(50),
    distrito_asignado VARCHAR(100),
    mesa_asignada VARCHAR(50),
    local_de_votacion_asignado VARCHAR(200),
    tiene_experiencia_como_personero VARCHAR(20),
    cuenta_con_movilidad_propia VARCHAR(20),
    se_compromete_a_colaborar_el_4_de_octubre_del_2026_en_las_elecciones VARCHAR(100),
    video VARCHAR(50),
    pdf VARCHAR(50),
    preguntas VARCHAR(50),
    credenciales VARCHAR(50),
    token_verificacion VARCHAR(100)
);

-- 1.10 Tabla Rpersoneros
CREATE TABLE IF NOT EXISTS rpersoneros (
    id SERIAL PRIMARY KEY,
    fecha_de_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombres_y_apellidos VARCHAR(150),
    dni VARCHAR(50) NOT NULL,
    celular VARCHAR(50),
    correo_electronico VARCHAR(150),
    usa_whatsapp_en_su_celular VARCHAR(20),
    numero_whatsapp_alterno VARCHAR(50),
    distrito_donde_vota VARCHAR(100),
    mesa_de_sufragio VARCHAR(50),
    local_de_votacion VARCHAR(200),
    rol_a_desempenar VARCHAR(50),
    distrito_asignado VARCHAR(100),
    mesa_asignada VARCHAR(50),
    local_de_votacion_asignado VARCHAR(200),
    tiene_experiencia_como_personero VARCHAR(20),
    cuenta_con_movilidad_propia VARCHAR(20),
    se_compromete_a_colaborar_el_4_de_octubre_del_2026_en_las_elecciones VARCHAR(100),
    video VARCHAR(50),
    pdf VARCHAR(50),
    preguntas VARCHAR(50),
    credenciales VARCHAR(50),
    token_verificacion VARCHAR(100)
);

-- 1.11 Tabla Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(50) DEFAULT 'Personero',
    ubicacion VARCHAR(100),
    colegio VARCHAR(200),
    mesa VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.12 Tabla Usuarios1 (Coordinadores)
CREATE TABLE IF NOT EXISTS usuarios1 (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(50) DEFAULT 'Coordinador',
    ubicacion VARCHAR(100),
    colegio VARCHAR(200),
    mesa VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.13 Tabla Votos_Detalle
CREATE TABLE IF NOT EXISTS votos_detalle (
    id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    personero VARCHAR(150) NOT NULL,
    dni VARCHAR(50) NOT NULL,
    departamento VARCHAR(100) DEFAULT 'Lima',
    provincia VARCHAR(100) DEFAULT 'Lima',
    ubicacion VARCHAR(100),
    colegio VARCHAR(200),
    numero_mesa VARCHAR(20) NOT NULL,
    origen VARCHAR(20) NOT NULL,
    
    p_sp_candidato VARCHAR(150), p_sp_votos INT DEFAULT 0,
    p_rp_candidato VARCHAR(150), p_rp_votos INT DEFAULT 0,
    p_an_candidato VARCHAR(150), p_an_votos INT DEFAULT 0,
    p_avanza_candidato VARCHAR(150), p_avanza_votos INT DEFAULT 0,
    p_podemos_candidato VARCHAR(150), p_podemos_votos INT DEFAULT 0,
    p_jp_candidato VARCHAR(150), p_jp_votos INT DEFAULT 0,
    p_obras_candidato VARCHAR(150), p_obras_votos INT DEFAULT 0,
    p_frepap_candidato VARCHAR(150), p_frepap_votos INT DEFAULT 0,
    p_ap_candidato VARCHAR(150), p_ap_votos INT DEFAULT 0,
    p_esperanza_candidato VARCHAR(150), p_esperanza_votos INT DEFAULT 0,
    p_venceremos_candidato VARCHAR(150), p_venceremos_votos INT DEFAULT 0,
    p_vision_candidato VARCHAR(150), p_vision_votos INT DEFAULT 0,
    p_apra_candidato VARCHAR(150), p_apra_votos INT DEFAULT 0,
    p_fp_candidato VARCHAR(150), p_fp_votos INT DEFAULT 0,
    p_ppc_candidato VARCHAR(150), p_ppc_votos INT DEFAULT 0,
    p_progresemos_candidato VARCHAR(150), p_progresemos_votos INT DEFAULT 0,
    p_morado_candidato VARCHAR(150), p_morado_votos INT DEFAULT 0,
    p_buen_gobierno_candidato VARCHAR(150), p_buen_gobierno_votos INT DEFAULT 0,
    p_verde_candidato VARCHAR(150), p_verde_votos INT DEFAULT 0,
    p_peru_libre_candidato VARCHAR(150), p_peru_libre_votos INT DEFAULT 0,
    p_tierra_verde_candidato VARCHAR(150), p_tierra_verde_votos INT DEFAULT 0,
    p_pueblo_consciente_candidato VARCHAR(150), p_pueblo_consciente_votos INT DEFAULT 0,
    p_ppp_candidato VARCHAR(150), p_ppp_votos INT DEFAULT 0,
    p_integridad_candidato VARCHAR(150), p_integridad_votos INT DEFAULT 0,
    p_fuerza_ciudadana_candidato VARCHAR(150), p_fuerza_ciudadana_votos INT DEFAULT 0,
    p_batalla_candidato VARCHAR(150), p_batalla_votos INT DEFAULT 0,
    p_app_candidato VARCHAR(150), p_app_votos INT DEFAULT 0,
    p_alianza_regional_candidato VARCHAR(150), p_alianza_regional_votos INT DEFAULT 0,
    p_nulos INT DEFAULT 0,
    p_vacios INT DEFAULT 0,
    p_blanco INT DEFAULT 0,
    p_impugnados INT DEFAULT 0,
    p_total_votos INT DEFAULT 0,
    
    d_sp_candidato VARCHAR(150), d_sp_votos INT DEFAULT 0,
    d_rp_candidato VARCHAR(150), d_rp_votos INT DEFAULT 0,
    d_an_candidato VARCHAR(150), d_an_votos INT DEFAULT 0,
    d_avanza_candidato VARCHAR(150), d_avanza_votos INT DEFAULT 0,
    d_podemos_candidato VARCHAR(150), d_podemos_votos INT DEFAULT 0,
    d_jp_candidato VARCHAR(150), d_jp_votos INT DEFAULT 0,
    d_obras_candidato VARCHAR(150), d_obras_votos INT DEFAULT 0,
    d_frepap_candidato VARCHAR(150), d_frepap_votos INT DEFAULT 0,
    d_ap_candidato VARCHAR(150), d_ap_votos INT DEFAULT 0,
    d_esperanza_candidato VARCHAR(150), d_esperanza_votos INT DEFAULT 0,
    d_venceremos_candidato VARCHAR(150), d_venceremos_votos INT DEFAULT 0,
    d_vision_candidato VARCHAR(150), d_vision_votos INT DEFAULT 0,
    d_apra_candidato VARCHAR(150), d_apra_votos INT DEFAULT 0,
    d_fp_candidato VARCHAR(150), d_fp_votos INT DEFAULT 0,
    d_ppc_candidato VARCHAR(150), d_ppc_votos INT DEFAULT 0,
    d_progresemos_candidato VARCHAR(150), d_progresemos_votos INT DEFAULT 0,
    d_morado_candidato VARCHAR(150), d_morado_votos INT DEFAULT 0,
    d_buen_gobierno_candidato VARCHAR(150), d_buen_gobierno_votos INT DEFAULT 0,
    d_verde_candidato VARCHAR(150), d_verde_votos INT DEFAULT 0,
    d_peru_libre_candidato VARCHAR(150), d_peru_libre_votos INT DEFAULT 0,
    d_tierra_verde_candidato VARCHAR(150), d_tierra_verde_votos INT DEFAULT 0,
    d_pueblo_consciente_candidato VARCHAR(150), d_pueblo_consciente_votos INT DEFAULT 0,
    d_ppp_candidato VARCHAR(150), d_ppp_votos INT DEFAULT 0,
    d_integridad_candidato VARCHAR(150), d_integridad_votos INT DEFAULT 0,
    d_fuerza_ciudadana_candidato VARCHAR(150), d_fuerza_ciudadana_votos INT DEFAULT 0,
    d_batalla_candidato VARCHAR(150), d_batalla_votos INT DEFAULT 0,
    d_app_candidato VARCHAR(150), d_app_votos INT DEFAULT 0,
    d_alianza_regional_candidato VARCHAR(150), d_alianza_regional_votos INT DEFAULT 0,
    d_nulos INT DEFAULT 0,
    d_vacios INT DEFAULT 0,
    d_blanco INT DEFAULT 0,
    d_impugnados INT DEFAULT 0,
    d_total_votos INT DEFAULT 0,
    votos_json JSONB,

    CONSTRAINT uq_mesa_origen UNIQUE (numero_mesa, origen)
);

-- 1.14 Tabla Mesas
CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    numero_mesa VARCHAR(20) NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    colegio VARCHAR(200) NOT NULL,
    provincia VARCHAR(100) DEFAULT 'Lima',
    departamento VARCHAR(100) DEFAULT 'Lima',
    direccion TEXT,
    latitud VARCHAR(50),
    longitud VARCHAR(50),
    coordenadas_gps VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'DISPONIBLE',
    CONSTRAINT uq_mesas_colegio_numero UNIQUE (colegio, numero_mesa)
);

-- =====================================================================
-- 2. ÍNDICES DE RENDIMIENTO
-- =====================================================================
CREATE INDEX IF NOT EXISTS ix_usuarios_dni ON usuarios(dni);
CREATE INDEX IF NOT EXISTS ix_usuarios1_dni ON usuarios1(dni);
CREATE INDEX IF NOT EXISTS ix_rpersoneros_dni ON rpersoneros(dni);
CREATE INDEX IF NOT EXISTS ix_rcoordinadores_dni ON rcoordinadores(dni);
CREATE INDEX IF NOT EXISTS ix_mesas_distrito ON mesas (distrito);
CREATE INDEX IF NOT EXISTS ix_mesas_colegio ON mesas (colegio);
CREATE INDEX IF NOT EXISTS ix_mesas_numero_mesa ON mesas (numero_mesa);
CREATE INDEX IF NOT EXISTS ix_mesas_colegio_numero ON mesas (colegio, numero_mesa);
CREATE INDEX IF NOT EXISTS ix_mesas_coordenadas ON mesas (latitud, longitud);

-- =====================================================================
-- 3. USUARIOS Y COORDINADORES OFICIALES
-- =====================================================================
INSERT INTO usuarios (dni, nombre, rol, ubicacion, colegio, mesa, estado)
VALUES
('Admin#2026$Secure!VotoReal', 'Super Administrador', 'Admin', '', '', '', 'Activo'),
('99999999', 'Super Administrador', 'Admin', 'Lima', 'CENTRAL', '', 'Activo'),
('71000001', 'Juan Carlos Quispe Palomino', 'Personero', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '037163', 'Activo'),
('71000002', 'María Elena Flores Dávila', 'Personero', 'Ate', 'IE 0026 AICHI NAGOYA', '037175', 'Activo'),
('71000003', 'Carlos Alberto Rodríguez Bustamante', 'Personero', 'Ate', 'IE 0032 RAUL PORRAS BARRENECHEA', '037187', 'Activo')
ON CONFLICT (dni) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  ubicacion = EXCLUDED.ubicacion,
  colegio = EXCLUDED.colegio,
  mesa = EXCLUDED.mesa,
  estado = EXCLUDED.estado;

INSERT INTO usuarios1 (dni, nombre, rol, ubicacion, colegio, mesa, estado)
VALUES
('20000001', 'Coord. Juan Quispe', 'Coordinador', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '', 'Activo'),
('20000002', 'Coord. María Flores', 'Coordinador', 'Ate', 'IE 0026 AICHI NAGOYA', '', 'Activo')
ON CONFLICT (dni) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  ubicacion = EXCLUDED.ubicacion,
  colegio = EXCLUDED.colegio,
  mesa = EXCLUDED.mesa,
  estado = EXCLUDED.estado;

-- =====================================================================
-- 4. INSERCIÓN DE PERSONEROS EN RPERSONEROS
-- =====================================================================
INSERT INTO rpersoneros (
    id, fecha_de_registro, nombres_y_apellidos, dni, celular, correo_electronico,
    usa_whatsapp_en_su_celular, numero_whatsapp_alterno, distrito_donde_vota,
    mesa_de_sufragio, local_de_votacion, rol_a_desempenar, distrito_asignado,
    mesa_asignada, local_de_votacion_asignado, tiene_experiencia_como_personero,
    cuenta_con_movilidad_propia, se_compromete_a_colaborar_el_4_de_octubre_del_2026_en_las_elecciones,
    video, pdf, preguntas, credenciales, token_verificacion
)
VALUES
(1, '2026-08-13 12:56:47.683', 'Juan Perez Prueba', '77889900', '912345678', 'juan.perez@gmail.com', 'Sí', NULL, 'Surco', '123456', 'Colegio San Jose', 'Personero de Mesa', 'Surco', '123456', 'Colegio San Jose', 'No', 'No', 'Sí', '0', '0', 'Pendiente', 'Bloqueado', NULL),
(2, '2026-08-13 12:59:04.867', 'gmailcom', '98765432', '987654321', '987654321@gmail.com', 'Sí', 'Mismo número', '987654321@gmail.com', '987654', '987654321@gmail.com', 'Personero de Mesa', '987654321@gmail.com', '987654321@gmail.com', '987654321@gmail.com', 'Sí', 'Sí', 'Sí', '2', '2', 'Aprobado', 'Confirmado', NULL),
(3, '2026-08-13 14:23:19.730', 'hotmailcom', '12345678', '123456789', '123456789@hotmail.com', 'Sí', 'Mismo número', '123456789@hotmail.com', '123456', '123456789@hotmail.com', 'Personero de Mesa', '123456789@hotmail.com', '123456789@hotmail.com', '123456789@hotmail.com', 'No', 'No', 'Sí', '2', '2', 'Pendiente', 'Bloqueado', NULL),
(4, '2026-08-13 18:08:11.827', 'Prueba Personero Directo', '11223344', '987654321', 'personero@test.com', 'Sí', NULL, 'Surco', '001122', 'Colegio Central', 'Personero de Mesa', 'Surco', '001122', 'Colegio Central', 'No', 'No', 'Sí', '2', '2', 'Pendiente', 'Bloqueado', NULL),
(5, '2026-08-13 18:11:47.200', 'daadada', '74909613', '987654321', 'ricardo27roma13@gmail.com', 'Sí', 'Mismo número', 'Ancón', '12546', 'IE 3098 CESAR VALLEJO', 'Personero de Mesa', 'Pucusana', '23232', 'IE MANUEL SCORZA', 'Sí', 'Sí', 'No', '2', '2', 'Aprobado', 'Confirmado', NULL),
(6, '2026-08-14 17:05:41.167', 'gmailcom', '15936925', '159369258', '159369258@gmail.com', 'Sí', 'Mismo número', '159369258@gmail.com', '159369', '159369258@gmail.com', 'Personero de Mesa', 'Santa Anita', '14258', 'IE 1225 MARIANO MELGAR', 'Sí', 'Sí', 'No', '2', '2', 'Aprobado', 'Confirmado', NULL),
(7, '2026-08-14 17:59:43.480', 'bcvnnbcom', '15932530', '159325300', '159325300@bcvnnb.com', 'Sí', 'Mismo número', '159325300@bcvnnb.com', '159325', '159325300@bcvnnb.com', 'Personero de Mesa', 'Cercado de Lima', '15700', 'PRUEBAT', 'No', 'No', 'Sí', '1', '1', 'Pendiente', 'Bloqueado', NULL),
(8, '2026-08-17 18:17:07.047', '845962522@outlook.com', '84596252', '845962522', '845962522@outlook.com', 'No, otro número', '845962522', 'San Juan de Lurigancho', '845962', 'IE 102', 'Personero de Mesa', 'Ate', '845962', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', 'Sí', 'Sí', 'Sí, me comprometo el 4 de Octubre del 2026', '2', '2', 'Aprobado', 'Confirmado', 'SP-LM2026-84596252'),
(9, '2026-08-18 16:14:16.120', 'rgthth', '95195165', '561561616', 'groh@gmail.com', 'Sí, mismo número', NULL, 'Ancón', '572457', 'CESAL', 'Personero de Mesa', 'Barranco', '141274', 'CENTRO DE IDIOMAS VIRGEN DE LAS MERCEDES - CIVIME', 'Sí', 'Sí', 'Sí, me comprometo el 4 de Octubre del 2026', '0', '0', 'Pendiente', 'Bloqueado', 'SP-LM2026-95195165'),
(10, '2026-08-18 19:50:41.890', 'Pedro', '10202030', '987654321', 'ricardo27roma13@gmail.com', 'Sí, mismo número', NULL, 'Barranco', '845962', 'CENTRO DE IDIOMAS VIRGEN DE LAS MERCEDES - CIVIME', 'Personero de Mesa', 'San Juan de Lurigancho', '147754', 'CEBE SOLIDARIDAD', 'Sí', 'No', 'Sí, me comprometo el 4 de Octubre del 2026', '0', '0', 'Pendiente', 'Bloqueado', 'SP-LM2026-10202030')
ON CONFLICT (id) DO UPDATE SET
    fecha_de_registro = EXCLUDED.fecha_de_registro,
    nombres_y_apellidos = EXCLUDED.nombres_y_apellidos,
    dni = EXCLUDED.dni,
    celular = EXCLUDED.celular,
    correo_electronico = EXCLUDED.correo_electronico,
    usa_whatsapp_en_su_celular = EXCLUDED.usa_whatsapp_en_su_celular,
    numero_whatsapp_alterno = EXCLUDED.numero_whatsapp_alterno,
    distrito_donde_vota = EXCLUDED.distrito_donde_vota,
    mesa_de_sufragio = EXCLUDED.mesa_de_sufragio,
    local_de_votacion = EXCLUDED.local_de_votacion,
    rol_a_desempenar = EXCLUDED.rol_a_desempenar,
    distrito_asignado = EXCLUDED.distrito_asignado,
    mesa_asignada = EXCLUDED.mesa_asignada,
    local_de_votacion_asignado = EXCLUDED.local_de_votacion_asignado,
    tiene_experiencia_como_personero = EXCLUDED.tiene_experiencia_como_personero,
    cuenta_con_movilidad_propia = EXCLUDED.cuenta_con_movilidad_propia,
    se_compromete_a_colaborar_el_4_de_octubre_del_2026_en_las_elecciones = EXCLUDED.se_compromete_a_colaborar_el_4_de_octubre_del_2026_en_las_elecciones,
    video = EXCLUDED.video,
    pdf = EXCLUDED.pdf,
    preguntas = EXCLUDED.preguntas,
    credenciales = EXCLUDED.credenciales,
    token_verificacion = EXCLUDED.token_verificacion;

SELECT setval('rpersoneros_id_seq', (SELECT COALESCE(MAX(id), 1) FROM rpersoneros));

-- =====================================================================
-- 5. CARGA DE LOS 123 LOCALES Y 1,650 MESAS DE ATE
-- =====================================================================
DROP TABLE IF EXISTS temp_locales_ate;
CREATE TEMP TABLE temp_locales_ate (
    id_local INT,
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    colegio VARCHAR(255),
    direccion TEXT,
    latitud VARCHAR(50),
    longitud VARCHAR(50),
    coordenadas_gps VARCHAR(100),
    cantidad_mesas INT
);

INSERT INTO temp_locales_ate (id_local, departamento, provincia, distrito, colegio, direccion, latitud, longitud, coordenadas_gps, cantidad_mesas)
VALUES
(1, 'LIMA', 'LIMA', 'ATE', 'IE 1208 SAN FRANCISCO DE ASIS', 'Distrito de Ate, Lima', '-12.043000', '-76.927700', 'Lat: -12.043000, Lng: -76.927700', 10),
(2, 'LIMA', 'LIMA', 'ATE', 'IE 1254 MARIA REICHE NEWMANN', 'Distrito de Ate, Lima', '-12.040800', '-76.912300', 'Lat: -12.040800, Lng: -76.912300', 19),
(3, 'LIMA', 'LIMA', 'ATE', 'IE 1265 SANTA ROSA DE LIMA', 'Distrito de Ate, Lima', '-12.038600', '-76.896900', 'Lat: -12.038600, Lng: -76.896900', 8),
(4, 'LIMA', 'LIMA', 'ATE', 'IE 1271 COLEGIO SAN JUAN BAUTISTA', 'Distrito de Ate, Lima', '-12.036400', '-76.932100', 'Lat: -12.036400, Lng: -76.932100', 9),
(5, 'LIMA', 'LIMA', 'ATE', 'IE 1283 OKINAWA', 'Distrito de Ate, Lima', '-12.034200', '-76.916700', 'Lat: -12.034200, Lng: -76.916700', 12),
(6, 'LIMA', 'LIMA', 'ATE', 'IE 1288 ALBERT EINSTEIN', 'Distrito de Ate, Lima', '-12.032000', '-76.901300', 'Lat: -12.032000, Lng: -76.901300', 7),
(7, 'LIMA', 'LIMA', 'ATE', 'IE 1289', 'Distrito de Ate, Lima', '-12.029800', '-76.936500', 'Lat: -12.029800, Lng: -76.936500', 8),
(8, 'LIMA', 'LIMA', 'ATE', 'IE 154 LOS CLAVELES', 'Distrito de Ate, Lima', '-12.027600', '-76.921100', 'Lat: -12.027600, Lng: -76.921100', 4),
(9, 'LIMA', 'LIMA', 'ATE', 'IE 171 VIRGEN DEL CARMEN', 'Distrito de Ate, Lima', '-12.025400', '-76.905700', 'Lat: -12.025400, Lng: -76.905700', 6),
(10, 'LIMA', 'LIMA', 'ATE', 'IE 185 SEÑOR DE LOS MILAGROS', 'Distrito de Ate, Lima', '-12.023200', '-76.940900', 'Lat: -12.023200, Lng: -76.940900', 5),
(11, 'LIMA', 'LIMA', 'ATE', 'IE 207 DIVINO NIÑO JESUS', 'Distrito de Ate, Lima', '-12.021000', '-76.925500', 'Lat: -12.021000, Lng: -76.925500', 7),
(12, 'LIMA', 'LIMA', 'ATE', 'IEP ALFRED NOBEL', 'Distrito de Ate, Lima', '-12.018800', '-76.910100', 'Lat: -12.018800, Lng: -76.910100', 32),
(13, 'LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE VITARTE', 'Distrito de Ate, Lima', '-12.016600', '-76.894700', 'Lat: -12.016600, Lng: -76.894700', 19),
(14, 'LIMA', 'LIMA', 'ATE', 'IEP INTERNACIONAL ELIM HUAYCAN', 'Distrito de Ate, Lima', '-12.014400', '-76.929900', 'Lat: -12.014400, Lng: -76.929900', 10),
(15, 'LIMA', 'LIMA', 'ATE', 'IEP LOS ANGELES', 'Distrito de Ate, Lima', '-12.012200', '-76.914500', 'Lat: -12.012200, Lng: -76.914500', 10),
(16, 'LIMA', 'LIMA', 'ATE', 'IEP NEW SCHOOL', 'Distrito de Ate, Lima', '-12.010000', '-76.899100', 'Lat: -12.010000, Lng: -76.899100', 20),
(17, 'LIMA', 'LIMA', 'ATE', 'IEP EDUARDO PALACI', 'Distrito de Ate, Lima', '-12.007800', '-76.934300', 'Lat: -12.007800, Lng: -76.934300', 11),
(18, 'LIMA', 'LIMA', 'ATE', 'IEP SALECIAN INNOVA (EX ALEXANDER GRAHAM BELL)', 'Distrito de Ate, Lima', '-12.005600', '-76.918900', 'Lat: -12.005600, Lng: -76.918900', 5),
(19, 'LIMA', 'LIMA', 'ATE', 'IEP SANTA TERESITA', 'Distrito de Ate, Lima', '-12.045200', '-76.903500', 'Lat: -12.045200, Lng: -76.903500', 7),
(20, 'LIMA', 'LIMA', 'ATE', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', 'Distrito de Ate, Lima', '-12.043000', '-76.938700', 'Lat: -12.043000, Lng: -76.938700', 12),
(21, 'LIMA', 'LIMA', 'ATE', 'IE 0026 AICHI NAGOYA', 'Distrito de Ate, Lima', '-12.040800', '-76.923300', 'Lat: -12.040800, Lng: -76.923300', 12),
(22, 'LIMA', 'LIMA', 'ATE', 'IE 0032 RAUL PORRAS BARRENECHEA', 'Distrito de Ate, Lima', '-12.038600', '-76.907900', 'Lat: -12.038600, Lng: -76.907900', 8),
(23, 'LIMA', 'LIMA', 'ATE', 'IE 0034', 'Distrito de Ate, Lima', '-12.036400', '-76.943100', 'Lat: -12.036400, Lng: -76.943100', 17),
(24, 'LIMA', 'LIMA', 'ATE', 'IE 0067 SANTA ELENA', 'Distrito de Ate, Lima', '-12.034200', '-76.927700', 'Lat: -12.034200, Lng: -76.927700', 5),
(25, 'LIMA', 'LIMA', 'ATE', 'IE 0074 FERNANDO BELAUNDE TERRY', 'Distrito de Ate, Lima', '-12.032000', '-76.912300', 'Lat: -12.032000, Lng: -76.912300', 18),
(26, 'LIMA', 'LIMA', 'ATE', 'IE 1135 SANTA CLARA', 'Distrito de Ate, Lima', '-12.029800', '-76.896900', 'Lat: -12.029800, Lng: -76.896900', 9),
(27, 'LIMA', 'LIMA', 'ATE', 'IE 1136 JOHN F. KENNEDY', 'Distrito de Ate, Lima', '-12.027600', '-76.932100', 'Lat: -12.027600, Lng: -76.932100', 8),
(28, 'LIMA', 'LIMA', 'ATE', 'IE 1138 JOSE ABELARDO QUIÑONES', 'Distrito de Ate, Lima', '-12.025400', '-76.916700', 'Lat: -12.025400, Lng: -76.916700', 16),
(29, 'LIMA', 'LIMA', 'ATE', 'IE 1142 SEÑOR DE LOS MILAGROS', 'Distrito de Ate, Lima', '-12.023200', '-76.901300', 'Lat: -12.023200, Lng: -76.901300', 7),
(30, 'LIMA', 'LIMA', 'ATE', 'IE 1143 DOMINGO FAUSTINO SARMIENTO', 'Distrito de Ate, Lima', '-12.021000', '-76.936500', 'Lat: -12.021000, Lng: -76.936500', 18),
(31, 'LIMA', 'LIMA', 'ATE', 'IE 1203 DIVINO NIÑO JESUS DE MANYLSA', 'Distrito de Ate, Lima', '-12.018800', '-76.921100', 'Lat: -12.018800, Lng: -76.921100', 7),
(32, 'LIMA', 'LIMA', 'ATE', 'IE 1209 GRAN MARISCAL TORIBIO DE LUZURIAGA', 'Distrito de Ate, Lima', '-12.016600', '-76.905700', 'Lat: -12.016600, Lng: -76.905700', 14),
(33, 'LIMA', 'LIMA', 'ATE', 'IE 1212 GRUMETE MEDINA', 'Distrito de Ate, Lima', '-12.014400', '-76.940900', 'Lat: -12.014400, Lng: -76.940900', 12),
(34, 'LIMA', 'LIMA', 'ATE', 'IE 1213 LA GLORIA', 'Distrito de Ate, Lima', '-12.012200', '-76.925500', 'Lat: -12.012200, Lng: -76.925500', 20),
(35, 'LIMA', 'LIMA', 'ATE', 'IE 1222 HUSARES DE JUNIN', 'Distrito de Ate, Lima', '-12.010000', '-76.910100', 'Lat: -12.010000, Lng: -76.910100', 15),
(36, 'LIMA', 'LIMA', 'ATE', 'IE 1226 SOL DE VITARTE', 'Distrito de Ate, Lima', '-12.007800', '-76.894700', 'Lat: -12.007800, Lng: -76.894700', 16),
(37, 'LIMA', 'LIMA', 'ATE', 'IE 1227 INDIRA GANDHI', 'Distrito de Ate, Lima', '-12.005600', '-76.929900', 'Lat: -12.005600, Lng: -76.929900', 17),
(38, 'LIMA', 'LIMA', 'ATE', 'IE 1228 LEONCIO PRADO GUTIERREZ', 'Distrito de Ate, Lima', '-12.045200', '-76.914500', 'Lat: -12.045200, Lng: -76.914500', 11),
(39, 'LIMA', 'LIMA', 'ATE', 'IE 1229 JULIO ALBERTO PONCE ANTUNEZ DE MAYOLO', 'Distrito de Ate, Lima', '-12.043000', '-76.899100', 'Lat: -12.043000, Lng: -76.899100', 12),
(40, 'LIMA', 'LIMA', 'ATE', 'IE 1231 JOSE LUIS BUSTAMANTE Y RIVERO', 'Distrito de Ate, Lima', '-12.040800', '-76.934300', 'Lat: -12.040800, Lng: -76.934300', 8),
(41, 'LIMA', 'LIMA', 'ATE', 'IE 1236 ALFONSO BARRANTES LINGAN', 'Distrito de Ate, Lima', '-12.038600', '-76.918900', 'Lat: -12.038600, Lng: -76.918900', 21),
(42, 'LIMA', 'LIMA', 'ATE', 'IE 1237 JORGE DIOMEDES GILES LLANOS', 'Distrito de Ate, Lima', '-12.036400', '-76.903500', 'Lat: -12.036400, Lng: -76.903500', 14),
(43, 'LIMA', 'LIMA', 'ATE', 'IE 1239 FORTALEZA', 'Distrito de Ate, Lima', '-12.034200', '-76.938700', 'Lat: -12.034200, Lng: -76.938700', 5),
(44, 'LIMA', 'LIMA', 'ATE', 'IE 1244 MICAELA BASTIDAS', 'Distrito de Ate, Lima', '-12.032000', '-76.923300', 'Lat: -12.032000, Lng: -76.923300', 13),
(45, 'LIMA', 'LIMA', 'ATE', 'IE 1245 JOSE CARLOS MARIATEGUI', 'Distrito de Ate, Lima', '-12.029800', '-76.907900', 'Lat: -12.029800, Lng: -76.907900', 20),
(46, 'LIMA', 'LIMA', 'ATE', 'IE 1248 5 DE ABRIL', 'Distrito de Ate, Lima', '-12.027600', '-76.943100', 'Lat: -12.027600, Lng: -76.943100', 33),
(47, 'LIMA', 'LIMA', 'ATE', 'IE 1290 NUEVA AMERICA', 'Distrito de Ate, Lima', '-12.025400', '-76.927700', 'Lat: -12.025400, Lng: -76.927700', 17),
(48, 'LIMA', 'LIMA', 'ATE', 'IE 1249 JAVIER HERAUD', 'Distrito de Ate, Lima', '-12.023200', '-76.912300', 'Lat: -12.023200, Lng: -76.912300', 4),
(49, 'LIMA', 'LIMA', 'ATE', 'IE 1251 PERUANO SUIZO', 'Distrito de Ate, Lima', '-12.021000', '-76.896900', 'Lat: -12.021000, Lng: -76.896900', 14),
(50, 'LIMA', 'LIMA', 'ATE', 'IE 1255 WALTER PEÑALOZA RAMELLA', 'Distrito de Ate, Lima', '-12.018800', '-76.932100', 'Lat: -12.018800, Lng: -76.932100', 31),
(51, 'LIMA', 'LIMA', 'ATE', 'IE 1257 REINO UNIDO DE GRAN BRETAÑA', 'Distrito de Ate, Lima', '-12.016600', '-76.916700', 'Lat: -12.016600, Lng: -76.916700', 10),
(52, 'LIMA', 'LIMA', 'ATE', 'IE 1258 SEBASTIAN LORENTE IBAÑEZ', 'Distrito de Ate, Lima', '-12.014400', '-76.901300', 'Lat: -12.014400, Lng: -76.901300', 6),
(53, 'LIMA', 'LIMA', 'ATE', 'IE 1260 EL AMAUTA', 'Distrito de Ate, Lima', '-12.012200', '-76.936500', 'Lat: -12.012200, Lng: -76.936500', 27),
(54, 'LIMA', 'LIMA', 'ATE', 'IE 1262 EL AMAUTA JOSE CARLOS MARIATEGUI', 'Distrito de Ate, Lima', '-12.010000', '-76.921100', 'Lat: -12.010000, Lng: -76.921100', 17),
(55, 'LIMA', 'LIMA', 'ATE', 'IE 1268 GUSTAVO MOHME LLONA', 'Distrito de Ate, Lima', '-12.007800', '-76.905700', 'Lat: -12.007800, Lng: -76.905700', 14),
(56, 'LIMA', 'LIMA', 'ATE', 'IE 1279', 'Distrito de Ate, Lima', '-12.005600', '-76.940900', 'Lat: -12.005600, Lng: -76.940900', 16),
(57, 'LIMA', 'LIMA', 'ATE', 'IE 6039 FERNANDO CARBAJAL SEGURA', 'Distrito de Ate, Lima', '-12.045200', '-76.925500', 'Lat: -12.045200, Lng: -76.925500', 29),
(58, 'LIMA', 'LIMA', 'ATE', 'IE AKIRA KATO', 'Distrito de Ate, Lima', '-12.043000', '-76.910100', 'Lat: -12.043000, Lng: -76.910100', 6),
(59, 'LIMA', 'LIMA', 'ATE', 'IE 0029 CORONEL PNP MARCO PUENTE LLANOS', 'Distrito de Ate, Lima', '-12.040800', '-76.894700', 'Lat: -12.040800, Lng: -76.894700', 11),
(60, 'LIMA', 'LIMA', 'ATE', 'IE COLEGIO NACIONAL DE VITARTE', 'Distrito de Ate, Lima', '-12.038600', '-76.929900', 'Lat: -12.038600, Lng: -76.929900', 19),
(61, 'LIMA', 'LIMA', 'ATE', 'IE FE Y ALEGRIA 53', 'Distrito de Ate, Lima', '-12.036400', '-76.914500', 'Lat: -12.036400, Lng: -76.914500', 16),
(62, 'LIMA', 'LIMA', 'ATE', 'IE JULIO C TELLO', 'Distrito de Ate, Lima', '-12.034200', '-76.899100', 'Lat: -12.034200, Lng: -76.899100', 18),
(63, 'LIMA', 'LIMA', 'ATE', 'IE 1264 JUAN ANDRES VIVANCO AMORIN', 'Distrito de Ate, Lima', '-12.032000', '-76.934300', 'Lat: -12.032000, Lng: -76.934300', 27),
(64, 'LIMA', 'LIMA', 'ATE', 'IE MIXTO HUAYCAN', 'Distrito de Ate, Lima', '-12.029800', '-76.918900', 'Lat: -12.029800, Lng: -76.918900', 27),
(65, 'LIMA', 'LIMA', 'ATE', 'IE NUESTRA SEÑORA DE LA ESPERANZA', 'Distrito de Ate, Lima', '-12.027600', '-76.903500', 'Lat: -12.027600, Lng: -76.903500', 10),
(66, 'LIMA', 'LIMA', 'ATE', 'IE RICARDO PALMA', 'Distrito de Ate, Lima', '-12.025400', '-76.938700', 'Lat: -12.025400, Lng: -76.938700', 9),
(67, 'LIMA', 'LIMA', 'ATE', 'IE 046 VICTOR RAUL HAYA DE LA TORRE INEI', 'Distrito de Ate, Lima', '-12.023200', '-76.923300', 'Lat: -12.023200, Lng: -76.923300', 18),
(68, 'LIMA', 'LIMA', 'ATE', 'IE EDELMIRA DEL PANDO', 'Distrito de Ate, Lima', '-12.021000', '-76.907900', 'Lat: -12.021000, Lng: -76.907900', 20),
(69, 'LIMA', 'LIMA', 'ATE', 'IE 0025 SAN MARTIN DE PORRES', 'Distrito de Ate, Lima', '-12.018800', '-76.943100', 'Lat: -12.018800, Lng: -76.943100', 28),
(70, 'LIMA', 'LIMA', 'ATE', 'IEP INCA GARCILASO DE LA VEGA', 'Distrito de Ate, Lima', '-12.016600', '-76.927700', 'Lat: -12.016600, Lng: -76.927700', 33),
(71, 'LIMA', 'LIMA', 'ATE', 'IEP SAN IGNACIO SCHOOL', 'Distrito de Ate, Lima', '-12.014400', '-76.912300', 'Lat: -12.014400, Lng: -76.912300', 11),
(72, 'LIMA', 'LIMA', 'ATE', 'IEP CRISTO REINA I', 'Distrito de Ate, Lima', '-12.012200', '-76.896900', 'Lat: -12.012200, Lng: -76.896900', 9),
(73, 'LIMA', 'LIMA', 'ATE', 'IEP JOSE MARIA ARGUEDAS ALTAMIRANO', 'Distrito de Ate, Lima', '-12.010000', '-76.932100', 'Lat: -12.010000, Lng: -76.932100', 7),
(74, 'LIMA', 'LIMA', 'ATE', 'IEP SANTISIMO SALVADOR', 'Distrito de Ate, Lima', '-12.007800', '-76.916700', 'Lat: -12.007800, Lng: -76.916700', 5),
(75, 'LIMA', 'LIMA', 'ATE', 'IEP CIENCIAS APLICADAS ALBERT EINSTEIN', 'Distrito de Ate, Lima', '-12.005600', '-76.901300', 'Lat: -12.005600, Lng: -76.901300', 11),
(76, 'LIMA', 'LIMA', 'ATE', 'IEP COLEGIO MAYOR SISTEMA SAN MARCOS', 'Distrito de Ate, Lima', '-12.045200', '-76.936500', 'Lat: -12.045200, Lng: -76.936500', 28),
(77, 'LIMA', 'LIMA', 'ATE', 'IE 167 LAS PIEDRITAS', 'Distrito de Ate, Lima', '-12.043000', '-76.921100', 'Lat: -12.043000, Lng: -76.921100', 10),
(78, 'LIMA', 'LIMA', 'ATE', 'IE 1263 PURUCHUCO', 'Distrito de Ate, Lima', '-12.040800', '-76.905700', 'Lat: -12.040800, Lng: -76.905700', 18),
(79, 'LIMA', 'LIMA', 'ATE', 'CEBE 13 JESÚS AMIGO', 'Distrito de Ate, Lima', '-12.038600', '-76.940900', 'Lat: -12.038600, Lng: -76.940900', 7),
(80, 'LIMA', 'LIMA', 'ATE', 'IEP ALFONSO UGARTE HUAYCAN', 'Distrito de Ate, Lima', '-12.036400', '-76.925500', 'Lat: -12.036400, Lng: -76.925500', 6),
(81, 'LIMA', 'LIMA', 'ATE', 'IEP JOHN DALTON', 'Distrito de Ate, Lima', '-12.034200', '-76.910100', 'Lat: -12.034200, Lng: -76.910100', 6),
(82, 'LIMA', 'LIMA', 'ATE', 'IEP PEDRO RUIZ GALLO', 'Distrito de Ate, Lima', '-12.032000', '-76.894700', 'Lat: -12.032000, Lng: -76.894700', 5),
(83, 'LIMA', 'LIMA', 'ATE', 'IEP ROSA DE LA MERCED', 'Distrito de Ate, Lima', '-12.029800', '-76.929900', 'Lat: -12.029800, Lng: -76.929900', 22),
(84, 'LIMA', 'LIMA', 'ATE', 'IEP SAN JUAN', 'Distrito de Ate, Lima', '-12.027600', '-76.914500', 'Lat: -12.027600, Lng: -76.914500', 11),
(85, 'LIMA', 'LIMA', 'ATE', 'IEP KAROL WOJTYLA - SECUNDARIA', 'Distrito de Ate, Lima', '-12.025400', '-76.899100', 'Lat: -12.025400, Lng: -76.899100', 5),
(86, 'LIMA', 'LIMA', 'ATE', 'IEP MAESTRO DIVINO', 'Distrito de Ate, Lima', '-12.023200', '-76.934300', 'Lat: -12.023200, Lng: -76.934300', 9),
(87, 'LIMA', 'LIMA', 'ATE', 'IEP SAN BASILIO', 'Distrito de Ate, Lima', '-12.021000', '-76.918900', 'Lat: -12.021000, Lng: -76.918900', 10),
(88, 'LIMA', 'LIMA', 'ATE', 'IEP VANGUARDIA ESTUDIANTIL', 'Distrito de Ate, Lima', '-12.018800', '-76.903500', 'Lat: -12.018800, Lng: -76.903500', 8),
(89, 'LIMA', 'LIMA', 'ATE', 'IEP SAN LUIS REY DE FRANCIA', 'Distrito de Ate, Lima', '-12.016600', '-76.938700', 'Lat: -12.016600, Lng: -76.938700', 7),
(90, 'LIMA', 'LIMA', 'ATE', 'IEP UNION LATINO', 'Distrito de Ate, Lima', '-12.014400', '-76.923300', 'Lat: -12.014400, Lng: -76.923300', 9),
(91, 'LIMA', 'LIMA', 'ATE', 'IEP SACRO COURE', 'Distrito de Ate, Lima', '-12.012200', '-76.907900', 'Lat: -12.012200, Lng: -76.907900', 10),
(92, 'LIMA', 'LIMA', 'ATE', 'IEP TARPUY MODERNO', 'Distrito de Ate, Lima', '-12.010000', '-76.943100', 'Lat: -12.010000, Lng: -76.943100', 7),
(93, 'LIMA', 'LIMA', 'ATE', 'IEP CIENTIFICO ISAAC NEWTON', 'Distrito de Ate, Lima', '-12.007800', '-76.927700', 'Lat: -12.007800, Lng: -76.927700', 8),
(94, 'LIMA', 'LIMA', 'ATE', 'IEP TÉCNICO PERUANO CHINO SAN FRANCISCO DE ASIS', 'Distrito de Ate, Lima', '-12.005600', '-76.912300', 'Lat: -12.005600, Lng: -76.912300', 16),
(95, 'LIMA', 'LIMA', 'ATE', 'IEP LUCERITO DE AMOR', 'Distrito de Ate, Lima', '-12.045200', '-76.896900', 'Lat: -12.045200, Lng: -76.896900', 7),
(96, 'LIMA', 'LIMA', 'ATE', 'IEP SAN ANTONIO DE UMARO', 'Distrito de Ate, Lima', '-12.043000', '-76.932100', 'Lat: -12.043000, Lng: -76.932100', 6),
(97, 'LIMA', 'LIMA', 'ATE', 'IEP SALESIAN INNOVA SCHOOL', 'Distrito de Ate, Lima', '-12.040800', '-76.916700', 'Lat: -12.040800, Lng: -76.916700', 9),
(98, 'LIMA', 'LIMA', 'ATE', 'IEP CORAZON DE JESUS DE SANTA CLARA', 'Distrito de Ate, Lima', '-12.038600', '-76.901300', 'Lat: -12.038600, Lng: -76.901300', 8),
(99, 'LIMA', 'LIMA', 'ATE', 'IEP INTERNACIONAL ELIM', 'Distrito de Ate, Lima', '-12.036400', '-76.936500', 'Lat: -12.036400, Lng: -76.936500', 5),
(100, 'LIMA', 'LIMA', 'ATE', 'IEP ANNA JARVIS', 'Distrito de Ate, Lima', '-12.034200', '-76.921100', 'Lat: -12.034200, Lng: -76.921100', 5),
(101, 'LIMA', 'LIMA', 'ATE', 'IEP JOSÉ INGENIEROS', 'Distrito de Ate, Lima', '-12.032000', '-76.905700', 'Lat: -12.032000, Lng: -76.905700', 9),
(102, 'LIMA', 'LIMA', 'ATE', 'IEP SALESIAN COLLEGE', 'Distrito de Ate, Lima', '-12.029800', '-76.940900', 'Lat: -12.029800, Lng: -76.940900', 12),
(103, 'LIMA', 'LIMA', 'ATE', 'IEP SANTA CATALINA', 'Distrito de Ate, Lima', '-12.027600', '-76.925500', 'Lat: -12.027600, Lng: -76.925500', 9),
(104, 'LIMA', 'LIMA', 'ATE', 'IEP NUESTRA SEÑORA DE GUADALUPE', 'Distrito de Ate, Lima', '-12.025400', '-76.910100', 'Lat: -12.025400, Lng: -76.910100', 5),
(105, 'LIMA', 'LIMA', 'ATE', 'IEP HOWARD SCHOOL', 'Distrito de Ate, Lima', '-12.023200', '-76.894700', 'Lat: -12.023200, Lng: -76.894700', 7),
(106, 'LIMA', 'LIMA', 'ATE', 'IEP SANTISIMA VIRGEN DE GUADALUPE DE LAS AMERICAS', 'Distrito de Ate, Lima', '-12.021000', '-76.929900', 'Lat: -12.021000, Lng: -76.929900', 8),
(107, 'LIMA', 'LIMA', 'ATE', 'IEP INTERNACIONAL DEL PACIFICO', 'Distrito de Ate, Lima', '-12.018800', '-76.914500', 'Lat: -12.018800, Lng: -76.914500', 8),
(108, 'LIMA', 'LIMA', 'ATE', 'IEP PACIFICO', 'Distrito de Ate, Lima', '-12.016600', '-76.899100', 'Lat: -12.016600, Lng: -76.899100', 11),
(109, 'LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS DE HUAYCAN', 'Distrito de Ate, Lima', '-12.014400', '-76.934300', 'Lat: -12.014400, Lng: -76.934300', 13),
(110, 'LIMA', 'LIMA', 'ATE', 'IEP LAS AMERICAS DE ATE', 'Distrito de Ate, Lima', '-12.012200', '-76.918900', 'Lat: -12.012200, Lng: -76.918900', 17),
(111, 'LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS DE ATE', 'Distrito de Ate, Lima', '-12.010000', '-76.903500', 'Lat: -12.010000, Lng: -76.903500', 36),
(112, 'LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS APEIRON ATE INGENIEROS', 'Distrito de Ate, Lima', '-12.007800', '-76.938700', 'Lat: -12.007800, Lng: -76.938700', 17),
(113, 'LIMA', 'LIMA', 'ATE', 'IEP SACO OLIVEROS DE SALAMANCA', 'Distrito de Ate, Lima', '-12.005600', '-76.923300', 'Lat: -12.005600, Lng: -76.923300', 17),
(114, 'LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOL - ATE PURUCHUCO', 'Distrito de Ate, Lima', '-12.045200', '-76.907900', 'Lat: -12.045200, Lng: -76.907900', 27),
(115, 'LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE MAYORAZGO', 'Distrito de Ate, Lima', '-12.043000', '-76.943100', 'Lat: -12.043000, Lng: -76.943100', 29),
(116, 'LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE SANTA CLARA', 'Distrito de Ate, Lima', '-12.040800', '-76.927700', 'Lat: -12.040800, Lng: -76.927700', 36),
(117, 'LIMA', 'LIMA', 'ATE', 'IEP INNOVA SCHOOLS - ATE SANTA MARIA', 'Distrito de Ate, Lima', '-12.038600', '-76.912300', 'Lat: -12.038600, Lng: -76.912300', 21),
(118, 'LIMA', 'LIMA', 'ATE', 'IE 1228 LEONCIO PRADO GUTIERREZ- SECUNDARIA', 'Distrito de Ate, Lima', '-12.036400', '-76.896900', 'Lat: -12.036400, Lng: -76.896900', 10),
(119, 'LIMA', 'LIMA', 'ATE', 'IE MANUEL GONZALES PRADA', 'Distrito de Ate, Lima', '-12.034200', '-76.932100', 'Lat: -12.034200, Lng: -76.932100', 23),
(120, 'LIMA', 'LIMA', 'ATE', 'IEP SANTIAGO APOSTOL', 'Distrito de Ate, Lima', '-12.032000', '-76.916700', 'Lat: -12.032000, Lng: -76.916700', 22),
(121, 'LIMA', 'LIMA', 'ATE', 'IE 1215 SAN JUAN DE PARIACHI', 'Distrito de Ate, Lima', '-12.029800', '-76.901300', 'Lat: -12.029800, Lng: -76.901300', 9),
(122, 'LIMA', 'LIMA', 'ATE', 'IE 1270 JUAN EL BAUTISTA', 'Distrito de Ate, Lima', '-12.027600', '-76.936500', 'Lat: -12.027600, Lng: -76.936500', 10),
(123, 'LIMA', 'LIMA', 'ATE', 'IE 1281 SANTA MARIA', 'Distrito de Ate, Lima', '-12.025400', '-76.921100', 'Lat: -12.025400, Lng: -76.921100', 5)
ON CONFLICT DO NOTHING;

-- Inserción de Colegios
INSERT INTO colegios (colegio, distrito, direccion, latitud, longitud, coordenadas_gps, radio_metros, num_mesas)
SELECT DISTINCT colegio, distrito, direccion, latitud, longitud, coordenadas_gps, 50, cantidad_mesas
FROM temp_locales_ate
ON CONFLICT (colegio) DO UPDATE SET
  distrito = EXCLUDED.distrito,
  direccion = EXCLUDED.direccion,
  latitud = EXCLUDED.latitud,
  longitud = EXCLUDED.longitud,
  coordenadas_gps = EXCLUDED.coordenadas_gps,
  num_mesas = EXCLUDED.num_mesas;

-- Generador de Mesas
INSERT INTO mesas (numero_mesa, distrito, colegio, provincia, departamento, latitud, longitud, coordenadas_gps, estado, direccion)
SELECT 
    LPAD(((L.id_local * 100) + s.n)::text, 6, '0') AS numero_mesa,
    L.distrito,
    L.colegio,
    L.provincia,
    L.departamento,
    L.latitud,
    L.longitud,
    L.coordenadas_gps,
    'DISPONIBLE' AS estado,
    L.direccion
FROM temp_locales_ate L
CROSS JOIN LATERAL generate_series(1, L.cantidad_mesas) AS s(n)
ON CONFLICT (colegio, numero_mesa) DO UPDATE SET
  latitud = EXCLUDED.latitud,
  longitud = EXCLUDED.longitud,
  coordenadas_gps = EXCLUDED.coordenadas_gps,
  direccion = EXCLUDED.direccion;

DROP TABLE IF EXISTS temp_locales_ate;
