angular.module('proton.composer')
    .directive('composerInputMeta', () => {

        /**
         * Check if there is at least one invalid mail inside the list
         * @param  {Array}  options.ToList
         * @param  {Array}  options.CCList
         * @param  {Array}  options.BCCList
         * @return {Boolean}
         */
        const containsInvalid = ({ ToList = [], CCList = [], BCCList = [] }) => _.some([...ToList, ...CCList, ...BCCList], { invalid: true });

        /**
         * Check if the message contains some recipients (valid)
         * @param  {$scope} scope
         * @return {Function}
         */
        const containsRecipient = (scope) => () => {
            const { ToList = [], CCList = [], BCCList = [] } = scope.message;
            const hasInvalid = containsInvalid(scope.message);
            return !hasInvalid && (ToList.length || CCList.length || BCCList.length);
        };

        /**
         * Check if there is an address different than To inside a message
         * @param  {Array}  options.CCList
         * @param  {Array}  options.BCCList
         * @return {Boolean}
         */
        const containsBCC = ({ CCList = [], BCCList = [] }) => (CCList.length || BCCList.length);

        /**
         * Generate a uniq name identifier for the input
         * @param  {String} label
         * @return {String}
         */
        const getNameAutocomplete = (label) => {
            const id = Math.random().toString(32).slice(2, 12);
            return `composerAutocomplete${label}${id}`;
        };

        return {
            replace: true,
            templateUrl: 'templates/directives/composer/composerInputMeta.tpl.html',
            compile(element, { label, key }) {

                const $label = element[0].querySelector('.composerInputMeta-label');
                const $input = element[0].querySelector('.composerInputMeta-autocomplete');
                $label && ($label.textContent = label);

                // Bind the model to the autocomplete
                if ($input) {
                    $input.setAttribute('data-name', getNameAutocomplete(label));
                    $input.setAttribute('data-emails', `message.${key}`);
                }

                return (scope, el) => {

                    const isCurrentMsg = () => scope.message.ID === scope.selected.ID;

                    const $btn = el[0].querySelector('.composerInputMeta-overlay-button');

                    scope.containsRecipient = containsRecipient(scope);
                    scope.containsInvalid = containsInvalid;

                    const onClick = ({ target }) => {

                        // Allow the user to select the text inside the autocomplete box cf WebClient#41
                        if (target.classList.contains('autocompleteEmails-label')) {
                            return;
                        }

                        scope.$applyAsync(() => {
                            scope.selected.autocompletesFocussed = true;

                            if (containsBCC(scope.selected)) {
                                scope.message.ccbcc = true;
                                scope.message.attachmentsToggle = true;
                            }
                            _rAF(() => el.find('input').focus());
                        });
                    };

                    const onClickBtn = (e) => {
                        e.stopPropagation(); // Prevent collision with the onCLick itself
                        if (isCurrentMsg()) {
                            scope.$applyAsync(() => {
                                scope.message.ccbcc = !scope.message.ccbcc;
                                scope.message.autocompletesFocussed = true;
                                scope.message.attachmentsToggle = false;
                            });
                        }
                    };

                    $btn.addEventListener('click', onClickBtn, false);
                    el.on('click', onClick);

                    scope
                        .$on('$destroy', () => {
                            $btn.removeEventListener('click', onClickBtn, false);
                            el.off('click', onClick);
                        });

                };

            }
        };
    });
