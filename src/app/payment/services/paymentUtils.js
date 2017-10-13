angular.module('proton.payment')
    .factory('paymentUtils', (gettextCatalog, aboutClient, paymentModel, $state) => {
        const I18N = {
            cash: gettextCatalog.getString('Cash', null, 'Payment method'),
            card: gettextCatalog.getString('Credit Card', null, 'Payment method')
        };
        const cardNumber = ({ Last4 = '' } = {}) => `•••• •••• •••• ${Last4}`;
        const formatMethods = (methods = []) => {
            return methods.map(({ ID = '', Details = {} }) => ({
                ID, label: cardNumber(Details),
                value: 'use.card'
            }));
        };

        /**
         * Get the list of payment methods for the user
         * Return the selected method:
         *     - card (first one) if no payment methods for the user
         *     - 1st payment method if the user has custom payment methods
         * @param  {Array} config.methods custom list default -> API methods
         * @param  {String} config.choice custom selected choice
         * @return {Object}         { selected, list }
         */
        const generateMethods = ({ methods = paymentModel.get('methods'), choice, Cycle = 12, Amount, modal = '' } = {}) => {
            const list = [{
                value: 'card',
                label: I18N.card
            }];

            // Min amount to activate it if monthly is 50
            const isMonthlyValid = (Amount > 5000 && Cycle === 1);
            const isInvoiceModal = modal === 'invoice';
            // Paypal doesn't work with IE11. For the payment modal we cannot pay monthly via paypal
            if (!aboutClient.isIE11() && (Cycle === 12 || isMonthlyValid || isInvoiceModal)) {
                list.push({
                    label: 'PayPal',
                    value: 'paypal'
                });
            }

            if (!$state.is('signup')) {
                list.push({
                    value: 'bitcoin',
                    label: 'Bitcoin'
                });

                list.push({
                    value: 'cash',
                    label: I18N.cash
                });
            }


            let selected = list[0];

            if ((methods || []).length) {
                const size = list.length;
                list.push(...formatMethods(methods));
                selected = list[size];
            }

            if (choice) {
                selected = _.findWhere(list, { value: choice });
            }

            return { list, selected };
        };

        return { generateMethods };
    });
