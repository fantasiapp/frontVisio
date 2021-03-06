import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, HostListener, Input, SimpleChange, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Updatable } from 'src/app/interfaces/Common';
import DEH from 'src/app/middle/DataExtractionHelper';
import { MapIconBuilder } from '../MapIconBuilder';

let PropertyIterator = function(this: any) {
  return function*(this: any) {
    let properties = Object.getOwnPropertyNames(this);
    for ( let i = 0; i < properties.length; i++ )
      yield properties[i];
  }.call(this);
};

@Component({
  selector: 'map-legend',
  templateUrl: './map-legend.component.html',
  styleUrls: ['./map-legend.component.css'],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapLegendComponent implements Updatable {
  displayQuitDialog = false;
  closed: boolean = false;

  @Input()
  left: number = 20;

  constructor(private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {
    this.update();
  }

  @HostListener('click')
  onClick() {
    console.log('stop clicking me');
    if ( !this.closed ) {
      this.displayQuitDialog = true;
    } else this.closed = !this.closed;
  }

  onQuitConfirm(really: boolean) {
    this.displayQuitDialog = false;
    if ( really ) this.closed = true;
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
      mapping = DEH.getFilter(category),
      values;

    if ( Object.keys(mapping).length ) {
      ids.sort((x, y) => 1-2*+(mapping[x] < mapping[y]));
      values = ids.map(id => mapping[id]);
    } else {
      ids.sort();
      //try to interpret result
      if ( ids.length == 2 && !ids[0] && ids[1] )
        values = ids.map(id => id ? 'Oui' : 'Non');
      else
        throw `Unable to find category ${category}.`;
    }
    this.categories[category] = [values, ids.map(id => dict[category + '.' + id]['icon'].url)];
    this.findCategories(dict[category + '.' + ids[0]]);
  }

  unCamelCase(term: string) {
    return term.replace(/[A-Z]/g, ([letter, ...rest]) => {
      return ' ' + letter
    }).replace(/^./, ([letter, ...rest]) => {
      return letter.toUpperCase();
    });
  }

  trackByName(index: number, category: string) {
    return category;
  }
  
  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}