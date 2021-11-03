import { Component, ViewChild, ElementRef, HostBinding, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { LoggerService } from '../behaviour/logger.service';
import { Interactive, SubscriptionManager } from '../interfaces/Common';
import { PDV } from '../middle/Slice&Dice';
import { DataService } from '../services/data.service';
import { MapFiltersComponent } from './map-filters/map-filters.component';
import { MapLegendComponent } from './map-legend/map-legend.component';
import { MapIconBuilder } from './MapIconBuilder';

type MarkerType = {
  pdv: PDV;
  position: google.maps.LatLng;
  icon?: google.maps.ReadonlyIcon;
  map?: google.maps.Map;
  title?: string;
  ref?: google.maps.Marker;
};
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent extends SubscriptionManager implements Interactive {
  @HostBinding('style.display')
  private get display() { return this.hidden ? 'none' : 'flex'; }

  @ViewChild(MapFiltersComponent)
  filters?: MapFiltersComponent;

  @ViewChild(MapLegendComponent)
  legend?: MapLegendComponent;

  @ViewChild('mapContainer', {static: false})
  mapContainer?: ElementRef;
  
  selectedPDV?: PDV;
  private hidden: boolean = true;
  private markers: MarkerType[] = [];
  get shown() { return !this.hidden; }

  private map?: google.maps.Map;
  private infowindow: any = {};
  private markerRenderingTimeout: any = 0;
  private shouldUpdateIcons: boolean = false;
  private pdvs: PDV[] = [];
  
  hide() {
    this.hidden = true;
    this.pause();
    this.logger.handleEvent(LoggerService.events.MAP_STATE_CHANGED, false);
    this.logger.actionComplete();
  }

  show() {
    if ( this.shouldUpdateIcons )
      this.onDataUpdate();

    this.interactiveMode();
    this.hidden = false;
    this.logger.handleEvent(LoggerService.events.MAP_STATE_CHANGED, true);
    this.logger.actionComplete();
  }
  
  constructor(private dataservice: DataService, private logger: LoggerService, private cd: ChangeDetectorRef) {
    super();
    console.log('[MapComponent]: On');
    MapIconBuilder.initialize();
    this.initializeInfowindow();
    
    if ( this.shown )
      this.interactiveMode();
    
    this.subscribe(this.dataservice.update, _ => {
      this.shouldUpdateIcons = true;

      if ( !this.hidden )
        this.onDataUpdate();
    });
  }

  ngAfterViewInit() {
    this.createMap();
  }

  interactiveMode() {
    this.filters?.interactiveMode();
  }

  pause() {
    this.filters?.pause();
  }

  protected onDataUpdate() {
    MapIconBuilder.initialize();
    this.legend?.update();
    this.filters?.update();
    this.shouldUpdateIcons = false;
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

  onPDVsChange(pdvs: PDV[]) {
    this.pdvs = pdvs;
    //this.update();
    this.incrementalUpdate();
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

  private addMarker(markerData: MarkerType): google.maps.Marker {
    let marker = new google.maps.Marker({
      ...markerData,
      optimized: true
    });

    markerData.ref = marker;

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
    
    this.markers.push(markerData);
    return marker;
  }

  handleClick(pdv: PDV) {
    this.selectedPDV = pdv;
    this.cd.markForCheck();
  }

  private shuffle<T>(array: T[]) {
    for ( let i = array.length - 1; i > 0; i-- ) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  displayMarkers(step = 1000, time = 400, shuffle = true) {
    let n = this.markers.length,
      q = (n / step) | 0,
      a = 2.5 * (n - (q+1)/2*step)*q/time;

    let markersToAdd = this.markers.filter(marker => !marker.ref!.getMap());
    
    if ( shuffle )
      markersToAdd = this.shuffle(markersToAdd);
    
    let idx = 0;
    let f = () => {
      for ( let i = idx, l = Math.min(markersToAdd.length, idx+step); i < l; i++ )
        if ( markersToAdd[i].ref && !(markersToAdd[i].ref!.getMap()) )
          markersToAdd[i].ref!.setMap(this.map!);
        
      idx += step;
      if ( idx < markersToAdd.length )
        this.markerRenderingTimeout = setTimeout(f, (markersToAdd.length - idx) / a);
      else
        this.markerRenderingTimeout = 0;
    }
    f();
    //if number is too big, wait for the animation
  }

  removeMarkers() {
    for ( let marker of this.markers )
      marker.ref?.setMap(null); 
    this.markers.length = 0;
    if ( this.markerRenderingTimeout ) {
      clearTimeout(this.markerRenderingTimeout);
      this.markerRenderingTimeout = 0;
    }
  }

  private async incrementalUpdate() {
    //wait until all is rendered
    await this.watch('markerRenderingTimeout', (timeout) => !timeout);

    let existingPDVs = new Set(this.markers.map(marker => marker.pdv)),
      allPDVS = new Set(this.pdvs),
      keptMarkers = this.markers.filter(marker => allPDVS.has(marker.pdv)),
      newPdvs = this.pdvs.filter(pdv => !existingPDVs.has(pdv)),
      deletedMarkers = this.markers.filter(marker => !allPDVS.has(marker.pdv));
  
    for ( let deletedMarker of deletedMarkers )
      deletedMarker.ref?.setMap(null);
    
    this.markers = keptMarkers;
    this.addMarkersFromPDVs(newPdvs);
  }

  private watch(property: string, pred: (value: any) => boolean, t: number = 0) {
    return new Promise((res, rej) => {
      if ( this[property as keyof MapComponent] === void 0 ) rej();
      let id = setInterval(() => {
        if ( pred(this[property as keyof MapComponent]) ) { clearTimeout(id); res(true); }
      }, t);
    });
  }

  private adjustMap(markers: MarkerType[] = this.markers) {
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

    this.map!.setZoom(zoom || 13);
    this.map!.panTo(
      new google.maps.LatLng(
        center[0] || 48.52,
        center[1] || 2.19
      )
    );
  }

  private createMarker(pdv: PDV): MarkerType {
    let lat = pdv.attribute('latitude'),
      lng = pdv.attribute('longitude'),
      icon = pdv.icon || MapIconBuilder.getIcon(pdv);

    if ( !icon ) throw 'Cannot find icon, maybe ids change';
    if ( !pdv.icon ) pdv.icon = icon;
    return {
      position: new google.maps.LatLng(lat, lng),
      icon,
      title: pdv.attribute('name'),
      pdv
    }
  }

  private addMarkersFromPDVs(pdvs: PDV[] = this.pdvs) {
    if ( pdvs.length ) {
      let markers: MarkerType[] = pdvs.map((pdv: PDV) => {
        return this.createMarker(pdv);
      });
  
      for ( let marker of markers )
        this.addMarker(marker);
    }

    this.displayMarkers();
    this.adjustMap();
  };

  static round(x: number, threshold: number = 0.5): number {
    let int = Math.floor(x),
      frac = x - int;
    if ( frac > threshold )
      return int + 1;
    return int;
  };
};