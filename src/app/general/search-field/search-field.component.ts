import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-search-field',
  templateUrl: './search-field.component.html',
  styleUrls: ['./search-field.component.css'],
})
export class SearchFieldComponent implements OnInit, OnChanges {
  @Input() noLense = false;
  @Input() searchModel: string | undefined;
  @Input() disabled!: boolean;
  @Output() onCrossClick: EventEmitter<string> = new EventEmitter();
  @Output() searchModelChange: EventEmitter<any> = new EventEmitter();
  @Output() disabledChange: EventEmitter<boolean> = new EventEmitter();
  @Output() onLoopClick: EventEmitter<null> = new EventEmitter();
  private destroy$: Subject<void> = new Subject<void>();

  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && changes['disabled'].currentValue == true) {
      this.disabledChange.emit(true);
    }
  }

  ngOnInit(): void {}

  // updateSearchModel(value) {
  //   this.searchModel = value;
  //   this.searchModelChange.emit(this.searchModel);
  // }

  handleLoopClick() {
    this.onLoopClick.emit();
  }

  handleCrossClick() {
    this.onCrossClick.emit(this.searchModel);
  }
}