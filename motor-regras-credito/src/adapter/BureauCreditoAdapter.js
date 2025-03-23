// src/adapter/BureauCreditoAdapter.js
const Adapter = require('./Adapter');

class BureauCreditoAdapter extends Adapter {
  constructor(bureauCreditoAPI) {
    super();
    this.bureauCreditoAPI = bureauCreditoAPI;
  }

  getTipo() {
    return "BUREAU_CREDITO";
  }

  async carregarDados(clienteId) {
    try {
      return await this.bureauCreditoAPI.consultarCliente(clienteId);
    } catch (error) {
      console.error(`Erro ao consultar bureau para cliente ${clienteId}:`, error);
      return { score: 0, ultimaConsulta: null, status: "ERRO" };
    }
  }
}

module.exports = BureauCreditoAdapter;