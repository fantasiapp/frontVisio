import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { GridArea } from 'src/app/grid/grid-area/grid-area';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/sliceDice/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { combineLatest } from 'rxjs';

import bb, {pie} from 'billboard.js';

@Component({
  selector: 'app-simple-pie',
  templateUrl: './simple-pie.component.html',
  styleUrls: ['./simple-pie.component.css'],
  providers: [SliceDice]
})
export class SimplePieComponent extends GridArea implements AfterViewInit {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;

  constructor(private ref: ElementRef, private filtersService: FiltersStatesService, private sliceDice: SliceDice) {
    super();

    combineLatest([filtersService.$path, this.ready!]).subscribe(([path, _]) => {
      this.path = path;
      this.update();
    });
    
  }

  private update() {
    d3.select(this.ref.nativeElement).selectAll('div > *').remove();
    this.data = this.sliceDice.dnMarcheP2cd(this.path);
    let sum = this.data.reduce((acc, d) => acc + d.value, 0);

    bb.generate({
      bindto: this.content.nativeElement,
      data: {
        columns: this.data.map(d => [d.label, d.value]),
        type: pie()
      },
      tooltip: {
        contents(d, defaultTitleFormat, defaultValueFormat, color) {
          const data = d[0];
          return `
            <div class="tooltip">
              ${data.id}: ${(sum * data.ratio).toFixed(0)} u
            </div>
          `;
        }
      }
    }).resize();
  }
  
  private path = {};
  private data: any[] = []; //nationalP2CD.tableauHaut;
}
