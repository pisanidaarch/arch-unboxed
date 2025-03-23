// src/core/strategies/PrazoMinimoStrategy.js
const Strategy = require('./Strategy');
const { restaurarMetodosCenario } = require('../../utils/CenarioHelper');

class PrazoMinimoStrategy extends Strategy {
  constructor(valorMinimo, prazoMinimo, aprovada, nome, descricao) {
    super();
    this.valorMinimo = valorMinimo;
    this.prazoMinimo = prazoMinimo;
    this.aprovada = aprovada;
    this._nome = nome || "PRAZO_MINIMO";
    this._descricao = descricao || `Crédito acima de ${valorMinimo} deve ter prazo mínimo de ${prazoMinimo} meses`;
  }

  execute(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    cenario = restaurarMetodosCenario(cenario);

    // Se o valor do crédito for menor que o valor mínimo, a regra não se aplica
    if (cenario.valorCredito < this.valorMinimo) {
      return true;
    }
    
    // Verificar o prazo do crédito
    const parametrosAdicionais = cenario.parametrosAdicionais || {};
    const prazo = parametrosAdicionais.prazo || 0;
    
    // Verificar se o prazo é maior ou igual ao mínimo
    return prazo >= this.prazoMinimo;
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

module.exports = PrazoMinimoStrategy;