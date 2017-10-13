angular.module('proton.message')
    .factory('messageModel', ($q, $timeout, pmcw, User, gettextCatalog, authentication, AttachmentLoader, sanitize) => {
        const defaultMessage = {
            ID: '',
            Order: 0,
            Subject: '',
            PasswordHint: '',
            IsRead: 0,
            Type: 0,
            Sender: {},
            ToList: [],
            Time: 0,
            Size: 0,
            Attachments: [],
            NumAttachments: 0,
            IsEncrypted: 0,
            ExpirationTime: 0,
            IsReplied: 0,
            IsRepliedAll: 0,
            IsForwarded: 0,
            AddressID: '',
            CCList: [],
            BCCList: [],
            LabelIDs: [],
            ExternalID: null
        };
        const encryptionTypes = [
            gettextCatalog.getString('Unencrypted message', null),
            gettextCatalog.getString('End to end encrypted internal message', null),
            gettextCatalog.getString('External message stored encrypted', null),
            gettextCatalog.getString('End to end encrypted for outside', null),
            gettextCatalog.getString('External message stored encrypted', null),
            gettextCatalog.getString('Stored encrypted', null),
            gettextCatalog.getString('End to end encrypted for outside reply', null),
            gettextCatalog.getString('End to end encrypted using PGP', null),
            gettextCatalog.getString('End to end encrypted using PGP/MIME', null),
            null /* reserved */,
            gettextCatalog.getString('End to end encrypted auto-reply', null)
        ];
        const emptyMessage = gettextCatalog.getString('Message empty', null, 'Message content if empty');

        class Message {


            constructor(msg) {
                _.extend(this, angular.copy(msg));


                const autoreplyHeaders = ['X-Autoreply', 'X-Autorespond', 'X-Autoreply-From', 'X-Mail-Autoreply'];
                const { ParsedHeaders = {} } = msg;
                this.isAutoReply = autoreplyHeaders.some((header) => header in ParsedHeaders);

                return this;
            }
            isDraft() {
                return this.Type === 1;
            }

            generateReplyToken() {
            // Use a base64-encoded AES256 session key as the reply token
                return pmcw.encode_base64(pmcw.arrayToBinaryString(pmcw.generateSessionKey('aes256')));
            }

            encryptionType() {
                return encryptionTypes[this.IsEncrypted];
            }

            isPlainText() {
                return this.MIMEType === 'text/plain';
            }

            plainText() {
                return this.getDecryptedBody();
            }

            disableOthers() {
                return (this.saving && !this.autosaving) || this.sending || this.encrypting || this.askEmbedding;
            }

            disableSend() {
                return this.uploading > 0 || this.disableOthers();
            }

            disableSave() {
                return this.disableSend();
            }
            disableDiscard() {
                return this.disableSend();
            }

            getAttachment(ID) {
                return _.findWhere(this.Attachments || [], { ID });
            }

            getAttachments() {
                return this.Attachments || [];
            }

            attachmentsSize() {
                return (this.Attachments || [])
                    .reduce((acc, { Size = 0 } = {}) => acc + (+Size), 0);
            }

            countEmbedded() {
                return this.Attachments
                    .filter(({ Headers = {} }) => Headers['content-disposition'] === 'inline')
                    .length;
            }

            addAttachments(list = []) {
                this.Attachments = [].concat(this.Attachments, list);
                this.NumEmbedded = this.countEmbedded();
            }

            removeAttachment({ ID } = {}) {
                this.Attachments = (this.Attachments || [])
                    .filter((att) => att.ID !== ID);
                this.NumEmbedded = this.countEmbedded();
            }

            setDecryptedBody(input = '', purify = true) {
                this.DecryptedBody = !purify ? input : sanitize.message(input);
            }

            getDecryptedBody() {
                return this.DecryptedBody || '';
            }

            getListUnsubscribe() {
                const { ParsedHeaders = {} } = this;
                return ParsedHeaders['List-Unsubscribe'] || '';
            }

            close() {
                if (angular.isDefined(this.timeoutSaving)) {
                    $timeout.cancel(this.timeoutSaving);
                }
            }

            encryptBody(publicKeys) {
                const privateKeys = authentication.getPrivateKeys(this.From.ID)[0];
                return pmcw.encryptMessage({
                    data: this.getDecryptedBody(),
                    publicKeys: pmcw.getKeys(publicKeys),
                    privateKeys,
                    format: 'utf8'
                })
                    .then(({ data }) => (this.Body = data, data))
                    .catch((error) => {
                        error.message = gettextCatalog.getString('Error encrypting message');
                        throw error;
                    });
            }

            parse(content = '') {
                const deferred = $q.defer();
                const mailparser = new MailParser({ defaultCharset: 'UTF-8' });

                mailparser.on('end', (mail) => {
                    const { attachments, text = '', html = '' } = mail;

                    if (attachments) {
                        this.PgpMimeWithAttachments = true; // Used to display an alert on the message view
                    }

                    if (html) {
                        deferred.resolve(html);
                    } else if (text) {
                        this.MIMEType = 'text/plain';
                        deferred.resolve(text);
                    } else {
                        deferred.resolve(emptyMessage);
                    }
                });

                mailparser.write(content);
                mailparser.end();

                return deferred.promise;
            }

            decryptBody() {
                const privateKeys = authentication.getPrivateKeys(this.AddressID);
                const message = pmcw.getMessage(this.Body);

                this.decrypting = true;

                const sender = (this.Sender || {}).Address;

                const getPubKeys = (sender) => {
                    // Sender can be empty
                    // if so, do not look up public key
                    if (!sender) {
                        return Promise.resolve(null);
                    }

                    return this.getPublicKeys([sender])
                        .then(({ data = {} } = {}) => {
                            if (data.Code === 1000 && data[sender].length > 0) {
                                return data[sender];
                            }
                            return null;
                        });
                };

                return getPubKeys(sender)
                    .then((pubKeys) => {
                        return pmcw.decryptMessageLegacy({
                            message,
                            privateKeys,
                            publicKeys: pubKeys ? pmcw.getKeys(pubKeys) : [],
                            messageTime: this.Time
                        }).then((rep) => {
                            this.decrypting = false;

                            if (this.IsEncrypted === 8 || this.MIMEType === 'multipart/mixed') {
                                return this.parse(rep.data)
                                    .then((data) => ({ data }));
                            }
                            return rep;
                        }).catch((error) => {
                            this.decrypting = false;
                            throw error;
                        });
                    });
            }

            encryptAttachmentKeyPackets(publicKeys = [], passwords = []) {
                const packets = {};

                return Promise.all(
                    this.Attachments.map((attachment) => {
                        return AttachmentLoader.getSessionKey(this, attachment)
                            .then(({ sessionKey = {}, AttachmentID, ID } = {}) => {
                                attachment.sessionKey = sessionKey; // Update the ref
                                return pmcw.encryptSessionKey({
                                    data: sessionKey.data,
                                    algorithm: sessionKey.algorithm,
                                    publicKeys: publicKeys.length > 0 ? pmcw.getKeys(publicKeys) : [],
                                    passwords
                                }).then(({ message }) => {
                                    packets[AttachmentID || ID] = pmcw.encode_base64(pmcw.arrayToBinaryString(message.packets.write()));
                                });
                            });
                    })
                )
                    .then(() => packets);
            }

            cleartextAttachmentKeyPackets() {
                const packets = {};

                return Promise.all(
                    this.Attachments.map((attachment) => {
                        return AttachmentLoader.getSessionKey(this, attachment)
                            .then(({ sessionKey = {}, AttachmentID, ID } = {}) => {
                                attachment.sessionKey = sessionKey; // Update the ref
                                packets[AttachmentID || ID] = pmcw.encode_base64(pmcw.arrayToBinaryString(sessionKey.data));
                            });
                    })
                )
                    .then(() => packets);
            }

            cleartextBodyPackets() {
                const privateKeys = authentication.getPrivateKeys(this.AddressID);
                const { asymmetric, encrypted } = pmcw.splitMessage(this.Body);
                const message = pmcw.getMessage(asymmetric[0]);

                return pmcw.decryptSessionKey({ message, privateKeys })
                    .then((sessionKey) => ({ sessionKey, dataPacket: encrypted }));
            }

            emailsToString() {
                const list = [].concat(this.ToList, this.CCList, this.BCCList);
                return _.map(list, ({ Address } = {}) => Address);
            }

            getPublicKeys(emails = []) {
                const base64 = pmcw.encode_base64(emails.filter(Boolean).join(','));
                return User.pubkeys(base64);
            }

            clearTextBody() {
                const deferred = $q.defer();

                if (this.isDraft() || this.IsEncrypted > 0) {
                    if (!this.getDecryptedBody()) {
                        try {
                            this.decryptBody()
                                .then((result) => {
                                    this.setDecryptedBody(result.data, !this.isPlainText());
                                    this.Signature = result.signature;
                                    this.failedDecryption = false;
                                    deferred.resolve(result.data);
                                })
                                .catch((err) => {
                                    this.setDecryptedBody(this.Body, false);
                                    this.failedDecryption = true;

                                    // We need to display the encrypted body to the user if it fails
                                    this.MIMEType = 'text/plain';
                                    deferred.reject(err);
                                });
                        } catch (err) {
                            this.setDecryptedBody(this.Body, false);
                            this.MIMEType = 'text/plain';
                            this.failedDecryption = true;
                            deferred.reject(err);
                        }
                    } else {
                        deferred.resolve(this.getDecryptedBody());
                    }
                } else {
                    this.setDecryptedBody(this.Body, false);
                    deferred.resolve(this.getDecryptedBody());
                }

                return deferred.promise;
            }
        }

        return (m = defaultMessage) => (new Message(m));
    });
