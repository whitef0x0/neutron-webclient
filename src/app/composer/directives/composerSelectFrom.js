angular.module('proton.composer')
    .directive('composerSelectFrom', (notification, authentication, editorModel, aboutClient, gettextCatalog) => {

        const I18N = {
            ATTACHMENT_SEND_CHANGE: gettextCatalog.getString('Attachments and inline images must be removed first before changing sender', null, 'Compose message')
        };

        const listAddress = () => {
            return _.chain(authentication.user.Addresses)
                .where({ Status: 1, Receive: 1 })
                .sortBy('Order')
                .value();
        };

        return {
            scope: {
                message: '=model'
            },
            replace: true,
            templateUrl: 'templates/directives/composer/composerSelectFrom.tpl.html',
            link(scope, el) {
                const $select = el.find('select');
                scope.addresses = listAddress();

                const onClick = (e) => {
                    if (scope.message.Attachments.length) {
                        e.preventDefault();
                        return notification.error(I18N.ATTACHMENT_SEND_CHANGE);
                    }
                };

                const onChange = () => {
                    scope.$applyAsync(() => {
                        scope.message.AddressID = scope.message.From.ID;
                        const { editor } = editorModel.find(scope.message);
                        editor.fireEvent('refresh', { action: 'message.changeFrom' });
                    });
                };

                /**
                 * For some reason IE focus is lost
                 * cause a rendering bug of the options widths
                 */
                const onMouseDown = () => $select.focus();
                aboutClient.isIE11() && $select.on('mousedown', onMouseDown);

                el.on('click', onClick);
                el.on('change', onChange);

                scope.$on('$destroy', () => {
                    aboutClient.isIE11() && $select.off('mousedown', onMouseDown);
                    el.off('click', onClick);
                    el.off('change', onChange);
                });
            }
        };
    });
