// src/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorHandler = require('./api/middleware/errorHandler');
const criarCreditoRoutes = require('./api/routes/creditoRoutes');

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

// Importação das estratégias
const ComprometimentoRendaStrategy = require('./core/strategies/ComprometimentoRendaStrategy.js');

// Importação do serviço de log
const LogService = require('./service/LogService.js');

// Configuração da aplicação
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuração do serviço de log
const logService = new LogService();

// Inicialização dos adaptadores com mocks
const bureauCreditoAdapter = new BureauCreditoAdapter({
  consultarCliente: async (clienteId) => {
    // Implementação mockada com resultados aleatórios para demonstração
    const scorePossibilities = [450, 550, 650, 750, 850];
    const randomScore = scorePossibilities[Math.floor(Math.random() * scorePossibilities.length)];
    
    return {
      score: randomScore,
      ultimaConsulta: new Date(),
      status: randomScore < 500 ? "IRREGULAR" : "REGULAR"
    };
  }
});

const dadosClienteAdapter = new DadosClienteAdapter({
  buscarCliente: async (clienteId) => {
    // Implementação mockada com resultados fixos para demonstração
    // Em um cenário real, consultaria uma base de dados
    
    // Para testar diferentes cenários, retorna dados diferentes baseados no ID
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
    // Implementação mockada com resultados aleatórios para demonstração
    const saldoMedio = Math.random() * 10000;
    
    return {
      possuiConta: true,
      saldoMedio: saldoMedio,
      ultimaMovimentacao: new Date(),
      status: saldoMedio > 1000 ? "ATIVO" : "INATIVO"
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

    // Adiciona um fator aleatório para teste
    const fatorAleatorio = Math.random() > 0.3; // 70% de chance de aprovação

    // Lógica simplificada de avaliação
    const aprovado = 
      clienteIdade >= 21 &&
      bureauScore >= 700 &&
      valorCredito <= clienteRenda * 10 &&
      fatorAleatorio;

    return {
      aprovado,
      justificativa: aprovado 
        ? "Perfil dentro dos parâmetros aceitáveis" 
        : "Perfil não atende aos requisitos mínimos de crédito",
      confianca: 0.85
    };
  }
});

// Inicialização das regras mandatórias
const regrasMandatorias = [
  new IdadeMinimaMandatoriaSpecification(18),
  new ScoreMinimoMandatorioSpecification(500)
];

// Inicialização das regras dinâmicas
const regrasDinamicas = [
  new ComprometimentoRendaStrategy(30, true) // 30% comprometimento máximo, regra aprovada
];

// Inicialização dos handlers
const regrasMandatoriasHandler = new RegrasMandatoriasHandler(regrasMandatorias);
const regrasDinamicasHandler = new RegrasDinamicasHandler(regrasDinamicas);
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

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Serviço disponível',
    timestamp: new Date().toISOString()
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