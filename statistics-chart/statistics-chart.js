/*
To use in an Angular app, use the directive 'areaChart' as is. Else, jump to the link function and use that to just get the SVG rendering.
*/

var myApp = angular.module('myApp',[])
    .run(function($rootScope) {
        $rootScope.values = [
            { key:'Jackson Hole' , count: 29 },
            { key:'Lost Trail - Powder Mtn' , count: 15 },
            { key:'Magic Mountain' , count: 18 },
            { key:'Stevens Pass Resort' , count: 22 },
       { key:'Grand Targhee Resort' , count: 13 }
        ];
    })
    .directive('areaChart', [
        function() {

            return {
                restrict: 'AE',
                scope: {
                    'values': '=',
                    'color': '@'
                },

                link: function(scope, element, attrs) {

                    var values = scope.values;

                    var svgEl = document.createElementNS('http://www.w3.org/2000/svg','svg');
                    svgEl.setAttribute('style','width:100%;height:100%');

                    angular.element(element).html('');
                    element.append(svgEl);

                    var svgDimensions = {
                        width: svgEl.clientWidth,
                        height: svgEl.clientHeight
                    };

                    if(!values  || values.length <= 0)
                    return;

                    var highestCount = 0;

                    angular.forEach(values, function(value, index) {
                      if (highestCount < value.count)
                        highestCount = value.count;
                    });

                    highestCount *= 1.5; //Increase the highest count by 50% to keep some buffer.

                    var sourceX = 0,
                    increment = (svgDimensions.width / values.length) * 0.9,
                    peakWidth = increment * 1.2; //15% overlap of peaks.

                    //animating the numbers
                    var animateNumber = function(textNode,number,duration){
                                var current = 0;
                                var timer = setInterval(function(){
                                    textNode.innerHTML = current++;
                                    if(current>number)
                                        clearTimeout(timer);
                                },duration/number);
                    };

                    angular.forEach(values, function(stage, index) {

                        var peakHeight = stage.count * svgDimensions.height;
                        peakHeight /= highestCount;

                          var polygonEl = document.createElementNS('http://www.w3.org/2000/svg','polygon'),
                          animateEl = document.createElementNS('http://www.w3.org/2000/svg','animate');

                          var animateFromPoints = sourceX+','+ (svgDimensions.height * 0.8);
                          animateFromPoints += ' ' + (sourceX + peakWidth / 2)+ ',' + (svgDimensions.height * 0.8);
                          animateFromPoints += ' ' + (sourceX + peakWidth)+ ',' + (svgDimensions.height * 0.8);

                          //Creating animation tag
                          var animateToPoints = sourceX+','+ (svgDimensions.height * 0.8);
                          animateToPoints += ' ' + (sourceX + peakWidth / 2)+ ',' + (svgDimensions.height * 0.8 - peakHeight);
                          animateToPoints += ' ' + (sourceX + peakWidth)+ ',' + (svgDimensions.height * 0.8);

                          animateEl.setAttribute('attributeName','points');
                          animateEl.setAttribute('dur','1200ms');
                          animateEl.setAttribute('fill','freeze');
                          animateEl.setAttribute('to',animateToPoints);
                          animateEl.setAttribute('repeatCount',1);
                          animateEl.setAttribute('calcMode',"spline");
                          animateEl.setAttribute('keySplines','0 0.75 0.25 1');

                          polygonEl.setAttribute('points',animateFromPoints);
                          polygonEl.setAttribute('fill',scope.color || 'white');
                          polygonEl.setAttribute('fill-opacity','0.5');

                          polygonEl.appendChild(animateEl);

                          //Creating text tags
                          var keyTextEl = document.createElementNS('http://www.w3.org/2000/svg','text');
                          keyTextEl.innerHTML = stage.key;
                       keyTextEl.setAttribute('fill',scope.color || 'white');

                          var countTextEl = document.createElementNS('http://www.w3.org/2000/svg','text');
                          countTextEl.innerHTML = stage.count;                    countTextEl.setAttribute('fill',scope.color || 'white');

                          keyTextEl = svgEl.appendChild(keyTextEl);
                          countTextEl = svgEl.appendChild(countTextEl);
                          svgEl.appendChild(polygonEl);

                          //Position text based on its bounding size
                          keyTextEl.setAttribute('x',(sourceX + peakWidth / 2 - keyTextEl.getBBox().width/2));
                          keyTextEl.setAttribute('y',(svgDimensions.height * 0.8 + keyTextEl.getBBox().height/2 + 20));

                          //Position text based on its bounding size
                          countTextEl.setAttribute('x',(sourceX + peakWidth / 2 - countTextEl.getBBox().width/2));
                          countTextEl.setAttribute('y',(svgDimensions.height * 0.8 - peakHeight - 10));
                          animateNumber(countTextEl,stage.count,1200)

                          sourceX += increment;
                    });

                }
            };
        }
    ]);