// src/api/middleware/validators.js

/**
 * Middleware para validar solicitações de análise de crédito
 */
/**
 * Middleware para validar solicitações de análise de crédito
 */
function validarSolicitacaoCredito(req, res, next) {
  const { clienteId, valorCredito } = req.body;
  
  const errors = [];
  
  if (!clienteId) {
    errors.push('ID do cliente é obrigatório');
  }
  
  if (!valorCredito) {
    errors.push('Valor do crédito é obrigatório');
  } else if (isNaN(valorCredito) || parseFloat(valorCredito) <= 0) {
    errors.push('Valor do crédito deve ser um número positivo');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'erro',
      mensagem: 'Validação falhou',
      erros: errors
    });
  }
  
  next();
}

/**
 * Middleware para validar o formato e existência do ID de um parâmetro
 */
function validarIdParam(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        status: 'erro',
        mensagem: `Parâmetro ${paramName} é obrigatório`
      });
    }
    
    next();
  };
}


/**
 * Middleware para limitar requisições por IP
 */
function rateLimiter(windowMs = 60000, maxRequests = 100) {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Limpa entradas antigas
    if (requests.has(ip)) {
      const userRequests = requests.get(ip);
      const validRequests = userRequests.filter(timestamp => timestamp > now - windowMs);
      requests.set(ip, validRequests);
      
      if (validRequests.length >= maxRequests) {
        return res.status(429).json({
          status: 'erro',
          mensagem: 'Limite de requisições excedido. Tente novamente mais tarde.'
        });
      }
      
      // Adiciona nova requisição
      validRequests.push(now);
      requests.set(ip, validRequests);
    } else {
      // Primeira requisição deste IP
      requests.set(ip, [now]);
    }
    
    next();
  };
}

module.exports = {
  validarSolicitacaoCredito,
  validarIdParam,
  rateLimiter
};