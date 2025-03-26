// src/adapter/IAAdapter.js
const axios = require('axios');
const ResultadoIA = require('../entity/ResultadoIA');
const RegraDinamicaDAO = require('../dao/RegraDinamicaDAO');

class IAAdapter {
  constructor(options = {}) {
    this.regraDinamicaDAO = new RegraDinamicaDAO();
    
    // Configuração do endpoint da IA
    this.endpoint = options.endpoint || process.env.IA_ENDPOINT || 'https://agent-fwsknwjtwgows7bbq34wgyka-lacbb.ondigitalocean.app/api/v1/chat/completions';
    this.accessKey = options.accessKey || process.env.IA_ACCESS_KEY || 'tLNu967VSaTZkiWzvNJvAX5a4cnN7ilb';
    
    console.log('IAAdapter inicializado com endpoint:', this.endpoint);
    
    // Tempo limite para requisição (default: 8 segundos)
    this.timeout = options.timeout || 8000;
  }

  async avaliarCredito(cenario) {
    try {
      // Prepara os dados para envio à IA
      const dadosParaIA = this.prepararDadosParaIA(cenario);
      
      // Formatar a mensagem para a API de IA
      const mensagem = this.formatarMensagemIA(dadosParaIA);
      
      // Chama a API de IA
      const resultadoAPI = await this.chamarAPI(mensagem);
      
      // Processar a resposta da IA
      const resultadoProcessado = this.processarRespostaIA(resultadoAPI);
      
      // Verificar se a IA sugere a criação de novas regras dinâmicas
      if (resultadoProcessado.regrasGeradas && Array.isArray(resultadoProcessado.regrasGeradas)) {
        // Persistir as novas regras no banco de dados
        await this.persistirRegrasGeradas(resultadoProcessado.regrasGeradas);
      }

      // Retornar o resultado da avaliação
      return new ResultadoIA(
        resultadoProcessado.aprovado,
        resultadoProcessado.justificativa || "Avaliação realizada pelo sistema de IA",
        resultadoProcessado.confianca || 0.7,
        resultadoProcessado.analiseManual || false
      );
    } catch (error) {
      console.error(`Erro ao consultar IA para cliente ${cenario.clienteId}:`, error);
      
      // Em caso de erro, retornar um resultado que indica necessidade de análise manual
      return new ResultadoIA(
        false,
        "Erro ao consultar sistema de IA. Recomendação para análise manual por segurança.",
        0.5,
        true // Indica que precisa de análise manual
      );
    }
  }

  prepararDadosParaIA(cenario) {
    // Usar o método toJsonForIA se disponível, ou construir manualmente
    if (typeof cenario.toJsonForIA === 'function') {
      return cenario.toJsonForIA();
    }
    
    // Fallback para o caso do método não estar disponível
    return {
      id: cenario.id,
      clienteId: cenario.clienteId,
      valorCredito: cenario.valorCredito,
      dataCriacao: cenario.dataCriacao,
      cliente: cenario.getDadosPorTipo("DADOS_CLIENTE"),
      bureau: cenario.getDadosPorTipo("BUREAU_CREDITO"),
      openBanking: cenario.getDadosPorTipo("OPEN_BANKING"),
      parametrosAdicionais: cenario.parametrosAdicionais,
      resultadosAvaliacao: cenario.resultadosAvaliacao
    };
  }

  formatarMensagemIA(dadosParaIA) {
    // Formatar o JSON para enviar à IA conforme especificação
    const cenario = {
      id: dadosParaIA.id || "cen_" + Math.random().toString(36).substring(2, 15),
      clienteId: dadosParaIA.clienteId,
      valorCredito: dadosParaIA.valorCredito.toString(),
      dataCriacao: new Date().toISOString(),
      cliente: dadosParaIA.cliente,
      bureau: dadosParaIA.bureau,
      openBanking: dadosParaIA.openBanking,
      resultadosAvaliacao: dadosParaIA.resultadosAnteriores || []
    };
    
    // Instruction melhorada para a IA que enfatiza o formato de resposta esperado
    return `SISTEMA: Você é um analisador de crédito que responde APENAS COM UM ÚNICO NÚMERO, sem explicações adicionais. Sua tarefa é analisar os dados do cliente e determinar se o crédito deve ser aprovado.

IMPORTANTE: Você DEVE retornar APENAS UM dos seguintes números:
0 = Rejeitar crédito (80%+ de certeza)
1 = Aprovar crédito (80%+ de certeza) 
2 = Solicitar análise manual (incerteza)

Sua resposta completa deve ser apenas o número: 0 ou 1 ou 2, sem nenhum texto adicional.

Dados para análise:
${JSON.stringify(cenario, null, 2)}

Responda apenas com o número 0, 1 ou 2. Qualquer outra resposta será considerada um erro.`;
  }

  async chamarAPI(mensagem) {
    try {
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessKey}`
        },
        data: {
          messages: [
            {
              role: "system",
              content: "Você é um analisador de crédito que responde APENAS COM UM ÚNICO NÚMERO (0, 1 ou 2) sem explicações adicionais. Lembre-se de sempre retornar apenas o número."
            },
            {
              role: "user",
              content: mensagem
            }
          ],
          stream: false,
          include_functions_info: false,
          include_retrieval_info: false,
          include_guardrails_info: false
        },
        timeout: this.timeout
      });


      console.dir("======= Requisição IA ========");
      console.dir("======= Requisição IA ========");
      console.dir("======= Requisição IA ========");
      console.dir(await response.data);
      console.dir("======= FIM IA ========");

      return response.data;
    } catch (error) {
      console.error('Erro ao chamar a API de IA:', error.message);
      throw new Error(`Erro ao consultar IA: ${error.message}`);
    }
  }

  processarRespostaIA(resposta) {
    try {
      // Extrair a resposta da IA do formato retornado
      const conteudoResposta = resposta.choices && resposta.choices[0] && resposta.choices[0].message
        ? resposta.choices[0].message.content
        : null;
      
      if (!conteudoResposta) {
        throw new Error('Resposta da IA não contém conteúdo válido');
      }
      
      // Tentar extrair um número do conteúdo (mesmo se tiver texto)
      const numerosEncontrados = conteudoResposta.match(/[0-2]/g);
      let respostaNumero;
      
      if (numerosEncontrados && numerosEncontrados.length > 0) {
        // Usar o primeiro número encontrado entre 0 e 2
        respostaNumero = parseInt(numerosEncontrados[0]);
      } else {
        // Tentar usar toda a resposta como um número
        respostaNumero = parseInt(conteudoResposta.trim());
      }
      
      // Verificar se é um número válido (0, 1 ou 2)
      if (isNaN(respostaNumero) || ![0, 1, 2].includes(respostaNumero)) {
        console.error('Resposta da IA não contém um número válido:', conteudoResposta);
        // Fallback para análise manual em caso de resposta inválida
        return {
          aprovado: false,
          justificativa: `Resposta da IA não processável: "${conteudoResposta.substring(0, 50)}..."`,
          confianca: 0.5,
          analiseManual: true
        };
      }
      
      // Converter para o formato esperado pela aplicação
      let resultado = {
        aprovado: false,
        justificativa: "",
        confianca: 0.8, // Valor padrão para confiança (80%)
        analiseManual: false
      };
      
      // Interpretar o código de resposta
      switch (respostaNumero) {
        case 0: // Rejeição com alta confiança
          resultado.aprovado = false;
          resultado.justificativa = "IA rejeitou o crédito com alta confiança";
          resultado.confianca = 0.8;
          break;
        case 1: // Aprovação com alta confiança
          resultado.aprovado = true;
          resultado.justificativa = "IA aprovou o crédito com alta confiança";
          resultado.confianca = 0.8;
          break;
        case 2: // Necessidade de análise manual
          resultado.aprovado = false;
          resultado.justificativa = "IA solicitou análise manual para o crédito";
          resultado.confianca = 0.5;
          resultado.analiseManual = true;
          break;
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao processar resposta da IA:', error);
      
      // Em caso de erro no processamento, retornar um resultado que indica necessidade de análise manual
      return {
        aprovado: false,
        justificativa: "Erro ao interpretar resposta da IA. Recomendação para análise manual.",
        confianca: 0.5,
        analiseManual: true
      };
    }
  }

  /**
   * Persiste regras dinâmicas geradas pela IA
   * @param {Array} regras - Regras geradas pela IA
   */
  async persistirRegrasGeradas(regras) {
    try {
      if (!regras || !Array.isArray(regras) || regras.length === 0) {
        return; // Não há regras para persistir
      }
      
      // Obter todas as regras existentes
      const regrasExistentes = await this.regraDinamicaDAO.listar();
      
      for (const regra of regras) {
        // Verificar se a regra já existe com o mesmo nome
        const regraExistente = regrasExistentes.find(r => r.nome === regra.nome);
        
        if (regraExistente) {
          console.log(`Regra ${regra.nome} já existe, pulando inserção.`);
          continue;
        }
        
        // Verificar se existe uma regra similar (mesmo tipo e parâmetros similares)
        const regraSimilar = this.encontrarRegraSimilar(regra, regrasExistentes);
        
        if (regraSimilar) {
          console.log(`Regra similar já existe (${regraSimilar.nome}), pulando inserção.`);
          continue;
        }
        
        // Inserir nova regra
        await this.regraDinamicaDAO.inserir({
          nome: regra.nome,
          descricao: regra.descricao,
          tipo: regra.tipo,
          parametros: regra.parametros,
          aprovada: false, // Regras geradas pela IA nunca começam aprovadas
          origem: 'IA',
          ativa: true
        });
        
        console.log(`Nova regra dinâmica criada pela IA: ${regra.nome}`);
      }
    } catch (error) {
      console.error('Erro ao persistir regras geradas pela IA:', error);
    }
  }
  
  /**
   * Verifica se já existe uma regra similar à nova regra
   * @param {Object} novaRegra - Regra a ser verificada
   * @param {Array} regrasExistentes - Lista de regras existentes
   * @returns {Object|null} Regra similar ou null se não existir
   */
  encontrarRegraSimilar(novaRegra, regrasExistentes) {
    // Filtra por regras do mesmo tipo
    const regrasDoMesmoTipo = regrasExistentes.filter(r => r.tipo === novaRegra.tipo);
    
    if (!regrasDoMesmoTipo.length) {
      return null;
    }
    
    // Compara os parâmetros para verificar similaridade
    for (const regra of regrasDoMesmoTipo) {
      const parametrosExistente = regra.parametros;
      const parametrosNova = novaRegra.parametros;
      
      // Verificar similaridade com base no tipo da regra
      switch (novaRegra.tipo) {
        case 'COMPROMETIMENTO_RENDA':
          // Verifica se o percentual máximo é igual ou similar (dentro de 5%)
          if (parametrosExistente.percentualMaximo && parametrosNova.percentualMaximo) {
            const diff = Math.abs(parametrosExistente.percentualMaximo - parametrosNova.percentualMaximo);
            if (diff <= 5) { // Diferença de até 5% é considerada similar
              return regra;
            }
          }
          break;
          
        case 'VALOR_MAXIMO':
          // Verifica se o valor máximo é igual ou similar (dentro de 10%)
          if (parametrosExistente.valorMaximo && parametrosNova.valorMaximo) {
            const diff = Math.abs(parametrosExistente.valorMaximo - parametrosNova.valorMaximo);
            const percentDiff = diff / parametrosExistente.valorMaximo * 100;
            if (percentDiff <= 10) { // Diferença de até 10% é considerada similar
              return regra;
            }
          }
          break;
          
        case 'SCORE_CONDICIONAL':
          // Verifica se o score mínimo e a condição são iguais ou similares
          if (parametrosExistente.scoreMinimo && parametrosNova.scoreMinimo &&
              parametrosExistente.condicao === parametrosNova.condicao) {
            const diff = Math.abs(parametrosExistente.scoreMinimo - parametrosNova.scoreMinimo);
            if (diff <= 50) { // Diferença de até 50 pontos é considerada similar
              return regra;
            }
          }
          break;
          
        case 'PRAZO_MINIMO':
          // Verifica se o valor mínimo e o prazo mínimo são iguais ou similares
          if (parametrosExistente.valorMinimo && parametrosNova.valorMinimo &&
              parametrosExistente.prazoMinimo && parametrosNova.prazoMinimo) {
            const diffValor = Math.abs(parametrosExistente.valorMinimo - parametrosNova.valorMinimo);
            const percentDiffValor = diffValor / parametrosExistente.valorMinimo * 100;
            const diffPrazo = Math.abs(parametrosExistente.prazoMinimo - parametrosNova.prazoMinimo);
            
            if (percentDiffValor <= 10 && diffPrazo <= 6) { // Diferença de até 10% no valor e 6 meses no prazo
              return regra;
            }
          }
          break;
      }
    }
    
    return null;
  }
}

module.exports = IAAdapter;