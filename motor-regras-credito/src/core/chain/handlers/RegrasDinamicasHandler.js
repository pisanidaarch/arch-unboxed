// src/core/chain/handlers/RegrasDinamicasHandler.js
const { restaurarMetodosCenario } = require('../../../utils/CenarioHelper');
const RegraDinamicaDAO = require('../../../dao/RegraDinamicaDAO');
const { RegraFactory } = require('../../strategies/RegraFactory');

class RegrasDinamicasHandler {
  constructor(strategies = []) {
    this.strategies = strategies; // Estratégias fixas (legado)
    this.regraDinamicaDAO = new RegraDinamicaDAO();
  }

  async processar(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    const cenarioProcessado = restaurarMetodosCenario(cenario);
    
    // Verifica se já falhou em alguma regra anterior
    if (cenarioProcessado.regraFalhou) {
      return cenarioProcessado;
    }

    try {
      // Carregar regras dinâmicas ativas do banco de dados
      const regrasBD = await this.regraDinamicaDAO.listar({ ativas: true });
      
      // Log para debugging
      console.log(`[RegrasDinamicasHandler] Carregadas ${regrasBD.length} regras dinâmicas do banco`);
      
      // Converter regras do banco em estratégias
      const strategiesDoBanco = regrasBD.map(regra => RegraFactory.criarEstrategia(regra));
      
      // Combinar estratégias legadas com as do banco
      const todasStrategies = [...this.strategies, ...strategiesDoBanco];
      
      // Separar regras aprovadas e não aprovadas
      const regrasAprovadas = todasStrategies.filter(strategy => strategy.isAprovada());
      const regrasNaoAprovadas = todasStrategies.filter(strategy => !strategy.isAprovada());
      
      // Verificar se existem regras não aprovadas
      if (regrasNaoAprovadas.length > 0) {
        cenarioProcessado.regrasDinamicasNaoAprovadas = regrasNaoAprovadas.map(r => ({
          nome: r.getNome(),
          descricao: r.getDescricao()
        }));
      }
      
      // Processar regras aprovadas
      for (const strategy of regrasAprovadas) {
        try {
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
        } catch (error) {
          console.error(`[RegrasDinamicasHandler] Erro ao executar regra ${strategy.getNome()}:`, error);
          // Continuar com a próxima regra
        }
      }
      
      // Verificar se precisa análise manual (existem regras não aprovadas)
      if (!cenarioProcessado.regraFalhou && regrasNaoAprovadas.length > 0) {
        cenarioProcessado.precisaAnaliseManual = true;
        cenarioProcessado.motivoAnaliseManual = 'Existem regras dinâmicas que necessitam aprovação';
      }
    } catch (error) {
      console.error('[RegrasDinamicasHandler] Erro ao processar regras dinâmicas:', error);
      // Em caso de erro, permitir que o fluxo continue
    }
  
    return cenarioProcessado;
  }
}

module.exports = RegrasDinamicasHandler;