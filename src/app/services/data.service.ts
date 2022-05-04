import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, interval, AsyncSubject } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { map, } from 'rxjs/internal/operators/map';
import { environment } from 'src/environments/environment';
import DEH, { Params } from '../middle/DataExtractionHelper';
import { LocalStorageService } from './local-storage.service';
import { Snapshot, structureSnapshot } from './logger.service';

export const enum UpdateFields {
  pdvs = "pdvs",
  targetLevelAgentP2CD = "targetLevelAgentP2CD",
  targetLevelAgentFinitions = "targetLevelAgentFinitions",
  targetLevelDrv = "targetLevelDrv",
}

export type UpdateData = {
  [key in UpdateFields]: { [id: number]: any[]; };
};

export interface UpdateDataWithLogs extends UpdateData {
  logs: any[][];
}

/**
 * The service is responsible the communication with the server through request
 * 
 * Some of the request behiavour is defined with the HttpInterceptors (src/app/http-interceptors)
 */

/**
 * 
 *    [--------]                                                                                                                                                                                  [--------]
 *    |        |  [ ---- requestData() ------------------------------------------------------------------------------------------------------------------------------------------------------> ]  |        |
 *    |        |  [   GET request at '{backUrl}/visioServer/data/?action=dashboard'                                                                                                            ]  |        |
 *    |        |  [                                                                                                                                                                            ]  |        |
 *    |        |  [ <-----------------------------------------------------------------------------------------------------------------------------------------------------------response ----  ]  |        |
 *    |        |  [   {warning: '...'} or {error: '...'}                                                                                                                                       ]  |        |
 *    |        |  [     The server is currently unavailable.                                                                                                                                   ]  |        |
 *    |        |  [     The request is then reposted after 30 seconds                                                                                                                          ]  |        |
 *    |        |  [ OR                                                                                                                                                                         ]  |        |
 *    |        |  [   Full data json                                                                                                                                                           ]  |        |
 *    |        |  [     - Calls next on Observables for AuthService, LocalStorageService, FilterStateService                                                                                   ]  |        |
 *    |        |  [     - Updates last update timestamp                                                                                                                                        ]  |        |
 *    |        |  [     - Initiates update thread                                                                                                                                              ]  |        |
 *    |        |  [     - If necessary, sends request for stored updates from last session                                                                                                     ]  |        |
 *    |        |                                                                                                                                                                                  |        |
 *    |        |                                                                                                                                                                                  |        |
 *    |        |  [ ---- sendQueuedDataToUpdate() -------------------------------------------------------------------------------------------------------------------------------------------->]  |        |
 *    |        |  [   POST request at '{backUrl}/visioServer/data/?action=update' containing the UpdateData object stored by the LocalStorageService                                           ]  |        |
 *    |        |  [                                                                                                                                                                            ]  |        |
 *    |        |  [ <----------------------------------------------------------------------------------------------------------------------------------------------------------- response ---- ]  |        |
 *    |        |  [   {message: "postUpdate received"}                                                                                                                                         ]  |        |
 *    |        |  [     Stored UpdateData is deleted from LocalStorageService                                                                                                                  ]  |        |
 *    |        |  [ OR                                                                                                                                                                         ]  |        |
 *    | CLIENT |  [   Anything else                                                                                                                                                            ]  | SERVER |
 *    |        |  [     Something went wrong, the updates were not considered by the server. Do nothing                                                                                        ]  |        |
 *    |        |                                                                                                                                                                                  |        |
 *    |        |                                                                                                                                                                                  |        |
 *    |        |  [ ---- sendDataToUpdate(data: UpdateDataWithLogs) -------------------------------------------------------------------------------------------------------------------------->]  |        |
 *    |        |  [   POST request at '{backUrl}/visioServer/data/?action=update' containing data                                                                                              ]  |        |
 *    |        |  [                                                                                                                                                                            ]  |        |
 *    |        |  [ <------------------------------------------------------------------------------------------------------------------------------------------------------------- response ---]  |        |
 *    |        |  [ IF HttpError                                                                                                                                                               ]  |        |
 *    |        |  [     (This behaviour is handled by src/app/http-interceptors/error-interceptor.ts)                                                                                          ]  |        |
 *    |        |  [     An error occured, the server didn't receive the data.                                                                                                                  ]  |        |
 *    |        |  [     The UpdateData object is added to the queued updates by the LocalStorageService                                                                                        ]  |        |
 *    |        |  [ IN ANY CASE                                                                                                                                                                ]  |        |
 *    |        |  [     Calls local update in DEH with data                                                                                                                                    ]  |        |
 *    |        |                                                                                                                                                                                  |        |
 *    |        |                                                                                                                                                                                  |        |
 *    |        |  [ ---- requestUpdateData() ------------------------------------------------------------------------------------------------------------------------------------------------->]  |        |
 *    |        |  [   GET request at '{backUrl}/visioServer/data/?action=update&nature=request&timestamp={lastUpdateTimestamp}'                                                                ]  |        |
 *    |        |  [                                                                                                                                                                            ]  |        |
 *    |        |  [ <------------------------------------------------------------------------------------------------------------------------------------------------------------- response ---]  |        |
 *    |        |  [   {message: '...'} OR {warning: '...'}                                                                                                                                     ]  |        |
 *    |        |  [     Something went wrong. Do nothing                                                                                                                                       ]  |        |
 *    |        |  [ OR                                                                                                                                                                         ]  |        |
 *    |        |  [   UpdateData object                                                                                                                                                        ]  |        |
 *    |        |  [     - Calls local update in DEH with data                                                                                                                                  ]  |        |
 *    |        |  [     - Calls next on update Observable                                                                                                                                      ]  |        |
 *    |        |  [     - Sends GET request as Acknowledgment at {backUrl}/visioServer/data/?action=update&nature=acknowledge'                                                                 ]  |        |
 *    |        |  [ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------->]  |        |
 *    |        |  [ <------------------------------------------------------------------------------------------------------------------------------------------------------------- response ---]  |        |
 *    |        |  [     Calls udpate  LastUpdateTimestamp in LocalStorageService                                                                                                               ]  |        |
 *    [--------]                                                                                                                                                                                  [--------]
 * 
 */

@Injectable()
export class DataService {
  
                    /**************/
                    /*  Variables */
                    /**************/

  response = new BehaviorSubject<Object|null>(null); //Used to notify the AuthSercvice and FilterService once the data has been fetched
  update: Subject<null> = new Subject;  //Used once an UpdateData object has been handled by the back (for sending or receiving)
  load: Subject<null> = new Subject;  //Used to notify the LoginPageComponent once the full data has been received
  onlyRefresh: boolean = false; // specify whether TableComponent should call update() or refresh()

  private threadIsOn: boolean = false;
  updateSubscriber: any;
  logSubscriber: any;
  $serverLoading: Subject<boolean> = new Subject();

  private dataToUpdate: UpdateDataWithLogs = {targetLevelAgentP2CD: {}, targetLevelAgentFinitions: {}, targetLevelDrv:{}, pdvs: {}, logs: []};
  private queuedDataToUpdate: UpdateDataWithLogs = {targetLevelAgentP2CD: {}, targetLevelAgentFinitions: {}, targetLevelDrv:{}, pdvs: {}, logs: []};
  
  constructor(private http : HttpClient, private localStorage : LocalStorageService) {
    console.log('[DataService]: On.');
  }


                    /********************/
                    /*  Request methods */
                    /********************/

  public forceRequestData: boolean = false;
  /** Called to get the last version of the full data, on login, offline connection, or application refresh **/
  public requestData(force: boolean = false){
    this.forceRequestData = force;
    (
      this.http.get(environment.backUrl + 'visioServer/data/', {
        params : {"action" : "dashboard"},
      }) as Observable<Object[]>
    ) 
      .pipe(
        map((data: any) => {
          return data;
        })
      )
      .subscribe((data: any) => {
        this.forceRequestData = false;
        if(data.warning || data.error) {
          console.log("Server temporarly unavailable. Please wait (estimated : 2min)...")
          this.$serverLoading.next(true);
          setTimeout(() => this.requestData(), 30000)
        } else {
          console.log("RequestData successfull")
          this.onlyRefresh = false;
          this.$serverLoading.next(false);
          this.load.next();
          this.response.next(data);
          this.update.next()
          this.sendQueuedDataToUpdate();
          this.setLastUpdateDate((data as any).timestamp)
        }});
  }

  /** Must be called immediatly after each data modification performed by the user **/
  private sendDataToUpdate(data: UpdateDataWithLogs) {
    this.http.post(environment.backUrl + 'visioServer/data/', data
    , {params : {"action" : "update"}}).subscribe((response: any) => {if(response && !response.error) this.sendQueuedDataToUpdate()})
    this.onlyRefresh = true;
    DEH.updateData(data as UpdateData);
    this.update.next();
    console.log("Sending data for update : ", data)
  }

  /** Called to request the updates performed by other sessions **/
  public requestUpdateData() {
    this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "request", "timestamp": this.localStorage.getLastUpdateTimestamp() || DEH.get('timestamp')}})
    .subscribe((response : any) => {
      if( response ) {
        if(response.message) {
          console.debug("Empty update")
        } else if(response.warning) {
          console.debug("Server temporarly unavailable")
        } else if(false) {
          this.requestData();
        }
        else if(DEH.currentYear) {
          console.log("Updates received from back : ", response)
          this.onlyRefresh = true;
          DEH.updateData(response as UpdateData);
          this.update.next()
          this.http.get(environment.backUrl + 'visioServer/data/', {params : {"action" : "update", "nature": "acknowledge"}}).subscribe((ackResponse : any) => this.setLastUpdateDate(ackResponse.timestamp)
          )
        }

        if(response.referentielVersion != Params.referentielVersion) {console.log("A new referentiel is active. Reload the data"); this.requestData()}
        
        this.sendQueuedDataToUpdate();
      }
    });
  }

  /** Called regularly to send locally stored updates **/
  public sendQueuedDataToUpdate() {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate();
    if(this.queuedDataToUpdate) {
      this.http.post(environment.backUrl + 'visioServer/data/', this.queuedDataToUpdate
      , {params : {"action" : "update"}}).subscribe((response: any) => {
          if(response.message != false)
            this.localStorage.removeQueueUpdate(); 
            this.emptyData(this.queuedDataToUpdate);
        })
    }
  }

                    /******************/
                    /*  Local methods */
                    /******************/

  public updatePdv(pdv: any[], id: number) {
    this.dataToUpdate.pdvs[id] = pdv;
    this.sendDataToUpdate(this.dataToUpdate);
    this.emptyData(this.dataToUpdate);
  }

  public updateTargetLevel(targetLevel: number[], targetLevelName: UpdateFields, id: number) {
    this.dataToUpdate[targetLevelName][id] = targetLevel;
    this.sendDataToUpdate(this.dataToUpdate);
    this.emptyData(this.dataToUpdate);
  }

  /** Logs are never sent synchronously **/
  public queueSnapshot(snapshot: Snapshot) {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate() || {targetLevelAgentP2CD: {}, targetLevelAgentFinitions: {}, targetLevelDrv:{}, pdvs: {}, logs: []};
    let snapshotAsList: any[] = []
    for(let field of structureSnapshot)
      snapshotAsList.push((<any>snapshot)[field]);
    (this.queuedDataToUpdate.logs as any[][]).push(snapshotAsList)
    this.localStorage.saveQueueUpdate(this.queuedDataToUpdate);
  }

  queueUpdate(dict: UpdateData) {
    this.queuedDataToUpdate = this.localStorage.getQueueUpdate();
    if(!this.queuedDataToUpdate) this.emptyData(this.queuedDataToUpdate);
    for(let [field, updates] of Object.entries(dict)) {
      for(let [id, update] of Object.entries(updates)) {
        this.queuedDataToUpdate[field as UpdateFields][+id] = update;
      }
    }
    this.localStorage.saveQueueUpdate(this.queuedDataToUpdate)
  }

  /** Starts cyclic POST and GET update requests **/
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

  private setLastUpdateDate(timestamp: string) {
    this.localStorage.saveLastUpdateTimestamp(+timestamp)
  }

  getLastUpdateDate() {
    let lastUpdateTimestamp: number = this.localStorage.getLastUpdateTimestamp()*1000 || 0
    return new Date(lastUpdateTimestamp);
  }

  private emptyData(data: UpdateDataWithLogs) {
    data.pdvs = {}
    data.targetLevelAgentP2CD = {}
    data.targetLevelAgentFinitions = {}
    data.targetLevelDrv = {}
    data.logs = []
  }
}