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
        var prefix = 'mappify.';
        var events = {
            markerClicked: prefix + 'markerClicked',
            selectedMarkerCollectionChanged: prefix + 'selectedMarkerCollectionChanged'
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
            return this;
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

        /** factory */
        function MappifyConfiguration() {
            var factory = {
                setZoom: setZoom,
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

        /** factory provider */
        var provider = {
            setZoom: setZoom,
            setViewCenter: setViewCenter
        };

        provider.$get = function () {
            return new MappifyConfiguration();
        };

        return provider;
    }

})
();
