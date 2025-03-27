// tests/unit/api/controllers/CreditoController.test.js
const CreditoController = require('../../../../src/api/controllers/CreditoController');
const ClienteDAO = require('../../../../src/dao/ClienteDAO');

// Mock de ClienteDAO
jest.mock('../../../../src/dao/ClienteDAO');

describe('CreditoController', () => {
  let creditoController;
  let mockMotor;
  let mockReq;
  let mockRes;
  let mockNext;
  let mockClienteDAO;
  
  beforeEach(() => {
    // Mock do ClienteDAO
    mockClienteDAO = {
      buscarPorId: jest.fn()
    };
    // Usar o mock diretamente na instanciação
    ClienteDAO.mockImplementation(() => mockClienteDAO);
    
    // Mock do motor
    mockMotor = {
      processarSolicitacao: jest.fn().mockResolvedValue({
        id: 'cen_12345',
        status: 'APROVADO',
        resultadosAvaliacao: [],
        clienteId: '12345'
      }),
      buscarCenario: jest.fn().mockResolvedValue({
        id: 'cen_12345',
        clienteId: '12345',
        valorCredito: 5000,
        status: 'APROVADO',
        resultadosAvaliacao: [],
        getDadosPorTipo: jest.fn().mockReturnValue({})
      }),
      buscarCenariosPorCliente: jest.fn().mockResolvedValue([
        {
          id: 'cen_12345',
          clienteId: '12345',
          valorCredito: 5000,
          status: 'APROVADO'
        }
      ])
    };
    
    // Inicializar controller
    creditoController = new CreditoController(mockMotor);
    
    // Mocks para request, response e next
    mockReq = {
      body: {},
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
    
    // Configure a resposta padrão para o mock do ClienteDAO
    // Isso será sobrescrito por testes específicos quando necessário
    mockClienteDAO.buscarPorId.mockResolvedValue({
      id: '12345',
      nome: 'Cliente Teste',
      idade: 35,
      renda_mensal: 5000
    });
  });
  
  describe('analisarCredito', () => {
    test('deve processar solicitação de crédito com sucesso', async () => {
      // Preparar request
      mockReq.body = {
        clienteId: '12345',
        valorCredito: 5000,
        parametrosAdicionais: { prazo: 12 }
      };
      
      // Chamar método
      await creditoController.analisarCredito(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockMotor.processarSolicitacao).toHaveBeenCalledWith('12345', 5000, { prazo: 12 });
    });
    
    test('deve validar cliente inexistente', async () => {
      // Configurar cliente não encontrado explicitamente
      mockClienteDAO.buscarPorId.mockResolvedValueOnce(null);
      
      // Preparar request
      mockReq.body = {
        clienteId: '99999',
        valorCredito: 5000
      };
      
      // Chamar método
      await creditoController.analisarCredito(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0].mensagem).toContain('Cliente não encontrado');
    });
    
    test('deve validar clienteId ausente', async () => {
      // Preparar request sem clienteId
      mockReq.body = {
        valorCredito: 5000
      };
      
      // Chamar método
      await creditoController.analisarCredito(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0].mensagem).toContain('ID do cliente é obrigatório');
    });
    
    test('deve validar valorCredito ausente', async () => {
      // Preparar request sem valorCredito
      mockReq.body = {
        clienteId: '12345'
      };
      
      // Chamar método
      await creditoController.analisarCredito(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0].mensagem).toContain('Valor de crédito deve ser um número positivo');
    });
    
    test('deve adicionar motivos de reprovação quando reprovado', async () => {
      // Mock de cenário reprovado
      mockMotor.processarSolicitacao.mockResolvedValueOnce({
        id: 'cen_12345',
        status: 'REPROVADO',
        resultadosAvaliacao: [
          { regra: 'REGRA1', resultado: false, descricao: 'Motivo 1' }
        ]
      });
      
      // Preparar request
      mockReq.body = {
        clienteId: '12345',
        valorCredito: 5000
      };
      
      // Chamar método
      await creditoController.analisarCredito(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0].status).toBe('REPROVADO');
      expect(mockRes.json.mock.calls[0][0].dadosAdicionais.motivosReprovacao).toBeDefined();
      expect(mockRes.json.mock.calls[0][0].dadosAdicionais.motivosReprovacao).toContain('Motivo 1');
    });
    
    test('deve adicionar informações de análise manual quando necessário', async () => {
      // Mock de cenário para análise manual
      mockMotor.processarSolicitacao.mockResolvedValueOnce({
        id: 'cen_12345',
        status: 'ANALISE_MANUAL',
        motivoAnaliseManual: 'Necessidade de análise',
        resultadosAvaliacao: []
      });
      
      // Preparar request
      mockReq.body = {
        clienteId: '12345',
        valorCredito: 5000
      };
      
      // Chamar método
      await creditoController.analisarCredito(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0].status).toBe('ANALISE_MANUAL');
      expect(mockRes.json.mock.calls[0][0].dadosAdicionais.motivoAnaliseManual).toBeDefined();
      expect(mockRes.json.mock.calls[0][0].dadosAdicionais.estimativaTempo).toBeDefined();
    });
    
    test('deve tratar erros corretamente', async () => {
      // Mock para lançar erro
      mockMotor.processarSolicitacao.mockRejectedValueOnce(new Error('Erro de teste'));
      
      // Preparar request
      mockReq.body = {
        clienteId: '12345',
        valorCredito: 5000
      };
      
      // Chamar método
      await creditoController.analisarCredito(mockReq, mockRes, mockNext);
      
      // Verificar que next foi chamado com o erro
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });
  
  describe('consultarCenario', () => {
    test('deve retornar detalhes do cenário', async () => {
      // Preparar request
      mockReq.params = { id: 'cen_12345' };
      
      // Chamar método
      await creditoController.consultarCenario(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockMotor.buscarCenario).toHaveBeenCalledWith('cen_12345');
    });
    
    test('deve retornar 404 para cenário não encontrado', async () => {
      // Mock para cenário não encontrado
      mockMotor.buscarCenario.mockResolvedValueOnce(null);
      
      // Preparar request
      mockReq.params = { id: 'cen_99999' };
      
      // Chamar método
      await creditoController.consultarCenario(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0].mensagem).toContain('Cenário não encontrado');
    });
  });
  
  describe('consultarHistoricoCliente', () => {
    test('deve retornar histórico do cliente', async () => {
      // Preparar request
      mockReq.params = { clienteId: '12345' };
      
      // Chamar método
      await creditoController.consultarHistoricoCliente(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockMotor.buscarCenariosPorCliente).toHaveBeenCalledWith('12345');
    });
    
    test('deve retornar 404 para cliente não encontrado', async () => {
      // IMPORTANTE: Configurar cliente não encontrado explicitamente
      mockClienteDAO.buscarPorId.mockResolvedValueOnce(null);
      
      // Preparar request
      mockReq.params = { clienteId: '99999' };
      
      // Chamar método
      await creditoController.consultarHistoricoCliente(mockReq, mockRes, mockNext);
      
      // Verificar resultado
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockRes.json.mock.calls[0][0].mensagem).toContain('Cliente não encontrado');
    });
  });
  
  describe('getMensagemStatus', () => {
    test('deve retornar mensagem correta para status APROVADO', () => {
      const mensagem = creditoController.getMensagemStatus('APROVADO');
      expect(mensagem).toBe('Crédito aprovado com sucesso');
    });
    
    test('deve retornar mensagem correta para status REPROVADO', () => {
      const mensagem = creditoController.getMensagemStatus('REPROVADO');
      expect(mensagem).toBe('Crédito reprovado');
    });
    
    test('deve retornar mensagem correta para status ANALISE_MANUAL', () => {
      const mensagem = creditoController.getMensagemStatus('ANALISE_MANUAL');
      expect(mensagem).toBe('Solicitação enviada para análise manual');
    });
    
    test('deve retornar mensagem padrão para status desconhecido', () => {
      const mensagem = creditoController.getMensagemStatus('OUTRO_STATUS');
      expect(mensagem).toBe('Status desconhecido');
    });
  });
});