// src/core/strategies/ComprometimentoRendaStrategy.js
const Strategy = require('./Strategy');

class ComprometimentoRendaStrategy extends Strategy {
  constructor(percentualMaximo, aprovada) {
    super();
    this.percentualMaximo = percentualMaximo;
    this.aprovada = aprovada;
  }

  execute(cenario) {
    const dadosCliente = cenario.getDadosPorTipo("DADOS_CLIENTE");
    const rendaMensal = dadosCliente?.rendaMensal || 0;
    const valorParcela = this.calcularValorParcela(cenario.valorCredito);

    if (rendaMensal === 0) {
      return false; // Sem renda informada, não pode aprovar
    }

    const percentualComprometimento = (valorParcela / rendaMensal) * 100;
    return percentualComprometimento <= this.percentualMaximo;
  }

  calcularValorParcela(valorCredito) {
    // Lógica para calcular valor da parcela
    // Simplificação: 10% do valor como parcela mensal
    return valorCredito * 0.10;
  }

  getNome() {
    return "COMPROMETIMENTO_RENDA";
  }

  getDescricao() {
    return `Comprometimento máximo de renda de ${this.percentualMaximo}%`;
  }

  isAprovada() {
    return this.aprovada;
  }
}

module.exports = ComprometimentoRendaStrategy;