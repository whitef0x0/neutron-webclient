angular.module('proton.message')
    .directive('mailTo', ($rootScope, regexEmail, messageModel, parseUrl, authentication) => ({
        restrict: 'A',
        link(scope, element) {
            function toAddresses(emails) {
                return emails.map((email) => {
                    return {
                        Address: email,
                        Name: email
                    };
                });
            }

            function click(event) {
                const link = event.target;
                if (link.tagName.toUpperCase() !== 'A') {
                    return;
                }

                let mailto = link.href;
                if (mailto.indexOf('mailto:') !== 0) {
                    return;
                }
                mailto = mailto.replace('mailto:', '');

                event.preventDefault();

                let j = mailto.indexOf('?');

                if (j < 0) {
                    j = mailto.length;
                }

                const to = mailto.substring(0, j);
                const { searchObject = {} } = parseUrl(mailto.substring(j + 1));
                const message = messageModel();

                message.From = _.findWhere(authentication.user.Addresses, { ID: scope.message.AddressID });

                if (to) {
                    message.ToList = toAddresses(to.split(','));
                }

                if (searchObject.subject) {
                    message.Subject = searchObject.subject;
                }

                if (searchObject.cc) {
                    message.CCList = toAddresses(searchObject.cc.split(','));
                }

                if (searchObject.bcc) {
                    message.BCCList = toAddresses(searchObject.bcc.split(','));
                }

                if (searchObject.body) {
                    message.DecryptedBody = searchObject.body;
                }

                $rootScope.$emit('composer.new', { message, type: 'new' });
            }

            element.on('click', click);
            scope.$on('$destroy', () => { element.off('click', click); });
        }
    }));
