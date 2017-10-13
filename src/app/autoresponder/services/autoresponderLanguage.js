angular.module('proton.autoresponder')
    .factory('autoresponderLanguage', (gettextCatalog) => {


        const AUTORESPONDER_UPDATED_MESSAGE = gettextCatalog.getString('Autoresponder updated', null, 'Success');
        const AUTORESPONDER_INSTALLED_MESSAGE = gettextCatalog.getString('Autoresponder installed', null, 'Success');
        const AUTORESPONDER_REMOVED_MESSAGE = gettextCatalog.getString('Autoresponder removed', null, 'Success');

        // Not translated: it's not editable, foreign people doing international business wouldn't want it to be translated
        // if we make it editable we can translate it again.
        const DEFAULT_SUBJECT_PREFIX = 'Auto';
        const DEFAULT_BODY = gettextCatalog.getString(
            '<div>I\'m out of the office with limited access to my email.</div>', null, 'Default autoresponder message without signature (no regards, etcetera)');


        const DURATION_FOREVER = gettextCatalog.getString('Permanent', null, 'Duration/repetition of autoresponder');
        const DURATION_FIXED = gettextCatalog.getString('Fixed duration', null, 'Duration/repetition of autoresponder');
        const DURATION_DAILY = gettextCatalog.getString('Repeat daily', null, 'Duration/repetition of autoresponder');
        const DURATION_WEEKLY = gettextCatalog.getString('Repeat weekly', null, 'Duration/repetition of autoresponder');
        const DURATION_MONTHLY = gettextCatalog.getString('Repeat monthly', null, 'Duration/repetition of autoresponder');

        return { AUTORESPONDER_UPDATED_MESSAGE,
            AUTORESPONDER_INSTALLED_MESSAGE,
            AUTORESPONDER_REMOVED_MESSAGE,
            DEFAULT_SUBJECT_PREFIX,
            DEFAULT_BODY,
            DURATION_FOREVER,
            DURATION_FIXED,
            DURATION_DAILY,
            DURATION_WEEKLY,
            DURATION_MONTHLY };
    });
