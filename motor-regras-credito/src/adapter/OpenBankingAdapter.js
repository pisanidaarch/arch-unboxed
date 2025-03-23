// src/adapter/OpenBankingAdapter.js
const Adapter = require('./Adapter');

class OpenBankingAdapter extends Adapter {
  constructor(openBankingAPI) {
    super();
    this.openBankingAPI = openBankingAPI;
  }

  getTipo() {
    return "OPEN_BANKING";
  }

  async carregarDados(clienteId) {
    try {
      return await this.openBankingAPI.consultarDadosBancarios(clienteId);
    } catch (error) {
      console.error(`Erro ao consultar open banking para cliente ${clienteId}:`, error);
      return {
        possuiConta: false,
        saldoMedio: 0,
        ultimaMovimentacao: null,
        status: "ERRO"
      };
    }
  }
}

module.exports = OpenBankingAdapter;