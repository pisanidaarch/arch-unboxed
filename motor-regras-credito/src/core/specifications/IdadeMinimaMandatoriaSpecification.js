// src/core/specifications/IdadeMinimaMandatoriaSpecification.js
const Specification = require('./Specification');

class IdadeMinimaMandatoriaSpecification extends Specification {
  constructor(idadeMinima) {
    super();
    this.idadeMinima = idadeMinima;
  }

  isSatisfiedBy(cenario) {
    const dadosCliente = cenario.getDadosPorTipo("DADOS_CLIENTE");
    const idade = dadosCliente?.idade;

    return idade != null && idade >= this.idadeMinima;
  }

  getNome() {
    return "IDADE_MINIMA";
  }

  getDescricao() {
    return `Idade mínima de ${this.idadeMinima} anos`;
  }
}

module.exports = IdadeMinimaMandatoriaSpecification;