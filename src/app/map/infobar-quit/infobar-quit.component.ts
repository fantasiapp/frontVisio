import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'infobar-quit',
  templateUrl: './infobar-quit.component.html',
  styleUrls: ['./infobar-quit.component.css']
})
export class InfobarQuitComponent {

  @Output()
  quit = new EventEmitter<boolean>();

  constructor() { }

  onButtonClicked(e: MouseEvent,which: boolean) {
    e.stopPropagation();
    this.quit.emit(which);
  }
}
