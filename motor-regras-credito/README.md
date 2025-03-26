# Motor de Regras de Aprovação de Crédito

Motor responsável por processar solicitações de crédito, aplicando regras predefinidas e dinâmicas para determinar se uma solicitação deve ser aprovada, reprovada ou encaminhada para análise manual. Integra-se com sistema de IA para análise avançada de crédito.

## Requisitos

- Node.js >= 14
- npm ou yarn
- PostgreSQL (já configurado - DigitalOcean)

## Configuração

O projeto já está configurado para usar um banco de dados PostgreSQL no DigitalOcean e uma API de IA no DigitalOcean. As credenciais estão no arquivo `.env`.

Para configurar o projeto localmente:

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd motor-regras-credito

# Instalar dependências e configurar o banco de dados
npm run setup
# ou configure manualmente
npm install
npm run migrate
npm run seed
```

## Executando o projeto

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm start

# Usando Docker
docker-compose up -d
```

## Testando a aplicação

Para testar o motor de crédito, você pode:

1. Usar o script de teste que gera um cliente aleatório:
```bash
npm run test:credit
```

2. Acessar a rota de exemplo para obter IDs de clientes:
```bash
curl http://localhost:3000/api/clientes/exemplo
```

3. Enviar uma solicitação de análise de crédito:
```bash
curl -X POST http://localhost:3000/api/credito/analisar \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "CLI12345",
    "valorCredito": 10000,
    "parametrosAdicionais": {
      "prazo": 36,
      "finalidade": "PESSOAL"
    }
  }'
```

4. Testar a integração com a IA:
```bash
node tests/integration/test-ia.js
```

## Estrutura do projeto

O motor segue uma arquitetura em camadas:

- **Camada Service**: Contém o Motor (Façade) como ponto de entrada
- **Camada Core**: Contém a lógica de avaliação e o Gerenciador de Cenário
- **Camada Entity**: Contém a definição do objeto Cenário
- **Camada Adapter**: Contém adaptadores para sistemas externos (incluindo IA)
- **Camada API**: Contém controladores e rotas da API

## Arquitetura

O motor usa vários padrões de design:

- **Façade**: Motor como ponto de entrada único
- **Chain of Responsibility**: Para processamento sequencial de regras
- **Specification**: Para regras mandatórias
- **Strategy**: Para regras dinâmicas
- **Adapter**: Para integração com sistemas externos

## Integração com IA

O motor utiliza uma API de IA oferecida pelo DigitalOcean para análise avançada de crédito. A integração é configurada através das variáveis de ambiente:

- `IA_ENDPOINT`: URL do endpoint da API de IA
- `IA_ACCESS_KEY`: Chave de acesso para autenticação

A IA é consultada após a verificação das regras mandatórias e dinâmicas, e pode:

1. Aprovar ou reprovar o crédito com base em sua análise
2. Solicitar análise manual quando detectar casos complexos
3. Sugerir novas regras dinâmicas baseadas em padrões identificados

## Banco de Dados

O banco de dados está hospedado no DigitalOcean e já possui tabelas e dados de teste configurados. Para visualizar o esquema, consulte o arquivo `src/migrations/20240323_initial_schema.js`.

## Testes

```bash
# Executar todos os testes
npm test

# Executar testes com watch mode
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

## Gerenciamento de Regras Dinâmicas

O sistema possui uma API para gerenciar regras dinâmicas que podem ser acessadas via:

```bash
# Listar todas as regras
curl http://localhost:3000/api/regras-dinamicas

# Detalhar uma regra
curl http://localhost:3000/api/regras-dinamicas/1

# Aprovar uma regra
curl -X PUT http://localhost:3000/api/regras-dinamicas/1/aprovacao \
  -H "Content-Type: application/json" \
  -d '{"aprovada": true}'
```