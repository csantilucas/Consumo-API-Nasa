
require(["esri/Map", 'esri/views/SceneView'], (Map, SceneView) => {
    const map = new Map({
        basemap: "topo-vector",
    });
    const view = new SceneView({
        container: "viewdiv",
        map: map,
        center:[-12.2401, -53.1805],
    })

    view.on("click", (event) => {
        // 'event.mapPoint' contém as coordenadas geográficas do clique
        const longitude = event.mapPoint.longitude;
        const latitude = event.mapPoint.latitude;

        console.log(`Você clicou nas coordenadas: Longitude: ${longitude.toFixed(4)}, Latitude: ${latitude.toFixed(4)}`);
    });
});
