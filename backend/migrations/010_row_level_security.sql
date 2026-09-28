-- =====================================================================
-- MIGRACIÓN 010: ROW LEVEL SECURITY (RLS) PARA POSTGRESQL (VotoReal Lima)
-- =====================================================================
-- Implementa políticas de seguridad a nivel de fila (Row Level Security)
-- 100% transparente para el Backend y Frontend existente sin romper APIs.
-- =====================================================================

-- 1. FUNCIONES AUXILIARES PARA GESTIÓN DE CONTEXTO DE SESIÓN
CREATE OR REPLACE FUNCTION set_app_user_context(
    p_dni TEXT,
    p_role TEXT,
    p_distrito TEXT DEFAULT '',
    p_colegio TEXT DEFAULT ''
) RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_dni', COALESCE(p_dni, ''), false);
    PERFORM set_config('app.current_role', COALESCE(p_role, ''), false);
    PERFORM set_config('app.current_district', COALESCE(p_distrito, ''), false);
    PERFORM set_config('app.current_school', COALESCE(p_colegio, ''), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION clear_app_user_context() RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_dni', '', false);
    PERFORM set_config('app.current_role', '', false);
    PERFORM set_config('app.current_district', '', false);
    PERFORM set_config('app.current_school', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_system() RETURNS boolean AS $$
BEGIN
    RETURN (
        NULLIF(current_setting('app.current_role', true), '') IS NULL
        OR current_setting('app.current_role', true) IN ('Admin', 'SuperAdmin', 'Sistema', 'service_role', 'postgres')
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- 2. TABLA VOTOS_DETALLE
-- =====================================================================
ALTER TABLE votos_detalle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_votos_detalle_select ON votos_detalle;
CREATE POLICY p_votos_detalle_select ON votos_detalle
FOR SELECT USING (
    is_admin_or_system()
    OR (current_setting('app.current_role', true) = 'Personero' AND dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital') AND (
        NULLIF(current_setting('app.current_district', true), '') IS NULL
        OR ubicacion ILIKE current_setting('app.current_district', true)
        OR colegio ILIKE current_setting('app.current_school', true)
    ))
);

DROP POLICY IF EXISTS p_votos_detalle_insert ON votos_detalle;
CREATE POLICY p_votos_detalle_insert ON votos_detalle
FOR INSERT WITH CHECK (
    is_admin_or_system()
    OR (current_setting('app.current_role', true) = 'Personero' AND dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital'))
);

DROP POLICY IF EXISTS p_votos_detalle_update ON votos_detalle;
CREATE POLICY p_votos_detalle_update ON votos_detalle
FOR UPDATE USING (
    is_admin_or_system()
    OR (current_setting('app.current_role', true) = 'Personero' AND dni = current_setting('app.current_user_dni', true))
);

-- =====================================================================
-- 3. TABLA ASISTENCIA
-- =====================================================================
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_asistencia_select ON asistencia;
CREATE POLICY p_asistencia_select ON asistencia
FOR SELECT USING (
    is_admin_or_system()
    OR (current_setting('app.current_role', true) = 'Personero' AND dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital') AND (
        NULLIF(current_setting('app.current_district', true), '') IS NULL
        OR distrito ILIKE current_setting('app.current_district', true)
        OR local ILIKE current_setting('app.current_school', true)
    ))
);

DROP POLICY IF EXISTS p_asistencia_insert ON asistencia;
CREATE POLICY p_asistencia_insert ON asistencia
FOR INSERT WITH CHECK (
    is_admin_or_system()
    OR (current_setting('app.current_role', true) = 'Personero' AND dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital'))
);

-- =====================================================================
-- 4. TABLA ASISTENCIALLEGADA
-- =====================================================================
ALTER TABLE asistenciallegada ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_asistenciallegada_select ON asistenciallegada;
CREATE POLICY p_asistenciallegada_select ON asistenciallegada
FOR SELECT USING (
    is_admin_or_system()
    OR (current_setting('app.current_role', true) = 'Personero' AND dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital') AND (
        NULLIF(current_setting('app.current_district', true), '') IS NULL
        OR distrito ILIKE current_setting('app.current_district', true)
        OR colegio ILIKE current_setting('app.current_school', true)
    ))
);

DROP POLICY IF EXISTS p_asistenciallegada_insert ON asistenciallegada;
CREATE POLICY p_asistenciallegada_insert ON asistenciallegada
FOR INSERT WITH CHECK (
    is_admin_or_system()
    OR (current_setting('app.current_role', true) = 'Personero' AND dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital'))
);

-- =====================================================================
-- 5. TABLA COORDINADORES
-- =====================================================================
ALTER TABLE coordinadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_coordinadores_select ON coordinadores;
CREATE POLICY p_coordinadores_select ON coordinadores
FOR SELECT USING (
    is_admin_or_system()
    OR (coordinador_dni = current_setting('app.current_user_dni', true))
    OR (personero_dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital') AND (
        NULLIF(current_setting('app.current_district', true), '') IS NULL
        OR distrito ILIKE current_setting('app.current_district', true)
        OR local ILIKE current_setting('app.current_school', true)
    ))
);

DROP POLICY IF EXISTS p_coordinadores_insert ON coordinadores;
CREATE POLICY p_coordinadores_insert ON coordinadores
FOR INSERT WITH CHECK (
    is_admin_or_system()
    OR (coordinador_dni = current_setting('app.current_user_dni', true))
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital'))
);

-- =====================================================================
-- 6. TABLAS DE IDENTIDAD Y USUARIOS (usuarios, usuarios1, rpersoneros, rcoordinadores, rcoordinadoresz)
-- =====================================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_usuarios_select ON usuarios;
CREATE POLICY p_usuarios_select ON usuarios
FOR SELECT USING (
    is_admin_or_system()
    OR dni = current_setting('app.current_user_dni', true)
    OR current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital')
);

ALTER TABLE usuarios1 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_usuarios1_select ON usuarios1;
CREATE POLICY p_usuarios1_select ON usuarios1
FOR SELECT USING (
    is_admin_or_system()
    OR dni = current_setting('app.current_user_dni', true)
    OR current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital')
);

ALTER TABLE rpersoneros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_rpersoneros_select ON rpersoneros;
CREATE POLICY p_rpersoneros_select ON rpersoneros
FOR SELECT USING (
    is_admin_or_system()
    OR dni = current_setting('app.current_user_dni', true)
    OR (current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital') AND (
        NULLIF(current_setting('app.current_district', true), '') IS NULL
        OR distrito_asignado ILIKE current_setting('app.current_district', true)
        OR local_de_votacion_asignado ILIKE current_setting('app.current_school', true)
    ))
);

ALTER TABLE rcoordinadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_rcoordinadores_select ON rcoordinadores;
CREATE POLICY p_rcoordinadores_select ON rcoordinadores
FOR SELECT USING (
    is_admin_or_system()
    OR dni = current_setting('app.current_user_dni', true)
    OR current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital')
);

ALTER TABLE rcoordinadoresz ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_rcoordinadoresz_select ON rcoordinadoresz;
CREATE POLICY p_rcoordinadoresz_select ON rcoordinadoresz
FOR SELECT USING (
    is_admin_or_system()
    OR dni = current_setting('app.current_user_dni', true)
    OR current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital')
);

-- =====================================================================
-- 7. TABLAS MAESTRAS (mesas, colegios, distritos, localesvotacion, personeromesa)
-- =====================================================================
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_mesas_select ON mesas;
CREATE POLICY p_mesas_select ON mesas FOR SELECT USING (true);
DROP POLICY IF EXISTS p_mesas_modify ON mesas;
CREATE POLICY p_mesas_modify ON mesas FOR ALL USING (is_admin_or_system()) WITH CHECK (is_admin_or_system());

ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_colegios_select ON colegios;
CREATE POLICY p_colegios_select ON colegios FOR SELECT USING (true);
DROP POLICY IF EXISTS p_colegios_modify ON colegios;
CREATE POLICY p_colegios_modify ON colegios FOR ALL USING (is_admin_or_system()) WITH CHECK (is_admin_or_system());

ALTER TABLE distritos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_distritos_select ON distritos;
CREATE POLICY p_distritos_select ON distritos FOR SELECT USING (true);
DROP POLICY IF EXISTS p_distritos_modify ON distritos;
CREATE POLICY p_distritos_modify ON distritos FOR ALL USING (is_admin_or_system()) WITH CHECK (is_admin_or_system());

ALTER TABLE localesvotacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_localesvotacion_select ON localesvotacion;
CREATE POLICY p_localesvotacion_select ON localesvotacion FOR SELECT USING (true);
DROP POLICY IF EXISTS p_localesvotacion_modify ON localesvotacion;
CREATE POLICY p_localesvotacion_modify ON localesvotacion FOR ALL USING (is_admin_or_system()) WITH CHECK (is_admin_or_system());

ALTER TABLE personeromesa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_personeromesa_select ON personeromesa;
CREATE POLICY p_personeromesa_select ON personeromesa FOR SELECT USING (
    is_admin_or_system()
    OR personero_dni = current_setting('app.current_user_dni', true)
    OR current_setting('app.current_role', true) IN ('Coordinador', 'Coordinador Zonal', 'Coordinador Distrital')
);
DROP POLICY IF EXISTS p_personeromesa_modify ON personeromesa;
CREATE POLICY p_personeromesa_modify ON personeromesa FOR ALL USING (is_admin_or_system()) WITH CHECK (is_admin_or_system());

-- =====================================================================
-- 8. TABLA AUDITLOGS
-- =====================================================================
ALTER TABLE auditlogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_auditlogs_select ON auditlogs;
CREATE POLICY p_auditlogs_select ON auditlogs FOR SELECT USING (is_admin_or_system());
DROP POLICY IF EXISTS p_auditlogs_insert ON auditlogs;
CREATE POLICY p_auditlogs_insert ON auditlogs FOR INSERT WITH CHECK (true);
