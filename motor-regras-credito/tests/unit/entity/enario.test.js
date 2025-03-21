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
});
