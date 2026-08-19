-- =====================================================================
-- MIGRACIÓN 001: Creación de Esquema Inicial (Idempotente)
-- Base de Datos: conteo
-- Tablas: Usuarios, Usuarios1, Rpersoneros, Rcoordinadores, Mesas, Colegios, Asistencia, AsistenciaLlegada, Coordinadores, Votos_Detalle
-- =====================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'conteo')
BEGIN
    CREATE DATABASE conteo;
END;
GO

USE conteo;
GO

-- 1. Tabla Usuarios (Personeros y Administradores oficiales)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Usuarios')
BEGIN
    CREATE TABLE dbo.Usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        dni VARCHAR(50) NOT NULL UNIQUE,
        nombre VARCHAR(150) NOT NULL,
        rol VARCHAR(50) DEFAULT 'Personero',
        ubicacion VARCHAR(100) NULL, -- Distrito
        colegio VARCHAR(200) NULL,
        mesa VARCHAR(20) NULL,
        estado VARCHAR(20) DEFAULT 'Activo',
        fecha_registro DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 2. Tabla Usuarios1 (Coordinadores oficiales)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Usuarios1')
BEGIN
    CREATE TABLE dbo.Usuarios1 (
        id INT IDENTITY(1,1) PRIMARY KEY,
        dni VARCHAR(50) NOT NULL UNIQUE,
        nombre VARCHAR(150) NOT NULL,
        rol VARCHAR(50) DEFAULT 'Coordinador',
        ubicacion VARCHAR(100) NULL, -- Distrito
        colegio VARCHAR(200) NULL,
        mesa VARCHAR(20) NULL,
        estado VARCHAR(20) DEFAULT 'Activo',
        fecha_registro DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 3. Tabla Rpersoneros (Personeros registrados por formulario)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Rpersoneros')
BEGIN
    CREATE TABLE dbo.Rpersoneros (
        id INT IDENTITY(1,1) PRIMARY KEY,
        DNI VARCHAR(50) NOT NULL,
        Nombres_y_Apellidos VARCHAR(150) NOT NULL,
        Rol_a_Desempenar VARCHAR(50) NULL,
        Distrito_Asignado VARCHAR(100) NULL,
        Distrito_donde_Vota VARCHAR(100) NULL,
        Local_de_Votacion_Asignado VARCHAR(200) NULL,
        Local_de_Votacion VARCHAR(200) NULL,
        Mesa_Asignada VARCHAR(50) NULL,
        Mesa_de_Sufragio VARCHAR(50) NULL,
        fecha_registro DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 4. Tabla Rcoordinadores (Coordinadores registrados por formulario)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Rcoordinadores')
BEGIN
    CREATE TABLE dbo.Rcoordinadores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        DNI VARCHAR(50) NOT NULL,
        Nombres_y_Apellidos VARCHAR(150) NOT NULL,
        Distrito_Asignado VARCHAR(100) NULL,
        Distrito_donde_Vota VARCHAR(100) NULL,
        Local_de_Votacion_Asignado VARCHAR(200) NULL,
        Local_de_Votacion VARCHAR(200) NULL,
        fecha_registro DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 5. Tabla Mesas (Estructura electoral)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Mesas')
BEGIN
    CREATE TABLE dbo.Mesas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        numero_mesa VARCHAR(20) NOT NULL UNIQUE,
        distrito VARCHAR(100) NOT NULL,
        colegio VARCHAR(200) NOT NULL,
        provincia VARCHAR(100) DEFAULT 'Lima',
        departamento VARCHAR(100) DEFAULT 'Lima',
        latitud VARCHAR(50) NULL,
        longitud VARCHAR(50) NULL,
        coordenadas_gps VARCHAR(100) NULL,
        estado VARCHAR(20) DEFAULT 'Activo'
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'coordenadas_gps')
        ALTER TABLE dbo.Mesas ADD coordenadas_gps VARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'latitud')
        ALTER TABLE dbo.Mesas ADD latitud VARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'longitud')
        ALTER TABLE dbo.Mesas ADD longitud VARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'numero_mesa')
        ALTER TABLE dbo.Mesas ADD numero_mesa VARCHAR(20) NULL;
END;
GO

-- 6. Tabla Colegios (Catálogo geodésico y radios permitidos)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Colegios')
BEGIN
    CREATE TABLE dbo.Colegios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        colegio VARCHAR(200) NOT NULL,
        distrito VARCHAR(100) NOT NULL,
        direccion VARCHAR(255) NULL,
        latitud VARCHAR(50) NULL,
        longitud VARCHAR(50) NULL,
        coordenadas_gps VARCHAR(100) NULL,
        radio_metros INT DEFAULT 50
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Colegios') AND name = 'coordenadas_gps')
        ALTER TABLE dbo.Colegios ADD coordenadas_gps VARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Colegios') AND name = 'latitud')
        ALTER TABLE dbo.Colegios ADD latitud VARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Colegios') AND name = 'longitud')
        ALTER TABLE dbo.Colegios ADD longitud VARCHAR(50) NULL;
END;
GO

-- 7. Tabla Asistencia (Asistencia inicial con Foto Base64 y GPS)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Asistencia')
BEGIN
    CREATE TABLE dbo.Asistencia (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fecha_hora DATETIME DEFAULT GETDATE(),
        nombre VARCHAR(150) NOT NULL,
        dni VARCHAR(50) NOT NULL,
        distrito VARCHAR(100) NULL,
        local VARCHAR(200) NULL,
        mesa VARCHAR(20) NULL,
        confirmacion VARCHAR(20) DEFAULT 'SI',
        foto_url NVARCHAR(MAX) NULL,
        ubicacion_gps VARCHAR(100) NULL
    );
END;
GO

-- 8. Tabla AsistenciaLlegada (2da Confirmación GPS dentro del radio de 50 metros)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'AsistenciaLlegada')
BEGIN
    CREATE TABLE dbo.AsistenciaLlegada (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(255),
        dni VARCHAR(50),
        distrito VARCHAR(100),
        colegio VARCHAR(255),
        mesa VARCHAR(50),
        latitud VARCHAR(50),
        longitud VARCHAR(50),
        distancia_metros FLOAT,
        radio_permitido INT DEFAULT 50,
        estado VARCHAR(50) DEFAULT 'CONFIRMADO 2DA LLEGADA',
        fecha_registro DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 9. Tabla Coordinadores (Supervisión y confirmación de personero por coordinador)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Coordinadores')
BEGIN
    CREATE TABLE dbo.Coordinadores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fecha_hora DATETIME DEFAULT GETDATE(),
        personero_nombre VARCHAR(150) NOT NULL,
        personero_dni VARCHAR(50) NOT NULL,
        distrito VARCHAR(100) NULL,
        local VARCHAR(200) NULL,
        coordinador_nombre VARCHAR(150) NOT NULL,
        coordinador_dni VARCHAR(50) NOT NULL,
        confirmacion VARCHAR(20) DEFAULT 'SI',
        foto_url NVARCHAR(MAX) NULL
    );
END;
GO

-- 10. Tabla Votos_Detalle (Escrutinio de Votos: Provincial y Distrital)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Votos_Detalle')
BEGIN
    CREATE TABLE dbo.Votos_Detalle (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fecha_hora DATETIME DEFAULT GETDATE(),
        personero VARCHAR(150) NOT NULL,
        dni VARCHAR(50) NOT NULL,
        departamento VARCHAR(100) DEFAULT 'Lima',
        provincia VARCHAR(100) DEFAULT 'Lima',
        ubicacion VARCHAR(100) NULL, -- Distrito
        colegio VARCHAR(200) NULL,
        numero_mesa VARCHAR(20) NOT NULL,
        origen VARCHAR(20) NOT NULL, -- MANUAL o IMAGEN
        
        -- Votos Provinciales
        p_fp_candidato VARCHAR(150) NULL,
        p_fp_votos INT DEFAULT 0,
        p_jp_candidato VARCHAR(150) NULL,
        p_jp_votos INT DEFAULT 0,
        p_sp_candidato VARCHAR(150) NULL,
        p_sp_votos INT DEFAULT 0,
        p_frepap_candidato VARCHAR(150) NULL,
        p_frepap_votos INT DEFAULT 0,
        p_verde_candidato VARCHAR(150) NULL,
        p_verde_votos INT DEFAULT 0,
        p_morado_candidato VARCHAR(150) NULL,
        p_morado_votos INT DEFAULT 0,
        p_nulos INT DEFAULT 0,
        p_vacios INT DEFAULT 0,
        p_total_votos INT DEFAULT 0,
        
        -- Votos Distritales
        d_fp_candidato VARCHAR(150) NULL,
        d_fp_votos INT DEFAULT 0,
        d_jp_candidato VARCHAR(150) NULL,
        d_jp_votos INT DEFAULT 0,
        d_sp_candidato VARCHAR(150) NULL,
        d_sp_votos INT DEFAULT 0,
        d_frepap_candidato VARCHAR(150) NULL,
        d_frepap_votos INT DEFAULT 0,
        d_verde_candidato VARCHAR(150) NULL,
        d_verde_votos INT DEFAULT 0,
        d_morado_candidato VARCHAR(150) NULL,
        d_morado_votos INT DEFAULT 0,
        d_nulos INT DEFAULT 0,
        d_vacios INT DEFAULT 0,
        d_total_votos INT DEFAULT 0,

        CONSTRAINT UQ_Mesa_Origen UNIQUE (numero_mesa, origen)
    );
END;
GO
