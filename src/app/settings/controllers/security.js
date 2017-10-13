angular.module('proton.settings')
    .controller('SecurityController', (
        $log,
        $rootScope,
        $scope,
        authApi,
        twoFAIntroModal,
        gettextCatalog,
        authentication,
        confirmModal,
        CONSTANTS,
        sharedSecretModal,
        downloadFile,
        loginPasswordModal,
        recoveryCodeModal,
        Logs,
        networkActivityTracker,
        notification,
        settingsApi
    ) => {
        $scope.logs = [];
        $scope.logItemsPerPage = 20;
        $scope.doLogging = authentication.user.LogAuth;
        $scope.twoFactor = authentication.user.TwoFactor;
        $scope.keyPhase = CONSTANTS.KEY_PHASE;

        // / logging page
        $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
        $scope.haveLogs = false;

        const setCurrentPage = (p) => {
            $scope.currentLogPage = p;
            $rootScope.$emit('paginatorScope', { type: 'logs', page: p });
        };

        function recoveryCodes(codes) {
            recoveryCodeModal.activate({
                params: {
                    recoveryCodes: codes,
                    close() {
                        recoveryCodeModal.deactivate();
                    }
                }
            });
        }

        function confirm2FAEnable(sharedSecret, qrURI) {
            function submit(loginPassword, twoFactorCode) {
                const promise = settingsApi.enableTwoFactor({ TwoFactorSharedSecret: sharedSecret }, { TwoFactorCode: twoFactorCode, Password: loginPassword })
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return Promise.resolve(data.TwoFactorRecoveryCodes);
                        }
                        showSharedSecret(sharedSecret, qrURI);
                        return Promise.reject(data.Error);
                    })
                    .then((codes) => {
                        $scope.twoFactor = 1;
                        authentication.user.TwoFactor = 1;
                        recoveryCodes(codes);
                    });
                networkActivityTracker.track(promise);
            }
            checkCredentials2FA(submit);
        }

        function confirm2FADisable() {
            function submit(loginPassword, twoFactorCode) {
                const promise = settingsApi.disableTwoFactor({ TwoFactorCode: twoFactorCode, Password: loginPassword })
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return Promise.resolve();
                        }
                        return Promise.reject(data.Error);
                    })
                    .then(() => {
                        $scope.twoFactor = 0;
                        authentication.user.TwoFactor = 0;
                        notification.success(gettextCatalog.getString('Two-factor authentication disabled', null));
                    });
                networkActivityTracker.track(promise);
            }
            checkCredentials2FA(submit);
        }

        function checkCredentials2FA(submit) {
            loginPasswordModal.activate({
                params: {
                    hasTwoFactor: 1, // force the modal to ask for 2FA code
                    submit(loginPassword, twoFactorCode) {
                        loginPasswordModal.deactivate();
                        submit(loginPassword, twoFactorCode);
                    },
                    cancel() {
                        loginPasswordModal.deactivate();
                    }
                }
            });
        }

        function showSharedSecret(sharedSecret, qrURI) {
            sharedSecretModal.activate({
                params: {
                    sharedSecret,
                    qrURI,
                    next(sharedSecret, qrURI) {
                        sharedSecretModal.deactivate();
                        confirm2FAEnable(sharedSecret, qrURI);
                    },
                    cancel() {
                        sharedSecretModal.deactivate();
                    }
                }
            });
        }

        $scope.enableTwoFactor = () => {
            twoFAIntroModal.activate({
                params: {
                    next() {
                        showSharedSecret();
                        twoFAIntroModal.deactivate();
                    },
                    cancel() {
                        twoFAIntroModal.deactivate();
                    }
                }
            });
        };

        $scope.disableTwoFactor = () => {
            const title = gettextCatalog.getString('Disable Two-Factor Authentication', null, 'Title');
            const message = gettextCatalog.getString('Are you sure you want to disable two-factor authentication?', null, 'Info');
            confirmModal.activate({
                params: {
                    title,
                    message,
                    confirm() {
                        confirmModal.deactivate();
                        confirm2FADisable();
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        };

        $scope.loadLogs = (page) => {
            setCurrentPage(page);
        };

        $scope.initLogs = () => {
            networkActivityTracker.track(
                Logs.get().then(
                    (response) => {
                        $scope.logs = _.sortBy(response.data.Logs, 'Time').reverse();
                        $scope.logCount = $scope.logs.length;
                        setCurrentPage(1);
                        $scope.haveLogs = true;
                    },
                    (error) => {
                        notification.error(gettextCatalog.getString('Error during the initialization of logs', null, 'Error'));
                        $log.error(error);
                    }
                )
            );
        };

        $scope.clearLogs = () => {
            const title = gettextCatalog.getString('Clear', null, 'Title');
            const message = gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info');

            confirmModal.activate({
                params: {
                    title,
                    message,
                    confirm() {
                        networkActivityTracker.track(
                            Logs.clear()
                                .then((result) => {
                                    if (result.data && result.data.Code === 1000) {
                                        $scope.logs = [];
                                        $scope.logCount = 0;
                                        notification.success(gettextCatalog.getString('Logs cleared', null));
                                    }
                                })
                        );
                        confirmModal.deactivate();
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        };

        $scope.downloadLogs = () => {
            const logsArray = [['Event', 'Time', 'IP']];
            const csvRows = [];
            const filename = 'logs.csv';

            _.forEach($scope.logs, (log) => {
                logsArray.push([log.Event, moment(log.Time * 1000), log.IP]);
            });

            for (let i = 0, l = logsArray.length; i < l; ++i) {
                csvRows.push(logsArray[i].join(','));
            }

            const csvString = csvRows.join('\r\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

            downloadFile(blob, filename);
        };

        $scope.revokeOthers = () => {
            const errorMessage = gettextCatalog.getString('Error during revoke request', null, 'Error');
            const successMessage = gettextCatalog.getString('Other sessions revoked', null, 'Success');
            const promise = authApi.revokeOthers()
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return Promise.resolve();
                    }
                    throw new Error(data.Error || errorMessage);
                })
                .then(() => notification.success(successMessage));
            networkActivityTracker.track(promise);
        };

        $scope.setLogging = (value) => {
            if (value === 0) {
                return confirmModal.activate({
                    params: {
                        message: gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info'),
                        confirm() {
                            const promise = settingsApi.setLogging({ LogAuth: 0 })
                                .then(() => {
                                    $scope.doLogging = 0;
                                    authentication.user.LogAuth = 0;
                                    notification.success(gettextCatalog.getString('Logging preference updated', null, 'Dashboard/security'));
                                    confirmModal.deactivate();
                                    $scope.disabledText = gettextCatalog.getString('Disabled', null);
                                });
                            networkActivityTracker.track(promise);
                        },
                        cancel() {
                            confirmModal.deactivate();
                        }
                    }
                });
            }

            const promise = settingsApi.setLogging({ LogAuth: value })
                .then(() => {
                    $scope.doLogging = value;
                    notification.success(gettextCatalog.getString('Logging preference updated', null, 'Dashboard/security'));
                    $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
                });

            networkActivityTracker.track(promise);
        };
    });
