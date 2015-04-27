(function () {
    'use strict';

    L.Map.BoxSelect = L.Handler.extend({
        initialize: function (map) {
            this._map = map;
            this._container = map._container;
            this._pane = map._panes.overlayPane;
        },

        addHooks: function () {
            L.DomEvent.addListener(this._container, 'mousedown', this._onMouseDown, this);
        },

        removeHooks: function () {
            L.DomEvent.removeListener(this._container, 'mousedown', this._onMouseDown);
        },

        _onMouseDown: function (e) {

            if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) {
                return false;
            }

            L.DomUtil.disableTextSelection();

            this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

            this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._pane);
            L.DomUtil.setPosition(this._box, this._startLayerPoint);

            //ziTODO move cursor to styles
            this._container.style.cursor = 'crosshair';

            L.DomEvent.addListener(document, 'mousemove', this._onMouseMove, this);
            L.DomEvent.addListener(document, 'mouseup', this._onMouseUp, this);

            L.DomEvent.preventDefault(e);
        },

        _onMouseMove: function (e) {
            var layerPoint = this._map.mouseEventToLayerPoint(e),
                dx = layerPoint.x - this._startLayerPoint.x,
                dy = layerPoint.y - this._startLayerPoint.y;

            var newX = Math.min(layerPoint.x, this._startLayerPoint.x),
                newY = Math.min(layerPoint.y, this._startLayerPoint.y),
                newPos = new L.Point(newX, newY);

            L.DomUtil.setPosition(this._box, newPos);

            this._box.style.width = (Math.abs(dx) - 4) + 'px';
            this._box.style.height = (Math.abs(dy) - 4) + 'px';
        },

        _onMouseUp: function (e) {
            this._pane.removeChild(this._box);
            this._container.style.cursor = '';

            L.DomUtil.enableTextSelection();

            L.DomEvent.removeListener(document, 'mousemove', this._onMouseMove);
            L.DomEvent.removeListener(document, 'mouseup', this._onMouseUp);

            var layerPoint = this._map.mouseEventToLayerPoint(e);

            var bounds = new L.LatLngBounds(
                this._map.layerPointToLatLng(this._startLayerPoint),
                this._map.layerPointToLatLng(layerPoint));

            this._map.fireEvent('boxSelect', bounds);

            //this._map.fitBounds(bounds);
        }
    });

    L.BoxSelect = function(map){
        return new L.Map.BoxSelect(map);
    };
})
();

(function () {
    'use strict';

    L.Map.BoxDraw = L.Handler.extend({
        initialize: function (map) {
            this._map = map;
            this._container = map._container;
            this._pane = map._panes.overlayPane;
        },

        addHooks: function () {
            L.DomEvent.addListener(this._container, 'mousedown', this._onMouseDown, this);
        },

        removeHooks: function () {
            L.DomEvent.removeListener(this._container, 'mousedown', this._onMouseDown);
        },

        _onMouseDown: function (e) {

            if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) {
                return false;
            }

            L.DomUtil.disableTextSelection();

            this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

            this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._pane);
            L.DomUtil.setPosition(this._box, this._startLayerPoint);

            //ziTODO move cursor to styles
            this._container.style.cursor = 'crosshair';

            L.DomEvent.addListener(document, 'mousemove', this._onMouseMove, this);
            L.DomEvent.addListener(document, 'mouseup', this._onMouseUp, this);

            L.DomEvent.preventDefault(e);
        },

        _onMouseMove: function (e) {
            var layerPoint = this._map.mouseEventToLayerPoint(e),
                dx = layerPoint.x - this._startLayerPoint.x,
                dy = layerPoint.y - this._startLayerPoint.y;

            var newX = Math.min(layerPoint.x, this._startLayerPoint.x),
                newY = Math.min(layerPoint.y, this._startLayerPoint.y),
                newPos = new L.Point(newX, newY);

            L.DomUtil.setPosition(this._box, newPos);

            this._box.style.width = (Math.abs(dx) - 4) + 'px';
            this._box.style.height = (Math.abs(dy) - 4) + 'px';
        },

        _onMouseUp: function (e) {
            this._pane.removeChild(this._box);
            this._container.style.cursor = '';

            L.DomUtil.enableTextSelection();

            L.DomEvent.removeListener(document, 'mousemove', this._onMouseMove);
            L.DomEvent.removeListener(document, 'mouseup', this._onMouseUp);

            var layerPoint = this._map.mouseEventToLayerPoint(e);

            var bounds = new L.LatLngBounds(
                this._map.layerPointToLatLng(this._startLayerPoint),
                this._map.layerPointToLatLng(layerPoint));

            this._map.fireEvent('boxDrawn', bounds);

        }
    });

    L.BoxDraw = function(map){
        return new L.Map.BoxDraw(map);
    };
})
();

(function () {
    'use strict';

    L.Control.ModeSelect = L.Control.extend(
        {
            options: {
                position: 'topleft'
            },
            onAdd: function (map) {
                var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
                L.DomEvent
                    .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                    .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                    .addListener(controlDiv, 'click', function () {
                        // todo: document custom event
                        map.fireEvent('toggleMode');
                    });

                var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
                controlUI.title = 'select mode';
                controlUI.href = '#';
                return controlDiv;
            }
        });
})
();


(function () {
    'use strict';

    angular.module('mappify.markerGeneratorService', [])

        /*
         * example how to define custom marker
         *
         * you can provide a alternative definition of your own icons
         * by adding this configuration to your global application
         *
         * .config(function($provide){
         *    $provide.value('mappifyDefaultMarkers',{
         *      'my:marker': {
         *        ...
         *      }
         *    });
         * })
         */
        .value('mappifyDefaultMarkers', {
            'custom:leaflet': {
                options: {
                    shadowUrl: 'http://leafletjs.com/docs/images/leaf-shadow.png',
                    iconUrl: 'http://leafletjs.com/docs/images/leaf-green.png',
                    iconSize: [38, 95],
                    shadowSize: [50, 64],
                    iconAnchor: [22, 94],
                    shadowAnchor: [4, 62],
                    popupAnchor: [-3, -76]
                }
            }
        })
        .factory('MarkerGeneratorService', markerGeneratorService);

    // todo: add iconColor
    function markerGeneratorService(mappifyDefaultMarkers) {

        function generateIconFromString(icon, markerColor) {
            var parts = icon.split(':');

            if (parts.length !== 2) {
                throw 'icon could not be matched to existing options';
            }

            var marker = null;

            switch (parts[0]) {
                case 'fa':
                    marker = generateFaMarker(parts[1], markerColor, 'white');
                    break;
                case 'glyphicon':
                    marker = generateBootstrapMarker(parts[1], markerColor, 'white');
                    break;
                default:
                    marker = generateCustomMarker(icon, markerColor);
            }

            return marker;
        }

        function generateIconFromObject(icon) {
            return L.AwesomeMarkers.icon({
                prefix: icon.prefix,
                icon: icon.icon,
                markerColor: icon.markerColor,
                iconColor: icon.iconColor
            });

        }

        function generateFaMarker(icon, markerColor, iconColor) {
            return L.AwesomeMarkers.icon({
                prefix: 'fa',
                icon: icon,
                markerColor: markerColor,
                iconColor: iconColor
            });
        }

        function generateBootstrapMarker(icon, markerColor, iconColor) {
            return L.AwesomeMarkers.icon({
                prefix: 'glyphicon',
                icon: icon,
                markerColor: markerColor,
                iconColor: iconColor
            });
        }

        function generateCustomMarker(icon) {
            if (!mappifyDefaultMarkers.hasOwnProperty(icon)) {
                throw 'called icon "' + icon + '" is not defined';
            }

            var Icon = L.Icon.extend(mappifyDefaultMarkers[icon]);

            return new Icon();
        }

        /**
         *
         * @param icons = undefined | string | [string,string] | iconObject | [iconObject,iconObject]
         * @returns {{selected: *, unselected: *}}
         */
        function generateMarker(icons) {
            // todo move fa:home to config (default)
            if (icons === undefined) {
                icons = ['fa:home', 'fa:home'];
            }

            // cast to array
            icons = _.flatten([icons]);
            var noSecondIconProvided = false;
            if (icons.length === 1) {
                icons.push(icons[0]);
                noSecondIconProvided = true;
            }

            icons = icons.map(function (icon, idx) {

                // todo move blue and red to config (default)
                // todo handle case: only one marker provided with color red
                var markerColor = idx === 0 ? 'blue' : 'red';
                if (icon instanceof Object) {
                    if(!icon.markerColor || (idx === 1 && noSecondIconProvided)){
                        icon.markerColor = markerColor;
                    }
                    return generateIconFromObject(icon);
                } else {
                    return generateIconFromString(icon, markerColor);
                }
            });

            return {
                selected: icons[1],
                unselected: icons[0]
            };
        }

        // public - api
        return {
            generateMarker: generateMarker
        };

    }
    markerGeneratorService.$inject = ["mappifyDefaultMarkers"];
})
();

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
                // @improvement return promise
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
    dataService.$inject = ["$log", "ElementService"];
})
();
(function () {
    'use strict';

    // the provider returns a factory
    // we are reusing our chainable set methods for provider and factories
    angular
        .module('mappify.configurationProvider', [])
        .provider('mappifyConfiguration', mappifyConfigurationProvider);


    function mappifyConfigurationProvider() {

        /** functions & values */
        var viewCenter = {
            latitude: 51.339018,
            longitude: 12.3797776
        };

        var zoom = 5;
        var popUpsEnabled = true;

        var eventNamePrefix = 'mappify.';
        var events = {
            markerClicked: eventNamePrefix + 'markerClicked',
            selectedMarkerCollectionChanged: eventNamePrefix + 'selectedMarkerCollectionChanged'
        };


        /**                  **/
        /** public functions **/
        /**                  **/
        var init = function(config) {

            if (! _.isObject(config)) {
                return true;
            }

            handleZoomConfiguration(config);
            handleViewCenterConfiguration(config);
            handlePopUpConfiguration(config);
            handleDefaultMarker(config);
        };

        // @improvement move to separate service
        var defaultUnselectedMarker = {};
        var defaultSelectedMarker   = {};

        var handleDefaultMarker = function(config) {

            if (config.hasOwnProperty('marker') && ! _.isEmpty(config.marker)) {

                var markerConfig = config.marker;

                if (markerConfig.hasOwnProperty('unselected')) {
                    defaultUnselectedMarker = config.marker.unselected;
                }

                if (markerConfig.hasOwnProperty('selected')) {
                    defaultSelectedMarker = config.marker.selected;
                }
            }
        };

        var containsMarkerIcons = function() {
            return (! _.empty(defaultUnselectedMarker) || ! _.empty(defaultSelectedMarker));
        };

        var containsIconForUnSelectedMarker = function() {
            return (! _.empty(defaultUnselectedMarker));
        };

        var containsIconForSelectedMarker = function() {
            return (! _.empty(defaultSelectedMarker));
        };

        var getIconForUnSelectedMarker = function() {
            return defaultUnselectedMarker;
        };

        var getIconForSelectedMarker = function() {
            return defaultSelectedMarker;
        };

        /**
         * Overwrites viewCenter
         *
         * @param point {latitude: number, longitude: number}
         */
        var setViewCenter = function (point) {
            if (_.isNumber(point.latitude)) {
                viewCenter.latitude = point.latitude;
            }
            if (_.isNumber(point.longitude)) {
                viewCenter.longitude = point.longitude;
            }
        };

        /**
         * Overwrites zoom value
         * @param value
         */
        var setZoom = function (value) {
            if (_.isNumber(value)) {
                zoom = value;
            }
            return this;
        };

        /**                   **/
        /** private functions **/
        /**                   **/
        var handleZoomConfiguration = function(config) {
            if (config.zoom) {
                setZoom(config.zoom);
            }
        };

        var handleViewCenterConfiguration = function (config) {

            if (config.viewCenter) {
                if (config.viewCenter.latitude && config.viewCenter.longitude) {
                    setViewCenter({
                            latitude: config.viewCenter.latitude,
                            longitude: config.viewCenter.longitude
                        }
                    );
                }
            }
        };

        var arePopUpsEnabled = function() {
            return popUpsEnabled;
        };


        var handlePopUpConfiguration = function (config) {

            if (config.popUp instanceof Object && config.popUp.hasOwnProperty('enabled')) {

                // we only allow boolean values
                if(! _.isBoolean(config.popUp.enabled)) {
                    throw 'error: config.popUp.enabled must be from type boolean';
                }

                popUpsEnabled = config.popUp.enabled;
            }
        };

        /**                  **/
        /** factory          **/
        /**                  **/
        function MappifyConfiguration() {
            var factory = {
                init: init,
                setZoom: setZoom,
                arePopUpsEnabled: arePopUpsEnabled,
                setViewCenter: setViewCenter,
                events: events,
                containsMarkerIcons: containsMarkerIcons,
                containsIconForSelectedMarker: containsIconForSelectedMarker,
                containsIconForUnSelectedMarker: containsIconForUnSelectedMarker,
                getIconForSelectedMarker: getIconForSelectedMarker,
                getIconForUnSelectedMarker: getIconForUnSelectedMarker
            };

            factory.getView = function () {
                // return viewCenter in Leaflet format
                return {
                    center: [viewCenter.latitude, viewCenter.longitude],
                    zoom: zoom
                };
            };



            return factory;
        }

        /**                   **/
        /** factory provider  **/
        /**                   **/
        var configProvider = {
            setZoom: setZoom,
            setViewCenter: setViewCenter
        };

        configProvider.$get = function () {
            return new MappifyConfiguration();
        };

        return configProvider;
    }

})
();

// todo: autoload

var MappifyMap = MappifyMap || {};

MappifyMap.helpers = {

    isNotString: function(str) {
        return (typeof str !== "string");
    }
};

(function () {
    'use strict';

    angular.module('mappify.markerDirective', ['mappify.ctrl','mappify.directive'])
        .directive('mappifyMarker', mappifyMarker);

    function mappifyMarker($log) {
        return {
            restrict: 'E',
            scope: false,
            transclude: true,
            require: '^mappify',
            link: {
                post: function (scope, element, attrs, mapController) {
                    $log.debug('mappifyMarker: post link');

                    // @improvement replace fa:home by configurable value
                    mapController.setConceptIcon(attrs.concept, attrs.icon || 'fa:home');
                    mapController.setPopUpTemplateUrl(attrs.concept, attrs.templateUrl);
                    mapController.setLayer(attrs.concept, attrs.layer);
                }
            }
        };

    }
    mappifyMarker.$inject = ["$log"];
})
();


(function () {
    'use strict';

    var debugMessagePrefix = 'mappify-directive:';

    angular.module('mappify.directive', [
            'mappify.configurationProvider',
            'mappify.ctrl',
            'mappify.jsonBoxDirective'
        ])
        .directive('mappify', mappify);

    function mappify($log, mappifyConfiguration) {
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
                    $log.debug(debugMessagePrefix + 'pre link');
                    populateMappifyConfigurationWithPassConfigValues(mappifyConfiguration, scope.config);
                    handleLayerConfiguration(scope, controller);
                    applyConfigToController(mappifyConfiguration, controller);

                    scope.$watch('config', function() {
                        populateMappifyConfigurationWithPassConfigValues(mappifyConfiguration, scope.config);
                        applyConfigToController(mappifyConfiguration, controller);
                        $log.debug(debugMessagePrefix + 'config changed')}
                    );

                },
                post: function (scope, elem, attrs, controller) {
                    $log.debug(debugMessagePrefix + 'post link');
                    controller.fetchDataFormDataSources(scope);
                }
            }
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
    }
    mappify.$inject = ["$log", "mappifyConfiguration"];
})();

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
            configTileLayer: configTileLayer,
            getMap: getMap,
            fetchDataFormDataSources: fetchDataFormDataSources,
            isReady: isReady,
            removeMarkerFromMap: removeMarkerFromMap,
            setConceptIcon: setConceptIcon,
            setLayer: setLayer,
            setPopUpTemplate: setPopUpTemplate,
            setPopUpTemplateUrl: setPopUpTemplateUrl,
            setView: setView,
            toggleMarkerMode: toggleMarkerMode
        });

        var map = null;
        var markerMode = 'select';
        var promises = [];
        // collection containing all selected markers. the markers id is used as key
        var selectedMarkerCollection = [];
        var markerToIconMap = {};
        var conceptIconMapping = {};
        var templateHtmlContainer = {};
        var mapPromise = $q.defer();
        var scope;

        initMap();

        /** data fetching start **/
        /**
         * we add fetchData and dataWasFetchedFunction to the promise chain
         *
         * @param passedScope
         */
        function fetchDataFormDataSources(passedScope) {

            scope = passedScope;

            Promise
                .resolve(isReady())
                .then(
                    function () {
                        // bounding box mapping
                        // @improve implement an mapBoundMapper or boundsTransFormerService
                        var mapBounds = ctrl.getMap().getBounds();
                        var bounds = new jassa.geo.Bounds(mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth());

                        // @improve bounds could be independent from jassa bounds
                        return DataService.fetchDataFormDataSources(map, scope, bounds);
                    },
                    function(e) {
                        console.log(e)
                    }
                );
        }

        /** data fetching end **/


        /* PUBLIC */
        function setView(view) {

            $log.debug('MappifyController: called setView');
            map.setView(view.center, view.zoom);
        }

        function configTileLayer() {
            checkPreConditions();

            // @improve support more than tile provider than google maps
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
                fetchDataFormDataSources(scope);

                // emit global / external event
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
            // @improvement pass the map id as param => to support multiple maps per site
            map = L.map('map');

            registerEvents();

            mapPromise.resolve(map);
        }

    }
    MappifyController.$inject = ["$scope", "$timeout", "$q", "$rootScope", "$http", "$compile", "$log", "MarkerGeneratorService", "mappifyConfiguration", "ElementService", "DataService"];

})
();

/**
 * @see http://jsfiddle.net/HzYQn/
 * @see http://stackoverflow.com/questions/17893708/angularjs-textarea-bind-to-json-object-shows-object-object
 */
(function () {
    'use strict';

    angular.module('mappify.jsonBoxDirective', ['mappify.directive'])
        .directive('jsonBox', jsonBox);

    function jsonBox() {

        console.log('jsonBox:called');

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {

                function into(input) {
                    console.log(JSON.parse(input));
                    return JSON.parse(input);
                }
                function out(data) {
                    return JSON.stringify(data, null, 4);
                }
                ngModel.$parsers.push(into);
                ngModel.$formatters.push(out);
            }
        };
    }
})
();

angular.module('mappify', ['mappify.directive','mappify.markerDirective']);
