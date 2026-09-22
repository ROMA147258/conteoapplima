#!/usr/bin/env node
/**
 * Herramienta Forense de Verificación y Extracción de Marcas de Agua
 * Esteganografía de Ancho Cero (Zero-Width Steganography)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Delimitadores y caracteres de ancho cero
const ZW_ZERO = '\u200B';   // Zero-width space -> '0'
const ZW_ONE = '\u200C';    // Zero-width non-joiner -> '1'
const ZW_SEP = '\u200D';    // Zero-width joiner -> separador de bytes
const ZW_MARKER = '\uFEFF'; // Zero-width no-break space (BOM) -> Marcador inicio/fin

/**
 * Codifica una cadena de texto en caracteres invisibles de ancho cero
 */
function encodeToZeroWidth(text) {
  const binaryArray = [];
  const buffer = Buffer.from(text, 'utf8');
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i].toString(2).padStart(8, '0');
    const zwByte = byte
      .split('')
      .map(bit => (bit === '1' ? ZW_ONE : ZW_ZERO))
      .join('');
    binaryArray.push(zwByte);
  }
  return ZW_MARKER + binaryArray.join(ZW_SEP) + ZW_MARKER;
}

/**
 * Decodifica una cadena con caracteres invisibles de ancho cero
 */
function decodeFromZeroWidth(content) {
  const results = [];
  const regex = new RegExp(`${ZW_MARKER}([\\u200B\\u200C\\u200D]+)${ZW_MARKER}`, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    const rawHidden = match[1];
    const byteStrings = rawHidden.split(ZW_SEP);
    const bytes = [];

    for (const bStr of byteStrings) {
      if (!bStr) continue;
      const bin = bStr
        .split('')
        .map(ch => {
          if (ch === ZW_ONE) return '1';
          if (ch === ZW_ZERO) return '0';
          return '';
        })
        .join('');
      if (bin.length === 8) {
        bytes.push(parseInt(bin, 2));
      }
    }

    if (bytes.length > 0) {
      try {
        const decodedText = Buffer.from(bytes).toString('utf8');
        results.push(decodedText);
      } catch (e) {
        // Ignorar fragmentos no válidos
      }
    }
  }

  return results;
}

/**
 * Genera un payload con firma criptográfica
 */
function createSignedPayload(authorInfo) {
  const payload = {
    owner: authorInfo.owner || 'Autor Original & Desarrollador Principal',
    project: authorInfo.project || 'Conteo de Votos Lima',
    system: 'Sistema Integral de Conteo y Monitoreo Electoral',
    issuedAt: authorInfo.issuedAt || '2026-09-22T14:00:00.000Z',
    jurisdiction: 'Lima, Perú',
    license: 'Derechos Reservados / Propiedad Intelectual Protegida'
  };

  const payloadString = JSON.stringify(payload);
  const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
  
  return {
    ...payload,
    signatureSha256: hash
  };
}

/**
 * Verifica un archivo específico
 */
function verifyFile(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[-] Archivo no encontrado: ${fullPath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const extracted = decodeFromZeroWidth(content);

  console.log(`\n======================================================`);
  console.log(`[+] Análisis Forense: ${path.basename(fullPath)}`);
  console.log(`    Ruta: ${fullPath}`);
  console.log(`======================================================`);

  if (extracted.length === 0) {
    console.log(`[-] No se detectaron marcas de agua invisibles.`);
    return false;
  }

  extracted.forEach((item, index) => {
    console.log(`\n[+] Huella Digital Encontrada #${index + 1}:`);
    try {
      const parsed = JSON.parse(item);
      console.log(`    • Propietario / Autor : ${parsed.owner}`);
      console.log(`    • Proyecto            : ${parsed.project}`);
      console.log(`    • Sistema             : ${parsed.system}`);
      console.log(`    • Fecha de Emisión    : ${parsed.issuedAt}`);
      console.log(`    • Jurisdicción        : ${parsed.jurisdiction}`);
      console.log(`    • Licencia            : ${parsed.license}`);
      console.log(`    • Firma SHA-256       : ${parsed.signatureSha256 || 'N/A'}`);

      if (parsed.signatureSha256) {
        const copy = { ...parsed };
        delete copy.signatureSha256;
        const recomputed = crypto.createHash('sha256').update(JSON.stringify(copy)).digest('hex');
        if (recomputed === parsed.signatureSha256) {
          console.log(`    ✓ ESTADO FIRMA: VÁLIDA E INTACTA (Integridad Criptográfica Verificada)`);
        } else {
          console.log(`    ✗ ESTADO FIRMA: ADVERTENCIA (Firma no coincide con el payload)`);
        }
      }
    } catch (e) {
      console.log(`    Texto plano extraído: ${item}`);
    }
  });

  return true;
}

/**
 * Escanea un directorio recursivamente
 */
function scanDirectory(dirPath, extensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json']) {
  const fullPath = path.resolve(dirPath);
  let filesFound = 0;
  let matchesCount = 0;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        continue;
      }
      const itemPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(itemPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          filesFound++;
          const content = fs.readFileSync(itemPath, 'utf8');
          const found = decodeFromZeroWidth(content);
          if (found.length > 0) {
            matchesCount++;
            console.log(`\n[!] HUELLA ENCONTRADA en: ${path.relative(fullPath, itemPath)}`);
            found.forEach(f => {
              try {
                const parsed = JSON.parse(f);
                console.log(`    -> Autor: ${parsed.owner} | Proyecto: ${parsed.project} | Fecha: ${parsed.issuedAt}`);
              } catch {
                console.log(`    -> Contenido: ${f.substring(0, 60)}...`);
              }
            });
          }
        }
      }
    }
  }

  console.log(`\nIniciando escaneo forense en: ${fullPath}...`);
  walk(fullPath);
  console.log(`\n------------------------------------------------------`);
  console.log(`Resumen de Escaneo: ${filesFound} archivos analizados, ${matchesCount} archivos con huella digital.`);
  console.log(`------------------------------------------------------\n`);
}

// CLI handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--verify' && args[1]) {
    verifyFile(args[1]);
  } else if (command === '--scan') {
    scanDirectory(args[1] || '.');
  } else if (command === '--generate-signature') {
    const payload = createSignedPayload({});
    const payloadJson = JSON.stringify(payload);
    const encoded = encodeToZeroWidth(payloadJson);
    console.log('--- PAYLOAD JSON ---');
    console.log(payloadJson);
    console.log('\n--- ENCODED ZERO-WIDTH (Invisible String) ---');
    console.log(`Longitud invisible: ${encoded.length} caracteres`);
    console.log(JSON.stringify(encoded)); // Mostrado como representación de escape
  } else {
    console.log(`
Uso de Herramienta Forense de Verificación:
  node verify_signature.js --verify <ruta_archivo>    Verifica y extrae la huella de un archivo
  node verify_signature.js --scan <directorio>        Escanea recursivamente en busca de huellas
  node verify_signature.js --generate-signature       Genera un nuevo payload firmado y codificado
`);
  }
}

module.exports = {
  encodeToZeroWidth,
  decodeFromZeroWidth,
  createSignedPayload,
  verifyFile,
  scanDirectory
};
