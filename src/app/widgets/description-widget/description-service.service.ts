import { Injectable, EventEmitter } from '@angular/core';


//Used for 2 way communication between histocolumn target and description widget
@Injectable()
export class TargetService {

  targetChange: EventEmitter<string> = new EventEmitter;
  private _target: string = 'Objectif';
  constructor() { }

  set target(value: string) {
    if ( this._target === value)
      return;
    this._target = value;
    this.targetChange.emit(this._target);
  }

  get target() { return this._target; }
}
