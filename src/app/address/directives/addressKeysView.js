angular.module('proton.address')
    .directive('addressKeysView', ($rootScope, downloadFile, authentication, gettextCatalog, tools, notification, Key, keyPasswordModal, pmcw, networkActivityTracker, eventManager) => ({
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/address/addressKeysView.tpl.html',
        link(scope) {
            const unsubscribe = $rootScope.$on('updateUser', () => {
                populateKeys();
            });
            scope.isSubUser = authentication.user.subuser;
            scope.addresses = [];
            function populateKeys() {
                authentication.user.Addresses.forEach(({ Keys = [], ID = '', Email = '', Order }) => {
                    if (Keys.length) {
                        const { fingerprint, created, bitSize, PublicKey } = Keys[0];
                        const index = _.findIndex(scope.addresses, { addressID: ID });
                        const address = { order: Order, addressID: ID, email: Email, fingerprint, created, bitSize, publicKey: PublicKey, keys: Keys };
                        if (index > -1) {
                            angular.extend(scope.addresses[index], address);
                        } else {
                            scope.addresses.push(address);
                        }
                    }
                });
            }
            /**
             * Download key
             * @param {String} key
             * @param {String} email
             * @param {String} type - 'public' or 'private'
             */
            scope.download = (key, email, type) => {
                const blob = new Blob([key], { type: 'data:text/plain;charset=utf-8;' });
                const filename = type + 'key.' + email + '.txt';

                downloadFile(blob, filename);
            };
            /**
             * Reactivate key
             * @param {String} key
             */
            scope.reactivate = (key) => {
                Key.salts()
                    .then(({ data = {} }) => {
                        const keySalt = _.findWhere(data.KeySalts, { ID: key.ID }) || {};
                        const salt = keySalt.KeySalt;
                        const privateKey = key.PrivateKey;
                        const params = {
                            salt,
                            privateKey,
                            submit(decryptedKey) {
                                keyPasswordModal.deactivate();
                                const promise = pmcw.encryptPrivateKey(decryptedKey, authentication.getPassword())
                                    .then((PrivateKey) => Key.reactivate(key.ID, { PrivateKey }))
                                    .then(({ data }) => {
                                        if (data.Code === 1000) {
                                            key.decrypted = true;
                                            notification.success(gettextCatalog.getString('Key reactivated', null));
                                            eventManager.call();
                                        } else if (data.Error) {
                                            return Promise.reject(data.Error);
                                        } else {
                                            return Promise.reject(gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'));
                                        }
                                    }, () => {
                                        return Promise.reject(gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'));
                                    });
                                networkActivityTracker.track(promise);
                            },
                            cancel() {
                                keyPasswordModal.deactivate();
                            }
                        };

                        keyPasswordModal.activate({ params });
                    }, () => {
                        // Nothing
                    });
            };
            scope.$on('$destroy', () => {
                unsubscribe();
            });
            populateKeys();
        }
    }));
