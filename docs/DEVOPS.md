# GUIA DE OPERACIONES Y DEVOPS: STRUDEL LOCAL

## 1. POLITICA DE RED CERO Y GESTION DE PUERTOS
La regla operativa cardinal del entorno de desarrollo es la eliminacion estricta de procesos residuales y listeners de sockets.

### Puertos Asignados
- Puerto 3000: Servidor standalone local de Strudel REPL (`src/standalone/server.js`).
- Puerto 8080: Servidor estatico alternativo para testing o benchmarks.

### Comandos de Control de Puertos
- Auditoria de colisiones:
  ```bash
  npm run ports:check
  ```
  Retorna codigo 0 si los puertos estan limpios. Si detecta procesos escuchando, lista sus PIDs.
- Limpieza forzosa de procesos huerfanos:
  ```bash
  npm run ports:clean
  ```
  Envia senal SIGTERM y luego SIGKILL a los procesos asociados a los puertos 3000 y 8080.

---

## 2. VARIABLES DE ENTORNO
El sistema opera con valores predeterminados seguros para ejecucion offline. Las siguientes variables pueden configurarse opcionalmente:
- `STRUDEL_PORT`: Puerto para el servidor standalone (predeterminado: 3000).
- `STRUDEL_OFFLINE`: Forzar modo estrictamente offline (predeterminado: `true`).
- `NODE_ENV`: Entorno de ejecucion (`development`, `production`, `test`).

---

## 3. SINCRONIZACION UPSTREAM NO DESTRUCTIVA
Para actualizar los paquetes oficiales de Strudel sin romper las extensiones locales:
```bash
npm run strudel:sync
```

### Protocolo Interno de Sincronizacion
1. Verifica el estado de los archivos locales asegurando que no existan colisiones pendientes.
2. Descarga o empaqueta las versiones objetivo de `@strudel/core`, `@strudel/transpiler` y `@strudel/repl`.
3. Escribe los bundles limpios en `src/baseline/`.
4. Mantiene inalterado el contenido de `src/plugins/`.
5. Ejecuta `npm run test:repl` y `npm run test:offline` para confirmar que la composicion siga operando.

---

## 4. INTEGRACION Y ESQUEMAS MODEL CONTEXT PROTOCOL (MCP)
Los servidores MCP en `src/mcp/` se ejecutan exclusivamente mediante tuberias estandar `stdio`, garantizando cero sockets de red abiertos.

### 4.1. Servidor: strudel-engine-mcp
Transporte: `node src/mcp/strudel-engine-mcp.js` (stdio)

#### Herramienta: validate_mini_notation
- Entrada:
  ```json
  {
    "code": "sound(\"bd sd [hh cp]\")"
  }
  ```
- Salida:
  ```json
  {
    "valid": true,
    "ast": { "type": "Pattern", "operator": "sound", "sequence": ["bd", "sd", ["hh", "cp"]] },
    "error": null
  }
  ```

#### Herramienta: dry_run_pattern
- Entrada:
  ```json
  {
    "code": "s(\"bd hh\")",
    "cycles": 1
  }
  ```
- Salida:
  ```json
  {
    "events": [
      { "time": 0.0, "duration": 0.5, "value": "bd" },
      { "time": 0.5, "duration": 0.5, "value": "hh" }
    ]
  }
  ```

#### Herramienta: inspect_soundfonts
- Entrada: `{}`
- Salida:
  ```json
  {
    "available": ["piano", "synth", "drums"],
    "offlinePath": "assets/soundfonts/"
  }
  ```

### 4.2. Servidor: port-cleaner-mcp
Transporte: `node src/mcp/port-cleaner-mcp.js` (stdio)

#### Herramienta: check_ports
- Entrada:
  ```json
  {
    "ports": [3000, 8080]
  }
  ```
- Salida:
  ```json
  {
    "clean": true,
    "occupants": []
  }
  ```

#### Herramienta: kill_orphans
- Entrada:
  ```json
  {
    "ports": [3000, 8080]
  }
  ```
- Salida:
  ```json
  {
    "success": true,
    "killed": []
  }
  ```
