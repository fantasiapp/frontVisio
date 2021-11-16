import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FiltersStatesService } from '../services/filters-states.service';
import { SubscriptionManager } from '../interfaces/Common';
import { PDV } from '../middle/Pdv';

@Directive({
  selector: '[rootLevelOnly]'
})
export class RootLevelOnlyDirective extends SubscriptionManager implements OnInit, OnDestroy {

  constructor(private el: ElementRef, private filtersService: FiltersStatesService) {
    super();
  }


  ngOnInit() {
    this.subscribe(this.filtersService.state, ({node}) => {
      if ( node.height != 0 )
        this.el.nativeElement.style.display = 'none';
      else
        this.el.nativeElement.style.display = 'initial';
    });
  }
}