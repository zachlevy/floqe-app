angular.module('starter.controllers', ['ionic','ngCordova','ui.bootstrap'])

.controller('DashCtrl', function($scope, Events) {
	$scope.event_count = Events.count();
})

.controller('RMenuCtrl', function($scope, $rootScope,$location,Events, Friends) {
	Events.event_types().then(function(resp){
		var event_types = []
		var foo = resp.data[0]
		for (x in foo) {
			event_types.push(foo[x][0])
		}
		event_types.unshift("All")
		$scope.event_types = event_types
		$rootScope.event_types = event_types
	});

	$rootScope.event_type = {type:'All'}
	
	$rootScope.mapMode = {state:false}
	$scope.modeIcon = 'ion-more' 
	
	$rootScope.groups = []
	$scope.$watch( function(){
		return $rootScope.groups;
	}, function() {
		$scope.groups= $rootScope.groups
	})

	$rootScope.group_type = {type:'All'}
	
	$scope.pages = {map:false,friends:false}
	$scope.checkPath =  function(){
		if ( $location.path()=="/tab/map" && $rootScope.mapMode.state == false) {
			for (x in $scope.pages) {
				$scope.pages[x] = false
			}
			$scope.pages.map = true
			
		}
		else if ( $location.path()=="/tab/friends" ) {
			for (x in $scope.pages) {
				$scope.pages[x] = false
			}
			$scope.pages.friends = true
		}
		else {
			for (x in $scope.pages) {
				$scope.pages[x] = false
			}
		}
	}

	$scope.changeMode = function() {
		
		$rootScope.mapMode.state = !$rootScope.mapMode.state
		if ( $rootScope.mapMode.state == true ) {  //map is on, button for list is visible
			$scope.modeIcon ='ion-more' 
		}
		else {
			$scope.modeIcon ='ion-map' 
		}
	}
	
	$scope.listMode = function(){
		$rootScope.mapMode.state = false
	}
	
	$scope.selectEType = function(value) {
		$rootScope.event_type = {type:value}
	}
	$scope.selectGType = function(value) {
		$rootScope.group_type = {type:value}
	}
	
	$scope.$on('MapEvent', function(){
		$scope.changeMode()
		//$rootScope.mapMode = {state:true}
	})

})

.controller('UpdatesCtrl', function($scope,$state,$stateParams,$window,$rootScope, Events) {
	
	$scope.events = []
	$rootScope.user = 1
	
	$('ion-scroll').height($(document).height()-$('.item-input').height()-66) //minor visual adjustment
	
	Events.updates($rootScope.user).then(function(resp){
		var events =  $.map(resp.data.events, function(value, index){return [value]})
		$rootScope.tags =  $.map(resp.data.tags, function(value, index){return [value]})
		
		for (var i = 0; i < events.length; i++) {
			events[i].link = '#/tab/events/' + events[i].id
			events[i].tags = []

			for (x in $rootScope.tags) {
				if (events[i].id == $rootScope.tags[x].event_id) {
					events[i].tags.push($rootScope.tags[x])
				}
			}
		}
		$scope.events = events
	})
	
	$scope.hrefDiv = function(event){
		$state.go('tab.event-details',{'eventId':event.id})
	}

})

.controller('MapCtrl', function($scope,$stateParams,$timeout,$http, $rootScope, $state,$log,uiGmapGoogleMapApi, $ionicPlatform, $cordovaPush, 
								Events, Geo) {
								
	$('ion-scroll').height($(document).height()-$('#search').height()-66) //minor visual adjustment
	$scope.zoom = 16 
	
	$scope.loading = true
	$rootScope.attendance = {}
	$rootScope.eventMarkers = []
	$scope.eventMarkers =[]
	$scope.activeMarker = undefined;
	$rootScope.createEvents = ''  //resets create events so it loads right data
	
	$scope.upvote = function(){
		console.log('up')
	}
	$scope.downvote = function(){
		console.log('down')
	}
	
	//search and change view
	$scope.searchStr = ''
	$scope.search = function(string) {
		if (string.length>2) {
			$scope.loading = true
			Events.search(string).then(function(resp){
				var objects = resp.data
				$rootScope.dbEvents = objects
				for (x in objects) {
					if (typeof objects[x].price != 'undefined') {
								objects[x].price_scale = priceScale(objects[x])
					}
				}
				$scope.events = iconTypes(objects)
				$scope.loading = false
			})
		}
		else if (string.length == 0) {
			$scope.loading = true
			geo_update()
		}
	}
	
	$scope.$watch( function(){    //global changes in map mode state
		return $rootScope.mapMode.state;
	}, function() {
		$scope.mapMode = $rootScope.mapMode.state
	})
	
	$scope.modeBtn = 'Map'
	$scope.changeView = function(){
		if ($scope.mapMode == false) {
			$scope.$emit('MapEvent');
			populateMarkers()
		}
	}

	//geolocation
	$scope.geolocation = []
	Geo.cur_location().then(function(pos) {
		$scope.geolocation = [pos.coords.longitude, pos.coords.latitude]
	})

	$scope.rdsBut = {"3":{id:3,style:""},"2":{id:2,style:""},"1":{id:1,style:"button-dark"}}
	$scope.radius = 0.3
	$scope.chngRds = function(rds) {
		if (rds==3){
			$scope.rdsBut = {"3":{id:3,style:"button-dark"},"2":{id:2,style:""},"1":{id:1,style:""}}
			$scope.radius = 3
			$scope.zoom = 14
			populateMarkers()
		}
		else if (rds ==2){
			$scope.rdsBut ={"3":{id:3,style:""},"2":{id:2,style:"button-dark"},"1":{id:1,style:""}}
			$scope.radius = 1
			$scope.zoom = 15
			populateMarkers()
		}
		else if (rds ==1){
			$scope.rdsBut ={"3":{id:3,style:""},"2":{id:2,style:""},"1":{id:1,style:"button-dark"}}
			$scope.radius = 0.3
			$scope.zoom = 16
			populateMarkers()
		}
		geo_update() // run the geo update function
	}
	
	$scope.invites = Events.invites().then(function(resp){   //loads attendance globaly
		var myID = 1
		var invites = $.map(resp.data, function(value, index){return [value]})

		var unique_ids ={}
		for (x in invites) {
			if (invites[x].location_id!= 0) {
				var temp_id = String(invites[x].location_id)+"V"  //separate venues and events
				if (typeof unique_ids[temp_id] =='undefined' ) {
					if (invites[x].status == 1) {
						unique_ids[temp_id] = []
						unique_ids[temp_id].push(invites[x].user_id)
					}
				}
				else {
					if (unique_ids[temp_id].indexOf(invites[x].user_id) == -1 && invites[x].status == 1) {
						unique_ids[temp_id].push(invites[x].user_id)
					}
				}
			}
			else {
				var temp_id = String(invites[x].event_id)+"E"
				if (typeof unique_ids[temp_id] =='undefined') {
					if (invites[x].status == 1) {
						unique_ids[temp_id] = []
						unique_ids[temp_id].push(invites[x].user_id)
					}
				}
				else {
					if (unique_ids[temp_id].indexOf(invites[x].user_id) == -1 && invites[x].status == 1) {
						unique_ids[temp_id].push(invites[x].user_id)
					}
				}
			}
		}
		$rootScope.attendance = unique_ids
		return  unique_ids
	})
	
	$scope.selectItem = function(event){  //selects right entity and url to load
		if ( event.class == "Venue") {
			$rootScope.venue = event
			$state.go('tab.venue-details',{'venueId':event.id})
		}
		else {
			$rootScope.event = event
			$state.go('tab.event-details',{'eventId':event.id})
		}
	}

	//$scope.event_types = Events.event_types();
	$scope.event_types = $rootScope.event_types
	$scope.event_type = $rootScope.event_type
	
	var objectID = function(object){
		if (object.class=="Venue") { return String(object.id) + "V"	}
		else { return String(object.id) + "E"}
	}
	
	var geo_update = function(){
		Geo.cur_location().then(function(resp1) {   //loads GPS location
			Events.venues_list(resp1,$scope.radius).then(function(resp){   //Loads items based on GPS
				var attendance = $scope.attendance
				var objects = resp.data
				$rootScope.dbEvents = objects //allows access to all the items throughout
				
				for (x in objects) {
					if ( typeof attendance[objectID(objects[x])] !='undefined' )
						if (attendance[objectID(objects[x])].length > 0) {
							objects[x].attend = attendance[objectID(objects[x])]
						}
						else {
							objects[x].attend = []
						}
					else {
						objects[x].attend = []
					}
					if (typeof objects[x].price != 'undefined') {
						objects[x].price_scale = priceScale(objects[x])
					}
				}
				var data = iconTypes(objects)  //update icon styles
				
				$scope.loading = false
				$scope.events = objects
			})
		})
	}
	
	var priceScale = function(item) {
		if (typeof item.price != 'undefined') {
			item.price_scale = {1:"stable",2:"stable",3:'stable',4:'stable'}
			var money_colour = 'positive'
			if (item.price == 1) {
				return  {1:money_colour,2:"stable",3:'stable',4:'stable'}
			}
			else if (item.price == 2) {
				return  {1:money_colour,2:money_colour,3:'stable',4:'stable'}
			}
			else if (item.price == 3) {
				return {1:money_colour,2:money_colour,3:money_colour,4:'stable'}
			}
			else if (item.price == 4) {
				return {1:money_colour,2:money_colour,3:money_colour,4:money_colour}
			}
		}
	}
	
	$scope.$watch( function(){
		return $rootScope.event_type;
	}, function() {
		$scope.event_type = $rootScope.event_type
	})

	$('.angular-google-map-container').height($('.scroll-content').height()-40);   //minor visual adjustment
	
	var map_style = [{"featureType":"landscape.natural", "stylers":[{"saturation":-100},{"lightness":100}]},
					{"featureType":"water","stylers":[{"saturation":-100},{"lightness":-86}]},
					{"elementType":"labels.text.stroke","stylers":[{"saturation":-100},{"lightness":100}]},
					{"featureType":"road","elementType":"geometry.stroke","stylers":[{"saturation":-100},{"lightness":-75}]},
					{"featureType":"road","elementType":"geometry.fill","stylers":[{"saturation":-100},{"lightness":97}]},
					{"featureType":"poi.park","stylers":[{"saturation":-100},{"lightness":-100}]},
					{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"saturation":-100},{"lightness":100}]},
					{"featureType":"road","elementType":"labels","stylers":[{"visibility":"on"}]},
					{"featureType":"landscape.man_made","stylers":[{"saturation":-100},{"lightness":-55}]},
					{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"saturation":-100},{"lightness":100}]},
					{"featureType":"administrative","elementType":"labels.text.stroke","stylers":[{"saturation":-100},{"lightness":-100}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":91}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"saturation":-100},{"lightness":-100}]},{"featureType":"transit.station","stylers":[{"saturation":-100},{"lightness":-22}]},{"featureType":"landscape.man_made","elementType":"geometry.stroke","stylers":[{"hue":"#ff004c"},{"saturation":-100},{"lightness":44}]},{"elementType":"labels.text.fill","stylers":[{"saturation":1},{"lightness":-100}]},{"elementType":"labels.text.stroke","stylers":[{"saturation":-100},{"lightness":100}]},{"featureType":"administrative.locality","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative.locality","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"}]}]
	
	$scope.options = {styles: map_style, minZoom: 10, maxZoom: 20};
	
	// Markers
	var createMarker = function (idVal, event) { 
		var image = 'img/logo-blue-marker.png';
		var content =[]
		idKey = "id";
		var  venue = []
		
		var music = ""
		var dress = ""
		var price = ""
		
		
		if (event.music.length > 0) {
			music = "<b>Music: </b>"+ event.music + "<br>" //+ "</p>"
		}
		if (event.price > 0) {
			var dSigns = ""
			for (i = 0; i < event.price; i++) {
				dSigns += "$"
			}
			price = "<b>Price: </b>"+ dSigns + "<br>" //"</p>"
		}
		
		content =  "<h5>" + event.name + "</h5>"+
			"<p>"+ event.address + "</p>" +
			music + price + "<p> <b> Type: </b>" + event.style + " "+event.type + "</p>" +
			"<a class='button button-small button-outline button-balanced marker-button' href='#/tab/venues/"+event.id+ "' > View </a><br>"
		console.log(content)
	
		var ret = {
			title: event.name,
			latitude: event.latitude,
			longitude: event.longitude,
			icon: image,
			content: content,
			show: false
		};
		
		ret.onClick = function() {
			ret.show = !ret.show;
			$scope.activeMarker = ret;
		};
		ret[idKey] = idVal;
		return ret;
	};
	
	var populateMarkers = function(){
		if ($rootScope.mapMode.state == true) {
			Geo.cur_location().then(function(resp1) {   //loads GPS location
				$scope.curLat = resp1.coords.latitude
				$scope.curLong = resp1.coords.longitude
				Events.venues_list(resp1,$scope.radius).then(function(resp){ 
					
					var markers = []
					venues = $.map(resp.data, function(value, index){return [value]});
					$rootScope.dbEvents = resp.data
					
					for (x in venues) {
						if (venues[x].class == "Venue") {
							var latitude = venues[x].latitude
							var longitude = venues[x].longitude
							
							var foo = createMarker(x,venues[x])
							foo.latitude = latitude
							foo.longitude = longitude
							markers.push(foo)
						}
					}
					$scope.map = { center: { latitude: $scope.curLat, longitude: $scope.curLong }, zoom: $scope.zoom, bounds: {}};
					$scope.eventMarkers = markers
				})
			})
		}
	}
	
	var init = function() {
		var  venues = []
		var eventId = $rootScope.eventId
		
		var foo = []
		var venue = $rootScope.venue

		if ( typeof eventId == "undefined" && typeof venue == "undefined") {
			populateMarkers()
			geo_update()
		}
		else if ( typeof eventId != "undefined") {
			
			event =  $rootScope.event
			latitude = venue.latitude
			longitude = venue.longitude

			foo = createMarker(1,event)
			foo.latitude = latitude
			foo.longitude = longitude
			var foobar=[]
			foobar.push(foo)
	
			$scope.map = { center: { latitude: venue.latitude, longitude: venue.longitude }, zoom: 15, bounds: {}};
			$scope.eventMarkers = foobar
		}
		else if (typeof $rootScope.venue != "undefined") {

			latitude = venue.latitude
			longitude = venue.longitude

			foo = createMarker(1,venue)
			foo.latitude = latitude
			foo.longitude = longitude
			var foobar=[]
			foobar.push(foo)
			
			var venueId = venue.id+"V"
			foo = createMarker(venueId,venue)
			
			$rootScope.dbEvents= []
			$rootScope.dbEvents[venueId] = $rootScope.venue
	
			$scope.map = { center: { latitude: venue.latitude, longitude: venue.longitude }, zoom: 15, bounds: {}};
			$scope.eventMarkers = foobar
		}
	}
	 
	var iconTypes =  function(events) {   //deprecated function
		for (x in events) {
			if (events[x].type == 'Bar' || events[x].type == 'Pub') {
				events[x].icon = "ion-beer"
			}
			else if (events[x].type == 'Club' || events[x].type == 'Lounge') {
				events[x].icon = "ion-wineglass"
			}
			else if (events[x].type == 'Venue' || events[x].type == 'After Hours') {
				events[x].icon = "ion-disc"
			}
			else if (events[x].type == 'Pre') {
				events[x].icon = "ion-android-social"
			}
			else if (events[x].type == 'Food') {
				events[x].icon = "ion-pizza"
			}
			else if (events[x].type == 'Cafe') {
				events[x].icon = "ion-coffee"
			}
			else {
				events[x].icon =  "ion-star"
			}
		}
		return events
	}

	init()
	
	

	
})
.controller('TagsCtrl', function($scope, $ionicPopup, $rootScope, $state, Events) {

	$('ion-scroll').height($(document).height()-$('.top-part').height()-66) //minor visual adjustment
	
	$scope.name = ''
	$scope.tags = []
	$scope.selectedTags = []
	function chunk(arr, size) {  //splits array in # of slices
	  var newArr = [];
	  for (var i=0; i<arr.length; i+=size) {
		newArr.push(arr.slice(i, i+size));
	  }
	  return newArr;
	}
	Events.tags().then(function(resp) {
		var data = $.map(resp.data, function(value, index){return [value]})  
		for (x in data) {
			data[x].style = 'button-outline'
		}
		$scope.rawTags = data
		console.log(data)
		$scope.tags =  data // chunk(data,2) //chunks data for multiple items per row repeat function
		
	})
	
	$scope.chngName = function(name) {
		$scope.name = name
	}
	
	$scope.tagSelect = function(tag) {
		console.log($scope.name)
		var selected = false
		for (i = 0; i < $scope.tags.length; i++) {
			if ($scope.tags[i] === tag) {			
				if ($scope.tags[i].style == ""){
					$scope.tags[i].style ='button-outline'
					$scope.selectedTags.splice($scope.selectedTags.indexOf(tag.id),1)
				}
				else if ($scope.selectedTags.length ==5 ) {
					var alertPopup = $ionicPopup.alert({
						title: 'Hey there!',
						template: 'You can only have 5 tags!'
						});
					alertPopup.then(function(res) {
					});
				}
				else {
					$scope.tags[i].style = ""
					$scope.selectedTags.push(tag.id);
				}
			}
		}
	}
	
	$scope.next = function(name) {
		console.log(name,$scope.selectedTags)
		if ( name.length >3  && $scope.selectedTags.length != 0 ) {
			$rootScope.ping_name = name 
			$rootScope.tag_ids = $scope.selectedTags
			$state.go('tab.select-people')
		}
		if ( name.length <=3 )  {
			var alertPopup = $ionicPopup.alert({
			title: 'Hey there!',
			template: 'Enter longer event name!'
			});
			alertPopup.then(function(res) {
			});
		}
		else if ( $scope.selectedTags.length == 0 )  {
			var alertPopup = $ionicPopup.alert({
			title: 'Hey there!',
			template: 'Tag at least one activity!'
			});
			alertPopup.then(function(res) {
			});
		}
		
	}
	
	
	
})
.controller('PingCtrl', function($scope, $state, $rootScope,$ionicPopup, Events,PingNameEvent) {
	$scope.next = function(name) {
		if ( name.length >3 ) {
			$rootScope.ping_name = name 
			window.localStorage.setItem("CreatedEvent", "");
			$state.go('tab.select-people')
		}
		else {
			var alertPopup = $ionicPopup.alert({
			title: 'Hey there!',
			template: 'Enter longer event name!'
			});
			alertPopup.then(function(res) {
			});
		}	
	}
})

.controller('PingEventCtrl', function($scope, $state, $rootScope, $stateParams,Events,Friends,PingNameEvent) {
	//static id, should be generated from DB
	if (typeof $rootScope.ping_id =="undefined" && typeof $stateParams.id == "undefined") {
		$rootScope.ping_id  = 13
	}
	if (typeof $rootScope.ping_name =="undefined") {
		Events.ping($rootScope.ping_id ).then(function(resp) {
			$rootScope.ping = resp.data
			$scope.ping = $rootScope.ping
		})
	};

	$scope.pingId = $stateParams.id
	delete $rootScope.createEvents
	
	$scope.invited = ""
	
	$scope.search = "balanced"
	
	if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
	if (typeof $stateParams.eventId == 'undefined') {
		$stateParams.eventId = 13
	}
	$scope.states = {'yes':0,'no':0,'noreply':0}
	$scope.friends = []
	
	Events.invites().then(function(resp){
		friends = resp.data
		var foo_list = []
		
		var invites = $.map(resp.data, function(value, index){return [value]}) 
		for (x in invites) {
			
			if ($rootScope.user != invites[x].user && $stateParams.eventId  == invites[x].ping_id) {
				if (invites[x].status == 0) {
					invites[x].state = "energized"
					$scope.states.noreply +=1
				}
				else if (invites[x].status == 1) {
					invites[x].state = "positive"
					$scope.states.yes +=1
				}
				else if (invites[x].status == -1) {
					invites[x].state = "assertive"
					$scope.states.no +=1
				}
				$scope.friends.push(invites[x])
			}
		}
		
	})
})

.controller('SelectPeopleCtrl', function($scope, $state,$rootScope, Friends, $ionicPopup) {

	$scope.friends = {}

	$scope.ajax = Friends.ajax_all().then(function(resp){
		var friends = $.map(resp.data, function(value, index){return [value]})  

		var group_list = []
		var foo_list = []  // for object comparison

		for (x in friends){			
			if (friends[x].group == null ) {   //skips null group items
				continue
				}
			else if ( friends[x].group.indexOf(',') > -1 ) {  //multiple groups
				groups = friends[x].group.split(', ')
				
				for (z in groups) {
					if (foo_list.indexOf(groups[z]) < 0 ) { 
						foo_list.push(groups[z])   //2nd list for faster cycling
						group_list.push({name:groups[z]})
					}
				}
			}
			else if (foo_list.indexOf(friends[x].group) < 0 ) { 
				foo_list.push(friends[x].group)
				group_list.push({name:friends[x].group})
			}
		}
		$scope.groups = group_list
		$scope.friends = friends 
	})

	
	// pass on IDs of checked people
	$scope.ids = []
	$scope.invite = function(id) {
		if ($scope.ids.indexOf(id) < 0) {
			$scope.ids.push(id)
		}
		else {
			var index = $scope.ids.indexOf(id)
			if( index > -1) {
				$scope.ids.splice(index,1);
			}
		}
	}
	
	$scope.submit = function() {
		if ($scope.ids.length == 0) {
			var alertPopup = $ionicPopup.alert({
			title: 'Hey there!',
			template: 'Please select at least one person or group!'
			});
			alertPopup.then(function(res) {
			});
	    }
		else {
			if (typeof $rootScope.user == 'undefined') {
				$rootScope.user = 1
			}
			if (typeof $rootScope.ping_name !="undefined") {
				var data = {ids: $scope.ids, ping: $rootScope.ping_name, tags: $rootScope.tag_ids, user: $rootScope.user}
			}
			else {
				var data = {ids: $scope.ids, events: $rootScope.createEvents, tags: $rootScope.ping_ids,  user: $rootScope.user}
			}
			$.ajax({
				type: "POST",
				dataType: 'text',
				url: 'http://backend-env-36mjm8eh3x.elasticbeanstalk.com/create_event',
				data: JSON.stringify(data) ,
				success: function(reply){
					if (typeof $rootScope.ping_name !="undefined") {
						$state.go('tab.ping-event',{'id':reply})
					}
					else{
						var trimmed = reply.slice(1,reply.length-1)
						if (reply.indexOf(",")>0){
							var ids = reply.split(",")
							var event_id = ids[0].substring(1, event_id.length-1)  //goes to first ID
							$state.go('tab.event-details',{'eventId':event_id})
						}
						else {
							var event_id = trimmed.slice(0,trimmed.length-1)
							$state.go('tab.event-details',{'eventId':event_id})
						}
					}
					
				},
				error: function (ts) {
					console.debug(ts.responseText)				
			}
			})
		}
	}
})

.controller('FriendsCtrl', function($rootScope,$scope,$location,$window, $http,$ionicPlatform, $state, $cordovaLocalNotification,$http, Friends, PingNameEvent, $cordovaContacts) {
	$scope.loading = true
	document.addEventListener("deviceready", onDeviceReady, false);
	
	$scope.listCanSwipe = true;
	$scope.friendsMode =  true;
	$scope.modeIcon = "ion-person-add"
	
	$scope.contactsMode = function(){
		$scope.friendsMode = !$scope.friendsMode
		if ($scope.friendsMode == true) {
			$scope.modeIcon = "ion-person-add"
		}
		else {
			$scope.modeIcon = "ion-person-stalker"
			getContacts()
		}
	}
	
	function onDeviceReady(){
		$cordovaContacts.find({filter: ''}).then(function(resp) {
			var contacts =  resp
			var data = {}
			for (x in contacts) {
				if (typeof contacts[x].id != 'undefined' ) {
					if (contacts[x].phoneNumbers != null ) {   // should check for OSs notation of phone info
					//console.log(contacts[x].displayName,contacts[x].name,contacts[x].phoneNumbers)
						data[contacts[x].id] = {'name':contacts[x].displayName, 'phone':contacts[x].phoneNumbers}
						//data[contacts[x].id].name = contacts[x].name
						//data[contacts[x].id].phone = contacts[x].phoneNumbers
					}
				}
			}
			$rootScope.contacts = data
			$scope.contacts = contacts;
			var foo = {'user':1,'contacts':JSON.stringify(data)}
			data = foo
			$.ajax({
				type: "POST",
				dataType: 'application/json',
				url: 'http://backend-env-36mjm8eh3x.elasticbeanstalk.com/phone',
				data:  data,
				success: function(reply){
				},
				error: function (ts) {
					console.debug(ts.responseText)				
				}
			})
		})
	}
	
	function JSON_stringify(s, emit_unicode)
	{
	   var json = JSON.stringify(s);
	   return emit_unicode ? json : json.replace(/[\u007f-\uffff]/g,
		  function(c) { 
			return '\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4);
		  }
	   );
	}
	
	
	
	// FRIENDS mode

	$scope.friends = function() {return {} }
	$scope.ajax = Friends.ajax_all().then(function(resp){
		var friends = $.map(resp.data, function(value, index){return [value]})  

		group_list = []
		foo_list = []
		for (x in friends){
			if (friends[x].group == null ) {   //skips null group items
				continue
				}
			else if ( friends[x].group.indexOf(',') > -1 ) {  //multiple groups
				groups = friends[x].group.split(', ')
				
				for (z in groups) {
					if (foo_list.indexOf(groups[z]) < 0 ) { 
						foo_list.push(groups[z])   //2nd list for faster cycling
						group_list.push({name:groups[z]})
					}
				}
			}
			else if (foo_list.indexOf(friends[x].group) < 0 ) { 
				foo_list.push(friends[x].group)
				group_list.push({name:friends[x].group})
			}
		}
		group_list.unshift({name:'All'})
		$rootScope.groups = group_list
		$scope.loading = false
		$scope.friends = function() {return friends }
	})
	
	$scope.group_type = $rootScope.group_type
	
	$scope.$watch( function(){
		return $rootScope.group_type;
	}, function() {
		$scope.group_type = $rootScope.group_type
	})
	
	$scope.blockUpdate = function(friend) {
		if ( friend.block==0 || friend.block == false) {
			friend.block = 1
		}
		else {
			friend.block = 0
		}
		Friends.block(friend).then(function(resp){
			console.log(resp)
		})		
	}
	
	// CONTACTS mode
	$scope.contacts = []
	function getContacts() {
		$scope.loading = true;
		Friends.contacts().then(function(resp){
		
		console.log(resp.data)
		$scope.contacts = resp.data
		$scope.loading = false;
		})
	}
	
})

.controller('CreateEventCtrl', function($scope,$rootScope,$state,$ionicPopup,$http,Events, limitToFilter) {
	$scope.loading = true
	$scope.event_types = []
	
	$scope.events = function(searchStr) {
		$scope.loading2 = true	
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		return $http.post('http://backend-env-36mjm8eh3x.elasticbeanstalk.com/api/venues',{'search':searchStr}).then(function(resp) {
			var events= $.map(resp.data, function(value, index){return [value]}) 
			$scope.loading2 = false
			return limitToFilter(events, 5)
		})
	}	
	
	Events.event_types().then(function(resp){
		var event_types = []
		var foo = resp.data[0]
		for (x in foo) {
			event_types.push({'type':foo[x][0]})
		}
		console.log(event_types)
		$scope.event_types = event_types
	});

	$scope.pre = function(event_type) {
		if (event_type =="Pre")
			return true
		else {
			return false
		}
	}

	$scope.next = function(){
		fields = $scope.sequence
		console.log(fields)
		var filled = true
		for ( x in fields) {
			if (fields[x].name =="" || typeof fields[x].name == 'undefined' || 
				fields[x].location == "" || typeof fields[x].location =='undefined'){
				var alertPopup = $ionicPopup.alert({
					title: 'Hey there!',
					template: 'Fill in the name and location please!'
				});
				filled = false
			}
			if (fields[x].time =="" || typeof fields[x].time == 'undefined'){
				var alertPopup = $ionicPopup.alert({
					title: 'Hey there!',
					template: 'Select the time please!'
				});
				filled = false
			}
		}
		
		if (filled == true) {
			$rootScope.createEvents = $scope.sequence
			$state.go('tab.select-people')
		}
	}
	
	$scope.date = {today:"button-positive", tomorrow:"", other:""}
	$scope.datePick = function(val, event) {
		console.log(event)
		if ( val == 0 ) {
			event.date = 0
			$scope.date = {today:"button-positive", tomorrow:"", other:""}
		}
		else if ( val == 1) {
			event.date = 1
			$scope.date = {today:"", tomorrow:"button-positive", other:""}
		}
		else if ( val == 2) {
			$scope.date= {today:"", tomorrow:"", other:"button-positive"}
		}
		console.log(val,$scope.date)
	}
	
	$scope.sequence = []
	
	$scope.remove = function(eventID){
		console.log(eventID)
		for (x in $scope.sequence) {
			if ($scope.sequence[x].id == eventID ) {
				$scope.sequence.splice(x,1)
			}
		}
		$scope.sequence.splice
	}
	
	$scope.addBefore = function(){
		var form =[]
		var highestID = 0
		var sequence = []
		sequence = $scope.sequence
		for (x in sequence) {
			if (sequence[x].id > highestID) {
				highestID += 1
				highestID = sequence[x].id
			}
		}
		form = {id:highestID,byob:true,fancy:false,invite:{secret:"", friends:"button-positive", open:""}, 
				details:'',date:0, privacy:1,time:'', event_type:$scope.event_types[3]}
		if ($scope.sequence.length <4) {
			$scope.sequence.unshift(form)
		}
		else {
		var alertPopup = $ionicPopup.alert({
				title: 'Hey there!',
				template: 'Too many events linked together!'
			});
		}
	}

	$scope.addAfter = function(){
		var form =[]
		var highestID = 0
		var sequence = []
		sequence = $scope.sequence
		for (x in sequence) {
			if (sequence[x].id > highestID) {
				highestID += 1
				highestID = sequence[x].id
			}
		}
		form = {id:highestID,byob:true,fancy:false,invite:{secret:"", friends:"button-positive", open:""},
				details:'',date:0,privacy:1, time:'', event_type:$scope.event_types[5]}
		if ($scope.sequence.length <4) {
			$scope.sequence.push(form)
		}
		else {
		var alertPopup = $ionicPopup.alert({
				title: 'Hey there!',
				template: 'Too many events linked together!'
			});
		}
		
	}

	$scope.privacy = {secret:"", friends:"button-positive", open:""}
	$scope.privacyPicker = function(entity,value) {
		if ( value == 0 ) {
			entity.privacy = 0
			$scope.privacy = {secret:"button-positive", friends:"", open:""}
		}
		else if ( value == 1) {
			entity.privacy = 1
			$scope.privacy = {secret:"", friends:"button-positive", open:""}
		}
		else if ( value == 2) {
			entity.privacy = 2
			$scope.privacy = {secret:"", friends:"", open:"button-positive"}
		}
	}
	
	var initSeq = function(){
		var sequence = []
		var form = {}
		if ($scope.sequence.length ==0) {
			form = {id:1,byob:true,fancy:false,details:'',privacy:1, date:0, time:'', event_type:$scope.event_types[1]}
			console.log(form)
			sequence.push(form)
			$scope.loading = false
			$scope.sequence  = sequence
		}
	}
	$scope.$watch( function(){
		return $scope.event_types;
	}, function() {
		if ($scope.event_types.length > 0) {
		initSeq()	
		}
	})
	

})

.controller('EventsCtrl', function($scope, $state, Events,Friends) {
	$scope.event_types = Events.event_types();
	$scope.events = Events.all();
	$scope.event_type = { id: 0, type:'All' }

})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends, Events) {
	$scope.past= []
	Friends.get($stateParams.friendId).then(function(resp){
		$scope.friend = resp.data
	})
	Events.past().then(function(resp){
		$scope.past = resp.data
	})
	
})

.controller('VenueDetailCtrl', function($scope, $state,$stateParams,$rootScope, Events,Friends) {
	console.log($rootScope.dbEvents)
	console.log($stateParams)
	$scope.form = $rootScope.dbEvents[$stateParams.venueId+"V"]

	$scope.eventSelect = function(event) {
		$rootScope.event = event
		$state.go('tab.event-details',{'eventId':event.id})
	}
	
	$scope.view_map =  function() {

		$scope.$emit('MapEvent');
		$state.go('tab.map')
	};
})

.controller('EventDetailCtrl', function($scope, $state,$stateParams,$rootScope, Events,Friends) {
	
	$scope.map_button = "button-positive"
	$scope.form = function() {
		if ( $stateParams.eventId == "" ) {
			return event_data
		}
		else if ( $rootScope.createEvents !="" && typeof $rootScope.createEvents != 'undefined' ) {
			console.log($rootScope.createEvents)
			var event = $rootScope.createEvents[0]
			if (event.date == 0 ){
				event.date = "Today"
			}
			else if (event.date == 1 ){
				event.date = "Tomorrow"
			}
			console.log(event)
			if (typeof event.location != 'object') {
				$scope.venue = {}
				$scope.venue['address'] = ""
				$scope.map_button = "button-light"
				
			}
			else {
				$scope.venue = event
				$scope.venue.address = event.location.address
			}
			$scope.style['colour'] = 'button-balanced'
			$scope.style['icon'] = 'ion-clipboard'
			$scope.style['text'] = "Organizer"

			return event
		}
		else if ( typeof $rootScope.event !="undefined" ) {
			$scope.venue =  $rootScope.venue
			return $rootScope.event // Events.get($stateParams.eventId);
		};

	}

	$scope.view_map =  function() {
		if ($scope.venue.address != "") {
			$rootScope.eventId = $stateParams.eventId 
			$rootScope.eventInfo = $scope.states
			$scope.$emit('MapEvent');
			$state.go('tab.map');
		}
	};
	$scope.style = {colour:'button-positive', icon: "", text:"Attend"}
	$scope.attending = function() {
		if ($scope.style['icon'] == "" ){
			$scope.style['colour'] = 'button-balanced'
			$scope.style['icon'] = 'ion-checkmark-circled'
			$scope.style['text'] = "Going"
		}
		else {
			$scope.style['colour'] = 'button-positive'
			$scope.style['icon'] = ''
			$scope.style['text'] = "Attend"
		}
	};
	
	$scope.friends =[]
	$scope.states ={"yes":0,'no':0,"noreply":0}
	$scope.ajax = Events.invites().then(function(resp){
		var myID = 1
		var invites = $.map(resp.data, function(value, index){return [value]}) 
		
		for (x in invites) {
			if (myID != invites[x].user_id && $stateParams.eventId  == invites[x].event_id) {
				if (invites[x].status == 0) {
					invites[x].state = "energized"
					$scope.states.noreply +=1
				}
				else if (invites[x].status == 1) {
					invites[x].state = "positive"
					$scope.states.yes +=1
				}
				else if (invites[x].status == -1) {
					invites[x].state = "assertive"
					$scope.states.no +=1
				}
				$scope.friends.push(invites[x])
			}
		}
		
	})
})

.controller('AccountCtrl', function($scope, Account) {
	
	$scope.single = true
	$scope.guys = Account.guys()
	$scope.girls = Account.girls()
	
	$scope.male = true
	$scope.student = true
	
	$scope.visible = function() {
		visible = window.localStorage.getItem("Status");
		if (visible == 0) {    // Not visible
			return false
		}
		else {
			return true
		}
	}

})

.controller('LoginCtrl', function($scope, $state, $rootScope,$ionicPlatform, $cordovaFacebook, Events) {
	$scope.username = 1
	
	$scope.login = function(username) {
		$rootScope.user = username
		$state.go('intro')
	}
	
	var options = {};
       options.filter = "";
       options.multiple = true;
	
	document.addEventListener("deviceready", onDeviceReady, false);
	
	function onDeviceReady(){
		console.log("Fired!!")
	}
	
	$scope.FbLogin = function() {
		$scope.foo = 'Clicked!'
		
		var uagent = navigator.userAgent.toLowerCase();
		
		if (uagent.search("android") > -1) {
			$cordovaFacebook.login(["public_profile", "email", "user_friends"])
			.then(function(success) {
			  $cordovaFacebook.api("me", ["user_friends"])
				.then(function(success) {
				  $scope.foo = success
				  var userId = success.id
				}, function (error) {
				  // error
				});
			}, function (error) {
			  console.log(error)
			  $scope.foo = error
			});
		}
		else if (uagent.search("mozilla") > -1) {
			$scope.foo  ="browser"
		}

	$scope.api = function() {
		console.log('RESTful')
		Events.RESTapi().then(function(resp) {
			console.log(resp)
		})
	}
		
		
	}
})

.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate) {
  // Called to navigate to the main app

  $scope.startApp = function() {
    $state.go('tab.map');
  };
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
	if ( index ==2 ){
		$scope.name = window.localStorage.setItem("Status",1);
		setTimeout(function(){$state.go('tab.map');},500)
		
		
	}
	else if ( index ==0 ) {
		$scope.name = window.localStorage.setItem("Status",0);
		setTimeout(function(){$state.go('tab.friends')},500)
		
	}
  };
})



