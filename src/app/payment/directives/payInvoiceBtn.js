angular.module('proton.payment')
    .directive('payInvoiceBtn', (gettextCatalog, Payment, paymentModel, payModal, networkActivityTracker, notification) => {

        const I18N = {
            message: gettextCatalog.getString('Pay', null, 'Action'),
            notAvailable: gettextCatalog.getString('Payments are currently not available, please try again later', null, 'Info')
        };

        const checkInvoice = ({ ID } = {}) => {
            return Payment.check(ID)
                .then(({ data }) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                });
        };

        return {
            replace: true,
            scope: {
                model: '='
            },
            template: `<button class="payInvoiceBtn-container pm_button link">${I18N.message}</button>`,
            link(scope, el) {

                const onClick = () => {

                    if (!paymentModel.canPay()) {
                        return notification.info(I18N.notAvailable);
                    }

                    const promise = checkInvoice(scope.model)
                        .then((checkInvoice) => {
                            payModal.activate({
                                params: {
                                    invoice: angular.copy(scope.model),
                                    checkInvoice,
                                    close(result) {
                                        payModal.deactivate();
                                        if (result === true) {
                                            // Set invoice state to PAID
                                            scope.model.State = 1;
                                        }
                                    }
                                }
                            });
                        });

                    networkActivityTracker.track(promise);

                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            }
        };
    });
