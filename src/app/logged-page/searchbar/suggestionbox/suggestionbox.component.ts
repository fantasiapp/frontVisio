import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { SearchService, Suggestion } from 'src/app/services/search.service';

@Component({
  selector: 'suggestionbox',
  templateUrl: './suggestionbox.component.html',
  styleUrls: ['./suggestionbox.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuggestionBox implements AfterViewInit {

  @HostBinding('class.hidden')
  get shouldBeHidden() {
    return this.suggestions? !this.suggestions.length : true; 
  }
  
  @Input()
  suggestions: Suggestion[] | null = [];
  
  private suggestionSize = 28;
  private _selection: number = -1;
  private scrollRatio = 0;
  private scrollStart = 0;

  @Input()
  set selection(value: number) {
    if ( !this.suggestions ) return;
    
    let scrollRatio = this.scrollRatio || (this.ref.nativeElement.scrollHeight - 10) / (this.suggestions.length * this.suggestionSize),
      ref = this.ref.nativeElement,
      quantity = Math.max(0, value) - this.scrollStart;
    
    this._selection = value;
    if ( quantity >= this.maxSuggestions ) {
      this.scrollStart += quantity - this.maxSuggestions + 1;
    } else if ( quantity < 0 ) {
      this.scrollStart += quantity;
    } else {
      return;
    }
    
    ref.scroll(0, - 5 + this.scrollStart * this.suggestionSize * scrollRatio);
  }

  get selection() { return this._selection; }

  @Input()
  maxSuggestions: number = 7;
  
  @Output()
  confirm: EventEmitter<Suggestion> = new EventEmitter();

  constructor(private ref: ElementRef) { }

  ngAfterViewInit() {
    this.ref.nativeElement.style.maxHeight = (5 + (this.maxSuggestions + 1) * this.suggestionSize) + 'px';
  }
  
  formatSpecial(x: any) {
    if ( x & SearchService.IS_PATTERN ) {
      return '(categorie)'
    } else if ( x & SearchService.IS_REDIRECTION ) {
      return '(niveau principal)'
    } else if ( typeof x == 'object' ) {
      return x.info ? '(' + x.info + ')' : '';
    } else {
      return '(' + x + ')';
    }
  }

  capitalizeSecond(suggestion: Suggestion) {
    let term = suggestion[1];
    if ( !suggestion[0] )
      return term.split(' ').map(part => part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : '').join(' ')
    return term.split(' ').map((part, index) => index == 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()).join(' ');
  }

  navigate(index: number) {
    let suggestion = (this.suggestions as any)[index];
    this.confirm.emit(suggestion);
  }

  trackByResult(index: number, result: any) {
    if ( result.node )
      return SuggestionBox.NODE_MASK | result.node.id;
    else if ( result.dashboard )
      return SuggestionBox.DASHBOARD_MASK | result.dashboard.id;
    else if ( result.pdv )
      return SuggestionBox.PDV_MASK | result.pdv.id;
    return index;
  }

  static NODE_MASK = 1 << 30;
  static DASHBOARD_MASK = 1 << 29;
  static PDV_MASK = 1 << 28;
}
