// src/core/chain/handlers/RegrasMandatoriasHandler.js

class RegrasMandatoriasHandler {
  constructor(specifications) {
    this.specifications = specifications;
  }

  async processar(cenario) {
    // Não cria uma cópia simples do objeto, pois isso não copia os métodos
    // Usamos o cenário original diretamente
    const cenarioProcessado = cenario;

    for (const spec of this.specifications) {
      const resultado = await spec.isSatisfiedBy(cenarioProcessado);
      
      cenarioProcessado.adicionarResultadoAvaliacao(
        spec.getNome(), 
        resultado, 
        spec.getDescricao()
      );

      // Se uma regra mandatória falhar, já pode encerrar
      if (!resultado) {
        cenarioProcessado.regraFalhou = true;
        break;
      }
    }

    return cenarioProcessado;
  }
}

module.exports = RegrasMandatoriasHandler;