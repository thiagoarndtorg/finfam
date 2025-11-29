# Capa

**Título do Projeto:** Gestão Financeira Inteligente com Open Finance  
**Nome do Estudante:** Thiago Cirne Arndt  
**Curso:** Engenharia de Software  
**Data de Entrega:** 28/11/2025 

---

# Resumo

Este documento apresenta o projeto "Gestão Financeira Inteligente com Open Finance", uma ferramenta de software para gestão financeira pessoal e familiar. O sistema permite registro e login com JWT, conexão de contas bancárias via PluggyAI, e armazenamento em banco de dados MySQL. Usuários podem criar famílias, convidar membros e visualizar dashboards agregados, com categorização manual de transações baseada em categorias definidas por administradores. Inclui RBAC, com papéis de administrador (gerenciamento total) e visualizador (acesso limitado). A aplicação é dockerizada e hospedada na AWS, com CI/CD e SonarQube para observabilidade.

---

# 1. Introdução

## Contexto

- Com o avanço do Open Finance no Brasil, os dados financeiros estão mais acessíveis, mas ainda falta uma ferramenta simples e integrada que ajude as pessoas a organizar despesas, entender hábitos de consumo e colaborar com membros da família de forma segura e eficiente, especialmente em contextos de múltiplas contas e famílias.

## Justificativa

- O projeto é relevante para a Engenharia de Software por explorar integração com APIs modernas (Open Finance), implementar RBAC e gerenciar dados de múltiplos usuários em contextos familiares, com foco em escalabilidade e privacidade.

- Ele atende a uma necessidade real de gestão financeira pessoal e familiar, com potencial de impacto social e econômico.

## Objetivos

- **Principal:** Desenvolver um software que integre contas bancárias via Open Finance, categorize despesas e gere relatórios visuais.

- **Secundários:**

  - Implementar um sistema de controle de acesso baseado em papéis (RBAC).

  - Adicionar suporte a múltiplos usuários (familiares).

  - Implementar funcionalidades de gestão de famílias, permitindo colaboração entre membros.

  - Fornecer sistema de categorização manual de transações com categorias customizáveis por família.

---

# 2. Descrição do Projeto

## Tema do Projeto

- Uma aplicação web para gestão financeira pessoal e familiar que utiliza Open Finance para conectar contas bancárias de múltiplos usuários, permitindo a agregação de transações em dashboards familiares. Os usuários podem categorizar suas despesas manualmente, com base nas categorias definidas pelos administradores das famílias. A aplicação inclui um sistema de controle de acesso baseado em papéis, garantindo que apenas administradores possam gerenciar membros e configurações da família, enquanto visualizadores podem apenas visualizar e categorizar suas próprias transações. A solução visa facilitar a colaboração segura na gestão financeira entre membros da família, proporcionando uma visão clara e interativa dos gastos e receitas.

## Problemas a Resolver

- Dificuldade em organizar e visualizar despesas de múltiplas contas bancárias de forma agregada para famílias.

- Falta de ferramentas que permitam colaboração segura na gestão financeira familiar.

- Necessidade de categorização eficiente de transações com categorias customizáveis por família.

## Limitações

- O sistema não cobre investimentos ou planejamento financeiro complexo.

- Depende dos bancos suportados pelo Open Finance ou conectores diretos do Pluggy.

- A categorização é manual, exigindo que os usuários classifiquem suas transações.

---

# 3. Especificação Técnica

## 3.1. Requisitos de Software

### Lista de Requisitos

**Funcionais (RF):**

- RF01: O sistema deve permitir registro de novos usuários com email e senha.  

- RF02: O sistema deve permitir login com email e senha, retornando um token JWT.  

- RF03: O sistema deve conectar contas bancárias via Open Finance usando PluggyAI.  

- RF04: O sistema deve extrair e armazenar transações bancárias periodicamente.  

- RF05: O sistema deve permitir criar famílias.  

- RF06: Administradores devem convidar usuários para famílias via email.  

- RF07: Usuários devem aceitar convites para ingressar em famílias.  

- RF08: Usuários podem pertencer a múltiplas famílias.  

- RF09: Administradores devem definir categorias de despesas para a família.  

- RF10: Usuários devem categorizar transações manualmente.  

- RF11: O sistema deve fornecer dashboards familiares com transações agregadas (income/expense).  

- RF12: O sistema deve gerar gráficos interativos de despesas por categoria, período ou conta.  

- RF13: O sistema deve listar extratos detalhados com filtros e buscas.  

- RF14: O sistema deve implementar RBAC com papéis administrador (gerenciamento total) e visualizador (acesso limitado).  

- RF15: Administradores devem gerenciar membros, papéis e categorias.  

- RF16: Visualizadores devem visualizar dashboards e categorizar apenas suas transações.

**Não-Funcionais (RNF):**

- RNF01: Gráficos devem carregar em até 3 segundos com 1000 transações.  

- RNF02: Autenticação segura com JWT e criptografia.  

- RNF03: Interface responsiva (desktop e mobile).  

- RNF04: Dados estruturados em MySQL para escalabilidade.  

- RNF05: Privacidade garantida entre famílias.

### Diagrama de Casos de Uso (UML)

**Atores:** Usuário Administrador, Usuário

**Casos de Uso:**

![image](https://github.com/user-attachments/assets/a99e8c92-1dd5-432c-863e-fbbd537a38ef)

## 3.2 Fluxograma de Atividade

![image](https://github.com/user-attachments/assets/d48a5703-5a15-4801-acde-bbefb0c9aca8)

## 3.3. Considerações de Design

**Escolhas de Design:**

- **Frontend:** NextJS (SSR para SEO e performance).  

- **Backend:** Spring Boot (APIs REST robustas).  

- **Bancos:** MySQL (dados estruturados).  

### Visão Inicial da Arquitetura

- **Arquitetura:**  

  - Frontend: NextJS (React).  

  - Backend: Spring Boot (APIs REST).  

  - Banco: MySQL (SQL).  

  - Integração: PluggyAI SDK.

- **Modelos C4:**  

  - **Contexto:** Usuários acessam o sistema via web, conectam bancos via PluggyAI, visualizam dashboards familiares.  

  - **Contêineres:** Frontend (NextJS), Backend (Spring Boot), Banco (MySQL).  

  - **Componentes:** Módulos de autenticação, integração bancária, gestão de famílias, categorização, dashboards.  

  - **Código:** Detalhamento em classes/interfaces no backend.

## 3.4. Stack Tecnológica

- **Linguagens:** JavaScript/TypeScript (frontend), Java (backend).  

- **Frameworks e Bibliotecas:** NextJS, Spring Boot, Spring Security, JPA/Hibernate, Pluggy SDK, Chart.js, Axios.  

- **Bancos de Dados:** MySQL.  

- **Ferramentas:** Docker, AWS (EC2, RDS, S3), GitHub Actions (CI/CD), SonarQube, Jira, GitHub, Confluence.

## 3.5. Considerações de Segurança

- **Autenticação:** JWT com validação em endpoints.  

- **Criptografia:** AES-256 para dados sensíveis.  

- **RBAC:** Isolamento de permissões por família (administrador vs. visualizador).  

- **Mitigação:** Proteção contra SQL Injection, XSS, CSRF.  

- **Privacidade:** Dados de uma família não acessíveis por outra.

---

# 4. Próximos Passos

- **Portfólio I:** Prototipagem da interface e backend básico (Maio-Julho 2025).

- **Portfólio II:** Melhorias e deploy na AWS (Julho-Novembro 2025).

**Cronograma:**

- Maio: Requisitos e design.

- Junho: Frontend e backend básico.

- Julho: Testes e ajustes.

- Agosto: Deploy e ajustes finais.

---

# 5. Referências

- [Pluggy API Documentation](https://docs.pluggy.ai/)

- [NextJS Documentation](https://nextjs.org/docs)

- [MySQL Documentation](https://dev.mysql.com/doc/)

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

- [Chart.js](https://www.chartjs.org/)

- [GitHub Actions Documentation](https://docs.github.com/en/actions)

- [AWS Documentation](https://aws.amazon.com/documentation/)

- [Open Finance Brasil](https://openfinancebrasil.org.br/)

---

# 7. Avaliações de Professores

- **Considerações Professor/a:** ___________________________

- **Considerações Professor/a:** ___________________________

- **Considerações Professor/a:** ___________________________
