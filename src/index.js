const program = require('commander');
const ora = require('ora');
const fetch = require('node-fetch');
const Table = require('cli-table2');

program.version('1.0.0')
  .option('-l, --limit <n>', 'Limit number of rows to collect - default 10', parseInt)
  .parse(process.argv);

const spinner = ora('Fetching Currencies');
const api_base_url = 'https://api.coinmarketcap.com/v1/ticker/';

function makeTable({ head, colWidths, data, format }) {
  const table = new Table({
    head,
    colWidths,
  });
  table.push(...data.map(format));
  return table;
}

function makeCurrencyTable(rows) {
  const formatCurrency = (row) => [
    row.name,
    row.symbol,
    row.price_usd,
    row['24h_volume_usd'],
    row.percent_change_24h,
    new Date(+row.last_updated * 1000).toLocaleString()
  ];
  
  const currencyTable = makeTable({
    head: ['Name', 'Symbol', 'Price (USD)', 'Volume (USD)', '24Hr Change', 'LastUpdated'],
    colWidths: [13, 10, 13, 15, 15, 22],
    data: rows,
    format: formatCurrency
  })

  return currencyTable;
}

function makeQueryString(queryObj) {
  return Object.keys(queryObj)
    .map((key) => `${key}=${queryObj[key]}`)
    .join('&');
}

function checkResponse(response) {
  if (response.ok) return response;
  throw new Error('Fetch was unsuccessful');  
}

async function getCurrencies(url, options = { limit: 10 }) {
  spinner.start();

  try {
    const results = await fetch(`${url}?${makeQueryString(options)}`).then(checkResponse);
    const json = await results.json();
    spinner.succeed();
    return json;
  } catch(err) {
    spinner.fail();
    throw err;
  }
}

(async function main() {
  const options = {
    limit: program.limit || 10  
  }
  const currencies = await getCurrencies(api_base_url, options);
  const table = makeCurrencyTable(currencies);
  console.log(table.toString());
})();
