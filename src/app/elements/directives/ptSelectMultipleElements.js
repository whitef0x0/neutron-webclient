angular.module('proton.elements')
    .directive('ptSelectMultipleElements', ($rootScope) => {

        const CACHE = {};
        const countChecked = (conversations) => _.where(conversations, { Selected: true }).length;

        /**
        * Select many conversations and update the scope
        * @param  {$scope} scope
        * @return {function}       (previous, from, to)
        */
        function selectConversations(scope) {

            /**
            * Update the scope with selected conversations
            * @param  {Object} previous Previous conversation selected
            * @param  {Number} from     Index conversation
            * @param  {Number} to       Index conversation
            * @return {void}
            */
            return (previous, from, to) => {
                _.each(scope.conversations, (conversation, i) => {
                    if (i >= from && i <= to) {
                        conversation.Selected = previous.conversation.Selected;
                    } else {
                        return false; // Break
                    }
                });

                $rootScope.numberElementChecked = countChecked(scope.conversations);
            };
        }

        return {
            link(scope, el) {
                let previous = null;
                const conversationsToSelect = selectConversations(scope);

                // cache the previous selected items
                const unsubscribe = $rootScope.$on('dnd', (e, { type, data }) => {
                    if (type === 'hook.dragstart') {
                        CACHE.number = data.before.number;
                        CACHE.ids = data.before.ids;

                        $rootScope.numberElementChecked = 1;
                        _.each(scope.conversations, (item) => {
                            item.Selected = false;
                        });
                    }
                });

                function onClick({ target, shiftKey }) {
                    const index = +target.getAttribute('data-index');

                    if (target.nodeName !== 'INPUT' || !/ptSelectConversation/.test(target.className)) {
                        return;
                    }

                    const isChecked = target.checked;

                    scope.$applyAsync(() => {
                        scope.conversations[index].Selected = isChecked;
                        $rootScope.numberElementChecked = countChecked(scope.conversations);

                        if (shiftKey && previous) {
                            const from = Math.min(index, previous.index);
                            const to = Math.max(index, previous.index);
                            conversationsToSelect(previous, from, to);

                            // Unselect the latest click if we unselect a list of checkbox
                            target.checked = previous.conversation.Selected;
                        }

                        $rootScope.showWelcome = false;

                        previous = {
                            index,
                            conversation: scope.conversations[index]
                        };
                    });

                }

                const onDragEnd = () => {
                    _rAF(() => {
                        scope.$applyAsync(() => {
                            _.each(scope.conversations, (item) => {

                                if (CACHE.ids) {
                                    item.Selected = CACHE.ids.indexOf(item.ID) !== -1;
                                }
                                // Auto check drag item, we uncheck it at the end
                                if ($rootScope.numberElementChecked === 1 && !CACHE.number) {
                                    item.Selected = false;
                                }

                            });
                            $rootScope.numberElementChecked = CACHE.number || countChecked(scope.conversations);

                            delete CACHE.number;
                            delete CACHE.ids;
                        });
                    });
                };

                el.on('click', onClick);
                document.addEventListener('dragend', onDragEnd);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                    document.removeEventListener('dragend', onDragEnd);
                    unsubscribe();
                    delete CACHE.number;
                    delete CACHE.ids;
                });
            }
        };
    });
