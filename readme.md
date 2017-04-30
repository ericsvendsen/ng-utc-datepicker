# Angular UTC Datepicker
A simple Angular 1.x datepicker directive that exclusively uses UTC.
## Install
* npm: `npm install --save ng-utc-datepicker`
* bower: `bower install --save ng-utc-datepicker`
## Dependencies
* Angular 1.x
* MomentJS
* Font Awesome
## How to use
* Inject `'es.ngUtcDatepicker'` into your app
* Add `ng-utc-datepicker` to an `input` tag
* `format` option, for formatting date (and time, if necessary); defaults to `'YYYY-MM-DD'`. Uses [Moment](http://momentjs.com/docs/#/displaying/format/) formatting.
* `trigger` option, for triggering the calendar with an external element such as a button or icon. Must be an element ID.
## Examples
```
<input ng-utc-datepicker ng-model="vm.date"/>
```
```
<span id="icon" class="fa fa-calendar"></span>
<input ng-utc-datepicker data-trigger="icon" ng-model="vm.date"/>
```
```
<input ng-utc-datepicker data-format="MM/DD/YYYY HH:mm:ss" ng-model="vm.date"/>
```
