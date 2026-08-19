-- =====================================================================
-- CONSULTAS DE AUDITORÍA Y VERIFICACIÓN ELECTORAL (VotoReal)
-- Base de Datos: conteo
-- =====================================================================

USE conteo;
GO

-- 1. Cantidad de mesas por colegio y distrito
SELECT
    distrito,
    colegio,
    COUNT(*) AS cantidad_mesas
FROM dbo.Mesas
GROUP BY distrito, colegio
ORDER BY distrito, colegio;
GO

-- 2. Listado detallado de mesas del distrito de ATE
SELECT
    id,
    numero_mesa,
    colegio,
    direccion,
    latitud,
    longitud,
    coordenadas_gps,
    estado
FROM dbo.Mesas
WHERE UPPER(distrito) = 'ATE'
ORDER BY colegio, numero_mesa;
GO

-- 3. Colegios con coordenadas completas vs pendientes
SELECT 
    CASE 
        WHEN latitud IS NOT NULL AND longitud IS NOT NULL THEN 'GEOCODIFICADO'
        ELSE 'PENDIENTE_GEOCODIFICACION'
    END AS estado_geolocalizacion,
    COUNT(DISTINCT colegio) AS total_colegios,
    COUNT(*) AS total_mesas
FROM dbo.Mesas
GROUP BY 
    CASE 
        WHEN latitud IS NOT NULL AND longitud IS NOT NULL THEN 'GEOCODIFICADO'
        ELSE 'PENDIENTE_GEOCODIFICACION'
    END;
GO

-- 4. Verificación de integridad de asignación 1:1 Personero - Mesa
SELECT 
    PM.id,
    PM.personero_dni,
    U.nombre AS personero_nombre,
    PM.numero_mesa,
    M.colegio,
    M.distrito,
    PM.fecha_asignacion,
    PM.estado
FROM dbo.PersoneroMesa PM
INNER JOIN dbo.Usuarios U ON PM.personero_dni = U.dni
INNER JOIN dbo.Mesas M ON PM.numero_mesa = M.numero_mesa;
GO
