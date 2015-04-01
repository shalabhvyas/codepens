function PieInfographic(stats) {
	this.stats = stats;
	this.render = render;
	this.currentPie = 0;
	this._angles = {};

	function render(parentEl) {

		var self = this;

		var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
			parentGroupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
			svgDimensions, center, radius,
			baseAngle, arcStartPoint, arcEndPoint,
			expandedAngle, expArcStartPoint, expArcEndPoint,
			shrunkAngle, shrArcStartPoint, shrArcEndPoint;

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


		//Draw all the arcs baselined on X-axis.
		arcStartPoint = _polarToCartesian(center,radius,baseAngle/2);
		arcEndPoint = _polarToCartesian(center,radius,-baseAngle/2);		
		
		//Calculating co-ordinates when an arc is expanded
		expArcStartPoint = _polarToCartesian(center,radius*1.025,expandedAngle / 2);
		expArcEndPoint = _polarToCartesian(center,radius*1.025,-expandedAngle / 2);

		var intermediateExpArcStartPoint = _polarToCartesian(center,radius,expandedAngle/4),
		intermediateExpArcEndPoint = _polarToCartesian(center,radius,-expandedAngle/4);

		shrArcStartPoint = _polarToCartesian(center,radius,shrunkAngle / 2);
		shrArcEndPoint = _polarToCartesian(center,radius,-shrunkAngle / 2);
	
		//Create pie shape definition
		var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path'),
			pathPoints = _getPointsForPie(center, radius, arcStartPoint, arcEndPoint);

		pathEl.setAttribute('d', pathPoints);

		//Create pie-expansion animation
		var animExpand = _createAnimElement('animate', {
			'attributeName': 'd',
			'attributeType': 'XML',
			'dur': '2s',
			'begin': 'indefinite',
			'fill': 'freeze',
			'to': _getPointsForPie(center, radius, expArcStartPoint, expArcEndPoint),			
			'data-action': 'expand'
		});

		var animShrink = animExpand.cloneNode(true);
		animShrink.setAttribute('to', _getPointsForPie(center, radius, shrArcStartPoint, shrArcEndPoint));
		animShrink.setAttribute('dur', '5s');
		animShrink.setAttribute('data-action', 'shrink');


		var animNormal = animExpand.cloneNode(true);
		animNormal.setAttribute('to', _getPointsForPie(center, radius, arcStartPoint, arcEndPoint));
		animNormal.setAttribute('dur', '0.005s');
		animNormal.setAttribute('data-action', 'normal');

		pathEl.appendChild(animExpand);
		pathEl.appendChild(animShrink);
		pathEl.appendChild(animNormal);

		for (var i = 0; i < stats.length; i++) {
			var arcGroupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			arcGroupEl.appendChild(pathEl.cloneNode(true));
			arcGroupEl.setAttribute('fill', stats[i].color);
			arcGroupEl.setAttribute('transform', 'rotate(' + ((i * baseAngle) * 180 / Math.PI) + ' ' + center.x + ' ' + center.y + ')');
			arcGroupEl.setAttribute('data-state', 'normal'); //Could be normal,expanded or shrunk.

			var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			textEl.innerHTML = "#"+(i+1);
			textEl.setAttribute('fill','black');
			textEl.setAttribute('x', center.x + radius/2);
			textEl.setAttribute('y', center.y);


			arcGroupEl.appendChild(textEl);

			arcGroupEl.addEventListener('click', _handleClickOnPie);

			parentGroupEl.appendChild(arcGroupEl);
		}

		/*
			Animation order:
			Rotate the pie to bring the clicked pie on the right,centered.
			Expand the clicked pie and shrink the other pies together. (Sync the animations with times)
			Keep the text un-rotated in the individual pies        	
		*/

		function _handleClickOnPie(event) {

			var pieEl = event.currentTarget,
				allPies = pieEl.parentNode.childNodes,
				state = pieEl.getAttribute('data-state'),
				angleFrom = self._angles.groupRotationAngle || 0,
				angleTo;

			if (['normal', 'shrunk'].indexOf(state) !== -1) {

				self.currentPie = Array.prototype.indexOf.call(pieEl.parentNode.childNodes, pieEl);

				//Bring all pies to normal size
				for (var i=0;i<allPies.length;i++) {
					_actionOnPie(allPies[i], 'normal');
				}

				//Wait for 1500ms for pies to return to normal state.
				setTimeout(function() {

					angleTo = (-1 * _getRotationAngleForPie(self.currentPie, 'normal'));

					angleTo += Math.ceil(angleFrom / 360) * 360;

					if (angleTo > angleFrom)
						angleTo -= 360; //angleTo should always be less than angleFrom for a anti-clockwise rotation.


					pieEl.parentNode.addEventListener('transitionend', function(event) {
						
						
						//Expand the pie clicked.
						_actionOnPie(pieEl, 'expand');

					
						//Shrink all other pies.
						for (var otherPie = allPies[0]; otherPie; otherPie = otherPie.nextSibling) {
							if (otherPie !== pieEl && otherPie.tagName === 'g') {
								_actionOnPie(otherPie, 'shrink');
							}
						}

						event.target.removeEventListener(event.type, arguments.callee);
					});


					//Rotate the entire graphic to align the clicked pie with the X-axis.
					pieEl.parentNode.style.transform = 'rotate(' + (angleTo) + 'deg)';
					self._angles.groupRotationAngle = angleTo;

				}, 250);

				

			}
		}

		function _actionOnPie(pie, action) {

			var anim = pie.querySelector('animate[data-action="' + action + '"]'),
				indexInParent = Array.prototype.indexOf.call(pie.parentNode.childNodes, pie),
				currentState = pie.getAttribute('data-state');

			if((currentState === 'expanded' && action === 'expand') ||
				(currentState === 'shrunk' && action === 'shrink') ||
				(currentState === 'normal' && action === 'normal'))
				return;	

			var animRotatePieEl = _createAnimElement('animateTransform', {
				'attributeName': 'transform',
				'attributeType': 'XML',
				'type': 'rotate',
				'repeatCount': 1,
				'dur': anim.getAttribute('dur'),
				'fill': 'freeze',
				'to': _getRotationAngleForPie(indexInParent, action) + ' ' + center.x + ' ' + center.y
			});

			pie.appendChild(animRotatePieEl);

			if (anim) {
				anim.beginElement();
			}

			if (action === 'expand') {
				pie.setAttribute('data-state', 'expanded');
			} else if (action === 'shrink') {
				pie.setAttribute('data-state', 'shrunk');
			} else if (action === 'normal') {
				pie.setAttribute('data-state', 'normal');
			}
		}

		function _getPointsForPie(center, radius, startPoint, endPoint) {
			var points = 'M' + center.x + ',' + center.y;

			points += ' L ' + startPoint.x + ' ' + startPoint.y;

			points += ' A ' + radius + ' ' + radius +
				' 1 0 1 ' + endPoint.x + ' ' + endPoint.y;

			points += ' M ' + endPoint.x + ' ' + endPoint.y;
			points += ' L ' + center.x + ' ' + center.y;
			points += ' Z';

			return points;
		}

		//Calculate angle for pie at an index with the given target state based on current expanded pie.
		function _getRotationAngleForPie(index, targetState) {
			var baseOffset = 0,
				angle;

			if (targetState === 'shrink')
				baseOffset = self._angles.shrunkAngle / 2;
			else if (targetState === 'expand')
				baseOffset = self._angles.expandedAngle / 2;
			else if (targetState === 'normal')
				baseOffset = self._angles.baseAngle / 2;

			if (targetState === 'normal') {
				baseOffset -= self._angles.baseAngle / 2;
			} else if (self.currentPie === 0) {
				baseOffset -= self._angles.expandedAngle / 2;
			} else {
				baseOffset -= self._angles.shrunkAngle / 2;
			}

			angle = baseOffset;

			if (targetState === 'normal') {
				angle += index * self._angles.baseAngle;
			} else if (index <= self.currentPie) {
				angle += index * self._angles.shrunkAngle
			} else {
				angle += (index - 1) * self._angles.shrunkAngle + self._angles.expandedAngle;
			}

			return angle * 180 / Math.PI;
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