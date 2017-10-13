angular.module('proton.settings')
    .controller('LabelsController', (
        $rootScope,
        $scope,
        gettextCatalog,
        $log,
        authentication,
        confirmModal,
        eventManager,
        Label,
        labelModal,
        networkActivityTracker,
        cacheCounters,
        labelsEditorModel,
        notification
    ) => {

        const unsubscribe = [];

        const changeNotify = (event, { id, status }) => {
            const { Name, Color, Display, Exclusive } = _.findWhere($scope.labels, { ID: id });
            const promise = Label.update({ ID: id, Name, Color, Display, Exclusive, Notify: status ? 1 : 0 })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return eventManager.call();
                    }
                    throw new Error(data.Error);
                })
                .then(() => notification.success(gettextCatalog.getString('Label updated', null)));

            networkActivityTracker.track(promise);
        };

        const setLabels = () => $scope.labels = labelsEditorModel.load();

        setLabels();

        // Drag and Drop configuration
        $scope.labelsDragControlListeners = {
            containment: '#labelContainer',
            accept(sourceItemHandleScope, destSortableScope) {
                return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
            },
            orderChanged() {
                const order = labelsEditorModel.getOrder();
                labelsEditorModel.update();
                $scope.saveLabelOrder(order);
            }
        };

        // Listeners
        unsubscribe.push($rootScope.$on('changeNotifyLabel', changeNotify));
        unsubscribe.push($rootScope.$on('labelsModel', (e, { type }) => {
            if (type === 'cache.update' || type === 'cache.refresh') {
                $scope.$applyAsync(() => setLabels());
            }
        }));

        $scope.$on('$destroy', () => {
            unsubscribe.forEach((cb) => cb());
            unsubscribe.length = 0;
        });

        function openLabelModal(label) {
            labelModal.activate({
                params: {
                    label,
                    onSuccess() {
                        // Auto Scroll to the latest item
                        const id = setTimeout(() => {
                            const $li = document.querySelector('.labelsState-item:last-child');
                            $li && $li.scrollIntoView();
                            clearTimeout(id);
                        }, 500);
                    },
                    close() {
                        labelModal.deactivate();
                    }
                }
            });
        }

        /**
     * Open modal to create a new label
     */
        $scope.createLabel = () => {
            openLabelModal({ Exclusive: 0, Notify: 1 });
        };

        /**
     * Open modal to create a new folder
     */
        $scope.createFolder = () => {
            openLabelModal({ Exclusive: 1, Notify: 0 });
        };

        /**
     * Open modal to edit label / folder
     * @param {Object} label
     */
        $scope.editLabel = (label) => {
            openLabelModal(label);
        };

        $scope.sortLabels = () => {
            labelsEditorModel.sort();
            const order = labelsEditorModel.getOrder();
            labelsEditorModel.update();
            $scope.saveLabelOrder(order);
        };

        function getTitleDeleteLabel({ Exclusive }) {
            return (Exclusive) ? gettextCatalog.getString('Delete folder', null, 'Title') : gettextCatalog.getString('Delete label', null, 'Title');
        }

        function getMessageDeleteLabel({ Exclusive }) {
            if (Exclusive) {
                return {
                    CONFIRM: gettextCatalog.getString('Are you sure you want to delete this folder? Messages in the folders aren’t deleted if the folder is deleted, they can still be found in all mail. If you want to delete all messages in a folder, move them to trash.', null, 'Info'),
                    NOTIF: gettextCatalog.getString('Folder deleted', null)
                };
            }

            return {
                CONFIRM: gettextCatalog.getString('Are you sure you want to delete this label? Removing a label will not remove the messages with that label.', null, 'Info'),
                NOTIF: gettextCatalog.getString('Label deleted', null)
            };
        }

        $scope.deleteLabel = (label) => {
            const title = getTitleDeleteLabel(label);
            const { CONFIRM, NOTIF } = getMessageDeleteLabel(label);
            confirmModal.activate({
                params: {
                    title,
                    message: CONFIRM,
                    confirm() {
                        const promise = Label.delete(label.ID)
                            .then(({ data = {} } = {}) => {
                                if (data.Code === 1000) {
                                    return eventManager.call();
                                }
                                throw new Error(data.Error);
                            })
                            .then(() => {
                                confirmModal.deactivate();
                                notification.success(NOTIF);
                            });

                        networkActivityTracker.track(promise);
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        };

        $scope.saveLabelOrder = (labelOrder) => {
            const promise = Label.order({ Order: labelOrder })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return eventManager.call();
                    }
                    throw new Error(data.Error);
                })
                .then(() => {
                    notification.success(gettextCatalog.getString('Label order saved', null));
                });

            networkActivityTracker.track(promise);
        };

        $scope.$on('$destroy', () => {
            labelsEditorModel.clear();
        });
    });
