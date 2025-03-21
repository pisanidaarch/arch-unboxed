#!/bin/bash
# Script para criar a estrutura do projeto Motor de Regras de Aprovação de Crédito

echo "Criando estrutura de pastas do projeto..."

# Criar diretório principal
mkdir -p motor-regras-credito
cd motor-regras-credito

# Criar estrutura de pastas
mkdir -p src/{service,core/{chain/handlers,specifications,strategies},entity,adapter,api/{controllers,routes,middleware},config,utils/errors} tests/{unit,integration,e2e}

# Inicializar o projeto npm
echo "Inicializando projeto npm..."
npm init -y

# Modificar o package.json com scripts úteis
cat > package.json << 'EOL'
{
  "name": "motor-regras-credito",
  "version": "1.0.0",
  "description": "Motor de Regras de Aprovação de Crédito",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "keywords": ["credit", "approval", "rules-engine"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.1"
  }
}
EOL

# Instalar dependências
echo "Instalando dependências..."
npm install

# Copiar arquivos base (você deve ter esses arquivos no mesmo diretório deste script)
# Neste exemplo, vamos criar um arquivo .gitignore
cat > .gitignore << 'EOL'
# Dependências
node_modules/
npm-debug.log

# Testes
coverage/

# Ambiente
.env

# Arquivos do sistema
.DS_Store
Thumbs.db

# Arquivos de IDE
.idea/
.vscode/
*.sublime-project
*.sublime-workspace
EOL

# Criar arquivo .env.example
cat > .env.example << 'EOL'
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações de Logs
LOG_LEVEL=info

# Configurações de Timeout (ms)
TIMEOUT_BUREAU=5000
TIMEOUT_OPENBANKING=5000
TIMEOUT_IA=8000

# Configurações de Regras
IDADE_MINIMA=18
SCORE_MINIMO=500
COMPROMETIMENTO_RENDA_MAXIMO=30
EOL

# Criar README.md básico
cat > README.md << 'EOL'
# Motor de Regras de Aprovação de Crédito

Motor responsável por processar solicitações de crédito, aplicando regras predefinidas e dinâmicas para determinar se uma solicitação deve ser aprovada, reprovada ou encaminhada para análise manual.

## Instalação

```bash
npm install
```

## Uso

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Testes
npm test
```

EOL

echo "Estrutura do projeto criada com sucesso!"
echo "Para começar a desenvolver, execute:"
echo "cd motor-regras-credito"
echo "npm run dev"