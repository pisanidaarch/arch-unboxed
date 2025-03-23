// src/core/chain/handlers/RequisicaoIAHandler.js
const { restaurarMetodosCenario } = require('../../../utils/CenarioHelper');

class RequisicaoIAHandler {
    constructor(iaAdapter) {
      this.iaAdapter = iaAdapter;
    }
  
    async processar(cenario) {
      // Restaura os métodos do cenário se estiverem faltando
      const cenarioProcessado = restaurarMetodosCenario(cenario);
  
      // Verifica se já falhou em alguma regra anterior ou precisa análise manual
      if (cenarioProcessado.regraFalhou || cenarioProcessado.precisaAnaliseManual) {
        return cenarioProcessado;
      }
  
      const resultadoIA = await this.iaAdapter.avaliarCredito(cenarioProcessado);
      cenarioProcessado.resultadoIA = resultadoIA;
  
      if (resultadoIA.aprovado) {
        cenarioProcessado.adicionarResultadoAvaliacao(
          "IA", 
          true, 
          resultadoIA.justificativa
        );
      } else {
        cenarioProcessado.adicionarResultadoAvaliacao(
          "IA", 
          false, 
          resultadoIA.justificativa
        );
        cenarioProcessado.regraFalhou = true;
      }
  
      return cenarioProcessado;
    }
  }
  
  module.exports = RequisicaoIAHandler;