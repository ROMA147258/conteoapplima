const fs = require('fs');
const path = require('path');
const env = require('../../config/env');
const IConfigRepository = require('../../domain/repositories/IConfigRepository');

class SqlConfigRepository extends IConfigRepository {
  getConfig() {
    const configPath = path.resolve(__dirname, '../../../config.json');
    let cfg = {
      apiUrl: '/api/voto-real',
      ocrProvider: env.OCR_PROVIDER || 'gemini',
      geminiModel: 'gemini-2.5-flash'
    };

    if (fs.existsSync(configPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        cfg = { ...cfg, ...saved };
      } catch (e) {}
    }

    return cfg;
  }

  saveConfig(data) {
    const configPath = path.resolve(__dirname, '../../../config.json');
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, message: 'Configuración guardada correctamente.' };
  }
}

module.exports = new SqlConfigRepository();
