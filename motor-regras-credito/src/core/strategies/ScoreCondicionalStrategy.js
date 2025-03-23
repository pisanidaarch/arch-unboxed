// src/core/strategies/ScoreCondicionalStrategy.js
const Strategy = require('./Strategy');
const { restaurarMetodosCenario } = require('../../utils/CenarioHelper');

class ScoreCondicionalStrategy extends Strategy {
  constructor(scoreMinimo, condicao, aprovada, nome, descricao) {
    super();
    this.scoreMinimo = scoreMinimo;
    this.condicao = condicao; // ex: 'NEGATIVADO', 'RENDA_ALTA'
    this.aprovada = aprovada;
    this._nome = nome || "SCORE_CONDICIONAL";
    this._descricao = descricao || `Score mínimo de ${scoreMinimo} para clientes ${condicao.toLowerCase()}`;
  }

  execute(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    cenario = restaurarMetodosCenario(cenario);

    const dadosBureau = cenario.getDadosPorTipo("BUREAU_CREDITO");
    const dadosCliente = cenario.getDadosPorTipo("DADOS_CLIENTE");
    const score = dadosBureau?.score || 0;
    
    // Verificar se a condição se aplica
    if (this.condicao === 'NEGATIVADO') {
      const status = dadosBureau?.status;
      const totalDividas = dadosBureau?.totalDividas || 0;
      
      // Se o cliente estiver negativado
      if (status === 'IRREGULAR' || totalDividas > 0) {
        // Aplicar regra de score mínimo
        return score >= this.scoreMinimo;
      }
      
      // Cliente não está negativado, regra não se aplica
      return true;
    }
    
    if (this.condicao === 'RENDA_ALTA') {
      const rendaMensal = dadosCliente?.rendaMensal || 0;
      const rendaMinima = this.parametros?.rendaMinima || 8000;
      
      // Se o cliente tiver renda alta
      if (rendaMensal >= rendaMinima) {
        // Aplicar regra de score mínimo
        return score >= this.scoreMinimo;
      }
      
      // Cliente não tem renda alta, regra não se aplica
      return true;
    }
    
    // Condição não reconhecida, regra não se aplica
    return true;
  }

  getNome() {
    return this._nome;
  }

  getDescricao() {
    return this._descricao;
  }

  isAprovada() {
    return this.aprovada;
  }
}

module.exports = ScoreCondicionalStrategy;