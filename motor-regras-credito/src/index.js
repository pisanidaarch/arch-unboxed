// src/index.js
require('dotenv').config(); // Carrega as variáveis de ambiente
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorHandler = require('./api/middleware/errorHandler');
const performanceMonitor = require('./api/middleware/performanceMonitor');
const criarCreditoRoutes = require('./api/routes/creditoRoutes');
const criarClienteRoutes = require('./api/routes/clienteRoutes');
const criarRegraDinamicaRoutes = require('./api/routes/regraDinamicaRoutes');
const criarIARoutes = require('./api/routes/iaRoutes'); // Nova importação

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

// Configuração da aplicação
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Aumentar o limite para exemplos de treinamento
app.use(performanceMonitor());

// Configuração do serviço de log
const logService = new LogService();

// Verificar variáveis de ambiente
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Endpoint IA configurado:', process.env.IA_ENDPOINT);
console.log('Access Key IA configurada:', process.env.IA_ACCESS_KEY ? 'Sim (valor presente)' : 'Não');

// Inicialização dos adaptadores
const bureauCreditoAdapter = new BureauCreditoAdapter();
const dadosClienteAdapter = new DadosClienteAdapter();
const openBankingAdapter = new OpenBankingAdapter();

// Configuração do adaptador de IA
const iaAdapter = new IAAdapter({
  timeout: parseInt(process.env.TIMEOUT_IA || '8000')
});

// Inicialização das regras mandatórias
const regrasMandatorias = [
  new IdadeMinimaMandatoriaSpecification(parseInt(process.env.IDADE_MINIMA || '18')),
  new ScoreMinimoMandatorioSpecification(parseInt(process.env.SCORE_MINIMO || '500'))
];

// Inicialização dos handlers com regras dinâmicas vazias (serão carregadas do banco)
const regrasMandatoriasHandler = new RegrasMandatoriasHandler(regrasMandatorias);
const regrasDinamicasHandler = new RegrasDinamicasHandler([]); // Sem regras hardcoded, todas vêm do banco
const requisicaoIAHandler = new RequisicaoIAHandler(iaAdapter);

// Configuração da cadeia de responsabilidade
const chainOfResponsibility = new ChainOfResponsibility([
  regrasMandatoriasHandler,
  regrasDinamicasHandler,
  requisicaoIAHandler
]);

// Inicialização do gerenciador de cenário
const gerenciadorCenario = new GerenciadorCenario([
  bureauCreditoAdapter,
  dadosClienteAdapter,
  openBankingAdapter
]);

// Inicialização do motor
const motor = new Motor(gerenciadorCenario, chainOfResponsibility, logService);

// Configuração das rotas
app.use('/api/credito', criarCreditoRoutes(motor));
app.use('/api/clientes', criarClienteRoutes());
app.use('/api/regras-dinamicas', criarRegraDinamicaRoutes());
app.use('/api/ia', criarIARoutes()); // Nova rota para treinamento/teste de IA

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Serviço disponível',
    timestamp: new Date().toISOString(),
    version: '1.3.0', // Versão atualizada com treinamento da IA
    iaEndpoint: process.env.IA_ENDPOINT ? 'Configurado' : 'Não configurado'
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;