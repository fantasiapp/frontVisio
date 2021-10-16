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
import { Snapshot, structureSnapshot } from '../behaviour/logger.service';

export const enum UpdateFields {
  targetLevelAgentP2CD = "targetLevelAgentP2CD",
  targetLevelAgentFinition = "targetLevelAgentFinition",
  targetLevelDrv = "targetLevelDrv",
  pdvs = "pdvs",
  logs = "logs"
}

export type UpdateData = {
  [key in UpdateFields]: { [id: number]: any[]; } | any[][];
};

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http : HttpClient, private localStorage : LocalStorageService) {}
  
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
        this.update.next();
        this.sendQueuedDataToUpdate();
        this.setLastUpdateDate((data as any).timestamp)
      });
    return this.response;
  }

  public requestUpdateData() {
    this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "request", "timestamp": this.localStorage.getLastUpdateTimestamp() || DataExtractionHelper.get('timestamp')}})
    .subscribe((response : any) => {
      if(response !== {}) {
        if(response.message) {
          console.debug("Empty update")
        } else {
          console.log("Updates received from back : ", response)
          DataExtractionHelper.updateData(response);
          this.update.next();
          this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "acknowledge"}}).subscribe((ackResponse : any) => this.setLastUpdateDate(ackResponse.timestamp)
          )
        }
        
        this.sendQueuedDataToUpdate();
      }
    });
  }

  private dataToUpdate:UpdateData = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
  private queuedDataToUpdate: UpdateData = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};

  update: Subject<never> = new Subject;

  public updatePdv(pdv: any[], id: number) {
    this.dataToUpdate['pdvs'][id] = pdv;
    this.sendDataToUpdate(this.dataToUpdate);
    this.dataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
  }

  updateTargetLevel(targetLevel: number[], targetLevelName: UpdateFields, id: number) {
    this.dataToUpdate[targetLevelName][id] = targetLevel;
    this.sendDataToUpdate(this.dataToUpdate);
    this.dataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
  }

  // public updateData(data: UpdateData) { //then sends immediate changes to the back, and the logs, sends the queuedData to the back 
  //   this.sendDataToUpdate(data)
  // }

  private sendDataToUpdate(data: UpdateData) {
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}}).subscribe((response: any) => {if(response && !response.error) this.sendQueuedDataToUpdate()})
    DataExtractionHelper.updateData(data);
    this.update.next();
  }
  private sendQueuedDataToUpdate() {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate();
    if(this.queuedDataToUpdate) {
      this.http.post(environment.backUrl + 'visioServer/data/', this.queuedDataToUpdate
      , {params : {"action" : "update"}}).subscribe((response: any) => {this.localStorage.removeQueueUpdate(); this.queuedDataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};})
      DataExtractionHelper.updateData(this.queuedDataToUpdate);
      this.update.next();    
    }
  }
  public queueSnapshot(snapshot: Snapshot) {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate() || {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
    let snapshotAsList: any[] = []
    for(let field of structureSnapshot) snapshotAsList.push((<any>snapshot)[field]);
    (this.queuedDataToUpdate['logs'] as any[][]).push(snapshotAsList)
    this.localStorage.saveQueueUpdate(this.queuedDataToUpdate);
  }
  public beginUpdateThread() {
    this.updateSubscriber = interval(+DataExtractionHelper.get('params')['delayBetweenUpdates']*1000)
    // this.updateSubscriber = interval(10000)
    .subscribe(() => {this.requestUpdateData()})
  }

  public endUpdateThread() {
    this.updateSubscriber.unsubscribe()
  }

  setLastUpdateDate(timestamp: string) {
    console.log("Save local updte timestamp")
    this.localStorage.saveLastUpdateTimestamp(+timestamp)
  }
  getLastUpdateDate() {
    let lastUpdateTimestamp: number = this.localStorage.getLastUpdateTimestamp()*1000 || 0
    return new Date(lastUpdateTimestamp);
  }

  queueUpdate(dict: UpdateData) {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate();
    if(!this.queuedDataToUpdate) this.queuedDataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
    for(let [field, updates] of Object.entries(dict)) {
      for(let [id, update] of Object.entries(updates)) {
        this.queuedDataToUpdate[field as UpdateFields][+id] = update;
      }
    }
    this.localStorage.saveQueueUpdate(this.queuedDataToUpdate)
  }  
}