angular.module('proton.keys')
    .factory('changeMailboxPassword', (
        $log,
        authentication,
        CONSTANTS,
        gettextCatalog,
        Key,
        networkActivityTracker,
        organizationApi,
        passwords,
        pmcw,
        User
    ) => {
        /**
         * Instead of grab keys from the cache, we call the back-end, just to make sure everything is up to date
         * @param {String} newMailPwd
         * @param {String} keySalt
         * @return {Promise}
         */
        function getUser(newMailPwd = '', keySalt = '') {
            return Promise.all([passwords.computeKeyPassword(newMailPwd, keySalt), User.get()])
                .then(([password, { data = {} } = {}]) => {
                    if (data.Code === 1000) {
                        return Promise.resolve({ password, user: data.User });
                    }
                    throw new Error(data.Error || gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'));
                });
        }

        /**
         * Change organization keys
         * @param  {String} password
         * @param  {Object} user
         * @return {Promise}
         */
        function manageOrganizationKeys(password = '', oldMailPwd = '', user = {}) {
            if (user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                // Get organization key
                return organizationApi.getKeys()
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            const encryptPrivateKey = data.PrivateKey;

                            // Decrypt organization private key with the old mailbox password (current)
                            // then encrypt private key with the new mailbox password
                            // return 0 on failure to decrypt, other failures are fatal
                            return pmcw.decryptPrivateKey(encryptPrivateKey, oldMailPwd)
                                .then((pkg) => Promise.resolve(pmcw.encryptPrivateKey(pkg, password)), () => Promise.resolve(0));
                        }
                        throw new Error(data.Error || gettextCatalog.getString('Unable to get organization keys', null, 'Error'));
                    });
            }
            return Promise.resolve(0);
        }

        function manageUserKeys(password = '', oldMailPwd = '', user = {}) {
            const inputKeys = [];
            // Collect user keys
            user.Keys.forEach((key) => inputKeys.push(key));
            // Collect address keys
            user.Addresses.forEach((address) => { address.Keys.forEach((key) => inputKeys.push(key)); });
            // Re-encrypt all keys, if they can be decrypted
            let promises = [];
            if (user.OrganizationPrivateKey) {
                // Sub-user
                const organizationKey = pmcw.decryptPrivateKey(user.OrganizationPrivateKey, oldMailPwd);

                promises = inputKeys.map(({ PrivateKey, ID, Token }) => {
                    // Decrypt private key with organization key and token
                    return organizationKey
                        .then((key) => pmcw.decryptMessage({ message: pmcw.getMessage(Token), privateKey: key }))
                        .then(({ data }) => pmcw.decryptPrivateKey(PrivateKey, data))
                        .then((pkg) => ({ ID, pkg }));
                });
            } else {
                // Not sub-user
                promises = inputKeys.map(({ PrivateKey, ID }) => {
                    // Decrypt private key with the old mailbox password
                    return pmcw.decryptPrivateKey(PrivateKey, oldMailPwd)
                        .then((pkg) => ({ ID, pkg }));
                });
            }

            return promises.map((promise) => {
                return promise
                // Encrypt the key with the new mailbox password
                    .then(
                        ({ ID, pkg }) => {
                            return pmcw.encryptPrivateKey(pkg, password)
                                .then((PrivateKey) => ({ ID, PrivateKey }));
                        },
                        (error) => {
                        // Cannot decrypt, return 0 (not an error)
                            $log.error(error);
                            return 0;
                        }
                    );
            });
        }

        function sendNewKeys({ keys = [], keySalt = '', organizationKey = 0, newLoginPassword = '' }) {
            const keysFiltered = keys.filter((key) => key !== 0);
            const payload = { KeySalt: keySalt, Keys: keysFiltered };

            if (keysFiltered.length === 0) {
                throw new Error(gettextCatalog.getString('No keys to update', null, 'Error'));
            }

            if (organizationKey !== 0) {
                payload.OrganizationKey = organizationKey;
            }

            return Key.private(payload, newLoginPassword);
        }

        return ({ newPassword = '', onePassword = false }) => {
            const oldMailPwd = authentication.getPassword();
            const keySalt = (CONSTANTS.KEY_PHASE > 1) ? passwords.generateKeySalt() : null;
            const newLoginPassword = onePassword ? newPassword : '';
            let passwordComputed;
            const promise = getUser(newPassword, keySalt)
                .then(({ password = '', user = {} }) => {
                    passwordComputed = password;

                    const promises = [];
                    const collection = manageUserKeys(passwordComputed, oldMailPwd, user);

                    promises.push(manageOrganizationKeys(passwordComputed, oldMailPwd, user));
                    collection.forEach((promise) => promises.push(promise));

                    return Promise.all(promises);
                })
                .then(([organizationKey, ...keys]) => sendNewKeys({
                    keys,
                    keySalt,
                    organizationKey,
                    newLoginPassword
                }))
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return Promise.resolve();
                    }
                    throw new Error(data.Error);
                })
                .then(() => authentication.savePassword(passwordComputed));
            networkActivityTracker.track(promise);
            return promise;
        };
    });
