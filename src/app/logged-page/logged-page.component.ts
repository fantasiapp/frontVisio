import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-logged-page',
  templateUrl: './logged-page.component.html',
  styleUrls: ['./logged-page.component.css']
})
export class LoggedPageComponent implements OnInit, OnDestroy {

  constructor() { }

  ngOnInit(): void {
    console.log('logged created')
  }

  @HostListener('unloaded')
  ngOnDestroy() {
    console.log('logged destroyed');
  }

}
