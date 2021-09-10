import { Component, Directive, HostBinding } from '@angular/core';

@Directive()
export abstract class GridArea {
  @HostBinding('style.display')
  private display: string = 'block';
  @HostBinding('style.grid-area')
  public gridArea: string = '';
};