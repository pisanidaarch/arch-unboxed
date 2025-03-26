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
app.use(express.json());
app.use(performanceMonitor());

// Configuração do serviço de log
const logService = new LogService();

// Verificar variáveis de ambiente
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Endpoint IA configurado:', process.env.IA_ENDPOINT);
console.log('Access Key IA configurada:', process.env.IA_ACCESS_KEY ? 'Sim (valor presente)' : 'Não');

// Inicialização dos adaptadores com mocks
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

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Serviço disponível',
    timestamp: new Date().toISOString(),
    version: '1.2.0', // Versão atualizada com integração da IA
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

/*const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorHandler = require('./api/middleware/errorHandler');
const performanceMonitor = require('./api/middleware/performanceMonitor');
const criarCreditoRoutes = require('./api/routes/creditoRoutes');
const criarClienteRoutes = require('./api/routes/clienteRoutes');
const criarRegraDinamicaRoutes = require('./api/routes/regraDinamicaRoutes');

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
app.use(express.json());
app.use(performanceMonitor());

// Configuração do serviço de log
const logService = new LogService();

// Inicialização dos adaptadores com mocks
const bureauCreditoAdapter = new BureauCreditoAdapter({
  consultarCliente: async (clienteId) => {
    // Implementação mockada com resultados aleatórios para demonstração
    const scorePossibilities = [450, 550, 650, 750, 850];
    const randomScore = scorePossibilities[Math.floor(Math.random() * scorePossibilities.length)];
    const statusPossibilities = ["REGULAR", "IRREGULAR"];
    const randomStatus = statusPossibilities[Math.floor(Math.random() * statusPossibilities.length)];
    const dividas = randomStatus === "IRREGULAR" ? Math.floor(Math.random() * 5) + 1 : 0;
    
    return {
      score: randomScore,
      ultimaConsulta: new Date(),
      status: randomStatus,
      totalDividas: dividas,
      valorDividas: dividas * 1000,
      consultasRecentes: Math.floor(Math.random() * 10)
    };
  }
});

const dadosClienteAdapter = new DadosClienteAdapter({
  buscarCliente: async (clienteId) => {
    // Implementação mockada com resultados que variam com base no ID
    const lastDigit = clienteId.toString().slice(-1);
    const idNumber = parseInt(lastDigit);
    
    return {
      id: clienteId,
      nome: `Cliente Exemplo ${clienteId}`,
      idade: 20 + idNumber, // Idade varia entre 20 e 29
      sexo: idNumber % 2 === 0 ? "M" : "F",
      rendaMensal: 3000 + (idNumber * 1000) // Renda varia entre 3000 e 12000
    };
  }
});

const openBankingAdapter = new OpenBankingAdapter({
  consultarDadosBancarios: async (clienteId) => {
    // Implementação mockada com resultados aleatórios
    const temConta = Math.random() > 0.2; // 80% de chance de ter conta
    const saldoMedio = Math.random() * 10000;
    const tempoRelacionamento = Math.floor(Math.random() * 60); // 0 a 60 meses
    
    return {
      possuiConta: temConta,
      saldoMedio: saldoMedio,
      ultimaMovimentacao: new Date(),
      status: temConta ? "ATIVO" : "INATIVO",
      tempoRelacionamentoMeses: tempoRelacionamento,
      quantidadeProdutos: temConta ? Math.floor(Math.random() * 5) + 1 : 0
    };
  }
});

const iaAdapter = new IAAdapter({
  avaliar: async (dadosParaIA) => {
    // Implementação mockada para demonstração
    const clienteIdade = dadosParaIA.cliente.idade;
    const clienteRenda = dadosParaIA.cliente.rendaMensal;
    const bureauScore = dadosParaIA.bureau.score;
    const valorCredito = dadosParaIA.valorCredito;
    const parametros = dadosParaIA.parametrosAdicionais || {};

    // Adiciona fatores aleatórios para teste
    const randomFactor = Math.random();
    
    // 10% de chance de solicitar análise manual
    if (randomFactor < 0.1) {
      return {
        aprovado: false,
        justificativa: "Perfil do cliente requer análise humana detalhada",
        confianca: 0.4,
        analiseManual: true
      };
    }
    
    // 60% de chance de aprovação com alta confiança
    const aprovadoComAltaConfianca = randomFactor < 0.7;
    
    // 30% de chance de reprovação com alta confiança
    const reprovadoComAltaConfianca = randomFactor >= 0.7;
    
    // Lógica simplificada de avaliação
    const aprovado = 
      clienteIdade >= 21 &&
      bureauScore >= 600 &&
      valorCredito <= clienteRenda * 12 &&
      aprovadoComAltaConfianca;

    // Ocasionalmente gerar novas regras dinâmicas
    let regrasGeradas = [];
    if (Math.random() < 0.3) { // 30% de chance de gerar regras
      if (bureauScore < 600 && clienteRenda > 8000) {
        regrasGeradas.push({
          nome: `SCORE_MINIMO_RENDA_ALTA_${Math.floor(Math.random() * 1000)}`,
          descricao: `Cliente com renda acima de R$ 8.000 pode ter score mínimo de 550`,
          tipo: 'SCORE_CONDICIONAL',
          parametros: {
            scoreMinimo: 550,
            condicao: 'RENDA_ALTA',
            rendaMinima: 8000
          }
        });
      }
      
      if (clienteIdade < 25 && valorCredito > 10000) {
        regrasGeradas.push({
          nome: `LIMITE_JOVENS_${Math.floor(Math.random() * 1000)}`,
          descricao: `Jovens abaixo de 25 anos devem ter limite máximo de R$ 10.000`,
          tipo: 'VALOR_MAXIMO',
          parametros: {
            valorMaximo: 10000,
            idadeMaxima: 25
          }
        });
      }
    }

    return {
      aprovado,
      justificativa: aprovado 
        ? "Perfil dentro dos parâmetros aceitáveis" 
        : "Perfil não atende aos requisitos mínimos de crédito",
      confianca: aprovadoComAltaConfianca || reprovadoComAltaConfianca ? 0.9 : 0.6,
      regrasGeradas
    };
  }
});

// Inicialização das regras mandatórias
const regrasMandatorias = [
  new IdadeMinimaMandatoriaSpecification(18),
  new ScoreMinimoMandatorioSpecification(500)
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

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Serviço disponível',
    timestamp: new Date().toISOString(),
    version: '1.1.0' // Versão atualizada com suporte a regras dinâmicas
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;*/