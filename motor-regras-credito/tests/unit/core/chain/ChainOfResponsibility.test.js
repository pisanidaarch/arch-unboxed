// tests/unit/core/chain/ChainOfResponsibility.test.js
const ChainOfResponsibility = require('../../../../src/core/chain/ChainOfResponsibility');
const Cenario = require('../../../../src/entity/Cenario');

// Mock do console.log
const originalConsoleLog = console.log;

describe('ChainOfResponsibility', () => {
  // Mocks de handlers
  const mockHandler1 = {
    constructor: { name: 'MockHandler1' },
    processar: jest.fn().mockImplementation(cenario => {
      return { ...cenario };
    })
  };
  
  const mockHandler2 = {
    constructor: { name: 'MockHandler2' },
    processar: jest.fn().mockImplementation(cenario => {
      return { ...cenario, regraFalhou: true };
    })
  };
  
  const mockIAHandler = {
    constructor: { name: 'RequisicaoIAHandler' },
    processar: jest.fn().mockImplementation(cenario => {
      return { 
        ...cenario, 
        resultadoIA: { 
          aprovado: false, 
          justificativa: 'Teste IA', 
          confianca: 0.9, 
          analiseManual: false 
        } 
      };
    })
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    console.log = jest.fn();
  });
  
  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });
  
  test('deve processar cenário com todos os handlers na ordem correta', async () => {
    // Configurar chain com handlers
    const chain = new ChainOfResponsibility([mockHandler1, mockHandler2, mockIAHandler]);
    
    // Criar cenário
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    
    // Processar cenário
    const result = await chain.processar(cenario);
    
    // Verificar que handler1 foi chamado
    expect(mockHandler1.processar).toHaveBeenCalled();
    
    // Verificar que handler2 foi chamado
    expect(mockHandler2.processar).toHaveBeenCalled();
    
    // Verificar que a IA foi chamada (pois mockHandler2 marca regraFalhou como true)
    expect(mockIAHandler.processar).toHaveBeenCalled();
    
    // Verificar resultados
    expect(result.regraFalhou).toBe(true);
    expect(result.resultadoIA).toBeDefined();
  });
  
  test('não deve chamar a IA quando todas as regras passam com sucesso', async () => {
    // Configurar chain apenas com handler1 (que não falha)
    const chain = new ChainOfResponsibility([mockHandler1, mockIAHandler]);
    
    // Criar cenário
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    
    // Processar cenário
    const result = await chain.processar(cenario);
    
    // Verificar que handler1 foi chamado
    expect(mockHandler1.processar).toHaveBeenCalled();
    
    // Verificar que a IA NÃO foi chamada
    expect(mockIAHandler.processar).not.toHaveBeenCalled();
    
    // Verificar resultados
    expect(result.regraFalhou).toBeFalsy();
    // Modificação: aceitar null ou undefined
    expect(result.resultadoIA == null).toBe(true);
  });
  
  test('deve chamar a IA quando alguma regra falha', async () => {
    // Configurar handler que falha
    const handlerQueFalha = {
      constructor: { name: 'HandlerQueFalha' },
      processar: jest.fn().mockImplementation(cenario => {
        return { ...cenario, regraFalhou: true };
      })
    };
    
    // Configurar chain
    const chain = new ChainOfResponsibility([handlerQueFalha, mockIAHandler]);
    
    // Criar cenário
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    
    // Processar cenário
    const result = await chain.processar(cenario);
    
    // Verificar que handlerQueFalha foi chamado
    expect(handlerQueFalha.processar).toHaveBeenCalled();
    
    // Verificar que a IA foi chamada
    expect(mockIAHandler.processar).toHaveBeenCalled();
    
    // Verificar resultados
    expect(result.regraFalhou).toBe(true);
    expect(result.resultadoIA).toBeDefined();
  });
  
  test('deve chamar a IA quando precisaAnaliseManual é true', async () => {
    // Configurar handler que marca para análise manual
    const handlerAnaliseManual = {
      constructor: { name: 'HandlerAnaliseManual' },
      processar: jest.fn().mockImplementation(cenario => {
        return { ...cenario, precisaAnaliseManual: true, motivoAnaliseManual: 'Teste' };
      })
    };
    
    // Configurar chain
    const chain = new ChainOfResponsibility([handlerAnaliseManual, mockIAHandler]);
    
    // Criar cenário
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    
    // Processar cenário
    const result = await chain.processar(cenario);
    
    // Verificar que handlerAnaliseManual foi chamado
    expect(handlerAnaliseManual.processar).toHaveBeenCalled();
    
    // Verificar que a IA foi chamada
    expect(mockIAHandler.processar).toHaveBeenCalled();
    
    // Verificar resultados
    expect(result.precisaAnaliseManual).toBe(true);
    expect(result.motivoAnaliseManual).toBe('Teste');
    expect(result.resultadoIA).toBeDefined();
  });
  
  test('deve parar de processar regular handlers após uma falha', async () => {
    // Handler 1 - não falha
    const handler1 = {
      constructor: { name: 'Handler1' },
      processar: jest.fn().mockImplementation(cenario => {
        return { ...cenario };
      })
    };
    
    // Handler 2 - falha
    const handler2 = {
      constructor: { name: 'Handler2' },
      processar: jest.fn().mockImplementation(cenario => {
        return { ...cenario, regraFalhou: true };
      })
    };
    
    // Handler 3 - nunca deveria ser chamado
    const handler3 = {
      constructor: { name: 'Handler3' },
      processar: jest.fn()
    };
    
    // Configurar chain
    const chain = new ChainOfResponsibility([handler1, handler2, handler3, mockIAHandler]);
    
    // Criar cenário
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    
    // Processar cenário
    await chain.processar(cenario);
    
    // Verificar que handler1 e handler2 foram chamados
    expect(handler1.processar).toHaveBeenCalled();
    expect(handler2.processar).toHaveBeenCalled();
    
    // Verificar que handler3 NÃO foi chamado (pois handler2 falhou)
    expect(handler3.processar).not.toHaveBeenCalled();
    
    // Verificar que a IA foi chamada
    expect(mockIAHandler.processar).toHaveBeenCalled();
  });
  
  test('deve funcionar sem um handler IA', async () => {
    // Configurar chain sem IA
    const chain = new ChainOfResponsibility([mockHandler1, mockHandler2]);
    
    // Criar cenário
    const cenario = new Cenario();
    cenario.clienteId = 'CLI12345';
    
    // Processar cenário
    const result = await chain.processar(cenario);
    
    // Verificar que os handlers foram chamados
    expect(mockHandler1.processar).toHaveBeenCalled();
    expect(mockHandler2.processar).toHaveBeenCalled();
    
    // Verificar resultados
    expect(result.regraFalhou).toBe(true);
    // Modificação: aceitar null ou undefined
    expect(result.resultadoIA == null).toBe(true);
  });
});