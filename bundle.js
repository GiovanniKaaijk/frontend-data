(function () {
  'use strict';

  async function prepareData(firstvalue, secondvalue){
    //Load the data and return a promise which resolves with said data
    let query = getQuery(firstvalue, secondvalue);
  	let endpoint = 'https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-02/sparql';
  	let data = await runNewQuery(endpoint, query);
    return data
  }

  async function runNewQuery(api, query) {
      return fetch(api + "?query=" + encodeURIComponent(query) + "&format=json")
      .then(res => res.json())
      .then(json => {
          let results = json.results.bindings;
          results.forEach((result, i) => {
              if(result.date.value.includes('-')) {
                  dateFormat(result.date.value);
              }
              results[i] = {
                  placeName: result.placeName.value,
                  date: result.date.value
              };
          });
        console.log(results);
        return results
      })
  }

  const dateFormat = date => {
      date = date.split('-');
      date[1] = date[1].trim();
      date[0] = parseInt(date[0]);
      date[1] = parseInt(date[1]);
      date = Math.round((date[0] + date[1]) / 2);
  };

  const getQuery = (firstvalue, secondvalue) => {
      return `PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    PREFIX geo: <http://www.opengis.net/ont/geosparql#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX gn: <http://www.geonames.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT ?cho ?placeName ?date WHERE {
        ?cho dct:spatial ?place .
        ?place skos:exactMatch/gn:parentCountry ?land .
        ?land gn:name ?placeName .
        ?cho dct:created ?date .
        FILTER(xsd:integer(?date) >= ${firstvalue} && xsd:integer(?date) <= ${secondvalue})
    } LIMIT 10000 `
  };

  // Change the city data to country
  function changeCityToCountry(results, countryArray, cityArray) {
      results.forEach((result) => {
          if(!countryArray.includes(result.placeName)){
              cityArray.forEach((cityObject) => {
                  if(cityObject.city == result.placeName){
                      result.placeName = cityObject.country;
                  }
              });
          }
          if(!countryArray.includes(result.placeName)){
              let index = results.indexOf(result);
              results.splice(index, 1);
          }
      });
    return results
  }

  // Returns the new query
  function getQuery$1(firstvalue, secondvalue) {
      return `PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    PREFIX geo: <http://www.opengis.net/ont/geosparql#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX gn: <http://www.geonames.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT ?cho ?placeName ?date WHERE {
        ?cho dct:spatial ?place .
        ?place skos:exactMatch/gn:parentCountry ?land .
        ?land gn:name ?placeName .
        ?cho dct:created ?date .
        FILTER(xsd:integer(?date) >= ${firstvalue} && xsd:integer(?date) <= ${secondvalue})
    } LIMIT 10000 `
  }

  //check if any placename is equal to one of the countries, if so -> country count + 1
  function countTracker( results, dataCount, countryArray ){
      dataCount.forEach(counter => {
          counter.properties.count = 0;
      });
      let highestCount = 0;
    	
      results.forEach(result => {
          if(countryArray.includes(result.placeName)) {
              dataCount.forEach((counter) => {
                  if(counter.properties.name == result.placeName){
                      counter.properties.count = counter.properties.count += 1;
                      if(counter.properties.count > highestCount) {
                          highestCount = counter.properties.count;
                      }
                  }
              });
          }
      });
    return { results, dataCount, highestCount }
  }

  const events = d3.select('.events');
  const g = events.append('g');
  events.append('text')
      .text("Historical events")
      .attr('x', '20')
      .attr('y', '20')
      .attr('class', 'title');

  async function historicMoments(object, firsttimevalue, secondtimevalue){
    await d3.csv('koloniale-data.csv').then((data) => {
      renderData(data, object);
    });
  }

  function renderData(data, object, firsttime, secondtime) {
    let country = object.properties.name;
   	let eventArray = [];
   	let y = 70;
  	events.select('.countryTitle')
    	.remove();
  	events.append('text')
      .text(country)
      .attr('x', '20')
      .attr('y', '50')
      .attr('class', 'countryTitle');
  	
    data.forEach(event => {
      event.CurrentNameOfTerritory === country ? eventArray.push(event) : null;
    });
    console.log(eventArray);
  	eventArray.forEach(event => {
      event.y = y;
      event.PeriodOfTime = fixDate(event.PeriodOfTime);
      y += 20;
    });
    displayData(eventArray);
  }

  function fixDate(date, firsttime, secondtime){
    date = date.split('-');
    date[1] = ' ' + date[1];
    date = date.join('-').slice(0, 12);
    return date
  }

  function displayData(eventArray) {
    g.selectAll('text')
      .data([])
      .exit()
      .remove(); 
   let text = g.selectAll('text').data(eventArray);
      text
  			.enter()
      	.append('text')
        .text( (d) => { return d.Colony + ' ' + d.PeriodOfTime })
        .attr("font-family", "sans-serif")
        .attr("font-size", "16px")
        .attr("x", () => { return 20 })
        .attr("y", (d) => { return d.y });
  }

  const zoom = d3.zoom().scaleExtent([1,16]);

  const svg = d3.select('svg').append('g');
  const g$1 = d3.select('g');

  const worldMap = d3.geoNaturalEarth1(); //natural earth gives a good realistic view of the map
  const pathCreator = d3.geoPath().projection(worldMap);
  const api = 'https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-02/sparql';
  const playButton = document.querySelector('.play');
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
          secondValue: 500
      }
  };

  //Create a div inside the parent group to show country name + object count
  let tooltip = d3.select(".wrapper")
    .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden");

  // Map zoom function
  svg.call(zoom.on('zoom', () => {
      g$1.attr('transform', d3.event.transform);
  }));

  // Fetch JSON with all capital cities + countries
  const fetchCityToCountry = (fetchurl) => {
      fetch(fetchurl)
      .then(response => response.json())
      .then(json => {    
          state.cityArray = json;
      });
  };
  fetchCityToCountry('https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-capital-city.json');

  // Fetch map layout JSON + create an array containing unique countries
  const rendermapLayout = () => {     
      d3.json('https://enjalot.github.io/wwsd/data/world/world-110m.geojson')
          .then(json => {
              json.features.forEach((feature, i) => {
                  state.countryArray.push(feature.properties.name);
                  state.dataCount.push(feature);
                  state.dataCount[i].properties.count = 0;
              });
          });
  };
  rendermapLayout(); 

  // push unique values to array for the timeline later one
  const pushToArray = function(element) {
      let node = element.textContent;
      state.uniqueNodes.push(node);
  };

  // Take first + second value from timeline click to put in an array later on
  const changeQuery = function() {
    	currentSlider.classList.contains('active') ? null : currentSlider.classList.add('active');
      state.stopTimer = true;
      let index = state.uniqueNodes.indexOf(this.textContent);
      state.currentTime = index;
      currentSlider.style.left = state.nodeWidth * index + 'px';
      let content = state.uniqueNodes[index];
          content = content.split("-");
          let selectedTime = {
              firstValue: content[0],
              secondValue: content[1]
          };
          updateTime(selectedTime);
  };

  // Clean the date format from xxxx-xxxx to one number
  const dateFormat$1 = date => {
      date = date.split('-');
      date[1] = date[1].trim();
      date[0] = parseInt(date[0]);
      date[1] = parseInt(date[1]);
      date = Math.round((date[0] + date[1]) / 2);
  };

  // Updates time filter
  const updateTime = (time) => {
      state.timeFilter = {
          firstValue: time.firstValue,
          secondValue: time.secondValue
      };
      updateData();
  };

  // Render all elements on the SVG
  const renderSVG = () => {
      g$1.append('path')
          .attr('class', 'sphere')
          .attr('d', pathCreator({type: 'Sphere'}));
      let scaleColor = d3.scaleSqrt()
          .domain([0, (state.highestCount)])
          .range(['#ffffff', 'red']);
      g$1.selectAll('path')
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
                  .style('stroke-opacity', 1);
          })
          .on('mouseout', function() {
              d3.select(this)
                  .style('stroke-opacity', 0.2);
              tooltip.style("visibility", "hidden");
          })
          .on("click", (d) => { 
  						historicMoments(d, state.timeFilter.firstValue, state.timeFilter.secondValue);
              tooltip
              .style("visibility", "visible")
              .text(d.properties.name + ': ' + d.properties.count + ' objecten');
          })
          .on("mousemove", (d) => {
              tooltip
              .style("top", (event.pageY-40)+"px")
              .style("left",(event.pageX-35)+"px");})
          .transition()
          .duration(300)
          .style('fill', (d) => scaleColor(d.properties.count));
          
          playButton.addEventListener('click', playTimeline);
  };

  // Run the SPAQRL query, render every element, create counts for the heatmap
  const runQuery = (api) => {
    	let query = getQuery$1(state.timeFilter.firstValue, state.timeFilter.secondValue);
      // Call the url with the query attached, output data
      fetch(api + "?query=" + encodeURIComponent(query) + "&format=json")
      .then(res => res.json())
      .then(json => {
          //change results placename to match more items in the following forEach. If item is not in city JSON -> delete
          let results = json.results.bindings;
          console.log(results);
          results.forEach((result, i) => {
              if(result.date.value.includes('-')) {
                  dateFormat$1(result.date.value);
              }
              results[i] = {
                  placeName: result.placeName.value,
                  date: result.date.value
              };
          });
          results = changeCityToCountry(results, state.countryArray, state.cityArray);
        	let tracker = countTracker(results, state.dataCount, state.countryArray);
  				state.dataCount = tracker.dataCount;
  				state.highestCount = tracker.highestCount;
          renderSVG();
      });
  };
  runQuery(api);

  // Create eventlistener for every timeline object
  const timeLine = () => {
      let nodes = document.querySelectorAll('.timeline p');
      let currentWidth = document.querySelector('.timeline').offsetWidth / nodes.length;
      state.nodeWidth = currentWidth;
      currentSlider.style.width = state.nodeWidth+'px';
      nodes.forEach(element => {
          pushToArray(element);
          element.addEventListener('click', changeQuery);
      });
  };
  timeLine();

  // Updates data
  async function updateData() {
    	let data = await prepareData(state.timeFilter.firstValue, state.timeFilter.secondValue);
  		let tracker = countTracker(data, state.dataCount, state.countryArray);
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
          .style('fill', (d) => scaleColor(d.properties.count));
  }

  const playTimeline = () => {
      state.currentTime = 0;
      state.stopTimer = false;
      currentSlider.classList.contains('active') ? null : currentSlider.classList.add('active');
      callbackFn(0);
  };

  function callbackFn(index, callback) {
      let length = state.uniqueNodes.length;
      setTimeout(() => {
          currentSlider.style.left = state.nodeWidth * index + 'px';
      }, 300);
      
      let content = state.uniqueNodes[state.currentTime];
      content = content.split('-');
      console.log(content);
      let selectedTime = {
          firstValue: content[0],
          secondValue: content[1]
      };
      updateTime(selectedTime);
      setTimeout(() => {
          if(index < state.uniqueNodes.length-1 && state.stopTimer == false){
              callbackFn(index + 1);
          }
      }, 1500);
      state.currentTime != length-1 ?
          state.currentTime += 1 :
          state.currentTime = 0;
  }

}());

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInByZXBhcmVEYXRhLmpzIiwiY2hhbmdlQ2l0eVRvQ291bnRyeS5qcyIsImdldFF1ZXJ5LmpzIiwiY291bnRUcmFja2VyLmpzIiwiaGlzdG9yaWNNb21lbnRzLmpzIiwiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXBhcmVEYXRhKGZpcnN0dmFsdWUsIHNlY29uZHZhbHVlKXtcbiAgLy9Mb2FkIHRoZSBkYXRhIGFuZCByZXR1cm4gYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdpdGggc2FpZCBkYXRhXG4gIGxldCBxdWVyeSA9IGdldFF1ZXJ5KGZpcnN0dmFsdWUsIHNlY29uZHZhbHVlKVxuXHRsZXQgZW5kcG9pbnQgPSAnaHR0cHM6Ly9hcGkuZGF0YS5uZXR3ZXJrZGlnaXRhYWxlcmZnb2VkLm5sL2RhdGFzZXRzL2l2by9OTVZXL3NlcnZpY2VzL05NVlctMDIvc3BhcnFsJztcblx0bGV0IGRhdGEgPSBhd2FpdCBydW5OZXdRdWVyeShlbmRwb2ludCwgcXVlcnkpXG4gIHJldHVybiBkYXRhXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bk5ld1F1ZXJ5KGFwaSwgcXVlcnkpIHtcbiAgICByZXR1cm4gZmV0Y2goYXBpICsgXCI/cXVlcnk9XCIgKyBlbmNvZGVVUklDb21wb25lbnQocXVlcnkpICsgXCImZm9ybWF0PWpzb25cIilcbiAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcbiAgICAudGhlbihqc29uID0+IHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBqc29uLnJlc3VsdHMuYmluZGluZ3M7XG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpKSA9PiB7XG4gICAgICAgICAgICBpZihyZXN1bHQuZGF0ZS52YWx1ZS5pbmNsdWRlcygnLScpKSB7XG4gICAgICAgICAgICAgICAgZGF0ZUZvcm1hdChyZXN1bHQuZGF0ZS52YWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHNbaV0gPSB7XG4gICAgICAgICAgICAgICAgcGxhY2VOYW1lOiByZXN1bHQucGxhY2VOYW1lLnZhbHVlLFxuICAgICAgICAgICAgICAgIGRhdGU6IHJlc3VsdC5kYXRlLnZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHRzKVxuICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9KVxufVxuXG5jb25zdCBkYXRlRm9ybWF0ID0gZGF0ZSA9PiB7XG4gICAgZGF0ZSA9IGRhdGUuc3BsaXQoJy0nKVxuICAgIGRhdGVbMV0gPSBkYXRlWzFdLnRyaW0oKVxuICAgIGRhdGVbMF0gPSBwYXJzZUludChkYXRlWzBdKVxuICAgIGRhdGVbMV0gPSBwYXJzZUludChkYXRlWzFdKVxuICAgIGRhdGUgPSBNYXRoLnJvdW5kKChkYXRlWzBdICsgZGF0ZVsxXSkgLyAyKVxufVxuXG5jb25zdCBnZXRRdWVyeSA9IChmaXJzdHZhbHVlLCBzZWNvbmR2YWx1ZSkgPT4ge1xuICAgIHJldHVybiBgUFJFRklYIGRjdDogPGh0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy8+XG4gICAgUFJFRklYIHdnczg0OiA8aHR0cDovL3d3dy53My5vcmcvMjAwMy8wMS9nZW8vd2dzODRfcG9zIz5cbiAgICBQUkVGSVggZ2VvOiA8aHR0cDovL3d3dy5vcGVuZ2lzLm5ldC9vbnQvZ2Vvc3BhcnFsIz5cbiAgICBQUkVGSVggc2tvczogPGh0dHA6Ly93d3cudzMub3JnLzIwMDQvMDIvc2tvcy9jb3JlIz5cbiAgICBQUkVGSVggZ246IDxodHRwOi8vd3d3Lmdlb25hbWVzLm9yZy9vbnRvbG9neSM+XG4gICAgUFJFRklYIHJkZjogPGh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyM+XG4gICAgUFJFRklYIHJkZnM6IDxodHRwOi8vd3d3LnczLm9yZy8yMDAwLzAxL3JkZi1zY2hlbWEjPlxuICAgIFxuICAgIFNFTEVDVCA/Y2hvID9wbGFjZU5hbWUgP2RhdGUgV0hFUkUge1xuICAgICAgICA/Y2hvIGRjdDpzcGF0aWFsID9wbGFjZSAuXG4gICAgICAgID9wbGFjZSBza29zOmV4YWN0TWF0Y2gvZ246cGFyZW50Q291bnRyeSA/bGFuZCAuXG4gICAgICAgID9sYW5kIGduOm5hbWUgP3BsYWNlTmFtZSAuXG4gICAgICAgID9jaG8gZGN0OmNyZWF0ZWQgP2RhdGUgLlxuICAgICAgICBGSUxURVIoeHNkOmludGVnZXIoP2RhdGUpID49ICR7Zmlyc3R2YWx1ZX0gJiYgeHNkOmludGVnZXIoP2RhdGUpIDw9ICR7c2Vjb25kdmFsdWV9KVxuICAgIH0gTElNSVQgMTAwMDAgYFxufSIsIi8vIENoYW5nZSB0aGUgY2l0eSBkYXRhIHRvIGNvdW50cnlcbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VDaXR5VG9Db3VudHJ5KHJlc3VsdHMsIGNvdW50cnlBcnJheSwgY2l0eUFycmF5KSB7XG4gICAgcmVzdWx0cy5mb3JFYWNoKChyZXN1bHQpID0+IHtcbiAgICAgICAgaWYoIWNvdW50cnlBcnJheS5pbmNsdWRlcyhyZXN1bHQucGxhY2VOYW1lKSl7XG4gICAgICAgICAgICBjaXR5QXJyYXkuZm9yRWFjaCgoY2l0eU9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKGNpdHlPYmplY3QuY2l0eSA9PSByZXN1bHQucGxhY2VOYW1lKXtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnBsYWNlTmFtZSA9IGNpdHlPYmplY3QuY291bnRyeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZighY291bnRyeUFycmF5LmluY2x1ZGVzKHJlc3VsdC5wbGFjZU5hbWUpKXtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IHJlc3VsdHMuaW5kZXhPZihyZXN1bHQpO1xuICAgICAgICAgICAgcmVzdWx0cy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICAgIH1cbiAgICB9KTtcbiAgcmV0dXJuIHJlc3VsdHNcbn0iLCIvLyBSZXR1cm5zIHRoZSBuZXcgcXVlcnlcbmV4cG9ydCBmdW5jdGlvbiBnZXRRdWVyeShmaXJzdHZhbHVlLCBzZWNvbmR2YWx1ZSkge1xuICAgIHJldHVybiBgUFJFRklYIGRjdDogPGh0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy8+XG4gICAgUFJFRklYIHdnczg0OiA8aHR0cDovL3d3dy53My5vcmcvMjAwMy8wMS9nZW8vd2dzODRfcG9zIz5cbiAgICBQUkVGSVggZ2VvOiA8aHR0cDovL3d3dy5vcGVuZ2lzLm5ldC9vbnQvZ2Vvc3BhcnFsIz5cbiAgICBQUkVGSVggc2tvczogPGh0dHA6Ly93d3cudzMub3JnLzIwMDQvMDIvc2tvcy9jb3JlIz5cbiAgICBQUkVGSVggZ246IDxodHRwOi8vd3d3Lmdlb25hbWVzLm9yZy9vbnRvbG9neSM+XG4gICAgUFJFRklYIHJkZjogPGh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyM+XG4gICAgUFJFRklYIHJkZnM6IDxodHRwOi8vd3d3LnczLm9yZy8yMDAwLzAxL3JkZi1zY2hlbWEjPlxuICAgIFxuICAgIFNFTEVDVCA/Y2hvID9wbGFjZU5hbWUgP2RhdGUgV0hFUkUge1xuICAgICAgICA/Y2hvIGRjdDpzcGF0aWFsID9wbGFjZSAuXG4gICAgICAgID9wbGFjZSBza29zOmV4YWN0TWF0Y2gvZ246cGFyZW50Q291bnRyeSA/bGFuZCAuXG4gICAgICAgID9sYW5kIGduOm5hbWUgP3BsYWNlTmFtZSAuXG4gICAgICAgID9jaG8gZGN0OmNyZWF0ZWQgP2RhdGUgLlxuICAgICAgICBGSUxURVIoeHNkOmludGVnZXIoP2RhdGUpID49ICR7Zmlyc3R2YWx1ZX0gJiYgeHNkOmludGVnZXIoP2RhdGUpIDw9ICR7c2Vjb25kdmFsdWV9KVxuICAgIH0gTElNSVQgMTAwMDAgYFxufSIsIi8vY2hlY2sgaWYgYW55IHBsYWNlbmFtZSBpcyBlcXVhbCB0byBvbmUgb2YgdGhlIGNvdW50cmllcywgaWYgc28gLT4gY291bnRyeSBjb3VudCArIDFcbmV4cG9ydCBmdW5jdGlvbiBjb3VudFRyYWNrZXIoIHJlc3VsdHMsIGRhdGFDb3VudCwgY291bnRyeUFycmF5ICl7XG4gICAgZGF0YUNvdW50LmZvckVhY2goY291bnRlciA9PiB7XG4gICAgICAgIGNvdW50ZXIucHJvcGVydGllcy5jb3VudCA9IDBcbiAgICB9KVxuICAgIGxldCBoaWdoZXN0Q291bnQgPSAwO1xuICBcdFxuICAgIHJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgICBpZihjb3VudHJ5QXJyYXkuaW5jbHVkZXMocmVzdWx0LnBsYWNlTmFtZSkpIHtcbiAgICAgICAgICAgIGRhdGFDb3VudC5mb3JFYWNoKChjb3VudGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoY291bnRlci5wcm9wZXJ0aWVzLm5hbWUgPT0gcmVzdWx0LnBsYWNlTmFtZSl7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50ZXIucHJvcGVydGllcy5jb3VudCA9IGNvdW50ZXIucHJvcGVydGllcy5jb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBpZihjb3VudGVyLnByb3BlcnRpZXMuY291bnQgPiBoaWdoZXN0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RDb3VudCA9IGNvdW50ZXIucHJvcGVydGllcy5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSlcbiAgcmV0dXJuIHsgcmVzdWx0cywgZGF0YUNvdW50LCBoaWdoZXN0Q291bnQgfVxufSIsImNvbnN0IGV2ZW50cyA9IGQzLnNlbGVjdCgnLmV2ZW50cycpXG5jb25zdCBnID0gZXZlbnRzLmFwcGVuZCgnZycpXG5ldmVudHMuYXBwZW5kKCd0ZXh0JylcbiAgICAudGV4dChcIkhpc3RvcmljYWwgZXZlbnRzXCIpXG4gICAgLmF0dHIoJ3gnLCAnMjAnKVxuICAgIC5hdHRyKCd5JywgJzIwJylcbiAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGlzdG9yaWNNb21lbnRzKG9iamVjdCwgZmlyc3R0aW1ldmFsdWUsIHNlY29uZHRpbWV2YWx1ZSl7XG4gIGF3YWl0IGQzLmNzdigna29sb25pYWxlLWRhdGEuY3N2JykudGhlbigoZGF0YSkgPT4ge1xuICAgIHJlbmRlckRhdGEoZGF0YSwgb2JqZWN0LCBmaXJzdHRpbWV2YWx1ZSwgc2Vjb25kdGltZXZhbHVlKVxuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyRGF0YShkYXRhLCBvYmplY3QsIGZpcnN0dGltZSwgc2Vjb25kdGltZSkge1xuICBsZXQgY291bnRyeSA9IG9iamVjdC5wcm9wZXJ0aWVzLm5hbWVcbiBcdGxldCBldmVudEFycmF5ID0gW11cbiBcdGxldCB5ID0gNzBcblx0ZXZlbnRzLnNlbGVjdCgnLmNvdW50cnlUaXRsZScpXG4gIFx0LnJlbW92ZSgpXG5cdGV2ZW50cy5hcHBlbmQoJ3RleHQnKVxuICAgIC50ZXh0KGNvdW50cnkpXG4gICAgLmF0dHIoJ3gnLCAnMjAnKVxuICAgIC5hdHRyKCd5JywgJzUwJylcbiAgICAuYXR0cignY2xhc3MnLCAnY291bnRyeVRpdGxlJylcblx0XG4gIGRhdGEuZm9yRWFjaChldmVudCA9PiB7XG4gICAgZXZlbnQuQ3VycmVudE5hbWVPZlRlcnJpdG9yeSA9PT0gY291bnRyeSA/IGV2ZW50QXJyYXkucHVzaChldmVudCkgOiBudWxsXG4gIH0pXG4gIGNvbnNvbGUubG9nKGV2ZW50QXJyYXkpXG5cdGV2ZW50QXJyYXkuZm9yRWFjaChldmVudCA9PiB7XG4gICAgZXZlbnQueSA9IHlcbiAgICBldmVudC5QZXJpb2RPZlRpbWUgPSBmaXhEYXRlKGV2ZW50LlBlcmlvZE9mVGltZSwgZmlyc3R0aW1lLCBzZWNvbmR0aW1lKVxuICAgIHkgKz0gMjBcbiAgfSlcbiAgZGlzcGxheURhdGEoZXZlbnRBcnJheSlcbn1cblxuZnVuY3Rpb24gZml4RGF0ZShkYXRlLCBmaXJzdHRpbWUsIHNlY29uZHRpbWUpe1xuICBkYXRlID0gZGF0ZS5zcGxpdCgnLScpXG4gIGRhdGVbMV0gPSAnICcgKyBkYXRlWzFdXG4gIGRhdGUgPSBkYXRlLmpvaW4oJy0nKS5zbGljZSgwLCAxMilcbiAgcmV0dXJuIGRhdGVcbn1cblxuZnVuY3Rpb24gZGlzcGxheURhdGEoZXZlbnRBcnJheSkge1xuICBnLnNlbGVjdEFsbCgndGV4dCcpXG4gICAgLmRhdGEoW10pXG4gICAgLmV4aXQoKVxuICAgIC5yZW1vdmUoKSBcbiBsZXQgdGV4dCA9IGcuc2VsZWN0QWxsKCd0ZXh0JykuZGF0YShldmVudEFycmF5KVxuICAgIHRleHRcblx0XHRcdC5lbnRlcigpXG4gICAgXHQuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC50ZXh0KCAoZCkgPT4geyByZXR1cm4gZC5Db2xvbnkgKyAnICcgKyBkLlBlcmlvZE9mVGltZSB9KVxuICAgICAgLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIilcbiAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIFwiMTZweFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsICgpID0+IHsgcmV0dXJuIDIwIH0pXG4gICAgICAuYXR0cihcInlcIiwgKGQpID0+IHsgcmV0dXJuIGQueSB9KTtcbn0iLCJpbXBvcnQgeyBwcmVwYXJlRGF0YSB9IGZyb20gJy4vcHJlcGFyZURhdGEnO1xuaW1wb3J0IHsgY2hhbmdlQ2l0eVRvQ291bnRyeSB9IGZyb20gJy4vY2hhbmdlQ2l0eVRvQ291bnRyeSdcbmltcG9ydCB7IGdldFF1ZXJ5IH0gZnJvbSAnLi9nZXRRdWVyeSc7XG5pbXBvcnQgeyBjb3VudFRyYWNrZXIgfSBmcm9tICcuL2NvdW50VHJhY2tlcic7XG5pbXBvcnQgeyBoaXN0b3JpY01vbWVudHMgfSBmcm9tICcuL2hpc3RvcmljTW9tZW50cyc7IFxuY29uc3Qgem9vbSA9IGQzLnpvb20oKS5zY2FsZUV4dGVudChbMSwxNl0pO1xuXG5jb25zdCBzdmcgPSBkMy5zZWxlY3QoJ3N2ZycpLmFwcGVuZCgnZycpXG5jb25zdCBnID0gZDMuc2VsZWN0KCdnJyk7XG5cbmNvbnN0IHdvcmxkTWFwID0gZDMuZ2VvTmF0dXJhbEVhcnRoMSgpOyAvL25hdHVyYWwgZWFydGggZ2l2ZXMgYSBnb29kIHJlYWxpc3RpYyB2aWV3IG9mIHRoZSBtYXBcbmNvbnN0IHBhdGhDcmVhdG9yID0gZDMuZ2VvUGF0aCgpLnByb2plY3Rpb24od29ybGRNYXApO1xuY29uc3QgYXBpID0gJ2h0dHBzOi8vYXBpLmRhdGEubmV0d2Vya2RpZ2l0YWFsZXJmZ29lZC5ubC9kYXRhc2V0cy9pdm8vTk1WVy9zZXJ2aWNlcy9OTVZXLTAyL3NwYXJxbCc7XG5jb25zdCBwbGF5QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBsYXknKVxuY29uc3QgY3VycmVudFNsaWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jdXJyZW50Jyk7XG5cbmxldCBzdGF0ZSA9IHtcbiAgICBjb3VudHJ5QXJyYXk6IFtdLFxuICAgIGNpdHlBcnJheTogW10sXG4gICAgZGF0YUNvdW50OiBbXSxcbiAgICBoaWdoZXN0Q291bnQ6IDAsXG4gICAgdW5pcXVlTm9kZXM6IFtdLFxuICAgIGN1cnJlbnRUaW1lOiAwLFxuICAgIG5vZGVXaWR0aDogMCxcbiAgICBzdG9wVGltZXI6IGZhbHNlLFxuICAgIHRpbWVGaWx0ZXI6IHtcbiAgICAgICAgZmlyc3RWYWx1ZTogMCxcbiAgICAgICAgc2Vjb25kVmFsdWU6IDUwMFxuICAgIH1cbn1cblxuLy9DcmVhdGUgYSBkaXYgaW5zaWRlIHRoZSBwYXJlbnQgZ3JvdXAgdG8gc2hvdyBjb3VudHJ5IG5hbWUgKyBvYmplY3QgY291bnRcbmxldCB0b29sdGlwID0gZDMuc2VsZWN0KFwiLndyYXBwZXJcIilcbiAgLmFwcGVuZChcImRpdlwiKVxuICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwiYWJzb2x1dGVcIilcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cbi8vIE1hcCB6b29tIGZ1bmN0aW9uXG5zdmcuY2FsbCh6b29tLm9uKCd6b29tJywgKCkgPT4ge1xuICAgIGcuYXR0cigndHJhbnNmb3JtJywgZDMuZXZlbnQudHJhbnNmb3JtKTtcbn0pKVxuXG4vLyBGZXRjaCBKU09OIHdpdGggYWxsIGNhcGl0YWwgY2l0aWVzICsgY291bnRyaWVzXG5jb25zdCBmZXRjaENpdHlUb0NvdW50cnkgPSAoZmV0Y2h1cmwpID0+IHtcbiAgICBmZXRjaChmZXRjaHVybClcbiAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgLnRoZW4oanNvbiA9PiB7ICAgIFxuICAgICAgICBzdGF0ZS5jaXR5QXJyYXkgPSBqc29uO1xuICAgIH0pXG59XG5mZXRjaENpdHlUb0NvdW50cnkoJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9zYW1heW8vY291bnRyeS1qc29uL21hc3Rlci9zcmMvY291bnRyeS1ieS1jYXBpdGFsLWNpdHkuanNvbicpXG5cbi8vIEZldGNoIG1hcCBsYXlvdXQgSlNPTiArIGNyZWF0ZSBhbiBhcnJheSBjb250YWluaW5nIHVuaXF1ZSBjb3VudHJpZXNcbmNvbnN0IHJlbmRlcm1hcExheW91dCA9ICgpID0+IHsgICAgIFxuICAgIGQzLmpzb24oJ2h0dHBzOi8vZW5qYWxvdC5naXRodWIuaW8vd3dzZC9kYXRhL3dvcmxkL3dvcmxkLTExMG0uZ2VvanNvbicpXG4gICAgICAgIC50aGVuKGpzb24gPT4ge1xuICAgICAgICAgICAganNvbi5mZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuY291bnRyeUFycmF5LnB1c2goZmVhdHVyZS5wcm9wZXJ0aWVzLm5hbWUpO1xuICAgICAgICAgICAgICAgIHN0YXRlLmRhdGFDb3VudC5wdXNoKGZlYXR1cmUpXG4gICAgICAgICAgICAgICAgc3RhdGUuZGF0YUNvdW50W2ldLnByb3BlcnRpZXMuY291bnQgPSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG59O1xucmVuZGVybWFwTGF5b3V0KCk7IFxuXG4vLyBwdXNoIHVuaXF1ZSB2YWx1ZXMgdG8gYXJyYXkgZm9yIHRoZSB0aW1lbGluZSBsYXRlciBvbmVcbmNvbnN0IHB1c2hUb0FycmF5ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGxldCBub2RlID0gZWxlbWVudC50ZXh0Q29udGVudFxuICAgIHN0YXRlLnVuaXF1ZU5vZGVzLnB1c2gobm9kZSlcbn1cblxuLy8gVGFrZSBmaXJzdCArIHNlY29uZCB2YWx1ZSBmcm9tIHRpbWVsaW5lIGNsaWNrIHRvIHB1dCBpbiBhbiBhcnJheSBsYXRlciBvblxuY29uc3QgY2hhbmdlUXVlcnkgPSBmdW5jdGlvbigpIHtcbiAgXHRjdXJyZW50U2xpZGVyLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykgPyBudWxsIDogY3VycmVudFNsaWRlci5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICAgIHN0YXRlLnN0b3BUaW1lciA9IHRydWVcbiAgICBsZXQgaW5kZXggPSBzdGF0ZS51bmlxdWVOb2Rlcy5pbmRleE9mKHRoaXMudGV4dENvbnRlbnQpXG4gICAgc3RhdGUuY3VycmVudFRpbWUgPSBpbmRleFxuICAgIGN1cnJlbnRTbGlkZXIuc3R5bGUubGVmdCA9IHN0YXRlLm5vZGVXaWR0aCAqIGluZGV4ICsgJ3B4JztcbiAgICBsZXQgY29udGVudCA9IHN0YXRlLnVuaXF1ZU5vZGVzW2luZGV4XVxuICAgICAgICBjb250ZW50ID0gY29udGVudC5zcGxpdChcIi1cIik7XG4gICAgICAgIGxldCBzZWxlY3RlZFRpbWUgPSB7XG4gICAgICAgICAgICBmaXJzdFZhbHVlOiBjb250ZW50WzBdLFxuICAgICAgICAgICAgc2Vjb25kVmFsdWU6IGNvbnRlbnRbMV1cbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVUaW1lKHNlbGVjdGVkVGltZSlcbn1cblxuLy8gQ2xlYW4gdGhlIGRhdGUgZm9ybWF0IGZyb20geHh4eC14eHh4IHRvIG9uZSBudW1iZXJcbmNvbnN0IGRhdGVGb3JtYXQgPSBkYXRlID0+IHtcbiAgICBkYXRlID0gZGF0ZS5zcGxpdCgnLScpXG4gICAgZGF0ZVsxXSA9IGRhdGVbMV0udHJpbSgpXG4gICAgZGF0ZVswXSA9IHBhcnNlSW50KGRhdGVbMF0pXG4gICAgZGF0ZVsxXSA9IHBhcnNlSW50KGRhdGVbMV0pXG4gICAgZGF0ZSA9IE1hdGgucm91bmQoKGRhdGVbMF0gKyBkYXRlWzFdKSAvIDIpXG59XG5cbi8vIFVwZGF0ZXMgdGltZSBmaWx0ZXJcbmNvbnN0IHVwZGF0ZVRpbWUgPSAodGltZSkgPT4ge1xuICAgIHN0YXRlLnRpbWVGaWx0ZXIgPSB7XG4gICAgICAgIGZpcnN0VmFsdWU6IHRpbWUuZmlyc3RWYWx1ZSxcbiAgICAgICAgc2Vjb25kVmFsdWU6IHRpbWUuc2Vjb25kVmFsdWVcbiAgICB9XG4gICAgdXBkYXRlRGF0YSgpXG59XG5cbi8vIFJlbmRlciBhbGwgZWxlbWVudHMgb24gdGhlIFNWR1xuY29uc3QgcmVuZGVyU1ZHID0gKCkgPT4ge1xuICAgIGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NwaGVyZScpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aENyZWF0b3Ioe3R5cGU6ICdTcGhlcmUnfSkpO1xuICAgIGxldCBzY2FsZUNvbG9yID0gZDMuc2NhbGVTcXJ0KClcbiAgICAgICAgLmRvbWFpbihbMCwgKHN0YXRlLmhpZ2hlc3RDb3VudCldKVxuICAgICAgICAucmFuZ2UoWycjZmZmZmZmJywgJ3JlZCddKTtcbiAgICBnLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgLmRhdGEoc3RhdGUuZGF0YUNvdW50KSBcbiAgICAuZW50ZXIoKVxuICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignZCcsIHBhdGhDcmVhdG9yKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY291bnRyeScpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgJ2JsYWNrJylcbiAgICAgICAgLnN0eWxlKCdzdHJva2Utb3BhY2l0eScsIDAuMilcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgXCJ3aGl0ZVwiKVxuICAgICAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdzdHJva2Utb3BhY2l0eScsIDEpXG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlLW9wYWNpdHknLCAwLjIpXG4gICAgICAgICAgICB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKVxuICAgICAgICB9KVxuICAgICAgICAub24oXCJjbGlja1wiLCAoZCkgPT4geyBcblx0XHRcdFx0XHRcdGhpc3RvcmljTW9tZW50cyhkLCBzdGF0ZS50aW1lRmlsdGVyLmZpcnN0VmFsdWUsIHN0YXRlLnRpbWVGaWx0ZXIuc2Vjb25kVmFsdWUpO1xuICAgICAgICAgICAgdG9vbHRpcFxuICAgICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIilcbiAgICAgICAgICAgIC50ZXh0KGQucHJvcGVydGllcy5uYW1lICsgJzogJyArIGQucHJvcGVydGllcy5jb3VudCArICcgb2JqZWN0ZW4nKVxuICAgICAgICB9KVxuICAgICAgICAub24oXCJtb3VzZW1vdmVcIiwgKGQpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAgIC5zdHlsZShcInRvcFwiLCAoZXZlbnQucGFnZVktNDApK1wicHhcIilcbiAgICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwoZXZlbnQucGFnZVgtMzUpK1wicHhcIil9KVxuICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbigzMDApXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIChkKSA9PiBzY2FsZUNvbG9yKGQucHJvcGVydGllcy5jb3VudCkpXG4gICAgICAgIFxuICAgICAgICBwbGF5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGxheVRpbWVsaW5lKVxufVxuXG4vLyBSdW4gdGhlIFNQQVFSTCBxdWVyeSwgcmVuZGVyIGV2ZXJ5IGVsZW1lbnQsIGNyZWF0ZSBjb3VudHMgZm9yIHRoZSBoZWF0bWFwXG5jb25zdCBydW5RdWVyeSA9IChhcGkpID0+IHtcbiAgXHRsZXQgcXVlcnkgPSBnZXRRdWVyeShzdGF0ZS50aW1lRmlsdGVyLmZpcnN0VmFsdWUsIHN0YXRlLnRpbWVGaWx0ZXIuc2Vjb25kVmFsdWUpXG4gICAgLy8gQ2FsbCB0aGUgdXJsIHdpdGggdGhlIHF1ZXJ5IGF0dGFjaGVkLCBvdXRwdXQgZGF0YVxuICAgIGZldGNoKGFwaSArIFwiP3F1ZXJ5PVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KSArIFwiJmZvcm1hdD1qc29uXCIpXG4gICAgLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpXG4gICAgLnRoZW4oanNvbiA9PiB7XG4gICAgICAgIC8vY2hhbmdlIHJlc3VsdHMgcGxhY2VuYW1lIHRvIG1hdGNoIG1vcmUgaXRlbXMgaW4gdGhlIGZvbGxvd2luZyBmb3JFYWNoLiBJZiBpdGVtIGlzIG5vdCBpbiBjaXR5IEpTT04gLT4gZGVsZXRlXG4gICAgICAgIGxldCByZXN1bHRzID0ganNvbi5yZXN1bHRzLmJpbmRpbmdzO1xuICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHRzKVxuICAgICAgICByZXN1bHRzLmZvckVhY2goKHJlc3VsdCwgaSkgPT4ge1xuICAgICAgICAgICAgaWYocmVzdWx0LmRhdGUudmFsdWUuaW5jbHVkZXMoJy0nKSkge1xuICAgICAgICAgICAgICAgIGRhdGVGb3JtYXQocmVzdWx0LmRhdGUudmFsdWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHRzW2ldID0ge1xuICAgICAgICAgICAgICAgIHBsYWNlTmFtZTogcmVzdWx0LnBsYWNlTmFtZS52YWx1ZSxcbiAgICAgICAgICAgICAgICBkYXRlOiByZXN1bHQuZGF0ZS52YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICByZXN1bHRzID0gY2hhbmdlQ2l0eVRvQ291bnRyeShyZXN1bHRzLCBzdGF0ZS5jb3VudHJ5QXJyYXksIHN0YXRlLmNpdHlBcnJheSlcbiAgICAgIFx0bGV0IHRyYWNrZXIgPSBjb3VudFRyYWNrZXIocmVzdWx0cywgc3RhdGUuZGF0YUNvdW50LCBzdGF0ZS5jb3VudHJ5QXJyYXkpXG5cdFx0XHRcdHN0YXRlLmRhdGFDb3VudCA9IHRyYWNrZXIuZGF0YUNvdW50O1xuXHRcdFx0XHRzdGF0ZS5oaWdoZXN0Q291bnQgPSB0cmFja2VyLmhpZ2hlc3RDb3VudDtcbiAgICAgICAgcmVuZGVyU1ZHKClcbiAgICB9KVxufTtcbnJ1blF1ZXJ5KGFwaSwgZ2V0UXVlcnkoKSk7XG5cbi8vIENyZWF0ZSBldmVudGxpc3RlbmVyIGZvciBldmVyeSB0aW1lbGluZSBvYmplY3RcbmNvbnN0IHRpbWVMaW5lID0gKCkgPT4ge1xuICAgIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50aW1lbGluZSBwJylcbiAgICBsZXQgY3VycmVudFdpZHRoID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRpbWVsaW5lJykub2Zmc2V0V2lkdGggLyBub2Rlcy5sZW5ndGhcbiAgICBzdGF0ZS5ub2RlV2lkdGggPSBjdXJyZW50V2lkdGhcbiAgICBjdXJyZW50U2xpZGVyLnN0eWxlLndpZHRoID0gc3RhdGUubm9kZVdpZHRoKydweCdcbiAgICBub2Rlcy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBwdXNoVG9BcnJheShlbGVtZW50KVxuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2hhbmdlUXVlcnkpXG4gICAgfSlcbn1cbnRpbWVMaW5lKCk7XG5cbi8vIFVwZGF0ZXMgZGF0YVxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlRGF0YSgpIHtcbiAgXHRsZXQgZGF0YSA9IGF3YWl0IHByZXBhcmVEYXRhKHN0YXRlLnRpbWVGaWx0ZXIuZmlyc3RWYWx1ZSwgc3RhdGUudGltZUZpbHRlci5zZWNvbmRWYWx1ZSlcblx0XHRsZXQgdHJhY2tlciA9IGNvdW50VHJhY2tlcihkYXRhLCBzdGF0ZS5kYXRhQ291bnQsIHN0YXRlLmNvdW50cnlBcnJheSlcblx0XHRcdFx0c3RhdGUuZGF0YUNvdW50ID0gdHJhY2tlci5kYXRhQ291bnQ7XG5cdFx0XHRcdHN0YXRlLmhpZ2hlc3RDb3VudCA9IHRyYWNrZXIuaGlnaGVzdENvdW50O1xuICAgIGxldCBzY2FsZUNvbG9yID0gZDMuc2NhbGVTcXJ0KClcbiAgICAgICAgLmRvbWFpbihbMCwgKHN0YXRlLmhpZ2hlc3RDb3VudCldKVxuICAgICAgICAucmFuZ2UoWycjZmZmZmZmJywgJ3JlZCddKTtcbiAgXG4gICAgc3ZnLnNlbGVjdEFsbCgnZycpXG4gICAgICAgIC5kYXRhKHN0YXRlLmRhdGFDb3VudClcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLnNlbGVjdEFsbCgnLmNvdW50cnknKVxuICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbigzMDApXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIChkKSA9PiBzY2FsZUNvbG9yKGQucHJvcGVydGllcy5jb3VudCkpXG59XG5cbmNvbnN0IHBsYXlUaW1lbGluZSA9ICgpID0+IHtcbiAgICBzdGF0ZS5jdXJyZW50VGltZSA9IDBcbiAgICBzdGF0ZS5zdG9wVGltZXIgPSBmYWxzZVxuICAgIGN1cnJlbnRTbGlkZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSA/IG51bGwgOiBjdXJyZW50U2xpZGVyLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpXG4gICAgY2FsbGJhY2tGbigwLCBjYWxsYmFja0ZuKVxufVxuXG5mdW5jdGlvbiBjYWxsYmFja0ZuKGluZGV4LCBjYWxsYmFjaykge1xuICAgIGxldCBsZW5ndGggPSBzdGF0ZS51bmlxdWVOb2Rlcy5sZW5ndGhcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY3VycmVudFNsaWRlci5zdHlsZS5sZWZ0ID0gc3RhdGUubm9kZVdpZHRoICogaW5kZXggKyAncHgnO1xuICAgIH0sIDMwMCk7XG4gICAgXG4gICAgbGV0IGNvbnRlbnQgPSBzdGF0ZS51bmlxdWVOb2Rlc1tzdGF0ZS5jdXJyZW50VGltZV1cbiAgICBjb250ZW50ID0gY29udGVudC5zcGxpdCgnLScpXG4gICAgY29uc29sZS5sb2coY29udGVudClcbiAgICBsZXQgc2VsZWN0ZWRUaW1lID0ge1xuICAgICAgICBmaXJzdFZhbHVlOiBjb250ZW50WzBdLFxuICAgICAgICBzZWNvbmRWYWx1ZTogY29udGVudFsxXVxuICAgIH1cbiAgICB1cGRhdGVUaW1lKHNlbGVjdGVkVGltZSlcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYoaW5kZXggPCBzdGF0ZS51bmlxdWVOb2Rlcy5sZW5ndGgtMSAmJiBzdGF0ZS5zdG9wVGltZXIgPT0gZmFsc2Upe1xuICAgICAgICAgICAgY2FsbGJhY2tGbihpbmRleCArIDEsIGNhbGxiYWNrKVxuICAgICAgICB9XG4gICAgfSwgMTUwMCk7XG4gICAgc3RhdGUuY3VycmVudFRpbWUgIT0gbGVuZ3RoLTEgP1xuICAgICAgICBzdGF0ZS5jdXJyZW50VGltZSArPSAxIDpcbiAgICAgICAgc3RhdGUuY3VycmVudFRpbWUgPSAwXG59XG4iXSwibmFtZXMiOlsiZ2V0UXVlcnkiLCJnIiwiZGF0ZUZvcm1hdCJdLCJtYXBwaW5ncyI6Ijs7O0VBQU8sZUFBZSxXQUFXLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQzs7SUFFeEQsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUM7R0FDOUMsSUFBSSxRQUFRLEdBQUcsc0ZBQXNGLENBQUM7R0FDdEcsSUFBSSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBQztJQUM1QyxPQUFPLElBQUk7R0FDWjs7RUFFRCxlQUFlLFdB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