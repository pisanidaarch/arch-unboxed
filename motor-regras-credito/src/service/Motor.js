// src/service/Motor.js

class Motor {
  constructor(gerenciadorCenario, chainOfResponsibility, logService) {
    this.gerenciadorCenario = gerenciadorCenario;
    this.chainOfResponsibility = chainOfResponsibility;
    this.logService = logService;
  }

  async processarSolicitacao(clienteId, valorCredito, parametrosAdicionais = {}) {
    try {
      // Registro de início de processamento
      this.logService.registrarInicio(clienteId, valorCredito);

      // Criação e carregamento do cenário
      const cenario = await this.gerenciadorCenario.criarCenario(clienteId, valorCredito, parametrosAdicionais);

      // Processamento do cenário na camada core
      const cenarioProcessado = await this.chainOfResponsibility.processar(cenario);

      // Marcar status final do cenário
      const cenarioFinal = this.gerenciadorCenario.marcarStatusCenario(cenarioProcessado);

      // Persistir o cenário no banco de dados
      await cenarioFinal.salvar();

      // Registro de finalização bem-sucedida
      this.logService.registrarSucesso(cenarioFinal);

      return cenarioFinal;
    } catch (error) {
      // Tratamento de erro e registro de log
      this.logService.registrarErro(error, clienteId, valorCredito);
      throw error;
    }
  }

  /**
   * Busca um cenário pelo ID
   * @param {string} cenarioId - ID do cenário
   * @returns {Promise<Object|null>} Cenário encontrado ou null
   */
  async buscarCenario(cenarioId) {
    const Cenario = require('../entity/Cenario');
    return await Cenario.buscarPorId(cenarioId);
  }

  /**
   * Busca cenários por cliente
   * @param {string} clienteId - ID do cliente
   * @returns {Promise<Array>} Lista de cenários
   */
  async buscarCenariosPorCliente(clienteId) {
    const Cenario = require('../entity/Cenario');
    return await Cenario.buscarPorCliente(clienteId);
  }
}

module.exports = Motor;