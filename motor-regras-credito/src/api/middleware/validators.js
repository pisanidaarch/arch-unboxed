// src/api/middleware/validators.js

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
 * Middleware para validar uma requisição de regra dinâmica
 */
function validarRegraDinamica(req, res, next) {
  const { nome, descricao, tipo, parametros } = req.body;
  const errors = [];
  
  if (!nome) {
    errors.push('Nome da regra é obrigatório');
  }
  
  if (!descricao) {
    errors.push('Descrição da regra é obrigatória');
  }
  
  if (!tipo) {
    errors.push('Tipo da regra é obrigatório');
  } else {
    const tiposValidos = ['COMPROMETIMENTO_RENDA', 'VALOR_MAXIMO', 'SCORE_CONDICIONAL', 'PRAZO_MINIMO'];
    if (!tiposValidos.includes(tipo)) {
      errors.push(`Tipo de regra inválido. Tipos válidos: ${tiposValidos.join(', ')}`);
    }
  }
  
  if (!parametros) {
    errors.push('Parâmetros da regra são obrigatórios');
  } else {
    // Validações específicas por tipo
    if (tipo === 'COMPROMETIMENTO_RENDA' && (!parametros.percentualMaximo || isNaN(parametros.percentualMaximo))) {
      errors.push('Parâmetro percentualMaximo é obrigatório e deve ser um número para regras COMPROMETIMENTO_RENDA');
    }
    
    if (tipo === 'VALOR_MAXIMO' && (!parametros.valorMaximo || isNaN(parametros.valorMaximo))) {
      errors.push('Parâmetro valorMaximo é obrigatório e deve ser um número para regras VALOR_MAXIMO');
    }
    
    if (tipo === 'SCORE_CONDICIONAL') {
      if (!parametros.scoreMinimo || isNaN(parametros.scoreMinimo)) {
        errors.push('Parâmetro scoreMinimo é obrigatório e deve ser um número para regras SCORE_CONDICIONAL');
      }
      if (!parametros.condicao) {
        errors.push('Parâmetro condicao é obrigatório para regras SCORE_CONDICIONAL');
      }
    }
    
    if (tipo === 'PRAZO_MINIMO') {
      if (!parametros.valorMinimo || isNaN(parametros.