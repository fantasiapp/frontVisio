import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  localStorage: Storage;

  constructor() {
    this.localStorage = window.localStorage;
  }

  get(key: string): any {
    return (this.localStorage.getItem(key));
  }

  set(key: string, value: string): void {
    this.localStorage.setItem(key, value);
  }

  remove(key: string): void {
    this.localStorage.removeItem(key);
  }
  
  clear(): void {
    this.localStorage.clear();
  }
}
