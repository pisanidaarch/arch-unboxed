// src/dao/RegraDinamicaDAO.js
const { getDatabase } = require('../config/database');

class RegraDinamicaDAO {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Lista todas as regras dinâmicas
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} Lista de regras dinâmicas
   */
  async listar(options = {}) {
    try {
      const { ativas, aprovadas, origem } = options;
      
      let query = this.db('regras_dinamicas');
      
      if (ativas !== undefined) {
        query = query.where('ativa', ativas);
      }
      
      if (aprovadas !== undefined) {
        query = query.where('aprovada', aprovadas);
      }
      
      if (origem) {
        query = query.where('origem', origem);
      }
      
      const regras = await query.orderBy('id');
      
      return regras.map(regra => {
        // Parse dos parâmetros JSON
        let parametros = {};
        try {
          parametros = typeof regra.parametros === 'string' 
            ? JSON.parse(regra.parametros) 
            : regra.parametros;
        } catch (e) {
          console.error('Erro ao fazer parse dos parâmetros da regra:', e);
        }
        
        return {
          id: regra.id,
          nome: regra.nome,
          descricao: regra.descricao,
          tipo: regra.tipo,
          parametros: parametros,
          aprovada: regra.aprovada,
          origem: regra.origem,
          ativa: regra.ativa,
          createdAt: regra.created_at,
          updatedAt: regra.updated_at
        };
      });
    } catch (error) {
      console.error('Erro ao listar regras dinâmicas:', error);
      throw error;
    }
  }

  /**
   * Busca uma regra dinâmica pelo ID
   * @param {number} id - ID da regra
   * @returns {Promise<Object|null>} Regra encontrada ou null
   */
  async buscarPorId(id) {
    try {
      const regra = await this.db('regras_dinamicas')
        .where('id', id)
        .first();
      
      if (!regra) return null;
      
      // Parse dos parâmetros JSON
      let parametros = {};
      try {
        parametros = typeof regra.parametros === 'string' 
          ? JSON.parse(regra.parametros) 
          : regra.parametros;
      } catch (e) {
        console.error('Erro ao fazer parse dos parâmetros da regra:', e);
      }
      
      return {
        id: regra.id,
        nome: regra.nome,
        descricao: regra.descricao,
        tipo: regra.tipo,
        parametros: parametros,
        aprovada: regra.aprovada,
        origem: regra.origem,
        ativa: regra.ativa,
        createdAt: regra.created_at,
        updatedAt: regra.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar regra dinâmica por ID:', error);
      throw error;
    }
  }

  /**
   * Insere uma nova regra dinâmica
   * @param {Object} regra - Dados da regra
   * @returns {Promise<Object>} Regra inserida com ID
   */
  async inserir(regra) {
    try {
      // Garantir que parametros seja uma string JSON
      const parametrosJSON = typeof regra.parametros === 'string' 
        ? regra.parametros 
        : JSON.stringify(regra.parametros || {});
      
      const [id] = await this.db('regras_dinamicas').insert({
        nome: regra.nome,
        descricao: regra.descricao,
        tipo: regra.tipo,
        parametros: parametrosJSON,
        aprovada: regra.aprovada || false,
        origem: regra.origem || 'HUMANO',
        ativa: regra.ativa !== undefined ? regra.ativa : true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');
      
      return this.buscarPorId(id);
    } catch (error) {
      console.error('Erro ao inserir regra dinâmica:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma regra dinâmica existente
   * @param {number} id - ID da regra
   * @param {Object} regra - Dados atualizados
   * @returns {Promise<Object>} Regra atualizada
   */
  async atualizar(id, regra) {
    try {
      // Verificar se a regra existe
      const regraExistente = await this.buscarPorId(id);
      if (!regraExistente) {
        throw new Error(`Regra dinâmica não encontrada: ${id}`);
      }
      
      // Garantir que parametros seja uma string JSON
      let parametrosJSON = regraExistente.parametros;
      if (regra.parametros) {
        parametrosJSON = typeof regra.parametros === 'string' 
          ? regra.parametros 
          : JSON.stringify(regra.parametros);
      }
      
      await this.db('regras_dinamicas')
        .where('id', id)
        .update({
          nome: regra.nome || regraExistente.nome,
          descricao: regra.descricao || regraExistente.descricao,
          tipo: regra.tipo || regraExistente.tipo,
          parametros: parametrosJSON,
          aprovada: regra.aprovada !== undefined ? regra.aprovada : regraExistente.aprovada,
          origem: regra.origem || regraExistente.origem,
          ativa: regra.ativa !== undefined ? regra.ativa : regraExistente.ativa,
          updated_at: new Date()
        });
      
      return this.buscarPorId(id);
    } catch (error) {
      console.error('Erro ao atualizar regra dinâmica:', error);
      throw error;
    }
  }

  /**
   * Aprovar ou reprovar uma regra dinâmica
   * @param {number} id - ID da regra
   * @param {boolean} aprovada - Status de aprovação
   * @returns {Promise<Object>} Regra atualizada
   */
  async alterarAprovacao(id, aprovada) {
    try {
      await this.db('regras_dinamicas')
        .where('id', id)
        .update({
          aprovada: !!aprovada,
          updated_at: new Date()
        });
      
      return this.buscarPorId(id);
    } catch (error) {
      console.error('Erro ao alterar aprovação da regra dinâmica:', error);
      throw error;
    }
  }

  /**
   * Ativar ou desativar uma regra dinâmica
   * @param {number} id - ID da regra
   * @param {boolean} ativa - Status de ativação
   * @returns {Promise<Object>} Regra atualizada
   */
  async alterarAtivacao(id, ativa) {
    try {
      await this.db('regras_dinamicas')
        .where('id', id)
        .update({
          ativa: !!ativa,
          updated_at: new Date()
        });
      
      return this.buscarPorId(id);
    } catch (error) {
      console.error('Erro ao alterar ativação da regra dinâmica:', error);
      throw error;
    }
  }
}

module.exports = RegraDinamicaDAO;