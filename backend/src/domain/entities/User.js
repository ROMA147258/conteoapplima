class User {
  constructor({
    dni,
    nombre,
    rol = 'Personero',
    ubicacion = 'Lima',
    colegio = '',
    mesa = '',
    origenHoja = '',
    tabla_origen = ''
  }) {
    this.dni = (dni || '').toString().trim();
    this.nombre = (nombre || '').trim();
    this.rol = rol;
    this.ubicacion = ubicacion;
    this.colegio = colegio;
    this.mesa = (mesa || '').toString().trim();
    this.origenHoja = origenHoja;
    this.tabla_origen = tabla_origen || origenHoja;
  }

  isCoordinator() {
    return (
      (this.rol && this.rol.toLowerCase().includes('coordinador')) ||
      this.origenHoja === 'Usuarios1' ||
      this.origenHoja === 'Rcoordinadores'
    );
  }

  isAdmin() {
    return (
      this.dni === '99999999' ||
      this.dni === '12345678' ||
      this.rol === 'Admin' ||
      (this.nombre && this.nombre.toLowerCase().includes('admin'))
    );
  }
}

module.exports = User;
