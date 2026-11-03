# UBS Riacho Estado — Sistema de Gestão de Pacientes

Sistema de apoio ao trabalho dos Agentes Comunitários de Saúde (ACS) de uma Unidade Básica de Saúde (UBS) do SUS: cadastro de pacientes, agenda e registro de visitas domiciliares, gestão de usuários e relatórios gerenciais.

Projeto desenvolvido como entrega freelance real para a UBS Riacho Estado, e também como peça de portfólio.

## Tecnologias

**Backend:** Node.js, Express 5, TypeScript, Elasticsearch, JWT (autenticação), bcrypt (hash de senha).

**Frontend:** Angular 21 (standalone components, signals, control flow `@if`/`@for`), TypeScript, SCSS.

## Estrutura do repositório

- `/` — backend (API REST)
- `/ubs-frontend` — frontend (Angular)

## Funcionalidades

- Autenticação por perfil (admin / profissional de saúde)
- Cadastro, edição e listagem de pacientes — prioridade, condições crônicas, status ativo/inativo e alerta de visita atrasada
- Agenda de visitas (calendário mensal), com visitas previstas e já registradas
- Registro de visita com dados clínicos (pressão arterial, peso, glicemia, necessidade de encaminhamento)
- Tela "Quem precisa ser visitado" — pacientes ativos ainda sem visita prevista
- Tela "Usuários" (admin) — gestão de pacientes e profissionais, com permissões de admin/ativo
- Dashboard com indicadores do dia e relatório mensal (visitas por resultado, ranking por ACS, condições crônicas atendidas, novos pacientes)
- Controle de acesso por perfil, reforçado também no backend (não só escondido na tela)
- Totalmente responsivo (desktop e mobile)

## Pré-requisitos

- Node.js 22+
- Elasticsearch rodando localmente em `http://localhost:9200`, com segurança desabilitada (ambiente de desenvolvimento)

Exemplo de como subir um Elasticsearch local via Docker, caso não tenha um rodando:

```bash
docker run -d --name elasticsearch -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.15.0
```

## Rodando o backend

```bash
npm install
cp .env.example .env
# edite o .env e defina um JWT_SECRET (string aleatória longa — ex: openssl rand -hex 32)
npm run dev
```

O servidor sobe em `http://localhost:3000`. Na primeira execução, os índices necessários são criados automaticamente no Elasticsearch.

### Variáveis de ambiente

| Variável     | Descrição                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `JWT_SECRET` | Chave usada para assinar e validar os tokens de autenticação. Obrigatória — o servidor não inicia sem ela. |

## Rodando o frontend

```bash
cd ubs-frontend
npm install
npm start
```

A aplicação sobe em `http://localhost:4200` e já está configurada para falar com o backend em `http://localhost:3000`.

## Status do projeto

O histórico de decisões e o que falta implementar estão documentados em `BACKLOG.md`.
