angular.module('proton.labels')
    .directive('createLabel', ($rootScope, labelModal) => {

        const dispatch = (message, label = {}) => {
            $rootScope.$emit('messageActions', {
                action: 'label',
                data: {
                    messages: [message],
                    labels: [_.extend({}, label, { Selected: true })]
                }
            });
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/labels/createLabel.tpl.html',
            scope: {
                name: '=labelName',
                message: '='
            },
            link(scope, el) {

                const onClick = () => {
                    labelModal.activate({
                        params: {
                            label: {
                                Name: scope.name,
                                Exclusive: 0
                            },
                            close(label) {
                                labelModal.deactivate();
                                scope.message && label && dispatch(scope.message, label);
                            }
                        }
                    });
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            }
        };
    });
