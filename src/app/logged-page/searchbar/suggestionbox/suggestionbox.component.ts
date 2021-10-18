import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'suggestionbox',
  templateUrl: './suggestionbox.component.html',
  styleUrls: ['./suggestionbox.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuggestionBox {

  @HostBinding('class.hidden')
  get shouldBeHidden() {
    return this.suggestions? !this.suggestions.length : true; 
  }
  
  @Input()
  suggestions: [string, string, any][] | null = [];
  @Input()
  selection: number = -1;

  constructor() { }

  format(x: any) {
    if ( x == SearchService.OPENMENU ) {
      return '(menu)'
    } else {
      return x.toString();
    }
  }
}
