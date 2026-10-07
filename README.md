# 🗓️ Inovae Agenda - SaaS de Agendamento Online Multi-tenant

Plataforma completa de agendamentos online, gestão de clientes (CRM), controle de estoque de insumos, faturamento recorrente via **Asaas**, pagamentos dos clientes via **Mercado Pago** / **Pix Direto de Sinal** e notificações automáticas via **WhatsApp**.

Projetada com arquitetura escalável multi-tenant para salões de beleza, barbearias, clínicas de estética, esmalterias, spas e profissionais autônomos.

---

## 💎 Nova Estrutura Definitiva de Planos

O sistema possui uma matriz de recursos centralizada no backend (`backend/src/common/config/plans.config.ts`) com bloqueios em tempo real via `PlanFeatureGuard`:

| Recurso / Limite | **BÁSICO** (R$ 29,90/mês) | **PROFISSIONAL** (R$ 59,90/mês) | **PREMIUM** (R$ 99,90/mês) |
| :--- | :---: | :---: | :---: |
| **Profissionais Prestadores** | **Máximo de 1 profissional** | **Até 5 profissionais** | **Até 15 profissionais** |
| **Agendamentos Mensais** | **50 agendamentos/mês** | **100 agendamentos/mês** | **Ilimitado** |
| **Disparos WhatsApp (Agendamento)** | **Ilimitado** (Incluso) | **Ilimitado** (Incluso) | **Ilimitado** (Incluso) |
| **Página Pública & Link Próprio** | ✅ Incluso | ✅ Incluso | ✅ Incluso |
| **Cadastro de Clientes e Serviços** | ✅ Incluso | ✅ Incluso | ✅ Incluso |
| **Mercado Pago (Cartão até 12x / Pix)** | ❌ Não permitido | ✅ Incluso | ✅ Incluso |
| **Sinal de Reserva via Chave Pix** | ❌ Não permitido | ✅ Incluso | ✅ Incluso |
| **Gestão de Estoque & Insumos** | ❌ Não permitido | ✅ Incluso | ✅ Incluso |
| **Alertas de Reposição por WhatsApp** | ❌ Não aplicável | ✅ Incluso | ✅ Incluso |

### 🔒 Segurança e Aplicação de Limites no Backend
* **Agendamentos**: O backend contabiliza apenas os agendamentos do ciclo vigente. Ao atingir o limite (50 no Básico, 100 no Profissional), o próximo agendamento é bloqueado e não salvo no banco, retornando mensagem orientando o upgrade.
* **Profissionais**: O backend valida o número de profissionais ativos da empresa. Tentativas de cadastrar além da cota do plano são rejeitadas com erro 403 e instruções de upgrade.
* **Controle de Acesso por Decorators**: Rotas restritas utilizam `@RequireFeature('mercadopago')` e `@RequireFeature('inventory')`. Usuários do plano Básico são bloqueados antes de atingir os controllers ou services.
* **Integridade de Preço**: O frontend envia apenas o identificador do plano (`BASIC`, `PROFESSIONAL`, `PREMIUM`). O valor cobrado é lido estritamente do banco de dados, impedindo qualquer manipulação de preço no cliente.

---

## 🚀 Funcionalidades da Plataforma

### 🏢 Multi-tenant e Gestão de Empresas
- Cada estabelecimento possui seu próprio link público (`/empresa/seu-slug`).
- Painel administrativo isolado por empresa com métricas diárias, semanais e mensais.
- Controle de acesso por papéis: `SUPER_ADMIN`, `COMPANY_ADMIN`, `PROFESSIONAL` e `STAFF`.
- Seleção de plano diretamente na tela de cadastro (`/register`) com 5 dias de teste grátis.

### 📅 Agendamentos e Horários
- Fluxo de agendamento público intuitivo e mobile-first em passos guiados.
- **Validação de Intervalos e Choques**: Cálculo automático de slots livres considerando duração do serviço e pausas de almoço.
- **Confirmação, Remarcação e Cancelamento**: Gestão completa de status tanto pelo painel quanto pelo cliente.

### 💵 Formas Flexíveis de Recebimento dos Agendamentos
1. **Sinal na Chave Pix Direta (Sem Taxas intermediárias)**:
   - O cliente transfere o valor do sinal (ex: R$ 30, R$ 50 ou 30%) diretamente para a chave Pix bancária do estabelecimento (E-mail, Telefone, CPF, CNPJ ou Aleatória).
   - O cliente envia o comprovante via botão de WhatsApp, e o restante é acertado no balcão no término do serviço.
2. **Mercado Pago (100% Automático)**:
   - Integração OAuth oficial para o estabelecimento conectar sua conta.
   - Recebimento online antecipado via Pix com QR Code dinâmico ou Cartão de Crédito parcelado em até 12x com baixa automática.
3. **Agendamento Livre (Pagar no Local)**:
   - O agendamento é reservado sem cobrança antecipada, ideal para serviços rápidos ou planos Básico.

### 📦 Controle de Estoque & Reposição de Insumos (Planos Pro & Premium)
- Cadastro de insumos de atendimento e produtos para revenda com SKU, unidade de medida, custo e preço.
- Controle de estoque mínimo com cálculo de alertas de escassez.
- Histórico auditável de movimentações (Entradas, Saídas e Ajustes manuais com justificativa).
- **Disparo de Alertas de Reposição por WhatsApp**: Envio em 1 clique da lista de itens com estoque baixo para os profissionais responsáveis providenciarem compras.

### 💬 Mensageria e Conexão WhatsApp
- Módulo com socket local / Baileys: conexão direta via leitura de QR Code no painel.
- Disparos automáticos de:
  - Confirmação de agendamento.
  - Lembrete de horário antes do procedimento.
  - Notificação de reagendamento ou cancelamento.
  - Alerta de reposição de estoque crítico.

### 💳 Cobrança Recorrente de Assinaturas (Asaas)
- Integração oficial com a API v3 do **Asaas** para gestão de assinaturas do SaaS.
- Pagamentos via Pix Copia e Cola / QR Code dinâmico e Cartão de Crédito.
- Webhooks automatizados para sincronização instantânea de status (`ACTIVE`, `INCOMPLETE`, `PAST_DUE`, `TRIALING`).

### 🎨 Personalização Visual e Temas
- **Paleta Neutra & Elegante**: Tons marfim suave (`#FAF8F5`), bege dourado champagne (`#E6D4B0`) e superfícies limpas com alto contraste.
- **Modo Escuro Completo**: Tema refinado em grafite neutro com detalhes em bege `#E6D4B0`.
- Simulador de celular em tempo real para testar como o cliente final verá a página de agendamento e as instruções de pagamento.

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) (Node.js & TypeScript)
- **Banco de Dados & ORM**: [Prisma ORM](https://www.prisma.io/) com **PostgreSQL**
- **Autenticação**: Passport.js, JWT (Access Token 15m + Refresh Token 7d) e criptografia Argon2
- **Segurança**: Guards globais (`JwtAuthGuard`, `RolesGuard`, `PlanFeatureGuard`)
- **Documentação de API**: Swagger / OpenAPI integrada em `/api/docs`
- **Gateways**: Asaas SDK v3 (Assinaturas SaaS) e Mercado Pago SDK (Pagamento de clientes)

### Frontend
- **Framework**: [React 19](https://react.dev/) com [Vite](https://vitejs.dev/) e TypeScript
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gerenciamento de Estado**: Zustand
- **Roteamento**: React Router DOM v7
- **Manipulação de Datas**: date-fns

---

## 📁 Estrutura do Projeto

```text
saas-agendamento/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Modelagem do banco de dados PostgreSQL
│   │   └── seed.ts                  # Seed oficial dos planos (Básico, Profissional, Premium) e Admin
│   ├── src/
│   │   ├── common/
│   │   │   ├── config/              # plans.config.ts (Matriz definitiva de limites e permissões)
│   │   │   ├── decorators/          # @RequireFeature, @Public, @Roles
│   │   │   ├── guards/              # PlanFeatureGuard, JwtAuthGuard, RolesGuard
│   │   │   └── interceptors/        # TenantInterceptor
│   │   ├── modules/
│   │   │   ├── appointments/        # Agendamentos e trava de limite mensal
│   │   │   ├── auth/                # Registro com seleção de plano e login
│   │   │   ├── companies/           # Personalização e regras de sinal/Pix
│   │   │   ├── mercadopago/         # OAuth e pagamentos protegidos por plano
│   │   │   ├── products/            # Gestão de estoque protegida por plano
│   │   │   ├── professionals/       # Trava estrita de limite de profissionais
│   │   │   ├── subscriptions/       # Checkout Asaas e consulta de recursos
│   │   │   └── whatsapp/            # Socket Baileys e envio de mensagens
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── layouts/                 # DashboardLayout com navegação dinâmica por plano
│   │   ├── pages/
│   │   │   ├── auth/                # RegisterCompanyPage (Seleção dos 3 planos) e Login
│   │   │   ├── appointments/        # Listagem e gestão de agendamentos
│   │   │   ├── products/            # Estoque com banner de upgrade
│   │   │   ├── settings/            # Personalização, sinal Pix e Mercado Pago
│   │   │   └── subscription/        # Gestão de assinatura Asaas e tabela de planos
│   │   └── services/api.ts          # Cliente Axios configurado
│   └── package.json
└── README.md
```

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js 20+ instalado
- PostgreSQL ativo localmente ou via [Neon Serverless](https://neon.tech)
- Git

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencha a DATABASE_URL no .env

# Sincronizar o banco de dados
npx prisma db push

# Popular os 3 planos e o usuário Super Admin
npx prisma db seed

# Iniciar em modo desenvolvimento
npm run start:dev
```
- API Base: `http://localhost:3000/api`
- Documentação Swagger: `http://localhost:3000/api/docs`

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor Vite
npm run dev
```
- Interface SPA: `http://localhost:5173`

---

## 🔐 Acesso Super Admin Inicial

Após executar o seed do banco de dados (`npx prisma db seed`), utilize as credenciais administrativas para gerenciar o SaaS:

- **E-mail**: `rgcarmo545@gmail.com`
- **Senha**: `99622_Rp`

---

## 🧪 Testes Automatizados

O sistema conta com validações automatizadas de ponta a ponta para conferência de limites:
* Verificação dos 3 planos canônicos no banco (`basic`, `professional`, `premium`).
* Bloqueio do 2º profissional no plano Básico.
* Bloqueio do acesso a estoque (`/products`) no plano Básico.
* Bloqueio de conexão Mercado Pago e sinal Pix no plano Básico.
* Criação de até 5 profissionais no plano Profissional e bloqueio do 6º.
* Acesso a até 15 profissionais e agendamentos ilimitados no plano Premium.

---

## 📄 Licença

Este projeto é de propriedade privada e desenvolvido para operação comercial como Software as a Service (SaaS). Todos os direitos reservados.
