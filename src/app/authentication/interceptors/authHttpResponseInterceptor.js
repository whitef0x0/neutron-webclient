angular.module('proton.authentication')
    .factory('authHttpResponseInterceptor', ($q, $injector, $rootScope, AppModel) => {
        let notification = false;
        let upgradeNotification = false;
        let NOTIFS;
        const buildNotifs = () => {
            const gettextCatalog = $injector.get('gettextCatalog');
            return {
                newVersion: gettextCatalog.getString('A new version of ProtonMail is available. Please refresh this page.'),
                nonIntegerVersion: gettextCatalog.getString('Non-integer API version requested.', null, 'Error'),
                unsupported: gettextCatalog.getString('Unsupported API version.', null, 'Error'),
                offline: gettextCatalog.getString('The ProtonMail API is offline: ', null, 'Error'),
                noInternet: gettextCatalog.getString('No Internet connection found.', null, 'Error'),
                noServer: gettextCatalog.getString('Could not connect to server.', null, 'Error'),
                timeout: gettextCatalog.getString('Request timed out, please try again.', null, 'Error'),
                noReachProton: gettextCatalog.getString('ProtonMail cannot be reached right now, please try again later.', null, 'Error')
            };
        };
        const notifyError = (message) => {
            return $injector.get('notification').error(message);
        };

        return {
            response(response) {
                if (/^(?!.*templates)/.test(response.config.url)) {
                    AppModel.set('onLine', true);
                }

                (!NOTIFS) && (NOTIFS = buildNotifs());

                // Close notification if Internet wake up
                if (notification) {
                    notification.close();
                    notification = false;
                }

                if (angular.isDefined(response.data) && angular.isDefined(response.data.Code)) {
                // app update needd
                    if (response.data.Code === 5003) {
                        if (upgradeNotification) {
                            upgradeNotification.close();
                        }

                        upgradeNotification = $injector.get('notify')({
                            classes: 'notification-info noclose',
                            message: NOTIFS.newVersion,
                            duration: '0'
                        });
                    } else if (response.data.Code === 5004) {
                        notifyError(NOTIFS.nonIntegerVersion);
                    } else if (response.data.Code === 5005) {
                    // unsupported api
                        notifyError(NOTIFS.unsupported);
                    } else if (response.data.Code === 7001) {
                    // site offline
                        notifyError(NOTIFS.offline + response.data.Error);
                    } else if (response.data.Code === 9001) {
                        const handle9001 = $injector.get('handle9001');
                        return handle9001(response.config);
                    }
                }

                return response || $q.when(response);
            },
            responseError(rejection) {
                if (rejection.status === 0 || rejection.status === -1) {
                    if (navigator.onLine === true) {
                        notification = notifyError(NOTIFS.noServer);
                    } else {
                        notification = notifyError(NOTIFS.noInternet);
                    }
                    AppModel.set('onLine', false);
                } else if (rejection.status === 401) {
                    if ($rootScope.doRefresh === true) {
                        $rootScope.doRefresh = false;
                        $injector.get('authentication').getRefreshCookie()
                            .then(
                                () => {
                                    const $http = $injector.get('$http');

                                    _.extend(rejection.config.headers, $http.defaults.headers.common);
                                    return $http(rejection.config);
                                },
                                () => {
                                    $injector.get('authentication').logout(true, false);
                                }
                            );
                    } else {
                        $injector.get('authentication').logout(true, false);
                    }
                } else if (rejection.status === 403) {
                    const handle403 = $injector.get('handle403');
                    return handle403(rejection.config);
                } else if (rejection.status === 504) {
                    notification = notifyError(NOTIFS.timeout);
                    AppModel.set('requestTimeout', true);
                } else if ([408, 503].indexOf(rejection.status) > -1) {
                    notification = notifyError(NOTIFS.noReachProton);
                }

                return $q.reject(rejection);
            }
        };
    });
