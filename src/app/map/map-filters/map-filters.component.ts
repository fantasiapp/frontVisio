import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter, ViewChildren, QueryList, OnInit } from '@angular/core';
import { LoggerService } from 'src/app/behaviour/logger.service';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { MapSelectComponent } from '../map-select/map-select.component';

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

  private _pdvs: PDV[] = []
  @Input()
  set allPdvs(value: PDV[]) {
    //careful
    this.liveDict = this.currentDict = PDV.countForFilter(value);
    //reset all filters
    this._pdvs = value;
  }

  get allPdvs() { return this._pdvs; }
  private currentDict: any = {};
  private liveDict: any = {};

  @Output()
  criteriaChange = new EventEmitter<any>();

  @ViewChildren(MapSelectComponent)
  selects!: QueryList<MapSelectComponent>;

  private criteriaResult = this.criteriaNames.map(() => []);

  constructor(private logger: LoggerService) {
    console.log('[MapFiltersComponent]: On.');
  }

  trackById(index: number, couple: any) {
    return couple[0];
  }

  trackByIndex(index: number, _: any) {
    return index;
  }

  loadCriterion(index: number): [number, any, number][] {
    //use pretty prints on path slice
    let criterion = this.criteriaNames[index];
    let result = this.liveDict[criterion];
    
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

  
  criteria: [string, number[]][] = [];
  someCriteriaChange(idx: number, criteria: any) {
    let select = this.selects.get(idx)!;
    if ( criteria.length )
      this.modifyStack(select);
    else
      this.removeStack(select)
    
    this.criteriaResult[idx] = criteria;
    let result = this.criteriaResult.reduce((acc: any[][], el: any[]) => {
      if ( el.length )
      return acc.concat([el]);
      return acc;
    }, []);

    this.logger.handleEvent(LoggerService.events.MAP_FILTERS_CHANGED, this.criteria.length ? this.criteria : undefined);
    this.criteria = result as [string, number[]][];
    this.logger.actionComplete();
    this.criteriaChange.emit(result);
  }
  
  private stack: [MapSelectComponent, PDV[]][] = [];
  private modifyStack(select: MapSelectComponent) {
    let idx = this.stack.findIndex(q => q[0] == select);
    if ( idx < 0 )
      this.pushStack(select);
    else
      this.fixStack(idx);
  }

  private pushStack(select: MapSelectComponent) {
    this.stack.push([select, []]);
    this.fixStack(this.stack.length-1);
  }

  private removeStack(select: MapSelectComponent) {
    let idx = this.stack.findIndex(q => q[0] == select);
    if ( idx < 0 ) return;
    let [_, results] = this.stack[idx]; //<- filterdict is assigned by others
    this.stack.splice(idx, 1);
    this.currentDict = PDV.countForFilter(this.getPreviousPDVs(idx));
    this.fixStack(idx);
    this.liveDict[select.criterion] = this.currentDict[select.criterion];
  }

  getPreviousPDVs(index: number) {
    return this.stack[index-1] ? this.stack[index-1][1] : this.allPdvs
  }

  apply(pdvs: PDV[]) {
    return this.getPreviousPDVs(this.stack.length);
  }

  private fixStack(index: number) {
    let names = new Set(this.stack.slice(0, index).map(pair => pair[0].criterion)),
      conditions: [string, number[]][] = [],
      pdvs = this.getPreviousPDVs(index);
    
    this.stack.slice(index).forEach(([select, _], dx) => {
      let criterion = select.criterion,
        target = this.stack[index+dx+1],
        targetCriterion = target ? this.stack[index+dx+1][0].criterion : undefined;
      
      names.add(select.criterion);
      console.log(index+dx, targetCriterion, select.selection)
      if ( select.selection.length ) conditions.push([criterion, select.selection]);
      pdvs = PDV.reSlice(pdvs, conditions);
      this.stack[index+dx][1] = pdvs;
      this.currentDict = PDV.countForFilter(pdvs);
      if ( target ) {
        names.add(targetCriterion!);
        this.liveDict[targetCriterion!] = this.currentDict[targetCriterion!];
      }
    });
  
    let consequent = this.criteriaNames.filter(name => !names.has(name));
    for ( let criterion of consequent )
      this.liveDict[criterion] = this.currentDict[criterion];
  }
}