const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let nextProcess;

// Check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Wait for the Next.js server to be ready
function waitForServer(port, retries = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const client = net.createConnection({ port }, () => {
        client.end();
        resolve();
      });
      client.on('error', () => {
        attempts++;
        if (attempts >= retries) {
          reject(new Error('Server failed to start'));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'AN-Industory',
    icon: path.join(__dirname, '..', 'public', 'an-industory-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0F172A',
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    autoHideMenuBar: false,
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Custom menu
  const menuTemplate = [
    {
      label: 'AN-Industory',
      submenu: [
        { label: 'Bogga Hore', click: () => mainWindow.loadURL('http://localhost:3001') },
        { type: 'separator' },
        { label: 'Ka Bax', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Maamulka',
      submenu: [
        { label: 'Dashboard', click: () => mainWindow.loadURL('http://localhost:3001/manufacturing') },
        { label: 'Inventory', click: () => mainWindow.loadURL('http://localhost:3001/manufacturing/inventory') },
        { label: 'Production', click: () => mainWindow.loadURL('http://localhost:3001/manufacturing/production-orders') },
        { type: 'separator' },
        { label: 'Settings', click: () => mainWindow.loadURL('http://localhost:3001/manufacturing/settings') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Website',
          click: () => shell.openExternal('https://an-industory.com'),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

async function startApp() {
  const isDev = !app.isPackaged;
  const port = 3001;

  if (isDev) {
    // In development, just connect to the already running Next.js dev server
    const window = createWindow();
    try {
      await waitForServer(port, 5);
      window.loadURL(`http://localhost:${port}`);
    } catch {
      // If dev server isn't running, start it
      console.log('Starting Next.js dev server...');
      nextProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        shell: true,
        stdio: 'pipe',
      });

      nextProcess.stdout.on('data', (data) => {
        console.log(`Next.js: ${data}`);
      });

      nextProcess.stderr.on('data', (data) => {
        console.error(`Next.js Error: ${data}`);
      });

      await waitForServer(port);
      window.loadURL(`http://localhost:${port}`);
    }
  } else {
    // In production, use the standalone server
    const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
    
    process.env.PORT = String(port);
    process.env.HOSTNAME = 'localhost';

    nextProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(port), HOSTNAME: 'localhost' },
      stdio: 'pipe',
    });

    nextProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });

    nextProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    const window = createWindow();
    await waitForServer(port);
    window.loadURL(`http://localhost:${port}`);
  }
}

app.whenReady().then(startApp);

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    startApp();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});
