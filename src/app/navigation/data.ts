export const data: {
  [key: string]: any
} = {
  "structure": ["id", "levelName", "listDashBoards", "subLevel"],

  // "levels": [
  //   1,
  //   "root",
  //   [1, 2, 3, 4, 5, 6, 7, 8],
  //   [2, "drv", [1, 2, 3, 4], [3, "agent", [1, 2, 3, 4, 9, 10]]]
  // ],
  "levels": [
    {"label":"root", "dashboards":[1, 2, 3, 4, 5, 6, 7, 8]},
    {"label":"drv", "dashboards":[1, 2, 3, 4]},
    {"label":"agent", "dashboards":[1, 2, 3, 4, 9,10]},
  ],
  "dashBoard": {
    "1": { "name": "March\u00e9 P2CD" },
    "2": { "name": "March\u00e9 Enduit" },
    "3": { "name": "PdM P2CD" },
    "4": { "name": "PdM Enduit" },
    "5": { "name": "Synth\u00e8se P2CD" },
    "6": { "name": "Synth\u00e8se Enduit" },
    "7": { "name": "Suivi des ventes" },
    "8": { "name": "Suivi de l'AD" },
    "9": { "name": "Agent P2CD" },
    "10": { "name": "Agent Enduit" }
  },
  "tree": [
    "root",
    [
      [3, [13, 14, 15, 16, 17, 18]],
      [1, [1, 2, 3, 4, 5, 6]],
      [2, [7, 8, 9, 10, 11, 12]],
      [4, [19, 20, 21, 22, 23, 24]],
      [5, [25, 26, 27, 28, 29, 30]],
      [6, [31, 32, 33, 34, 35, 36]]
    ]
  ],
  "drv": {
    "1": "SUD-OUEST",
    "2": "RHONE ALPES",
    "3": "ILE DE France",
    "4": "SUD-EST",
    "5": "OUEST",
    "6": "NORD-EST"
  },
  "agent": {
    "1": "CASCALES LAURENT",
    "2": "RIBIERE FRANCK",
    "3": "BRAY JEROME",
    "4": "TEIXEIRA SANDRINE",
    "5": "TERKI KARIM",
    "6": "BARGOZZA FLORENT",
    "7": "BIDARD OLIVIER",
    "8": "FRESNEAU ALEXANDRE",
    "9": "VAILLANT SEBASTIEN",
    "10": "COTTERLAZ-RANNARD A.",
    "11": "LYS JEROME",
    "12": "PONCE MICHAEL",
    "13": "ROBIEUX CHARLY",
    "14": "BOUMARAF CHRISTOPHE",
    "15": "FREITAS FILIPE",
    "16": "JAILLAT FREDERIC",
    "17": "PALTANI REGIS",
    "18": "HENRY MATHIEU",
    "19": "DIMULLE ALAIN",
    "20": "GOUESSAN GUILLAUME",
    "21": "DAUTHUILLE STEPHANE",
    "22": "DO FETAL PASCAL",
    "23": "BIERE GERALDINE",
    "24": "BRUNET CHRISTOPHE",
    "25": "LEVESQUE LILIAN",
    "26": "BARTOLO DIDIER",
    "27": "MARCHAL TONY",
    "28": "CARUCCIO STEPHANE",
    "29": "AUBINEAU NICOLAS",
    "30": "DELALANDE JEROME",
    "31": "BATOT KEVIN",
    "32": "FISCHER ALEXANDRE",
    "33": "FORTIN ANNE",
    "34": "CHAMBEFORT PATRICE",
    "35": "GARRAUT ROLAND",
    "36": "DANJOU SEVERINE",
    "37": "LAURENT FREDERIC",
    "38": "ROUX PHILIPPE",
    "39": "ANTUNES JEAN-MANUEL",
    "40": "CHARVOT THOMAS",
    "41": "BOULET MORGANE",
    "42": "DIMULLE",
    "43": "RIBIERE",
    "44": "GOFFIN",
    "45": "BARTOLO",
    "46": "GUERIN",
    "47": "ROUX",
    "48": "GARRAUT"
  }
}
