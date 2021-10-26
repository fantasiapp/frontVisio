import { Component, ViewChild, ElementRef, HostBinding, ChangeDetectorRef, OnDestroy, ViewChildren } from '@angular/core';
import { Subscription, Subject, combineLatest } from 'rxjs';
import { combineAll, startWith } from 'rxjs/operators';
import { LoggerService } from '../behaviour/logger.service';
import { FiltersStatesService } from '../filters/filters-states.service';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';
import { DataService } from '../services/data.service';
import { BasicWidget } from '../widgets/BasicWidget';
import { MapFiltersComponent } from './map-filters/map-filters.component';

type MarkerType = {
  pdv: PDV;
  position: google.maps.LatLng;
  icon?: google.maps.ReadonlyIcon;
  map?: google.maps.Map;
  title?: string;
};

//Can be optimized by loading all and then filtering
//Do it when you have time
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  //changeDetection: ChangeDetectionStrategy.OnPush //we want easy mode here
})
export class MapComponent implements OnDestroy {
  @HostBinding('style.display')
  private get display() {
    return this.hidden ? 'none' : 'flex';
  }

  @ViewChild(MapFiltersComponent)
  filters?: MapFiltersComponent;

  @ViewChild('mapContainer', {static: false})
  mapContainer?: ElementRef;


  onCriteriaChanged() {
    this.computePDVs();
    this.update();
  }
  
  selectedPDV?: PDV;
  private hidden: boolean = true;
  private markers: google.maps.Marker[] = [];
  
  hide() {
    this.hidden = true;
    this.unsubscribe();
    this.logger.handleEvent(LoggerService.events.MAP_STATE_CHANGED, false);
    this.logger.actionComplete();
  }

  show() {
    if ( this.shouldUpdateIcons ) {
      console.log('[MapComponent]: Updating Icons.');
      MapIconBuilder.initialize();
      this.computePDVs();
      this.shouldUpdateIcons = false;
    }

    this.interactiveMode();
    this.hidden = false;
    this.logger.handleEvent(LoggerService.events.MAP_STATE_CHANGED, true);
    this.logger.actionComplete();
  }
  
  get shown() { return !this.hidden; }
  
  map?: google.maps.Map;
  path: any = {};
  pdvs: PDV[] = [...PDV.getInstances().values()];
  allPdvs: PDV[] = this.pdvs;
  infowindow: any = {};
  markerTimeout: any = 0;
  stateSubscription?: Subscription;
  updateSubscription?: Subscription;
  shouldUpdateIcons: boolean = false;

  constructor(private filtersService: FiltersStatesService, private dataservice: DataService, private logger: LoggerService, private cd: ChangeDetectorRef) {
    console.log('[MapComponent]: On');
    MapIconBuilder.initialize();
    this.initializeInfowindow();
    if ( this.shown )
      this.interactiveMode();    
  }

  private interactiveMode() {
    this.stateSubscription = this.filtersService.stateSubject.subscribe(({States}) => {
      let path = this.filtersService.getPath(States);
      if ( !BasicWidget.shallowObjectEquality(this.path, path) ) {
        this.path = path;
        this.allPdvs = PDV.sliceMap(this.path, [], this.filtersService.navigation.tree?.type == PDV.geoTree.type)
        console.log('path changed', this.allPdvs);
        this.computePDVs();
        this.update();
      } else if ( !this.map )
        this.update();
    });
    
    //unsubscribe from this
    this.updateSubscription = this.dataservice.update.subscribe(_ => {
      this.shouldUpdateIcons = true;

      if ( !this.hidden ) {
        MapIconBuilder.initialize();
        this.computePDVs();
        this.update();
        this.shouldUpdateIcons = false;
      }
    });
  }

  private computePDVs() {
    this.pdvs = this.filters?.apply(this.allPdvs) || this.allPdvs;
  }

  initializeInfowindow() {
    let content = this.infowindow.content = document.createElement('div'),
      title = this.infowindow.title = document.createElement('span'),
      button = this.infowindow.button = document.createElement('img');
      
    content.classList.add('infowindow');
    title.classList.add('infowindow-title');
    button.classList.add('infowindow-button');
    button.src = 'assets/Point d\'info.svg';
    
    content.appendChild(title);
    content.appendChild(button);
    this.infowindow.element = new google.maps.InfoWindow();
  }

  focusPDV(pdv: PDV) {
    let marker = this.createMarker(pdv);
    this.adjustMap([marker]);
    this.selectedPDV = pdv;
  }

  update() {
    this.removeMarkers();
    if ( !this.map )
      this.createMap();
    this.addMarkersFromPDVs();
  }

  private createMap() {
    let zoom = 7;
    this.map = new google.maps.Map(this.mapContainer!.nativeElement, {
      center: { lat: 48.52, lng: 2.19 },
      zoom,
      minZoom: zoom - 1,
      maxZoom: zoom + 6,
      gestureHandling: 'auto',
      restriction: {
        latLngBounds: {
          north: 52,
          south: 40,
          east: 15,
          west: -10,
        }
      },
      disableDefaultUI: true,
      zoomControl: true,
      rotateControl: true,
      styles: [{
        featureType: 'poi.attraction',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.school',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.sports_complex',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.place_of_worship',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.medical',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.government',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: "poi.park",
        elementType: "geometry.fill",
        stylers: [{ color: "#81D4A0" }],
      }, {
        featureType: 'transit',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: "landscape.natural",
        elementType: "geometry",
        stylers: [{color: "#9ADCB2"}],
      }, {
        featureType: "landscape.natural.terrain",
        elementType: "geometry",
        stylers: [{color: "#EEECE4"}],
      }, {
        featureType: 'water',
        elementType: 'geometry.fill',
        stylers: [{color: '#79A8ED'}],
      }, {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{visibility: 'off'}],
      }, {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{color: "#FFE395"}],
      }, {
        featureType: 'road.arterial',
        elementType: 'all',
        stylers: [{visibility: 'off'}],
      }, {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{color: '#F2B508'}],
      }, {
        featureType: 'administrative.country',
        elementType: 'geometry',
        stylers: [{color: '#e25a63', weight: 10}],
      }]
    });
  }

  handleClick(pdv: PDV) {
    this.selectedPDV = pdv;
    this.cd.markForCheck();
  }

  private addMarker(markerData: MarkerType): google.maps.Marker {
    let marker = new google.maps.Marker({
      ...markerData,
      optimized: true
    });

    let name = markerData.title;
    if ( name ) {
      let info = this.infowindow.element as google.maps.InfoWindow;
      marker.addListener('click', () => {
        info.close();
        this.infowindow.title.innerText = name;
        this.infowindow.button.onclick = () => { this.handleClick(markerData.pdv); }
        info.setContent(this.infowindow.content);
        info.open(this.map, marker);
      });
    }
    
    this.markers.push(marker);
    return marker;
  }

  displayMarkers() {
    let f: any, step = 4000, idx = 0;
    this.markerTimeout = setTimeout(f = () => {
      for ( let i = idx, l = Math.min(this.markers.length, idx+step); i < l; i++ )
        this.markers[i].setMap(this.map!);
      idx += step;
      if ( idx < this.markers.length )
        setTimeout(f, 0);
    }, this.markers.length > 2000 ? this.markers.length / 20 : 0);
    //if number is too big, wait for the animation
  }

  removeMarkers() {
    for ( let marker of this.markers )
      marker.setMap(null); 
    this.markers.length = 0;
    if ( this.markerTimeout ) {
      clearTimeout(this.markerTimeout);
      this.markerTimeout = 0;
    }
  }

  private adjustMap(markers:  MarkerType[]) {
    let center = [0, 0];
    markers.forEach((marker: MarkerType) => {
      let latlng = marker.position;
      center[0] += latlng.lat();
      center[1] += latlng.lng();
    });

    center[0] /= markers.length;
    center[1] /= markers.length;

    //calculate deviation, the bigger it is, the less the zoom
    let variance = [0, 0];

    markers.forEach((marker: MarkerType) => {
      let latlng = marker.position;
      variance[0] += Math.pow(latlng.lat() - center[0], 2);
      variance[1] += Math.pow(latlng.lng() - center[1], 2);
    });

    variance[0] /= (markers.length - 1);
    variance[1] /= (markers.length - 1);
    let std = Math.sqrt(variance[0] + variance[1]);
    let zoom = MapComponent.round(10.3 - 2.64*std + 0.42*std*std);

    requestAnimationFrame(() => {
      this.map!.setZoom(zoom || 13);
      this.map!.panTo(
        new google.maps.LatLng(
          center[0] || 48.52,
          center[1] || 2.19
        )
      );
    });
  }

  private createMarker(pdv: PDV): MarkerType {
    let lat = pdv.attribute('latitude'),
      lng = pdv.attribute('longitude'),
      industrie = pdv.property('industrie'),
      icon = MapIconBuilder.instance.get([industrie, +(pdv.property('clientProspect') == 3), +pdv.attribute('pointFeu'), pdv.attribute('segmentMarketing')]);

    if ( !icon ) throw 'Cannot find icon, maybe ids change';
    return {
      position: new google.maps.LatLng(lat, lng),
      icon,
      title: pdv.attribute('name'),
      pdv
    }
  }

  private addMarkersFromPDVs() {
    if ( !this.pdvs.length )
      return;
    
    let markers: MarkerType[] = this.pdvs.map((pdv: PDV) => {
      return this.createMarker(pdv);
    });

    this.adjustMap(markers);

    for ( let marker of markers )
      this.addMarker(marker);
    
    this.displayMarkers();
  };

  static round(x: number, threshold: number = 0.5): number {
    let int = Math.floor(x),
      frac = x - int;
    if ( frac > threshold )
      return int + 1;
    return int;
  };

  private unsubscribe() {
    this.stateSubscription?.unsubscribe();
    this.updateSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.unsubscribe();
  }
};

export class MapIconBuilder {
  defaultValues: any;
  axes: any[];
  axesNames: string[];
  icons: any;

  constructor(defaultValues: any) {
    this.defaultValues = defaultValues;
    this.axes = [];
    this.axesNames = [];
    this.icons = {'data': {}};
  }

  createIcon(values: any) {
    let width = this.getPropertyOf(values, 'width'),
      height = this.getPropertyOf(values, 'height'),
      stroke = this.getPropertyOf(values, 'stroke'),
      strokeWidth = this.getPropertyOf(values, 'strokeWidth'),
      fill = this.getPropertyOf(values, 'fill');
    
    return {
      url: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width='${width}' height='${height}' version='1.1' xmlns='http://www.w3.org/2000/svg'>
          ${values.head ? values.head(this, values) : `<circle cy='10' cx='15' r='8' stroke='${stroke}' stroke-width='1' fill='${fill}'></circle>`}
          ${values.body ? values.body(this, values) : `<line x1='15' y1='18' x2='15' y2='30' stroke='${stroke}' stroke-width='${strokeWidth}'></line>`}
          ${values.feet ? values.feet(this, values) : ``}
        </svg>
      `),
      scaledSize: new google.maps.Size(width, height)
    }
  }

  getPropertyOf(object: any, key: string) {
    return (object && object[key]) || this.defaultValues[key];
  }

  axis(name: string, axis: any) {
    this.axesNames.push(name);
    this.axes.push(axis);
    return this;
  }

  generate() {
    this.generateData();
    this.generateIcons();
  }

  get(path: string[]) {
    let dict = this.icons;
    for ( let i = 0; i < this.axesNames.length; i++ ) {
      let name = this.axesNames[i] + '.' + path[i];
      if ( dict[name] )
      dict = dict[name];
      else
      return null;
    }
    
    return dict.icon;
  }

  private generateData(previousDict=this.icons, height:number=0) {
    if ( height >= this.axesNames.length ) return;
    let axisName = this.axesNames[height];
    let data = this.axes[height];

    for ( let item of data ) {
      let key = axisName + '.' + item[0];
      previousDict[key] = {'data': {...previousDict['data'], ...item[1]}}; 
      this.generateData(previousDict[key], height+1);
    }
  }

  private generateIcons(previousDict=this.icons, height:number=0) {
    if ( height >= this.axesNames.length ) return;
    let keys = Object.getOwnPropertyNames(previousDict);
    for ( let key of keys ) {
      if ( !previousDict[key].data ) continue
      previousDict[key].icon = this.createIcon(previousDict[key]['data']);
      this.generateIcons(previousDict[key], height+1);
    }
  }

  static circle(builder: MapIconBuilder, {stroke = builder.getPropertyOf(null, 'stroke'), fill}: any) {
    return `<circle cy='10' cx='15' r='8' stroke='${stroke}' stroke-width='1' fill='${fill}'></circle>`
  }

  static square(builder: MapIconBuilder, {stroke = builder.getPropertyOf(null, 'stroke'), fill}: any) {
    return `<rect x='8' y='3' width='14' height='14' stroke='${stroke}' stroke-width='1' fill='${fill}'></rect>`
  }

  static diamond(builder: MapIconBuilder, {stroke = builder.getPropertyOf(null, 'stroke'), fill}: any) {
    return `<rect transform='rotate(45, 15, 10)' x='8' y='3' width='14' height='14' fill='${fill}' stroke='${stroke}' stroke-width='1'></rect>`
  }

  static fire(builder: MapIconBuilder, {strokeFeet = builder.getPropertyOf(null, 'stroke')}: any) {
    return `<circle cx='15' cy='26' r='4' stroke='${strokeFeet}' stroke-width='1' fill='#FF0000'></circle>`;
  }

  private static updated: Function[] = [];

  static onUpdate(f: Function) {
    this.updated.push(f);
  }

  static offUpdate(f: Function) {
    let idx = this.updated.findIndex(g => f == g);
    if ( idx > 0 )
      this.updated.splice(idx, 1);
  }

  static initialize() {
    let segmentMarketing = DataExtractionHelper.get('segmentMarketing');
    let industriel = DataExtractionHelper.get('industriel');

    let builder = new MapIconBuilder({
      width: 30, height: 30, stroke: '#151D21', strokeWidth: 1, fill: '#ffffff'
    });

    builder.axis('industriel', [
      [+DataExtractionHelper.getKeyByValue(industriel, 'Siniat')!, {fill: '#A61F7D'}],
      [+DataExtractionHelper.getKeyByValue(industriel, 'Placo')!, {fill: '#0056A6'}],
      [+DataExtractionHelper.getKeyByValue(industriel, 'Knauf')!, {fill: '#67CFFE'}],
      [+DataExtractionHelper.getKeyByValue(industriel, 'Autres')!, {fill: '#888888'}],
    ]).axis('clientProspect', [
      [0, {}],
      [1, {fill: '#FF0000'}]
    ]).axis('pointFeu', [
      [1, {strokeFeet: 'none', feet: MapIconBuilder.fire}], //<- draw fire later, now it's a circle
      [0, {}]
    ]).axis('segmentMarketing', [
      [+DataExtractionHelper.getKeyByValue(segmentMarketing, 'Généralistes')!, {head: MapIconBuilder.circle}],
      [+DataExtractionHelper.getKeyByValue(segmentMarketing, 'Multi Spécialistes')!, {head: MapIconBuilder.square}],
      [+DataExtractionHelper.getKeyByValue(segmentMarketing, 'Purs Spécialistes')!, {head: MapIconBuilder.diamond}],
      [+DataExtractionHelper.getKeyByValue(segmentMarketing, 'Autres')!, {head: MapIconBuilder.circle}]
    ]).generate();

    this._instance = builder;
    for ( let callback of this.updated )
      callback.call(this._instance);
  }

  static year = true;

  private static _instance: MapIconBuilder | null = null;
  static get instance() { return this._instance!; }
};