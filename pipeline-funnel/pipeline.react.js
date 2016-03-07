/**
 * Pipeline Visualization used to denote a pipeline with stages, counts and values.
 * @extends {React#Component}
 */
class PipelineComponent extends React.Component {

  /**
   * creates the instance
   * @param  {Object} props   props passed to the component
   * @param  {Array}  props.data Array of segments to be drawn from left to right.
   * @param  {String} props.outerValueIdentifier            property to populate the number at the bottom-right of each segment
   * @param  {String} props.outerSecondaryValueIdentifier   property to populate the number at the bottom-left of each segment
   * @param  {String} props.outerLabelIdentifier            property to populate the label in the bottom-left of each segment
   * @param  {String} props.innerValueIdentifier            property to populate the number in the center of each segment
   * @param  {String} props.compareValueIdentifier          property to compare the inner value with for drawing the inner segment (defaults to outerValueIdentifier)
   * @param  {Object} context context received from the parent
   */
  constructor(props, context) {
    super(props, context)
  }

  /**
   * creates a new SVG element with provided tag and attributes
   * @static
   * @param  {String} tag    SVG tag to create an element of
   * @param  {Object} attrs  Attributes to attach to the created element
   * @return {Element}       SVG element creates
   */
  static createSVGElement(tag, attrs) {
    let el = document.createElementNS('http://www.w3.org/2000/svg', tag);

    if (attrs) {

      Object.keys(attrs).forEach(key => {
        el.setAttribute(key, attrs[key]);
      })

    }

    return el;
  }

  /**
   * computes the dimensions of the element to render the visual
   * @return {Object} Object {width, height} to render into
   */
  _computeDimensions() {

    let svgEl = React.findDOMNode(this.refs.chartElement);

    return {
      width: svgEl.clientWidth || svgEl.parentNode.clientWidth,
      height: svgEl.clientHeight || svgEl.parentNode.clientHeight
    };

  }

  /**
   * constructs a polygon with specified points and attributes
   * @param  {Array}  points      corner co-ordinates of the polygon
   * @param  {Object} attributes  attributes to assign to the polygon
   * @return {SVGPolygonElement}  SVG polygon element
   */
  _constructPolygon(points, attributes) {

    let computedAttributes = _.assign(attributes, {
      points: _.reduce(points, function(pointString, point) {
        return pointString + (point.x + ',' + point.y + ' ');
      }, '')
    });

    return PipelineComponent.createSVGElement('polygon', computedAttributes);
  }

  /**
   * constructs the outer band based on the dimensions of the container and
   * the padding to be left on the top-bottom and extra padding on the top-bottom
   * for the right end.
   * @param  {Object} svgDimensions               dimensions of the outer container
   * @param  {Number} bandPercentageHeightPadding % padding to be left at the top and bottom
   * @param  {Number} rightOuterBandPadding       % padding to be left at the top and bottom on the right end
   * @return {SVGPolygonElement}                  Construcuted SVG Polygon Element as the outer band
   */
  _constructOuterPolygon(svgDimensions, bandPercentageHeightPadding, rightOuterBandPadding) {

    let outerPolygonPoints = [];

    outerPolygonPoints.push({
      x: 0,
      y: svgDimensions.height *
        bandPercentageHeightPadding
    });
    outerPolygonPoints.push({
      x: 0,
      y: svgDimensions.height *
        (1 - bandPercentageHeightPadding)
    });

    outerPolygonPoints.push({
      x: svgDimensions.width,
      y: svgDimensions.height * (1 -
        bandPercentageHeightPadding -
        rightOuterBandPadding)
    });
    outerPolygonPoints.push({
      x: svgDimensions.width,
      y: svgDimensions.height * (
        bandPercentageHeightPadding +
        rightOuterBandPadding)
    });

    let animationStartPoints = _.cloneDeep(outerPolygonPoints);

    _.forEach(animationStartPoints, point => {
      point.y = svgDimensions.height / 2;
    });

    let animationEl = PipelineComponent.createSVGElement('animate', {
      attributeName: 'points',
      dur: '1800ms',
      begin: '200ms',
      fill: 'freeze',
      keySplines: '0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1',
      keyTimes: '0;0.22;0.33;0.55;0.66;0.88;1',
      calcMode: 'spline',
      to: _.reduce(outerPolygonPoints, function(pointString, point) {
        return pointString + (point.x + ',' + point.y + ' ');
      }, '')
    });

    let outerPolygon = this._constructPolygon(animationStartPoints, {
      fill: '#F9F9F9',
      stroke: '#EEEEEE',
      strokeWidth: 1
    });

    outerPolygon.appendChild(animationEl);

    return outerPolygon;

  }

  /**
   * constructs the inner band based on the dimensions of the container and
   * the padding to be left on the top-bottom and extra padding on the top-bottom
   * for the right end.
   * @param  {Object} svgDimensions               dimensions of the outer container
   * @param  {Number} bandPercentageHeightPadding % padding to be left at the top and bottom
   * @param  {Number} rightOuterBandPadding       % padding to be left at the top and bottom on the right end
   * @return {SVGPolygonElement}                  Construcuted SVG Polygon Element as the inner band
   */
  _constructInnerPolygon(svgDimensions, bandPercentageHeightPadding, rightOuterBandPadding) {

    let self = this;

    let bandWidth, bandCount, maxBandHeight, center, innerPolygonPoints;

    maxBandHeight = svgDimensions.height * (1 -
      2 * bandPercentageHeightPadding);
    bandCount = this.props.data.length;
    bandWidth = svgDimensions.width / bandCount;
    center = {
      x: 0,
      y: svgDimensions.height / 2
    };

    innerPolygonPoints = [];

    // Insert points for the last edge.
    innerPolygonPoints.splice(innerPolygonPoints.length / 2, 0, {
      x: 0,
      y: svgDimensions.height * (bandPercentageHeightPadding * 1.5)
    });

    innerPolygonPoints.splice(innerPolygonPoints.length / 2 + 1, 0, {
      x: 0,
      y: svgDimensions.height * (1 - (
        bandPercentageHeightPadding * 1.5))
    });

    _.forEach(this.props.data, (dataPoint, index) => {
      let currentBandWidth = bandWidth * (index + 1);
      let outerBandHeight = maxBandHeight -
        ((2 * rightOuterBandPadding * currentBandWidth / svgDimensions.width));

      let innerBandHeight = outerBandHeight * dataPoint[self.props.innerValueIdentifier] /
        dataPoint[self.props.compareValueIdentifier || self.props.outerValueIdentifier];

      innerPolygonPoints.splice(innerPolygonPoints.length / 2, 0, {
        x: center.x + currentBandWidth,
        y: center.y - innerBandHeight / 2
      });

      innerPolygonPoints.splice(innerPolygonPoints.length / 2 + 1, 0, {
        x: center.x + currentBandWidth,
        y: center.y + innerBandHeight / 2
      });

    });

    let animationStartPoints = _.cloneDeep(innerPolygonPoints);

    _.forEach(animationStartPoints, point => {
      point.y = svgDimensions.height / 2;
    });

    let animationEl = PipelineComponent.createSVGElement('animate', {
      attributeName: 'points',
      dur: '1500ms',
      begin: '100ms',
      fill: 'freeze',
      keySplines: '0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1',
      keyTimes: '0;0.22;0.33;0.55;0.66;0.88;1',
      calcMode: 'spline',
      to: _.reduce(innerPolygonPoints, (pointString, point) => {
        return pointString + (point.x + ',' + point.y + ' ');
      }, '')
    });

    let innerPolygon = this._constructPolygon(animationStartPoints, {
      fill: '#EBA046',
      stroke: '#EEEEEE',
      strokeWidth: 1
    });

    innerPolygon.appendChild(animationEl);

    return innerPolygon;
  }

  /**
   * constructs the segment-boundaries based on the dimensions and number of segments needed.
   * @param  {Object}                 svgDimensions dimensions of the outer container
   * @return {Array<SVGPathElement>}  array of the segment vertical boundaries as SVG path elements
   */
  _constructPartitions(svgDimensions) {
    let partitions = [];
    let bandCount = this.props.data.length,
      bandWidth = svgDimensions.width / bandCount;

    for (let index = 0; index < bandCount; index++) {

      let xOffset = index * bandWidth;

      partitions.push(PipelineComponent.createSVGElement('path', {
        d: 'M' + xOffset + ' 0 L' + xOffset + ' ' + svgDimensions.height,
        stroke: '#ECECEC',
        strokeWidth: 1
      }));
    }

    return partitions;
  }

  /**
   * constructes the array of svg elements for the numbers at the center of each segment
   * @param  {Object} svgDimensions               dimensions of the outer container
   * @return {Array<SVGTextElement>}              Array of SVG text elements to render for the numbers
   */
  _constructInnerBandValues(svgDimensions) {

    if (!this.props.innerValueIdentifier) {
      return []
    }

    let innerBandValues = [];
    let bandCount = this.props.data.length,
      bandWidth = svgDimensions.width / bandCount;

    for (let index = 0; index < bandCount; index++) {

      let xOffset = (index + 0.5) * bandWidth;
      let textEl = PipelineComponent.createSVGElement('text', {
        x: xOffset,
        y: svgDimensions.height * 0.5,
        'dominant-baseline': 'central',
        'text-anchor': 'middle',
        'font-size': '24px',
        'fill': '#FFFFFF'
      });

      textEl.textContent = this.props.data[index][this.props.innerValueIdentifier];
      innerBandValues.push(textEl);
    }

    return innerBandValues;
  }

  /**
   * constructes the array of svg elements for the labels at the bottom-right of each segment
   * @param  {Object} svgDimensions               dimensions of the outer container
   * @param  {Number} bandPercentageHeightPadding % padding to be left at the bottom below the text element
   * @return {Array<SVGTextElement>}              Array of SVG text elements to render for the labels
   */
  _constructOuterBandLabels(svgDimensions, bandPercentageHeightPadding) {

    if (!this.props.outerLabelIdentifier) {
      return []
    }

    let outerBandLabels = [];
    let bandCount = this.props.data.length,
      bandWidth = svgDimensions.width / bandCount;

    for (let index = 0; index < bandCount; index++) {

      let xOffset = (index + 1) * bandWidth;
      let textEl = PipelineComponent.createSVGElement('text', {
        x: xOffset - 10,
        y: svgDimensions.height * (1 - bandPercentageHeightPadding * 0.3),
        'dominant-baseline': 'central',
        'text-anchor': 'end',
        'font-size': '11px',
        fill: '#B9BCC8'
      });

      textEl.textContent = this.props.data[index][
        this.props.outerLabelIdentifier
      ];
      outerBandLabels.push(textEl);
    }

    return outerBandLabels;
  }

  /**
   * constructes the array of svg elements for the numbers at the bottom-right of each segment
   * @param  {Object} svgDimensions               dimensions of the outer container
   * @param  {Number} bandPercentageHeightPadding % padding to be left at the bottom below the text element
   * @return {Array<SVGTextElement>}              Array of SVG text elements to render for the numbers
   */
  _constructOuterBandValues(svgDimensions, bandPercentageHeightPadding) {

    if (!this.props.outerValueIdentifier) {
      return []
    }

    let outerBandLabels = [];
    let bandCount = this.props.data.length,
      bandWidth = svgDimensions.width / bandCount;

    for (let index = 0; index < bandCount; index++) {

      let xOffset = (index + 1) * bandWidth;
      let textEl = PipelineComponent.createSVGElement('text', {
        x: xOffset - 10,
        y: svgDimensions.height * (1 - bandPercentageHeightPadding * 0.7),
        'dominant-baseline': 'central',
        'text-anchor': 'end',
        'font-size': '20px',
        fill: '#878B97'
      });

      textEl.textContent = this.props.data[index][
        this.props.outerValueIdentifier
      ];

      outerBandLabels.push(textEl);
    }

    return outerBandLabels;
  }

  /**
   * constructes the array of svg elements for the numbers at the bottom-left of each segment
   * @param  {Object} svgDimensions               dimensions of the outer container
   * @param  {Number} bandPercentageHeightPadding % padding to be left at the bottom below the text element
   * @return {Array<SVGTextElement>}              Array of SVG text elements to render for the numbers
   */
  _constructOuterBandSecondaryValues(svgDimensions, bandPercentageHeightPadding) {

    if (!this.props.outerSecondaryValueIdentifier) {
      return []
    }

    let outerBandLabels = [];
    let bandCount = this.props.data.length,
      bandWidth = svgDimensions.width / bandCount;

    for (let index = 0; index < bandCount; index++) {

      let xOffset = (index) * bandWidth;
      let textEl = PipelineComponent.createSVGElement('text', {
        x: xOffset + 5,
        y: svgDimensions.height * (1 - bandPercentageHeightPadding * 0.7),
        'dominant-baseline': 'central',
        'text-anchor': 'start',
        'font-size': '16px',
        fill: '#878B97'
      });

      textEl.textContent = this.props.data[index][
        this.props.outerSecondaryValueIdentifier
      ];

      outerBandLabels.push(textEl);
    }

    return outerBandLabels;
  }

  /**
   * constructes the array of svg elements for the titles of all the segnments
   * @param  {Object} svgDimensions               dimensions of the outer container
   * @param  {Number} bandPercentageHeightPadding % padding to be left at the top above the text element
   * @return {Array<SVGTextElement>}              Array of SVG text elements to render for the titles
   */
  _constructPartitionTitles(svgDimensions, bandPercentageHeightPadding) {

    let partitionTitles = [];
    let bandCount = this.props.data.length,
      bandWidth = svgDimensions.width / bandCount;

    for (let index = 0; index < bandCount; index++) {

      let xOffset = index * bandWidth;
      let textEl = PipelineComponent.createSVGElement('text', {
        x: xOffset + 10,
        y: svgDimensions.height * bandPercentageHeightPadding * 0.65,
        'dominant-baseline': 'central',
        'font-size': '16px',
        'fill': '#B9BCC8'
      });

      textEl.textContent = this.props.data[index].title;
      partitionTitles.push(textEl);
    }

    return partitionTitles;
  }

  /**
   * computes the dimensions of the container and creates the
   * SVG elements and glues them together
   */
  _renderPipeline() {

    let svgEl, svgDimensions,
      rightOuterBandPadding = 0.1,
      bandPercentageHeightPadding = 0.1;

    if (!this.props.data || this.props.data.length === 0) {
      return
    }

    svgEl = React.findDOMNode(this.refs.chartElement);

    //empty the SVG element for fresh rendering
    while (svgEl.firstChild) {
      svgEl.removeChild(svgEl.firstChild)
    }

    svgDimensions = this._computeDimensions();

    // Constructing outer polygon.
    svgEl.appendChild(this._constructOuterPolygon(svgDimensions,
      bandPercentageHeightPadding, rightOuterBandPadding));

    // Constructing inner polygon.
    svgEl.appendChild(this._constructInnerPolygon(svgDimensions,
      bandPercentageHeightPadding, rightOuterBandPadding));

    // Render partitions
    _.forEach(this._constructPartitions(svgDimensions), function(partition) {
      svgEl.appendChild(partition);
    });

    // Render partitions titles
    _.forEach(this._constructPartitionTitles(svgDimensions,
      bandPercentageHeightPadding), function(partitionTitle) {
      svgEl.appendChild(partitionTitle);
    });

    // Render inner band values
    _.forEach(this._constructInnerBandValues(svgDimensions),
      function(innerBandValue) {
        svgEl.appendChild(innerBandValue);
      });

    // Render outer band labels
    _.forEach(this._constructOuterBandLabels(svgDimensions,
      bandPercentageHeightPadding), function(outerBandLabel) {
      svgEl.appendChild(outerBandLabel);
    });

    // Render outer band values
    _.forEach(this._constructOuterBandValues(svgDimensions,
      bandPercentageHeightPadding), function(outerBandValue) {
      svgEl.appendChild(outerBandValue);
    });

    // Render outer band secondary values
    _.forEach(this._constructOuterBandSecondaryValues(svgDimensions,
      bandPercentageHeightPadding), function(outerBandValue) {
      svgEl.appendChild(outerBandValue);
    });
  }

  /**
   * called when the component is mounted.
   * calculates dimensions and renders the component here
   */
  componentDidMount() {
    this._renderPipeline()
  }

  /**
   * called when the component is re-rendered after receiving new props
   */
  componentDidUpdate() {
    this._renderPipeline()
  }

  /**
   * renders the component
   */
  render() {
    return ( < div className = 'chart-pipeline' >
      < svg ref = 'svgElement'
      ref = 'chartElement' >
      < /svg> < /div>
    );
  }

}

let stages = [{
  title: 'Requests Information',
  goal: 2000,
  actual: 1526,
  revenue: '$15M',
  revLabel: 'Potential Revenue'
}, {
  title: 'Begins Application',
  goal: 2000,
  actual: 903,
  revenue: '$1.5M',
  revLabel: ''
}, {
  title: 'Completes Application',
  goal: 2000,
  actual: 827,
  revenue: '$850K',
  revLabel: ''
}, {
  title: 'Enrolls',
  goal: 2000,
  actual: 499,
  revenue: '$575',
  revLabel: ''
}]

let pipelineComponent = (
  <PipelineComponent data = {stages}
    outerValueIdentifier = 'revenue'
    outerSecondaryValueIdentifier = 'revLabel'
    innerValueIdentifier = 'actual'
    compareValueIdentifier = 'goal'
    outerLabelIdentifier = 'goalLabel' >
  </PipelineComponent>)

React.render(pipelineComponent, document.body)