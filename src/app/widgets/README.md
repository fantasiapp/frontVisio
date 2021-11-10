# Widgets

### [TableComponent](./table/table.component.ts)<br>
This widget is the only one provided with [SliceTable](../middle/SliceTable.ts), because its the only one using the AgGrid library template : 

- **Data binding**

        <ag-grid-angular>
            [gridOptions]="gridOptions"
            [columnDefs]="columnDefs"
            [rowData]="rowData"
            ...
        </ag-grid-angular>

    - `gridOptions` defines the static options, and provides the grid API. They are defined in the [TableComponent](./table/table.component.ts) constructor.
    - `columnDefs` is a list of objects defining the properties of the columns of the table. *(see complete list [here](https://www.ag-grid.com/angular-data-grid/column-properties/))*. We use the following properties : 
      - `field` : specify which property of the `rowData` values this column displays
      - `flex`: like the css flex display, specify how the free space is used by the column
      - `hide`: trivial
      - `colSpan`: a function to allow `GroupRow` rows to display some values upon several columns
      - `cellStyle`: a function that allows us to specify the CSS style of the cell
    - `rowData` : the list of `PDV` and `GroupRow` instances. They are the rows of the AgGrid table template. The library search in each row for the properties defined in the `ColumnDefs.field` attributes.


- **Refresh Strategy**

    AgGrid implements its own change detection strategy. For every [widget](./), when performing, or receiving data updates, the function `refresh()` is called. In this component, we only need to rerender the title with `computeTitle()`, and call the API function `redrawRows()`.

    When browsing the navigation, the [Slice&Dice](../middle/Slice&Dice.ts) attribute `currentSlice` changes, and so must the `rowData` do. This alls the function `update()`, that update the value of the `rowData` attribute with the [SliceTable](../middle/SliceTable.ts) function `getPdvs(type: TableTypes)` and rerender the title.

- **Cell rendering**
  
  The private method `setupCellRenderers(columnDefs: any[]): any[]` setups if necessary the `ColunDefs` properties `valueFormatter`, or `cellRendererSelector`.
  - `valueFormatter` : function used to round and format values, add unities, etc... 
  - `cellRendererSelector` : function used to specify a custom cellRenderer. They are defined in [renderer.ts](./table/renderers.ts). Used for columns displaying an image, or a diagramm.
