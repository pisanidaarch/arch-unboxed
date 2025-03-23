// src/adapter/OpenBankingAdapter.js
const Adapter = require('./Adapter');
const { getDatabase } = require('../config/database');

class OpenBankingAdapter extends Adapter {
  constructor(options = {}) {
    super();
    this.db = options.db || getDatabase();
  }

  getTipo() {
    return "OPEN_BANKING";
  }

  async carregarDados(clienteId) {
    try {
      // Consulta os dados bancários no banco de dados
      const dadosBancarios = await this.db('dados_bancarios')
        .where('cliente_id', clienteId)
        .first();
      
      if (!dadosBancarios) {
        console.warn(`Dados bancários não encontrados para o cliente ${clienteId}`);
        return {
          possuiConta: false,
          saldoMedio: 0,
          ultimaMovimentacao: null,
          status: "ERRO"
        };
      }

      return {
        possuiConta: dadosBancarios.possui_conta,
        saldoMedio: dadosBancarios.saldo_medio,
        ultimaMovimentacao: dadosBancarios.ultima_movimentacao,
        status: dadosBancarios.status,
        tempoRelacionamentoMeses: dadosBancarios.tempo_relacionamento_meses,
        quantidadeProdutos: dadosBancarios.quantidade_produtos
      };
    } catch (error) {
      console.error(`Erro ao consultar open banking para cliente ${clienteId}:`, error);
      return {
        possuiConta: false,
        saldoMedio: 0,
        ultimaMovimentacao: null,
        status: "ERRO"
      };
    }
  }
}

module.exports = OpenBankingAdapter;