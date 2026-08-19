-- =====================================================================
-- MIGRACIÓN 002: Índices para Alta Concurrencia y Búsquedas Rápidas
-- =====================================================================

USE conteo;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios_DNI' AND object_id = OBJECT_ID('dbo.Usuarios'))
    CREATE INDEX IX_Usuarios_DNI ON dbo.Usuarios(dni);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios1_DNI' AND object_id = OBJECT_ID('dbo.Usuarios1'))
    CREATE INDEX IX_Usuarios1_DNI ON dbo.Usuarios1(dni);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Rpersoneros_DNI' AND object_id = OBJECT_ID('dbo.Rpersoneros'))
    CREATE INDEX IX_Rpersoneros_DNI ON dbo.Rpersoneros(DNI);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Rcoordinadores_DNI' AND object_id = OBJECT_ID('dbo.Rcoordinadores'))
    CREATE INDEX IX_Rcoordinadores_DNI ON dbo.Rcoordinadores(DNI);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mesas_Numero' AND object_id = OBJECT_ID('dbo.Mesas'))
    CREATE INDEX IX_Mesas_Numero ON dbo.Mesas(numero_mesa);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Asistencia_DNI' AND object_id = OBJECT_ID('dbo.Asistencia'))
    CREATE INDEX IX_Asistencia_DNI ON dbo.Asistencia(dni);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Coordinadores_PersoneroDni' AND object_id = OBJECT_ID('dbo.Coordinadores'))
    CREATE INDEX IX_Coordinadores_PersoneroDni ON dbo.Coordinadores(personero_dni);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Votos_Mesa' AND object_id = OBJECT_ID('dbo.Votos_Detalle'))
    CREATE INDEX IX_Votos_Mesa ON dbo.Votos_Detalle(numero_mesa);
GO
