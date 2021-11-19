## [GridArea](./grid-area.ts) > SubscriptionManager

GridArea is the building block of a widget. It contains the information needed for layout.
A contrario of most angular component, GridArea is actually initialized after the it's children have been initialized by angular. This is useful because GridArea is an abstract class and will be extended to components whose templates aren't known ahead of time or depend on external libraries.


### **Dependencies**
- None

### **Observables (or similar)**
- **`ready`**<br>
An asynchronous subject whose job is to tell us when `ngAfterViewInit` is called.
When `ready` is complete, `GridArea.prototype.onReady` is called.

### **Important Methods**
- **`onReady`**<br>
Called when the area has been initialized.

<hr>

## [GridManager](./grid-manager/grid-manager.component.ts) > SubscriptionManager
GridManager is responsible for maintaining the layout and spawning widgets dynamically in their designed spot.

### **Dependencies**
- *`private componentFactoryResolver: ComponentFactoryResolver`*
    - Used for dynamically creating angular component
- *`private widgetManager: WidgetManagerService`*
    - Used for finding component by their names
- *`private cd: ChangeDetectorRef`*

### **Observables (or similar)**
- **`state`**<br>
This subject wraps a `GridState` object which represents the state of the application.

### **Important Methods**
- **`pause(): void`**<br>
Disable updates on the widgets. (Used when we switch to a map view)
- **`interactiveMode(): void`**<br>
Update all widgets and subscribe to subsequent updates to the path.
- **`update(): void`**<br>
Forced update.
- **`clear(): void`**<br>
Delete all widgets