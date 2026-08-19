-- =====================================================================
-- MIGRACIÓN 006: Creación de Tabla dbo.PersoneroMesa (Relación Estricta 1:1)
-- Base de Datos: conteo
-- =====================================================================

USE conteo;
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'PersoneroMesa')
BEGIN
    CREATE TABLE dbo.PersoneroMesa (
        id INT IDENTITY(1,1) PRIMARY KEY,
        personero_id INT NULL,
        personero_dni VARCHAR(50) NOT NULL,
        mesa_id INT NULL,
        numero_mesa VARCHAR(50) NOT NULL,
        fecha_asignacion DATETIME DEFAULT GETDATE(),
        estado VARCHAR(50) DEFAULT 'ASIGNADO',
        
        -- Restricciones UNIQUE para garantizar que:
        -- 1. Un personero solo puede tener UNA mesa
        -- 2. Una mesa solo puede tener UN personero
        CONSTRAINT UQ_PersoneroMesa_PersoneroDni UNIQUE (personero_dni),
        CONSTRAINT UQ_PersoneroMesa_NumeroMesa UNIQUE (numero_mesa)
    );

    CREATE NONCLUSTERED INDEX IX_PersoneroMesa_Dni ON dbo.PersoneroMesa (personero_dni);
    CREATE NONCLUSTERED INDEX IX_PersoneroMesa_Mesa ON dbo.PersoneroMesa (numero_mesa);
END;
GO
