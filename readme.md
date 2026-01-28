----------------------------------
ESPANHOL
----------------------------------

## Prueba NODE

- Crear un CRUD (API REST) en Node para el registro de usuarios.
- Para la creación de la prueba, utilizar un repositorio falso de usuarios (puede ser en memoria).

## Reglas

- Debe existir un usuario administrador previamente registrado para utilizar la autenticación (no es necesario cifrar la contraseña):
{
  "name": "admin",
  "email": "admin@spsgroup.com.br",
  "type": "admin",
  "password": "1234"
}

- Crear una ruta de autenticación (token Jwt).
- Las rutas de la API solo pueden ser ejecutadas si el usuario está autenticado.
- Debe ser posible añadir usuarios con los campos: email, nombre, type, password.
- No debe ser posible registrar un correo electrónico ya existente.
- Debe ser posible eliminar usuarios.
- Debe ser posible modificar los datos de un usuario.


----------------------------------
PORTUGUÊS
----------------------------------

# Teste NODE

- Criar um CRUD (API REST) em node para cadastro de usuários
- Para a criação do teste utilizar um repositório fake dos usuários. (Pode ser em memória)

## Regras

- Deve existir um usuário admin previamente cadastrado para utilizar autenticação (não precisa criptografar a senha);
  {
    name: "admin",
    email: "admin@spsgroup.com.br",
    type: "admin"
    password: "1234"
  }

- Criar rota de autenticação (Jwt token)
- As rotas da API só podem ser executadas se estiver autenticada
- Deve ser possível adicionar usuários. Campos: email, nome, type, password
- Não deve ser possível cadastrar o e-mail já cadastrado
- Deve ser possível remover usuário
- Deve ser possível alterar os dados do usuário

## Como Executar

### Pré-requisitos
- Node.js >= 18.x
- Yarn ou npm
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd sps-back
```

2. **Instale as dependências**
```bash
yarn install
# ou
npm install
```

3. **Configure o ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações (opcional para desenvolvimento)
```

4. **Execute as migrações do banco**
```bash
yarn migrate:run
# ou
npm run migrate:run
```

### Executar a aplicação

#### Desenvolvimento (com hot-reload)
```bash
yarn dev
# ou
npm run dev
```

#### Produção
```bash
# Build da aplicação
yarn build
# ou
npm run build

# Executar
yarn start
# ou
npm start
```

### Acessar a aplicação

- **API**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/

### Usuário Administrador Padrão

```json
{
  "email": "admin@spsgroup.com.br",
  "password": "1234"
}
```

### Exemplo de uso da API

1. **Login (obter token)**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@spsgroup.com.br",
    "password": "1234"
  }'
```

2. **Listar usuários (com token)**
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

3. **Criar usuário**
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "type": "user",
    "password": "senha123"
  }'
```

### Scripts Disponíveis

```bash
yarn dev              # Servidor desenvolvimento
yarn build            # Build da aplicação
yarn start            # Servidor produção
yarn test             # Executar testes
yarn test:coverage    # Testes com cobertura
yarn migrate:run      # Executar migrações
yarn health-check     # Verificar saúde da API
```

### Estrutura do Banco de Dados

O sistema utiliza SQLite com as seguintes tabelas:
- `users` - Usuários do sistema
- `roles` - Tipos de usuário (admin, manager, user)
- `permissions` - Permissões específicas
- `user_roles` - Relacionamento usuário-role
- `user_permissions` - Permissões específicas por usuário
