angular.module('proton.payment')
    .directive('bitcoinView', (paymentBitcoinModel, $rootScope, CONSTANTS) => {

        const { MIN_BITCOIN_AMOUNT } = CONSTANTS;

        paymentBitcoinModel.load();

        return {
            scope: {
                amount: '=',
                currency: '='
            },
            replace: true,
            templateUrl: 'templates/payment/bitcoinView.tpl.html',
            link(scope, el, { type = 'payment' }) {

                el[0].classList.add(`bitcoinView-type-${type}`);

                const load = () => {
                    $rootScope.$emit('payment', {
                        type: 'bitcoin.submit',
                        data: {
                            type,
                            amount: scope.amount,
                            currency: scope.currency
                        }
                    });
                };

                const onClickReload = ({ target }) => {
                    if (target.classList.contains('bitcoinView-btn-reload')) {
                        load();
                    }
                };

                el.on('click', onClickReload);

                const unsubscribe = $rootScope.$on('payment', (e, { type }) => {
                    if (type === 'bitcoin.success') {
                        scope.$applyAsync(() => {
                            scope.isBitcoin = true;
                        });
                    }

                    if (type === 'bitcoin.error') {
                        scope.$applyAsync(() => {
                            scope.isBitcoinError = true;
                        });
                    }
                    if (type === 'bitcoin.validator.error') {
                        scope.$applyAsync(() => {
                            scope.hasValidationsError = true;
                            scope.validator = {
                                amountMin: MIN_BITCOIN_AMOUNT
                            };
                        });
                    }
                });

                load();

                scope.$on('$destroy', () => {
                    unsubscribe();
                    el.off('click', onClickReload);
                });
            }
        };
    });
