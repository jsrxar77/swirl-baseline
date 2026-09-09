# WORKFLOW: ADD EXTENSION

## OBJETIVO
Incorporar nuevas capacidades a medida (sintaxis personalizada, generadores de senal, sintetizadores locales o visualizadores) en la capa modular `src/extensions/` sin alterar el nucleo oficial de Strudel en `src/baseline/`.

## PRINCIPIOS DE DISENO
1. Desacoplamiento total: Las extensiones nunca modifican archivos en `src/baseline/`.
2. Registro determinista: Toda extension debe registrarse en `src/extensions/manifest.json` y exponer un modulo con la interfaz estandar.
3. Compatibilidad offline: Las extensiones no deben requerir conexion a internet para funcionar.

## PASOS DE EJECUCION

### Paso 1: Crear el Directorio de la Extension
Crear una carpeta dedicada dentro de `src/extensions/<nombre-extension>/`:
```bash
mkdir -p src/extensions/<nombre-extension>
```

### Paso 2: Implementar el Modulo
Crear `src/extensions/<nombre-extension>/index.js` exportando la funcion de inicializacion o registro:
```javascript
module.exports = {
  name: '<nombre-extension>',
  version: '1.0.0',
  register(registry) {
    // Registro de hooks:
    // registry.registerSynth('nombre', synthFn);
    // registry.registerSyntax('nombre', syntaxRule);
    // registry.registerVisualizer('nombre', visualizerFn);
  }
};
```

### Paso 3: Registrar en el Manifiesto
Actualizar `src/extensions/manifest.json` agregando la entrada:
```json
{
  "name": "<nombre-extension>",
  "path": "./<nombre-extension>/index.js",
  "enabled": true
}
```

### Paso 4: Validar y Probar
Ejecutar la suite de tests para asegurar que la extension se cargue correctamente:
```bash
npm run test:repl
npm run test:offline
```
