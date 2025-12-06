const fs = require('fs');

try {
    const rawData = fs.readFileSync('metadata_v2.json');
    const data = JSON.parse(rawData);

    // Base URL for downloads
    // https://archive.org/download/{identifier}/{filename}
    const identifier = '100-best-of-classical-songs-2022'; // data.metadata.identifier
    const files = data.files;

    if (!files) {
        console.error("No files found in metadata");
        process.exit(1);
    }

    let mp3s = files.filter(f => f.name.endsWith('.mp3') && f.format === 'VBR MP3');
    // If VBR not found, try just .mp3
    if (mp3s.length === 0) {
        mp3s = files.filter(f => f.name.endsWith('.mp3'));
    }

    // Limit to 44
    const selected = mp3s.slice(0, 44);

    if (selected.length < 44) {
        console.warn(`Warning: Only found ${selected.length} MP3 files!`);
    }

    const links = selected.map(f => `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`);

    console.log(JSON.stringify(links, null, 2));

} catch (e) {
    console.error("Error parsing metadata:", e);
}
