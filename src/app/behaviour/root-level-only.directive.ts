import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FiltersStatesService } from '../filters/filters-states.service';
import { PDV } from '../middle/Slice&Dice';

@Directive({
  selector: '[rootLevelOnly]'
})
export class RootLevelOnlyDirective implements OnInit, OnDestroy {

  constructor(private el: ElementRef, private filtersService: FiltersStatesService) { }

  subscription: Subscription | null = null;

  ngOnInit() {
    this.subscription = this.filtersService.stateSubject.subscribe(({States}) => {
      if ( States.level.label != PDV.geoTree.root.label )
        this.el.nativeElement.style.display = 'none';
      else
        this.el.nativeElement.style.display = 'initial';
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}