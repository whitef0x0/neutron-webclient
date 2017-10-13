angular.module('proton.core')
    .controller('SupportController', (
        $rootScope,
        $scope,
        $state,
        $log,
        authentication,
        CONSTANTS,
        tempStorage,
        User,
        tools,
        notification,
        gettextCatalog,
        confirmModal,
        Reset,
        setupKeys,
        Key,
        networkActivityTracker
    ) => {

        const GENERIC_MESSAGE = {
            title: gettextCatalog.getString('Problem loading your account'),
            content: gettextCatalog.getString('ProtonMail encountered a problem loading your account. Please refresh the page and try again later.'),
            type: 'alert-danger'
        };

        function resetState() {
            $scope.params.resetToken = '';
            $scope.params.danger = '';
            $scope.params.password = '';
            $scope.params.passwordConfirm = '';

            $scope.resetState = $scope.states.RECOVERY;
        }

        $scope.keyPhase = CONSTANTS.KEY_PHASE;

        $scope.states = {
            RECOVERY: 1,
            CODE: 2,
            CHECKING: 3,
            DANGER: 4,
            PASSWORD: 5,
            GENERATE: 6,
            INSTALL: 7
        };

        $scope.tools = tools;
        $scope.params = {};
        $scope.params.recoveryEmail = '';
        $scope.params.username = '';
        $scope.passwordMode = 0;

        resetState();

        // Installing
        $scope.resetAccount = false;
        $scope.logUserIn = false;
        $scope.finishInstall = false;

        $scope.getMessageTitle = () => {
            return $state.params.data.title || GENERIC_MESSAGE.title;
        };

        $scope.getMessageContent = () => {
            return $state.params.data.content || GENERIC_MESSAGE.content;
        };

        $scope.getMessageType = () => {
            return $state.params.data.type || GENERIC_MESSAGE.type;
        };

        $scope.confirmResetLostPassword = () => {
            const title = gettextCatalog.getString('Confirm Reset Password', null, 'Title');
            const message = gettextCatalog.getString('Resetting your password means you will no longer be able to read your old emails. <a href="https://protonmail.com/support/knowledge-base/updating-your-login-password/" target="_blank">Click here to learn more</a>. If you have further questions, please email contact@protonmail.ch. Are you sure you want to reset your password?', null, 'Title');
            confirmModal.activate({
                params: {
                    title,
                    message,
                    confirm() {
                        confirmModal.deactivate();
                        resetLostPassword();
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        };

        /**
     * Request a token to reset login pass. Some validation first.
     * Shows errors otherwise sets a flag to show a different form
     */
        function resetLostPassword() {
            $scope.params.username = $scope.params.username;
            const promise = Reset.requestResetToken({ Username: $scope.params.username, NotificationEmail: $scope.params.recoveryEmail })
                .then(({ data = {} }) => {
                    if (data.Code === 1000) {
                        $scope.resetState = $scope.states.CODE;
                    } else if (data.Error) {
                        return Promise.reject(data.Error);
                    }
                });
            networkActivityTracker.track(promise);
        }

        /**
     * Validates the token and shows the last form
     * @param form {Form}
     */
        $scope.validateToken = () => {

            $scope.resetState = $scope.states.CHECKING;

            $scope.tokenParams = {
                Username: $scope.params.username,
                Token: $scope.params.resetToken
            };

            Reset.validateResetToken($scope.tokenParams)
                .then(({ data = {} }) => {
                    if (data.Code === 1000) {

                        $scope.passwordMode = data.PasswordMode;
                        $scope.addresses = data.Addresses;

                        $scope.resetState = $scope.states.DANGER;
                        if ($scope.passwordMode === 2 && $scope.keyPhase < 3) {
                            $scope.resetState = $scope.states.PASSWORD;
                        }
                    } else {
                        return Promise.reject({
                            message: data.Error || 'Unable to verify reset token'
                        });
                    }

                })
                .catch((error) => {
                    resetState();
                    $log.error(error);
                    notification.error(error.message);
                });
        };

        $scope.confirmReset = () => {
            $scope.resetState = $scope.states.PASSWORD;
        };

        function doReset() {
            if ($scope.passwordMode === 2 && $scope.keyPhase < 3) {
                return Reset.resetPassword($scope.tokenParams, $scope.params.password)
                    .then((response = {}) => {

                        const { data = {} } = response;

                        if (data.Code === 1000) {
                            return response;
                        }

                        return Promise.reject({
                            message: data.Error || 'Unable to update password. Please try again'
                        });
                    });
            }

            return generateKeys().then(installKeys);
        }

        function generateKeys() {

            $log.debug('generateKeys');
            $scope.resetState = $scope.states.GENERATE;

            return setupKeys.generate($scope.addresses, $scope.params.password);
        }

        function installKeys(data = {}) {

            $log.debug('installKeys');
            $scope.resetState = $scope.states.INSTALL;
            $scope.resetAccount = true;

            return setupKeys.reset(data, $scope.params.password, $scope.tokenParams);
        }

        function doLogUserIn() {
            $scope.logUserIn = true;
            return authentication.loginWithCredentials({
                Username: $scope.params.username,
                Password: $scope.params.password
            })
                .then(({ data }) => {
                    $rootScope.isLoggedIn = true;
                    return data;
                });
        }

        function finishRedirect(authResponse) {
            $log.debug('finishRedirect');
            $scope.finishInstall = true;
            const creds = {
                username: $scope.params.username,
                password: $scope.params.password,
                authResponse
            };
            tempStorage.setItem('creds', creds);
            $state.go('login.unlock');
        }

        /**
     * Saves new login pass. Shows success page.
     * @param form {Form}
     */
        $scope.resetPassword = () => {

            networkActivityTracker.track(
                doReset()
                    .then(doLogUserIn)
                    .then(finishRedirect)
                    .catch((error) => {
                        $log.error(error);
                        resetState();
                        notification.error(error.message);
                    }));
        };

        // Can't user $stateParams because support is a single controller
        // This should be refactored into the support message controller and the reset controller
        // after mailbox password reset is fully deprecated
        if ($state.is('support.reset-password') && $state.params.username && $state.params.token) {
            $scope.resetState = $scope.states.CHECKING;

            $scope.params.username = $state.params.username;
            $scope.params.resetToken = $state.params.token;

            $scope.validateToken();
        }
    });
