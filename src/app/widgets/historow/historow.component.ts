import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import bb, {bar, Chart} from 'billboard.js';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';

let DESCRIPTION_MOCK = [
  ['Tous segments', []], ['Purs Spécialistes', [['segmentMarketing', [6]]]], ['Multi Spécialistes', [['segmentMarketing', [7]]]], ['Généralistes', [['segmentMarketing', [8]]]], ['Autres', [['segmentMarketing', [9]]]]
];

@Component({
  selector: 'app-historow',
  templateUrl: './historow.component.html',
  styleUrls: ['./historow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoRowComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  private rubixAxis?: string;
  private rubixArgument?: [string, number[]][];

  @ViewChild('description', {read: ElementRef})
  protected description!: ElementRef;

  public axisLabelLength: number = 10;

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  ngOnInit() {
    super.ngOnInit();
    this.properties.description = DESCRIPTION_MOCK;

    //HACK because back doesn't send like this
    if ( !Array.isArray(this.properties.arguments[0]) ) {
      this.properties.arguments[0] = [this.properties.arguments[0], 'ensemble'];
    }
    
    this.rubixAxis = this.properties.arguments[0][0];
    this.rubixArgument = this.properties.description[0][1];
  }

  private axisPadding: number = 100;
  private rectWidth: number = 0;
  private maxValue: number = 0;

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

  private getTickValues() {
    let power = Math.floor(Math.log10(this.maxValue)),
      exp = Math.pow(10, power),
      leadingCoefficient = Math.ceil(this.maxValue / exp),
      goodValue = leadingCoefficient * exp; //1 -> 9
    
    let ticks = [0, goodValue / 5, goodValue * 2/5, goodValue * 3/5, goodValue * 4/5, goodValue].filter(x => x <= this.maxValue);
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
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      padding: {
        left: this.axisPadding
      },
      data: {
        x: data[0][0] == 'x' ? 'x' : undefined, /* ⚠️⚠️ inaccurate format ⚠️⚠️ */
        columns: data,
        type: bar(),
        groups: [data.slice(1).map((x: any[]) => x[0])],
        order: null
      },
      tooltip: {
        grouped: false,
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          return `
            <div class="historow-tooltip tooltip">
              ${d.map((data: any) => `
                <span style="color:${color(data)}">${data.id}: </span>${BasicWidget.format(data.value, 3)} ${this.properties.unit}
              `).join('<br/>')}
              <div class="tooltip-tail"></div>
            </div>
          `;
        },
        position: (data, width, height, element, pos) => {
          let maxRight = this.rectWidth - 30; //30 css padding
          return {
            left: Math.max(this.axisPadding, Math.min(maxRight, pos.x - width/2 + this.axisPadding)),
            top: (pos.xAxis || pos.y) + 20
          };
        }
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
            format(index: number, category: string) {
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
            count: 6,
            values: this.getTickValues()
          }
        },
        rotated: true
      },
      grid: {
        y: {
          show: true,
          ticks: 6
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
      onrendered() {
        self.rectWidth = (this.$.main.select('.bb-chart').node() as Element).getBoundingClientRect().width;
        this.$.main.select('.bb-axis').selectAll('tspan').style('cursor', 'pointer').on('click', (e) => {
          self.addRubixCondition(this.categories()[e.target.__data__.index]);
          self.update();
        });
      },
      ...opt
    });
  }

  addRubixCondition(name: string) {
    let type = this.properties.arguments[0][0];
    if ( this.rubixAxis === type ) {
      let set = DataExtractionHelper.get(type),
        keyId = DataExtractionHelper.getKeyByValue(set, name),
        id;
      if ( !keyId ) throw `${name} not found in ${type}.`;
      id = parseInt(keyId);
      this.rubixAxis = this.properties.arguments[0][1];
      this.rubixArgument!.push([type, [id]]);
    } else {
      this.rubixAxis = type;
      this.rubixArgument!.pop();
    }
  }

  //wait on delays
  updateGraph({data}: any) {
    if ( data[0][0] != 'x' ) {
      console.log('[HistoRow]: Rendering inaccurate format because `x` axis is unspecified.')
      data = [['x', ...data.map((d: any[]) => d[0])], ...data];
    };

    let currentItems = Object.keys(this.chart!.xs()),
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
    return [this.path, this.rubixAxis!, args[1], args[2], args[3], args[4], args[5], true, false, this.rubixArgument!];
  }

  updateData() {
    this.chart?.tooltip.hide();
    let data = this.sliceDice.getWidgetData.apply(this.sliceDice, this.getDataArguments()),
      rubix = this.sliceDice.rubiksCubeCheck(this.path, this.properties.arguments[2], this.properties.arguments[5]);
    console.log(rubix);
    return data;
  }

  updateCondition(e: Event) {
    this.rubixArgument = this.properties.description[(e.target as any).value][1];
    this.update();
  }
}
