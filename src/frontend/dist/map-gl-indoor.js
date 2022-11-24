'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var mapboxgl = require('mapbox-gl');
var bbox = require('@turf/bbox');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var mapboxgl__default = /*#__PURE__*/_interopDefaultLegacy(mapboxgl);
var bbox__default = /*#__PURE__*/_interopDefaultLegacy(bbox);

/**
 * Creates a indoor control with floors buttons

 * @implements {IControl}
 */
class IndoorControl {
    constructor(indoor) {
        this._onMapLoaded = ({ indoorMap }) => {
            this._indoorMap = indoorMap;
            this._updateNavigationBar();
            this._setSelected(this._indoor.getLevel());
        };
        this._onMapUnLoaded = () => {
            this._indoorMap = null;
            this._updateNavigationBar();
        };
        this._onLevelChanged = ({ level }) => this._setSelected(level);
        this._indoor = indoor;
        this._levelsButtons = [];
        this._container = null;
        this._selectedButton = null;
    }
    onAdd(map) {
        this._map = map;
        // Create container
        this._container = document.createElement("div");
        this._container.classList.add("mapboxgl-ctrl");
        this._container.classList.add("mapboxgl-ctrl-group");
        this._container.style.display = 'none';
        this._container.addEventListener('contextmenu', this._onContextMenu);
        // If indoor layer is already loaded, update levels
        this._indoorMap = this._indoor.getSelectedMap();
        if (this._indoor.getSelectedMap() !== null) {
            this._updateNavigationBar();
            this._setSelected(this._indoor.getLevel());
        }
        // Register to indoor events
        this._map.on('indoor.map.loaded', this._onMapLoaded);
        this._map.on('indoor.map.unloaded', this._onMapUnLoaded);
        this._map.on('indoor.level.changed', this._onLevelChanged);
        return this._container;
    }
    onRemove() {
        this._container.remove();
        this._container = null;
        this._map.off('indoor.map.loaded', this._onMapLoaded);
        this._map.off('indoor.map.unloaded', this._onMapUnLoaded);
        this._map.off('indoor.level.changed', this._onLevelChanged);
    }
    _updateNavigationBar() {
        if (this._container === null) {
            return;
        }
        if (this._indoorMap === null) {
            this._container.style.display = 'none';
            return;
        }
        this._container.style.display = 'block';
        this._levelsButtons = [];
        while (this._container.firstChild) {
            this._container.removeChild(this._container.firstChild);
        }
        const range = this._indoorMap.levelsRange;
        for (let i = range.max; i >= range.min; i--) {
            this._levelsButtons[i] = this._createLevelButton(this._container, i);
        }
    }
    _setSelected(level) {
        if (this._levelsButtons.length === 0) {
            return;
        }
        if (this._selectedButton) {
            this._selectedButton.style.fontWeight = "normal";
        }
        if (level !== null && this._levelsButtons[level]) {
            this._levelsButtons[level].style.fontWeight = "bold";
            this._selectedButton = this._levelsButtons[level];
        }
    }
    _createLevelButton(container, level) {
        const a = document.createElement("button");
        a.innerHTML = level.toString();
        a.classList.add("mapboxgl-ctrl-icon");
        container.appendChild(a);
        a.addEventListener('click', () => {
            this._map.fire('indoor.control.clicked', { level });
            if (this._indoor.getLevel() === level)
                return;
            this._indoor.setLevel(level);
        });
        return a;
    }
    _onContextMenu(e) {
        e.preventDefault();
    }
}

const EarthRadius = 6371008.8;
function overlap(bounds1, bounds2) {
    // If one rectangle is on left side of other
    if (bounds1.getWest() > bounds2.getEast() || bounds2.getWest() > bounds1.getEast()) {
        return false;
    }
    // If one rectangle is above other
    if (bounds1.getNorth() < bounds2.getSouth() || bounds2.getNorth() < bounds1.getSouth()) {
        return false;
    }
    return true;
}
function filterWithLevel(initialFilter, level, showFeaturesWithEmptyLevel = false) {
    return [
        "all",
        initialFilter,
        [
            'any',
            showFeaturesWithEmptyLevel ? ["!", ["has", "level"]] : false,
            [
                'all',
                [
                    "has",
                    "level"
                ],
                [
                    "any",
                    [
                        "==",
                        ["get", "level"],
                        level.toString()
                    ],
                    [
                        "all",
                        [
                            "!=",
                            [
                                "index-of",
                                ";",
                                ["get", "level"]
                            ],
                            -1,
                        ],
                        [
                            ">=",
                            level,
                            [
                                "to-number",
                                [
                                    "slice",
                                    ["get", "level"],
                                    0,
                                    [
                                        "index-of",
                                        ";",
                                        ["get", "level"]
                                    ]
                                ]
                            ]
                        ],
                        [
                            "<=",
                            level,
                            [
                                "to-number",
                                [
                                    "slice",
                                    ["get", "level"],
                                    [
                                        "+",
                                        [
                                            "index-of",
                                            ";",
                                            ["get", "level"]
                                        ],
                                        1
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ];
}
function destinationPoint(start, distance, bearing) {
    const dR = distance / EarthRadius;
    const cosDr = Math.cos(dR);
    const sinDr = Math.sin(dR);
    const phi1 = start.lat / 180 * Math.PI;
    const lambda1 = start.lng / 180 * Math.PI;
    const phi2 = Math.asin(Math.sin(phi1) * cosDr
        + Math.cos(phi1) * sinDr * Math.cos(bearing));
    const lambda2 = lambda1 + Math.atan2(Math.sin(bearing) * sinDr * Math.cos(phi1), cosDr - Math.sin(phi1) * Math.sin(phi2));
    return new mapboxgl.LngLat(lambda2 * 180 / Math.PI, phi2 * 180 / Math.PI);
}
function distance(point1, point2) {
    const lat1 = point1.lat / 180 * Math.PI;
    const lng1 = point1.lng / 180 * Math.PI;
    const lat2 = point2.lat / 180 * Math.PI;
    const lng2 = point2.lng / 180 * Math.PI;
    const dlat = lat2 - lat1;
    const dlng = lng2 - lng1;
    const angle = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;
    const tangy = Math.sqrt(angle);
    const tangx = Math.sqrt(1 - angle);
    const cosn = 2 * Math.atan2(tangy, tangx);
    return EarthRadius * cosn;
}

const SOURCE_ID = 'indoor';
/**
 * Manage indoor levels
 * @param {Map} map the Mapbox map
 */
class Indoor {
    constructor(map) {
        this._map = map;
        this._level = null;
        this._indoorMaps = [];
        this._savedFilters = [];
        this._selectedMap = null;
        this._previousSelectedMap = null;
        this._previousSelectedLevel = null;
        this._mapLoaded = false;
        this._updateMapPromise = Promise.resolve();
        this._control = new IndoorControl(this);
        if (this._map.loaded()) {
            this._mapLoaded = true;
        }
        else {
            this._map.on('load', () => {
                this._mapLoaded = true;
                this._updateSelectedMapIfNeeded();
            });
        }
        this._map.on('moveend', () => this._updateSelectedMapIfNeeded());
    }
    getSelectedMap() {
        return this._selectedMap;
    }
    getLevel() {
        return this._level;
    }
    setLevel(level, fireEvent = true) {
        if (this._selectedMap === null) {
            throw new Error('Cannot set level, no map has been selected');
        }
        this._level = level;
        this._updateFiltering();
        if (fireEvent) {
            this._map.fire('indoor.level.changed', { level });
        }
    }
    get control() {
        return this._control;
    }
    /**
     * ***********************
     * Handle level change
     * ***********************
     */
    _addLayerForFiltering(layer, beforeLayerId) {
        this._map.addLayer(layer, beforeLayerId);
        this._savedFilters.push({
            layerId: layer.id,
            filter: this._map.getFilter(layer.id) || ["all"]
        });
    }
    _removeLayerForFiltering(layerId) {
        this._savedFilters = this._savedFilters.filter(({ layerId: id }) => layerId !== id);
        this._map.removeLayer(layerId);
    }
    _updateFiltering() {
        const level = this._level;
        let filterFn;
        if (level !== null) {
            const showFeaturesWithEmptyLevel = this._selectedMap ? this._selectedMap.showFeaturesWithEmptyLevel : false;
            filterFn = (filter) => filterWithLevel(filter, level, showFeaturesWithEmptyLevel);
        }
        else {
            filterFn = (filter) => filter;
        }
        this._savedFilters.forEach(({ layerId, filter }) => this._map.setFilter(layerId, filterFn(filter)));
    }
    /**
     * **************
     * Handle maps
     * **************
     */
    addMap(map) {
        this._indoorMaps.push(map);
        this._updateSelectedMapIfNeeded();
    }
    removeMap(map) {
        this._indoorMaps = this._indoorMaps.filter(_indoorMap => _indoorMap !== map);
        this._updateSelectedMapIfNeeded();
    }
    async _updateSelectedMapIfNeeded() {
        if (!this._mapLoaded) {
            return;
        }
        // Avoid to call "closestMap" or "updateSelectedMap" if the previous call is not finished yet
        await this._updateMapPromise;
        this._updateMapPromise = (async () => {
            const closestMap = this._closestMap();
            if (closestMap !== this._selectedMap) {
                this._updateSelectedMap(closestMap);
            }
        })();
    }
    _updateSelectedMap(indoorMap) {
        const previousMap = this._selectedMap;
        // Remove the previous selected map if it exists
        if (previousMap !== null) {
            previousMap.layersToHide.forEach(layerId => this._map.setLayoutProperty(layerId, 'visibility', 'visible'));
            previousMap.layers.forEach(({ id }) => this._removeLayerForFiltering(id));
            this._map.removeSource(SOURCE_ID);
            if (!indoorMap) {
                // Save the previous map level.
                // It enables the user to exit and re-enter, keeping the same level shown.
                this._previousSelectedLevel = this._level;
                this._previousSelectedMap = previousMap;
            }
            this.setLevel(null, false);
            this._map.fire('indoor.map.unloaded', { indoorMap: previousMap });
        }
        this._selectedMap = indoorMap;
        if (!indoorMap) {
            return;
        }
        const { geojson, layers, levelsRange, beforeLayerId } = indoorMap;
        // Add map source
        this._map.addSource(SOURCE_ID, {
            type: "geojson",
            data: geojson
        });
        // Add layers and save filters
        layers.forEach(layer => this._addLayerForFiltering(layer, beforeLayerId));
        // Hide layers which can overlap for rendering
        indoorMap.layersToHide.forEach(layerId => this._map.setLayoutProperty(layerId, 'visibility', 'none'));
        // Restore the same level when the previous selected map is the same.
        const level = this._previousSelectedMap === indoorMap
            ? this._previousSelectedLevel
            : Math.max(Math.min(indoorMap.defaultLevel, levelsRange.max), levelsRange.min);
        this.setLevel(level, false);
        this._map.fire('indoor.map.loaded', { indoorMap });
    }
    _closestMap() {
        // TODO enhance this condition
        if (this._map.getZoom() < 17) {
            return null;
        }
        const cameraBounds = this._map.getBounds();
        const mapsInBounds = this._indoorMaps.filter(indoorMap => overlap(indoorMap.bounds, cameraBounds));
        if (mapsInBounds.length === 0) {
            return null;
        }
        if (mapsInBounds.length === 1) {
            return mapsInBounds[0];
        }
        /*
         * If there is multiple maps at this step, select the closest
         */
        let minDist = Number.POSITIVE_INFINITY;
        let closestMap = mapsInBounds[0];
        for (const map of mapsInBounds) {
            const _dist = distance(map.bounds.getCenter(), cameraBounds.getCenter());
            if (_dist < minDist) {
                closestMap = map;
                minDist = _dist;
            }
        }
        return closestMap;
    }
}

var defaultLayers = [
	{
		filter: [
			"any",
			[
				"has",
				"building"
			],
			[
				"has",
				"building:part"
			]
		],
		id: "buildings-background",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#DCD9D6",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						16.5,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"indoor",
			"level"
		],
		id: "level-background",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#DCD9D6",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						16.5,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		id: "indoor-gardens",
		type: "fill",
		source: "indoor",
		filter: [
			"filter-==",
			"leisure",
			"garden"
		],
		layout: {
			visibility: "visible"
		},
		paint: {
			"fill-color": "#cde8a2",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"amenity",
			"parking"
		],
		id: "indoor-parkings",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#D7CCC8",
			"fill-outline-color": "#000000",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"amenity",
			"parking"
		],
		id: "indoor-parkings-patterns",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						0.1
					]
				]
			},
			"fill-pattern": "si-main-3",
			"fill-translate-anchor": "viewport"
		}
	},
	{
		filter: [
			"filter-==",
			"indoor",
			"corridor"
		],
		id: "indoor-corridors",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#D7CCC8",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"indoor",
			"room"
		],
		id: "indoor-rooms",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#A1887F",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"any",
			[
				"filter-==",
				"indoor",
				"room"
			],
			[
				"filter-==",
				"indoor",
				"area"
			]
		],
		id: "indoor-rooms-borders",
		type: "line",
		source: "indoor",
		paint: {
			"line-color": "#000",
			"line-width": 1,
			"line-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"indoor",
			"area"
		],
		id: "indoor-areas",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#D7CCC8",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"all",
			[
				"filter-==",
				"indoor",
				"area"
			],
			[
				"filter-==",
				"balcony",
				"yes"
			]
		],
		id: "indoor-balcony",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#BDBDBD",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"any",
			[
				"filter-==",
				"stairs",
				"yes"
			],
			[
				"filter-==",
				"elevator",
				"yes"
			]
		],
		id: "indoor-stairs",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#7B635A",
			"fill-outline-color": "#000000",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"indoor",
			"wall"
		],
		id: "indoor-walls",
		type: "line",
		source: "indoor",
		paint: {
			"line-color": "#000000",
			"line-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"has",
			"barrier"
		],
		id: "indoor-barriers",
		type: "line",
		source: "indoor",
		paint: {
			"line-color": "#000000",
			"line-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"indoor",
			"block"
		],
		id: "indoor-blocks",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#000000",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"handrail",
			"yes"
		],
		id: "indoor-handrail",
		type: "line",
		source: "indoor",
		paint: {
			"line-color": "#000000",
			"line-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						19,
						1
					]
				]
			}
		}
	},
	{
		filter: [
			"any",
			[
				"filter-in-small",
				"indoor",
				[
					"literal",
					[
						"table",
						"cupboard",
						"chair",
						"kitchen",
						"sofa",
						"tv",
						"shelf",
						"furniture-item"
					]
				]
			],
			[
				"filter-==",
				"trashcan",
				"yes"
			],
			[
				"filter-==",
				"copier",
				"yes"
			]
		],
		id: "indoor-furniture",
		type: "fill",
		source: "indoor",
		paint: {
			"fill-color": "#000",
			"fill-outline-color": "#000",
			"fill-opacity": {
				base: 1,
				stops: [
					[
						18,
						0
					],
					[
						19,
						0.2
					]
				]
			}
		}
	},
	{
		filter: [
			"filter-==",
			"indoor",
			"level"
		],
		id: "level",
		type: "line",
		source: "indoor",
		paint: {
			"line-color": "#000000",
			"line-width": {
				base: 2,
				stops: [
					[
						16.5,
						0
					],
					[
						18,
						2
					]
				]
			},
			"line-opacity": {
				base: 1,
				stops: [
					[
						16.5,
						0
					],
					[
						18,
						1
					]
				]
			}
		}
	},
	{
		id: "indoor-steps",
		paint: {
			"line-width": {
				base: 1.5,
				stops: [
					[
						15,
						1
					],
					[
						16,
						1.6
					],
					[
						18,
						6
					]
				]
			},
			"line-color": "hsl(0, 0%, 100%)",
			"line-dasharray": {
				base: 1,
				stops: [
					[
						14,
						[
							1,
							0
						]
					],
					[
						15,
						[
							1.75,
							1
						]
					],
					[
						16,
						[
							1,
							0.75
						]
					],
					[
						17,
						[
							0.3,
							0.3
						]
					]
				]
			},
			"line-opacity": {
				base: 1,
				stops: [
					[
						14,
						0
					],
					[
						14.25,
						1
					]
				]
			}
		},
		type: "line",
		source: "indoor",
		filter: [
			"all",
			[
				"filter-==",
				"highway",
				"steps"
			],
			[
				"!",
				[
					"has",
					"conveying"
				]
			]
		],
		layout: {
			"line-join": "round"
		}
	},
	{
		id: "indoor-conveying",
		paint: {
			"line-width": {
				base: 1.5,
				stops: [
					[
						15,
						1
					],
					[
						16,
						1.6
					],
					[
						18,
						6
					]
				]
			},
			"line-color": "#FF0000",
			"line-dasharray": {
				base: 1,
				stops: [
					[
						14,
						[
							1,
							0
						]
					],
					[
						15,
						[
							1.75,
							1
						]
					],
					[
						16,
						[
							1,
							0.75
						]
					],
					[
						17,
						[
							0.3,
							0.3
						]
					]
				]
			},
			"line-opacity": {
				base: 1,
				stops: [
					[
						14,
						0
					],
					[
						14.25,
						1
					]
				]
			}
		},
		type: "line",
		source: "indoor",
		filter: [
			"all",
			[
				"filter-==",
				"highway",
				"steps"
			],
			[
				"has",
				"conveying"
			]
		],
		layout: {
			"line-join": "round"
		}
	},
	{
		interactive: true,
		minzoom: 17,
		layout: {
			"text-line-height": 1.2,
			"text-size": {
				base: 1,
				stops: [
					[
						17,
						10
					],
					[
						20,
						12
					]
				]
			},
			"text-allow-overlap": false,
			"text-ignore-placement": false,
			"text-max-angle": 38,
			"text-font": [
				"DIN Offc Pro Medium",
				"Arial Unicode MS Regular"
			],
			"symbol-placement": "point",
			"text-padding": 2,
			visibility: "visible",
			"text-rotation-alignment": "viewport",
			"text-anchor": "center",
			"text-field": "{name}",
			"text-letter-spacing": 0.02,
			"text-max-width": 8
		},
		filter: [
			"filter-==",
			"indoor",
			"room"
		],
		type: "symbol",
		source: "indoor",
		id: "poi-indoor-text-ref",
		paint: {
			"text-color": "#65513d",
			"text-halo-color": "#ffffff",
			"text-halo-width": 1,
			"text-opacity": {
				base: 1,
				stops: [
					[
						18,
						0
					],
					[
						18.5,
						0.5
					],
					[
						19,
						1
					]
				]
			}
		}
	},
	{
		interactive: true,
		minzoom: 17,
		layout: {
			"text-line-height": 1.2,
			"icon-size": {
				base: 1,
				stops: [
					[
						17,
						0.5
					],
					[
						20,
						1
					]
				]
			},
			"text-size": {
				base: 1,
				stops: [
					[
						17,
						11
					],
					[
						20,
						13
					]
				]
			},
			"text-allow-overlap": false,
			"icon-image": "{maki}-15",
			"icon-anchor": "center",
			"text-ignore-placement": false,
			"text-max-angle": 38,
			"symbol-spacing": 250,
			"text-font": [
				"DIN Offc Pro Medium",
				"Arial Unicode MS Regular"
			],
			"symbol-placement": "point",
			"text-padding": 2,
			visibility: "visible",
			"text-offset": [
				0,
				1
			],
			"icon-optional": false,
			"text-rotation-alignment": "viewport",
			"text-anchor": "top",
			"text-field": "{name}",
			"text-letter-spacing": 0.02,
			"text-max-width": 8,
			"icon-allow-overlap": true
		},
		filter: [
			"boolean",
			false
		],
		type: "symbol",
		source: "indoor",
		id: "poi-indoor",
		paint: {
			"text-color": "#65513d",
			"text-halo-color": "#ffffff",
			"text-halo-width": 1,
			"text-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						17.5,
						0.5
					],
					[
						19,
						1
					]
				]
			},
			"icon-opacity": {
				base: 1,
				stops: [
					[
						17,
						0
					],
					[
						17.5,
						0.5
					],
					[
						19,
						1
					]
				]
			}
		}
	}
];

let layers = defaultLayers;
/**
 * Transform the generic "poi-indoor" layer into multiple layers using filters based on OSM tags
 */
const POI_LAYER_ID = "poi-indoor";
const OSM_FILTER_MAPBOX_MAKI_LIST = [
    {
        filter: ['filter-==', 'amenity', 'fast_food'],
        maki: 'fast-food'
    },
    {
        filter: ['filter-==', 'amenity', 'restaurant'],
        maki: 'restaurant'
    },
    {
        filter: ['filter-==', 'amenity', 'cafe'],
        maki: 'cafe'
    },
    {
        filter: ['filter-==', 'amenity', 'bank'],
        maki: 'bank'
    },
    {
        filter: ['filter-==', 'amenity', 'toilets'],
        maki: 'toilet'
    },
    {
        filter: ['filter-==', 'shop', 'travel_agency'],
        maki: 'suitcase'
    },
    {
        filter: ['filter-==', 'shop', 'convenience'],
        maki: 'grocery'
    },
    {
        filter: ['filter-==', 'shop', 'bakery'],
        maki: 'bakery'
    },
    {
        filter: ['filter-==', 'shop', 'chemist'],
        maki: 'pharmacy'
    },
    {
        filter: ['filter-==', 'shop', 'clothes'],
        maki: 'clothing-store'
    },
    {
        filter: ['filter-==', 'highway', 'steps'],
        maki: 'entrance'
    },
    {
        filter: ['has', 'shop'],
        maki: 'shop'
    }
];
function createPoiLayers(metaLayer) {
    return OSM_FILTER_MAPBOX_MAKI_LIST.map(poi => {
        const newLayer = Object.assign({}, metaLayer);
        newLayer.id += `-${poi.maki}`;
        newLayer.filter = poi.filter;
        newLayer.layout = Object.assign({}, metaLayer.layout);
        newLayer.layout['icon-image'] = `${poi.maki}-15`;
        return newLayer;
    });
}
const poiLayer = layers.find(layer => layer.id === POI_LAYER_ID);
if (poiLayer) {
    // Convert poi-indoor layer into several poi-layers
    createPoiLayers(poiLayer).forEach(_layer => layers.push(_layer));
    layers = layers.filter(layer => layer.id !== POI_LAYER_ID);
}
var DefaultLayers = layers;

var Style = { DefaultLayers };

/**
 * Helper for Geojson data
 */
class GeoJsonHelper {
    /**
     * Extract level from feature
     *
     * @param {GeoJSONFeature} feature geojson feature
     * @returns {LevelsRange | number | null} the level or the range of level.
     */
    static extractLevelFromFeature(feature) {
        if (!!feature.properties &&
            feature.properties.level !== null) {
            const propertyLevel = feature.properties['level'];
            if (typeof propertyLevel === 'string') {
                const splitLevel = propertyLevel.split(';');
                if (splitLevel.length === 1) {
                    const level = parseFloat(propertyLevel);
                    if (!isNaN(level)) {
                        return level;
                    }
                }
                else if (splitLevel.length === 2) {
                    const level1 = parseFloat(splitLevel[0]);
                    const level2 = parseFloat(splitLevel[1]);
                    if (!isNaN(level1) && !isNaN(level2)) {
                        return {
                            min: Math.min(level1, level2),
                            max: Math.max(level1, level2)
                        };
                    }
                }
            }
        }
        return null;
    }
    /**
     * Extract levels range and bounds from geojson
     *
     * @param {GeoJSON} geojson the geojson
     * @returns {Object} the levels range and bounds.
     */
    static extractLevelsRangeAndBounds(geojson) {
        let minLevel = Infinity;
        let maxLevel = -Infinity;
        const boundsFromTurf = bbox__default['default'](geojson).slice(0, 4);
        const bounds = new mapboxgl.LngLatBounds(boundsFromTurf);
        const parseFeature = (feature) => {
            const level = this.extractLevelFromFeature(feature);
            if (level === null) {
                return;
            }
            if (typeof level === 'number') {
                minLevel = Math.min(minLevel, level);
                maxLevel = Math.max(maxLevel, level);
            }
            else if (typeof level === 'object') {
                minLevel = Math.min(minLevel, level.min);
                maxLevel = Math.max(maxLevel, level.max);
            }
        };
        if (geojson.type === 'FeatureCollection') {
            geojson.features.forEach(parseFeature);
        }
        else if (geojson.type === 'Feature') {
            parseFeature(geojson);
        }
        if (minLevel === Infinity || maxLevel === -Infinity) {
            throw new Error('No level found');
        }
        return {
            levelsRange: { min: minLevel, max: maxLevel },
            bounds
        };
    }
}

class IndoorMap {
    static fromGeojson(geojson, options = {}) {
        const { bounds, levelsRange } = GeoJsonHelper.extractLevelsRangeAndBounds(geojson);
        const map = new IndoorMap();
        map.geojson = geojson;
        map.layers = options.layers ? options.layers : Style.DefaultLayers;
        map.bounds = bounds;
        map.levelsRange = levelsRange;
        map.layersToHide = options.layersToHide ? options.layersToHide : [];
        map.beforeLayerId = options.beforeLayerId;
        map.defaultLevel = options.defaultLevel ? options.defaultLevel : 0;
        map.showFeaturesWithEmptyLevel = options.showFeaturesWithEmptyLevel ? options.showFeaturesWithEmptyLevel : false;
        return map;
    }
}

const MIN_ZOOM_TO_DOWNLOAD = 17;
const AREA_TO_DOWNLOAD = 1000; // in terms of distance from user
class MapServerHandler {
    constructor(serverUrl, map, indoorMapOptions) {
        this.loadMapsPromise = Promise.resolve();
        this.loadMapsIfNecessary = async () => {
            if (this.map.getZoom() < MIN_ZOOM_TO_DOWNLOAD) {
                return;
            }
            const viewPort = this.map.getBounds();
            if (this.downloadedBounds !== null) {
                if (this.downloadedBounds.contains(viewPort.getNorthEast()) &&
                    this.downloadedBounds.contains(viewPort.getSouthWest())) {
                    // Maps of the viewport have already been downloaded.
                    return;
                }
            }
            const distanceEastWest = distance(viewPort.getNorthEast(), viewPort.getNorthWest());
            const distanceNorthSouth = distance(viewPort.getNorthEast(), viewPort.getSouthEast());
            // It is not necessary to compute others as we are at zoom >= 17, the approximation is enough.
            const maxDistanceOnScreen = Math.max(distanceEastWest, distanceNorthSouth);
            const bestSizeOfAreaToDownload = Math.max(AREA_TO_DOWNLOAD, maxDistanceOnScreen * 2);
            const center = this.map.getCenter();
            const dist = bestSizeOfAreaToDownload * Math.sqrt(2);
            const northEast = destinationPoint(center, dist, Math.PI / 4);
            const southWest = destinationPoint(center, dist, -3 * Math.PI / 4);
            const boundsToDownload = new mapboxgl.LngLatBounds(southWest, northEast);
            // TODO: I put this here because fetch is async and takes more time than the next call to loadMapsIfNecessary.
            this.downloadedBounds = boundsToDownload;
            await this.loadMapsPromise;
            this.loadMapsPromise = this.loadMapsInBounds(boundsToDownload);
        };
        this.loadMapsInBounds = async (bounds) => {
            const url = this.serverUrl + `/maps-in-bounds/${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
            const maps = await (await fetch(url)).json();
            const mapsToRemove = this.remoteMapsDownloaded.reduce((acc, map) => {
                if (!maps.find(_map => _map.path === map.path)) {
                    acc.push(map);
                }
                return acc;
            }, []);
            const mapsToAdd = maps.reduce((acc, map) => {
                if (!this.remoteMapsDownloaded.find(_map => _map.path === map.path)) {
                    acc.push(map);
                }
                return acc;
            }, []);
            mapsToAdd.forEach(this.addCustomMap);
            mapsToRemove.forEach(this.removeCustomMap);
        };
        this.addCustomMap = async (map) => {
            const geojson = await (await fetch(this.serverUrl + map.path)).json();
            map.indoorMap = IndoorMap.fromGeojson(geojson, this.indoorMapOptions);
            this.map.indoor.addMap(map.indoorMap);
            this.remoteMapsDownloaded.push(map);
        };
        this.removeCustomMap = async (map) => {
            this.map.indoor.removeMap(map.indoorMap);
            this.remoteMapsDownloaded.splice(this.remoteMapsDownloaded.indexOf(map), 1);
        };
        this.serverUrl = serverUrl;
        this.map = map;
        this.indoorMapOptions = indoorMapOptions;
        this.remoteMapsDownloaded = [];
        this.downloadedBounds = null;
        if (map.loaded) {
            this.loadMapsIfNecessary();
        }
        else {
            map.on('load', () => this.loadMapsIfNecessary());
        }
        map.on('move', () => this.loadMapsIfNecessary());
    }
    static manage(server, map, indoorMapOptions) {
        return new MapServerHandler(server, map, indoorMapOptions);
    }
}

Object.defineProperty(mapboxgl__default['default'].Map.prototype, 'indoor', {
    get: function () {
        if (!this._indoor) {
            this._indoor = new Indoor(this);
        }
        return this._indoor;
    }
});

exports.DefaultStyle = Style;
exports.IndoorMap = IndoorMap;
exports.MapServerHandler = MapServerHandler;
//# sourceMappingURL=map-gl-indoor.js.map
