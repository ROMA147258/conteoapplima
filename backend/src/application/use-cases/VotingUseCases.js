const sqlRepo = require('../../infrastructure/repositories/PostgresRepository');

class VotingUseCases {
  async handleAction(payload) {
    const action = payload.action;
    if (!action) {
      return { success: false, message: 'No se especificó ninguna acción' };
    }

    switch (action) {
      case 'login':
        return await sqlRepo.login(payload);

      case 'registrar_votos':
        return await sqlRepo.registrarVotos(payload);

      case 'registrar_asistencia':
        return await sqlRepo.registrarAsistencia(payload);

      case 'confirmar_asistencia_llegada':
        return await sqlRepo.confirmarAsistenciaLlegada(payload);

      case 'confirmar_coordinador':
        return await sqlRepo.confirmarCoordinador(payload);

      case 'obtener_usuarios':
      case 'read':
        return await sqlRepo.obtenerUsuarios();

      case 'obtener_asistencia':
        return await sqlRepo.obtenerAsistencia();

      case 'obtener_coordinadores':
        return await sqlRepo.obtenerCoordinadores();

      case 'obtener_asistencia_por_dni':
        return await sqlRepo.obtenerAsistenciaPorDni(payload.dni);

      case 'obtener_confirmaciones_por_colegio':
        return await sqlRepo.obtenerConfirmacionesPorColegio(payload.colegio || payload.local);

      case 'obtener_personeros_por_colegio':
        return await sqlRepo.obtenerPersonerosPorColegio(payload);

      case 'obtener_mesas':
        return await sqlRepo.obtenerMesas();

      case 'obtener_coordenadas_colegio':
        return await sqlRepo.obtenerCoordenadasColegio(payload);

      case 'obtener_reporte':
      case 'read_reporte':
        return await sqlRepo.obtenerReporte();

      case 'obtener_config_ocr':
        return await sqlRepo.obtenerConfigOcr();

      default:
        return { success: false, message: `Acción '${action}' no reconocida` };
    }
  }
}

module.exports = new VotingUseCases();
