angular.module('proton.commons')
    .factory('Key', ($http, $q, url, srp) => {
        return {
        /**
         * Create a new key
         * @param {Object} params
         * @return {Promise}
         */
            create(params = {}) {
                return $http.post(url.get() + '/keys', params);
            },
            /**
         * Install a new key for each address
         * @param {Object} params
         * @return {Promise}
         */
            setup(params = {}, newPassword = '') {
                if (newPassword.length) {
                    return srp.getPasswordParams(newPassword, params)
                        .then((authParams) => $http.post(url.get() + '/keys/setup', authParams));
                }

                return $http.post(url.get() + '/keys/setup', params);
            },
            /**
         * Install a new key for each address
         * @param {Object} params
         * @return {Promise}
         */
            reset(params = {}, newPassword = '') {
                if (newPassword.length) {
                    return srp.getPasswordParams(newPassword, params)
                        .then((authParams) => $http.post(url.get() + '/keys/reset', authParams));
                }
                return $http.post(url.get() + '/keys/reset', params);
            },
            /**
         * Update key priority
         * @param {Object} params
         * @return {Promise}
         */
            order(params = {}) {
                return $http.post(url.get() + '/keys/order', params);
            },
            /**
         * Activate key
         * @param {String} keyID
         * @param {Object} params
         * @return {Promise}
         */
            activate(keyID, params = {}) {
                return $http.put(url.get() + '/keys/' + keyID + '/activate', params);
            },
            /**
         * Update private key only, use for password updates
         * @param {Object} params
         * @return {Promise}
         */
            private(params = {}, newPassword = '') {
                if (newPassword.length) {
                    return srp.getPasswordParams(newPassword, params)
                        .then((authParams) => $http.put(url.get() + '/keys/private', authParams));
                }
                return $http.put(url.get() + '/keys/private', params);
            },
            /**
         * Upgrade private key with incorrect metadata
         * @param {Object} params
         * @return {Promise}
         */
            upgrade(params = {}, newPassword = '') {
                if (newPassword.length) {
                    return srp.getPasswordParams(newPassword, params)
                        .then((authParams) => $http.put(url.get() + '/keys/private/upgrade', authParams));
                }
                return $http.put(url.get() + '/keys/private/upgrade', params);
            },
            /**
         * Delete key
         * @param {String} keyID
         * @return {Promise}
         */
            delete(keyID) {
                return $http.delete(url.get() + '/keys/' + keyID);
            },
            /**
         * Get salts
         * @return {Promise}
         */
            salts() {
                return $http.get(url.get() + '/keys/salts');
            },
            /**
         * Delete key
         * @param {String} keyID
         * @return {Promise}
         */
            reactivate(keyID, params) {
                return $http.put(url.get() + '/keys/' + keyID, params);
            }
        };
    });
