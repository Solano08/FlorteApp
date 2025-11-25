// server/src/swagger.ts

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Florte API',
    version: '1.0.0',
    description: 'Documentación de la API de Florte (auth, perfil y usuarios)',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Servidor local',
    },
  ],
  components: {
    securitySchemes: {
      // ⬇️⬇️ AQUÍ ESTÁ LA CLAVE: ya NO es http/bearer
      JWTAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string', example: 'David' },
          lastName: { type: 'string', example: 'Solano' },
          email: { type: 'string', format: 'email', example: 'davidsolano0818@gmail.com' },
          avatarUrl: { type: 'string', nullable: true },
          coverImageUrl: { type: 'string', nullable: true },
          headline: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          instagramUrl: { type: 'string', nullable: true },
          githubUrl: { type: 'string', nullable: true },
          facebookUrl: { type: 'string', nullable: true },
          contactEmail: { type: 'string', nullable: true },
          xUrl: { type: 'string', nullable: true },
          role: { type: 'string', example: 'apprentice' },
          isActive: { type: 'boolean', example: true },
        },
      },
    },
  },
  security: [
    {
      JWTAuth: [],
    },
  ],
  paths: {
    // ---------- AUTH ----------
    '/api/auth/login': {
      post: {
        summary: 'Iniciar sesión',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'davidsolano0818@gmail.com',
                  },
                  password: {
                    type: 'string',
                    example: 'solano123',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login correcto, devuelve el usuario y los tokens',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                    tokens: {
                      type: 'object',
                      properties: {
                        accessToken: {
                          type: 'string',
                          example: 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        refreshToken: {
                          type: 'string',
                          example: 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Credenciales incorrectas',
          },
        },
      },
    },

    // ---------- PROFILE (usuario normal) ----------
    '/api/profile/me': {
      get: {
        summary: 'Obtener el perfil del usuario autenticado',
        tags: ['Profile'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Perfil del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    profile: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
      put: {
        summary: 'Actualizar el perfil del usuario autenticado',
        tags: ['Profile'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', example: 'David' },
                  lastName: { type: 'string', example: 'Solano' },
                  headline: { type: 'string', example: 'Aprendiz en Florte' },
                  bio: { type: 'string', example: 'KNG' },
                  instagramUrl: { type: 'string', nullable: true },
                  githubUrl: { type: 'string', nullable: true },
                  facebookUrl: { type: 'string', nullable: true },
                  contactEmail: { type: 'string', nullable: true },
                  xUrl: { type: 'string', nullable: true },
                  coverImageUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Perfil actualizado correctamente',
          },
          400: {
            description: 'Datos inválidos',
          },
          401: {
            description: 'No autenticado',
          },
        },
      },
    },

    '/api/profile/me/avatar': {
      put: {
        summary: 'Actualizar avatar del usuario autenticado',
        tags: ['Profile'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo de imagen para el avatar',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Avatar actualizado correctamente' },
          400: { description: 'Archivo inválido' },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/profile/me/cover': {
      put: {
        summary: 'Actualizar imagen de portada del usuario autenticado',
        tags: ['Profile'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  cover: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo de imagen para la portada',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Portada actualizada correctamente' },
          400: { description: 'Archivo inválido' },
          401: { description: 'No autenticado' },
        },
      },
    },

    // ---------- USERS (solo admin) ----------
    '/api/users': {
      get: {
        summary: 'Listar todos los usuarios (solo admin)',
        tags: ['Users'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para realizar esta acción' },
        },
      },
    },

    '/api/users/{userId}': {
      get: {
        summary: 'Obtener un usuario por ID (solo admin)',
        tags: ['Users'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Usuario encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para realizar esta acción' },
          404: { description: 'Usuario no encontrado' },
        },
      },
      put: {
        summary: 'Actualizar usuario por ID (solo admin)',
        tags: ['Users'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
        responses: {
          200: { description: 'Usuario actualizado correctamente' },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para realizar esta acción' },
        },
      },
      delete: {
        summary: 'Eliminar usuario por ID (solo admin)',
        tags: ['Users'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Usuario eliminado correctamente' },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para realizar esta acción' },
        },
      },
    },

    '/api/users/{userId}/restore': {
      post: {
        summary: 'Restaurar usuario eliminado (solo admin)',
        tags: ['Users'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Usuario restaurado correctamente' },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para realizar esta acción' },
        },
      },
    },
  },
};

export default swaggerDocument;
