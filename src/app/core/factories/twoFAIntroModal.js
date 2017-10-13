angular.module('proton.core')
    .factory('twoFAIntroModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/twofactor/twoFAIntroModal.tpl.html',
            /* @ngInject */
            controller: function (params) {
                const self = this;
                self.next = () => params.next();
                self.cancel = () => params.cancel();
            }
        });
    });
