import { HttpClient, HttpHeaders} from '@angular/common/http';
import { typeofExpr } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { Subject, interval } from 'rxjs';
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
  updateSubscriber: any;

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
      // console.log("Updated data received : ", response)
      if(response !== {}) {
        DataExtractionHelper.updateData(response);
        this.update.next();
        this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "acknowledge"}}).subscribe((response) => console.log("Ack response : ", response))
      }
    });
  }

  private dataToUpdate:{[name: string]: {[id: number]: number[]}} = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv': {}, 'pdvs': {}}
  emptyData : {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv': {}, 'pdvs': {[id: number]: any}} = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}}

  update: Subject<never> = new Subject;

  public updatePdv(pdv: any[], id: number) {
    this.dataToUpdate['pdvs'][id] = pdv;
    this.updateData(this.dataToUpdate);
    this.dataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv': {}, 'pdvs': {}};
  }

  updateTargetLevel(targetLevel: number[], targetLevelName: string, id: number) {
    this.dataToUpdate[targetLevelName][id] = targetLevel;
    this.updateData(this.dataToUpdate);
    this.dataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv': {}, 'pdvs': {}};
  }


  public updateData(data: {[name: string]: {[id: number]: number[]}}): Observable<Object|null> {
    // console.log("Sending data to back for update : ", data)
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}})
    .subscribe((updateResponse) => {
      // console.log("Response obtained : ", updateResponse);
    });
    DataExtractionHelper.updateData(data);
    this.update.next();
    return this.response;
  }

  public sendLog(data: any) {
    console.log("Sending data to back for logs : ", data)
    this.http.post(environment.backUrl + '/visioServer/data/', data)
    .subscribe((response) => {
      console.log("Log response : ", response)
    })
  }

  public beginUpdateThread() {
    this.updateSubscriber = interval(10000)
    .subscribe(() => {this.requestUpdateData()})
  }

  public endUpdateThread() {
    this.updateSubscriber.unsubscribe()
  }
}