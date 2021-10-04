import { HttpClient} from '@angular/common/http';
import { typeofExpr } from '@angular/compiler/src/output/output_ast';
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
    (
      this.http.get(environment.backUrl + 'visioServer/data/', {
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

  public requestUpdateData(): Observable<Object|null> {
    this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update"}})
    .subscribe((updatedData) => {
      this.response.next(updatedData);
    });
    return this.response;
  }

  public updateData(data: {[field: string]: []}): Observable<Object|null> {
    this.http.post(environment.backUrl + 'visioServer/data/', data, {params : {"action" : "update"}})
    .subscribe((updateReponse) => {
      this.response.next(updateReponse)
    });
    return this.response;
  }
}
