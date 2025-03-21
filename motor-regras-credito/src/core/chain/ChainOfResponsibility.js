// src/core/chain/ChainOfResponsibility.js

class ChainOfResponsibility {
    constructor(handlers = []) {
      this.handlers = handlers;
    }
  
    async processar(cenario) {
      let cenarioAtual = cenario;
  
      for (const handler of this.handlers) {
        // Se já falhou ou precisa análise manual, não processa mais handlers
        if (cenarioAtual.regraFalhou || cenarioAtual.precisaAnaliseManual) {
          break;
        }
  
        cenarioAtual = await handler.processar(cenarioAtual);
      }
  
      return cenarioAtual;
    }
  }
  
  module.exports = ChainOfResponsibility;