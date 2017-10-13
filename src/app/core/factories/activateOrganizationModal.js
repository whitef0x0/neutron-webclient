angular.module('proton.core')
    .factory('activateOrganizationModal', (pmModal, networkActivityTracker, organizationApi, gettextCatalog, passwords, pmcw, authentication, notification) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/activateOrganization.tpl.html',
            /* @ngInject */
            controller: function (params) {

                this.inputCode = '';
                this.alertClass = params.alertClass || 'alert alert-danger';
                this.messageClass = 'alert alert-info';
                this.title = params.title || 'Administrator Key Activation';
                this.prompt = params.prompt || 'Enter activation passcode:';
                this.message = params.message || '';
                this.alert = params.alert || '';
                this.showReset = angular.isDefined(params.reset);

                this.submit = () => {

                    const passcode = this.inputCode;

                    networkActivityTracker.track(organizationApi.getBackupKeys()
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                return result.data;
                            } else if (result.data && result.data.Error) {
                                return Promise.reject(result.data.Error);
                            }
                            return Promise.reject(new Error(gettextCatalog.getString('Error retrieving backup organization keys', null, 'Error')));
                        })
                        .then(({ PrivateKey, KeySalt }) => {
                            return passwords.computeKeyPassword(passcode, KeySalt)
                                .then((keyPassword) => pmcw.decryptPrivateKey(PrivateKey, keyPassword))
                                .then(
                                    (pkg) => {
                                        return pmcw.encryptPrivateKey(pkg, authentication.getPassword())
                                            .then((PrivateKey) => organizationApi.activateKeys({ PrivateKey }))
                                            .then(({ data }) => {
                                                if (data && data.Code === 1000) {
                                                    notification.success(params.successMessage);
                                                    params.submit(pkg);
                                                    return;
                                                } else if (data && data.Error) {
                                                    return Promise.reject(new Error(data.Error));
                                                }
                                                return Promise.reject(new Error(params.errorMessage));
                                            });
                                    },
                                    () => Promise.reject(new Error(gettextCatalog.getString('Password incorrect. Please try again', null, 'Error')))
                                );
                        })
                        .catch((error) => {
                            if (error) {
                                notification.error(error);
                            }
                        }));
                };

                this.cancel = () => {
                    params.cancel();
                };

                this.reset = () => {
                    params.reset();
                };
            }
        });
    });
