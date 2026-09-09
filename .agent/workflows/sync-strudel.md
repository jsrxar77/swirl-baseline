# WORKFLOW: SYNC STRUDEL UPSTREAM

## OBJETIVO
Sincronizar y actualizar de forma determinista y no destructiva los modulos oficiales de Strudel (@strudel/core, @strudel/transpiler, @strudel/repl) y assets estaticos en src/baseline/, garantizando que las extensiones locales en src/extensions/ se preserven intactas.

## PRECONDICIONES
- Comprobar que no existan modificaciones locales pendientes que colisionen con src/baseline/.
- Verificar que el directorio src/extensions/ contenga sus propios archivos sin dependencia directa modificable en baseline.

## PASOS DE EJECUCION

### Paso 1: Ejecutar Script de Sincronizacion
```bash
npm run strudel:sync
```

### Paso 2: Validacion de Integridad
Verificar que la linea base contenga los modulos esenciales:
- `src/baseline/index.js`
- `src/baseline/transpiler.js`
- `src/baseline/mini-notation.js`

### Paso 3: Validacion de Extensiones Modulares
Ejecutar prueba de composicion para asegurar que las extensiones locales sigan cargando:
```bash
npm run test:repl
```

### Paso 4: Validacion Offline
Verificar que ningun asset incorporado contenga referencias absolutas a servidores externos:
```bash
npm run test:offline
```
