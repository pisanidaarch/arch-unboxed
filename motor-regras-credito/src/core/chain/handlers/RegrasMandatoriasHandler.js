// src/core/chain/handlers/RegrasMandatoriasHandler.js
const { restaurarMetodosCenario } = require('../../../utils/CenarioHelper');

class RegrasMandatoriasHandler {
  constructor(specifications) {
    this.specifications = specifications;
  }

  async processar(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    const cenarioProcessado = restaurarMetodosCenario(cenario);

    for (const spec of this.specifications) {
      const resultado = await spec.isSatisfiedBy(cenarioProcessado);
      
      cenarioProcessado.adicionarResultadoAvaliacao(
        spec.getNome(), 
        resultado, 
        spec.getDescricao()
      );

      // Se uma regra mandatória falhar, já pode encerrar
      if (!resultado) {
        cenarioProcessado.regraFalhou = true;
        break;
      }
    }

    return cenarioProcessado;
  }
}

module.exports = RegrasMandatoriasHandler;