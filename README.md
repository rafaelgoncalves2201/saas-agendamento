# 🗓️ Inova Agenda - SaaS de Agendamento Online Multi-tenant

Plataforma completa de agendamentos online, gestão de clientes (CRM), cobrança recorrente via **Asaas** e mensagens automáticas via **WhatsApp**, projetada para salões de beleza, clínicas de estética, barbearias, spas e profissionais autônomos.

---

## 🚀 Principais Funcionalidades

### 🏢 Multi-tenant e Gestão de Empresas
- Cada estabelecimento possui seu próprio link público personalizado (`/empresa/nome-da-empresa`).
- Painel administrativo isolado por empresa com métricas de faturamento, atendimentos diários e mensais.
- Controle de acesso por permissões: `SUPER_ADMIN`, `COMPANY_ADMIN`, `PROFESSIONAL` e `STAFF`.

### 📅 Agendamentos e Horários
- Fluxo de agendamento público intuitivo em 5 passos com seleção de profissional, serviço, data e horários disponíveis.
- **Validação de Intervalos e Conflitos**: Suporte a procedimentos com durações personalizadas e bloqueio automático de choque de horários.
- **Cobrança de Sinal via Pix**: O profissional pode exigir sinal para reserva de horário, com cópia da chave Pix e envio de comprovante via WhatsApp.
- **Reagendamento pelo Profissional**: Modal para alteração rápida de data, horário ou profissional com recálculo automático e notificação ao cliente.

### 💳 Assinaturas e Pagamentos (Asaas)
- Integração nativa em produção com a API v3 do **Asaas**.
- Contratação de planos recorrentes (`Starter`, `Professional`, `Business`) via Pix, Boleto e Cartão de Crédito.
- Webhook automatizado para ativação, renovação e suspensão de planos.

### 💬 Notificações por WhatsApp
- Suporte nativo a provedores via QR Code: **Evolution API** e **Z-API**.
- Disparos automáticos de confirmação de horário, lembretes e avisos de reagendamento.

### 🎨 Personalização Visual e Temas
- **Identidade Visual Bege & Marrom**: Paleta refinada com fundo bege suave (`#F8F5EE`), superfícies marfim (`#FDFCF9`) e marrom nobre (`#6B3E26`).
- **Modo Escuro**: Tema sofisticado em café espresso (`#120D0A`) com cards chocolate escuro e contraste nítido.
- **Simulador de Celular em Tempo Real**: Pré-visualização instantânea da página pública e da tela de confirmação de sinal diretamente no painel.

### 🏷️ Módulos Adicionais
- **CRM de Clientes**: Histórico de visitas, total de atendimentos e anotações internas.
- **Catálogo de Serviços e Produtos**: Cadastro com fotos, duração, preços e categorias.
- **Cupons de Desconto**: Descontos percentuais ou em reais, limites de uso, validade e vinculação por profissional.

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) (Node.js & TypeScript)
- **ORM & Banco de Dados**: [Prisma ORM](https://www.prisma.io/) com **PostgreSQL** (compatível com Neon Serverless)
- **Autenticação**: Passport.js, JWT (Access Token 15m + Refresh Token 7d) e criptografia Argon2
- **Documentação de API**: Swagger / OpenAPI integrada em `/api/docs`
- **Validação de Dados**: Class-Validator e Class-Transformer
- **Pagamentos**: Asaas SDK / REST API v3

### Frontend
- **Framework**: [React 19](https://react.dev/) com [Vite](https://vitejs.dev/) e TypeScript
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) com design system customizado
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gerenciamento de Estado**: Zustand
- **Roteamento**: React Router DOM v7
- **Manipulação de Datas**: date-fns e date-fns-tz

---

## 📁 Estrutura do Repositório

```text
SaaS - Agendamento/
├── backend/                  # API NestJS
│   ├── prisma/               # Schema e seeds do banco de dados
│   ├── src/
│   │   ├── modules/          # Módulos (auth, appointments, companies, payments, etc.)
│   │   ├── common/           # Guards, interceptors, filters e decorators
│   │   └── main.ts           # Inicialização e configuração de CORS
│   ├── .env.example          # Modelo de variáveis de ambiente do backend
│   └── package.json
├── frontend/                 # Aplicação React SPA
│   ├── src/
│   │   ├── layouts/          # Layout do dashboard e navegação
│   │   ├── pages/            # Telas da aplicação (admin, empresa, booking público)
│   │   ├── contexts/         # Contexto de temas (Claro / Escuro / Sistema)
│   │   └── services/         # Cliente Axios e interceptores de API
│   ├── vercel.json           # Regras de reescrita para rotas SPA na Vercel
│   ├── .env.example          # Modelo de variáveis de ambiente do frontend
│   └── package.json
└── README.md
```

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js 20+ instalado
- PostgreSQL rodando localmente ou conta no [Neon](https://neon.tech)
- Git

### 1. Clonar e Configurar o Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env
```

Edite o arquivo `.env` inserindo sua conexão com o banco de dados PostgreSQL.

```bash
# Gerar cliente do Prisma e sincronizar tabelas
npx prisma db push

# Popular banco com o Super Admin e os planos oficiais
npx prisma db seed

# Iniciar servidor em desenvolvimento
npm run start:dev
```
A API estará disponível em: `http://localhost:3000/api`  
Documentação Swagger: `http://localhost:3000/api/docs`

### 2. Configurar e Rodar o Frontend

Em outro terminal:

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor Vite
npm run dev
```
Acesse o aplicativo em: `http://localhost:5173`

---

## 🔐 Acesso Inicial do Super Admin

Após executar o comando de seed (`npx prisma db seed`), você pode acessar a área administrativa com as credenciais padrão:

- **E-mail**: `rgcarmo545@gmail.com`
- **Senha**: `99622_Rp`

---

## 🌐 Guia de Deploy em Produção

### 1. Banco de Dados no [Neon](https://neon.tech)
1. Crie um projeto no Neon (Região `US East`).
2. Copie a `DATABASE_URL` fornecida (formato: `postgresql://...sslmode=require`).
3. No terminal do backend, execute `npx prisma db push` e `npx prisma db seed` apontando para o Neon.

### 2. Backend no [Render](https://render.com)
1. Crie um novo **Web Service** conectado ao seu repositório no GitHub.
2. Defina:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
3. Configure as variáveis de ambiente no Render (`DATABASE_URL`, `ASAAS_API_KEY`, `JWT_ACCESS_SECRET`, etc.).

### 3. Frontend na [Vercel](https://vercel.com)
1. Crie um novo projeto importando o mesmo repositório do GitHub.
2. Defina:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
3. Adicione a variável de ambiente:
   - `VITE_API_URL`: `https://sua-api-no-render.onrender.com/api`
4. Conclua o deploy. As rotas internas já estão configuradas no `vercel.json`.

---

## 📄 Licença

Este projeto é de propriedade privada e desenvolvido para operação comercial de software como serviço (SaaS).

