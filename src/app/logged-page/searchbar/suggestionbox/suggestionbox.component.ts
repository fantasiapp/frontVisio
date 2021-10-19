import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
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
  
  @Output()
  confirm: EventEmitter<string> = new EventEmitter();

  constructor() { }

  formatSpecial(x: any) {
    if ( x == SearchService.OPENMENU ) {
      return '(menu)'
    } else {
      return x.toString();
    }
  }

  navigate(index: number) {
    let suggestion = (this.suggestions as any)[index];
    if ( !suggestion )
      throw 'yeah, unexpected';
    
    
    this.confirm.emit(suggestion[0] + suggestion[1]);
  }
}
