// tests/unit/service/Motor.test.js
const Motor = require('../../../src/service/Motor');
const Cenario = require('../../../src/entity/Cenario');

describe('Motor', () => {
  // Mocks
  const mockCenario = new Cenario();
  mockCenario.clienteId = '12345';
  mockCenario.valorCredito = 5000;

  const mockCenarioProcessado = { ...mockCenario, regraFalhou: false };
  const mockCenarioFinal = { ...mockCenarioProcessado, status: 'APROVADO' };

  // Mock do gerenciador de cenário
  const mockGerenciadorCenario = {
    criarCenario: jest.fn().mockResolvedValue(mockCenario),
    marcarStatusCenario: jest.fn().mockReturnValue(mockCenarioFinal)
  };

  // Mock da chain of responsibility
  const mockChainOfResponsibility = {
    processar: jest.fn().mockResolvedValue(mockCenarioProcessado)
  };

  // Mock do serviço de log
  const mockLogService = {
    registrarInicio: jest.fn(),
    registrarSucesso: jest.fn(),
    registrarErro: jest.fn()
  };

  let motor;

  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
    motor = new Motor(mockGerenciadorCenario, mockChainOfResponsibility, mockLogService);
  });

  test('deve processar solicitação com sucesso', async () => {
    const clienteId = '12345';
    const valorCredito = 5000;
    const parametrosAdicionais = { prazo: 12 };

    const resultado = await motor.processarSolicitacao(clienteId, valorCredito, parametrosAdicionais);

    // Verifica se os métodos foram chamados com os parâmetros corretos
    expect(mockLogService.registrarInicio).toHaveBeenCalledWith(clienteId, valorCredito);
    expect(mockGerenciadorCenario.criarCenario).toHaveBeenCalledWith(clienteId, valorCredito, parametrosAdicionais);
    expect(mockChainOfResponsibility.processar).toHaveBeenCalledWith(mockCenario);
    expect(mockGerenciadorCenario.marcarStatusCenario).toHaveBeenCalledWith(mockCenarioProcessado);
    expect(mockLogService.registrarSucesso).toHaveBeenCalledWith(mockCenarioFinal);

    // Verifica o resultado
    expect(resultado).toBe(mockCenarioFinal);
  });

  test('deve tratar erros corretamente', async () => {
    const clienteId = '12345';
    const valorCredito = 5000;
    const erro = new Error('Erro de teste');

    // Configura o mock para lançar um erro
    mockGerenciadorCenario.criarCenario.mockRejectedValueOnce(erro);

    // Verifica se o erro é propagado e o log é registrado
    await expect(motor.processarSolicitacao(clienteId, valorCredito)).rejects.toThrow(erro);
    expect(mockLogService.registrarErro).toHaveBeenCalledWith(erro, clienteId, valorCredito);
  });
});