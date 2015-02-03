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

                    scope.$watch('config', function() {
                            populateMappifyConfigurationWithPassConfigValues(mappifyConfiguration, scope.config)
                            applyConfigToController(mappifyConfiguration, controller);
                            $log.debug('config - changed')}
                    );

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
        function chainPromiseToTheControllerIsReadyPromise(controller, scope) {

            // todo: add one promise per source and fetch them separately
            // $q.when(blueBirde).then( ... )


            Promise.resolve(controller
                .isReady())

                .then(function () {
                    log('controller is ready');

                    var p =  handleFetchDataPromiseCreation(scope);

                    console.log(p);

                    return p;
                }, function(e) {console.log(e)})
                .then(function (data) {

                    log('data was fetched');

                    console.log('askjdhfkjhsdfjkhsdjkhdfkjdshfkjdhsfkjhsdkfjhskdhf');
                    $log.debug(data);

                    var promise  = {};

                    addFetchedDataToMap(controller, data);
                });
        }

        function handleFetchDataPromiseCreation(scope) {

            if (! scope.hasOwnProperty('datasource')) {
                throw new Error('no datasource defined');
            }

            if (_.isArray(scope.datasource)) {
                return createRequestMultiplePromises(scope);
            } else {
                return createRequestSinglePromise()
            }
        }

        function createRequestSinglePromise(scope) {
            return scope.datasource.fetchData();
        }

        // update (datasource, bound);
        function createRequestMultiplePromises(scope) {
            var map = _.map(scope.datasource, function (singleSource) {

                // todo: move to proper place
                var bounds = new jassa.geo.Bounds(0,0, 120, 120);


                var r =  singleSource.fetchData(bounds);
                r = Promise.resolve(r);

                console.log(r);

                return r;
                }
            )

            return jassa.util.PromiseUtils.all(map);
        }

        /**
         * @param controller
         * @param fetchedData
         */
        function addFetchedDataToMap(controller, fetchedData) {

            // converts fetchedData to an array
            fetchedData = _.flatten([fetchedData]);

            console.log(fetchedData);

            $timeout(function () {
                angular.forEach(fetchedData, function (concept) {

                    // todo: rename markers
                    if (!concept.hasOwnProperty('markers')) {
                        throw new Error('mappify-data-error: data missing property markers on concept');
                    }

                    angular.forEach(concept.markers, function (element) {
                        controller.addElementToMap(concept.concept, element);
                    });
                });
            });
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
