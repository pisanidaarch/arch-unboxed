// src/core/strategies/Strategy.js

class Strategy {
    execute(cenario) {
      throw new Error('Método execute deve ser implementado');
    }
  
    getNome() {
      throw new Error('Método getNome deve ser implementado');
    }
  
    getDescricao() {
      throw new Error('Método getDescricao deve ser implementado');
    }
  
    isAprovada() {
      throw new Error('Método isAprovada deve ser implementado');
    }
  }
  
  module.exports = Strategy;