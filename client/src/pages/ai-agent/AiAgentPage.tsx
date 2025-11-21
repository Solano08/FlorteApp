import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Volume2,
  VolumeX,
  Loader2,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import classNames from 'classnames';
import {
  sendTextMessage,
  sendImageMessage,
  ChatMessage,
  imageToBase64
} from '../../services/aiAgentService';

export const AiAgentPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Speech Recognition (STT)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Función para leer texto en voz alta (TTS)
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech Synthesis no está disponible');
      return;
    }

    // Cancelar cualquier síntesis anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Detener síntesis de voz
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Iniciar/detener grabación de voz
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz no está disponible en tu navegador.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
        setIsRecording(false);
      }
    }
  };

  // Manejar selección de imagen
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    setSelectedImage(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remover imagen seleccionada
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;
    if (isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim() || (selectedImage ? 'Analiza esta imagen' : ''),
      imageData: selectedImage ? await imageToBase64(selectedImage) : undefined,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let response;

      if (selectedImage) {
        // Usar modelo Pro para análisis de imágenes
        const imageBase64 = await imageToBase64(selectedImage);
        const mimeType = selectedImage.type;
        response = await sendImageMessage(
          inputMessage.trim() || '¿Qué puedes ver en esta imagen? Describe lo que observas.',
          imageBase64,
          mimeType
        );
        removeImage();
      } else {
        // Usar modelo Flash para chat rápido
        response = await sendTextMessage(inputMessage.trim(), messages);
      }

      const assistantMessage: ChatMessage = {
        role: 'model',
        content: response.text,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Reproducir respuesta automáticamente si está habilitado
      if (autoSpeak && response.text) {
        speakText(response.text);
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: `Error: ${error.message || 'No se pudo procesar tu mensaje. Por favor intenta de nuevo.'}`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar Enter para enviar
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Limpiar conversación
  const clearConversation = () => {
    setMessages([]);
    stopSpeaking();
  };

  return (
    <DashboardLayout
      title="Asistente Virtual AI"
      subtitle="Conversa con inteligencia artificial, analiza imágenes y usa comandos de voz."
    >
      <div className="flex min-h-[75vh] flex-col gap-5">
        <Card
          padded={false}
          className="relative flex min-h-[75vh] flex-col overflow-hidden rounded-[36px] border-white/25 bg-white/25 shadow-[0_44px_110px_rgba(15,38,25,0.32)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.55),_transparent_55%)] opacity-75 dark:opacity-30" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/18 dark:from-white/8 dark:via-white/5 dark:to-white/10" />

          <div className="relative z-10 flex h-full flex-col">
            {/* Header */}
            <header className="flex items-center justify-between gap-4 border-b border-white/15 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/90 to-emerald-400/80 text-base font-semibold text-white shadow-[0_16px_30px_rgba(18,55,29,0.25)]">
                  <Sparkles className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">Asistente AI Gemini</h3>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {messages.length > 0
                      ? `${messages.length} mensaje${messages.length !== 1 ? 's' : ''} en la conversación`
                      : 'Inicia una conversación para comenzar'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={classNames(
                    'flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-[var(--color-text)] transition hover:border-sena-green/60 hover:text-sena-green',
                    autoSpeak && 'border-sena-green/60 text-sena-green'
                  )}
                  aria-label={autoSpeak ? 'Desactivar voz automática' : 'Activar voz automática'}
                  title={autoSpeak ? 'Desactivar voz automática' : 'Activar voz automática'}
                >
                  {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-red-400/60 bg-red-400/15 text-red-400 transition hover:bg-red-400/25"
                    aria-label="Detener reproducción"
                  >
                    <VolumeX className="h-4 w-4" />
                  </button>
                )}
                {messages.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearConversation}
                    className="px-3 text-[11px]"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </header>

            {/* Mensajes */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-6 py-5"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-5">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-white/12 px-6 py-8 text-center shadow-[0_28px_64px_rgba(18,55,29,0.22)] dark:bg-white/10">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/90 to-emerald-400/80 text-2xl font-semibold text-white shadow-[0_22px_44px_rgba(18,55,29,0.24)]">
                      <Bot className="h-10 w-10" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">Asistente Virtual AI</p>
                      <p className="text-xs text-[var(--color-muted)]">Powered by Google Gemini</p>
                    </div>
                    <p className="max-w-xl text-xs text-[var(--color-muted)]">
                      Puedes conversar conmigo, subir imágenes para que las analice, o usar comandos de voz.
                      ¡Estoy aquí para ayudarte!
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const timestamp = message.timestamp.toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={index}
                        className={classNames('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                      >
                        {!isUser && (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/90 to-emerald-400/80 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(18,55,29,0.20)]">
                            <Bot className="h-4 w-4" />
                          </span>
                        )}
                        <div
                          className={classNames(
                            'flex max-w-[80%] flex-col gap-2 rounded-3xl px-4 py-3 text-sm shadow-[0_18px_32px_rgba(18,55,29,0.20)] transition-colors',
                            isUser
                              ? 'bg-sena-green/95 text-white'
                              : 'bg-white/16 text-[var(--color-text)] dark:bg-white/12'
                          )}
                        >
                          {message.imageData && (
                            <div className="mb-2 rounded-2xl overflow-hidden">
                              <img
                                src={`data:image/jpeg;base64,${message.imageData}`}
                                alt="Imagen enviada"
                                className="max-w-full h-auto"
                              />
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={classNames(
                                'text-[10px]',
                                isUser ? 'text-white/70' : 'text-[var(--color-muted)]'
                              )}
                            >
                              {timestamp}
                            </p>
                            {!isUser && (
                              <button
                                type="button"
                                onClick={() => speakText(message.content)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[var(--color-text)] transition hover:bg-white/30"
                                aria-label="Reproducir mensaje"
                                title="Reproducir mensaje"
                              >
                                <Volume2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {isUser && (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/90 to-cyan-400/80 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(18,55,29,0.20)]">
                            <User className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sena-green/90 to-emerald-400/80 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(18,55,29,0.20)]">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div className="flex items-center gap-2 rounded-3xl bg-white/16 px-4 py-3 text-sm text-[var(--color-text)] dark:bg-white/12">
                      <Loader2 className="h-4 w-4 animate-spin text-sena-green" />
                      <span className="text-[var(--color-muted)]">Pensando...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <form
              className="border-t border-white/15 bg-white/10 px-6 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-xl object-cover border border-white/25"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-400 text-white shadow-lg transition hover:bg-red-500"
                      aria-label="Remover imagen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    {selectedImage?.name} ({(selectedImage?.size ?? 0) / 1024} KB)
                  </p>
                </div>
              )}
              <div className="flex items-end gap-3">
                <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/12 text-[var(--color-muted)] transition hover:text-sena-green">
                  <ImageIcon className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    aria-label="Subir imagen"
                  />
                </label>
                <div className="flex-1 rounded-[26px] border border-white/20 bg-white/15 px-4 py-2.5 shadow-[0_16px_32px_rgba(18,55,29,0.18)] focus-within:border-sena-green focus-within:ring-2 focus-within:ring-sena-green/30">
                  <textarea
                    rows={2}
                    placeholder="Escribe un mensaje o usa el micrófono..."
                    className="w-full resize-none bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={classNames(
                    'flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/12 text-[var(--color-muted)] transition',
                    isRecording
                      ? 'border-red-400 bg-red-400/20 text-red-400 animate-pulse'
                      : 'hover:text-sena-green'
                  )}
                  aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación de voz'}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                  loading={isLoading}
                  className="h-11 w-11 rounded-xl px-0 text-[11px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

