angular.module('proton.message')
    .factory('transformRemote', ($state, $rootScope, authentication, CONSTANTS) => {

        const ATTRIBUTES = ['url', 'xlink:href', 'srcset', 'src', 'svg', 'background', 'poster'].map((name) => `proton-${name}`);

        const REGEXP_FIXER = (() => {
            const str = ATTRIBUTES.map((key) => {
                if (key === 'proton-src') {
                    return `${key}=(?!"cid)`;
                }
                return key;
            }).join('|');
            return `(${str})`;
        })();

        /**
     * Find inside the current parser DOM every content escaped
     * and build a list of Object <attribute>:<value> but don't parse them if
     * it is an embedded content.
     * As we have many differents attributes we create a list
     * @param  {Node} html parser
     * @return {Array}
     */
        function prepareInjection(html) {
        // Query selector
            const selector = ATTRIBUTES.map((attr) => {
                const [ key ] = attr.split(':');
                return `[${key}]`;
            })
                .join(', ');

            /**
         * Create a map of every proton-x attribute and its value
         * @param  {Node} node Current element
         * @return {Object}
         */
            const mapAttributes = (node) => {
                return _.chain(node.attributes)
                    .filter((attr) => ATTRIBUTES.indexOf(attr.name) !== -1)
                    .reduce((acc, attr) => (acc[`${attr.name}`] = attr.value, acc), {})
                    .value();
            };

            const $list = [].slice.call(html.querySelectorAll(selector));

            // Create a list containing a map of every attributes (proton-x) per node
            const attributes = $list.reduce((acc, node) => {
                if (node.hasAttribute('proton-src')) {
                    const src = node.getAttribute('proton-src');

                    // We don't want to unescape attachments as we are going to proces them later
                    if (src.indexOf('cid:') !== -1) {
                        return acc;
                    }
                }
                acc.push(mapAttributes(node));
                return acc;
            }, []);

            return attributes;
        }

        return (html, message, { action }) => {

            const user = authentication.user || { ShowImages: 0 };
            const showImages = message.showImages || user.ShowImages || (CONSTANTS.WHITELIST.indexOf(message.Sender.Address) !== -1 && !message.IsEncrypted) || $state.is('printer');
            const content = html.innerHTML;

            // Bind the boolean only if there are something
            if (new RegExp(REGEXP_FIXER, 'g').test(content)) {
                message.showImages = showImages;
            }

            if (showImages) {
                html.innerHTML = content.replace(new RegExp(REGEXP_FIXER, 'g'), (match, $1) => $1.substring(7));

                // If load:manual we use a custom directive to inject the content
                if (action === 'user.inject') {
                    const list = prepareInjection(html, content, action);
                    const hasSVG = /svg/.test(html.innerHTML);
                    if (list.length || hasSVG) {
                        $rootScope.$emit('message.open', {
                            type: 'remote.injected',
                            data: { action, list, message, hasSVG }
                        });
                    }
                }
            }
            return html;
        };
    });
