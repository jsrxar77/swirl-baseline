# WORKFLOW: RUN LOCAL STANDALONE

## OBJETIVO
Ejecutar, probar y validar localmente el entorno interactivo Strudel REPL en modo standalone offline, asegurando que todos los assets se sirvan localmente y que el servidor se detenga inmediatamente tras la verificacion.

## PROTOCOLO DE LIBERACION PREVIA
Antes de iniciar cualquier ejecucion, auditar puertos para prevenir errores EADDRINUSE:
```bash
npm run ports:check
```
Si el puerto 3000 esta ocupado:
```bash
npm run ports:clean
```

## PASOS DE EJECUCION

### Paso 1: Construir Bundle Standalone
Compilar los recursos del REPL y empaquetar la composicion de extensiones:
```bash
npm run build:standalone
```

### Paso 2: Ejecucion y Prueba de Aislamiento
Probar el servidor local por CLI sin abrir navegadores (Regla de Oro 5):
```bash
node scripts/test-offline.js
```

### Paso 3: Limpieza Inmediata de Proceso y Puerto
Finalizar cualquier instancia residual del servidor:
```bash
npm run ports:clean
```

### Paso 4: Confirmacion de Estado Limpio
Confirmar que el puerto 3000 y 8080 esten libres:
```bash
npm run ports:check
```
