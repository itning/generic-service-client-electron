import {EventEmitter, Injectable} from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import {ipcRenderer, remote, webFrame} from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;
  dubboResponse: EventEmitter<any> = new EventEmitter<any>();

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;

      // If you wan to use remote object, pleanse set enableRemoteModule to true in main.ts
      this.remote = window.require('electron').remote;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');

      this.ipcRenderer.on('dubbo_response', (event, token, echo, response, err) => {
        if (response) {
          this.dubboResponse.emit({
            type: 1,
            message: JSON.stringify(response, null, 2),
            echo: echo
          })
        } else {
          this.dubboResponse.emit({
            type: 0,
            message: JSON.stringify(err),
            echo: echo
          })
        }
      });
    }
  }

  sendEvent(type: EventType, message: any): void {
    switch (type) {
      case EventType.REQUEST:
        this.ipcRenderer.send('dubbo_request', message);
        break;
    }
  }

}

export enum EventType {
  REQUEST
}
