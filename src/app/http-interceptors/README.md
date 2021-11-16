Most important source : <https://angular.io/guide/http#handling-request-errors>

Each in- and outgoing request is passed trough this chain of interceptors :

**Client <-> ErrorInterceptor <-> AuthInterceptor <-> CachingInterceptor <-> Server** <br>
*(this order is defined in [index.ts](./index.ts))*

- ErrorInterceptor

Handles http-errors, and define specific behaviours.<br>
Only actual bahaviour: disconnects user on 401 error status.

- AuthInterceptor

Sets default headers on outgoing requests with the authentification token. <br>
Uses the token stored in [AuthService's](../connection/auth.service.ts) variable `token`.

- CachingInterceptor

When the [DataService](../services/data.service.ts) method `requestData()` is called from the [Login page](../login-page/login-page.component.ts), if the [LocalStorageService](../services/local-storage.service.ts) stored stayConnected to `true`, there must be locally stored data. <br>
This data is then directly returned to the client.