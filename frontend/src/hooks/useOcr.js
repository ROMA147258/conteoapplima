import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ocrPipeline } from '../services/ocr/ocrPipeline';

export const useOcr = () => {
  const { ollamaHost, ollamaModel, currentUser, setCurrentVotes, setOcrVotes, setOcrRawDetail, showToast } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ show: false, percentage: 0, status: '' });

  const processImages = async (imgList) => {
    if (imgList.length === 0) return null;
    setIsProcessing(true);
    setOcrProgress({ show: true, percentage: 10, status: 'Iniciando escáner...' });

    try {
      const userDist = currentUser ? currentUser.ubicacion : 'Lima';
      let combinedRawText = '';

      for (let i = 0; i < imgList.length; i++) {
        const step = Math.round(((i + 1) / imgList.length) * 80);
        setOcrProgress({ show: true, percentage: 10 + step, status: `Analizando con Ollama Local imagen ${i + 1}/${imgList.length}...` });

        const result = await ocrPipeline.processActaImage(imgList[i], userDist, {
          ollamaHost,
          ollamaModel
        });
        combinedRawText += (combinedRawText ? '\n\n' : '') + result.rawText;
      }

      setOcrProgress({ show: true, percentage: 95, status: 'Calculando votos...' });
      const parsedVotes = ocrPipeline.parseOcrTextToVotes(combinedRawText, userDist);

      setOcrRawDetail(combinedRawText);
      setOcrProgress({ show: true, percentage: 100, status: '¡Procesamiento completo!' });
      showToast('Acta escaneada y procesada correctamente.', 'success');

      return {
        rawText: combinedRawText,
        votes: parsedVotes
      };
    } catch (err) {
      console.error(err);
      showToast('Error durante el procesamiento del acta.', 'error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const applyOcrVotes = (parsedVotes) => {
    if (!parsedVotes) return;

    setCurrentVotes(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      Object.keys(parsedVotes.provincial || {}).forEach(k => {
        if (parsedVotes.provincial[k] !== undefined) {
          updated.provincial[k] = parsedVotes.provincial[k];
        }
      });
      Object.keys(parsedVotes.distrital || {}).forEach(k => {
        if (parsedVotes.distrital[k] !== undefined) {
          updated.distrital[k] = parsedVotes.distrital[k];
        }
      });
      return updated;
    });

    setOcrVotes(parsedVotes);
    showToast('Votos del escaneo aplicados exitosamente a la mesa.', 'success');
  };

  return {
    isProcessing,
    ocrProgress,
    processImages,
    applyOcrVotes
  };
};
