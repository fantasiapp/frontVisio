import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from 'src/app/widgets/BasicWidget';

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapFiltersComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  @Input()
  pdvs: PDV[] = [];
  path: any = {};
  criteria: any[] = [
    
  ];

  @Output()
  pdvsChange = new EventEmitter<PDV[]>();

  constructor(private filtersService: FiltersStatesService) {
    console.log('[MapFiltersComponent]: On.');
    filtersService.$path.subscribe(path => {
      if ( !this.pdvs.length || !BasicWidget.shallowObjectEquality(this.path, path) ) {
        this.path = path;
        this.pdvs = PDV.sliceMap(path, this.criteria);
        this.pdvsChange.emit(this.pdvs);
      }
    });
  }

  updateCriteria() {
    console.log('updating criteria');
  }

  loadCriterion(criterion: string): [string, any][] {
    let entries = Object.entries<any>(DataExtractionHelper.get(criterion));
    return ([['0', 'Tous']] as [string, any][]).concat(entries);
  }
}