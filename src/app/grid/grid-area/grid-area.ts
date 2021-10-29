import { Directive, HostBinding } from '@angular/core';
import { Subject } from 'rxjs';
import { Deffered, SubscriptionManager } from 'src/app/interfaces/Common';


@Directive()
export abstract class GridArea extends SubscriptionManager implements Deffered {
  @HostBinding('style.grid-area')
  public gridArea: string = '';
  
  public properties: {[key:string]: any} = {};
  public ready: Subject<null> = new Subject();

  constructor() {
    super();
    this.once(this.ready, this.onReady.bind(this));
  }

  ngAfterViewInit() {
    this.ready.next();
    this.ready.complete();
  }

  onReady() { }

  ngOnDestroy() {
    this.unsubscribeAll();
  }
};