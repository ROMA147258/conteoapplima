-- =====================================================================
-- MIGRACIÓN 004: Agregar Columna direccion y Asegurar Tipos en dbo.Mesas
-- Base de Datos: conteo
-- =====================================================================

USE conteo;
GO

-- 1. Agregar columna direccion si no existe
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'direccion')
BEGIN
    ALTER TABLE dbo.Mesas ADD direccion NVARCHAR(500) NULL;
END;
GO

-- 2. Asegurar columnas de coordenadas y estado en dbo.Mesas
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'coordenadas_gps')
BEGIN
    ALTER TABLE dbo.Mesas ADD coordenadas_gps VARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'latitud')
BEGIN
    ALTER TABLE dbo.Mesas ADD latitud VARCHAR(50) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'longitud')
BEGIN
    ALTER TABLE dbo.Mesas ADD longitud VARCHAR(50) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Mesas') AND name = 'estado')
BEGIN
    ALTER TABLE dbo.Mesas ADD estado VARCHAR(50) DEFAULT 'DISPONIBLE';
END;
GO
