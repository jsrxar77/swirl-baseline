# Swirl

Entorno de live coding offline-first y runtime de arquitectura dual para Antigravity IDE, VS Code y navegador local standalone, basado en el motor de Swirl REPL.

---

## Caracteristicas Principales

### 1. Interfaz Oficial Swirl REPL
- **Editor CodeMirror 6 Oficial:** Resaltado de sintaxis especifico para JavaScript y DSL de Swirl / TidalCycles.
- **Recuadros Reactivos de Tokens (Active Token Boxes):** Resaltado visual perimetral en tiempo real sobre los eventos temporales activos en el codigo.
- **Visualizador y Flash de Evaluacion:** Animacion reactiva en el editor durante la evaluacion con atajos de teclado (`Ctrl+Enter` / `Cmd+Enter`).
- **Controles de Transporte:** Botones de reproduccion (`play`/`stop`), re-evaluacion en caliente (`update`) y copia al portapapeles (`share`).

### 2. Panel Lateral Deslizable (Sidebar Drawer) con 6 Pestanas
- **patterns:** Biblioteca de 30 patrones curados clasificados por genero y autor, con botones de carga en un clic e importacion/exportacion de archivos de patrones.
- **sounds:** Catalogo de 12 cajas de ritmos clasicas (TR-808, TR-909, TR-707, LinnDrum, CR-78, etc.), sintetizadores y bancos locales, con motor de preescucha sintetizada local via Web Audio API.
- **reference:** Catalogo de 513 funciones documentadas con buscador en tiempo real, pastillas de categorias, tablas de parametros y botones de insercion de ejemplos en el editor.
- **export:** Grabacion de audio local, renderizado y utilidades de exportacion.
- **console:** Registro de eventos de evaluacion y mensajes del sistema en tiempo real.
- **settings:** Centro de control visual y motor de configuracion con persistencia en `localStorage`.

### 3. Gestion Visual: 37 Temas y Tipografia Reactiva
- **37 Temas Visuales Completos:** Catalogo que incluye Dracula, Tokyo Night, Nord, Gruvbox, Monokai, Solarized, Algoboy, Sonic Pink, Teletext, Bluescreen, Whitescreen, Gameboy y mas.
- **Armonizacion Dinamica en Toda la Interfaz:** Calculo de colores secundarios, terciarios y bordes derivado directamente de la paleta del tema (`color-mix`), garantizando que la cabecera, los botones, el drawer lateral, las tarjetas y los selectores armonicen al instante con el fondo del editor.
- **Selector de 12 Tipografias Locales Nativas:** Familias garantizadas y verificadas en el sistema operativo con contrastes visuales inequivocos:
  1. `Menlo / Monaco (macOS Terminal Mono)`
  2. `Courier New (Serif Typewriter)`
  3. `Andale Mono (Retro Monospace)`
  4. `PT Mono (Modern Monospace)`
  5. `Georgia (Serif Elegant)`
  6. `Trebuchet MS (Humanist Sans)`
  7. `Impact (Heavy Condensed)`
  8. `Comic Sans MS (Casual / Fun)`
  9. `Consolas / Lucida (Windows Mono)`
  10. `SF Mono (Apple System)`
  11. `JetBrains Mono / Menlo`
  12. `Inconsolata / Courier`
- **Inyeccion Prioritaria:** Reglas CSS `!important` que fuerzan el cambio de fuente inmediato en todos los caracteres y tokens del editor CodeMirror 6.
- **Slider de Tamano de Fuente:** Rango de 11px a 28px con visualizador de valor en tiempo real.
- **Toggles de Comportamiento del Editor:** Conmutacion en caliente de ajuste de linea, numeros de linea, resaltado de linea activa, emparejamiento de corchetes, autocompletado inteligente y resaltado de patrones.
- **Persistencia Local:** Configuracion preservada automaticamente en `localStorage` con opcion de restauracion de fabrica.

### 4. Arquitectura Dual 100% Offline
- **Extension Antigravity IDE / VS Code:** Ejecucion dentro de un Webview seguro con puente IPC bidireccional (`vscode.postMessage`).
- **Modulo Standalone Local:** Servidor ligero en Node.js para ejecucion independiente en cualquier navegador (`http://127.0.0.1:3000`).
- **Aislamiento Estricto de Red (Regla de Oro 9):** Cero llamadas a CDNs o servicios externos en tiempo de ejecucion.

---

## Estructura del Proyecto

```
swirl-baseline/
├── .agent/                  # Especificacion del agente, reglas de oro y workflows
│   ├── AGENT.md             # Reglas de comportamiento e integridad
│   ├── mcp.json             # Configuracion de servidores MCP locales (stdio)
│   ├── skills/              # Habilidades del agente (puertos, motor Swirl)
│   └── workflows/           # Procedimientos guiados (sync, run, package)
├── docs/                    # Documentacion tecnica exhaustiva
│   ├── ARCHITECTURE.md      # Topologia, diagramas Mermaid y ciclo de audio
│   ├── BASELINE.md          # Especificacion del componente base
│   ├── BRIEF.md             # Requisitos y alcance del proyecto
│   ├── DEVOPS.md            # Gestion de puertos y ciclo de ejecucion
│   ├── FEATURES.md          # Catalogo de caracteristicas y capacidades
│   └── PACKAGING.md         # Distribucion VSIX y standalone
├── release/                 # Artefactos .vsix empaquetados para distribucion
├── src/
│   ├── baseline/            # Nucleo oficial aislado de computacion temporal
│   ├── data/                # Catalogos JSON offline (reference, sounds, patterns, themes)
│   ├── extension/           # Backend host de la extension VS Code
│   ├── mcp/                 # Servidores MCP por tuberias stdio
│   ├── plugins/             # Capa desacoplada para sintes y sintaxis custom
│   ├── standalone/          # Launcher y servidor local offline
│   └── webview/             # Frontend REPL, estilos, modulos drawer y settings
├── types/                   # Definiciones de TypeScript para autocompletado nativo
│   └── swirl.d.ts           # Definiciones globales para IntelliSense
├── scripts/                 # Herramientas de build, test y auditoria
└── package.json             # Metadatos, scripts NPM y configuracion
```

---

## Instalacion y Comandos NPM

### Requisitos
- Node.js >= 18.0.0

### Scripts Disponibles

| Comando | Descripcion |
|---|---|
| `npm start` | Inicia el servidor standalone offline en `http://127.0.0.1:3000` |
| `npm run start:standalone` | Alias de `npm start`, inicia el servidor standalone local |
| `npm run start:electron` | Inicia el runtime de escritorio nativo via Electron |
| `npm run build` | Compila todos los modulos: webview, extension host y standalone |
| `npm run build:repl` | Compila unicamente el bundle del webview REPL hacia `dist/webview/` |
| `npm run build:extension` | Compila unicamente el host de la extension hacia `dist/extension/` |
| `npm run build:standalone` | Genera la distribucion standalone en `dist/standalone/` |
| `npm run test:repl` | Pruebas de motor (parser, AST, scheduler, transpiler, 5/5) |
| `npm run test:offline` | Auditoria de aislamiento de red (0 peticiones externas) |
| `npm run ports:check` | Verifica colisiones de puertos 3000 y 8080 |
| `npm run ports:clean` | Libera procesos que ocupan los puertos del servidor local |
| `npm run sync:content` | Sincroniza catalogos de referencia, patrones y sonidos desde upstream Strudel |
| `npm run swirl:sync` | Verifica y sincroniza el nucleo baseline de Strudel en `src/baseline/` |
| `npm run package:vsix` | Empaqueta la extension en formato `.vsix` dentro de `release/` |
| `npm run install:ide` | Instala el `.vsix` directamente en Antigravity IDE |
| `npm run mcp:build` | Compila los servidores MCP locales (`stdio`) |
| `npm run mcp:check` | Verifica la disponibilidad y estado de los servidores MCP |
| `npm run release:bump` | Incrementa la version del proyecto y actualiza manifiestos y documentacion |
| `npm run git:push` | Ejecuta el flujo DevOps: audita cambios, confirma commit y sube a `origin/main` |

---

## Servidores Model Context Protocol (MCP)

El proyecto incluye soporte nativo para agentes de IA mediante herramientas expuestas sobre tuberias `stdio`:
- **swirl-engine-mcp (`src/mcp/swirl-engine-mcp.js`):**
  - `validate_mini_notation`: Valida sintaxis y extrae el AST determinista.
  - `dry_run_pattern`: Simula eventos temporales sin emitir audio.
  - `inspect_soundfonts`: Inspecciona descriptores y bancos de sonido.
- **port-cleaner-mcp (`src/mcp/port-cleaner-mcp.js`):**
  - `check_ports`: Audita procesos en puertos locales.
  - `kill_orphans`: Limpia procesos colgados garantizando puertos libres.
