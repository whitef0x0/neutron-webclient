angular.module('proton.message')
    .directive('toggleMessage', ($rootScope, CONSTANTS) => {

        function selection() {
            if (window.getSelection) {
                return window.getSelection().toString().length === 0;
            }
            return true;
        }

        return {
            restrict: 'A',
            link(scope, element) {

                function mouseup(event) {

                    if (selection() && event.target.nodeName !== 'A' && !event.target.classList.contains('labelsElement-btn-remove')) {

                        scope.$applyAsync(() => {
                        // Open the message in composer if it's a draft
                            if (scope.message.Type === CONSTANTS.DRAFT) {
                                return $rootScope.$emit('composer.load', scope.message);
                            }

                            scope.message.expand = !scope.message.expand;
                            // Force close toggle details
                            scope.message.toggleDetails && (scope.message.toggleDetails = false);
                            $rootScope.$emit('message.open', {
                                type: 'toggle',
                                data: {
                                    message: scope.message,
                                    expand: scope.message.expand
                                }
                            });
                        });
                    }
                }

                element.on('mouseup', mouseup);
                element.on('touchend', mouseup);

                scope.$on('$destroy', () => {
                    element.off('mouseup', mouseup);
                    element.off('touchend', mouseup);
                });
            }
        };
    });
