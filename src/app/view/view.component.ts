import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { FiltersStatesService } from '../filters/filters-states.service';
import { GridManager, Layout } from '../grid/grid-manager/grid-manager.component';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewComponent implements OnDestroy {

  public layout: (Layout & {id: number}) | null = null;
  private mapVisible: boolean = false;

  @ViewChild('gridManager', {static: false, read: GridManager})
  gridManager?: GridManager;

  subscription: Subscription;

  constructor(private filtersService: FiltersStatesService, private dataservice: DataService) {
    this.subscription = filtersService.stateSubject.subscribe(({States: {dashboard}}) => {
      if ( this.layout?.id !== dashboard.id ) {
        console.log('[ViewComponent]: Layout(.id)=', dashboard.id ,'changed.')
        this.layout = dashboard;
      }
    });

    dataservice.update.subscribe((_) => {
      this.update();
    });
  }

  computeDescription(description: string | string[]) {
    let compute = Array.isArray(description) && description.length >= 1;
    if ( compute )
      return DataExtractionHelper.computeDescription(this.filtersService.$path.value, description as string[]);
    return description[0] || description;
  }

  mapIsVisible(val: boolean) {
    if ( this.mapVisible = val )
      this.gridManager?.pause();
    else
      this.gridManager?.interactiveMode();
  }

  onLayoutChange(layout: Layout) {
    if ( this.mapVisible )
      this.gridManager?.pause();
    else
      this.gridManager?.interactiveMode();
  }

  update() {
    this.computeDescription(this.layout && this.layout.description || '');
    this.gridManager?.update();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}