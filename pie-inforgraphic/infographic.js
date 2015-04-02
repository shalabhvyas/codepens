function PieInfographic(stats) {

	this.stats = stats;
	this.render = render;

	this._angles = {};
	this._pathNodes = [];
	this._center = 0;
	this._radius = 0;
	this._performAction = _performAction;
	this._rotateGraphicToPie = _rotateGraphicToPie;
	this._getArcPositionsForState = _getArcPositionsForState;
	this._setDataAttributes = _setDataAttributes;
	this._getNextIncrement = _getNextIncrement;	

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
			width: svgEl.clientWidth || svgEl.parentNode.clientWidth,
			height: svgEl.clientHeight || svgEl.parentNode.clientHeight
		};

		center = {
			x: svgDimensions.width / 2,
			y: svgDimensions.height / 2
		};

		radius = svgDimensions.width * 0.4; //Occupying 80% of the SVG size

		self._center = center;
		self._radius = radius;

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

					//Bring all pies to normal state
					self._performAction('normal', -1, 1,function(){
						//Rotate the graphic to center the clicked pie.
						self._rotateGraphicToPie(self._pathNodes.indexOf(event.target),function(){
							//Expand/shrink pies based on the clicked pie.
							self._performAction('expand', self._pathNodes.indexOf(event.target),1,null);	
						});
					});
			});

			this._pathNodes.push(parentGroupEl.appendChild(pathEl));			
		}

		this._performAction('normal');		
	}

	function _rotateGraphicToPie(index,callback){
		var parentGroupEl = this._pathNodes[0].parentNode.parentNode,
		angleFrom  = parseFloat(parentGroupEl.getAttribute('data-offset-angle')) || 0,
		angleTo = -1 * (index * this._angles.baseAngle * 180/ Math.PI);

		if(angleFrom === angleTo){
			if(callback)
				callback();
		}

		angleTo += Math.ceil(angleFrom/360)*360;

		if(angleTo > angleFrom)
			angleTo -= 360; //angleTo should always be less than angleFrom for a anti-clockwise rotation.

		if(callback)
			parentGroupEl.addEventListener('transitionend',function(event){
				callback();
				event.target.removeEventListener(event.type, arguments.callee);
			});

		parentGroupEl.style.transform = 'rotate(' + (angleTo) + 'deg)';
		parentGroupEl.style.webkitTransform = 'rotate(' + (angleTo) + 'deg)';

		parentGroupEl.setAttribute('data-offset-angle',angleTo);
	}



	function _performAction(state,index,duration,callback){

			var self = this,
			center = self._center,
			radius = self._radius,
			arcPositions = [];

			if(!duration){			

				arcPositions = self._getArcPositionsForState(state);

				for(var i=0; i< self._pathNodes.length;i++){								
					self._pathNodes[i].setAttribute('d',
						_getPathDescForArcPositions(center,radius,arcPositions[i][0],arcPositions[i][1]));
				}	
				
				self._setDataAttributes(state,index);

				if(callback)
					callback();

			} else{

				var targetAngles = [],
				increments = [],
				arcPositions = self._getArcPositionsForState(state,index);

				for(var i=0; i< arcPositions.length; i++){
					
					targetAngles.push([
						_cartesianToPolar(center,arcPositions[i][0]).theta,
						_cartesianToPolar(center,arcPositions[i][1]).theta
					]);

					//Calculating first set of increments
					increments.push(self._getNextIncrement(self._pathNodes[i],
							targetAngles[i],
						(i === index)? radius*1.05 : null));
				}


				function drawIncrement(){
					
					for (var i = 0; i < increments.length; i++) {
						if(increments[i] !== null)
							self._pathNodes[i].setAttribute('d', increments[i]);
					};

					increments = [];
					var nextFrameRequestNeeded = false;

					//Get the next set of increments
					for(i=0; i < self._pathNodes.length; i++){
						
						increments.push(self._getNextIncrement(self._pathNodes[i],
							targetAngles[i],
							(i === index)? radius*1.05 : null));

						if(increments[i] !== null){
							nextFrameRequestNeeded = true;
						}
					}

					//if increments has one non-null entry
					if(nextFrameRequestNeeded)
						_requestAnimationFrame(drawIncrement);
					else{
						self._setDataAttributes(state,index);
						if(callback)
							callback();
					}
				}

				_requestAnimationFrame(drawIncrement);
			}
		}


		//Calculate arc start-end positions for each pie based on the state.
		function _getArcPositionsForState(state,index){

			var self = this,
			center = self._center,
			radius = self._radius,
			baseAngle = self._angles.baseAngle,
			expandedAngle = self._angles.expandedAngle,
			shrunkAngle = self._angles.shrunkAngle,
			arcPositions = [],angleOffset;

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
						angleOffset = -1 * (index * baseAngle);
						angleOffset += expandedAngle/2 + index * shrunkAngle;
					}

					for(var i=0;i<stats.length;i++){

						var arcPoints = [ _polarToCartesian(center,radius,angleOffset) ]; //Pushing the start point

						if(i === index){
							angleOffset -= expandedAngle;

							if(angleOffset < -2 * Math.PI)
								angleOffset += 2 * Math.PI;

							arcPoints.push(_polarToCartesian(center,radius,angleOffset));
							
						}else{
							angleOffset -= shrunkAngle;

							if(angleOffset < -2*Math.PI)
								angleOffset += -2*Math.PI;

							arcPoints.push(_polarToCartesian(center,radius,angleOffset));
							
						}
						arcPositions.push(arcPoints);
					}
			}

			return arcPositions;
		}

		function _getNextIncrement(el,targetAngles,targetRadius){
			
			var self = this,
			center = self._center,
			radius = targetRadius || self._radius,
			pieTargetAngles = [];
			currentArcPoints = _getArcCoordinates(el);

			Array.prototype.push.apply(pieTargetAngles,targetAngles)
			
			var sourceAngles = [ _cartesianToPolar(center,currentArcPoints[0]).theta,
				_cartesianToPolar(center,currentArcPoints[1]).theta
			];			

			if(Math.abs(pieTargetAngles[0] - sourceAngles[0]) <= Math.pow(10,-10)  && 
				Math.abs(pieTargetAngles[1] - sourceAngles[1]) <= Math.pow(10,-10)){
				//If source and target angles are equal to precision of 10 decimals, stop the increments.
				return null;
			}

			//Calculate shorter route to the targetAngles.
			if(Math.abs(pieTargetAngles[0] - sourceAngles[0]) > Math.PI){
				if(pieTargetAngles[0] < sourceAngles[0])
					pieTargetAngles[0] += 2 * Math.PI;
				else
					sourceAngles[0] += 2 * Math.PI;
			}

			if(Math.abs(pieTargetAngles[1] - sourceAngles[1]) > Math.PI){
				if(pieTargetAngles[1] < sourceAngles[1])
					pieTargetAngles[1] += 2 * Math.PI;
				else
					sourceAngles[1] += 2 * Math.PI;
			}				

			if(sourceAngles[0] < pieTargetAngles[0])
				sourceAngles[0] = Math.min(sourceAngles[0]+0.1,pieTargetAngles[0]);
			else if(sourceAngles[0] > pieTargetAngles[0])
				sourceAngles[0] = Math.max(sourceAngles[0]-0.1,pieTargetAngles[0]);

			if(sourceAngles[1] < pieTargetAngles[1])
				sourceAngles[1] = Math.min(sourceAngles[1]+0.1,pieTargetAngles[1]);
			else if(sourceAngles[1] > pieTargetAngles[1])
				sourceAngles[1] = Math.max(sourceAngles[1]-0.1,pieTargetAngles[1]);

			return _getPathDescForArcPositions(center,radius,
					_polarToCartesian(center,radius,sourceAngles[0]),
					_polarToCartesian(center,radius,sourceAngles[1]));	

		}
		

		function _getPathDescForArcPositions(center, radius, startPoint, endPoint) {
			var points = 'M' + center.x + ',' + center.y;

			points += ' L ' + startPoint.x + ' ' + startPoint.y;

			points += ' A ' + radius + ' ' + radius +
				' 1 0 1 ' + endPoint.x + ' ' + endPoint.y;
			
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
				r: Math.sqrt(Math.pow(point.y - center.y,2) + Math.pow(point.x - center.x,2)),
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

		function _setDataAttributes(state,index){

			var self  = this;

			for(var i=0;i<self._pathNodes.length;++i){
					if(state === 'normal')
						self._pathNodes[i].setAttribute('data-state',state);
					else if(state === 'expand' && i === index)			
						self._pathNodes[i].setAttribute('data-state',state);
					else
						self._pathNodes[i].setAttribute('data-state','shrink');
			}			
		}

		function _requestAnimationFrame(callback){
			var requestAnimationFrame = window.requestAnimationFrame
			    || window.webkitRequestAnimationFrame
			    || window.mozRequestAnimationFrame
			    || window.msRequestAnimationFrame
			    || function(callback) { return setTimeout(callback, 1000 / 60); };

			    requestAnimationFrame(callback);
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