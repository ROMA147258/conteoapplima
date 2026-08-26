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

// Test OCR Text Parser
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

console.log('\n======================================================');
console.log('🎉 TODAS LAS PRUEBAS DE LÓGICA FRONTEND PASARON');
console.log('======================================================\n');
