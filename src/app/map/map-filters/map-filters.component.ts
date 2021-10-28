import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter, ViewChildren, QueryList, OnInit, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoggerService } from 'src/app/behaviour/logger.service';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { MapSelectComponent } from '../map-select/map-select.component';
import { BasicWidget } from 'src/app/widgets/BasicWidget'; 

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.css'],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapFiltersComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  isAgentFinitions = PDV.geoTree.root.label == 'Agent Finitions';
  criteriaNames = !this.isAgentFinitions ?
    ['clientProspect', 'ciblage', 'pointFeuFilter', 'segmentMarketingFilter', 'segmentCommercial', 'industriel', 'enseigne', 'drv', 'agent', 'dep', 'bassin'] :
    ['typology', 'visited', 'segmentMarketingFilter', 'enseigne', 'dep', 'bassin'];

  criteriaPrettyNames = !this.isAgentFinitions ?
    ['Client / Prospect', 'Ciblage', 'Point Feu', 'Segment Marketing', 'Segment Portefeuille', 'Industriel', 'Enseigne', 'Région', 'Secteur', 'Département', 'Bassin'] :
    ['Typologie Client', 'Visité', 'Segment Marketing', 'Enseigne', 'Département', 'Bassin'];

  private _pdvs: PDV[] = [...PDV.getInstances().values()];
  private currentDict: any = PDV.countForFilter(this._pdvs, this.criteriaNames);
  private liveDict: any = this.currentDict;

  private _shown: boolean = false;
  @Input()
  set shown(value: boolean) {
    this._shown = value;
    if ( value ) {
      this.interactiveMode();
      this.onPathChanged();
    } else {
      this.unsubscribe();
    }
  }

  get shown() { return this._shown; }

  @Output()
  pdvsChange = new EventEmitter<PDV[]>();

  @ViewChildren(MapSelectComponent)
  selects!: QueryList<MapSelectComponent>;

  private path: any = {};

  stateSubscription?: Subscription;
  constructor(private ref: ElementRef, private filtersService: FiltersStatesService, private logger: LoggerService) {
    console.log('[MapFiltersComponent]: On.');

    console.log(this.isAgentFinitions);

    (window as any).filter = this;
  }

  interactiveMode() {
    this.stateSubscription = this.filtersService.stateSubject.subscribe(({States}) => {
      let path = this.filtersService.getPath(States);
      if ( !this._pdvs.length || !BasicWidget.shallowObjectEquality(this.path, path) ) {
        this.path = path;
        this.onPathChanged();
      }
    });
  }

  unsubscribe() {
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = undefined;
  }

  onPathChanged() {
    this._pdvs = PDV.sliceMap(this.path, [], this.filtersService.navigation.tree?.type == PDV.geoTree.type);
    this.currentDict = this.liveDict = PDV.countForFilter(this._pdvs, this.criteriaNames);
    this.selects.forEach(select => select.reset());
    this.pdvsChange.emit(this._pdvs);
    //this.resetFilters();
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

    let dict = DataExtractionHelper.get(criterion);
    return Object.keys(result).filter(key => result[key]).map(key =>
      [key, dict[key]]
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
    let select = this.selects.get(idx)!,
      change = criteria.length ? this.modifyStack(select) : this.removeStack(select);
    
    let criteriaResult = this.criteriaNames.map(x => []);
    criteriaResult[idx] = criteria;
    let result = criteriaResult.reduce((acc: any[][], el: any[]) => {
      if ( el.length )
      return acc.concat([el]);
      return acc;
    }, []);

    this.logger.handleEvent(LoggerService.events.MAP_FILTERS_CHANGED, this.criteria.length ? this.criteria : undefined);
    this.criteria = result as [string, number[]][];
    this.logger.actionComplete();
    if ( change )
      this.pdvsChange.emit(this.getLastPDVs());
  }
  
  private stack: [MapSelectComponent, PDV[]][] = [];
  private modifyStack(select: MapSelectComponent) {
    let idx = this.stack.findIndex(q => q[0] == select);
    if ( idx < 0 )
      this.pushStack(select);
    else
      this.fixStack(idx);
    
    return true;
  }

  private pushStack(select: MapSelectComponent) {
    this.stack.push([select, []]);
    this.fixStack(this.stack.length-1);
  }

  private removeStack(select: MapSelectComponent) {
    let idx = this.stack.findIndex(q => q[0] == select);
    if ( idx < 0 ) return false;
    let [_, results] = this.stack[idx]; //<- filterdict is assigned by others
    this.stack.splice(idx, 1);
    this.fixStack(idx, true);
    return true;
  }

  getPreviousPDVs(index: number) {
    return this.stack[index-1] ? this.stack[index-1][1] : this._pdvs
  }

  getLastPDVs() {
    return this.getPreviousPDVs(this.stack.length);
  }

  private fixStack(index: number, skipFirst: boolean = false) {
    let names = new Set(this.stack.slice(0, index).map(pair => pair[0].criterion)),
      conditions: [string, number[]][] = [],
      pdvs = this.getPreviousPDVs(index);
    
    this.stack.slice(index).forEach(([select, _], dx) => {
      let criterion = select.criterion,
        target = this.stack[index+dx+1],
        targetCriterion = target ? this.stack[index+dx+1][0].criterion : undefined;
      
      if ( !dx && skipFirst )
        this.liveDict[criterion] = PDV.countForFilter(pdvs, [criterion])[criterion];
      
      names.add(criterion);
      if ( select.selection.length )
        conditions.push([criterion, select.selection]);
      
      let savedPdvs = pdvs;
      pdvs = PDV.reSlice(pdvs, conditions);
      this.stack[index+dx][1] = pdvs;
      if ( !pdvs.length ) { //incompatible filter, cancel it
        conditions.pop();
        pdvs = PDV.reSlice(savedPdvs, conditions);
        names.delete(criterion);
        this.stack.splice(index+dx, 1); index--;
      }

      if ( target ) {
        names.add(targetCriterion!);
        this.liveDict[targetCriterion!] = PDV.countForFilter(pdvs, [targetCriterion!])[targetCriterion!];
      }
    });
    
    this.currentDict = PDV.countForFilter(pdvs, this.criteriaNames);
    let consequent = this.criteriaNames.filter(name => !names.has(name));
    for ( let criterion of consequent )
      this.liveDict[criterion] = this.currentDict[criterion];
  }

  close() {
    this.ref.nativeElement.scrollTop = 0;
    this.opened = false;
  }

  ngOnDestroy() {
    this.unsubscribe();
  }
}