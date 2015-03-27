(function () {
    'use strict';

    angular.module('mappify.dataService', ['mappify.elementService'])
        .factory('DataService', dataService);

    var logMessagePrefix = 'dataService: ';

    function dataService($log, ElementService) {

        var service = this;

        var setMap = function (map) {
            service.map = map;
        };

        function fetchDataFormDataSources(map, scope, bounds) {

            setMap(map);

            if (! scope.hasOwnProperty('datasource')) {
                return null;
            }

            if (!_.isArray(scope.datasource)) {
                return createMultipleRequestPromises([scope.datasource], bounds);
            } else {
                return createMultipleRequestPromises(scope.datasource, bounds)
            }
        }

        function createMultipleRequestPromises(datasource, bounds) {
            var map = _.map(datasource, function (singleSource) {

                    var r = singleSource.fetchData(bounds);
                    r = Promise.resolve(r).
                        then(function (data) {
                            $log.info(logMessagePrefix + 'data was fetched');
                            data = processFetchedData(data);

                            // @improvement remove all elements at once by removing the layer
                            _.forEach(data, function (element) {
                                ElementService.addElementToMap(service.map, element);
                            })
                        });

                    return r;
                }
            );

            return jassa.util.PromiseUtils.all(map);
        }

        // @see: http://jsperf.com/23293323
        function wktCoordinatesToLatLng(polygon) {
            return _.map(polygon[0], function (point) {
                return [point[1], point[0]]
            });
        }

        // @improvement - implement as strategy pattern and inject
        function processSingleDataSourceElement(element) {
            var data = {};

            if (element.hasOwnProperty('key') && element.key.hasOwnProperty('uri')) {
                data.id = element.key.uri;
            }

            if (element.hasOwnProperty('val') && element.val.hasOwnProperty('wkt')) {
                // todo: check parsing error case
                var wktElement = Terraformer.WKT.parse(element.val.wkt);

                if (wktElement.type === 'Point') {
                    data.type = 'Point';
                    data.latitude = wktElement.coordinates[1];
                    data.longitude = wktElement.coordinates[0];
                } else if (wktElement.type === 'Polygon') {
                    data.type = 'Polygon';
                    data.coordinates = wktCoordinatesToLatLng(wktElement.coordinates);
                } else {
                    console.log(data);
                }

                return data;
            }

            return [];
        }

        /**
         * @param source
         */
        function processFetchedData(source) {

            $log.info(logMessagePrefix + 'number elements in source:' + source.length);

            var dataSet = [];

            _.each(source, function (item) {
                dataSet.push(processSingleDataSourceElement(item))
            });

            return dataSet;
        }

        // public - api
        return {
            fetchDataFormDataSources: fetchDataFormDataSources
        };

    }
})
();