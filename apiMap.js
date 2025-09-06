const city = 'New York';
const apiUrlMap = `https://nominatim.openstreetmap.org/search?q=${city}&format=json`

fetch(apiUrlMap)
    .then(response => response.json())
    .then(data => {
        console.log(data);

        if (data && data.length > 0) {
            const latitude = data[0].lat;
            const longitude = data[0].lon;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        } else {
            console.log('Nenhum dado encontrado para a cidade especificada.');
        }
    })
    .catch (error => console.error('Erro ao buscar dados de geocodificação:', error))



