// src/api/routes/creditoRoutes.js
const express = require('express');
const CreditoController = require('../controllers/CreditoController');

function criarCreditoRoutes(motor) {
  const router = express.Router();
  const creditoController = new CreditoController(motor);

  // Rota para análise de crédito
  router.post('/analisar', (req, res, next) => {
    creditoController.analisarCredito(req, res, next);
  });

  return router;
}

module.exports = criarCreditoRoutes;