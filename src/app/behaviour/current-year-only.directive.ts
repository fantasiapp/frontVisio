import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';

@Directive({
  selector: '[currentYearOnly]'
})
export class CurrentYearOnlyDirective {

  constructor(private el: ElementRef) { }
  private _allowed?: boolean = false;

  public get allowed(): boolean {
    return this._allowed ? true : false;
  }

  ngAfterViewInit() {
    this._allowed = DataExtractionHelper.currentYear;
    this.el.nativeElement.disabled = !this._allowed; 
  }
}