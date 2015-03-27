(function () {
    'use strict';

    angular.module('mappify.elementService', [
            'mappify.configurationProvider',
            'mappify.markerGeneratorService',
        ] )
        .factory('ElementService', elementService);

    elementService.$inject = ['$rootScope', '$log', 'mappifyConfiguration', 'MarkerGeneratorService'];

    function elementService($rootScope, $log, mappifyConfiguration, MarkerGeneratorService) {

        var service = this;

        // collection containing all elements. the element id is used as key
        var elementCollection = {};

        // collection containing all layers.
        var layerCollection = {};

        // indicates the layer control visibility
        // three stats: null( never defined ), true anf false
        var layerControl = null;

        function elementClicked(markerData) {

            return function (event) {
                console.log('ElementService::elementClicked - ' + markerData);

                $rootScope.$emit('marker clicked', markerData);
            };
        }

        function handlePopUp(element, popUpContent) {
            if (false === popUpContent) {
                return service;
            }

            element.bindPopup(popUpContent);
        }


        function createElement(elementData) {

            if (! elementData.hasOwnProperty('type')) {
                throw new Error('no type found ')
            }

            var type = elementData.type.toLowerCase();

            switch (type) {
                case 'point':
                    return createMarker(elementData);
                case 'polygon':
                    return createPolygon(elementData);
                default:
                    $log.warn('dataSource contains the unsupported type (' + type.toString() + ')' );
            }

            return null;
        }

        function generateMarkerIcon() {

            var infoSet = [];

            if (mappifyConfiguration.containsIconForUnSelectedMarker) {

                infoSet.push(mappifyConfiguration.getIconForUnSelectedMarker());
            }

            if (mappifyConfiguration.containsIconForSelectedMarker) {
                infoSet.push(mappifyConfiguration.getIconForSelectedMarker());
            }

            if (_.isEmpty(infoSet)) {
                infoSet = undefined;
            }

            return MarkerGeneratorService.generateMarker(infoSet).unselected;
        }

        function createMarker(elementData) {

            var newMarker = L.marker(
                [elementData.latitude, elementData.longitude]
            );

            if (mappifyConfiguration.containsMarkerIcons) {
                newMarker.setIcon(generateMarkerIcon());
            }

            return newMarker;
        }

        function createPolygon(elementData) {
            return L.polygon(elementData.coordinates)
        }

        // public functions
        function addElementToMap(map, elementData, popUpContent) {
            // create element - could be an point (marker) or polygon
            var element = createElement(elementData);

            if (null !== element) {
                // popup handling - append to popUpContent (if present) as popUp to the element
                handlePopUp(element, popUpContent);

                // add element to map
                element.addTo(map);

                // register events
                element.on('click', function() {map.removeLayer(element)} );

                // to be able to remove them later it's necessary to store the element outside the map
                // todo: should use key
                elementCollection[elementData.id] = element;
            }
        }

        function removeElementFormMap(map, elementKey) {

            if (elementCollection.hasOwnProperty(elementKey)) {

                // remove element from map
                try {
                    map.removeLayer(elementCollection[elementKey]);
                    $log.info('removedElementFromMap' + elementKey);
                } catch (error){
                    console.log(error);
                    console.log(elementCollection[elementKey]);
                }

                // remove element from collection
                delete(elementCollection[elementKey]);
            }
        }

        function removeAllElementsFromMap(map)
        {
            _.forOwn(elementCollection, function(element, key) {
                removeElementFormMap(map, key)
            });
        }

        function addLayer(map, source, layer)
        {
            if (_.isEmpty(layer)) {
                return true;
            }

            checkIfLayerControlsExistAndCreateThemIfNecessary(map);

            // create new layer, add to map and layer controls
            var newLayer = new L.LayerGroup();
            newLayer.addTo(map);
            layerControl.addOverlay(newLayer, layer);

            layerCollection[source] = newLayer;
        }

        function checkIfLayerControlsExistAndCreateThemIfNecessary(map)
        {
            if (layerControl === null) {
                layerControl = new L.control.layers();
                layerControl.addTo(map);
            }
        }

        // public - api
        return {
            addElementToMap: addElementToMap,
            addLayer: addLayer,
            removeElementFormMap: removeElementFormMap,
            removeAllElementsFromMap: removeAllElementsFromMap
        };

    }
})
();
