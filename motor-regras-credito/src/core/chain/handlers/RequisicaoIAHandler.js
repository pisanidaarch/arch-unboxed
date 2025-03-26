// src/core/chain/handlers/RequisicaoIAHandler.js
const { restaurarMetodosCenario } = require('../../../utils/CenarioHelper');
const LogService = require('../../../service/LogService');

class RequisicaoIAHandler {
  constructor(iaAdapter) {
    this.iaAdapter = iaAdapter;
    this.logService = new LogService();
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
      this.logService.registrarConsultaExterna('IA', cenarioProcessado.clienteId, true);
      console.log(`Consultando IA para o cliente ${cenarioProcessado.clienteId} - Valor: ${cenarioProcessado.valorCredito}`);
      
      const resultadoIA = await this.iaAdapter.avaliarCredito(cenarioProcessado);
      cenarioProcessado.resultadoIA = resultadoIA;

      // Processar o resultado com base no código retornado pela IA (0, 1 ou 2)
      if (resultadoIA.analiseManual) {
        // Caso 2: Análise manual
        cenarioProcessado.precisaAnaliseManual = true;
        cenarioProcessado.motivoAnaliseManual = resultadoIA.justificativa || 'IA solicitou análise humana';
        
        cenarioProcessado.adicionarResultadoAvaliacao(
          "IA_SOLICITA_ANALISE",
          false,
          resultadoIA.justificativa || "A IA solicitou análise humana para este caso"
        );
        
        return cenarioProcessado;
      } else if (resultadoIA.aprovado) {
        // Caso 1: Aprovação
        cenarioProcessado.adicionarResultadoAvaliacao(
          "IA",
          true,
          resultadoIA.justificativa || "IA aprovou o crédito com alta confiança"
        );
      } else {
        // Caso 0: Reprovação
        cenarioProcessado.adicionarResultadoAvaliacao(
          "IA",
          false,
          resultadoIA.justificativa || "IA rejeitou o crédito com alta confiança"
        );
        cenarioProcessado.regraFalhou = true;
      }
    } catch (error) {
      console.error('[RequisicaoIAHandler] Erro ao consultar IA:', error);
      this.logService.registrarConsultaExterna('IA', cenarioProcessado.clienteId, false);
      
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