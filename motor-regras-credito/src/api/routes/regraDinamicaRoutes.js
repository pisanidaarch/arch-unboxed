// src/api/routes/regraDinamicaRoutes.js
const express = require('express');
const RegraDinamicaController = require('../controllers/RegraDinamicaController');
const { validarIdParam } = require('../middleware/validators');

function criarRegraDinamicaRoutes() {
  const router = express.Router();
  const regraDinamicaController = new RegraDinamicaController();

  // Rota para listar todas as regras dinâmicas
  router.get('/', (req, res, next) => {
    regraDinamicaController.listarRegras(req, res, next);
  });

  // Rota para obter detalhes de uma regra específica
  router.get('/:id', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.detalharRegra(req, res, next);
  });

  // Rota para criar uma nova regra
  router.post('/', (req, res, next) => {
    regraDinamicaController.criarRegra(req, res, next);
  });

  // Rota para atualizar uma regra existente
  router.put('/:id', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.atualizarRegra(req, res, next);
  });

  // Rota para aprovar/reprovar uma regra
  router.patch('/:id/aprovacao', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.alterarAprovacao(req, res, next);
  });

  // Rota para ativar/desativar uma regra
  router.patch('/:id/ativacao', validarIdParam('id'), (req, res, next) => {
    regraDinamicaController.alterarAtivacao(req, res, next);
  });

  return router;
}

module.exports = criarRegraDinamicaRoutes;