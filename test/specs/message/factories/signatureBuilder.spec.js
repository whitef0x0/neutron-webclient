describe('signatureBuilder factory', () => {

    let factory, rootScope, authentication, tools, CONSTANTS, sanitize;
    let userMock = { Signature: '' };
    const message = { getDecryptedBody: angular.noop };
    const CLASS_EMPTY = 'protonmail_signature_block-empty';
    const blockSignature = 'protonmail_signature_block';
    const blockUserSignature = 'protonmail_signature_block-user';
    const blockProtonSignature = 'protonmail_signature_block-proton';
    const noSignatures = `protonmail_signature_block ${CLASS_EMPTY}`;
    const noSignatureUser = `protonmail_signature_block-user ${CLASS_EMPTY}`;
    const noSignatureProton = `protonmail_signature_block-proton ${CLASS_EMPTY}`;
    const USER_SIGNATURE = '<strong>POPOPO</strong>';
    const USER_SIGNATURE2 = '<i>Elle est où Jeanne ???</i>';
    const MESSAGE_BODY = '<p>polo</p>';
    const getMessageUpdate = (user = '', proton = '') => {
        const blockEmpty = (!user && !proton) ? CLASS_EMPTY : '';
        const userEmpty = !user ? CLASS_EMPTY : '';
        const protonEmpty = !proton ? CLASS_EMPTY : '';
        return `<p>polo</p><div><br></div><div><br></div><div class="protonmail_signature_block ${blockEmpty}">
               <div class="protonmail_signature_block-user ${userEmpty}">${user}</div>
               <div class="protonmail_signature_block-proton ${protonEmpty}">${proton}</div>
           </div>`;
    };

    beforeEach(module('proton.message', 'proton.constants', 'proton.config', 'proton.commons', ($provide) => {
        $provide.factory('authentication', () => ({
            user: userMock
        }));

        $provide.factory('tools', () => ({
            replaceLineBreaks: _.identity
        }));


        $provide.factory('unsubscribeModel', () => ({
            init: angular.noop
        }));

        $provide.factory('sanitize', () => ({
            input: _.identity,
            message: _.identity
        }));
    }));

    beforeEach(inject(($injector) => {
        sanitize = $injector.get('sanitize');
        rootScope = $injector.get('$rootScope');
        CONSTANTS = $injector.get('CONSTANTS');
        tools = $injector.get('tools');
        authentication = $injector.get('authentication');
        factory = $injector.get('signatureBuilder');
    }));

    describe('New message', () => {

        describe('Insert signature ~ no signatures', () => {

            describe('action: new isAfter: false', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, {});
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty line before the signature', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should only add one line', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(1);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });


                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

            describe('action: new isAfter: true', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));

                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty line before the signature', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should only add one line', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(1);
                });

                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no user signature', () => {

            describe('action: new isAfter: false', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, {});
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });


            describe('action: new isAfter: true', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });


                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });


                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no proton signature', () => {

            describe('action: new isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, {});
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });


            describe('action: new isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

        describe('Insert signature', () => {

            describe('action: new isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, {});
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines before the proton signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });


            describe('action: new isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines before the proton signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

    });

    describe('Reply message', () => {

        beforeEach(() => {
            message.From = {};
            userMock = {};
        });

        describe('Insert signature ~ no signatures', () => {

            describe('action: reply isAfter: false', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'reply' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty line before the signature', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should add an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('should add two lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });


                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

            describe('action: reply isAfter: true', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));

                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should only add one line', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(1);
                });

                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no user signature', () => {

            describe('action: reply isAfter: false', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'reply' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should add an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

            describe('action: reply isAfter: true', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });


                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });


                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no proton signature', () => {

            describe('action: reply isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'reply' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });

                it('should an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

            describe('action: reply isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

        describe('Insert signature', () => {

            describe('action: reply isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'reply' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines before the proton signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('should an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('shoul add 4 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(4);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });


            describe('action: reply isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

    });


    describe('Reply All message', () => {

        beforeEach(() => {
            message.From = {};
            userMock = {};
        });

        describe('Insert signature ~ no signatures', () => {

            describe('action: replyall isAfter: false', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'replyall' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty line before the signature', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should add an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('should add two lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });


                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

            describe('action: replyall isAfter: true', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));

                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should only add one line', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(1);
                });

                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no user signature', () => {

            describe('action: replyall isAfter: false', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'replyall' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should add an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

            describe('action: replyall isAfter: true', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });


                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });


                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no proton signature', () => {

            describe('action: replyall isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'replyall' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });

                it('should an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

            describe('action: replyall isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

        describe('Insert signature', () => {

            describe('action: replyall isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'replyall' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines before the proton signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('should an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('shoul add 4 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(4);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });


            describe('action: replyall isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

    });

    describe('Forward message', () => {

        beforeEach(() => {
            message.From = {};
            userMock = {};
        });

        describe('Insert signature ~ no signatures', () => {

            describe('action: forward isAfter: false', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'forward' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty line before the signature', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should add an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('should add two lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });


                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

            describe('action: forward isAfter: true', () => {

                let string;
                beforeEach(() => {
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));

                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should return a default template hidden', () => {
                    expect(string).toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should an empty between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}<div><br><\/div><div class="${noSignatures}"`));
                });

                it('should only add one line', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(1);
                });

                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(signature);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no user signature', () => {

            describe('action: forward isAfter: false', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'forward' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should add an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

            describe('action: forward isAfter: true', () => {

                let string;
                beforeEach(() => {
                    userMock = {
                        PMSignature: true
                    };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });


                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });


                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should not contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).not.toBe(signature);
                });

            });

        });


        describe('Insert signature ~ no proton signature', () => {

            describe('action: forward isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'forward' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });

                it('should an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

            describe('action: forward isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: false };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).toContain(noSignatureProton);
                });

                it('should two empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('shoul add 2 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(2);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should not contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).not.toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

        describe('Insert signature', () => {

            describe('action: forward isAfter: false', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { action: 'forward' });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines before the proton signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('should an empty line before the message', () => {
                    expect(string).toMatch(new RegExp(`<div><br><\/div>${MESSAGE_BODY}`));
                });

                it('shoul add 4 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(4);
                });


                it('should not append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).toBe(MESSAGE_BODY);
                });


                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });


            describe('action: forward isAfter: true', () => {

                let string;
                beforeEach(() => {
                    message.From = {
                        Signature: USER_SIGNATURE
                    };
                    userMock = { PMSignature: true };
                    spyOn(tools, 'replaceLineBreaks').and.callThrough();
                    spyOn(sanitize, 'message').and.callThrough();
                    spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                    string = factory.insert(message, { isAfter: true });
                });

                it('should load the decrypted body', () => {
                    expect(message.getDecryptedBody).toHaveBeenCalled();
                });

                it('should remove line breaks', () => {
                    expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                    expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual([USER_SIGNATURE]);
                    expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual([CONSTANTS.PM_SIGNATURE]);
                });

                it('should try to clean the signature', () => {
                    expect(sanitize.message).toHaveBeenCalledTimes(1);
                    expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
                });

                it('should clean the signature', () => {
                    const html = sanitize.message.calls.argsFor(0)[0];
                    expect(html).toMatch(/<div><br \/><\/div>/);
                    expect(html).not.toContain(noSignatures);
                    expect(html).not.toContain(noSignatureUser);
                    expect(html).not.toContain(noSignatureProton);
                });

                it('should hide only the user signature', () => {
                    expect(string).not.toContain(noSignatures);
                    expect(string).not.toContain(noSignatureUser);
                    expect(string).not.toContain(noSignatureProton);
                });

                it('should two empty lines before the signature', () => {
                    expect(string).toMatch(new RegExp(`${MESSAGE_BODY}(<div><br><\/div>){2}<div class="${blockSignature} "`));
                });

                it('should one empty lines between the message and the signature', () => {
                    expect(string).toMatch(new RegExp(`(<div><br><\/div>){1}(\r\n|\r|\n) *<div class="${blockProtonSignature} "`));
                });

                it('shoul add 3 lines', () => {
                    expect(string.match(/<div><br><\/div>/g).length).toBe(3);
                });


                it('should append the signature after the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(0, size);
                    expect(output).toBe(MESSAGE_BODY);
                });

                it('should not append the signature before the message', () => {
                    const size = MESSAGE_BODY.length;
                    const output = string.substring(string.length, string.length - size);
                    expect(output).not.toBe(MESSAGE_BODY);
                });

                it('should contains the proton signature', () => {
                    const text = $(string).find(`.${blockProtonSignature}`).text();
                    const textConstant = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                    expect(text).toBe(textConstant);
                });

                it('should contains the user signature', () => {
                    const text = $(string).find(`.${blockUserSignature}`).text();
                    const signature = $(USER_SIGNATURE).text();
                    expect(text).toBe(signature);
                });

            });

        });

    });


    describe('Update a existing signature', () => {

        describe('No:body no:message no:signatures', () => {
            let string;
            beforeEach(() => {
                message.From = {};
                userMock = { PMSignature: false };
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(2);
            });


            it('should remove line breaks', () => {
                expect(tools.replaceLineBreaks).toHaveBeenCalledTimes(2);
                expect(tools.replaceLineBreaks.calls.argsFor(0)).toEqual(['']);
                expect(tools.replaceLineBreaks.calls.argsFor(1)).toEqual(['']);
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(3);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the message first', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(MESSAGE_BODY);
            });

            it('should clean the user signature', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe('');
            });

            it('should clean the new signature', () => {
                const html = sanitize.message.calls.argsFor(2)[0];
                expect(html).toMatch(/<div><br \/><\/div>/);
                expect(html).toContain(noSignatures);
                expect(html).toContain(noSignatureUser);
                expect(html).toContain(noSignatureProton);
            });

            it('should hide signatures', () => {
                expect(string).toContain(noSignatures);
                expect(string).toContain(noSignatureUser);
                expect(string).toContain(noSignatureProton);
            });

            it('should an empty line before the signature', () => {
                expect(string).toMatch(new RegExp(`<div><br><\/div><div class="${noSignatures}"`));
            });

            it('should only add one line', () => {
                expect(string.match(/<div><br><\/div>/g).length).toBe(1);
            });

            it('should append the signature after the message', () => {
                const size = MESSAGE_BODY.length;
                const output = string.substring(0, size);
                expect(output).toBe(MESSAGE_BODY);
            });

            it('should not append the signature before the message', () => {
                const size = MESSAGE_BODY.length;
                const output = string.substring(string.length, string.length - size);
                expect(output).not.toBe(MESSAGE_BODY);
            });


            it('should not contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).not.toBe(signature);
            });

            it('should not contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).not.toBe(signature);
            });
        });

        describe('No:body message userSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdate();
            beforeEach(() => {
                message.From = {
                    Signature: USER_SIGNATURE
                };
                userMock = { PMSignature: false };
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the message first', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should clean the user signature', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should display the user signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).toContain(noSignatureProton);
            });


            it('should not contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).not.toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).toBe(signature);
            });
        });

        describe('No:body message new userSignature', () => {
            let string;
            const MESSAGE_BODY_UPDATE = getMessageUpdate();
            beforeEach(() => {
                message.From = {};
                userMock = { PMSignature: false, Signature: USER_SIGNATURE };
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the message first', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should clean the user signature', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).toContain(noSignatureProton);
            });


            it('should not contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).not.toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).toBe(signature);
            });
        });

        describe('No:body message new userSignature and protonSignature', () => {
            let string;
            let MESSAGE_BODY_UPDATE;
            beforeEach(() => {
                MESSAGE_BODY_UPDATE = getMessageUpdate(undefined, CONSTANTS.PM_SIGNATURE);
                message.From = {};
                userMock = { PMSignature: true, Signature: USER_SIGNATURE };
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the message first', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should clean the user signature', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(USER_SIGNATURE);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).not.toContain(noSignatureProton);
            });


            it('should contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE).text();
                expect(text).toBe(signature);
            });
        });

        describe('No:body message update userSignature and protonSignature', () => {
            let string;
            let MESSAGE_BODY_UPDATE;
            beforeEach(() => {
                MESSAGE_BODY_UPDATE = getMessageUpdate(USER_SIGNATURE, CONSTANTS.PM_SIGNATURE);
                message.From = {};
                userMock = { PMSignature: true, Signature: USER_SIGNATURE2 };
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue(MESSAGE_BODY_UPDATE);
                string = factory.update(message);
            });

            it('should get the decrypted body', () => {
                expect(message.getDecryptedBody).toHaveBeenCalled();
                expect(message.getDecryptedBody).toHaveBeenCalledTimes(1);
            });


            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the message first', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should clean the user signature', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(USER_SIGNATURE2);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).not.toContain(noSignatureProton);
            });


            it('should contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE2).text();
                expect(text).toBe(signature);
            });
        });


        describe('body message update userSignature and protonSignature', () => {
            let string;
            let MESSAGE_BODY_UPDATE;
            beforeEach(() => {
                MESSAGE_BODY_UPDATE = getMessageUpdate(USER_SIGNATURE, CONSTANTS.PM_SIGNATURE);
                message.From = {};
                userMock = { PMSignature: true, Signature: USER_SIGNATURE2 };
                spyOn(tools, 'replaceLineBreaks').and.callThrough();
                spyOn(sanitize, 'message').and.callThrough();
                spyOn(message, 'getDecryptedBody').and.returnValue('');
                string = factory.update(message, MESSAGE_BODY_UPDATE);
            });

            it('should not get the decrypted body', () => {
                expect(message.getDecryptedBody).not.toHaveBeenCalled();
            });

            it('should not remove line breaks', () => {
                expect(tools.replaceLineBreaks).not.toHaveBeenCalled();
            });

            it('should try to clean the signature', () => {
                expect(sanitize.message).toHaveBeenCalledTimes(2);
                expect(sanitize.message).toHaveBeenCalledWith(jasmine.any(String));
            });

            it('should clean the message first', () => {
                const html = sanitize.message.calls.argsFor(0)[0];
                expect(html).toBe(MESSAGE_BODY_UPDATE);
            });

            it('should clean the user signature', () => {
                const html = sanitize.message.calls.argsFor(1)[0];
                expect(html).toBe(USER_SIGNATURE2);
            });

            it('should display the proton signature', () => {
                expect(string).not.toContain(noSignatures);
                expect(string).not.toContain(noSignatureUser);
                expect(string).not.toContain(noSignatureProton);
            });


            it('should contains the proton signature', () => {
                const text = $(string).find(`.${blockProtonSignature}`).text();
                const signature = $(`<p>${CONSTANTS.PM_SIGNATURE}</p>`).text();
                expect(text).toBe(signature);
            });

            it('should contains the user signature', () => {
                const text = $(string).find(`.${blockUserSignature}`).text();
                const signature = $(USER_SIGNATURE2).text();
                expect(text).toBe(signature);
            });
        });

    });


});
