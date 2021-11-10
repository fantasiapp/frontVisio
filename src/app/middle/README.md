# Middle

### [DataExtractionHelper](./DataExtractionHelper.ts)

?

### [Slice&Dice](./Slice&Dice.ts)

?

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