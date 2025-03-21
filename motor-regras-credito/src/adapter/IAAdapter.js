// src/adapter/IAAdapter.js
const ResultadoIA = require('../entity/ResultadoIA');

class IAAdapter {
  constructor(iaAPI) {
    this.iaAPI = iaAPI;
  }

  async avaliarCredito(cenario) {
    try {
      // Prepara os dados para envio à IA
      const dadosParaIA = this.prepararDadosParaIA(cenario);

      // Chama a API de IA
      const resultadoAPI = await this.iaAPI.avaliar(dadosParaIA);

      return new ResultadoIA(
        resultadoAPI.aprovado,
        resultadoAPI.justificativa || "Avaliação realizada pelo sistema de IA",
        resultadoAPI.confianca || 0.7
      );
    } catch (error) {
      console.error(`Erro ao consultar IA para cliente ${cenario.clienteId}:`, error);
      
      // Em caso de erro, retorna um resultado conservador (reprovado)
      return new ResultadoIA(
        false,
        "Erro ao consultar sistema de IA. Reprovação automática por segurança.",
        1.0
      );
    }
  }

  prepararDadosParaIA(cenario) {
    return {
      cliente: cenario.getDadosPorTipo("DADOS_CLIENTE"),
      bureau: cenario.getDadosPorTipo("BUREAU_CREDITO"),
      openBanking: cenario.getDadosPorTipo("OPEN_BANKING"),
      valorCredito: cenario.valorCredito,
      resultadosAnteriores: cenario.resultadosAvaliacao
    };
  }
}

module.exports = IAAdapter;