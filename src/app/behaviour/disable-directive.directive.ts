import { Directive, AfterViewInit, ElementRef } from '@angular/core';

@Directive({
  selector: '[disableDirective]'
})
export abstract class DisableDirective implements AfterViewInit {

  constructor(private el: ElementRef) { }

  abstract computeDisabled(): boolean;

  ngAfterViewInit(): void {
    if(this.computeDisabled())
    this.el.nativeElement.disabled = true; 
  }



}
