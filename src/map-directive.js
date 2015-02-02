(function () {
    'use strict';

    angular.module('mappify.directive', ['mappify.configurationProvider','mappify.ctrl'])
        .directive('mappify', mappify);

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
                    log('pre link');
                    populateMappifyConfigurationWithPassConfigValues(mappifyConfiguration, scope.config);
                    handleLayerConfiguration(scope, controller);
                    applyConfigToController(mappifyConfiguration, controller);
                },
                post: function (scope, elem, attrs, controller) {
                    log('post link');
                    chainPromiseToTheControllerIsReadyPromise(controller, scope);
                }
            }
        };

        /**
         * we add fetchData and dataWasFetchedFunction to the promise chain
         *
         * @param controller
         * @param scope
         */
        function chainPromiseToTheControllerIsReadyPromise (controller, scope) {

            controller
                .isReady()
                .then(function () {
                    log('controller is ready');
                    return scope.datasource.fetchData();
                })
                .then(function (data) {
                    log('data was fetched');
                    addFetchedDataToMap(controller, data);
                });
        }

        /**
         * @param controller
         * @param fetchedData
         */
        function addFetchedDataToMap (controller, fetchedData) {

            // converts fetchedData to an array
            fetchedData = _.flatten([fetchedData]);

            $timeout(function () {
                angular.forEach(fetchedData, function (concept) {


                    // todo: rename markers
                    if (! concept.hasOwnProperty('markers')) {
                        throw 'mappify-data-error: data missing property markers on concept'
                    }

                    angular.forEach(concept.markers, function (element) {
                        controller.addElementToMap(concept.concept, element);
                    });
                });
            });
        };

        function applyConfigToController(mappifyConfiguration, controller)
        {
            controller.setView(mappifyConfiguration.getView());
            controller.configTileLayer();
        }

        function handleLayerConfiguration(scope, controller) {

            if (scope.config && scope.config.layers && scope.config.layers instanceof Array) {
                _.forEach(scope.config.layers, function(layer) {
                    handleLayerSingleConfiguration(layer, controller)
                });
            }
        }

        function handleLayerSingleConfiguration(layer, controller) {
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
        }

        function populateMappifyConfigurationWithPassConfigValues(mappifyConfiguration, config) {
            mappifyConfiguration.init(config);
        }


        function log(message, prefix)
        {
            prefix = prefix || 'mappify';
            $log.debug(prefix + ': ' + message)
        }

    }
})();
