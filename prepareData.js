export async function prepareData(firstvalue, secondvalue){
  //Load the data and return a promise which resolves with said data
  let query = getQuery(firstvalue, secondvalue)
	let endpoint = 'https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-02/sparql';
	let data = await runNewQuery(endpoint, query)
  return data
}

async function runNewQuery(api, query) {
    return fetch(api + "?query=" + encodeURIComponent(query) + "&format=json")
    .then(res => res.json())
    .then(json => {
        let results = json.results.bindings;
        results.forEach((result, i) => {
            if(result.date.value.includes('-')) {
                dateFormat(result.date.value)
            }
            results[i] = {
                placeName: result.placeName.value,
                date: result.date.value
            }
        })
      console.log(results)
      return results
    })
}

const dateFormat = date => {
    date = date.split('-')
    date[1] = date[1].trim()
    date[0] = parseInt(date[0])
    date[1] = parseInt(date[1])
    date = Math.round((date[0] + date[1]) / 2)
}

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
}