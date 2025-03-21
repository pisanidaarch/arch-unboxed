// src/api/middleware/errorHandler.js

function errorHandler(err, req, res, next) {
    console.error('Erro na aplicação:', err);
  
    // Cliente não encontrado
    if (err.message && err.message.includes('Cliente não encontrado')) {
      return res.status(404).json({
        status: 'erro',
        mensagem: err.message
      });
    }
  
    // Erro de integração
    if (err.message && (
      err.message.includes('Erro ao consultar bureau') ||
      err.message.includes('Erro ao consultar open banking') ||
      err.message.includes('Erro ao consultar IA')
    )) {
      return res.status(502).json({
        status: 'erro',
        mensagem: 'Erro ao comunicar com sistemas externos',
        detalhe: err.message
      });
    }
  
    // Erro genérico
    return res.status(500).json({
      status: 'erro',
      mensagem: 'Erro interno no servidor'
    });
  }
  
  module.exports = errorHandler;