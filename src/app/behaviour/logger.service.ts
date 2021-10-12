import { Injectable } from "@angular/core";
import { LocalStorageService } from "../services/local-storage.service";

@Injectable()
export class LoggerService {

  private logs: (string | string[])[];

  constructor(private localStorage: LocalStorageService) {
    let oldLogs = this.localStorage.get('logs');
    if ( oldLogs ) {
      this.logs = JSON.parse(oldLogs);
    } else {
      this.logs = [];
      this.save();
    }

    (window as any).logger = this;
  }

  push(message: string | string[]) {
    this.logs.push(message);
    return this;
  }

  add(...rest: any[]) {
    console.log('>', rest);
    this.push(rest);
    return this;
  }

  save() {
    this.localStorage.set('logs', JSON.stringify(this.logs));
  }

  clear() {
    this.logs.length = 0;
    this.localStorage.set('logs', '[]');
  }

  log(count = Infinity) {
    for ( let i = this.logs.length-1; i >= 0; i++ ) {
      console.log(this.logs[i]);
      count--;
      if ( !count )
        break;
    }
    return this;
  }

  static CHANGE = 0;
  static SET = 1;
  static CLICK = 2;

  static bind(element: any, listener: (event: Event, callback: any) => void) {
    let type = element.type, [event, eventType, callback] = LoggerService.eventOf(type);
    element.addEventListener(event, (e: Event) => {
      if ( !e.isTrusted ) return; //we only want user events
      listener(e, callback);
    });
  }

  static change(topic: string, newValue: any, oldValue: any) {
    return [topic, LoggerService.CHANGE, oldValue, newValue];
  }

  static click(topic: string) {
    return [topic, LoggerService.CLICK];
  }

  static set(topic: string, value: any) {
    return [topic, LoggerService.SET, value];
  }

  static eventOf(type?: string) {
    if ( type == 'submit' || type == 'range' || !type )
      return ['click', LoggerService.CLICK, LoggerService.click];
    else if ( type == 'password' )
      return ['change', LoggerService.SET, LoggerService.set]
    return ['change', LoggerService.CHANGE, LoggerService.change];
  }
}