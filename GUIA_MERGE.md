# Guía: Cómo hacer merges correctamente y evitar errores

## Problema común: Archivo de swap de Vim

### ¿Qué es un archivo de swap?
Cuando Vim edita un archivo, crea un archivo `.swp` temporal. Si Vim se cierra de forma inesperada (Ctrl+C, cerrar terminal, crash), este archivo puede quedar bloqueando futuras ediciones.

### Cómo evitarlo:

1. **Siempre cierra Vim correctamente:**
   ```bash
   # En lugar de Ctrl+C, usa:
   :q        # Salir sin guardar
   :wq       # Guardar y salir
   :x        # Guardar y salir (solo si hay cambios)
   ```

2. **Configura Git para usar otro editor:**
   ```bash
   # Usar VS Code
   git config --global core.editor "code --wait"
   
   # Usar nano (más simple)
   git config --global core.editor "nano"
   
   # Ver editor actual
   git config --global core.editor
   ```

3. **Si aparece el error del swap:**
   ```bash
   # Opción 1: Presiona 'D' cuando Vim lo pregunte
   # Opción 2: Elimina manualmente el swap
   Remove-Item ".git\.MERGE_MSG.swp" -Force
   ```

## Proceso correcto para hacer merge

### Paso 1: Actualiza tu rama local antes de mergear
```bash
# Cambia a la rama que recibirá el merge (Test)
git checkout Test

# Actualiza desde el remoto
git fetch origin
git pull origin Test
```

### Paso 2: Mergea la rama Solano en Test
```bash
git merge Solano
```

### Paso 3: Si hay conflictos
```bash
# Git te mostrará qué archivos tienen conflictos
git status

# Edita los archivos con conflictos
# Busca las marcas: <<<<<<< HEAD, =======, >>>>>>>

# Después de resolver:
git add archivo_resuelto.tsx
git status  # Verifica que dice "All conflicts fixed"
```

### Paso 4: Completa el merge
```bash
# Opción 1: Editar el mensaje de merge
git commit

# Opción 2: Usar el mensaje por defecto
git commit --no-edit

# Opción 3: Si ya estás en el editor y quieres salir:
# Presiona Esc, luego escribe :wq y Enter
```

### Paso 5: Verifica y sube
```bash
# Verifica que todo esté bien
git status
git log --oneline --graph -5

# Sube los cambios
git push origin Test
```

## Abortar un merge si algo sale mal

Si necesitas cancelar un merge en progreso:
```bash
# Antes de hacer commit:
git merge --abort

# Esto vuelve todo al estado anterior al merge
```

## Buenas prácticas

### ✅ HACER:
1. **Siempre actualiza antes de mergear:**
   ```bash
   git checkout Test
   git pull origin Test
   git merge Solano
   ```

2. **Revisa los cambios antes de mergear:**
   ```bash
   git log Test..Solano  # Ver commits que se van a mergear
   git diff Test..Solano # Ver cambios que se van a mergear
   ```

3. **Resuelve conflictos completamente antes de commitear:**
   ```bash
   # Asegúrate de que dice "All conflicts fixed"
   git status
   ```

4. **Usa mensajes de commit descriptivos:**
   ```bash
   git commit -m "Merge branch 'Solano' into Test: actualización de estilos y componentes UI"
   ```

### ❌ NO HACER:
1. ❌ No cierres Vim con Ctrl+C durante un merge
2. ❌ No hagas commit si hay conflictos sin resolver
3. ❌ No ignores el mensaje de "All conflicts fixed but you are still merging"
4. ❌ No subas un merge incompleto al remoto

## Flujo visual recomendado

```
Test (local) ────fetch/pull───> origin/Test (remoto)
    │
    │ merge Solano
    │
    ▼
Resolver conflictos (si hay)
    │
    ▼
git add <archivos>
    │
    ▼
git commit
    │
    ▼
git push origin Test
```

## Comandos útiles de diagnóstico

```bash
# Ver estado actual
git status

# Ver qué archivos tienen conflictos
git status | grep "both modified"

# Ver el historial de merges
git log --oneline --graph --all -10

# Ver diferencias entre ramas
git diff Test..Solano

# Ver qué commits están en Solano pero no en Test
git log Test..Solano

# Limpiar archivos de swap de Vim
Get-ChildItem -Path .git -Filter "*.swp" -Recurse | Remove-Item -Force
```

## Resumen del problema que tuviste

1. **Causa:** Vim se cerró incorrectamente, dejando un archivo `.swp` que bloqueó el editor
2. **Síntoma:** "Swap file already exists" cuando Git intentaba abrir el editor para el mensaje de merge
3. **Solución:** Eliminar el archivo `.swp` y completar el merge con `git commit --no-edit`
4. **Prevención:** Usar `--no-edit`, configurar otro editor, o cerrar Vim correctamente

