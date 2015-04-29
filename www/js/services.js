angular.module('starter.services', [])

 
.factory("Geo", function($cordovaGeolocation) {   
	return  {
		cur_location: function(){
			var posOptions = {timeout: 1000, enableHighAccuracy: false};
			return $cordovaGeolocation.getCurrentPosition(posOptions)
		}
	};
})
 
.factory('Friends', function($http,$q,$rootScope) {
  // Might use a resource here that returns a JSON array
  return {
    all: function() { //  http://http://127.0.0.1:5000/     http://backend-env-36mjm8eh3x.elasticbeanstalk.com
		return $http.get("http://http://127.0.0.1:5000/friends")
    },
	ajax_all: function() {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
		deferred.resolve($http.post('http://http://127.0.0.1:5000/friends',{'user':$rootScope.user}));
      return deferred.promise;
    },
	phoneContacts: function(contacts) {
		$http.defaults.headers.post["Content-Type"] = "text";
		var deferred = $q.defer();
		if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
		var data = JSON.stringify({'user':$rootScope.user,'contacts':contacts})
		
		deferred.resolve($http.post('http://http://127.0.0.1:5000/friends',data));
      return deferred.promise;
    },
	contacts: function() {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
		deferred.resolve($http.post('http://http://127.0.0.1:5000/phone',{'user':$rootScope.user}));
		return deferred.promise;
	},
	groups: function(){
		group_list = []
		foo_list = []  // for object comparison

		for (x in friends){
			bar = {name:friends[x].group}

			if (foo_list.indexOf(friends[x].group) < 0 ) { 
				foo_list.push(friends[x].group)
				group_list.push({name:friends[x].group})
			}
		}
		group_list.unshift({name:'All'})
		return group_list
	},
	block: function(friendId) {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
		deferred.resolve($http.post('http://http://127.0.0.1:5000/friends',{'user':$rootScope.user,'id':friendId}));
      return deferred.promise;
    },
    get: function(friendId) {
      $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		$rootScope.user = 1
		deferred.resolve($http.post('http://http://127.0.0.1:5000/friends',{'user':$rootScope.user,'id':friendId}));
      return deferred.promise;
    }
  }
})

.factory('Events', function($http,$q,$timeout,$rootScope, Geo) { 
  return {
	past: function () { 
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
		deferred.resolve($http.post('http://http://127.0.0.1:5000/api/past_events',{'user':$rootScope.user})); 
		return deferred.promise;
	},
	venues: function () { 
		return $http.get("http://http://127.0.0.1:5000/markers")
	},
	venues_list: function (data,radius) {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
		deferred.resolve($http.post('http://http://127.0.0.1:5000/api/venues',{'coords':data.coords,'radius':radius,'user':$rootScope.user})); //actual ajax call
	return deferred.promise;
	},
	search: function (searchStr) {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		deferred.resolve($http.post('http://http://127.0.0.1:5000/api/venues',{'search':searchStr})); 
	return deferred.promise;
	},
	invites: function () {
		if (typeof $rootScope.user == 'undefined') {
			$rootScope.user = 1
		}
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		deferred.resolve($http.post("http://http://127.0.0.1:5000/api/invites",{'user':$rootScope.user,'ping':$rootScope.ping_id}))
		return deferred.promise;
	},
	ping: function(id) {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		deferred.resolve($http.post('http://http://127.0.0.1:5000/api/pinginfo',{'id':id})); 
		return deferred.promise;
    },
	event_types: function() {
		var deferred = $q.defer();
		deferred.resolve($http.get("http://http://127.0.0.1:5000/api/event_types"))
		return deferred.promise;
    },
	updates: function (user) {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		deferred.resolve($http.post('http://http://127.0.0.1:5000/api/events',{'user':user})); 
		return deferred.promise;
	},
	RESTapi: function () {
		$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
		var deferred = $q.defer();
		console.log('blergh')
		$http.get("http://127.0.0.1:5000/todos")
		return deferred.promise;
	},
	tags: function() {
		var deferred = $q.defer();
		deferred.resolve($http.get("http://127.0.0.1:5000/api/tags"))
		return deferred.promise;
	}
  }
})

.factory('Account', function() {
  var info =  [
	{ name: "discovery", value:true },
	{ name: "gender", value:"Male" },
	{ name: "status", value:"Single" },
	{ name: "guys", value:false},        // index=3
	{ name: "girls", value:true}         // index=4
  ];

  return {
    guys: function() {
		return info[3].value ;
    },
	girls: function() {
		return info[4].value;
    }
  }
})
.factory('PingNameEvent', function() {
	return {name:"foo"}
})
