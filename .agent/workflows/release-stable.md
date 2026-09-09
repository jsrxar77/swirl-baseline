# Workflow: Promoción de Versión Estable de Swirl

Este procedimiento formaliza cómo emitir, sincronizar y empaquetar una nueva versión estable de **Swirl**.

---

## 1. Prerrequisitos de Calidad
Antes de ejecutar el incremento de versión, asegurar que no existan errores de sintaxis ni de aislamiento offline:
```bash
npm run test:repl
npm run test:offline
```

---

## 2. Comando Automatizado de Release

Ejecutar el script de release especificando el nivel de incremento (`patch`, `minor` o `major`) o una versión fija:

```bash
# Para parches (ej. 0.1.0 -> 0.1.1):
npm run release:bump patch "Descripcion de mejoras o correcciones"

# Para versiones funcionales (ej. 0.1.0 -> 0.2.0):
npm run release:bump minor "Incorporacion de nueva caracteristica estable"

# Para una version especifica (ej. 1.0.0):
npm run release:bump 1.0.0 "Lanzamiento mayor inicial"
```

---

## 3. Acciones Automáticas que Ejecuta el Script
1. Actualiza la propiedad `version` en `package.json`.
2. Reconstruye los paquetes (`npm run build`) e inyecta la versión en el header visual de la UI (`#app-version`).
3. Ejecuta la suite de pruebas unitarias y de aislamiento offline.
4. Genera el nuevo artefacto VSIX dentro de `release/swirl-<version>.vsix`.
5. Agrega una entrada estructurada en `release/versions.json`.
6. Documenta el release en `docs/RELEASES.md`.
7. Actualiza la instalación local de la extensión en VS Code / Antigravity IDE.

---

## 4. Verificación Post-Release
1. Inspeccionar que `release/swirl-<version>.vsix` exista y tenga un tamaño adecuado (~5MB).
2. Abrir el REPL (en navegador o IDE) y verificar que en la esquina superior izquierda el logo de remolino acompañe al badge con la versión esperada (ej. `v0.1` o `v0.2`).
