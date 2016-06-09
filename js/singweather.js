var transitLayer = new google.maps.TransitLayer();
var mapCenter = new google.maps.LatLng(1.395, 103.77);
var mapOptions = {
    zoom: 11,
    center: mapCenter,
    panControl:true,
    zoomControl:true,
    mapTypeControl:true,
    scaleControl:true,
    streetViewControl:true,
    overviewMapControl:true,
    rotateControl:true,
    mapTypeControlOptions: {
	style:google.maps.MapTypeControlStyle.DROPDOWN_MENU
    },
};
var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
var currentTimeRange="";
var apikeyref="781CF461BB6606ADEA01E0CAF8B352745D7D53A4EBE4FA32";
//            ^^
// Put your Singapore NEA API key in the above variable
// Apply for a key at https://www.nea.gov.sg/api

// Abbreviation of the weather forecast. Maintain a count of each one displayed for later use in the map icon legend
var BR=0,CL=0,DR=0,FA=0,FG=0,FN=0,FW=0,HG=0,HR=0,HS=0,HT=0,HZ=0,LH=0,LR=0,LS=0,OC=0,PC=0,
PN=0,PS=0,RA=0,SH=0,SK=0,SN=0,SR=0,SS=0,SU=0,SW=0,TL=0,WC=0,WD=0,WF=0,WR=0,WS=0;

// Array of months used in later date formatting
var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

$(document).ready(function () {
    initialize();
});

function initialize() {

    map.markers = [];
    transitLayer.setMap(map);
	
    // Use geolocation to get the users location
    if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(function(position) {
	    var myLatLng = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );
	    myMarker=0;
	    // build entire marker first time thru
	    if ( !myMarker ) {
		// define our custom marker image
		var image = new google.maps.MarkerImage(
		    'img/bluedot_retina.png',
		    null, // size
		    null, // origin
		    new google.maps.Point( 8, 8 ), // anchor (move to center of marker)
		    new google.maps.Size( 17, 17 ) // scaled size (required for Retina display icon)
		);
		// then create the new marker
		myMarker = new google.maps.Marker({
		    flat: true,
		    icon: image,
		    map: map,
		    optimized: false,
		    position: myLatLng,
		    title: 'My location',
		    visible: true,
		});
	    // just change marker position on subsequent passes
	    } else {
	        myMarker.setPosition( myLatLng );
	    }
	});
    }
    // Load the data from the "2 Hours Nowcast Dataset"
    loadTwoHourNowCast();
}

function loadTwoHourNowCast() {
    // The 2 hour nowcast XML dataset provides regional weather forecast for the next 2 hours
    var xhttp = new XMLHttpRequest();

    /* xhttp.status
	200 = The request was completed successfully.
	401 = nea-authorization-key used was not valid.
	404 = Data set requested was not available.
    */
    xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
	    load2hrNowcastData(xhttp);
	} else {
	    if (xhttp.readyState == 4 && xhttp.status == 401) {
		alert('Error in retreiving 2 hour weather forecast. ('+xhttp.status+')');
	    } else {
		if (xhttp.readyState == 4 && xhttp.status == 404) {
		    alert('2 hour weather forecast is not currently available. Please try again later. ('+xhttp.status+')');
		}
	    }
	}
    };
    var url="http://www.nea.gov.sg/api/WebAPI?dataset=2hr_nowcast&keyref="+apikeyref;
    xhttp.open("GET", url, true);
    xhttp.send();
}

function load2hrNowcastData(xml) {
    var xmlDoc = xml.responseXML;
    var forecastDate=xmlDoc.getElementsByTagName('forecastIssue')[0].getAttribute('date');
    var dd=forecastDate.substr(0,2);
    var mm=parseInt(forecastDate.substr(3,4))-1;
    var mmm=monthNames[mm];
    var forecastTime=xmlDoc.getElementsByTagName('forecastIssue')[0].getAttribute('time');
    if(forecastTime.substr(0,1)=='0') {
	forecastTime=forecastTime.substr(1,7);
    }
    $("#mainHeader").html(dd+' '+mmm+' at '+forecastTime.toLowerCase());
    currentTimeRange=xmlDoc.getElementsByTagName('validTime')[0].childNodes[0].nodeValue;
    
    // The 2 hour nowcast has the forecast for 47 areas in Singapore (as of 13th May 2016)
    x = xmlDoc.getElementsByTagName('area');
    
    // Add a marker with infowindow to the map for each area
    for (i = 0; i < x.length; i++) {
      var forecast = x[i].getAttribute('forecast');
      var name = x[i].getAttribute('name');
      var latlng = new google.maps.LatLng(x[i].getAttribute('lat'), x[i].getAttribute('lon'));
      addMarker(latlng, name, forecast, 'TwoHourNowCast');
    }

    filterMapLayer('TwoHourNowCast');
    
    // Load the data from the "24 Hours Forecast Dataset"
    loadTwentyFourHourForeCast();
}

function loadTwentyFourHourForeCast() {
    // The 24 hour forecast XML dataset provides regional weather forecast for the next 24 hours
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
        loadTwentyFourHourForeCastData(xhttp);
    } else {
	if (xhttp.readyState == 4 && xhttp.status == 401) {
	    alert('Error in retreiving 24 hour weather forecast. ('+xhttp.status+')');
	} else {
	    if (xhttp.readyState == 4 && xhttp.status == 404) {
		alert('24 hour weather forecast is not currently available. Please try again later. ('+xhttp.status+')');
	    }
	}
    }
  };
  var url="http://www.nea.gov.sg/api/WebAPI?dataset=24hrs_forecast&keyref="+apikeyref;
  xhttp.open("GET", url, true);
  xhttp.send();
}

function loadTwentyFourHourForeCastData(xml) {
    var xmlDoc = xml.responseXML;
    
    // The 24 hour forecast has a general forecast for the whole of Singapore
    var forecast = xmlDoc.getElementsByTagName('wxmain')[0].childNodes[0].nodeValue;
//    var icon = "<img src='img/"+forecast+".png' />";
//    var desc = getForeCastDesc(forecast);
    
    var unit = "&deg;";
    switch (xmlDoc.getElementsByTagName('temperature')[0].getAttribute('unit')) {
	case 'Degrees Celsius' : unit+="C"; break;
	case 'Degrees Fahrenheit' : unit+="F"; break;
	default : unit ='';
    }

    $("#twentyFourHourForeCast").html("<b>Forecast:</b> "+xmlDoc.getElementsByTagName('forecast')[0].childNodes[0].nodeValue+'<br />');
    $("#twentyFourHourForeCast").append("<div class='temperature'><b>Temperature:</b> High "+xmlDoc.getElementsByTagName('temperature')[0].getAttribute('high')+" "+unit+", Low "+xmlDoc.getElementsByTagName('temperature')[0].getAttribute('low')+" "+unit+"</div>");
    $("#twentyFourHourForeCast").append("<div class='humidity'><b>Relative Humidity:</b> High "+xmlDoc.getElementsByTagName('relativeHumidity')[0].getAttribute('high')+"%, Low "+xmlDoc.getElementsByTagName('relativeHumidity')[0].getAttribute('low')+"%</div>");
    $("#twentyFourHourForeCast").append("<div class='wind'><b>Wind:</b> "+xmlDoc.getElementsByTagName('wind')[0].getAttribute('direction')+" "+xmlDoc.getElementsByTagName('wind')[0].getAttribute('speed')+"mph</div>");

    // Display current 2 Hour NowCast
    $("#map-panel").append("<div class='legend'>2 Hour Nowcast</div>");
    // Reduce the size of the current time period by removing superfluous characters
    currentTimeRange=currentTimeRange.replace(/.00 /g,'');
    currentTimeRange=currentTimeRange.replace(/.30 /g,'.30');
    var rad = '<div class="radio"><label><input type="radio" name="radioTimePeriod" id="radioTimePeriod" value="TwoHourNowCast" checked="checked"> '+currentTimeRange+'</input></label></div>';
    var radioBtn = $(rad);
    radioBtn.appendTo('#map-panel');
    
    // Reduce the size of the time periods by removing superfluous characters
    var today = new Date();
    var tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    var todayDayMonth = today.getDate()+' '+monthNames[today.getMonth()];
    var tmrwDayMonth = tmrw.getDate()+' '+monthNames[tmrw.getMonth()];
    
    // Display 24 forecast time ranges (3)
    $("#map-panel").append("<div class='legend'>24 Hour Forecast</div>");
    var timeRange = xmlDoc.getElementsByTagName('timePeriod')[0].childNodes[0].nodeValue;
    timeRange=timeRange.replace(/ am/g,'am');
    timeRange=timeRange.replace(/ pm/g,'pm');
    timeRange=timeRange.replace(todayDayMonth,'');
    timeRange=timeRange.replace(tmrwDayMonth,'');
    rad = '<div class="radio"><label><input type="radio" name="radioTimePeriod" id="radioTimePeriod" value="TwentyFourHourForeCast0"> '+timeRange+'</input></label></div>';
    radioBtn = $(rad);
    radioBtn.appendTo('#map-panel');
    
    timeRange = xmlDoc.getElementsByTagName('timePeriod')[1].childNodes[0].nodeValue;
    timeRange=timeRange.replace(/ am/g,'am');
    timeRange=timeRange.replace(/ pm/g,'pm');
    timeRange=timeRange.replace(todayDayMonth,'');
    timeRange=timeRange.replace(tmrwDayMonth,'');
    rad = '<div class="radio"><label><input type="radio" name="radioTimePeriod" id="radioTimePeriod" value="TwentyFourHourForeCast1"> '+timeRange+'</input></label></div>';
    radioBtn = $(rad);
    radioBtn.appendTo('#map-panel');
    
    timeRange = xmlDoc.getElementsByTagName('timePeriod')[2].childNodes[0].nodeValue;
    timeRange=timeRange.replace(/ am/g,'am');
    timeRange=timeRange.replace(/ pm/g,'pm');
    timeRange=timeRange.replace(todayDayMonth,'');
    timeRange=timeRange.replace(tmrwDayMonth,'');
    rad = '<div class="radio"><label><input type="radio" name="radioTimePeriod" id="radioTimePeriod" value="TwentyFourHourForeCast2"> '+timeRange+'</input></label></div>';
    radioBtn = $(rad);
    radioBtn.appendTo('#map-panel');

    // The 24 hour forecast has the forecast for 5 regions in Singapore (as of 13th May 2016)    
    // Define the 5 regions geographical centre's
    var eastLatLng= new google.maps.LatLng(1.349738, 103.957429);
    var westLatLng= new google.maps.LatLng(1.339673, 103.707526);
    var northLatLng= new google.maps.LatLng(1.438510, 103.789079);
    var southLatLng= new google.maps.LatLng(1.264525, 103.826159);
    var centralLatLng= new google.maps.LatLng(1.367965, 103.814706);    
    
    //  24 hour forecast - Current time period
    forecast=xmlDoc.getElementsByTagName('wxeast')[0].childNodes[0].nodeValue;
    addMarker(eastLatLng,'East Singapore',forecast,'TwentyFourHourForeCast0');
    forecast=xmlDoc.getElementsByTagName('wxwest')[0].childNodes[0].nodeValue;
    addMarker(westLatLng,'West Singapore',forecast,'TwentyFourHourForeCast0');
    forecast=xmlDoc.getElementsByTagName('wxnorth')[0].childNodes[0].nodeValue;
    addMarker(northLatLng,'North Singapore',forecast,'TwentyFourHourForeCast0');
    forecast=xmlDoc.getElementsByTagName('wxsouth')[0].childNodes[0].nodeValue;
    addMarker(southLatLng,'South Singapore',forecast,'TwentyFourHourForeCast0');
    forecast=xmlDoc.getElementsByTagName('wxcentral')[0].childNodes[0].nodeValue;
    addMarker(centralLatLng,'Central Singapore',forecast,'TwentyFourHourForeCast0');
    
    //  24 hour forecast - Next time period
    forecast=xmlDoc.getElementsByTagName('wxeast')[1].childNodes[0].nodeValue;
    addMarker(eastLatLng,'East Singapore',forecast,'TwentyFourHourForeCast1');
    forecast=xmlDoc.getElementsByTagName('wxwest')[1].childNodes[0].nodeValue;
    addMarker(westLatLng,'West Singapore',forecast,'TwentyFourHourForeCast1');
    forecast=xmlDoc.getElementsByTagName('wxnorth')[1].childNodes[0].nodeValue;
    addMarker(northLatLng,'North Singapore',forecast,'TwentyFourHourForeCast1');
    forecast=xmlDoc.getElementsByTagName('wxsouth')[1].childNodes[0].nodeValue;
    addMarker(southLatLng,'South Singapore',forecast,'TwentyFourHourForeCast1');
    forecast=xmlDoc.getElementsByTagName('wxcentral')[1].childNodes[0].nodeValue;
    addMarker(centralLatLng,'Central Singapore',forecast,'TwentyFourHourForeCast1');
    
    //  24 hour forecast - third time period
    forecast=xmlDoc.getElementsByTagName('wxeast')[2].childNodes[0].nodeValue;
    addMarker(eastLatLng,'East Singapore',forecast,'TwentyFourHourForeCast2');
    forecast=xmlDoc.getElementsByTagName('wxwest')[2].childNodes[0].nodeValue;
    addMarker(westLatLng,'West Singapore',forecast,'TwentyFourHourForeCast2');
    forecast=xmlDoc.getElementsByTagName('wxnorth')[2].childNodes[0].nodeValue;
    addMarker(northLatLng,'North Singapore',forecast,'TwentyFourHourForeCast2');
    forecast=xmlDoc.getElementsByTagName('wxsouth')[2].childNodes[0].nodeValue;
    addMarker(southLatLng,'South Singapore',forecast,'TwentyFourHourForeCast2');
    forecast=xmlDoc.getElementsByTagName('wxcentral')[2].childNodes[0].nodeValue;
    addMarker(centralLatLng,'Central Singapore',forecast,'TwentyFourHourForeCast2');
    
    // Build Legend based on the icons used on the map
    $("#map-panel").append("<div class='legend'>Map Legend</div>");
    if(BR>0){$("#map-panel").append("<div class='legendItem'><img src='img/BR.png'></img>&nbsp;Mist</div>");}
    if(CL>0){$("#map-panel").append("<div class='legendItem'><img src='img/CL.png'></img>&nbsp;Cloudy</div>");}
    if(DR>0){$("#map-panel").append("<div class='legendItem'><img src='img/DR.png'></img>&nbsp;Drizzle</div>");}
    if(FA>0){$("#map-panel").append("<div class='legendItem'><img src='img/FA.png'></img>&nbsp;Fair</div>");}
    if(FG>0){$("#map-panel").append("<div class='legendItem'><img src='img/FG.png'></img>&nbsp;Fog</div>");}
    if(FN>0){$("#map-panel").append("<div class='legendItem'><img src='img/FN.png'></img>&nbsp;Fair</div>");}
    if(FW>0){$("#map-panel").append("<div class='legendItem'><img src='img/FW.png'></img>&nbsp;Fair & Warm</div>");}
    if(HG>0){$("#map-panel").append("<div class='legendItem'><img src='img/HG.png'></img>&nbsp;Heavy Thundery Showers with Gusty Winds</div>");}
    if(HR>0){$("#map-panel").append("<div class='legendItem'><img src='img/HR.png'></img>&nbsp;Heavy Rain</div>");}
    if(HS>0){$("#map-panel").append("<div class='legendItem'><img src='img/HS.png'></img>&nbsp;Heavy Showers</div>");}
    if(HT>0){$("#map-panel").append("<div class='legendItem'><img src='img/HT.png'></img>&nbsp;Heavy Thundery Showers</div>");}
    if(HZ>0){$("#map-panel").append("<div class='legendItem'><img src='img/HZ.png'></img>&nbsp;Hazy</div>");}
    if(LH>0){$("#map-panel").append("<div class='legendItem'><img src='img/LH.png'></img>&nbsp;Slightly Hazy</div>");}
    if(LR>0){$("#map-panel").append("<div class='legendItem'><img src='img/LR.png'></img>&nbsp;Light Rain</div>");}
    if(LS>0){$("#map-panel").append("<div class='legendItem'><img src='img/LS.png'></img>&nbsp;Light Showers</div>");}
    if(OC>0){$("#map-panel").append("<div class='legendItem'><img src='img/OC.png'></img>&nbsp;Overcast</div>");}
    if(PC>0){$("#map-panel").append("<div class='legendItem'><img src='img/PC.png'></img>&nbsp;Partly Cloudy</div>");}
    if(PN>0){$("#map-panel").append("<div class='legendItem'><img src='img/PN.png'></img>&nbsp;Partly Cloudy</div>");}
    if(PS>0){$("#map-panel").append("<div class='legendItem'><img src='img/PS.png'></img>&nbsp;Passing Showers</div>");}
    if(RA>0){$("#map-panel").append("<div class='legendItem'><img src='img/RA.png'></img>&nbsp;Moderate Rain</div>");}
    if(SH>0){$("#map-panel").append("<div class='legendItem'><img src='img/SH.png'></img>&nbsp;Showers</div>");}
    if(SK>0){$("#map-panel").append("<div class='legendItem'><img src='img/SK.png'></img>&nbsp;Strong Winds, Showers</div>");}
    if(SN>0){$("#map-panel").append("<div class='legendItem'><img src='img/SN.png'></img>&nbsp;Snow</div>");}
    if(SR>0){$("#map-panel").append("<div class='legendItem'><img src='img/SR.png'></img>&nbsp;Strong Winds, Rain</div>");}
    if(SS>0){$("#map-panel").append("<div class='legendItem'><img src='img/SS.png'></img>&nbsp;Snow Showers</div>");}
    if(SU>0){$("#map-panel").append("<div class='legendItem'><img src='img/SU.png'></img>&nbsp;Sunny</div>");}
    if(SW>0){$("#map-panel").append("<div class='legendItem'><img src='img/SW.png'></img>&nbsp;Strong Winds</div>");}
    if(TL>0){$("#map-panel").append("<div class='legendItem'><img src='img/TL.png'></img>&nbsp;Thundery Showers</div>");}
    if(WC>0){$("#map-panel").append("<div class='legendItem'><img src='img/WC.png'></img>&nbsp;Windy, Cloudy</div>");}
    if(WD>0){$("#map-panel").append("<div class='legendItem'><img src='img/WD.png'></img>&nbsp;Windy</div>");}
    if(WF>0){$("#map-panel").append("<div class='legendItem'><img src='img/WF.png'></img>&nbsp;Windy, Fair</div>");}
    if(WR>0){$("#map-panel").append("<div class='legendItem'><img src='img/WR.png'></img>&nbsp;Windy, Rain</div>");}
    if(WS>0){$("#map-panel").append("<div class='legendItem'><img src='img/WS.png'></img>&nbsp;Windy, Showers</div>");}
    
    // Listener for the current conditions / forecast radio buttons
    $(document).ready(function () {
	$('input:radio[name=radioTimePeriod]').change(function () {
	    filterMapLayer($("input[name='radioTimePeriod']:checked").val());
	});
    });
    
    // Load the data from the "24 Hours Forecast Dataset"
    loadFourDayForeCast();
}

function loadFourDayForeCast() {
    // The 4 day forecast XML dataset provides Singapore-wide weather forecast for the next 4 days
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
	    load4DayForecastData(xhttp);
	} else {
	    if (xhttp.readyState == 4 && xhttp.status == 401) {
		alert('Error in retreiving four day weather forecast. ('+xhttp.status+')');
	    } else {
		if (xhttp.readyState == 4 && xhttp.status == 404) {
		    alert('Four day weather forecast is not currently available. Please try again later. ('+xhttp.status+')');
		}
	    }
	}
  };
  var url="http://www.nea.gov.sg/api/WebAPI?dataset=4days_outlook&keyref="+apikeyref;
  xhttp.open("GET", url, true);
  xhttp.send();
}

function load4DayForecastData(xml) {
    var xmlDoc = xml.responseXML;
    $("#FourDay1").html("<b>"+xmlDoc.getElementsByTagName('day')[0].childNodes[0].nodeValue+'</b><br />');
    $("#FourDay2").html("<b>"+xmlDoc.getElementsByTagName('day')[1].childNodes[0].nodeValue+'</b><br />');
    $("#FourDay3").html("<b>"+xmlDoc.getElementsByTagName('day')[2].childNodes[0].nodeValue+'</b><br />');
    $("#FourDay4").html("<b>"+xmlDoc.getElementsByTagName('day')[3].childNodes[0].nodeValue+'</b><br />');

    $("#FourDay1").append(xmlDoc.getElementsByTagName('forecast')[0].childNodes[0].nodeValue+'<br />');
    $("#FourDay2").append(xmlDoc.getElementsByTagName('forecast')[1].childNodes[0].nodeValue+'<br />');
    $("#FourDay3").append(xmlDoc.getElementsByTagName('forecast')[2].childNodes[0].nodeValue+'<br />');
    $("#FourDay4").append(xmlDoc.getElementsByTagName('forecast')[3].childNodes[0].nodeValue+'<br />');
    
    var icon="<img src='img/"+xmlDoc.getElementsByTagName('icon')[0].childNodes[0].nodeValue+".png' alt='' />";
    $("#FourDay1").append(icon+'<br />');
    icon="<img src='img/"+xmlDoc.getElementsByTagName('icon')[1].childNodes[0].nodeValue+".png' alt='' />";
    $("#FourDay2").append(icon+'<br />');
    icon="<img src='img/"+xmlDoc.getElementsByTagName('icon')[2].childNodes[0].nodeValue+".png' alt='' />";
    $("#FourDay3").append(icon+'<br />');
    icon="<img src='img/"+xmlDoc.getElementsByTagName('icon')[3].childNodes[0].nodeValue+".png' alt='' />";
    $("#FourDay4").append(icon+'<br />');
    
    // Get Four Day - Day 1: Temperature, Humidity and Wind
    var unit = "&deg;";
    switch (xmlDoc.getElementsByTagName('temperature')[0].getAttribute('unit')) {
	case 'Degrees Celsius' : unit+="C"; break;
	case 'Degrees Fahrenheit' : unit+="F"; break;
	default : unit ='';
    }
    $("#FourDay1").append("<div class='temperature clearfix'><b>Temperature:</b> High "+xmlDoc.getElementsByTagName('temperature')[0].getAttribute('high')+" "+unit+", Low "+xmlDoc.getElementsByTagName('temperature')[0].getAttribute('low')+" "+unit+"</div>");
    $("#FourDay1").append("<div class='humidity clearfix'><b>Relative Humidity:</b> High "+xmlDoc.getElementsByTagName('relativeHumidity')[0].getAttribute('high')+"%, Low "+xmlDoc.getElementsByTagName('relativeHumidity')[0].getAttribute('low')+"%</div>");
    $("#FourDay1").append("<div class='wind clearfix'><b>Wind:</b> "+xmlDoc.getElementsByTagName('wind')[0].getAttribute('direction')+" "+xmlDoc.getElementsByTagName('wind')[0].getAttribute('speed')+"mph</div>");
    
    // Get Four Day - Day 2: Temperature, Humidity and Wind
    unit = "&deg;";
    switch (xmlDoc.getElementsByTagName('temperature')[1].getAttribute('unit')) {
	case 'Degrees Celsius' : unit+="C"; break;
	case 'Degrees Fahrenheit' : unit+="F"; break;
	default : unit ='';
    }
    $("#FourDay2").append("<div class='temperature clearfix'><b>Temperature:</b> High "+xmlDoc.getElementsByTagName('temperature')[1].getAttribute('high')+" "+unit+", Low "+xmlDoc.getElementsByTagName('temperature')[1].getAttribute('low')+" "+unit+"</div>");
    $("#FourDay2").append("<div class='humidity clearfix'><b>Relative Humidity:</b> High "+xmlDoc.getElementsByTagName('relativeHumidity')[1].getAttribute('high')+"%, Low "+xmlDoc.getElementsByTagName('relativeHumidity')[1].getAttribute('low')+"%</div>");
    $("#FourDay2").append("<div class='wind clearfix'><b>Wind:</b> "+xmlDoc.getElementsByTagName('wind')[1].getAttribute('direction')+" "+xmlDoc.getElementsByTagName('wind')[1].getAttribute('speed')+"mph</div>");
    
    // Get Four Day - Day 3: Temperature, Humidity and Wind
    unit = "&deg;";
    switch (xmlDoc.getElementsByTagName('temperature')[2].getAttribute('unit')) {
	case 'Degrees Celsius' : unit+="C"; break;
	case 'Degrees Fahrenheit' : unit+="F"; break;
	default : unit ='';
    }
    $("#FourDay3").append("<div class='temperature clearfix'><b>Temperature:</b> High "+xmlDoc.getElementsByTagName('temperature')[2].getAttribute('high')+" "+unit+", Low "+xmlDoc.getElementsByTagName('temperature')[2].getAttribute('low')+" "+unit+"</div>");
    $("#FourDay3").append("<div class='humidity clearfix'><b>Relative Humidity:</b> High "+xmlDoc.getElementsByTagName('relativeHumidity')[2].getAttribute('high')+"%, Low "+xmlDoc.getElementsByTagName('relativeHumidity')[2].getAttribute('low')+"%</div>");
    $("#FourDay3").append("<div class='wind clearfix'><b>Wind:</b> "+xmlDoc.getElementsByTagName('wind')[2].getAttribute('direction')+" "+xmlDoc.getElementsByTagName('wind')[2].getAttribute('speed')+"mph</div>");
    
    // Get Four Day - Day 4: Temperature, Humidity and Wind
    unit = "&deg;";
    switch (xmlDoc.getElementsByTagName('temperature')[3].getAttribute('unit')) {
	case 'Degrees Celsius' : unit+="C"; break;
	case 'Degrees Fahrenheit' : unit+="F"; break;
	default : unit ='';
    }
    $("#FourDay4").append("<div class='temperature clearfix'><b>Temperature:</b> High "+xmlDoc.getElementsByTagName('temperature')[3].getAttribute('high')+" "+unit+", Low "+xmlDoc.getElementsByTagName('temperature')[3].getAttribute('low')+" "+unit+"</div>");
    $("#FourDay4").append("<div class='humidity clearfix'><b>Relative Humidity:</b> High "+xmlDoc.getElementsByTagName('relativeHumidity')[3].getAttribute('high')+"%, Low "+xmlDoc.getElementsByTagName('relativeHumidity')[3].getAttribute('low')+"%</div>");
    $("#FourDay4").append("<div class='wind clearfix'><b>Wind:</b> "+xmlDoc.getElementsByTagName('wind')[3].getAttribute('direction')+" "+xmlDoc.getElementsByTagName('wind')[3].getAttribute('speed')+"mph</div>");

// Under Development    
    if(0===1) {
        loadHeavyRainWarning();
    }
}

function loadHeavyRainWarning() {
    // The Heavy Rain Warning XML dataset provides a Singapore-wide rain coverage image
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
	    loadHeavyRainWarningData(xhttp);
	} else {
	    if (xhttp.readyState == 4 && xhttp.status == 401) {
            alert('Error in retreiving the Heavy Rain Warning. ('+xhttp.status+')');
	    } else {
            if (xhttp.readyState == 4 && xhttp.status == 404) {
                alert('Heavy Rain Warning is not currently available. Please try again later. ('+xhttp.status+')');
            }
	    }
	}
  };
  var url="http://www.nea.gov.sg/api/WebAPI/?dataset=heavy_rain_warning&keyref="+apikeyref;
  xhttp.open("GET", url, true);
  xhttp.send(); 
}

function loadHeavyRainWarningData(xml) {
    var xmlDoc = xml.responseXML;
    var warning = xmlDoc.getElementsByTagName('warning')[0].childNodes[0].nodeValue;
    
    if(warning!='NIL') {
        var metadata = xmlDoc.getElementsByTagName('metadata')[0].childNodes[0].nodeValue;
        var image = new Image();
        image.src = 'data:image/png;base64,'+metadata;
        document.body.appendChild(image);
        
        metadata = xmlDoc.getElementsByTagName('metadata')[1].childNodes[0].nodeValue;
        image = new Image();
        image.src = 'data:image/png;base64,'+metadata;
        document.body.appendChild(image);
    }

    loadLatestEarthquakeActivity();
}

function loadLatestEarthquakeActivity() {
    // The Heavy Rain Warning XML dataset provides a Singapore-wide rain coverage image
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
	    loadLatestEarthquakeActivityData(xhttp);
	} else {
	    if (xhttp.readyState == 4 && xhttp.status == 401) {
		alert('Error in retreiving the Heavy Rain Warning. ('+xhttp.status+')');
	    } else {
		if (xhttp.readyState == 4 && xhttp.status == 404) {
		    alert('Heavy Rain Warning is not currently available. Please try again later. ('+xhttp.status+')');
		}
	    }
	}
  };
  var url="http://www.nea.gov.sg/api/WebAPI/?dataset=earthquake&keyref="+apikeyref;
  xhttp.open("GET", url, true);
  xhttp.send(); 
}

function loadLatestEarthquakeActivityData(xml) {
    var xmlDoc = xml.responseXML;
    var magnitude = xmlDoc.getElementsByTagName('magnitude')[0].childNodes[0].nodeValue;
//    var coordinate_of_epicenter = xmlDoc.getElementsByTagName('coordinate_of_epicenter')[0].childNodes[0].nodeValue;
    
    if(magnitude!='NIL') {
        var metadata = xmlDoc.getElementsByTagName('metadata')[0].childNodes[0].nodeValue;
        var image = new Image();
        image.src = 'data:image/png;base64,'+metadata;
        document.body.appendChild(image);
        
        metadata = xmlDoc.getElementsByTagName('metadata')[1].childNodes[0].nodeValue;
        image = new Image();
        image.src = 'data:image/png;base64,'+metadata;
        document.body.appendChild(image);
    }

}


// ******************************************************************************************************
// Generic Functions
// ******************************************************************************************************

// Using the filter element of the marker object, hide or show the relevant markers
function filterMapLayer(filter) {
    $.each(map.markers, function () {
	if (filter==this.filter) {
	    if (this.map === null) {
            this.setMap(map);
	    }
	} else {
	    this.setMap(null);
	}
    });
}

// Generic add marker to the map function
function addMarker(latlng, title, forecast, filter) {
    var icon = "img/"+forecast+".png";
    var desc = getForeCastDesc(forecast);
    var content = "<h4>"+title+"</h4>"+desc;
    var marker = new google.maps.Marker({
        position: latlng,
	map: null,
	title: title,
        icon: icon,
	content: content,
	filter: filter
      });
      map.markers.push(marker);

      var infowindow = new google.maps.InfoWindow();
      google.maps.event.addListener(marker, 'click', (function(marker) {
        return function() {
          infowindow.setContent(this.content);
          infowindow.open(map, marker);
        };
      })(marker));
}

// Get the English description of the forecast and keep count of the forecasts used for later us in the legend
function getForeCastDesc(forecast) {
    var desc = "";
    switch (forecast) {
        case "BR": desc="Mist"; BR++; break;
        case "CL": desc="Cloudy"; CL++; break;
        case "DR": desc="Drizzle"; DR++; break;
        case "FA": desc="Fair (Day)"; FA++; break;
        case "FG": desc="Fog"; FG++; break;
        case "FN": desc="Fair (Night)"; FN++; break;
        case "FW": desc="Fair & Warm"; FW++; break;
        case "HG": desc="Heavy Thundery Showers with Gusty Winds"; HG++; break;
        case "HR": desc="Heavy Rain"; HR++; break;
        case "HS": desc="Heavy Showers"; HS++; break;
        case "HT": desc="Heavy Thundery Showers"; HT++; break;
        case "HZ": desc="Hazy"; HZ++; break;
        case "LH": desc="Slightly Hazy"; LH++; break;
        case "LR": desc="Light Rain"; LR++; break;
        case "LS": desc="Light Showers"; LS++; break;
        case "OC": desc="Overcast"; OC++; break;
        case "PC": desc="Partly Cloudy (Day)"; PC++; break;
        case "PN": desc="Partly Cloudy (Night)"; PN++; break;
        case "PS": desc="Passing Showers"; PS++; break;
        case "RA": desc="Moderate Rain"; RA++; break;
        case "SH": desc="Showers"; SH++; break;
        case "SK": desc="Strong Winds, Showers"; SK++; break;
        case "SN": desc="Snow"; SN++; break;
        case "SR": desc="Strong Winds, Rain"; SR++; break;
        case "SS": desc="Snow Showers"; SS++; break;
        case "SU": desc="Sunny"; SU++; break;
        case "SW": desc="Strong Winds"; SW++; break;
        case "TL": desc="Thundery Showers"; TL++; break;
        case "WC": desc="Windy, Cloudy"; WC++; break;
        case "WD": desc="Windy"; WD++; break;
        case "WF": desc="Windy, Fair"; WF++; break;
        case "WR": desc="Windy, Rain"; WR++; break;
        case "WS": desc="Windy, Showers"; WS++; break;
        default: desc="Unknown"; icon = "img/SU.png"; SU++; 
    }
    return desc;
}
