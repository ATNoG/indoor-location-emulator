(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('mapbox-gl')) :
    typeof define === 'function' && define.amd ? define(['exports', 'mapbox-gl'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.mapgl_indoor = {}, global.mapboxgl));
}(this, (function (exports, mapboxgl) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var mapboxgl__default = /*#__PURE__*/_interopDefaultLegacy(mapboxgl);

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
    			"fill-color": "#f0e6d1", //custom
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
    			"fill-color": "#bfaba1", //custom
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
    			"fill-color": "#636363", // custom
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

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var helpers = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @module helpers
     */
    /**
     * Earth Radius used with the Harvesine formula and approximates using a spherical (non-ellipsoid) Earth.
     *
     * @memberof helpers
     * @type {number}
     */
    exports.earthRadius = 6371008.8;
    /**
     * Unit of measurement factors using a spherical (non-ellipsoid) earth radius.
     *
     * @memberof helpers
     * @type {Object}
     */
    exports.factors = {
        centimeters: exports.earthRadius * 100,
        centimetres: exports.earthRadius * 100,
        degrees: exports.earthRadius / 111325,
        feet: exports.earthRadius * 3.28084,
        inches: exports.earthRadius * 39.370,
        kilometers: exports.earthRadius / 1000,
        kilometres: exports.earthRadius / 1000,
        meters: exports.earthRadius,
        metres: exports.earthRadius,
        miles: exports.earthRadius / 1609.344,
        millimeters: exports.earthRadius * 1000,
        millimetres: exports.earthRadius * 1000,
        nauticalmiles: exports.earthRadius / 1852,
        radians: 1,
        yards: exports.earthRadius / 1.0936,
    };
    /**
     * Units of measurement factors based on 1 meter.
     *
     * @memberof helpers
     * @type {Object}
     */
    exports.unitsFactors = {
        centimeters: 100,
        centimetres: 100,
        degrees: 1 / 111325,
        feet: 3.28084,
        inches: 39.370,
        kilometers: 1 / 1000,
        kilometres: 1 / 1000,
        meters: 1,
        metres: 1,
        miles: 1 / 1609.344,
        millimeters: 1000,
        millimetres: 1000,
        nauticalmiles: 1 / 1852,
        radians: 1 / exports.earthRadius,
        yards: 1 / 1.0936,
    };
    /**
     * Area of measurement factors based on 1 square meter.
     *
     * @memberof helpers
     * @type {Object}
     */
    exports.areaFactors = {
        acres: 0.000247105,
        centimeters: 10000,
        centimetres: 10000,
        feet: 10.763910417,
        inches: 1550.003100006,
        kilometers: 0.000001,
        kilometres: 0.000001,
        meters: 1,
        metres: 1,
        miles: 3.86e-7,
        millimeters: 1000000,
        millimetres: 1000000,
        yards: 1.195990046,
    };
    /**
     * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
     *
     * @name feature
     * @param {Geometry} geometry input geometry
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature} a GeoJSON Feature
     * @example
     * var geometry = {
     *   "type": "Point",
     *   "coordinates": [110, 50]
     * };
     *
     * var feature = turf.feature(geometry);
     *
     * //=feature
     */
    function feature(geom, properties, options) {
        if (options === void 0) { options = {}; }
        var feat = { type: "Feature" };
        if (options.id === 0 || options.id) {
            feat.id = options.id;
        }
        if (options.bbox) {
            feat.bbox = options.bbox;
        }
        feat.properties = properties || {};
        feat.geometry = geom;
        return feat;
    }
    exports.feature = feature;
    /**
     * Creates a GeoJSON {@link Geometry} from a Geometry string type & coordinates.
     * For GeometryCollection type use `helpers.geometryCollection`
     *
     * @name geometry
     * @param {string} type Geometry Type
     * @param {Array<any>} coordinates Coordinates
     * @param {Object} [options={}] Optional Parameters
     * @returns {Geometry} a GeoJSON Geometry
     * @example
     * var type = "Point";
     * var coordinates = [110, 50];
     * var geometry = turf.geometry(type, coordinates);
     * // => geometry
     */
    function geometry(type, coordinates, options) {
        switch (type) {
            case "Point": return point(coordinates).geometry;
            case "LineString": return lineString(coordinates).geometry;
            case "Polygon": return polygon(coordinates).geometry;
            case "MultiPoint": return multiPoint(coordinates).geometry;
            case "MultiLineString": return multiLineString(coordinates).geometry;
            case "MultiPolygon": return multiPolygon(coordinates).geometry;
            default: throw new Error(type + " is invalid");
        }
    }
    exports.geometry = geometry;
    /**
     * Creates a {@link Point} {@link Feature} from a Position.
     *
     * @name point
     * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature<Point>} a Point feature
     * @example
     * var point = turf.point([-75.343, 39.984]);
     *
     * //=point
     */
    function point(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        var geom = {
            type: "Point",
            coordinates: coordinates,
        };
        return feature(geom, properties, options);
    }
    exports.point = point;
    /**
     * Creates a {@link Point} {@link FeatureCollection} from an Array of Point coordinates.
     *
     * @name points
     * @param {Array<Array<number>>} coordinates an array of Points
     * @param {Object} [properties={}] Translate these properties to each Feature
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
     * associated with the FeatureCollection
     * @param {string|number} [options.id] Identifier associated with the FeatureCollection
     * @returns {FeatureCollection<Point>} Point Feature
     * @example
     * var points = turf.points([
     *   [-75, 39],
     *   [-80, 45],
     *   [-78, 50]
     * ]);
     *
     * //=points
     */
    function points(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        return featureCollection(coordinates.map(function (coords) {
            return point(coords, properties);
        }), options);
    }
    exports.points = points;
    /**
     * Creates a {@link Polygon} {@link Feature} from an Array of LinearRings.
     *
     * @name polygon
     * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature<Polygon>} Polygon Feature
     * @example
     * var polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
     *
     * //=polygon
     */
    function polygon(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
            var ring = coordinates_1[_i];
            if (ring.length < 4) {
                throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
            }
            for (var j = 0; j < ring[ring.length - 1].length; j++) {
                // Check if first point of Polygon contains two numbers
                if (ring[ring.length - 1][j] !== ring[0][j]) {
                    throw new Error("First and last Position are not equivalent.");
                }
            }
        }
        var geom = {
            type: "Polygon",
            coordinates: coordinates,
        };
        return feature(geom, properties, options);
    }
    exports.polygon = polygon;
    /**
     * Creates a {@link Polygon} {@link FeatureCollection} from an Array of Polygon coordinates.
     *
     * @name polygons
     * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygon coordinates
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the FeatureCollection
     * @returns {FeatureCollection<Polygon>} Polygon FeatureCollection
     * @example
     * var polygons = turf.polygons([
     *   [[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]],
     *   [[[-15, 42], [-14, 46], [-12, 41], [-17, 44], [-15, 42]]],
     * ]);
     *
     * //=polygons
     */
    function polygons(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        return featureCollection(coordinates.map(function (coords) {
            return polygon(coords, properties);
        }), options);
    }
    exports.polygons = polygons;
    /**
     * Creates a {@link LineString} {@link Feature} from an Array of Positions.
     *
     * @name lineString
     * @param {Array<Array<number>>} coordinates an array of Positions
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature<LineString>} LineString Feature
     * @example
     * var linestring1 = turf.lineString([[-24, 63], [-23, 60], [-25, 65], [-20, 69]], {name: 'line 1'});
     * var linestring2 = turf.lineString([[-14, 43], [-13, 40], [-15, 45], [-10, 49]], {name: 'line 2'});
     *
     * //=linestring1
     * //=linestring2
     */
    function lineString(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        if (coordinates.length < 2) {
            throw new Error("coordinates must be an array of two or more positions");
        }
        var geom = {
            type: "LineString",
            coordinates: coordinates,
        };
        return feature(geom, properties, options);
    }
    exports.lineString = lineString;
    /**
     * Creates a {@link LineString} {@link FeatureCollection} from an Array of LineString coordinates.
     *
     * @name lineStrings
     * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
     * associated with the FeatureCollection
     * @param {string|number} [options.id] Identifier associated with the FeatureCollection
     * @returns {FeatureCollection<LineString>} LineString FeatureCollection
     * @example
     * var linestrings = turf.lineStrings([
     *   [[-24, 63], [-23, 60], [-25, 65], [-20, 69]],
     *   [[-14, 43], [-13, 40], [-15, 45], [-10, 49]]
     * ]);
     *
     * //=linestrings
     */
    function lineStrings(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        return featureCollection(coordinates.map(function (coords) {
            return lineString(coords, properties);
        }), options);
    }
    exports.lineStrings = lineStrings;
    /**
     * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
     *
     * @name featureCollection
     * @param {Feature[]} features input features
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {FeatureCollection} FeatureCollection of Features
     * @example
     * var locationA = turf.point([-75.343, 39.984], {name: 'Location A'});
     * var locationB = turf.point([-75.833, 39.284], {name: 'Location B'});
     * var locationC = turf.point([-75.534, 39.123], {name: 'Location C'});
     *
     * var collection = turf.featureCollection([
     *   locationA,
     *   locationB,
     *   locationC
     * ]);
     *
     * //=collection
     */
    function featureCollection(features, options) {
        if (options === void 0) { options = {}; }
        var fc = { type: "FeatureCollection" };
        if (options.id) {
            fc.id = options.id;
        }
        if (options.bbox) {
            fc.bbox = options.bbox;
        }
        fc.features = features;
        return fc;
    }
    exports.featureCollection = featureCollection;
    /**
     * Creates a {@link Feature<MultiLineString>} based on a
     * coordinate array. Properties can be added optionally.
     *
     * @name multiLineString
     * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature<MultiLineString>} a MultiLineString feature
     * @throws {Error} if no coordinates are passed
     * @example
     * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
     *
     * //=multiLine
     */
    function multiLineString(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        var geom = {
            type: "MultiLineString",
            coordinates: coordinates,
        };
        return feature(geom, properties, options);
    }
    exports.multiLineString = multiLineString;
    /**
     * Creates a {@link Feature<MultiPoint>} based on a
     * coordinate array. Properties can be added optionally.
     *
     * @name multiPoint
     * @param {Array<Array<number>>} coordinates an array of Positions
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature<MultiPoint>} a MultiPoint feature
     * @throws {Error} if no coordinates are passed
     * @example
     * var multiPt = turf.multiPoint([[0,0],[10,10]]);
     *
     * //=multiPt
     */
    function multiPoint(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        var geom = {
            type: "MultiPoint",
            coordinates: coordinates,
        };
        return feature(geom, properties, options);
    }
    exports.multiPoint = multiPoint;
    /**
     * Creates a {@link Feature<MultiPolygon>} based on a
     * coordinate array. Properties can be added optionally.
     *
     * @name multiPolygon
     * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature<MultiPolygon>} a multipolygon feature
     * @throws {Error} if no coordinates are passed
     * @example
     * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
     *
     * //=multiPoly
     *
     */
    function multiPolygon(coordinates, properties, options) {
        if (options === void 0) { options = {}; }
        var geom = {
            type: "MultiPolygon",
            coordinates: coordinates,
        };
        return feature(geom, properties, options);
    }
    exports.multiPolygon = multiPolygon;
    /**
     * Creates a {@link Feature<GeometryCollection>} based on a
     * coordinate array. Properties can be added optionally.
     *
     * @name geometryCollection
     * @param {Array<Geometry>} geometries an array of GeoJSON Geometries
     * @param {Object} [properties={}] an Object of key-value pairs to add as properties
     * @param {Object} [options={}] Optional Parameters
     * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
     * @param {string|number} [options.id] Identifier associated with the Feature
     * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
     * @example
     * var pt = turf.geometry("Point", [100, 0]);
     * var line = turf.geometry("LineString", [[101, 0], [102, 1]]);
     * var collection = turf.geometryCollection([pt, line]);
     *
     * // => collection
     */
    function geometryCollection(geometries, properties, options) {
        if (options === void 0) { options = {}; }
        var geom = {
            type: "GeometryCollection",
            geometries: geometries,
        };
        return feature(geom, properties, options);
    }
    exports.geometryCollection = geometryCollection;
    /**
     * Round number to precision
     *
     * @param {number} num Number
     * @param {number} [precision=0] Precision
     * @returns {number} rounded number
     * @example
     * turf.round(120.4321)
     * //=120
     *
     * turf.round(120.4321, 2)
     * //=120.43
     */
    function round(num, precision) {
        if (precision === void 0) { precision = 0; }
        if (precision && !(precision >= 0)) {
            throw new Error("precision must be a positive number");
        }
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(num * multiplier) / multiplier;
    }
    exports.round = round;
    /**
     * Convert a distance measurement (assuming a spherical Earth) from radians to a more friendly unit.
     * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
     *
     * @name radiansToLength
     * @param {number} radians in radians across the sphere
     * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
     * meters, kilometres, kilometers.
     * @returns {number} distance
     */
    function radiansToLength(radians, units) {
        if (units === void 0) { units = "kilometers"; }
        var factor = exports.factors[units];
        if (!factor) {
            throw new Error(units + " units is invalid");
        }
        return radians * factor;
    }
    exports.radiansToLength = radiansToLength;
    /**
     * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into radians
     * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
     *
     * @name lengthToRadians
     * @param {number} distance in real units
     * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
     * meters, kilometres, kilometers.
     * @returns {number} radians
     */
    function lengthToRadians(distance, units) {
        if (units === void 0) { units = "kilometers"; }
        var factor = exports.factors[units];
        if (!factor) {
            throw new Error(units + " units is invalid");
        }
        return distance / factor;
    }
    exports.lengthToRadians = lengthToRadians;
    /**
     * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into degrees
     * Valid units: miles, nauticalmiles, inches, yards, meters, metres, centimeters, kilometres, feet
     *
     * @name lengthToDegrees
     * @param {number} distance in real units
     * @param {string} [units="kilometers"] can be degrees, radians, miles, or kilometers inches, yards, metres,
     * meters, kilometres, kilometers.
     * @returns {number} degrees
     */
    function lengthToDegrees(distance, units) {
        return radiansToDegrees(lengthToRadians(distance, units));
    }
    exports.lengthToDegrees = lengthToDegrees;
    /**
     * Converts any bearing angle from the north line direction (positive clockwise)
     * and returns an angle between 0-360 degrees (positive clockwise), 0 being the north line
     *
     * @name bearingToAzimuth
     * @param {number} bearing angle, between -180 and +180 degrees
     * @returns {number} angle between 0 and 360 degrees
     */
    function bearingToAzimuth(bearing) {
        var angle = bearing % 360;
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }
    exports.bearingToAzimuth = bearingToAzimuth;
    /**
     * Converts an angle in radians to degrees
     *
     * @name radiansToDegrees
     * @param {number} radians angle in radians
     * @returns {number} degrees between 0 and 360 degrees
     */
    function radiansToDegrees(radians) {
        var degrees = radians % (2 * Math.PI);
        return degrees * 180 / Math.PI;
    }
    exports.radiansToDegrees = radiansToDegrees;
    /**
     * Converts an angle in degrees to radians
     *
     * @name degreesToRadians
     * @param {number} degrees angle between 0 and 360 degrees
     * @returns {number} angle in radians
     */
    function degreesToRadians(degrees) {
        var radians = degrees % 360;
        return radians * Math.PI / 180;
    }
    exports.degreesToRadians = degreesToRadians;
    /**
     * Converts a length to the requested unit.
     * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
     *
     * @param {number} length to be converted
     * @param {Units} [originalUnit="kilometers"] of the length
     * @param {Units} [finalUnit="kilometers"] returned unit
     * @returns {number} the converted length
     */
    function convertLength(length, originalUnit, finalUnit) {
        if (originalUnit === void 0) { originalUnit = "kilometers"; }
        if (finalUnit === void 0) { finalUnit = "kilometers"; }
        if (!(length >= 0)) {
            throw new Error("length must be a positive number");
        }
        return radiansToLength(lengthToRadians(length, originalUnit), finalUnit);
    }
    exports.convertLength = convertLength;
    /**
     * Converts a area to the requested unit.
     * Valid units: kilometers, kilometres, meters, metres, centimetres, millimeters, acres, miles, yards, feet, inches
     * @param {number} area to be converted
     * @param {Units} [originalUnit="meters"] of the distance
     * @param {Units} [finalUnit="kilometers"] returned unit
     * @returns {number} the converted distance
     */
    function convertArea(area, originalUnit, finalUnit) {
        if (originalUnit === void 0) { originalUnit = "meters"; }
        if (finalUnit === void 0) { finalUnit = "kilometers"; }
        if (!(area >= 0)) {
            throw new Error("area must be a positive number");
        }
        var startFactor = exports.areaFactors[originalUnit];
        if (!startFactor) {
            throw new Error("invalid original units");
        }
        var finalFactor = exports.areaFactors[finalUnit];
        if (!finalFactor) {
            throw new Error("invalid final units");
        }
        return (area / startFactor) * finalFactor;
    }
    exports.convertArea = convertArea;
    /**
     * isNumber
     *
     * @param {*} num Number to validate
     * @returns {boolean} true/false
     * @example
     * turf.isNumber(123)
     * //=true
     * turf.isNumber('foo')
     * //=false
     */
    function isNumber(num) {
        return !isNaN(num) && num !== null && !Array.isArray(num) && !/^\s*$/.test(num);
    }
    exports.isNumber = isNumber;
    /**
     * isObject
     *
     * @param {*} input variable to validate
     * @returns {boolean} true/false
     * @example
     * turf.isObject({elevation: 10})
     * //=true
     * turf.isObject('foo')
     * //=false
     */
    function isObject(input) {
        return (!!input) && (input.constructor === Object);
    }
    exports.isObject = isObject;
    /**
     * Validate BBox
     *
     * @private
     * @param {Array<number>} bbox BBox to validate
     * @returns {void}
     * @throws Error if BBox is not valid
     * @example
     * validateBBox([-180, -40, 110, 50])
     * //=OK
     * validateBBox([-180, -40])
     * //=Error
     * validateBBox('Foo')
     * //=Error
     * validateBBox(5)
     * //=Error
     * validateBBox(null)
     * //=Error
     * validateBBox(undefined)
     * //=Error
     */
    function validateBBox(bbox) {
        if (!bbox) {
            throw new Error("bbox is required");
        }
        if (!Array.isArray(bbox)) {
            throw new Error("bbox must be an Array");
        }
        if (bbox.length !== 4 && bbox.length !== 6) {
            throw new Error("bbox must be an Array of 4 or 6 numbers");
        }
        bbox.forEach(function (num) {
            if (!isNumber(num)) {
                throw new Error("bbox must only contain numbers");
            }
        });
    }
    exports.validateBBox = validateBBox;
    /**
     * Validate Id
     *
     * @private
     * @param {string|number} id Id to validate
     * @returns {void}
     * @throws Error if Id is not valid
     * @example
     * validateId([-180, -40, 110, 50])
     * //=Error
     * validateId([-180, -40])
     * //=Error
     * validateId('Foo')
     * //=OK
     * validateId(5)
     * //=OK
     * validateId(null)
     * //=Error
     * validateId(undefined)
     * //=Error
     */
    function validateId(id) {
        if (!id) {
            throw new Error("id is required");
        }
        if (["string", "number"].indexOf(typeof id) === -1) {
            throw new Error("id must be a number or a string");
        }
    }
    exports.validateId = validateId;
    // Deprecated methods
    function radians2degrees() {
        throw new Error("method has been renamed to `radiansToDegrees`");
    }
    exports.radians2degrees = radians2degrees;
    function degrees2radians() {
        throw new Error("method has been renamed to `degreesToRadians`");
    }
    exports.degrees2radians = degrees2radians;
    function distanceToDegrees() {
        throw new Error("method has been renamed to `lengthToDegrees`");
    }
    exports.distanceToDegrees = distanceToDegrees;
    function distanceToRadians() {
        throw new Error("method has been renamed to `lengthToRadians`");
    }
    exports.distanceToRadians = distanceToRadians;
    function radiansToDistance() {
        throw new Error("method has been renamed to `radiansToLength`");
    }
    exports.radiansToDistance = radiansToDistance;
    function bearingToAngle() {
        throw new Error("method has been renamed to `bearingToAzimuth`");
    }
    exports.bearingToAngle = bearingToAngle;
    function convertDistance() {
        throw new Error("method has been renamed to `convertLength`");
    }
    exports.convertDistance = convertDistance;
    });

    var meta = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, '__esModule', { value: true });



    /**
     * Callback for coordEach
     *
     * @callback coordEachCallback
     * @param {Array<number>} currentCoord The current coordinate being processed.
     * @param {number} coordIndex The current index of the coordinate being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
     * @param {number} geometryIndex The current index of the Geometry being processed.
     */

    /**
     * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
     *
     * @name coordEach
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, multiFeatureIndex)
     * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
     * @returns {void}
     * @example
     * var features = turf.featureCollection([
     *   turf.point([26, 37], {"foo": "bar"}),
     *   turf.point([36, 53], {"hello": "world"})
     * ]);
     *
     * turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
     *   //=currentCoord
     *   //=coordIndex
     *   //=featureIndex
     *   //=multiFeatureIndex
     *   //=geometryIndex
     * });
     */
    function coordEach(geojson, callback, excludeWrapCoord) {
        // Handles null Geometry -- Skips this GeoJSON
        if (geojson === null) return;
        var j, k, l, geometry, stopG, coords,
            geometryMaybeCollection,
            wrapShrink = 0,
            coordIndex = 0,
            isGeometryCollection,
            type = geojson.type,
            isFeatureCollection = type === 'FeatureCollection',
            isFeature = type === 'Feature',
            stop = isFeatureCollection ? geojson.features.length : 1;

        // This logic may look a little weird. The reason why it is that way
        // is because it's trying to be fast. GeoJSON supports multiple kinds
        // of objects at its root: FeatureCollection, Features, Geometries.
        // This function has the responsibility of handling all of them, and that
        // means that some of the `for` loops you see below actually just don't apply
        // to certain inputs. For instance, if you give this just a
        // Point geometry, then both loops are short-circuited and all we do
        // is gradually rename the input until it's called 'geometry'.
        //
        // This also aims to allocate as few resources as possible: just a
        // few numbers and booleans, rather than any temporary arrays as would
        // be required with the normalization approach.
        for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
            geometryMaybeCollection = (isFeatureCollection ? geojson.features[featureIndex].geometry :
                (isFeature ? geojson.geometry : geojson));
            isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
            stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

            for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
                var multiFeatureIndex = 0;
                var geometryIndex = 0;
                geometry = isGeometryCollection ?
                    geometryMaybeCollection.geometries[geomIndex] : geometryMaybeCollection;

                // Handles null Geometry -- Skips this geometry
                if (geometry === null) continue;
                coords = geometry.coordinates;
                var geomType = geometry.type;

                wrapShrink = (excludeWrapCoord && (geomType === 'Polygon' || geomType === 'MultiPolygon')) ? 1 : 0;

                switch (geomType) {
                case null:
                    break;
                case 'Point':
                    if (callback(coords, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                    coordIndex++;
                    multiFeatureIndex++;
                    break;
                case 'LineString':
                case 'MultiPoint':
                    for (j = 0; j < coords.length; j++) {
                        if (callback(coords[j], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                        coordIndex++;
                        if (geomType === 'MultiPoint') multiFeatureIndex++;
                    }
                    if (geomType === 'LineString') multiFeatureIndex++;
                    break;
                case 'Polygon':
                case 'MultiLineString':
                    for (j = 0; j < coords.length; j++) {
                        for (k = 0; k < coords[j].length - wrapShrink; k++) {
                            if (callback(coords[j][k], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                            coordIndex++;
                        }
                        if (geomType === 'MultiLineString') multiFeatureIndex++;
                        if (geomType === 'Polygon') geometryIndex++;
                    }
                    if (geomType === 'Polygon') multiFeatureIndex++;
                    break;
                case 'MultiPolygon':
                    for (j = 0; j < coords.length; j++) {
                        geometryIndex = 0;
                        for (k = 0; k < coords[j].length; k++) {
                            for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                                if (callback(coords[j][k][l], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                                coordIndex++;
                            }
                            geometryIndex++;
                        }
                        multiFeatureIndex++;
                    }
                    break;
                case 'GeometryCollection':
                    for (j = 0; j < geometry.geometries.length; j++)
                        if (coordEach(geometry.geometries[j], callback, excludeWrapCoord) === false) return false;
                    break;
                default:
                    throw new Error('Unknown Geometry Type');
                }
            }
        }
    }

    /**
     * Callback for coordReduce
     *
     * The first time the callback function is called, the values provided as arguments depend
     * on whether the reduce method has an initialValue argument.
     *
     * If an initialValue is provided to the reduce method:
     *  - The previousValue argument is initialValue.
     *  - The currentValue argument is the value of the first element present in the array.
     *
     * If an initialValue is not provided:
     *  - The previousValue argument is the value of the first element present in the array.
     *  - The currentValue argument is the value of the second element present in the array.
     *
     * @callback coordReduceCallback
     * @param {*} previousValue The accumulated value previously returned in the last invocation
     * of the callback, or initialValue, if supplied.
     * @param {Array<number>} currentCoord The current coordinate being processed.
     * @param {number} coordIndex The current index of the coordinate being processed.
     * Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
     * @param {number} geometryIndex The current index of the Geometry being processed.
     */

    /**
     * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
     *
     * @name coordReduce
     * @param {FeatureCollection|Geometry|Feature} geojson any GeoJSON object
     * @param {Function} callback a method that takes (previousValue, currentCoord, coordIndex)
     * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
     * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
     * @returns {*} The value that results from the reduction.
     * @example
     * var features = turf.featureCollection([
     *   turf.point([26, 37], {"foo": "bar"}),
     *   turf.point([36, 53], {"hello": "world"})
     * ]);
     *
     * turf.coordReduce(features, function (previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
     *   //=previousValue
     *   //=currentCoord
     *   //=coordIndex
     *   //=featureIndex
     *   //=multiFeatureIndex
     *   //=geometryIndex
     *   return currentCoord;
     * });
     */
    function coordReduce(geojson, callback, initialValue, excludeWrapCoord) {
        var previousValue = initialValue;
        coordEach(geojson, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
            if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord;
            else previousValue = callback(previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex);
        }, excludeWrapCoord);
        return previousValue;
    }

    /**
     * Callback for propEach
     *
     * @callback propEachCallback
     * @param {Object} currentProperties The current Properties being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     */

    /**
     * Iterate over properties in any GeoJSON object, similar to Array.forEach()
     *
     * @name propEach
     * @param {FeatureCollection|Feature} geojson any GeoJSON object
     * @param {Function} callback a method that takes (currentProperties, featureIndex)
     * @returns {void}
     * @example
     * var features = turf.featureCollection([
     *     turf.point([26, 37], {foo: 'bar'}),
     *     turf.point([36, 53], {hello: 'world'})
     * ]);
     *
     * turf.propEach(features, function (currentProperties, featureIndex) {
     *   //=currentProperties
     *   //=featureIndex
     * });
     */
    function propEach(geojson, callback) {
        var i;
        switch (geojson.type) {
        case 'FeatureCollection':
            for (i = 0; i < geojson.features.length; i++) {
                if (callback(geojson.features[i].properties, i) === false) break;
            }
            break;
        case 'Feature':
            callback(geojson.properties, 0);
            break;
        }
    }


    /**
     * Callback for propReduce
     *
     * The first time the callback function is called, the values provided as arguments depend
     * on whether the reduce method has an initialValue argument.
     *
     * If an initialValue is provided to the reduce method:
     *  - The previousValue argument is initialValue.
     *  - The currentValue argument is the value of the first element present in the array.
     *
     * If an initialValue is not provided:
     *  - The previousValue argument is the value of the first element present in the array.
     *  - The currentValue argument is the value of the second element present in the array.
     *
     * @callback propReduceCallback
     * @param {*} previousValue The accumulated value previously returned in the last invocation
     * of the callback, or initialValue, if supplied.
     * @param {*} currentProperties The current Properties being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     */

    /**
     * Reduce properties in any GeoJSON object into a single value,
     * similar to how Array.reduce works. However, in this case we lazily run
     * the reduction, so an array of all properties is unnecessary.
     *
     * @name propReduce
     * @param {FeatureCollection|Feature} geojson any GeoJSON object
     * @param {Function} callback a method that takes (previousValue, currentProperties, featureIndex)
     * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
     * @returns {*} The value that results from the reduction.
     * @example
     * var features = turf.featureCollection([
     *     turf.point([26, 37], {foo: 'bar'}),
     *     turf.point([36, 53], {hello: 'world'})
     * ]);
     *
     * turf.propReduce(features, function (previousValue, currentProperties, featureIndex) {
     *   //=previousValue
     *   //=currentProperties
     *   //=featureIndex
     *   return currentProperties
     * });
     */
    function propReduce(geojson, callback, initialValue) {
        var previousValue = initialValue;
        propEach(geojson, function (currentProperties, featureIndex) {
            if (featureIndex === 0 && initialValue === undefined) previousValue = currentProperties;
            else previousValue = callback(previousValue, currentProperties, featureIndex);
        });
        return previousValue;
    }

    /**
     * Callback for featureEach
     *
     * @callback featureEachCallback
     * @param {Feature<any>} currentFeature The current Feature being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     */

    /**
     * Iterate over features in any GeoJSON object, similar to
     * Array.forEach.
     *
     * @name featureEach
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (currentFeature, featureIndex)
     * @returns {void}
     * @example
     * var features = turf.featureCollection([
     *   turf.point([26, 37], {foo: 'bar'}),
     *   turf.point([36, 53], {hello: 'world'})
     * ]);
     *
     * turf.featureEach(features, function (currentFeature, featureIndex) {
     *   //=currentFeature
     *   //=featureIndex
     * });
     */
    function featureEach(geojson, callback) {
        if (geojson.type === 'Feature') {
            callback(geojson, 0);
        } else if (geojson.type === 'FeatureCollection') {
            for (var i = 0; i < geojson.features.length; i++) {
                if (callback(geojson.features[i], i) === false) break;
            }
        }
    }

    /**
     * Callback for featureReduce
     *
     * The first time the callback function is called, the values provided as arguments depend
     * on whether the reduce method has an initialValue argument.
     *
     * If an initialValue is provided to the reduce method:
     *  - The previousValue argument is initialValue.
     *  - The currentValue argument is the value of the first element present in the array.
     *
     * If an initialValue is not provided:
     *  - The previousValue argument is the value of the first element present in the array.
     *  - The currentValue argument is the value of the second element present in the array.
     *
     * @callback featureReduceCallback
     * @param {*} previousValue The accumulated value previously returned in the last invocation
     * of the callback, or initialValue, if supplied.
     * @param {Feature} currentFeature The current Feature being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     */

    /**
     * Reduce features in any GeoJSON object, similar to Array.reduce().
     *
     * @name featureReduce
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex)
     * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
     * @returns {*} The value that results from the reduction.
     * @example
     * var features = turf.featureCollection([
     *   turf.point([26, 37], {"foo": "bar"}),
     *   turf.point([36, 53], {"hello": "world"})
     * ]);
     *
     * turf.featureReduce(features, function (previousValue, currentFeature, featureIndex) {
     *   //=previousValue
     *   //=currentFeature
     *   //=featureIndex
     *   return currentFeature
     * });
     */
    function featureReduce(geojson, callback, initialValue) {
        var previousValue = initialValue;
        featureEach(geojson, function (currentFeature, featureIndex) {
            if (featureIndex === 0 && initialValue === undefined) previousValue = currentFeature;
            else previousValue = callback(previousValue, currentFeature, featureIndex);
        });
        return previousValue;
    }

    /**
     * Get all coordinates from any GeoJSON object.
     *
     * @name coordAll
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @returns {Array<Array<number>>} coordinate position array
     * @example
     * var features = turf.featureCollection([
     *   turf.point([26, 37], {foo: 'bar'}),
     *   turf.point([36, 53], {hello: 'world'})
     * ]);
     *
     * var coords = turf.coordAll(features);
     * //= [[26, 37], [36, 53]]
     */
    function coordAll(geojson) {
        var coords = [];
        coordEach(geojson, function (coord) {
            coords.push(coord);
        });
        return coords;
    }

    /**
     * Callback for geomEach
     *
     * @callback geomEachCallback
     * @param {Geometry} currentGeometry The current Geometry being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {Object} featureProperties The current Feature Properties being processed.
     * @param {Array<number>} featureBBox The current Feature BBox being processed.
     * @param {number|string} featureId The current Feature Id being processed.
     */

    /**
     * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
     *
     * @name geomEach
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
     * @returns {void}
     * @example
     * var features = turf.featureCollection([
     *     turf.point([26, 37], {foo: 'bar'}),
     *     turf.point([36, 53], {hello: 'world'})
     * ]);
     *
     * turf.geomEach(features, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
     *   //=currentGeometry
     *   //=featureIndex
     *   //=featureProperties
     *   //=featureBBox
     *   //=featureId
     * });
     */
    function geomEach(geojson, callback) {
        var i, j, g, geometry, stopG,
            geometryMaybeCollection,
            isGeometryCollection,
            featureProperties,
            featureBBox,
            featureId,
            featureIndex = 0,
            isFeatureCollection = geojson.type === 'FeatureCollection',
            isFeature = geojson.type === 'Feature',
            stop = isFeatureCollection ? geojson.features.length : 1;

        // This logic may look a little weird. The reason why it is that way
        // is because it's trying to be fast. GeoJSON supports multiple kinds
        // of objects at its root: FeatureCollection, Features, Geometries.
        // This function has the responsibility of handling all of them, and that
        // means that some of the `for` loops you see below actually just don't apply
        // to certain inputs. For instance, if you give this just a
        // Point geometry, then both loops are short-circuited and all we do
        // is gradually rename the input until it's called 'geometry'.
        //
        // This also aims to allocate as few resources as possible: just a
        // few numbers and booleans, rather than any temporary arrays as would
        // be required with the normalization approach.
        for (i = 0; i < stop; i++) {

            geometryMaybeCollection = (isFeatureCollection ? geojson.features[i].geometry :
                (isFeature ? geojson.geometry : geojson));
            featureProperties = (isFeatureCollection ? geojson.features[i].properties :
                (isFeature ? geojson.properties : {}));
            featureBBox = (isFeatureCollection ? geojson.features[i].bbox :
                (isFeature ? geojson.bbox : undefined));
            featureId = (isFeatureCollection ? geojson.features[i].id :
                (isFeature ? geojson.id : undefined));
            isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
            stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

            for (g = 0; g < stopG; g++) {
                geometry = isGeometryCollection ?
                    geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

                // Handle null Geometry
                if (geometry === null) {
                    if (callback(null, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
                    continue;
                }
                switch (geometry.type) {
                case 'Point':
                case 'LineString':
                case 'MultiPoint':
                case 'Polygon':
                case 'MultiLineString':
                case 'MultiPolygon': {
                    if (callback(geometry, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
                    break;
                }
                case 'GeometryCollection': {
                    for (j = 0; j < geometry.geometries.length; j++) {
                        if (callback(geometry.geometries[j], featureIndex, featureProperties, featureBBox, featureId) === false) return false;
                    }
                    break;
                }
                default:
                    throw new Error('Unknown Geometry Type');
                }
            }
            // Only increase `featureIndex` per each feature
            featureIndex++;
        }
    }

    /**
     * Callback for geomReduce
     *
     * The first time the callback function is called, the values provided as arguments depend
     * on whether the reduce method has an initialValue argument.
     *
     * If an initialValue is provided to the reduce method:
     *  - The previousValue argument is initialValue.
     *  - The currentValue argument is the value of the first element present in the array.
     *
     * If an initialValue is not provided:
     *  - The previousValue argument is the value of the first element present in the array.
     *  - The currentValue argument is the value of the second element present in the array.
     *
     * @callback geomReduceCallback
     * @param {*} previousValue The accumulated value previously returned in the last invocation
     * of the callback, or initialValue, if supplied.
     * @param {Geometry} currentGeometry The current Geometry being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {Object} featureProperties The current Feature Properties being processed.
     * @param {Array<number>} featureBBox The current Feature BBox being processed.
     * @param {number|string} featureId The current Feature Id being processed.
     */

    /**
     * Reduce geometry in any GeoJSON object, similar to Array.reduce().
     *
     * @name geomReduce
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
     * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
     * @returns {*} The value that results from the reduction.
     * @example
     * var features = turf.featureCollection([
     *     turf.point([26, 37], {foo: 'bar'}),
     *     turf.point([36, 53], {hello: 'world'})
     * ]);
     *
     * turf.geomReduce(features, function (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
     *   //=previousValue
     *   //=currentGeometry
     *   //=featureIndex
     *   //=featureProperties
     *   //=featureBBox
     *   //=featureId
     *   return currentGeometry
     * });
     */
    function geomReduce(geojson, callback, initialValue) {
        var previousValue = initialValue;
        geomEach(geojson, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
            if (featureIndex === 0 && initialValue === undefined) previousValue = currentGeometry;
            else previousValue = callback(previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId);
        });
        return previousValue;
    }

    /**
     * Callback for flattenEach
     *
     * @callback flattenEachCallback
     * @param {Feature} currentFeature The current flattened feature being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
     */

    /**
     * Iterate over flattened features in any GeoJSON object, similar to
     * Array.forEach.
     *
     * @name flattenEach
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (currentFeature, featureIndex, multiFeatureIndex)
     * @example
     * var features = turf.featureCollection([
     *     turf.point([26, 37], {foo: 'bar'}),
     *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
     * ]);
     *
     * turf.flattenEach(features, function (currentFeature, featureIndex, multiFeatureIndex) {
     *   //=currentFeature
     *   //=featureIndex
     *   //=multiFeatureIndex
     * });
     */
    function flattenEach(geojson, callback) {
        geomEach(geojson, function (geometry, featureIndex, properties, bbox, id) {
            // Callback for single geometry
            var type = (geometry === null) ? null : geometry.type;
            switch (type) {
            case null:
            case 'Point':
            case 'LineString':
            case 'Polygon':
                if (callback(helpers.feature(geometry, properties, {bbox: bbox, id: id}), featureIndex, 0) === false) return false;
                return;
            }

            var geomType;

            // Callback for multi-geometry
            switch (type) {
            case 'MultiPoint':
                geomType = 'Point';
                break;
            case 'MultiLineString':
                geomType = 'LineString';
                break;
            case 'MultiPolygon':
                geomType = 'Polygon';
                break;
            }

            for (var multiFeatureIndex = 0; multiFeatureIndex < geometry.coordinates.length; multiFeatureIndex++) {
                var coordinate = geometry.coordinates[multiFeatureIndex];
                var geom = {
                    type: geomType,
                    coordinates: coordinate
                };
                if (callback(helpers.feature(geom, properties), featureIndex, multiFeatureIndex) === false) return false;
            }
        });
    }

    /**
     * Callback for flattenReduce
     *
     * The first time the callback function is called, the values provided as arguments depend
     * on whether the reduce method has an initialValue argument.
     *
     * If an initialValue is provided to the reduce method:
     *  - The previousValue argument is initialValue.
     *  - The currentValue argument is the value of the first element present in the array.
     *
     * If an initialValue is not provided:
     *  - The previousValue argument is the value of the first element present in the array.
     *  - The currentValue argument is the value of the second element present in the array.
     *
     * @callback flattenReduceCallback
     * @param {*} previousValue The accumulated value previously returned in the last invocation
     * of the callback, or initialValue, if supplied.
     * @param {Feature} currentFeature The current Feature being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
     */

    /**
     * Reduce flattened features in any GeoJSON object, similar to Array.reduce().
     *
     * @name flattenReduce
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
     * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex, multiFeatureIndex)
     * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
     * @returns {*} The value that results from the reduction.
     * @example
     * var features = turf.featureCollection([
     *     turf.point([26, 37], {foo: 'bar'}),
     *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
     * ]);
     *
     * turf.flattenReduce(features, function (previousValue, currentFeature, featureIndex, multiFeatureIndex) {
     *   //=previousValue
     *   //=currentFeature
     *   //=featureIndex
     *   //=multiFeatureIndex
     *   return currentFeature
     * });
     */
    function flattenReduce(geojson, callback, initialValue) {
        var previousValue = initialValue;
        flattenEach(geojson, function (currentFeature, featureIndex, multiFeatureIndex) {
            if (featureIndex === 0 && multiFeatureIndex === 0 && initialValue === undefined) previousValue = currentFeature;
            else previousValue = callback(previousValue, currentFeature, featureIndex, multiFeatureIndex);
        });
        return previousValue;
    }

    /**
     * Callback for segmentEach
     *
     * @callback segmentEachCallback
     * @param {Feature<LineString>} currentSegment The current Segment being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
     * @param {number} geometryIndex The current index of the Geometry being processed.
     * @param {number} segmentIndex The current index of the Segment being processed.
     * @returns {void}
     */

    /**
     * Iterate over 2-vertex line segment in any GeoJSON object, similar to Array.forEach()
     * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
     *
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
     * @param {Function} callback a method that takes (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex)
     * @returns {void}
     * @example
     * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
     *
     * // Iterate over GeoJSON by 2-vertex segments
     * turf.segmentEach(polygon, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
     *   //=currentSegment
     *   //=featureIndex
     *   //=multiFeatureIndex
     *   //=geometryIndex
     *   //=segmentIndex
     * });
     *
     * // Calculate the total number of segments
     * var total = 0;
     * turf.segmentEach(polygon, function () {
     *     total++;
     * });
     */
    function segmentEach(geojson, callback) {
        flattenEach(geojson, function (feature, featureIndex, multiFeatureIndex) {
            var segmentIndex = 0;

            // Exclude null Geometries
            if (!feature.geometry) return;
            // (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
            var type = feature.geometry.type;
            if (type === 'Point' || type === 'MultiPoint') return;

            // Generate 2-vertex line segments
            var previousCoords;
            var previousFeatureIndex = 0;
            var previousMultiIndex = 0;
            var prevGeomIndex = 0;
            if (coordEach(feature, function (currentCoord, coordIndex, featureIndexCoord, multiPartIndexCoord, geometryIndex) {
                // Simulating a meta.coordReduce() since `reduce` operations cannot be stopped by returning `false`
                if (previousCoords === undefined || featureIndex > previousFeatureIndex || multiPartIndexCoord > previousMultiIndex || geometryIndex > prevGeomIndex) {
                    previousCoords = currentCoord;
                    previousFeatureIndex = featureIndex;
                    previousMultiIndex = multiPartIndexCoord;
                    prevGeomIndex = geometryIndex;
                    segmentIndex = 0;
                    return;
                }
                var currentSegment = helpers.lineString([previousCoords, currentCoord], feature.properties);
                if (callback(currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) === false) return false;
                segmentIndex++;
                previousCoords = currentCoord;
            }) === false) return false;
        });
    }

    /**
     * Callback for segmentReduce
     *
     * The first time the callback function is called, the values provided as arguments depend
     * on whether the reduce method has an initialValue argument.
     *
     * If an initialValue is provided to the reduce method:
     *  - The previousValue argument is initialValue.
     *  - The currentValue argument is the value of the first element present in the array.
     *
     * If an initialValue is not provided:
     *  - The previousValue argument is the value of the first element present in the array.
     *  - The currentValue argument is the value of the second element present in the array.
     *
     * @callback segmentReduceCallback
     * @param {*} previousValue The accumulated value previously returned in the last invocation
     * of the callback, or initialValue, if supplied.
     * @param {Feature<LineString>} currentSegment The current Segment being processed.
     * @param {number} featureIndex The current index of the Feature being processed.
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
     * @param {number} geometryIndex The current index of the Geometry being processed.
     * @param {number} segmentIndex The current index of the Segment being processed.
     */

    /**
     * Reduce 2-vertex line segment in any GeoJSON object, similar to Array.reduce()
     * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
     *
     * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
     * @param {Function} callback a method that takes (previousValue, currentSegment, currentIndex)
     * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
     * @returns {void}
     * @example
     * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
     *
     * // Iterate over GeoJSON by 2-vertex segments
     * turf.segmentReduce(polygon, function (previousSegment, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
     *   //= previousSegment
     *   //= currentSegment
     *   //= featureIndex
     *   //= multiFeatureIndex
     *   //= geometryIndex
     *   //= segmentInex
     *   return currentSegment
     * });
     *
     * // Calculate the total number of segments
     * var initialValue = 0
     * var total = turf.segmentReduce(polygon, function (previousValue) {
     *     previousValue++;
     *     return previousValue;
     * }, initialValue);
     */
    function segmentReduce(geojson, callback, initialValue) {
        var previousValue = initialValue;
        var started = false;
        segmentEach(geojson, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
            if (started === false && initialValue === undefined) previousValue = currentSegment;
            else previousValue = callback(previousValue, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex);
            started = true;
        });
        return previousValue;
    }

    /**
     * Callback for lineEach
     *
     * @callback lineEachCallback
     * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed
     * @param {number} featureIndex The current index of the Feature being processed
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
     * @param {number} geometryIndex The current index of the Geometry being processed
     */

    /**
     * Iterate over line or ring coordinates in LineString, Polygon, MultiLineString, MultiPolygon Features or Geometries,
     * similar to Array.forEach.
     *
     * @name lineEach
     * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
     * @param {Function} callback a method that takes (currentLine, featureIndex, multiFeatureIndex, geometryIndex)
     * @example
     * var multiLine = turf.multiLineString([
     *   [[26, 37], [35, 45]],
     *   [[36, 53], [38, 50], [41, 55]]
     * ]);
     *
     * turf.lineEach(multiLine, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
     *   //=currentLine
     *   //=featureIndex
     *   //=multiFeatureIndex
     *   //=geometryIndex
     * });
     */
    function lineEach(geojson, callback) {
        // validation
        if (!geojson) throw new Error('geojson is required');

        flattenEach(geojson, function (feature, featureIndex, multiFeatureIndex) {
            if (feature.geometry === null) return;
            var type = feature.geometry.type;
            var coords = feature.geometry.coordinates;
            switch (type) {
            case 'LineString':
                if (callback(feature, featureIndex, multiFeatureIndex, 0, 0) === false) return false;
                break;
            case 'Polygon':
                for (var geometryIndex = 0; geometryIndex < coords.length; geometryIndex++) {
                    if (callback(helpers.lineString(coords[geometryIndex], feature.properties), featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                }
                break;
            }
        });
    }

    /**
     * Callback for lineReduce
     *
     * The first time the callback function is called, the values provided as arguments depend
     * on whether the reduce method has an initialValue argument.
     *
     * If an initialValue is provided to the reduce method:
     *  - The previousValue argument is initialValue.
     *  - The currentValue argument is the value of the first element present in the array.
     *
     * If an initialValue is not provided:
     *  - The previousValue argument is the value of the first element present in the array.
     *  - The currentValue argument is the value of the second element present in the array.
     *
     * @callback lineReduceCallback
     * @param {*} previousValue The accumulated value previously returned in the last invocation
     * of the callback, or initialValue, if supplied.
     * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed.
     * @param {number} featureIndex The current index of the Feature being processed
     * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
     * @param {number} geometryIndex The current index of the Geometry being processed
     */

    /**
     * Reduce features in any GeoJSON object, similar to Array.reduce().
     *
     * @name lineReduce
     * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
     * @param {Function} callback a method that takes (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex)
     * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
     * @returns {*} The value that results from the reduction.
     * @example
     * var multiPoly = turf.multiPolygon([
     *   turf.polygon([[[12,48],[2,41],[24,38],[12,48]], [[9,44],[13,41],[13,45],[9,44]]]),
     *   turf.polygon([[[5, 5], [0, 0], [2, 2], [4, 4], [5, 5]]])
     * ]);
     *
     * turf.lineReduce(multiPoly, function (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
     *   //=previousValue
     *   //=currentLine
     *   //=featureIndex
     *   //=multiFeatureIndex
     *   //=geometryIndex
     *   return currentLine
     * });
     */
    function lineReduce(geojson, callback, initialValue) {
        var previousValue = initialValue;
        lineEach(geojson, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
            if (featureIndex === 0 && initialValue === undefined) previousValue = currentLine;
            else previousValue = callback(previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex);
        });
        return previousValue;
    }

    /**
     * Finds a particular 2-vertex LineString Segment from a GeoJSON using `@turf/meta` indexes.
     *
     * Negative indexes are permitted.
     * Point & MultiPoint will always return null.
     *
     * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
     * @param {Object} [options={}] Optional parameters
     * @param {number} [options.featureIndex=0] Feature Index
     * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
     * @param {number} [options.geometryIndex=0] Geometry Index
     * @param {number} [options.segmentIndex=0] Segment Index
     * @param {Object} [options.properties={}] Translate Properties to output LineString
     * @param {BBox} [options.bbox={}] Translate BBox to output LineString
     * @param {number|string} [options.id={}] Translate Id to output LineString
     * @returns {Feature<LineString>} 2-vertex GeoJSON Feature LineString
     * @example
     * var multiLine = turf.multiLineString([
     *     [[10, 10], [50, 30], [30, 40]],
     *     [[-10, -10], [-50, -30], [-30, -40]]
     * ]);
     *
     * // First Segment (defaults are 0)
     * turf.findSegment(multiLine);
     * // => Feature<LineString<[[10, 10], [50, 30]]>>
     *
     * // First Segment of 2nd Multi Feature
     * turf.findSegment(multiLine, {multiFeatureIndex: 1});
     * // => Feature<LineString<[[-10, -10], [-50, -30]]>>
     *
     * // Last Segment of Last Multi Feature
     * turf.findSegment(multiLine, {multiFeatureIndex: -1, segmentIndex: -1});
     * // => Feature<LineString<[[-50, -30], [-30, -40]]>>
     */
    function findSegment(geojson, options) {
        // Optional Parameters
        options = options || {};
        if (!helpers.isObject(options)) throw new Error('options is invalid');
        var featureIndex = options.featureIndex || 0;
        var multiFeatureIndex = options.multiFeatureIndex || 0;
        var geometryIndex = options.geometryIndex || 0;
        var segmentIndex = options.segmentIndex || 0;

        // Find FeatureIndex
        var properties = options.properties;
        var geometry;

        switch (geojson.type) {
        case 'FeatureCollection':
            if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
            properties = properties || geojson.features[featureIndex].properties;
            geometry = geojson.features[featureIndex].geometry;
            break;
        case 'Feature':
            properties = properties || geojson.properties;
            geometry = geojson.geometry;
            break;
        case 'Point':
        case 'MultiPoint':
            return null;
        case 'LineString':
        case 'Polygon':
        case 'MultiLineString':
        case 'MultiPolygon':
            geometry = geojson;
            break;
        default:
            throw new Error('geojson is invalid');
        }

        // Find SegmentIndex
        if (geometry === null) return null;
        var coords = geometry.coordinates;
        switch (geometry.type) {
        case 'Point':
        case 'MultiPoint':
            return null;
        case 'LineString':
            if (segmentIndex < 0) segmentIndex = coords.length + segmentIndex - 1;
            return helpers.lineString([coords[segmentIndex], coords[segmentIndex + 1]], properties, options);
        case 'Polygon':
            if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
            if (segmentIndex < 0) segmentIndex = coords[geometryIndex].length + segmentIndex - 1;
            return helpers.lineString([coords[geometryIndex][segmentIndex], coords[geometryIndex][segmentIndex + 1]], properties, options);
        case 'MultiLineString':
            if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
            if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex].length + segmentIndex - 1;
            return helpers.lineString([coords[multiFeatureIndex][segmentIndex], coords[multiFeatureIndex][segmentIndex + 1]], properties, options);
        case 'MultiPolygon':
            if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
            if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
            if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex][geometryIndex].length - segmentIndex - 1;
            return helpers.lineString([coords[multiFeatureIndex][geometryIndex][segmentIndex], coords[multiFeatureIndex][geometryIndex][segmentIndex + 1]], properties, options);
        }
        throw new Error('geojson is invalid');
    }

    /**
     * Finds a particular Point from a GeoJSON using `@turf/meta` indexes.
     *
     * Negative indexes are permitted.
     *
     * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
     * @param {Object} [options={}] Optional parameters
     * @param {number} [options.featureIndex=0] Feature Index
     * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
     * @param {number} [options.geometryIndex=0] Geometry Index
     * @param {number} [options.coordIndex=0] Coord Index
     * @param {Object} [options.properties={}] Translate Properties to output Point
     * @param {BBox} [options.bbox={}] Translate BBox to output Point
     * @param {number|string} [options.id={}] Translate Id to output Point
     * @returns {Feature<Point>} 2-vertex GeoJSON Feature Point
     * @example
     * var multiLine = turf.multiLineString([
     *     [[10, 10], [50, 30], [30, 40]],
     *     [[-10, -10], [-50, -30], [-30, -40]]
     * ]);
     *
     * // First Segment (defaults are 0)
     * turf.findPoint(multiLine);
     * // => Feature<Point<[10, 10]>>
     *
     * // First Segment of the 2nd Multi-Feature
     * turf.findPoint(multiLine, {multiFeatureIndex: 1});
     * // => Feature<Point<[-10, -10]>>
     *
     * // Last Segment of last Multi-Feature
     * turf.findPoint(multiLine, {multiFeatureIndex: -1, coordIndex: -1});
     * // => Feature<Point<[-30, -40]>>
     */
    function findPoint(geojson, options) {
        // Optional Parameters
        options = options || {};
        if (!helpers.isObject(options)) throw new Error('options is invalid');
        var featureIndex = options.featureIndex || 0;
        var multiFeatureIndex = options.multiFeatureIndex || 0;
        var geometryIndex = options.geometryIndex || 0;
        var coordIndex = options.coordIndex || 0;

        // Find FeatureIndex
        var properties = options.properties;
        var geometry;

        switch (geojson.type) {
        case 'FeatureCollection':
            if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
            properties = properties || geojson.features[featureIndex].properties;
            geometry = geojson.features[featureIndex].geometry;
            break;
        case 'Feature':
            properties = properties || geojson.properties;
            geometry = geojson.geometry;
            break;
        case 'Point':
        case 'MultiPoint':
            return null;
        case 'LineString':
        case 'Polygon':
        case 'MultiLineString':
        case 'MultiPolygon':
            geometry = geojson;
            break;
        default:
            throw new Error('geojson is invalid');
        }

        // Find Coord Index
        if (geometry === null) return null;
        var coords = geometry.coordinates;
        switch (geometry.type) {
        case 'Point':
            return helpers.point(coords, properties, options);
        case 'MultiPoint':
            if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
            return helpers.point(coords[multiFeatureIndex], properties, options);
        case 'LineString':
            if (coordIndex < 0) coordIndex = coords.length + coordIndex;
            return helpers.point(coords[coordIndex], properties, options);
        case 'Polygon':
            if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
            if (coordIndex < 0) coordIndex = coords[geometryIndex].length + coordIndex;
            return helpers.point(coords[geometryIndex][coordIndex], properties, options);
        case 'MultiLineString':
            if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
            if (coordIndex < 0) coordIndex = coords[multiFeatureIndex].length + coordIndex;
            return helpers.point(coords[multiFeatureIndex][coordIndex], properties, options);
        case 'MultiPolygon':
            if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
            if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
            if (coordIndex < 0) coordIndex = coords[multiFeatureIndex][geometryIndex].length - coordIndex;
            return helpers.point(coords[multiFeatureIndex][geometryIndex][coordIndex], properties, options);
        }
        throw new Error('geojson is invalid');
    }

    exports.coordEach = coordEach;
    exports.coordReduce = coordReduce;
    exports.propEach = propEach;
    exports.propReduce = propReduce;
    exports.featureEach = featureEach;
    exports.featureReduce = featureReduce;
    exports.coordAll = coordAll;
    exports.geomEach = geomEach;
    exports.geomReduce = geomReduce;
    exports.flattenEach = flattenEach;
    exports.flattenReduce = flattenReduce;
    exports.segmentEach = segmentEach;
    exports.segmentReduce = segmentReduce;
    exports.lineEach = lineEach;
    exports.lineReduce = lineReduce;
    exports.findSegment = findSegment;
    exports.findPoint = findPoint;
    });

    var bbox_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    /**
     * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
     *
     * @name bbox
     * @param {GeoJSON} geojson any GeoJSON object
     * @returns {BBox} bbox extent in [minX, minY, maxX, maxY] order
     * @example
     * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
     * var bbox = turf.bbox(line);
     * var bboxPolygon = turf.bboxPolygon(bbox);
     *
     * //addToMap
     * var addToMap = [line, bboxPolygon]
     */
    function bbox(geojson) {
        var result = [Infinity, Infinity, -Infinity, -Infinity];
        meta.coordEach(geojson, function (coord) {
            if (result[0] > coord[0]) {
                result[0] = coord[0];
            }
            if (result[1] > coord[1]) {
                result[1] = coord[1];
            }
            if (result[2] < coord[0]) {
                result[2] = coord[0];
            }
            if (result[3] < coord[1]) {
                result[3] = coord[1];
            }
        });
        return result;
    }
    exports.default = bbox;
    });

    var bbox = /*@__PURE__*/getDefaultExportFromCjs(bbox_1);

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
            const boundsFromTurf = bbox(geojson).slice(0, 4);
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

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=map-gl-indoor.umd.js.map
