// src/api/routes/creditoRoutes.js
const express = require('express');
const CreditoController = require('../controllers/CreditoController');
const { validarSolicitacaoCredito, validarIdParam } = require('../middleware/validators');

function criarCreditoRoutes(motor) {
  const router = express.Router();
  const creditoController = new CreditoController(motor);

  // Rota para análise de crédito
  router.post('/analisar', validarSolicitacaoCredito, (req, res, next) => {
    creditoController.analisarCredito(req, res, next);
  });

  // Rota para consultar um cenário específico
  router.get('/cenario/:id', validarIdParam('id'), (req, res, next) => {
    creditoController.consultarCenario(req, res, next);
  });

  // Rota para consultar histórico de análises de um cliente
  router.get('/historico/:clienteId', validarIdParam('clienteId'), (req, res, next) => {
    creditoController.consultarHistoricoCliente(req, res, next);
  });

  return router;
}

module.exports = criarCreditoRoutes;  // Esta linha estava faltando