// src/core/specifications/Specification.js

class Specification {
    isSatisfiedBy(cenario) {
      throw new Error('Método isSatisfiedBy deve ser implementado');
    }
  
    getNome() {
      throw new Error('Método getNome deve ser implementado');
    }
  
    getDescricao() {
      throw new Error('Método getDescricao deve ser implementado');
    }
  }
  
  module.exports = Specification;