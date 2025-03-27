// tests/unit/dao/CenarioDAO.test.js
const CenarioDAO = require('../../../src/dao/CenarioDAO');
const { getDatabase } = require('../../../src/config/database');

// Mock do módulo de database
jest.mock('../../../src/config/database');

describe('CenarioDAO', () => {
  let cenarioDAO;
  let mockDB;
  let mockQueryBuilder;
  const mockThen = jest.fn();
  
  beforeEach(() => {
    // Mock de várias funções do knex
    mockQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnValue([1]), // Simula um ID retornado
      then: mockThen
    };
    
    // Mock do banco de dados
    mockDB = jest.fn().mockImplementation(() => mockQueryBuilder);
    // Configuração adicional para o método count
    mockDB.mockImplementation((table) => {
      if (typeof table === 'string') {
        return mockQueryBuilder;
      }
      return mockQueryBuilder;
    });
    
    // Configurar o getDatabase para retornar nosso mockDB
    getDatabase.mockReturnValue(mockDB);
    
    // Instanciar o DAO
    cenarioDAO = new CenarioDAO();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('salvar', () => {
    test('deve inserir cenário na tabela correta', async () => {
      // Mock de um cenário simples
      const cenario = {
        id: 'cen_12345',
        clienteId: 'CLI12345',
        valorCredito: 5000,
        dataCriacao: new Date(),
        status: 'APROVADO',
        regraFalhou: false,
        precisaAnaliseManual: false,
        parametrosAdicionais: { prazo: 12 },
        resultadosAvaliacao: []
      };
      
      // Configurar mocks para a inserção
      mockThen.mockImplementation((callback) => {
        return Promise.resolve(callback([cenario.id]));
      });
      
      // Chamar o método a ser testado
      await cenarioDAO.salvar(cenario);
      
      // Verificar se o método insert foi chamado corretamente
      expect(mockDB).toHaveBeenCalledWith('cenarios');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      
      // Verificar se os dados foram formatados corretamente
      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('id', cenario.id);
      expect(insertCall).toHaveProperty('cliente_id', cenario.clienteId);
      expect(insertCall).toHaveProperty('valor_credito', cenario.valorCredito);
      expect(insertCall).toHaveProperty('status', cenario.status);
    });
    
    test('deve salvar também os resultados de avaliação', async () => {
      // Mock de um cenário com resultados
      const cenario = {
        id: 'cen_12345',
        clienteId: 'CLI12345',
        valorCredito: 5000,
        dataCriacao: new Date(),
        status: 'APROVADO',
        regraFalhou: false,
        precisaAnaliseManual: false,
        parametrosAdicionais: { prazo: 12 },
        resultadosAvaliacao: [
          { regra: 'REGRA1', resultado: true, descricao: 'Descrição 1', dataAvaliacao: new Date() }
        ]
      };
      
      // Configurar mocks para a inserção
      mockThen.mockImplementation((callback) => {
        return Promise.resolve(callback([cenario.id]));
      });
      
      // Chamar o método a ser testado
      await cenarioDAO.salvar(cenario);
      
      // Verificar se o método insert foi chamado para cenarios e resultados_avaliacao
      expect(mockDB).toHaveBeenCalledWith('cenarios');
      expect(mockDB).toHaveBeenCalledWith('resultados_avaliacao');
    });
    
    test('deve salvar também o resultado da IA quando existir', async () => {
      // Mock de um cenário com resultado de IA
      const cenario = {
        id: 'cen_12345',
        clienteId: 'CLI12345',
        valorCredito: 5000,
        dataCriacao: new Date(),
        status: 'APROVADO',
        regraFalhou: false,
        precisaAnaliseManual: false,
        parametrosAdicionais: { prazo: 12 },
        resultadosAvaliacao: [],
        resultadoIA: {
          aprovado: true,
          justificativa: 'Aprovado pela IA',
          confianca: 0.9
        }
      };
      
      // Configurar mocks para a inserção
      mockThen.mockImplementation((callback) => {
        return Promise.resolve(callback([cenario.id]));
      });
      
      // Chamar o método a ser testado
      await cenarioDAO.salvar(cenario);
      
      // Verificar se o método insert foi chamado para cenarios e resultados_ia
      expect(mockDB).toHaveBeenCalledWith('cenarios');
      expect(mockDB).toHaveBeenCalledWith('resultados_ia');
    });
    
    test('deve tratar erros durante o salvamento', async () => {
      // Mock de um cenário simples
      const cenario = {
        id: 'cen_12345',
        clienteId: 'CLI12345',
        valorCredito: 5000
      };
      
      // Configurar mock para lançar erro
      mockQueryBuilder.insert.mockImplementation(() => {
        throw new Error('Erro ao inserir');
      });
      
      // Chamar o método e verificar se o erro é propagado
      await expect(cenarioDAO.salvar(cenario)).rejects.toThrow('Erro ao inserir');
    });
  });
  
  describe('buscarPorId', () => {
    test('deve buscar cenário pelo ID', async () => {
      // Mock de um cenário retornado do banco
      const cenarioRetornado = {
        id: 'cen_12345',
        cliente_id: 'CLI12345',
        valor_credito: 5000,
        data_criacao: new Date(),
        status: 'APROVADO',
        regra_falhou: false,
        precisa_analise_manual: false,
        parametros_adicionais: JSON.stringify({ prazo: 12 })
      };
      
      // Configurar mocks para a busca
      mockQueryBuilder.first.mockResolvedValueOnce(cenarioRetornado);
      
      // Também precisamos mockar a busca de resultados e resultado IA
      mockQueryBuilder.where.mockImplementation((campo, valor) => {
        if (campo === 'cenario_id' && valor === 'cen_12345') {
          if (mockDB.mock.calls[0][0] === 'resultados_avaliacao') {
            // Mock para resultados de avaliação
            mockQueryBuilder.orderBy.mockResolvedValueOnce([
              { regra: 'REGRA1', resultado: true, descricao: 'Descrição 1', data_avaliacao: new Date() }
            ]);
          } else if (mockDB.mock.calls[0][0] === 'resultados_ia') {
            // Mock para resultado IA
            mockQueryBuilder.first.mockResolvedValueOnce({
              aprovado: true, 
              justificativa: 'Justificativa IA', 
              confianca: 0.9
            });
          }
        }
        return mockQueryBuilder;
      });
      
      // Chamar o método a ser testado
      const resultado = await cenarioDAO.buscarPorId('cen_12345');
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('cenarios');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', 'cen_12345');
      expect(mockQueryBuilder.first).toHaveBeenCalled();
      
      // Verificar se o resultado foi convertido corretamente
      expect(resultado).toHaveProperty('id', 'cen_12345');
      expect(resultado).toHaveProperty('clienteId', 'CLI12345');
      expect(resultado).toHaveProperty('valorCredito', 5000);
      expect(resultado).toHaveProperty('status', 'APROVADO');
    });
    
    test('deve retornar null quando cenário não é encontrado', async () => {
      // Configurar mock para retornar null
      mockQueryBuilder.first.mockResolvedValueOnce(null);
      
      // Chamar o método a ser testado
      const resultado = await cenarioDAO.buscarPorId('cen_inexistente');
      
      // Verificar se o resultado é null
      expect(resultado).toBeNull();
    });
    
    test('deve tratar erros na conversão de parâmetros adicionais', async () => {
      // Mock com parâmetros inválidos
      const cenarioRetornado = {
        id: 'cen_12345',
        cliente_id: 'CLI12345',
        valor_credito: 5000,
        data_criacao: new Date(),
        status: 'APROVADO',
        parametros_adicionais: '{invalido}' // JSON inválido
      };
      
      // Configurar mock para retornar cenário com JSON inválido
      mockQueryBuilder.first.mockResolvedValueOnce(cenarioRetornado);
      mockQueryBuilder.where.mockImplementation(() => {
        return mockQueryBuilder;
      });
      mockQueryBuilder.orderBy.mockResolvedValueOnce([]);
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método a ser testado
      const resultado = await cenarioDAO.buscarPorId('cen_12345');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Verificar que o resultado ainda foi retornado
      expect(resultado).toHaveProperty('id', 'cen_12345');
      expect(resultado).toHaveProperty('parametrosAdicionais');
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
    
    test('deve tratar erros durante a busca', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.first.mockImplementation(() => {
        throw new Error('Erro ao buscar');
      });
      
      // Chamar o método e verificar se o erro é propagado
      await expect(cenarioDAO.buscarPorId('cen_12345')).rejects.toThrow('Erro ao buscar');
    });
  });
  
  describe('buscarPorCliente', () => {
    test('deve buscar cenários por cliente', async () => {
      // Mock de cenários retornados do banco
      const cenariosRetornados = [
        {
          id: 'cen_1',
          cliente_id: 'CLI12345',
          valor_credito: 5000,
          data_criacao: new Date(),
          status: 'APROVADO'
        },
        {
          id: 'cen_2',
          cliente_id: 'CLI12345',
          valor_credito: 10000,
          data_criacao: new Date(),
          status: 'REPROVADO'
        }
      ];
      
      // Configurar mocks para a busca
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.orderBy.mockResolvedValueOnce(cenariosRetornados);
      
      // Chamar o método a ser testado
      const resultado = await cenarioDAO.buscarPorCliente('CLI12345');
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('cenarios');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('cliente_id', 'CLI12345');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('data_criacao', 'desc');
      
      // Verificar o resultado
      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toHaveProperty('id', 'cen_1');
      expect(resultado[0]).toHaveProperty('clienteId', 'CLI12345');
      expect(resultado[1]).toHaveProperty('id', 'cen_2');
      expect(resultado[1]).toHaveProperty('status', 'REPROVADO');
    });
    
    test('deve retornar array vazio quando não encontrar cenários', async () => {
      // Configurar mock para retornar array vazio
      mockQueryBuilder.orderBy.mockResolvedValueOnce([]);
      
      // Chamar o método a ser testado
      const resultado = await cenarioDAO.buscarPorCliente('CLI_SEM_CENARIOS');
      
      // Verificar o resultado
      expect(resultado).toHaveLength(0);
    });
    
    test('deve tratar erros durante a busca', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.orderBy.mockImplementation(() => {
        throw new Error('Erro ao buscar cenários');
      });
      
      // Chamar o método e verificar se o erro é propagado
      await expect(cenarioDAO.buscarPorCliente('CLI12345')).rejects.toThrow('Erro ao buscar cenários');
    });
  });
});