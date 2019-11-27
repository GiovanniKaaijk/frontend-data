import { prepareData } from './prepareData';
import { changeCityToCountry } from './changeCityToCountry'
import { getQuery } from './getQuery';
import { countTracker } from './countTracker';
import { historicMoments } from './historicMoments'; 
const zoom = d3.zoom().scaleExtent([1,16]);

const svg = d3.select('svg').append('g')
const g = d3.select('g');

const worldMap = d3.geoNaturalEarth1(); //natural earth gives a good realistic view of the map
const pathCreator = d3.geoPath().projection(worldMap);
const api = 'https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-02/sparql';
const playButton = document.querySelector('.play')
const currentSlider = document.querySelector('.current');

let state = {
    countryArray: [],
    cityArray: [],
    dataCount: [],
    highestCount: 0,
    uniqueNodes: [],
    currentTime: 0,
    nodeWidth: 0,
    stopTimer: false,
    timeFilter: {
        firstValue: 0,
        secondValue: 2200
    }
}

//Create a div inside the parent group to show country name + object count
let tooltip = d3.select(".wrapper")
  .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")

// Map zoom function
svg.call(zoom.on('zoom', () => {
    g.attr('transform', d3.event.transform);
}))

// Fetch JSON with all capital cities + countries
const fetchCityToCountry = (fetchurl) => {
    fetch(fetchurl)
    .then(response => response.json())
    .then(json => {    
        state.cityArray = json;
    })
}
fetchCityToCountry('https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-capital-city.json')

// Fetch map layout JSON + create an array containing unique countries
const rendermapLayout = () => {     
    d3.json('https://enjalot.github.io/wwsd/data/world/world-110m.geojson')
        .then(json => {
            json.features.forEach((feature, i) => {
                state.countryArray.push(feature.properties.name);
                state.dataCount.push(feature)
                state.dataCount[i].properties.count = 0;
            });
        })
};
rendermapLayout(); 

// push unique values to array for the timeline later one
const pushToArray = function(element) {
    let node = element.textContent
    state.uniqueNodes.push(node)
}

// Take first + second value from timeline click to put in an array later on
const changeQuery = function() {
  	currentSlider.classList.contains('active') ? null : currentSlider.classList.add('active')
    state.stopTimer = true
    let index = state.uniqueNodes.indexOf(this.textContent)
    state.currentTime = index
    currentSlider.style.left = state.nodeWidth * index + 'px';
    let content = state.uniqueNodes[index]
        content = content.split("-");
        let selectedTime = {
            firstValue: content[0],
            secondValue: content[1]
        }
        updateTime(selectedTime)
}

// Clean the date format from xxxx-xxxx to one number
const dateFormat = date => {
    date = date.split('-')
    date[1] = date[1].trim()
    date[0] = parseInt(date[0])
    date[1] = parseInt(date[1])
    date = Math.round((date[0] + date[1]) / 2)
}

// Updates time filter
const updateTime = (time) => {
    state.timeFilter = {
        firstValue: time.firstValue,
        secondValue: time.secondValue
    }
    updateData()
}

function renderLegenda() {
 let legenda = svg.append('g')
      .attr('class', 'legenda')
 legenda 
 .append('text')
      .text("Max:")
      .attr('x', '20')
      .attr('y', '15');
  legenda
  	.append('rect')
  		.attr('x', '60')
  		.attr('y', '0')
  		.attr('class', 'legenda legenda-max')
  		.attr('fill', 'red')
   legenda 
 .append('text')
      .text("Min:")
      .attr('x', '20')
      .attr('y', '40');
  legenda
  	.append('rect')
  		.attr('x', '60')
  		.attr('y', '25')
  		.attr('class', 'legenda legenda-min')
  		.attr('fill', 'white')
  		.attr('')
}

// Render all elements on the SVG
const renderSVG = () => {
  	renderLegenda()
    g.append('path')
        .attr('class', 'sphere')
        .attr('d', pathCreator({type: 'Sphere'}));
    let scaleColor = d3.scaleSqrt()
        .domain([0, (state.highestCount)])
        .range(['#ffffff', 'red']);
    g.selectAll('path')
    .data(state.dataCount) 
    .enter()
    .append('path')
        .attr('d', pathCreator)
        .attr('class', 'country')
        .style('stroke', 'black')
        .style('stroke-opacity', 0.2)
        .style('fill', "white")
        .on('mouseover', function() {
            d3.select(this)
                .style('stroke-opacity', 1)
        })
        .on('mouseout', function() {
            d3.select(this)
                .style('stroke-opacity', 0.2)
            tooltip.style("visibility", "hidden")
        })
        .on("click", (d) => { 
						historicMoments(d, state.timeFilter.firstValue, state.timeFilter.secondValue);
            tooltip
            .style("visibility", "visible")
            .text(d.properties.name + ': ' + d.properties.count + ' objecten')
        })
        .on("mousemove", (d) => {
            tooltip
            .style("top", (event.pageY-40)+"px")
            .style("left",(event.pageX-35)+"px")})
        .transition()
        .duration(300)
        .style('fill', (d) => scaleColor(d.properties.count))
        
        playButton.addEventListener('click', playTimeline)
}

// Run the SPAQRL query, render every element, create counts for the heatmap
const runQuery = (api) => {
  	let query = getQuery(state.timeFilter.firstValue, state.timeFilter.secondValue)
    // Call the url with the query attached, output data
    fetch(api + "?query=" + encodeURIComponent(query) + "&format=json")
    .then(res => res.json())
    .then(json => {
        //change results placename to match more items in the following forEach. If item is not in city JSON -> delete
        let results = json.results.bindings;
        console.log(results)
        results.forEach((result, i) => {
            if(result.date.value.includes('-')) {
                dateFormat(result.date.value)
            }
            results[i] = {
                placeName: result.placeName.value,
                date: result.date.value
            }
        })
        results = changeCityToCountry(results, state.countryArray, state.cityArray)
      	let tracker = countTracker(results, state.dataCount, state.countryArray)
				state.dataCount = tracker.dataCount;
				state.highestCount = tracker.highestCount;
        renderSVG()
    })
};
runQuery(api, getQuery());

// Create eventlistener for every timeline object
const timeLine = () => {
    let nodes = document.querySelectorAll('.timeline p')
    let currentWidth = document.querySelector('.timeline').offsetWidth / nodes.length
    state.nodeWidth = currentWidth
    currentSlider.style.width = state.nodeWidth+'px'
    nodes.forEach(element => {
        pushToArray(element)
        element.addEventListener('click', changeQuery)
    })
}
timeLine();

// Updates data
async function updateData() {
  	let data = await prepareData(state.timeFilter.firstValue, state.timeFilter.secondValue)
		let tracker = countTracker(data, state.dataCount, state.countryArray)
				state.dataCount = tracker.dataCount;
				state.highestCount = tracker.highestCount;
    let scaleColor = d3.scaleSqrt()
        .domain([0, (state.highestCount)])
        .range(['#ffffff', 'red']);
  
    svg.selectAll('g')
        .data(state.dataCount)
        .enter()
        .selectAll('.country')
        .transition()
        .duration(300)
        .style('fill', (d) => scaleColor(d.properties.count))
}

const playTimeline = () => {
    state.currentTime = 0
    state.stopTimer = false
    currentSlider.classList.contains('active') ? null : currentSlider.classList.add('active')
    callbackFn(0, callbackFn)
}

function callbackFn(index, callback) {
    let length = state.uniqueNodes.length
    setTimeout(() => {
        currentSlider.style.left = state.nodeWidth * index + 'px';
    }, 300);
    
    let content = state.uniqueNodes[state.currentTime]
    content = content.split('-')
    console.log(content)
    let selectedTime = {
        firstValue: content[0],
        secondValue: content[1]
    }
    updateTime(selectedTime)
    setTimeout(() => {
        if(index < state.uniqueNodes.length-1 && state.stopTimer == false){
            callbackFn(index + 1, callback)
        }
    }, 1500);
    state.currentTime != length-1 ?
        state.currentTime += 1 :
        state.currentTime = 0
}
