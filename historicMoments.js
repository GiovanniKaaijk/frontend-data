const events = d3.select('.events')
const g = events.append('g')
events.append('text')
    .text("Historical events")
    .attr('x', '20')
    .attr('y', '20')
    .attr('class', 'title')
    

export async function historicMoments(object, firsttimevalue, secondtimevalue){
  await d3.csv('koloniale-data.csv').then((data) => {
    renderData(data, object, firsttimevalue, secondtimevalue)
  });
}

function renderData(data, object, firsttime, secondtime) {
  let country = object.properties.name
 	let eventArray = []
 	let y = 70
	events.select('.countryTitle')
  	.remove()
	events.append('text')
    .text(country)
    .attr('x', '20')
    .attr('y', '50')
    .attr('class', 'countryTitle')
	
  data.forEach(event => {
    event.CurrentNameOfTerritory === country ? eventArray.push(event) : null
  })
  console.log(eventArray)
	eventArray.forEach(event => {
    event.y = y
    event.PeriodOfTime = fixDate(event.PeriodOfTime, firsttime, secondtime)
    y += 20
  })
  displayData(eventArray)
}

function fixDate(date, firsttime, secondtime){
  date = date.split('-')
  date[1] = ' ' + date[1]
  date = date.join('-').slice(0, 12)
  return date
}

function displayData(eventArray) {
  g.selectAll('text')
    .data([])
    .exit()
    .remove() 
 let text = g.selectAll('text').data(eventArray)
    text
			.enter()
    	.append('text')
      .text( (d) => { return d.Colony + ' ' + d.PeriodOfTime })
      .attr("font-family", "sans-serif")
      .attr("font-size", "16px")
      .attr("x", () => { return 20 })
      .attr("y", (d) => { return d.y });
}