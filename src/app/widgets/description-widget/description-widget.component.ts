import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, QueryList, ViewChildren, Input } from '@angular/core';
import { TargetService } from './description-service.service';
import { BasicWidget } from '../BasicWidget';
import { SubscriptionManager, Utils } from 'src/app/interfaces/Common';
import { Node } from '../../middle/Node';
import { CD } from 'src/app/middle/Descriptions';

@Component({
  selector: 'description-widget',
  templateUrl: './description-widget.component.html',
  styleUrls: ['./description-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptionWidgetComponent extends SubscriptionManager {

  @ViewChildren('input', {read: ElementRef})
  inputs?: QueryList<ElementRef>;
  currentSelection: number = 1;
  values: number[][] = [
    [0, 0, 0],
    [0, 0, 0]
  ];

  @Input()
  set node(value: Node | undefined) {
    this.values = CD.computeDescriptionWidget(value!);
  };

  constructor(public targetService: TargetService) {
    super();
  }

  ngOnInit() { this.targetService.reset(); }

  get volume() {
    return Utils.format(this.values[1 - this.currentSelection][0]);
  }

  get DN() {
    return Utils.format(this.values[1 - this.currentSelection][1], 3, true);
  }

  get ratio() {
    return Utils.format(this.values[1 - this.currentSelection][2]);
  }

  inputChanged(idx: number) {
    let input = this.inputs?.get(idx);
    if ( !input ) throw `[DescriptionWidget]: cannot find input`;
    this.currentSelection = idx;
    this.targetService.target = input.nativeElement.value;
  }
}
