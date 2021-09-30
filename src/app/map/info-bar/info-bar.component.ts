import { AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';

@Component({
  selector: 'info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.css']
})
export class InfoBarComponent {
  @HostBinding('class.opened')
  private opened: boolean = false;
  
  @Output()
  close: EventEmitter<boolean> = new EventEmitter();
  
  @Input()
  set pdv(value: PDV | undefined) {
    this._pdv = value;
    this.opened = value ? true : false;
    this.pdvChange.emit(value);
  }

  @Output()
  pdvChange = new EventEmitter<PDV | undefined>();

  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;

  
  //HACK
  getName: any = DataExtractionHelper.getNameOfRegularObject.bind(DataExtractionHelper);

  constructor(private ref: ElementRef) {
    console.log('[InfobarComponent]: On');
  }

  exit() {
    let fn: any;
    this.ref!.nativeElement.addEventListener('transitionend', fn = (_: any) => {
      this.close.emit(true);
      this.ref!.nativeElement.removeEventListener('transitionend', fn);
    });
    this.pdv = undefined;
  }
}
