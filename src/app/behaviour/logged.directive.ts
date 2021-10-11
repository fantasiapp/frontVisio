import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { LoggerService } from './logger.service';

@Directive({
  selector: '[logged]'
})
export class LoggedDirective implements AfterViewInit {

  @Input('logged') name: string = 'default';
  oldValue: any;

  constructor(private logger: LoggerService, private ref: ElementRef) {

  }

  ngAfterViewInit() {
    this.oldValue = this.ref.nativeElement.value;
    LoggerService.bind(this.ref.nativeElement, (e: Event, callback: any) => {
      let newValue = this.ref.nativeElement.value;
      this.logger.add(...callback(this.name, newValue, this.oldValue));
      this.oldValue = newValue;
    });
  }
};