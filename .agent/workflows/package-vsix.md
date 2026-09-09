# WORKFLOW: PACKAGE VSIX EXTENSION

## OBJETIVO
Compilar los recursos del frontend Webview basados en Strudel REPL, generar el bundle del backend de la extension para Antigravity IDE / VS Code y empaquetar el artefacto distribuible `.vsix`.

## PASOS DE EJECUCION

### Paso 1: Auditoria Previa de Documentacion
Auditar que los cambios tecnicos esten reflejados en docs/ (Regla de Oro 4 y 7):
- `docs/ARCHITECTURE.md`
- `docs/PACKAGING.md`
- `docs/FEATURES.md`

### Paso 2: Compilacion de Componentes
Ejecutar la compilacion integral del sistema:
```bash
npm run build
```
Esto incluye:
1. `npm run build:repl`: Empaqueta Strudel REPL con CodeMirror y extensiones modulares.
2. `npm run build:extension`: Compila el extension host de Antigravity IDE.
3. `npm run build:standalone`: Empaqueta la distribucion local offline.

### Paso 3: Validacion de Pruebas Unitarias y Offline
```bash
npm run test:repl
npm run test:offline
```

### Paso 4: Empaquetado VSIX en release/
Generar y verificar el paquete .vsix dentro del directorio `release/`:
```bash
npm run package:vsix
```

### Paso 5: Instalacion en Antigravity IDE
Instalar el paquete empaquetado directamente en Antigravity IDE:
```bash
npm run install:ide
```

### Paso 6: Verificacion de Recursos
Comprobar que el archivo `release/strudel-local-0.1.0.vsix` contenga unicamente referencias locales a scripts, estilos y fuentes, sin dependencias remotas por red.
