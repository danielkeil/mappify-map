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
        // todo: check namespace strategy => should we rename it to mappify.defaultMarkers
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

        // todo: check - do we really need this
        function generateCustomMarker(icon) {
            if (!mappifyDefaultMarkers.hasOwnProperty(icon)) {
                throw 'called icon "' + icon + '" is not defined';
            }

            var Marker = L.Icon.extend(mappifyDefaultMarkers[icon]);

            return new Marker();
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
})
();
