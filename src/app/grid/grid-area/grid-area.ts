import { Directive, HostBinding } from '@angular/core';
import { AsyncSubject, Subject } from 'rxjs';
import { Deffered, SubscriptionManager } from 'src/app/interfaces/Common';


@Directive()
export abstract class GridArea extends SubscriptionManager implements Deffered {
  @HostBinding('style.grid-area')
  public gridArea: string = '';
  public properties: {[key:string]: any} = {};
  public ready: AsyncSubject<null> = new AsyncSubject();

  constructor() {
    super();
    this.once(this.ready, this.onReady.bind(this));
  }
  
  onReady() {}; //default

  ngAfterViewInit() {
    this.ready.next(null);
    this.ready.complete();
  }
  
  ngOnDestroy() {
    super.ngOnDestroy();
  }
};