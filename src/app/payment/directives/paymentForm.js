angular.module('proton.payment')
    .directive('paymentForm', (notification, gettextCatalog, eventManager, cardModel, paymentModel, paymentUtils, dashboardModel, organizationModel, paymentModalModel, $rootScope, CONSTANTS) => {

        const { PLANS_TYPE } = CONSTANTS;

        const dispatcher = (plan) => (type, data = {}) => {
            $rootScope.$emit('modal.payment', {
                type,
                data: _.extend({ plan }, data)
            });
        };

        /**
         * Extract the name of the addon, ex 1gb -> space
         * to have human friendly keys for the template
         * @param  {String} name Addon's name
         * @return {String}
         */
        const getTypeAddon = (name) => {
            const [, match ] = name.match(/\d+(\w+)/) || [];
            if (match === 'gb') {
                return 'space';
            }
            return match;
        };

        const updateKey = (acc, key, value = 0) => acc[key] = (acc[key] ? acc[key] + value : value);

        const formatPlanMap = (plans = []) => {
            return plans.reduce((acc, plan) => {
                if (plan.ID) { // ID is not defined for free
                    acc[plan.ID] = plan;
                }
                return acc;
            }, Object.create(null));
        };

        const getPlanTotal = (list, map) => {
            const plans = list.map((ID) => map[ID]);

            // Compute how many addons
            const total = plans.reduce((acc, plan) => {
                updateKey(acc, 'MaxSpace', plan.MaxSpace);
                updateKey(acc, 'MaxMembers', plan.MaxMembers);
                updateKey(acc, 'MaxDomains', plan.MaxDomains);
                updateKey(acc, 'MaxAddresses', plan.MaxAddresses);
                return acc;
            }, Object.create(null));

            // Compute price /addon
            const price = plans
                .filter(({ Type }) => Type === PLANS_TYPE.ADDON)
                .reduce((acc, { Name, Amount }) => {
                    const type = getTypeAddon(Name);
                    updateKey(acc, type, Amount);
                    return acc;
                }, { space: 0, member: 0, domain: 0, address: 0 });

            return { total, price };
        };

        return {
            scope: {
                ctrl: '='
            },
            replace: true,
            templateUrl: 'templates/payment/paymentForm.tpl.html',
            link(scope, el) {
                const ctrl = scope.ctrl;
                const params = paymentModalModel.get();
                const dispatch = dispatcher(params.plan);

                ctrl.card = {};
                ctrl.cancel = params.cancel;
                ctrl.valid = params.valid;

                if (params.valid.Coupon) {
                    ctrl.displayCoupon = true;
                    ctrl.coupon = params.valid.Coupon.Code;
                }

                // @todo Improve the API to provide a CACHE ˜= labelsModel
                const planList = dashboardModel.query(params.valid.Currency, params.valid.Cycle);

                const PLANS_MAP = formatPlanMap(planList);
                const MAP_TOTAL = getPlanTotal(params.planIDs, PLANS_MAP);

                ctrl.plans = _.uniq(params.planIDs).map((ID) => PLANS_MAP[ID]);
                ctrl.step = 'payment';

                const { list, selected } = paymentUtils.generateMethods({
                    choice: params.choice,
                    Cycle: params.valid.Cycle,
                    Amount: params.valid.AmountDue
                });
                ctrl.methods = list;
                ctrl.method = selected;
                ctrl.status = paymentModel.get('status'); // move out

                ctrl.count = (type) => MAP_TOTAL.total[type];
                ctrl.price = (type) => MAP_TOTAL.price[type];

                ctrl.paypalCallback = (config) => {
                    ctrl.paypalConfig = config;
                    ctrl.submit();
                };

                const getParameters = () => {

                    const parameters = {
                        Amount: ctrl.valid.AmountDue,
                        Currency: ctrl.valid.Currency,
                        CouponCode: ctrl.coupon,
                        PlanIDs: params.planIDs
                    };

                    if (!ctrl.valid.AmountDue) {
                        return parameters;
                    }

                    if (ctrl.method.value === 'use.card') {
                        parameters.PaymentMethodID = ctrl.method.ID;
                    }

                    if (ctrl.method.value === 'card') {
                        parameters.Payment = {
                            Type: 'card',
                            Details: cardModel(ctrl.card).details()
                        };
                    }

                    if (ctrl.method.value === 'paypal') {
                        parameters.Payment = {
                            Type: 'paypal',
                            Details: ctrl.paypalConfig
                        };
                    }

                    return parameters;
                };

                const finish = () => {
                    ctrl.step = 'thanks';
                    dispatch('process.success');
                };

                ctrl.submit = () => {
                    ctrl.step = 'process';

                    paymentModel.subscribe(getParameters())
                        .then(organizationModel.create)
                        .then(eventManager.call)
                        .then(finish)
                        .catch((error) => {
                            notification.error(error);
                            ctrl.step = 'payment';
                        });
                };

                ctrl.apply = () => {
                    paymentModel.addCoupon({
                        Currency: params.valid.Currency,
                        Cycle: params.valid.Cycle,
                        CouponCode: ctrl.coupon,
                        PlanIDs: params.planIDs
                    })
                        .then((data) => ctrl.valid = data)
                        .then(() => {
                            // If the amount due is null we select the first choice to display the submit button
                            if (!ctrl.valid.AmountDue) {
                                return ctrl.method = ctrl.methods[0];
                            }
                            // If the current payment method is 'paypal' or 'bitcoin' we need to reload the component to match with the new amount
                            if (ctrl.method.value === 'paypal' || ctrl.method.value === 'bitcoin') {
                                const currentMethod = ctrl.method.value;

                                ctrl.method.value = '';

                                _rAF(() => {
                                    scope.$applyAsync(() => {
                                        ctrl.method.value = currentMethod;
                                    });
                                });
                            }
                        });
                };

                const onClick = ({ target }) => {

                    if (target.classList.contains('paymentForm-btn-payAnnualy')) {
                        dispatch('switch', {
                            type: 'cycle',
                            Currency: params.valid.Currency,
                            Cycle: 12
                        });
                    }
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.on('click', onClick);
                });
            }
        };
    });
