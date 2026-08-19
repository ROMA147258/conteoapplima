export const opencvService = {
  isOpenCvReady() {
    return typeof cv !== 'undefined' && cv.Mat;
  },

  preprocessDocumentImage(imageElement) {
    if (!this.isOpenCvReady()) {
      console.warn('[OpenCV] OpenCV.js no está listo o no está cargado');
      return null;
    }

    try {
      const src = cv.imread(imageElement);
      const dst = new cv.Mat();
      cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
      cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
      
      const canvas = document.createElement('canvas');
      cv.imshow(canvas, dst);
      
      src.delete();
      dst.delete();
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('[OpenCV] Error procesando imagen:', e);
      return null;
    }
  }
};
