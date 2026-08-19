const sqlUserRepo = require('../../../infrastructure/repositories/SqlUserRepository');

class LoginUseCase {
  constructor(userRepo = sqlUserRepo) {
    this.userRepo = userRepo;
  }

  async execute({ dni, nombre }) {
    const user = await this.userRepo.findByDniOrName(dni, nombre);
    if (user && !user.isBlocked) {
      return {
        success: true,
        status: 'success',
        usuario: user,
        user: user,
        data: user
      };
    }

    if (user && user.isBlocked) {
      return {
        success: false,
        status: 'blocked',
        message: user.message || 'Acceso Denegado: Tus credenciales se encuentran en estado Bloqueado en el sistema.'
      };
    }

    return {
      success: false,
      status: 'error',
      message: 'Usuario no encontrado. Verifica tu DNI o nombre.'
    };
  }
}

module.exports = new LoginUseCase();
