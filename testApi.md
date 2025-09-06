const PARAMETROS = 'T2M,RH2M,PRECTOTCORR';
const dia_previsao = 1;
const mes_previsao = 6;
const Anos_Para_Media = 10;
const Ano_Atual = new Date().getFullYear();
const dadosAnteriores = [];
const dadosClimaticosDoAno = {};
const chamadasApi = [];


console.log(`Iniciando busca de dados históricos para o dia ${dia_previsao}/${mes_previsao} dos últimos ${Anos_Para_Media} anos...`);
for (let i = 1; i <= Anos_Para_Media; i++) {
    const ano = Ano_Atual - i;
    const mesFormatado = mes_previsao.toString().padStart(2, '0');
    const diaFormatado = dia_previsao.toString().padStart(2, '0');
    const DATA = `${ano}${mesFormatado}${diaFormatado}`;
    const apiUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?start=${DATA}&end=${DATA}&latitude=-12.74&longitude=-60.13&community=ag&parameters=${PARAMETROS}&header=true`;
    chamadasApi.push(fetch(apiUrl));
}

Promise.all(chamadasApi)
    .then(respostas => {
        return Promise.all(respostas.map(res => res.json()));
    })
    .then(dadosPorAno => {
        dadosPorAno.forEach(dadosDeUmAno => {
            const dados = dadosDeUmAno.properties.parameter;
            const dataDoResultado = Object.keys(dados.T2M)[0];
            const temperatura = dados.T2M[dataDoResultado];
            const umidade = dados.RH2M[dataDoResultado];
            const precipitacao = dados.PRECTOTCORR[dataDoResultado];

            if (temperatura !== -999 && umidade !== -999 && precipitacao !== -999) {
                const dadosClimaticos = {
                    data: dataDoResultado,
                    temperatura: temperatura,
                    umidade: umidade,
                    precipitacao: precipitacao
                };
                dadosAnteriores.push(dadosClimaticos);
            }

        });
        if (dadosAnteriores.length > 0) {
            const soma = dadosAnteriores.reduce((acumulador, item) => {
                acumulador.temperatura += item.temperatura;
                acumulador.umidade += item.umidade;
                acumulador.precipitacao += item.precipitacao;
                return acumulador;
            }, { temperatura: 0, umidade: 0, precipitacao: 0 });

            const mediaTemperatura = soma.temperatura / dadosAnteriores.length;
            const mediaUmidade = soma.umidade / dadosAnteriores.length;
            const mediaPrecipitacao = soma.precipitacao / dadosAnteriores.length;
            console.log(`\n--- Previsão Climatológica para o dia ${dia_previsao}/${mes_previsao} ---`);
            console.log(`Baseado na média de ${dadosAnteriores.length} anos de dados válidos:`);
            console.log(`- Temperatura esperada: ${mediaTemperatura.toFixed(2)} °C`);
            console.log(`- Umidade esperada: ${mediaUmidade.toFixed(2)} %`);
            console.log(`- Precipitação média esperada: ${mediaPrecipitacao.toFixed(2)} mm`);

        } else {

            console.log("\nNão foram encontrados dados históricos suficientes para calcular a média.");

        }
    })

    .catch(error => {

        console.error('Ocorreu um erro durante uma das requisições:', error);

    });