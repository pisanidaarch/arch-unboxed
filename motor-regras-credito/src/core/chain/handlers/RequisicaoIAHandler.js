// src/core/chain/handlers/RequisicaoIAHandler.js
const { restaurarMetodosCenario } = require('../../../utils/CenarioHelper');

class RequisicaoIAHandler {
  constructor(iaAdapter) {
    this.iaAdapter = iaAdapter;
  }

  async processar(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    const cenarioProcessado = restaurarMetodosCenario(cenario);

    // Verifica se já falhou em alguma regra anterior
    if (cenarioProcessado.regraFalhou) {
      return cenarioProcessado;
    }

    // Se já precisa análise manual por outro motivo, não consulta a IA
    if (cenarioProcessado.precisaAnaliseManual) {
      // Mas registra o motivo
      if (!cenarioProcessado.motivoAnaliseManual) {
        cenarioProcessado.motivoAnaliseManual = 'Regras dinâmicas requerem aprovação humana';
      }
      return cenarioProcessado;
    }

    try {
      const resultadoIA = await this.iaAdapter.avaliarCredito(cenarioProcessado);
      cenarioProcessado.resultadoIA = resultadoIA;

      // Verificar o nível de confiança da IA
      const confiancaMinima = 0.7; // Confiança mínima para decisão automática

      if (resultadoIA.confianca < confiancaMinima) {
        // Confiança baixa, precisa análise manual
        cenarioProcessado.precisaAnaliseManual = true;
        cenarioProcessado.motivoAnaliseManual = 'IA com baixa confiança na avaliação';
        
        cenarioProcessado.adicionarResultadoAvaliacao(
          "IA_BAIXA_CONFIANCA",
          false,
          `IA não tem confiança suficiente (${(resultadoIA.confianca * 100).toFixed(1)}%)`
        );
        
        return cenarioProcessado;
      }

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
    } catch (error) {
      console.error('[RequisicaoIAHandler] Erro ao consultar IA:', error);
      
      // Em caso de erro na IA, enviar para análise manual por segurança
      cenarioProcessado.precisaAnaliseManual = true;
      cenarioProcessado.motivoAnaliseManual = 'Erro ao consultar sistema de IA';
      
      cenarioProcessado.adicionarResultadoAvaliacao(
        "ERRO_IA",
        false,
        "Erro ao consultar sistema de IA. Encaminhado para análise manual."
      );
    }

    return cenarioProcessado;
  }
}

module.exports = RequisicaoIAHandler;