import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, HostListener, SimpleChange, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import DEH from 'src/app/middle/DataExtractionHelper';
import { MapIconBuilder } from '../map.component';

let PropertyIterator = function(this: any) {
  return function*(this: any) {
    let properties = Object.getOwnPropertyNames(this);
    for ( let i = 0; i < properties.length; i++ )
      yield properties[i];
  }.call(this);
};

let ValueIterator = function(this: any) {
  return function*(this: any) {
    let properties = Object.getOwnPropertyNames(this);
    for ( let i = 0; i < properties.length; i++ )
      yield this[properties[i]];
  }.call(this);
};

@Component({
  selector: 'map-legend',
  templateUrl: './map-legend.component.html',
  styleUrls: ['./map-legend.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapLegendComponent {
  constructor(private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {
    this.update();
  }

  @HostBinding('class.closed')
  closed: boolean = true;

  @HostListener('click')
  onClick() {
    this.closed = !this.closed;
  }

  readonly categories: any = {
    [Symbol.iterator]: PropertyIterator
  };

  update() {
    this.resetCategories();    
    this.findCategories(MapIconBuilder.instance.icons);
    this.cd.markForCheck();
  }

  resetCategories() {
    for (const prop of Object.getOwnPropertyNames(this.categories))
      delete this.categories[prop];
    return this.categories;
  }

  findCategories(dict: any) {
    let keys = Object.keys(dict).filter(x => x !== 'data' && x !== 'icon');
    if ( !dict || !keys.length ) return;
    let category = keys[0].split('.')[0],
      ids = keys.map(key => +key.split('.')[1]),
      mapping = DEH.get(category),
      values;
    
    if ( mapping ) {
      ids.sort((x, y) => 1-2*+(mapping[x] < mapping[y]));
      values = ids.map(id => mapping[id]);
    } else {
      values = ids.map(id => id ? 'Oui' : 'Non');
    }
    this.categories[category] = [values, ids.map(id => dict[category + '.' + id]['icon'].url)];
    this.findCategories(dict[category + '.' + ids[0]]);
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('changes', changes);
  }

  trackByName(index: number, category: string) {
    return category;
  }

  unCamelCase(term: string) {
    return term.replace(/[A-Z]/g, ([letter, ...rest]) => {
      return ' ' + letter
    }).replace(/^./, ([letter, ...rest]) => {
      return letter.toUpperCase();
    });
  }
  
  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}