// src/entity/ResultadoIA.js

class ResultadoIA {
  constructor(aprovado, justificativa, confianca, analiseManual = false) {
    this.aprovado = aprovado;
    this.justificativa = justificativa;
    this.confianca = confianca;
    this.analiseManual = analiseManual;
  }
}

module.exports = ResultadoIA;