import { Directive, ElementRef } from '@angular/core';
import { FiltersStatesService } from '../services/filters-states.service';
import { SubscriptionManager } from '../interfaces/Common';

@Directive({
  selector: '[rootLevelOnly]'
})
export class RootLevelOnlyDirective extends SubscriptionManager {

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