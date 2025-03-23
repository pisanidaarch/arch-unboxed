// src/core/chain/ChainOfResponsibility.js

/**
 * Restaura os métodos da classe Cenario se eles estiverem faltando.
 */
function restaurarMetodosCenario(cenario) {
  // Verifica se é um objeto válido
  if (!cenario || typeof cenario !== 'object') {
    console.error('ERRO: tentativa de restaurar métodos em um objeto inválido:', cenario);
    return cenario;
  }

  // Adiciona método getDadosPorTipo se estiver faltando
  if (typeof cenario.getDadosPorTipo !== 'function') {
    cenario.getDadosPorTipo = function(tipo) {
      if (!Array.isArray(this.dadosCenario)) {
        console.error('ERRO: dadosCenario não é um array!', this.dadosCenario);
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

  // Adiciona método todosResultadosAprovados se estiver faltando
  if (typeof cenario.todosResultadosAprovados !== 'function') {
    cenario.todosResultadosAprovados = function() {
      return this.resultadosAvaliacao.length > 0 &&
        this.resultadosAvaliacao.every(r => r.resultado === true);
    };
  }

  return cenario;
}

class ChainOfResponsibility {
    constructor(handlers = []) {
      this.handlers = handlers;
    }
  
    async processar(cenario) {
      // Restaura os métodos do cenário se estiverem faltando
      let cenarioAtual = restaurarMetodosCenario(cenario);
      
      console.log('ChainOfResponsibility: cenario tem métodos?', 
                 `getDadosPorTipo: ${typeof cenarioAtual.getDadosPorTipo === 'function'}, ` +
                 `adicionarResultadoAvaliacao: ${typeof cenarioAtual.adicionarResultadoAvaliacao === 'function'}`);
  
      for (const handler of this.handlers) {
        // Se já falhou ou precisa análise manual, não processa mais handlers
        if (cenarioAtual.regraFalhou || cenarioAtual.precisaAnaliseManual) {
          break;
        }
  
        // Antes de cada handler, garantimos que os métodos existem
        cenarioAtual = restaurarMetodosCenario(cenarioAtual);
        
        cenarioAtual = await handler.processar(cenarioAtual);
        
        // Após cada handler, verificamos novamente
        cenarioAtual = restaurarMetodosCenario(cenarioAtual);
      }
  
      return cenarioAtual;
    }
  }
  
  module.exports = ChainOfResponsibility;