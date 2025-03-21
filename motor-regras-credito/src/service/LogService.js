// src/service/LogService.js

class LogService {
    constructor() {
      this.log = console;
    }
  
    registrarInicio(clienteId, valorCredito) {
      this.log.info(`[MOTOR] Iniciando processamento para cliente ${clienteId} com valor de crédito ${valorCredito}`);
    }
  
    registrarSucesso(cenario) {
      this.log.info(`[MOTOR] Processamento finalizado com sucesso para cliente ${cenario.clienteId}. Status: ${cenario.status}`);
      
      this.log.debug(`[MOTOR] Detalhes do cenário: ${JSON.stringify({
        id: cenario.id,
        clienteId: cenario.clienteId,
        valorCredito: cenario.valorCredito,
        status: cenario.status,
        resultadosAvaliacao: cenario.resultadosAvaliacao.map(r => ({
          regra: r.regra,
          resultado: r.resultado
        }))
      })}`);
    }
  
    registrarErro(error, clienteId, valorCredito) {
      this.log.error(`[MOTOR] Erro ao processar solicitação para cliente ${clienteId} com valor de crédito ${valorCredito}:`, error);
    }
  
    registrarExecucaoRegra(nomeRegra, resultado, cenario) {
      this.log.debug(`[MOTOR] Regra ${nomeRegra} executada para cliente ${cenario.clienteId}. Resultado: ${resultado ? 'APROVADO' : 'REPROVADO'}`);
    }
  
    registrarConsultaExterna(tipo, clienteId, sucesso) {
      const status = sucesso ? 'sucesso' : 'falha';
      this.log.info(`[MOTOR] Consulta externa ${tipo} para cliente ${clienteId} concluída com ${status}`);
    }
  }
  
  module.exports = LogService;