import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, OnInit } from '@angular/core';
import DEH, { Params } from '../middle/DataExtractionHelper';
import { SubscriptionManager } from '../interfaces/Common';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css'],
})
export class SubUpperBarComponent extends SubscriptionManager implements OnInit {
  constructor(private filtersStates: FiltersStatesService) {
    super();
    this.subscribe(this.filtersStates.state, ({node, dashboard}) => {
      let height = node.path.length;
      this.currentDashboard = dashboard.name;
      this.currentLevel = node.name;
      this.path = node.label + (node.name ? ' : ' + node.name : '');
      this.currentDashboardId = dashboard.id;
      this.otherYearDashboards = DEH.getOtherYearDashboards(this.filtersStates.tree!, height-1);  
    });
  }
  currentDashboardId: number = 0;
  currentDashboard: string = '';
  currentLevel: string ='';
  currentMonth: string = '';
  currentYear: string = '';
  path:  string = ''
  years: [number, number] = [Params.currentYear, Params.currentYear-1]
  otherYearDashboards: number[] = []; //-> whether we can transition to another year on this dashboard

  ngOnInit(): void {
    this.currentYear = this.filtersStates.getYear();
    this.currentMonth = this.filtersStates.getMonth();
    this.filtersStates.emitState();
  }

  onYearChange(e: Event) {
    let current = !!(((e.target as any).value) | 0);
    this.filtersStates.setYear(current);
    this.otherYearDashboards = DEH.getOtherYearDashboards(this.filtersStates.tree!, this.filtersStates.getState().node.path.length - 1);
    this.currentYear = current ? this.filtersStates.getYear() : '';
  }
}
