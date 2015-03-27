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
