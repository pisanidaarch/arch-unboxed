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
    
    console.log(`RequisicaoIAHandler: Processando cenário para cliente ${cenarioProcessado.clienteId}`);
    console.log(`Status cenário: regraFalhou=${cenarioProcessado.regraFalhou}, precisaAnaliseManual=${cenarioProcessado.precisaAnaliseManual}`);

    try {
      this.logService.registrarConsultaExterna('IA', cenarioProcessado.clienteId, true);
      console.log(`Consultando IA para o cliente ${cenarioProcessado.clienteId} - Valor: ${cenarioProcessado.valorCredito}`);
      
      // Chamar a IA para avaliação
      const resultadoIA = await this.iaAdapter.avaliarCredito(cenarioProcessado);
      
      // Armazenar o resultado da IA no cenário
      cenarioProcessado.resultadoIA = resultadoIA;

      console.log(`Resultado IA: aprovado=${resultadoIA.aprovado}, analiseManual=${resultadoIA.analiseManual}, confiança=${resultadoIA.confianca}`);
      console.log(`Justificativa IA: ${resultadoIA.justificativa}`);

      // Adicionar o resultado da IA como uma avaliação
      cenarioProcessado.adicionarResultadoAvaliacao(
        "AVALIACAO_IA",
        resultadoIA.aprovado && !resultadoIA.analiseManual,
        resultadoIA.justificativa || 
          (resultadoIA.aprovado 
            ? "IA recomendou aprovação" 
            : (resultadoIA.analiseManual 
                ? "IA recomendou análise manual" 
                : "IA recomendou reprovação"))
      );
      
      // Se a IA indicou análise manual, marcar no cenário
      if (resultadoIA.analiseManual) {
        cenarioProcessado.precisaAnaliseManual = true;
        cenarioProcessado.motivoAnaliseManual = "Recomendação de análise manual pela IA";
      } 
      // Se a IA reprovação e ainda não tinha reprovado, marcar como reprovado
      else if (!resultadoIA.aprovado && !cenarioProcessado.regraFalhou) {
        cenarioProcessado.regraFalhou = true;
      }
      
      console.log(`RequisicaoIAHandler: Processamento concluído com status: ${
        resultadoIA.analiseManual ? "ANALISE_MANUAL" : (resultadoIA.aprovado ? "APROVADO" : "REPROVADO")
      }`);
    } catch (error) {
      console.error('[RequisicaoIAHandler] Erro ao consultar IA:', error);
      this.logService.registrarConsultaExterna('IA', cenarioProcessado.clienteId, false);
      
      // Registramos o erro da IA
      cenarioProcessado.adicionarResultadoAvaliacao(
        "ERRO_IA",
        false,
        "Erro ao consultar sistema de IA: " + error.message
      );
      
      // Em caso de erro na IA, encaminhar para análise manual
      cenarioProcessado.precisaAnaliseManual = true;
      cenarioProcessado.motivoAnaliseManual = "Erro ao consultar IA";
    }

    return cenarioProcessado;
  }
}

module.exports = RequisicaoIAHandler;