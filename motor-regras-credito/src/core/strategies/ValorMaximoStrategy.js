// src/core/strategies/ValorMaximoStrategy.js
const Strategy = require('./Strategy');
const { restaurarMetodosCenario } = require('../../utils/CenarioHelper');

class ValorMaximoStrategy extends Strategy {
  constructor(valorMaximo, primeiraCompra, aprovada, nome, descricao) {
    super();
    this.valorMaximo = valorMaximo;
    this.primeiraCompra = primeiraCompra;
    this.aprovada = aprovada;
    this._nome = nome || "VALOR_MAXIMO";
    this._descricao = descricao || `Valor máximo de ${valorMaximo} para ${primeiraCompra ? 'primeira compra' : 'crédito'}`;
  }

  execute(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    cenario = restaurarMetodosCenario(cenario);

    // Se não for primeira compra, a regra não se aplica
    if (this.primeiraCompra) {
      const dadosCliente = cenario.getDadosPorTipo("DADOS_CLIENTE");
      const openBanking = cenario.getDadosPorTipo("OPEN_BANKING");
      
      // Verifica se é primeira compra (sem histórico no sistema ou sem conta bancária)
      const temHistorico = openBanking.tempoRelacionamentoMeses > 0;
      
      if (!temHistorico) {
        // É primeira compra, verificar o valor limite
        return cenario.valorCredito <= this.valorMaximo;
      }
      
      // Não é primeira compra, regra não se aplica
      return true;
    }
    
    // Regra para qualquer compra - verificar valor máximo
    return cenario.valorCredito <= this.valorMaximo;
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

module.exports = ValorMaximoStrategy;