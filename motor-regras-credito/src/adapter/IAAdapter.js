// src/adapter/IAAdapter.js
const axios = require('axios');
const ResultadoIA = require('../entity/ResultadoIA');
const RegraDinamicaDAO = require('../dao/RegraDinamicaDAO');

class IAAdapter {
  constructor(options = {}) {
    this.regraDinamicaDAO = new RegraDinamicaDAO();
    
    // Configuração do endpoint da IA
    this.endpoint = process.env.IA_ENDPOINT || 'https://agent-fwsknwjtwgows7bbq34wgyka-lacbb.ondigitalocean.app/api/v1/chat/completions';
    this.accessKey = process.env.IA_ACCESS_KEY || 'tLNu967VSaTZkiWzvNJvAX5a4cnN7ilb';
    
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
    return {
      cliente: cenario.getDadosPorTipo("DADOS_CLIENTE"),
      bureau: cenario.getDadosPorTipo("BUREAU_CREDITO"),
      openBanking: cenario.getDadosPorTipo("OPEN_BANKING"),
      valorCredito: cenario.valorCredito,
      parametrosAdicionais: cenario.parametrosAdicionais,
      resultadosAnteriores: cenario.resultadosAvaliacao
    };
  }

  formatarMensagemIA(dadosParaIA) {
    // Formatar a mensagem para enviar à IA
    return `Por favor, avalie esta solicitação de crédito baseada nos seguintes dados:
      
DADOS DO CLIENTE:
${JSON.stringify(dadosParaIA.cliente, null, 2)}

DADOS DO BUREAU DE CRÉDITO:
${JSON.stringify(dadosParaIA.bureau, null, 2)}

DADOS BANCÁRIOS (OPEN BANKING):
${JSON.stringify(dadosParaIA.openBanking, null, 2)}

SOLICITAÇÃO DE CRÉDITO:
- Valor: R$ ${dadosParaIA.valorCredito.toFixed(2)}
- Parâmetros Adicionais: ${JSON.stringify(dadosParaIA.parametrosAdicionais, null, 2)}

RESULTADOS DE AVALIAÇÕES ANTERIORES:
${JSON.stringify(dadosParaIA.resultadosAnteriores, null, 2)}

Por favor, forneça um JSON com a seguinte estrutura:
{
  "aprovado": true/false,
  "justificativa": "Explicação da decisão",
  "confianca": 0.0-1.0,
  "analiseManual": true/false,
  "regrasGeradas": [
    {
      "nome": "NOME_DA_REGRA",
      "descricao": "Descrição da regra",
      "tipo": "TIPO_DA_REGRA",
      "parametros": { ... }
    }
  ]
}`;
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
      
      // Procurar pelo JSON na resposta
      const jsonMatch = conteudoResposta.match(/```json\n([\s\S]*?)\n```/) || 
                         conteudoResposta.match(/\{[\s\S]*\}/);
      
      let jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : conteudoResposta;
      
      // Limpar a string JSON para evitar problemas com formatação
      jsonString = jsonString.replace(/```json|```/g, '').trim();
      
      // Converter para objeto
      const resultado = JSON.parse(jsonString);
      
      // Validar campos obrigatórios
      if (resultado.aprovado === undefined) {
        throw new Error('Resposta da IA não contém o campo "aprovado"');
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao processar resposta da IA:', error);
      
      // Em caso de erro no processamento, retornar um resultado conservador
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
      for (const regra of regras) {
        // Verificar se a regra já existe com o mesmo nome
        const regrasExistentes = await this.regraDinamicaDAO.listar();
        const regraExistente = regrasExistentes.find(r => r.nome === regra.nome);
        
        if (regraExistente) {
          console.log(`Regra ${regra.nome} já existe, pulando inserção.`);
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
}

module.exports = IAAdapter;