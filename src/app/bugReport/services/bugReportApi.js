angular.module('proton.bugReport')
    .factory('bugReportApi', (Bug, CONFIG, $state, aboutClient, authentication, gettextCatalog, networkActivityTracker, notification) => {
        const LAYOUTS = ['column', 'row'];
        const MODES = ['conversation', 'message'];

        /**
         * Generate the configuration for the main form
         * @return {Object}
         */
        const getForm = () => {
            const { Name = '', Addresses = [], ViewLayout = '', ViewMode = '' } = authentication.user;
            const [{ Email = '' } = {}] = _.sortBy(Addresses, 'Order');
            return {
                OS: aboutClient.getOS(),
                OSVersion: '',
                DisplayMode: angular.isNumber(ViewLayout) ? LAYOUTS[ViewLayout] : '',
                ViewMode: angular.isNumber(ViewMode) ? MODES[ViewMode] : '',
                Resolution: `${window.innerHeight} x ${window.innerWidth}`,
                Browser: aboutClient.getBrowser(),
                BrowserVersion: aboutClient.getBrowserVersion(),
                Client: 'Angular',
                ClientVersion: CONFIG.app_version,
                Title: `[Angular] Bug [${$state.$current.name}]`,
                Description: '',
                Username: Name,
                Email,
                attachScreenshot: false
            };
        };


        /**
         * Take a screenshot of the current state when we open the modal
         * @return {Promise}   resolve data is the image as a base64 string
         */
        const takeScreenshot = () => new Promise((resolve) => {
            if (!window.html2canvas) {
                return resolve();
            }

            window.html2canvas(document.body, {
                onrendered(canvas) {
                    try {
                        resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
                    } catch (e) {
                        resolve(canvas.toDataURL().split(',')[1]);
                    }
                }
            });
        });

        /**
         * Send the form to the server
         * @param  {Object} form FormData from the user
         * @return {Promise}
         */
        const send = (form) => {
            return Bug.report(form)
                .then(() => notification.success(gettextCatalog.getString('Bug reported', null)));
        };

        /**
         * Create a new report, upload the screenshot if we have to then send;
         * @param  {Object} form       FormData from the user
         * @param  {String} screenshot Screenshot as a base64
         * @return {Promise}
         */
        const report = (form, screenshot) => {
            let promise;
            if (form.attachScreenshot) {
                promise = Bug.uploadScreenshot(screenshot, form)
                    .then(send);
            } else {
                promise = send(form);
            }
            networkActivityTracker.track(promise);
            return promise;
        };

        return { getForm, takeScreenshot, report };
    });
