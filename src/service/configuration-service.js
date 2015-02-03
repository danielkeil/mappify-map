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

        // todo: move to separate file
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
                events: events
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
