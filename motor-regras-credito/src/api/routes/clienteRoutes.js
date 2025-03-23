// src/api/routes/clienteRoutes.js
const express = require('express');
const ClienteController = require('../controllers/ClienteController');
const { validarIdParam } = require('../middleware/validators');

function criarClienteRoutes() {
  const router = express.Router();
  const clienteController = new ClienteController();

  // Rota para listar clientes
  router.get('/', (req, res, next) => {
    clienteController.listarClientes(req, res, next);
  });

  // Rota para detalhar um cliente
  router.get('/:id', validarIdParam('id'), (req, res, next) => {
    clienteController.detalharCliente(req, res, next);
  });

  // Rota para obter exemplos de clientes para testes
  router.get('/exemplo/lista', (req, res, next) => {
    clienteController.obterExemplos(req, res, next);
  });

  return router;
}