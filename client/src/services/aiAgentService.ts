import { GoogleGenerativeAI } from '@google/generative-ai';

// Extender tipos de Window para SpeechRecognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('[aiAgentService] VITE_GEMINI_API_KEY no está configurada');
} else {
  console.log('[aiAgentService] Google Gemini API configurada correctamente');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Modelo rápido para chat y análisis de imágenes
const FLASH_MODEL = 'gemini-2.5-flash';
// Modelo para conversación en tiempo real (audio)
const AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageData?: string; // Base64 image data
  timestamp: Date;
}

export interface ChatResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Convierte una imagen File a base64
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remover el prefijo data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Envía un mensaje de texto al modelo Flash (rápido)
 */
export const sendTextMessage = async (
  message: string,
  history: ChatMessage[] = []
): Promise<ChatResponse> => {
  if (!genAI) {
    throw new Error('Google Gemini API no está configurada. Verifica VITE_GEMINI_API_KEY.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: FLASH_MODEL });

    // Convertir historial al formato de Gemini (solo mensajes de texto, sin imágenes)
    const formattedHistory = history
      .filter((msg) => !msg.imageData) // Filtrar mensajes con imágenes
      .slice(0, -1) // Excluir el último mensaje (el actual que se enviará)
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    const chat = model.startChat({
      history: formattedHistory as any,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      usage: {
        promptTokens: result.usageMetadata?.promptTokenCount,
        candidatesTokens: result.usageMetadata?.candidatesTokenCount,
        totalTokens: result.usageMetadata?.totalTokenCount
      }
    };
  } catch (error) {
    console.error('[aiAgentService] Error en sendTextMessage:', error);
    throw error;
  }
};

/**
 * Envía un mensaje con imagen al modelo Flash (análisis de imágenes)
 */
export const sendImageMessage = async (
  message: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ChatResponse> => {
  if (!genAI) {
    throw new Error('Google Gemini API no está configurada. Verifica VITE_GEMINI_API_KEY.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: FLASH_MODEL });

    const result = await model.generateContent([
      {
        text: message || '¿Qué puedes ver en esta imagen? Describe lo que observas.'
      },
      {
        inlineData: {
          data: imageBase64,
          mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    return {
      text,
      usage: {
        promptTokens: result.usageMetadata?.promptTokenCount,
        candidatesTokens: result.usageMetadata?.candidatesTokenCount,
        totalTokens: result.usageMetadata?.totalTokenCount
      }
    };
  } catch (error) {
    console.error('[aiAgentService] Error en sendImageMessage:', error);
    throw error;
  }
};

/**
 * Verifica si la API está configurada
 */
export const isApiConfigured = (): boolean => {
  return Boolean(API_KEY);
};

