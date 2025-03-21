// src/core/chain/handlers/RegrasMandatoriasHandler.js

class RegrasMandatoriasHandler {
    constructor(specifications) {
      this.specifications = specifications;
    }
  
    async processar(cenario) {
      // Cria uma cópia para não modificar o original diretamente
      const cenarioProcessado = { ...cenario };
  
      for (const spec of this.specifications) {
        const resultado = await spec.isSatisfiedBy(cenarioProcessado);
        
        cenarioProcessado.adicionarResultadoAvaliacao(
          spec.getNome(), 
          resultado, 
          spec.getDescricao()
        );
  
        // Se uma regra mandatória falhar, já pode encerrar
        if (!resultado) {
          cenarioProcessado.regraFalhou = true;
          break;
        }
      }
  
      return cenarioProcessado;
    }
  }
  
  module.exports = RegrasMandatoriasHandler;