/*
 This Source Code Form is subject to the
 terms of the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed
 with this file, You can obtain one at
 http://mozilla.org/MPL/2.0/.
 */
/*

Contributions by Carlos Russo from Webdetails.pt

* TODO Consider using .kml files directly, see https://code.google.com/p/geoxml3/
* TODO Attempt merging with NewMapComponent
* TODO Attempt using API of https://github.com/mapstraction/mxn/


*/
function submitGeocode(input) {
    return function(e) {
        var keyCode;

        if (window.event) {
            keyCode = window.event.keyCode;
        }
        /*else if (variable) {
                  keyCode = e.which;
                  }*/

        if (keyCode == 13) {
            geocoder.geocode({
                address: input.value
            }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    map.fitBounds(results[0].geometry.viewport);
                } else {
                    alert("The location entered could not be found");
                }
            });
        }
    }
}

var gMapsOverlayComponent = UnmanagedComponent.extend({

    mapEngineOpts: undefined, //override this in preExec
    colormap: [
        [0, 102, 0, 255],
        [255, 255, 0, 255],
        [255, 0, 0, 255]
    ], //RGBA

    // Get color based on a Range
    getColorLegend: function(value, legendRanges) {
        var qtd = Object.keys(legendRanges.ranges).length;
        for (var j = 0; j < qtd; j++) {
            if ((isNaN(legendRanges.ranges[j].min) && value <= legendRanges.ranges[j].max) ||
                (isNaN(legendRanges.ranges[j].max) && value >= legendRanges.ranges[j].min) ||
                (value >= legendRanges.ranges[j].min && value <= legendRanges.ranges[j].max)) {
                return legendRanges.ranges[j].color;
            }
        }
    },



    // Get color based on Continuous Color Map
    getColorMap: function() {

        var interpolate = function(a, b, n) {
            var c = [],
                d = [];
            var k, kk, step;
            for (k = 0; k < a.length; k++) {
                c[k] = [];
                for (kk = 0, step = (b[k] - a[k]) / n; kk < n; kk++) {
                    c[k][kk] = a[k] + kk * step;
                }
            }
            for (k = 0; k < c[0].length; k++) {
                d[k] = [];
                for (kk = 0; kk < c.length; kk++) {
                    d[k][kk] = Math.round(c[kk][k]);
                }
            }
            return d;
        };

        var cmap = [];

        for (k = 1; k < this.colormap.length; k++) {
            cmap = cmap.concat(interpolate(this.colormap[k - 1], this.colormap[k], 512));
        }

        return _.map(cmap, function(v) {
            return 'rgba(' + v.join(',') + ')';
        });
    },

    _getMapDefinition: function(myself, callback) {
      var mapNameTemp = "", changeMapName = false;;
        if (typeof this.mapNameConditional == 'function') {
            mapNameTemp  = this.mapNameConditional();
            if(myself.mapName != mapNameTemp){
                myself.mapName = mapNameTemp;
                changeMapName = true;
            }

        }else if(myself.mapName != ''){
           mapNameTemp = myself.mapName;
           if(myself.mapDefinition == undefined){
             changeMapName =true;
           }


        }



        if(changeMapName){

            var url = (/\.[a-zA-Z]+$/).test(myself.mapName)
                // allow the map definition file to be in the sample folder
                ? wd.helpers.repository.getRsourceUrl() + myself.mapName : wd.helpers.repository.getRsourceUrl() + wd.helpers.repository.getBaseSolutionPluginRoot() +
                "cde/components/gmapsoverlay/map-def/" + myself.mapName + ".js";

            $.getJSON(url, function(json, callback) {
                if (json) {
                    myself.mapDefinition = json;
                }
            });

              }

        //Dashboards.log('mapDefinition :' + _.keys(this.mapDefinition));
        callback(myself);


    },



    postProcessData: function(values, myself) {

        /*
         * do a postProcessing, something like a postPostFetch
         */


        myself.queryResult = {};
        //myself.isContinuousMapColor =  this.legendVisible ?  $.isEmptyObject(myself.legend)   : false;
        var nrCols = values.metadata.length;

        var listColor = [];
        var countColor;
        dataResult = {};
        dataResult.resultset = [];
        dataResult.metadata = values.metadata;

        for (i in values.resultset) {
            var item = values.resultset[i];

            var value;



            if (typeof this.valueFormat == 'function') {
                value = this.valueFormat(item[1]);
            }else{
                value = item[1];
            }

            dataResult.resultset.push([item[0],value]);


            //if (nrCols < 3) // DataSet onde a legenda é baseada no valor
          //  {
                //value = parseFloat(item[1]);
            //    color = "";
            //    myself.isColorDefinedInDS = false;
          //  } else // DataSet com a 3a coluna informando qual cor utilizar, nao utilizar Legenda nem Mapa de Cor continuo para definir cor da regiao.
          //  {
                //value = item[1];
            //    color = item[2];
            //    myself.isColorDefinedInDS = true;
          //  }
            color = "";
           if(myself.isColorDefinedInDS  && typeof myself.mapColorConditional != 'function'){
             if(nrCols < 3){

               Dashboards.error("GMaps - Color not defined in the third column of the datasource.");
              return
             }
              color = item[2];
              // por padrao do DS as cores tem que vir na 3 coluna
              listColor.push(values.resultset[i][2]);
           }

           if( typeof myself.mapColorConditional == 'function'){
                // passa o valor por parametro para calculo da cor condicional
                color = myself.mapColorConditional(item[1]);
                listColor.push(color);
           }


            myself.queryResult[item[0]] = {
                'value': value,
                'color': color
            };




            if (item.length > 2) {
                myself.queryResult[item[0]].payload = item.slice(2);
            }
        }

         listUniqColor =  _.uniq(listColor);

        myself._parseLegend(myself.isContinuousMapColor);


        // patch queryResult with color information
        if (myself.isContinuousMapColor) {
            var colormap = myself.getColorMap();
            var qvalues = _.map(myself.queryResult, function(q) {
                return q.value;
            });
            var minValue = _.min(qvalues),
                maxValue = _.max(qvalues);
            var n = colormap.length;
            _.each(myself.queryResult, function(v, key) {
                var level = (v.value - minValue) / (maxValue - minValue);
                myself.queryResult[key] = _.extend({
                    level: level,
                    fillColor: colormap[Math.floor(level * (n - 1))],
                    fillOpacity: defaultFillOpacity,
                    strokeWeight: defaultStrokeWeight
                }, myself.queryResult[key]);
            });
        } else {
             listCountColor=[];
            _.each(myself.queryResult, function(v, key) {

                var color;

                if (myself.isColorDefinedInDS || (typeof myself.mapColorConditional == 'function')) {
                    color = v.color;
                    for(i=0;i<listUniqColor.length;i++){
                      if(listUniqColor[i].countColor == undefined){
                        listUniqColor[i] ={'countColor': 0,'color':   listUniqColor[i]};
                      }


                        if(color == listUniqColor[i].color){
                          listUniqColor[i].countColor = listUniqColor[i].countColor+1;

                        }
                    }

                }else{
                    color = myself.getColorLegend(v.value, myself.legendRanges);
                }

                myself.queryResult[key] = _.extend({
                    fillColor: color,
                    fillOpacity: defaultFillOpacity,
                    strokeWeight: defaultStrokeWeight
                }, myself.queryResult[key]);
            });
        }

    },

    _parseLegend: function(isContinuousMapColor) {

        this.legendRanges = new Object;

        this.legendRanges.ranges = new Object;
        this.legendRanges.text = ((!this.legendText) ? "" : this.legendText);
        this.legendRanges.source = ((!this.sourceText) ? " " : this.sourceText);


          if (!isContinuousMapColor) {
            for (var i = 0; i < this.legend.length; i++) {
                var opts = this.legend[i][1].split(";");
                this.legendRanges.ranges[i] = new Object;
                this.legendRanges.ranges[i].min = parseFloat(opts[0]);
                this.legendRanges.ranges[i].max = parseFloat(opts[1]);
                this.legendRanges.ranges[i].color = opts[2];
                this.legendRanges.ranges[i].desc = this.legend[i][0];
            }
        }
    },

    update: function() {

        myself = this;
        defaultFillOpacity = myself.shapeFillOpacity;
        defaultStrokeWeight = myself.shapeStrokeWeight;


        if ($.isEmptyObject(myself.queryDefinition)) {
            Dashboards.error("GMaps - Datasource not defined.");
            return
        }

        if (!myself.mapName && typeof myself.mapNameConditional != 'function') {
            Dashboards.error("GMaps - It needs to define a map name or a conditional function.");
            return
          }

        if(typeof myself.mapColorConditional == 'function' && myself.isColorDefinedInDS){
          Dashboards.error("GMaps - To use conditional color function is necessary to disable the option IsColorDefinedInDS.");
          return

        }


        // first get the map definition (asynchronously), and then launch triggerQuery (asynchronously)
        myself._getMapDefinition(myself, function(myself) {
            myself.triggerQuery(myself.queryDefinition, function(values) {

                myself.postProcessData(values, myself);


                // Start Google Map stuff
                myself._initialize();

            });
        });

    },

    getContent: function(obj, href, extension, content, MIME){
      var downloadAttrSupported = document.createElement('a').download !== undefined;
      var a,
          blobObject,
          name = (dataResult ? dataResult.metadata[1].colName.replace(/ /g, '-').toLowerCase() : 'map');
          //options = (chart.options.exporting || {}).csv || {},
          //url = options.url || 'http://www.highcharts.com/studies/csv-export/download.php';

      // Download attribute supported
      if (downloadAttrSupported) {
          a = document.createElement('a');
          a.href = href;
          a.target      = '_blank';
          if(typeof moment == 'function'){
            a.download    = name+' ' +(moment(new Date()).format('DD/MM/YYYY HH:mm'))+ '.' + extension;
          }else {
            a.download    = name+' ' +(new Date()).getFullYear()+ '.' + extension;
          }

          document.body.appendChild(a);
          a.click();
          a.remove();

      } else if (window.Blob && window.navigator.msSaveOrOpenBlob) {
          // Falls to msSaveOrOpenBlob if download attribute is not supported
          blobObject = new Blob([content]);
          window.navigator.msSaveOrOpenBlob(blobObject, name + '.' + extension);

      }
    },

    getCSV : function(data,myself,useLocalDecimalPoint){

      var csv,
          rows = data.resultset,

        itemDelimiter = ';',// use ';' for direct import to Excel
        lineDelimiter = '\n'; // '\n' isn't working with the js csv data extraction
        // Carrega titulo das colunas para o arquivo csv
        csv = '"'+data.metadata[0].colName+ '"'+itemDelimiter+data.metadata[1].colName+lineDelimiter;

      // Transform the rows to CSV
      _.each(rows, function (row, i) {
          var val = '',
              j = row.length,
              n = useLocalDecimalPoint ? (1.1).toLocaleString()[1] : '.';
          while (j--) {
              val = row[j];
              if (data.metadata[j].colType == "String") {
                  val = '"' + val + '"';
              }
              if (data.metadata[j].colType == 'Numeric') {
                  if (n === ',') {
                      val = val.toString().replace(".", ",");
                  }
              }
              row[j] = val;
          }
          // Add the values
          csv += row.join(itemDelimiter);

          // Add the line delimiter
          if (i < rows.length - 1) {
              csv += lineDelimiter;
          }
      });
      return csv;

    },

    downloadCSV : function () {
        var csv = myself.getCSV(dataResult, myself,false);

        myself.getContent(
            this,
            'data:text/csv,' + csv.replace(/\n/g, '%0A'),
            'csv',
            csv,
            'text/csv'
        );
    },

    _initialize: function() {
        this.mapEngine = new GMapEngine();

        this.mapEngine.opts = $.extend(true, this.mapEngine.opts, this.mapEngineOpts);
        if (this.clickCallback) {
            this.mapEngine.clickCallback = this.clickCallback;
        }


        this.mapEngine.init(this);
    },

    draw: function() {
        var myself = this;

        this.ph = $("#" + this.htmlObject);
        this.ph.empty();


        var mapOptions = $.extend(true, {
            zoom: parseInt(this.defaultZoomLevel),
            disableDoubleClickZoom: this.disableDoubleClickZoom,
            zoomControl: this.zoomControl,
            panControl: this.panControl,
            scrollwheel: this.scrollwheel,
            mapTypeControl: this.mapTypeControl,
            styles: [

                {
                    featureType: "administrative.locality",
                    stylers: [
                      {"visibility": this.locality}
                    ]
                }, {
                    elementType: "labels.icon",
                    stylers: [
                      {"visibility": this.icons}
                    ]
                }


            ],
            center: new google.maps.LatLng(this.centerLatitude, this.centerLongitude),
            mapTypeId: this.mapTypeId
        }, this.mapEngine.opts.mapOptions);



        this.mapEngine.createMap(this.ph[0], mapOptions, this.height, this.width);
        this.mapEngine.renderMap(this.mapDefinition, this.queryResult, ((!this.defaultColor) ? "#EAEAEA" : this.defaultColor), myself.legendRanges);
        this.mapEngine.resetButton(this.ph[0].id, this.defaultZoomLevel, this.centerLongitude, this.centerLatitude);

        if (this.search == true) {
            this.mapEngine.searchBox(this.ph[0].id);
        }
        if(this.exportToCSVFileVisible && this.exportToCSVFileLocaly == 'MAP'){
            this.mapEngine.exportCSVButton(this);
        }

        if (typeof this.doubleClickAction == 'function') {
            this.mapEngine.doubleClickAction = this.doubleClickAction;
        }
        if(typeof this.legendLabelDescOrderColorConditional == 'function'){
             this.mapEngine.legendLabelDescOrderColorConditional = this.legendLabelDescOrderColorConditional;
        }

        if (this.legendVisible) {
            this.mapEngine.renderLegend(this.ph[0].id, this.mapDefinition, this.queryResult, this.getColorMap(), [0, 0.5, 1], myself.legendRanges, myself,this);
        }



    }

});

var GMapEngine = Base.extend({
    map: undefined,
    opts: {
        mapOptions: {

            disableDefaultUI: false,
            streetViewControl: false
        }
    },
    opened_info: undefined,
    centered: false,
    overlays: [],
    init: function(mapComponent) {

        $.when(loadGoogleMapsOverlay()).then(
            function(status) {
                mapComponent.draw();
            }
        );
    },

    createMap: function(target, mapOptions, height, width) {
        // see possible features on https://developers.google.com/maps/documentation/javascript/reference#MapTypeStyleFeatureType
        this.map = new google.maps.Map(target, mapOptions);
        this.opened_info = new google.maps.InfoWindow();

        $(target).css("height", height == undefined ? myself.placeholder().width() : height + "px");
        $(target).css("width", width == undefined ? '100%' : width + "px");

    },

    renderMap: function(mapDefinition, queryResult, defaultColor, legend) {

        if (!mapDefinition) {
            return;
        }
        var myself = this;

        for (var c in mapDefinition) {
            var coods = mapDefinition[c],
                polyPath = [];

            for (var k = 0; k < coods.length; k++) {
                polyPath.push(new google.maps.LatLng(coods[k][0], coods[k][1]));
            }

            var shapeinfo = {
                //fillColor: !!queryResult[c] ? queryResult[c].fillColor : defaultColor,
                fillColor: queryResult[c] !=undefined && queryResult[c].fillColor != undefined ? queryResult[c].fillColor   : defaultColor,
                fillOpacity: !!queryResult[c] ? queryResult[c].fillOpacity : 0,
                strokeWeight: !!queryResult[c] ? queryResult[c].strokeWeight : 0,
                strokeColor: '#8c8c8c'
            };

            var shape = new google.maps.Polygon(_.extend({
                paths: polyPath
            }, shapeinfo));


            var shapeValue = queryResult[c] ? queryResult[c].value : null;

            shape.infowindow = new google.maps.InfoWindow({
                content: myself.tooltipMessage(c, shapeValue),
                pixelOffset: {
                    width: 0,
                    height: -3
                }
            });

            shape.infowindow.dataPayload = _.extend({
                name: c,
                value: shapeValue,
                level: queryResult[c] ? queryResult[c].level : 0
            }, shapeinfo);

            if (!!queryResult[c]) {
                queryResult[c].shape = shape;
            }

            shape.setMap(myself.map);
            google.maps.event.addListener(shape, 'dblclick', function(event) {
               if (typeof myself.doubleClickAction == 'function') {
                myself.doubleClickAction(this, event);
              }
            });

            google.maps.event.addListener(shape, 'click', function(event) {
                myself.clickCallback(this.infowindow, event);
                myself.displayCoordinates(event.latLng);
            });




            google.maps.event.addListener(shape, 'click', function(event) {
                this.fillOpacity = 1;
                this.strokeColor = "#000000";
                this.setVisible(false);
                this.setVisible(true);
                this.infowindow.setOptions({
                    maxWidth: 500
                });
                this.infowindow.setPosition(event.latLng);
                if (!this.infowindow.getMap())
                    this.infowindow.open(myself.map);
                myself.opened_info = this.infowindow;

            });

            /*
            google.maps.event.addListener(shape, 'mousemove',function (event) {
            	this.strokeColor= "#000000";
            	this.setVisible(false);
            	this.setVisible(true);
            });
            */

            google.maps.event.addListener(shape, 'mouseout', function(event) {
                //this.strokeWeight=0.5;
                myself.opened_info.close();
                this.fillOpacity = defaultFillOpacity;
                this.strokeColor = "#8c8c8c";
                this.setVisible(false);
                this.setVisible(true);
            });




        }
    },

    tooltipMessage: function(shapeName, shapeValue) {
        var message = shapeName + "</br>" + (shapeValue ? shapeValue : '-');
        return '<div class="gmapsoverlay-tooltip">' + message + '</div>';
    },

    // Apenas para debug de codigo
    clickCallback: function(shape, event) {
        //Override this
        Dashboards.log(shape.dataPayload.name + ':' + shape.dataPayload.value + ':' + shape.dataPayload.level * 100 + '%');
    },

    // Apenas para debug, mostra Lat/Lng no console
    displayCoordinates: function(pnt) {
        var lat = pnt.lat();
        lat = lat.toFixed(4);
        var lng = pnt.lng();
        lng = lng.toFixed(4);
        Dashboards.log("Lat: " + lat + "  Lng: " + lng);
    },

    showInfo: function(event, mapEngine, infowindow) {
        mapEngine.opened_info.close();
        //if (mapEngine.opened_info.name != infowindow.name) {
        infowindow.setPosition(event.latLng);
        infowindow.open(mapEngine.map);
        mapEngine.opened_info = infowindow;
        //}
    },

    resetButton: function(id, zoom, centerLongitude, centerLatitude) {

        var myself = this;

        var controlReset = document.createElement('div');
        var linkReset = document.createElement('a');
        controlReset.appendChild(linkReset);
        controlReset.setAttribute('id', 'controlReset_' + id);
        linkReset.setAttribute('id', 'linkReset_' + id);
        linkReset.href = "javascript:void(0)";
        linkReset.className = 'gmapsoverlay-button';
        linkReset.onclick = (function() {
            myself.map.setZoom(zoom);
            myself.map.setCenter(new google.maps.LatLng(centerLatitude, centerLongitude));
        });
        linkReset.innerHTML = 'Reset';

        myself.map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlReset);
    },

    exportCSVButton: function(obj) {

        var myself = this;
        var id =  obj.ph[0].id;

        var controlDiv = document.createElement('div');
        controlDiv.className = 'pull-left';
        var button = document.createElement('button');
        controlDiv.appendChild(button);
        controlDiv.setAttribute('id', 'exportCSV_' +id);
        button.setAttribute('id', 'CSVButton_' + id);
        button.setAttribute('data-placement', 'bottom');
        button.style.opacity ='0.6';
      //  button.href = "javascript:void(0)";
        button.title='Export to file csv.';
        button.className = 'btn btn-default btn-xs';

        button.onmouseover = (function(){
          button.style.opacity ='1';
          $(this).tooltip();

        });
        button.onmouseout = (function(){
          button.style.opacity ='0.6';

        });
        button.onclick = (function() {
          obj.downloadCSV();
        });
        button.innerHTML = 'CSV';

        myself.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
    },

    searchBox: function(id) {

        var myself = this;

        var control = document.createElement('div');
        var input = document.createElement('input');
        control.appendChild(input);
        control.setAttribute('id', 'locationField_' + id);
        input.style.width = '250px';
        input.style.height = '100%';
        input.style.margin = '0px';
        input.style.border = '1px solid #A9BBDF';
        input.style.borderRadius = '2px';
        input.setAttribute('id', 'locationInput_' + id);
        myself.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(control);

        var ac = new google.maps.places.Autocomplete(input, {
            types: ['geocode']
        });
        google.maps.event.addListener(ac, 'place_changed', function() {
            var place = ac.getPlace();
            if (place.geometry.viewport) {
                myself.map.fitBounds(place.geometry.viewport);
            } else {
                myself.map.setCenter(place.geometry.location);
                myself.map.setZoom(17);
            }
        });

        google.maps.event.addListener(myself.map, 'bounds_changed', function() {
            input.blur();
            input.value = '';
        });

        input.onkeyup = submitGeocode(input);
    },



    renderLegend: function(id, mapDefinition, queryResult, colormap, ticks, legendRanges, myself,obj) {


        if (myself.isContinuousMapColor) {
            var sigFigs = function(num, sig) {
                if (num == 0)
                    return 0;
                if (Math.round(num) == num)
                    return num;
                var digits = Math.round((-Math.log(Math.abs(num)) / Math.LN10) + (sig || 2));
                //round to significant digits (sig)
                if (digits < 0)
                    digits = 0;
                return num.toFixed(digits);
            };


            if (queryResult && mapDefinition) {
                var values = _.map(queryResult, function(q) {
                    return q.value;
                });
                var minValue = _.min(values),
                    maxValue = _.max(values);
                var n = colormap.length;
                var rounding = 1;
                if (maxValue < -5) {
                    rounding = ((maxValue - minValue) / 5).toString().split('.');
                    rounding = rounding.length > 1 ? Math.pow(10, Math.max(rounding[1].length, 3)) : 1;
                }
                var legend = _.map(ticks, function(level) {
                    var value = (minValue + level * (maxValue - minValue) * rounding) / rounding;
                    return {
                        value: sigFigs(value, 1),
                        level: level,
                        fillColor: colormap[Math.floor(level * n - 1)]
                    };
                });
            }

            this.legend = legend;
        }

        // Set CSS styles for the DIV containing the control
        // Setting padding to 5 px will offset the control
        // from the edge of the map
        var controlDiv = document.createElement('DIV');
        controlDiv.style.padding = '5px';
        controlDiv.style.width = 'auto';
        controlDiv.setAttribute('id', 'legendDiv_' + id);

        // Set CSS for the control border
        var controlUI = document.createElement('DIV');
        controlUI.setAttribute('id', 'legendUI_' + id);
        //controlUI.style.backgroundColor = 'white';
        //controlUI.style.borderStyle = 'solid';
        //controlUI.style.borderWidth = '1px';
        //controlUI.title = 'Legend';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control text
        var controlText = document.createElement('DIV');
        controlText.setAttribute('id', 'legendText_' + id);
        controlText.style.fontFamily = 'Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.paddingLeft = '4px';
        controlText.style.paddingRight = '4px';
        // cria constante
        var LEGEND_POSITION = {'BOTTOM_CENTER':11,
        'BOTTOM_LEFT':10,
        'RIGHT_BOTTOM':9};

        if (myself.isContinuousMapColor) {
            var legendTable = '';
            _.each(legend, function(el) {
                var left = (el.level != 0) ? el.level * 100 + '%' : '-1px';
                legendTable += "<div class='gmapsoverlay-legend-label' style='left:" + left + ";position:absolute;'><div>" + el.value + "</div></div>";
            });

            // Add the text
            controlText.innerHTML = "" +
                "<div class='gmapsoverlay-legend'>" +
                "  <div class='gmapsoverlay-legend-title'>" + legendRanges.text + "</div>" +
                "  <div class='gmapsoverlay-legend-scale'>" +
                "    <div class='gmapsoverlay-legend-labels'>" +
                legendTable +
                "    </div>" +
                "  </div>" +
                "<div class='gmapsoverlay-legend-source'>" + legendRanges.source + "</div>" +
                "</div>";

        } else  {
            var legendTable = "";
              if(!myself.isColorDefinedInDS){
                  var qtd = Object.keys(legendRanges.ranges).length;


            for (var j = 0; j < qtd; j++) {

                if (myself.isColorDefinedInDS) {
                    legendTable += "<li><span style='background:" + legendRanges.ranges[j].color + ";'></span>" + legendRanges.ranges[j].desc + "</li>";
                } else if (isNaN(legendRanges.ranges[j].min)) {
                    legendTable += "<li><span style='background:" + legendRanges.ranges[j].color + ";'><= " + legendRanges.ranges[j].max + "</span>" + legendRanges.ranges[j].desc + "</li>";
                } else if (isNaN(legendRanges.ranges[j].max)) {
                    legendTable += "<li><span style='background:" + legendRanges.ranges[j].color + ";'>>= " + legendRanges.ranges[j].min + "</span>" + legendRanges.ranges[j].desc + "</li>";
                } else {
                    //legendTable += "<li><span style='background:" + legendRanges.ranges[j].color + ";'>" + legendRanges.ranges[j].min + "-" + legendRanges.ranges[j].max + "</span>" + legendRanges.ranges[j].desc + "</li>";
                    legendTable += "<li><span style='background:" + legendRanges.ranges[j].color + ";'>" + legendRanges.ranges[j].max + "</span>" + legendRanges.ranges[j].desc + "</li>";
                }
            }

              }




            if(myself.isColorDefinedInDS ||  typeof obj.mapColorConditional == 'function'){



              var listColorOrdened = [];
              var colorIgualDs = false;
              var listCloneObj = [];
              var contem = function(arry,obj) {
                   var i = arry.length;
                     while (i--) {
                         if (arry[i] === obj) {
                           return true;
                           }
                           }
                             return false;
                           };
              // faz a ordenção por cores
              listUniqColor = _.sortBy(listUniqColor,'color');
              //obj.legendLabelDescOrderColor = obj.legendLabelDescOrderColor.reverse();
              // Sobrescreve a ordenação das colres na legenda pelo retorna da ordenação condicional
              if(typeof obj.legendLabelDescOrderColorConditional == 'function'){
                 obj.legendLabelDescOrderColor = obj.legendLabelDescOrderColorConditional();
              }

               if(obj.legendLabelDescOrderColor.length > 0){
                      qtdLegend = obj.legendLabelDescOrderColor.length;
                  for(var i = 0; i < qtdLegend;i++){
                      listColorOrdened[i] = {'countColor':(function(j){
                        return function(){
                          var qtdeTemp = listUniqColor.length;
                            for(var i = 0; i < qtdeTemp;i++){
                            if(!contem(obj.legendLabelDescOrderColor,listUniqColor[i].color)){
                              listCloneObj.push(listUniqColor[i]);
                              // remove istem
                              listUniqColor.splice(i,1);
                              i--;
                              qtdeTemp--
                            }

                          }
                          for(var item in listUniqColor){
                            colorIgualDs = false;
                            var valorRetorno = 0;


                            if(listUniqColor[item].color == obj.legendLabelDescOrderColor[j]){
                               colorIgualDs = true;
                               valorRetorno= listUniqColor[item].countColor;
                               // remove istem
                               listUniqColor.splice(item,1);
                            }

                            if(colorIgualDs){
                                return valorRetorno;
                            }

                          }
                            if(!colorIgualDs){
                                return 0;
                            }
                      }()
                      }(i))
                      , 'color':obj.legendLabelDescOrderColor[i]};

                      listUniqColor.push(listColorOrdened[i]);
                  }
                  if(listCloneObj.length > 0){
                    for(var j in listCloneObj){
                        listUniqColor.push(listCloneObj[j]);
                    }
                  }
               }else{
                  qtdLegend = Object.keys(listUniqColor).length;
               }

               var fontColor ;
               var legendLabelDescInfo;
               var legendCountHtml = '';
               var legendLabelConditional = false;

               // retorna um array com as labels condicionais
               if(typeof obj.legendLabelDescConditional == 'function'){
                   legendLabelDescInfo =  obj.legendLabelDescConditional() ;
                   legendLabelConditional = true;
               }
               for (var j = 0; j < listUniqColor.length; j++) {
                    fontColor = obj.legendLabelDescFonteColor[j] != undefined ? obj.legendLabelDescFonteColor[j]  : 'black';
                     if(typeof obj.legendLabelDescConditional != 'function'){
                        legendLabelDescInfo =  obj.legendLabelDesc[j] != undefined ? obj.legendLabelDesc[j]  : '';
                      }

                      obj.legendCountVisible ? legendCountHtml = "<span class='badge' style='font-size:"+obj.legendCountFonteSize+"px;  '>"+ listUniqColor[j].countColor +"</span>"  :  legendCountHtml  ;
                      legendTable +=   ""+
                    "<li class='col-md-1' style='background-color:" + listUniqColor[j].color + ";font-size:"+obj.legendLabelDescFonteSize+"px;padding:5px;width:auto;min-width:50px;color: "+fontColor+"  ' >" +(legendLabelConditional ? legendLabelDescInfo[j] : legendLabelDescInfo)+ legendCountHtml+" </li> ";
               }
               // Add the text
               controlText.innerHTML =

                   "<div class='panel ' style='width: "+(obj.legendWidth != undefined ? obj.legendWidth  : '100%') +";opacity:"+obj.legendOpacity+";'>" +
                   (obj.legendTitle != undefined ? "<div class='panel-heading'>" + obj.legendTitle  +"</div>"  : "") +
                   "<div class='panel-body'>" +
                   "<div style='font-size:"+obj.legendTextFonteSize+";padding:5px' >" + legendRanges.text + "</div>" +
                      "<ul class='nav' >"+
                         legendTable +
                      "</ul>"+

                   "</div>" +
                   "<div class='panel-footer'>" + legendRanges.source +
                      (obj.exportToCSVFileVisible && obj.exportToCSVFileLocaly == 'LEGEND' ? "<div class='pull-right'><button type='button' class='btn btn-default btn-xs' id='exportCSV'  title='Export to file csv.'  onmouseover='$(this).tooltip();' onclick='myself.downloadCSV()' >CSV</button></div>" : "")+

                   "</div>" +
                   "</div>";

            }else{

              // Add the text
              controlText.innerHTML = "" +
                  "<div class='gmapsoverlay-legend' style='width: auto'>" +
                  "<div class='gmapsoverlay-legend-title'>" + legendRanges.text + "</div>" +
                  "<div class='gmapsoverlay-legend-scale-range' align='center' >" +
                  "  <ul class='gmapsoverlay-legend-labels-range'  >" +

                  legendTable +

                "  </ul>" +
                  "</div>" +
                  "<div class='gmapsoverlay-legend-source'>" + legendRanges.source + "</div>" +
                  "</div>";

            }


        }

        controlUI.appendChild(controlText);
        this.map.controls[( LEGEND_POSITION[obj.legendPosition] != undefined ?  LEGEND_POSITION[obj.legendPosition]  :google.maps.ControlPosition.BOTTOM_CENTER)].push(controlDiv);
    },

    showPopup: function(data, mapElement, popupHeight, popupWidth, contents, popupContentDiv, borderColor) {
        var overlay = new OurMapOverlay(mapElement.getPosition(), popupWidth, popupHeight, contents, popupContentDiv, this.map, borderColor);

        $(this.overlays).each(function(i, elt) {
            elt.setMap(null);
        });
        this.overlays.push(overlay);
    }

});
