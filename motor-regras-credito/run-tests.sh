#!/bin/bash

# Script para executar testes corretamente, evitando problemas de porta e sequência
echo "===== INICIANDO TESTES DO MOTOR DE REGRAS DE CRÉDITO ====="

# Verificar se todos os arquivos de teste foram criados
MISSING_FILES=false

check_file() {
  if [ ! -f "$1" ]; then
    echo "AVISO: Arquivo de teste $1 não encontrado"
    MISSING_FILES=true
  fi
}

echo "Verificando arquivos de teste..."
check_file "tests/unit/utils/CenarioHelper.test.js"
check_file "tests/unit/service/LogService.test.js"
check_file "tests/unit/core/chain/ChainOfResponsibility.test.js"
check_file "tests/unit/api/middleware/validators.test.js"
check_file "tests/unit/api/controllers/CreditoController.test.js"
check_file "src/app-test.js"

if [ "$MISSING_FILES" = true ]; then
  echo "Alguns arquivos de teste estão faltando. Verifique se todos os arquivos foram criados corretamente."
  read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."
fi

# Verificar dependências
echo "Verificando dependências..."
npm list jest > /dev/null 2>&1 || npm install --save-dev jest
npm list axios > /dev/null 2>&1 || npm install axios
npm list supertest > /dev/null 2>&1 || npm install --save-dev supertest

# Executar testes de unidade primeiro (com vários tratamentos de erro)
echo ""
echo "==== EXECUTANDO TESTES UNITÁRIOS ===="
npx jest tests/unit/ --colors --verbose --testTimeout=10000 --detectOpenHandles

# Executar testes de integração com configurações especiais
echo ""
echo "==== EXECUTANDO TESTES DE INTEGRAÇÃO ===="
# Aumentar timeout para evitar problemas
npx jest tests/integration/ --testTimeout=15000 --colors --verbose --forceExit

# Executar E2E com configurações especiais
echo ""
echo "==== EXECUTANDO TESTES E2E ===="
npx jest tests/e2e/ --testTimeout=15000 --colors --verbose --forceExit

# Executar todos os testes com cobertura
echo ""
echo "==== GERANDO RELATÓRIO DE COBERTURA COMPLETO ===="
npx jest --coverage --colors --testTimeout=15000 --forceExit

echo ""
echo "===== TESTES CONCLUÍDOS ====="
echo ""
echo "Se você encontrou erros nos testes, tente:"
echo "1. Verifique se todos os arquivos de teste estão no local correto"
echo "2. Execute 'npm test' para testes individuais"
echo "3. Para problemas de porta em uso, verifique se não há outros servidores rodando na porta 3000"
echo ""
echo "Para melhorar a cobertura de código, concentre-se em:"
echo "- Controllers (CreditoController, IAController)"
echo "- DAOs (CenarioDAO, ClienteDAO)"
echo "- Adaptadores (BureauCreditoAdapter, IAAdapter, etc.)"
echo ""