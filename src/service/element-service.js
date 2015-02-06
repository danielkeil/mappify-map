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
            if (elementData.hasOwnProperty('polygon')) {
                return L.polygon(elementData.polygon)
            } else {
                return L.marker(

                    [elementData.latitude, elementData.longitude]
                );
            }
        }

        function elementClicked(markerData) {

            return function (event) {

                console.log(markerData);

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

            // register events
            element.on('click', elementClicked(elementData) );

            // add element to map
            element.addTo(map);

            // to be able to remove them later it's necessary to store the element outside the map
            // todo: should use key
            elementCollection[elementData.id] = element;
        }

        function removeElementFormMap(elementKey) {
            if (elementCollection.hasOwnProperty(elementKey)) {

                // remove element from map
                map.remove(elementCollection[elementKey]);

                // remove element from collection
                delete(elementCollection[elementKey]);
            }
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
            removeElementFormMap: removeElementFormMap,
            addLayer: addLayer
        };

    }
})
();
