const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'US' },
  { name: 'organizationName', value: 'NashosWMS Development' },
  { name: 'organizationalUnitName', value: 'Development' }
];

const pems = selfsigned.generate(attrs, {
  algorithm: 'sha256',
  days: 365,
  keySize: 2048,
  extensions: [
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2,
          value: 'localhost'
        },
        {
          type: 2,
          value: '*.localhost'
        },
        {
          type: 2,
          value: 'nashos-wms.local'
        }
      ]
    }
  ]
});

fs.writeFileSync('localhost.pem', pems.cert);
fs.writeFileSync('localhost-key.pem', pems.private);

console.log('Generated SSL certificates:');
console.log('- localhost.pem');
console.log('- localhost-key.pem'); 