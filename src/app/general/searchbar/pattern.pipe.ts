import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pattern'
})
export class PatternPipe implements PipeTransform {

  static transform(value: string, ...args: unknown[]): string {
    return value.length <= 8 ? value : value.slice(0, 8) + '..';
  }

  transform(value: string, ...args: unknown[]): string {
    return PatternPipe.transform(value, ...args);
  }
}
