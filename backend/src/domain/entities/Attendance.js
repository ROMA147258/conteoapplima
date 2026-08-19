class Attendance {
  constructor({
    nombre,
    dni,
    distrito,
    local,
    mesa,
    confirmacion = 'SI',
    fotoUrl = '',
    ubicacionGps = '',
    fechaHora = new Date()
  }) {
    this.nombre = nombre;
    this.dni = (dni || '').toString().trim();
    this.distrito = distrito;
    this.local = local;
    this.mesa = (mesa || '').toString().trim();
    this.confirmacion = confirmacion;
    this.fotoUrl = fotoUrl;
    this.ubicacionGps = ubicacionGps;
    this.fechaHora = fechaHora;
  }
}

module.exports = Attendance;
