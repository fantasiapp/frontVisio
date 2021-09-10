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
  username: string = '';
  isLoggedIn = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.token = sessionStorage.getItem('token') || '';
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
            sessionStorage.setItem('token', this.token);
            this.isLoggedIn.next(true);
            return true;
          })
        ) || of(false)
    );
  }

  getUser() {
    return { name: this.username };
  }

  logoutFromServer() {
    setTimeout(() => {
      sessionStorage.removeItem('token');
      this.isLoggedIn.next(false)
      this.router.navigate(['login']);
      localStorage.clear();
      sessionStorage.clear();
    }, 1000);
  }
}
