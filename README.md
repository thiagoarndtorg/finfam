# Capa

**Título do Projeto:** Gestão Financeira Inteligente com Open Finance  
**Nome do Estudante:** Thiago Cirne Arndt  
**Professor Responsável:** Diogo Winck  
**Curso:** Engenharia de Software – PUC-SC  
**Data de Entrega:** 28/11/2025  

---

# Resumo

Este documento apresenta o projeto "Gestão Financeira Inteligente com Open Finance", uma ferramenta de software para gestão financeira pessoal e familiar.  
O sistema permite registro e login com JWT, conexão de contas bancárias via PluggyAI e armazenamento dos dados em banco SQL (MySQL).  
Usuários podem criar famílias, convidar membros e visualizar dashboards agregados, com categorização **manual** de transações baseada em categorias definidas por administradores.  
Inclui RBAC com papéis de administrador e visualizador.  
A aplicação é dockerizada e está preparada para deploy em cloud (por exemplo, AWS), com CI/CD e SonarQube para observabilidade.

---

# 1. Introdução

## Contexto

Com o avanço do Open Finance no Brasil, os dados financeiros estão mais acessíveis, mas ainda falta uma ferramenta simples e integrada que ajude as pessoas a organizar despesas, entender hábitos de consumo e colaborar com membros da família de forma segura e eficiente.

Além disso, no ambiente familiar, é fundamental garantir que os dados financeiros sejam compartilhados apenas com membros autorizados, preservando a confidencialidade e a integridade das informações.

## Justificativa

O projeto é relevante para a Engenharia de Software por explorar:

- Integração com APIs modernas (Open Finance via PluggyAI).  
- Implementação de RBAC (papéis administrador e visualizador).  
- Gestão multiusuário em contexto familiar (múltiplas famílias, múltiplos membros).  
- Boas práticas de arquitetura backend (Spring Boot) e frontend (NextJS), com foco em escalabilidade, segurança e observabilidade.

A solução atende a necessidades reais de gestão financeira colaborativa com impacto social e econômico.

## Objetivos

### Principal

Desenvolver um software que integre contas bancárias via Open Finance, permita categorização de despesas e gere relatórios/dashboards visuais para famílias.

### Secundários

- Implementar sistema RBAC.  
- Suportar múltiplos usuários pertencendo a múltiplas famílias.  
- Criar funcionalidades de gestão de famílias (convites, permissões, papéis).  
- Permitir categorização **manual** de transações com categorias definidas por família.

---

# 2. Descrição do Projeto

## Tema do Projeto

Aplicação web que utiliza Open Finance para conectar e agregar contas bancárias familiares, permitindo categorização manual de transações, dashboards financeiros e colaboração entre membros com permissões distintas por papel (administrador e visualizador).

## Problemas a Resolver

- Dificuldade em consolidar informações de múltiplas contas bancárias de uma família em um só lugar.  
- Falta de ferramentas colaborativas seguras para gestão financeira familiar.  
- Categorização de despesas pouco estruturada e difícil de analisar sem um sistema de categorias consistente.

## Limitações

- O sistema não cobre investimentos ou planejamento financeiro complexo.  
- Depende dos bancos suportados pelo Open Finance e conectores do Pluggy.  
- A categorização é manual (não há módulo de machine learning na implementação atual).

---

# 3. Especificação Técnica

## 3.1. Requisitos de Software

### Funcionais (RF)

- **RF01:** Registrar novos usuários com email e senha.  
- **RF02:** Login com email e senha, gerando token JWT.  
- **RF03:** Conectar contas bancárias via PluggyAI.  
- **RF04:** Extrair e armazenar transações bancárias periodicamente.  
- **RF05:** Criar famílias.  
- **RF06:** Administradores convidam usuários para famílias via email.  
- **RF07:** Usuários aceitam convites para ingressar em famílias.  
- **RF08:** Usuários podem pertencer a múltiplas famílias.  
- **RF09:** Administradores definem categorias de despesas/receitas da família.  
- **RF10:** Usuários realizam categorização manual de transações.  
- **RF11:** O sistema fornece dashboards familiares com transações agregadas (income/expense).  
- **RF12:** O sistema gera gráficos interativos de despesas por categoria, período ou conta.  
- **RF13:** O sistema lista extratos com filtros e buscas.  
- **RF14:** Implementar RBAC (papéis administrador e visualizador).  
- **RF15:** Administradores gerenciam membros, papéis e categorias.  
- **RF16:** Usuários com papel visualizador acessam dashboards e categorizam apenas suas próprias transações.

### Não-Funcionais (RNF)

- **RNF01:** Gráficos devem carregar em até 7 segundos com 100 transações (alvo inicial de performance).  
- **RNF02:** Autenticação segura com JWT e senhas criptografadas.  
- **RNF03:** Interface responsiva (desktop e mobile).  
- **RNF04:** Dados estruturados armazenados em MySQL.  
- **RNF05:** Privacidade garantida entre famílias (usuários não veem dados de outras famílias).

---

# 3.2. Diagrama de Casos de Uso (UML)

![Picture1](https://github.com/user-attachments/assets/27fbdbbf-0fc5-410f-b092-843961a7110d)

---

# 3.3. Fluxograma de Atividade

<img width="649" height="445" alt="fluxatv" src="https://github.com/user-attachments/assets/491f46d6-a43e-4840-a2b6-6d4f2a5495ab" />

---

# 3.4. Considerações de Design

### Escolhas de Design

- **Frontend:** NextJS (SSR para SEO e boa performance).  
- **Backend:** Spring Boot (robusto, escalável, APIs REST).  
- **Banco de Dados:** MySQL (usuários, famílias, contas, transações, categorias, orçamentos, notificações).  
- **Integração bancária:** PluggyAI SDK para conexão com instituições financeiras.  
- **Observabilidade:** OpenTelemetry + Prometheus/Grafana + SonarQube.

---

# 3.5. Visão Inicial da Arquitetura

- **Frontend:**  
  - NextJS (React) consumindo APIs REST do backend.  
  - Autenticação via JWT (token armazenado no cliente).  

- **Backend:**  
  - Spring Boot com módulos de autenticação, gestão de famílias, categorias, transações, orçamentos e integração com Pluggy.  
  - RBAC implementado em cima de roles e relação usuário–família.

- **Banco de Dados:**  
  - MySQL armazenando dados relacionais de usuários, famílias, membros, contas, transações, categorias, orçamentos e notificações.

- **Integrações:**  
  - PluggyAI para Open Finance.  
  - Serviço de email (SMTP) para envio de convites e notificações.

---

# 3.6. Modelos C4

## Diagrama do Modelo C4 – Contexto

<img width="508" height="675" alt="c4context" src="https://github.com/user-attachments/assets/1aa49e7b-9551-4606-abc5-58790c661dab" />

*(O diagrama permanece válido, apenas interpretando “Banco de Dados” como MySQL em vez de múltiplos bancos.)*

---

# 3.7. Stack Tecnológica

- **Linguagens:**  
  - JavaScript/TypeScript (frontend).  
  - Java (backend).

- **Frameworks e Bibliotecas:**  
  - NextJS, React.  
  - Spring Boot, Spring Security, JPA/Hibernate.  
  - Pluggy SDK (integração Open Finance).  
  - Chart.js/Recharts (gráficos).  

- **Banco de Dados:**  
  - MySQL.

- **Ferramentas e Infraestrutura:**  
  - Docker e docker-compose.  
  - AWS (EC2, RDS, S3) para deploy futuro.  
  - GitHub Actions (CI/CD).  
  - SonarQube (qualidade de código).  
  - Jira, GitHub, Confluence (gestão e documentação).

---

# 3.8. Considerações de Segurança

- Autenticação com JWT e senhas armazenadas de forma segura (hash).  
- Criptografia de dados sensíveis em trânsito (HTTPS).  
- RBAC por família (admin vs visualizador).  
- Proteções contra SQL Injection, XSS e CSRF.  
- Isolamento lógico entre famílias: um usuário só acessa dados das famílias às quais pertence.

---

# 4. Próximos Passos

### Portfólio I

Prototipagem da interface + backend básico (maio–julho 2025).

### Portfólio II

Refinamento de funcionalidades, melhorias de observabilidade e deploy em AWS (julho–novembro 2025).

### Cronograma SCRUM

- Maio: requisitos e design (Sprint 1).  
- Junho: frontend + backend básico (Sprints 2 e 3).  
- Julho: integração Open Finance + testes (Sprint 4).  
- Outubro: deploy final e ajustes (Sprint 5).

---

# 5. Referências

- `https://docs.pluggy.ai`  
- `https://nextjs.org/docs`  
- `https://dev.mysql.com/doc`  
- `https://spring.io/projects/spring-boot`  
- `https://www.chartjs.org`  
- `https://docs.github.com/en/actions`  
- `https://aws.amazon.com/documentation`  
- `https://openfinancebrasil.org.br`

---

# 6. Avaliações de Professores

- Considerações: _____________________________________________  
- Considerações: _____________________________________________  
- Considerações: _____________________________________________
