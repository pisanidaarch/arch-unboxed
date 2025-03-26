// src/core/strategies/RegraFactory.js
const ComprometimentoRendaStrategy = require('./ComprometimentoRendaStrategy');
const ValorMaximoStrategy = require('./ValorMaximoStrategy');
const ScoreCondicionalStrategy = require('./ScoreCondicionalStrategy');
const PrazoMinimoStrategy = require('./PrazoMinimoStrategy');

class RegraFactory {
  /**
   * Cria uma estratégia com base nos dados da regra dinâmica
   * @param {Object} regra - Dados da regra dinâmica
   * @returns {Object} Instância da estratégia correspondente
   */
  static criarEstrategia(regra) {
    const { tipo, parametros, aprovada, nome, descricao } = regra;
    
    switch (tipo) {
      case 'COMPROMETIMENTO_RENDA':
        return new ComprometimentoRendaStrategy(
          parametros.percentualMaximo,
          aprovada,
          nome,
          descricao
        );
        
      case 'VALOR_MAXIMO':
        return new ValorMaximoStrategy(
          parametros.valorMaximo,
          parametros.primeiraCompra || false,
          aprovada,
          nome,
          descricao
        );
        
      case 'SCORE_CONDICIONAL':
        return new ScoreCondicionalStrategy(
          parametros.scoreMinimo,
          parametros.condicao,
          aprovada,
          nome,
          descricao
        );
        
      case 'PRAZO_MINIMO':
        return new PrazoMinimoStrategy(
          parametros.valorMinimo,
          parametros.prazoMinimo,
          aprovada,
          nome,
          descricao
        );
        
      default:
        throw new Error(`Tipo de regra não suportado: ${tipo}`);
    }
  }
}

module.exports = { RegraFactory };