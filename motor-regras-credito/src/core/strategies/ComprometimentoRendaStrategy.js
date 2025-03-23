// src/core/strategies/ComprometimentoRendaStrategy.js
const Strategy = require('./Strategy');
const { restaurarMetodosCenario } = require('../../utils/CenarioHelper');

class ComprometimentoRendaStrategy extends Strategy {
  constructor(percentualMaximo, aprovada, nome, descricao) {
    super();
    this.percentualMaximo = percentualMaximo;
    this.aprovada = aprovada;
    this._nome = nome || "COMPROMETIMENTO_RENDA";
    this._descricao = descricao || `Comprometimento máximo de renda de ${percentualMaximo}%`;
  }

  execute(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    cenario = restaurarMetodosCenario(cenario);

    const dadosCliente = cenario.getDadosPorTipo("DADOS_CLIENTE");
    const rendaMensal = dadosCliente?.rendaMensal || 0;
    const valorParcela = this.calcularValorParcela(cenario.valorCredito, cenario.parametrosAdicionais);

    if (rendaMensal === 0) {
      return false; // Sem renda informada, não pode aprovar
    }

    const percentualComprometimento = (valorParcela / rendaMensal) * 100;
    return percentualComprometimento <= this.percentualMaximo;
  }

  calcularValorParcela(valorCredito, parametrosAdicionais = {}) {
    // Lógica melhorada para calcular valor da parcela
    const prazo = parametrosAdicionais.prazo || 12; // Prazo padrão de 12 meses
    const taxaJuros = 0.015; // Taxa de juros mensal (1.5%)
    
    // Cálculo de parcela com juros compostos: P = (PV * r * (1 + r)^n) / ((1 + r)^n - 1)
    // Onde: P = parcela, PV = valor presente, r = taxa de juros, n = número de períodos
    const taxaJurosPotencia = Math.pow(1 + taxaJuros, prazo);
    const numerador = valorCredito * taxaJuros * taxaJurosPotencia;
    const denominador = taxaJurosPotencia - 1;
    
    const valorParcela = numerador / denominador;
    
    return valorParcela;
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

module.exports = ComprometimentoRendaStrategy;