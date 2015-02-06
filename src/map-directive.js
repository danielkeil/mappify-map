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

            // $q.when(blueBirde).then( ... )

            Promise.resolve(controller
                .isReady())
                .then(function () {

                    var mapBounds = controller.getMap().getBounds();
                    jassa.geo.Bounds(mapBounds.getWest(),mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth());


                    log('controller is ready');

                    var p =  handleFetchDataPromiseCreation(scope);
                    return p;
                }, function(e) {console.log(e)})
                .then(function (data) {

                    log('data was fetched');

                    addFetchedDataToMap(controller, data);
                });
        }

        function handleFetchDataPromiseCreation(scope) {

            if (! scope.hasOwnProperty('datasource')) {
                throw new Error('no datasource defined');
            }

            if (_.isArray(scope.datasource)) {
                return createMultipleRequestPromises(scope);
            } else {
                return createSingleRequestPromise()
            }
        }

        function createSingleRequestPromise(scope) {
            return scope.datasource.fetchData();
        }

        // todo: update (datasource, bound);
        function createMultipleRequestPromises(scope) {
            var map = _.map(scope.datasource, function (singleSource) {

                // todo: move to proper place
                var bounds = new jassa.geo.Bounds(0,0, 20, 20);


                var r =  singleSource.fetchData(bounds);
                r = Promise.resolve(r);

                console.log(r);

                return r;
                }
            )

            return jassa.util.PromiseUtils.all(map);
        }

        // @see: http://jsperf.com/23293323
        function wktCoordinatesToLatLong(polygon) {
            return _.map(polygon[0], function(point) { return [point[1], point[0]]});
        }

        // todo: better function name
        function processItem(item) {
            var data = {};

            if (item.hasOwnProperty('key') && item.key.hasOwnProperty('uri')) {
                data.id = item.key.uri;
            }

            if (item.hasOwnProperty('val') && item.val.hasOwnProperty('wkt')) {
                // todo: check parsing error case
                var wktElement = Terraformer.WKT.parse(item.val.wkt);

                if (wktElement.type === 'Point') {
                    data.type = 'Point';
                    data.latitude  = wktElement.coordinates[1];
                    data.longitude = wktElement.coordinates[0];
                }

                if (wktElement.type === 'Polygon') {
                    data.polygon = wktCoordinatesToLatLong(wktElement.coordinates);
                }

                return data;
            }

            return [];
        }

        /**
         * @param controller
         * @param fetchedData
         */
        function addFetchedDataToMap(controller, fetchedData) {

            $timeout(function () {
                angular.forEach(fetchedData, function (source) {

                    var dataSet = [];

                    _.each(source, function (item) {

                        if (item.val.hasOwnProperty('zoomClusterBounds')) {
                        //console.log(item);
                        }

                        dataSet.push(processItem(item))
                    });

                    angular.forEach(dataSet, function (element) {
                        controller.addElementToMap(source, element);
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
