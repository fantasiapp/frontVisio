import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapFiltersComponent  {
  @HostBinding('class.opened')
  opened: boolean = false;

  criteriaNames = ['clientProspect', 'ciblage', 'pointFeuFilter', 'segmentMarketingFilter', 'segmentCommercial', 'industriel', 'enseigne', 'agent', 'dep', 'bassin'];
  criteriaPrettyNames = ['Client / Prospect', 'Ciblage', 'Point Feu', 'Segment Marketing', 'Segment Portefeuille', 'Industriel', 'Enseigne', 'Secteur', 'Département', 'Bassin'];

  @Input()
  path: any = {};

  @Input()
  PDVNumber: number = 0;

  @Output()
  criteriaChange = new EventEmitter<any>();

  private criteriaResult = this.criteriaNames.map(() => []);

  constructor(private filtersState: FiltersStatesService) {
    console.log('[MapFiltersComponent]: On.');
  }

  trackById(index: number, couple: any) {
    return couple[0];
  }

  trackByIndex(index: number, _: any) {
    return index;
  }

  loadCriterion(criterion: string, path: any): [string, any][] {
    //use pretty prints on path slice
    let criterionPretty = this.criteriaPrettyNames[this.criteriaNames.indexOf(criterion)];
    if ( criterionPretty && path[criterionPretty] !== undefined )
      return [
        [path[criterionPretty], DataExtractionHelper.get(criterion)[path[criterionPretty]]]
      ];

    let data = DataExtractionHelper.get(criterion) || {};
    let entries = Object.entries<any>(data);
    return entries;
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