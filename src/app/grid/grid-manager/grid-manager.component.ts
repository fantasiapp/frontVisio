import { Component, ComponentFactoryResolver, OnInit, AfterViewInit, ViewChild, ViewContainerRef, ChangeDetectorRef, ComponentRef, HostBinding, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { GridArea } from '../grid-area/grid-area';
import { SimplePieComponent } from '../../widgets/simple-pie/simple-pie.component';
import { SimpleDonutsComponent } from 'src/app/widgets/simple-donuts/simple-donuts.component';

interface Layout {
  grid: [string, string],
  template: string;
  areas: [string, any][]
};

@Component({
  selector: 'grid-manager',
  templateUrl: './grid-manager.component.html',
  styleUrls: ['./grid-manager.component.css'],
})
export class GridManager implements OnInit, AfterViewInit, OnChanges {

  private $layout: Layout = {
    grid: ["1", "1"],
    template: `
      "x"
    `,
    areas: []
  }

  get layout(): Layout {
    return this.$layout;
  }

  @Input()
  set layout(layout: Layout) {
    this.$layout = layout;
    this.computeLayout();
  }

  @HostBinding('style.grid-template-columns')
  private gridColumns: string = 'repeat(' + this.layout.grid[0] + ', 1fr)';
  @HostBinding('style.grid-template-rows')
  private gridRows: string = 'repeat(' + this.layout.grid[1] + ', 1fr)';
  @HostBinding('style.grid-template-areas')
  private gridAreaTemplate: string = this.layout.template;

  private componentRefs: ComponentRef<any>[] = [];

  @ViewChild('target', {read: ViewContainerRef})
  ref!: ViewContainerRef;


  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef) { }
  
  ngAfterViewInit() {
    this.createComponents();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('[GridManager.ngOnChanges]: What is wrong ?;');
  }

  private createComponents() {
    this.ref.detach();
    for ( let area of this.layout.areas ) {
      if ( !area ) continue;
      let factory = this.componentFactoryResolver.resolveComponentFactory<GridArea>(area[1]);
      let component = this.ref.createComponent(factory);
      this.componentRefs.push(component);
      component.instance.gridArea = area[0];
      this.ref.insert(component.hostView);
    }
    this.cd.detectChanges();
  }

  ngOnInit(): void { }

  ngOnDestroy() {
    for ( let componentRef of this.componentRefs )
      componentRef.destroy();
    
    this.componentRefs.length = 0;
  }

  private computeLayout() {
    this.gridColumns = 'repeat(' + this.layout.grid[0] + ', 1fr)';
    this.gridRows = 'repeat(' + this.layout.grid[1] + ', 1fr)';
    this.gridAreaTemplate = this.layout.template;
  }
}

@Component({
  selector: 'simple-component',
  template: `<p>it works!</p>`
})
export class SimpleComponent extends GridArea {

}


@Component({
  'selector': 'grid-wrapper',
  template: `<grid-manager [layout]="layout"></grid-manager>`,
  styles: [`
    :host {
      display: block;
      box-sizing: border-box;
      margin: 200px 5% 0;
      height: calc(100% - 200px);
    }
  `]
})
export class GridManagerWrap {
  
  public layout: Layout = {
    grid: ["2", "2"],
    template: `
      "a c"
      "b c"
    `,
    areas: [
      ["a", SimplePieComponent],
      ["b", SimpleDonutsComponent],
      ["c", SimpleComponent]
    ]
  }
  
  constructor() {

  }
}