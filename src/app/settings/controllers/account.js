angular.module('proton.settings')
    .controller('AccountController', (
        $log,
        $rootScope,
        $scope,
        $timeout,
        $state,
        CONSTANTS,
        gettextCatalog,
        $q,
        authentication,
        changePasswordModal,
        Bug,
        confirmModal,
        deleteAccountModal,
        desktopNotifications,
        eventManager,
        hotkeys,
        hotkeyModal,
        Key,
        loginPasswordModal,
        networkActivityTracker,
        notification,
        organizationModel,
        passwords,
        pmcw,
        settingsApi,
        tools,
        User
    ) => {
        let promisePasswordModal;
        const unsubscribe = [];
        $scope.keyPhase = CONSTANTS.KEY_PHASE;
        $scope.emailing = { announcements: false, features: false, newsletter: false, beta: false };
        $scope.locales = [
            { label: 'Deutsch', key: 'de_DE' },
            { label: 'English', key: 'en_US' },
            { label: 'Español', key: 'es_ES' },
            { label: 'Français', key: 'fr_FR' },
            { label: 'Nederlands', key: 'nl_NL' },
            { label: 'Italiano', key: 'it_IT' },
            { label: 'Polski', key: 'pl_PL' },
            { label: 'Українська', key: 'ua_UA' },
            { label: 'Pусский', key: 'ru_RU' },
            { label: 'Türk', key: 'tr_TR' }
        ];
        $scope.locale = _.findWhere($scope.locales, { key: gettextCatalog.getCurrentLanguage() }) || $scope.locales[0];
        const EMAILING_KEYS = Object.keys($scope.emailing);
        updateUser();

        function passwordModal(submit = angular.noop, onCancel = angular.noop) {
            loginPasswordModal.activate({
                params: {
                    submit,
                    cancel() {
                        loginPasswordModal.deactivate();
                        onCancel();
                    }
                }
            });
        }

        $scope.setPasswordMode = (mode = 0) => {
            $scope.passwordMode = mode;
        };

        // Listeners


        $scope.$on('$destroy', () => {
            unsubscribe.forEach((cb) => cb());
            unsubscribe.length = 0;
        });

        $scope.saveDefaultLanguage = () => {
            const Language = $scope.locale.key;
            const promise = settingsApi.setLanguage({ Language })
                .then(() => window.location.reload());

            networkActivityTracker.track(promise);

            return promise;
        };

        $scope.enableDesktopNotifications = () => {
            desktopNotifications.request(() => {
                $scope.desktopNotificationsStatus = desktopNotifications.status();
            });
        };

        $scope.testDesktopNotification = () => {
            desktopNotifications.create(gettextCatalog.getString('You have a new email', null, 'Info'), {
                body: 'Quarterly Operations Update - Q1 2016 ',
                icon: '/assets/img/notification-badge.gif',
                onClick() {
                    window.focus();
                }
            });
        };

        $scope.saveNotification = (form) => {
            function submit(currentPassword, twoFactorCode) {
                loginPasswordModal.deactivate();
                const credentials = { Password: currentPassword, TwoFactorCode: twoFactorCode };
                const promise = settingsApi.noticeEmail({ NotificationEmail: $scope.notificationEmail }, credentials)
                    .then(() => {
                        authentication.user.NotificationEmail = $scope.notificationEmail;
                        form.$setUntouched();
                        form.$setPristine();
                        notification.success(gettextCatalog.getString('Recovery/Notification email saved', null));
                    });
                networkActivityTracker.track(promise);
            }

            passwordModal(submit);
        };

        $scope.savePasswordReset = () => {
            function submit(Password, TwoFactorCode) {
                loginPasswordModal.deactivate();
                const credentials = { Password, TwoFactorCode };
                const promise = settingsApi.passwordReset({ PasswordReset: $scope.passwordReset }, credentials)
                    .then(() => {
                        authentication.user.PasswordReset = $scope.passwordReset;
                        notification.success(gettextCatalog.getString('Preference saved', null));
                    });
                networkActivityTracker.track(promise);
            }
            const onCancel = () => ($scope.passwordReset = +!$scope.passwordReset);
            passwordModal(submit, onCancel);
        };

        $scope.saveDailyNotifications = () => {
            networkActivityTracker.track(
                settingsApi.notify({ Notify: $scope.dailyNotifications })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            authentication.user.Notify = $scope.dailyNotifications;
                            notification.success(gettextCatalog.getString('Preference saved', null));
                        } else if (result.data && result.data.Error) {
                            notification.error(result.data.Error);
                        }
                    })
            );
        };

        function initAutoClose() {
            const tenMinutes = 10 * 60 * 1000;
            $timeout.cancel(promisePasswordModal);
            promisePasswordModal = $timeout(() => {
                if (changePasswordModal.active()) {
                    const message = gettextCatalog.getString('Operation timed out for security reasons, please try again', null);
                    changePasswordModal.deactivate();
                    notification.error(message);
                }
            }, tenMinutes, false);
        }

        function cancelAutoClose() {
            $timeout.cancel(promisePasswordModal);
        }

        $scope.changePassword = (type = '', phase = 0) => {
            const parameters = { type, phase };
            function modal() {
                changePasswordModal.activate({
                    params: {
                        phase: parameters.phase,
                        type: parameters.type,
                        close(next) {
                            changePasswordModal.deactivate();
                            if (next) {
                                parameters.phase = 2;
                                parameters.type = 'mailbox';
                                setTimeout(() => modal(), 100); // timeout required to live with Angular
                            } else {
                                cancelAutoClose();
                            }
                        }
                    }
                });
            }
            function submit(currentPassword, twoFactorCode) {
                const promise = User.password({ Password: currentPassword, TwoFactorCode: twoFactorCode })
                    .then((result) => {
                        const { data } = result;
                        if (data.Error) {
                            return Promise.reject(data.Error);
                        }
                        return Promise.resolve(result);
                    })
                    .then(() => {
                        loginPasswordModal.deactivate();
                        initAutoClose();
                        modal();
                    });
                networkActivityTracker.track(promise);
            }
            passwordModal(submit);
        };

        function updateUser() {
            $scope.notificationEmail = authentication.user.NotificationEmail;
            $scope.passwordReset = authentication.user.PasswordReset;
            $scope.dailyNotifications = authentication.user.Notify;
            $scope.desktopNotificationsStatus = desktopNotifications.status();
            $scope.autosaveContacts = authentication.user.AutoSaveContacts;
            $scope.images = authentication.user.ShowImages;
            $scope.embedded = authentication.user.ShowEmbedded;
            $scope.hotkeys = authentication.user.Hotkeys;
            $scope.passwordMode = authentication.user.PasswordMode;
            $scope.isMember = authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
            setEmailingValues(authentication.user.News);
        }

        $scope.saveAutosaveContacts = () => {
            networkActivityTracker.track(
                settingsApi.autosave({ AutoSaveContacts: $scope.autosaveContacts })
                    .then(() => {
                        notification.success(gettextCatalog.getString('Preference saved', null));
                        authentication.user.AutoSaveContacts = $scope.autosaveContacts;
                    })
            );
        };

        $scope.saveImages = () => {
            networkActivityTracker.track(
                settingsApi.setShowImages({ ShowImages: $scope.images })
                    .then(() => {
                        authentication.user.ShowImages = $scope.images;
                        notification.success(gettextCatalog.getString('Image preferences updated', null));
                    })
            );
        };

        $scope.saveEmbedded = () => {
            networkActivityTracker.track(
                settingsApi.setShowEmbedded({ ShowEmbedded: $scope.embedded })
                    .then(() => {
                        authentication.user.ShowEmbedded = $scope.embedded;
                        notification.success(gettextCatalog.getString('Image preferences updated', null));
                    })
            );
        };

        $scope.openHotkeyModal = () => {
            hotkeyModal.activate({
                params: {
                    close() {
                        hotkeyModal.deactivate();
                    }
                }
            });
        };

        $scope.saveHotkeys = () => {
            networkActivityTracker.track(
                settingsApi.setHotkeys({ Hotkeys: $scope.hotkeys })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            authentication.user.Hotkeys = $scope.hotkeys;

                            if ($scope.hotkeys === 1) {
                                hotkeys.bind();
                            } else {
                                hotkeys.unbind();
                            }

                            notification.success(gettextCatalog.getString('Hotkeys preferences updated', null));
                        } else if (result.data && result.data.Error) {
                            notification.error(result.data.Error);
                        }
                    })
            );
        };

        $scope.deleteAccount = () => {
            deleteAccountModal.activate({
                params: {
                    close() {
                        deleteAccountModal.deactivate();
                    }
                }
            });
        };

        function setEmailingValues(value = 0) {
            _.each(EMAILING_KEYS, (key, index) => {
                $scope.emailing[key] = !!(value & (1 << index));
            });
        }

        function getEmailingValue() {
            return _.reduce(EMAILING_KEYS, (acc, key, index) => (acc + ($scope.emailing[key] << index)), 0);
        }

        $scope.changeEmailing = () => {
            const News = getEmailingValue();
            const successMessage = gettextCatalog.getString('Emailing preference updated', null, 'Success');

            const promise = settingsApi.setNews({ News })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        authentication.user.News = News;
                        return Promise.resolve();
                    }
                    throw new Error(data.Error);
                })
                .then(() => notification.success(successMessage));
            networkActivityTracker.track(promise);
        };
    });
