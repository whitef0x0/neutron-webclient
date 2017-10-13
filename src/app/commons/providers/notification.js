angular.module('proton.commons')
    .provider('notification', function notificationProvider() {

        const CONFIG = {
            classNames: {
                error: 'notification-danger',
                success: 'notification-success',
                info: 'notification-info'
            }
        };


        this.typeClasses = (config = {}) => _.extend(CONFIG.classNames, config);
        this.duration = (value = 6000) => (CONFIG.duration = value);
        this.template = (value = '') => (CONFIG.template = value);

        this.$get = ['notify', (notify) => {

            const action = (type) => (input, options = {}) => {

                const message = (input instanceof Error) ? input.message : input;
                options.classes = `${options.classes || ''} ${CONFIG.classNames[type]}`.trim();
                (type === 'error') && (options.duration = 10000);

                notify(_.extend({ message }, options));
            };

            const config = {
                position: 'center',
                maximumOpen: 5,
                duration: 6000
            };

            CONFIG.template && (config.templateUrl = CONFIG.template);

            notify.config(config);

            return {
                success: action('success'),
                error: action('error'),
                info: action('info')
            };
        }];
    });
