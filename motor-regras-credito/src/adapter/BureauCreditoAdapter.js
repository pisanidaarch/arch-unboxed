// src/adapter/BureauCreditoAdapter.js
const Adapter = require('./Adapter');
const { getDatabase } = require('../config/database');

class BureauCreditoAdapter extends Adapter {
  constructor(options = {}) {
    super();
    this.db = options.db || getDatabase();
  }

  getTipo() {
    return "BUREAU_CREDITO";
  }

  async carregarDados(clienteId) {
    try {
      // Consulta os dados de bureau no banco de dados
      const dadosBureau = await this.db('bureau_credito')
        .where('cliente_id', clienteId)
        .first();
      
      if (!dadosBureau) {
        console.warn(`Dados de bureau não encontrados para o cliente ${clienteId}`);
        return { score: 0, ultimaConsulta: null, status: "ERRO" };
      }

      return {
        score: dadosBureau.score,
        ultimaConsulta: dadosBureau.ultima_consulta,
        status: dadosBureau.status,
        totalDividas: dadosBureau.total_dividas,
        valorDividas: dadosBureau.valor_dividas,
        consultasRecentes: dadosBureau.consultas_recentes
      };
    } catch (error) {
      console.error(`Erro ao consultar bureau para cliente ${clienteId}:`, error);
      return { score: 0, ultimaConsulta: null, status: "ERRO" };
    }
  }
}

module.exports = BureauCreditoAdapter;