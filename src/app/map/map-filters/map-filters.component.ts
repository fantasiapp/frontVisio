import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapFiltersComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  criteriaNames = ['clientProspect', 'ciblage', 'pointFeuFilter', 'segmentMarketingFilter', 'segmentCommercial', 'industriel', 'enseigne', 'drv', 'agent', 'dep', 'bassin'];
  criteriaPrettyNames = ['Client / Prospect', 'Ciblage', 'Point Feu', 'Segment Marketing', 'Segment Portefeuille', 'Industriel', 'Enseigne', 'Région', 'Secteur', 'Département', 'Bassin'];

  @Input()
  path: any = {};

  @Input()
  filterDict: any = {};

  @Input()
  PDVNumber: number = 0;

  @Output()
  criteriaChange = new EventEmitter<any>();

  private criteriaResult = this.criteriaNames.map(() => []);

  constructor() {
    console.log('[MapFiltersComponent]: On.');
  }

  trackById(index: number, couple: any) {
    return couple[0];
  }

  trackByIndex(index: number, _: any) {
    return index;
  }

  loadCriterion(criterion: string, path: any): [number, any, number][] {
    //use pretty prints on path slice
    let result = this.filterDict[criterion];
    if ( !result ) return [];

    return Object.keys(result).filter(key => result[key]).map(key =>
      [key, DataExtractionHelper.get(criterion)[key]]
    ).sort((a, b) => {
      let firstIsBigger = a[1] >= b[1],
        secondIsBigger = b[1] >= a[1];
      if ( firstIsBigger )
        if ( secondIsBigger ) return 0;
        else return 1;
      else return -1;
    }).map(([key, index]) => [key|0, index, result[key] as number]);
  }

  someCriteriaChange(idx: number, criteria: any) {
    this.criteriaResult[idx] = criteria;
    let result = this.criteriaResult.reduce((acc: any[][], el: any[]) => {
      if ( el.length )
        return acc.concat([el]);
      return acc;
    }, []);

    this.criteriaChange.emit(result);
  }

  updateOptions(index: number) {

  }
}