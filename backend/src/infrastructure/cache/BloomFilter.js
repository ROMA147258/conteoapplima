/**
 * BloomFilter.js
 * Implementación de Filtro de Bloom de alto rendimiento basada en TypedArrays (Uint32Array)
 * y doble dispersión de Kirsch-Mitzenmacher para generar k funciones de hash independientes.
 */

class BloomFilter {
  /**
   * @param {number} expectedItems Número esperado de elementos a almacenar (ej. 50000)
   * @param {number} falsePositiveRate Tasa de falsos positivos deseada (ej. 0.001 = 0.1%)
   */
  constructor(expectedItems = 50000, falsePositiveRate = 0.001) {
    this.expectedItems = Math.max(100, expectedItems);
    this.falsePositiveRate = Math.min(Math.max(falsePositiveRate, 0.00001), 0.5);

    // Calcular tamaño óptimo en bits: m = - (n * ln(p)) / (ln(2)^2)
    const n = this.expectedItems;
    const p = this.falsePositiveRate;
    const ln2 = Math.LN2;
    const m = Math.ceil(- (n * Math.log(p)) / (ln2 * ln2));

    // Calcular número óptimo de funciones hash: k = (m / n) * ln(2)
    const k = Math.max(1, Math.round((m / n) * ln2));

    this.bitSize = m;
    this.hashCount = k;

    // Array de 32-bit integers para representar el bitset
    const arraySize = Math.ceil(this.bitSize / 32);
    this.bitArray = new Uint32Array(arraySize);
    this.itemCount = 0;
  }

  /**
   * Genera 2 hashes base de 32 bits altamente independientes usando FNV-1a y Murmur3
   * @param {string} str Elemento a hashear
   * @returns {[number, number]} [hash1, hash2]
   */
  _hashPair(str) {
    const s = (str || '').toString();
    const len = s.length;

    // 1. FNV-1a 32-bit hash
    let h1 = 0x811c9dc5;
    for (let i = 0; i < len; i++) {
      h1 ^= s.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    h1 = (h1 >>> 0);

    // 2. MurmurHash3 32-bit inspirado
    let h2 = 0x9747b28c;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;

    for (let i = 0; i < len; i++) {
      let k = s.charCodeAt(i);
      k = Math.imul(k, c1);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, c2);

      h2 ^= k;
      h2 = (h2 << 13) | (h2 >>> 19);
      h2 = (Math.imul(h2, 5) + 0xe6546b64) >>> 0;
    }
    h2 ^= len;
    h2 ^= (h2 >>> 16);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    h2 ^= (h2 >>> 13);
    h2 = Math.imul(h2, 0xc2b2ae35) >>> 0;
    h2 ^= (h2 >>> 16);

    if (h2 === 0) h2 = 1;

    return [h1, h2 >>> 0];
  }

  /**
   * Añade un elemento al filtro de Bloom
   * @param {string|number} item Elemento a insertar
   */
  add(item) {
    if (item === undefined || item === null || item === '') return;
    const [h1, h2] = this._hashPair(item);

    for (let i = 0; i < this.hashCount; i++) {
      // Doble dispersión: gi(x) = (h1 + i * h2) mod m
      const bitIndex = (h1 + Math.imul(i, h2)) >>> 0;
      const pos = bitIndex % this.bitSize;
      const arrayIndex = (pos / 32) | 0;
      const bitOffset = pos % 32;

      this.bitArray[arrayIndex] |= (1 << bitOffset);
    }
    this.itemCount++;
  }

  /**
   * Comprueba si un elemento posiblemente existe en el filtro.
   * Si retorna FALSE => 100% GARANTIZADO que NO está en el conjunto.
   * Si retorna TRUE => Probablemente está (con tasa de falso positivo < 0.1%).
   * @param {string|number} item Elemento a consultar
   * @returns {boolean}
   */
  has(item) {
    if (item === undefined || item === null || item === '') return false;
    const [h1, h2] = this._hashPair(item);

    for (let i = 0; i < this.hashCount; i++) {
      const bitIndex = (h1 + Math.imul(i, h2)) >>> 0;
      const pos = bitIndex % this.bitSize;
      const arrayIndex = (pos / 32) | 0;
      const bitOffset = pos % 32;

      if ((this.bitArray[arrayIndex] & (1 << bitOffset)) === 0) {
        return false; // Garantía matemática absoluta: No existe
      }
    }
    return true; // Posiblemente existe
  }

  /**
   * Limpia y reinicia el filtro
   */
  clear() {
    this.bitArray.fill(0);
    this.itemCount = 0;
  }

  /**
   * Retorna estadísticas del filtro
   */
  getStats() {
    return {
      itemCount: this.itemCount,
      expectedItems: this.expectedItems,
      bitSize: this.bitSize,
      hashCount: this.hashCount,
      memoryBytes: this.bitArray.byteLength,
      configuredFpRate: this.falsePositiveRate
    };
  }
}

module.exports = BloomFilter;
