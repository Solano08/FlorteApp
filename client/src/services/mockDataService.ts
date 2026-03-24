import { Profile } from '../types/profile';
import { Group } from '../types/group';
import { Chat, Message } from '../types/chat';
import { FeedPostAggregate, FeedComment, FeedPostReactionUser, ReactionType } from '../types/feed';
import { Channel, ChannelMessage } from '../types/channel';
import { storage } from '../utils/storage';

// Helper para generar UUIDs simples
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper para generar fechas en el pasado
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

const minutesAgo = (minutes: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

// Datos base para generar el ecosistema
const mockUsers: Profile[] = [
  {
    id: 'mock-user-1',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Desarrollador Full Stack',
    bio: 'Apasionado por el desarrollo web y las nuevas tecnologías',
    instagramUrl: null,
    githubUrl: 'https://github.com/carlosr',
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'apprentice',
    isActive: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(5)
  },
  {
    id: 'mock-user-2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Instructora de Programación',
    bio: 'Especialista en React y Node.js',
    instagramUrl: null,
    githubUrl: 'https://github.com/mariag',
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'instructor',
    isActive: true,
    createdAt: daysAgo(200),
    updatedAt: daysAgo(3)
  },
  {
    id: 'mock-user-3',
    firstName: 'Andrés',
    lastName: 'Martínez',
    email: 'andres.martinez@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Estudiante de Desarrollo',
    bio: 'Aprendiendo React y TypeScript',
    instagramUrl: null,
    githubUrl: null,
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'apprentice',
    isActive: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(10)
  },
  {
    id: 'mock-user-4',
    firstName: 'Laura',
    lastName: 'Sánchez',
    email: 'laura.sanchez@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Diseñadora UX/UI',
    bio: 'Creando experiencias digitales increíbles',
    instagramUrl: 'https://instagram.com/lauradesign',
    githubUrl: null,
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'apprentice',
    isActive: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(7)
  },
  {
    id: 'mock-user-5',
    firstName: 'Diego',
    lastName: 'López',
    email: 'diego.lopez@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Backend Developer',
    bio: 'Especializado en APIs y bases de datos',
    instagramUrl: null,
    githubUrl: 'https://github.com/diegol',
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'apprentice',
    isActive: true,
    createdAt: daysAgo(80),
    updatedAt: daysAgo(2)
  },
  {
    id: 'mock-user-6',
    firstName: 'Sofia',
    lastName: 'Ramírez',
    email: 'sofia.ramirez@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Estudiante de Ingeniería',
    bio: 'Interesada en desarrollo móvil',
    instagramUrl: null,
    githubUrl: null,
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'apprentice',
    isActive: true,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(15)
  },
  {
    id: 'mock-user-7',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Administrador del Sistema',
    bio: 'Gestionando la plataforma educativa',
    instagramUrl: null,
    githubUrl: null,
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'admin',
    isActive: true,
    createdAt: daysAgo(300),
    updatedAt: daysAgo(1)
  },
  {
    id: 'mock-user-8',
    firstName: 'Camila',
    lastName: 'Torres',
    email: 'camila.torres@example.com',
    avatarUrl: null,
    coverImageUrl: null,
    headline: 'Instructora de Base de Datos',
    bio: 'Experta en SQL y MongoDB',
    instagramUrl: null,
    githubUrl: 'https://github.com/camilat',
    facebookUrl: null,
    contactEmail: null,
    xUrl: null,
    role: 'instructor',
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(4)
  }
];

const mockGroups: Group[] = [
  {
    id: 'mock-group-1',
    name: 'Desarrollo Web',
    description: 'Comunidad para aprender y compartir sobre desarrollo web moderno',
    coverImage: null,
    iconUrl: null,
    createdBy: 'mock-user-2',
    createdAt: daysAgo(100),
    memberCount: 5,
    onlineCount: 3
  },
  {
    id: 'mock-group-2',
    name: 'Base de Datos',
    description: 'Discusiones sobre diseño y optimización de bases de datos',
    coverImage: null,
    iconUrl: null,
    createdBy: 'mock-user-8',
    createdAt: daysAgo(80),
    memberCount: 4,
    onlineCount: 2
  },
  {
    id: 'mock-group-3',
    name: 'Proyectos Colaborativos',
    description: 'Espacio para trabajar en proyectos en equipo',
    coverImage: null,
    iconUrl: null,
    createdBy: 'mock-user-1',
    createdAt: daysAgo(50),
    memberCount: 3,
    onlineCount: 1
  }
];

const mockChannels: Channel[] = [
  {
    id: 'mock-channel-1',
    communityId: 'mock-group-1',
    name: 'general',
    description: 'Canal general de la comunidad',
    type: 'text',
    position: 0,
    createdBy: 'mock-user-2',
    createdAt: daysAgo(100)
  },
  {
    id: 'mock-channel-2',
    communityId: 'mock-group-2',
    name: 'general',
    description: 'Canal general de la comunidad',
    type: 'text',
    position: 0,
    createdBy: 'mock-user-8',
    createdAt: daysAgo(80)
  },
  {
    id: 'mock-channel-3',
    communityId: 'mock-group-3',
    name: 'general',
    description: 'Canal general de la comunidad',
    type: 'text',
    position: 0,
    createdBy: 'mock-user-1',
    createdAt: daysAgo(50)
  }
];

const mockPinnedMessageIds = new Set<string>();
const mockStarredMessageIds = new Set<string>();

const mockChannelMessages: ChannelMessage[] = [
  {
    id: 'mock-chan-msg-1',
    channelId: 'mock-channel-1',
    senderId: 'mock-user-2',
    sender: {
      id: 'mock-user-2',
      firstName: 'María',
      lastName: 'González',
      avatarUrl: null
    },
    content: '¡Bienvenidos a la comunidad de Desarrollo Web!',
    attachmentUrl: null,
    createdAt: daysAgo(95)
  },
  {
    id: 'mock-chan-msg-2',
    channelId: 'mock-channel-1',
    senderId: 'mock-user-1',
    sender: {
      id: 'mock-user-1',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      avatarUrl: null
    },
    content: 'Gracias por la bienvenida. Estoy aprendiendo React',
    attachmentUrl: null,
    createdAt: daysAgo(90)
  },
  {
    id: 'mock-chan-msg-3',
    channelId: 'mock-channel-1',
    senderId: 'mock-user-4',
    sender: {
      id: 'mock-user-4',
      firstName: 'Laura',
      lastName: 'Sánchez',
      avatarUrl: null
    },
    content: '¿Alguien tiene recursos sobre diseño de interfaces?',
    attachmentUrl: null,
    createdAt: daysAgo(85)
  },
  {
    id: 'mock-chan-msg-4',
    channelId: 'mock-channel-2',
    senderId: 'mock-user-8',
    sender: {
      id: 'mock-user-8',
      firstName: 'Camila',
      lastName: 'Torres',
      avatarUrl: null
    },
    content: 'Hoy vamos a hablar sobre normalización de bases de datos',
    attachmentUrl: null,
    createdAt: daysAgo(75)
  },
  {
    id: 'mock-chan-msg-5',
    channelId: 'mock-channel-2',
    senderId: 'mock-user-5',
    sender: {
      id: 'mock-user-5',
      firstName: 'Diego',
      lastName: 'López',
      avatarUrl: null
    },
    content: 'Tengo algunas dudas sobre índices en MySQL',
    attachmentUrl: null,
    createdAt: daysAgo(70)
  }
];

const mockChats: Chat[] = [
  {
    id: 'mock-chat-1',
    name: null,
    isGroup: false,
    createdBy: 'mock-user-1',
    createdAt: daysAgo(40),
    lastMessageAt: minutesAgo(15),
    lastMessage: 'Gracias por la ayuda!'
  },
  {
    id: 'mock-chat-2',
    name: null,
    isGroup: false,
    createdBy: 'mock-user-3',
    createdAt: daysAgo(35),
    lastMessageAt: hoursAgo(2),
    lastMessage: 'Perfecto, nos vemos mañana'
  },
  {
    id: 'mock-chat-3',
    name: 'Grupo de Estudio',
    isGroup: true,
    createdBy: 'mock-user-1',
    createdAt: daysAgo(30),
    lastMessageAt: hoursAgo(5),
    lastMessage: '¿Quién puede revisar mi código?'
  },
  {
    id: 'mock-chat-4',
    name: null,
    isGroup: false,
    createdBy: 'mock-user-4',
    createdAt: daysAgo(25),
    lastMessageAt: daysAgo(1),
    lastMessage: 'Te envío el diseño final'
  },
  {
    id: 'mock-chat-5',
    name: 'Proyecto Final',
    isGroup: true,
    createdBy: 'mock-user-2',
    createdAt: daysAgo(20),
    lastMessageAt: hoursAgo(8),
    lastMessage: 'La presentación está lista'
  }
];

const mockMessages: Message[] = [
  {
    id: 'mock-msg-1',
    chatId: 'mock-chat-1',
    senderId: 'mock-user-2',
    content: 'Hola! ¿Cómo va tu proyecto?',
    attachmentUrl: null,
    createdAt: daysAgo(40)
  },
  {
    id: 'mock-msg-2',
    chatId: 'mock-chat-1',
    senderId: 'mock-user-1',
    content: 'Muy bien, casi terminado. ¿Puedes revisar el código?',
    attachmentUrl: null,
    createdAt: daysAgo(40)
  },
  {
    id: 'mock-msg-3',
    chatId: 'mock-chat-1',
    senderId: 'mock-user-2',
    content: 'Claro, envíamelo y lo reviso',
    attachmentUrl: null,
    createdAt: daysAgo(39)
  },
  {
    id: 'mock-msg-4',
    chatId: 'mock-chat-1',
    senderId: 'mock-user-1',
    content: 'Gracias por la ayuda!',
    attachmentUrl: null,
    createdAt: minutesAgo(15)
  },
  {
    id: 'mock-msg-5',
    chatId: 'mock-chat-2',
    senderId: 'mock-user-3',
    content: '¿Podemos reunirnos para el proyecto?',
    attachmentUrl: null,
    createdAt: daysAgo(35)
  },
  {
    id: 'mock-msg-6',
    chatId: 'mock-chat-2',
    senderId: 'mock-user-1',
    content: 'Sí, claro. ¿Mañana a las 3pm?',
    attachmentUrl: null,
    createdAt: daysAgo(35)
  },
  {
    id: 'mock-msg-7',
    chatId: 'mock-chat-2',
    senderId: 'mock-user-3',
    content: 'Perfecto, nos vemos mañana',
    attachmentUrl: null,
    createdAt: hoursAgo(2)
  },
  {
    id: 'mock-msg-8',
    chatId: 'mock-chat-3',
    senderId: 'mock-user-1',
    content: 'Hola grupo! ¿Quién puede revisar mi código?',
    attachmentUrl: null,
    createdAt: hoursAgo(5)
  },
  {
    id: 'mock-msg-9',
    chatId: 'mock-chat-3',
    senderId: 'mock-user-5',
    content: 'Yo puedo ayudarte, envíalo',
    attachmentUrl: null,
    createdAt: hoursAgo(4)
  },
  {
    id: 'mock-msg-10',
    chatId: 'mock-chat-4',
    senderId: 'mock-user-4',
    content: 'Hola! Te envío el diseño final del proyecto',
    attachmentUrl: null,
    createdAt: daysAgo(25)
  },
  {
    id: 'mock-msg-11',
    chatId: 'mock-chat-4',
    senderId: 'mock-user-1',
    content: 'Perfecto, lo reviso y te comento',
    attachmentUrl: null,
    createdAt: daysAgo(24)
  },
  {
    id: 'mock-msg-12',
    chatId: 'mock-chat-4',
    senderId: 'mock-user-4',
    content: 'Te envío el diseño final',
    attachmentUrl: null,
    createdAt: daysAgo(1)
  }
];

const mockPosts: FeedPostAggregate[] = [
  {
    id: 'mock-post-1',
    authorId: 'mock-user-2',
    author: {
      id: 'mock-user-2',
      fullName: 'María González',
      avatarUrl: null,
      headline: 'Instructora de Programación'
    },
    content: 'Acabo de publicar un nuevo tutorial sobre React Hooks. ¡Échenle un vistazo!',
    mediaUrl: null,
    tags: ['react', 'tutorial', 'programming'],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    reactionCount: 8,
    commentCount: 3,
    shareCount: 2,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 5 },
      { type: 'celebrate', count: 2 },
      { type: 'insightful', count: 1 }
    ]
  },
  {
    id: 'mock-post-2',
    authorId: 'mock-user-1',
    author: {
      id: 'mock-user-1',
      fullName: 'Carlos Rodríguez',
      avatarUrl: null,
      headline: 'Desarrollador Full Stack'
    },
    content: 'Terminé mi primer proyecto con React y TypeScript. ¡Estoy muy emocionado! 🎉',
    mediaUrl: null,
    tags: ['react', 'typescript', 'proyecto'],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    reactionCount: 12,
    commentCount: 5,
    shareCount: 1,
    viewerReaction: 'like',
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 8 },
      { type: 'celebrate', count: 4 }
    ]
  },
  {
    id: 'mock-post-3',
    authorId: 'mock-user-8',
    author: {
      id: 'mock-user-8',
      fullName: 'Camila Torres',
      avatarUrl: null,
      headline: 'Instructora de Base de Datos'
    },
    content: 'Tips para optimizar consultas SQL: siempre usa índices en columnas de búsqueda frecuente.',
    mediaUrl: null,
    tags: ['sql', 'database', 'optimization'],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    reactionCount: 6,
    commentCount: 2,
    shareCount: 0,
    viewerReaction: null,
    isSaved: true,
    latestComments: [],
    reactionBreakdown: [
      { type: 'insightful', count: 4 },
      { type: 'like', count: 2 }
    ]
  },
  {
    id: 'mock-post-4',
    authorId: 'mock-user-4',
    author: {
      id: 'mock-user-4',
      fullName: 'Laura Sánchez',
      avatarUrl: null,
      headline: 'Diseñadora UX/UI'
    },
    content: 'Compartiendo algunos recursos de diseño que me han ayudado mucho en mis proyectos.',
    mediaUrl: null,
    tags: ['design', 'ux', 'ui'],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    reactionCount: 9,
    commentCount: 4,
    shareCount: 3,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 6 },
      { type: 'support', count: 3 }
    ]
  },
  {
    id: 'mock-post-5',
    authorId: 'mock-user-5',
    author: {
      id: 'mock-user-5',
      fullName: 'Diego López',
      avatarUrl: null,
      headline: 'Backend Developer'
    },
    content: 'Acabo de aprender sobre arquitectura de microservicios. ¿Alguien tiene experiencia con esto?',
    mediaUrl: null,
    tags: ['backend', 'microservices', 'architecture'],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    reactionCount: 4,
    commentCount: 1,
    shareCount: 0,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 3 },
      { type: 'insightful', count: 1 }
    ]
  },
  {
    id: 'mock-post-6',
    authorId: 'mock-user-3',
    author: {
      id: 'mock-user-3',
      fullName: 'Andrés Martínez',
      avatarUrl: null,
      headline: 'Estudiante de Desarrollo'
    },
    content: 'Mi primera aplicación con React está funcionando! Aprendí mucho en el proceso.',
    mediaUrl: null,
    tags: ['react', 'learning', 'first-project'],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    reactionCount: 15,
    commentCount: 6,
    shareCount: 2,
    viewerReaction: 'celebrate',
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'celebrate', count: 10 },
      { type: 'like', count: 5 }
    ]
  },
  {
    id: 'mock-post-7',
    authorId: 'mock-user-2',
    author: {
      id: 'mock-user-2',
      fullName: 'María González',
      avatarUrl: null,
      headline: 'Instructora de Programación'
    },
    content: 'Recordatorio: La sesión de hoy sobre Node.js será a las 6pm. ¡Nos vemos!',
    mediaUrl: null,
    tags: ['nodejs', 'session', 'reminder'],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    reactionCount: 7,
    commentCount: 2,
    shareCount: 1,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 7 }
    ]
  },
  {
    id: 'mock-post-8',
    authorId: 'mock-user-6',
    author: {
      id: 'mock-user-6',
      fullName: 'Sofia Ramírez',
      avatarUrl: null,
      headline: 'Estudiante de Ingeniería'
    },
    content: '¿Alguien más está trabajando en desarrollo móvil? Me gustaría formar un grupo de estudio.',
    mediaUrl: null,
    tags: ['mobile', 'study-group', 'collaboration'],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    reactionCount: 5,
    commentCount: 3,
    shareCount: 0,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 4 },
      { type: 'support', count: 1 }
    ]
  },
  {
    id: 'mock-post-9',
    authorId: 'mock-user-1',
    author: {
      id: 'mock-user-1',
      fullName: 'Carlos Rodríguez',
      avatarUrl: null,
      headline: 'Desarrollador Full Stack'
    },
    content: 'Compartiendo mi experiencia con TypeScript. Los tipos realmente ayudan a evitar errores.',
    mediaUrl: null,
    tags: ['typescript', 'programming', 'tips'],
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(12),
    reactionCount: 10,
    commentCount: 4,
    shareCount: 2,
    viewerReaction: 'insightful',
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'insightful', count: 6 },
      { type: 'like', count: 4 }
    ]
  },
  {
    id: 'mock-post-10',
    authorId: 'mock-user-8',
    author: {
      id: 'mock-user-8',
      fullName: 'Camila Torres',
      avatarUrl: null,
      headline: 'Instructora de Base de Datos'
    },
    content: 'Nuevo material sobre normalización de bases de datos disponible en la biblioteca.',
    mediaUrl: null,
    tags: ['database', 'normalization', 'library'],
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
    reactionCount: 3,
    commentCount: 1,
    shareCount: 0,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 3 }
    ]
  },
  {
    id: 'mock-post-11',
    authorId: 'mock-user-4',
    author: {
      id: 'mock-user-4',
      fullName: 'Laura Sánchez',
      avatarUrl: null,
      headline: 'Diseñadora UX/UI'
    },
    content: 'Diseñando una nueva interfaz para el proyecto. ¿Qué opinan del esquema de colores?',
    mediaUrl: null,
    tags: ['design', 'ui', 'colors'],
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
    reactionCount: 8,
    commentCount: 5,
    shareCount: 1,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 5 },
      { type: 'love', count: 3 }
    ]
  },
  {
    id: 'mock-post-12',
    authorId: 'mock-user-5',
    author: {
      id: 'mock-user-5',
      fullName: 'Diego López',
      avatarUrl: null,
      headline: 'Backend Developer'
    },
    content: 'Terminé de implementar la API REST. Ahora voy a documentarla con Swagger.',
    mediaUrl: null,
    tags: ['api', 'rest', 'swagger', 'backend'],
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
    reactionCount: 6,
    commentCount: 2,
    shareCount: 0,
    viewerReaction: null,
    isSaved: false,
    latestComments: [],
    reactionBreakdown: [
      { type: 'like', count: 4 },
      { type: 'celebrate', count: 2 }
    ]
  }
];

const mockComments: FeedComment[] = [
  {
    id: 'mock-comment-1',
    postId: 'mock-post-1',
    userId: 'mock-user-1',
    content: 'Excelente tutorial! Me ayudó mucho',
    attachmentUrl: null,
    createdAt: daysAgo(5),
    author: {
      id: 'mock-user-1',
      fullName: 'Carlos Rodríguez',
      avatarUrl: null,
      headline: 'Desarrollador Full Stack'
    }
  },
  {
    id: 'mock-comment-2',
    postId: 'mock-post-1',
    userId: 'mock-user-3',
    content: 'Gracias por compartir, lo voy a revisar',
    attachmentUrl: null,
    createdAt: daysAgo(4),
    author: {
      id: 'mock-user-3',
      fullName: 'Andrés Martínez',
      avatarUrl: null,
      headline: 'Estudiante de Desarrollo'
    }
  },
  {
    id: 'mock-comment-3',
    postId: 'mock-post-2',
    userId: 'mock-user-2',
    content: '¡Felicidades! Sigue así',
    attachmentUrl: null,
    createdAt: daysAgo(4),
    author: {
      id: 'mock-user-2',
      fullName: 'María González',
      avatarUrl: null,
      headline: 'Instructora de Programación'
    }
  }
];

// Simular delay para realismo
const delay = (ms: number = 100): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Mapa de relaciones: usuario actual -> sus grupos
const userGroupsMap: Record<string, string[]> = {
  'mock-user-1': ['mock-group-1', 'mock-group-3'],
  'mock-user-2': ['mock-group-1'],
  'mock-user-3': ['mock-group-1'],
  'mock-user-4': ['mock-group-1'],
  'mock-user-5': ['mock-group-2'],
  'mock-user-6': ['mock-group-3'],
  'mock-user-7': ['mock-group-1', 'mock-group-2', 'mock-group-3'],
  'mock-user-8': ['mock-group-2']
};

// Mapa de relaciones: chat -> miembros
const chatMembersMap: Record<string, string[]> = {
  'mock-chat-1': ['mock-user-1', 'mock-user-2'],
  'mock-chat-2': ['mock-user-1', 'mock-user-3'],
  'mock-chat-3': ['mock-user-1', 'mock-user-3', 'mock-user-5'],
  'mock-chat-4': ['mock-user-1', 'mock-user-4'],
  'mock-chat-5': ['mock-user-2', 'mock-user-1', 'mock-user-3', 'mock-user-6']
};

// Mapa de relaciones: usuario -> amigos
const userFriendsMap: Record<string, string[]> = {
  'mock-user-1': ['mock-user-2', 'mock-user-3', 'mock-user-4'],
  'mock-user-2': ['mock-user-1', 'mock-user-8'],
  'mock-user-3': ['mock-user-1', 'mock-user-5'],
  'mock-user-4': ['mock-user-1', 'mock-user-6'],
  'mock-user-5': ['mock-user-3', 'mock-user-8'],
  'mock-user-6': ['mock-user-4'],
  'mock-user-7': ['mock-user-1', 'mock-user-2', 'mock-user-8'],
  'mock-user-8': ['mock-user-2', 'mock-user-5']
};

export const mockDataService = {
  // Obtener usuario actual (simulado)
  getCurrentUserId(): string {
    // Intentar obtener el usuario del storage
    try {
      const user = storage.getUser<{ id: string }>();
      if (user?.id) {
        // Si el usuario tiene un ID que coincide con un usuario mock, usarlo
        if (mockUsers.some((u) => u.id === user.id)) {
          return user.id;
        }
      }
    } catch {
      // Si hay error, usar el usuario por defecto
    }
    // Por defecto, usar el primer usuario como "actual"
    return 'mock-user-1';
  },

  // Obtener todos los usuarios
  async getAllUsers(): Promise<Profile[]> {
    await delay(150);
    return [...mockUsers];
  },

  // Obtener usuario por ID
  async getUserById(id: string): Promise<Profile | null> {
    await delay(100);
    return mockUsers.find((u) => u.id === id) ?? null;
  },

  // Obtener todos los grupos
  async getAllGroups(): Promise<Group[]> {
    await delay(120);
    return [...mockGroups];
  },

  // Obtener grupos del usuario actual
  async getMyGroups(userId?: string): Promise<Group[]> {
    await delay(120);
    const currentUserId = userId ?? this.getCurrentUserId();
    const groupIds = userGroupsMap[currentUserId] ?? [];
    return mockGroups.filter((g) => groupIds.includes(g.id));
  },

  // Obtener grupo por ID
  async getGroupById(id: string): Promise<Group | null> {
    await delay(100);
    return mockGroups.find((g) => g.id === id) ?? null;
  },

  // Obtener canales de una comunidad
  async getChannels(communityId: string): Promise<Channel[]> {
    await delay(100);
    return mockChannels.filter((c) => c.communityId === communityId);
  },

  // Actualizar canal (mock)
  async updateChannel(channelId: string, payload: { name?: string; description?: string | null; type?: 'text' | 'voice'; position?: number }): Promise<Channel> {
    await delay(100);
    const channel = mockChannels.find((c) => c.id === channelId);
    if (!channel) {
      throw new Error('Canal no encontrado');
    }
    if (payload.name !== undefined) channel.name = payload.name;
    if (payload.description !== undefined) channel.description = payload.description ?? undefined;
    if (payload.type !== undefined) channel.type = payload.type;
    if (payload.position !== undefined) channel.position = payload.position;
    return channel;
  },

  // Obtener mensajes de un canal
  async getChannelMessages(channelId: string): Promise<ChannelMessage[]> {
    await delay(120);
    const msgs = mockChannelMessages.filter((m) => m.channelId === channelId);
    const currentUserId = this.getCurrentUserId();
    return msgs
      .map((m) => ({
        ...m,
        isPinned: mockPinnedMessageIds.has(m.id),
        viewerStarred: mockStarredMessageIds.has(`${m.id}:${currentUserId}`)
      }))
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  },

  // Alternar destacar de mensaje (mock)
  async toggleStarMessage(messageId: string): Promise<{ starred: boolean }> {
    await delay(100);
    const message = mockChannelMessages.find((m) => m.id === messageId);
    if (!message) throw new Error('Mensaje no encontrado');
    const key = `${messageId}:${this.getCurrentUserId()}`;
    const starred = mockStarredMessageIds.has(key);
    if (starred) {
      mockStarredMessageIds.delete(key);
      return { starred: false };
    } else {
      mockStarredMessageIds.add(key);
      return { starred: true };
    }
  },

  // Alternar fijado de mensaje (mock)
  async togglePinMessage(messageId: string): Promise<ChannelMessage> {
    await delay(100);
    const message = mockChannelMessages.find((m) => m.id === messageId);
    if (!message) throw new Error('Mensaje no encontrado');
    const otherInChannel = mockChannelMessages.filter((m) => m.channelId === message.channelId && m.id !== messageId);
    if (mockPinnedMessageIds.has(messageId)) {
      mockPinnedMessageIds.delete(messageId);
    } else {
      otherInChannel.forEach((m) => mockPinnedMessageIds.delete(m.id));
      mockPinnedMessageIds.add(messageId);
    }
    return { ...message, isPinned: mockPinnedMessageIds.has(messageId) };
  },

  // Obtener todos los chats
  async getAllChats(userId?: string): Promise<Chat[]> {
    await delay(150);
    const currentUserId = userId ?? this.getCurrentUserId();
    // Filtrar chats donde el usuario es miembro
    return mockChats
      .filter((chat) => {
        const members = chatMembersMap[chat.id] ?? [];
        return members.includes(currentUserId);
      })
      .map((chat) => {
        if (chat.isGroup) return { ...chat, peer: undefined };
        const members = chatMembersMap[chat.id] ?? [];
        const otherId = members.find((id) => id !== currentUserId);
        const other = otherId ? mockUsers.find((u) => u.id === otherId) : undefined;
        if (!other) return { ...chat };
        return {
          ...chat,
          peer: {
            id: other.id,
            firstName: other.firstName,
            lastName: other.lastName,
            avatarUrl: other.avatarUrl ?? null
          }
        };
      });
  },

  // Obtener mensajes de un chat
  async getChatMessages(chatId: string): Promise<Message[]> {
    await delay(120);
    return mockMessages.filter((m) => m.chatId === chatId);
  },

  // Obtener todas las publicaciones
  async getAllPosts(): Promise<FeedPostAggregate[]> {
    await delay(150);
    return [...mockPosts];
  },

  // Obtener comentarios de una publicación
  async getPostComments(postId: string): Promise<FeedComment[]> {
    await delay(100);
    return mockComments.filter((c) => c.postId === postId);
  },

  // Obtener reacciones de una publicación
  async getPostReactions(postId: string): Promise<FeedPostReactionUser[]> {
    await delay(100);
    const post = mockPosts.find((p) => p.id === postId);
    if (!post || post.reactionCount <= 0) {
      return [];
    }

    const usersPool = mockUsers.filter((user) => user.id !== post.authorId);
    if (usersPool.length === 0) return [];

    const reactionSequence: ReactionType[] = [];
    if (post.reactionBreakdown?.length) {
      post.reactionBreakdown.forEach((entry) => {
        for (let i = 0; i < entry.count; i += 1) {
          reactionSequence.push(entry.type);
        }
      });
    }
    while (reactionSequence.length < post.reactionCount) {
      reactionSequence.push('like');
    }

    const result: FeedPostReactionUser[] = [];
    for (let i = 0; i < post.reactionCount; i += 1) {
      const user = usersPool[i % usersPool.length];
      result.push({
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        avatarUrl: user.avatarUrl ?? null,
        reactionType: reactionSequence[i] ?? 'like',
        reactedAt: minutesAgo(5 + i * 3)
      });
    }

    return result;
  },

  // Obtener amigos del usuario actual
  async getFriends(userId?: string): Promise<Profile[]> {
    await delay(120);
    const currentUserId = userId ?? this.getCurrentUserId();
    const friendIds = userFriendsMap[currentUserId] ?? [];
    return mockUsers.filter((u) => friendIds.includes(u.id));
  }
};

