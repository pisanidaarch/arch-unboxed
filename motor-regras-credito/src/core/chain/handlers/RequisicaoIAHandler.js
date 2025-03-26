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

    // MODIFICAÇÃO: Removida a verificação de regraFalhou e precisaAnaliseManual
    // para permitir que a IA sempre seja consultada
    
    console.log(`RequisicaoIAHandler: Processando cenário para cliente ${cenarioProcessado.clienteId}`);
    console.log(`Status cenário: regraFalhou=${cenarioProcessado.regraFalhou}, precisaAnaliseManual=${cenarioProcessado.precisaAnaliseManual}`);

    try {
      this.logService.registrarConsultaExterna('IA', cenarioProcessado.clienteId, true);
      console.log(`Consultando IA para o cliente ${cenarioProcessado.clienteId} - Valor: ${cenarioProcessado.valorCredito}`);
      
      const resultadoIA = await this.iaAdapter.avaliarCredito(cenarioProcessado);
      cenarioProcessado.resultadoIA = resultadoIA;

      console.log(`Resultado IA: aprovado=${resultadoIA.aprovado}, analiseManual=${resultadoIA.analiseManual}, confiança=${resultadoIA.confianca}`);
      console.log(`Justificativa IA: ${resultadoIA.justificativa}`);

      // MODIFICAÇÃO: Não alteramos mais o estado do cenário com base na resposta da IA
      // apenas adicionamos o resultado para referência
      // A lógica para definir o status final acontece na Chain of Responsibility
      
      // Adicionamos a avaliação da IA nos resultados para registro
      cenarioProcessado.adicionarResultadoAvaliacao(
        "RESULTADO_IA",
        resultadoIA.aprovado && !resultadoIA.analiseManual,
        resultadoIA.justificativa || 
        (resultadoIA.aprovado 
          ? "IA recomendou aprovação" 
          : (resultadoIA.analiseManual 
              ? "IA recomendou análise manual" 
              : "IA recomendou reprovação"))
      );
      
      console.log(`RequisicaoIAHandler: Processamento concluído`);
    } catch (error) {
      console.error('[RequisicaoIAHandler] Erro ao consultar IA:', error);
      this.logService.registrarConsultaExterna('IA', cenarioProcessado.clienteId, false);
      
      // Registramos o erro da IA
      cenarioProcessado.adicionarResultadoAvaliacao(
        "ERRO_IA",
        false,
        "Erro ao consultar sistema de IA: " + error.message
      );
      
      // Não definimos precisaAnaliseManual aqui, isso será feito na Chain
    }

    return cenarioProcessado;
  }
}

module.exports = RequisicaoIAHandler;