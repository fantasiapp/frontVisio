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
  
  response = new BehaviorSubject<Object|null>(null);
  public requestData(): Observable<Object|null> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Token ${token}`});
    (
      this.http.get(environment.backUrl + 'visioServer/data/', {
        headers,
        params : {"action" : "dashboard"},
      }) as Observable<Object[]>
    )
      .pipe(
        map((data) => {
          console.debug('DATA ', data);
          return data;
        })
      )
      .subscribe((data) => {
        this.response.next(data);
      });
    return this.response;
  }
}
