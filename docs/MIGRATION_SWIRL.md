# Registro de Migración de Marca: Swirl

**Fecha:** 2026-09-07  
**Alcance:** Transición de identidad de proyecto a **Swirl** con directorio raíz **`swirl-baseline`**.

---

## 1. Equivalencia de Nombres y Metadatos

| Aspecto | Denominación Anterior | Nueva Denominación |
| :--- | :--- | :--- |
| **Directorio Raíz** | `/Users/javier/Projects/strudel-local` | `/Users/javier/Projects/swirl-baseline` |
| **Nombre del Paquete** | `strudel-local` | `swirl` |
| **Nombre para Mostrar** | `Strudel Local` | `Swirl` |
| **Editor / Branding** | `Strudel Local REPL` | `Swirl REPL` |
| **Artefacto VSIX** | `strudel-local-0.1.0.vsix` | `release/swirl-0.1.0.vsix` |
| **Comando Abrir REPL** | `strudel.openRepl` | `swirl.openRepl` |
| **Comando Evaluar** | `strudel.evaluateSelection` | `swirl.evaluateSelection` |
| **Categoría de Comandos**| `Strudel Local` | `Swirl` |
| **Servidor MCP** | `strudel-engine-mcp.js` | `swirl-engine-mcp.js` |
| **Definiciones TypeScript** | `types/strudel.d.ts` | `types/swirl.d.ts` (`SwirlPattern`) |
| **Variable Puerto HTTP** | `STRUDEL_PORT` | `SWIRL_PORT` (con fallback) |

---

## 2. Preservación y Compatibilidad Musical

- La sintaxis de live coding original (`s("bd sd")`, `note()`, `chord()`, `stack()`, `.fast()`, `.bank()`, etc.) permanece **100% compatible e inalterada**.
- El motor de audio offline Web Audio y Soundfonts mantiene su funcionamiento autónomo sin depender de CDNs externas.
