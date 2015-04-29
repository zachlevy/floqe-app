// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ngCordova','ionic', 'uiGmapgoogle-maps','starter.controllers', 'starter.services','FloqeFilters'])
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }	
  }); 
})

.config(function($stateProvider, $locationProvider, uiGmapGoogleMapApiProvider,$httpProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  
	uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyDcMRDAPxqPMY7mUtEiqgI_7ESnkrobbhY',
        v: '3.17',
        libraries: 'weather,geometry,visualization,places'
    });
	
  
  $stateProvider
	.state('intro', {
		url: "/intro",
		templateUrl: 'templates/intro.html',
		controller: 'IntroCtrl'
	})
	.state('login', {
		url: "/",
		templateUrl: 'templates/login.html',
		controller: 'LoginCtrl'
	})
  
    // setup an abstract state for the tabs directive
/*     .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    }) */
	
	// abstract for right sided menu
	.state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: 'templates/right-menu.html',
	  controller: 'RMenuCtrl'
      }
    )

    // Each tab has its own nav history stack:

    .state('tab.dash', {
      url: '/dash',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-dash.html',
          controller: 'DashCtrl'
        }
      }
    })
	.state('tab.ping', {
      url: '/ping',
      views: {
        'menuContent': {
          templateUrl: 'templates/ping.html',
          controller: 'PingCtrl'
        }
      }
    })
	.state('tab.select-people', {
      url: '/select_people',
      views: {
        'menuContent': {
          templateUrl: 'templates/select-people.html',
          controller: 'SelectPeopleCtrl'
        }
      }
    })
	.state('tab.ping-event', {
      url: '/ping-event',
      views: {
        'menuContent': {
          templateUrl: 'templates/ping-event.html',
          controller: 'PingEventCtrl'
        }
      }
    })
	.state('tab.tags', {
      url: '/tags',
      views: {
        'menuContent': {
          templateUrl: 'templates/tags.html',
          controller: 'TagsCtrl'
        }
      }
    })
	.state('tab.events', {
      url: '/events',
      views: {
        'menuContent': {
          templateUrl: 'templates/events.html',
          controller: 'EventsCtrl'
        }		
      }
    })
	.state('tab.map', {
      url: '/map',
      views: {
        'menuContent': {
          templateUrl: 'templates/map.html',
          controller: 'MapCtrl'
        }
      }
    })
	.state('tab.event-details', {
      url: '/events/:eventId',
      views: {
        'menuContent': {
          templateUrl: 'templates/event-details.html',
          controller: 'EventDetailCtrl'
        }
      }
    })
	.state('tab.venue-details', {
      url: '/venues/:venueId',
      views: {
        'menuContent': {
          templateUrl: 'templates/venue-details.html',
          controller: 'VenueDetailCtrl'
        }
      }
    })
	.state('tab.c', {
      url: '/create-event',
      views: {
        'menuContent': {
          templateUrl: 'templates/create-event.html',
          controller: 'CreateEventCtrl'
        }
      }
    })
    .state('tab.friends', {
      url: '/friends',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-friends.html',
          controller: 'FriendsCtrl'
        }
      }
    })

    .state('tab.friend-detail', {
      url: '/friend/:friendId',
      views: {
        'menuContent': {
          templateUrl: 'templates/friend-detail.html',
          controller: 'FriendDetailCtrl'
        }
      }
    })
    .state('tab.account', {
      url: '/account',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-account.html',
          controller: 'AccountCtrl'
        }
      }
    })
	.state('tab.updates', {
      url: '/updates',
      views: {
        'menuContent': {
          templateUrl: 'templates/updates.html',
          controller: 'UpdatesCtrl'
        }
      }
    })

  // if none of the above states are matched, use this as the fallback

	$urlRouterProvider.otherwise('/');
});

