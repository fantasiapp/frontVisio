# Widgets

## [BasicWidget](./BasicWidget.ts) > GridArea
Base class for all widgets in the application. It contains properties common to all widgets
such as scheduling animation, sliceDice service and a way to create tooltips on clicks.
Use this class by extending it and override functions for features you want to change.

### **Dependencies**
- *`protected injector: Injector`*<br/>
Used to dynamically inject dependencies. The services injected by default are:
  - *`protected ref: ElementRef`* A reference to the component element.
  - *`protected sliceDice: SliceDice`* Used to compute the data of the widget.
  - *`protected cd: ChangeDetectorRef`* Used to update the UI if needed.


### **Observables (or similar)**
- None

### **Important Methods**
- **`setTitle(title: any): void`**<br>
Sets the title of the Widget. By default this is `this.properties.title`.

- **`setSubtitle(subtitle: any): void`**<br>
Sets the subtitle of the Widget. By default this is `this.properties.description`.<br/>
It's often the case that the subtitle is dynamic like *@sum*. In this case it is updated when `updateData` is called.

- **<span style="color: #2980b9">abstract</span>** **`createGraph(data: any, opt?: Dict): void`**<br>
Abstract method to create the graph from initial `data`.
The second argument is merged with the blueprint for the graph in case we need to show similar graphs (like Pie and PieTarget).

- **`updateGraph(data: any): void`**<br>
Default method for updating graphs.
Compute the categories change and schedule a call to `chart.load`.<br/>
The schedular wait for the update to finish and then carries on to the next. The reason for this is that updates in Billboard.js data is asynchronous and not respecting the order can mix the data and create incorrect graphs.

- **`getDataArguments(): [...]`**<br>
Returns the list of argument to pass to `SliceDice.prototype.getWidgetData`.
These arguments depend on `this.properties.argument` but are sometimes more trickier.
Extend to redefine the list of arguments.

- **`updateData(data: any): [...]`**<br>
Passes the result from getDataArguments to `SliceDice.prototype.getWidgetData`.
Updates the description if needed and returns the new data.

- **<span style="color: #2980b9">final</span>** **`update(): void`**<br>
A oneliner for updating the widget.
It clears all the tooltips and performs a check on the data before actually calling `updateGraph`.<br/>
**Be careful to not override this method.**

- **`noData(content: ElementRef): void`**<br>
When the data check gives a negative result, this method is called.<br/>
`content` represent the body of the widget and is to be mutated in order to tell the user there's no data. 

- **`onDataClicked(items: DataItem[]): void`**<br>
This method is called when the user clicks on the data displayed the current widget.<br/>
A `DataItem` can be transform to a `TooltipItem` by calling `makeTooltip`.<br/>
A `TooltipItem`'s display is controlled by calls to `addTooltipAt`, `addMultipleTooltipsAt`, `removeTooltip`.<br/>
All these methods can be overrided to define how you want your widget to display its tooltips.<br/>

  *Note: Override `addTooltipAt` to change the tooltip component.

### **Hacks**
- **the `start(): void` method**<br>
I've noticed that creating the graphs in the constructor/ngOnInit will lead to rendering issues.
A solution to this problem was drawing in `requestAnimationFrame` or `setTimeout` with `0` as the timeout. This might be related to how CSS grids work or someone more general than that. <br/>
*Note Let me know if you know the right to get around this.

- **the `toggleTooltipOnClick(): void` setTimeout**<br>
The Billboard library doesn't provide the click PointerEvent when the user interacts with the graph. A solution to this is to have our own listener on window events that we can always check if something happens.
The problem with this approach is that events reach the window only in the end, so we'll be always lagging one step-behind. Another disappointing fact is that the library calls our callback once per element at the interaction boundary.
Luckily the solution to all this is one *`setTimeout`*. We are let processes continue and collect them later to generate the tooltiips.

<hr/>

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
