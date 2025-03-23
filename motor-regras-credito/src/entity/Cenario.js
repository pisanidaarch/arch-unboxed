// src/entity/Cenario.js

class Cenario {
    constructor() {
      this.id = this.generateId();
      this.clienteId = null;
      this.valorCredito = null;
      this.dataCriacao = null;
      this.status = null;
      this.regraFalhou = false;
      this.precisaAnaliseManual = false;
      this.dadosCenario = [];
      this.resultadosAvaliacao = [];
      this.resultadoIA = null;
      this.parametrosAdicionais = {};
    }
  
    generateId() {
      return 'cen_' + Math.random().toString(36).substring(2, 15);
    }
  
    adicionarDados(tipo, dados) {
      this.dadosCenario.push({
        tipo,
        dados
      });
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
  }
  
  module.exports = Cenario;