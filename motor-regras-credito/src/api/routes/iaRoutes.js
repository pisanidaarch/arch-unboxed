// src/api/routes/iaRoutes.js
const express = require('express');
const IAController = require('../controllers/IAController');

function criarIARoutes() {
  const router = express.Router();
  const iaController = new IAController();

  // Rota para treinamento da IA
  router.post('/treinamento', (req, res, next) => {
    iaController.treinarIA(req, res, next);
  });

  // Rota para teste da IA
  router.post('/teste', (req, res, next) => {
    iaController.testarIA(req, res, next);
  });

  return router;
}

module.exports = criarIARoutes;