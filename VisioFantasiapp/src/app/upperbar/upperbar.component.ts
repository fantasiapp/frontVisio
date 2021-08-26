import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css']
})
export class UpperbarComponent implements OnInit {
  isFilters = false
  constructor() { }

  ngOnInit(): void {
  }
  private showFilters(){
    return !this.isFilters 
  }
}
