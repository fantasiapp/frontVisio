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
  }

  push(message: string | string[]) {
    console.log('pushing', message);
    this.logs.push(message);
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

  static eventOf(type: string) {
    if ( type == 'submit' )
      return 'click';
    return 'change';
  }
}