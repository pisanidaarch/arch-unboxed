// src/migrations20250324_03_regras_dinamicas.js

exports.up = function(knex) {
    return knex.schema
      .createTable('regras_dinamicas', function(table) {
        table.increments('id').primary();
        table.string('nome').notNullable();
        table.string('descricao').notNullable();
        table.string('tipo').notNullable(); // Tipo da regra (ex: COMPROMETIMENTO_RENDA, PRAZO_MAXIMO, etc)
        table.jsonb('parametros').notNullable().defaultTo('{}'); // Parâmetros específicos da regra em JSON
        table.boolean('aprovada').notNullable().defaultTo(false); // Flag que indica se a regra foi aprovada por um humano
        table.string('origem').notNullable(); // SISTEMA, IA, HUMANO
        table.boolean('ativa').notNullable().defaultTo(true);
        table.timestamps(true, true);
      })
      // Inserir regras dinâmicas iniciais
      .then(() => {
        return knex('regras_dinamicas').insert([
          {
            nome: 'COMPROMETIMENTO_RENDA',
            descricao: 'Comprometimento máximo de renda de 30%',
            tipo: 'COMPROMETIMENTO_RENDA',
            parametros: JSON.stringify({ percentualMaximo: 30 }),
            aprovada: true,
            origem: 'SISTEMA',
            ativa: true
          },
          {
            nome: 'VALOR_MAXIMO_PRIMEIRA_COMPRA',
            descricao: 'Valor máximo de crédito para primeira compra é de R$ 5.000',
            tipo: 'VALOR_MAXIMO',
            parametros: JSON.stringify({ valorMaximo: 5000, primeiraCompra: true }),
            aprovada: true,
            origem: 'SISTEMA',
            ativa: true
          },
          {
            nome: 'NEGATIVADO_SCORE_MINIMO',
            descricao: 'Cliente negativado precisa ter score mínimo de 700',
            tipo: 'SCORE_CONDICIONAL',
            parametros: JSON.stringify({ scoreMinimo: 700, condicao: 'NEGATIVADO' }),
            aprovada: false,
            origem: 'IA',
            ativa: true
          },
          {
            nome: 'LIMITE_MAIOR_PRAZO',
            descricao: 'Crédito acima de R$ 10.000 deve ter prazo mínimo de 24 meses',
            tipo: 'PRAZO_MINIMO',
            parametros: JSON.stringify({ valorMinimo: 10000, prazoMinimo: 24 }),
            aprovada: true,
            origem: 'HUMANO',
            ativa: true
          }
        ]);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('regras_dinamicas');
  };