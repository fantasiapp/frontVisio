import { Directive, HostBinding } from '@angular/core';

@Directive()
export abstract class GridArea {
  @HostBinding('style.display')
  private display: string = 'block';
  @HostBinding('style.grid-row')
  public gridRow: string = '';
  @HostBinding('style.grid-column')
  public gridColumn: string = '';
};