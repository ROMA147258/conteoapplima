/**
 * ElectoralBloomManager.js
 * Gestor centralizado de Filtros de Bloom e índices de alta velocidad para el sistema electoral.
 * Proporciona comprobaciones O(1) en microsegundos para login, mesas y deduplicación de votos.
 */

const BloomFilter = require('./BloomFilter');
const { query } = require('../database/connection');

class ElectoralBloomManager {
  constructor() {
    // 1. Filtro de Bloom para DNIs válidos autorizados (Capacidad: 100,000, FP: 0.05%)
    this.dniFilter = new BloomFilter(100000, 0.0005);

    // 2. Filtro de Bloom para Números de Mesas electorales (Capacidad: 50,000, FP: 0.05%)
    this.mesaFilter = new BloomFilter(50000, 0.0005);

    // 3. Filtros de Bloom para control y deduplicación de votos transmitidos
    this.votoManualFilter = new BloomFilter(50000, 0.0005);
    this.votoImagenFilter = new BloomFilter(50000, 0.0005);

    // 4. Filtros de Bloom para asistencia y llegada GPS
    this.asistenciaFilter = new BloomFilter(50000, 0.0005);
    this.llegadaFilter = new BloomFilter(50000, 0.0005);

    // Caché en memoria para resolución instantánea de usuarios sin tocar disco (DNI -> Usuario)
    this.userCacheMap = new Map();

    this.isInitialized = false;
    this.lastSync = null;
    this.syncTimer = null;
  }

  /**
   * Normaliza cadenas para comparaciones robustas
   */
  normalizeText(str) {
    if (!str) return '';
    return str
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Inicializa y precarga los filtros de Bloom desde PostgreSQL
   */
  async init() {
    try {
      console.log('⚡ [BloomFilter] Inicializando Filtros de Bloom Electorales...');
      const startTime = Date.now();

      // Limpiar filtros antes de recarga
      this.dniFilter.clear();
      this.mesaFilter.clear();
      this.votoManualFilter.clear();
      this.votoImagenFilter.clear();
      this.asistenciaFilter.clear();
      this.llegadaFilter.clear();
      this.userCacheMap.clear();

      // 1. Cargar DNIs, tokens, claves y usuarios de rcoordinadoresd (Coordinador Distrital)
      try {
        const resD = await query(`
          SELECT 
            dni,
            nombres_y_apellidos AS nombre,
            COALESCE(NULLIF(rol_a_desempenar, ''), 'Coordinador Distrital') AS rol,
            COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
            COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
            '' AS mesa,
            credenciales,
            preguntas,
            token_verificacion,
            clave_acceso,
            'rcoordinadoresd' AS tabla_origen
          FROM rcoordinadoresd
        `);
        for (const row of resD.rows) {
          const dni = (row.dni || '').toString().trim();
          const token = (row.token_verificacion || '').toString().trim();
          const clave = (row.clave_acceso || '').toString().trim();

          const keys = [dni, token, clave, token.toUpperCase(), token.toLowerCase(), clave.toUpperCase(), clave.toLowerCase()].filter(Boolean);
          for (const k of keys) {
            this.dniFilter.add(k);
            this.userCacheMap.set(`key:${k.toLowerCase()}`, row);
          }
          if (dni) {
            this.userCacheMap.set(`dni:${dni}`, row);
          }
        }
      } catch (e) {
        console.warn('[BloomFilter] Error cargando rcoordinadoresd:', e.message);
      }

      // 2. Cargar DNIs, tokens, claves y usuarios de rcoordinadoresz (Coordinador Zonal)
      try {
        const resZ = await query(`
          SELECT 
            dni,
            nombres_y_apellidos AS nombre,
            COALESCE(NULLIF(rol_a_desempenar, ''), 'Coordinador Zonal') AS rol,
            COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
            COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
            '' AS mesa,
            credenciales,
            preguntas,
            token_verificacion,
            clave_acceso,
            'rcoordinadoresz' AS tabla_origen
          FROM rcoordinadoresz
        `);
        for (const row of resZ.rows) {
          const dni = (row.dni || '').toString().trim();
          const token = (row.token_verificacion || '').toString().trim();
          const clave = (row.clave_acceso || '').toString().trim();

          const keys = [dni, token, clave, token.toUpperCase(), token.toLowerCase(), clave.toUpperCase(), clave.toLowerCase()].filter(Boolean);
          for (const k of keys) {
            this.dniFilter.add(k);
            this.userCacheMap.set(`key:${k.toLowerCase()}`, row);
          }
          if (dni) {
            this.userCacheMap.set(`dni:${dni}`, row);
          }
        }
      } catch (e) {
        console.warn('[BloomFilter] Error cargando rcoordinadoresz:', e.message);
      }

      // 3. Cargar DNIs, tokens, claves y usuarios de rcoordinadores (Coordinador Local)
      try {
        const resC = await query(`
          SELECT 
            dni,
            nombres_y_apellidos AS nombre,
            COALESCE(NULLIF(rol_a_desempenar, ''), 'Coordinador de Local') AS rol,
            COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
            COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
            '' AS mesa,
            credenciales,
            preguntas,
            token_verificacion,
            clave_acceso,
            'rcoordinadores' AS tabla_origen
          FROM rcoordinadores
        `);
        for (const row of resC.rows) {
          const dni = (row.dni || '').toString().trim();
          const token = (row.token_verificacion || '').toString().trim();
          const clave = (row.clave_acceso || '').toString().trim();

          const keys = [dni, token, clave, token.toUpperCase(), token.toLowerCase(), clave.toUpperCase(), clave.toLowerCase()].filter(Boolean);
          for (const k of keys) {
            this.dniFilter.add(k);
            if (!this.userCacheMap.has(`key:${k.toLowerCase()}`)) {
              this.userCacheMap.set(`key:${k.toLowerCase()}`, row);
            }
          }
          if (dni && !this.userCacheMap.has(`dni:${dni}`)) {
            this.userCacheMap.set(`dni:${dni}`, row);
          }
        }
      } catch (e) {}

      // 4. Cargar DNIs, tokens, claves y usuarios de rpersoneros (Personeros)
      try {
        const resP = await query(`
          SELECT 
            dni,
            nombres_y_apellidos AS nombre,
            COALESCE(NULLIF(rol_a_desempenar, ''), 'Personero') AS rol,
            COALESCE(NULLIF(distrito_asignado, ''), distrito_donde_vota) AS ubicacion,
            COALESCE(NULLIF(local_de_votacion_asignado, ''), local_de_votacion) AS colegio,
            COALESCE(NULLIF(mesa_asignada, ''), mesa_de_sufragio) AS mesa,
            credenciales,
            preguntas,
            token_verificacion,
            clave_acceso,
            'rpersoneros' AS tabla_origen
          FROM rpersoneros
        `);
        for (const row of resP.rows) {
          const dni = (row.dni || '').toString().trim();
          const token = (row.token_verificacion || '').toString().trim();
          const clave = (row.clave_acceso || '').toString().trim();
          const mesa = (row.mesa || '').toString().trim();

          const keys = [dni, token, clave, token.toUpperCase(), token.toLowerCase(), clave.toUpperCase(), clave.toLowerCase()].filter(Boolean);
          for (const k of keys) {
            this.dniFilter.add(k);
            if (!this.userCacheMap.has(`key:${k.toLowerCase()}`)) {
              this.userCacheMap.set(`key:${k.toLowerCase()}`, row);
            }
          }
          if (dni && !this.userCacheMap.has(`dni:${dni}`)) {
            this.userCacheMap.set(`dni:${dni}`, row);
          }
          if (mesa) {
            this.mesaFilter.add(mesa);
          }
        }
      } catch (e) {}

      // 5. Cargar catálogo oficial de Mesas
      try {
        const resMesas = await query('SELECT numero_mesa FROM mesas WHERE numero_mesa IS NOT NULL');
        for (const row of resMesas.rows) {
          const m = (row.numero_mesa || '').toString().trim();
          if (m) this.mesaFilter.add(m);
        }
      } catch (e) {}

      // 5. Cargar estados de votos transmitidos (votos_detalle)
      try {
        const resVotos = await query('SELECT dni, numero_mesa, origen FROM votos_detalle');
        for (const row of resVotos.rows) {
          const dni = (row.dni || '').toString().trim();
          const mesa = (row.numero_mesa || '').toString().trim();
          const origen = (row.origen || 'MANUAL').toString().trim().toUpperCase();

          if (origen === 'MANUAL') {
            if (dni) this.votoManualFilter.add(dni);
            if (mesa) this.votoManualFilter.add(mesa);
            if (dni) this.votoManualFilter.add(`${dni}_MANUAL`);
          } else if (origen === 'IMAGEN') {
            if (dni) this.votoImagenFilter.add(dni);
            if (mesa) this.votoImagenFilter.add(mesa);
            if (dni) this.votoImagenFilter.add(`${dni}_IMAGEN`);
          }
        }
      } catch (e) {}

      // 6. Cargar estados de Asistencia y Llegada
      try {
        const resAsis = await query('SELECT DISTINCT dni FROM asistencia WHERE dni IS NOT NULL');
        for (const row of resAsis.rows) {
          const dni = (row.dni || '').toString().trim();
          if (dni) this.asistenciaFilter.add(dni);
        }

        const resLleg = await query('SELECT DISTINCT dni FROM asistenciallegada WHERE dni IS NOT NULL');
        for (const row of resLleg.rows) {
          const dni = (row.dni || '').toString().trim();
          if (dni) this.llegadaFilter.add(dni);
        }
      } catch (e) {}

      this.isInitialized = true;
      this.lastSync = new Date();
      const elapsed = Date.now() - startTime;

      console.log(`✅ [BloomFilter] Filtros Electorales listos en ${elapsed}ms:`);
      console.log(`   - DNIs cargados en Bloom & Index: ${this.dniFilter.itemCount} (${this.userCacheMap.size} registros)`);
      console.log(`   - Mesas cargadas en Bloom: ${this.mesaFilter.itemCount}`);
      console.log(`   - Votos Manuales registrados: ${this.votoManualFilter.itemCount}`);
      console.log(`   - Votos Imagen registrados: ${this.votoImagenFilter.itemCount}`);

      // Iniciar sincronización periódica cada 5 minutos
      if (!this.syncTimer) {
        this.syncTimer = setInterval(() => {
          this.init().catch(err => console.warn('[BloomFilter] Error en sincronización periódica:', err.message));
        }, 5 * 60 * 1000);
      }

      return true;
    } catch (err) {
      console.warn('⚠️ [BloomFilter] Error inicializando filtros:', err.message);
      return false;
    }
  }

  /**
   * Consulta ultrarrápida si un DNI, Token o Clave posiblemente existe
   * @param {string} identifier 
   * @returns {boolean}
   */
  hasDni(identifier) {
    if (!this.isInitialized) return true; // Si aún no inicializó, permitir paso a BD
    const cleanId = (identifier || '').toString().trim();
    if (!cleanId) return false;
    return this.dniFilter.has(cleanId) || this.dniFilter.has(cleanId.toLowerCase()) || this.dniFilter.has(cleanId.toUpperCase());
  }

  /**
   * Obtiene datos del usuario en memoria si está indexado por DNI, Token o Clave
   * @param {string} identifier 
   */
  getUserByDni(identifier) {
    const cleanId = (identifier || '').toString().trim();
    if (!cleanId) return null;
    return (
      this.userCacheMap.get(`key:${cleanId.toLowerCase()}`) ||
      this.userCacheMap.get(`dni:${cleanId}`) ||
      null
    );
  }

  /**
   * Consulta ultrarrápida si una mesa posiblemente existe
   * @param {string} mesa 
   * @returns {boolean}
   */
  hasMesa(mesa) {
    if (!this.isInitialized) return true;
    const cleanMesa = (mesa || '').toString().trim();
    if (!cleanMesa) return false;
    return this.mesaFilter.has(cleanMesa);
  }

  /**
   * Consulta si un DNI o Mesa ya envió votos manuales
   */
  hasVotoManual(dni) {
    if (!this.isInitialized) return false;
    const cleanDni = (dni || '').toString().trim();
    return Boolean(cleanDni && this.votoManualFilter.has(cleanDni));
  }

  /**
   * Consulta si un DNI ya envió votos por imagen/OCR
   */
  hasVotoImagen(dni) {
    if (!this.isInitialized) return false;
    const cleanDni = (dni || '').toString().trim();
    return Boolean(cleanDni && this.votoImagenFilter.has(cleanDni));
  }

  /**
   * Actualización incremental al registrar un nuevo voto
   */
  recordVoteSubmission(dni, mesa, origen) {
    const cleanDni = (dni || '').toString().trim();
    const cleanMesa = (mesa || '').toString().trim();
    const cleanOrigen = (origen || 'MANUAL').toString().trim().toUpperCase();

    if (cleanMesa) this.mesaFilter.add(cleanMesa);

    if (cleanOrigen === 'IMAGEN') {
      if (cleanDni) this.votoImagenFilter.add(cleanDni);
    } else {
      if (cleanDni) this.votoManualFilter.add(cleanDni);
    }
  }

  /**
   * Actualización incremental al registrar asistencia
   */
  recordAttendance(dni) {
    const cleanDni = (dni || '').toString().trim();
    if (cleanDni) this.asistenciaFilter.add(cleanDni);
  }

  /**
   * Actualización incremental al registrar llegada GPS
   */
  recordLlegada(dni) {
    const cleanDni = (dni || '').toString().trim();
    if (cleanDni) this.llegadaFilter.add(cleanDni);
  }

  /**
   * Añade un nuevo DNI al filtro de forma dinámica
   */
  addDni(dni, userData = null) {
    const cleanDni = (dni || '').toString().trim();
    if (cleanDni) {
      this.dniFilter.add(cleanDni);
      if (userData) {
        this.userCacheMap.set(`dni:${cleanDni}`, userData);
      }
    }
  }
}

// Singleton
const electoralBloomManager = new ElectoralBloomManager();
module.exports = electoralBloomManager;
