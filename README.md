# 📱 EnglishAdventure – Mobile App

O **EnglishAdventure – Mobile** é um aplicativo complementar ao jogo web do projeto **EnglishAdventure**, desenvolvido como **Trabalho de Conclusão de Curso (TCC)** do curso técnico em **Desenvolvimento de Sistemas – SENAI**.

Este aplicativo tem como principal função **supervisionar o desempenho do aluno**, exibindo dados de acertos, erros e progresso obtidos durante o uso do jogo web.

---

## 🎯 Objetivo do Aplicativo

O app mobile foi criado para:

* Acompanhar os **acertos e erros** dos alunos
* Verificar se o aluno está **evoluindo de nível** no jogo web
* Servir como ferramenta de **monitoramento e acompanhamento** do aprendizado

Ele funciona de forma integrada ao **backend e banco de dados** utilizados pelo jogo web.

---

## 📂 Estrutura do Projeto

O repositório mobile possui a seguinte estrutura:

```
ENGLISHADVENTUREMOBILE/
├── android/                # APK do aplicativo para instalação
├── backend/                # Backend (server.js, rotas e lógica de conexão)
├── database/               # Arquivos do banco de dados
├── EnglishAdventure/       # Aplicação Mobile (Expo / React Native)
│   ├── .expo/
│   ├── android/
│   ├── assets/
│   ├── node_modules/
│   ├── src/                # Código-fonte do app
│   ├── App.js
│   ├── app.json
│   ├── eas.json
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── routes.js           # Rotas e navegação
├── .gitignore
└── .gitattributes
```

---

## ⚠️ Atenção – Configuração de IP (Muito Importante)

Para que o aplicativo funcione corretamente, o **usuário testador** deve alterar o **IP local** antes de executar o projeto.

É obrigatório atualizar o IP nos seguintes locais:

* 📄 **server.js**
* 📄 **Páginas/Telas do aplicativo** que realizam requisições ao backend

➡️ Caso o IP não seja alterado corretamente, o aplicativo **não irá se conectar ao banco de dados**.

> 💡 Utilize o IP da máquina onde o servidor e o banco de dados estão rodando (ex: IP local da rede).

---

## 🗄️ Banco de Dados

O banco de dados do projeto está localizado na pasta:

```
/database
```

Certifique-se de:

* Importar o banco corretamente no **MySQL / phpMyAdmin**
* Manter o servidor ativo antes de iniciar o aplicativo

---

## 📥 Instalação do APK

1. Acesse a pasta:

   ```
   /android
   ```
2. Baixe o arquivo **APK**
3. Instale no dispositivo Android
4. Conceda as permissões necessárias

---


## 🎓 Contexto Acadêmico

Aplicativo desenvolvido como parte do **TCC do curso técnico em Desenvolvimento de Sistemas – SENAI**, atuando em conjunto com o jogo web para oferecer uma solução completa de ensino e acompanhamento do aprendizado de inglês.

---

## 🚀 Status do Projeto

🟢 **Finalizado (TCC concluído)**
