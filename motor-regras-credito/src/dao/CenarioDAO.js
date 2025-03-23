// src/dao/CenarioDAO.js
const { getDatabase } = require('../config/database');

class CenarioDAO {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Persiste um cenário no banco de dados
   * @param {Object} cenario - Cenário a ser persistido
   * @returns {Promise<Object>} Cenário persistido
   */
  async salvar(cenario) {
    try {
      // Inserir cenário na tabela cenarios
      await this.db('cenarios').insert({
        id: cenario.id,
        cliente_id: cenario.clienteId,
        valor_credito: cenario.valorCredito,
        data_criacao: cenario.dataCriacao,
        status: cenario.status,
        regra_falhou: cenario.regraFalhou,
        precisa_analise_manual: cenario.precisaAnaliseManual,
        parametros_adicionais: JSON.stringify(cenario.parametrosAdicionais || {})
      });

      // Inserir resultados de avaliação
      if (cenario.resultadosAvaliacao && cenario.resultadosAvaliacao.length > 0) {
        const resultadosParaInserir = cenario.resultadosAvaliacao.map(resultado => ({
          cenario_id: cenario.id,
          regra: resultado.regra,
          resultado: resultado.resultado,
          descricao: resultado.descricao,
          data_avaliacao: resultado.dataAvaliacao
        }));

        await this.db('resultados_avaliacao').insert(resultadosParaInserir);
      }

      // Inserir resultado IA, se existir
      if (cenario.resultadoIA) {
        await this.db('resultados_ia').insert({
          cenario_id: cenario.id,
          aprovado: cenario.resultadoIA.aprovado,
          justificativa: cenario.resultadoIA.justificativa,
          confianca: cenario.resultadoIA.confianca
        });
      }

      return cenario;
    } catch (error) {
      console.error('Erro ao salvar cenário no banco de dados:', error);
      throw error;
    }
  }

  /**
   * Busca um cenário pelo ID
   * @param {string} id - ID do cenário
   * @returns {Promise<Object|null>} Cenário encontrado ou null
   */
  async buscarPorId(id) {
    try {
      // Buscar cenário
      const cenario = await this.db('cenarios')
        .where('id', id)
        .first();

      if (!cenario) {
        return null;
      }

      // Buscar resultados de avaliação
      const resultadosAvaliacao = await this.db('resultados_avaliacao')
        .where('cenario_id', id)
        .orderBy('data_avaliacao');

      // Buscar resultado IA
      const resultadoIA = await this.db('resultados_ia')
        .where('cenario_id', id)
        .first();

      // Construir objeto completo
      return {
        id: cenario.id,
        clienteId: cenario.cliente_id,
        valorCredito: cenario.valor_credito,
        dataCriacao: cenario.data_criacao,
        status: cenario.status,
        regraFalhou: cenario.regra_falhou,
        precisaAnaliseManual: cenario.precisa_analise_manual,
        parametrosAdicionais: JSON.parse(cenario.parametros_adicionais || '{}'),
        resultadosAvaliacao: resultadosAvaliacao.map(r => ({
          regra: r.regra,
          resultado: r.resultado,
          descricao: r.descricao,
          dataAvaliacao: r.data_avaliacao
        })),
        resultadoIA: resultadoIA ? {
          aprovado: resultadoIA.aprovado,
          justificativa: resultadoIA.justificativa,
          confianca: resultadoIA.confianca
        } : null
      };
    } catch (error) {
      console.error('Erro ao buscar cenário por ID:', error);
      throw error;
    }
  }

  /**
   * Busca cenários por ID do cliente
   * @param {string} clienteId - ID do cliente
   * @returns {Promise<Array>} Lista de cenários do cliente
   */
  async buscarPorCliente(clienteId) {
    try {
      const cenarios = await this.db('cenarios')
        .where('cliente_id', clienteId)
        .orderBy('data_criacao', 'desc');

      return cenarios.map(c => ({
        id: c.id,
        clienteId: c.cliente_id,
        valorCredito: c.valor_credito,
        dataCriacao: c.data_criacao,
        status: c.status
      }));
    } catch (error) {
      console.error('Erro ao buscar cenários por cliente:', error);
      throw error;
    }
  }
}

module.exports = CenarioDAO;