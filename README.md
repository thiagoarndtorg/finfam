# Capa

**Título do Projeto:** Gestão Financeira Inteligente com Open Finance\
**Nome do Estudante:** Thiago Cirne Arndt\
**Professor Responsável:** Diogo Winck\
**Curso:** Engenharia de Software -- PUC-SC\
**Data de Entrega:** 28/11/2025

------------------------------------------------------------------------

# Resumo

Este documento apresenta o projeto "Gestão Financeira Inteligente com
Open Finance", uma ferramenta de software para gestão financeira pessoal
e familiar. O sistema permite registro e login com JWT, conexão de
contas bancárias via PluggyAI, e armazenamento em bancos SQL
(PostgreSQL) e NoSQL (MongoDB) para escalabilidade.\
Usuários podem criar famílias, convidar membros e visualizar dashboards
agregados, com categorização manual ou automática via machine learning.\
Inclui RBAC com papéis de administrador e visualizador.\
A aplicação será dockerizada e hospedada na AWS, com CI/CD e SonarQube
para observabilidade.

------------------------------------------------------------------------

# 1. Introdução

## Contexto

Com o avanço do Open Finance no Brasil, os dados financeiros estão mais
acessíveis, mas ainda falta uma ferramenta simples e integrada que ajude
as pessoas a organizar despesas, entender hábitos de consumo e colaborar
com membros da família de forma segura e eficiente.

Além disso, no ambiente familiar, é fundamental garantir que os dados
financeiros sejam compartilhados apenas com membros autorizados,
preservando a confidencialidade e a integridade das informações.

## Justificativa

O projeto é relevante para a Engenharia de Software por explorar
integração com APIs modernas, machine learning, RBAC e gestão
multiusuário.\
O RBAC garante diferentes níveis de permissão (administrador e
visualizador), fornecendo segurança granular dentro da família.\
A solução atende a necessidades reais de gestão financeira colaborativa
com impacto social e econômico.

## Objetivos

### Principal

Desenvolver um software que integre contas bancárias via Open Finance,
categorize despesas e gere relatórios visuais.

### Secundários

-   Implementar sistema RBAC\
-   Suportar múltiplos usuários\
-   Criar funcionalidades de gestão de famílias (convites, permissões,
    papéis)\
-   Desenvolver categorização automática via ML

------------------------------------------------------------------------

# 2. Descrição do Projeto

## Tema do Projeto

Aplicação web que utiliza Open Finance para conectar e agregar contas
bancárias familiares, permitindo categorização manual ou automática,
dashboards e colaboração com permissões distintas por papel (admin e
visualizador).

## Problemas a Resolver

-   Dificuldade em consolidar informações de múltiplas contas
    familiares.\
-   Falta de ferramentas colaborativas seguras.\
-   Categorização manual é lenta → necessidade de automação inteligente.

## Limitações

-   O sistema não cobre investimentos ou planejamento financeiro
    complexo.\
-   Depende dos bancos suportados pelo Open Finance e conectores do
    Pluggy.\
-   Categorização via ML pode ser limitada com pouco volume de dados
    etiquetados.

------------------------------------------------------------------------

# 3. Especificação Técnica

## 3.1. Requisitos de Software

### Funcionais (RF)

-   RF01: Registrar novos usuários com email e senha.\
-   RF02: Login com email e senha → gerar token JWT.\
-   RF03: Conectar contas bancárias via PluggyAI.\
-   RF04: Extrair e armazenar transações periodicamente.\
-   RF05: Criar famílias.\
-   RF06: Administradores convidam usuários via email.\
-   RF07: Usuários aceitam convites.\
-   RF08: Usuários podem pertencer a múltiplas famílias.\
-   RF09: Admin define categorias de despesas.\
-   RF10: Categorização manual.\
-   RF11: Sugestão automática via ML.\
-   RF12: Dashboards familiares agregados.\
-   RF13: Gráficos interativos por categoria, período ou conta.\
-   RF14: Extratos filtráveis.\
-   RF15: Implementar RBAC (admin/visualizador).\
-   RF16: Administradores gerenciam membros e papéis.\
-   RF17: Visualizador categoriza apenas suas próprias transações.

### Não-Funcionais (RNF)

-   RNF01: Gráficos carregam em até 7s com 100 transações.\
-   RNF02: Autenticação segura com JWT + criptografia.\
-   RNF03: Interface responsiva.\
-   RNF04: PostgreSQL para dados estruturados; MongoDB para categorias.\
-   RNF05: Privacidade garantida entre famílias.

------------------------------------------------------------------------

# Diagrama de Casos de Uso (UML)

![Picture1](https://github.com/user-attachments/assets/27fbdbbf-0fc5-410f-b092-843961a7110d)


------------------------------------------------------------------------

# 3.2. Fluxograma de Atividade

<img width="649" height="445" alt="fluxatv" src="https://github.com/user-attachments/assets/491f46d6-a43e-4840-a2b6-6d4f2a5495ab" />


------------------------------------------------------------------------

# 3.3. Considerações de Design

### Escolhas de Design

-   Frontend: NextJS (SSR para SEO).\
-   Backend: Spring Boot (robusto, escalável).\
-   Banco SQL: PostgreSQL (usuários, famílias).\
-   Banco NoSQL: MongoDB (categorias).\
-   Machine Learning: microserviço Python opcional.

------------------------------------------------------------------------

# Visão Inicial da Arquitetura

-   Frontend em NextJS\
-   Backend em Spring Boot\
-   PostgreSQL + MongoDB\
-   PluggyAI SDK\
-   Serviço externo Python para categorização automática

------------------------------------------------------------------------

# Modelos C4

## Diagrama do Modelo C4 -- Contexto

<img width="508" height="675" alt="c4context" src="https://github.com/user-attachments/assets/1aa49e7b-9551-4606-abc5-58790c661dab" />


------------------------------------------------------------------------

# 3.4. Stack Tecnológica

-   Linguagens: JS/TS, Java, Python\
-   Frameworks: NextJS, Spring Boot, Spring Security, JPA/Hibernate,
    scikit-learn/TensorFlow\
-   Bancos: PostgreSQL e MongoDB\
-   Ferramentas: Docker, AWS EC2/RDS/S3, GitHub Actions, SonarQube,
    Jira, GitHub, Confluence

------------------------------------------------------------------------

# 3.5. Considerações de Segurança

-   Autenticação com JWT\
-   Criptografia AES-256\
-   RBAC por família\
-   Proteções contra SQL Injection, XSS, CSRF\
-   Privacidade total entre famílias

------------------------------------------------------------------------

# 4. Próximos Passos

### Portfólio I

Prototipagem da interface + backend básico (maio--julho 2025)

### Portfólio II

Implementação da IA + deploy AWS (julho--novembro 2025)

### Cronograma SCRUM

-   Maio: requisitos e design (Sprint 1)\
-   Junho: frontend + backend básico (Sprints 2 e 3)\
-   Julho: integração Open Finance + ML + testes (Sprint 4)\
-   Outubro: deploy final (Sprint 5)

------------------------------------------------------------------------

# 5. Referências

-   https://docs.pluggy.ai\
-   https://nextjs.org/docs\
-   https://www.mongodb.com/docs\
-   https://spring.io/projects/spring-boot\
-   https://www.chartjs.org\
-   https://docs.github.com/en/actions\
-   https://aws.amazon.com/documentation\
-   https://openfinancebrasil.org.br

------------------------------------------------------------------------

# 6. Avaliações de Professores

-   Considerações:
    \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\
-   Considerações:
    \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\
-   Considerações:
    \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
