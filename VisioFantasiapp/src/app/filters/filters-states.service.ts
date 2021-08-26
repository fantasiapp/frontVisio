import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MOCK_NAVIGATION } from '../structure/mock-structure';

@Injectable({
  providedIn: 'root'
})

export class FiltersStatesService {
  currentlevelName : string = ''
 
 currentStates  = new BehaviorSubject({
    levelName : 'National',
    superLevel: '',
    subLevel:'Regional',
    list: [
      'marché P2CD',
      'marche enduit',
      'PdN P2CD',
      'PdN P2CD Simulation',
      'PdN enduits Simulation',
      'DN P2CD',
      'DN enduits',
      'DN P2CD Simulation',
      'DN enduit simulation',
      'Point de Ventes P2CD',
      'Point de ventes enduit',
      'Synthèse P2Cd',
      'Synthèse enduits',
      'Synthèse P2CD simulation',
      'Suivi AD',
      'Suivi Des visites'
    ]
 })
  constructor() { }
  public updateState(annee: number, level: string){
    const blockShowed = MOCK_NAVIGATION.Année_2021.find(element =>  element.levelName === level)
    blockShowed? this.currentStates.next({
     levelName : blockShowed.levelName,
     superLevel : blockShowed.superLevel,
     subLevel: blockShowed.subLevel,
     list : blockShowed.list
    }) : 2
  }
}
