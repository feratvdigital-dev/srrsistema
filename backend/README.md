# SR Resolve - Backend PHP/MySQL para CPanel

## Instruções de Instalação no CPanel

### 1. Criar o Banco de Dados
1. Acesse o **phpMyAdmin** no CPanel
2. Crie um banco chamado `sr_resolve`
3. Importe o arquivo `database.sql` (clique em **Importar** e selecione o arquivo)

### 2. Configurar Conexão
1. Edite o arquivo `config.php`
2. Altere as constantes:
   - `DB_HOST` → geralmente `localhost`
   - `DB_NAME` → nome do banco (ex: `seuusuario_sr_resolve`)
   - `DB_USER` → usuário do banco criado no CPanel
   - `DB_PASS` → senha do banco

### 3. Upload dos Arquivos
1. Faça upload da pasta `backend/` para o CPanel via **Gerenciador de Arquivos** ou **FTP**
2. Coloque os arquivos PHP dentro de `public_html/api/`:
   ```
   public_html/
   ├── api/
   │   ├── config.php
   │   ├── auth.php
   │   ├── orders.php
   │   └── technicians.php
   ├── index.html      ← build do frontend
   ├── assets/          ← build do frontend
   └── ...
   ```

### 4. Build do Frontend
1. No GitHub, clone o repositório
2. Execute:
   ```bash
   npm install
   npm run build
   ```
3. Faça upload do conteúdo da pasta `dist/` para `public_html/`

### 5. Configurar URL da API
Crie um arquivo `.env` na raiz do projeto frontend antes do build:
```
VITE_API_URL=/api
```

### 6. Usuário Admin Padrão
- **Usuário:** `srresolve`
- **Senha:** `admin123`

> ⚠️ **IMPORTANTE:** Altere a senha padrão após o primeiro acesso!

### 7. .htaccess (SPA Routing)
Crie um `.htaccess` em `public_html/` para o React Router funcionar:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^api/ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## Estrutura do Banco
- `users` → Usuários admin
- `technicians` → Técnicos com credenciais
- `service_orders` → Ordens de serviço
- `order_photos` → Fotos das OS (Base64)
