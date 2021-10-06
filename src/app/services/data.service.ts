import { HttpClient, HttpHeaders} from '@angular/common/http';
import { typeofExpr } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { environment } from 'src/environments/environment';
import DataExtractionHelper from '../middle/DataExtractionHelper';

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

  public requestUpdateData() {
    this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "request"}})
    .subscribe((response : any) => {
      console.log("Updated data received : ", response ? response as any : this.dataToUpdate)
      DataExtractionHelper.updateData(this.emptyData);
      this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "acknowledge"}}).subscribe((response) => console.log("Ack response : ", response))
    });
  }

  private dataToUpdate: {'targetLevelAgentP2CD': any[], 'targetLevelAgentFinition': any[], 'targetLevelDrv': any[], 'pdvs': any[]} = {'targetLevelAgentP2CD': [], 'targetLevelAgentFinition': [], 'targetLevelDrv': [], 'pdvs': []}
  emptyData : {'targetLevelAgentP2CD': any[], 'targetLevelAgentFinition': any[], 'targetLevelDrv': any[], 'pdvs': any[]} = {'targetLevelAgentP2CD': [], 'targetLevelAgentFinition': [], 'targetLevelDrv': [], 'pdvs': []}

  public updatePdv(pdv: any[]) {
    this.dataToUpdate['pdvs'].push(pdv);

    this.updateData(this.dataToUpdate);

    this.dataToUpdate = {'targetLevelAgentP2CD': [], 'targetLevelAgentFinition': [], 'targetLevelDrv': [], 'pdvs': []};
  }

  public updateData(data: {'targetLevelAgentP2CD': any[], 'targetLevelAgentFinition': any[], 'targetLevelDrv': any[], 'pdvs': any[]}): Observable<Object|null> {
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}})
    .subscribe((updateResponse) => {
      console.log("Response obtained : ", updateResponse)
      DataExtractionHelper.updateData(data)
    });
    return this.response;
  }
}