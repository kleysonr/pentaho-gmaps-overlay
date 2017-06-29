# Introduction #

GMapsOverlay is a plugin for Pentaho CDE (Community Dashboard Editor) that allows the user create customized maps using Google Maps Overlays.

# Installing #

GMapsOverlay was included on CDE and it's available under Community Contributions menu.

GMaps Version 2.x tested on Pentaho 4.8 / 5.0.1<br>
GMaps Version 1.x tested on Pentaho 4.5 / 4.8<br>
<br>
<h1>Sample</h1>

[How to use this plugin](https://sourceforge.net/projects/pentahogmapsoverlay/files/ "How to use this plugin")

<h1>Usage</h1>

See the video for GMapsOverlay Version 1.0.0<br>
	
 [Plugin video usage](http://youtu.be/oyppms5fGhc "Plugin video usage")

<h1>Adding New Maps</h1>

For new maps just create a new definition map and save it in the pentaho-solutions/cde/components/gmapsoverlay/map-def folder.

<h1> New plugin features </h1>

- **DoubleClickAction** 
 - You can specify a function with two parameters for you to call another action based on the value of the shape that received double click
 
	    function(obj,e){
  		  if(regiao_mapa !== '[Municipio].[MunicipioX]'){
      	    Dashboards.fireChange('regiao_selecionada_mapa', obj.infowindow.dataPayload.name);
   		  }
	    } 
      
- **DisableDoubleClickZoom**:  true | false
 Option to deactivate the zoom in the double click because it interferes if you will use the DoubleClickAction

- **LabelsIcons**: On | Off
 Show icons on the map

- **AdministrativeLocality**: On | Off
 Show location information
 
- **MapColorConditional**
 You can define a function that receives a parameter and based on the value of it returns a color in the format #000000.<br>
 Obs: The isColorDefinedInDS property must be false for use of this function.
        
        function(value){
            if(value > 20){
              return '#00FF00'
            }
        }
      
- **MapNameConditional**
 Here you define a function that returns the file name of the shape that will be drawn on the map depending on a certain condition
 
 
          function(){
    
              if (regiao_mapa == '[MunicipioResidencia].[MunicipioX]') {
                 return 'goias-municipios';
              } else if (regiao_mapa == '[RegiaoSaude].[RegiaoSaudeX]') {
                  return 'goias-regiao-saude';
              } else if (regiao_mapa == '[MacroRegiao].[MacroRegiaoX]') {
                  return 'goias-macro';
               }  else if (regiao_mapa == '[RideRegiao].[RIDEX]')   {
                  return 'goias-ride';

               }
          }
 
- **ScrollWhell**
  Enables or disables scroll zoom
- **ShapeFillOpacity**
  Here you define the transparency of shape
- **shapeStrokeWeight**
  Define a shape line thickness
- **ValueFormat**
  Here you define a function that receives a value parameter where you will format the value and return the formatted value.
          
          function(value){
              return accounting.toFixed(value, 2)+"%";
    
           } 
  
- **ZoomControl**
 Enable / disable zoom control
- **isColorDefinedInDS**:  true | false
 If this option is ** true ** it is mandatory to bring the color (in the format: # 00FF00) in the third column of your datasource
- **LegendItemLabelDescConditional**
 Here you define a function that returns an array with the description of the legend item
    
      function (){
          if ( MENU_SELECIONADO == PRE_NATAL) {
              return ['≥75.01%','≥ 50.01% e ≤75%','≤ 50%','0%'];
          }else if(MENU_SELECIONADO == MAES_ADOLESCENTES){
              return ['≥0.01% e ≤15%','≥ 15.01% e ≤25%','≥ 25.01%','0%'];
          }
      } 
 
 - **LegendItemLabelDescFonteColor**
  Color description of the item in the legend. Here you write the color ex: 'white'
 - **LegendItemLabelDescFonteSize**
  Legend item font size
 - **LegendOpacity**
  Legend Transparency
 - **LegendPosition**
  Position Legend
 - **LegendItemCountVisible**
  Show a counter of the legend colors that are in shape
 - **ExportToCSVFileVisible**
  Enable / disable option in subtitle to export map data to csv

 #### Exemplos: ####
 
- **Dashboards that use this plugin**

  - [Dashbord SINASC](https://extranet.saude.go.gov.br/public/genesis.html "Dashbord SINASC")
  - [Dashbord SIM](https://extranet.saude.go.gov.br/public/sim.html "Dashbord SIM")
  - [Dashbord DENGUE](https://extranet.saude.go.gov.br/public/dengue.html "Dashbord DENGUE")
		
- **Map by towns**

	![MAPA_MUNICIPIOS]( http://fs5.directupload.net/images/170630/9bfwicpi.png )


- **Map by Health Region**
 
	![MAPA_REGIAO SAUDE]( http://fs5.directupload.net/images/170629/gzhinikv.png )
 

