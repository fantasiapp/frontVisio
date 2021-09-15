import { Directive, ElementRef, OnDestroy } from "@angular/core";
import * as d3 from "d3";
import { combineLatest, Subscription } from "rxjs";
import { FiltersStatesService } from "../filters/filters-states.service";
import { GridArea } from "../grid/grid-area/grid-area";
import { SliceDice } from "../sliceDice/Slice&Dice";

@Directive()
export abstract class BasicWidget extends GridArea implements OnDestroy {
  protected subscription: Subscription;
  protected path = {};
  protected ref: ElementRef;
  protected filtersService: FiltersStatesService;
  protected sliceDice: SliceDice;

  constructor(ref: ElementRef, filtersService: FiltersStatesService, sliceDice: SliceDice) {
    super();

    this.ref = ref; this.filtersService = filtersService; this.sliceDice = sliceDice;
    this.subscription = combineLatest([filtersService.$path, this.ready!]).subscribe(([path, _]) => {
      this.subscription.unsubscribe();
      this.path = path;
      //view is initialized
      this.subscription = filtersService.$path.subscribe(path => {
        this.path = path;
        this.updateGraph(this.updateData());
      });
      this.start();
    });
  }

  private start(): void {
    let data = this.updateData();
    //used to wait for css to render components correctly <--> needs investigation
    requestAnimationFrame((_: any) => {
      let d: any = new Date;
      this.updateGraph(data);
    });
  }

  abstract updateGraph(data: any[]): void;

  updateData(): any[] {
    let args: any[] = this.properties.arguments;
    return this.sliceDice.getWidgetData(this.path, args[0], args[1], args[2], args[3], args[4], args[5]);  
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if ( this.ref )
      d3.select(this.ref.nativeElement).selectAll('div > *').remove();
  }
};