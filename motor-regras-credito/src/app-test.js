// src/app-test.js
/**
 * Versão do index.js que NÃO inicia o servidor na porta 3000
 * Usado apenas para testes
 */
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorHandler = require('./api/middleware/errorHandler');
const performanceMonitor = require('./api/middleware/performanceMonitor');
const criarCreditoRoutes = require('./api/routes/creditoRoutes');
const criarClienteRoutes = require('./api/routes/clienteRoutes');
const criarRegraDinamicaRoutes = require('./api/routes/regraDinamicaRoutes');
const criarIARoutes = require('./api/routes/iaRoutes');

// Importação dos componentes principais
const Motor = require('./service/Motor.js');
const GerenciadorCenario = require('./core/GerenciadorCenario.js');
const ChainOfResponsibility = require('./core/chain/ChainOfResponsibility.js');
const RegrasMandatoriasHandler = require('./core/chain/handlers/RegrasMandatoriasHandler.js');
const RegrasDinamicasHandler = require('./core/chain/handlers/RegrasDinamicasHandler.js');
const RequisicaoIAHandler = require('./core/chain/handlers/RequisicaoIAHandler.js');

// Importação dos adaptadores
const BureauCreditoAdapter = require('./adapter/BureauCreditoAdapter.js');
const DadosClienteAdapter = require('./adapter/DadosClienteAdapter.js');
const OpenBankingAdapter = require('./adapter/OpenBankingAdapter.js');
const IAAdapter = require('./adapter/IAAdapter.js');

// Importação das especificações
const IdadeMinimaMandatoriaSpecification = require('./core/specifications/IdadeMinimaMandatoriaSpecification.js');
const ScoreMinimoMandatorioSpecification = require('./core/specifications/ScoreMinimoMandatorioSpecification.js');

// Importação do serviço de log
const LogService = require('./service/LogService.js');

// Mock para cenário bem simples
const cenarioMock = {
  id: 'cen_teste123',
  status: 'APROVADO',
  resultadosAvaliacao: []
};

// Mock do motor para testes
const mockMotor = {
  processarSolicitacao: jest.fn().mockResolvedValue(cenarioMock),
  buscarCenario: jest.fn().mockResolvedValue(cenarioMock),
  buscarCenariosPorCliente: jest.fn().mockResolvedValue([cenarioMock])
};

// Configuração da aplicação
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(performanceMonitor());

// Configuração das rotas com o mock do motor
app.use('/api/credito', criarCreditoRoutes(mockMotor));
app.use('/api/clientes', criarClienteRoutes());
app.use('/api/regras-dinamicas', criarRegraDinamicaRoutes());
app.use('/api/ia', criarIARoutes());

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Serviço disponível',
    timestamp: new Date().toISOString(),
    version: 'TEST',
    iaEndpoint: 'TEST'
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;