# Modo de Datos Mock

Este proyecto incluye un sistema de datos mock para desarrollo y demostración sin necesidad de un backend activo.

## Activación

Para activar el modo mock, crea un archivo `.env.local` en el directorio `client/` con el siguiente contenido:

```
VITE_USE_MOCK_DATA=true
```

## Desactivación

Para desactivar el modo mock y usar el backend real:

1. Elimina la variable `VITE_USE_MOCK_DATA` del archivo `.env.local`, o
2. Cambia su valor a `false`:
   ```
   VITE_USE_MOCK_DATA=false
   ```

## Datos Incluidos

El ecosistema mock incluye:

- **8 usuarios** con diferentes roles (apprentice, instructor, admin)
- **3 comunidades** temáticas (Desarrollo Web, Base de Datos, Proyectos Colaborativos)
- **5 chats** (privados y grupales) con mensajes
- **12 publicaciones** con reacciones y comentarios
- **3 canales** (uno por comunidad)
- **Relaciones** entre usuarios (amigos, miembros de comunidades, etc.)

## Notas

- Los datos mock se generan en memoria y no persisten entre recargas
- Las operaciones de escritura (crear, actualizar) se simulan localmente
- Los delays están simulados (100-200ms) para realismo
- El usuario actual se obtiene del storage local si está disponible

## Servicios Afectados

Los siguientes servicios usan datos mock cuando está activo:

- `userService.getAllUsers()`, `getUserById()`
- `groupService.listGroups()`, `listMyGroups()`, `getGroup()`
- `chatService.listChats()`, `listMessages()`
- `feedService.listPosts()`, `listComments()`
- `friendService.listFriends()`
- `channelService.listChannels()`, `listMessages()`

