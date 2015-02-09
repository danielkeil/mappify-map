(function () {
    'use strict';

    angular.module('mappify.ctrl', [
            'mappify.markerGeneratorService',
            'mappify.configurationProvider',
            'mappify.elementService',
            'mappify.dataService'
        ])
        .controller('MappifyController', MappifyController);


    function MappifyController($scope, $timeout, $q, $rootScope, $http, $compile, $log, MarkerGeneratorService, mappifyConfiguration, ElementService, DataService) {

        var ctrl = this;

        angular.extend(ctrl, {
            //addElementToMap: addElementToMap,
            getMap: getMap,
            configTileLayer: configTileLayer,
            isReady: isReady,
            removeMarkerFromMap: removeMarkerFromMap,
            setConceptIcon: setConceptIcon,
            setLayer: setLayer,
            setPopUpTemplate: setPopUpTemplate,
            setPopUpTemplateUrl: setPopUpTemplateUrl,
            setView: setView,
            toggleMarkerMode: toggleMarkerMode,
            chainPromiseToTheControllerIsReadyPromise: chainPromiseToTheControllerIsReadyPromise
        });

        var markerMode;

        var map = null;

        var promises = [];

        // collection containing all selected markers. the markers id is used as key
        var selectedMarkerCollection = [];

        var markerToIconMap = {};

        var conceptIconMapping = {};

        var templateHtmlContainer = {};

        var mapPromise = $q.defer();

        angular.extend(ctrl, {});

        initMap();

        /** data fetching start **/
        /**
         * we add fetchData and dataWasFetchedFunction to the promise chain
         *
         * @param scope
         */
        function chainPromiseToTheControllerIsReadyPromise(scope) {

            // $q.when(bluebirdPromise).then( ... )

            Promise
                .resolve(isReady())
                .then(function () {

                    // bounding box mapping
                    // should be configurable
                    // todo implement an mapBoundMapper or boundsTransFormerService
                    var mapBounds = ctrl.getMap().getBounds();
                    var bounds = new jassa.geo.Bounds(mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth());

                    // todo: bounds must be independent from jassa bounds

                    var p =  DataService.handleFetchDataPromiseCreation(map, scope, bounds);
                    return p;
                }, function(e) {console.log(e)});
        }

        /** data fetching end **/


        /* PUBLIC */
        function setView(view) {

            $log.debug('MappifyController: called setView');
            $log.debug(view);


            map.setView(view.center, view.zoom);
        }

        function configTileLayer() {
            checkPreConditions();

            var ggl = new L.Google('ROADMAP');
            map.addLayer(ggl);
        }

        function getMap()
        {
            return map;
        }

        function removeMarkerFromMap(markerId)
        {
            return ElementService.removeMarkerFromMap(markerId);
        }


        // todo: clean up - looks messy
        function renderPopUpContent(concept, elementData) {

            checkConceptTemplateExistence(concept);
            var newScope = $scope.$new();
            newScope.data = elementData;

            var popUpContent = $compile(templateHtmlContainer[concept])(newScope);

            // because $compile returns array with one element, we have to use this notation
            return popUpContent[0];
        }

        function setConceptIcon(concept, icon) {
            conceptIconMapping[concept] = icon;
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

        function setLayer(source, layer) {
            ElementService.addLayer(map, source, layer);
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

        function triggerSelectedMarkerCollectionChangedEvent() {

            // @notice replaced scope.$apply with $timeout
            $timeout(function () {
                $rootScope.$emit(
                    mappifyConfiguration.events.selectedMarkerCollectionChanged,
                    selectedMarkerCollection
                );
            });
        }


        function registerEvents() {
            // @see http://stackoverflow.com/questions/24913567/angularjs-throwing-an-event-via-emit-or-broadcast-from-directive-to-control
            map.on('load', function () {
                $timeout(function () {
                    $rootScope.$emit('mappify.map.boundsChanged', map.getBounds());
                });
            });

            map.on('moveend', function () {
                // process internally
                updateBoundingBox(map.getBounds());

                // emit global / external event
                $timeout(function () {
                    $rootScope.$emit('mappify.map.boundsChanged', map.getBounds());
                });

            });

            map.on('toggleMode', function () {
                toggleMarkerMode();
            });

            map.on('boxSelect', handleBoxSelectEvent);

            // todo: remove late - testing function
            function onMapClick(e) {
                console.log("You clicked the map at " + e.latlng.toString())
            }

            map.on('click', onMapClick);

        }

        function updateBoundingBox(bounds) {

            var x = new jassa.geo.Bounds(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth());
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
