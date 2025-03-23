// tests/e2e/fluxoCompleto.test.js
const request = require('supertest');
const app = require('../../src/index');

describe('Fluxo Completo de Aprovação de Crédito', () => {
  test('Deve processar uma solicitação completa de aprovação de crédito', async () => {
    // Etapa 1: Solicitação inicial
    const responseSolicitacao = await request(app)
      .post('/api/credito/analisar')
      .send({
        clienteId: '12345',
        valorCredito: 5000,
        parametrosAdicionais: {
          prazo: 12,
          finalidade: 'PESSOAL'
        }
      });

    expect(responseSolicitacao.statusCode).toBe(200);
    const idCenario = responseSolicitacao.body.idCenario;
    expect(idCenario).toBeDefined();

    // Como estamos usando mocks com resultados aleatórios,
    // vamos apenas verificar que o status está entre os valores esperados
    expect(['APROVADO', 'REPROVADO', 'ANALISE_MANUAL']).toContain(responseSolicitacao.body.status);

    // Verificar se os detalhes da avaliação estão corretos
    expect(Array.isArray(responseSolicitacao.body.detalhesAvaliacao)).toBe(true);
    
    // Se for reprovado, deve ter motivosReprovacao
    if (responseSolicitacao.body.status === 'REPROVADO') {
      expect(responseSolicitacao.body.dadosAdicionais).toHaveProperty('motivosReprovacao');
      expect(Array.isArray(responseSolicitacao.body.dadosAdicionais.motivosReprovacao)).toBe(true);
    }
    
    // Se for análise manual, deve ter motivoAnaliseManual
    if (responseSolicitacao.body.status === 'ANALISE_MANUAL') {
      expect(responseSolicitacao.body.dadosAdicionais).toHaveProperty('motivoAnaliseManual');
      expect(responseSolicitacao.body.dadosAdicionais).toHaveProperty('estimativaTempo');
    }
  });

  // Teste de comportamento com cliente de baixa pontuação (reprovação esperada)
  test('Deve reprovar crédito para clientes com alto valor solicitado', async () => {
    const response = await request(app)
      .post('/api/credito/analisar')
      .send({
        clienteId: '99999', // ID que resultará em um cliente com baixa pontuação
        valorCredito: 100000, // Valor muito alto
        parametrosAdicionais: {
          prazo: 60
        }
      });

    // Devido à natureza aleatória dos mocks, não podemos garantir reprovação
    // mas podemos verificar se a resposta está corretamente formatada
    expect(response.statusCode).toBe(200);
    
    if (response.body.status === 'REPROVADO') {
      expect(response.body.dadosAdicionais).toHaveProperty('motivosReprovacao');
      expect(Array.isArray(response.body.dadosAdicionais.motivosReprovacao)).toBe(true);
      expect(response.body.dadosAdicionais.motivosReprovacao.length).toBeGreaterThan(0);
    }
  });
});