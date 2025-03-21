// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../src/index');

describe('API de Crédito', () => {
  test('GET /health deve retornar status 200', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('POST /api/credito/analisar deve validar clienteId', async () => {
    const response = await request(app)
      .post('/api/credito/analisar')
      .send({
        valorCredito: 5000
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.mensagem).toContain('ID do cliente é obrigatório');
  });

  test('POST /api/credito/analisar deve validar valorCredito', async () => {
    const response = await request(app)
      .post('/api/credito/analisar')
      .send({
        clienteId: '12345',
        valorCredito: 'abc'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.mensagem).toContain('Valor de crédito deve ser um número positivo');
  });

  test('POST /api/credito/analisar deve processar solicitação válida', async () => {
    const response = await request(app)
      .post('/api/credito/analisar')
      .send({
        clienteId: '12345',
        valorCredito: 5000,
        parametrosAdicionais: {
          prazo: 12
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('idCenario');
    expect(response.body).toHaveProperty('mensagem');
    expect(response.body).toHaveProperty('detalhesAvaliacao');
    
    // Como o resultado é parcialmente aleatório devido aos mocks,
    // só validamos que o formato da resposta está correto.
    expect(['APROVADO', 'REPROVADO', 'ANALISE_MANUAL']).toContain(response.body.status);
  });
});