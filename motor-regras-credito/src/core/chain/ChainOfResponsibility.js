// src/core/chain/ChainOfResponsibility.js
const { restaurarMetodosCenario } = require('../../utils/CenarioHelper');

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
    
    console.log('ChainOfResponsibility: Iniciando processamento de cenário');
    
    // Processar com todos os handlers exceto o IA
    for (const handler of this.outrosHandlers) {
      // Antes de cada handler, garantimos que os métodos existem
      cenarioAtual = restaurarMetodosCenario(cenarioAtual);
      
      console.log(`Executando handler: ${handler.constructor.name}`);
      
      // Se já falhou ou precisa análise manual, não processa mais handlers regulares
      if (cenarioAtual.regraFalhou || cenarioAtual.precisaAnaliseManual) {
        console.log(`Interrompendo cadeia: regraFalhou=${cenarioAtual.regraFalhou}, precisaAnaliseManual=${cenarioAtual.precisaAnaliseManual}`);
        break;
      }
      
      cenarioAtual = await handler.processar(cenarioAtual);
    }
    
    // MODIFICAÇÃO: Só chamar a IA se houver alguma regra que falhou ou precisar de análise manual
    // Ou seja, não chamar a IA quando todas as regras passarem com sucesso
    if (this.iaHandler && (cenarioAtual.regraFalhou || cenarioAtual.precisaAnaliseManual)) {
      console.log('Regra falhou ou análise manual necessária - invocando IA para avaliação');
      
      // Processar com o handler de IA
      cenarioAtual = restaurarMetodosCenario(cenarioAtual);
      cenarioAtual = await this.iaHandler.processar(cenarioAtual);
      
      // Se a IA determinar que o cenário precisa de análise manual, marcar o cenário
      if (cenarioAtual.resultadoIA && cenarioAtual.resultadoIA.analiseManual) {
        cenarioAtual.precisaAnaliseManual = true;
        cenarioAtual.motivoAnaliseManual = cenarioAtual.motivoAnaliseManual || "Recomendação da IA";
      }
    } else if (this.iaHandler) {
      console.log('Todas as regras passaram com sucesso - IA não será invocada');
    } else {
      console.log('AVISO: Handler de IA não encontrado na cadeia!');
    }

    return cenarioAtual;
  }
}

module.exports = ChainOfResponsibility;