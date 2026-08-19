import { getRealGeolocationFast, obtenerCoordenadasColegio, calcularDistanciaMetros } from '../services/gps/geolocationService';

export const useGeolocation = () => {
  const getCoordinates = async (timeoutMs = 6500) => {
    return await getRealGeolocationFast(timeoutMs);
  };

  const getSchoolCoordinates = (colegio, distrito) => {
    return obtenerCoordenadasColegio(colegio, distrito);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return calcularDistanciaMetros(lat1, lon1, lat2, lon2);
  };

  return {
    getCoordinates,
    getSchoolCoordinates,
    calculateDistance
  };
};
