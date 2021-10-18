import {
  HttpClient,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LoggerService } from '../behaviour/logger.service';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';
import { DataService } from '../services/data.service';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  token: string;
  username: string = '';
  isLoggedIn = new BehaviorSubject<boolean>(false);
  errorCode: number = 0

  constructor(private http: HttpClient, private router: Router, private localStorageService: LocalStorageService, private dataService: DataService, private logger: LoggerService) {
    this.token = this.localStorageService.getToken();
  }

  loginToServer(username: string, password: string) {
    const data = {
      username,
      password,
    };
    return (
      this.http
        .post(environment.backUrl + 'visioServer/api-token-auth/', data)
        .pipe(
          map((response: any) => {
            this.token = response['token'];
            this.username = username;
            this.localStorageService.saveToken(this.token);
            this.isLoggedIn.next(true);
            return true;
          })
        ) || of(false)
    );
  }

  getUser() {
    return { name: this.username };
  }

  getAuthorizationToken() {
    return this.token;
}

  checkToken(token: string, logInputs: {username: string, password: string}) {
    return false
  }

  setStayConnected(val: boolean) {
    this.localStorageService.saveStayConnected(val? true : false);
    this.logger.handleEvent(LoggerService.events.STAY_CONNECTED, !!val);
    this.logger.actionComplete();
    
  }
  getStayConnected(): boolean {
    if(this.localStorageService.getData() && this.localStorageService.getToken()) {
      let logged = this.localStorageService.getStayConnected();
      this.logger.handleEvent(LoggerService.events.STAY_CONNECTED, !!logged);
      this.logger.actionComplete();
      return logged;
    } else { return false;}
  }

  logoutFromServer() {
    setTimeout(() => {
      this.dataService.endUpdateThread();
      this.localStorageService.handleDisconnect()

      this.isLoggedIn.next(false);
      this.router.navigate(['login']);
    }, 1000);
  }
}