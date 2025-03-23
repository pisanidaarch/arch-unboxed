// src/api/controllers/RegraDinamicaController.js
const RegraDinamicaDAO = require('../../dao/RegraDinamicaDAO');

class RegraDinamicaController {
  constructor() {
    this.regraDinamicaDAO = new RegraDinamicaDAO();
  }

  /**
   * Lista todas as regras dinâmicas
   */
  async listarRegras(req, res, next) {
    try {
      const { ativas, aprovadas, origem } = req.query;
      
      const options = {
        ativas: ativas === 'true' ? true : (ativas === 'false' ? false : undefined),
        aprovadas: aprovadas === 'true' ? true : (aprovadas === 'false' ? false : undefined),
        origem: origem
      };

      const regras = await this.regraDinamicaDAO.listar(options);
      
      return res.status(200).json({
        total: regras.length,
        regras
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém detalhes de uma regra dinâmica pelo ID
   */
  async detalharRegra(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ mensagem: 'ID da regra é obrigatório' });
      }

      const regra = await this.regraDinamicaDAO.buscarPorId(id);
      
      if (!regra) {
        return res.status(404).json({ mensagem: `Regra não encontrada: ${id}` });
      }

      return res.status(200).json(regra);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova regra dinâmica
   */
  async criarRegra(req, res, next) {
    try {
      const { nome, descricao, tipo, parametros, aprovada, origem, ativa } = req.body;
      
      // Validação de campos obrigatórios
      if (!nome || !descricao || !tipo) {
        return res.status(400).json({ 
          mensagem: 'Dados inválidos',
          erros: ['nome, descricao e tipo são campos obrigatórios']
        });
      }

      // Validação do tipo de regra
      const tiposValidos = ['COMPROMETIMENTO_RENDA', 'VALOR_MAXIMO', 'SCORE_CONDICIONAL', 'PRAZO_MINIMO'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ 
          mensagem: 'Tipo de regra inválido',
          tiposValidos
        });
      }

      // Validações específicas para cada tipo de regra
      const erros = [];
      
      if (tipo === 'COMPROMETIMENTO_RENDA' && (!parametros.percentualMaximo || isNaN(parametros.percentualMaximo))) {
        erros.push('Parâmetro percentualMaximo é obrigatório e deve ser um número para regras COMPROMETIMENTO_RENDA');
      }
      
      if (tipo === 'VALOR_MAXIMO' && (!parametros.valorMaximo || isNaN(parametros.valorMaximo))) {
        erros.push('Parâmetro valorMaximo é obrigatório e deve ser um número para regras VALOR_MAXIMO');
      }
      
      if (tipo === 'SCORE_CONDICIONAL') {
        if (!parametros.scoreMinimo || isNaN(parametros.scoreMinimo)) {
          erros.push('Parâmetro scoreMinimo é obrigatório e deve ser um número para regras SCORE_CONDICIONAL');
        }
        if (!parametros.condicao) {
          erros.push('Parâmetro condicao é obrigatório para regras SCORE_CONDICIONAL');
        }
      }
      
      if (tipo === 'PRAZO_MINIMO') {
        if (!parametros.valorMinimo || isNaN(parametros.valorMinimo)) {
          erros.push('Parâmetro valorMinimo é obrigatório e deve ser um número para regras PRAZO_MINIMO');
        }
        if (!parametros.prazoMinimo || isNaN(parametros.prazoMinimo)) {
          erros.push('Parâmetro prazoMinimo é obrigatório e deve ser um número para regras PRAZO_MINIMO');
        }
      }
      
      if (erros.length > 0) {
        return res.status(400).json({ 
          mensagem: 'Validação falhou',
          erros
        });
      }

      // Verificar se já existe uma regra com o mesmo nome
      const regrasExistentes = await this.regraDinamicaDAO.listar();
      const regraExistenteComMesmoNome = regrasExistentes.find(r => r.nome === nome);
      
      if (regraExistenteComMesmoNome) {
        return res.status(409).json({ 
          mensagem: `Já existe uma regra com o nome '${nome}'`,
          regra: regraExistenteComMesmoNome
        });
      }

      const regra = await this.regraDinamicaDAO.inserir({
        nome,
        descricao,
        tipo,
        parametros,
        aprovada: !!aprovada,
        origem: origem || 'HUMANO',
        ativa: ativa !== undefined ? !!ativa : true
      });

      return res.status(201).json(regra);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma regra dinâmica existente
   */
  async atualizarRegra(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, descricao, tipo, parametros, aprovada, origem, ativa } = req.body;
      
      if (!id) {
        return res.status(400).json({ mensagem: 'ID da regra é obrigatório' });
      }

      // Verifica se a regra existe
      const regraExistente = await this.regraDinamicaDAO.buscarPorId(id);
      if (!regraExistente) {
        return res.status(404).json({ mensagem: `Regra não encontrada: ${id}` });
      }

      // Validação do tipo de regra, se fornecido
      if (tipo) {
        const tiposValidos = ['COMPROMETIMENTO_RENDA', 'VALOR_MAXIMO', 'SCORE_CONDICIONAL', 'PRAZO_MINIMO'];
        if (!tiposValidos.includes(tipo)) {
          return res.status(400).json({ 
            mensagem: 'Tipo de regra inválido',
            tiposValidos
          });
        }
      }
      
      // Verificar se o nome atualizado já existe em outra regra
      if (nome && nome !== regraExistente.nome) {
        const regrasExistentes = await this.regraDinamicaDAO.listar();
        const regraExistenteComMesmoNome = regrasExistentes.find(r => r.nome === nome && r.id !== parseInt(id));
        
        if (regraExistenteComMesmoNome) {
          return res.status(409).json({ 
            mensagem: `Já existe outra regra com o nome '${nome}'`,
            regra: regraExistenteComMesmoNome
          });
        }
      }

      const regra = await this.regraDinamicaDAO.atualizar(id, {
        nome: nome || regraExistente.nome,
        descricao: descricao || regraExistente.descricao,
        tipo: tipo || regraExistente.tipo,
        parametros: parametros || regraExistente.parametros,
        aprovada: aprovada !== undefined ? !!aprovada : regraExistente.aprovada,
        origem: origem || regraExistente.origem,
        ativa: ativa !== undefined ? !!ativa : regraExistente.ativa
      });

      return res.status(200).json(regra);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Aprovar ou reprovar uma regra dinâmica
   */
  async alterarAprovacao(req, res, next) {
    try {
      const { id } = req.params;
      const { aprovada } = req.body;
      
      if (!id) {
        return res.status(400).json({ mensagem: 'ID da regra é obrigatório' });
      }

      if (aprovada === undefined) {
        return res.status(400).json({ mensagem: 'Campo aprovada é obrigatório' });
      }

      const regra = await this.regraDinamicaDAO.alterarAprovacao(id, !!aprovada);
      
      if (!regra) {
        return res.status(404).json({ mensagem: `Regra não encontrada: ${id}` });
      }

      return res.status(200).json(regra);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ativar ou desativar uma regra dinâmica
   */
  async alterarAtivacao(req, res, next) {
    try {
      const { id } = req.params;
      const { ativa } = req.body;
      
      if (!id) {
        return res.status(400).json({ mensagem: 'ID da regra é obrigatório' });
      }

      if (ativa === undefined) {
        return res.status(400).json({ mensagem: 'Campo ativa é obrigatório' });
      }

      const regra = await this.regraDinamicaDAO.alterarAtivacao(id, !!ativa);
      
      if (!regra) {
        return res.status(404).json({ mensagem: `Regra não encontrada: ${id}` });
      }

      return res.status(200).json(regra);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RegraDinamicaController;