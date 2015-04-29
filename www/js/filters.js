angular.module('FloqeFilters', [])
	.filter('eventTypes', function() {
		return function(input,type) {

			if ( type == "All") {
				return input
			}
			else {
				var filtered = []
				for ( i in input) {
					if (input[i].type == type) {
						filtered.push(input[i])
						
					}
				}
				console.log(filtered)
				return filtered
			}
		}
	})
	.filter('groupTypes', function() {
		return function(input,group) {
			if ( group == "All") {
				return input
			}
			else {
				var filtered = []
				for ( i in input) {
					if (input[i].group == null ) {
						continue
					}
					else if ( input[i].group.indexOf(group) > -1 && input[i].group.indexOf(',') > -1 ) { // deals with multiple groups
						filtered.push(input[i])
					}
					else if (input[i].group == group) {
						filtered.push(input[i])
					}
				}

				return filtered
			}
		}
	})	
	.filter('stateOrder', function() {
		return function(input) {
			var green_state=[]
			var yellow_state=[]
			var red_state=[]
			var ordered_states=[]
			if (input[i].state == "balanced") {
				green_state.push(input[i])
			}
			else if (input[i].state == "energized") {
				yellow_state.push(input[i])
			}
			else if (input[i].state == "assertive") {
				red_state.push(input[i])
			}
			ordered_states.concat(green_state)
			ordered_states.concat(yellow_state)
			ordered_states.concat(red_state)
			console.log(ordered_states)
			return ordered_states
		}
	});