// src/config/database.js
require('dotenv').config();
const knex = require('knex');

const dbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'arch-unboxed-do-user-17207448-0.m.db.ondigitalocean.com',
    port: process.env.DB_PORT || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD || 'AVNS__miNSjGgSy7bewEbrvA',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../migrations'
  },
  seeds: {
    directory: '../seeds'
  }
};

// Singleton para garantir uma única instância da conexão
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = knex(dbConfig);
  }
  return dbInstance;
}

module.exports = {
  getDatabase,
  dbConfig
};