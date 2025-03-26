// src/entity/Cenario.js
const CenarioDAO = require('../dao/CenarioDAO');

class Cenario {
    constructor() {
      this.id = this.generateId();
      this.clienteId = null;
      this.valorCredito = null;
      this.dataCriacao = new Date();
      this.status = null;
      this.regraFalhou = false;
      this.precisaAnaliseManual = false;
      this.dadosCenario = [];
      this.resultadosAvaliacao = [];
      this.resultadoIA = null;
      this.parametrosAdicionais = {};
      this.motivoAnaliseManual = null;
      this.dao = new CenarioDAO();
    }
  
    generateId() {
      return 'cen_' + Math.random().toString(36).substring(2, 15);
    }
  
    adicionarDados(tipo, dados) {
      // Verifica se já existe dados deste tipo
      const existingIndex = this.dadosCenario.findIndex(d => d.tipo === tipo);
      
      if (existingIndex >= 0) {
        // Atualiza dados existentes
        this.dadosCenario[existingIndex].dados = dados;
      } else {
        // Adiciona novos dados
        this.dadosCenario.push({
          tipo,
          dados
        });
      }
    }
  
    getDadosPorTipo(tipo) {
      const item = this.dadosCenario.find(d => d.tipo === tipo);
      return item ? item.dados : {};
    }
  
    adicionarResultadoAvaliacao(regra, resultado, descricao) {
      this.resultadosAvaliacao.push({
        regra,
        resultado,
        descricao,
        dataAvaliacao: new Date()
      });
    }
  
    todosResultadosAprovados() {
      return this.resultadosAvaliacao.length > 0 &&
        this.resultadosAvaliacao.every(r => r.resultado === true);
    }

    /**
     * Transforma o cenário em um objeto JSON para envio à IA
     * Inclui todos os dados relevantes para a análise
     */
    toJsonForIA() {
      // Obter dados do cliente formatados para IA
      const dadosCliente = this.getDadosPorTipo("DADOS_CLIENTE") || {};
      const dadosBureau = this.getDadosPorTipo("BUREAU_CREDITO") || {};
      const dadosOpenBanking = this.getDadosPorTipo("OPEN_BANKING") || {};
      
      return {
        id: this.id,
        clienteId: this.clienteId,
        valorCredito: typeof this.valorCredito === 'number' ? this.valorCredito.toString() : this.valorCredito,
        dataCriacao: this.dataCriacao.toISOString(),
        cliente: {
          nome: dadosCliente.nome || "Desconhecido",
          idade: dadosCliente.idade || 0,
          sexo: dadosCliente.sexo || "Desconhecido",
          rendaMensal: dadosCliente.rendaMensal || 0,
          email: dadosCliente.email || "",
          telefone: dadosCliente.telefone || "",
          endereco: dadosCliente.endereco || "",
          cidade: dadosCliente.cidade || "",
          estado: dadosCliente.estado || "",
          cpf: dadosCliente.cpf || ""
        },
        bureau: {
          score: dadosBureau.score || 0,
          status: dadosBureau.status || "DESCONHECIDO",
          totalDividas: dadosBureau.totalDividas || 0,
          valorDividas: dadosBureau.valorDividas || 0,
          consultasRecentes: dadosBureau.consultasRecentes || 0
        },
        openBanking: {
          possuiConta: dadosOpenBanking.possuiConta || false,
          saldoMedio: dadosOpenBanking.saldoMedio || 0,
          status: dadosOpenBanking.status || "DESCONHECIDO",
          tempoRelacionamentoMeses: dadosOpenBanking.tempoRelacionamentoMeses || 0,
          quantidadeProdutos: dadosOpenBanking.quantidadeProdutos || 0
        },
        resultadosAvaliacao: this.resultadosAvaliacao || []
      };
    }

    /**
     * Salva o cenário no banco de dados
     * @returns {Promise<Cenario>} Cenário salvo
     */
    async salvar() {
      await this.dao.salvar(this);
      return this;
    }

    /**
     * Busca um cenário pelo ID
     * @param {string} id - ID do cenário
     * @returns {Promise<Cenario|null>} Cenário encontrado ou null
     */
    static async buscarPorId(id) {
      const dao = new CenarioDAO();
      const dados = await dao.buscarPorId(id);
      if (!dados) return null;

      const cenario = new Cenario();
      Object.assign(cenario, dados);
      return cenario;
    }

    /**
     * Busca cenários por ID do cliente
     * @param {string} clienteId - ID do cliente
     * @returns {Promise<Array>} Lista de cenários do cliente
     */
    static async buscarPorCliente(clienteId) {
      const dao = new CenarioDAO();
      return await dao.buscarPorCliente(clienteId);
    }
    
    /**
     * Método auxiliar para debugging
     */
    logInfo() {
      console.log('Cenário:', {
        id: this.id,
        clienteId: this.clienteId,
        valorCredito: this.valorCredito,
        regraFalhou: this.regraFalhou,
        precisaAnaliseManual: this.precisaAnaliseManual,
        motivoAnaliseManual: this.motivoAnaliseManual,
        dadosCenario: this.dadosCenario.map(d => ({ tipo: d.tipo })),
        resultadosAvaliacao: this.resultadosAvaliacao.length
      });
    }
  }
  
  module.exports = Cenario;