import assert from 'assert';

// 1. Helpers test
import {
  calcularDistanciaMetros,
  obtenerMinutosActualesLimaBogota,
  isCountingTimeEnabled,
  isLlegadaButtonUnlocked,
  extractJsonFromString
} from '../src/utils/helpers.js';

// 2. OCR parser test
import { procesarTextoOCR } from '../src/services/ocrPipeline.js';

console.log('\n======================================================');
console.log('🧪 EJECUTANDO PRUEBAS DE LÓGICA FRONTEND (ESM)');
console.log('======================================================\n');

// Test Haversine
const dist = calcularDistanciaMetros(-12.0254, -76.9189, -12.0260, -76.9195);
assert.ok(dist > 0 && dist < 500, `Distancia calculada: ${dist}`);
console.log(`  ✅ [PASSED] Haversine formula calculation (${Math.round(dist)}m)`);

// Test JSON parser
const sampleJson = extractJsonFromString('```json\n{"success": true, "votos": 45}\n```');
assert.strictEqual(sampleJson.success, true);
assert.strictEqual(sampleJson.votos, 45);
console.log('  ✅ [PASSED] extractJsonFromString markdown extractor');

// Test 1: OCR Text Parser con Matriz Multicolumna
const sampleActaText = `
ACTA ELECTORAL - ELECCIONES MUNICIPALES
LIMA METROPOLITANA | ATE DISTRITAL
FUERZA POPULAR | 45 | 38
JUNTOS POR EL PERU | 30 | 25
SOMOS PERU | 50 | 60
FREPAP | 20 | 15
PARTIDO VERDE | 10 | 8
PARTIDO MORADO | 15 | 12
VOTOS NULOS | 5 | 3
VOTOS EN BLANCO | 2 | 1
VOTOS IMPUGNADOS | 4 | 2
`;
const parsedVotes = procesarTextoOCR(sampleActaText, 'Ate');
assert.ok(parsedVotes.provincial);
assert.ok(parsedVotes.distrital);
assert.strictEqual(parsedVotes.provincial.FP, 45);
assert.strictEqual(parsedVotes.distrital.FP, 38);
assert.strictEqual(parsedVotes.provincial["SOMOS PERU"], 50);
assert.strictEqual(parsedVotes.distrital["SOMOS PERU"], 60);
assert.strictEqual(parsedVotes.provincial.BLANCO, 2);
assert.strictEqual(parsedVotes.distrital.BLANCO, 1);
assert.strictEqual(parsedVotes.provincial.IMPUGNADOS, 4);
assert.strictEqual(parsedVotes.distrital.IMPUGNADOS, 2);
console.log('  ✅ [PASSED] OCR Text to Votes multi-column parser (including BLANCO & IMPUGNADOS)');

// Test 2: OCR Text Parser con Lista de Columna Única (Caso Real de Usuario)
const sampleSingleCol = `
SOMOS PERÚ              30
RENOVACIÓN POPULAR      10
AVANZA PAÍS              7
PODEMOS PERÚ             1
FREPAP                  17
JUNTOS POR EL PERÚ      25
FUERZA POPULAR          30
PPC                     91
---------------------------
TOTAL                  211
`;
const singleColVotes = procesarTextoOCR(sampleSingleCol, 'Pueblo Libre');
assert.strictEqual(singleColVotes.provincial["SOMOS PERU"], 30);
assert.strictEqual(singleColVotes.provincial.RENOVACION, 10);
assert.strictEqual(singleColVotes.provincial["AVANZA PAIS"], 7);
assert.strictEqual(singleColVotes.provincial.PODEMOS, 1);
assert.strictEqual(singleColVotes.provincial.FREPAP, 17);
assert.strictEqual(singleColVotes.provincial.JP, 25);
assert.strictEqual(singleColVotes.provincial.FP, 30);
assert.strictEqual(singleColVotes.provincial.PPC, 91);

assert.strictEqual(singleColVotes.distrital["SOMOS PERU"], 30);
assert.strictEqual(singleColVotes.distrital.RENOVACION, 10);
assert.strictEqual(singleColVotes.distrital["AVANZA PAIS"], 7);
assert.strictEqual(singleColVotes.distrital.PODEMOS, 1);
assert.strictEqual(singleColVotes.distrital.FREPAP, 17);
assert.strictEqual(singleColVotes.distrital.JP, 25);
assert.strictEqual(singleColVotes.distrital.FP, 30);
assert.strictEqual(singleColVotes.distrital.PPC, 91);

const sumProv = Object.values(singleColVotes.provincial).reduce((a, b) => a + b, 0);
assert.strictEqual(sumProv, 211);
console.log('  ✅ [PASSED] OCR Single-column List Parser (incluyendo Renovación Popular y suma total de 211 votos)');

console.log('\n======================================================');
console.log('🎉 TODAS LAS PRUEBAS DE LÓGICA FRONTEND PASARON');
console.log('======================================================\n');
