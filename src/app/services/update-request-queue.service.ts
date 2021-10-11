import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UpdateRequestQueueService {
  private updateQueue : any[] = [];

  constructor(private dataService: DataService, private localStorage: LocalStorageService) {

  }

  storeRequest(request: any) {
    console.log("newly stored update request : ", request)
    this.updateQueue.push();
    this.localStorage.set('updateQueue', JSON.stringify(this.updateQueue))
  }

  empty(){
    this.updateQueue = JSON.parse(this.localStorage.get('updateQueue')) as any[]
    console.log("Sending all stored requests data  : ", this.updateQueue)
    if(this.updateQueue) {
      for(let data of this.updateQueue) {
        this.dataService.updateData(data)
      }
      this.localStorage.set('updateQueue', JSON.stringify([]))
    }
  }
}