(function () {
    'use strict';

    angular.module('mappify.directive', ['mappify.configurationProvider','mappify.ctrl'])
        .directive('mappify', mappify);


    function populateMappifyConfigurationWith(config, mappifyConfiguration) {
        // todo: check lodash -> there should be a simple solution
        if (config) {
            if (config.viewCenter) {
                if (config.viewCenter.latitude && config.viewCenter.longitude) {
                    mappifyConfiguration.setViewCenter({
                            latitude: config.viewCenter.latitude,
                            longitude: config.viewCenter.longitude
                        }
                    );
                }
            }
            if (config.zoom) {
                mappifyConfiguration.setZoom(config.zoom);
            }
        }
    }

    function mappify($timeout, $log, mappifyConfiguration) {

        return {
            restrict: 'E',
            scope: {
                config: '=',
                datasource: '=',
                latitude: '@',
                longitude: '@'
            },
            controller: 'MappifyController',

            link: {
                pre: function (scope, elem, attrs, controller) {

                    $log.debug('mappify: pre link');
                    $log.debug('mappify:populateMappifyConfigurationWith');
                    populateMappifyConfigurationWith(scope.config, mappifyConfiguration);

                    controller.setView(mappifyConfiguration.getView());
                    controller.configTileLayer();

                    if (scope.config && scope.config.layers && scope.config.layers instanceof Array) {
                        _.forEach(scope.config.layers, function (layer) {

                            if (layer.hasOwnProperty('concept')) {
                                if (layer.hasOwnProperty('icon')) {
                                    controller.setConceptIcon(layer.concept, layer.icon);
                                } else {
                                    controller.setConceptIcon(layer.concept, 'fa:home');
                                }

                                if (layer.hasOwnProperty('template-url')) {
                                    controller.setPopUpTemplateUrl(layer.concept, layer['template-url']);
                                }

                                controller.setLayer(layer.concept, layer.layer);
                            }
                        });
                    }
                },
                post: function (scope, elem, attrs, controller) {

                    $log.debug('mappify: post link');

                    controller.isReady()
                        .then(function () {

                            $log.debug('mappify: controller is ready');

                            return scope.datasource.fetchData();
                        }).then(function (data) {

                            $log.debug('mappify: data was fetched');
                            $log.debug(data);

                            // converts return to an array
                            data = _.flatten([data]);

                            // todo: update the text - we use $timeout instead of $scope.apply
                            // To assure rendering of our marker popups we need to use
                            // scope.$apply to perform a proper scope life cycle

                            // @see http://stackoverflow.com/questions/12729122/prevent-error-digest-already-in-progress-when-calling-scope-apply
                            $timeout(function () {

                                angular.forEach(data, function (concept) {
                                    angular.forEach(concept.markers, function (marker) {
                                        controller.addMarkerToMap(concept.concept, marker);
                                    });
                                });
                            });
                        })

                    ;
                }
            }
        };
    }
})();
