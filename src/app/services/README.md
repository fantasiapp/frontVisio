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
  
