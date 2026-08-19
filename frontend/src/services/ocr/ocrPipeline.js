import { geminiService } from './geminiService';
import { opencvService } from './opencvService';
import { tesseractService } from './tesseractService';
import { procesarTextoOCR } from '../ocrPipeline';

export const ocrPipeline = {
  async processActaImage(imageSrc, apiKey, district) {
    return await geminiService.analyzeDocumentImage(imageSrc, apiKey, district);
  },

  parseOcrTextToVotes(text, district) {
    return procesarTextoOCR(text, district);
  }
};
