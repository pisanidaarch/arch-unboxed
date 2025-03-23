// src/utils/CenarioHelper.js

/**
 * Restaura os métodos da classe Cenario se eles estiverem faltando.
 * Isso pode ocorrer se o objeto perder sua cadeia de protótipo durante a serialização/desserialização.
 * 
 * @param {Object} cenario Objeto cenário que pode ter perdido seus métodos
 * @returns {Object} Cenário com métodos restaurados
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
  
    // Adiciona método adicionarDados se estiver faltando
    if (typeof cenario.adicionarDados !== 'function') {
      cenario.adicionarDados = function(tipo, dados) {
        if (!Array.isArray(this.dadosCenario)) {
          this.dadosCenario = [];
        }
        this.dadosCenario.push({
          tipo,
          dados
        });
      };
    }
  
    // Adiciona método salvar se estiver faltando (stub para evitar erros)
    if (typeof cenario.salvar !== 'function') {
      cenario.salvar = async function() {
        console.warn('Método salvar foi restaurado como stub - sem persistência real');
        return this;
      };
    }
  
    return cenario;
  }
  
  module.exports = {
    restaurarMetodosCenario
  };