// tests/unit/utils/CenarioHelper.test.js
const { restaurarMetodosCenario } = require('../../../src/utils/CenarioHelper');

describe('CenarioHelper', () => {
  // Mock de console.error
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
  
  test('deve restaurar métodos de um cenário que não os possui', () => {
    // Criar um objeto cenário sem métodos
    const cenario = {
      id: 'cen_12345',
      clienteId: 'CLI12345',
      valorCredito: 10000,
      dataCriacao: new Date(),
      dadosCenario: [
        { tipo: 'DADOS_CLIENTE', dados: { nome: 'Cliente Teste' } }
      ],
      resultadosAvaliacao: []
    };
    
    // Restaurar métodos
    const cenarioRestaurado = restaurarMetodosCenario(cenario);
    
    // Verificar se os métodos foram restaurados
    expect(typeof cenarioRestaurado.getDadosPorTipo).toBe('function');
    expect(typeof cenarioRestaurado.adicionarResultadoAvaliacao).toBe('function');
    expect(typeof cenarioRestaurado.todosResultadosAprovados).toBe('function');
    expect(typeof cenarioRestaurado.adicionarDados).toBe('function');
    expect(typeof cenarioRestaurado.salvar).toBe('function');
    
    // Testar os métodos restaurados
    const dados = cenarioRestaurado.getDadosPorTipo('DADOS_CLIENTE');
    expect(dados).toEqual({ nome: 'Cliente Teste' });
    
    cenarioRestaurado.adicionarResultadoAvaliacao('REGRA_TESTE', true, 'Teste');
    expect(cenarioRestaurado.resultadosAvaliacao.length).toBe(1);
    
    const todosAprovados = cenarioRestaurado.todosResultadosAprovados();
    expect(todosAprovados).toBe(true);
    
    cenarioRestaurado.adicionarDados('NOVO_TIPO', { valor: 'teste' });
    expect(cenarioRestaurado.dadosCenario.length).toBe(2);
  });
  
  test('não deve modificar cenário que já possui todos os métodos', () => {
    // Criar um objeto cenário que já tem os métodos
    const cenario = {
      id: 'cen_12345',
      clienteId: 'CLI12345',
      valorCredito: 10000,
      dataCriacao: new Date(),
      dadosCenario: [
        { tipo: 'DADOS_CLIENTE', dados: { nome: 'Cliente Teste' } }
      ],
      resultadosAvaliacao: [],
      getDadosPorTipo: jest.fn(),
      adicionarResultadoAvaliacao: jest.fn(),
      todosResultadosAprovados: jest.fn(),
      adicionarDados: jest.fn(),
      salvar: jest.fn()
    };
    
    // Clonar para comparar depois
    const cenarioOriginal = { ...cenario };
    
    // Restaurar métodos
    const cenarioRestaurado = restaurarMetodosCenario(cenario);
    
    // Verificar que as referências aos métodos não mudaram
    expect(cenarioRestaurado.getDadosPorTipo).toBe(cenario.getDadosPorTipo);
    expect(cenarioRestaurado.adicionarResultadoAvaliacao).toBe(cenario.adicionarResultadoAvaliacao);
    expect(cenarioRestaurado.todosResultadosAprovados).toBe(cenario.todosResultadosAprovados);
    expect(cenarioRestaurado.adicionarDados).toBe(cenario.adicionarDados);
    expect(cenarioRestaurado.salvar).toBe(cenario.salvar);
  });
  
  test('deve restaurar apenas os métodos faltantes', () => {
    // Criar um objeto cenário com apenas alguns métodos
    const cenario = {
      id: 'cen_12345',
      clienteId: 'CLI12345',
      valorCredito: 10000,
      dataCriacao: new Date(),
      dadosCenario: [
        { tipo: 'DADOS_CLIENTE', dados: { nome: 'Cliente Teste' } }
      ],
      resultadosAvaliacao: [],
      getDadosPorTipo: jest.fn(),  // Este método já existe
      adicionarResultadoAvaliacao: jest.fn()  // Este método já existe
    };
    
    // Restaurar métodos
    const cenarioRestaurado = restaurarMetodosCenario(cenario);
    
    // Verificar que os métodos existentes não mudaram
    expect(cenarioRestaurado.getDadosPorTipo).toBe(cenario.getDadosPorTipo);
    expect(cenarioRestaurado.adicionarResultadoAvaliacao).toBe(cenario.adicionarResultadoAvaliacao);
    
    // Verificar que os métodos faltantes foram adicionados
    expect(typeof cenarioRestaurado.todosResultadosAprovados).toBe('function');
    expect(typeof cenarioRestaurado.adicionarDados).toBe('function');
    expect(typeof cenarioRestaurado.salvar).toBe('function');
  });
  
  test('deve lidar com null ou undefined', () => {
    // Testar com null
    const cenarioNull = null;
    const resultadoNull = restaurarMetodosCenario(cenarioNull);
    expect(resultadoNull).toBe(null);
    expect(console.error).toHaveBeenCalled();
    
    // Testar com undefined
    console.error.mockClear();
    const cenarioUndefined = undefined;
    const resultadoUndefined = restaurarMetodosCenario(cenarioUndefined);
    expect(resultadoUndefined).toBe(undefined);
    expect(console.error).toHaveBeenCalled();
  });
  
  test('deve lidar com objeto sem dadosCenario', () => {
    // Criar um objeto cenário sem o array dadosCenario
    const cenario = {
      id: 'cen_12345',
      clienteId: 'CLI12345',
      valorCredito: 10000,
      resultadosAvaliacao: []
    };
    
    // Restaurar métodos
    const cenarioRestaurado = restaurarMetodosCenario(cenario);
    
    // Tentar usar getDadosPorTipo
    const dados = cenarioRestaurado.getDadosPorTipo('TIPO_INEXISTENTE');
    
    // Deve ter chamado console.error
    expect(console.error).toHaveBeenCalled();
    expect(dados).toEqual({});
  });
  
  test('deve lidar com objeto sem resultadosAvaliacao', () => {
    // Criar um objeto cenário sem o array resultadosAvaliacao
    const cenario = {
      id: 'cen_12345',
      clienteId: 'CLI12345',
      valorCredito: 10000,
      dadosCenario: []
    };
    
    // Restaurar métodos
    const cenarioRestaurado = restaurarMetodosCenario(cenario);
    
    // Adicionar resultado
    cenarioRestaurado.adicionarResultadoAvaliacao('REGRA_TESTE', true, 'Teste');
    
    // Deve ter criado o array
    expect(Array.isArray(cenarioRestaurado.resultadosAvaliacao)).toBe(true);
    expect(cenarioRestaurado.resultadosAvaliacao.length).toBe(1);
  });
  
  test('deve criar stub de método salvar', async () => {
    // Criar um objeto cenário simples
    const cenario = {
      id: 'cen_12345',
      clienteId: 'CLI12345'
    };
    
    // Restaurar métodos
    const cenarioRestaurado = restaurarMetodosCenario(cenario);
    
    // Chamar método salvar restaurado (stub)
    const resultado = await cenarioRestaurado.salvar();
    
    // Deve ter chamado console.warn e retornado o próprio cenário
    expect(console.warn).toHaveBeenCalled();
    expect(resultado).toBe(cenarioRestaurado);
  });
});