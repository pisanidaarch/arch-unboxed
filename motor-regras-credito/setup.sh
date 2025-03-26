#!/bin/bash
# Script para configurar o projeto Motor de Regras de Aprovação de Crédito

echo "Iniciando configuração do Motor de Regras de Crédito..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Erro: Node.js não está instalado!"
    echo "Por favor, instale o Node.js (versão 14 ou superior) antes de continuar."
    exit 1
fi

# Verificar a versão do Node.js
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "Erro: Versão do Node.js é inferior a 14!"
    echo "Por favor, atualize o Node.js para a versão 14 ou superior."
    exit 1
fi

echo "Node.js versão $(node -v) encontrado."

# Instalar dependências
echo "Instalando dependências do projeto..."
npm install

# Verificar variáveis de ambiente
if [ ! -f .env ]; then
    echo "Criando arquivo .env..."
    cp .env.example .env
    echo "Arquivo .env criado com base no .env.example"
else
    echo "Arquivo .env já existe."
fi

# Executar migrações do banco
echo "Executando migrações do banco de dados..."
npm run migrate

# Inserir dados de teste
echo "Inserindo dados de teste no banco de dados..."
npm run seed

# Testar acesso ao banco de dados
echo "Testando acesso ao banco de dados..."
node -e "
const { getDatabase } = require('./src/config/database');
async function testDB() {
  try {
    const db = getDatabase();
    const result = await db.raw('SELECT 1+1 as result');
    console.log('Conexão com o banco de dados OK:', result.rows[0].result === 2);
    await db.destroy();
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error.message);
    process.exit(1);
  }
}
testDB();"

# Garantir que os diretórios de teste existam
echo "Criando diretórios de teste..."
mkdir -p tests/integration
mkdir -p tests/unit
mkdir -p tests/e2e

# Testar a integração com a IA
echo "Testando a integração com a IA..."
node tests/integration/test-ia.js

echo "Configuração concluída com sucesso!"
echo "Para iniciar o servidor em modo de desenvolvimento, execute: npm run dev"
echo "Para iniciar o servidor em modo de produção, execute: npm start"