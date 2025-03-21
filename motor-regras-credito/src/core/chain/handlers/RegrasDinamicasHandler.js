// src/core/chain/handlers/RegrasDinamicasHandler.js

class RegrasDinamicasHandler {
    constructor(strategies) {
      this.strategies = strategies;
    }
  
    async processar(cenario) {
      // Cria uma cópia para não modificar o original diretamente
      const cenarioProcessado = { ...cenario };
  
      // Verifica se já falhou em alguma regra anterior
      if (cenarioProcessado.regraFalhou) {
        return cenarioProcessado;
      }
  
      for (const strategy of this.strategies) {
        if (strategy.isAprovada()) { // Só executa regras aprovadas
          const resultado = await strategy.execute(cenarioProcessado);
          
          cenarioProcessado.adicionarResultadoAvaliacao(
            strategy.getNome(), 
            resultado, 
            strategy.getDescricao()
          );
  
          if (!resultado) {
            cenarioProcessado.regraFalhou = true;
            break;
          }
        } else {
          // Se há regras não aprovadas, precisa de análise manual
          cenarioProcessado.precisaAnaliseManual = true;
          break;
        }
      }
  
      return cenarioProcessado;
    }
  }
  
  module.exports = RegrasDinamicasHandler;