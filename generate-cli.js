const QRCode = require('qrcode');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Aapka direct website URL jo kabhi change nahi hoga
const url = 'https://www.troology.com.sg/';

async function generateQRWithFullUrl() {
    try {
        const qrSize = 500;
        const textSectionHeight = 80;
        const totalWidth = qrSize + 40; // 20px padding left & right
        const totalHeight = qrSize + textSectionHeight + 30; // padding top & bottom

        const canvas = createCanvas(totalWidth, totalHeight);
        const ctx = canvas.getContext('2d');

        // Background (White)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // QR Code generate karein canvas par
        const qrCanvas = createCanvas(qrSize, qrSize);
        await QRCode.toCanvas(qrCanvas, url, {
            width: qrSize,
            margin: 1,
            errorCorrectionLevel: 'H', // High error correction
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // QR Code ko main canvas pe draw karein
        ctx.drawImage(qrCanvas, 20, 20);

        // Neeche full URL text draw karein
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(url, totalWidth / 2, qrSize + 45);

        // PNG file save karein
        const pngPath = path.join(__dirname, 'troology-permanent-qr.png');
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(pngPath, buffer);
        console.log(`✅ PNG saved: ${pngPath}`);

        // SVG file bhi generate karein (for HD print / vector)
        const svgQr = await QRCode.toString(url, {
            type: 'svg',
            margin: 1,
            errorCorrectionLevel: 'H',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // SVG ka matrix size calculate karein taaki exact scale ho
        const match = svgQr.match(/viewBox="0 0 (\d+) (\d+)"/);
        const origDim = match ? parseInt(match[1], 10) : 35;
        const scaleVal = qrSize / origDim;

        // SVG me QR code aur neeche poora URL text add karein
        const svgInner = svgQr.replace(/<\/?svg[^>]*>/g, '');
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
    <rect width="100%" height="100%" fill="#FFFFFF"/>
    <g transform="translate(20, 20) scale(${scaleVal})">
        ${svgInner}
    </g>
    <text x="${totalWidth / 2}" y="${qrSize + 50}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#111827">${url}</text>
</svg>`.trim();

        const svgPath = path.join(__dirname, 'troology-permanent-qr.svg');
        fs.writeFileSync(svgPath, svgContent);
        console.log(`✅ SVG saved: ${svgPath}`);

        console.log('\nSuccess! Aapka QR code generate ho gaya hai jisme neeche poora URL likha hua hai: ' + url);
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
}

generateQRWithFullUrl();