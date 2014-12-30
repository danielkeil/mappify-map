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

