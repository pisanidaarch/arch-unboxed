// src/adapter/Adapter.js

class Adapter {
    getTipo() {
      throw new Error('Método getTipo deve ser implementado');
    }
  
    async carregarDados(clienteId) {
      throw new Error('Método carregarDados deve ser implementado');
    }
  }
  
  module.exports = Adapter;