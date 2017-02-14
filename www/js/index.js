/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        
        var isLogin = window.localStorage.getItem("LOGIN_FLAG");
        
        if (isLogin!=undefined && isLogin=="Y") {
            $.mobile.changePage("homepage.html",{transition: "slide"});
        } else {
            $.mobile.changePage("index.html",{transition: "slide"});
        }
        
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
        
        var callbackFn = function(location) {
            console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);
        
            // Do your HTTP request here to POST location to your server. 
            // jQuery.post(url, JSON.stringify(location));
            handleGeoLocation(location.latitude,location.longitude);
            /*
            IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
            and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
            IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
            */
            backgroundGeoLocation.finish();
            backgroundGeoLocation.start();
        };
        
        var failureFn = function(error) {
            console.log('BackgroundGeoLocation error');
        };
        
        
        backgroundGeoLocation.configure(callbackFn, failureFn, {
            desiredAccuracy: 10,
            stationaryRadius: 40,
            distanceFilter: 300,
            debug: false,
            stopOnTerminate: false,
            //locationService: backgroundGeoLocation.service.ANDROID_FUSED_LOCATION
        });
    }
};
var watchID = null;
var watchPos = null;
var lat="";
var lng="";
var mapView="";
var selectedEmpl="";
var map;
var watchPos = new Interval(watchPosition, GEO_TIME_FOREGROUND);
//real
//var idleTimer = new Interval(timerIncrement, 60000);
//dev
var idleTimer = new Interval(timerIncrement, 1000);

document.addEventListener("pause", function(){
        watchPos.stop();
        backgroundGeoLocation.start();
        
        var today = new Date();
        var plan_logout = new Date(LOGOUT_TIME);
        
        console.log("NOW == " + today);
        LOGIN_FLAG = window.localStorage.getItem("LOGIN_FLAG");
        if (LOGIN_FLAG=="Y") {
            window.localStorage.setItem("IDLE_START",today);
            if ((today.getTime() > plan_logout.getTime())) {
                idleTimer.start();
            }
        }
        
        
}, false);

document.addEventListener("resume", function(){
        watchPos.start();
        backgroundGeoLocation.stop();
        
        var now = new Date();
        var lastIdle = window.localStorage.getItem("IDLE_START");
        LOGIN_FLAG = window.localStorage.getItem("LOGIN_FLAG");
        
        console.log("ON RESUME === " + now);
        
        console.log("LAST IDLE === " + lastIdle);
        
        console.log("LOGIN_FLAG === " + LOGIN_FLAG);
        
        if (LOGIN_FLAG=="Y") {
            var millis = now - lastIdle;
            var minutes = millis/1000/60;
            console.log("SELISIH MIN === " + minutes);
            if (minutes > IDLE_TIMEOUT) {
                console.log("SHOULD LOGOUT");
                logout("BY_SYSTEM");
            } else {
                console.log("NOT YET");
                IDLE_TIME = 0;
                idleTimer.start();
            }
        }
}, false);

$(document).ready(function () {
    
    $(this).mousemove(function (e) {
        IDLE_TIME = 0;
    });
    $(this).mousedown(function (e) {
        IDLE_TIME = 0;
    });
    $(this).scroll(function (e) {
        IDLE_TIME = 0;
    });
    $(this).touchstart(function (e) {
        IDLE_TIME = 0;
    });
    $(this).click(function (e) {
        IDLE_TIME = 0;
    });
    $(this).keypress(function (e) {
        IDLE_TIME = 0;
    });
    
    
    $(document).on('pageshow',function(){
        if (LOGIN_FLAG == "") {
            LOGIN_FLAG = window.localStorage.getItem("LOGIN_FLAG");
        }
        if (LOGIN_FLAG=="Y") {
            if (LOGOUT_TIME == "") {
                LOGOUT_TIME = window.localStorage.getItem("PLAN_LOGOUT_TIME");
            }
            console.log("PLAN LOG OUT ==== " + LOGOUT_TIME);
            checklogoutTime();   
        }
    });
    
    $( "#sideMenu" ).enhanceWithin().panel();
    
    $("#loginForm input").keyup(function (e) {
        if (e.keyCode == 13) {
            $("#login").trigger("click");
            return false;
        }
    });
    
    var model = getDeviceType();
    
    if (model =="iOS") {
        $(".iosHeader").css("display","block");
    }
    $(document).on("click", "#login", function(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        var name = $("#userName").val();
        var pwd = $("#password").val();
        if (name == "") {
            showAlert(LOGIN_NAME_EMPTY);
            return false;
        } else if (pwd == "") {
            showAlert(LOGIN_PASSWORD_EMPTY);
            return false;
        } else {
            var data={
                name:name,
                password:pwd,
                from:"BO",
                mobile_code:HASH
            }
            USER_NAME=name;
            USER_PASSWORD=pwd;
            callAjax("POST",LOGIN_URL,data,loginSuccess,"Y","Y");
        }
    });
    
    $(document).on("click", ".menuIcon", function(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        $("#userNameDisp").html(auth.getUserName);
        $("#sideMenu").panel( "open" );
    });
    
    $(document).on("click", ".sideBarMenus", function(event) {
        var parent = $(this).attr('id');
        console.log(parent);
        if (parent == "toDoListSB") {
            $.mobile.changePage("homepage.html",{transition: "slide"});
        } else if (parent == "profileSB") {
            $.mobile.changePage("profile.html",{transition: "slide"});
        } else if (parent == "aboutSB") {
            $.mobile.changePage("about.html",{transition: "slide"});
        } else if (parent == "locationSB") {
            mapView="global";
            $.mobile.changePage("location.html",{transition: "slide"});
        } else if (parent == "closeSB") {
            $("#sideMenu").panel("close");
        } else if (parent == "logoutSB") {
            logout("USER");
        }
    });
    
    $(document).on("pageinit", "#homePage", function(event) {
        $(document).on("click", ".emplyDetails", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            $.mobile.changePage("employeeDetail.html",{transition: "slide"});
        });
        
        $(document).on("click", ".seeMap", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            mapView="singel";
            selectedEmpl = $(this).attr("dataId");
            
            $.mobile.changePage("location.html",{transition: "slide"});
        });
        
        $(document).on("change", "#branchOption", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            var branch = $(this).val();
            if (branch!="") {
                var data = {
                    name:USER_NAME,
                    password:USER_PASSWORD,
                    branch:branch,
                    mobile_code:HASH
                }
                callAjax("POST",GETMEMBER_URL,data,getMember,"Y","Y");
            }
        });
        
        $(document).on("keyup", "#searchEmpl", function(event) {
            var key = $(this).val();
            var branch = $("#branchOption option:selected").val();
            if (branch!="") {
                $("#employeeListing > li").each(function() {
                    if ($(this).text().toLowerCase().search(key.toLowerCase()) > -1) {
                        $(this).show();
                    }
                    else {
                        $(this).hide();
                    }
                });
            }
        });
    });
    $(document).on("pageshow", "#homePage", function(event) {
        if (USER_NAME == null || USER_NAME == "") {
            USER_NAME = window.localStorage.getItem("USER_NAME");
        }
        if (USER_PASSWORD == null || USER_PASSWORD == "") {
            USER_PASSWORD = window.localStorage.getItem("USER_PASSWORD");
        }
        if (USER_BRANCH == null || USER_BRANCH == "") {
            USER_BRANCH = window.localStorage.getItem("USER_BRANCH");
        }
        generate.select(USER_BRANCH,"branchOption");
    });
    
    $(document).on("pageshow", "#profilePage", function(event) {
        var name = "<strong>"+auth.getUserName()+"</strong>";
        $("#userNameDispProf").html(name); 
    });
    
    $(document).on("pageinit", "#employeePage", function(event) {
        $(document).on("click", ".backBtn", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            $.mobile.back();
        });
    });
    
    $(document).on("pageinit", "#locationPage", function(event) {
        if (mapView=="global") {
            $(".menuIcon").show();
            $(".backBtn").hide();
        } else {
            $(".menuIcon").hide();
            $(".backBtn").show();
        }
        $(document).on("click", ".backBtn", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            $.mobile.changePage("homepage.html",{transition: "slide", reverse:true});
        });
        
        
        $(document).on("click", ".legendBtn", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            $("#legendModal").modal('show');
        });
        
        $(document).on("change", "#branchOptionLocation", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            var branch = $(this).val();
            if (branch!="") {
                var data = {
                    name:USER_NAME,
                    password:USER_PASSWORD,
                    branch:branch,
                    mobile_code:HASH
                }
                callAjax("POST",GETMEMBER_URL,data,generateuserMap,"Y","N");
            }
        });
        
        $(document).on("click", ".employeeMarker", function(event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            var latitude = $(this).attr("data-lat");
            var longitude = $(this).attr("data-lng");
            var latLng = new google.maps.LatLng(latitude, longitude);
            map.setCenter(latLng);
        });
    });
    
    $(document).on("pageshow", "#locationPage", function(event) {
        if (mapView=="global") {
            generate.select(USER_BRANCH,"branchOptionLocation");
            $("#branchLocation").show();
            $(".menuIcon").show();
            $(".backBtn").hide();
        } else {
            $("#dateDiv").show();
            $(".menuIcon").hide();
            $(".backBtn").show();
            //2016-05-17
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
        
            var yyyy = today.getFullYear();
            if(dd<10){
                dd='0'+dd
            } 
            if(mm<10){
                mm='0'+mm
            } 
            var today = yyyy+'-'+mm+'-'+dd;
            console.log(today);
            
            $("#trackDate").val(today);
            
            var data = {
                name: selectedEmpl,
                date: today,
                mobile_code: HASH
            }
            callAjax("POST",GET_TRACK_URL,data,singelMap,"Y","N");
        }
        
        $(document).on("change", "#trackDate", function(event) {
            var today = $(this).val();
            console.log(today);
            var data = {
                name: selectedEmpl,
                date: today,
                mobile_code: HASH
            }
            callAjax("POST",GET_TRACK_URL,data,singelMap,"Y","N");
        });
    }); 
});

function generateuserMap(res) {
    var listUser = {};
    var users = [];
    for(var i=0;i<res.count;i++) {
        var user = {};
        user.name = res.member[i].CN;
        users.push(user);
    }
    listUser.list_name = users;
    var paramUser = JSON.stringify(listUser);
    var data= {
        name: paramUser,
        mobile_code: HASH
    }
    
    setTimeout(function(){
        callAjax("POST",GET_LOCATION,data,realtimeMap,"N","Y");    
    },500);
}

function realtimeMap(res){
    var bounds = new google.maps.LatLngBounds();
    var mapOptions = {
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    // Display a map on the page
    map = new google.maps.Map(document.getElementById("employeeMap"),mapOptions);
    
    
    // Multiple Markers
    var markers = [];
    var userList ="";
    // Info Window Content
    var infoWindowContent = [];
    
    for(var i=0;i<res.list_name.length;i++) {
        var singelMarker=[];
        var singelInfoWindow=[];
        singelMarker.push(res.list_name[i].name,res.list_name[i].latitude,res.list_name[i].longitude);
        markers.push(singelMarker);
        
        userList += '<li class="employeeMarker" data-lat="'+res.list_name[i].latitude+'" data-lng="'+res.list_name[i].longitude+'">'+res.list_name[i].name+'</li>';
        singelInfoWindow.push('<div class="info_content"><h3>'+res.list_name[i].name+'</h3><p>'+res.list_name[i].address+'</p></div>');
        infoWindowContent.push(singelInfoWindow);
    }
    
    // Display multiple markers on a map
    var infoWindow = new google.maps.InfoWindow(), marker, i;
    
    // Loop through our array of markers & place each one on the map  
    for( i = 0; i < markers.length; i++ ) {
        var position = new google.maps.LatLng(markers[i][1], markers[i][2]);
        bounds.extend(position);
        marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: 'img/finalMarker.png',
            title: markers[i][0]
        });
        
        // Allow each marker to have an info window    
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infoWindow.setContent(infoWindowContent[i][0]);
                infoWindow.open(map, marker);
            }
        })(marker, i));

        // Automatically center the map fitting all markers on the screen
        map.fitBounds(bounds);
    }

    // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
    var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
        //this.setZoom(13);
        google.maps.event.removeListener(boundsListener);
    });
    
    google.maps.event.addListener(map, "click", function(event) {
        for (var i = 0; i < infoWindowContent.length; i++ ) {  //I assume you have your infoboxes in some array
             infoWindow.close();
        }
    });
    
    $("#employeeMap").css("display","block");
    $("#employeeListing").html(userList);
    $("#employeeList").show();
    
    google.maps.event.trigger(map, 'resize');
    map.fitBounds(bounds);
}

function singelMap(res) {
    if (res.coords.length==0) {
        loading.hide();
        showAlert(GET_TRACK_NULL);
    } else {
        var mapOptions = {
            zoom: 3,
            center: {lat: 0, lng: -180},
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("employeeMap"),mapOptions);
        var bounds = new google.maps.LatLngBounds();
        
        var dHeight=$(document).height()-50;
        $("#employeeMap").css("height",dHeight+"px");
        var pathCoord = [];
        var modLength = 0;
        if (res.coords.length>8) {
            modLength = Math.ceil(res.coords.length / 8);
        }
        var minWay = 0;
        var maxWay = 8;
        
        console.log(modLength);
        
        if (modLength>0) {
            for(var i=0;i<modLength;i++){
                wayPointGenerate(map, bounds, res,minWay,maxWay);
                minWay = minWay+8;
                maxWay = maxWay+8;
            }   
        } else {
            wayPointGenerate(map, bounds, res,minWay,maxWay);
        }
        
        $("#employeeMap").css("display","block");
        loading.hide();
          
        google.maps.event.trigger(map, 'resize');
        map.fitBounds(bounds);
        $(".legend").show();   
    }
}

var stepDisplay;
var markerArray = [];
var infowindow = null;
var marker = null;

function wayPointGenerate(map, bounds, res,minWay,maxWay) {
    var pathCoord = [];
    // Multiple Markers
    var markers = [];
    // Info Window Content
    var infoWindowContent = [];
    var waypts=[];
    
    if (maxWay>res.coords.length) {
        maxWay=res.coords.length;
    }
    
    for (var i=minWay;i<maxWay;i++){
        var latlngobj = {};
        latlngobj.lat = res.coords[i].latitude;
        latlngobj.lng = res.coords[i].longitude;
        pathCoord.push(latlngobj);
        
        var iconMarker = "img/finalMarker_small.png";
        if (res.coords[i].check_in==1) {
            iconMarker = "img/finalMarkerCheckin.png";
        } else if (i==0 && minWay==0) {
            iconMarker = "img/finalMarker.png";
        } else if (i==res.coords.length-1 && maxWay==res.coords.length) {
            iconMarker = "img/finalMarkerEnd.png";
        }
        
        console.log("INDEX + " + i + " MARKER LENG " +markers.length+ "  MAX WAY + " + maxWay + " legnth " + res.coords.length);
        
        var singelMarker=[];
        var singelInfoWindow=[];
        singelMarker.push("title",res.coords[i].latitude,res.coords[i].longitude,iconMarker);
        markers.push(singelMarker);
        var time = res.coords[i].datetime.date.split(".")[0];
        singelInfoWindow.push('<div class="info_content"><h4>'+selectedEmpl+'</h4><p><b>'+res.coords[i].address+'</b><br/>'+time+'</p></div>');
        infoWindowContent.push(singelInfoWindow);
    }
    
    var service = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers : true});
    
    // Instantiate an info window to hold step text.
    stepDisplay = new google.maps.InfoWindow();

    directionsDisplay.setMap(map);

    for(j=1;j<pathCoord.length-1;j++){            
          waypts.push({location: pathCoord[j],stopover: true});
    }
    
    console.log(pathCoord[0]);
    var request = {
        origin: pathCoord[0],
        destination: pathCoord[pathCoord.length-1],
        waypoints: waypts,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
      
    // Display multiple markers on a map
    var infoWindow = new google.maps.InfoWindow(), marker, i;
    
    //setTimeout(function(){
        service.route(request,function(result, status) {           
            if(status == google.maps.DirectionsStatus.OK) {
                //var warnings = document.getElementById("warnings_panel");
                //warnings.innerHTML = "<b>" + result.routes[0].warnings + "</b>";
    
                directionsDisplay.setDirections(result);
                //var leg = result.routes[ 0 ].legs[ 0 ];
                
                //showSteps(result,map);
            } else {
                console.log("Directions request failed:" +status);
            }
        });    
    //},500);
    
    // Display multiple markers on a map
    var infoWindow = new google.maps.InfoWindow(), marker, i;
    
    // Loop through our array of markers & place each one on the map
    console.log("JUNLAH MARKER " + markers);
    for( i = 0; i < markers.length; i++ ) {
        //console.log(JSON.stringify(res.coords[i]) + " " + i);
        //var iconMarker = "img/finalMarker.png";
        //if (res.coords[i].check_in==1) {
        //    iconMarker = "img/finalMarkerCheckin.png";
        //} else if (i==0 && minWay==0) {
        //    iconMarker = "img/finalMarkerEnd.png";
        //} else if (i==markers.length-1 && maxWay==res.coords.length) {
        //    iconMarker = "img/finalMarkerEnd.png";
        //} 
        
        var position = new google.maps.LatLng(markers[i][1], markers[i][2]);
        bounds.extend(position);
        marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: markers[i][3],
            title: markers[i][0]
        });
        
        // Allow each marker to have an info window    
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infoWindow.setContent(infoWindowContent[i][0]);
                infoWindow.open(map, marker);
            }
        })(marker, i));
        
        google.maps.event.addListener(map, "click", function(event) {
            for (var i = 0; i < infoWindowContent.length; i++ ) {  //I assume you have your infoboxes in some array
                 infoWindow.close();
            }
        });

        // Automatically center the map fitting all markers on the screen
        map.fitBounds(bounds);
    }

    // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
    var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
        //this.setZoom(13);
        google.maps.event.removeListener(boundsListener);
    });
}

/**
 * Determine the mobile operating system.
 * This function either returns 'iOS', 'Android' or 'unknown'
 *
 * @returns {String}
 */
function getDeviceType() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
    if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) )
    {
      return 'iOS';
  
    }
    else if( userAgent.match( /Android/i ) )
    {
  
      return 'Android';
    }
    else
    {
      return 'unknown';
    }
};

function showAlert(content) {
    var restHtml= '     <div class="modal-dialog modal-sm alertBody">'+
                   '       <div class="modal-content">'+
                   '         <div class="modal-header">'+
                   '           <h4 class="modal-title">Mitsui Leasing</h4>'+
                   '         </div>'+
                   '         <div class="modal-body">'+
                   '           <p>'+content+'</p>'+
                   '         </div>'+
                   '         <div class="modal-footer">'+
                   '           <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
                   '         </div>'+
                   '       </div>'+        
                   '     </div>';
    $("#mainModal").html(restHtml);
    $("#mainModal").modal('show');
}

function showAlertCallback(content,callback) {
    var restHtml= '     <div class="modal-dialog modal-sm">'+
                   '       <div class="modal-content">'+
                   '         <div class="modal-header">'+
                   '           <h4 class="modal-title">Mitsui Leasing</h4>'+
                   '         </div>'+
                   '         <div class="modal-body">'+
                   '           <p>'+content+'</p>'+
                   '         </div>'+
                   '         <div class="modal-footer">'+
                   '           <div type="button" class="btn btn-default" onclick="'+callback()+'" data-dismiss="modal">Close</div>'+
                   '         </div>'+
                   '       </div>'+        
                   '     </div>';
    $("#mainModal").html(restHtml);
    $("#mainModal").modal('show');
}

function logout(logger) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd
    } 
    if(mm<10){
        mm='0'+mm
    } 
    var todayDate = yyyy+'-'+mm+'-'+dd;
    
    var data ={
        mobile_code: HASH,
        name: USER_NAME,
        password: USER_PASSWORD,
        logout_by : logger,
        actual_logout_time: todayDate
    }
    callAjax("POST",LOGOUT_URL,data,logoutSucess);
}

// onSuccess Callback
// This method accepts a Position object, which contains the
// current GPS coordinates
//

function onSuccess(position) {
    lat=position.coords.latitude;
    lng=position.coords.longitude;
    console.log(lat+" - "+lng);
    /*alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');*/
};

// onError Callback receives a PositionError object
//
function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function callAjax(method,url,data,callback,before,after) {
    $.ajax({
        type: method,
        url: url,
        data: data,
        crossDomain: true,
        timeout: AJAX_TIMEOUT_INT,
        beforeSend: function( xhr ) {
            if (before=="Y") {
                loading.show();   
            }
        },
        success: function (response) {
            if (response==null) {
                loading.hide();
                showAlertCallback(AJAX_ERROR,returnPage);
                return;
            }
            //if (PROFILE=="DEV") {
            //    response = $.parseJSON(response);   
            //}
            console.log(response);
            if(response.status == 1) {
                callback(response);
            } else {
                loading.hide();
                showAlert(response.msg);
            }
            if (after=="Y") {
                loading.hide();
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            if(ajaxOptions === "timeout") {
                loading.hide();
                showAlert(AJAX_TIMEOUT);
            } else {
                loading.hide();
                showAlert(ajaxOptions);
            }
        }
    });
}

function loginSuccess(res) {
    if (res.status==1) {
        watchPos.start();
        
        USER_BRANCH=res.branch;
        if (res.plan_logout_time != undefined) {
            LOGOUT_TIME = res.plan_logout_time;
            LOGIN_FLAG="Y";
            window.localStorage.setItem("LOGIN_FLAG", LOGIN_FLAG);
            window.localStorage.setItem("USER_NAME", USER_NAME);
            window.localStorage.setItem("USER_PASSWORD", USER_PASSWORD);
            window.localStorage.setItem("USER_BRANCH", USER_BRANCH);
            window.localStorage.setItem("PLAN_LOGOUT_TIME", LOGOUT_TIME);
        }
        
        $.mobile.changePage("homepage.html",{transition: "flip"});
    }
}


function logoutSucess(args) {
    
    idleTimer.stop();
    LOGIN_FLAG="N";
    window.localStorage.setItem("LOGIN_FLAG",LOGIN_FLAG);
    window.localStorage.removeItem("PLAN_LOGOUT_TIME");
    window.localStorage.removeItem("USER_BRANCH");
    
    $.mobile.changePage("index.html",{transition: "flip"});
}

function getMember(res) {
    console.log(JSON.stringify(res));
    var restHtml = "";
    for(var i=0;i<res.member.length;i++){
        restHtml+='<li class="employeeList">'+
                    '<div class="emplyProfilePic"><img src="img/icon-user-default.png"/></div>'+
                    '<div class="emplyDetails">'+
                    '<div class="emplyName">'+res.member[i].CN+'</div>'+
                    '<div class="currentTask">'+res.member[i].address+
                    '<br/>Telp: <a href="tel:'+res.member[i].phone_no+'">'+res.member[i].phone_no+'</a>'+
                    '</div>'+
                    '</div>'+
                    '<div class="seeMap" dataId="'+res.member[i].CN+'"><i class="fa fa-map-marker fa-2x"></i></div>'+
                    '<div class="clearfix clearBoth"></div>'+
                    '</li>';
    }
    $("#employeeListing").html(restHtml);
    $.mobile.loading('hide');
}

function Interval(fn, time) {
    var timer = false;
    this.start = function () {
        if (!this.isRunning())
            timer = setInterval(fn, time);
    };
    this.stop = function () {
        clearInterval(timer);
        timer = false;
    };
    this.isRunning = function () {
        return timer !== false;
    };
}

var generate = {
    select: function(res,fieldName) {
        var defv="-";
        var restHtml ='<select id="'+fieldName+'" name="'+fieldName+'">'+
                        '<option value="">Please select</option>';
        //for (var key in res) {
        console.log("type === " + typeof(res));
        console.log("res === " + res);
        if (typeof(res) == "string") {
            res = res.split(",");
        }
        for(var i=0;i<res.length;i++){
            if (res[i]==defv) {
                restHtml +="<option value='"+res[i]+"' selected>"+res[i]+"</option>";    
            } else {
                restHtml +="<option value='"+res[i]+"'>"+res[i]+"</option>";
            }
            
        }
        restHtml +="</select>";
        $("#"+fieldName+"_div .compRender").html(restHtml);
        $("#"+fieldName+"_div .compRender").selectmenu();
    }
}

var loading = {
    show: function() {
        $("#loadingModal").modal();
    },
    hide: function() {
        $("#loadingModal").modal('hide');
    }
}

function returnPage() {
    $.mobile.back();
}

function watchPosition(){
    //navigator.geolocation.getCurrentPosition(function(position){});
    console.log("GETTING LOCATION");
    var options = { enableHighAccuracy: true, timeout: 10000};
    navigator.geolocation.getCurrentPosition(function(position){
        console.log("GETTING LOCATION INSIDE");
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        var address="";
        console.log(lat+" "+lng);
        
        handleGeoLocation(lat,lng);
        
        //window.localStorage.setItem("JOB_STATUS","Y");
        //$("#start").addClass("stop").html("STOP");
        //$(".checkIn").fadeIn();
        //callTimer
        watchPos.start();
        
        //check all comment
        //todolist.jobCheck();
        //todolist.commentCheck();
        //loading.hide();
    }, geoError,options);
}

function geoError(error) {
    console.log("LOCATION ERROR ==== " + error.code);
    if(error.code==1){
        loading.hide();
        showAlert(POSITION_ERROR);
    } else if (error.code ==3) {
        loading.hide();
        showAlert(POSITION_OFF);
    }
}

function handleGeoLocation(lat,lng) {
    var latlng=lat+','+lng;
    
    var reverseGeocoder = new google.maps.Geocoder();
    var currentPosition = new google.maps.LatLng(lat, lng);
    reverseGeocoder.geocode({'latLng': currentPosition}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                address = results[0].formatted_address;
                
                console.log(address);
    
                geoLocationJSON.push(latlng);
                var obj = new Object();
                var arrayCoord = new Object();
                var arr = [];

                //check previouse array
                var prevArr = window.localStorage.getItem("PREV_COORD");

                if (prevArr!=null && prevArr!= undefined && prevArr.size>0) {
                    console.log(prevArr);
                    arr.push(prevArr);
                }

                arrayCoord.lat = lat;
                arrayCoord.lng = lng;
                arrayCoord.recordTime = moment().format('YYYY-MM-DD HH:mm:ss');
                arrayCoord.address = address;
                arr.push(arrayCoord);

                //alert(JSON.stringify(arr));

                obj.coord = arr;
                obj = JSON.stringify(obj);

                //alert(obj);
                //test
                
                var data={
                    name:auth.getUserName,
                    password:auth.getUserPassword,
                    coord: obj,
                    mobile_code:HASH
                }
                callAjaxWithCallback("POST",TRACK,data,trackSuccess,retryTracking);
            } else {
                console.log('Unable to detect your address.');
            }
        } else {
            console.log('Unable to detect your address.');
        }
    });
}

function checklogoutTime() {
    var today = new Date();
    //var plan_logout = new Date(LOGOUT_TIME);
    
    var t = LOGOUT_TIME.split(/[- :]/);

    // Apply each element to the Date function
    var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
    var plan_logout = new Date(d);
    
    console.log("TODAY === " + today.getTime());
    console.log("PLAN LOGOUTIME == " + plan_logout);
    console.log("PLAN LOGOUT === " + plan_logout.getTime());
    if (LOGIN_FLAG == "") {
        LOGIN_FLAG = window.localStorage.getItem("LOGIN_FLAG");
    }
    console.log(LOGIN_FLAG);
    if (LOGIN_FLAG!="" && LOGIN_FLAG=="Y") {
        if(today.getTime() > plan_logout.getTime()){
            console.log("TRUE");
            
            idleTimer.start();
        } else {
            console.log("STILL NOT LOGOUT TIME");
        }
    }
}

function timerIncrement() {
    IDLE_TIME++;
    console.log("IDLE TIME " + IDLE_TIME);
    if (IDLE_TIME > IDLE_TIMEOUT) {
        idleTimer.stop();
        logout("BY_SYSTEM");
    }
}

var auth = {
    getUserName : function(){
        if(USER_NAME==null || USER_NAME==""){
            USER_NAME = window.localStorage.getItem("USER_NAME");
        }
        return USER_NAME;
    },
    getUserPassword : function(){
        if(USER_PASSWORD==null || USER_PASSWORD==""){
            USER_PASSWORD = window.localStorage.getItem("USER_PASSWORD");
        }
        return USER_PASSWORD;
    }
}