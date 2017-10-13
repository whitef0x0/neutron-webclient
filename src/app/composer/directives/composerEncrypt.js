angular.module('proton.composer')
    .directive('composerEncrypt', (notification, gettextCatalog, $rootScope) => {
        const MESSAGES = {
            noPassword: gettextCatalog.getString('Please enter a password for this email.', null, 'Error'),
            noMatchPassword: gettextCatalog.getString('Message passwords do not match.', null, 'Error')
        };

        const dispatch = (type, message) => $rootScope.$emit('composer.update', { type, data: { message, type: 'encryption' } });

        return {
            replace: true,
            scope: {
                message: '='
            },
            templateUrl: 'templates/composer/composerEncrypt.tpl.html',
            link(scope, el) {
                const $cancel = el.find('.composerEncrypt-btn-cancel');
                scope.model = {
                    password: '',
                    confirm: '',
                    hint: ''
                };

                const onSubmit = (e) => {

                    // We don't want to submit the whole composer
                    e.stopPropagation();

                    if (!scope.model.password.length) {
                        return notification.error(MESSAGES.noPassword);
                    }

                    if (scope.model.password !== scope.model.confirm) {
                        return notification.error(MESSAGES.noMatchPassword);
                    }
                    scope.$applyAsync(() => {
                        scope.message.IsEncrypted = 1;
                        scope.message.Password = scope.model.password;
                        scope.message.PasswordHint = scope.model.hint;
                        dispatch('close.panel', scope.message);
                    });
                };

                const onCancel = () => {
                    scope.$applyAsync(() => {
                        scope.model.password = '';
                        scope.model.confirm = '';
                        scope.model.hint = '';
                        scope.encryptForm.$setUntouched();
                        delete scope.message.PasswordHint;
                        scope.message.IsEncrypted = 0;
                        dispatch('close.panel', scope.message);
                    });
                };

                el.on('submit', onSubmit);
                $cancel.on('click', onCancel);

                scope.$on('$destroy', () => {
                    el.off('submit', onSubmit);
                    $cancel.off('click', onCancel);
                });
            }
        };
    });
