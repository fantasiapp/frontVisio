import { Injectable } from '@angular/core';
import { UpdateDataWithLogs } from './data.service';

/**
 * This Service manages the data stored directly in the navigator. 
 * As long as it's not requested, it is never deleted.
 * 
 *  [ key               ]  [      VALUE        ]
 *  |data               |  |Object             |  Stores the last full data object received from the server. Removed at disconnection, or when the tab is closed if stayConnected is false. 
 *  |stayConnected      |  |boolean            |  Checked to handle the disconnection behaviour
 *  |lastUpdateTimestamp|  |number             |  Used in update requests for the server. Updated on data or update requests responses.
 *  |token              |  |string             |  Stores the token of the active session
 *  |lastToken          |  |string             |  Stores the token of the last active session : if the user worked offline, and disconnected offline, used to send the queued updates at the next connection (online)
 *  |queuedDataToUpdate |  |UpdateDataWithLogs |  Stores the queued updates between POST update requests.
 *  |alreadyConnected   |  |string             |  Specify whether the 
 */

const enum StorageKeys {
  data = 'data',
  stayConnected = 'stayConnected',
  lastUpdateTimestamp = 'lastUpdateTimestamp',
  lastToken = 'lastToken',
  token = 'token',
  queuedDataToUpdate = 'queuedDataToUpdate',
  alreadyConnected = 'alreadyConnected'
}



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

  /** data **/
  /**/ saveData(data: {[field: string]: any}) {
  /**/   this.localStorage.setItem(StorageKeys.data, JSON.stringify(data))
  /**/ }
  /**/ getData(): {[field: string]: any}{
  /**/   return JSON.parse(this.localStorage.getItem(StorageKeys.data) || '') as {[field: string]: any};
  /**/ }

  /** token **/
  /**/ saveToken(token: string) {
  /**/   this.localStorage.setItem(StorageKeys.token, token)
  /**/ }
  /**/ getToken(): string {
  /**/   return this.localStorage.getItem(StorageKeys.token) || '';
  /**/ }
  /**/ removeToken() {
  /**/   this.localStorage.removeItem(StorageKeys.token)
  /**/ }

  /** lastToken **/
  /**/ saveLastToken(token: string) {
  /**/   this.localStorage.setItem(StorageKeys.lastToken, token)
  /**/ }
  /**/ getLastToken(): string {
  /**/   return this.localStorage.getItem(StorageKeys.lastToken) ||''
  /**/ }
  /**/ removeLastToken() {
  /**/   this.localStorage.removeItem(StorageKeys.lastToken)
  /**/ }

  /** stayConnected **/
  /**/ saveStayConnected(stayConnected: boolean) {
  /**/   this.localStorage.setItem(StorageKeys.stayConnected, JSON.stringify(stayConnected))
  /**/ }
  /**/ getStayConnected(): boolean {
  /**/   return JSON.parse(this.localStorage.getItem(StorageKeys.stayConnected) || 'false');
  /**/ }
  /**/ removeStayConnected() {
  /**/   this.localStorage.removeItem(StorageKeys.stayConnected)
  /**/ }

  /** alreadyConnected **/
  /**/ setAlreadyConnected(val: boolean) {
  /**/   this.localStorage.setItem(StorageKeys.alreadyConnected, JSON.stringify(val))
  /**/ }
  /**/ getAlreadyConnected(): boolean {
  /**/   return JSON.parse(this.localStorage.getItem(StorageKeys.alreadyConnected) || 'false');
  /**/ }
  /**/ removeAlreadyConnected() {
  /**/   this.localStorage.removeItem(StorageKeys.alreadyConnected)
  /**/ }

  /** lastUpdateTimestamp **/
  /**/ saveLastUpdateTimestamp(timestamp: number) {
  /**/   this.localStorage.setItem(StorageKeys.lastUpdateTimestamp, JSON.stringify(timestamp))
  /**/ }
  /**/ getLastUpdateTimestamp(): number {
  /**/   return JSON.parse(this.localStorage.getItem(StorageKeys.lastUpdateTimestamp) || '0') as number
  /**/ }

  /** queuedDataToUpdate **/
  /**/ saveQueueUpdate(queueUpdate: UpdateDataWithLogs) {
  /**/   this.localStorage.setItem(StorageKeys.queuedDataToUpdate, JSON.stringify(queueUpdate))
  /**/ }
  /**/ getQueueUpdate(): UpdateDataWithLogs {
  /**/   return JSON.parse(this.localStorage.getItem(StorageKeys.queuedDataToUpdate) || 'null') as UpdateDataWithLogs;
  /**/ }
  /**/ removeQueueUpdate() {
  /**/   this.localStorage.removeItem(StorageKeys.queuedDataToUpdate)
  /**/ }

  handleDisconnect(forceClear: boolean = false) {
    let token = this.getToken()

    if(token === sessionStorage.getItem(StorageKeys.token) || forceClear) {
      if(!this.getStayConnected() || forceClear) {
        this.localStorage.removeItem(StorageKeys.stayConnected)
        this.localStorage.removeItem(StorageKeys.token)
        this.localStorage.removeItem(StorageKeys.lastUpdateTimestamp);
        this.localStorage.removeItem(StorageKeys.data);
      }
      this.localStorage.removeItem(StorageKeys.alreadyConnected)
      sessionStorage.removeItem(StorageKeys.token)
    }
  }
  
  clear(): void {
    this.localStorage.clear();
  }
}
