(function () {
    'use strict';

    angular.module('es.ngUtcDatepicker', [])
        .directive('ngUtcDatepicker', ['$templateRequest', '$compile', '$timeout', function ($templateRequest, $compile, $timeout) {
            return {
                restrict: 'A',
                controller: 'ngUtcDatepickerController',
                controllerAs: 'vm',
                scope: {
                    date: '=ngModel',
                    format: '@'
                },
                link: function (scope, element, attrs, controller) {
                    element[0].style.marginLeft = '15px';
                    element[0].style.width = '90%';

                    // append template after element
                    $templateRequest('ngUtcDatepicker.html').then(function (tpl) {
                        $timeout(function () {
                            var template = angular.element(tpl);
                            element.after($compile(template)(scope));
                        });
                    });

                    element.on('focus', function (event) {
                        controller.openCalendar(event);
                    });

                    element.on('blur', function () {
                        controller.closeCalendar();
                    });

                    element.on('keydown', function (event) {
                        controller.keydown(event, this);
                    });
                },
                template: '<script type="text/ng-template" id="ngUtcDatepicker.html"><div class="date-picker">' +
                    '<div class="calendar-icon" ng-click="vm.openCalendar($event)" ng-blur="vm.closeCalendar()" ng-keydown="vm.keydown($event)">' +
                    '<i class="fa fa-calendar"></i>' +
                    '</div>' +
                    '<div class="calendar-popup" ng-class="vm.calendarPosition" ng-show="vm.showCalendar" ng-click="vm.setFocus()" ng-blur="vm.closeCalendar()" ng-keydown="vm.keydown($event)">' +
                    '<div class="calendar-controls">' +
                    '<div class="prev" ng-click="vm.prevMonth()" ng-blur="vm.closeCalendar()" ng-keydown="vm.keydown($event)"><i class="fa fa-arrow-left"></i></div>' +
                    '<div class="title">{{ vm.calendarTitle }} <span class="today" title="Today" ng-click="vm.selectToday($event)" ng-keydown="vm.keydown($event)"><i class="fa fa-calendar-o"></i></span></div>' +
                    '<div class="next" ng-click="vm.nextMonth()" ng-blur="vm.closeCalendar()" ng-keydown="vm.keydown($event)"><i class="fa fa-arrow-right"></i></div>' +
                    '</div>' +
                    '<div class="day-names">' +
                    '<div class="name" ng-repeat="name in vm.dayNames">{{ name }}</div>' +
                    '</div>' +
                    '<div class="calendar">' +
                    '<div class="day {{ day.selected }} {{ day.enabled }}" ng-repeat="day in vm.days" ng-click="vm.selectDate($event, day)">{{ day.day }}</div>' +
                    '</div>' +
                    '</div>' +
                    '</div></script>'
            };
        }])
        .controller('ngUtcDatepickerController', ['$scope', '$timeout', '$element', function ($scope, $timeout, $element) {
            var vm = this;

            var getMomentDate = function (date) {
                return typeof date === 'object' ? moment.utc(date.toISOString()) : moment.utc(date);
            };

            vm.format = $scope.format || 'YYYY-MM-DD';
            vm.showCalendar = false;
            vm.days = [];
            vm.dayNames = [];
            vm.calendarTitle = getMomentDate($scope.date).format('MMMM YYYY');
            vm.tempDate = getMomentDate($scope.date); // used for keeping track while cycling through months
            vm.calendarPosition = 'below';

            var ngModel = $element.controller('ngModel');
            ngModel.$formatters.unshift(function (modelValue) {
                return moment.utc(new Date(modelValue).toISOString()).format(vm.format);
            });

            var generateCalendar = function (date) {
                vm.days = [];

                var momentDate = moment.utc(date),
                    lastMonth = moment.utc(momentDate).subtract(1, 'M'),
                    month = moment.utc(momentDate).month() + 1,
                    year = moment.utc(momentDate).year(),
                    firstWeekDay = 1 - moment.utc(momentDate).startOf('M').isoWeekday();

                for (var i = firstWeekDay; i <= moment.utc(momentDate).endOf('M').date(); i++) {
                    if (i > 0) {
                        vm.days.push({ day: i, month: month, year: year, enabled: 'enabled', selected: moment.utc($scope.date).isSame(moment.utc(year + '-' + month + '-' + i, 'YYYY-M-D'), 'day') ? 'selected' : 'unselected' });
                    } else {
                        vm.days.push({ day: lastMonth.endOf('M').date() - (0 - i), month: lastMonth.month() + 1, year: lastMonth.year(), enabled: 'disabled', selected: 'unselected' });
                    }
                }
            };

            var generateDayNames = function () {
                var date = moment('2017-04-02'); // sunday
                for (var i = 0; i < 7; i++) {
                    vm.dayNames.push(date.format('ddd'));
                    date.add('1', 'd');
                }
            };

            var initialize = function () {
                if (vm.dayNames.length === 0) {
                    generateDayNames();
                }
            };

            initialize();

            vm.setFocus = function () {
                // allow angular to focus so it can stay open when a user clicks any interior element
                return true;
            };

            vm.openCalendar = function (event) {
                console.log('open calendar');
                var rect = event.target.getBoundingClientRect();
                vm.calendarPosition = window.innerHeight - rect.bottom < 250 ? 'above' : 'below';
                vm.showCalendar = true;
                generateCalendar(getMomentDate($scope.date));
            };

            vm.closeCalendar = function (forceClose) {
                console.log('close calendar');
                forceClose = forceClose || false;
                if (!forceClose) {
                    $timeout(function () {
                        vm.showCalendar = !!(document.activeElement.className.includes('day') ||
                        document.activeElement.className.includes('prev') ||
                        document.activeElement.className.includes('next') ||
                        document.activeElement.className.includes('calendar-popup'));
                    });
                } else {
                    vm.showCalendar = false;
                }
                if (typeof $scope.date === 'string') {
                    $scope.date = moment.utc($scope.date, 'YYYY-M-D').toDate();
                }
            };

            vm.prevMonth = function () {
                vm.tempDate.subtract(1, 'M');
                vm.calendarTitle = vm.tempDate.format('MMMM YYYY');
                generateCalendar(vm.tempDate);
            };

            vm.nextMonth = function () {
                vm.tempDate.add(1, 'M');
                vm.calendarTitle = vm.tempDate.format('MMMM YYYY');
                generateCalendar(vm.tempDate.toISOString());
            };

            vm.selectDate = function (event, date) {
                event.preventDefault();
                var currDate = moment.utc($scope.date);
                var selectedDate = moment.utc(date.year + '-' + date.month + '-' + date.day + ' ' + currDate.hour() + ':' + currDate.minute() + ':' + currDate.second(), 'YYYY-M-D HH:mm:ss');
                $scope.date = selectedDate.toDate();
                vm.tempDate = getMomentDate($scope.date);
                vm.calendarTitle = vm.tempDate.format('MMMM YYYY');
                vm.closeCalendar(true);
            };

            vm.selectToday = function (event) {
                var today = moment.utc();
                var date = { day: today.date(), month: today.month() + 1, year: today.year(), enabled: 'enabled', selected: 'selected' };
                vm.selectDate(event, date);
            };

            vm.keydown = function ($event, element) {
                if ($event.keyCode === 27) { // escape key
                    if (element) {
                        element.blur();
                    } else {
                        vm.closeCalendar(true);
                    }
                }
            };

            $scope.$watch('date', function (newValue, oldValue) {
                if (angular.equals(newValue, oldValue)) {
                    return;
                }
                var isValid = moment.utc(newValue, vm.format).format(vm.format) === newValue;
                if (isValid) {
                    var newDate = moment.utc(newValue, vm.format);
                    vm.calendarTitle = newDate.format('MMMM YYYY');
                    generateCalendar(newDate);
                }
            });
        }]);
})();
