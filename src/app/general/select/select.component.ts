import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  // encapsulation: ViewEncapsulation.None
})
export class SelectComponent implements OnInit, OnChanges {
  @Input() style: 'outlined' | 'normal' | 'none' = 'normal';
  @Input() label: string ='';
  @Input() opts: { value: (string|number); label: string }[] =[];

  @Output() selectionChange = new EventEmitter<any>();
  @Input() selectedValue: any;
  @Input() disabled = false;
  selectedOpt?: { value: any; label: string };
  isOpen: boolean = false;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['opts'] || changes['selectedValue']) {
      if (this.selectedValue !== undefined) {
        this.selectedOpt = this.opts.find(
          (opt) =>
            JSON.stringify(opt.value) === JSON.stringify(this.selectedValue)
        );
        if (!this.selectedOpt) {
          setTimeout(() => this.handleChange(null));
        }
      }
    }
  }

  ngOnInit() {}
  handleChange(newOpt: any) {
    this.selectionChange.emit(newOpt?.value);
    this.selectedOpt = newOpt;
  }
}
