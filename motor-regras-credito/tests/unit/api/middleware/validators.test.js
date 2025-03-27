// tests/unit/api/middleware/validators.test.js
const { validarSolicitacaoCredito, validarIdParam, rateLimiter } = require('../../../../src/api/middleware/validators');

describe('Middleware de Validação', () => {
  // Mocks para req, res e next
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });
  
  describe('validarSolicitacaoCredito', () => {
    test('deve chamar next() quando solicitação é válida', () => {
      req.body = {
        clienteId: '12345',
        valorCredito: 5000
      };
      
      validarSolicitacaoCredito(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('deve retornar 400 quando clienteId não é fornecido', () => {
      req.body = {
        valorCredito: 5000
      };
      
      validarSolicitacaoCredito(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].erros).toContain('ID do cliente é obrigatório');
    });
    
    test('deve retornar 400 quando valorCredito não é fornecido', () => {
      req.body = {
        clienteId: '12345'
      };
      
      validarSolicitacaoCredito(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].erros).toContain('Valor do crédito é obrigatório');
    });
    
    test('deve retornar 400 quando valorCredito não é um número positivo', () => {
      req.body = {
        clienteId: '12345',
        valorCredito: 'abc'
      };
      
      validarSolicitacaoCredito(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].erros).toContain('Valor do crédito deve ser um número positivo');
    });
    
    test('deve retornar 400 quando valorCredito é negativo', () => {
      req.body = {
        clienteId: '12345',
        valorCredito: -100
      };
      
      validarSolicitacaoCredito(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].erros).toContain('Valor do crédito deve ser um número positivo');
    });
    
    test('deve listar múltiplos erros quando existirem', () => {
      req.body = {
        // Sem clienteId e valorCredito
      };
      
      validarSolicitacaoCredito(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].erros.length).toBe(2);
    });
  });
  
  describe('validarIdParam', () => {
    test('deve chamar next() quando ID é fornecido', () => {
      const paramName = 'id';
      req.params[paramName] = '12345';
      
      const middleware = validarIdParam(paramName);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('deve retornar 400 quando ID não é fornecido', () => {
      const paramName = 'id';
      req.params[paramName] = '';
      
      const middleware = validarIdParam(paramName);
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].mensagem).toContain(paramName);
    });
  });
  
  describe('rateLimiter', () => {
    test('deve chamar next() na primeira requisição', () => {
      const middleware = rateLimiter(60000, 100);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('deve chamar next() quando está abaixo do limite', () => {
      const middleware = rateLimiter(60000, 2);
      
      // Primeira requisição
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      
      // Reset mock
      next.mockReset();
      
      // Segunda requisição
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    
    test('deve retornar 429 quando excede o limite', () => {
      const middleware = rateLimiter(60000, 1);
      
      // Primeira requisição (dentro do limite)
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      
      // Reset mocks
      next.mockReset();
      res.status.mockClear();
      res.json.mockClear();
      
      // Segunda requisição (excede o limite)
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].mensagem).toContain('Limite de requisições excedido');
    });
  });
});