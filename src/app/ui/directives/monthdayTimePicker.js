angular.module('proton.ui')
    .directive('monthdayTimePicker', ($rootScope, timepickerModel, datetimeErrorCombiner) => {

        const dispatch = (type, data) => $rootScope.$emit('timepicker', { type, data });

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/ui/monthdayTimePicker.tpl.html',
            scope: {
                form: '='
            },
            compile(elem) {
                // Generate a unique eventkey for the timepicker. The directive is opaque: the user should not know about the sub timepicker.
                const timePickerKey = Math.floor(1e16 * Math.random()).toString(36);
                elem[0].querySelector('.timepicker').setAttribute('data-event-key', timePickerKey);
                return (scope, elem, { datePickerKey, timestamp, disableInput, labelId }) => {

                    // definitions
                    const unsubscribe = [];
                    const daySelector = elem.find('.day-selector');


                    timepickerModel.initTimePicker(timePickerKey, { disableInput, labelId: labelId + '_time' });

                    scope.datePickerKey = datePickerKey;
                    scope.timestamp = String(Number(timestamp)) === timestamp ? Number(timestamp) : null;
                    scope.disableInput = disableInput === 'true';
                    scope.labelId = labelId;

                    scope.combineErrors = datetimeErrorCombiner.create(timePickerKey, scope);

                    // functions
                    function calcInternalVariables() {
                        if (scope.timestamp === null) {
                            scope.model.time = null;
                            scope.model.day = null;
                            return;
                        }
                        // seconds since start of month -> days since start of month, each day has 24 * 60 * 60 seconds.
                        scope.model.day = _.findWhere(scope.availableDays, { value: Math.floor(scope.timestamp / (24 * 3600)) % 31 });
                        scope.model.time = scope.timestamp % (24 * 3600);
                    }

                    function onDayChange() {
                        scope.$applyAsync(calcTimestamp);
                    }

                    function calcTimestamp() {
                        if (scope.model.time === null || scope.model.day === null) {
                            scope.timestamp = null;
                            dispatch('update', { eventKey: scope.datePickerKey, timestamp: scope.timestamp });
                            return;
                        }
                        scope.timestamp = scope.model.day.value * 24 * 3600 + scope.model.time;
                        dispatch('update', { eventKey: scope.datePickerKey, timestamp: scope.timestamp });
                    }

                    // initialization
                    scope.availableDays = timepickerModel.daysInMonth;
                    // Generate a unique eventkey for the timepicker. The directive is opaque: the user should not know about the sub timepicker.
                    scope.timePickerKey = scope.datePickerKey + Math.floor(1e16 * Math.random()).toString(36);
                    scope.model = { time: null, day: null };
                    daySelector.attr('id', scope.labelId);

                    calcInternalVariables();

                    // events
                    daySelector.on('change', onDayChange);
                    unsubscribe.push(() => daySelector.off('change', onDayChange));

                    unsubscribe.push($rootScope.$on('timepicker', (event, { type, data }) => {
                        if (type === 'refresh' && data.eventKey === scope.datePickerKey) {
                            scope.timestamp = data.timestamp;
                            calcInternalVariables();
                        }


                        if (type === 'update' && data.eventKey === timePickerKey) {
                            calcTimestamp();
                        }
                    }));

                    scope.$on('$destroy', () => {
                        _.each(unsubscribe, (cb) => cb());
                        unsubscribe.length = 0;
                    });

                };
            }
        };
    });
