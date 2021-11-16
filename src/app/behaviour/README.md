## Directives

> Directives are classes that add additional behavior to elements in your Angular applications. Use Angular's built-in directives to manage forms, lists, styles, and what users see.

All custom directives defined here inherits from [DisableDirective](./disable-directive.directive.ts) <br>
With `constructor(protected el: ElementRef) {}`, Angular uses *dependency injection* to inject a referec to the host DOM element. <br>
It is then able to set the html attribute `disabled` to **TRUE only** if the method `computeDisabled()` returns `true`. To allow the multiple directives to work as a logical union, each of them can only disable an element. 

- [AdOpenOnly](./ad-open-only.directive.ts)

Checks in DEH class [Params](../middle/DataExtractionHelper.ts) if the data returned by the back states `true` or `false` in `data['params']['isAdOpen']`


- [AgentOnly](./agent-only.directive.ts)

Checks in DEH class [Params](../middle/DataExtractionHelper.ts) if the `rootNature` getter is `'agent'` (hardcoded)


- [AgentFinitionsOnly](./agent-finitions-only.directive.ts)

Checks in DEH class [Params](../middle/DataExtractionHelper.ts) if the `rootNature` getter is `'agentFinitions'` (hardcoded)


- [CurrentYearOnly](./current-year-only.directive.ts)

Checks the [DataExtractionHelper](../middle/DataExtractionHelper.ts) static boolean property `currentYear`

- [RootLevelOnly]()

?