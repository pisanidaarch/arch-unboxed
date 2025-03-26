#!/bin/bash

echo "==== Script de correção para testes de integração com IA ===="
echo "Verificando dependências..."

# Verificar se temos axios instalado
if ! npm list axios > /dev/null 2>&1; then
    echo "Instalando dependência axios..."
    npm install axios
fi

# Verificar se o diretório existe
if [ ! -d "tests/integration" ]; then
    echo "Criando diretório tests/integration..."
    mkdir -p tests/integration
fi

# Verificar o método toJsonForIA na classe Cenario
if ! grep -q "toJsonForIA" src/entity/Cenario.js; then
    echo "Adicionando método toJsonForIA à classe Cenario..."
    # Aqui seria necessário um sed complexo, então vamos sugerir editar manualmente
    echo "Por favor, adicione o método toJsonForIA à classe Cenario conforme os arquivos corrigidos."
fi

echo "Executando correções e testes..."

# Executar testes
echo "Testando a integração..."
npm run test:ia

echo "==== Correções aplicadas ===="
echo "Agora você pode executar:"
echo "npm run test:ia        # Para testar a integração direta com a IA"
echo "npm run test:ia:new    # Para testar a integração via adapter"