document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('dataForm');
    const resultadoCard = document.getElementById('resultadoCard');
    const dateInput = document.getElementById('dateInput');
    const cityInput = document.getElementById('cityInput');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        // --- VARIÁVEIS DE CONFIGURAÇÃO ---
        // Movidas para cá para serem acessíveis em todo o processo
        const Anos_Para_Media = 10; 
        const PARAMETROS = 'T2M,RH2M,PRECTOTCORR';

        const dateValue = dateInput.value;
        const cityValue = cityInput.value;

        if (!dateValue || !cityValue) {
            resultadoCard.classList.remove('hidden');
            resultadoCard.innerHTML = `<p class="error-message">Por favor, preencha a data e a cidade.</p>`;
            return;
        }

        resultadoCard.classList.remove('hidden');
        resultadoCard.innerHTML = `
            <div class="loader"></div>
            <p style="text-align: center;">Buscando coordenadas para ${cityValue}...</p>
        `;

        const apiUrlMap = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityValue)}&format=json&limit=1`;

        fetch(apiUrlMap)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro de rede ao buscar coordenadas: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data || data.length === 0) {
                    throw new Error(`Não foi possível encontrar a cidade "${cityValue}".`);
                }

                const latitude = data[0].lat;
                const longitude = data[0].lon;
                console.log(`Coordenadas encontradas: Lat ${latitude}, Lon ${longitude}`);

                resultadoCard.innerHTML = `
                    <div class="loader"></div>
                    <p style="text-align: center;">Buscando dados históricos... Isso pode levar um momento.</p>
                `;

                const [, mes, dia] = dateValue.split('-').map(num => parseInt(num));
                const anoDeReferencia = new Date().getFullYear();
                const chamadasApi = [];

                for (let i = 1; i <= Anos_Para_Media; i++) { // Agora Anos_Para_Media é visível aqui
                    const ano = anoDeReferencia - i;
                    const mesFormatado = mes.toString().padStart(2, '0');
                    const diaFormatado = dia.toString().padStart(2, '0');
                    const DATA = `${ano}${mesFormatado}${diaFormatado}`;

                    const apiUrlNasa = `https://power.larc.nasa.gov/api/temporal/daily/point?start=${DATA}&end=${DATA}&latitude=${latitude}&longitude=${longitude}&community=ag&parameters=${PARAMETROS}&header=true`;
                    chamadasApi.push(fetch(apiUrlNasa));
                }
                
                return Promise.all(chamadasApi);
            })
            .then(respostas => {
                const respostasJson = respostas.map(res => {
                    if (!res.ok) {
                        console.warn(`Uma das chamadas à API da NASA falhou com status: ${res.status}`);
                        return null;
                    }
                    return res.json();
                });
                return Promise.all(respostasJson);
            })
            .then(dadosPorAno => {
                const dadosValidos = dadosPorAno.filter(dado => dado !== null);
                
                const dadosAnteriores = [];
                dadosValidos.forEach(dadosDeUmAno => {
                     if (dadosDeUmAno?.properties?.parameter?.T2M && Object.keys(dadosDeUmAno.properties.parameter.T2M).length > 0) {
                        const dados = dadosDeUmAno.properties.parameter;
                        const dataDoResultado = Object.keys(dados.T2M)[0];
                        const temperatura = dados.T2M[dataDoResultado];
                        const umidade = dados.RH2M[dataDoResultado];
                        const precipitacao = dados.PRECTOTCORR[dataDoResultado];

                        if (temperatura !== -999 && umidade !== -999 && precipitacao !== -999) {
                            dadosAnteriores.push({ temperatura, umidade, precipitacao });
                        }
                    }
                });

                if (dadosAnteriores.length > 0) {
                    const soma = dadosAnteriores.reduce((acc, item) => {
                        acc.temperatura += item.temperatura;
                        acc.umidade += item.umidade;
                        acc.precipitacao += item.precipitacao;
                        return acc;
                    }, { temperatura: 0, umidade: 0, precipitacao: 0 });

                    const mediaTemperatura = soma.temperatura / dadosAnteriores.length;
                    const mediaUmidade = soma.umidade / dadosAnteriores.length;
                    const mediaPrecipitacao = soma.precipitacao / dadosAnteriores.length;
                    const anoDeReferencia = new Date().getFullYear();
                    // Agora Anos_Para_Media também é visível aqui, na linha do erro original
                    const primeiroAno = anoDeReferencia - Anos_Para_Media; 
                    const ultimoAno = anoDeReferencia - 1;
                    console.log(`Médias calculadas: Temp ${mediaTemperatura}, Umid ${mediaUmidade}, Prec ${mediaPrecipitacao}`);
                    console.log(dadosAnteriores)

                    resultadoCard.innerHTML = `
                        <h3>Média Climatológica para ${dateValue.split('-')[2]}/${dateValue.split('-')[1]} em ${cityValue}</h3>
                        <p>Baseado na média histórica de ${dadosAnteriores.length} anos válidos (${primeiroAno} a ${ultimoAno}).</p>
                        <ul>
                            <li><strong>Temperatura Média:</strong> <span>${mediaTemperatura.toFixed(2)} °C</span></li>
                            <li><strong>Umidade Média:</strong> <span>${mediaUmidade.toFixed(2)} %</span></li>
                            <li><strong>Precipitação Média:</strong> <span>${mediaPrecipitacao.toFixed(2)} mm</span></li>
                        </ul>
                    `;
                } else {
                    resultadoCard.innerHTML = `<h3>Sem Dados</h3><p>Não foram encontrados dados históricos suficientes para a data e local selecionados.</p>`;
                }

            })
            .catch(error => {
                console.error('Ocorreu um erro durante o processo:', error);
                resultadoCard.innerHTML = `<h3>Erro</h3><p>${error.message}</p><p>Isso pode ser um erro de CORS, verifique o console para mais detalhes.</p>`;
            });
    });
});