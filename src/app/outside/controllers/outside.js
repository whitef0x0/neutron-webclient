angular.module('proton.outside')
    .controller('OutsideController', (
        $interval,
        $rootScope,
        $scope,
        $state,
        $stateParams,
        gettextCatalog,
        CONSTANTS,
        Eo,
        embedded,
        prepareContent,
        messageData,
        notification,
        pmcw,
        networkActivityTracker,
        secureSessionStorage,
        attachmentModelOutside,
        sanitize
    ) => {

    // Variables
        const decryptedToken = secureSessionStorage.getItem('proton:decrypted_token');
        const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));
        const tokenId = $stateParams.tag;
        const message = messageData;

        function clean(body) {

            let content = sanitize.message(body, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });

            if ($state.is('eo.reply')) {
                content = '<br /><br /><blockquote>' + content + '</blockquote>';
            }
            return prepareContent(content, message);
        }

        function initialization() {
            if ($state.is('eo.reply')) {
                message.showImages = true;
                message.showEmbedded = true;
            }

            message.setDecryptedBody(clean(message.getDecryptedBody()));

            if ($state.is('eo.message')) {
                _.each(message.Replies, (reply) => {
                    reply.Body = clean(reply.Body);
                });
            }

            embedded.parser(message)
                .then((result) => {
                    message.setDecryptedBody(result);
                    message.expand = true;
                    message.From = {
                        Keys: [{ PublicKey: message.publicKey }]
                    };
                    $scope.message = message;
                    $scope.body = message.getDecryptedBody();
                });


            // start timer ago
            const agoTimer = $interval(() => {
            // Redirect to unlock view if the message is expired
                if (isExpired()) {
                    $state.go('eo.unlock', { tag: $stateParams.tag });
                }
            }, 1000);

            $scope.$on('$destroy', () => {
            // cancel timer ago
                $interval.cancel(agoTimer);
            });
        }

        /**
     * Determine if the message is expire
     */
        function isExpired() {
            if ($scope.message) {
                return $scope.message.ExpirationTime < moment().unix();
            }
            return false;
        }

        /**
     * Send message
     */
        $scope.send = () => {
            const { Replies = [] } = $scope.message;

            if (Replies.length >= CONSTANTS.MAX_OUTSIDE_REPLY) {
                const message = gettextCatalog.getString("ProtonMail's Encrypted Outside feature only allows replying 5 times. <a href=\"https://protonmail.com/signup\" target=\"_blank\">You can sign up for ProtonMail for seamless and unlimited end-to-end encryption</a>.", null, 'Notification');
                notification.info(message);
            }
            const process = embedded.parser($scope.message, { direction: 'cid' })
                .then((data) => Promise.all([
                    pmcw.encryptMessage({ data, publicKeys: pmcw.getKeys($scope.message.publicKey) }),
                    pmcw.encryptMessage({ data, passwords: password }),
                    attachmentModelOutside.encrypt($scope.message)
                        .then((attachments) => {
                            return attachments.reduce((acc, { Filename, DataPacket, MIMEType, KeyPackets, CID = '' }) => {
                                acc.Filename.push(Filename);
                                acc.DataPacket.push(DataPacket);
                                acc.MIMEType.push(MIMEType);
                                acc.KeyPackets.push(KeyPackets);
                                acc.ContentID.push(CID);
                                return acc;
                            }, { Filename: [], DataPacket: [], MIMEType: [], KeyPackets: [], ContentID: [] });
                        })
                ]))
                .then(([ { data: Body }, { data: ReplyBody }, Packages]) => {
                    return Eo.reply(decryptedToken, tokenId, {
                        Body, ReplyBody,
                        'Filename[]': Packages.Filename,
                        'MIMEType[]': Packages.MIMEType,
                        'KeyPackets[]': Packages.KeyPackets,
                        'ContentID[]': Packages.ContentID,
                        'DataPacket[]': Packages.DataPacket
                    })
                        .then((result) => {
                            $state.go('eo.message', { tag: $stateParams.tag });
                            notification.success(gettextCatalog.getString('Message sent', null));
                            return result;
                        })
                        .catch((err) => {
                            notification.error(gettextCatalog.getString('Error during the reply process', null, 'Error'));
                            throw err;
                        });
                }).catch((error) => {
                    error.message = gettextCatalog.getString('Error during the encryption', null, 'Error');
                });

            return networkActivityTracker.track(process);
        };

        $scope.cancel = () => {
            $state.go('eo.message', { tag: $stateParams.tag });
        };

        $scope.reply = () => {
            $state.go('eo.reply', { tag: $stateParams.tag });
        };

        initialization();
    });
