-- =====================================================================
-- MIGRACIÓN 005: Índices y Restricciones de Integridad para dbo.Mesas
-- Base de Datos: conteo
-- =====================================================================

USE conteo;
GO

-- 1. Índice para búsqueda por distrito
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mesas_Distrito' AND object_id = OBJECT_ID('dbo.Mesas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Mesas_Distrito ON dbo.Mesas (distrito);
END;
GO

-- 2. Índice para búsqueda por colegio
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mesas_Colegio' AND object_id = OBJECT_ID('dbo.Mesas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Mesas_Colegio ON dbo.Mesas (colegio);
END;
GO

-- 3. Índice para búsqueda por numero_mesa
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mesas_NumeroMesa' AND object_id = OBJECT_ID('dbo.Mesas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Mesas_NumeroMesa ON dbo.Mesas (numero_mesa);
END;
GO

-- 4. Índice combinado para Colegio + Numero_Mesa
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mesas_Colegio_NumeroMesa' AND object_id = OBJECT_ID('dbo.Mesas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Mesas_Colegio_NumeroMesa ON dbo.Mesas (colegio, numero_mesa);
END;
GO

-- 5. Índice para coordenadas de geolocalización
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mesas_Coordenadas' AND object_id = OBJECT_ID('dbo.Mesas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Mesas_Coordenadas ON dbo.Mesas (latitud, longitud);
END;
GO
