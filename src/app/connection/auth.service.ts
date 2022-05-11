import {
  HttpClient,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationResult } from '@azure/msal-browser';
import { SocialUser } from 'angularx-social-login';
import { BehaviorSubject, of,Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import DEH from '../middle/DataExtractionHelper';
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
  private stayConnected: boolean = false;

  constructor(private http: HttpClient, private router: Router, private localStorageService: LocalStorageService, private dataService: DataService) {
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

  loginWithGoogle(userData: SocialUser) {
    const data = {
      username: userData.email,
      authToken: userData.authToken,
    }
    console.log("google query", data);
    return (
      this.http
        .post(environment.backUrl + 'visioServer/api-token-auth-google/', data)
        .pipe(
          map((response: any) => {
            if (response.error) { console.log(response); return false};
            console.log("reponse", response)
            this.token = response['token'];
            this.username = response['username'];
            this.handleTokenSave();
            this.isLoggedIn.next(true);
            return true;
          })
        ) || of(false)
    );
  }

  loginWithAzure(userData: AuthenticationResult) {
    const data = {
      username: userData.account?.username,
      authToken: userData.accessToken
    }
    console.log("azure query", data)
    return (
      this.http
        .post(environment.backUrl + 'visioServer/api-token-auth-azure/', data)
        .pipe(
          map((response: any) => {
            if (response.error) { console.log(response); return false};
            console.log("reponse", response)
            this.token = response['token'];
            this.username = response['username'];
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
    this.localStorageService.saveToken(this.getAuthorizationToken());
    sessionStorage.setItem('token', this.getAuthorizationToken());
  }

  setStayConnected(val: boolean) {
    this.stayConnected = val;
  }

  isStayConnected(): boolean {
    if(this.localStorageService.getToken()) {
      return this.stayConnected = true;
    } else {
      return this.stayConnected = false;
    }
  }

  //Baptiste, is this redundant ?
  getStayConnected() { return this.stayConnected; }

  logoutFromServer() {
    setTimeout(() => {
      this.dataService.sendQueuedDataToUpdate();
      this.localStorageService.handleDisconnect();
      this.isLoggedIn.next(false);
      DEH.resetData();
      this.router.navigate(['login']);
    }, 1000);
  }
}