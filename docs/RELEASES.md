# Historial de Versiones Estables de Swirl

Este documento registra cronológicamente cada versión estable producida por el mecanismo de versionado automatizado (`npm run release:bump`).

---

## [0.1.1] - 2026-09-09
- **Versión Display:** `v0.1`
- **Estado:** Estable (Localhost + Electron Runtime)
- **Características Clave:**
  - Resiliencia Offline de Síntesis y Evaluación: Inyección de interceptor HTTP en Webview y Standalone que neutraliza fallas remotas de `raw.githubusercontent.com/*.json` en `prebake()`, evitando congelamiento de audio y recuadros de resaltado de tokens sin tocar `src/baseline/repl/`.
  - Integración Nativa Desktop Electron: Runtime dedicado en `src/electron/main.js` con flags de autoplay y aislamiento de red local (`npm run start:electron`).
  - Alcance Dual Local: Enfoque 100% en Localhost (`http://127.0.0.1:3000/`) y Electron Desktop.
  - Script DevOps Git Commit & Push: Incorporación de `bin/devops-git-commit-push.sh` y comando `npm run git:push` respetando política estricta Zero Emojis.
  - Gobernanza de Arquitectura: Adición de Reglas de Oro 0 y 10 en documentación de agentes y arquitectura.

## [0.1.0] - 2026-09-07
- **Versión Display:** `v0.1`
- **Paquete VSIX:** [`release/swirl-0.1.0.vsix`](file:///Users/javier/Projects/swirl-baseline/release/swirl-0.1.0.vsix)
- **Características Clave:**
  - Identidad de marca **Swirl** con logo de remolino y versionado en la cabecera.
  - Autocompletado inteligente nativo en punto (`.`) en Webview, Standalone y VS Code con tipos `SwirlPattern`.
  - Arquitectura dual 100% offline-first aislada de redes externas.
  - Catálogos de patrones, sonidos y 513 funciones documentadas.
  - Selector de 37 temas visuales con armonización dinámica y 12 tipografías del sistema.
