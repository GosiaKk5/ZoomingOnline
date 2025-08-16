# Desktop App Deployment

## Tauri Setup (Recommended)

Tauri provides a lightweight, secure way to build desktop apps with web technologies.

### Prerequisites
- Rust toolchain
- Node.js and npm

### Setup Steps

1. Install Tauri CLI:
   ```bash
   npm install --save-dev @tauri-apps/cli
   ```

2. Initialize Tauri in the project:
   ```bash
   npm run tauri init
   ```

3. Configure `src-tauri/tauri.conf.json`:
   ```json
   {
     "build": {
       "distDir": "../dist",
       "devPath": "http://localhost:5173"
     },
     "package": {
       "productName": "ZoomingOnline",
       "version": "1.0.0"
     },
     "tauri": {
       "allowlist": {
         "fs": {
           "all": false,
           "readFile": true,
           "readDir": true
         },
         "http": {
           "all": true,
           "request": true
         }
       },
       "windows": [
         {
           "title": "ZoomingOnline",
           "width": 1200,
           "height": 800,
           "resizable": true,
           "fullscreen": false
         }
       ]
     }
   }
   ```

4. Add build scripts to package.json:
   ```json
   {
     "scripts": {
       "tauri": "tauri",
       "tauri:dev": "tauri dev",
       "tauri:build": "tauri build"
     }
   }
   ```

### Building Desktop App

```bash
# Development
npm run tauri:dev

# Production build
npm run tauri:build
```

## Electron Setup (Alternative)

### Prerequisites
- Node.js and npm

### Setup Steps

1. Install Electron:
   ```bash
   npm install --save-dev electron
   npm install --save-dev electron-builder
   ```

2. Create `electron/main.js`:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   
   function createWindow() {
     const mainWindow = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         enableRemoteModule: false
       }
     });
   
     if (process.env.NODE_ENV === 'development') {
       mainWindow.loadURL('http://localhost:5173');
       mainWindow.webContents.openDevTools();
     } else {
       mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
     }
   }
   
   app.whenReady().then(() => {
     createWindow();
   
     app.on('activate', () => {
       if (BrowserWindow.getAllWindows().length === 0) {
         createWindow();
       }
     });
   });
   
   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') {
       app.quit();
     }
   });
   ```

3. Update package.json:
   ```json
   {
     "main": "electron/main.js",
     "scripts": {
       "electron": "electron .",
       "electron:dev": "npm run build && electron .",
       "electron:pack": "electron-builder",
       "electron:dist": "npm run build && electron-builder"
     },
     "build": {
       "appId": "com.datamedsci.zoomingonline",
       "productName": "ZoomingOnline",
       "directories": {
         "output": "dist-electron"
       },
       "files": [
         "dist/**/*",
         "electron/**/*"
       ],
       "mac": {
         "category": "public.app-category.developer-tools"
       },
       "win": {
         "target": "nsis"
       },
       "linux": {
         "target": "AppImage"
       }
     }
   }
   ```

### Building Desktop App

```bash
# Development
npm run electron:dev

# Production build
npm run electron:dist
```

## Platform-Specific Features

### File System Access
- Tauri: Use Tauri APIs for secure file access
- Electron: Use Node.js fs module with proper security measures

### CORS Handling
Desktop apps don't have CORS restrictions, allowing direct access to local Zarr files.

### Native Menus
Both Tauri and Electron support native menu bars and context menus.

### Auto-Updates
- Tauri: Built-in updater
- Electron: Use electron-updater

## Recommended Approach

**Tauri** is recommended for new deployments due to:
- Smaller bundle size
- Better security model
- Native performance
- Lower memory usage
- Rust ecosystem benefits

**Electron** may be preferred if:
- Need extensive Node.js ecosystem access
- Team has more JavaScript/Node.js expertise
- Require features not yet available in Tauri
