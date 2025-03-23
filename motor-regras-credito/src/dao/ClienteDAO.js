// src/dao/ClienteDAO.js
const { getDatabase } = require('../config/database');

class ClienteDAO {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Busca um cliente pelo ID
   * @param {string} id - ID do cliente
   * @returns {Promise<Object|null>} Cliente encontrado ou null
   */
  async buscarPorId(id) {
    try {
      return await this.db('clientes')
        .where('id', id)
        .first();
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error);
      throw error;
    }
  }

  /**
   * Lista todos os clientes
   * @param {Object} options - Opções de listagem (limit, offset, ordem)
   * @returns {Promise<Array>} Lista de clientes
   */
  async listar(options = {}) {
    try {
      const { limit = 10, offset = 0, ordem = 'nome' } = options;
      
      return await this.db('clientes')
        .select('id', 'nome', 'idade', 'sexo', 'renda_mensal', 'email', 'telefone', 'cidade', 'estado')
        .orderBy(ordem)
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  }

  /**
   * Busca o histórico de análises de crédito do cliente
   * @param {string} id - ID do cliente
   * @returns {Promise<Array>} Histórico de análises
   */
  async buscarHistoricoAnalises(id) {
    try {
      return await this.db('cenarios')
        .where('cliente_id', id)
        .select('id', 'valor_credito', 'status', 'data_criacao')
        .orderBy('data_criacao', 'desc');
    } catch (error) {
      console.error('Erro ao buscar histórico de análises:', error);
      throw error;
    }
  }
}

module.exports = ClienteDAO;