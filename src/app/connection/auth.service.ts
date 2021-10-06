import {
  HttpClient,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  token: string;
  username: string = '';
  isLoggedIn = new BehaviorSubject<boolean>(false);
  errorCode: number = 0

  constructor(private http: HttpClient, private router: Router, private localStorageService: LocalStorageService) {
    this.token = this.localStorageService.get("token") || '';
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
            this.localStorageService.set('token', this.token);
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
    this.localStorageService.set("stayConnected", val? "true" : '');
  }
  getStayConnected(): boolean {
    if(this.localStorageService.get("data") && this.localStorageService.get("token")) {
      return this.localStorageService.get("stayConnected");
    } else { return false;}
  }

  logoutFromServer() {
    setTimeout(() => {
      this.localStorageService.clear();
      this.isLoggedIn.next(false)
      this.router.navigate(['login']);
    }, 1000);
  }
}