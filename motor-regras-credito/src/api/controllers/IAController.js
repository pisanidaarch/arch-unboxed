// src/api/controllers/IAController.js
const axios = require('axios');

class IAController {
  constructor() {
    // Configurações da IA
    this.endpoint = process.env.IA_ENDPOINT || 'https://agent-fwsknwjtwgows7bbq34wgyka-lacbb.ondigitalocean.app/api/v1/chat/completions';
    this.accessKey = process.env.IA_ACCESS_KEY || 'tLNu967VSaTZkiWzvNJvAX5a4cnN7ilb';
    this.model = process.env.IA_MODEL || 'anthropic.claude-3-haiku-20240307';
  }

  /**
   * Envia exemplos de treinamento para a IA
   */
  async treinarIA(req, res, next) {
    try {
      const { mensagem, decisao, cenario } = req.body;
      
      if (!mensagem || !decisao || !cenario) {
        return res.status(400).json({ 
          mensagem: 'Dados incompletos para treinamento',
          erro: 'É necessário fornecer mensagem, decisao e cenario'
        });
      }
      
      // Validar decisão
      const decisoesValidas = ['APPROVE', 'REJECT', 'MANUAL_REVIEW'];
      if (!decisoesValidas.includes(decisao)) {
        return res.status(400).json({ 
          mensagem: 'Decisão inválida',
          erro: `A decisão deve ser uma das seguintes: ${decisoesValidas.join(', ')}`
        });
      }
      
      // CORREÇÃO: É necessário incluir uma mensagem do usuário
      const messages = [
        {
          role: "system",
          content: `Você está sendo treinado com exemplos de análise de crédito. Este é um exemplo onde a decisão correta é ${decisao} (${this.traduzirDecisao(decisao)}).`
        },
        {
          role: "user",
          content: `Por favor, analise e memorize este cenário de crédito onde a decisão correta é ${decisao} (${this.traduzirDecisao(decisao)}):
          
${JSON.stringify(cenario, null, 2)}

Explicação para a decisão:
${cenario.explicacao || "Não fornecida"}

Memorize este exemplo para futuras análises de crédito. Quando um caso semelhante a este aparecer, você deve recomendar ${decisao}.`
        }
      ];
      
      console.log(`Enviando mensagem de treinamento para IA...`);
      console.log(`Decisão: ${decisao}`);
      
      // Chamar a API da IA
      const response = await axios({
        method: 'post',
        url: this.endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessKey}`
        },
        data: {
          model: this.model,
          messages: messages,
          stream: false,
          max_tokens: 1024
        },
        timeout: 15000
      });
      
      // Verificar a resposta
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        // Envio bem-sucedido
        return res.status(200).json({
          mensagem: 'Exemplo de treinamento enviado com sucesso',
          decisao: decisao,
          resposta: response.data.choices[0].message.content.substring(0, 500) + (response.data.choices[0].message.content.length > 500 ? '...' : '')
        });
      } else {
        return res.status(500).json({
          mensagem: 'Resposta da IA não possui o formato esperado',
          erro: 'Falha no treinamento',
          resposta_original: response.data
        });
      }
    } catch (error) {
      console.error('Erro ao treinar IA:', error);
      
      return res.status(500).json({
        mensagem: 'Erro ao enviar exemplo de treinamento para a IA',
        erro: error.message,
        detalhes: error.response?.data || {}
      });
    }
  }
  
  /**
   * Testa o funcionamento da IA
   */
  async testarIA(req, res, next) {
    try {
      const { cenario } = req.body;
      
      if (!cenario) {
        return res.status(400).json({ 
          mensagem: 'Dados incompletos para teste',
          erro: 'É necessário fornecer um cenário'
        });
      }
      
      // Ferramentas de function calling
      const tools = [
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
                }
              },
              required: ["decision", "confidence"]
            }
          }
        }
      ];
      
      // Mensagem para a API com instrução de usar a função
      const mensagemUser = `Analise este cenário de crédito e use a função creditDecision para determinar se o crédito deve ser aprovado, rejeitado ou enviado para análise manual:

${JSON.stringify(cenario, null, 2)}

Considere que:
1. Se o cliente tiver alto score (>700) e renda mensal suficiente para cobrir o crédito, geralmente é uma aprovação
2. Se o comprometimento da renda for maior que 30%, considere rejeitar
3. Se houver dados conflitantes ou incompletos, envie para análise manual
4. Não responda com texto, APENAS chame a função`;

      console.log(`Enviando cenário de teste para IA...`);
      
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
              role: "user",
              content: mensagemUser
            }
          ],
          tools: tools,
          tool_choice: { type: "auto" },
          stream: false,
          max_tokens: 1024
        },
        timeout: 15000
      });
      
      // Extrair resultado
      let resultado = {};
      
      // Verificar se há function calling
      if (response.data.tool_calls && response.data.tool_calls.length > 0 && 
          response.data.tool_calls[0].function && 
          response.data.tool_calls[0].function.name === 'creditDecision') {
        
        // Extrair argumentos da função
        const args = JSON.parse(response.data.tool_calls[0].function.arguments);
        resultado = {
          decisao: args.decision,
          confianca: args.confidence,
          justificativa: args.justification,
          tipoResposta: 'FUNCTION_CALL'
        };
      } 
      // Caso não seja function calling, tentar extrair do texto
      else if (response.data.choices && response.data.choices[0]) {
        resultado = {
          texto: response.data.choices[0].message.content,
          tipoResposta: 'TEXT'
        };
        
        // Tentar extrair JSON do texto
        try {
          const matches = response.data.choices[0].message.content.match(/\{[\s\S]*\}/);
          if (matches && matches[0]) {
            const jsonResult = JSON.parse(matches[0]);
            if (jsonResult.decision) {
              resultado.decisao = jsonResult.decision;
              resultado.confianca = jsonResult.confidence;
              resultado.justificativa = jsonResult.justification;
              resultado.tipoResposta = 'JSON_IN_TEXT';
            }
          }
        } catch (jsonError) {
          console.log('Não foi possível extrair JSON da resposta:', jsonError.message);
        }
      }
      
      return res.status(200).json({
        mensagem: 'Teste de IA concluído com sucesso',
        resultado: resultado,
        resposta_completa: response.data
      });
    } catch (error) {
      console.error('Erro ao testar IA:', error);
      
      return res.status(500).json({
        mensagem: 'Erro ao testar a IA',
        erro: error.message,
        detalhes: error.response?.data || {}
      });
    }
  }
  
  /**
   * Traduz o código de decisão para uma descrição em português
   */
  traduzirDecisao(decisao) {
    switch (decisao) {
      case 'APPROVE':
        return 'Aprovar crédito';
      case 'REJECT':
        return 'Reprovar crédito';
      case 'MANUAL_REVIEW':
        return 'Encaminhar para análise manual';
      default:
        return 'Decisão desconhecida';
    }
  }
}

module.exports = IAController;