import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';


//Used for 2 way communication between histocolumn target and description widget
@Injectable()
export class TargetService {

  private _target: string = 'Objectif';
  targetChange: Subject<string> = new Subject();
  constructor() { }

  reset() { this._target = 'Objectif'; }

  set target(value: string) {
    if ( this._target === value)
      return;
    this._target = value;
    this.targetChange.next(this._target);
  }

  get target() { return this._target; }
}
