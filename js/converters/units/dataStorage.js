/** Data Storage Converter — base unit: byte. Decimal (SI) and binary (IEC) side by side. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['bit', 'Bit', 'b', 0.125, 'Bits'],
  ['kbit', 'Kilobit', 'kb', 125, 'Bits'],
  ['mbit', 'Megabit', 'Mb', 125000, 'Bits'],
  ['gbit', 'Gigabit', 'Gb', 125000000, 'Bits'],
  ['B', 'Byte', 'B', 1, 'Decimal (SI, ×1000)'],
  ['kB', 'Kilobyte', 'kB', 1e3, 'Decimal (SI, ×1000)'],
  ['MB', 'Megabyte', 'MB', 1e6, 'Decimal (SI, ×1000)'],
  ['GB', 'Gigabyte', 'GB', 1e9, 'Decimal (SI, ×1000)'],
  ['TB', 'Terabyte', 'TB', 1e12, 'Decimal (SI, ×1000)'],
  ['PB', 'Petabyte', 'PB', 1e15, 'Decimal (SI, ×1000)'],
  ['KiB', 'Kibibyte', 'KiB', 1024, 'Binary (IEC, ×1024)'],
  ['MiB', 'Mebibyte', 'MiB', 1024 ** 2, 'Binary (IEC, ×1024)'],
  ['GiB', 'Gibibyte', 'GiB', 1024 ** 3, 'Binary (IEC, ×1024)'],
  ['TiB', 'Tebibyte', 'TiB', 1024 ** 4, 'Binary (IEC, ×1024)'],
  ['PiB', 'Pebibyte', 'PiB', 1024 ** 5, 'Binary (IEC, ×1024)']
]);

export default unitTool({
  units,
  defaults: ['MB', 'MiB'],
  quick: [
    { label: '1 TB drive in TiB', from: 'TB', to: 'TiB', value: 1 },
    { label: 'GB → MB', from: 'GB', to: 'MB', value: 1 },
    { label: 'Mbps → MB/s', from: 'mbit', to: 'MB', value: 100 },
    { label: 'GiB → GB', from: 'GiB', to: 'GB', value: 8 }
  ],
  how: `${factorHow('storage', 'bytes', [
    '1 byte = 8 bits',
    'Decimal prefixes step by 1,000: 1 MB = 1,000,000 B',
    'Binary prefixes step by 1,024: 1 MiB = 1,048,576 B',
    'The gap grows with scale: 1 TB is only 0.909 TiB — about 9% "missing"'
  ])}
  <h4>Why your 1 TB drive shows 931 GB</h4>
  <p>Drive manufacturers sell decimal terabytes (10¹² bytes) while Windows reports binary
  tebibytes but labels them "GB". 10¹² ÷ 1024³ = 931.3, so nothing is actually missing — the two
  systems are just counting in different bases. Both families are listed here so you can compare
  them directly.</p>
  <h4>Bits vs bytes</h4>
  <p>Network speeds are quoted in bits (100 Mbps), file sizes in bytes (12 MB). Divide by 8 to go
  from bits to bytes: a 100 Mbps line moves about 12.5 MB per second at best.</p>`
});
