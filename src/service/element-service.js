(function () {
    'use strict';

    angular.module('mappify.elementService', [] )
        .factory('ElementService', elementService);

    elementService.$inject = ['$rootScope'];

    function elementService($rootScope) {

        var service = this;

        // collection containing all elements. the element id is used as key
        var elementCollection = {};

        // collection containing all layer.
        var layerCollection = {};

        var layerControl = null;

        function createElement(elementData) {

            if (! elementData.hasOwnProperty('type')) {
                throw new Error('no type found ')
            }

            // todo use switch

            if (elementData.type.toLowerCase() !== 'point') {
                //console.log(elementData.type);
                //console.log(elementData);
            }

            if (elementData.type.toLowerCase() === 'polygon') {
                return L.polygon(elementData.coordinates)
            } else {

                return L.marker(
                    [elementData.latitude, elementData.longitude]
                );
            }
        }

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

        // public functions
        function addElementToMap(map, elementData, popUpContent) {

             // create element - could be an point (marker) or polygon
            var element = createElement(elementData);

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

        function removeElementFormMap(map, elementKey) {

            if (elementCollection.hasOwnProperty(elementKey)) {

                // remove element from map
                try {
                    map.removeLayer(elementCollection[elementKey]);
                    console.log('removeAllElementsFromMap' + elementKey);

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
