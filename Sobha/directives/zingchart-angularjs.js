(function() {
	'use strict';
	angular.module('zingchart-angularjs', [])
		.directive('zingchart',[ function() {
			var currentAutoId = 1;

			return {
				restrict: 'EA',
				scope: {
					id: '@',
					zcValues: '=',
					zcJson: '=',
					zcRender: '='
				},
				controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
					var id;
					// Get or generate id
					if (!$attrs.id) {
						id = 'zingchart-auto-' + currentAutoId;
						currentAutoId++;
						$attrs.id = id;
					} else {
						if ($attrs.id.indexOf('{{') > -1) {
							id = $scope.id;
							$element.attr('id', id);
						} else {
							id = $attrs.id;
						}
					}

					var initializing = {
						json: true,
						values: true
					};
					 
					$scope.$watchCollection('zcValues', function() {
						if (initializing.values) {
							initializing.values = !initializing.values;
							return;
						}
						if ($scope.zcValues) {
							if (isMultiArray($scope.zcValues)) {
								zingchart.exec(id, 'setseriesvalues', {
									values: $scope.zcValues
								});
							} else {
								zingchart.exec(id, 'setseriesvalues', {
									values: [$scope.zcValues]
								});
							}
						}
					});

					$scope.$watch('zcJson', function() {
						if (initializing.json) {
							initializing.json = !initializing.json;
							return;
						}
						if ($attrs.zcJson) {
							var _json = $scope.zcJson;

							//Inject values
							if ($scope.zcValues) {
								injectValues($scope.zcValues, _json);
							}
							//Inject type
							if (JSON.stringify(_json).indexOf('type') === -1) {
								_json.type = 'line';
							} else {
								_json.type = ($attrs.zcType) ? $attrs.zcType : _json.type
							}
							zingchart.exec(id, 'setdata', {
								data: _json
							});
						}
					}, true);

				}],
				link: function($scope, $element, $attrs) {
					var id = $element.attr('id');

					//Defaults
					var _json = {
						data: {
							type: 'line',
							series: []
						},
						width: 600,
						height: 400
					};

					//Add render object.
					if ($scope.zcRender) {
						mergeObject($scope.zcRender, _json);
					}

					//Add JSON object
					if ($scope.zcJson) {
						mergeObject($scope.zcJson, _json.data);
					}

					//Add Values
					if ($scope.zcValues) {
						injectValues($scope.zcValues, _json.data);
					}

					//Add other properties
					_json.data.type = ($attrs.zcType) ? $attrs.zcType : _json.data.type;
					_json.height = ($attrs.zcHeight) ? $attrs.zcHeight : _json.height;
					_json.width = ($attrs.zcWidth) ? $attrs.zcWidth : _json.width;
					_json.id = id;

					//Set the box-model of the container element if the height or width are defined as 100%.
					if (_json.width === "100%" && !$element.css('width')) {
						$element.css('width', '100%');
					}
					if (_json.height === "100%" && !$element.css('height')) {
						$element.css('height', '100%');
					}
					if ($attrs.zcEditable) {
						zingchart.bind(_json.id, "node_click", function(p) {
							zingchart.exec(_json.id, "updateobject", {
								"type": "label",
								"data": {
									"id": "label1",
									"text": "Edit this Node",
									"hook": "node:plot=" + p.plotindex + ";index=" + p.nodeindex,
									"visible": true
								}
							});
							nodeClick(p, $scope);
						});
						zingchart.resize = function(p) {
var graphWidth = document.getElementById(json.id).offsetWidth ;
		//checkfor multi Series
		 if(graphWidth <= 900) {
		var series = json.data.series;
		if (Array.isArray(series)) {
			var JSONArr = new Array();
			
			for (var i = 0; i < series.length; i++) {
				var newSeries=[];
				 newSeries.push( series[i]);
				var newObj = cloneJson(json.data);
				newObj.series = newSeries;
				newObj.title = {"text":"Mobile View"};
				JSONArr.push(newObj);
				
			}
			var myData = {
				'id': json.id,
				'data': {
					'graphset': JSONArr
				},
				'height': json.height,
				'width': json.width
			};
			json.data=myData.data;
		}
		 }
}
						// Hides callout label when click is not on a node
						zingchart.bind(_json.id, "click", function(p) {
							if (p.target != 'node') {
								zingchart.exec("myChart", "updateobject", {
									"type": "label",
									"data": {
										"id": "label1",
										"visible": false
									}
								});
							}
						});
					}
					//apply mobile logic
					if ($attrs.zcMobile)
						showChart(_json,$scope);
					else
						zingchart.render(_json);
				}
			};
		}]);

	/**
	 * Render chart on UI according to device size.
	 * @param json Object to be passed to zing chart library
	 */
	function showChart(json,scope) {
		//if mobile
		var graphWidth = document.getElementById(json.id).offsetWidth ;
		//checkfor multi Series
		 if(graphWidth <= 900) {
		var series = json.data.series;
		if (Array.isArray(series)) {
			var JSONArr = new Array();
			
			for (var i = 0; i < series.length; i++) {
				var newSeries=[];
				 newSeries.push( series[i]);
				var newObj = cloneJson(json.data);
				newObj.series = newSeries;
				newObj.title = {"text":"Mobile View"};
				JSONArr.push(newObj);
				
			}
			var myData = {
				'id': json.id,
				'data': {
					'graphset': JSONArr
				},
				'height': json.height,
				'width': json.width
			};
			json.data=myData.data;
			zingchart.render(myData);
		} else {
			zingchart.render(json);
		}
		 } else {
		//if desktop
		  zingchart.render(json);
		 }
	}
/**
	 * Clone A JSON object
	 * @param object to be parsed
	 */
	function cloneJson(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}
	/**
	 * Injects values into each series, and handles multi series cases.
	 * @param the values to inject into the config object
	 * @param the configuration object itself.
	 */
	function injectValues(values, config) {
		if (typeof config.series === 'undefined') {
			config.series = [];
		}

		//Single Series
		if (!isMultiArray(values)) {
			if (config.series[0]) {
				config.series[0].values = values;
			} else {
				config.series.push({
					'values': values
				});
			}
		}
		//Multi Series
		else {
			for (var i = 0; i < values.length; i++) {
				if (config.series[i]) {
					config.series[i].values = values[i];
				} else {
					config.series.push({
						'values': values[i]
					});
				}
			}
		}
		return config;
	}
	/**
	 *   Helper function to merge an object into another, overwriting properties.
	 *   A shallow, not a recursive merge
	 *   @param {object} fromObj - The object that has properties to be merged
	 *   @param {object} intoObj - The object being merged into (Result)
	 */
	function mergeObject(fromObj, intoObj) {
		for (var property in fromObj) {
			if (fromObj.hasOwnProperty(property)) {
				intoObj[property] = fromObj[property];
			}
		}
	}
	/**
	 *   Determines whether an array is multidimensional or not.
	 *   @param {array} _array - The array to test
	 *   @returns {boolean} - true if the array is multidimensional, false otherwise
	 */
	function isMultiArray(_array) {
		return Array.isArray(_array[0]);
	}
	/**
	 *Click handler on nodes
	 *Gives the clicked node so that it can be editable
	 *   @param  node - The object that has properties to be merged
	 */
	function nodeClick(node, scope) {
		var seriesSelected = parseInt(node.plotindex);
		var valueSelected = parseInt(node.nodeindex);
		scope.$parent.seriesSelected = parseInt(seriesSelected) + 1;
		scope.$parent.valueSelected = parseInt(valueSelected) + 1;
	}
	
})();