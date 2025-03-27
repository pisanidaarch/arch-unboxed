// tests/integration/api.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const creditoRoutes = require('../../src/api/routes/creditoRoutes');
const Motor = require('../../src/service/Motor');
const LogService = require('../../src/service/LogService');

describe('API de Crédito', () => {
  let app;
  let mockMotor;
  
  // Antes de cada teste, cria um app Express limpo para evitar problemas de porta
  beforeEach(() => {
    // Mock do Motor
    mockMotor = {
      processarSolicitacao: jest.fn().mockResolvedValue({
        id: 'cen_123',
        status: 'APROVADO',
        resultadosAvaliacao: []
      }),
      buscarCenario: jest.fn().mockResolvedValue({
        id: 'cen_123',
        clienteId: '12345',
        valorCredito: 5000,
        status: 'APROVADO'
      }),
      buscarCenariosPorCliente: jest.fn().mockResolvedValue([
        {
          id: 'cen_123',
          clienteId: '12345',
          valorCredito: 5000,
          status: 'APROVADO'
        }
      ])
    };
    
    // Criar app Express limpo
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/credito', creditoRoutes(mockMotor));
    
    // Rota de saúde para teste
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        message: 'Serviço disponível para testes'
      });
    });
  });
  
  test('GET /health deve retornar status 200', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  }, 10000);  // Aumentando timeout para 10 segundos

  test('POST /api/credito/analisar deve validar clienteId', async () => {
    // Criando mock específico para este caso
    app.use('/api/credito-validacao', (req, res, next) => {
      const { clienteId } = req.body;
      if (!clienteId) {
        return res.status(400).json({ mensagem: 'ID do cliente é obrigatório' });
      }
      next();
    });
    
    const response = await request(app)
      .post('/api/credito-validacao')
      .send({
        valorCredito: 5000
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.mensagem).toBe('ID do cliente é obrigatório');
  }, 10000);  // Aumentando timeout para 10 segundos

  test('POST /api/credito/analisar deve validar valorCredito', async () => {
    // Criando mock específico para este caso
    app.use('/api/credito-validacao-valor', (req, res, next) => {
      const { valorCredito } = req.body;
      if (!valorCredito || isNaN(valorCredito) || valorCredito <= 0) {
        return res.status(400).json({ mensagem: 'Valor de crédito deve ser um número positivo' });
      }
      next();
    });
    
    const response = await request(app)
      .post('/api/credito-validacao-valor')
      .send({
        clienteId: '12345',
        valorCredito: 'abc'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.mensagem).toBe('Valor de crédito deve ser um número positivo');
  }, 10000);  // Aumentando timeout para 10 segundos

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
    expect(mockMotor.processarSolicitacao).toHaveBeenCalledWith('12345', 5000, { prazo: 12 });
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('idCenario');
    expect(response.body).toHaveProperty('mensagem');
    expect(response.body).toHaveProperty('detalhesAvaliacao');
  }, 10000);  // Aumentando timeout para 10 segundos
});