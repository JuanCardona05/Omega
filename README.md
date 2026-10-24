# Omega

Aplicación de punto de venta Omega con React, Vite y Electron.

## Desarrollo

```bash
npm install
npm run dev
```

Para abrir la versión de escritorio durante el desarrollo:

```bash
npm run dev:electron
```

## Crear instalador

```bash
npm run build:electron
```

El instalador de Windows se genera en `release/`. La compilación web sigue disponible con `npm run build`.

### Actualizaciones automáticas

La aplicación usa `electron-updater` para comprobar actualizaciones en la versión empaquetada. En modo desarrollo no se ejecutan comprobaciones; la lógica está activa solo para la build de producción y el instalador NSIS de Windows.

Para publicar versiones:

1. Crea un release público o privado en GitHub con el repositorio correcto.
2. Ajusta `package.json` con el usuario/organización y el nombre del repositorio en `build.publish`.
3. Genera el instalador con `npm run build:electron`.
4. Publica el artefacto usando `electron-builder --publish always` o desde GitHub Actions.

La aplicación cliente consultará esa feed de GitHub Releases y descargará los binarios del instalador o los artefactos compatibles con `electron-updater` sin requerir que el usuario acceda al repositorio.

Los datos y la sesión se guardan localmente en el perfil de la aplicación Electron; no se requiere conexión a internet para ejecutar la versión de escritorio.

La caja conserva un resumen de cada cierre diario. Al iniciar un nuevo día, el efectivo contado al cierre anterior se propone como dinero inicial; si no se cerró la caja, se usa el saldo inicial más las ventas en efectivo del día anterior. El icono de la ventana y del instalador usa el logo Omega.
