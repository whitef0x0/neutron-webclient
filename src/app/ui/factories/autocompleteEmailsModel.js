angular.module('proton.ui')
    .factory('autocompleteEmailsModel', (authentication, regexEmail, checkTypoEmails, $filter, CONSTANTS) => {

        const {
            OPEN_TAG_AUTOCOMPLETE,
            CLOSE_TAG_AUTOCOMPLETE
        } = CONSTANTS.EMAIL_FORMATING;

        let TEMP_LABELS = {};
        const unicodeTagView = $filter('unicodeTagView');

        const getID = () => `${Math.random().toString(32).slice(2, 12)}-${Date.now()}`;

        /**
         * @{link https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/}
         */
        const htmlEntities = (str = '') => {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        };

        /**
         * Format the label of an address to display both the name and the address
         * @param  {String} Name
         * @param  {String} Email
         * @return {String}
         */
        const formatLabel = (Name, Email) => {
            if (Email === Name || !Name) {
                return Email;
            }

            return `${htmlEntities(Name)} ${OPEN_TAG_AUTOCOMPLETE}${Email}${CLOSE_TAG_AUTOCOMPLETE}`;
        };

        /**
         * Filter the autocomplete list output
         * @param  {Array}   list
         * @param  {String}  value          Default value if there is no autocomplete
         * @param  {Boolean} strictEquality Return exact match
         * @return {Array}
         */
        const filterList = (list = [], value, strictEquality = false) => {
            const col = list.length ? list : [{ label: value, value }];
            return strictEquality ? _.where(col, { value }) : col;
        };

        /**
         * Filter emails from our contacts to find by
         *     - Matching name
         *     - Emails starting with
         *
         * List contains available emails or the new one
         * hasAutocompletion if data are coming from us
         * @param  {String} value
         * @param  {Boolean} strictEquality  Filter the collection via ===
         * @return {Object} {list:Array, show:Boolean}
         */
        const filterContact = (val = '', strictEquality = false) => {

            // Do not lowercase value as it might get used by the UI directy via filterList
            const value = unicodeTagView(val.trim());
            const input = value.toLowerCase();

            const collection = _.chain(authentication.user.Contacts)
                .map(({ Name, Email }) => {
                    const value = Email;
                    const label = formatLabel(Name, Email);
                    return { label, value, Name };
                })
                .filter(({ label }) => label.toLowerCase().includes(input))
                .first(CONSTANTS.AWESOMEPLETE_MAX_ITEMS)
                .value();

            // it creates a map <escaped>:<label> because the lib does not support more keys than label/value and we need the unescaped value #4901
            TEMP_LABELS = collection.reduce((acc, { label, Name }) => (acc[label] = Name, acc), {});

            return {
                list: filterList(collection, value, strictEquality),
                hasAutocompletion: !!collection.length
            };
        };

        /**
         * Format any new email added to the collection
         * @param  {String} label
         * @param  {String} value
         * @return {Object}       {Name, Address}
         */
        const formatNewEmail = (label, value) => {

            // We need to clean the label because the one comming from the autocomplete can contains some unicode
            const cleanLabel = $filter('chevrons')(label);

            // Check if an user paste an email Name <email>
            if (regexEmail.test(cleanLabel)) {
                const [ Name, adr = value ] = cleanLabel
                    .split('<')
                    .map((str = '') => str.trim());

                // If the last > does not exist, keep the email intact
                const Address = (adr.indexOf('>') === (adr.length - 1)) ? adr.slice(0, -1) : adr;

                return { Name, Address };
            }

            return { Name: label.trim(), Address: value.trim() };
        };

        return (previousList = []) => {

            // Prevent empty names if we only have the address (new email, no contact yet for this one)
            let list = angular.copy(previousList)
                .map(({ Address = '', Name = '' }) => ({
                    $id: getID(),
                    Name: Name || Address,
                    Address
                }));

            const all = () => list;
            const clear = () => (list.length = 0);

            /**
             * Add a new contact to the list
             * @param  {String} options.label Label to display
             * @param  {String} options.value Value === email
             * @return {Number}
             */
            const add = ({ label, value } = {}) => {
                const data = formatNewEmail(TEMP_LABELS[label] || label, value);

                // If the mail is not already inside the collection, add it
                if (!list.some(({ Address }) => Address === data.Address)) {
                    list.push(angular.extend({}, data, {
                        $id: getID(),
                        invalid: !regexEmail.test(data.Address) || checkTypoEmails(data.Address)
                    }));
                }
            };

            /**
             * Remove a contact by its address
             * @param  {String} options.Address
             * @return {Array}
             */
            const remove = ({ Address }) => (list = list.filter((item) => item.Address !== Address));

            /**
             * Remove the last contact from the list
             * @return {Array}
             */
            const removeLast = () => (list.pop(), list);

            /**
             * Check if there are contacts inside the collection
             * @return {Boolean}
             */
            const isEmpty = () => !list.length;

            return {
                filterContact,
                formatInput: unicodeTagView,
                all, add, remove, removeLast, isEmpty,
                clear
            };
        };
    });
