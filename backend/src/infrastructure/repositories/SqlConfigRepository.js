const fs = require('fs');
const path = require('path');
const env = require('../../config/env');
const IConfigRepository = require('../../domain/repositories/IConfigRepository');

class SqlConfigRepository extends IConfigRepository {
  getConfig() {
    const configPath = path.resolve(__dirname, '../../../config.json');
    let cfg = {
      apiUrl: `http://localhost:${env.PORT}/api/voto-real`,
      geminiApiKey: env.GEMINI_API_KEY
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
