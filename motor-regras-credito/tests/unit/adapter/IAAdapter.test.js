// tests/unit/adapter/IAAdapter.test.js
const IAAdapter = require('../../../src/adapter/IAAdapter');
const Cenario = require('../../../src/entity/Cenario');
const ResultadoIA = require('../../../src/entity/ResultadoIA');
const axios = require('axios');

// Mock de axios
jest.mock('axios');

describe('IAAdapter', () => {
  // Mock do console
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  test('deve criar IAAdapter com configurações padrão', () => {
    const adapter = new IAAdapter();
    
    expect(adapter.endpoint).toBeDefined();
    expect(adapter.accessKey).toBeDefined();
    expect(adapter.model).toBeDefined();
    expect(adapter.timeout).toBeDefined();
  });
  
  test('deve criar IAAdapter com configurações personalizadas', () => {
    const adapter = new IAAdapter({
      endpoint: 'https://custom-endpoint.com',
      accessKey: 'custom-key',
      model: 'custom-model',
      timeout: 15000
    });
    
    expect(adapter.endpoint).toBe('https://custom-endpoint.com');
    expect(adapter.accessKey).toBe('custom-key');
    expect(adapter.model).toBe('custom-model');
    expect(adapter.timeout).toBe(15000);
  });
  
  test('deve preparar dados formatados para IA', () => {
    const adapter = new IAAdapter();
    
    // Criar cenário de teste
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Adicionar alguns dados ao cenário
    cenario.adicionarDados('DADOS_CLIENTE', {
      nome: 'Cliente Teste',
      idade: 35,
      sexo: 'M',
      rendaMensal: 8000
    });
    
    cenario.adicionarDados('BUREAU_CREDITO', {
      score: 750,
      status: 'REGULAR'
    });
    
    // Chamar prepararDadosParaIA
    const dadosFormatados = adapter.prepararDadosParaIA(cenario);
    
    // Verificar que os dados foram formatados corretamente
    expect(dadosFormatados).toBeDefined();
    expect(dadosFormatados.clienteId).toBe('CLI12345');
    expect(dadosFormatados.valorCredito).toBeDefined();
    expect(dadosFormatados.cliente).toBeDefined();
    expect(dadosFormatados.cliente.nome).toBe('Cliente Teste');
    expect(dadosFormatados.bureau).toBeDefined();
    expect(dadosFormatados.bureau.score).toBe(750);
  });
  
  test('deve avaliar crédito e processar resposta de function calling', async () => {
    const adapter = new IAAdapter();
    
    // Mock de resposta do axios com function calling
    axios.mockResolvedValueOnce({
      data: {
        tool_calls: [
          {
            function: {
              name: 'creditDecision',
              arguments: JSON.stringify({
                decision: 'APPROVE',
                confidence: 0.9,
                justification: 'Cliente com bom perfil'
              })
            }
          }
        ]
      }
    });
    
    // Criar cenário de teste
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Chamar avaliarCredito
    const resultado = await adapter.avaliarCredito(cenario);
    
    // Verificar que axios foi chamado
    expect(axios).toHaveBeenCalled();
    
    // Verificar resultado
    expect(resultado).toBeInstanceOf(ResultadoIA);
    expect(resultado.aprovado).toBe(true);
    expect(resultado.confianca).toBe(0.9);
    expect(resultado.justificativa).toBe('Cliente com bom perfil');
    expect(resultado.analiseManual).toBe(false);
  });
  
  test('deve avaliar crédito e processar resposta com formato JSON no texto', async () => {
    const adapter = new IAAdapter();
    
    // Mock de resposta do axios com JSON no texto
    axios.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: '```json\n{"decision":"REJECT","confidence":0.85,"justification":"Cliente com score baixo"}\n```'
            }
          }
        ]
      }
    });
    
    // Criar cenário de teste
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Chamar avaliarCredito
    const resultado = await adapter.avaliarCredito(cenario);
    
    // Verificar resultado
    expect(resultado).toBeInstanceOf(ResultadoIA);
    expect(resultado.aprovado).toBe(false);
    expect(resultado.confianca).toBe(0.85);
    expect(resultado.justificativa).toBe('Cliente com score baixo');
  });
  
  test('deve lidar com erro na chamada de API', async () => {
    const adapter = new IAAdapter();
    
    // Mock de erro no axios
    axios.mockRejectedValueOnce(new Error('API Error'));
    
    // Criar cenário de teste
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Chamar avaliarCredito
    const resultado = await adapter.avaliarCredito(cenario);
    
    // Verificar que resultado indica análise manual
    expect(resultado).toBeInstanceOf(ResultadoIA);
    expect(resultado.aprovado).toBe(false);
    expect(resultado.analiseManual).toBe(true);
    expect(resultado.justificativa).toContain('Erro ao consultar sistema de IA');
  });
  
  test('deve processar resposta com formato inválido', async () => {
    const adapter = new IAAdapter();
    
    // Mock de resposta do axios com formato inválido
    axios.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: 'Texto sem formato JSON'
            }
          }
        ]
      }
    });
    
    // Criar cenário de teste
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Chamar avaliarCredito
    const resultado = await adapter.avaliarCredito(cenario);
    
    // Verificar que resultado indica análise manual
    expect(resultado).toBeInstanceOf(ResultadoIA);
    expect(resultado.analiseManual).toBe(true);
  });
  
  test('deve detectar decisão MANUAL_REVIEW no function calling', async () => {
    const adapter = new IAAdapter();
    
    // Mock de resposta do axios com function calling solicitando análise manual
    axios.mockResolvedValueOnce({
      data: {
        tool_calls: [
          {
            function: {
              name: 'creditDecision',
              arguments: JSON.stringify({
                decision: 'MANUAL_REVIEW',
                confidence: 0.7,
                justification: 'Caso atípico que requer análise humana'
              })
            }
          }
        ]
      }
    });
    
    // Criar cenário de teste
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 50000;
    
    // Chamar avaliarCredito
    const resultado = await adapter.avaliarCredito(cenario);
    
    // Verificar resultado
    expect(resultado).toBeInstanceOf(ResultadoIA);
    expect(resultado.aprovado).toBe(false);
    expect(resultado.analiseManual).toBe(true);
    expect(resultado.justificativa).toBe('Caso atípico que requer análise humana');
    expect(resultado.confianca).toBe(0.7);
  });
});