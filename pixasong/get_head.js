const fs = require('fs');
// This script assumes it can read the metadata_v2.json which we know is valid JSON
try {
    const rawData = fs.readFileSync('metadata_v2.json');
    const data = JSON.parse(rawData);
    const identifier = '100-best-of-classical-songs-2022';
    const files = data.files;
    let mp3s = files.filter(f => f.name.endsWith('.mp3') && f.format === 'VBR MP3');
    if (mp3s.length === 0) mp3s = files.filter(f => f.name.endsWith('.mp3'));
    const selected = mp3s.slice(0, 10);
    const links = selected.map(f => `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`);
    console.log(JSON.stringify(links, null, 2));
} catch (e) { console.error(e); }
