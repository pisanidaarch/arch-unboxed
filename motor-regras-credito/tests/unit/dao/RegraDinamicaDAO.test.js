// tests/unit/dao/RegraDinamicaDAO.test.js
const RegraDinamicaDAO = require('../../../src/dao/RegraDinamicaDAO');
const { getDatabase } = require('../../../src/config/database');

// Mock do módulo de database
jest.mock('../../../src/config/database');

describe('RegraDinamicaDAO', () => {
  let regraDinamicaDAO;
  let mockDB;
  let mockQueryBuilder;
  
  beforeEach(() => {
    // Mock de várias funções do knex
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnValue([1]) // Simula um ID retornado
    };
    
    // Mock do banco de dados
    mockDB = jest.fn().mockImplementation(() => mockQueryBuilder);
    
    // Configurar o getDatabase para retornar nosso mockDB
    getDatabase.mockReturnValue(mockDB);
    
    // Instanciar o DAO
    regraDinamicaDAO = new RegraDinamicaDAO();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('listar', () => {
    test('deve listar regras dinâmicas sem filtros', async () => {
      // Mock de regras retornadas do banco
      const regrasRetornadas = [
        {
          id: 1,
          nome: 'REGRA_1',
          descricao: 'Descrição 1',
          tipo: 'COMPROMETIMENTO_RENDA',
          parametros: JSON.stringify({ percentualMaximo: 30 }),
          aprovada: true,
          origem: 'SISTEMA',
          ativa: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          nome: 'REGRA_2',
          descricao: 'Descrição 2',
          tipo: 'VALOR_MAXIMO',
          parametros: JSON.stringify({ valorMaximo: 5000 }),
          aprovada: false,
          origem: 'IA',
          ativa: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // Configurar mock para retornar as regras
      mockQueryBuilder.orderBy.mockResolvedValueOnce(regrasRetornadas);
      
      // Chamar o método a ser testado (sem filtros)
      const resultado = await regraDinamicaDAO.listar();
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('regras_dinamicas');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('id');
      
      // Verificar o resultado
      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toHaveProperty('id', 1);
      expect(resultado[0]).toHaveProperty('nome', 'REGRA_1');
      expect(resultado[0]).toHaveProperty('parametros');
      expect(resultado[0].parametros).toHaveProperty('percentualMaximo', 30);
    });
    
    test('deve listar regras dinâmicas com filtros', async () => {
      // Mock de regras filtradas retornadas do banco
      const regrasRetornadas = [
        {
          id: 1,
          nome: 'REGRA_1',
          descricao: 'Descrição 1',
          tipo: 'COMPROMETIMENTO_RENDA',
          parametros: JSON.stringify({ percentualMaximo: 30 }),
          aprovada: true,
          origem: 'SISTEMA',
          ativa: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // Configurar mock para retornar as regras filtradas
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.orderBy.mockResolvedValueOnce(regrasRetornadas);
      
      // Opções de filtro
      const opcoes = {
        ativas: true,
        aprovadas: true,
        origem: 'SISTEMA'
      };
      
      // Chamar o método a ser testado com filtros
      const resultado = await regraDinamicaDAO.listar(opcoes);
      
      // Verificar se os métodos foram chamados corretamente para filtragem
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ativa', true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('aprovada', true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('origem', 'SISTEMA');
      
      // Verificar o resultado
      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toHaveProperty('origem', 'SISTEMA');
    });
    
    test('deve tratar erro de parsing nos parâmetros', async () => {
      // Mock de regras com JSON inválido
      const regrasRetornadas = [
        {
          id: 1,
          nome: 'REGRA_1',
          descricao: 'Descrição 1',
          tipo: 'COMPROMETIMENTO_RENDA',
          parametros: '{invalido}', // JSON inválido
          aprovada: true,
          origem: 'SISTEMA',
          ativa: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // Configurar mock para retornar as regras
      mockQueryBuilder.orderBy.mockResolvedValueOnce(regrasRetornadas);
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método a ser testado
      const resultado = await regraDinamicaDAO.listar();
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Verificar que o resultado ainda é válido, mesmo com erro de parsing
      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toHaveProperty('parametros');
      expect(resultado[0].parametros).toEqual({});
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
    
    test('deve tratar erros durante a listagem', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.orderBy.mockImplementation(() => {
        throw new Error('Erro ao listar regras');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(regraDinamicaDAO.listar()).rejects.toThrow('Erro ao listar regras');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('buscarPorId', () => {
    test('deve buscar regra pelo ID', async () => {
      // Mock de regra retornada do banco
      const regraRetornada = {
        id: 1,
        nome: 'REGRA_1',
        descricao: 'Descrição 1',
        tipo: 'COMPROMETIMENTO_RENDA',
        parametros: JSON.stringify({ percentualMaximo: 30 }),
        aprovada: true,
        origem: 'SISTEMA',
        ativa: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Configurar mock para retornar a regra
      mockQueryBuilder.first.mockResolvedValueOnce(regraRetornada);
      
      // Chamar o método a ser testado
      const resultado = await regraDinamicaDAO.buscarPorId(1);
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('regras_dinamicas');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', 1);
      expect(mockQueryBuilder.first).toHaveBeenCalled();
      
      // Verificar o resultado
      expect(resultado).toHaveProperty('id', 1);
      expect(resultado).toHaveProperty('nome', 'REGRA_1');
      expect(resultado).toHaveProperty('parametros');
      expect(resultado.parametros).toHaveProperty('percentualMaximo', 30);
    });
    
    test('deve retornar null quando regra não é encontrada', async () => {
      // Configurar mock para retornar null
      mockQueryBuilder.first.mockResolvedValueOnce(null);
      
      // Chamar o método a ser testado
      const resultado = await regraDinamicaDAO.buscarPorId(999);
      
      // Verificar o resultado
      expect(resultado).toBeNull();
    });
    
    test('deve tratar erros durante a busca', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.first.mockImplementation(() => {
        throw new Error('Erro ao buscar regra');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(regraDinamicaDAO.buscarPorId(1)).rejects.toThrow('Erro ao buscar regra');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('inserir', () => {
    test('deve inserir uma nova regra', async () => {
      // Regra a ser inserida
      const regra = {
        nome: 'NOVA_REGRA',
        descricao: 'Nova regra para teste',
        tipo: 'COMPROMETIMENTO_RENDA',
        parametros: { percentualMaximo: 30 },
        aprovada: false,
        origem: 'TESTE',
        ativa: true
      };
      
      // Mock para o ID retornado
      mockQueryBuilder.returning.mockResolvedValueOnce([1]);
      
      // Mock para buscarPorId após inserção
      const regraInserida = {
        id: 1,
        nome: 'NOVA_REGRA',
        descricao: 'Nova regra para teste',
        tipo: 'COMPROMETIMENTO_RENDA',
        parametros: JSON.stringify({ percentualMaximo: 30 }),
        aprovada: false,
        origem: 'TESTE',
        ativa: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Spy/Mock no método buscarPorId
      regraDinamicaDAO.buscarPorId = jest.fn().mockResolvedValueOnce({
        ...regraInserida,
        parametros: { percentualMaximo: 30 } // Já convertido
      });
      
      // Chamar o método a ser testado
      const resultado = await regraDinamicaDAO.inserir(regra);
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('regras_dinamicas');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalledWith('id');
      
      // Verificar se os dados foram formatados corretamente para inserção
      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('nome', regra.nome);
      expect(insertCall).toHaveProperty('descricao', regra.descricao);
      expect(insertCall).toHaveProperty('tipo', regra.tipo);
      expect(insertCall).toHaveProperty('parametros');
      expect(insertCall).toHaveProperty('aprovada', regra.aprovada);
      
      // Verificar se buscarPorId foi chamado com o ID correto
      expect(regraDinamicaDAO.buscarPorId).toHaveBeenCalledWith(1);
      
      // Verificar o resultado
      expect(resultado).toHaveProperty('id', 1);
      expect(resultado).toHaveProperty('nome', regra.nome);
      expect(resultado).toHaveProperty('parametros');
      expect(resultado.parametros).toHaveProperty('percentualMaximo', 30);
    });
    
    test('deve tratar erros durante a inserção', async () => {
      // Regra a ser inserida
      const regra = {
        nome: 'NOVA_REGRA',
        descricao: 'Nova regra para teste',
        tipo: 'COMPROMETIMENTO_RENDA',
        parametros: { percentualMaximo: 30 }
      };
      
      // Configurar mock para lançar erro
      mockQueryBuilder.insert.mockImplementation(() => {
        throw new Error('Erro ao inserir regra');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(regraDinamicaDAO.inserir(regra)).rejects.toThrow('Erro ao inserir regra');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('atualizar', () => {
    test('deve atualizar uma regra existente', async () => {
      // ID da regra a ser atualizada
      const id = 1;
      
      // Dados para atualização
      const regra = {
        nome: 'REGRA_ATUALIZADA',
        descricao: 'Descrição atualizada',
        tipo: 'COMPROMETIMENTO_RENDA',
        parametros: { percentualMaximo: 25 },
        aprovada: true,
        origem: 'TESTE_ATUALIZADO',
        ativa: false
      };
      
      // Mock para o método buscarPorId para verificar se a regra existe
      const regraExistente = {
        id: 1,
        nome: 'REGRA_ANTIGA',
        descricao: 'Descrição antiga',
        tipo: 'COMPROMETIMENTO_RENDA',
        parametros: { percentualMaximo: 30 },
        aprovada: false,
        origem: 'TESTE',
        ativa: true
      };
      
      const regraAtualizada = {
        ...regraExistente,
        ...regra
      };
      
      // Spy/Mock no método buscarPorId
      const buscarPorIdMock = jest.fn()
        .mockResolvedValueOnce(regraExistente) // Primeira chamada para verificar existência
        .mockResolvedValueOnce(regraAtualizada); // Segunda chamada para retornar o resultado
      
      regraDinamicaDAO.buscarPorId = buscarPorIdMock;
      
      // Chamar o método a ser testado
      const resultado = await regraDinamicaDAO.atualizar(id, regra);
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('regras_dinamicas');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', id);
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      
      // Verificar se os dados foram formatados corretamente para atualização
      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('nome', regra.nome);
      expect(updateCall).toHaveProperty('descricao', regra.descricao);
      expect(updateCall).toHaveProperty('parametros');
      expect(updateCall).toHaveProperty('aprovada', regra.aprovada);
      expect(updateCall).toHaveProperty('origem', regra.origem);
      expect(updateCall).toHaveProperty('ativa', regra.ativa);
      expect(updateCall).toHaveProperty('updated_at');
      
      // Verificar se buscarPorId foi chamado corretamente
      expect(buscarPorIdMock).toHaveBeenCalledTimes(2);
      expect(buscarPorIdMock).toHaveBeenCalledWith(id);
      
      // Verificar o resultado
      expect(resultado).toHaveProperty('id', id);
      expect(resultado).toHaveProperty('nome', regra.nome);
      expect(resultado).toHaveProperty('descricao', regra.descricao);
      expect(resultado).toHaveProperty('parametros');
      expect(resultado.parametros).toHaveProperty('percentualMaximo', 25);
    });
    
    test('deve retornar erro quando regra não existe', async () => {
      // ID da regra inexistente
      const id = 999;
      
      // Dados para atualização
      const regra = {
        nome: 'REGRA_ATUALIZADA',
        descricao: 'Descrição atualizada'
      };
      
      // Mock para o método buscarPorId retornando null (regra não existe)
      regraDinamicaDAO.buscarPorId = jest.fn().mockResolvedValueOnce(null);
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(regraDinamicaDAO.atualizar(id, regra)).rejects.toThrow('Regra dinâmica não encontrada');
      
      // Verificar que buscarPorId foi chamado
      expect(regraDinamicaDAO.buscarPorId).toHaveBeenCalledWith(id);
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
    
    test('deve tratar erros durante a atualização', async () => {
      // ID da regra a ser atualizada
      const id = 1;
      
      // Dados para atualização
      const regra = {
        nome: 'REGRA_ATUALIZADA',
        descricao: 'Descrição atualizada'
      };
      
      // Mock para o método buscarPorId retornando uma regra existente
      regraDinamicaDAO.buscarPorId = jest.fn().mockResolvedValueOnce({
        id: 1,
        nome: 'REGRA_ANTIGA',
        descricao: 'Descrição antiga'
      });
      
      // Configurar mock para lançar erro durante a atualização
      mockQueryBuilder.update.mockImplementation(() => {
        throw new Error('Erro ao atualizar regra');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(regraDinamicaDAO.atualizar(id, regra)).rejects.toThrow('Erro ao atualizar regra');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('alterarAprovacao', () => {
    test('deve alterar status de aprovação de uma regra', async () => {
      // ID da regra
      const id = 1;
      const aprovada = true;
      
      // Mock para buscarPorId após atualização
      const regraAtualizada = {
        id: 1,
        nome: 'REGRA_TESTE',
        aprovada: true
      };
      
      // Spy/Mock no método buscarPorId
      regraDinamicaDAO.buscarPorId = jest.fn().mockResolvedValueOnce(regraAtualizada);
      
      // Chamar o método a ser testado
      const resultado = await regraDinamicaDAO.alterarAprovacao(id, aprovada);
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('regras_dinamicas');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', id);
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      
      // Verificar se os dados foram formatados corretamente para atualização
      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('aprovada', true);
      expect(updateCall).toHaveProperty('updated_at');
      
      // Verificar o resultado
      expect(resultado).toEqual(regraAtualizada);
    });
    
    test('deve tratar erros durante a alteração de aprovação', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.update.mockImplementation(() => {
        throw new Error('Erro ao alterar aprovação');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(regraDinamicaDAO.alterarAprovacao(1, true)).rejects.toThrow('Erro ao alterar aprovação');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('alterarAtivacao', () => {
    test('deve alterar status de ativação de uma regra', async () => {
      // ID da regra
      const id = 1;
      const ativa = false;
      
      // Mock para buscarPorId após atualização
      const regraAtualizada = {
        id: 1,
        nome: 'REGRA_TESTE',
        ativa: false
      };
      
      // Spy/Mock no método buscarPorId
      regraDinamicaDAO.buscarPorId = jest.fn().mockResolvedValueOnce(regraAtualizada);
      
      // Chamar o método a ser testado
      const resultado = await regraDinamicaDAO.alterarAtivacao(id, ativa);
      
      // Verificar se os métodos foram chamados corretamente
      expect(mockDB).toHaveBeenCalledWith('regras_dinamicas');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', id);
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      
      // Verificar se os dados foram formatados corretamente para atualização
      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('ativa', false);
      expect(updateCall).toHaveProperty('updated_at');
      
      // Verificar o resultado
      expect(resultado).toEqual(regraAtualizada);
    });
    
    test('deve tratar erros durante a alteração de ativação', async () => {
      // Configurar mock para lançar erro
      mockQueryBuilder.update.mockImplementation(() => {
        throw new Error('Erro ao alterar ativação');
      });
      
      // Spy no console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Chamar o método e verificar se o erro é propagado
      await expect(regraDinamicaDAO.alterarAtivacao(1, false)).rejects.toThrow('Erro ao alterar ativação');
      
      // Verificar que console.error foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });
});