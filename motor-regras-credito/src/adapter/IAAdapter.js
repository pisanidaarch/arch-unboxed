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
    this.model = options.model || process.env.IA_MODEL || 'anthropic.claude-3-haiku-20240307';
    
    console.log('=================== INICIALIZAÇÃO DO ADAPTER IA ===================');
    console.log(`➡️ Endpoint: ${this.endpoint}`);
    console.log(`➡️ Modelo: ${this.model}`);
    console.log(`➡️ Access Key configurada: ${this.accessKey ? 'Sim (***' + this.accessKey.slice(-4) + ')' : 'Não'}`);
    console.log('===================================================================');
    
    // Tempo limite para requisição (default: 10 segundos)
    this.timeout = options.timeout || parseInt(process.env.TIMEOUT_IA || '10000');
    
    // Definição da ferramenta de function calling para decisão de crédito
    this.tools = [
      {
        type: "function",
        function: {
          name: "creditDecision",
          description: "Decide if a credit application should be approved, rejected, or sent for manual review",
          parameters: {
            type: "object",
            properties: {
              decision: {
                type: "string",
                enum: ["APPROVE", "REJECT", "MANUAL_REVIEW"],
                description: "The decision for the credit application"
              },
              confidence: {
                type: "number",
                description: "Confidence level in the decision (0-1)",
                minimum: 0,
                maximum: 1
              },
              justification: {
                type: "string",
                description: "Brief explanation for the decision"
              },
              suggestedRules: {
                type: "array",
                description: "Optional suggested new dynamic rules based on this analysis",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Name of the rule"
                    },
                    description: {
                      type: "string",
                      description: "Description of the rule"
                    },
                    type: {
                      type: "string",
                      enum: ["COMPROMETIMENTO_RENDA", "VALOR_MAXIMO", "SCORE_CONDICIONAL", "PRAZO_MINIMO"],
                      description: "Type of the rule"
                    },
                    parameters: {
                      type: "object",
                      description: "Parameters specific to the rule type"
                    }
                  },
                  required: ["name", "description", "type", "parameters"]
                }
              }
            },
            required: ["decision", "confidence"]
          }
        }
      }
    ];
  }

  async avaliarCredito(cenario) {
    console.log('\n================== INICIANDO AVALIAÇÃO DE CRÉDITO IA ==================');
    console.log(`📋 Cliente ID: ${cenario.clienteId}`);
    console.log(`💰 Valor solicitado: R$ ${cenario.valorCredito}`);
    
    try {
      // Prepara os dados para envio à IA
      console.log('🔄 Preparando dados para IA...');
      const dadosParaIA = this.prepararDadosParaIA(cenario);
      
      // Logging de dados principais
      console.log(`🧐 Score do cliente: ${dadosParaIA.bureau?.score || 'Não disponível'}`);
      console.log(`💼 Renda mensal: R$ ${dadosParaIA.cliente?.rendaMensal || 'Não disponível'}`);
      console.log(`⏱️ Tempo de relacionamento: ${dadosParaIA.openBanking?.tempoRelacionamentoMeses || 'Não disponível'} meses`);
      
      // Chama a API de IA com function calling
      console.log('📞 Chamando API IA com function calling...');
      console.log(`⏱️ Timeout configurado: ${this.timeout}ms`);
      const startTime = Date.now();
      
      const resultadoAPI = await this.chamarAPIComFunctionCalling(dadosParaIA);
      
      const endTime = Date.now();
      console.log(`✅ Resposta recebida em ${((endTime - startTime)/1000).toFixed(2)} segundos`);
      
      // Processar a resposta da API
      console.log('🔍 Processando resposta da IA...');
      const resultadoIA = await this.processarRespostaFunctionCalling(resultadoAPI, cenario.clienteId);
      
      console.log('📊 Resultado da análise IA:');
      console.log(`🔴 Aprovado: ${resultadoIA.aprovado ? 'SIM' : 'NÃO'}`);
      console.log(`🔵 Análise Manual: ${resultadoIA.analiseManual ? 'SIM' : 'NÃO'}`);
      console.log(`🟢 Confiança: ${(resultadoIA.confianca * 100).toFixed(0)}%`);
      console.log(`🟡 Justificativa: ${resultadoIA.justificativa}`);
      console.log('===================================================================\n');
      
      return resultadoIA;
    } catch (error) {
      console.error('\n❌ ERRO AO CONSULTAR IA:');
      console.error(`❌ Cliente ID: ${cenario.clienteId}`);
      console.error(`❌ Mensagem: ${error.message}`);
      
      if (error.response) {
        console.error(`❌ Status: ${error.response.status}`);
        console.error(`❌ Resposta: ${JSON.stringify(error.response.data || {}).substring(0, 200)}...`);
      }
      
      console.log('⚠️ Retornando resultado padrão para análise manual por segurança');
      console.log('===================================================================\n');
      
      // Em caso de erro, retornar resultado para análise manual
      return new ResultadoIA(
        false,
        "Erro ao consultar sistema de IA. Encaminhado para análise manual por segurança.",
        0.5,
        true // Análise manual
      );
    }
  }

  prepararDadosParaIA(cenario) {
    // Usar o método toJsonForIA se disponível, ou construir manualmente
    if (typeof cenario.toJsonForIA === 'function') {
      console.log('📦 Usando método toJsonForIA do cenário');
      return cenario.toJsonForIA();
    }
    
    // Fallback para o caso do método não estar disponível
    console.log('📦 Método toJsonForIA não disponível, construindo manualmente');
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

  async chamarAPIComFunctionCalling(dadosParaIA) {
    // Formatar o JSON para enviar à IA
    const cenario = {
      id: dadosParaIA.id || "cen_" + Math.random().toString(36).substring(2, 15),
      clienteId: dadosParaIA.clienteId,
      valorCredito: dadosParaIA.valorCredito.toString(),
      dataCriacao: new Date().toISOString(),
      cliente: dadosParaIA.cliente,
      bureau: dadosParaIA.bureau,
      openBanking: dadosParaIA.openBanking,
      resultadosAvaliacao: dadosParaIA.resultadosAvaliacao || []
    };
    
    // Mensagem para a API com instrução de usar a função
    const mensagemUser = `Analise este cenário de crédito e use a função creditDecision para determinar se o crédito deve ser aprovado, rejeitado ou enviado para análise manual:

${JSON.stringify(cenario, null, 2)}

Considere que:
1. Se o cliente tiver alto score (>700) e renda mensal suficiente para cobrir o crédito, geralmente é uma aprovação
2. Se o comprometimento da renda (assumindo parcelas de 10% do valor total do crédito por mês) for maior que 30%, considere rejeitar
3. Se houver dados conflitantes ou incompletos, envie para análise manual
4. Se identificar padrões ou regras que poderiam ser úteis para análises futuras, sugira-as no campo suggestedRules
5. Não responda com texto, APENAS chame a função`;

    console.log('📤 Enviando dados para IA...');
    console.log(`📤 Tamanho da mensagem: ${mensagemUser.length} caracteres`);
    
    try {
      console.log('🔧 Tentando usar function calling...');
      
      const requestData = {
        model: this.model,
        messages: [
          {
            role: "user",
            content: mensagemUser
          }
        ],
        tools: this.tools,
        tool_choice: { type: "auto" },
        stream: false,
        max_tokens: 1024
      };
      
      console.log(`📤 URL: ${this.endpoint}`);
      console.log(`📤 Model: ${this.model}`);
      console.log('📤 Tools configuradas para function calling');
      
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessKey}`
        },
        data: requestData,
        timeout: this.timeout
      });

      // Verificar se a resposta contém tool_calls
      if (response.data.tool_calls && response.data.tool_calls.length > 0) {
        console.log('✅ Function calling bem-sucedido!');
        console.log(`🔧 Função chamada: ${response.data.tool_calls[0].function.name}`);
      } else {
        console.log('⚠️ Resposta recebida mas sem function calling');
      }

      return response.data;
    } catch (error) {
      // Verificar se é um erro específico de function calling não suportado
      if (error.response && error.response.status === 400 && 
          error.response.data && error.response.data.error && 
          error.response.data.error.message && 
          error.response.data.error.message.includes('tools')) {
        
        console.warn('⚠️ Function calling não suportado, tentando fallback para formato JSON...');
        return this.chamarAPIFallback(cenario);
      }
      
      throw error;
    }
  }
  
  async chamarAPIFallback(cenario) {
    // System prompt e user prompt para solicitar resposta em formato JSON
    const systemPrompt = `Você é um analisador de crédito que responde APENAS em formato JSON. NUNCA explique seu raciocínio. NUNCA use texto fora do JSON.`;
    
    const userPrompt = `Analise os dados do cenário de crédito abaixo e retorne APENAS um objeto JSON com a seguinte estrutura:
{
  "decision": "APPROVE" ou "REJECT" ou "MANUAL_REVIEW",
  "confidence": número entre 0 e 1,
  "justification": "breve explicação"
}

IMPORTANTE: 
- Você DEVE retornar APENAS o objeto JSON acima, sem nenhum texto explicativo adicional.
- Não inclua markdown, comentários ou qualquer outro texto.

DADOS DO CENÁRIO:
${JSON.stringify(cenario, null, 2)}

LEMBRE-SE: Responda APENAS com o objeto JSON no formato especificado.`;

    console.log('🔄 Utilizando método de fallback (JSON)...');
    console.log(`📤 Tamanho da mensagem: ${userPrompt.length} caracteres`);
    
    const response = await axios({
      method: 'post',
      url: this.endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessKey}`
      },
      data: {
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        stream: false,
        max_tokens: 1024
      },
      timeout: this.timeout
    });

    console.log('✅ Resposta JSON recebida com sucesso');
    
    // Simular resposta no formato de function calling
    return {
      choices: [
        {
          message: {
            content: response.data.choices[0].message.content
          }
        }
      ]
    };
  }

  async processarRespostaFunctionCalling(resposta, clienteId) {
    try {
      // Verificar se temos uma resposta de function calling
      const toolCalls = resposta.tool_calls || [];
      
      if (toolCalls.length > 0 && toolCalls[0].function && toolCalls[0].function.name === 'creditDecision') {
        console.log('🔍 Processando resultado do function calling');
        // Extrair os argumentos da função
        const args = JSON.parse(toolCalls[0].function.arguments);
        console.log(`🔍 Argumentos recebidos: ${JSON.stringify(args)}`);
        
        // Verificar e persistir regras sugeridas, se houver
        if (args.suggestedRules && Array.isArray(args.suggestedRules) && args.suggestedRules.length > 0) {
          console.log(`💡 ${args.suggestedRules.length} regras sugeridas pela IA`);
          await this.persistirRegrasGeradas(args.suggestedRules);
        }
        
        // Converter para o formato ResultadoIA
        return new ResultadoIA(
          args.decision === 'APPROVE',
          args.justification || `IA ${args.decision === 'APPROVE' ? 'aprovou' : (args.decision === 'REJECT' ? 'rejeitou' : 'encaminhou para análise manual')} o crédito`,
          args.confidence || 0.8,
          args.decision === 'MANUAL_REVIEW'
        );
      }
      
      // Não encontrou function calling, tentar extrair de formato JSON normal
      console.log('🔍 Function calling não encontrado, tentando extrair JSON da resposta');
      const conteudoResposta = resposta.choices && resposta.choices[0] && resposta.choices[0].message
        ? resposta.choices[0].message.content
        : null;
      
      if (!conteudoResposta) {
        throw new Error('Resposta da IA não contém conteúdo válido');
      }
      
      console.log(`🔍 Conteúdo da resposta (primeiros 100 caracteres): ${conteudoResposta.substring(0, 100)}...`);
      
      // Tentar processar como JSON
      try {
        // Limpar o conteúdo para extrair apenas o JSON
        let jsonString = conteudoResposta;
        if (jsonString.includes('```json')) {
          console.log('🔍 Detectado formato markdown com json');
          jsonString = jsonString.split('```json')[1].split('```')[0].trim();
        } else if (jsonString.includes('```')) {
          console.log('🔍 Detectado formato markdown');
          jsonString = jsonString.split('```')[1].split('```')[0].trim();
        }
        
        console.log(`🔍 Tentando fazer parse do JSON: ${jsonString.substring(0, 100)}...`);
        const resultadoJSON = JSON.parse(jsonString);
        console.log(`✅ Parse de JSON bem-sucedido: ${JSON.stringify(resultadoJSON)}`);
        
        // Verificar se temos uma decisão válida
        if (resultadoJSON.decision) {
          console.log(`🔍 Encontrada decisão: ${resultadoJSON.decision}`);
          return new ResultadoIA(
            resultadoJSON.decision === 'APPROVE',
            resultadoJSON.justification || `IA ${resultadoJSON.decision === 'APPROVE' ? 'aprovou' : (resultadoJSON.decision === 'REJECT' ? 'rejeitou' : 'encaminhou para análise manual')} o crédito`,
            resultadoJSON.confidence || 0.8,
            resultadoJSON.decision === 'MANUAL_REVIEW'
          );
        }
        
        // Se não encontrou decision mas encontrou code (formato antigo)
        if (resultadoJSON.code !== undefined) {
          console.log(`🔍 Encontrado código (formato antigo): ${resultadoJSON.code}`);
          const codeMap = {
            0: { approved: false, justification: "IA rejeitou o crédito com alta confiança" },
            1: { approved: true, justification: "IA aprovou o crédito com alta confiança" },
            2: { approved: false, justification: "IA solicitou análise manual para o crédito", analiseManual: true }
          };
          
          const resultado = codeMap[resultadoJSON.code] || { approved: false, justification: "Resposta da IA não reconhecida", analiseManual: true };
          
          return new ResultadoIA(
            resultado.approved,
            resultado.justification,
            resultadoJSON.confidence || 0.8,
            resultado.analiseManual || false
          );
        }
      } catch (jsonError) {
        console.error(`⚠️ Erro ao processar JSON da resposta para cliente ${clienteId}:`, jsonError.message);
      }
      
      // Se chegou aqui, usar último recurso: buscar por palavras-chave
      console.log('🔍 Utilizando análise de texto como último recurso');
      const conteudoLower = conteudoResposta.toLowerCase();
      
      if (conteudoLower.includes('aprovado') || conteudoLower.includes('aprove') || conteudoLower.includes('approve')) {
        console.log('🔍 Texto sugere APROVAÇÃO');
        return new ResultadoIA(true, "Crédito aprovado pela IA", 0.7, false);
      } else if (conteudoLower.includes('rejeitado') || conteudoLower.includes('rejeite') || conteudoLower.includes('reject')) {
        console.log('🔍 Texto sugere REJEIÇÃO');
        return new ResultadoIA(false, "Crédito rejeitado pela IA", 0.7, false);
      } else if (conteudoLower.includes('manual') || conteudoLower.includes('análise') || conteudoLower.includes('review')) {
        console.log('🔍 Texto sugere ANÁLISE MANUAL');
        return new ResultadoIA(false, "IA solicitou análise manual", 0.7, true);
      }
      
      // Default: encaminhar para análise manual
      console.log('⚠️ Não foi possível determinar a decisão a partir do texto');
      return new ResultadoIA(
        false,
        "Resposta da IA não pôde ser interpretada. Encaminhado para análise manual por segurança.",
        0.5,
        true
      );
    } catch (error) {
      console.error(`❌ Erro ao processar resposta da IA para cliente ${clienteId}:`, error.message);
      
      // Em caso de erro no processamento, retornar para análise manual
      return new ResultadoIA(
        false,
        "Erro ao interpretar resposta da IA. Encaminhado para análise manual por segurança.",
        0.5,
        true
      );
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
      
      console.log('🔄 Persistindo regras sugeridas pela IA...');
      
      // Obter todas as regras existentes
      const regrasExistentes = await this.regraDinamicaDAO.listar();
      console.log(`📋 Existem ${regrasExistentes.length} regras no banco de dados`);
      
      for (const regra of regras) {
        const nomeRegra = regra.name || regra.nome;
        
        // Verificar se a regra já existe com o mesmo nome
        const regraExistente = regrasExistentes.find(r => r.nome === nomeRegra);
        
        if (regraExistente) {
          console.log(`⚠️ Regra ${nomeRegra} já existe, pulando inserção`);
          continue;
        }
        
        console.log(`✅ Inserindo nova regra: ${nomeRegra}`);
        
        // Inserir nova regra
        await this.regraDinamicaDAO.inserir({
          nome: nomeRegra,
          descricao: regra.description || regra.descricao,
          tipo: regra.type || regra.tipo,
          parametros: regra.parameters || regra.parametros,
          aprovada: false, // Regras geradas pela IA nunca começam aprovadas
          origem: 'IA',
          ativa: true
        });
        
        console.log(`✅ Nova regra dinâmica criada pela IA: ${nomeRegra}`);
      }
      
      console.log('✅ Persistência de regras concluída');
    } catch (error) {
      console.error('❌ Erro ao persistir regras geradas pela IA:', error.message);
    }
  }
}

module.exports = IAAdapter;