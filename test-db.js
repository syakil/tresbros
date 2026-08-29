const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/tresbros"
  });

  try {
    await client.connect();
    const res = await client.query('SELECT "Code", "Name" FROM "ChartOfAccounts"');
    console.log("COAs:");
    console.table(res.rows);

    const journals = await client.query('SELECT * FROM "JournalEntries" ORDER BY "Date" DESC LIMIT 5');
    console.log("\nJournals:");
    console.table(journals.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

test();
