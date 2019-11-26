// Returns the new query
export function getQuery(firstvalue, secondvalue) {
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