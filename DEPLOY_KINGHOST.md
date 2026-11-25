# Guia de Publicacao na KingHost + Firebase de Producao (Opcao 1)

Com esta configuracao:
- **Aqui no AI Studio** voce continua desenvolvendo e testando novidades no banco de testes sem risco.
- **Na KingHost** ficam os arquivos do jogo no seu dominio oficial.
- **No seu Firebase de Producao** ficam salvos todos os jogadores reais, contas, Digimons, guildas, rankings, chats e multiplayer online — 100% separados do ambiente de testes.

---

## Parte 1 — Criar seu Firebase de Producao (fazer apenas 1 vez)

1. Acesse **https://console.firebase.google.com/** com sua conta Google.
2. Clique em **Adicionar projeto** (ex: `digimon-world-producao`) e finalize a criacao.
3. **Ativar Login (Authentication):**
   - No menu esquerdo, clique em **Criacao > Authentication > Vamos comecar**.
   - Em **Metodo de login (Sign-in method)**, ative **E-mail/senha** e salve.
   - Ainda em Authentication, va em **Configuracoes > Dominios autorizados** e clique em **Adicionar dominio**.
   - Adicione o seu dominio oficial (ex: `seusite.com.br` e `www.seusite.com.br`).
4. **Criar Banco de Dados (Firestore):**
   - No menu esquerdo, clique em **Criacao > Firestore Database > Criar banco de dados**.
   - Escolha a localizacao **`southamerica-east1` (Sao Paulo)** para menor latencia no Brasil.
   - Selecione **Iniciar no modo de producao** e crie o banco (ele nasce com o ID `(default)`).
5. **Publicar as Regras de Seguranca (`firestore.rules`):**
   - Dentro do Firestore Database, abra a aba **Regras (Rules)**.
   - Copie TODO o conteudo do arquivo `firestore.rules` deste projeto e cole la.
   - Revise as regras (inclusive a lista de e-mails de GM em `isBootstrappedGm()`, se quiser adicionar/remover algum GM) e clique em **Publicar**.
6. **Pegar as chaves do App Web:**
   - Clique na engrenagem (topo esquerdo) > **Configuracoes do projeto**.
   - Role ate **Seus apps**, clique no icone **Web (`</>`)**, de um nome (ex: `Digimon Web`) e clique em **Registrar app**.
   - Copie os 6 valores de `firebaseConfig`: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` e `appId`.

---

## Parte 2 — Gerar o Build de Producao (no seu PC)

1. Baixe/exporte o projeto do AI Studio para uma pasta no seu computador (tenha o **Node.js 20+** instalado).
2. Na pasta raiz do projeto (junto com `package.json`), crie um arquivo chamado **`.env.production`** com os dados copiados no passo 6:

```env
VITE_FIREBASE_API_KEY=cole_aqui
VITE_FIREBASE_AUTH_DOMAIN=cole_aqui
VITE_FIREBASE_PROJECT_ID=cole_aqui
VITE_FIREBASE_STORAGE_BUCKET=cole_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=cole_aqui
VITE_FIREBASE_APP_ID=cole_aqui
VITE_FIREBASE_DATABASE_ID=(default)
```

> Guarde esse arquivo `.env.production` com seguranca no seu PC (ele ja esta ignorado no `.gitignore`). Voce vai reutiliza-lo em todas as atualizacoes futuras.

3. Abra o terminal dentro da pasta do projeto e execute:

```bash
npm install
npm run build
```

4. Isso vai gerar a pasta **`dist/`** pronta para producao (ja conectada ao seu Firebase de producao e ja contendo o arquivo `.htaccess`).

---

## Parte 3 — Subir para a KingHost

1. No **Painel de Controle da KingHost**:
   - Ative o **SSL Gratis (Let's Encrypt)** para o seu dominio (obrigatorio para HTTPS e PWA).
2. Conecte via **FTP (FileZilla)** ou **Gerenciador de Arquivos** da KingHost na pasta **`www/`** do seu dominio.
3. Envie **todo o conteudo de dentro da pasta `dist/`** para dentro de **`www/`**:
   - Verifique se `index.html`, `sw.js`, `manifest.webmanifest`, `.htaccess` e a pasta `assets/` ficaram diretamente dentro de `www/`.
   - No FileZilla, ative **Servidor > Forcar exibicao de arquivos ocultos** para confirmar que o `.htaccess` tambem foi enviado.
4. Acesse `https://seudominio.com.br`, crie sua conta de GM (com um dos e-mails listados em `firestore.rules`), confirme o e-mail de verificacao e teste o login!

---

## Como lancar atualizacoes futuras (sem perder nenhum dado dos jogadores)

Sempre que voce adicionar novos mapas, Digimons ou correcoes aqui no AI Studio:

1. Exporte/baixe o codigo atualizado para seu PC.
2. Mantenha o seu mesmo arquivo **`.env.production`** na raiz do projeto.
3. Se tiver mudado alguma regra do banco (ex: novo mapa/Digimon adicionado em `firestore.rules`), copie o novo `firestore.rules` e clique em **Publicar** na aba Regras do seu Firebase de producao.
4. Rode `npm install` (se houver pacotes novos) e `npm run build`.
5. Suba os arquivos atualizados da pasta `dist/` para a pasta `www/` da KingHost (substituindo os antigos).
   - **Dica para economizar tempo:** se voce nao mexeu em imagens/audios antigos, basta subir os arquivos da raiz de `dist/` (`index.html`, `sw.js`, `registerSW.js`, `manifest.webmanifest`) e os novos arquivos dentro de `dist/assets/`.

Os dados de todos os jogadores permanecem 100% intactos no seu Firebase de producao!
