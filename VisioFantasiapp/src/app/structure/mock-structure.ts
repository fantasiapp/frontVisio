export const MOCK_NAVIGATION = {
  Année_2021: [
    {
      levelName: 'National',
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
      ],
    },
    {
      levelName: 'Regional',
      superLevel: 'National',
      subLevel:'Secteur',  
      list: [
        'ile de france',
        'sud-ouest',
        'Rhone Alpes',
        'Sud-Est',
        'Nord-Est',
        'Ouest',
      ],
    },
    {
      levelName: 'Secteur',
      superLevel:'Regional',
      subLevel:'',  
      list: [
        'Cascales Laurent',
        'Teixeira Sandrine',
        'Fisher Alexandre',
        'Dauthuiles Stephane',
        'Do Fetal Pascal',
        'Freitas Filipe',
        'Batot Kevin'
      ],
    },
  ],
};
