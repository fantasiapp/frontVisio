import { Injectable } from '@angular/core';
import { DataService, UpdateData } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  localStorage: Storage;
  sessionStorage: Storage;
  static getFromCache: boolean = false;

  constructor() {
    this.localStorage = window.localStorage;
    this.sessionStorage = window.sessionStorage;
  }

  saveData(data: {[field: string]: any}) {
    this.localStorage.setItem('data', JSON.stringify(data))
  }
  getData(): {[field: string]: any}{
    return JSON.parse(this.localStorage.getItem('data') || '') as {[field: string]: any};
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
  saveLastToken(token: string) {
    this.localStorage.setItem('lastToken', token)
  }
  getLastToken(): string {
    return this.localStorage.getItem('lastToken') ||''
  }
  removeLastToken() {
    this.localStorage.removeItem('lastToken')
  }

  saveStayConnected(stayConnected: boolean) {
    this.localStorage.setItem('stayConnected', JSON.stringify(stayConnected))
  }
  getStayConnected(): boolean {
    return JSON.parse(this.localStorage.getItem('stayConnected') || 'false');
  }
  removeStayConnected() {
    this.localStorage.removeItem('stayConnected')
  }

  saveLastUpdateTimestamp(timestamp: number) {
    this.localStorage.setItem('lastUpdateTimestamp', JSON.stringify(timestamp))
  }
  getLastUpdateTimestamp(): number {
    return JSON.parse(this.localStorage.getItem('lastUpdateTimestamp') || '0') as number
  }

  saveQueueUpdate(queueUpdate: UpdateData) {
    this.localStorage.setItem('queuedDataToUpdate', JSON.stringify(queueUpdate))
  }
  getQueueUpdate(): UpdateData {
    return JSON.parse(this.localStorage.getItem('queuedDataToUpdate') || 'null') as UpdateData;
  }
  removeQueueUpdate() {
    this.localStorage.removeItem('queuedDataToUpdate')
  }

  handleDisconnect() {
    let token = this.getToken()

    if(token === sessionStorage.getItem('token')) {
      if(!this.getStayConnected()) {
        this.localStorage.removeItem('token')
        this.localStorage.removeItem('lastUpdateTimestamp');
        this.localStorage.removeItem('data');
      }
      sessionStorage.removeItem("token")
    }
  }
  
  clear(): void {
    this.localStorage.clear();
  }
}
