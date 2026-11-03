# Backlog — UBS

Lista de melhorias e pendências identificadas durante o desenvolvimento, pra tratar depois.

## Frontend

- [x] **Modal de "token expirado"**: quando o token JWT expira (requisição volta `401` do backend), mostrar um modal na tela avisando que a sessão expirou, em vez de só falhar a chamada silenciosamente. Depois de fechar o modal, redirecionar pro login (provavelmente dá pra tratar isso no `auth-interceptor`, que já intercepta as respostas).

## Tela de novo paciente (`patient-form`)

- [x] **Asterisco de obrigatório faltando em alguns campos**: revisar o form e garantir que todo campo com `Validators.required` tenha o `<span class="required">*</span>` no label (hoje só alguns têm).
- [x] **Telefone sem máscara**: campo `phoneNumber` aceita qualquer texto (ex: só 2 dígitos). Aplicar máscara tipo `(31) 98888-7777` enquanto digita, igual foi feito com o CPF.
- [x] **Erros de validação não aparecem na tela**: CNS inválido e telefone incompleto bloqueiam o botão de salvar (`[disabled]="form.invalid"`), mas não mostram nenhuma mensagem dizendo o que está errado — usuário fica sem saber por que não consegue salvar. Adicionar mensagem de erro abaixo de cada campo inválido (`form.get('campo')?.invalid && form.get('campo')?.touched`), igual já existe lógica parecida pro asterisco obrigatório.
- [x] **Data de nascimento aceita data futura**: `dateOfBirth` não tem validação de limite máximo; hoje dá pra cadastrar paciente com data de nascimento no futuro. Adicionar validator customizado (ou `max` no input `type="date"`) limitando à data de hoje.
- [x] **Campo ACS responsável restrito por perfil**: ACS comum não escolhe mais o responsável (ele sempre cadastra pra si mesmo, backend força isso); só admin vê o seletor e pode escolher qualquer ACS ou deixar em branco.

## Tela "Quem precisa ser visitado"

- [x] **Tela nova**: lista pacientes com `alertLevel` crítico/atrasado/em breve, ordenados por urgência, com ACS responsável resolvido pelo nome e link pra registrar visita.
- [x] **Redefinida como "quem não está agendado"**: agora mostra só pacientes ativos sem `nextVisitDue` (nunca visitados, não aparecem em nenhum dia da Agenda ainda) — quem já tem data futura calculada já está visível na Agenda, não precisa duplicar aqui. Ordenação mudou de "urgência de alerta" pra "prioridade do paciente, depois quem está esperando há mais tempo".

## Registro de visita (`visit-form`)

- [x] **Campos novos**: resultado da visita (realizada / paciente ausente / recusou), pressão arterial, peso, glicemia, necessidade de encaminhamento + pra onde. Campos clínicos só aparecem quando a visita foi realizada. Corrigido também: só atualiza a data de última visita do paciente quando a visita foi realmente "realizada" (ausência/recusa não reseta o alerta de atraso).
- [x] **Data da visita aceitava data futura**: mesmo fix do `patient-form` (validator + `max` no input).
- [x] **Restrição por perfil**: ACS comum só consegue registrar visita em paciente que é dele (backend bloqueia com 403 se tentar em outro); admin pode em qualquer paciente.

## Agenda de visitas (`visits-calendar`)

- [x] **Tela nova**: calendário mensal mostrando visitas previstas (nextVisitDue dos pacientes) e visitas já registradas, lado a lado por dia, com hora/minuto. Campo de registro de visita (`visit-form`) passou a pedir data e hora (`datetime-local`) em vez de só data.
- [x] **Dias fora do mês**: calendário mostra só os dias reais do mês (sem números de dias do mês vizinho); dias antes de hoje ficam em cinza.

## Tabelas (Pacientes / Quem precisa ser visitado)

- [x] **Paginação**: tabelas paginam de 5 em 5, com botões Primeira/Anterior/Próxima/Última.
- [x] **Scroll indesejado**: tabelas estavam empurrando o conteúdo da página e gerando scroll interno; resolvido reduzindo o tamanho da página de 10 para 5 itens.
- [x] **Componente de paginação reutilizável** (`app-pagination`): extraído pra componente compartilhado, com número da página editável direto no texto "Página X de Y" (substituiu a caixa separada de "ir para página").
- [x] **Filtros**: Pacientes ganhou busca por nome, prioridade, alerta e ativo/inativo; Quem precisa ser visitado ganhou busca por nome e ACS responsável (filtro de alerta foi removido dessa tela, já que agora todo mundo que aparece ali é sempre "Crítico"). Estilo dos filtros revisado (cartão com sombra, ícone de busca, setinha customizada nos selects).
- [x] **Página "Pacientes" renomeada**: "Pacientes" (admin) / "Meus pacientes" (profissional comum), tanto no menu quanto no título da página.

## Relatórios mensais

- [x] **Unificado com o Dashboard** (não é mais uma tela separada): visitas por resultado + taxa de sucesso, ranking de visitas por ACS (só visível pra admin), atendimentos por condição crônica, novos pacientes no mês — tudo com seletor de mês (setas + "Mês atual", em português).

## Menu

- [x] **Reordenado**: Agenda (primeiro) → Quem precisa ser visitado → Pacientes/Meus pacientes → Dashboard (último) → Sair.

## Permissões por perfil (admin x profissional)

- [x] **Controle de acesso por ACS**: token JWT carrega `role` ("admin" ou "professional"). Profissional comum só vê/lista pacientes, visitas, dashboard e relatório dos pacientes em que é o ACS responsável; admin vê tudo sem filtro. Cadastro de paciente e registro de visita bloqueados no backend pra impedir acesso a dado de outro ACS mesmo via chamada direta na API (não só escondido na tela).
- [x] **Promover alguém a admin**: agora dá pra fazer direto pela tela de editar profissional (toggle "Acesso de administrador"), sem precisar mais editar o Elasticsearch na mão.

## Usuários (pacientes e profissionais) — ex "Módulo de Configurações"

- [x] **Tela renomeada de "Configurações" pra "Usuários"**: agora com duas abas, "Pacientes" e "Profissionais", cada uma com sua própria busca por nome e paginação (5 por página, reaproveitando o `app-pagination`). Acesso restrito a admin.
- [x] **Criar perfil novo direto pela tela**: aba Profissionais ganhou botão "+ Novo profissional" (nova tela `professional-form`, nome/CPF/endereço/telefone/email/senha); aba Pacientes reaproveita a tela de novo paciente já existente.
- [x] **Editar perfil existente**: paciente e profissional agora têm tela de edição (`patient-form` e `professional-form` ganharam modo de edição, reaproveitando os mesmos formulários da criação). Admin edita qualquer paciente ou profissional pela tela de Usuários; o próprio profissional pode editar nome/CPF/endereço/telefone/email dele mesmo (só não pode trocar o próprio perfil de admin/ativo, pra não se trancar fora sem querer).
- [x] **ACS também edita os próprios pacientes fora do Usuários**: botão "Editar" adicionado também em "Meus pacientes"/"Pacientes", restrito pelo backend a quem é o ACS responsável (ou admin).
- [x] **Promover/ativar vira toggle na tela de editar profissional**: os botões "Tornar admin"/"Desativar" saíram da tabela de Usuários e viraram dois switches (com texto explicando o que cada um faz) na tela de editar, logo acima de "Salvar alterações". Admin não vê os próprios toggles (só pode mudar isso de outra conta).
- [x] **Menu simplificado pro admin**: aba "Pacientes" some do menu pra admin (ele já gerencia pacientes dentro de "Usuários"); continua aparecendo como "Meus pacientes" pra profissional comum.

## Responsividade mobile

- [x] **Menu hambúguer no mobile**: nav vira um menu dropdown com ícone de hambúguer que anima pra "X", fecha ao clicar fora (backdrop).
- [x] **Tabelas viram lista de cartões no mobile**: padrão global reutilizável (`data-label` + CSS em `styles.scss`), aplicado nas 5 tabelas do site (Pacientes, Usuários, Quem precisa ser visitado, Dashboard). Refinado depois pra cartões de verdade: fundo branco, sombra, nome em destaque como título do cartão e ações viram botões no rodapé.
- [x] **Agenda (calendário) redesenhada pro mobile**: vira lista vertical por dia (em vez da grade de 7 colunas), com abreviação do dia da semana; dias sem visita ficam escondidos pra lista não ficar longa demais.
- [x] **Ajustes finos**: filtros, paginação e tela de login revisados pra telas pequenas.

## Subir pro GitHub

- [x] **Repositório criado e código publicado**: monorepo privado em `github.com/Pedrogvd/ubs-riacho-estado`, backend e frontend juntos.
- [x] **README.md**: tecnologias, estrutura, funcionalidades, pré-requisitos e como rodar backend e frontend.
- [x] **Segurança antes de subir**: `JWT_SECRET` tirado do código (estava fixo) e movido pro `.env` (fora do Git, via `.gitignore`), com `.env.example` documentando a variável. Servidor agora falha alto se a variável não existir, em vez de usar uma chave fraca escondida.
- [x] **Backend passou de `ts-node` pra `tsx`**: o `ts-node` não é compatível com o TypeScript 7 (compilador nativo novo); `npm run dev` agora usa `tsx watch`, com reinício automático ao salvar.

## Deploy

- [x] **Backend no Render**: migrado de Elasticsearch pra OpenSearch (`@opensearch-project/opensearch`, compatível com o Bonsai), porta dinâmica (`process.env.PORT`), variáveis de ambiente (`JWT_SECRET`, `ES_URL`) configuradas no painel do Render. Publicado e funcionando em `https://ubs-riacho-estado.onrender.com` (plano gratuito, idle após inatividade).
- [x] **Banco (Bonsai)**: cluster gratuito "Test Cluster" criado; primeiro usuário admin promovido via Console do Bonsai.
- [x] **Bug do limite de requisições concorrentes do Bonsai**: dashboard e relatório mensal disparavam buscas em paralelo (`Promise.all`) e estouravam o limite do plano gratuito (erro 500 "Concurrent request limit exceeded"); corrigido rodando as buscas em sequência.
- [x] **Frontend preparado**: `environment.ts`/`environment.production.ts` + `fileReplacements` no `angular.json`; os 6 serviços Angular passaram a usar `environment.apiUrl` em vez de `localhost:3000` fixo.
- [x] **CORS do backend**: restrito a `localhost:4200` (dev) e `https://ubs-riacho-estado.pages.dev` (produção).
- [x] **`_redirects` pro Cloudflare Pages**: criado em `ubs-frontend/public/_redirects` (`/* /index.html 200`) pra rotas do Angular funcionarem no refresh.
- [x] **SSR removido do build de produção**: `angular.json` estava configurado pra gerar build com servidor (SSR), o que não gerava um `index.html` normal — causava 404 no Cloudflare Pages. Removidas as opções `server`/`outputMode`/`ssr`, voltando pra build puramente estático (SPA).
- [x] **Cloudflare Pages**: conta criada, projeto conectado ao GitHub (`Pedrogvd/ubs-riacho-estado`), root directory `ubs-frontend`, build output `dist/ubs-frontend/browser`, publicado em `https://ubs-riacho-estado.pages.dev`.
- [x] **Teste fim a fim em produção**: login e dashboard confirmados funcionando com o frontend publicado (Cloudflare Pages) conversando com o backend publicado (Render).

## Ideias futuras (melhorias, sem prioridade definida)

- [ ] **Módulo de Rotas**: rebaixado de "próximo passo" pra "melhoria futura" — fica pra depois do essencial (GitHub, mobile, deploy).
