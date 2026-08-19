-- =====================================================================
-- MIGRACIÓN 003: Datos Semilla Iniciales Idempotentes (Usuarios, Coordinadores, Mesas)
-- =====================================================================

USE conteo;
GO

-- 1. Super Administrador y Personeros Iniciales
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = 'Admin#2026$Secure!VotoReal')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('Admin#2026$Secure!VotoReal', 'Super Administrador', 'Admin', '', '', '');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '99999999')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('99999999', 'Super Administrador', 'Admin', 'Lima', 'CENTRAL', '');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '10026769')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('10026769', 'Fernando Arias Navarro', 'Personero', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '063769');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000001')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000001', 'Juan Carlos Quispe Palomino', 'Personero', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '037163');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000002')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000002', 'María Elena Flores Dávila', 'Personero', 'Ate', 'IE 0026 AICHI NAGOYA', '037175');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000003')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000003', 'Carlos Alberto Rodríguez Bustamante', 'Personero', 'Ate', 'IE 0032 RAUL PORRAS BARRENECHEA', '037187');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000004')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000004', 'Ana Lucía Rojas Cárdenas', 'Personero', 'Ate', 'IE 0074 FERNANDO BELAUNDE TERRY', '037207');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000005')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000005', 'Luis Fernando Chávez Paredes', 'Personero', 'Ancón', 'IE 3069 GENERALISIMO JOSE DE SAN MARTIN', '036999');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000006')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000006', 'Carmen Rosa Gonzales Córdova', 'Personero', 'Ancón', 'IE 2066 ALMIRANTE MIGUEL GRAU', '037020');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000007')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000007', 'José Antonio Pérez Vilca', 'Personero', 'Lima', 'IE EMBLEMATICA GUADALUPE', '010001');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000008')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000008', 'Sofia Isabel Ramírez Salas', 'Personero', 'Miraflores', 'IE JUANA ALARCO DE D script', '020001');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE dni = '71000009')
    INSERT INTO dbo.Usuarios (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('71000009', 'Jorge Luis Mendoza Ccama', 'Personero', 'Surco', 'IE MANUEL POLO JIMENEZ', '030001');
GO

-- 2. Coordinadores Iniciales
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios1 WHERE dni = '20000001')
    INSERT INTO dbo.Usuarios1 (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('20000001', 'Coord. Juan Quispe', 'Coordinador', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios1 WHERE dni = '20000002')
    INSERT INTO dbo.Usuarios1 (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('20000002', 'Coord. María Flores', 'Coordinador', 'Ate', 'IE 0026 AICHI NAGOYA', '');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios1 WHERE dni = '20000003')
    INSERT INTO dbo.Usuarios1 (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('20000003', 'Coord. Carlos Sánchez', 'Coordinador', 'Ancón', 'IE 3069 GENERALISIMO JOSE DE SAN MARTIN', '');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios1 WHERE dni = 'c1')
    INSERT INTO dbo.Usuarios1 (dni, nombre, rol, ubicacion, colegio, mesa) VALUES ('c1', 'Coord. Juan Quispe', 'Coordinador', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '');
GO

-- 3. Mesas y Coordenadas Iniciales
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'coordenadas_gps')
    ALTER TABLE dbo.Mesas ADD coordenadas_gps VARCHAR(100) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'latitud')
    ALTER TABLE dbo.Mesas ADD latitud VARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'longitud')
    ALTER TABLE dbo.Mesas ADD longitud VARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '063769')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('063769', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '-12.0254', '-76.9189', '-12.0254,-76.9189');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '037163')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('037163', 'Ate', 'IE 0024 PEDRO ENRIQUE GONZALES SOTO', '-12.0254', '-76.9189', '-12.0254,-76.9189');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '037175')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('037175', 'Ate', 'IE 0026 AICHI NAGOYA', '-12.0254', '-76.9189', '-12.0254,-76.9189');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '037187')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('037187', 'Ate', 'IE 0032 RAUL PORRAS BARRENECHEA', '-12.0254', '-76.9189', '-12.0254,-76.9189');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '037207')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('037207', 'Ate', 'IE 0074 FERNANDO BELAUNDE TERRY', '-12.0254', '-76.9189', '-12.0254,-76.9189');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '036999')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('036999', 'Ancón', 'IE 3069 GENERALISIMO JOSE DE SAN MARTIN', '-11.7745', '-77.1550', '-11.7745,-77.1550');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '037020')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('037020', 'Ancón', 'IE 2066 ALMIRANTE MIGUEL GRAU', '-11.7745', '-77.1550', '-11.7745,-77.1550');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '010001')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('010001', 'Lima', 'IE EMBLEMATICA GUADALUPE', '-12.0463', '-77.0427', '-12.0463,-77.0427');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '020001')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('020001', 'Miraflores', 'IE JUANA ALARCO DE D script', '-12.1245', '-77.0260', '-12.1245,-77.0260');

IF NOT EXISTS (SELECT 1 FROM dbo.Mesas WHERE numero_mesa = '030001')
    INSERT INTO dbo.Mesas (numero_mesa, distrito, colegio, latitud, longitud, coordenadas_gps) VALUES ('030001', 'Surco', 'IE MANUEL POLO JIMENEZ', '-12.1400', '-76.9900', '-12.1400,-76.9900');
GO
