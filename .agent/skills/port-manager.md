# SKILL: PORT MANAGER

## DESCRIPCION
Protocolo operativo para la inspeccion determinista de puertos de red, deteccion de procesos en conflicto y liberacion inmediata de recursos bajo la Regla de Oro 2 (Limpieza Inmediata de Procesos y Puertos).

## PUERTOS DE CONTROL PRIMARIOS
- 3000: Servidor standalone / desarrollo local de Strudel REPL.
- 8080: Servidor alternativo de assets y soundfonts locales.
- 5173: Puerto Vite / empaquetador frontend (si aplica).

## METODOS OPERATIVOS CLI

### 1. Inspeccion de Puertos
Para verificar procesos escuchando en un puerto especifico:
```bash
lsof -iTCP:<PUERTO> -sTCP:LISTEN -n -P
```

Ejecucion unificada de auditoria:
```bash
npm run ports:check
```

### 2. Liberacion de Procesos en Conflicto
Para obtener el PID del proceso y terminarlo de forma limpia:
```bash
PIDS=$(lsof -ti :<PUERTO>)
if [ -n "$PIDS" ]; then
  kill -15 $PIDS 2>/dev/null || kill -9 $PIDS 2>/dev/null
fi
```

Ejecucion unificada de limpieza:
```bash
npm run ports:clean
```

### 3. Verificacion Post-Cierre
Verificar que la salida sea vacia (codigo de salida 0):
```bash
lsof -i :3000 -i :8080
```

## DIRECTIVA DE GOBERNANZA
Queda terminantemente prohibido finalizar un turno de trabajo o dar por concluida una tarea dejando servidores HTTP, listeners de sockets TCP o procesos en background activos. Cualquier servidor levantado para pruebas debe terminarse antes del reporte final.
