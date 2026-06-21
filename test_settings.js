fetch('http://localhost:3000/api/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: "TAX_ENABLED", value: "false", dataType: "bool" })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
