import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { TargetService } from './description-service.service';
import { BasicWidget } from '../BasicWidget';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { SubscriptionManager } from 'src/app/interfaces/Common';

@Component({
  selector: 'description-widget',
  templateUrl: './description-widget.component.html',
  styleUrls: ['./description-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptionWidgetComponent extends SubscriptionManager {

  @ViewChildren('input', {read: ElementRef})
  inputs?: QueryList<ElementRef>;
  currentSelection: number = 1;
  values: number[][] = [
    [0, 0, 0],
    [0, 0, 0]
  ];

  constructor(private cd: ChangeDetectorRef, private filtersService: FiltersStatesService, private dataservice: DataService, private targetService: TargetService) {
    super();
    this.subscribe(filtersService.stateSubject, ({States}) => {
      //do something with path
      this.values = DataExtractionHelper.computeDescriptionWidget(this.filtersService.getPath(States));
      this.cd.markForCheck();
    });

    this.subscribe(dataservice.update, _ => {
      this.values = DataExtractionHelper.computeDescriptionWidget(this.filtersService.getPath(this.filtersService.stateSubject.value.States));
      this.cd.markForCheck();
    });
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
    this.targetService.target = input.nativeElement.value;
  }
}
