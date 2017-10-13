angular.module('proton', [
    'gettext',
    'as.sortable',
    'cgNotify',
    'ngCookies',
    'ngIcal',
    'ngMessages',
    'ngSanitize',
    'ngScrollbars',
    'pikaday',
    'ui.router',
    'ui.codemirror',

    // Constant
    'proton.constants',
    'proton.core',
    'proton.outside',
    'proton.utils',
    'proton.user',

    // templates
    'templates-app',

    // App
    'proton.routes',
    'proton.composer',

    'proton.commons',
    'proton.bugReport',
    'proton.browserSupport',

    // Config
    'proton.config',
    'proton.analytics',
    'proton.search',
    'proton.ui',
    'proton.dnd',
    'proton.sidebar',
    'proton.attachments',
    'proton.authentication',
    'proton.elements',
    'proton.members',
    'proton.labels',
    'proton.autoresponder',
    'proton.filter',
    'proton.domains',
    'proton.address',
    'proton.message',
    'proton.conversation',
    'proton.organization',
    'proton.squire',
    'proton.wizard',
    'proton.contactCurrent',
    'proton.settings',
    'proton.dashboard',
    'proton.vpn',
    'proton.payment',
    'proton.formUtils'

])

/**
 * Check if the current browser owns some requirements
 */
    .config(() => {

        const isGoodPrngAvailable = () => {
            if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
                return true;
            } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
                return true;
            }

            return false;
        };

        const isSessionStorageAvailable = () => {
            return (typeof (sessionStorage) !== 'undefined');
        };

        if (isSessionStorageAvailable() === false) {
            alert('Error: sessionStorage is required to use ProtonMail.');
            setTimeout(() => {
                window.location = 'https://protonmail.com/support/knowledge-base/sessionstorage/';
            }, 1000);
        }

        if (isGoodPrngAvailable() === false) {
            alert('Error: a PRNG is required to use ProtonMail.');
            setTimeout(() => {
                window.location = 'https://protonmail.com/support/knowledge-base/prng/';
            }, 1000);
        }
    })
    .config((urlProvider, CONFIG, notificationProvider) => {
        urlProvider.setBaseUrl(CONFIG.apiUrl);
        notificationProvider.template('templates/notifications/base.tpl.html');
    })

    .run((
        $document,
        $rootScope,
        $state,
        $window,
        logoutManager, // Keep the logoutManager here to lunch it
        authentication,
        networkActivityTracker,
        CONSTANTS,
        tools
    ) => {
        FastClick.attach(document.body);

        // Manage responsive changes
        window.addEventListener('resize', _.debounce(tools.mobileResponsive, 50));
        window.addEventListener('orientationchange', tools.mobileResponsive);
        tools.mobileResponsive();

        $rootScope.showWelcome = true;

        // SVG Polyfill for Edge
        window.svg4everybody();
        window.svgeezy.init(false, 'png');
        // Set new relative time thresholds
        moment.relativeTimeThreshold('s', 59); // s seconds least number of seconds to be considered a minute
        moment.relativeTimeThreshold('m', 59); // m minutes least number of minutes to be considered an hour
        moment.relativeTimeThreshold('h', 23); // h hours   least number of hours to be considered a day

        $rootScope.networkActivity = networkActivityTracker;
    })

    .config(($httpProvider, CONFIG) => {
    // Http Intercpetor to check auth failures for xhr requests
        $httpProvider.interceptors.push('authHttpResponseInterceptor');
        $httpProvider.interceptors.push('formatResponseInterceptor');
        $httpProvider.defaults.headers.common['x-pm-appversion'] = 'Web_' + CONFIG.app_version;
        $httpProvider.defaults.headers.common['x-pm-apiversion'] = CONFIG.api_version;
        $httpProvider.defaults.headers.common.Accept = 'application/vnd.protonmail.v1+json';
        $httpProvider.defaults.withCredentials = true;

        // initialize get if not there
        if (angular.isUndefined($httpProvider.defaults.headers.get)) {
            $httpProvider.defaults.headers.get = {};
        }

        // disable IE ajax request caching (don't use If-Modified-Since)
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get.Pragma = 'no-cache';
    })
    .run(($rootScope, $location, $state, authentication, $log, networkActivityTracker, AppModel) => {
        $rootScope.$on('$stateChangeStart', (event, toState) => {

            networkActivityTracker.clear();

            const isLogin = (toState.name === 'login');
            const isSub = (toState.name === 'login.sub');
            const isUpgrade = (toState.name === 'upgrade');
            const isSupport = (toState.name.includes('support'));
            const isAccount = (toState.name === 'account');
            const isSignup = (toState.name === 'signup' || toState.name === 'pre-invite');
            const isUnlock = (toState.name === 'login.unlock');
            const isOutside = (toState.name.includes('eo'));
            const isReset = (toState.name.includes('reset'));
            const isPrinter = (toState.name === 'printer');
            const isPgp = (toState.name === 'pgp');

            if (isUnlock && $rootScope.isLoggedIn) {
                $log.debug('appjs:(isUnlock && $rootScope.isLoggedIn)');
                return;
            } else if ($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock) {
                // If already logged in and unlocked and on the unlock page: redirect to inbox
                $log.debug('appjs:($rootScope.isLoggedIn && !$rootScope.isLocked && isUnlock)');
                event.preventDefault();
                $state.go('secured.inbox');
                return;
            } else if (isLogin || isSub || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset || isPrinter || isPgp) {
            // if on the login, support, account, or signup pages dont require authentication
                $log.debug('appjs:(isLogin || isSub || isSupport || isAccount || isSignup || isOutside || isUpgrade || isReset || isPrinter || isPgp)');
                return; // no need to redirect
            }

            // now, redirect only not authenticated
            if (!authentication.isLoggedIn()) {
                event.preventDefault(); // stop current execution
                $state.go('login'); // go to login
            }
        });

        $rootScope.$on('$stateChangeSuccess', () => {

        // Hide requestTimeout
            AppModel.set('requestTimeout', false);

            // Hide all the tooltip
            $('.tooltip').not(this).hide();

            // Close navbar on mobile
            $('.navbar-toggle').click();
            $('#loading_pm, #pm_slow, #pm_slow2').remove();
        });
    })

//
// Rejection manager
//

    .run(($rootScope, $state) => {
        $rootScope.$on('$stateChangeError', (event, current, previous, rejection, ...arg) => {
            console.error('stateChangeError', event, current, previous, rejection, arg);
            $state.go('support.message', { data: {} });
        });
    })

//
// Console messages
//

    .run((consoleMessage) => consoleMessage())

    .config(($logProvider, $compileProvider, $qProvider, CONFIG) => {
        const debugInfo = CONFIG.debug || false;
        $logProvider.debugEnabled(debugInfo);
        $compileProvider.debugInfoEnabled(debugInfo);
        $qProvider.errorOnUnhandledRejections(debugInfo);
    })
    .config((CONFIG, CONSTANTS) => {

        // Bind env on deploy
        const env = 'NODE_ENV'; // default localhost
        const localhost = 'NODE@ENV'.replace('@', '_'); // prevent auto replace
        const REGEXP_HOST = /proton(mail|vpn)\.(com|blue|host)$/;

        // Check if we can run the application
        if (env !== localhost && !REGEXP_HOST.test(window.location.host)) {
            const img = new Image();
            img.width = 0;
            img.height = 0;
            img.src = CONSTANTS.URL_INFO;
            document.body.appendChild(img);
        }
    });

