import { analizarImagenActa, procesarTextoOCR } from '../ocrPipeline';

export const ocrPipeline = {
  async processActaImage(imageSrc, district, options = {}) {
    return await analizarImagenActa(imageSrc, { currentDistrict: district, ...options });
  },

  parseOcrTextToVotes(text, district) {
    return procesarTextoOCR(text, district);
  }
};
