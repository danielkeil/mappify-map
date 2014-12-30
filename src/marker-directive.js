(function () {
    'use strict';

    angular.module('mappify.markerDirective', ['mappify.ctrl','mappify.directive'])
        .directive('mappifyMarker', mappifyMarker);

    function mappifyMarker($log) {
        return {
            restrict: 'E',
            scope: false,
            transclude: true,
            require: '^mappify',
            link: {
                post: function (scope, element, attrs, mapController) {
                    $log.debug('mappifyMarker: post link');

                    // @todo clean up: replace fa:home by configurable value
                    mapController.setConceptIcon(attrs.concept, attrs.icon || 'fa:home');
                    mapController.setPopUpTemplateUrl(attrs.concept, attrs.templateUrl);
                    mapController.setLayer(attrs.concept, attrs.layer);
                }
            }
        };

    }
})
();

