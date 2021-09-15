import { Component, OnInit } from '@angular/core';
import { FiltersStatesService } from '../filters/filters-states.service';
import { Layout } from '../grid/grid-manager/grid-manager.component';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent implements OnInit {

  public layout: (Layout & {id: number}) | null = null;

  constructor(private filtersService: FiltersStatesService) {
    filtersService.stateSubject.subscribe(({States: {dashboard}}) => {
      if ( !this.layout || (this.layout?.id !== dashboard.id) )
        this.layout = dashboard;
    })
  }

  ngOnInit(): void {
 
  }
}