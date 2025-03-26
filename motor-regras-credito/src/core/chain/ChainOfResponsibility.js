// src/core/chain/ChainOfResponsibility.js

/**
 * Restaura os métodos da classe Cenario se eles estiverem faltando.
 */
function restaurarMetodosCenario(cenario) {
  // Verifica se é um objeto válido
  if (!cenario || typeof cenario !== 'object') {
    console.error('ERRO: tentativa de restaurar métodos em um objeto inválido:', cenario);
    return cenario;
  }

  // Adiciona método getDadosPorTipo se estiver faltando
  if (typeof cenario.getDadosPorTipo !== 'function') {
    cenario.getDadosPorTipo = function(tipo) {
      if (!Array.isArray(this.dadosCenario)) {
        console.error('ERRO: dadosCenario não é um array!', this.dadosCenario);
        return {};
      }
      const item = this.dadosCenario.find(d => d.tipo === tipo);
      return item ? item.dados : {};
    };
  }

  // Adiciona método adicionarResultadoAvaliacao se estiver faltando
  if (typeof cenario.adicionarResultadoAvaliacao !== 'function') {
    cenario.adicionarResultadoAvaliacao = function(regra, resultado, descricao) {
      if (!Array.isArray(this.resultadosAvaliacao)) {
        this.resultadosAvaliacao = [];
      }
      this.resultadosAvaliacao.push({
        regra,
        resultado,
        descricao,
        dataAvaliacao: new Date()
      });
    };
  }

  // Adiciona método todosResultadosAprovados se estiver faltando
  if (typeof cenario.todosResultadosAprovados !== 'function') {
    cenario.todosResultadosAprovados = function() {
      return this.resultadosAvaliacao.length > 0 &&
        this.resultadosAvaliacao.every(r => r.resultado === true);
    };
  }

  return cenario;
}

class ChainOfResponsibility {
  constructor(handlers = []) {
    this.handlers = handlers;
    
    // Separar o handler de IA dos outros handlers
    this.iaHandler = this.handlers.find(h => h.constructor.name === 'RequisicaoIAHandler');
    this.outrosHandlers = this.handlers.filter(h => h.constructor.name !== 'RequisicaoIAHandler');
    
    console.log(`ChainOfResponsibility inicializada com ${this.handlers.length} handlers`);
    console.log(`IA Handler encontrado: ${this.iaHandler ? 'Sim' : 'Não'}`);
  }

  async processar(cenario) {
    // Restaura os métodos do cenário se estiverem faltando
    let cenarioAtual = restaurarMetodosCenario(cenario);
    
    console.log('ChainOfResponsibility: cenario tem métodos?', 
               `getDadosPorTipo: ${typeof cenarioAtual.getDadosPorTipo === 'function'}, ` +
               `adicionarResultadoAvaliacao: ${typeof cenarioAtual.adicionarResultadoAvaliacao === 'function'}`);
    
    // Armazenar o estado original do cenário
    const cenarioOriginal = { ...cenarioAtual };
    
    // Processar com todos os handlers exceto o IA
    let precisaAnaliseManualOriginal = false;
    let regraFalhouOriginal = false;
    
    for (const handler of this.outrosHandlers) {
      // Antes de cada handler, garantimos que os métodos existem
      cenarioAtual = restaurarMetodosCenario(cenarioAtual);
      
      console.log(`Executando handler: ${handler.constructor.name}`);
      
      // Se já falhou, não processa mais handlers (exceto IA)
      if (cenarioAtual.regraFalhou) {
        console.log(`Regra falhou, interrompendo cadeia de handlers regulares`);
        regraFalhouOriginal = true;
        break;
      }
      
      // Se precisa análise manual, registramos isso mas continuamos
      if (cenarioAtual.precisaAnaliseManual) {
        console.log(`Análise manual necessária, registrando estado`);
        precisaAnaliseManualOriginal = true;
      }
      
      cenarioAtual = await handler.processar(cenarioAtual);
      
      // Após cada handler, verificamos novamente
      cenarioAtual = restaurarMetodosCenario(cenarioAtual);
      
      // Se após este handler o cenário falhou, registramos e interrompemos
      if (cenarioAtual.regraFalhou && !regraFalhouOriginal) {
        console.log(`Regra falhou no handler ${handler.constructor.name}`);
        regraFalhouOriginal = true;
        break;
      }
      
      // Se após este handler o cenário precisa análise manual, registramos
      if (cenarioAtual.precisaAnaliseManual && !precisaAnaliseManualOriginal) {
        console.log(`Análise manual necessária após handler ${handler.constructor.name}`);
        precisaAnaliseManualOriginal = true;
      }
    }
    
    // MODIFICAÇÃO: Sempre processar com o handler de IA, independente do resultado anterior
    if (this.iaHandler) {
      console.log(`Executando handler de IA independente do resultado anterior`);
      console.log(`Estado antes da IA: regraFalhou=${cenarioAtual.regraFalhou}, precisaAnaliseManual=${cenarioAtual.precisaAnaliseManual}`);
      
      // Vamos chamar a IA independentemente do resultado das regras anteriores
      // mas preservando a informação de que houve falha ou necessidade de análise manual
      const cenarioParaIA = restaurarMetodosCenario({ ...cenarioAtual });
      
      // Temporariamente removemos as flags para permitir que a IA seja chamada
      cenarioParaIA.regraFalhou = false;
      cenarioParaIA.precisaAnaliseManual = false;
      
      // Processamos com o handler de IA
      const cenarioAposIA = await this.iaHandler.processar(cenarioParaIA);
      
      // Extraímos o resultado da IA
      const resultadoIA = cenarioAposIA.resultadoIA;
      
      // Adicionamos o resultado da IA ao cenário original
      cenarioAtual.resultadoIA = resultadoIA;
      
      // Restauramos as flags originais
      cenarioAtual.regraFalhou = regraFalhouOriginal;
      cenarioAtual.precisaAnaliseManual = precisaAnaliseManualOriginal;
      
      // Se o cenário original já estava reprovado ou em análise manual,
      // mantemos esse status, mas registramos a opinião da IA
      if (!cenarioAtual.regraFalhou && !cenarioAtual.precisaAnaliseManual) {
        // Se a IA recomendou reprovação
        if (!resultadoIA.aprovado && !resultadoIA.analiseManual) {
          cenarioAtual.regraFalhou = true;
          console.log('IA recomendou reprovação para um cenário que seria aprovado');
        }
        // Se a IA recomendou análise manual
        else if (resultadoIA.analiseManual) {
          cenarioAtual.precisaAnaliseManual = true;
          console.log('IA recomendou análise manual para um cenário que seria aprovado');
        }
        // Se a IA aprovou, mantemos o status original
      }
      
      console.log(`Estado final após IA: regraFalhou=${cenarioAtual.regraFalhou}, precisaAnaliseManual=${cenarioAtual.precisaAnaliseManual}`);
      
      // Adicionamos um campo para indicar o motivo da análise manual ou reprovação
      if (cenarioAtual.precisaAnaliseManual) {
        cenarioAtual.motivoAnaliseManual = cenarioAtual.motivoAnaliseManual || 
          (precisaAnaliseManualOriginal ? "Regras dinâmicas não aprovadas" : "Recomendação da IA");
      }
    } else {
      console.log('AVISO: Handler de IA não encontrado na cadeia!');
    }

    return cenarioAtual;
  }
}

module.exports = ChainOfResponsibility;