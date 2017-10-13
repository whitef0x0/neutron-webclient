angular.module('proton.message')
    .directive('actionMessage', ($rootScope, CONSTANTS, openStatePostMessage) => {

        const dispatcher = (message = {}) => (action = '', mailbox = '') => {
            $rootScope.$emit('messageActions', {
                action,
                data: { ids: [message.ID], labelID: CONSTANTS.MAILBOX_IDENTIFIERS[mailbox] }
            });
        };

        const toggleImages = ({ message }) => {
            (message.showEmbedded === true) && (message.showEmbedded = false);
            (message.showImages === true) && (message.showImages = false);
        };

        return {
            link(scope, el, { actionMessage, actionMessageType = '' }) {
                const dispatch = dispatcher(scope.message);
                function onClick() {

                    switch (actionMessage) {
                        case 'unread':
                            scope.$applyAsync(() => {
                                scope.message.expand = false;
                                scope.message.IsRead = 0;
                            });
                            dispatch(actionMessage, actionMessageType);
                            break;

                        case 'togglePlainHtml':
                            scope.$applyAsync(() => {
                                toggleImages(scope);
                                scope.message.viewMode = (scope.message.viewMode === 'plain') ? 'html' : 'plain';
                            });
                            dispatch(actionMessage, actionMessageType);
                            break;

                        case 'toggleDetails':
                            scope.$applyAsync(() => {
                                scope.message.toggleDetails = !scope.message.toggleDetails;
                            });
                            break;

                        case 'print': {
                            const message = scope.message;
                            message.content = el
                                .parents('.message')
                                .get(0)
                                .querySelector('.message-body-container')
                                .innerHTML;

                            openStatePostMessage.open('printer', { messageID: message.ID }, {
                                message, data: JSON.stringify(message)
                            });
                            break;
                        }

                        case 'viewPgp': {
                            const message = scope.message;
                            openStatePostMessage.open('pgp', { messageID: message.ID }, {
                                message, data: `${message.Header}\n\r${message.Body}`
                            });
                            break;
                        }

                        default:
                            dispatch(actionMessage, actionMessageType);
                            break;
                    }
                }

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            }
        };
    });
