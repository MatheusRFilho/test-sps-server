import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API RESTful de Usuários",
      version: "1.0.0",
      description: "API RESTful desenvolvida em Node.js com Express para gerenciamento de usuários, utilizando autenticação JWT e banco de dados SQLite.",
      contact: {
        name: "Suporte API",
        email: "admin@spsgroup.com.br"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de desenvolvimento"
      },
      {
        url: "https://api.example.com",
        description: "Servidor de produção"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtido através do endpoint /auth/login"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "ID único do usuário",
              example: 1
            },
            name: {
              type: "string",
              description: "Nome do usuário",
              example: "João Silva"
            },
            email: {
              type: "string",
              format: "email",
              description: "Email do usuário",
              example: "joao@example.com"
            },
            type: {
              type: "string",
              enum: ["admin", "manager", "user"],
              description: "Tipo de usuário",
              example: "user"
            },
            language: {
              type: "string",
              enum: ["pt", "en", "es"],
              description: "Idioma preferido do usuário",
              example: "en"
            },
            theme: {
              type: "string",
              enum: ["light", "dark", "system"],
              description: "Tema preferido do usuário",
              example: "light"
            }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "admin@spsgroup.com.br"
            },
            password: {
              type: "string",
              example: "1234"
            }
          }
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "Token JWT para autenticação",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            },
            user: {
              $ref: "#/components/schemas/User"
            }
          }
        },
        CreateUserRequest: {
          type: "object",
          required: ["email", "name", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "novo@example.com"
            },
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "Novo Usuário"
            },
            type: {
              type: "string",
              enum: ["admin", "manager", "user"],
              default: "user",
              example: "user"
            },
            password: {
              type: "string",
              minLength: 4,
              example: "senha123"
            },
            language: {
              type: "string",
              enum: ["pt", "en", "es"],
              description: "Idioma preferido do usuário (pt, en, es)",
              default: "en",
              example: "en"
            },
            theme: {
              type: "string",
              enum: ["light", "dark", "system"],
              description: "Tema preferido do usuário (light, dark, system)",
              default: "light",
              example: "light"
            },
            permissions: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Lista de códigos de permissões específicas do usuário (ex: ['user:create', 'user:update'])",
              example: ["user:create", "user:update"]
            }
          }
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "novoemail@example.com"
            },
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "Nome Atualizado"
            },
            type: {
              type: "string",
              enum: ["admin", "manager", "user"],
              example: "admin"
            },
            password: {
              type: "string",
              minLength: 4,
              example: "novasenha123"
            },
            language: {
              type: "string",
              enum: ["pt", "en", "es"],
              description: "Idioma preferido do usuário (pt, en, es)",
              example: "en"
            },
            theme: {
              type: "string",
              enum: ["light", "dark", "system"],
              description: "Tema preferido do usuário (light, dark, system)",
              example: "light"
            },
            permissions: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Lista de códigos de permissões específicas do usuário (ex: ['user:create', 'user:update'])",
              example: ["user:create", "user:update"]
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Mensagem de erro"
            },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string"
                  },
                  message: {
                    type: "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: "Autenticação",
        description: "Endpoints de autenticação e geração de tokens JWT"
      },
      {
        name: "Usuários",
        description: "Endpoints para gerenciamento de usuários (CRUD)"
      }
    ]
  },
  apis: [
    "./src/**/*.ts"
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
