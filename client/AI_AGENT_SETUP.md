# Configuración del Módulo AI Agent

Este documento explica cómo configurar el módulo **AiAgentModule** que utiliza Google Gemini API.

## Dependencias

El módulo requiere la siguiente dependencia:

```bash
npm install @google/generative-ai
```

## Configuración de Variables de Entorno

### 1. Obtener API Key de Google Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API Key
4. Copia la clave generada

### 2. Configurar en el Cliente (Frontend)

Crea un archivo `.env` en la raíz del directorio `client/` (si no existe) y agrega:

```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

**Importante:**
- El prefijo `VITE_` es necesario para que Vite exponga la variable al código del cliente
- **NUNCA** subas el archivo `.env` con tu API key al repositorio
- Asegúrate de que `.env` esté en tu `.gitignore`

### 3. Reiniciar el Servidor de Desarrollo

Después de agregar la variable de entorno, reinicia el servidor de desarrollo:

```bash
cd client
npm run dev
```

## Funcionalidades

### 1. Chat de Texto
- Conversación fluida con historial de contexto
- Usa el modelo `gemini-1.5-flash` para respuestas rápidas

### 2. Análisis de Imágenes (Multimodal)
- Sube imágenes haciendo clic en el botón de imagen
- El agente analiza la imagen usando el modelo `gemini-1.5-pro`
- Puedes hacer preguntas sobre la imagen

### 3. Entrada por Voz (STT - Speech-to-Text)
- Haz clic en el botón de micrófono para hablar
- El navegador transcribe tu voz a texto automáticamente
- Requiere un navegador compatible con Web Speech API (Chrome, Edge, Safari)

### 4. Salida por Voz (TTS - Text-to-Speech)
- Las respuestas se leen automáticamente si está habilitado
- Puedes activar/desactivar la voz automática con el botón de volumen
- Puedes reproducir cualquier mensaje del asistente haciendo clic en el icono de volumen

## Navegación

El módulo está disponible en la ruta `/ai-agent` y aparece en el menú de navegación principal con el icono de "AI Agent".

## Solución de Problemas

### Error: "Google Gemini API no está configurada"
- Verifica que `VITE_GEMINI_API_KEY` esté en tu archivo `.env`
- Asegúrate de haber reiniciado el servidor de desarrollo
- Verifica que la API key sea válida

### El reconocimiento de voz no funciona
- Asegúrate de usar un navegador compatible (Chrome, Edge, Safari)
- Verifica que tengas permisos de micrófono en tu navegador
- Algunos navegadores requieren HTTPS para la Web Speech API

### Las imágenes no se analizan
- Verifica que el archivo sea una imagen válida (JPG, PNG, etc.)
- Asegúrate de que la API key tenga permisos para usar el modelo Pro
- Revisa la consola del navegador para ver errores específicos

## Modelos Utilizados

- **gemini-1.5-flash**: Para chat de texto y voz (baja latencia)
- **gemini-1.5-pro**: Para análisis profundo de imágenes

## Seguridad

⚠️ **Importante**: La API key se usa directamente en el cliente. Para producción, considera:
- Usar un proxy/backend para ocultar la API key
- Implementar rate limiting
- Monitorear el uso de la API

