// Change the city data to country
export function changeCityToCountry(results, countryArray, cityArray) {
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
            results.splice(index, 1)
        }
    });
  return results
}