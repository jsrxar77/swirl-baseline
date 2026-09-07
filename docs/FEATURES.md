# CAPACIDADES Y CARACTERISTICAS DEL SISTEMA: STRUDEL LOCAL

## 1. STRUDEL REPL COMO ESTANDAR NATIVO DE INTERFAZ
El sistema adopta `@strudel/repl` como componente de interfaz unico y consistente tanto en la extension de Antigravity IDE / VS Code como en el modulo local standalone:
- Editor CodeMirror 6: Resaltado de sintaxis especifico para TidalCycles y JavaScript, identacion automatica, soporte para caracteres no estandar y autocompletado reactivo.
- Recuadros Reactivos de Tokens (Active Token Boxes): Resaltado perimetral blanco en tiempo real sobre los tokens de mini-notation activos mediante el pipeline `withMiniLocation` y decoraciones dinamicas de CodeMirror 6 (identico a `strudel.cc`).
- Flash de Evaluacion: Efecto visual reactivo en el editor al ejecutar un bloque de codigo mediante atajos de teclado (Ctrl+Enter / Cmd+Enter).
- Visualizadores Integrados: Renderizado en canvas del pulso temporal, barras de ciclo musical y actividad de senal en tiempo real.
- Atajos de Teclado Estandar:
  - Ctrl+Enter / Cmd+Enter: Evaluar bloque o seleccion actual.
  - Ctrl+. / Cmd+.: Detener reproduccion y suspender audio.
  - Shift+Enter: Evaluar linea actual de forma aislada.

---

## 2. MOTOR DE EVALUACION Y SINTAXIS
- Transpilador de Mini-Notation: Convierte cadenas polirritmicas y euclidianas (ej. `[bd sd] hh*4`, `cp(3,8)`) a estructuras continuas y discretas de senal.
- Soporte para Transformaciones Temporales:
  - `slow(n)` / `fast(n)`: Factor de velocidad del ciclo.
  - `early(t)` / `late(t)`: Desplazamiento de fase temporal.
  - `rev()`: Inversion temporal de eventos.
  - `every(n, fn)`: Aplicacion condicional por ciclo.
- Generacion de AST Determinista: Capacidad de analizar y extraer el arbol sintactico sin requerir la ejecucion de audio (utilizado por el servidor MCP `strudel-engine-mcp`).

---

## 3. COMPATIBILIDAD 100% OFFLINE
- Aislamiento de Red: Ningun componente, font, script o sample depende de conexiones externas ni CDNs.
- Soundfonts Locales: Bancos de sonido en formato SF2 empaquetados o descriptores JSON cargados exclusivamente desde el filesystem local.
- Samples Embebidos: Banco basico esencial de percusiones (bd, sd, hh, cp) provisto de forma local para ejecucion inmediata.
- Fallback Silencioso: Capacidad de dry-run temporal cuando el sistema se ejecuta en entornos headless o sin interfaz de audio.

---

## 4. CAPA DE PLUGINS MODULARES (src/plugins/)
Arquitectura de plugins desacoplada de la linea base upstream:
- Sintetizadores Personalizados (`registerSynth`): Inyeccion de generadores osciladores o grafos de nodos Web Audio sin modificar el core.
- Reglas de Sintaxis Adicionales (`registerSyntax`): Expansion de mini-notation o helpers funcionales.
- Visualizadores a Medida (`registerVisualizer`): Hooks para conectar renderizadores externos o analizadores de espectro.
- Activacion Selectiva: Manifiesto `manifest.json` para habilitar o deshabilitar plugins sin recompilacion compleja.

---

## 5. CATALOGOS DINAMICOS OFFLINE (src/data/ y src/webview/modules/)
Paridad completa con la interfaz de strudel.cc con funcionamiento 100% local (Regla de Oro 9):
- Pestaña Reference (513 funciones): Buscador instantaneo en tiempo real, pastillas de categorias/tags, tablas de parametros, tipos de retorno y bloques de codigo de ejemplo con botones de carga e insercion directa en el editor.
- Pestaña Sounds: Navegacion interactiva de 12 cajas de ritmos clasicas (TR-909, TR-808, TR-707, LinnDrum, CR-78, etc.), sintetizadores/osciladores y soundfonts, con motor de preescucha sintetizada local via Web Audio API (cero peticiones externas).
- Pestaña Patterns: Biblioteca de 30 patrones predefinidos estructurados por genero y autor, con botones de carga en un clic, importacion y exportacion de archivos `.strudel` locales.
- Pestaña Settings y Selector de Temas (`src/data/themes.json` y `settings-controller.js`):
  - 37 Temas Visuales Completos: Catalogo integral (Dracula, Tokyo Night, Nord, Gruvbox, Monokai, Solarized, Algoboy, Sonic Pink, Teletext, Whitescreen, Bluescreen, Gameboy, etc.).
  - Armonizacion Dinamica Total de Menus y Cabecera: Calculo reactivo en `:root` mediante `color-mix(in srgb, ...)` a partir de `background` y `foreground` del tema:
    - `--bg-secondary: color-mix(in srgb, ${bg} 88%, ${fg} 12%)`
    - `--bg-tertiary: color-mix(in srgb, ${bg} 76%, ${fg} 24%)`
    - `--border-color: color-mix(in srgb, ${fg} 16%, transparent)`
    - Propagacion en cascada inmediata a la cabecera (`.strudel-header`), pie (`.strudel-footer`), botones de accion (`.action-btn`), pestanas del panel (`.tab-btn`), cuerpo del drawer (`.drawer`, `.drawer-content`), tarjetas de configuracion (`.settings-section`), toggles (`.toggle-text`), selectores y editor CodeMirror 6 (cero elementos con colores duros desconectados del tema).
  - Selector de 12 Tipografias Locales Nativas Garantizadas: Catalogo verificado en el sistema operativo con marcadas diferencias morfologicas para contrastes visuales inmediatos en el codigo:
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
  - Inyeccion Prioritaria de Tipografia: Forzado con regla `!important` sobre `.cm-editor, .cm-editor *, .cm-scroller, .cm-scroller *, .cm-content, .cm-content *, .cm-line, .cm-line *, strudel-editor, strudel-editor *` para garantizar renderizado instantaneo en todos los caracteres y tokens Lezer.
  - Escalado Dinamico de Fuente: Slider interactivo de 11px a 28px con badge de valor en tiempo real y sincronizacion bidireccional con el API interno del editor (`setFontSize`).
  - Toggles de Comportamiento CodeMirror 6: Ajustes reconfigurables en caliente sin recargar:
    - Ajuste de linea suave (Soft line wrapping).
    - Visualizacion de numeros de linea (Line numbers).
    - Resaltado de linea activa (Active line highlighting).
    - Resaltado y auto-cierre de corchetes (Bracket matching / auto-close).
    - Autocompletado inteligente de mini-notation (Autocompletion).
    - Resaltado perimetral de patrones activos (Pattern highlighting).
    - Flash visual de evaluacion (Evaluation flash).
  - Controles de Audio Local: Slider de polifonia maxima (1 a 64 voces) y conmutador de ruteo de orbitas multicanal.
  - Boton de Acceso Rapido en Cabecera: Acceso en un solo clic mediante el boton `settings` situado en la barra de navegacion superior.
  - Persistencia Total Offline: Almacenamiento automatico e inmediato en `localStorage` (`strudel_local_settings_v1`) y boton de restablecimiento a valores de fabrica.
- Herramienta de Sincronizacion de Mantenimiento (`npm run sync:content`): Descarga y sanea en tiempo de desarrollo definiciones actualizadas de upstream persistiendo archivos JSON limpios sin emojis ni dependencias externas.

---

## 6. HERRAMIENTAS MODEL CONTEXT PROTOCOL (MCP)
Capacidades de introspeccion expuestas via stdio para el agente de IA:
- `validate_mini_notation`: Validacion sintactica y generacion de AST en JSON.
- `dry_run_pattern`: Simulacion temporal y extraccion de eventos (pitch, duracion, compas, parametros) sin reproducir audio.
- `inspect_soundfonts`: Enumeracion e inspeccion de bancos de sonido locales.
- `check_ports`: Auditoria de puertos ocupados y deteccion de procesos colgados.
- `kill_orphans`: Terminacion quirurgica de procesos huerfanos.
