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
                    var bounds = new jassa.geo.Bounds(mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth());
                    console.log(bounds);

                    log('controller is ready');

                    // todo: bounds must be independent from jassa bounds
                    var p =  handleFetchDataPromiseCreation(scope, bounds);
                    return p;
                }, function(e) {console.log(e)})
                .then(function (data) {

                    log('data was fetched');
                    addFetchedDataToMap(controller, data);
                });
        }

        function handleFetchDataPromiseCreation(scope, bounds) {

            if (! scope.hasOwnProperty('datasource')) {
                throw new Error('no datasource defined');
            }

            if (_.isArray(scope.datasource)) {
                return createMultipleRequestPromises(scope.datasource, bounds);
            } else {
                return createSingleRequestPromise(scope.datasource, bounds)
            }
        }

        function createSingleRequestPromise(datasource, bounds) {
            return datasource.fetchData(bounds);
        }

        // todo: update (datasource, bound);
        function createMultipleRequestPromises(datasource, bounds) {
            var map = _.map(datasource, function (singleSource) {


                var r = singleSource.fetchData(bounds);
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

            $log.debug('number of data sources: ' + fetchedData.length);

            _.each(fetchedData, function (source, index) {
                $log.debug('number elements in source ' + index + ':' + fetchedData[index].length);
            });


            $timeout(function () {
                angular.forEach(fetchedData, function (source) {

                    var dataSet = [];

                    _.each(source, function (item) {
                        // todo: clean up zoomClusterBounds -> are handle by  processItem  log('data was fetched');
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
