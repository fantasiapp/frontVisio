import { HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import { typeofExpr } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { Subject, interval, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { environment } from 'src/environments/environment';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { LocalStorageService } from './local-storage.service';
import { catchError } from "rxjs/operators";

export const enum UpdateFields {
  targetLevelAgentP2CD = "targetLevelAgentP2CD",
  targetLevelAgentFinition = "targetLevelAgentFinition",
  targetLevelDrv = "targetLevelDrv",
  pdvs = "pdvs"
}

export type UpdateData = {
  [key in UpdateFields]: { [id: number]: any[]; };
};





@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http : HttpClient, private localStorage : LocalStorageService) {}
  
  response = new BehaviorSubject<Object|null>(null);
  updateSubscriber: any;
  private lastUpdateDate: Date = new Date;
  private updateQueue : any[] = [];

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
      console.log("New data from the back : ", response)
      if(response !== {}) {
        if(response.message) {
          console.debug("Empty update")
        } else {
          DataExtractionHelper.updateData(response);
          this.update.next();
          this.sendQueuedDataToUpdate();
          // this.sendLogs()
          this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "acknowledge"}}).subscribe((response) => console.log("Ack response : ", response))
        }
        }
      this.lastUpdateDate = new Date;
    });
  }

  emptyData : UpdateData = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}}
  private dataToUpdate:UpdateData = this.emptyData;
  private queuedDataToUpdate:UpdateData = this.emptyData;

  update: Subject<never> = new Subject;

  public updatePdv(pdv: any[], id: number) {
    this.dataToUpdate['pdvs'][id] = pdv;
    this.sendDataToUpdate(this.dataToUpdate);
    this.dataToUpdate = this.emptyData;
  }

  updateTargetLevel(targetLevel: number[], targetLevelName: UpdateFields, id: number) {
    this.dataToUpdate[targetLevelName][id] = targetLevel;
    this.sendDataToUpdate(this.dataToUpdate);
    this.dataToUpdate = this.emptyData;
  }

  // public updateData(data: UpdateData) { //then sends immediate changes to the back, and the logs, sends the queuedData to the back 
  //   this.sendDataToUpdate(data)
  // }

  private sendDataToUpdate(data: UpdateData) {
    console.log("Sending data to back for update : ", data)
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}}).subscribe((response: any) => {if(response && !response.error) this.sendQueuedDataToUpdate()})
    DataExtractionHelper.updateData(data);
    this.update.next();    
  }
  private sendQueuedDataToUpdate() {
    this.queuedDataToUpdate = JSON.parse(this.localStorage.get('queuedDataToUpdate')) as UpdateData;
    console.log("Sending data to back for update : ", this.queuedDataToUpdate)
    if(this.queuedDataToUpdate) {
      this.http.post(environment.backUrl + 'visioServer/data/', this.queuedDataToUpdate
      , {params : {"action" : "update"}}).subscribe((response: any) => {if(response && !response.error) {this.localStorage.remove('queuedDataToUpdate'); this.queuedDataToUpdate = this.emptyData;}})
      DataExtractionHelper.updateData(this.queuedDataToUpdate);
      this.update.next();    
    }
  }

  private sendLogs(data: any) {
    console.log("Sending data to back for logs : ", data)
    this.http.post(environment.backUrl + '/visioServer/data/', data)
    .subscribe((response) => {
      console.log("Log response : ", response)
    })
  }

  public beginUpdateThread() {
    this.updateSubscriber = interval(+DataExtractionHelper.get('params')['delayBetweenUpdates']*1000)
    // this.updateSubscriber = interval(10000)
    .subscribe(() => {this.requestUpdateData()})
  }

  public endUpdateThread() {
    this.updateSubscriber.unsubscribe()
  }

  getLastUpdateDate() {
    return this.lastUpdateDate;
  }

  queueUpdate(dict: UpdateData) {
    console.log("newly stored update request : ", dict)
    for(let [field, updates] of Object.entries(dict)) {
      for(let [id, update] of Object.entries(updates)) {
        this.queuedDataToUpdate[field as UpdateFields][+id] = update;
      }
    }
    this.localStorage.set('queuedDataToUpdate', JSON.stringify(this.queuedDataToUpdate))
  }  
}