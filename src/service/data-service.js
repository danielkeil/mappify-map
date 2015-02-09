(function () {
    'use strict';

    angular.module('mappify.dataService', ['mappify.elementService'])
        .factory('DataService', dataService);

    function dataService($timeout, $log, ElementService) {

        console.log(ElementService);

        var service = this;

        var map;

        var setMap = function (map) {
            service.map = map;
        };

        function handleFetchDataPromiseCreation(map, scope, bounds) {

            setMap(map);

            if (!scope.hasOwnProperty('datasource')) {
                throw new Error('no datasource defined');
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
                            $log.log('data was fetched');

                            data = processFetchedDataToMap(data);

                            _.forEach(data, function (element) {
                                ElementService.addElementToMap(service.map, element);
                            })
                        });

                    return r;
                }
            )

            return jassa.util.PromiseUtils.all(map);
        }

        // @see: http://jsperf.com/23293323
        function wktCoordinatesToLatLong(polygon) {
            return _.map(polygon[0], function (point) {
                return [point[1], point[0]]
            });
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
                    data.latitude = wktElement.coordinates[1];
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
         * @param source
         */
        function processFetchedDataToMap(source) {

            $log.debug('number elements in source:' + source.length);

            var dataSet = [];

            _.each(source, function (item) {
                // todo: clean up zoomClusterBounds -> are handle by  processItem  log('data was fetched');
                //if (item.val && item.val.hasOwnProperty('zoomClusterBounds')) {
                //console.log(item);
                //}

                dataSet.push(processItem(item))
            });

            return dataSet;
        }

        // public - api
        return {
            handleFetchDataPromiseCreation: handleFetchDataPromiseCreation,
            processItem: processItem
        };

    }
})
();