import { Router } from "express";
import userController from "./controller";
import { authMiddleware } from "../shared/middleware/auth";
import { validateUser } from "./validators";
import { requirePermission } from "../shared/middleware/permissions";
import { PermissionCode } from "../permissions/types";
import { validateUserPreferences } from "./preferencesValidator";

const userRoutes = Router();

userRoutes.use(authMiddleware);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários com paginação opcional
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de itens por página (máximo 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name, email, type, language, theme]
 *           default: id
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordem da classificação
 *     responses:
 *       200:
 *         description: Lista de usuários (paginada se parâmetros fornecidos)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                   description: Lista simples (sem paginação)
 *                 - type: object
 *                   description: Resposta paginada
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *             examples:
 *               simple_list:
 *                 summary: Lista simples (sem parâmetros de paginação)
 *                 value:
 *                   - id: 1
 *                     name: "Admin"
 *                     email: "admin@spsgroup.com.br"
 *                     type: "admin"
 *                     language: "en"
 *                     theme: "light"
 *               paginated_list:
 *                 summary: Lista paginada
 *                 value:
 *                   data:
 *                     - id: 1
 *                       name: "Admin"
 *                       email: "admin@spsgroup.com.br"
 *                       type: "admin"
 *                       language: "en"
 *                       theme: "light"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total: 25
 *                     totalPages: 3
 *                     hasNext: true
 *                     hasPrev: false
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.get("/", requirePermission(PermissionCode.USER_LIST), userController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Busca um usuário por ID
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.get("/:id", validateUser("idParam"), requirePermission(PermissionCode.USER_READ), userController.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.post("/", validateUser("createUser"), requirePermission(PermissionCode.USER_CREATE), userController.createUser);

/**
 * @swagger
 * /users/preferences:
 *   put:
 *     summary: Atualiza as preferências do usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [pt, en, es]
 *                 description: Idioma preferido do usuário
 *                 example: "pt"
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *                 description: Tema preferido do usuário
 *                 example: "dark"
 *           examples:
 *             language_only:
 *               summary: Atualizar apenas idioma
 *               value:
 *                 language: "pt"
 *             theme_only:
 *               summary: Atualizar apenas tema
 *               value:
 *                 theme: "dark"
 *             both:
 *               summary: Atualizar idioma e tema
 *               value:
 *                 language: "en"
 *                 theme: "system"
 *     responses:
 *       200:
 *         description: Preferências atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Preferências do usuário atualizadas com sucesso"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "joao@example.com"
 *                     language:
 *                       type: string
 *                       example: "pt"
 *                     theme:
 *                       type: string
 *                       example: "dark"
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Dados inválidos"
 *                 message:
 *                   type: string
 *                   example: "Invalid language. Supported: pt, en, es"
 *       401:
 *         description: Não autorizado
 */
userRoutes.put("/preferences", authMiddleware, validateUserPreferences, userController.updateUserPreferences);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário existente
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.put("/:id", validateUser("updateUser"), requirePermission(PermissionCode.USER_UPDATE), userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deleta um usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Não é possível deletar o usuário administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.delete("/:id", validateUser("idParam"), requirePermission(PermissionCode.USER_DELETE), userController.deleteUser);

/**
 * @swagger
 * /users/permissions/list:
 *   get:
 *     summary: Lista todas as permissões disponíveis traduzidas
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permissões disponíveis no idioma do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   code:
 *                     type: string
 *                     example: "user:create"
 *                   name:
 *                     type: string
 *                     example: "Criar Usuários"
 *                   description:
 *                     type: string
 *                     example: "Permissão para criar novos usuários no sistema"
 */
userRoutes.get("/permissions/list", authMiddleware, userController.getAllPermissions);

/**
 * @swagger
 * /users/roles/list:
 *   get:
 *     summary: Lista todas as roles disponíveis traduzidas
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles disponíveis no idioma do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   code:
 *                     type: string
 *                     example: "admin"
 *                   name:
 *                     type: string
 *                     example: "Administrador"
 *                   description:
 *                     type: string
 *                     example: "Administrador do sistema com todas as permissões"
 */
userRoutes.get("/roles/list", authMiddleware, userController.getAllRoles);


export default userRoutes;
