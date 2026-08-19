export const tesseractService = {
  async recognizeImage(imageSrc) {
    if (typeof Tesseract === 'undefined') {
      console.warn('[Tesseract] Tesseract.js no está cargado');
      return '';
    }
    try {
      const result = await Tesseract.recognize(imageSrc, 'spa', {
        logger: () => {}
      });
      return result.data.text || '';
    } catch (e) {
      console.warn('[Tesseract] Error en reconocimiento:', e);
      return '';
    }
  }
};
