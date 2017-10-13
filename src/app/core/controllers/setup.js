angular.module('proton.core')
    .controller('SetupController', (
        $http,
        $location,
        $log,
        $q,
        $rootScope,
        $scope,
        $state,
        Address,
        authentication,
        CONSTANTS,
        confirmModal,
        domains,
        gettextCatalog,
        Key,
        networkActivityTracker,
        Payment,
        passwords,
        pmcw,
        Reset,
        secureSessionStorage,
        setupKeys,
        tools,
        user
    ) => {
        let passwordCopy;

        function initialization() {

            $scope.keyPhase = CONSTANTS.KEY_PHASE;

            // Variables
            $scope.tools = tools;
            $scope.filling = true;
            $scope.creating = false;
            $scope.genKeys = false;
            $scope.setupAccount = false;
            $scope.getUserInfo = false;
            $scope.finishCreation = false;

            $scope.generating = false;
            $scope.domains = [];

            // Populate the domains <select>
            _.each(domains, (domain) => {
                $scope.domains.push({ label: domain, value: domain });
            });

            // Username
            $scope.username = user.Name;

            // Select the first domain
            $scope.domain = $scope.domains[0];

            // Address creation needed?
            $scope.chooseDomain = user.Addresses.length === 0;

            // Passwords
            $scope.password = '';
            $scope.passwordConfirm = '';
        }

        $scope.submit = () => {

        // Save password in separate variable to prevent extensions/etc
        // from modifying it during setup process
            passwordCopy = $scope.password;

            return networkActivityTracker.track(
                setupAddress()
                    .then(generateKeys)
                    .then(installKeys)
                    .then(doGetUserInfo)
                    .then(finishRedirect)
            )
                .catch(() => {
                    $scope.setupError = true;
                });
        };

        // ---------------------------------------------------
        // ---------------------------------------------------
        // Setup Functions
        // ---------------------------------------------------
        // ---------------------------------------------------

        function setupAddress() {
            $log.debug('setupAddress');
            $scope.filling = false;

            if (user.Addresses.length === 0) {
                return Address.setup({
                    Domain: $scope.domain.value
                })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            user.Addresses = [result.data.Address];
                            return user;
                        } else if (result.data && result.data.Error) {
                            return $q.reject({ message: result.data.Error });
                        }
                        return $q.reject({ message: 'Something went wrong during address creation' });
                    });
            }
            return $q.resolve(user);
        }

        function generateKeys() {

            $log.debug('generateKeys');
            $scope.genKeys = true;

            return setupKeys.generate(user.Addresses, passwordCopy);
        }

        function installKeys(data = {}) {

            $log.debug('installKeys');
            $scope.genKeys = false;
            $scope.creating = true;
            $scope.setupAccount = true;

            return setupKeys.setup(data, passwordCopy)
                .then(() => {
                    authentication.savePassword(data.mailboxPassword);

                    $rootScope.isLoggedIn = authentication.isLoggedIn();
                    $rootScope.isLocked = authentication.isLocked();
                    $rootScope.isSecure = authentication.isSecured();
                });
        }

        function doGetUserInfo() {
            $log.debug('getUserInfo');
            $scope.getUserInfo = true;
            return authentication.fetchUserInfo();
        }

        function finishRedirect() {
            $log.debug('finishRedirect');
            $scope.finishCreation = true;

            if (authentication.user.Delinquent < 3) {
                $state.go('secured.inbox', { welcome: CONSTANTS.WIZARD_ENABLED });
            } else {
                $state.go('secured.dashboard');
            }
        }

        initialization();
    });
