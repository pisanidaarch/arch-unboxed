// src/core/specifications/ScoreMinimoMandatorioSpecification.js
const Specification = require('./Specification');

class ScoreMinimoMandatorioSpecification extends Specification {
  constructor(scoreMinimo) {
    super();
    this.scoreMinimo = scoreMinimo;
  }

  isSatisfiedBy(cenario) {
    const dadosBureau = cenario.getDadosPorTipo("BUREAU_CREDITO");
    const score = dadosBureau?.score;

    return score != null && score >= this.scoreMinimo;
  }

  getNome() {
    return "SCORE_MINIMO";
  }

  getDescricao() {
    return `Score mínimo de ${this.scoreMinimo}`;
  }
}

module.exports = ScoreMinimoMandatorioSpecification;