import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  token: string;
  username: string ='';

  constructor(private http: HttpClient, private router: Router) {
    this.token = sessionStorage.getItem('token') || '';
  }

  loginToServer(username: string, password: string) {
    const data = {
      username,
      password,
    };
    return this.http
      .post(environment.backUrl + 'visioServer/api-token-auth/', data)
      .pipe(
        map((response : any) => {
          this.token = response['token'];
          this.username = username;
          sessionStorage.setItem('token', this.token);
          return true;
        })
      );
  }

  getUser() {
    return { name: this.username };
  }

  logoutFromServer() {
    setTimeout(() => {
      console.log('entered logout');
      sessionStorage.removeItem('token');
      // this.token = null;
      this.router.navigate(['login']);
    }, 1000);
  }
}
