import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TargetService {

  targetChange: EventEmitter<string> = new EventEmitter;
  private _target: string = 'Objectif';
  constructor() { }

  setTarget(value: string) {
    if ( this._target === value)
      return false;
    this._target = value;
    this.targetChange.emit(this._target);
    return false;
  }

  getTarget() { return this._target; }
}
