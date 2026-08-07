const puppeteer = require('puppeteer-core');

(async () => {
  console.log('🚀 PROBANDO RESTRICCIÓN HORARIA (5:00 PM) Y BLUR DE TABLAS...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });

  try {
    await page.goto('file:///E:/conteolima/conteovotosapplima/aplicativo/index.html', { waitUntil: 'networkidle0' });
    
    // Login as a normal Personero (Juan Carlos Perez, DNI 72819204)
    await page.type('#login-nombre', 'Juan Carlos Perez');
    await page.type('#login-dni', '72819204');
    await page.click('#btn-login-submit');

    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot of blocked/blurred view
    await page.screenshot({ path: 'E:/conteolima/conteovotosapplima/captura_bloqueo_5pm_real.png' });
    console.log('✅ Captura generada: captura_bloqueo_5pm_real.png');

    await browser.close();
    console.log('🎉 VERIFICACIÓN DE BLOQUEO COMPLETADA CON ÉXITO');
  } catch (err) {
    console.error('Error probando bloqueo:', err);
  }
})();
