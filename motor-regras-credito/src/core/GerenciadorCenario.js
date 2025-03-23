// src/core/GerenciadorCenario.js
const Cenario = require('../entity/Cenario');

class GerenciadorCenario {
  constructor(adapters) {
    this.adapters = adapters;
  }

  async criarCenario(clienteId, valorCredito, parametrosAdicionais = {}) {
    // Criação do objeto cenário
    const cenario = new Cenario();
    cenario.clienteId = clienteId;
    cenario.valorCredito = valorCredito;
    cenario.parametrosAdicionais = parametrosAdicionais;
    cenario.dataCriacao = new Date();

    // Verificação de segurança
    if (typeof cenario.getDadosPorTipo !== 'function') {
      console.error('ERRO: Cenario criado sem o método getDadosPorTipo!');
      throw new Error('Cenario inválido: método getDadosPorTipo não encontrado');
    }

    // Carregar dados de todos os adaptadores registrados
    for (const adapter of this.adapters) {
      try {
        const dados = await adapter.carregarDados(clienteId);
        cenario.adicionarDados(adapter.getTipo(), dados);
      } catch (error) {
        console.error(`Erro ao carregar dados do adapter ${adapter.getTipo()}:`, error);
        // Continue carregando outros dados mesmo se houver falha em um adapter
      }
    }

    // Verificação final
    console.log('Cenario criado com sucesso, tem getDadosPorTipo:', typeof cenario.getDadosPorTipo === 'function');

    return cenario;
  }

  marcarStatusCenario(cenario) {
    // Lógica para determinar o status final com base nas avaliações
    if (cenario.precisaAnaliseManual) {
      cenario.status = 'ANALISE_MANUAL';
    } else if (cenario.todosResultadosAprovados()) {
      cenario.status = 'APROVADO';
    } else {
      cenario.status = 'REPROVADO';
    }

    return cenario;
  }
}

module.exports = GerenciadorCenario;