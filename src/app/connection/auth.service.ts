import {
  HttpClient,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of,Subscription } from 'rxjs';
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
  // saveLocalTokenSubject = new BehaviorSubject<boolean>(false);
  errorCode: number = 0;
  // tokenSubscription: Subscription;
  stayConnected: boolean = false;

  constructor(private http: HttpClient, private router: Router, private localStorageService: LocalStorageService, private dataService: DataService, private logger: LoggerService) {
    this.token = this.localStorageService.getToken(); //usefull?
    // this.tokenSubscription = this.saveLocalTokenSubject
    // .subscribe((save: boolean) => 
    //   {this.localStorageService.setActiveToken(this.getAuthorizationToken());
    //    sessionStorage.setItem('token', this.getAuthorizationToken());
    //     if(save) this.localStorageService.saveToken(this.getAuthorizationToken()); 
    //     else this.localStorageService.removeToken()
    //   })
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
            this.handleTokenSave();
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

  handleTokenSave() {
    this.localStorageService.setActiveToken(this.getAuthorizationToken());
    sessionStorage.setItem('token', this.getAuthorizationToken());
  }

  setStayConnected(val: boolean) {
    this.logger.handleEvent(LoggerService.events.STAY_CONNECTED, !!val);
    this.logger.actionComplete();
  }

  isStayConnected(): boolean {
    if(this.localStorageService.getToken()) {
      this.logger.handleEvent(LoggerService.events.STAY_CONNECTED, !!true);
      this.logger.actionComplete();
      return true;
    } else {
      return false;}
  }

  isAlreadyConnected(): boolean {
    return this.localStorageService.getActiveToken()?true:false;
  }

  logoutFromServer() {
    setTimeout(() => {
      this.dataService.endUpdateThread();
      this.localStorageService.handleDisconnect(true)
      this.isLoggedIn.next(false)
      this.router.navigate(['login']);
    }, 1000);
  }
}