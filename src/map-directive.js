(function () {
    'use strict';

    angular.module('mappify.directive', ['mappify.configurationProvider', 'mappify.ctrl', 'mappify.jsonBoxDirective'])
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

                    // todo move to separate method
                    scope.$watch('config', function() {
                            populateMappifyConfigurationWithPassConfigValues(mappifyConfiguration, scope.config)
                            applyConfigToController(mappifyConfiguration, controller);
                            $log.debug('config - changed')}
                    );

                },
                post: function (scope, elem, attrs, controller) {
                    log('post link');

                    controller.fetchDataFormDataSources(scope);
                }
            }
        };


        function applyConfigToController(mappifyConfiguration, controller) {
            controller.setView(mappifyConfiguration.getView());
            controller.configTileLayer();
        }

        function handleLayerConfiguration(scope, controller) {

            if (scope.config && scope.config.layers && scope.config.layers instanceof Array) {
                _.forEach(scope.config.layers, function (layer) {
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

        function log(message, prefix) {
            prefix = prefix || 'mappify';
            $log.debug(prefix + ': ' + message)
        }

    }
})();
