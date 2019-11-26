//check if any placename is equal to one of the countries, if so -> country count + 1
export function countTracker( results, dataCount, countryArray ){
    dataCount.forEach(counter => {
        counter.properties.count = 0
    })
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
    })
  return { results, dataCount, highestCount }
}