class Arrival {
  constructor({
    nombre,
    dni,
    distrito,
    colegio,
    mesa,
    latitud,
    longitud,
    distanciaMetros = 0,
    radioPermitido = 50,
    estado = 'CONFIRMADO 2DA LLEGADA',
    fechaRegistro = new Date()
  }) {
    this.nombre = nombre;
    this.dni = (dni || '').toString().trim();
    this.distrito = distrito;
    this.colegio = colegio;
    this.mesa = (mesa || '').toString().trim();
    this.latitud = latitud;
    this.longitud = longitud;
    this.distanciaMetros = parseFloat(distanciaMetros) || 0;
    this.radioPermitido = parseInt(radioPermitido, 10) || 50;
    this.estado = estado;
    this.fechaRegistro = fechaRegistro;
  }

  isWithinRadius() {
    return this.distanciaMetros <= this.radioPermitido;
  }
}

module.exports = Arrival;
