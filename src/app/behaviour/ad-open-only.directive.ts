import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';

@Directive({
  selector: '[adOpenOnly]'
})
export class AdOpenOnlyDirective {

  constructor(private el: ElementRef) { }
  private _allowed?: boolean = false;

  public get allowed(): boolean {
    return this._allowed ? true : false;
  }

  ngAfterViewInit() {
    this._allowed = DataExtractionHelper.get('params')['isAdOpen'];
    this.el.nativeElement.disabled = !this._allowed; 
  }
}