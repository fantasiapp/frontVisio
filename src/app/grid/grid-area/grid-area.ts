import { Directive, HostBinding } from '@angular/core';

@Directive()
export abstract class GridArea {
  @HostBinding('class.box')
  private isBoxed: boolean = true; 
  @HostBinding('style.grid-row')
  public gridRow: string = '';
  @HostBinding('style.grid-column')
  public gridColumn: string = '';
};