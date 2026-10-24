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

El proveedor está configurado para el repositorio público `JuanCardona05/Omega`. Los clientes no requieren una cuenta de GitHub ni credenciales para consultar y descargar sus releases. Un repositorio privado no permite ese acceso anónimo: no incluyas tokens personales en la aplicación.

Para publicar una versión, actualiza `version` en `package.json` y `package-lock.json`, confirma y sube esos cambios a `main`, y luego crea y sube un tag correspondiente (`v1.0.0` para la versión `1.0.0`). El workflow `.github/workflows/release.yml` compila el instalador NSIS de Windows y publica el release al recibir el tag. También permite volver a publicar un tag existente desde `workflow_dispatch`. El workflow requiere permiso `contents: write` para `GITHUB_TOKEN`.

El workflow publica explícitamente el instalador, `latest.yml` y el `.blockmap` para electron-updater. Las actualizaciones entre versiones deben probarse con una versión instalada anterior y una release posterior.

Los datos y la sesión se guardan localmente en el perfil de la aplicación Electron; no se requiere conexión a internet para ejecutar la versión de escritorio.

La caja conserva un resumen de cada cierre diario. Al iniciar un nuevo día, el efectivo contado al cierre anterior se propone como dinero inicial; si no se cerró la caja, se usa el saldo inicial más las ventas en efectivo del día anterior. El icono de la ventana y del instalador usa el logo Omega.
