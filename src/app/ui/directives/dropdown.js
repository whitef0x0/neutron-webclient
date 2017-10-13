angular.module('proton.ui')
    .directive('dropdown', ($document, $rootScope) => {
        const CLASS_OPEN = 'pm_dropdown-opened';

        return (scope, element) => {

            const parent = element.parent();
            const dropdown = parent.find('.pm_dropdown');

            // Functions
            function showDropdown() {
                element.addClass('active');
                dropdown.addClass(CLASS_OPEN);
                $document.on('click', outside);
            }

            function hideDropdown() {
                element.removeClass('active');
                dropdown.removeClass(CLASS_OPEN);
                $document.off('click', outside);
            }

            function outside(event) {
                if (!dropdown[0].contains(event.target)) {
                    hideDropdown();
                }
            }

            function click() {
                if (element.hasClass('active')) {
                    hideDropdown();
                } else {
                // Close all dropdowns
                    $rootScope.$emit('closeDropdown');
                    // Open only this one
                    showDropdown();
                }

                return false;
            }

            // Listeners
            element.on('click', click);

            const unsubscribe = $rootScope.$on('closeDropdown', () => {
                hideDropdown();
            });

            scope.$on('$destroy', () => {
                element.off('click', click);
                hideDropdown();
                unsubscribe();
            });
        };
    });
