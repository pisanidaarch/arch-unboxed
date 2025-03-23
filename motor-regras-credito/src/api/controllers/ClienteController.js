// src/api/controllers/ClienteController.js
const ClienteDAO = require('../../dao/ClienteDAO');

class ClienteController {
  constructor() {
    this.clienteDAO = new ClienteDAO();
  }

  /**
   * Lista todos os clientes
   */
  async listarClientes(req, res, next) {
    try {
      const { limit, offset, ordem } = req.query;
      
      const options = {
        limit: limit ? parseInt(limit) : 10,
        offset: offset ? parseInt(offset) : 0,
        ordem: ordem || 'nome'
      };

      const clientes = await this.clienteDAO.listar(options);
      
      return res.status(200).json({
        total: clientes.length,
        clientes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém detalhes de um cliente pelo ID
   */
  async detalharCliente(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ mensagem: 'ID do cliente é obrigatório' });
      }

      const cliente = await this.clienteDAO.buscarPorId(id);
      
      if (!cliente) {
        return res.status(404).json({ mensagem: `Cliente não encontrado: ${id}` });
      }

      // Buscar histórico de análises
      const historico = await this.clienteDAO.buscarHistoricoAnalises(id);

      return res.status(200).json({
        id: cliente.id,
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
        historico: {
          totalAnalises: historico.length,
          analises: historico
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém exemplos de clientes para testes
   */
  async obterExemplos(req, res, next) {
    try {
      const clientes = await this.clienteDAO.listar({ limit: 5 });
      
      return res.status(200).json({
        message: 'Utilize um destes IDs de cliente para testar a API de crédito',
        clientes: clientes.map(c => ({
          id: c.id,
          nome: c.nome,
          idade: c.idade,
          rendaMensal: c.renda_mensal
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClienteController;