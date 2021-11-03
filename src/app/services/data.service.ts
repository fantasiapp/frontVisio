import { HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import { typeofExpr } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { Subject, interval, AsyncSubject } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { map, } from 'rxjs/internal/operators/map';
import { environment } from 'src/environments/environment';
import DEH from '../middle/DataExtractionHelper';
import { LocalStorageService } from './local-storage.service';
import { catchError } from "rxjs/operators";
import { Snapshot, structureSnapshot } from '../behaviour/logger.service';

export const enum UpdateFields {
  targetLevelAgentP2CD = "targetLevelAgentP2CD",
  targetLevelAgentFinition = "targetLevelAgentFinitions",
  targetLevelDrv = "targetLevelDrv",
  pdvs = "pdvs",
  logs = "logs"
}

export type UpdateData = {
  [key in UpdateFields]: { [id: number]: any[]; };
};

@Injectable()
export class DataService {

  constructor(private http : HttpClient, private localStorage : LocalStorageService) {
    console.log('[DataService]: On.');
  }
  
  response = new BehaviorSubject<Object|null>(null);
  update: Subject<null> = new Subject;
  load: Subject<null> = new Subject;

  private threadIsOn: boolean = false;
  updateSubscriber: any;
  logSubscriber: any;
  $serverLoading: AsyncSubject<boolean> = new AsyncSubject();


  public requestData(){ //used at login, and with refresh button to ask immediatly data from the back
    (
      this.http.get(environment.backUrl + 'visioServer/data/', {
        params : {"action" : "dashboard"},
      }) as Observable<Object[]>
    ) 
      .pipe(
        map((data: any) => {
          // data.params['isAdOpen'] = false
          return data;
        })
      )
      .subscribe((data: any) => {
        if(data.warning ||data.error) {
          console.log("Server temporarly unavailable. Please wait (estimated : 2min)...")
          this.$serverLoading.next(true);
          this.$serverLoading.complete();
          setTimeout(() => this.requestData(), 30000)
        } else {
          console.log("RequestData successfull")
          this.$serverLoading.next(false);
          this.load.next();
          this.response.next(data);
          this.update.next()
          this.sendQueuedDataToUpdate();
          this.setLastUpdateDate((data as any).timestamp)
        }});
  }

  public requestUpdateData() { //
    this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "request", "timestamp": this.localStorage.getLastUpdateTimestamp() || DEH.get('timestamp')}})
    .subscribe((response : any) => {
      if( response ) { //this is always false response !== {}
        if(response.message) {
          console.debug("Empty update")
        } else if(response.warning) {
          console.debug("Server temporarly unavailable")
        }
        else {
          console.log("Updates received from back : ", response)
          DEH.updateData(response);
          this.update.next()
          this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "acknowledge"}}).subscribe((ackResponse : any) => this.setLastUpdateDate(ackResponse.timestamp)
          )
        }
        
        this.sendQueuedDataToUpdate();
      }
    });
  }

  private dataToUpdate:UpdateData = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinitions': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
  private queuedDataToUpdate: UpdateData = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinitions': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};

  public updatePdv(pdv: any[], id: number) {
    this.dataToUpdate['pdvs'][id] = pdv;
    this.sendDataToUpdate(this.dataToUpdate);
    this.dataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinitions': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
  }

  updateTargetLevel(targetLevel: number[], targetLevelName: UpdateFields, id: number) {
    this.dataToUpdate[targetLevelName][id] = targetLevel;
    this.sendDataToUpdate(this.dataToUpdate);
    this.dataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinitions': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
  }

  // public updateData(data: UpdateData) { //then sends immediate changes to the back, and the logs, sends the queuedData to the back 
  //   this.sendDataToUpdate(data)
  // }

  private sendDataToUpdate(data: UpdateData) { //used to send immediatly data to the back
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}}).subscribe((response: any) => {if(response && !response.error) this.sendQueuedDataToUpdate()})
    DEH.updateData(data);
    this.update.next();
    console.log("Sending data for update : ", data)
  }
  
  public BEFOREsendQueuedDataToUpdate() { //used jsut before getting data from the server, to send stored queued updates
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate();
    if(this.queuedDataToUpdate) {
      this.http.post(environment.backUrl + 'visioServer/data/', this.queuedDataToUpdate
      , {params : {"action" : "update"}}).subscribe((response: any) => {
            if(response && !response.error) {
              this.localStorage.removeQueueUpdate();
              this.queuedDataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinitions': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
            }
          })
    }
  }

  public sendQueuedDataToUpdate() { //used to send data every 10 seconds to the back
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate();
    if(this.queuedDataToUpdate) {
      this.http.post(environment.backUrl + 'visioServer/data/', this.queuedDataToUpdate
      , {params : {"action" : "update"}}).subscribe((response: any) => {
          if(response.message != false)
            this.localStorage.removeQueueUpdate(); 
            this.queuedDataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinitions': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
        })
    }
  }
  public queueSnapshot(snapshot: Snapshot) {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate() || {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinition': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
    let snapshotAsList: any[] = []
    for(let field of structureSnapshot)
      snapshotAsList.push((<any>snapshot)[field]);
    (this.queuedDataToUpdate['logs'] as any[][]).push(snapshotAsList)
    this.localStorage.saveQueueUpdate(this.queuedDataToUpdate);
  }
  public beginUpdateThread() {
    if(!this.threadIsOn) {
      console.log("[Data Service] Begin update threads")
      this.updateSubscriber = interval(DEH.delayBetweenUpdates > 10000 ? DEH.delayBetweenUpdates : 20000).subscribe(() => {console.log("the thread are ON"); this.requestUpdateData()})
      this.logSubscriber = interval(60000).subscribe(() => {this.sendQueuedDataToUpdate()})
      setTimeout(() => this.endUpdateThread(), 300000)
    }
    this.threadIsOn = true;
  }

  public endUpdateThread() {
    console.log("[Data Service] End update threads")
    this.threadIsOn = false;
    this.updateSubscriber?.unsubscribe();
    this.logSubscriber?.unsubscribe();
  }

  setLastUpdateDate(timestamp: string) {
    this.localStorage.saveLastUpdateTimestamp(+timestamp)
  }
  getLastUpdateDate() {
    let lastUpdateTimestamp: number = this.localStorage.getLastUpdateTimestamp()*1000 || 0
    return new Date(lastUpdateTimestamp);
  }

  queueUpdate(dict: UpdateData) {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate();
    if(!this.queuedDataToUpdate) this.queuedDataToUpdate = {'targetLevelAgentP2CD': {}, 'targetLevelAgentFinitions': {}, 'targetLevelDrv':{}, 'pdvs': {}, 'logs': []};
    for(let [field, updates] of Object.entries(dict)) {
      for(let [id, update] of Object.entries(updates)) {
        this.queuedDataToUpdate[field as UpdateFields][+id] = update;
      }
    }
    this.localStorage.saveQueueUpdate(this.queuedDataToUpdate)
  }  
}