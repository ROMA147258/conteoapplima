class Vote {
  constructor({
    mesa,
    origen = 'MANUAL',
    dni,
    personero,
    departamento = 'Lima',
    provincia = 'Lima',
    ubicacion,
    colegio,
    provincial = {},
    distrital = {},
    votosNulos = 0,
    votosVacios = 0,
    votosDistNulos = 0,
    votosDistVacios = 0
  }) {
    this.mesa = (mesa || '').toString().trim();
    this.origen = (origen || 'MANUAL').toUpperCase();
    this.dni = dni;
    this.personero = personero;
    this.departamento = departamento;
    this.provincia = provincia;
    this.ubicacion = ubicacion;
    this.colegio = colegio;
    this.provincial = provincial;
    this.distrital = distrital;
    this.votosNulos = parseInt(votosNulos, 10) || 0;
    this.votosVacios = parseInt(votosVacios, 10) || 0;
    this.votosDistNulos = parseInt(votosDistNulos, 10) || 0;
    this.votosDistVacios = parseInt(votosDistVacios, 10) || 0;
  }

  calculateProvincialTotal() {
    let sum = 0;
    Object.values(this.provincial).forEach(v => {
      const num = typeof v === 'object' ? parseInt(v.votos, 10) : parseInt(v, 10);
      if (!isNaN(num)) sum += num;
    });
    return sum + this.votosNulos + this.votosVacios;
  }

  calculateDistritalTotal() {
    let sum = 0;
    Object.values(this.distrital).forEach(v => {
      const num = typeof v === 'object' ? parseInt(v.votos, 10) : parseInt(v, 10);
      if (!isNaN(num)) sum += num;
    });
    return sum + this.votosDistNulos + this.votosDistVacios;
  }
}

module.exports = Vote;
