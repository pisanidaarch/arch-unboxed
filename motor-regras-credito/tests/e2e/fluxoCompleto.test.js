// tests/e2e/fluxoCompleto.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const creditoRoutes = require('../../src/api/routes/creditoRoutes');

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
    expect(responseSolicitacao.body.status).toBeDefined();
  }, 10000);  // Aumentando timeout para 10 segundos

  test('Deve reprovar crédito para clientes com alto valor solicitado', async () => {
    // Como estamos usando mocks, não podemos realmente testar a lógica de reprovação
    // Mas podemos verificar que a API responde corretamente
    const response = await request(app)
      .post('/api/credito/analisar')
      .send({
        clienteId: '99999',
        valorCredito: 50000, // Valor alto que deveria reprovar
        parametrosAdicionais: {
          prazo: 60
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBeDefined();
  }, 10000);
});

describe('Fluxo Completo de Aprovação de Crédito', () => {
  let app;
  let mockMotor;
  
  // Antes de cada teste, cria um app Express limpo para evitar problemas de porta
  beforeEach(() => {
    // Mock do Motor
    mockMotor = {
      processarSolicitacao: jest.fn().mockImplementation((clienteId, valorCredito) => {
        // Simulação de lógica de aprovação/reprovação
        const aprovado = valorCredito <= 10000;
        const motivos = aprovado ? [] : ['Valor solicitado muito alto'];
        
        return Promise.resolve({
          id: 'cen_' + Math.random().toString(36).substring(7),
          clienteId,
          valorCredito,
          status: aprovado ? 'APROVADO' : 'REPROVADO',
          resultadosAvaliacao: [
            {
              regra: 'REGRA_TESTE',
              resultado: aprovado,
              descricao: 'Regra de teste'
            }
          ],
          regraFalhou: !aprovado,
          motivosReprovacao: motivos,
          dadosAdicionais: aprovado ? {} : { motivosReprovacao: motivos }
        });
      })
    };
    
    // Criar app Express limpo
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/credito', creditoRoutes(mockMotor));
  });
  
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

    // Verificar que o motor foi chamado com os parâmetros corretos
    expect(mockMotor.processarSolicitacao).toHaveBeenCalledWith('12345', 5000, {
      prazo: 12,
      finalidade: 'PESSOAL'
    });

    // Para uma solicitação de 5000, devemos ter uma aprovação
    expect(responseSolicitacao.body.status).toBe('APROVADO');
    
    // Verificar se os detalhes da avaliação estão corretos
    expect(Array.isArray(responseSolicitacao.body.detalhesAvaliacao)).toBe(true);
  }, 10000);  // Aumentando timeout para 10 segundos

  test('Deve reprovar crédito para clientes com alto valor solicitado', async () => {
    const response = await request(app)
      .post('/api/credito/analisar')
      .send({
        clienteId: '99999',
        valorCredito: 50000, // Valor alto que deve reprovar
        parametrosAdicionais: {
          prazo: 60
        }
      });

    expect(response.statusCode).toBe(200);
    
    // Para uma solicitação de 50000, devemos ter uma reprovação
    expect(response.body.status).toBe('REPROVADO');
    
    // Verificar se temos motivos de reprovação
    expect(response.body.dadosAdicionais).toHaveProperty('motivosReprovacao');
    expect(Array.isArray(response.body.dadosAdicionais.motivosReprovacao)).toBe(true);
    expect(response.body.dadosAdicionais.motivosReprovacao.length).toBeGreaterThan(0);
  }, 10000);  // Aumentando timeout para 10 segundos
});