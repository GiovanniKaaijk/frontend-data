# frontend-data

## Nationaal Stichting Wereld Culturen
The perfect website to discover more about your most favorite spots in the wold.
<img width="750" alt="Schermafbeelding 2019-10-18 om 11 09 20" src="https://user-images.githubusercontent.com/43671292/68860278-82cf6d00-06e9-11ea-92b6-07dba0ee7684.png">

## Table of Contents

- [Wiki](#Wiki)
- [Description](#Description)
- [Features](#Features)
  - [API](#API)
  - [App features](#app-features)
- [Installation](#Installation)
  - [Keep up to date](#Keep-up-to-date)
- [Contributing](#Contributing)
- [License](#License)

## Wiki

Follow the progress on the [wiki](https://github.com/GiovanniKaaijk/frontend-data/wiki).

## Description

During this course I created a web app to discover more about the history of the world. The data I use comes from [Netwerk Digitaal Erfgoed](https://www.netwerkdigitaalerfgoed.nl/). The user has the ability to explore the world over time. The map shows a heatmap based on the amout of objects found in a country in an certain period of time.

## Features

### Api

Trough an API the app collects different objects, the following data is requested from the objects:
```
{
    cho: {type: "uri", value: "https://hdl.handle.net/20.500.11840/termmaster8241"}
    placeName: {type: "literal", value: "Saudi Arabia"}
}
```
The SPARQL query:
```
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX gn: <http://www.geonames.org/ontology#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?cho ?placeName ?date WHERE {
    ?cho skos:exactMatch/gn:parentCountry ?land .
    ?land gn:name ?placeName .
    OPTIONAL { ?cho dct:created ?date }
    } 
LIMIT 10000
```

### App features
- Search historical objects found on your favorite spots
- Explore the heatmap of the world
- Display colonial events 

### Upcoming features
- Explore the world over time

## Interested in the project? Use the following steps to clone the project to your local computer:

## Before you clone

* Install Node.js
* Install a Code Editor
* An CLI(Command Line Interface) like bash or iTerm

## Used (necessary sources)

* NPM
* D3

* When cloned, use npm install to install all the packages at once

## Installation

```
git clone https://github.com/GiovanniKaaijk/frontend-data.git
```
Get into the right folder
```
cd frontend-data
```
Install used npm packages
```
npm install
```

## Keep up to date
Make sure you pull the repository once in a while since we are still working on this project, you can do this by using ```git pull```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Sources
Sources used in this app:
- [Creating the map](https://www.youtube.com/watch?v=Qw6uAg3EO64&t=821s)
- [CSV to object](https://stackoverflow.com/questions/42285441/how-to-read-in-csv-with-d3-v4)

# License
[MIT](https://github.com/GiovanniKaaijk/functional-programming/blob/master/LICENSE)
