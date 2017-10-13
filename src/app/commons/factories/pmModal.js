angular.module('proton.commons')
    .factory('pmModal', ($animate, $compile, $rootScope, $controller, $q, $http, AppModel, $templateCache) => {
        const $body = $('#body');
        return function modalFactory(config) {
            if (!(!config.template ^ !config.templateUrl)) {
                throw new Error('Expected modal to have exactly one of either template or templateUrl');
            }

            const controller = config.controller || null;
            const controllerAs = config.controllerAs;
            const container = angular.element(config.container || document.body);
            let element = null;
            let html;
            let scope;
            let unsubscribeLogoutListener = angular.noop;

            if (config.template) {
                html = $q.when(config.template);
            } else {
                html = $http.get(config.templateUrl, {
                    cache: $templateCache
                }).then(({ data }) => data);
            }

            function activate(locals) {
                return html.then((html) => {
                    if (!element) {
                        attach(html, locals);
                    }

                    $body.append('<div class="modal-backdrop fade in"></div>');
                    AppModel.set('modalOpen', true);
                    const id = setTimeout(() => {
                        $('.modal').addClass('in');
                        window.scrollTo(0, 0);
                        Mousetrap.bind('escape', () => deactivate());
                        clearTimeout(id);
                    }, 100);

                    unsubscribeLogoutListener = $rootScope.$on('logout', () => {
                        deactivate();
                    });
                });
            }

            function attach(html, locals) {
                element = angular.element(html);
                if (element.length === 0) {
                    throw new Error('The template contains no elements; you need to wrap text nodes');
                }
                scope = $rootScope.$new(true);
                if (controller) {
                    if (!locals) {
                    /* eslint  { "no-param-reassign": "off"} */
                        locals = {};
                    }
                    locals.$scope = scope;
                    const ctrl = $controller(controller, locals);
                    if (controllerAs) {
                        scope[controllerAs] = ctrl;
                    }
                } else if (locals) {
                /* eslint  { "guard-for-in": "off", "no-restricted-syntax": "off"} */
                    for (const prop in locals) {
                        scope[prop] = locals[prop];
                    }
                }
                $compile(element)(scope);
                return $animate.enter(element, container);
            }

            function deactivate() {
                if (!element) {
                    return $q.when();
                }

                unsubscribeLogoutListener();

                return $animate.leave(element).then(() => {
                    Mousetrap.unbind('escape');
                    scope.$destroy();
                    /**
                 * Fuck you Enkular
                 * > Called on a controller when its containing scope is destroyed.
                 * https://docs.angularjs.org/api/ng/service/$compile#life-cycle-hooks
                 * Et mon cul c'est du poulet alors ? (╯ὸ︹ό）╯︵ ┻━┻
                 *
                 * So we need to do it for you...
                 * cf https://github.com/angular/angular.js/issues/14376#issuecomment-205926098
                 */
                    (scope[controllerAs].$onDestroy || angular.noop)();
                    scope = null;
                    element.remove();
                    element = null;
                    AppModel.set('modalOpen', false);
                    $('.modal-backdrop').remove();
                });
            }

            function active() {
                return !!element;
            }

            return {
                activate,
                deactivate,
                active
            };
        };
    });
