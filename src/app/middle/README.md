# Middle

### [Dashboard](./Dashboard.ts)

Classe pour instancier les dashboards. Rien à dire de plus.

### [DataExtractionHelper](./DataExtractionHelper.ts)

Classe pour faciliter l'accès aux données que l'on reçoit du back. La plupart des fonctions ont des noms évocateurs, mais quelques points restent utiles à détailler :
 - l'attribut `structuresDict` : on l'initialise au lancement de l'appli, pour chaque champ de structure que nous envoie le back, on créé un "reverse dict" de la liste (j'entends par là un dictionnaire qui a les éléments de la liste en keys et leur indice dans la liste en values), puis on l'ajoute dans `structuresDict` comme value du nom de la structure, la fonction `getPositionOfAttr` permet d'accéder au indices stockés dans ce dictionnaire;
- dans le même ordre d'idée l'attribut `industrieReverseDict` contient en clés les noms des industries et en values leurs ids, il est aussi initialisé au lancement de l'appli, ses valeurs sont accessibles par la fonction `getIndustryId`;
- la fonction `get` donne accès aux données envoyées par le back. Il y a cependant quelques subtilités, si le booléen `lastYear`est à true et si la ressource demandée possède une version pour l'année précédente alors la fonction renverra la version de l'année précédente, elle a également un argument `justNames` qui permet de récuperer agentFinitions (et potentiellement tout autre champ qui se présenterait pareil) comme s'il avait le format normal du reste de l'appli (à savoir les ids en keys et les names en values);
- la fonction `getTarget` renvoie les bonnes valeurs d'objectif en fonction des arguments. Mettre 'nationalbyAgent' comme level est utilisé pour signifier que l'on veut l'objectif national comme objectif cumulé de tous les agents;
- la fonction `getTargetVisits` donne également le seuil pour que la jauge soit verte dans le cas ou le booléen `threshold` est à true (les seuils sont calculés comme la moyenne des seuils des agents finition de la zone concernée);
- potentiellement à compléter avec les points qui portent sur le code qui a été écrit par Majed et par Baptiste.


### [DataWidget](./DataWidget.ts)

Le but de cette classe est de définir une structure pour contenir les données d'un widget et faire des opérations dessus.

- **Attributs**<br>
  - `data` : une matrice, une liste ou un number qui contient les données numériques du dataWidget;
  - `dim` : permet de connaître la forme des données (matrice, liste ou number)
  - `columnsTitles` et `rowsTitles` : contiennent respectivement les labels des colonnes et des lignes du widget;
  - `idToI` et `idToJ` : dictionnaires qui servent lors du remplissage du dataWidget, ils font la correspondance entre les ids des objects de l'axe concerné et le numéro de la ligne/colonne, par exemple si l'un de mes axes est `industry` et que je veux rajouter une donnée concernant l'industrie d'id 1, j'utilise l'un de ces dictionnaires pour savoir quelle ligne/colonne correpond à cette industrie;

- **Principales méthodes**<br>
  - `addOnCase`, `addOnRow`, et `addOnCol` : méthodes servant à remplir le dataWidget;
  - `widgetTreatement` : fait tous les traitements classiques dont on a besoin, à savoir diviser tout par 1000 quand le widget est en km², enlever les lignes et les colonnes nulles, trier les lignes par somme, réordonner les items des axes, grouper certaines lignes/colonnes;
  - `formatWidgetForGraph` : renvoie au front la structure idéale pour l'affichage du widget;
  - `completeWithCurve` : quand on se trouve dans le cas d'un histoCurve cette fonction permet de construire la ligne du cumul en pourcentage en fonction de celle du nombre de pdv complétés;
  - `getTargetStartingPoint` : renvoie le(s) point(s) de départ pour le calcul des emplacements des aiguilles de ciblage;  
  - `percent` : permet de mettre le dataWidget en pourcent selon les lignes ou selon les colonnes;
  - `numberToBool` : fonction qui sert dans le rubik's cube pour connaître les intersections de conditions qui mènent à des solutions non vides, globalement elle transforme une matrice de numbers en matrice de boolean selon data[i][j] = data[i][j] > 0, avec quelques subtilités car elle fait des colonnes de total.

### [Description](./Description.ts)

Les descriptions des dashboards peuvent être de simples chaînes de caractères à afficher ou contenir des parties calculées à partir des données de l'application. Ce fichier contient les méthodes nécessaires pour ce dernier cas.

Le principe général est qu'une description est un tableau qui contient des chaînes de caractères classiques et d'autres, commençant par un '@', qui doivent être évaluées avant d'être affichées.

La méthode `computeDescription` parcourt donc le tableau qui représente la description, elle évalue les chaînes de caractères qui doivent l'être, puis concatène le string[] en un unique string qui pourra être donné au front pour l'affichage.

Lorsque la méthode `computeDescription` tombe sur un élément du tableau qui nécessite d'être interprété, elle utilise la méthode `treatDescIndicator` qui agit comme un dispacher en redirigeant vers la méthode adaptée pour calculer ce qui est demandé.

### [Navigation](./Navigation.ts)

A remplir par Majed.

### [Node](./Node.ts)

A remplir par Majed.

### [Pdv](./Pdv.ts)

Le fichier contient 2 classes Pdv : la première `SimplePdv` qui reprend simplement les informations des pdvs que le back nous envoie, et la classe `PDV` en elle-même qui hérite de la première et qui rajoute plein de méthodes utiles.

Les principales méthodes de `PDV` sont:

- **Méthode statiques**<br>
  - `load` : pour initialiser tous les pdv, le dictionnaire qui répertorie leurs instances ainsi que les arbres;
  - `slice` : fonction qui prend un noeud et que renvoie la liste des pdv enfants de ce noeud;
  - `countForFilter` : fonction utilisée pour les filtres de la map qui sert à connaître le nombre de pdv qui appartiennent à chaque catégorie de chaque filtre (ça permet notamment de ne pas afficher les catégories vides);
  - `reSlice` : permet de filtrer les pdvs selon des critères qui ne sont pas liés aux arbres (c'est du O(n), il faut donc en faire un maximum en passant par le slice classique par arbre). Pour pouvoir sélectionner sur des critères qui ne sont pas directement des attributs, la fonction passe par `filterProperty` qui généralise les attributs simples d'un pdv.

- **Méthodes d'instance**<br>
  - `getValue` : retourne la/les valeur(s) d'un pdv pour un axe donné (suivant l'axe ça peut être un simple number ou un number[]). Pour se faire la fonction commence par appeler `computeSalesRepartition`, puis elle fait appel à la fonction appropriée pour poursuivre le calcul;
  - `computeSalesRepartition` : parcoure toutes les ventes d'un pdv pour calculer tous plein d'indicateurs utiles qu'elle renvoie sous forme d'un dictionnaire (comme par exemple le totalP2cd, le volume de vente Siniat, ...);
  - `computeDnLikeAxis` : pour calculer le retour du `getValue` pour les axes type Dn (ie les axes pour lesquels un pdv n'appartient qu'à une seule catégorie, le retour du `getValue` sera donc un number[] dont une seule case sera non vide). On commence par calculer la valeur à mettre dans la case non vide, puis on parcoure les libellés jusqu'à trouver le bon et ajouter la valeur dans la case correspondante;
  - `computeIrregularAxis` : pour les axes plus irréguliers pour lesquels un même pdv peut avoir des valeurs dans plusieurs catégories. On parcoure les libellés de l'axe en calculant à chaque fois la valeur du pdv pour ce libellé.
  - `filterProperty` : généralise les attributs, l'idée est de reproduire le comportement des attributs classiques avec des propriétés plus complexes, comme ciblage ou industriel, pour que le front n'ait pas à gérer de cas particulier (on fait donc comme si c'était un attribut classique dans lequel on a un id,...).

### [Sale](./Sale.ts)

Classe pour instancier les sales. Rien à dire de plus.

### [Slice&Dice](./Slice&Dice.ts)

Classe qui contient les méthodes qui renvoient toutes les données relatives aux widgets de l'application.

- **Attributs**<br>
  - `currentNode` : il est stocké ici pour que le front n'ait pas à le passer en argument à toutes les fonctions du middle. Le front le met à jour quand c'est nécessaire à l'aide de la méthode `updateCurrentNode`;
  - `currentSlice` : il est stocké pour ne pas être recalculé inutilement. Il est mis à jour à chaque fois que le currentNode l'est, et ce par la même fonction.

- **Méthodes**<br>
  - `getWidgetData` : renvoie toutes les données nécessaires pour que le front puisse afficher un widget. Globalement dans un premier temps la fonction extrait les couleurs des groupAxis envoyés par le back, puis elle récupère les données brutes du widget avec la fonction `getDataFromPdvs`, elle traite les données à l'aide des fonctions de traitement de la classe `DataWidget` et enfin elle calcule la position des aiguilles de ciblages;
  - `getDataFromPdvs` : la fonction récupère les données nécessaires pour créer le widget, puis elle l'initialise et le remplie à l'aide de `fillUpWidget`;
  - `fillUpWidget` : elle applique le `reSlice` sur le `currentSlice`, puis pour chaque pdvs qui reste elle récupère ce que renvoie sa fonction `getValue` pour l'axe en question, et elle ajoute ça sur la bonne case/ligne/colonne du dataWidget;
  - `computeTargetElement` : cette fonction calcule tout ce qui est nécessaire à l'affichage et à la mise à jour des aiguilles sur les graphes. Pour l'affichage, elle récupère toutes les target impliquées, puis elle calcule la position des aiguilles en fonction de ces targets, de la somme des colonnes impliquées et du point de départ considéré (par exemple pour l'axe "mainIndustries" l'aiguille s'affiche après la catégorie "Siniat");
  - `RubiksCubeCheck` : renvoie au front une matrice de booléens permettant de savoir quels sont les segments marketing disponibles en fonction de la position du rubik's cube.

### [SliceTable](./SliceTable.ts)

The [TableComponent](../widgets/table/table.component.ts) is the only [widget](../widgets) using the AgGrid libraryT. [SliceTable](./SliceTable.ts) implements the specific functions this library needs, and relies as much as possible on existing methods in [Slice&Dice](./Slice&Dice.ts).

- **Structures**<br>
  I defined many structures to specify variable types, function return types, function paramaters types, etc...

    - `GroupRow` : Built to behave like a PDV type for the AgGrid
    - `ColumnConfig` : Used by AgGrid to define a column
    - `TableData` : Structure passed to TableComponent to initiate its variables
    - `TableTypes` : All hard-coded variables are built for theses 2 possible table types (`p2cd` and `enduit`)
    - `TableProperties` :  Properties I chose to define a TableComponent (using AgGrid)

- **Strategy**<br>
*To understand how AgGrid tables work, and why we have to compute some of these values, see the [TableComponent's README.md](../widgets/README.md)*

  In the constructor, we define the specific `TableProperties` for all `TableTypes` in a private variable `tableConfig` : 
  > private tableConfig : {[type in TableTypes]: {[property in TableProperties]: any}}

  The function called during the [TableComponent](../widgets/table/table.component.ts) initialization is `getData(type: TableTypes): TableData`.
  To match the `TableData` type, it has to return an Object with 4 attributes : 
  
  - `columnDefs` : used by AgGrid to specify columns names, whether they are visible or not, their size, etc...
  - `navOpts` : all needed informations to allow the user to chose different rows grouping.
  - `pdvs` : the `rowData` for the AgGrid template. A list of `PDV` and `GroupRow` instances.
  - `colInfos` : the data structure used to allow custom row grouping.


  <br>The AgGrid library performs effective **row grouping**, but this require $750.00 license. We decided to develop custom row grouping.
  When chosing a grouping option (defined in `navOpts`), we first sort all PDV instances after the `tableConfig` field `customSort`, then after the field `customGroupSort`. During this operations, artificial values of type `GroupRow` are inserted. They'll allow the [TableComponent](../widgets/table/table.component.ts) to perform custom row grouping.