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
    votosBlancos = 0,
    votosImpugnados = 0,
    votosDistNulos = 0,
    votosDistVacios = 0,
    votosDistBlancos = 0,
    votosDistImpugnados = 0
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
    this.votosBlancos = parseInt(votosBlancos || votosVacios, 10) || 0;
    this.votosVacios = this.votosBlancos;
    this.votosImpugnados = parseInt(votosImpugnados, 10) || 0;
    this.votosDistNulos = parseInt(votosDistNulos, 10) || 0;
    this.votosDistBlancos = parseInt(votosDistBlancos || votosDistVacios, 10) || 0;
    this.votosDistVacios = this.votosDistBlancos;
    this.votosDistImpugnados = parseInt(votosDistImpugnados, 10) || 0;
  }

  calculateProvincialTotal() {
    let sum = 0;
    Object.values(this.provincial).forEach(v => {
      const num = typeof v === 'object' ? parseInt(v.votos, 10) : parseInt(v, 10);
      if (!isNaN(num)) sum += num;
    });
    return sum + this.votosNulos + this.votosBlancos + this.votosImpugnados;
  }

  calculateDistritalTotal() {
    let sum = 0;
    Object.values(this.distrital).forEach(v => {
      const num = typeof v === 'object' ? parseInt(v.votos, 10) : parseInt(v, 10);
      if (!isNaN(num)) sum += num;
    });
    return sum + this.votosDistNulos + this.votosDistBlancos + this.votosDistImpugnados;
  }
}

module.exports = Vote;
