// tests/unit/dao/ClienteDAO.test.js
const ClienteDAO = require('../../../src/dao/ClienteDAO');
const { getDatabase } = require('../../../src/config/database');

// Mock do módulo de database
jest.mock('../../../src/config/database');

describe('ClienteDAO', () => {
  let clienteDAO;
  let mockDB;
  let mockQueryBuilder;
  
  beforeEach(() => {
    // Mock de várias funções do knex
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis()
    };
    
    // Mock do banco de dados
    mockDB = jest.fn().mockImplementation(() => mockQueryBuilder);
    
    // Configurar o getDatabase para retornar nosso mockDB
    getDatabase.mockReturnValue(mockDB);
    
    // Instanciar o DAO
    clienteDAO = new ClienteDAO();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('buscarPorId', () => {
    test('deve buscar cliente pelo ID', async () => {
      // Mock de um cliente retornado do banco
      const clienteRetornado = {
        id: 'CLI12345',
        nome: 'Cliente Teste',
        idade: 35,
        sexo: 'M',
        renda_mensal: 5000,
        email: 'cliente@teste.com',
        telefone: '123456789',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '12345-678',
        cpf: '123.456.789-00'
      };
      
      // Configurar mock para retornar o cliente
      mockQueryBuilder.first.mockResolvedValueOnce(clienteRetornado);
      
      // Chamar o método a ser testado
      const resultado = await clienteDAO.buscarPorId('CLI12345');
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', 'CLI12345');
      expect(mockQueryBuilder.first).toHaveBeenCalled();
      
      // Verificar o resultado
      expect(resultado).toEqual(clienteRetornado);
    });
    
    test('deve retornar null quando cliente não é encontrado', async () => {
      // Configurar mock para retornar null
      mockQueryBuilder.first.mockResolvedValueOnce(null);
      
      // Chamar o método a ser testado
      const resultado = await clienteDAO.buscarPorId('CLI_INEXISTENTE');
      
      // Verificar o resultado
      expect(resultado).toBeNull();
    });
    
    test('deve tratar erros durante a busca', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.first.mockImplementation(() => {
        throw new Error('Erro ao buscar cliente');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(clienteDAO.buscarPorId('CLI12345')).rejects.toThrow('Erro ao buscar cliente');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('listar', () => {
    test('deve listar clientes com opções padrão', async () => {
      // Mock de clientes retornados do banco
      const clientesRetornados = [
        { id: 'CLI1', nome: 'Cliente 1', idade: 30, renda_mensal: 5000 },
        { id: 'CLI2', nome: 'Cliente 2', idade: 35, renda_mensal: 7000 }
      ];
      
      // Configurar mock para retornar os clientes
      mockQueryBuilder.limit.mockReturnThis();
      mockQueryBuilder.offset.mockReturnThis();
      mockQueryBuilder.orderBy.mockResolvedValueOnce(clientesRetornados);
      
      // Chamar o método a ser testado (sem opções)
      const resultado = await clienteDAO.listar();
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('nome');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10); // Valor padrão
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0); // Valor padrão
      
      // Verificar o resultado
      expect(resultado).toEqual(clientesRetornados);
    });
    
    test('deve listar clientes com opções personalizadas', async () => {
      // Mock de clientes retornados do banco
      const clientesRetornados = [
        { id: 'CLI1', nome: 'Cliente 1', idade: 30, renda_mensal: 5000 }
      ];
      
      // Configurar mock para retornar os clientes
      mockQueryBuilder.limit.mockReturnThis();
      mockQueryBuilder.offset.mockReturnThis();
      mockQueryBuilder.orderBy.mockResolvedValueOnce(clientesRetornados);
      
      // Opções personalizadas
      const opcoes = {
        limit: 1,
        offset: 5,
        ordem: 'idade'
      };
      
      // Chamar o método a ser testado com opções
      const resultado = await clienteDAO.listar(opcoes);
      
      // Verificar se os métodos foram chamados corretamente com as opções personalizadas
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('idade');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(5);
      
      // Verificar o resultado
      expect(resultado).toEqual(clientesRetornados);
    });
    
    test('deve tratar erros durante a listagem', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.orderBy.mockImplementation(() => {
        throw new Error('Erro ao listar clientes');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(clienteDAO.listar()).rejects.toThrow('Erro ao listar clientes');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('buscarHistoricoAnalises', () => {
    test('deve buscar histórico de análises por cliente', async () => {
      // Mock de análises retornadas do banco
      const analisesRetornadas = [
        { id: 'cen_1', valor_credito: 5000, status: 'APROVADO', data_criacao: new Date() },
        { id: 'cen_2', valor_credito: 10000, status: 'REPROVADO', data_criacao: new Date() }
      ];
      
      // Configurar mock para retornar as análises
      mockQueryBuilder.orderBy.mockResolvedValueOnce(analisesRetornadas);
      
      // Chamar o método a ser testado
      const resultado = await clienteDAO.buscarHistoricoAnalises('CLI12345');
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('cenarios');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('cliente_id', 'CLI12345');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('data_criacao', 'desc');
      
      // Verificar o resultado
      expect(resultado).toEqual(analisesRetornadas);
    });
    
    test('deve retornar array vazio quando não encontrar análises', async () => {
      // Configurar mock para retornar array vazio
      mockQueryBuilder.orderBy.mockResolvedValueOnce([]);
      
      // Chamar o método a ser testado
      const resultado = await clienteDAO.buscarHistoricoAnalises('CLI_SEM_ANALISES');
      
      // Verificar o resultado
      expect(resultado).toHaveLength(0);
    });
    
    test('deve tratar erros durante a busca do histórico', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.orderBy.mockImplementation(() => {
        throw new Error('Erro ao buscar histórico');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(clienteDAO.buscarHistoricoAnalises('CLI12345')).rejects.toThrow('Erro ao buscar histórico');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
});