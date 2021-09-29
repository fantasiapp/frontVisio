import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PDV } from 'src/app/middle/Slice&Dice';

@Component({
  selector: 'info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.css']
})
export class InfoBarComponent {
  @Output()
  close: EventEmitter<boolean> = new EventEmitter();
  
  @Input()
  pdv?: PDV;

  constructor() {
    console.log('[InfobarComponent]: On');
  }
}
