// src/adapter/DadosClienteAdapter.js
const Adapter = require('./Adapter');

class DadosClienteAdapter extends Adapter {
  constructor(clienteDatabase) {
    super();
    this.clienteDatabase = clienteDatabase;
  }

  getTipo() {
    return "DADOS_CLIENTE";
  }

  async carregarDados(clienteId) {
    try {
      const cliente = await this.clienteDatabase.buscarCliente(clienteId);
      
      if (!cliente) {
        throw new Error(`Cliente não encontrado: ${clienteId}`);
      }

      return {
        nome: cliente.nome,
        idade: cliente.idade,
        sexo: cliente.sexo,
        rendaMensal: cliente.rendaMensal,
        // outros dados relevantes
      };
    } catch (error) {
      console.error(`Erro ao buscar dados do cliente ${clienteId}:`, error);
      throw error;
    }
  }
}

module.exports = DadosClienteAdapter;