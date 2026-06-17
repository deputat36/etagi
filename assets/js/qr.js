const QR_CAPACITY_L = {
  1: { data: 19, ecc: 7 },
  2: { data: 34, ecc: 10 },
  3: { data: 55, ecc: 15 },
  4: { data: 80, ecc: 20 },
  5: { data: 108, ecc: 26 }
};
const ALIGNMENT_POSITIONS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30]
};
const QR_MAX_BYTES = 108;

let gfExp = null;
let gfLog = null;

export function getQrInfo(text){
  const bytes = toUtf8Bytes(text || '');
  const version = chooseVersion(bytes.length);
  return { bytes: bytes.length, version, maxBytes: QR_MAX_BYTES, ok: Boolean(version) };
}

export function createQrSvg(text){
  const bytes = toUtf8Bytes(text || '');
  const version = chooseVersion(bytes.length);
  if(!text || !version){
    return { ok:false, svg:'', reason:'Ссылка слишком длинная для встроенного QR' };
  }

  const matrix = buildQrMatrix(bytes, version);
  const quiet = 4;
  const viewSize = matrix.length + quiet * 2;
  let path = '';

  for(let y=0; y<matrix.length; y++){
    for(let x=0; x<matrix.length; x++){
      if(matrix[y][x]) path += `M${x + quiet} ${y + quiet}h1v1H${x + quiet}z`;
    }
  }

  const svg = `<svg class="qr-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges" aria-label="QR-код"><rect width="${viewSize}" height="${viewSize}" fill="#fff"/><path d="${path}" fill="#111827"/></svg>`;
  return { ok:true, svg, version, bytes: bytes.length };
}

function chooseVersion(byteLength){
  for(const [v, cap] of Object.entries(QR_CAPACITY_L)){
    const version = Number(v);
    const requiredBits = 4 + 8 + byteLength * 8;
    if(Math.ceil((requiredBits + 4) / 8) <= cap.data) return version;
  }
  return null;
}

function buildQrMatrix(bytes, version){
  const size = 17 + version * 4;
  const matrix = Array.from({length:size}, () => Array(size).fill(false));
  const reserved = Array.from({length:size}, () => Array(size).fill(false));

  drawFunctionPatterns(matrix, reserved, version);
  const dataCodewords = makeDataCodewords(bytes, version);
  const ecc = reedSolomonRemainder(dataCodewords, QR_CAPACITY_L[version].ecc);
  const allCodewords = dataCodewords.concat(ecc);
  const bits = codewordsToBits(allCodewords);
  drawDataBits(matrix, reserved, bits);
  drawFormatBits(matrix, reserved, 0);

  return matrix;
}

function makeDataCodewords(bytes, version){
  const cap = QR_CAPACITY_L[version].data;
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for(const b of bytes) appendBits(bits, b, 8);

  const capacityBits = cap * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  appendBits(bits, 0, terminator);
  while(bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for(let i=0; i<bits.length; i+=8){
    let v = 0;
    for(let j=0; j<8; j++) v = (v << 1) | bits[i+j];
    codewords.push(v);
  }

  let pad = 0;
  while(codewords.length < cap){
    codewords.push(pad % 2 === 0 ? 0xEC : 0x11);
    pad++;
  }
  return codewords;
}

function drawFunctionPatterns(matrix, reserved, version){
  const size = matrix.length;
  drawFinder(matrix, reserved, 0, 0);
  drawFinder(matrix, reserved, size - 7, 0);
  drawFinder(matrix, reserved, 0, size - 7);

  for(let i=8; i<size-8; i++){
    setFunction(matrix, reserved, i, 6, i % 2 === 0);
    setFunction(matrix, reserved, 6, i, i % 2 === 0);
  }

  const positions = ALIGNMENT_POSITIONS[version] || [];
  for(const y of positions){
    for(const x of positions){
      const overlapsFinder = (x === 6 && y === 6) || (x === 6 && y === size - 7) || (x === size - 7 && y === 6);
      if(!overlapsFinder) drawAlignment(matrix, reserved, x, y);
    }
  }

  reserveFormatAreas(matrix, reserved);
  setFunction(matrix, reserved, 8, size - 8, true);
}

function drawFinder(matrix, reserved, left, top){
  for(let dy=-1; dy<=7; dy++){
    for(let dx=-1; dx<=7; dx++){
      const x = left + dx;
      const y = top + dy;
      if(x < 0 || y < 0 || x >= matrix.length || y >= matrix.length) continue;
      const black = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 &&
        (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      setFunction(matrix, reserved, x, y, black);
    }
  }
}

function drawAlignment(matrix, reserved, cx, cy){
  for(let dy=-2; dy<=2; dy++){
    for(let dx=-2; dx<=2; dx++){
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFunction(matrix, reserved, cx + dx, cy + dy, dist !== 1);
    }
  }
}

function reserveFormatAreas(matrix, reserved){
  const size = matrix.length;
  for(let i=0; i<9; i++){
    if(i !== 6){
      setFunction(matrix, reserved, 8, i, false);
      setFunction(matrix, reserved, i, 8, false);
    }
  }
  for(let i=0; i<8; i++){
    setFunction(matrix, reserved, size - 1 - i, 8, false);
    setFunction(matrix, reserved, 8, size - 1 - i, false);
  }
}

function drawDataBits(matrix, reserved, bits){
  const size = matrix.length;
  let bitIndex = 0;
  let upwards = true;

  for(let right = size - 1; right >= 1; right -= 2){
    if(right === 6) right--;
    for(let vert = 0; vert < size; vert++){
      const y = upwards ? size - 1 - vert : vert;
      for(let dx=0; dx<2; dx++){
        const x = right - dx;
        if(reserved[y][x]) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex++] : 0;
        matrix[y][x] = Boolean(bit ^ mask0(x, y));
      }
    }
    upwards = !upwards;
  }
}

function drawFormatBits(matrix, reserved, mask){
  const size = matrix.length;
  const eclLow = 0b01; // L
  const data = (eclLow << 3) | mask;
  const bits = getFormatBits(data);

  for(let i=0; i<=5; i++) setFunction(matrix, reserved, 8, i, bitAt(bits, i));
  setFunction(matrix, reserved, 8, 7, bitAt(bits, 6));
  setFunction(matrix, reserved, 8, 8, bitAt(bits, 7));
  setFunction(matrix, reserved, 7, 8, bitAt(bits, 8));
  for(let i=9; i<15; i++) setFunction(matrix, reserved, 14 - i, 8, bitAt(bits, i));

  for(let i=0; i<8; i++) setFunction(matrix, reserved, size - 1 - i, 8, bitAt(bits, i));
  for(let i=8; i<15; i++) setFunction(matrix, reserved, 8, size - 15 + i, bitAt(bits, i));
  setFunction(matrix, reserved, 8, size - 8, true);
}

function getFormatBits(data){
  let rem = data << 10;
  const generator = 0x537;
  for(let i=14; i>=10; i--){
    if(((rem >>> i) & 1) !== 0) rem ^= generator << (i - 10);
  }
  return ((data << 10) | (rem & 0x3FF)) ^ 0x5412;
}

function bitAt(value, index){
  return ((value >>> index) & 1) !== 0;
}

function mask0(x, y){
  return ((x + y) % 2) === 0 ? 1 : 0;
}

function setFunction(matrix, reserved, x, y, value){
  if(x < 0 || y < 0 || y >= matrix.length || x >= matrix.length) return;
  matrix[y][x] = Boolean(value);
  reserved[y][x] = true;
}

function appendBits(bits, value, length){
  for(let i=length-1; i>=0; i--) bits.push((value >>> i) & 1);
}

function codewordsToBits(codewords){
  const bits = [];
  for(const cw of codewords) appendBits(bits, cw, 8);
  return bits;
}

function reedSolomonRemainder(data, degree){
  initGf();
  const generator = rsGenerator(degree);
  const result = Array(degree).fill(0);

  for(const b of data){
    const factor = b ^ result.shift();
    result.push(0);
    for(let i=0; i<degree; i++){
      result[i] ^= gfMultiply(generator[i + 1], factor);
    }
  }
  return result;
}

function rsGenerator(degree){
  initGf();
  let poly = [1];
  for(let i=0; i<degree; i++){
    const next = Array(poly.length + 1).fill(0);
    for(let j=0; j<poly.length; j++){
      next[j] ^= gfMultiply(poly[j], 1);
      next[j + 1] ^= gfMultiply(poly[j], gfExp[i]);
    }
    poly = next;
  }
  return poly;
}

function gfMultiply(a, b){
  if(a === 0 || b === 0) return 0;
  return gfExp[gfLog[a] + gfLog[b]];
}

function initGf(){
  if(gfExp && gfLog) return;
  gfExp = Array(512).fill(0);
  gfLog = Array(256).fill(0);
  let x = 1;
  for(let i=0; i<255; i++){
    gfExp[i] = x;
    gfLog[x] = i;
    x <<= 1;
    if(x & 0x100) x ^= 0x11D;
  }
  for(let i=255; i<512; i++) gfExp[i] = gfExp[i - 255];
}

function toUtf8Bytes(text){
  if(window.TextEncoder) return Array.from(new TextEncoder().encode(text));
  return unescape(encodeURIComponent(text)).split('').map(ch=>ch.charCodeAt(0));
}
