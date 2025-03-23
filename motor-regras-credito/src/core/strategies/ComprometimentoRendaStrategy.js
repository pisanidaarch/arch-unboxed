// src/core/strategies/ComprometimentoRendaStrategy.js
const Strategy = require('./Strategy');

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
  return cenario;
}

class ComprometimentoRendaStrategy extends Strategy {
  constructor(percentualMaximo, aprovada) {
    super();
    this.percentualMaximo = percentualMaximo;
    this.aprovada = aprovada;
  }

  execute(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    cenario = restaurarMetodosCenario(cenario);

    // Verificação de segurança - para debugging
    if (typeof cenario.getDadosPorTipo !== 'function') {
      console.error('ERRO: cenario.getDadosPorTipo não é uma função mesmo após restauração!');
      console.error('cenario:', JSON.stringify(cenario));
      return false; // Falha de segurança
    }

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