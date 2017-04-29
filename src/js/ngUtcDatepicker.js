(function (angular) {
    'use strict';

    angular.module('es.ngUtcDatepicker', [])
        .directive('ngUtcDatepicker', ['$templateRequest', '$compile', '$timeout', function ($templateRequest, $compile, $timeout) {
            return {
                restrict: 'A',
                controller: 'ngUtcDatepickerController',
                controllerAs: 'ctrl',
                scope: {
                    date: '=ngModel',
                    format: '@',
                    trigger: '@'
                },
                link: function (scope, element, attrs, controller) {
                    // append template after element
                    $templateRequest('ngUtcDatepicker.html').then(function (tpl) {
                        $timeout(function () {
                            var template = angular.element(tpl);
                            element.after($compile(template)(scope));
                        });
                    });

                    element.on('focus', function (event) {
                        $timeout(function () {
                            controller.openCalendar(event);
                        });
                    });

                    element.on('blur', function () {
                        $timeout(function () {
                            controller.closeCalendar();
                        });
                    });

                    element.on('keydown', function (event) {
                        var el = this;
                        $timeout(function () {
                            controller.keydown(event, el);
                        });
                    });
                },
                template: '<script type="text/ng-template" id="ngUtcDatepicker.html"><div class="date-picker">' +
                '<div class="calendar-popup" ng-class="ctrl.calendarPosition" ng-show="ctrl.showCalendar" ng-blur="ctrl.closeCalendar()" ng-keydown="ctrl.keydown($event)" tabindex="-1">' +
                '<div class="calendar-controls">' +
                '<div class="prev" ng-click="ctrl.prevMonth()" ng-blur="ctrl.closeCalendar()" ng-keydown="ctrl.keydown($event)"><i class="fa fa-arrow-left"></i></div>' +
                '<div class="title">{{ ctrl.calendarTitle }} <span class="today" title="Today" ng-click="ctrl.selectToday($event)" ng-keydown="ctrl.keydown($event)"><i class="fa fa-calendar-o"></i></span></div>' +
                '<div class="next" ng-click="ctrl.nextMonth()" ng-blur="ctrl.closeCalendar()" ng-keydown="ctrl.keydown($event)"><i class="fa fa-arrow-right"></i></div>' +
                '</div>' +
                '<div class="day-names">' +
                '<div class="name" ng-repeat="name in ctrl.dayNames">{{ name }}</div>' +
                '</div>' +
                '<div class="calendar">' +
                '<div class="day {{ day.selected }} {{ day.enabled }}" ng-repeat="day in ctrl.days" ng-click="ctrl.selectDate(day)">{{ day.day }}</div>' +
                '</div>' +
                '</div>' +
                '</div></script>'
            };
        }])
        .controller('ngUtcDatepickerController', ['$scope', '$timeout', '$element', function ($scope, $timeout, $element) {
            var ctrl = this;

            var getMomentDate = function (date) {
                return typeof date === 'object' ? moment.utc(date.toISOString()) : moment.utc(date);
            };

            ctrl.format = $scope.format || 'YYYY-MM-DD';
            ctrl.showCalendar = false;
            ctrl.days = [];
            ctrl.dayNames = [];
            ctrl.calendarTitle = getMomentDate($scope.date).format('MMMM YYYY');
            ctrl.tempDate = getMomentDate($scope.date); // used for keeping track while cycling through months
            ctrl.calendarPosition = 'below';

            var ngModel = $element.controller('ngModel');
            ngModel.$formatters.unshift(function (modelValue) {
                return moment.utc(new Date(modelValue).toISOString()).format(ctrl.format);
            });

            var generateCalendar = function (date) {
                ctrl.days = [];

                var momentDate = typeof date === 'string' ? moment.utc(date, ctrl.format) : moment.utc(date),
                    lastMonth = moment.utc(momentDate).subtract(1, 'M'),
                    month = moment.utc(momentDate).month() + 1,
                    year = moment.utc(momentDate).year(),
                    firstWeekDay = 1 - moment.utc(momentDate).startOf('M').isoWeekday();

                for (var i = firstWeekDay; i <= moment.utc(momentDate).endOf('M').date(); i++) {
                    if (i > 0) {
                        ctrl.days.push({ day: i, month: month, year: year, enabled: 'enabled', selected: moment.utc($scope.date, ctrl.format).isSame(moment.utc(year + '-' + month + '-' + i, 'YYYY-M-D'), 'day') ? 'selected' : 'unselected' });
                    } else {
                        ctrl.days.push({ day: lastMonth.endOf('M').date() - (0 - i), month: lastMonth.month() + 1, year: lastMonth.year(), enabled: 'disabled', selected: 'unselected' });
                    }
                }
            };

            var generateDayNames = function () {
                var date = moment('2017-04-02'); // sunday
                for (var i = 0; i < 7; i++) {
                    ctrl.dayNames.push(date.format('ddd'));
                    date.add('1', 'd');
                }
            };

            var initialize = function () {
                if (ctrl.dayNames.length === 0) {
                    generateDayNames();
                }
                if ($scope.trigger) {
                    var triggerEl = document.getElementById($scope.trigger);
                    if (triggerEl.getAttribute('tabindex') === null) {
                        triggerEl.setAttribute('tabindex', '0');
                    }
                    triggerEl.onclick = function (event) {
                        $timeout(function () {
                            ctrl.openCalendar(event);
                        });
                    };
                    triggerEl.onblur = function () {
                        $timeout(function () {
                            ctrl.closeCalendar();
                        });
                    };
                    triggerEl.onkeydown = function (event) {
                        $timeout(function () {
                            ctrl.keydown(event);
                        });
                    };
                }
            };

            initialize();

            ctrl.openCalendar = function (event) {
                var rect = event.target.getBoundingClientRect();
                ctrl.calendarPosition = window.innerHeight - rect.bottom < 250 ? 'above' : 'below';
                ctrl.showCalendar = true;
                generateCalendar(getMomentDate($scope.date));
            };

            ctrl.closeCalendar = function () {
                $timeout(function () {
                    ctrl.showCalendar = document.activeElement.className.includes('calendar-popup');
                    if (typeof $scope.date === 'string') {
                        $scope.date = moment.utc($scope.date, ctrl.format).toDate();
                    }
                });
            };

            ctrl.prevMonth = function () {
                ctrl.tempDate.subtract(1, 'M');
                ctrl.calendarTitle = ctrl.tempDate.format('MMMM YYYY');
                generateCalendar(ctrl.tempDate);
            };

            ctrl.nextMonth = function () {
                ctrl.tempDate.add(1, 'M');
                ctrl.calendarTitle = ctrl.tempDate.format('MMMM YYYY');
                generateCalendar(ctrl.tempDate.toISOString());
            };

            ctrl.selectDate = function (date) {
                var currDate = moment.utc($scope.date);
                var selectedDate = moment.utc(date.year + '-' + date.month + '-' + date.day + ' ' + currDate.hour() + ':' + currDate.minute() + ':' + currDate.second(), 'YYYY-M-D HH:mm:ss');
                $scope.date = selectedDate.toDate();
                ctrl.tempDate = getMomentDate($scope.date);
                ctrl.calendarTitle = ctrl.tempDate.format('MMMM YYYY');
                generateCalendar(ctrl.tempDate);
                ctrl.showCalendar = false;
            };

            ctrl.selectToday = function (event) {
                var today = moment.utc();
                var date = { day: today.date(), month: today.month() + 1, year: today.year(), enabled: 'enabled', selected: 'selected' };
                ctrl.selectDate(event, date);
            };

            ctrl.keydown = function ($event, element) {
                if ($event.keyCode === 27) { // escape key
                    if (element) {
                        element.blur();
                    } else {
                        ctrl.showCalendar = false;
                    }
                }
            };

            $scope.$watch('date', function (newValue, oldValue) {
                if (angular.equals(newValue, oldValue)) {
                    return;
                }
                var isValid = moment.utc(newValue, ctrl.format).format(ctrl.format) === newValue;
                if (isValid) {
                    var newDate = moment.utc(newValue, ctrl.format);
                    ctrl.calendarTitle = newDate.format('MMMM YYYY');
                    generateCalendar(newDate);
                }
            });
        }]);
})(window.angular);
