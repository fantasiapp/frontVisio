import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http : HttpClient) {}

  public requestData(): Observable<Object|null> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Token ${token}`});
    const response = new BehaviorSubject<Object|null>(null);
    (
      this.http.get(environment.backUrl + 'visioServer/data/', {
        headers,
        params : {"action" : "navigation"},
      }) as Observable<Object[]>
    )
      .pipe(
        map((data) => {
          console.debug('DATA ', data);
          return data;
        })
      )
      .subscribe((data) => {
        response.next(data);
      });
    return response;
  }
}
