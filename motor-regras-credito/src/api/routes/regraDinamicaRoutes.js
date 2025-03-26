// src/api/routes/regraDinamicaRoutes.js
const express = require('express');
const RegraDinamicaController = require('../controllers/RegraDinamicaController');
const { validarIdParam } = require('../middleware/validators');

function criarRegraDinamicaRoutes() {
  const router = express.Router();
  const regraDinamicaController = new RegraDinamicaController();

  // Rotas
  router.get('/', (req, res, next) => {
    regraDinamicaController.listarRegras(req, res, next);
  });

  router.get('/:id', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.detalharRegra(req, res, next);
  });

  router.post('/', (req, res, next) => {
    regraDinamicaController.criarRegra(req, res, next);
  });

  router.put('/:id', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.atualizarRegra(req, res, next);
  });

  router.put('/:id/aprovacao', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.alterarAprovacao(req, res, next);
  });

  router.put('/:id/ativacao', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.alterarAtivacao(req, res, next);
  });

  return router;
}

module.exports = criarRegraDinamicaRoutes;