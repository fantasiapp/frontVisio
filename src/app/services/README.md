# Services

> Instead of creating that service with the 'new' keyword, we'll rely on Angular dependency injection to inject it into a component constructor.

### [DataService](./data.service.ts)

The service is responsible the communication with the server through requests. Some of the request behiavour is defined with the [HttpInterceptors](src/app/http-interceptors)

*For more detailed informations  on the communication protocol and logic, see the diagram in the file*

- **Observables (or similar)**

    - **`response`**<br>
    Subscribed to once in [FiltersStatesService](./filters-states.service.ts) in its `constructor()`, and allows asynchronous local data initialization<br>
    Its `next()` function is called on its only subscriber when the whole data is received after a `requestData()`

    - **`update`**<br>
    Subscribed to in [FiltersStatesService](./filters-states.service.ts) to update the navigation tree, in [ViewComponent](../view/view.component.ts) to update the current slice and in [MapComponent](../map/map.component.ts) to update the view if needed.<br>
    Its `next()` function is called in [FiltersStatesService](./filters-states.service.ts) when changing the current year with `setYear()`, and in [DataService](./data.service.ts) when sending or receiving an update, or receiving the whole data json.

    - **`load`**
    Subscribed to in [LoginPageComponent](../login-page/login-page.component.ts), to notify the component that may be loading that the data has been received.<br>
    Its `next()` function is called in [DataService](./data.service.ts) when receiving the whole data json.




- **Update threads**

    The functions `beginUpdateThread()` and `endUpdateThread()` are used to send periodically updated data or logs to the back (e.g sending logs every 60 seconds, and sending locally made updates every 10 seconds).
    The threads are cancelled automatically every 300 seconds without calling `beginUpdateThread()`<br>

    - `beginUpdateThread()` is called in `log()` function in [LoggerService](./logger.service.ts), allegedly each time an action is performed by the user<br>
    - `endUpdateThread()` is called 300 seconds after the last call to `beginUpdateThread()`, or when closing the app (when disconnecting or closing the tab) by `ngOnDestroy()` in [ViewComponent](../view/view.component.ts)

- **Update functions**

    These functions must be called by any other part of the app that is willing to update data locally and remotely.

    - `updatePdv(pdv: any[], id: number)` to modify a pdv *(update sent synchronously)*
    - `updateTargetLevel(targetLevel: number[], targetLevelName: UpdateFields, id: number)` to modify a targetLevel (`'targetLevelAgentP2CD'`, `'targetLevelAgentFinitions'` or `'targetLevelDrv'`) *(update sent synchronously)*
    - `queueSnapshot(snapshot: Snapshot)` to send a log *(logs sent asynchronously)*
  
### [LocalStorageService](./local-storage.service.ts)

The service manages the data stored directly in the navigator. As long as it's not requested, it is never deleted, to allow data persistence offline.

| Key | Expected value type | Description |
| :- | :- | :- |
| data | Object | Stores the last full data object received from the server. Removed at disconnection, or when the tab is closed if stayConnected is false.  |
| stayConnected | boolean | Checked to handle the disconnection behaviour |
| lastUpdateTimestamp | number | Used in update requests for the server. Updated on data or update requests responses. |
| token | string | Stores the token of the active session |
| lastToken | string | Stores the token of the last active session : if the user worked offline, and disconnected offline, used to send the queued updates at the next connection (online). Supposedly never left null |
| queuedDataToUpdate | UpdateDataWithLogs | Stores the queued updates between POST update requests. |
| alreadyConnected | string | Specifies if the app use already opened with the same navigator |

This service also provied the public function `handleDisconnect(forceClear: boolean = false)`. It cleans the local storage according to the different app closing scenarii :<br>
`-` **normal behaviour** : called by [ViewComponent](../view/view.component.ts) in `ngOnDestroy()`, it checks if the token stored in the session storage and in the local storage are the same, then if the user chose to stay connected. If not, it clears `lastUpdateTimestamp`, `data`, `token`, and `stayConnected` <br>
`-` **anormal behaviour** : called by [LoginPageComponent](../login-page/login-page.component.ts) in `enableForceLogin()`, it should delete everything except `lastToken` and `queuedDataToUpdate`

<hr/>

### [LoggerService](./logger.service.ts)

The service regularily sends data about user activity to the server.
The data sent includes:

| Field | Description |
| :- | :- |
| view | The navigation tree currently used: *GeoTree* (`false`) or *TradeTree* (`true`)
| dashboard | The current dashboard (`Dashboard.id`)
| year | Year of the data: *last* (`false`) or *current* (`true`)
| pdv | The selected PDV (i.e. shown on an infobar), if any (`PDV.id`)
| mapVisible | (`false`) if the map is hidden, (`true`) otherwise.
| mapFilters | The applied filters on the map, if any. (`[criterion, id[]][]`)
| widgetParams | The id of the widget the user is interacting with, if any (`Widget.id`). (only available for histoColumnTarget)
| stayConnected | (`false`) if the user didnt check **Rester connecté**, otherwise (`true`)
| path | The path in the tree where the user action happened, this is autocomputed when a change is found.

The service relies mostly on two functions:
- `handleEvent(event: number, data: any = undefined)`<br>
    Where event corresponds to one of the fields mentionned above and data is the new data to be inserted.<br>
    this methods also checks changes in the field and sets the new value.

- `actionComplete()`<br>
    When this method is called, the service checks changes in its fields.<br/>
    If found, queues a snapshot on [DataService](./data.service.ts) to be sent to the server.

<hr/>

## [FiltersStatesService](./filters-states.service.ts)

This service allows the user/programmer to navigate the application. It is used by components that depend on navigation to render and components that effectively can change the navigation state.

### **Dependencies**
- **`public navigation: Navigation`** (Contains the actual navigation functionality)
- **`private dataservice: DataService`**
- **`private sliceDice: SliceDice`**
- **`private logger: LoggerService`**

### **Observables (or similar)**
- **`state: Subject<{node: Node, dashboard: Dashboard}>`**<br/>
This subject is reflects the most recent `Node` and `Dashboard`.
`private _state?` holds the most recent value of this subject.

- **`filters: Subject<{...}>`**<br/>
The subject contains information computed from state and to be supplied to FiltersComponents.<br/>
The informations include the current navigation node, its children and parent, the path etc...

- **`logPathChanged: Subject<{}>`**
Used along with `LoggerService` for logging the path every now and then.

### **Important Methods**
- **`emitState(): void`** (Output -> `state`) <br/>
Retrieves the most recent state and emits it through the `state` subject.

- **`emitFilters(): void`** (Output -> `filters`) <br/>
Computes filters from the most recent `state` and emits through the `filters` subject.

- **`emitEvents(): void`** (Output -> `state`, `filters`) <br/>
Call `emitState()` followed by `emitFilters()`.

- **`setYear(current: boolean): number`** (Output -> `state`, `filters`) <br/>
Sets the data year, (`true`) for the current year and (`false`) otherwise.

- **`setTree(tree: Tree, follow: boolean = true): void`** (Output -> `state`, `filters`) <br/>
Replaces the current navigation tree.
If `follow`, then we'll try to navigate to the same level we were before tree changes.

- **`update()`** (Output -> `state`, `filters`) <br/>
Updates the logs and emits `state` and `filters` events, causing all subscriber components (view, bars, etc) to update.

<hr/>

## [SearchService](./search.service.ts)

This service allows the user/programmer to search the data by categories and by their names.

The service supports two modes: <br/>
    - Search a category in the category list <br/>
    - Search an item inside a category<br/>

This component is injected at the `SearchbarComponent` component level.

### **Dependencies**
- **`private dataservice: DataService`** (Subscribe for new data)

### **Observables (or similar)**
- None

### **Important Methods**
- **`search(term: string, ...rest: any[] = [showAll = true, sort = true]): Suggestion[]`** <br/>
Searches term in the current category if it exists, otherwise searches the category list for term.

- **`findAll(): Suggestion[]`** <br/>
return all results in the current category if it exists, otherwise return all categories.

- **`switchMode(mode: number, pattern: string = ''): Suggestion[]`** <br/>
If pattern is a known category, then switch to search inside this category.
If mode is PATTERN_SEARCH then the service is reset to searching inside the category list.

<hr/>

## [WidgetManagerService](./widget-manager.service.ts)
A nice service to retrieve some Angular components by their names. 
This component is injected at the `GridManager` component level.

### **Dependencies**
- None

### **Observables (or similar)**
- None

### **Important Methods**
- **`findComponent(name: string): any`** <br/>
Finds a component by it's given name. If none exists, we return an empty component with title and description to replace it.