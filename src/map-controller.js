(function () {
    'use strict';

    angular.module('mappify.ctrl', ['mappify.markerGeneratorService', 'mappify.configurationProvider'])
        .controller('MappifyController', MappifyController);


    function MappifyController($scope, $timeout, $q, $rootScope, $http, $compile, $log, MarkerGeneratorService, mappifyConfiguration) {

        var ctrl = this;

        angular.extend(ctrl, {
            addMarkerToMap: addMarkerToMap,
            configTileLayer: configTileLayer,
            isReady: isReady,
            removeMarkerFromMap: removeMarkerFromMap,
            setConceptIcon: setConceptIcon,
            setLayer: setLayer,
            setPopUpTemplate: setPopUpTemplate,
            setPopUpTemplateUrl: setPopUpTemplateUrl,
            setView: setView,
            toggleMarkerMode: toggleMarkerMode
        });

        // select / popup
        var markerMode = 'popup';
        var map = null;
        var promises = [];
        // collection containing all markers. the markers id is used as key
        // todo: group markers by layer support
        var markerCollection = {};

        // collection containing all selected markers. the markers id is used as key
        var selectedMarkerCollection = [];

        var markerToIconMap = {};

        var conceptIconMapping = {};

        var templateHtmlContainer = {};

        var mapPromise = $q.defer();

        var layerCollection = {};

        var layerControl = null;

        angular.extend(ctrl, {});

        initMap();

        /* PUBLIC */
        function setView(view) {
            map.setView(view.center, view.zoom);
        }

        function configTileLayer() {
            checkPreConditions();

            var ggl = new L.Google('ROADMAP');
            map.addLayer(ggl);
        }

        function addMarkerToMap(concept, markerData) {
            checkPreConditions();
            checkConceptTemplateExistence(concept);

            //L.marker([51.5,Math.random() * 50]).addTo(map);

            console.log(concept);
            console.log(markerData);

            var newScope = $scope.$new();
            newScope.data = markerData;

            var popUpContent = $compile(templateHtmlContainer[concept])(newScope);

            // todo: update -> we support more icons now
            // we currently only support font awesome icons

            markerData.icons = MarkerGeneratorService.generateMarker(conceptIconMapping[concept]);
            markerToIconMap[markerData.id] = markerData.icons;

            var marker = L.marker(
                [markerData.latitude, markerData.longitude],
                {
                    icon: markerData.icons.unselected
                }
            )
                // because $compile returns array with one element, we have to use this notation
                .bindPopup(popUpContent[0]);

            marker.on('click', markerClicked(markerData, marker));

            if (layerCollection.hasOwnProperty(concept)) {
                marker.addTo(layerCollection[concept]);
            } else {
                marker.addTo(map);
            }

            markerCollection[markerData.id] = marker;
        }

        function setConceptIcon(concept, icon) {
            conceptIconMapping[concept] = icon;
        }

        function removeMarkerFromMap(markerKey) {
            if (markerCollection.hasOwnProperty(markerKey)) {

                // remove marker from map
                map.remove(markerCollection[markerKey]);

                // remove marker from collection
                delete(markerCollection[markerKey]);
            }
        }

        function setPopUpTemplateUrl(concept, templateUrl) {

            promises.push(
                $http.get(templateUrl)
                    .success(function (html) {
                        templateHtmlContainer[concept] = html;
                    })
                    .error(function () {
                        throw 'unable to load template from "' + templateUrl + '" for concept "' + concept + '"';
                    })
            );

        }

        function setLayer(concept, layer) {
            if (!_.isEmpty(layer)) {
                if (layerControl === null) {
                    layerControl = new L.control.layers();
                    layerControl.addTo(map);
                }
                var newLayer = new L.LayerGroup();

                newLayer.addTo(map);

                layerControl.addOverlay(newLayer, layer);

                layerCollection[concept] = newLayer;
            }
        }

        function setPopUpTemplate(concept, html) {
            templateHtmlContainer[concept] = html;
        }


        function toggleMarkerMode() {
            markerMode = (markerMode === 'popup') ? 'select' : 'popup';
        }

        function isReady() {
            return $q.all(promises).then(function () {
                $log.debug('templates: loaded');
            });
        }


        /* PRIVATE */

        // all map controller methods should call this method to to verify preconditions
        function checkPreConditions() {
            // to work with an map there must be an map
            checkMapExists();
        }

        function checkMapExists() {
            if (map === null) {
                throw 'no map defined';
            }
        }

        function checkConceptTemplateExistence(concept) {
            if (!templateHtmlContainer.hasOwnProperty(concept)) {
                throw 'no template defined for concept "' + concept + '"';
            }
        }

        function markerClicked(markerData, marker) {

            return function (event) {

                if (markerMode !== 'popup') {
                    // prevent show popup
                    // todo: find a better way
                    event.target.closePopup();

                    toggleMarkerSelection(marker, markerData.id);
                    triggerSelectedMarkerCollectionChangedEvent();
                }

                // todo: maybe rename / move
                // mappify.eventMap (see scala / akka - akka in action)
                $rootScope.$emit(mappifyConfiguration.events.markerClicked, this);
            };
        }

        function triggerSelectedMarkerCollectionChangedEvent() {

            // @see http://stackoverflow.com/questions/24913567/angularjs-throwing-an-event-via-emit-or-broadcast-from-directive-to-control
            // @notice replaced scope.$apply with $timeout

            $timeout(function () {
                $rootScope.$emit(
                    mappifyConfiguration.events.selectedMarkerCollectionChanged,
                    selectedMarkerCollection
                );
            });
        }


        function registerEvents() {
            // todo: remove
            //$rootScope.$on(mappifyConfiguration.events.markerClicked, function (e, data) {
            //$log.debug('as', data);
            //});


            // @see http://stackoverflow.com/questions/24913567/angularjs-throwing-an-event-via-emit-or-broadcast-from-directive-to-control
            map.on('load', function () {
                $timeout(function () {
                    $rootScope.$emit('mappify.map.boundsChanged', map.getBounds());
                });
            });

            map.on('moveend', function () {
                $timeout(function () {
                    $rootScope.$emit('mappify.map.boundsChanged', map.getBounds());
                });
            });
            map.on('toggleMode', function () {
                toggleMarkerMode();
            });

            map.on('boxSelect', handleBoxSelectEvent);
        }

        function handleBoxSelectEvent(event) {
            var bounds = new L.LatLngBounds(
                event._southWest,
                event._northEast
            );

            _.forEach(markerCollection, function (marker, id) {
                if (bounds.contains(marker._latlng)) {

                    // todo - choose strategy
                    toggleMarkerSelection(marker, id);
                    //addMarkerToMarkerSelection(marker, id);
                }
            });

            triggerSelectedMarkerCollectionChangedEvent();
        }

        /**
         * returns
         *  true if the marker wars added
         *  false if the marker wars removed
         *
         * @param marker
         * @returns {boolean}
         */
        function toggleMarkerSelection(marker, id) {
            var position = selectedMarkerCollection.indexOf(id);

            var icons = markerToIconMap[id];

            if (-1 !== position) {
                selectedMarkerCollection.splice(position, 1);
                marker.setIcon(icons.unselected);
                return false;

            } else {
                selectedMarkerCollection.push(id);
                marker.setIcon(icons.selected);
                return true;
            }
        }

        /* jshint ignore:start */
        function addMarkerToMarkerSelection(marker, id) {
            var position = selectedMarkerCollection.indexOf(id);

            var icons = markerToIconMap[id];

            if (-1 === position) {
                selectedMarkerCollection.push(id);
                marker.setIcon(icons.selected);
            }
        }
        /* jshint ignore:end */

        function initMap() {
            // todo: pass 'map' as param => multiple maps per site
            map = L.map('map', {drawControl: true});

            registerEvents();

            //var modusSelectControl = new L.Control.ModeSelect();
            //map.addControl(modusSelectControl);

            // init multi select
            // todo: only enable BoxSelect in mode select
            //map.boxZoom.disable();
            //L.BoxSelect(map).enable();
            //L.BoxDraw(map).enable();


            mapPromise.resolve(map);
        }

    }

})
();
