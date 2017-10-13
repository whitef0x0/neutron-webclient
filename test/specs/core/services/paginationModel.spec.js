describe('paginationModel factory', () => {

    let factory, rootScope, cacheCounters, authentication, state, CONSTANTS, tools;
    let userMock = { ViewMode: 0 };
    let stateParamsMock = {};

    beforeEach(module('proton.core', 'proton.constants', 'proton.config', ($provide) => {
        $provide.factory('authentication', () => ({
            user: userMock
        }));

        $provide.factory('AppModel', () => ({
            is: angular.noop,
            set: angular.noop
        }));

        $provide.factory('aboutClient', () => ({
            hasSessionStorage: angular.noop,
            prngAvailable: angular.noop
        }));

        $provide.factory('$state', () => ({
            go: angular.noop
        }));

        $provide.factory('$cookies', () => ({
            get: angular.noop,
            put: angular.noop
        }));
        $provide.factory('eventManager', () => ({
            setEventID: angular.noop,
            start: angular.noop,
            call: angular.noop,
            stop: angular.noop
        }));

        $provide.factory('cacheCounters', () => ({
            getCurrentState: angular.noop,
            getCounter: angular.noop
        }));

        $provide.factory('tools', () => ({
            currentLocation: angular.noop,
            cacheContext: angular.noop
        }));

        $provide.factory('$stateParams', () => stateParamsMock);
    }));

    beforeEach(inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        CONSTANTS = $injector.get('CONSTANTS');
        cacheCounters = $injector.get('cacheCounters');
        authentication = $injector.get('authentication');
        state = $injector.get('$state');
        factory = $injector.get('paginationModel');
        tools = $injector.get('tools');
        factory.init();
    }));

    describe('Switch page', () => {

        describe('No options', () => {

            beforeEach(() => {
                spyOn(state, 'go');
                factory.to();
            });

            it('should move to another state', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null })
            });
        });

        describe('With options', () => {

            beforeEach(() => {
                spyOn(state, 'go');
                factory.to({ label: 'polo' });
            });

            it('should move to another state', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, label: 'polo' });
            });
        });

        describe('Custom state, with options', () => {

            beforeEach(() => {
                rootScope.$emit('$stateChangeSuccess', { name: 'monique' });
                spyOn(state, 'go');
                factory.to({ label: 'polo' });
            });

            it('should move to another state', () => {
                expect(state.go).toHaveBeenCalledWith('monique', { id: null, label: 'polo' });
            });
        });
    });

    describe('Page max', () => {

        describe('No counters, not a cache context', () => {
            let total;
            beforeEach(() => {
                spyOn(tools, 'cacheContext').and.returnValue(false);
                spyOn(tools, 'currentLocation').and.returnValue('ici');
                spyOn(cacheCounters, 'getCounter').and.returnValue(0);
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                total = factory.getMaxPage();
            });

            it('should get check the cache context', () => {
                expect(tools.cacheContext).toHaveBeenCalledTimes(1);
            });
            it('should get the current location', () => {
                expect(tools.currentLocation).toHaveBeenCalledTimes(1);
            });

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith('ici');
                expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
            });

            it('should get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).toHaveBeenCalledTimes(1);
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(1);
            });
        });

        describe('No counters, and a cache context', () => {
            let total;
            beforeEach(() => {
                spyOn(tools, 'cacheContext').and.returnValue(true);
                spyOn(tools, 'currentLocation').and.returnValue('ici');
                spyOn(cacheCounters, 'getCounter').and.returnValue(0);
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                total = factory.getMaxPage();
            });

            it('should check the cache context', () => {
                expect(tools.cacheContext).toHaveBeenCalledTimes(1);
            });

            it('should get the current location', () => {
                expect(tools.currentLocation).toHaveBeenCalledTimes(1);
            });

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith('ici');
                expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
            });

            it('should get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).toHaveBeenCalledTimes(1);
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(1);
            });
        });

        describe('Counters, and not a cache context', () => {
            let total;
            beforeEach(() => {
                spyOn(tools, 'cacheContext').and.returnValue(false);
                spyOn(tools, 'currentLocation').and.returnValue('ici');
                spyOn(cacheCounters, 'getCounter').and.returnValue(100);
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                total = factory.getMaxPage();
            });

            it('should check the cache context', () => {
                expect(tools.cacheContext).toHaveBeenCalledTimes(1);
            });

            it('should get the current location', () => {
                expect(tools.currentLocation).toHaveBeenCalledTimes(1);
            });

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith('ici');
                expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
            });

            it('should get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).toHaveBeenCalledTimes(1);
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(1);
            });
        });

        describe('Counters:converstations, and a cache context', () => {
            let total;

            beforeEach(() => {
                userMock.ViewMode = CONSTANTS.CONVERSATION_VIEW_MODE;
                spyOn(tools, 'cacheContext').and.returnValue(true);
                spyOn(tools, 'currentLocation').and.returnValue('ici');
                spyOn(cacheCounters, 'getCounter').and.returnValue({
                    conversation: {
                        unread: CONSTANTS.ELEMENTS_PER_PAGE * 10,
                        total: CONSTANTS.ELEMENTS_PER_PAGE * 15
                    }
                });
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                rootScope.$digest();
            });

            describe('Filter unread', () => {

                beforeEach(() => {
                    stateParamsMock.filter = 'unread';
                    total = factory.getMaxPage();
                });

                it('should check the cache context', () => {
                    expect(tools.cacheContext).toHaveBeenCalledTimes(1);
                });

                it('should get the current location', () => {
                    expect(tools.currentLocation).toHaveBeenCalledTimes(1);
                });

                it('should get counters', () => {
                    expect(cacheCounters.getCounter).toHaveBeenCalledWith('ici');
                    expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
                });

                it('should not get counter for the current state', () => {
                    expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
                });

                it('should return 10 pages', () => {
                    expect(total).toBe(10);
                });
            });

            describe('Filter total', () => {

                beforeEach(() => {
                    stateParamsMock.filter = 'total';
                    total = factory.getMaxPage();
                });

                it('should check the cache context', () => {
                    expect(tools.cacheContext).toHaveBeenCalledTimes(1);
                });

                it('should get the current location', () => {
                    expect(tools.currentLocation).toHaveBeenCalledTimes(1);
                });

                it('should get counters', () => {
                    expect(cacheCounters.getCounter).toHaveBeenCalledWith('ici');
                    expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
                });

                it('should not get counter for the current state', () => {
                    expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
                });

                it('should return 15 pages', () => {
                    expect(total).toBe(15);
                });
            });
        });

        describe('Counters:messages, and a cache context', () => {
            let total;

            beforeEach(() => {
                userMock.ViewMode = CONSTANTS.MESSAGE_VIEW_MODE;
                spyOn(tools, 'cacheContext').and.returnValue(true);
                spyOn(tools, 'currentLocation').and.returnValue('ici');
                spyOn(cacheCounters, 'getCounter').and.returnValue({
                    message: {
                        unread: CONSTANTS.ELEMENTS_PER_PAGE * 10,
                        total: CONSTANTS.ELEMENTS_PER_PAGE * 15
                    }
                });
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                rootScope.$digest();
            });

            describe('Filter unread', () => {

                beforeEach(() => {
                    stateParamsMock.filter = 'unread';
                    total = factory.getMaxPage();
                });

                it('should check the cache context', () => {
                    expect(tools.cacheContext).toHaveBeenCalledTimes(1);
                });

                it('should get the current location', () => {
                    expect(tools.currentLocation).toHaveBeenCalledTimes(1);
                });

                it('should get counters', () => {
                    expect(cacheCounters.getCounter).toHaveBeenCalledWith('ici');
                    expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
                });

                it('should not get counter for the current state', () => {
                    expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
                });

                it('should return 10 pages', () => {
                    expect(total).toBe(10);
                });
            });

            describe('Filter total', () => {

                beforeEach(() => {
                    stateParamsMock.filter = 'total';
                    total = factory.getMaxPage();
                });

                it('should check the cache context', () => {
                    expect(tools.cacheContext).toHaveBeenCalledTimes(1);
                });

                it('should get the current location', () => {
                    expect(tools.currentLocation).toHaveBeenCalledTimes(1);
                });

                it('should get counters', () => {
                    expect(cacheCounters.getCounter).toHaveBeenCalledWith('ici');
                    expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
                });

                it('should not get counter for the current state', () => {
                    expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
                });

                it('should return 15 pages', () => {
                    expect(total).toBe(15);
                });
            });
        });

        describe('Always return an integer', () => {

            describe('Via counters', () => {
                let total;

                beforeEach(() => {
                    userMock.ViewMode = CONSTANTS.MESSAGE_VIEW_MODE;
                    spyOn(tools, 'cacheContext').and.returnValue(true);
                    spyOn(tools, 'currentLocation').and.returnValue('ici');
                    spyOn(cacheCounters, 'getCounter').and.returnValue({
                        message: {
                            unread: CONSTANTS.ELEMENTS_PER_PAGE * 10,
                            total: 1337
                        }
                    });
                    spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                    stateParamsMock.filter = 'total';
                    total = factory.getMaxPage();
                });

                it('should return 27 pages', () => {
                    expect(total).toBe(~~(1337 / CONSTANTS.ELEMENTS_PER_PAGE + 1));
                });
            });

            describe('Via state total', () => {
                let total;

                beforeEach(() => {
                    spyOn(tools, 'cacheContext').and.returnValue(false);
                    spyOn(tools, 'currentLocation').and.returnValue('ici');
                    spyOn(cacheCounters, 'getCounter').and.returnValue(false);
                    spyOn(cacheCounters, 'getCurrentState').and.returnValue(1337);
                    total = factory.getMaxPage();
                });

                it('should return 27 pages', () => {
                    expect(total).toBe(~~(1337 / CONSTANTS.ELEMENTS_PER_PAGE + 1));
                });
            });
        });
    });

    describe('Previous page', () => {

        describe('No page', () => {

            beforeEach(() => {
                spyOn(state, 'go');
                factory.previous();
            });

            it('should not switch to another page', () => {
                expect(state.go).not.toHaveBeenCalled();
            });
        });

        describe('Wrong query params', () => {

            beforeEach(() => {
                stateParamsMock.page = 'monique';
                spyOn(state, 'go');
                factory.previous();
            });

            it('should not switch to another page', () => {
                expect(state.go).not.toHaveBeenCalled();
            });
        });

        describe('With a page number', () => {

            beforeEach(() => {
                stateParamsMock.page = 10;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: 9 });
            });
        });

        describe('From page 1', () => {

            beforeEach(() => {
                stateParamsMock.page = 1;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: undefined });
            });
        });

        describe('From page 2', () => {

            beforeEach(() => {
                stateParamsMock.page = 2;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: undefined });
            });
        });

        describe('From page 3', () => {

            beforeEach(() => {
                stateParamsMock.page = 3;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: 2 });
            });
        });
    });

    describe('Next page', () => {

        describe('default pageMax = 1', () => {
            describe('No page', () => {

                beforeEach(() => {
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should not switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });

            describe('Wrong query params', () => {

                beforeEach(() => {
                    stateParamsMock.page = 'monique';
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should not switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });

            describe('With a page number', () => {

                beforeEach(() => {
                    stateParamsMock.page = 2;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should not switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });
        });

        describe('default pageMax = 10', () => {

            beforeEach(() => {
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(CONSTANTS.ELEMENTS_PER_PAGE * 10);
                delete stateParamsMock.page;
            });

            describe('No page', () => {

                beforeEach(() => {
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 2 });
                });
            });

            describe('Wrong query params', () => {

                beforeEach(() => {
                    stateParamsMock.page = 'monique';
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 2 });
                });
            });

            describe('With a page number', () => {

                beforeEach(() => {
                    stateParamsMock.page = 2;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 3 });
                });
            });

            describe('With a page number < 10', () => {

                beforeEach(() => {
                    stateParamsMock.page = 9;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 10 });
                });
            });

            describe('With a page number === 10', () => {

                beforeEach(() => {
                    stateParamsMock.page = 10;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });

            describe('With a page number > 10', () => {

                beforeEach(() => {
                    stateParamsMock.page = 11;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });
        });

    });

    describe('Check if page number is maxPageNumber', () => {

        describe('Default page max 1', () => {

            beforeEach(() => {
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(1);
                spyOn(cacheCounters, 'getCounter').and.returnValue();
                spyOn(state, 'go');
            });

            it('should compare to the current state', () => {
                stateParamsMock.page = 1;
                expect(factory.isMax()).toBe(true);
                expect(cacheCounters.getCounter).toHaveBeenCalledTimes(1);
                expect(cacheCounters.getCurrentState).toHaveBeenCalledTimes(1);
            });

            it('should return true if page is > 1', () => {
                stateParamsMock.page = 2;
                expect(factory.isMax()).toBe(true);
            });

            it('should return true if page is === 1', () => {
                stateParamsMock.page = 1;
                expect(factory.isMax()).toBe(true);
            });

            it('should return true if page is undefined', () => {
                delete stateParamsMock.page;
                expect(factory.isMax()).toBe(true);
            });
        });

        describe('Custom page max 10', () => {

            beforeEach(() => {
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(CONSTANTS.ELEMENTS_PER_PAGE * 10);
                delete stateParamsMock.page;
                spyOn(state, 'go');
            });

            it('should return true if page is > 10', () => {
                stateParamsMock.page = 11;
                expect(factory.isMax()).toBe(true);
            });

            it('should return true if page is === 10', () => {
                stateParamsMock.page = 10;
                expect(factory.isMax()).toBe(true);
            });

            it('should return false if page is < 10', () => {
                stateParamsMock.page = 9;
                expect(factory.isMax()).toBe(false);
            });

            it('should return false if page is undefined', () => {
                delete stateParamsMock.page;
                expect(factory.isMax()).toBe(false);
            });

        });
    });


});
