// tests/unit/service/LogService.test.js
const LogService = require('../../../src/service/LogService');

describe('LogService', () => {
  // Armazenar métodos originais do console
  const originalInfo = console.info;
  const originalError = console.error;
  const originalDebug = console.debug;
  
  beforeEach(() => {
    // Mock dos métodos do console
    console.info = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
  });
  
  afterEach(() => {
    // Restaurar métodos originais
    console.info = originalInfo;
    console.error = originalError;
    console.debug = originalDebug;
  });
  
  test('deve registrar início de processamento', () => {
    const logService = new LogService();
    const clienteId = 'CLI12345';
    const valorCredito = 10000;
    
    logService.registrarInicio(clienteId, valorCredito);
    
    expect(console.info).toHaveBeenCalled();
    // Correção: verificar se a string contém o clienteId como string
    expect(console.info.mock.calls[0][0]).toContain(clienteId);
    // Correção: verificar se a string contém o valor como string
    expect(console.info.mock.calls[0][0]).toContain(String(valorCredito));
  });
  
  test('deve registrar sucesso de processamento', () => {
    const logService = new LogService();
    const cenario = {
      id: 'cen_12345',
      clienteId: 'CLI12345',
      valorCredito: 10000,
      status: 'APROVADO',
      resultadosAvaliacao: [
        { regra: 'REGRA1', resultado: true },
        { regra: 'REGRA2', resultado: true }
      ]
    };
    
    logService.registrarSucesso(cenario);
    
    expect(console.info).toHaveBeenCalled();
    expect(console.debug).toHaveBeenCalled();
    expect(console.info.mock.calls[0][0]).toContain(cenario.clienteId);
    expect(console.info.mock.calls[0][0]).toContain(cenario.status);
  });
  
  test('deve registrar erro de processamento', () => {
    const logService = new LogService();
    const erro = new Error('Erro de teste');
    const clienteId = 'CLI12345';
    const valorCredito = 10000;
    
    logService.registrarErro(erro, clienteId, valorCredito);
    
    expect(console.error).toHaveBeenCalled();
    expect(console.error.mock.calls[0][0]).toContain(clienteId);
    // Correção: verificar se a string contém o valor como string
    expect(console.error.mock.calls[0][0]).toContain(String(valorCredito));
    expect(console.error.mock.calls[0][1]).toBe(erro);
  });
  
  test('deve registrar execução de regra', () => {
    const logService = new LogService();
    const nomeRegra = 'REGRA_TESTE';
    const resultado = true;
    const cenario = { clienteId: 'CLI12345' };
    
    logService.registrarExecucaoRegra(nomeRegra, resultado, cenario);
    
    expect(console.debug).toHaveBeenCalled();
    expect(console.debug.mock.calls[0][0]).toContain(nomeRegra);
    expect(console.debug.mock.calls[0][0]).toContain(cenario.clienteId);
    expect(console.debug.mock.calls[0][0]).toContain('APROVADO'); // Quando resultado é true
  });
  
  test('deve registrar execução de regra com resultado reprovado', () => {
    const logService = new LogService();
    const nomeRegra = 'REGRA_TESTE';
    const resultado = false;
    const cenario = { clienteId: 'CLI12345' };
    
    logService.registrarExecucaoRegra(nomeRegra, resultado, cenario);
    
    expect(console.debug).toHaveBeenCalled();
    expect(console.debug.mock.calls[0][0]).toContain(nomeRegra);
    expect(console.debug.mock.calls[0][0]).toContain(cenario.clienteId);
    expect(console.debug.mock.calls[0][0]).toContain('REPROVADO'); // Quando resultado é false
  });
  
  test('deve registrar consulta externa', () => {
    const logService = new LogService();
    const tipo = 'BUREAU_CREDITO';
    const clienteId = 'CLI12345';
    const sucesso = true;
    
    logService.registrarConsultaExterna(tipo, clienteId, sucesso);
    
    expect(console.info).toHaveBeenCalled();
    expect(console.info.mock.calls[0][0]).toContain(tipo);
    expect(console.info.mock.calls[0][0]).toContain(clienteId);
    expect(console.info.mock.calls[0][0]).toContain('sucesso');
  });
  
  test('deve registrar consulta externa com falha', () => {
    const logService = new LogService();
    const tipo = 'BUREAU_CREDITO';
    const clienteId = 'CLI12345';
    const sucesso = false;
    
    logService.registrarConsultaExterna(tipo, clienteId, sucesso);
    
    expect(console.info).toHaveBeenCalled();
    expect(console.info.mock.calls[0][0]).toContain(tipo);
    expect(console.info.mock.calls[0][0]).toContain(clienteId);
    expect(console.info.mock.calls[0][0]).toContain('falha');
  });
});