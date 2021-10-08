import { Directive, ElementRef } from '@angular/core';
import { Navigation } from '../middle/Navigation';
import { PDV } from '../middle/Slice&Dice';

@Directive({
  selector: '[rootLevelOnly]'
})
export class RootLevelOnlyDirective {

  constructor(private el: ElementRef, private navigation: Navigation) { }

  ngAfterViewInit() {
    console.log(this.el.nativeElement);
    let isRoot = this.navigation.currentLevel == PDV.geoTree.root;
    if ( !isRoot )
      this.el.nativeElement.display = 'none';
  }
}
