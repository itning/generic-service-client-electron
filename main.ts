import {app, BrowserWindow, dialog, ipcMain, Menu, screen, WebContents} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as os from 'os';

const {DirectlyDubbo, java} = require('apache-dubbo-js');

class Main {
  private win: BrowserWindow = null;
  private args = process.argv.slice(1);
  private isServe = this.args.some(val => val === '--serve');

  private createWindow(): BrowserWindow {
    const size = screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    const win = this.win = new BrowserWindow({
      x: size.width / 6,
      y: size.height / 6,
      width: size.width / 4 * 3,
      height: size.height / 4 * 3,
      webPreferences: {
        nodeIntegration: true,
        allowRunningInsecureContent: this.isServe,
        contextIsolation: false,  // false if you want to run 2e2 test with Spectron
        enableRemoteModule: true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
      },
    });

    this.handleDubboRequest(win.webContents);

    if (this.isServe) {
      win.webContents.openDevTools();
      require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`)
      });
      win.loadURL('http://localhost:4200').catch(err => {
        dialog.showErrorBox('加载失败！', err);
        return err;
      });
    } else {
      win.loadURL(url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true
      })).catch(err => {
        dialog.showErrorBox('加载失败！', err);
        return err;
      });
    }

    win.on('close', () => win.destroy());

    win.on('closed', () => this.win = null);
    return win;
  }

  private handleDubboRequest(webContents: WebContents) {
    ipcMain.on('dubbo_request', (ipc, requestInfo) => {

      const application = DirectlyDubbo.from({
        dubboAddress: requestInfo.url,
        dubboInvokeTimeout: requestInfo.timeout ? requestInfo.timeout : 5000,
        dubboVersion: '2.7.8',
      });

      const actuator = application.proxyService({
        dubboInterface: requestInfo.interfaceName,
        methods: {
          [requestInfo.method]: function (...ids) {
            return ids;
          }
        },
        version: requestInfo.version,
        timeout: requestInfo.timeout ? requestInfo.timeout : 5000,
        group: requestInfo.group
      });

      const allParam = [];
      if (requestInfo.params) {
        try {
          for (let item of requestInfo.params) {
            const keys = Object.keys(item);
            if (keys.length < 1) {
              continue;
            }
            const itemParamClassName = keys[0];
            allParam.push(java(itemParamClassName, item[itemParamClassName]))
          }
        } catch (e) {
          webContents.send('dubbo_response', null, e);
          return;
        }
      }

      let flag = false;
      const result: Promise<any> = actuator[requestInfo.method](...allParam);

      const timeout = setTimeout(() => {
        webContents.send('dubbo_response', requestInfo.token, requestInfo.echo, null, 'timeout');
      }, requestInfo.timeout ? requestInfo.timeout : 5000);

      result.then(response => {
        flag = true;
        if (response.res) {
          webContents.send('dubbo_response', requestInfo.token, requestInfo.echo, response.res, null)
        } else {
          webContents.send('dubbo_response', requestInfo.token, requestInfo.echo, null, response.err)
        }
      })
        .catch(err => {
          flag = true;
          webContents.send('dubbo_response', requestInfo.token, requestInfo.echo, null, err);
        })
        .finally(() => {
          clearTimeout(timeout);
        });
    })
  }

  run(): void {
    try {
      // This method will be called when Electron has finished
      // initialization and is ready to create browser windows.
      // Some APIs can only be used after this event occurs.
      // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
      app.on('ready', () => {
        setTimeout(() => this.createWindow(), 400);
        Menu.setApplicationMenu(null);
      });

      // Quit when all windows are closed.
      app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
          app.quit();
        }
      });

      app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (this.win === null) {
          this.createWindow();
        }
      });

    } catch (e) {
      console.error(e);
      // https://segmentfault.com/a/1190000018878931
      fs.appendFileSync(path.join(process.cwd(), 'error.log'), e.toString() + e.stack + os.EOL);
    }
  }
}

new Main().run();
