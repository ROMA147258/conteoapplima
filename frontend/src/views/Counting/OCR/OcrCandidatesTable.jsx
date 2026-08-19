import React from 'react';
import { ProvincialTable } from '../Manual/ProvincialTable';
import { DistrictTable } from '../Manual/DistrictTable';

export const OcrCandidatesTable = ({
  ubicacion,
  candidatosProvincial,
  candidatosDistrital,
  alcaldeProvincial,
  alcaldeDistrital,
  ocrVotes
}) => {
  return (
    <div className="table-container glass" id="ocr-table-container">
      <div className="table-header-grid">
        <div>Partido</div>
        <div>Alcalde</div>
        <div className="text-center">Votos Imagen</div>
      </div>

      <div className="table-body-grid" id="ocr-candidates-table-body">
        <ProvincialTable
          candidatos={candidatosProvincial}
          alcaldeActual={alcaldeProvincial}
          votes={ocrVotes.provincial}
          isReadOnly={true}
        />
        <DistrictTable
          ubicacion={ubicacion}
          candidatos={candidatosDistrital}
          alcaldeActual={alcaldeDistrital}
          votes={ocrVotes.distrital}
          isReadOnly={true}
        />
      </div>
    </div>
  );
};
