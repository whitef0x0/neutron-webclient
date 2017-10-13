angular.module('proton.commons')
    .factory('networkActivityTracker', (errorReporter, $rootScope, notification, dedentTpl) => {

        let promises = [];

        /**
     * Dispatch an action in order to toggle the activityTracker component
     *     - To show: 'load'
     *     - To hide: 'close'
     * @param  {String} action
     * @return {void}
     */
        const dispatch = (action) => $rootScope.$emit('networkActivity', action);

        /**
     * Check if we have some promises currently running
     * User to display the loading state
     */
        const loading = () => !_.isEmpty(promises);

        /**
     * Format error message displayed with more informations
     *     - message: main message
     *     - Code: code coming from the API
     *     - Original: original message (ex: from composer)
     * @param  {Error} error
     * @return {Error}
     */
        const formatError = (error = {}) => {

            if (!error.originalMessage) {
                return error;
            }

            return dedentTpl`
            >>> ${error.message}
            Code: ${error.code}
            Original: ${error.originalMessage},
            Stack: ${error.stack}
        `;
        };

        /**
     * Track promise to catch event around
     * @param {object} promise - Promise tracker
     * @return {object} promise - Return the orginal promise to stay in the same context
     */
        const track = (promise) => {
            errorReporter.clear();

            // Display the loader
            if (!promises.length) {
                dispatch('load');
            }

            promises = _.union(promises, [promise]);

            promise.catch((error) => {

                console.error(formatError(error));

                if (angular.isString(error)) {
                    notification.error(error);
                }

                if (angular.isObject(error) && !error.noNotify) {
                    let message;

                    if (error.message) {
                        message = error.message;
                    } else if (error.Error) {
                        message = error.Error;
                    } else if (error.error_description) {
                        message = error.error_description;
                    } else {
                        message = 'An error has occurred. <br> Please try again or refresh the page.';
                    }

                    if (message !== 'loginPassword:cancel') {
                        notification.error(message);
                    }


                    return Promise.reject(error);
                }
            });

            function cleanup() {
                promises = _.without(promises, promise);

                // Nothing in the queue hide the loader
                if (!promises.length) {
                    dispatch('close');
                }
            }

            // Do not use finally, not part of ES6
            promise.then(cleanup, cleanup);

            return promise;
        };


        const clear = () => {
            errorReporter.clear();
            promises.length = 0;
            return promises;
        };

        return { loading, clear, track, dispatch };
    });
