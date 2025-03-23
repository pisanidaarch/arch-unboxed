// src/core/chain/handlers/RegrasDinamicasHandler.js

/**
 * Restaura os métodos da classe Cenario se eles estiverem faltando.
 */
function restaurarMetodosCenario(cenario) {
  // Adiciona método getDadosPorTipo se estiver faltando
  if (typeof cenario.getDadosPorTipo !== 'function') {
    cenario.getDadosPorTipo = function(tipo) {
      if (!Array.isArray(this.dadosCenario)) {
        return {};
      }
      const item = this.dadosCenario.find(d => d.tipo === tipo);
      return item ? item.dados : {};
    };
  }

  // Adiciona método adicionarResultadoAvaliacao se estiver faltando
  if (typeof cenario.adicionarResultadoAvaliacao !== 'function') {
    cenario.adicionarResultadoAvaliacao = function(regra, resultado, descricao) {
      if (!Array.isArray(this.resultadosAvaliacao)) {
        this.resultadosAvaliacao = [];
      }
      this.resultadosAvaliacao.push({
        regra,
        resultado,
        descricao,
        dataAvaliacao: new Date()
      });
    };
  }

  return cenario;
}

class RegrasDinamicasHandler {
    constructor(strategies) {
      this.strategies = strategies;
    }
  
    async processar(cenario) {
      // Restaura os métodos do cenário se estiverem faltando
      const cenarioProcessado = restaurarMetodosCenario(cenario);
      
      // Verifica se já falhou em alguma regra anterior
      if (cenarioProcessado.regraFalhou) {
        return cenarioProcessado;
      }
  
      for (const strategy of this.strategies) {
        if (strategy.isAprovada()) { // Só executa regras aprovadas
          const resultado = await strategy.execute(cenarioProcessado);
          
          // Garante que o método está disponível
          if (typeof cenarioProcessado.adicionarResultadoAvaliacao !== 'function') {
            console.error('ERRO: adicionarResultadoAvaliacao não é uma função após estratégia!');
            // Tenta restaurar novamente
            restaurarMetodosCenario(cenarioProcessado);
          }
          
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