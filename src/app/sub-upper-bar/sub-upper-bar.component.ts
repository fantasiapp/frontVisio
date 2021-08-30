import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css']
})
export class SubUpperBarComponent implements OnInit {

  constructor(private filtersStates : FiltersStatesService) { }
  currentDashboard : string =''
  ngOnInit(): void {
  }
  // this.current 

}
