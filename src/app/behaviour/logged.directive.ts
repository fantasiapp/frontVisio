import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { LoggerService } from './logger.service';

@Directive({
  selector: '[logged]'
})
export class LoggedDirective implements AfterViewInit {

  @Input('logged') name: string = 'GENERIC';
  oldValue: any;

  constructor(private logger: LoggerService, private ref: ElementRef) {

  }

  ngAfterViewInit() {
    this.oldValue = this.ref.nativeElement.value;
    this.ref.nativeElement.addEventListener('change', (e: Event) => {
      this.logger.push([this.name, this.oldValue, this.ref.nativeElement.value]);
    });
  }
};