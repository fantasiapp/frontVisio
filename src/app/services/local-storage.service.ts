import { Injectable } from '@angular/core';
import { UpdateData } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  localStorage: Storage;
  sessionStorage: Storage;

  constructor() {
    this.localStorage = window.localStorage;
    this.sessionStorage = window.sessionStorage;
  }

  saveData(data: {[field: string]: any}) {
    let token = this.getActiveToken();
    let storedData = JSON.parse(this.localStorage.getItem('data') || '{}') as {[token: string]: {[field: string]: any}};
    storedData[token] = data;
    this.localStorage.setItem('data', JSON.stringify(storedData))
  }
  getData() {
    let token = this.getActiveToken();
    let storedData = JSON.parse(this.localStorage.getItem('data') || '{}') as {[token: string]: {[field: string]: any}};
    if(!token || !storedData) return {}
    return storedData[token];
  }

  saveToken(token: string) {
    this.localStorage.setItem('token', token)
  }
  getToken(): string {
    return this.localStorage.getItem('token') || '';
  }
  removeToken() {
    this.localStorage.removeItem('token')
  }
  setActiveToken(token: string) {
    console.log("SET ACTIVE TOKEN")
    this.localStorage.setItem('activeToken', token)
  }
  getActiveToken(): string {
    return this.localStorage.getItem('activeToken')!
  }
  removeActiveToken() {
    this.localStorage.removeItem('activeToken')
  }
  saveLastUpdateTimestamp(timestamp: number) {
    let token = this.getActiveToken();
    let storedTimestamps = JSON.parse(this.localStorage.getItem('lastUpdateTimestamps') || '{}') as {[token: string]: number}
    storedTimestamps[token] = timestamp;
    this.localStorage.setItem('lastUpdateTimestamps', JSON.stringify(storedTimestamps))
  }
  getLastUpdateTimestamp() {
    let token = this.getActiveToken();
    let storedTimestamps = JSON.parse(this.localStorage.getItem('lastUpdateTimestamps') || '{}') as {[token: string]: number}
    return storedTimestamps[token]
  }

  saveQueueUpdate(queueUpdate: UpdateData) {
    let token = this.getActiveToken();
    let storedQueues = JSON.parse(this.localStorage.getItem('queuedDataToUpdate') || '{}') as {[token: string]: UpdateData};
    storedQueues[token] = queueUpdate;
    this.localStorage.setItem('queuedDataToUpdate', JSON.stringify(storedQueues))
  }
  getQueueUpdate(): UpdateData {
    let token = this.getActiveToken();
    let storedQueues = JSON.parse(this.localStorage.getItem('queuedDataToUpdate') || '{}') as {[token: string]: UpdateData};
    return storedQueues[token];
  }
  removeQueueUpdate() {
    let token = this.getActiveToken();
    let storedQueues = JSON.parse(this.localStorage.getItem('queuedDataToUpdate') || '{}') as {[token: string]: UpdateData};
    delete storedQueues[token]
    this.localStorage.setItem('queuedDataToUpdate', JSON.stringify(storedQueues))
  }

  handleDisconnect(longTermDeconnection: boolean = false) {
    console.log("Handle delog")
    if(this.getActiveToken() === sessionStorage.getItem('token')) {
      console.log("From active window")

      if(longTermDeconnection) {
        console.log("Long term disconnection")

        let token = this.getActiveToken()
        let storedData = JSON.parse(this.localStorage.getItem('data') || '{}') as {[token: string]: {[field: string]: any}};
        delete storedData[token]
        this.localStorage.setItem('data', JSON.stringify(storedData))
        let storedTimestamps  = JSON.parse(this.localStorage.getItem('lastUpdateTimestamps') || '{}') as {[token: string]: number};
        delete storedTimestamps[token]
        this.localStorage.setItem('lastUpdateTimestamps', JSON.stringify(storedTimestamps))
        this.localStorage.removeItem('token')
      }
      this.localStorage.removeItem('activeToken')
      sessionStorage.removeItem("token")
    }
  }
  
  clear(): void {
    this.localStorage.clear();
  }
}
