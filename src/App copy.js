import React from 'react';
import base64 from 'base-64';
import axios from 'axios';

import * as d3 from 'd3';

import List from './components/List/List';
import './App.css';

class App extends React.Component {
	/**
	 * @function constructor
	 * @summary standard constructor function
	 * @param {*} props 
	 */
	constructor(props) {
		super(props);
		/** Defining the initial state **/
		this.state = {};
		/** Creating a reference to be later used for the graph **/
		this.myRef = React.createRef();
	}

	/**
	 * @function performAxiosFetch
	 * @param {*} args arguments
	 * @returns void
	 */
	performAxiosFetch = ({ ...args	}) => {
		let username = 'ReactTest';
		let password = '2020-June-Round2';
		/** Joining the params into a string */
		let queryFragment = Object.keys(args.params)
			.map(k => (k) + '=' + (args.params[k]))
			.join('&');

		let url = `${args.url}?${queryFragment}`;

		/** Setting up a Axios GET call */
		axios.get(url, {
				/** Auth header */
				headers: {
					'Authorization': 'Basic ' + base64.encode(username + ':' + password)
				}
			})
			.then((response) => {
				args.successCallBack && args.successCallBack(response);
			})
			.catch((error) => {
				args.errorCallBack && args.errorCallBack(error);
			})
	}

	/**
	 * @function fetchListData
	 * @summary Fetches the data for the initial list options
	*/
	fetchListData = () => {
		let _this = this;
		/** Query params to be sent alongside the url **/
		let requestParams = {
			start_time: '2021-01-26T10:00:00.000Z',
			end_time: '2021-01-26T11:00:00.000Z',
			identifier: '/System/Core/Examples/Assignment'
		}
		
		/** Query URL */
		let url = 'https://vps04.inmation.eu:8002/api/v2/read';

		/** Calling the fetch function */
		_this.performAxiosFetch({
			url: url,
			params: requestParams,
			successCallBack: (response) => {
				/** Setting the state */
				_this.setState({
					..._this.state,
					listData: response.data.data[0]
				})
			},
			errorCallBack: (error) => {
				console.error(error);
			}
		});
	}

	/**
	 * @function fetchListItemData
	 * @summary fetches the data on click of a list element
	 * @param {*} mouseevent Click event
	 */
	fetchListItemData = (event) => {
		let _this = this;
		/** Fetching the text from the clicked list item */
		let listItemText = event.target.innerText;
		/** Query params to be sent alongside the url **/
		let requestParams = {
			start_time: '2021-01-26T10:00:00.000Z',
			end_time: '2021-01-26T11:00:00.000Z',
			identifier: `/System/Core/Examples/Demo%20Data/Process%20Data/${listItemText}`
		}
		/** Query URL */
		let url = 'https://vps04.inmation.eu:8002/api/v2/readhistoricaldata';

		/** Calling the fetch function */
		_this.performAxiosFetch({
			url: url,
			params: requestParams,
			successCallBack: (response) => {
				/** Setitng the state */
				_this.setState({
					..._this.state,
					mapData: response.data.data.items[0].intervals
				})
				/** Plotting the line graph */
				_this.drawLineGraph(_this.state.mapData);
			},
			errorCallBack: (error) => {
				console.error(error);
			}
		});
	}

	/**
	 * @function drawLineGraph
	 * @summary This function plots a line graph based on the data supplied
	 * @param {*} data 
	 */
	drawLineGraph = (data) => {
		/** SVG dimensions */
		let svgWidth = 1200,
			svgHeight = 400;
		let margin = {
			top: 20,
			right: 20,
			bottom: 20,
			left: 120
		};
		let width = svgWidth = svgWidth - margin.left - margin.right;
		let height = svgHeight - margin.top - margin.bottom;

		const zoomed = (event) => {
			d3.select('#chartArea')
				.attr("transform", event.transform)
				.style("stroke-width", 2 / event.transform.k);

			d3.select('#gxLabel')
				.call(xAxis.scale(event.transform.rescaleX(x)));
		
			d3.select('#gyLabel')
				.call(yAxis.scale(event.transform.rescaleY(y)));
		}

		/**Removing the previously formed svg element */
		d3.selectAll('svg').remove();

		const zoom = d3.zoom()
			.scaleExtent([1, 2])
			.on("zoom", zoomed);

		/** Creating a new svg element */
		let svg = d3.select(this.myRef.current)
			.append('svg')
			.attr('width', svgWidth)
			.attr('height', svgHeight);

		/** Appending a group */
		let g = svg.append('g')
			.attr('transform', `translate(${[margin.left, margin.top]})`)
		
		/** Drawing up the X and Y axis */
		let x = d3.scaleLinear()
			.rangeRound([0, width - margin.left]);
		let y = d3.scaleLinear()
			.rangeRound([height, 0]);

		/** Drawing up a line using the T and V values in the provied data */
		let line = d3.line()
			.x(d => x(d.T))
			.y(d => y(d.V));

		/**Calculating the extent and setting up the domain of the axes */
		x.domain(d3.extent(data, d => d.T));
		y.domain(d3.extent(data, d => d.V));

		/** Setting up the X-axis */
			// let xAxis = d3.axisBottom(x)
			// 	.tickSize(-(svgHeight - (margin.bottom + margin.top)));
		g.append('g')
			.attr('id', 'gxLabel')
			.attr('class', 'axis')
			.attr('transform', `translate(0, ${height})`)
			//.call(xAxis)
			.call(d3.axisBottom(x).tickSize(-(svgHeight - (margin.bottom + margin.top))))
			.attr('style', 'stroke-width: 1px; font-size: 12px;')
			.attr('fill', 'none')
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', 3)
			.attr('dx', '0.7em')
			.attr('text-anchor', 'middle')
			.text('T');

		/** Setting up the Y-axis */
		// let yAxis = d3.axisLeft(y)
		// 	.tickSize(-(svgWidth - (margin.left + margin.right)));
		g.append('g')
			.attr('id', 'gYLabel')
			.attr('class', 'axis')
			//.call(yAxis)
			.call(d3.axisLeft(y).tickSize(-(svgWidth - (margin.left + margin.right))))
			.attr('style', 'stroke-width: 1px; font-size: 12px;')
			.attr('fill', 'none')
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 3)
			.attr('dy', '0.7em')
			.attr('text-anchor', 'middle')
			.text('V');

		/** Setting up the line graph */
			g.append('path')
			.datum(data)
			.attr('id','chartArea')
			.attr('fill', 'none')
			.attr('stroke', '#00b04b')
			.attr('stroke-linejoin', 'round')
			.attr('stroke-linecap', 'round')
			.attr('stroke-width', '2')
			.attr('d', line);

		/** Plotting the dots */
		var div = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

		/** Plotting dots on the line with tooltip */
		g.append('g')
			.selectAll('dot')
			.data(data)
			.enter()
			.append('circle')
			.style('fill', '#f99e1a')
			.attr('r', 4)
			.attr('cx', d => x(d.T))
			.attr('cy', d => y(d.V))
			.style('opacity', '0')
			.on('mouseover', (event, d) => {
				div.transition().duration(200).style('opacity', 1)
				div.html('<p>T	: ' + d.T + '</p><p>V: ' + d.V + '</p>')
					.style('left', `${event.clientX + 20}px`)
					.style('top', `${event.clientY + 20}px`)
				event.target.style.opacity = 1;
			})
			.on('mouseout', (event, d) => {
				div.style('opacity', '0');
				event.target.style.opacity = 0;
			});	
	}

	/**
	 * @function componentDidMount
	 * @summary Lifecycle method which is called on page load
	 */
	componentDidMount() {
		this.fetchListData();
	}

	/**
	 * @function render 
	 * @summary The standard render method
	 */
	render() {
		let list = null;

		if (this.state.listData) {
			list = <List
				clicked={(e) => this.fetchListItemData(e)}
				items = {this.state.listData}
			/>;
		}

		return (
			<div className='container'>
				{list}
	  			{/** Container for the line graph **/}
	  			<div ref={this.myRef}></div>
			</div>
		);
	}
}

export default App;