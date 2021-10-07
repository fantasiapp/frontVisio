import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
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
export class ViewComponent {

  public layout: (Layout & {id: number}) | null = null;
  private mapVisible: boolean = false;

  @ViewChild('gridManager', {static: false, read: GridManager})
  gridManager?: GridManager;

  constructor(private filtersService: FiltersStatesService, private dataservice: DataService) {
    filtersService.stateSubject.subscribe(({States: {dashboard}}) => {
      if ( this.layout?.id !== dashboard.id ) {
        console.log('[ViewComponent]: Layout(.id) changed.')
        this.layout = dashboard;
      }
    });

    dataservice.update.subscribe((_) => {
      this.update();
    });
  }

  computeDescription(description: string | string[]) {
    if ( Array.isArray(description) )
      return DataExtractionHelper.computeDescription(this.filtersService.$path.value, description);
    return description;
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
}