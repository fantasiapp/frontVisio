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
      if(response !== {}) {
        if(response.message) {
          console.debug("Empty update")
        } else {
          DataExtractionHelper.updateData(response);
          this.update.next();
          this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "acknowledge"}}).subscribe((response) => console.log("Ack response : ", response))
        }
        }
      this.lastUpdateDate = new Date;
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


  public updateData(data: {[name: string]: {[id: number]: number[]}}) {
    console.log("Sending data to back for update : ", data)
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}}).subscribe()
    DataExtractionHelper.updateData(data);
    this.update.next();
  }

  public sendStoredData(data: {[name: string]: {[id: number]: number[]}}) {
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}})
  }


  public sendLog(data: any) {
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

  storeRequest(requestData: any) {
    console.log("newly stored update request : ", requestData)
    this.updateQueue.push(requestData);
    this.localStorage.set('updateQueue', JSON.stringify(this.updateQueue))
  }

  emptyQueue(){
    this.updateQueue = JSON.parse(this.localStorage.get('updateQueue')) as any[]
    console.log("Sending all stored requests data  : ", this.updateQueue)
    if(this.updateQueue) {
      for(let data of this.updateQueue) {
        this.updateData(data)
      }
      this.localStorage.remove('updateQueue')
    }
  }

  
}