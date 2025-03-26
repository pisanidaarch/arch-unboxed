// src/api/controllers/CreditoController.js
const ClienteDAO = require('../../dao/ClienteDAO');

class CreditoController {
    constructor(motor) {
      this.motor = motor;
      this.clienteDAO = new ClienteDAO();
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

        // Verificar se o cliente existe
        const cliente = await this.clienteDAO.buscarPorId(clienteId);
        if (!cliente) {
          return res.status(404).json({ mensagem: `Cliente não encontrado: ${clienteId}` });
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
          resposta.dadosAdicionais.motivoAnaliseManual = cenario.motivoAnaliseManual || 'Necessária aprovação humana para regras dinâmicas';
          resposta.dadosAdicionais.estimativaTempo = '24 horas úteis';
        }
  
        return res.status(200).json(resposta);
      } catch (error) {
        next(error);
      }
    }

    async consultarCenario(req, res, next) {
      try {
        const { id } = req.params;
        
        if (!id) {
          return res.status(400).json({ mensagem: 'ID do cenário é obrigatório' });
        }

        const cenario = await this.motor.buscarCenario(id);
        
        if (!cenario) {
          return res.status(404).json({ mensagem: `Cenário não encontrado: ${id}` });
        }

        // Obter dados completos do cliente
        const cliente = await this.clienteDAO.buscarPorId(cenario.clienteId);
        
        // Formatar resposta com dados detalhados
        const resposta = {
          id: cenario.id,
          clienteId: cenario.clienteId,
          valorCredito: cenario.valorCredito,
          dataCriacao: cenario.dataCriacao,
          status: cenario.status,
          resultadosAvaliacao: cenario.resultadosAvaliacao.map(r => ({
            regra: r.regra,
            resultado: r.resultado,
            descricao: r.descricao,
            dataAvaliacao: r.dataAvaliacao
          })),
          resultadoIA: cenario.resultadoIA,
          motivoAnaliseManual: cenario.motivoAnaliseManual,
          // Adicionar dados do cliente quando disponíveis
          cliente: cliente ? {
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
          } : null,
          // Incluir dados coletados durante o processamento
          dadosColetados: {
            bureau: cenario.getDadosPorTipo ? cenario.getDadosPorTipo("BUREAU_CREDITO") : {},
            openBanking: cenario.getDadosPorTipo ? cenario.getDadosPorTipo("OPEN_BANKING") : {}
          }
        };

        return res.status(200).json(resposta);
      } catch (error) {
        next(error);
      }
    }

    async consultarHistoricoCliente(req, res, next) {
      try {
        const { clienteId } = req.params;
        
        if (!clienteId) {
          return res.status(400).json({ mensagem: 'ID do cliente é obrigatório' });
        }

        // Verificar se o cliente existe
        const cliente = await this.clienteDAO.buscarPorId(clienteId);
        if (!cliente) {
          return res.status(404).json({ mensagem: `Cliente não encontrado: ${clienteId}` });
        }

        const cenarios = await this.motor.buscarCenariosPorCliente(clienteId);
        
        return res.status(200).json({
          clienteId,
          nomeCliente: cliente.nome,
          totalAnalises: cenarios.length,
          analises: cenarios
        });
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