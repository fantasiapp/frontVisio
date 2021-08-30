import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css']
})
export class CheckboxComponent implements OnInit {
  
  @Input()  value: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  changeValue(): void {
    this.valueChange.emit(!this.value);
    }
  constructor() { }

  ngOnInit(): void {
  }

}

