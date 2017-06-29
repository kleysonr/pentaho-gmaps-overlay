# Introduction #

GMapsOverlay is a plugin for Pentaho CDE (Community Dashboard Editor) that allows the user create customized maps using Google Maps Overlays.

# Installing #

GMapsOverlay was included on CDE and it's available under Community Contributions menu.

GMaps Version 2.x tested on Pentaho 4.8 / 5.0.1<br>
GMaps Version 1.x tested on Pentaho 4.5 / 4.8<br>
<br>
<h1>Sample</h1>

<a href='https://sourceforge.net/projects/pentahogmapsoverlay/files/'>https://sourceforge.net/projects/pentahogmapsoverlay/files/</a>

<h1>Usage</h1>

See the video for GMapsOverlay Version 1.0.0<br>
<a href='http://youtu.be/oyppms5fGhc'>http://youtu.be/oyppms5fGhc</a>

<h1>Adding New Maps</h1>

For new maps just create a new definition map and save it in the pentaho-solutions/cde/components/gmapsoverlay/map-def folder.

<h1> Novas funcionalidades do plugin </h1>

- **DoubleClickAction** 
 - Voce pode especificar uma função com dois parâmetros
 serve para voce executar outra ação baseando se no valor do shape que recebeu duplo click

	    function(obj,e){
  		  if(regiao_mapa !== '[Municipio].[MunicipioX]'){
      	    Dashboards.fireChange('regiao_selecionada_mapa', obj.infowindow.dataPayload.name);
   		  }
	    } 
      
- **DisableDoubleClickZoom**:  true | false
 opção de desativar o zoom no double click pois ela interfere se voce for usar a função DoubleClickAction

- **LabelsIcons**: On | Off
 Mostra icones no mapa

- **AdministrativeLocality**: On | Off
 Mostra informaçoes de locatidades
 
- **MapColorConditional**
 Voce pode definir um função que recebe um parametro e baseado no valor desse retorna uma cor no formato #000000.<br>
 Obs: para utilizar esta função a opção isColorDefinedInDS tem que estar false.
        
        function(value){
            if(value > 20){
              return '#00FF00'
            }
        }
      
- **MapNameConditional**
 Aqui voce define uma função que retorna o nome do arquivo shape file que será desenhado no mapa dependendo de uma    determinada condição
 
 
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
  Habilita ou desabilita o zoom no scroll
- **ShapeFillOpacity**
  Defini a transparencia do shape
- **shapeStrokeWeight**
  Defini a espessura das linhas do shape
- **ValueFormat**
  Aqui voce defini uma função que recebe um parametro de valor onde voce vai formatar o valor e retornar o valor formatado.
          
          function(value){
              return accounting.toFixed(value, 2)+"%";
    
           } 
  
- **ZoomControl**
 Habilita/deshabilita controle de zoom
- **isColorDefinedInDS**:  true | false
 Se essa opção for **true** é obrigatório trazer a cor(no formato: #00FF00) na terceira coluna do seu datasource
- **LegendItemLabelDescConditional**
 Aqui voce defini uma função que retorna um array com a descrição do item da legenda
    
      function (){
          if ( MENU_SELECIONADO == PRE_NATAL) {
              return ['≥75.01%','≥ 50.01% e ≤75%','≤ 50%','0%'];
          }else if(MENU_SELECIONADO == MAES_ADOLESCENTES){
              return ['≥0.01% e ≤15%','≥ 15.01% e ≤25%','≥ 25.01%','0%'];
          }
      } 
 
 - **LegendItemLabelDescFonteColor**
  Cor da descrição do item na legenda aqui voce escrever a cor ex: 'white'
 - **LegendItemLabelDescFonteSize**
  Tamanha do fonte do item da legenda
 - **LegendOpacity**
  Transparência da legenda
 - **LegendPosition**
  Posição da legenda
 - **LegendItemCountVisible**
  Mostra um contador das cores da legenda que estao no shape
 - **ExportToCSVFileVisible**
  Habilita/desabilita opção na legenda de exportar os dados do mapa para csv

 #### Exemplos: ####

- **Mapa por municipios**

	![MAPA_REGIAO SAUDE]( http://fs5.directupload.net/images/170630/pe68hhbi.png )


- **Mapa por Região**
 
	![MAPA_REGIAO SAUDE]( http://fs5.directupload.net/images/170629/gzhinikv.png )
 

