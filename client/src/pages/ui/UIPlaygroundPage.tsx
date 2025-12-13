import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { GlassDialog } from '../../components/ui/GlassDialog';
import { AvatarUploader } from '../../components/ui/AvatarUploader';
import { EmojiPicker } from '../../components/ui/EmojiPicker';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { NotificationBell } from '../../components/ui/NotificationBell';
import {
  Heart,
  Star,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Plus,
  X,
  Check,
  AlertCircle,
  Info,
  Sparkles,
  Zap,
  Rocket,
  Globe,
  FileText,
  Image,
  Video,
  Music,
  Settings,
  User,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const UIPlaygroundPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSize, setDialogSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setEmojiPickerOpen(false);
  };

  const handleFileSelect = (file: File) => {
    console.log('Archivo seleccionado:', file.name);
  };

  return (
    <DashboardLayout
      title="Playground UX/UI"
      subtitle="Explora y prueba todos los componentes, efectos y elementos visuales de la aplicación"
    >
      <div className="space-y-8 pb-12">
        {/* Sección: Botones */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Botones</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Variantes</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primario</Button>
                <Button variant="secondary">Secundario</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Tamaños</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Pequeño</Button>
                <Button size="md">Mediano</Button>
                <Button size="lg">Grande</Button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Con Iconos</h3>
              <div className="flex flex-wrap gap-4">
                <Button leftIcon={<Plus className="h-4 w-4" />}>Agregar</Button>
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Continuar</Button>
                <Button leftIcon={<Rocket className="h-4 w-4" />} rightIcon={<Sparkles className="h-4 w-4" />}>
                  Lanzar
                </Button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Estados</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Normal</Button>
                <Button loading>Cargando</Button>
                <Button disabled>Deshabilitado</Button>
                <Button fullWidth>Ancho Completo</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Sección: Inputs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Inputs</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Estados Básicos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Input Normal" placeholder="Escribe algo..." />
                <Input label="Input con Valor" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Escribe algo..." />
                <Input label="Input con Hint" hint="Este es un texto de ayuda" placeholder="Escribe algo..." />
                <Input label="Input con Error" error="Este campo es requerido" placeholder="Escribe algo..." />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Tipos de Input</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input type="text" label="Texto" placeholder="Texto normal" />
                <Input type="email" label="Email" placeholder="correo@ejemplo.com" />
                <Input type="password" label="Contraseña" placeholder="••••••••" />
                <Input type="number" label="Número" placeholder="123" />
                <Input type="date" label="Fecha" />
                <div className="relative">
                  <Input type="search" label="Búsqueda" placeholder="Buscar..." />
                  <Search className="absolute right-3 top-9 h-4 w-4 text-[var(--color-muted)]" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Sección: TextArea */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">TextArea</h2>
          
          <Card className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextArea label="TextArea Normal" placeholder="Escribe un mensaje..." rows={4} />
              <TextArea label="TextArea con Valor" value={textareaValue} onChange={(e) => setTextareaValue(e.target.value)} placeholder="Escribe un mensaje..." rows={4} />
              <TextArea label="TextArea con Hint" hint="Máximo 500 caracteres" placeholder="Escribe un mensaje..." rows={4} />
              <TextArea label="TextArea con Error" error="El mensaje es muy corto" placeholder="Escribe un mensaje..." rows={4} />
            </div>
          </Card>
        </section>

        {/* Sección: Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Cards</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Card Básico</h3>
              <p className="text-sm text-[var(--color-muted)]">
                Este es un card básico con contenido simple y padding por defecto.
              </p>
            </Card>

            <Card className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg">
              <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Card Interactivo</h3>
              <p className="text-sm text-[var(--color-muted)]">
                Este card tiene efectos hover y es clickeable.
              </p>
            </Card>

            <Card padded={false} className="overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-sena-green/20 to-emerald-400/20" />
              <div className="p-4">
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Card sin Padding</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Card con contenido personalizado y sin padding automático.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Sección: Badges y Tags */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Badges y Tags</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Badges SENA</h3>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                  <Sparkles className="h-3 w-3" />
                  Activo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sena-green">
                  Aprendiz
                </span>
                <span className="rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold text-sena-green">
                  #Innovación
                </span>
                <span className="rounded-full bg-sena-green/10 px-3 py-1 text-xs font-semibold text-sena-green">
                  #Tecnología
                </span>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Estados</h3>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="h-3 w-3" />
                  Activo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  Pendiente
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <X className="h-3 w-3" />
                  Inactivo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50/60 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Info className="h-3 w-3" />
                  Información
                </span>
              </div>
            </div>
          </Card>
        </section>

        {/* Sección: Efectos Glass */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Efectos Glass (Vidrio)</h2>
          
          <div className="glass-effects-background">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl glass-liquid p-6">
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Glass Liquid</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Efecto de vidrio líquido estándar con blur y saturación.
                </p>
              </div>

              <div className="rounded-2xl glass-liquid-strong p-6">
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Glass Liquid Strong</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Versión más intensa del efecto glass con mayor blur.
                </p>
              </div>

              <div className="rounded-2xl glass-frosted p-6">
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Glass Frosted</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Efecto de vidrio esmerilado con alta opacidad.
                </p>
              </div>

              <div className="rounded-2xl glass-frosted-card p-6">
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Glass Frosted Card</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Variante de card con efecto glass esmerilado.
                </p>
              </div>

              <div className="rounded-[32px] glass-liquid p-6">
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">Glass Liquid (Notification Panel)</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Efecto usado en paneles desplegables como notificaciones, con bordes más redondeados (32px).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Diálogos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Diálogos (Modals)</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Tamaños de Diálogo</h3>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => { setDialogSize('sm'); setDialogOpen(true); }}>
                  Diálogo Pequeño
                </Button>
                <Button onClick={() => { setDialogSize('md'); setDialogOpen(true); }}>
                  Diálogo Mediano
                </Button>
                <Button onClick={() => { setDialogSize('lg'); setDialogOpen(true); }}>
                  Diálogo Grande
                </Button>
                <Button onClick={() => { setDialogSize('xl'); setDialogOpen(true); }}>
                  Diálogo Extra Grande
                </Button>
              </div>
            </div>
          </Card>

          <GlassDialog open={dialogOpen} onClose={() => setDialogOpen(false)} size={dialogSize}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-text)]">Diálogo de Ejemplo</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Este es un diálogo de tamaño {dialogSize} con efecto glass.
                  </p>
                </div>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-white/10"
                >
                  <X className="h-5 w-5 text-[var(--color-text)]" />
                </button>
              </div>
              <p className="text-sm text-[var(--color-text)]">
                Este componente utiliza Framer Motion para animaciones suaves y el efecto glass-liquid
                para un diseño moderno y elegante.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setDialogOpen(false)}>
                  Confirmar
                </Button>
              </div>
            </div>
          </GlassDialog>
        </section>

        {/* Sección: Componentes Especiales */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Componentes Especiales</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Avatar Uploader</h3>
              <div className="flex justify-center">
                <AvatarUploader onSelect={handleFileSelect} />
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Emoji Picker</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedEmoji}</span>
                  <span className="text-sm text-[var(--color-muted)]">Emoji seleccionado</span>
                </div>
                <Button onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}>
                  {emojiPickerOpen ? 'Cerrar' : 'Abrir'} Emoji Picker
                </Button>
                {emojiPickerOpen && (
                  <div className="relative">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setEmojiPickerOpen(false)} />
                  </div>
                )}
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Theme Toggle</h3>
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Notification Bell</h3>
              <div className="flex justify-center">
                <NotificationBell />
              </div>
            </Card>
          </div>
        </section>

        {/* Sección: Iconos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Iconos</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Iconos de Interacción</h3>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
                {[Heart, Star, ThumbsUp, MessageCircle, Share2, Bookmark, Plus, X].map((Icon, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 rounded-xl p-3 glass-liquid transition hover:scale-110">
                    <Icon className="h-6 w-6 text-sena-green" />
                    <span className="text-[10px] text-[var(--color-muted)]">{Icon.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Iconos de Contenido</h3>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
                {[FileText, Image, Video, Music, Globe, Settings, User, Search].map((Icon, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 rounded-xl p-3 glass-liquid transition hover:scale-110">
                    <Icon className="h-6 w-6 text-sena-green" />
                    <span className="text-[10px] text-[var(--color-muted)]">{Icon.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Iconos de Navegación</h3>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
                {[ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Filter, Zap, Rocket, Sparkles].map((Icon, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 rounded-xl p-3 glass-liquid transition hover:scale-110">
                    <Icon className="h-6 w-6 text-sena-green" />
                    <span className="text-[10px] text-[var(--color-muted)]">{Icon.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Sección: Tipografía */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Tipografía</h2>
          
          <Card className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-[var(--color-text)]">Título H1 - 4xl Bold</h1>
              <h2 className="text-3xl font-bold text-[var(--color-text)]">Título H2 - 3xl Bold</h2>
              <h3 className="text-2xl font-semibold text-[var(--color-text)]">Título H3 - 2xl Semibold</h3>
              <h4 className="text-xl font-semibold text-[var(--color-text)]">Título H4 - xl Semibold</h4>
              <h5 className="text-lg font-semibold text-[var(--color-text)]">Título H5 - lg Semibold</h5>
              <h6 className="text-base font-semibold text-[var(--color-text)]">Título H6 - base Semibold</h6>
            </div>

            <div>
              <p className="text-base text-[var(--color-text)]">Texto base - 16px normal</p>
              <p className="text-sm text-[var(--color-text)]">Texto pequeño - 14px normal</p>
              <p className="text-xs text-[var(--color-text)]">Texto extra pequeño - 12px normal</p>
              <p className="text-sm font-medium text-[var(--color-text)]">Texto medium - 14px medium</p>
              <p className="text-sm font-semibold text-[var(--color-text)]">Texto semibold - 14px semibold</p>
              <p className="text-sm font-bold text-[var(--color-text)]">Texto bold - 14px bold</p>
            </div>

            <div>
              <p className="text-sm text-[var(--color-muted)]">Texto muted - Color secundario</p>
              <p className="text-sm text-sena-green">Texto con color SENA - Verde institucional</p>
            </div>
          </Card>
        </section>

        {/* Sección: Colores */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Paleta de Colores</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Colores Principales</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-sena-green" />
                  <p className="text-sm font-semibold text-[var(--color-text)]">SENA Green</p>
                  <p className="text-xs text-[var(--color-muted)]">#39A900</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]" />
                  <p className="text-sm font-semibold text-[var(--color-text)]">Background</p>
                  <p className="text-xs text-[var(--color-muted)]">Variable CSS</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]" />
                  <p className="text-sm font-semibold text-[var(--color-text)]">Surface</p>
                  <p className="text-xs text-[var(--color-muted)]">Variable CSS</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-xl bg-[var(--color-accent-soft)]" />
                  <p className="text-sm font-semibold text-[var(--color-text)]">Accent Soft</p>
                  <p className="text-xs text-[var(--color-muted)]">Variable CSS</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Colores de Texto</h3>
              <div className="space-y-3">
                <div className="rounded-xl glass-liquid p-4">
                  <p className="text-base text-[var(--color-text)]">Texto Principal - var(--color-text)</p>
                </div>
                <div className="rounded-xl glass-liquid p-4">
                  <p className="text-base text-[var(--color-muted)]">Texto Secundario - var(--color-muted)</p>
                </div>
                <div className="rounded-xl glass-liquid p-4">
                  <p className="text-base text-sena-green">Texto SENA - sena-green</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Sección: Animaciones y Efectos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Animaciones y Efectos</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Efectos Hover</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl glass-liquid p-4 text-center transition-all hover:scale-105 hover:shadow-lg">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Scale + Shadow</p>
                </div>
                <div className="rounded-xl glass-liquid p-4 text-center transition-colors hover:bg-sena-green/10">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Color Change</p>
                </div>
                <div className="rounded-xl glass-liquid p-4 text-center transition-transform hover:rotate-2">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Rotate</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Estados de Carga</h3>
              <div className="flex flex-wrap gap-4">
                <Button loading>Cargando...</Button>
                <div className="flex items-center gap-2 rounded-xl glass-liquid px-4 py-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sena-green border-b-transparent" />
                  <span className="text-sm text-[var(--color-text)]">Spinner personalizado</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Sección: Grid y Layout */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Grid y Layout</h2>
          
          <Card className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Grid Responsive</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div key={item} className="rounded-xl glass-liquid p-4 text-center">
                    <p className="text-sm font-semibold text-[var(--color-text)]">Item {item}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
};

