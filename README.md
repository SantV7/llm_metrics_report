# LLM Metrics Report

Projeto backend em Node.js + Express + TypeScript para registrar e gerenciar issues, métricas e autenticação de usuários.

## Stack

- Node.js
- Express
- TypeScript
- MongoDB
- JWT
- Jest

## Estrutura do projeto

```text
backend/
├── src/
│   ├── controllers/
│   │   ├── User/
│   │   │   ├── JWT/
│   │   │   ├── loginController.ts
│   │   │   └── passwordAuth.ts
│   ├── database/
│   │   └── mongoDB.ts
│   ├── middlewares/
│   │   └── UserAuth/
│   │       ├── loginAuth.ts
│   │       └── tokenAuth.ts
│   ├── routes/
│   │   └── User/
│   │       └── login.routes.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── loginAuth.test.ts
│   └── loginController.test.ts
├── jest.config.cjs
├── package.json
├── tsconfig.json
└── .env.example
```

## Requisitos

- Node.js 18+
- npm
- MongoDB configurado
- variável de ambiente `JWT_SECRET`
- variável de ambiente `MONGODB_URI`

## Variáveis de ambiente

Crie um arquivo `.env` com:

```env
JWT_SECRET=sua_chave_super_secreta
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=llm_metrics_report
PORT=3000
```

## Instalação

```bash
cd backend
npm install
```

## Como rodar a aplicação

```bash
cd backend
npm run dev
```

## Testes com Jest

O projeto usa Jest para validar regras de negócio e middleware.

### Instalar dependências de teste

As dependências já estão configuradas no `package.json`, então basta rodar:

```bash
cd backend
npm install
```

### Executar testes

```bash
cd backend
npm test
```

### O que os testes validam

- `loginAuth`: confirma que o corpo da requisição foi enviado corretamente e que o payload é normalizado.
- `loginController`: valida login bem-sucedido e rejeição de senha inválida.

## Fluxo de login

### Endpoint

```http
POST /user/login
```

### Payload esperado

```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

Também aceita `username` no lugar de `email`:

```json
{
  "username": "joao",
  "password": "senha123"
}
```

### Resposta de sucesso

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Resposta de erro

```json
{
  "message": "Usuário ou senha inválidos."
}
```

## Observações

- O middleware `loginAuth` valida o formato do corpo antes de prosseguir.
- O controller consulta o usuário no MongoDB e verifica a senha com hash.
- O JWT é gerado com `JWT_SECRET` e inclui o ID do usuário como `subject`.

## Próximos passos sugeridos

- criar testes para rotas protegidas com `tokenAuth`
- incluir rotas de registro de usuário
- adicionar testes de integração com Supertest
- melhorar a documentação da API com Swagger
