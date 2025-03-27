// tests/unit/entity/Cenario.test.js
const Cenario = require('../../../src/entity/Cenario');

describe('Cenario', () => {
  let cenario;

  beforeEach(() => {
    cenario = new Cenario();
  });

  test('deve criar um cenário com ID único', () => {
    expect(cenario.id).toBeDefined();
    expect(cenario.id).toMatch(/^cen_/);
  });

  test('deve adicionar dados ao cenário', () => {
    const dadosTeste = { valor: 'teste' };
    cenario.adicionarDados('TIPO_TESTE', dadosTeste);

    expect(cenario.dadosCenario).toHaveLength(1);
    expect(cenario.dadosCenario[0].tipo).toBe('TIPO_TESTE');
    expect(cenario.dadosCenario[0].dados).toBe(dadosTeste);
  });

  test('deve atualizar dados existentes quando o tipo já existe', () => {
    const dadosTeste1 = { valor: 'teste1' };
    const dadosTeste2 = { valor: 'teste2' };
    
    cenario.adicionarDados('TIPO_TESTE', dadosTeste1);
    cenario.adicionarDados('TIPO_TESTE', dadosTeste2);

    expect(cenario.dadosCenario).toHaveLength(1);
    expect(cenario.dadosCenario[0].tipo).toBe('TIPO_TESTE');
    expect(cenario.dadosCenario[0].dados).toBe(dadosTeste2);
  });

  test('deve recuperar dados por tipo', () => {
    const dadosTeste1 = { valor: 'teste1' };
    const dadosTeste2 = { valor: 'teste2' };
    
    cenario.adicionarDados('TIPO_1', dadosTeste1);
    cenario.adicionarDados('TIPO_2', dadosTeste2);

    expect(cenario.getDadosPorTipo('TIPO_1')).toBe(dadosTeste1);
    expect(cenario.getDadosPorTipo('TIPO_2')).toBe(dadosTeste2);
    expect(cenario.getDadosPorTipo('TIPO_INEXISTENTE')).toEqual({});
  });

  test('deve adicionar resultado de avaliação', () => {
    cenario.adicionarResultadoAvaliacao('REGRA_TESTE', true, 'Descrição da regra');

    expect(cenario.resultadosAvaliacao).toHaveLength(1);
    expect(cenario.resultadosAvaliacao[0].regra).toBe('REGRA_TESTE');
    expect(cenario.resultadosAvaliacao[0].resultado).toBe(true);
    expect(cenario.resultadosAvaliacao[0].descricao).toBe('Descrição da regra');
    expect(cenario.resultadosAvaliacao[0].dataAvaliacao).toBeInstanceOf(Date);
  });

  test('todos resultados aprovados deve retornar true quando todos resultados são positivos', () => {
    cenario.adicionarResultadoAvaliacao('REGRA_1', true, 'Regra 1');
    cenario.adicionarResultadoAvaliacao('REGRA_2', true, 'Regra 2');

    expect(cenario.todosResultadosAprovados()).toBe(true);
  });

  test('todos resultados aprovados deve retornar false quando algum resultado é negativo', () => {
    cenario.adicionarResultadoAvaliacao('REGRA_1', true, 'Regra 1');
    cenario.adicionarResultadoAvaliacao('REGRA_2', false, 'Regra 2');

    expect(cenario.todosResultadosAprovados()).toBe(false);
  });

  test('todos resultados aprovados deve retornar false quando não há resultados', () => {
    expect(cenario.todosResultadosAprovados()).toBe(false);
  });
  
  // NOVOS TESTES
  
  test('deve gerar JSON formatado para IA com toJsonForIA()', () => {
    // Configurar cenário com dados de teste
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    cenario.parametrosAdicionais = { prazo: 36 };
    
    // Adicionar dados do cliente
    cenario.adicionarDados('DADOS_CLIENTE', {
      nome: 'Cliente Teste',
      idade: 35,
      sexo: 'M',
      rendaMensal: 8000
    });
    
    // Adicionar dados do bureau
    cenario.adicionarDados('BUREAU_CREDITO', {
      score: 750,
      status: 'REGULAR'
    });
    
    // Adicionar dados do open banking
    cenario.adicionarDados('OPEN_BANKING', {
      possuiConta: true,
      saldoMedio: 5000
    });
    
    // Adicionar resultados de avaliação
    cenario.adicionarResultadoAvaliacao('REGRA_1', true, 'Regra 1');
    
    // Gerar JSON para IA
    const jsonParaIA = cenario.toJsonForIA();
    
    // Verificar estrutura do JSON
    expect(jsonParaIA).toBeDefined();
    expect(jsonParaIA.clienteId).toBe('CLI12345');
    expect(jsonParaIA.valorCredito).toBe('10000');
    expect(jsonParaIA.cliente).toBeDefined();
    expect(jsonParaIA.cliente.idade).toBe(35);
    expect(jsonParaIA.cliente.sexo).toBe('M');
    expect(jsonParaIA.bureau).toBeDefined();
    expect(jsonParaIA.bureau.score).toBe(750);
    expect(jsonParaIA.openBanking).toBeDefined();
    expect(jsonParaIA.openBanking.possuiConta).toBe(true);
    expect(jsonParaIA.resultadosAvaliacao).toHaveLength(1);
  });
  
  test('toJsonForIA() deve lidar corretamente com dados ausentes', () => {
    // Configurar cenário sem dados
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Não adicionar nenhum dado
    
    // Gerar JSON para IA
    const jsonParaIA = cenario.toJsonForIA();
    
    // Verificar que o JSON foi criado com valores padrão
    expect(jsonParaIA).toBeDefined();
    expect(jsonParaIA.cliente).toBeDefined();
    expect(jsonParaIA.cliente.nome).toBe('Desconhecido');
    expect(jsonParaIA.cliente.idade).toBe(0);
    expect(jsonParaIA.bureau).toBeDefined();
    expect(jsonParaIA.bureau.score).toBe(0);
    expect(jsonParaIA.openBanking).toBeDefined();
    expect(jsonParaIA.openBanking.possuiConta).toBe(false);
  });
  
  test('deve incluir arrays de histórico no toJsonForIA()', () => {
    // Configurar cenário com arrays
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    
    // Adicionar dados do bureau com histórico
    cenario.adicionarDados('BUREAU_CREDITO', {
      score: 750,
      status: 'REGULAR',
      historico: [
        { data: '2023-01-01', tipo: 'CONSULTA', valor: 5000, status: 'APROVADO' },
        { data: '2023-02-01', tipo: 'PAGAMENTO', valor: 1000, status: 'REGULAR' }
      ]
    });
    
    // Adicionar dados do open banking com contas e movimentações
    cenario.adicionarDados('OPEN_BANKING', {
      possuiConta: true,
      saldoMedio: 5000,
      contas: [
        { tipo: 'CORRENTE', saldo: 3000, dataCriacao: '2022-01-01', status: 'ATIVO' },
        { tipo: 'POUPANCA', saldo: 7000, dataCriacao: '2022-01-01', status: 'ATIVO' }
      ],
      movimentacoes: [
        { data: '2023-03-01', tipo: 'DEPOSITO', valor: 2000, descricao: 'Salário' },
        { data: '2023-03-10', tipo: 'SAQUE', valor: 500, descricao: 'Saque ATM' }
      ]
    });
    
    // Gerar JSON para IA
    const jsonParaIA = cenario.toJsonForIA();
    
    // Verificar que os arrays foram incluídos
    expect(jsonParaIA.bureau.historico).toBeDefined();
    expect(jsonParaIA.bureau.historico).toHaveLength(2);
    expect(jsonParaIA.bureau.historico[0].tipo).toBe('CONSULTA');
    
    expect(jsonParaIA.openBanking.contas).toBeDefined();
    expect(jsonParaIA.openBanking.contas).toHaveLength(2);
    expect(jsonParaIA.openBanking.contas[0].tipo).toBe('CORRENTE');
    
    expect(jsonParaIA.openBanking.movimentacoes).toBeDefined();
    expect(jsonParaIA.openBanking.movimentacoes).toHaveLength(2);
    expect(jsonParaIA.openBanking.movimentacoes[0].tipo).toBe('DEPOSITO');
  });
  
  test('deve executar logInfo() sem erros', () => {
    // Configurar cenário com dados básicos
    cenario.clienteId = 'CLI12345';
    cenario.valorCredito = 10000;
    cenario.adicionarDados('TIPO_1', { valor: 'teste' });
    cenario.adicionarResultadoAvaliacao('REGRA_1', true, 'Regra 1');
    
    // Mock do console.log para capturar a saída
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    // Executar logInfo
    cenario.logInfo();
    
    // Verificar que console.log foi chamado
    expect(console.log).toHaveBeenCalled();
    
    // Restaurar console.log original
    console.log = originalConsoleLog;
  });
});