import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { GridArea } from 'src/app/grid/grid-area/grid-area';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/sliceDice/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { combineLatest, Subscription } from 'rxjs';

import bb, {donut} from 'billboard.js';

@Component({
  selector: 'app-simple-donut',
  templateUrl: './simple-donut.component.html',
  styleUrls: ['./simple-donut.component.css'],
  providers: [SliceDice]
})
export class SimpleDonutComponent extends GridArea implements AfterViewInit, OnDestroy {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;
  private subscription: Subscription;

  constructor(private ref: ElementRef, private filtersService: FiltersStatesService, private sliceDice: SliceDice) {
    super();

    this.subscription = combineLatest([filtersService.$path, this.ready!]).subscribe(([path, _]) => {
      this.path = path;
      this.update();
    });
  }

  private update() {
    
    this.data = this.sliceDice.p2cdMarcheP2cd(this.path);
    let sum = this.data.reduce((acc, d) => acc + d.value, 0);

    //used to wait for css to render components correctly <--> needs investigation
    requestAnimationFrame((_: any) => {
      d3.select(this.ref.nativeElement).selectAll('div > svg').remove();
      bb.generate({
        data: {
          columns: this.data.map(d => [d.label, d.value]),
          type: donut()
        },
        bindto: this.content.nativeElement,
        tooltip: {
          contents(d, defaultTitleFormat, defaultValueFormat, color) {
            const data = d[0];
            return `
              <div class="tooltip">
                ${data.id}: ${(sum * data.ratio).toFixed(0)} 
              </div>
            `;
          }
        }
      }).resize();
    })
    
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if ( this.ref )
      d3.select(this.ref.nativeElement).selectAll('div > *').remove();
  }
  
  private path = {};
  private data: any[] = []; //nationalP2CD.tableauHaut;
}