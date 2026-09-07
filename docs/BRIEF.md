# BRIEF DEL PROYECTO: STRUDEL LOCAL

## 1. OBJETIVO DEL PROYECTO
El proyecto Strudel Local tiene como proposito implementar una solucion de live coding musical basada en el ecosistema Strudel, operable de manera completamente autonoma y sin conexion a internet, bajo una arquitectura de ejecucion dual:
1. Extension para Antigravity IDE / VS Code (.vsix): Integrada directamente en el editor con soporte para paneles Webview y atajos de evaluacion.
2. Modulo Local Standalone: Ejecucion desacoplada como aplicacion web local servida por Node.js para sesiones de directo o uso independiente.

El frontend de ambas modalidades se basa estrictamente en el componente oficial Strudel REPL (@strudel/repl).

---

## 2. REQUISITOS TECNICOS Y OPERATIVOS

### 2.1. Dualidad y Paridad Funcional
- Tanto el Webview de la extension como la SPA standalone deben presentar el mismo editor CodeMirror 6, los mismos atajos de teclado y la misma fidelidad de audio.
- El Webview se comunica bidireccionalmente con el Extension Host mediante `acquireVsCodeApi().postMessage` para sincronizar selecciones y estados del editor.

### 2.2. Aislamiento Offline-First Estricto
- Queda prohibida la realizacion de peticiones HTTP a servidores externos o CDNs durante la evaluacion, inicializacion o reproduccion.
- Todos los assets (scripts, hojas de estilo, fuentes, workers, samples y soundfonts) deben estar incluidos en el bundle local.

### 2.3. Aislamiento Upstream vs Extensiones
- El nucleo upstream de Strudel reside en `src/baseline/` y se actualiza de manera no destructiva.
- Las extensiones personalizadas residen en `src/plugins/` y se registran dinamicamente a traves de hooks.

### 2.4. Protocolo MCP con Transporte Exclusivo stdio
- Toda herramienta de soporte para agentes en Antigravity IDE debe ejecutarse sobre tuberias estandar (`stdio`), garantizando cero sockets de red abiertos.

---

## 3. CRITERIOS DE ACEPTACION

1. Gobernanza Tecnica: Directorio `.agent/` configurado con `AGENT.md`, habilidades operativas y flujos de trabajo detallados.
2. Limpieza de Red: Al ejecutar `npm run ports:check`, no deben existir procesos en background escuchando en puertos del proyecto tras finalizar cualquier comando o prueba.
3. Estandarizacion NPM: Todas las operaciones del ciclo de vida deben poder ejecutarse mediante comandos registrados en `package.json`.
4. Validacion Determinista: El comando `npm run test:repl` y `npm run test:offline` deben pasar satisfactoriamente en entorno headless.
5. Cero Emojis: Cero emojis en codigo, mensajes de commit, documentacion y respuestas.
