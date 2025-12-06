
export async function extractColors(imageUrl: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve([]);

            // Resize for faster processing
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            const imageData = ctx.getImageData(0, 0, 50, 50).data;
            const colorMap = new Map<string, number>();

            // Sample pixels with a step to improve performance
            for (let i = 0; i < imageData.length; i += 4 * 5) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const alpha = imageData[i + 3];

                if (alpha < 200) continue; // Skip transparent/semi-transparent pixels
                if (r > 240 && g > 240 && b > 240) continue; // Skip white
                if (r < 20 && g < 20 && b < 20) continue; // Skip black

                // Quantize colors to group similar shades
                const rQ = Math.round(r / 20) * 20;
                const gQ = Math.round(g / 20) * 20;
                const bQ = Math.round(b / 20) * 20;
                const key = `${rQ},${gQ},${bQ}`;

                colorMap.set(key, (colorMap.get(key) || 0) + 1);
            }

            // Sort by frequency
            const sortedColors = Array.from(colorMap.entries())
                .sort((a, b) => b[1] - a[1])
                .map(entry => {
                    const [r, g, b] = entry[0].split(',').map(Number);
                    return `rgb(${r}, ${g}, ${b})`;
                });

            // return top 3 distinct colors or fallback
            resolve(sortedColors.slice(0, 3));
        };

        img.onerror = (e) => {
            console.warn("Failed to load image for color extraction", e);
            resolve([]);
        };
    });
}
