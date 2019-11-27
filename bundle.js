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
            secondValue: 2200
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
  
    function renderLegenda() {
     let legenda = svg.append('g')
          .attr('class', 'legenda');
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
              .attr('fill', 'red');
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
              .attr('');
    }
  
    // Render all elements on the SVG
    const renderSVG = () => {
          renderLegenda();
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
  
  //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInByZXBhcmVEYXRhLmpzIiwiY2hhbmdlQ2l0eVRvQ291bnRyeS5qcyIsImdldFF1ZXJ5LmpzIiwiY291bnRUcmFja2VyLmpzIiwiaGlzdG9yaWNNb21lbnRzLmpzIiwiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXBhcmVEYXRhKGZpcnN0dmFsdWUsIHNlY29uZHZhbHVlKXtcbiAgLy9Mb2FkIHRoZSBkYXRhIGFuZCByZXR1cm4gYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdpdGggc2FpZCBkYXRhXG4gIGxldCBxdWVyeSA9IGdldFF1ZXJ5KGZpcnN0dmFsdWUsIHNlY29uZHZhbHVlKVxuXHRsZXQgZW5kcG9pbnQgPSAnaHR0cHM6Ly9hcGkuZGF0YS5uZXR3ZXJrZGlnaXRhYWxlcmZnb2VkLm5sL2RhdGFzZXRzL2l2by9OTVZXL3NlcnZpY2VzL05NVlctMDIvc3BhcnFsJztcblx0bGV0IGRhdGEgPSBhd2FpdCBydW5OZXdRdWVyeShlbmRwb2ludCwgcXVlcnkpXG4gIHJldHVybiBkYXRhXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bk5ld1F1ZXJ5KGFwaSwgcXVlcnkpIHtcbiAgICByZXR1cm4gZmV0Y2goYXBpICsgXCI/cXVlcnk9XCIgKyBlbmNvZGVVUklDb21wb25lbnQocXVlcnkpICsgXCImZm9ybWF0PWpzb25cIilcbiAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcbiAgICAudGhlbihqc29uID0+IHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBqc29uLnJlc3VsdHMuYmluZGluZ3M7XG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpKSA9PiB7XG4gICAgICAgICAgICBpZihyZXN1bHQuZGF0ZS52YWx1ZS5pbmNsdWRlcygnLScpKSB7XG4gICAgICAgICAgICAgICAgZGF0ZUZvcm1hdChyZXN1bHQuZGF0ZS52YWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHNbaV0gPSB7XG4gICAgICAgICAgICAgICAgcGxhY2VOYW1lOiByZXN1bHQucGxhY2VOYW1lLnZhbHVlLFxuICAgICAgICAgICAgICAgIGRhdGU6IHJlc3VsdC5kYXRlLnZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHRzKVxuICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9KVxufVxuXG5jb25zdCBkYXRlRm9ybWF0ID0gZGF0ZSA9PiB7XG4gICAgZGF0ZSA9IGRhdGUuc3BsaXQoJy0nKVxuICAgIGRhdGVbMV0gPSBkYXRlWzFdLnRyaW0oKVxuICAgIGRhdGVbMF0gPSBwYXJzZUludChkYXRlWzBdKVxuICAgIGRhdGVbMV0gPSBwYXJzZUludChkYXRlWzFdKVxuICAgIGRhdGUgPSBNYXRoLnJvdW5kKChkYXRlWzBdICsgZGF0ZVsxXSkgLyAyKVxufVxuXG5jb25zdCBnZXRRdWVyeSA9IChmaXJzdHZhbHVlLCBzZWNvbmR2YWx1ZSkgPT4ge1xuICAgIHJldHVybiBgUFJFRklYIGRjdDogPGh0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy8+XG4gICAgUFJFRklYIHdnczg0OiA8aHR0cDovL3d3dy53My5vcmcvMjAwMy8wMS9nZW8vd2dzODRfcG9zIz5cbiAgICBQUkVGSVggZ2VvOiA8aHR0cDovL3d3dy5vcGVuZ2lzLm5ldC9vbnQvZ2Vvc3BhcnFsIz5cbiAgICBQUkVGSVggc2tvczogPGh0dHA6Ly93d3cudzMub3JnLzIwMDQvMDIvc2tvcy9jb3JlIz5cbiAgICBQUkVGSVggZ246IDxodHRwOi8vd3d3Lmdlb25hbWVzLm9yZy9vbnRvbG9neSM+XG4gICAgUFJFRklYIHJkZjogPGh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyM+XG4gICAgUFJFRklYIHJkZnM6IDxodHRwOi8vd3d3LnczLm9yZy8yMDAwLzAxL3JkZi1zY2hlbWEjPlxuICAgIFxuICAgIFNFTEVDVCA/Y2hvID9wbGFjZU5hbWUgP2RhdGUgV0hFUkUge1xuICAgICAgICA/Y2hvIGRjdDpzcGF0aWFsID9wbGFjZSAuXG4gICAgICAgID9wbGFjZSBza29zOmV4YWN0TWF0Y2gvZ246cGFyZW50Q291bnRyeSA/bGFuZCAuXG4gICAgICAgID9sYW5kIGduOm5hbWUgP3BsYWNlTmFtZSAuXG4gICAgICAgID9jaG8gZGN0OmNyZWF0ZWQgP2RhdGUgLlxuICAgICAgICBGSUxURVIoeHNkOmludGVnZXIoP2RhdGUpID49ICR7Zmlyc3R2YWx1ZX0gJiYgeHNkOmludGVnZXIoP2RhdGUpIDw9ICR7c2Vjb25kdmFsdWV9KVxuICAgIH0gTElNSVQgMTAwMDAgYFxufSIsIi8vIENoYW5nZSB0aGUgY2l0eSBkYXRhIHRvIGNvdW50cnlcbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VDaXR5VG9Db3VudHJ5KHJlc3VsdHMsIGNvdW50cnlBcnJheSwgY2l0eUFycmF5KSB7XG4gICAgcmVzdWx0cy5mb3JFYWNoKChyZXN1bHQpID0+IHtcbiAgICAgICAgaWYoIWNvdW50cnlBcnJheS5pbmNsdWRlcyhyZXN1bHQucGxhY2VOYW1lKSl7XG4gICAgICAgICAgICBjaXR5QXJyYXkuZm9yRWFjaCgoY2l0eU9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKGNpdHlPYmplY3QuY2l0eSA9PSByZXN1bHQucGxhY2VOYW1lKXtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnBsYWNlTmFtZSA9IGNpdHlPYmplY3QuY291bnRyeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZighY291bnRyeUFycmF5LmluY2x1ZGVzKHJlc3VsdC5wbGFjZU5hbWUpKXtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IHJlc3VsdHMuaW5kZXhPZihyZXN1bHQpO1xuICAgICAgICAgICAgcmVzdWx0cy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICAgIH1cbiAgICB9KTtcbiAgcmV0dXJuIHJlc3VsdHNcbn0iLCIvLyBSZXR1cm5zIHRoZSBuZXcgcXVlcnlcbmV4cG9ydCBmdW5jdGlvbiBnZXRRdWVyeShmaXJzdHZhbHVlLCBzZWNvbmR2YWx1ZSkge1xuICAgIHJldHVybiBgUFJFRklYIGRjdDogPGh0dHA6Ly9wdXJsLm9yZy9kYy90ZXJtcy8+XG4gICAgUFJFRklYIHdnczg0OiA8aHR0cDovL3d3dy53My5vcmcvMjAwMy8wMS9nZW8vd2dzODRfcG9zIz5cbiAgICBQUkVGSVggZ2VvOiA8aHR0cDovL3d3dy5vcGVuZ2lzLm5ldC9vbnQvZ2Vvc3BhcnFsIz5cbiAgICBQUkVGSVggc2tvczogPGh0dHA6Ly93d3cudzMub3JnLzIwMDQvMDIvc2tvcy9jb3JlIz5cbiAgICBQUkVGSVggZ246IDxodHRwOi8vd3d3Lmdlb25hbWVzLm9yZy9vbnRvbG9neSM+XG4gICAgUFJFRklYIHJkZjogPGh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyM+XG4gICAgUFJFRklYIHJkZnM6IDxodHRwOi8vd3d3LnczLm9yZy8yMDAwLzAxL3JkZi1zY2hlbWEjPlxuICAgIFxuICAgIFNFTEVDVCA/Y2hvID9wbGFjZU5hbWUgP2RhdGUgV0hFUkUge1xuICAgICAgICA/Y2hvIGRjdDpzcGF0aWFsID9wbGFjZSAuXG4gICAgICAgID9wbGFjZSBza29zOmV4YWN0TWF0Y2gvZ246cGFyZW50Q291bnRyeSA/bGFuZCAuXG4gICAgICAgID9sYW5kIGduOm5hbWUgP3BsYWNlTmFtZSAuXG4gICAgICAgID9jaG8gZGN0OmNyZWF0ZWQgP2RhdGUgLlxuICAgICAgICBGSUxURVIoeHNkOmludGVnZXIoP2RhdGUpID49ICR7Zmlyc3R2YWx1ZX0gJiYgeHNkOmludGVnZXIoP2RhdGUpIDw9ICR7c2Vjb25kdmFsdWV9KVxuICAgIH0gTElNSVQgMTAwMDAgYFxufSIsIi8vY2hlY2sgaWYgYW55IHBsYWNlbmFtZSBpcyBlcXVhbCB0byBvbmUgb2YgdGhlIGNvdW50cmllcywgaWYgc28gLT4gY291bnRyeSBjb3VudCArIDFcbmV4cG9ydCBmdW5jdGlvbiBjb3VudFRyYWNrZXIoIHJlc3VsdHMsIGRhdGFDb3VudCwgY291bnRyeUFycmF5ICl7XG4gICAgZGF0YUNvdW50LmZvckVhY2goY291bnRlciA9PiB7XG4gICAgICAgIGNvdW50ZXIucHJvcGVydGllcy5jb3VudCA9IDBcbiAgICB9KVxuICAgIGxldCBoaWdoZXN0Q291bnQgPSAwO1xuICBcdFxuICAgIHJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgICBpZihjb3VudHJ5QXJyYXkuaW5jbHVkZXMocmVzdWx0LnBsYWNlTmFtZSkpIHtcbiAgICAgICAgICAgIGRhdGFDb3VudC5mb3JFYWNoKChjb3VudGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoY291bnRlci5wcm9wZXJ0aWVzLm5hbWUgPT0gcmVzdWx0LnBsYWNlTmFtZSl7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50ZXIucHJvcGVydGllcy5jb3VudCA9IGNvdW50ZXIucHJvcGVydGllcy5jb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBpZihjb3VudGVyLnByb3BlcnRpZXMuY291bnQgPiBoaWdoZXN0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RDb3VudCA9IGNvdW50ZXIucHJvcGVydGllcy5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSlcbiAgcmV0dXJuIHsgcmVzdWx0cywgZGF0YUNvdW50LCBoaWdoZXN0Q291bnQgfVxufSIsImNvbnN0IGV2ZW50cyA9IGQzLnNlbGVjdCgnLmV2ZW50cycpXG5jb25zdCBnID0gZXZlbnRzLmFwcGVuZCgnZycpXG5ldmVudHMuYXBwZW5kKCd0ZXh0JylcbiAgICAudGV4dChcIkhpc3RvcmljYWwgZXZlbnRzXCIpXG4gICAgLmF0dHIoJ3gnLCAnMjAnKVxuICAgIC5hdHRyKCd5JywgJzIwJylcbiAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGlzdG9yaWNNb21lbnRzKG9iamVjdCwgZmlyc3R0aW1ldmFsdWUsIHNlY29uZHRpbWV2YWx1ZSl7XG4gIGF3YWl0IGQzLmNzdigna29sb25pYWxlLWRhdGEuY3N2JykudGhlbigoZGF0YSkgPT4ge1xuICAgIHJlbmRlckRhdGEoZGF0YSwgb2JqZWN0LCBmaXJzdHRpbWV2YWx1ZSwgc2Vjb25kdGltZXZhbHVlKVxuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyRGF0YShkYXRhLCBvYmplY3QsIGZpcnN0dGltZSwgc2Vjb25kdGltZSkge1xuICBsZXQgY291bnRyeSA9IG9iamVjdC5wcm9wZXJ0aWVzLm5hbWVcbiBcdGxldCBldmVudEFycmF5ID0gW11cbiBcdGxldCB5ID0gNzBcblx0ZXZlbnRzLnNlbGVjdCgnLmNvdW50cnlUaXRsZScpXG4gIFx0LnJlbW92ZSgpXG5cdGV2ZW50cy5hcHBlbmQoJ3RleHQnKVxuICAgIC50ZXh0KGNvdW50cnkpXG4gICAgLmF0dHIoJ3gnLCAnMjAnKVxuICAgIC5hdHRyKCd5JywgJzUwJylcbiAgICAuYXR0cignY2xhc3MnLCAnY291bnRyeVRpdGxlJylcblx0XG4gIGRhdGEuZm9yRWFjaChldmVudCA9PiB7XG4gICAgZXZlbnQuQ3VycmVudE5hbWVPZlRlcnJpdG9yeSA9PT0gY291bnRyeSA/IGV2ZW50QXJyYXkucHVzaChldmVudCkgOiBudWxsXG4gIH0pXG4gIGNvbnNvbGUubG9nKGV2ZW50QXJyYXkpXG5cdGV2ZW50QXJyYXkuZm9yRWFjaChldmVudCA9PiB7XG4gICAgZXZlbnQueSA9IHlcbiAgICBldmVudC5QZXJpb2RPZlRpbWUgPSBmaXhEYXRlKGV2ZW50LlBlcmlvZE9mVGltZSwgZmlyc3R0aW1lLCBzZWNvbmR0aW1lKVxuICAgIHkgKz0gMjBcbiAgfSlcbiAgZGlzcGxheURhdGEoZXZlbnRBcnJheSlcbn1cblxuZnVuY3Rpb24gZml4RGF0ZShkYXRlLCBmaXJzdHRpbWUsIHNlY29uZHRpbWUpe1xuICBkYXRlID0gZGF0ZS5zcGxpdCgnLScpXG4gIGRhdGVbMV0gPSAnICcgKyBkYXRlWzFdXG4gIGRhdGUgPSBkYXRlLmpvaW4oJy0nKS5zbGljZSgwLCAxMilcbiAgcmV0dXJuIGRhdGVcbn1cblxuZnVuY3Rpb24gZGlzcGxheURhdGEoZXZlbnRBcnJheSkge1xuICBnLnNlbGVjdEFsbCgndGV4dCcpXG4gICAgLmRhdGEoW10pXG4gICAgLmV4aXQoKVxuICAgIC5yZW1vdmUoKSBcbiBsZXQgdGV4dCA9IGcuc2VsZWN0QWxsKCd0ZXh0JykuZGF0YShldmVudEFycmF5KVxuICAgIHRleHRcblx0XHRcdC5lbnRlcigpXG4gICAgXHQuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC50ZXh0KCAoZCkgPT4geyByZXR1cm4gZC5Db2xvbnkgKyAnICcgKyBkLlBlcmlvZE9mVGltZSB9KVxuICAgICAgLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIilcbiAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIFwiMTZweFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsICgpID0+IHsgcmV0dXJuIDIwIH0pXG4gICAgICAuYXR0cihcInlcIiwgKGQpID0+IHsgcmV0dXJuIGQueSB9KTtcbn0iLCJpbXBvcnQgeyBwcmVwYXJlRGF0YSB9IGZyb20gJy4vcHJlcGFyZURhdGEnO1xuaW1wb3J0IHsgY2hhbmdlQ2l0eVRvQ291bnRyeSB9IGZyb20gJy4vY2hhbmdlQ2l0eVRvQ291bnRyeSdcbmltcG9ydCB7IGdldFF1ZXJ5IH0gZnJvbSAnLi9nZXRRdWVyeSc7XG5pbXBvcnQgeyBjb3VudFRyYWNrZXIgfSBmcm9tICcuL2NvdW50VHJhY2tlcic7XG5pbXBvcnQgeyBoaXN0b3JpY01vbWVudHMgfSBmcm9tICcuL2hpc3RvcmljTW9tZW50cyc7IFxuY29uc3Qgem9vbSA9IGQzLnpvb20oKS5zY2FsZUV4dGVudChbMSwxNl0pO1xuXG5jb25zdCBzdmcgPSBkMy5zZWxlY3QoJ3N2ZycpLmFwcGVuZCgnZycpXG5jb25zdCBnID0gZDMuc2VsZWN0KCdnJyk7XG5cbmNvbnN0IHdvcmxkTWFwID0gZDMuZ2VvTmF0dXJhbEVhcnRoMSgpOyAvL25hdHVyYWwgZWFydGggZ2l2ZXMgYSBnb29kIHJlYWxpc3RpYyB2aWV3IG9mIHRoZSBtYXBcbmNvbnN0IHBhdGhDcmVhdG9yID0gZDMuZ2VvUGF0aCgpLnByb2plY3Rpb24od29ybGRNYXApO1xuY29uc3QgYXBpID0gJ2h0dHBzOi8vYXBpLmRhdGEubmV0d2Vya2RpZ2l0YWFsZXJmZ29lZC5ubC9kYXRhc2V0cy9pdm8vTk1WVy9zZXJ2aWNlcy9OTVZXLTAyL3NwYXJxbCc7XG5jb25zdCBwbGF5QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBsYXknKVxuY29uc3QgY3VycmVudFNsaWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jdXJyZW50Jyk7XG5cbmxldCBzdGF0ZSA9IHtcbiAgICBjb3VudHJ5QXJyYXk6IFtdLFxuICAgIGNpdHlBcnJheTogW10sXG4gICAgZGF0YUNvdW50OiBbXSxcbiAgICBoaWdoZXN0Q291bnQ6IDAsXG4gICAgdW5pcXVlTm9kZXM6IFtdLFxuICAgIGN1cnJlbnRUaW1lOiAwLFxuICAgIG5vZGVXaWR0aDogMCxcbiAgICBzdG9wVGltZXI6IGZhbHNlLFxuICAgIHRpbWVGaWx0ZXI6IHtcbiAgICAgICAgZmlyc3RWYWx1ZTogMCxcbiAgICAgICAgc2Vjb25kVmFsdWU6IDUwMFxuICAgIH1cbn1cblxuLy9DcmVhdGUgYSBkaXYgaW5zaWRlIHRoZSBwYXJlbnQgZ3JvdXAgdG8gc2hvdyBjb3VudHJ5IG5hbWUgKyBvYmplY3QgY291bnRcbmxldCB0b29sdGlwID0gZDMuc2VsZWN0KFwiLndyYXBwZXJcIilcbiAgLmFwcGVuZChcImRpdlwiKVxuICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwiYWJzb2x1dGVcIilcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cbi8vIE1hcCB6b29tIGZ1bmN0aW9uXG5zdmcuY2FsbCh6b29tLm9uKCd6b29tJywgKCkgPT4ge1xuICAgIGcuYXR0cigndHJhbnNmb3JtJywgZDMuZXZlbnQudHJhbnNmb3JtKTtcbn0pKVxuXG4vLyBGZXRjaCBKU09OIHdpdGggYWxsIGNhcGl0YWwgY2l0aWVzICsgY291bnRyaWVzXG5jb25zdCBmZXRjaENpdHlUb0NvdW50cnkgPSAoZmV0Y2h1cmwpID0+IHtcbiAgICBmZXRjaChmZXRjaHVybClcbiAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgLnRoZW4oanNvbiA9PiB7ICAgIFxuICAgICAgICBzdGF0ZS5jaXR5QXJyYXkgPSBqc29uO1xuICAgIH0pXG59XG5mZXRjaENpdHlUb0NvdW50cnkoJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9zYW1heW8vY291bnRyeS1qc29uL21hc3Rlci9zcmMvY291bnRyeS1ieS1jYXBpdGFsLWNpdHkuanNvbicpXG5cbi8vIEZldGNoIG1hcCBsYXlvdXQgSlNPTiArIGNyZWF0ZSBhbiBhcnJheSBjb250YWluaW5nIHVuaXF1ZSBjb3VudHJpZXNcbmNvbnN0IHJlbmRlcm1hcExheW91dCA9ICgpID0+IHsgICAgIFxuICAgIGQzLmpzb24oJ2h0dHBzOi8vZW5qYWxvdC5naXRodWIuaW8vd3dzZC9kYXRhL3dvcmxkL3dvcmxkLTExMG0uZ2VvanNvbicpXG4gICAgICAgIC50aGVuKGpzb24gPT4ge1xuICAgICAgICAgICAganNvbi5mZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuY291bnRyeUFycmF5LnB1c2goZmVhdHVyZS5wcm9wZXJ0aWVzLm5hbWUpO1xuICAgICAgICAgICAgICAgIHN0YXRlLmRhdGFDb3VudC5wdXNoKGZlYXR1cmUpXG4gICAgICAgICAgICAgICAgc3RhdGUuZGF0YUNvdW50W2ldLnByb3BlcnRpZXMuY291bnQgPSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG59O1xucmVuZGVybWFwTGF5b3V0KCk7IFxuXG4vLyBwdXNoIHVuaXF1ZSB2YWx1ZXMgdG8gYXJyYXkgZm9yIHRoZSB0aW1lbGluZSBsYXRlciBvbmVcbmNvbnN0IHB1c2hUb0FycmF5ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGxldCBub2RlID0gZWxlbWVudC50ZXh0Q29udGVudFxuICAgIHN0YXRlLnVuaXF1ZU5vZGVzLnB1c2gobm9kZSlcbn1cblxuLy8gVGFrZSBmaXJzdCArIHNlY29uZCB2YWx1ZSBmcm9tIHRpbWVsaW5lIGNsaWNrIHRvIHB1dCBpbiBhbiBhcnJheSBsYXRlciBvblxuY29uc3QgY2hhbmdlUXVlcnkgPSBmdW5jdGlvbigpIHtcbiAgXHRjdXJyZW50U2xpZGVyLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykgPyBudWxsIDogY3VycmVudFNsaWRlci5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICAgIHN0YXRlLnN0b3BUaW1lciA9IHRydWVcbiAgICBsZXQgaW5kZXggPSBzdGF0ZS51bmlxdWVOb2Rlcy5pbmRleE9mKHRoaXMudGV4dENvbnRlbnQpXG4gICAgc3RhdGUuY3VycmVudFRpbWUgPSBpbmRleFxuICAgIGN1cnJlbnRTbGlkZXIuc3R5bGUubGVmdCA9IHN0YXRlLm5vZGVXaWR0aCAqIGluZGV4ICsgJ3B4JztcbiAgICBsZXQgY29udGVudCA9IHN0YXRlLnVuaXF1ZU5vZGVzW2luZGV4XVxuICAgICAgICBjb250ZW50ID0gY29udGVudC5zcGxpdChcIi1cIik7XG4gICAgICAgIGxldCBzZWxlY3RlZFRpbWUgPSB7XG4gICAgICAgICAgICBmaXJzdFZhbHVlOiBjb250ZW50WzBdLFxuICAgICAgICAgICAgc2Vjb25kVmFsdWU6IGNvbnRlbnRbMV1cbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVUaW1lKHNlbGVjdGVkVGltZSlcbn1cblxuLy8gQ2xlYW4gdGhlIGRhdGUgZm9ybWF0IGZyb20geHh4eC14eHh4IHRvIG9uZSBudW1iZXJcbmNvbnN0IGRhdGVGb3JtYXQgPSBkYXRlID0+IHtcbiAgICBkYXRlID0gZGF0ZS5zcGxpdCgnLScpXG4gICAgZGF0ZVsxXSA9IGRhdGVbMV0udHJpbSgpXG4gICAgZGF0ZVswXSA9IHBhcnNlSW50KGRhdGVbMF0pXG4gICAgZGF0ZVsxXSA9IHBhcnNlSW50KGRhdGVbMV0pXG4gICAgZGF0ZSA9IE1hdGgucm91bmQoKGRhdGVbMF0gKyBkYXRlWzFdKSAvIDIpXG59XG5cbi8vIFVwZGF0ZXMgdGltZSBmaWx0ZXJcbmNvbnN0IHVwZGF0ZVRpbWUgPSAodGltZSkgPT4ge1xuICAgIHN0YXRlLnRpbWVGaWx0ZXIgPSB7XG4gICAgICAgIGZpcnN0VmFsdWU6IHRpbWUuZmlyc3RWYWx1ZSxcbiAgICAgICAgc2Vjb25kVmFsdWU6IHRpbWUuc2Vjb25kVmFsdWVcbiAgICB9XG4gICAgdXBkYXRlRGF0YSgpXG59XG5cbmZ1bmN0aW9uIHJlbmRlckxlZ2VuZGEoKSB7XG4gbGV0IGxlZ2VuZGEgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmRhJylcbiBsZWdlbmRhIFxuIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgLnRleHQoXCJNYXg6XCIpXG4gICAgICAuYXR0cigneCcsICcyMCcpXG4gICAgICAuYXR0cigneScsICcxNScpO1xuICBsZWdlbmRhXG4gIFx0LmFwcGVuZCgncmVjdCcpXG4gIFx0XHQuYXR0cigneCcsICc2MCcpXG4gIFx0XHQuYXR0cigneScsICcwJylcbiAgXHRcdC5hdHRyKCdjbGFzcycsICdsZWdlbmRhIGxlZ2VuZGEtbWF4JylcbiAgXHRcdC5hdHRyKCdmaWxsJywgJ3JlZCcpXG4gICBsZWdlbmRhIFxuIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgLnRleHQoXCJNaW46XCIpXG4gICAgICAuYXR0cigneCcsICcyMCcpXG4gICAgICAuYXR0cigneScsICc0MCcpO1xuICBsZWdlbmRhXG4gIFx0LmFwcGVuZCgncmVjdCcpXG4gIFx0XHQuYXR0cigneCcsICc2MCcpXG4gIFx0XHQuYXR0cigneScsICcyNScpXG4gIFx0XHQuYXR0cignY2xhc3MnLCAnbGVnZW5kYSBsZWdlbmRhLW1pbicpXG4gIFx0XHQuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gIFx0XHQuYXR0cignJylcbn1cblxuLy8gUmVuZGVyIGFsbCBlbGVtZW50cyBvbiB0aGUgU1ZHXG5jb25zdCByZW5kZXJTVkcgPSAoKSA9PiB7XG4gIFx0cmVuZGVyTGVnZW5kYSgpXG4gICAgZy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnc3BoZXJlJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoQ3JlYXRvcih7dHlwZTogJ1NwaGVyZSd9KSk7XG4gICAgbGV0IHNjYWxlQ29sb3IgPSBkMy5zY2FsZVNxcnQoKVxuICAgICAgICAuZG9tYWluKFswLCAoc3RhdGUuaGlnaGVzdENvdW50KV0pXG4gICAgICAgIC5yYW5nZShbJyNmZmZmZmYnLCAncmVkJ10pO1xuICAgIGcuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAuZGF0YShzdGF0ZS5kYXRhQ291bnQpIFxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgcGF0aENyZWF0b3IpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjb3VudHJ5JylcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCAnYmxhY2snKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgMC4yKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBcIndoaXRlXCIpXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgMSlcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdzdHJva2Utb3BhY2l0eScsIDAuMilcbiAgICAgICAgICAgIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcImNsaWNrXCIsIChkKSA9PiB7IFxuXHRcdFx0XHRcdFx0aGlzdG9yaWNNb21lbnRzKGQsIHN0YXRlLnRpbWVGaWx0ZXIuZmlyc3RWYWx1ZSwgc3RhdGUudGltZUZpbHRlci5zZWNvbmRWYWx1ZSk7XG4gICAgICAgICAgICB0b29sdGlwXG4gICAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKVxuICAgICAgICAgICAgLnRleHQoZC5wcm9wZXJ0aWVzLm5hbWUgKyAnOiAnICsgZC5wcm9wZXJ0aWVzLmNvdW50ICsgJyBvYmplY3RlbicpXG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcIm1vdXNlbW92ZVwiLCAoZCkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcFxuICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS00MCkrXCJweFwiKVxuICAgICAgICAgICAgLnN0eWxlKFwibGVmdFwiLChldmVudC5wYWdlWC0zNSkrXCJweFwiKX0pXG4gICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDMwMClcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgKGQpID0+IHNjYWxlQ29sb3IoZC5wcm9wZXJ0aWVzLmNvdW50KSlcbiAgICAgICAgXG4gICAgICAgIHBsYXlCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwbGF5VGltZWxpbmUpXG59XG5cbi8vIFJ1biB0aGUgU1BBUVJMIHF1ZXJ5LCByZW5kZXIgZXZlcnkgZWxlbWVudCwgY3JlYXRlIGNvdW50cyBmb3IgdGhlIGhlYXRtYXBcbmNvbnN0IHJ1blF1ZXJ5ID0gKGFwaSkgPT4ge1xuICBcdGxldCBxdWVyeSA9IGdldFF1ZXJ5KHN0YXRlLnRpbWVGaWx0ZXIuZmlyc3RWYWx1ZSwgc3RhdGUudGltZUZpbHRlci5zZWNvbmRWYWx1ZSlcbiAgICAvLyBDYWxsIHRoZSB1cmwgd2l0aCB0aGUgcXVlcnkgYXR0YWNoZWQsIG91dHB1dCBkYXRhXG4gICAgZmV0Y2goYXBpICsgXCI/cXVlcnk9XCIgKyBlbmNvZGVVUklDb21wb25lbnQocXVlcnkpICsgXCImZm9ybWF0PWpzb25cIilcbiAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSlcbiAgICAudGhlbihqc29uID0+IHtcbiAgICAgICAgLy9jaGFuZ2UgcmVzdWx0cyBwbGFjZW5hbWUgdG8gbWF0Y2ggbW9yZSBpdGVtcyBpbiB0aGUgZm9sbG93aW5nIGZvckVhY2guIElmIGl0ZW0gaXMgbm90IGluIGNpdHkgSlNPTiAtPiBkZWxldGVcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBqc29uLnJlc3VsdHMuYmluZGluZ3M7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdHMpXG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpKSA9PiB7XG4gICAgICAgICAgICBpZihyZXN1bHQuZGF0ZS52YWx1ZS5pbmNsdWRlcygnLScpKSB7XG4gICAgICAgICAgICAgICAgZGF0ZUZvcm1hdChyZXN1bHQuZGF0ZS52YWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHNbaV0gPSB7XG4gICAgICAgICAgICAgICAgcGxhY2VOYW1lOiByZXN1bHQucGxhY2VOYW1lLnZhbHVlLFxuICAgICAgICAgICAgICAgIGRhdGU6IHJlc3VsdC5kYXRlLnZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHJlc3VsdHMgPSBjaGFuZ2VDaXR5VG9Db3VudHJ5KHJlc3VsdHMsIHN0YXRlLmNvdW50cnlBcnJheSwgc3RhdGUuY2l0eUFycmF5KVxuICAgICAgXHRsZXQgdHJhY2tlciA9IGNvdW50VHJhY2tlcihyZXN1bHRzLCBzdGF0ZS5kYXRhQ291bnQsIHN0YXRlLmNvdW50cnlBcnJheSlcblx0XHRcdFx0c3RhdGUuZGF0YUNvdW50ID0gdHJhY2tlci5kYXRhQ291bnQ7XG5cdFx0XHRcdHN0YXRlLmhpZ2hlc3RDb3VudCA9IHRyYWNrZXIuaGlnaGVzdENvdW50O1xuICAgICAgICByZW5kZXJTVkcoKVxuICAgIH0pXG59O1xucnVuUXVlcnkoYXBpLCBnZXRRdWVyeSgpKTtcblxuLy8gQ3JlYXRlIGV2ZW50bGlzdGVuZXIgZm9yIGV2ZXJ5IHRpbWVsaW5lIG9iamVjdFxuY29uc3QgdGltZUxpbmUgPSAoKSA9PiB7XG4gICAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRpbWVsaW5lIHAnKVxuICAgIGxldCBjdXJyZW50V2lkdGggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudGltZWxpbmUnKS5vZmZzZXRXaWR0aCAvIG5vZGVzLmxlbmd0aFxuICAgIHN0YXRlLm5vZGVXaWR0aCA9IGN1cnJlbnRXaWR0aFxuICAgIGN1cnJlbnRTbGlkZXIuc3R5bGUud2lkdGggPSBzdGF0ZS5ub2RlV2lkdGgrJ3B4J1xuICAgIG5vZGVzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIHB1c2hUb0FycmF5KGVsZW1lbnQpXG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjaGFuZ2VRdWVyeSlcbiAgICB9KVxufVxudGltZUxpbmUoKTtcblxuLy8gVXBkYXRlcyBkYXRhXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVEYXRhKCkge1xuICBcdGxldCBkYXRhID0gYXdhaXQgcHJlcGFyZURhdGEoc3RhdGUudGltZUZpbHRlci5maXJzdFZhbHVlLCBzdGF0ZS50aW1lRmlsdGVyLnNlY29uZFZhbHVlKVxuXHRcdGxldCB0cmFja2VyID0gY291bnRUcmFja2VyKGRhdGEsIHN0YXRlLmRhdGFDb3VudCwgc3RhdGUuY291bnRyeUFycmF5KVxuXHRcdFx0XHRzdGF0ZS5kYXRhQ291bnQgPSB0cmFja2VyLmRhdGFDb3VudDtcblx0XHRcdFx0c3RhdGUuaGlnaGVzdENvdW50ID0gdHJhY2tlci5oaWdoZXN0Q291bnQ7XG4gICAgbGV0IHNjYWxlQ29sb3IgPSBkMy5zY2FsZVNxcnQoKVxuICAgICAgICAuZG9tYWluKFswLCAoc3RhdGUuaGlnaGVzdENvdW50KV0pXG4gICAgICAgIC5yYW5nZShbJyNmZmZmZmYnLCAncmVkJ10pO1xuICBcbiAgICBzdmcuc2VsZWN0QWxsKCdnJylcbiAgICAgICAgLmRhdGEoc3RhdGUuZGF0YUNvdW50KVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuc2VsZWN0QWxsKCcuY291bnRyeScpXG4gICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKDMwMClcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgKGQpID0+IHNjYWxlQ29sb3IoZC5wcm9wZXJ0aWVzLmNvdW50KSlcbn1cblxuY29uc3QgcGxheVRpbWVsaW5lID0gKCkgPT4ge1xuICAgIHN0YXRlLmN1cnJlbnRUaW1lID0gMFxuICAgIHN0YXRlLnN0b3BUaW1lciA9IGZhbHNlXG4gICAgY3VycmVudFNsaWRlci5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpID8gbnVsbCA6IGN1cnJlbnRTbGlkZXIuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJylcbiAgICBjYWxsYmFja0ZuKDAsIGNhbGxiYWNrRm4pXG59XG5cbmZ1bmN0aW9uIGNhbGxiYWNrRm4oaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGxlbmd0aCA9IHN0YXRlLnVuaXF1ZU5vZGVzLmxlbmd0aFxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjdXJyZW50U2xpZGVyLnN0eWxlLmxlZnQgPSBzdGF0ZS5ub2RlV2lkdGggKiBpbmRleCArICdweCc7XG4gICAgfSwgMzAwKTtcbiAgICBcbiAgICBsZXQgY29udGVudCA9IHN0YXRlLnVuaXF1ZU5vZGVzW3N0YXRlLmN1cnJlbnRUaW1lXVxuICAgIGNvbnRlbnQgPSBjb250ZW50LnNwbGl0KCctJylcbiAgICBjb25zb2xlLmxvZyhjb250ZW50KVxuICAgIGxldCBzZWxlY3RlZFRpbWUgPSB7XG4gICAgICAgIGZpcnN0VmFsdWU6IGNvbnRlbnRbMF0sXG4gICAgICAgIHNlY29uZFZhbHVlOiBjb250ZW50WzFdXG4gICAgfVxuICAgIHVwZGF0ZVRpbWUoc2VsZWN0ZWRUaW1lKVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZihpbmRleCA8IHN0YXRlLnVuaXF1ZU5vZGVzLmxlbmd0aC0xICYmIHN0YXRlLnN0b3BUaW1lciA9PSBmYWxzZSl7XG4gICAgICAgICAgICBjYWxsYmFja0ZuKGluZGV4ICsgMSwgY2FsbGJhY2spXG4gICAgICAgIH1cbiAgICB9LCAxNTAwKTtcbiAgICBzdGF0ZS5jdXJyZW50VGltZSAhPSBsZW5ndGgtMSA/XG4gICAgICAgIHN0YXRlLmN1cnJlbnRUaW1lICs9IDEgOlxuICAgICAgICBzdGF0ZS5jdXJyZW50VGltZSA9IDBcbn1cbiJdLCJuYW1lcyI6WyJnZXRRdWVyeSIsImciLCJkYXRlRm9ybWF0Il0sIm1hcHBpbmdzIjoiOzs7RUFBTyxlQUFlLFdBQVcsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDOztJQUV4RCxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBQztHQUM5QyxJQUFJLFFBQVEsR0FBRyxzRkFBc0YsQ0FBQztHQUN0RyxJQUFJLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFDO0lBQzVDLE9BQU8sSUFBSTtHQUNaOztFQUVELGVBQWUsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7TUFDbkMsT0FBTyxLQUFLLENBQUMsR0FBRyxHQUFHLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxjQUFjLENBQUM7T0FDekUsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7T0FDdkIsSUFBSSxDQUFDLElBQUksSUFBSTtVQUNWLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1VBQ3BDLE9BQU8sQ0FBQyxPQUFP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