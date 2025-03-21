// tests/unit/core/GerenciadorCenario.test.js
const GerenciadorCenario = require('../../../src/core/GerenciadorCenario');
const Cenario = require('../../../src/entity/Cenario');

describe('GerenciadorCenario', () => {
  // Mock dos adapters
  const mockAdapter1 = {
    getTipo: jest.fn().mockReturnValue('TIPO_1'),
    carregarDados: jest.fn().mockResolvedValue({ dados: 'dados1' })
  };

  const mockAdapter2 = {
    getTipo: jest.fn().mockReturnValue('TIPO_2'),
    carregarDados: jest.fn().mockResolvedValue({ dados: 'dados2' })
  };

  const mockAdapterComErro = {
    getTipo: jest.fn().mockReturnValue('TIPO_ERRO'),
    carregarDados: jest.fn().mockRejectedValue(new Error('Erro de teste'))
  };

  let gerenciadorCenario;
  const clienteId = '12345';
  const valorCredito = 5000;

  beforeEach(() => {
    jest.clearAllMocks();
    // Cria um spy no console.error para evitar logs durante os testes
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restaura o console.error original
    console.error.mockRestore();
  });

  test('deve criar cenário e carregar dados de todos os adapters', async () => {
    gerenciadorCenario = new GerenciadorCenario([mockAdapter1, mockAdapter2]);
    
    const cenario = await gerenciadorCenario.criarCenario(clienteId, valorCredito);
    
    // Verifica se o cenário foi criado corretamente
    expect(cenario).toBeInstanceOf(Cenario);
    expect(cenario.clienteId).toBe(clienteId);
    expect(cenario.valorCredito).toBe(valorCredito);
    
    // Verifica se os adapters foram chamados
    expect(mockAdapter1.carregarDados).toHaveBeenCalledWith(clienteId);
    expect(mockAdapter2.carregarDados).toHaveBeenCalledWith(clienteId);
    
    // Verifica se os dados foram adicionados ao cenário
    expect(cenario.getDadosPorTipo('TIPO_1')).toEqual({ dados: 'dados1' });
    expect(cenario.getDadosPorTipo('TIPO_2')).toEqual({ dados: 'dados2' });
  });

  test('deve continuar carregando dados mesmo se um adapter falhar', async () => {
    gerenciadorCenario = new GerenciadorCenario([mockAdapter1, mockAdapterComErro, mockAdapter2]);
    
    const cenario = await gerenciadorCenario.criarCenario(clienteId, valorCredito);
    
    // Verifica se o erro foi registrado
    expect(console.error).toHaveBeenCalled();
    
    // Verifica se os outros adapters ainda foram chamados e os dados foram carregados
    expect(mockAdapter1.carregarDados).toHaveBeenCalledWith(clienteId);
    expect(mockAdapter2.carregarDados).toHaveBeenCalledWith(clienteId);
    
    expect(cenario.getDadosPorTipo('TIPO_1')).toEqual({ dados: 'dados1' });
    expect(cenario.getDadosPorTipo('TIPO_2')).toEqual({ dados: 'dados2' });
    expect(cenario.getDadosPorTipo('TIPO_ERRO')).toEqual({});
  });

  test('deve marcar status como APROVADO quando todos os resultados são aprovados', () => {
    gerenciadorCenario = new GerenciadorCenario([]);
    
    const cenario = new Cenario();
    cenario.adicionarResultadoAvaliacao('REGRA1', true, 'Descrição 1');
    cenario.adicionarResultadoAvaliacao('REGRA2', true, 'Descrição 2');
    
    const cenarioMarcado = gerenciadorCenario.marcarStatusCenario(cenario);
    
    expect(cenarioMarcado.status).toBe('APROVADO');
  });

  test('deve marcar status como REPROVADO quando algum resultado é reprovado', () => {
    gerenciadorCenario = new GerenciadorCenario([]);
    
    const cenario = new Cenario();
    cenario.adicionarResultadoAvaliacao('REGRA1', true, 'Descrição 1');
    cenario.adicionarResultadoAvaliacao('REGRA2', false, 'Descrição 2');
    cenario.regraFalhou = true;
    
    const cenarioMarcado = gerenciadorCenario.marcarStatusCenario(cenario);
    
    expect(cenarioMarcado.status).toBe('REPROVADO');
  });

  test('deve marcar status como ANALISE_MANUAL quando necessário', () => {
    gerenciadorCenario = new GerenciadorCenario([]);
    
    const cenario = new Cenario();
    cenario.adicionarResultadoAvaliacao('REGRA1', true, 'Descrição 1');
    cenario.precisaAnaliseManual = true;
    
    const cenarioMarcado = gerenciadorCenario.marcarStatusCenario(cenario);
    
    expect(cenarioMarcado.status).toBe('ANALISE_MANUAL');
  });
});