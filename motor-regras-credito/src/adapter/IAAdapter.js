// src/adapter/IAAdapter.js
const ResultadoIA = require('../entity/ResultadoIA');
const RegraDinamicaDAO = require('../dao/RegraDinamicaDAO');

class IAAdapter {
  constructor(iaAPI) {
    this.iaAPI = iaAPI;
    this.regraDinamicaDAO = new RegraDinamicaDAO();
  }

  async avaliarCredito(cenario) {
    try {
      // Prepara os dados para envio à IA
      const dadosParaIA = this.prepararDadosParaIA(cenario);

      // Chama a API de IA
      const resultadoAPI = await this.iaAPI.avaliar(dadosParaIA);

      // Verificar se a IA sugere a criação de novas regras dinâmicas
      if (resultadoAPI.regrasGeradas && Array.isArray(resultadoAPI.regrasGeradas)) {
        // Persistir as novas regras no banco de dados
        await this.persistirRegrasGeradas(resultadoAPI.regrasGeradas);
      }

      // Retornar o resultado da avaliação
      return new ResultadoIA(
        resultadoAPI.aprovado,
        resultadoAPI.justificativa || "Avaliação realizada pelo sistema de IA",
        resultadoAPI.confianca || 0.7,
        resultadoAPI.analiseManual || false
      );
    } catch (error) {
      console.error(`Erro ao consultar IA para cliente ${cenario.clienteId}:`, error);
      
      // Em caso de erro, retornar um resultado que indica necessidade de análise manual
      return new ResultadoIA(
        false,
        "Erro ao consultar sistema de IA. Recomendação para análise manual por segurança.",
        0.5,
        true // Indica que precisa de análise manual
      );
    }
  }

  prepararDadosParaIA(cenario) {
    return {
      cliente: cenario.getDadosPorTipo("DADOS_CLIENTE"),
      bureau: cenario.getDadosPorTipo("BUREAU_CREDITO"),
      openBanking: cenario.getDadosPorTipo("OPEN_BANKING"),
      valorCredito: cenario.valorCredito,
      parametrosAdicionais: cenario.parametrosAdicionais,
      resultadosAnteriores: cenario.resultadosAvaliacao
    };
  }

  /**
   * Persiste regras dinâmicas geradas pela IA
   * @param {Array} regras - Regras geradas pela IA
   */
  async persistirRegrasGeradas(regras) {
    try {
      for (const regra of regras) {
        // Verificar se a regra já existe com o mesmo nome
        const regrasExistentes = await this.regraDinamicaDAO.listar();
        const regraExistente = regrasExistentes.find(r => r.nome === regra.nome);
        
        if (regraExistente) {
          console.log(`Regra ${regra.nome} já existe, pulando inserção.`);
          continue;
        }
        
        // Inserir nova regra
        await this.regraDinamicaDAO.inserir({
          nome: regra.nome,
          descricao: regra.descricao,
          tipo: regra.tipo,
          parametros: regra.parametros,
          aprovada: false, // Regras geradas pela IA nunca começam aprovadas
          origem: 'IA',
          ativa: true
        });
        
        console.log(`Nova regra dinâmica criada pela IA: ${regra.nome}`);
      }
    } catch (error) {
      console.error('Erro ao persistir regras geradas pela IA:', error);
    }
  }
}

module.exports = IAAdapter;