import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { PDV } from 'src/app/middle/Pdv';
import bb, {bar, Chart, DataItem} from 'billboard.js';
import { RubixCube } from './RubixCube';
import DEH from 'src/app/middle/DataExtractionHelper';
import { Utils } from 'src/app/interfaces/Common';


@Component({
  selector: 'app-historow',
  templateUrl: './historow.component.html',
  styleUrls: ['./historow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoRowComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  private cube: RubixCube | null = null;

  @ViewChild('description', {read: ElementRef})
  protected description!: ElementRef;

  public axisLabelLength: number = 10;

  constructor(protected injector: Injector) {
    super(injector);
  }

  private axisPadding: number = 100;
  private rectWidth: number = 0;
  private maxValue: number = 0;

  protected onPathChanged(path: any) {
    super.onPathChanged(path);
    this.updateCube();
  }

  private updateCube() {
    this.cube = new RubixCube(this);
    this.cube.rules = this.sliceDice.rubiksCubeCheck(this.properties.arguments[2], this.properties.arguments[5]);
    this.description.nativeElement.selectedIndex = "0";
    this.cd.markForCheck();
  }

  private computeMax(data: any) {
    let max = 0;
    for ( let i = 1; i < data[0].length; i++ ) {
      let acc = 0;
      for ( let j = 1; j < data.length; j++ )
        acc += data[j][i];
      
      if ( acc > max )
        max = acc;
    }
    return Math.round(max);
  }

  maxTicks = 6;
  private getTickValues() {
    let t = this.maxTicks - 1,
      exp = Math.round(Math.log(this.maxValue) / Math.log(10))-1,
      b = Math.pow(10, exp),
      goodValue = Math.ceil(this.maxValue / (t*b)) * t*b,
      ticks = (new Array(t+1)).fill(0).map((_, i) => goodValue * i / t).filter(x => x <= this.maxValue);
    
    if ( (this.maxValue - ticks[ticks.length - 1])/this.maxValue >= 0.1 )
      ticks.push(this.maxValue);
    return ticks;
  }

  createGraph({data, colors}: any, opt: {} = {}) {
    //temporary code to print no data⚠️
    if ( !(data.length - 1) || !(data[0].length - 1) )
      return this.noData(this.content);
    /****************⚠️ ***************/
    if ( data[0][0] != 'x' )
      console.log('[HistoRowComponent]: Rendering inaccurate format because `x` axis is unspecified.')

    let self = this;
    this.maxValue = this.computeMax(data);
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    let blueprint = {
      bindto: this.content.nativeElement,
      padding: {
        left: this.axisPadding
      },
      data: {
        x: 'x',
        columns: data,
        type: bar(),
        groups: [data.slice(1).map((x: any[]) => x[0])],
        order: null,
        onclick(item: DataItem) {
          self.toggleTooltipOnClick(item);
        }
      },
      tooltip: {
        show: false
      },
      bar: {
        sensitivity: 10
      },
      color: {
        pattern: colors
      },
      axis: {
        x: {
          type: 'category',
          max: {
            fit: true
          },
          tick: {
            autorotate: true,
            format(this: Chart, index: number, category: string) {
              if ( index < this.categories().length )
                return category.length >= self.axisLabelLength+3 ? category.slice(0, self.axisLabelLength - 3) + '...' : category;
              return '';
            },
            tooltip: true,
            multiline: false
          }
        },
        y: {
          tick: {
            count: this.maxTicks,
            values: this.getTickValues()
          }
        },
        rotated: true
      },
      grid: {
        y: {
          show: true,
          ticks: this.maxTicks
        }
      },
      //disable clicks on legend
      legend: {
        item: {
          onclick() {}
        }
      },
      transition: {
        duration: 250
      },
      onrendered(this: Chart) {
        self.rectWidth = (this.$.main.select('.bb-chart').node() as Element).getBoundingClientRect().width;
        if ( self.filtersService.tree?.hasTypeOf(PDV.tradeTree) )
          return;
        
        this.$.main.select('.bb-axis').selectAll('tspan').style('cursor', 'pointer').on('click', (e) => {
          let index = e.target.__data__.index, label = this.categories()[index];
          let realIndex = +DEH.getKeyByValue(DEH.get('enseigne'), label)!;
          self.cube!.enseigneCondition = self.cube!.getIndexById(realIndex)!;
          self.update();
        });
      },
      onresized() {
        self.clearTooltips();
      }
    };

    this.chart = bb.generate(Utils.dictDeepMerge(blueprint, opt));
  }

  //wait on delays
  updateGraph({data}: any) {
    if ( data[0][0] != 'x' ) {
      console.log('[HistoRow]: Rendering inaccurate format because `x` axis is unspecified.')
      data = [['x', ...data.map((d: any[]) => d[0])], ...data];
    };

    let currentItems = Object.keys(this.chart?.xs() || {}),
        newItems = data.slice(1).map((d: any[]) => d[0]),
        newCategories = data[0].slice(1);
    
    this.maxValue = this.computeMax(data);
    (this.chart as any).internal.config.axis_y_tick_values = this.getTickValues();
    this.schedule.queue(() => {
      this.chart!.load({
        columns: data,
        categories: newCategories,
        unload: currentItems.filter(x => !newItems.includes(x)),
        done: () => {
          this.schedule.next();
        }
      });
    });
  }
  getDataArguments(): any {
    let args: any[] = this.properties.arguments;
    return [this.cube!.mainAxis, args[1], args[2], args[3], args[4], args[5], true, false, this.cube?.conditions || []];
  }

  setSegment(e: Event) {
    let index = (e.target as any).value;
    this.cube!.segmentCondition = index;
    this.update();
  }

  makeSelect() { this.cd.detectChanges(); }
}
