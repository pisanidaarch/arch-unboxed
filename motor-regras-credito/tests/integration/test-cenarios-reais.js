// tests/integration/test-cenarios-reais.js
require('dotenv').config();
const { getDatabase } = require('../../src/config/database');
const IAAdapter = require('../../src/adapter/IAAdapter-with-logs');
const Cenario = require('../../src/entity/Cenario');

// Cenários predefinidos baseados nos dados existentes
const CENARIOS_TESTE = [
  {
    nome: "Cliente Baixo Risco",
    clienteId: "CLI12345",  // ID existente no banco de dados
    valorCredito: 5000,
    parametros: {
      prazo: 24,
      finalidade: "TESTE_INTEGRACAO"
    },
    descricao: "Cliente com bom score, renda adequada e histórico regular"
  },
  {
    nome: "Cliente Alto Risco",
    clienteId: "CLI54321",  // ID existente no banco de dados
    valorCredito: 15000,
    parametros: {
      prazo: 36,
      finalidade: "TESTE_INTEGRACAO"
    },
    descricao: "Cliente com score baixo e valor solicitado elevado para sua renda"
  },
  {
    nome: "Cliente Análise Manual",
    clienteId: "CLI67890",  // ID existente no banco de dados
    valorCredito: 50000,
    parametros: {
      prazo: 60,
      finalidade: "INVESTIMENTO"
    },
    descricao: "Cliente solicitando valor alto para finalidade de investimento"
  }
];

// Função para montar um cenário de teste completo
async function montarCenario(db, cenarioTeste) {
  console.log(`\n==== PREPARANDO CENÁRIO: ${cenarioTeste.nome} ====`);
  console.log(`Descrição: ${cenarioTeste.descricao}`);
  
  try {
    // Criar um cenário
    const cenario = new Cenario();
    cenario.clienteId = cenarioTeste.clienteId;
    cenario.valorCredito = cenarioTeste.valorCredito;
    cenario.parametrosAdicionais = cenarioTeste.parametros;
    cenario.dataCriacao = new Date();
    
    // Buscar dados do cliente
    console.log(`Buscando dados do cliente ${cenarioTeste.clienteId}...`);
    const cliente = await db('clientes')
      .where('id', cenarioTeste.clienteId)
      .first();
    
    if (!cliente) {
      throw new Error(`Cliente não encontrado: ${cenarioTeste.clienteId}`);
    }
    
    // Adicionar dados do cliente
    cenario.adicionarDados("DADOS_CLIENTE", {
      nome: cliente.nome,
      idade: cliente.idade,
      sexo: cliente.sexo,
      rendaMensal: cliente.renda_mensal,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      estado: cliente.estado,
      cep: cliente.cep,
      cpf: cliente.cpf
    });
    
    // Buscar dados do bureau
    console.log(`Buscando dados do bureau para ${cenarioTeste.clienteId}...`);
    const bureau = await db('bureau_credito')
      .where('cliente_id', cenarioTeste.clienteId)
      .first();
    
    if (bureau) {
      cenario.adicionarDados("BUREAU_CREDITO", {
        score: bureau.score,
        ultimaConsulta: bureau.ultima_consulta,
        status: bureau.status,
        totalDividas: bureau.total_dividas,
        valorDividas: bureau.valor_dividas,
        consultasRecentes: bureau.consultas_recentes
      });
    } else {
      console.log(`Aviso: Dados de bureau não encontrados para ${cenarioTeste.clienteId}`);
      cenario.adicionarDados("BUREAU_CREDITO", {
        score: 0,
        ultimaConsulta: null,
        status: "ERRO",
        totalDividas: 0,
        valorDividas: 0,
        consultasRecentes: 0
      });
    }
    
    // Buscar dados bancários
    console.log(`Buscando dados bancários para ${cenarioTeste.clienteId}...`);
    const dadosBancarios = await db('dados_bancarios')
      .where('cliente_id', cenarioTeste.clienteId)
      .first();
    
    if (dadosBancarios) {
      cenario.adicionarDados("OPEN_BANKING", {
        possuiConta: dadosBancarios.possui_conta,
        saldoMedio: dadosBancarios.saldo_medio,
        ultimaMovimentacao: dadosBancarios.ultima_movimentacao,
        status: dadosBancarios.status,
        tempoRelacionamentoMeses: dadosBancarios.tempo_relacionamento_meses,
        quantidadeProdutos: dadosBancarios.quantidade_produtos
      });
    } else {
      console.log(`Aviso: Dados bancários não encontrados para ${cenarioTeste.clienteId}`);
      cenario.adicionarDados("OPEN_BANKING", {
        possuiConta: false,
        saldoMedio: 0,
        ultimaMovimentacao: null,
        status: "ERRO",
        tempoRelacionamentoMeses: 0,
        quantidadeProdutos: 0
      });
    }
    
    // Adicionar regras mandatórias fictícias (para simulação)
    cenario.adicionarResultadoAvaliacao("IDADE_MINIMA", true, "Idade mínima de 18 anos");
    cenario.adicionarResultadoAvaliacao("SCORE_MINIMO", bureau?.score >= 500, "Score mínimo de 500");
    
    console.log(`Cenário montado com sucesso para ${cenarioTeste.nome}`);
    console.log(`Valor: R$ ${cenarioTeste.valorCredito}`);
    console.log(`Score: ${bureau?.score || 'N/A'}`);
    console.log(`Renda: R$ ${cliente.renda_mensal}`);
    
    return cenario;
  } catch (error) {
    console.error(`ERRO ao montar cenário ${cenarioTeste.nome}:`, error.message);
    throw error;
  }
}

async function executarTestes() {
  console.log("=====================================================");
  console.log("INICIANDO TESTES DE INTEGRAÇÃO COM IA - CENÁRIOS REAIS");
  console.log("=====================================================");
  
  // Conectar ao banco de dados
  const db = getDatabase();
  console.log("Conexão com banco de dados estabelecida");
  
  try {
    // Inicializar adaptador da IA com logs
    const iaAdapter = new IAAdapter({
      timeout: 15000 // 15 segundos para permitir respostas completas
    });
    
    // Resultados dos testes
    const resultados = [];
    
    // Processar cada cenário de teste
    for (const cenarioTeste of CENARIOS_TESTE) {
      try {
        // Montar cenário com dados reais
        const cenario = await montarCenario(db, cenarioTeste);
        
        console.log(`\n==== ENVIANDO PARA IA: ${cenarioTeste.nome} ====`);
        
        // Registrar o tempo de início
        const startTime = Date.now();
        
        // Enviar para avaliação da IA
        const resultadoIA = await iaAdapter.avaliarCredito(cenario);
        
        // Registrar o tempo de fim
        const endTime = Date.now();
        const tempoProcessamento = ((endTime - startTime) / 1000).toFixed(2);
        
        // Exibir resumo do resultado
        console.log("\n==== RESULTADO DA AVALIAÇÃO ====");
        console.log(`Cenário: ${cenarioTeste.nome}`);
        console.log(`Tempo total: ${tempoProcessamento} segundos`);
        console.log(`Status: ${resultadoIA.aprovado ? 'APROVADO' : (resultadoIA.analiseManual ? 'ANÁLISE MANUAL' : 'REPROVADO')}`);
        console.log(`Confiança: ${(resultadoIA.confianca * 100).toFixed(0)}%`);
        console.log(`Justificativa: ${resultadoIA.justificativa}`);
        console.log("===============================\n");
        
        // Armazenar resultado
        resultados.push({
          nome: cenarioTeste.nome,
          clienteId: cenarioTeste.clienteId,
          valorCredito: cenarioTeste.valorCredito,
          tempoProcessamento,
          aprovado: resultadoIA.aprovado,
          analiseManual: resultadoIA.analiseManual,
          confianca: resultadoIA.confianca,
          justificativa: resultadoIA.justificativa
        });
      } catch (error) {
        console.error(`ERRO ao processar cenário ${cenarioTeste.nome}:`, error.message);
        resultados.push({
          nome: cenarioTeste.nome,
          clienteId: cenarioTeste.clienteId,
          valorCredito: cenarioTeste.valorCredito,
          erro: error.message
        });
      }
      
      // Aguardar um pouco entre os testes para evitar sobrecarga da API
      console.log("Aguardando 3 segundos antes do próximo teste...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Exibir resumo dos resultados
    console.log("\n==========================================");
    console.log("RESUMO DOS RESULTADOS DOS TESTES");
    console.log("==========================================");
    
    for (const resultado of resultados) {
      if (resultado.erro) {
        console.log(`❌ ${resultado.nome}: ERRO - ${resultado.erro}`);
      } else {
        const status = resultado.aprovado ? '✅ APROVADO' : (resultado.analiseManual ? '⚠️ ANÁLISE MANUAL' : '❌ REPROVADO');
        console.log(`${status} | ${resultado.nome} | R$ ${resultado.valorCredito} | ${resultado.tempoProcessamento}s | ${(resultado.confianca * 100).toFixed(0)}%`);
      }
    }
    
    console.log("\n==========================================");
    console.log("TESTES DE INTEGRAÇÃO CONCLUÍDOS");
    console.log("==========================================");
    
  } catch (error) {
    console.error("ERRO FATAL durante os testes:", error);
  } finally {
    // Fechar conexão com o banco
    await db.destroy();
    console.log("Conexão com banco de dados encerrada");
  }
}

// Executar os testes
executarTestes().catch(error => {
  console.error("Erro não tratado:", error);
  process.exit(1);
});