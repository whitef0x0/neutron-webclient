angular.module('proton.commons')
    .factory('Invite', ($http, url) => {
        const requestURL = url.build('invites');
        /**
     * Validate invitation
     * @param {String} Token
     * @param {String} Username
     * @return {Promise}
     */
        const check = (Token, Selector, Type) => $http.post(requestURL('check'), { Token, Selector, Type });

        return { check };
    });
