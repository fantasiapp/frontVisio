import { EventEmitter, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, Output, QueryList, ViewChildren } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { combineAll } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { TargetService } from './description-service.service';

@Component({
  selector: 'description-widget',
  templateUrl: './description-widget.component.html',
  styleUrls: ['./description-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptionWidgetComponent implements OnDestroy {

  @ViewChildren('input', {read: ElementRef})
  inputs?: QueryList<ElementRef>;

  subscriptions: Subscription[] = [];

  constructor(private filtersService: FiltersStatesService, private dataservice: DataService, private targetService: TargetService) {
    this.subscriptions.push(
      filtersService.$path.subscribe(path => {
        //do something with path
      }),
      dataservice.update.subscribe(_ => {
        //do something when it updates
      })
    )
  }

  get volume() {
    return 0;
  }

  get DN() {
    return 0;
  }

  get ratio() {
    return 0;
  }

  inputChanged(idx: number) {
    let input = this.inputs?.get(idx);
    if ( !input ) throw `[DescriptionWidget]: cannot find input`;
    this.targetService.setTarget(input.nativeElement.value)
  }

  ngOnDestroy() {
    for ( let subscription of this.subscriptions )
      subscription.unsubscribe();
  }
}
