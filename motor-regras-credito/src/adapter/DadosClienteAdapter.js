// src/adapter/DadosClienteAdapter.js
const Adapter = require('./Adapter');
const { getDatabase } = require('../config/database');

class DadosClienteAdapter extends Adapter {
  constructor(options = {}) {
    super();
    this.db = options.db || getDatabase();
  }

  getTipo() {
    return "DADOS_CLIENTE";
  }

  async carregarDados(clienteId) {
    try {
      // Consulta o cliente no banco de dados
      const cliente = await this.db('clientes')
        .where('id', clienteId)
        .first();
      
      if (!cliente) {
        throw new Error(`Cliente não encontrado: ${clienteId}`);
      }

      return {
        nome: cliente.nome,
        idade: cliente.idade,
        sexo: cliente.sexo,
        rendaMensal: cliente.renda_mensal,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        cidade: cliente.cidade,
        estado: cliente.estado,
        cep: cliente.cep,
        cpf: cliente.cpf
      };
    } catch (error) {
      console.error(`Erro ao buscar dados do cliente ${clienteId}:`, error);
      throw error;
    }
  }
}

module.exports = DadosClienteAdapter;