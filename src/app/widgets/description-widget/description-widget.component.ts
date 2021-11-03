import { EventEmitter, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, Output, QueryList, ViewChildren, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { combineAll } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { TargetService } from './description-service.service';
import { BasicWidget } from '../BasicWidget';
import DEH from 'src/app/middle/DataExtractionHelper';
import {CD} from 'src/app/middle/Descriptions';

@Component({
  selector: 'description-widget',
  templateUrl: './description-widget.component.html',
  styleUrls: ['./description-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptionWidgetComponent implements OnDestroy {

  @ViewChildren('input', {read: ElementRef})
  inputs?: QueryList<ElementRef>;
  currentSelection: number = 1;
  values: number[][] = [
    [0, 0, 0],
    [0, 0, 0]
  ];

  subscriptions: Subscription[] = [];

  constructor(private cd: ChangeDetectorRef, private filtersService: FiltersStatesService, private dataservice: DataService, private targetService: TargetService) {
    this.subscriptions.push(
      filtersService.stateSubject.subscribe(({States}) => {
        //do something with path
        this.values = CD.computeDescriptionWidget(this.filtersService.getPath(States));
        this.cd.markForCheck();
      }),
      dataservice.update.subscribe(_ => {
        this.values = CD.computeDescriptionWidget(this.filtersService.getPath(this.filtersService.stateSubject.value.States));
        this.cd.markForCheck();
        //do something when it updates
      })
    )
  }

  get volume() {
    return BasicWidget.format(this.values[1 - this.currentSelection][0]);
  }

  get DN() {
    return BasicWidget.format(this.values[1 - this.currentSelection][1], 0, true);
  }

  get ratio() {
    return BasicWidget.format(this.values[1 - this.currentSelection][2]);
  }

  inputChanged(idx: number) {
    let input = this.inputs?.get(idx);
    if ( !input ) throw `[DescriptionWidget]: cannot find input`;
    this.currentSelection = idx;
    this.targetService.setTarget(input.nativeElement.value);
  }

  ngOnDestroy() {
    for ( let subscription of this.subscriptions )
      subscription?.unsubscribe();
  }
}
