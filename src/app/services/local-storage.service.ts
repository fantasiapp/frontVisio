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
    let token = this.getToken();
    let storedData = JSON.parse(this.localStorage.getItem('data') || '{}') as {[token: string]: {[field: string]: any}};
    storedData[token] = data;
    this.localStorage.setItem('data', JSON.stringify(storedData))
  }
  getData() {
    let token = this.getToken();
    let storedData = JSON.parse(this.localStorage.getItem('data') || '{}') as {[token: string]: {[field: string]: any}};
    if(!token || !storedData) return {}
    return storedData[token];
  }

  saveToken(token: string) {
    this.localStorage.setItem('token', token)
    this.sessionStorage.setItem('token', token)
  }
  getToken(): string {
    return this.sessionStorage.getItem('token') ? this.sessionStorage.getItem('token') || '' : this.localStorage.getItem('token') || ''
  }

  saveStayConnected(stayConnected: boolean) {
    this.localStorage.setItem('stayConnected', stayConnected.toString())
  }
  getStayConnected(): boolean {
    return (this.localStorage.getItem('stayConnected') || false) as boolean;
  }

  saveLastUpdateTimestamp(timestamp: number) {
    let token = this.getToken();
    let storedTimestamps = JSON.parse(this.localStorage.getItem('lastUpdateTimestamps') || '{}') as {[token: string]: number}
    storedTimestamps[token] = timestamp;
    this.localStorage.setItem('lastUpdateTimestamps', JSON.stringify(storedTimestamps))
  }
  getLastUpdateTimestamp() {
    let token = this.localStorage.getItem('token') || '';
    let storedTimestamps = JSON.parse(this.localStorage.getItem('lastUpdateTimestamps') || '{}') as {[token: string]: number}
    return storedTimestamps[token]
  }

  saveQueueUpdate(queueUpdate: UpdateData) {
    let token = this.getToken();
    let storedQueues = JSON.parse(this.localStorage.getItem('queuedDataToUpdate') || '{}') as {[token: string]: UpdateData};
    storedQueues[token] = queueUpdate;
    this.localStorage.setItem('queuedDataToUpdate', JSON.stringify(storedQueues))
  }
  getQueueUpdate(): UpdateData {
    let token = this.getToken();
    let storedQueues = JSON.parse(this.localStorage.getItem('queuedDataToUpdate') || '{}') as {[token: string]: UpdateData};
    return storedQueues[token];
  }
  removeQueueUpdate() {
    let token = this.getToken();
    let storedQueues = JSON.parse(this.localStorage.getItem('queuedDataToUpdate') || '{}') as {[token: string]: UpdateData};
    delete storedQueues[token]
    this.localStorage.setItem('queuedDataToUpdate', JSON.stringify(storedQueues))
  }

  handleDisconnect() {
    let token = this.getToken()
    let storedData = JSON.parse(this.localStorage.getItem('data') || '{}') as {[token: string]: {[field: string]: any}};
    delete storedData[token]
    this.localStorage.setItem('data', JSON.stringify(storedData))
    let storedTimestamps  = JSON.parse(this.localStorage.getItem('lastUpdateTimestamps') || '{}') as {[token: string]: number};
    delete storedTimestamps[token]
    this.localStorage.setItem('lastUpdateTimestamps', JSON.stringify(storedTimestamps))
    this.localStorage.removeItem('stayConnected')
    this.localStorage.removeItem('token')
  }
  
  clear(): void {
    this.localStorage.clear();
  }
}
