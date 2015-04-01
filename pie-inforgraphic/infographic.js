function PieInfographic(stats) {
	this.stats = stats;
	this.render = render;
	this.currentPie = 0;
	this._angles = {};
	this._pathNodes = [];

	function render(parentEl) {

		var self = this;

		var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
			parentGroupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
			svgDimensions, center, radius,
			baseAngle, expandedAngle, shrunkAngle;

		svgEl.setAttribute('style', 'width:100%;height:100%');

		if (typeof(parentEl) !== undefined) {
			parentGroupEl.classList.add('outer-group');
			svgEl.appendChild(parentGroupEl);
			parentEl.appendChild(svgEl);
		}

		svgDimensions = {
			width: svgEl.clientWidth,
			height: svgEl.clientHeight
		};

		center = {
			x: svgEl.clientWidth / 2,
			y: svgEl.clientHeight / 2
		};

		radius = svgDimensions.width * 0.4; //Occupying 80% of the SVG size

		baseAngle = 2 * Math.PI / this.stats.length;
		expandedAngle = Math.min(2 * Math.PI - (0.15 * Math.PI * this.stats.length), baseAngle * 4, Math.PI); //Pie, on expansion to 3 times, should leave atleast 36 degrees for each other pie, and cannot be more than 180 degrees.
		shrunkAngle = (2 * Math.PI - expandedAngle) / (stats.length - 1); //Angle when a pie is shrunk

		self._angles.baseAngle = baseAngle;
		self._angles.expandedAngle = expandedAngle;
		self._angles.shrunkAngle = shrunkAngle;

		for(var i=0; i<stats.length;i++){
			var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			pathEl.setAttribute('fill', stats[i].color);
			
			pathEl.addEventListener('click',function(event){
				_performAction('expand', self._pathNodes.indexOf(event.target));
			});

			this._pathNodes.push(parentGroupEl.appendChild(pathEl));			
		}

		_performAction('normal');

		function _performAction(state,index){

			var arcPositions = [];

			if(state === 'normal'){
				arcPositions = _getArcPositionsForState(state);
			} else if(state === 'expand'){
				arcPositions = _getArcPositionsForState(state,index);
			}

			if(state === 'normal'){
			
				for(var i=0; i< self._pathNodes.length;i++){
			
					//TODO: Animate with some durations/easing here.
					_animateTo(self._pathNodes[i],arcPositions[i], (state === 'normal')? 0:1);					

					//Set the data attribute for state
					if(state === 'normal')
						self._pathNodes[i].setAttribute('data-state',state);
					else if(state === 'expand' && i === index)			
						self._pathNodes[i].setAttribute('data-state',state);
					else
						self._pathNodes[i].setAttribute('data-state','shrink');
				}
			
			} else{

				var targetAngles = [],
				increments = [];

				for(var i=0; i< arcPositions.length; i++){
					
					targetAngles.push([
						_cartesianToPolar(center,arcPositions[i][0]).theta,
						_cartesianToPolar(center,arcPositions[i][1]).theta
					]);

					//Calculating first set of increments
					increments.push(_getNextIncrement(self._pathNodes[i],targetAngles[i]));
				}


				function drawIncrement(){
					
					for (var i = 0; i < increments.length; i++) {
						if(increments[i] !== null)
							self._pathNodes[i].setAttribute('d', increments[i]);
					};

					console.log('Drew one increment');

					increments = [];
					var nextFrameRequestNeeded = false;

					//Get the next set of increments
					for(i=0; i < self._pathNodes.length; i++){
						
						increments.push(_getNextIncrement(self._pathNodes[i],targetAngles[i]));

						if(increments[i] !== null){
							nextFrameRequestNeeded = true;
						}
					}

					//if increments has one non-null entry
					if(nextFrameRequestNeeded)
						window.requestAnimationFrame(drawIncrement);
				}

				window.requestAnimationFrame(drawIncrement);
			}
		}


		//Calculate arc start-end positions for each pie based on the state.
		function _getArcPositionsForState(state,index){

			var arcPositions = [],angleOffset;

			if(state === 'normal'){

					angleOffset = self._angles.baseAngle/2;
					
					for(var i=0;i<stats.length;i++){
						arcPositions.push([
							_polarToCartesian(center,radius,angleOffset),
							_polarToCartesian(center,radius,angleOffset - baseAngle)
						]);
						angleOffset-=baseAngle;
					}

			}else if(state === 'expand'){
					index = index || 0;

					if(index === 0){
						angleOffset = self._angles.expandedAngle/2;
					}else{
						angleOffset = self._angles.shrunkAngle/2;
					}

					for(var i=0;i<stats.length;i++){

						var arcPoints = [ _polarToCartesian(center,radius,angleOffset) ]; //Pushing the start point

						if(i === index){
							arcPoints.push(_polarToCartesian(center,radius,angleOffset - expandedAngle));
							angleOffset -= expandedAngle;
						}else{
							arcPoints.push(_polarToCartesian(center,radius,angleOffset - shrunkAngle));
							angleOffset -= shrunkAngle;
						}
						arcPositions.push(arcPoints);
					}
			}

			return arcPositions;
		}

		function _animateTo(el,arcPoints,duration){
			if(duration <=0){
				el.setAttribute('d',_getPathDescForArcPositions(center,radius,arcPoints[0],arcPoints[1]));
				return;
			}
		}

		function _getNextIncrement(el,targetAngles){
			
			var currentArcPoints = _getArcCoordinates(el);
			var sourceAngles = [ _cartesianToPolar(center,currentArcPoints[0]).theta,
				_cartesianToPolar(center,currentArcPoints[1]).theta
			];

			if(Math.abs(targetAngles[0] - sourceAngles[0]) <= Math.pow(10,-10)  && 
				Math.abs(targetAngles[1] - sourceAngles[1]) <= Math.pow(10,-10)){
				//If source and target angles are equal to precision of 10 decimals, stop the increments.
				return null;
			}

			if(sourceAngles[0] < targetAngles[0])
				sourceAngles[0] = Math.min(sourceAngles[0]+0.1,targetAngles[0]);
			else if(sourceAngles[0] > targetAngles[0])
				sourceAngles[0] = Math.max(sourceAngles[0]-0.1,targetAngles[0]);

			if(sourceAngles[1] < targetAngles[1])
				sourceAngles[1] = Math.min(sourceAngles[1]+0.1,targetAngles[1]);
			else if(sourceAngles[1] > targetAngles[1])
				sourceAngles[1] = Math.max(sourceAngles[1]-0.1,targetAngles[1]);

			return _getPathDescForArcPositions(center,radius,
					_polarToCartesian(center,radius,sourceAngles[0]),
					_polarToCartesian(center,radius,sourceAngles[1]));	

		}
		

		function _getPathDescForArcPositions(center, radius, startPoint, endPoint) {
			var points = 'M' + center.x + ',' + center.y;

			points += ' L ' + startPoint.x + ' ' + startPoint.y;

			points += ' A ' + radius + ' ' + radius +
				' 1 0 1 ' + endPoint.x + ' ' + endPoint.y;

			//points += ' M ' + endPoint.x + ' ' + endPoint.y;
			points += ' L ' + center.x + ' ' + center.y;
			points += ' Z';

			return points;
		}

		function _createAnimElement(tag, attrs) {
			var animEl = document.createElementNS('http://www.w3.org/2000/svg', tag);
			for (key in attrs)
				animEl.setAttribute(key, attrs[key]);
			return animEl;
		}

		function _polarToCartesian(center,radius,angle){
			return {
				x: center.x + (Math.cos(angle) * radius),
				y: center.y - (Math.sin(angle) * radius)	
			};	
		}

		function _cartesianToPolar(center,point){

			var theta = Math.atan2(point.y - center.y,point.x - center.x);

			if(theta > 0)
				theta *= -1; 
			else if(theta < 0)
				theta = -1 * (2*Math.PI + theta);

			return {
				r: radius,
				theta: theta
			};	
		}

		function _getArcCoordinates(pathEl){
			var desc = pathEl.getAttribute('d'),
			startPoints = desc.split('L ')[1].split(' A')[0].split(' '),
			endPoints = desc.split('1 0 1 ')[1].split(' L')[0].split(' ');

			return [{
				x: parseFloat(startPoints[0]),
				y: parseFloat(startPoints[1])
			},{
				x: parseFloat(endPoints[0]),
				y: parseFloat(endPoints[1])
			}];
		}

		function _getArcAngleForState(state){
			if(state === 'normal')
				return self._angles.baseAngle;
			else if(state === 'expand')
				return self._angles.expandedAngle;
			else if(state === 'shrink')
				return self._angles.shrunkAngle;

			return null;
		}


	}
}

window.onload = function() {
	var graphicWrapper = document.getElementsByTagName('div')[0],
		graphic = new PieInfographic([{
			color: '#5793F3'
		}, {
			color: '#DD4D79'
		}, {
			color: '#BD3B47'
		}, {
			color: '#DD4444'
		}, {
			color: '#FD9C35'
		}, {
			color: '#FEC42C'
		}, {
			color: '#D4Df5A'
		}, {
			color: '#5578C2'
		}]);

	graphic.render(graphicWrapper);
};