angular.module('proton.filter')
    .directive('emailBlockList', ($rootScope, spamListModel, gettextCatalog) => {

        const I18N = {
            whitelist: gettextCatalog.getString('Whitelist', null, 'Info'),
            blacklist: gettextCatalog.getString('Blacklist', null, 'Info')
        };

        const SCROLL_THROTTLE = 100;
        // fetch when less than TRIGGER_BOUNDARY entries are below the bottom of the table view
        const TRIGGER_BOUNDARY = 50;
        const CLASSNAMES = {
            LIST: 'emailBlockList-list',
            BTN_SWITCH: 'emailBlockList-btn-switch',
            BTN_DELETE: 'emailBlockList-btn-delete'
        };

        const onEvent = (element, type, callback) => {
            element.addEventListener(type, callback);
            return () => element.removeEventListener(type, callback);
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/emailBlockList.tpl.html',
            scope: {
                listType: '@'
            },
            link(scope, elem, { switchTo }) {

                const unsubscribe = [];
                const list = spamListModel.list(spamListModel.getType(scope.listType));
                const tbody = elem[0].querySelector(`.${CLASSNAMES.LIST}`);

                scope.filterName = I18N[scope.listType];

                list.get()
                    .then((list) => {
                        scope.$applyAsync(() => scope.entries = list);
                    });


                unsubscribe.push($rootScope.$on('filters', () => {
                    list.get()
                        .then((list) => {
                            scope.$applyAsync(() => {
                                scope.entries = _.uniq(list, false, 'ID');
                                $('.tooltip').hide();
                            });
                        });
                }));


                const onScroll = _.throttle(() => {

                    if (list.isLoading() || list.isEnding()) {
                        return;
                    }

                    const elementCount = scope.entries.length;
                    const triggerFetch = elementCount - TRIGGER_BOUNDARY;
                    const scrollBottom = tbody.scrollTop + tbody.clientHeight;

                    // check if we have reached the last TRIGGER_BOUNDARY elements
                    if (scrollBottom / tbody.scrollHeight > triggerFetch / elementCount) {
                        list.get()
                            .then((list) => {
                                scope.$applyAsync(() => {
                                    scope.entries = _.uniq(scope.entries.concat(list), false, 'ID');
                                });
                            });
                    }

                }, SCROLL_THROTTLE);


                const onClick = ({ target }) => {

                    if (target.nodeName !== 'BUTTON') {
                        return;
                    }

                    if (target.classList.contains(CLASSNAMES.BTN_SWITCH)) {
                        spamListModel.move(target.dataset.entryId, spamListModel.getType(switchTo));
                    }

                    if (target.classList.contains(CLASSNAMES.BTN_DELETE)) {
                        spamListModel.destroy(target.dataset.entryId);
                    }
                };

                unsubscribe.push(onEvent(tbody, 'scroll', onScroll));
                unsubscribe.push(onEvent(elem[0], 'click', onClick));


                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                    spamListModel.clear();
                });

            }
        };

    });
