// src/api/controllers/CreditoController.js

class CreditoController {
    constructor(motor) {
      this.motor = motor;
    }
  
    async analisarCredito(req, res, next) {
      try {
        const { clienteId, valorCredito, parametrosAdicionais } = req.body;
  
        // Validações básicas
        if (!clienteId) {
          return res.status(400).json({ mensagem: 'ID do cliente é obrigatório' });
        }
  
        if (!valorCredito || isNaN(valorCredito) || valorCredito <= 0) {
          return res.status(400).json({ mensagem: 'Valor de crédito deve ser um número positivo' });
        }
  
        // Processar solicitação no motor
        const cenario = await this.motor.processarSolicitacao(
          clienteId,
          parseFloat(valorCredito),
          parametrosAdicionais || {}
        );
  
        // Mapear cenário para resposta da API
        const resposta = {
          status: cenario.status,
          idCenario: cenario.id,
          mensagem: this.getMensagemStatus(cenario.status),
          detalhesAvaliacao: cenario.resultadosAvaliacao.map(r => ({
            regra: r.regra,
            resultado: r.resultado,
            descricao: r.descricao
          })),
          dadosAdicionais: {}
        };
  
        // Adicionar dados adicionais conforme o status
        if (cenario.status === 'REPROVADO') {
          // Incluir motivos de reprovação
          resposta.dadosAdicionais.motivosReprovacao = cenario.resultadosAvaliacao
            .filter(r => !r.resultado)
            .map(r => r.descricao);
        } else if (cenario.status === 'ANALISE_MANUAL') {
          // Incluir informações sobre a análise manual
          resposta.dadosAdicionais.motivoAnaliseManual = 'Necessária aprovação humana para regras dinâmicas';
          resposta.dadosAdicionais.estimativaTempo = '24 horas úteis';
        }
  
        return res.status(200).json(resposta);
      } catch (error) {
        next(error);
      }
    }
  
    getMensagemStatus(status) {
      switch (status) {
        case 'APROVADO':
          return 'Crédito aprovado com sucesso';
        case 'REPROVADO':
          return 'Crédito reprovado';
        case 'ANALISE_MANUAL':
          return 'Solicitação enviada para análise manual';
        default:
          return 'Status desconhecido';
      }
    }
  }
  
  module.exports = CreditoController;