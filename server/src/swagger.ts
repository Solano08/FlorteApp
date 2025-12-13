// server/src/swagger.ts

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Florte API',
    version: '1.0.0',
    description: 'Documentación completa de la API de Florte',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Servidor local',
    },
  ],
  components: {
    securitySchemes: {
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
          role: { type: 'string', enum: ['admin', 'instructor', 'apprentice'], example: 'apprentice' },
          isActive: { type: 'boolean', example: true },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          authorId: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          mediaUrl: { type: 'string', nullable: true },
          tags: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          author: { $ref: '#/components/schemas/FeedAuthor' },
          reactionCount: { type: 'number' },
          commentCount: { type: 'number' },
          shareCount: { type: 'number' },
          viewerReaction: { type: 'string', enum: ['like', 'celebrate', 'love', 'insightful', 'support'], nullable: true },
          isSaved: { type: 'boolean' },
          attachments: {
            type: 'array',
            items: { $ref: '#/components/schemas/FeedAttachment' },
          },
        },
      },
      FeedAuthor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          headline: { type: 'string', nullable: true },
        },
      },
      FeedAttachment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          postId: { type: 'string', format: 'uuid' },
          url: { type: 'string' },
          mimeType: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          postId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          attachmentUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          author: { $ref: '#/components/schemas/FeedAuthor' },
        },
      },
      PostMetrics: {
        type: 'object',
        properties: {
          reactionCount: { type: 'number' },
          commentCount: { type: 'number' },
          shareCount: { type: 'number' },
          viewerReaction: { type: 'string', enum: ['like', 'celebrate', 'love', 'insightful', 'support'], nullable: true },
          isSaved: { type: 'boolean' },
        },
      },
      Chat: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', nullable: true },
          isGroup: { type: 'boolean' },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          chatId: { type: 'string', format: 'uuid' },
          senderId: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          attachmentUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          coverImage: { type: 'string', nullable: true },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          repositoryUrl: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['draft', 'in_progress', 'completed'] },
          ownerId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      LibraryResource: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          resourceType: { type: 'string', enum: ['document', 'video', 'link', 'course', 'other'] },
          url: { type: 'string', nullable: true },
          uploadedBy: { type: 'string', format: 'uuid' },
          tags: { type: 'array', items: { type: 'string' }, nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          postId: { type: 'string', format: 'uuid' },
          reporterId: { type: 'string', format: 'uuid' },
          reason: { type: 'string' },
          details: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'reviewed'] },
          createdAt: { type: 'string', format: 'date-time' },
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
    // ========== HEALTH ==========
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Servidor funcionando correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ========== AUTH ==========
    '/api/auth/register': {
      post: {
        summary: 'Registrar nuevo usuario',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string', minLength: 2, example: 'David' },
                  lastName: { type: 'string', minLength: 2, example: 'Solano' },
                  email: { type: 'string', format: 'email', example: 'davidsolano0818@gmail.com' },
                  password: { type: 'string', minLength: 8, example: 'solano123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario registrado correctamente',
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
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
        },
      },
    },

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

    '/api/auth/refresh': {
      post: {
        summary: 'Refrescar tokens de acceso',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', minLength: 10 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Tokens refrescados correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    tokens: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Token inválido o expirado' },
        },
      },
    },

    '/api/auth/logout': {
      post: {
        summary: 'Cerrar sesión',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', minLength: 10 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sesión cerrada correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/auth/forgot-password': {
      post: {
        summary: 'Solicitar recuperación de contraseña',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'davidsolano0818@gmail.com' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Email de recuperación enviado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/auth/reset-password': {
      post: {
        summary: 'Restablecer contraseña',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string', minLength: 10 },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Contraseña actualizada correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Token inválido o expirado' },
        },
      },
    },

    // ========== PROFILE ==========
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
          400: {
            description: 'Datos inválidos',
          },
          401: {
            description: 'No autenticado',
          },
        },
      },
    },

    '/api/profile/me/activity': {
      get: {
        summary: 'Obtener actividad del usuario autenticado',
        tags: ['Profile'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Actividad del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    activity: { type: 'object' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/profile/me/posts': {
      get: {
        summary: 'Obtener posts recientes del usuario autenticado',
        tags: ['Profile'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 6 },
          },
        ],
        responses: {
          200: {
            description: 'Posts del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    posts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
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
          200: {
            description: 'Avatar actualizado correctamente',
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
          200: {
            description: 'Portada actualizada correctamente',
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
          400: { description: 'Archivo inválido' },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/profile/{userId}': {
      get: {
        summary: 'Obtener perfil público de un usuario',
        tags: ['Profile'],
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
            description: 'Perfil público del usuario',
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
          404: { description: 'Usuario no encontrado' },
        },
      },
    },

    // ========== FEED ==========
    '/api/feed': {
      get: {
        summary: 'Listar feed de posts',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 15 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
        ],
        responses: {
          200: {
            description: 'Lista de posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    posts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
      post: {
        summary: 'Crear nuevo post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string', maxLength: 2000 },
                  mediaUrl: { type: 'string', nullable: true },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    maxItems: 10,
                  },
                  attachments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                        mimeType: { type: 'string', nullable: true },
                      },
                    },
                    maxItems: 6,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Post creado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    post: { $ref: '#/components/schemas/Post' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/feed/saved': {
      get: {
        summary: 'Listar posts guardados',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Lista de posts guardados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    savedPosts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/feed/{postId}': {
      get: {
        summary: 'Obtener un post específico',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Post encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    post: { $ref: '#/components/schemas/Post' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          404: { description: 'Post no encontrado' },
        },
      },
      patch: {
        summary: 'Actualizar un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string', maxLength: 2000 },
                  mediaUrl: { type: 'string', nullable: true },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    maxItems: 10,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Post actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    post: { $ref: '#/components/schemas/Post' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para actualizar este post' },
          404: { description: 'Post no encontrado' },
        },
      },
      delete: {
        summary: 'Eliminar un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Post eliminado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para eliminar este post' },
          404: { description: 'Post no encontrado' },
        },
      },
    },

    '/api/feed/{postId}/reactions': {
      post: {
        summary: 'Reaccionar a un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reactionType'],
                properties: {
                  reactionType: {
                    type: 'string',
                    enum: ['like', 'celebrate', 'love', 'insightful', 'support'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Reacción aplicada/removida',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    metrics: { $ref: '#/components/schemas/PostMetrics' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          404: { description: 'Post no encontrado' },
        },
      },
    },

    '/api/feed/{postId}/comments': {
      get: {
        summary: 'Listar comentarios de un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Lista de comentarios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    comments: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Comment' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
      post: {
        summary: 'Comentar en un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string', maxLength: 800 },
                  attachmentUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Comentario creado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    comment: { $ref: '#/components/schemas/Comment' },
                    metrics: { $ref: '#/components/schemas/PostMetrics' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
          404: { description: 'Post no encontrado' },
        },
      },
    },

    '/api/feed/{postId}/comments/{commentId}': {
      patch: {
        summary: 'Actualizar un comentario',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'commentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', minLength: 1, maxLength: 800 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Comentario actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    comment: { $ref: '#/components/schemas/Comment' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para actualizar este comentario' },
          404: { description: 'Comentario no encontrado' },
        },
      },
      delete: {
        summary: 'Eliminar un comentario',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'commentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Comentario eliminado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    metrics: { $ref: '#/components/schemas/PostMetrics' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para eliminar este comentario' },
          404: { description: 'Comentario no encontrado' },
        },
      },
    },

    '/api/feed/{postId}/save': {
      post: {
        summary: 'Guardar/quitar guardado de un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Estado de guardado actualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    metrics: { $ref: '#/components/schemas/PostMetrics' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          404: { description: 'Post no encontrado' },
        },
      },
    },

    '/api/feed/{postId}/share': {
      post: {
        summary: 'Compartir un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Post compartido correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    post: { $ref: '#/components/schemas/Post' },
                    metrics: { $ref: '#/components/schemas/PostMetrics' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          404: { description: 'Post no encontrado' },
        },
      },
    },

    '/api/feed/{postId}/report': {
      post: {
        summary: 'Reportar un post',
        tags: ['Feed'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: { type: 'string', minLength: 3, maxLength: 255 },
                  details: { type: 'string', maxLength: 1000 },
                  commentId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Post reportado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    report: { $ref: '#/components/schemas/Report' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
          404: { description: 'Post no encontrado' },
        },
      },
    },

    // ========== CHATS ==========
    '/api/chats': {
      get: {
        summary: 'Listar chats del usuario',
        tags: ['Chats'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Lista de chats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    chats: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Chat' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
      post: {
        summary: 'Crear un chat',
        tags: ['Chats'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['memberIds', 'isGroup'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 120 },
                  memberIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    minItems: 1,
                  },
                  isGroup: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Chat creado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    chat: { $ref: '#/components/schemas/Chat' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/chats/{chatId}': {
      delete: {
        summary: 'Eliminar un chat',
        tags: ['Chats'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Chat eliminado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          404: { description: 'Chat no encontrado' },
        },
      },
    },

    '/api/chats/{chatId}/join': {
      post: {
        summary: 'Unirse a un chat',
        tags: ['Chats'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Unido al chat correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    chat: { $ref: '#/components/schemas/Chat' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          404: { description: 'Chat no encontrado' },
        },
      },
    },

    '/api/chats/{chatId}/messages': {
      get: {
        summary: 'Obtener mensajes de un chat',
        tags: ['Chats'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Lista de mensajes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    messages: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Message' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          404: { description: 'Chat no encontrado' },
        },
      },
      post: {
        summary: 'Enviar mensaje en un chat',
        tags: ['Chats'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'chatId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string', maxLength: 2000 },
                  attachmentUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Mensaje enviado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { $ref: '#/components/schemas/Message' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
          404: { description: 'Chat no encontrado' },
        },
      },
    },

    // ========== GROUPS ==========
    '/api/groups': {
      get: {
        summary: 'Listar grupos (público)',
        tags: ['Groups'],
        responses: {
          200: {
            description: 'Lista de grupos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    groups: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Group' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear grupo',
        tags: ['Groups'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', minLength: 3, example: 'Grupo de Estudio' },
                  description: { type: 'string', maxLength: 500 },
                  coverImage: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Grupo creado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    group: { $ref: '#/components/schemas/Group' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/groups/me': {
      get: {
        summary: 'Listar grupos del usuario autenticado',
        tags: ['Groups'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Lista de grupos del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    groups: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Group' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
    },

    // ========== PROJECTS ==========
    '/api/projects': {
      get: {
        summary: 'Listar proyectos (público)',
        tags: ['Projects'],
        responses: {
          200: {
            description: 'Lista de proyectos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    projects: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Project' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear proyecto',
        tags: ['Projects'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', minLength: 3, example: 'Mi Proyecto' },
                  description: { type: 'string', maxLength: 1000 },
                  repositoryUrl: { type: 'string', format: 'uri' },
                  status: {
                    type: 'string',
                    enum: ['draft', 'in_progress', 'completed'],
                    example: 'draft',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Proyecto creado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    project: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/projects/me': {
      get: {
        summary: 'Listar proyectos del usuario autenticado',
        tags: ['Projects'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Lista de proyectos del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    projects: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Project' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/projects/{projectId}': {
      put: {
        summary: 'Actualizar proyecto',
        tags: ['Projects'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 3 },
                  description: { type: 'string', maxLength: 1000, nullable: true },
                  repositoryUrl: { type: 'string', format: 'uri', nullable: true },
                  status: {
                    type: 'string',
                    enum: ['draft', 'in_progress', 'completed'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Proyecto actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    project: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para actualizar este proyecto' },
          404: { description: 'Proyecto no encontrado' },
        },
      },
    },

    // ========== LIBRARY ==========
    '/api/library': {
      get: {
        summary: 'Listar recursos de la biblioteca (público)',
        tags: ['Library'],
        responses: {
          200: {
            description: 'Lista de recursos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    resources: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LibraryResource' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear recurso en la biblioteca',
        tags: ['Library'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'resourceType'],
                properties: {
                  title: { type: 'string', minLength: 3, example: 'Guía de React' },
                  description: { type: 'string', maxLength: 1000 },
                  resourceType: {
                    type: 'string',
                    enum: ['document', 'video', 'link', 'course', 'other'],
                    example: 'document',
                  },
                  url: { type: 'string', format: 'uri' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Recurso creado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    resource: { $ref: '#/components/schemas/LibraryResource' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
        },
      },
    },

    '/api/library/search': {
      get: {
        summary: 'Buscar en la biblioteca (público)',
        tags: ['Library'],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Término de búsqueda',
          },
        ],
        responses: {
          200: {
            description: 'Resultados de búsqueda',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    resources: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LibraryResource' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/library/me': {
      get: {
        summary: 'Listar recursos del usuario autenticado',
        tags: ['Library'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Lista de recursos del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    resources: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LibraryResource' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
    },

    // ========== USERS (Admin) ==========
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
      post: {
        summary: 'Crear usuario (solo admin)',
        tags: ['Users'],
        security: [{ JWTAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string', minLength: 2 },
                  lastName: { type: 'string', minLength: 2 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: {
                    type: 'string',
                    enum: ['admin', 'instructor', 'apprentice'],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario creado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Datos inválidos' },
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
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', minLength: 2 },
                  lastName: { type: 'string', minLength: 2 },
                  email: { type: 'string', format: 'email' },
                  role: {
                    type: 'string',
                    enum: ['admin', 'instructor', 'apprentice'],
                  },
                  isActive: { type: 'boolean' },
                  password: { type: 'string', minLength: 6 },
                  headline: { type: 'string', maxLength: 160, nullable: true },
                  bio: { type: 'string', maxLength: 500, nullable: true },
                  avatarUrl: { type: 'string', format: 'uri', nullable: true },
                  coverImageUrl: { type: 'string', format: 'uri', nullable: true },
                  instagramUrl: { type: 'string', format: 'uri', nullable: true },
                  githubUrl: { type: 'string', format: 'uri', nullable: true },
                  facebookUrl: { type: 'string', format: 'uri', nullable: true },
                  contactEmail: { type: 'string', format: 'email', nullable: true },
                  xUrl: { type: 'string', format: 'uri', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Usuario actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
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
          200: {
            description: 'Usuario eliminado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
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
          200: {
            description: 'Usuario restaurado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
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
    },

    // ========== ADMIN ==========
    '/api/admin/users': {
      get: {
        summary: 'Listar usuarios (solo admin)',
        tags: ['Admin'],
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

    '/api/admin/users/{userId}': {
      put: {
        summary: 'Actualizar usuario (solo admin)',
        tags: ['Admin'],
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
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', minLength: 2 },
                  lastName: { type: 'string', minLength: 2 },
                  email: { type: 'string', format: 'email' },
                  role: {
                    type: 'string',
                    enum: ['admin', 'instructor', 'apprentice'],
                  },
                  isActive: { type: 'boolean' },
                  password: { type: 'string', minLength: 6 },
                  headline: { type: 'string', maxLength: 160, nullable: true },
                  bio: { type: 'string', maxLength: 500, nullable: true },
                  avatarUrl: { type: 'string', format: 'uri', nullable: true },
                  coverImageUrl: { type: 'string', format: 'uri', nullable: true },
                  instagramUrl: { type: 'string', format: 'uri', nullable: true },
                  githubUrl: { type: 'string', format: 'uri', nullable: true },
                  facebookUrl: { type: 'string', format: 'uri', nullable: true },
                  contactEmail: { type: 'string', format: 'email', nullable: true },
                  xUrl: { type: 'string', format: 'uri', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Usuario actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
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
    },

    '/api/admin/users/{userId}/role': {
      patch: {
        summary: 'Actualizar rol de usuario (solo admin)',
        tags: ['Admin'],
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
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: {
                    type: 'string',
                    enum: ['admin', 'instructor', 'apprentice'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Rol actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
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
    },

    '/api/admin/users/{userId}/status': {
      patch: {
        summary: 'Actualizar estado de usuario (solo admin)',
        tags: ['Admin'],
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
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: {
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Estado actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
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
    },

    '/api/admin/reports': {
      get: {
        summary: 'Listar reportes (solo admin)',
        tags: ['Admin'],
        security: [{ JWTAuth: [] }],
        responses: {
          200: {
            description: 'Lista de reportes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    reports: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Report' },
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

    '/api/admin/reports/{reportId}/status': {
      patch: {
        summary: 'Actualizar estado de reporte (solo admin)',
        tags: ['Admin'],
        security: [{ JWTAuth: [] }],
        parameters: [
          {
            name: 'reportId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'reviewed'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Estado del reporte actualizado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    report: { $ref: '#/components/schemas/Report' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
          403: { description: 'No tienes permisos para realizar esta acción' },
          404: { description: 'Reporte no encontrado' },
        },
      },
    },
  },
};

export default swaggerDocument;
