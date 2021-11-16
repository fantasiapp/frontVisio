import { FiltersStatesService } from '../services/filters-states.service';
import { Component, OnInit } from '@angular/core';
import DEH, { Params } from '../middle/DataExtractionHelper';
import { SubscriptionManager } from '../interfaces/Common';
import Dashboard from '../middle/Dashboard';
import { Node } from '../middle/Node';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css'],
})
export class SubUpperBarComponent extends SubscriptionManager implements OnInit {
  constructor(private filtersStates: FiltersStatesService) {
    super();
  }

  currentDashboard?: Dashboard;
  currentMonth: string = '';
  currentYear: string = '';
  path: string = ''
  years: [number, number] = [Params.currentYear, Params.currentYear-1]
  
  //used to determine whether we can transition to another year on this dashboard
  lastYearDashboards: number[] = [];

  
  

  ngOnInit(): void {
    this.currentYear = this.filtersStates.getYear();
    this.currentMonth = this.filtersStates.getMonth();
    this.subscribe(this.filtersStates.state, ({node, dashboard}) => {
      let height = node.path.length;
      this.currentDashboard = dashboard;
      this.path = node.label + (node.name ? ' : ' + node.name : '');
      this.lastYearDashboards = DEH.getLastYearDashboards(this.filtersStates.tree!, height-1);  
    });
    this.filtersStates.emitState();
  }

  get notAvailableLastYear() {
    return !this.lastYearDashboards.includes(this.currentDashboard!.id);
  }

  onYearChange(e: Event) {
    let current = !!(((e.target as any).value) | 0);
    this.filtersStates.setYear(current);
    this.currentYear = current ? this.filtersStates.getYear() : '';
  }
}
