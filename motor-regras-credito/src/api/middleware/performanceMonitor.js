// src/api/middleware/performanceMonitor.js

/**
 * Middleware para monitorar performance das requisições
 */
function performanceMonitor() {
    return (req, res, next) => {
      // Armazena o tempo de início da requisição
      const start = process.hrtime();
      
      // Captura o método original de finalização da resposta
      const end = res.end;
      
      // Sobrescreve o método de finalização para adicionar métricas
      res.end = function(...args) {
        // Calcula o tempo de resposta
        const elapsed = process.hrtime(start);
        const elapsedMs = (elapsed[0] * 1000) + (elapsed[1] / 1000000);
        
        // Adiciona header com o tempo de resposta
        res.setHeader('X-Response-Time', `${elapsedMs.toFixed(2)}ms`);
        
        // Loga a requisição
        const method = req.method;
        const url = req.originalUrl || req.url;
        const status = res.statusCode;
        
        console.log(`[PERFORMANCE] ${method} ${url} ${status} - ${elapsedMs.toFixed(2)}ms`);
        
        // Chama o método original de finalização
        return end.apply(res, args);
      };
      
      next();
    };
  }
  
  module.exports = performanceMonitor;