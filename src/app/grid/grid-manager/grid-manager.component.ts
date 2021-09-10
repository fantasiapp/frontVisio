import { Component, ComponentFactoryResolver, OnInit, AfterViewInit, ViewChild, ViewContainerRef, ChangeDetectorRef, ComponentRef, HostBinding } from '@angular/core';
import { GridArea } from '../grid-area/grid-area';

interface Layout {
  grid: [string, string]
  areas: [string, string, any][]
};

/* Some component example */
@Component({
  selector: 'some-component',
  template: '<p>some-component works!</p>',
  styles: [':host(.box) { display: block; outline: 1px dashed #aaa; }']
})
export class SomeComponent extends GridArea implements OnInit {
  constructor(public viewContainerRef: ViewContainerRef) { super(); }
  ngOnInit(): void {}
}

@Component({
  selector: 'grid-manager',
  templateUrl: './grid-manager.component.html',
  styleUrls: ['./grid-manager.component.css'],
})
export class GridManager implements OnInit, AfterViewInit {

  private layout: Layout = {
    grid: ["2", "2"],
    areas: [
      ["1 / 2", "1 / 2", SomeComponent],
      ["2 / 2", "2 / 2", SomeComponent],
      //["2 / 2", "1 / 3", SomeComponent]
    ]
  }

  @HostBinding('style.grid-template-columns')
  private gridColumns: string = 'repeat(' + this.layout.grid[0] + ', 1fr)';
  @HostBinding('style.grid-template-rows')
  private gridRows: string = 'repeat(' + this.layout.grid[1] + ', 1fr)';

  private componentRefs: ComponentRef<any>[] = [];

  @ViewChild('target', {read: ViewContainerRef})
  ref!: ViewContainerRef;


  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef) { }
  ngAfterViewInit() {
      this.createComponents();
  }
  createComponents() {
    this.ref.detach();
    for ( let area of this.layout.areas ) {
      let factory = this.componentFactoryResolver.resolveComponentFactory<GridArea>(area[2]);
      let component = this.ref.createComponent(factory);
      this.componentRefs.push(component);
      component.instance.gridColumn = area[0];
      component.instance.gridRow = area[1];
      this.ref.insert(component.hostView);
    }
    this.cd.detectChanges();
  }

  ngOnInit(): void { }

  ngOnDestroy() {
    for ( let componentRef of this.componentRefs )
      componentRef.destroy();
  }
}
