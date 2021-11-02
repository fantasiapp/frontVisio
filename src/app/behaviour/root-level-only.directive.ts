import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FiltersStatesService } from '../filters/filters-states.service';
import { SubscriptionManager } from '../interfaces/Common';
import { PDV } from '../middle/Slice&Dice';

@Directive({
  selector: '[rootLevelOnly]'
})
export class RootLevelOnlyDirective extends SubscriptionManager implements OnInit, OnDestroy {

  constructor(private el: ElementRef, private filtersService: FiltersStatesService) {
    super();
  }


  ngOnInit() {
    this.subscribe(this.filtersService.stateSubject, ({States}) => {
      if ( States.level.label != PDV.geoTree.root.label )
        this.el.nativeElement.style.display = 'none';
      else
        this.el.nativeElement.style.display = 'initial';
    });
  }
}