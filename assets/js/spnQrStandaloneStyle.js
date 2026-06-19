document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('spnQrStandaloneStyles')) return;
  const style = document.createElement('style');
  style.id = 'spnQrStandaloneStyles';
  style.textContent = `.qr-standalone{margin-top:auto;align-self:center;display:flex;gap:2mm;align-items:center;justify-content:center;border:1px solid #dbeafe;background:#eff6ff;border-radius:12px;padding:2mm 2.4mm;color:#111827}.qr-standalone .qr-box{border:1px solid #bfdbfe}.qr-standalone span{color:#1e3a8a;font-size:7pt;font-weight:900;line-height:1.08}.flyer.compact .qr-standalone{padding:1.2mm 1.5mm;gap:1.3mm}.flyer.compact .qr-standalone .qr-box{width:14mm;height:14mm}.flyer.compact .qr-standalone span{font-size:5.8pt}.flyer.private .qr-standalone,.flyer.bw .qr-standalone{background:#fff;border-color:#cbd5e1}.flyer.private .qr-standalone span,.flyer.bw .qr-standalone span{color:#111827}@media print{.qr-standalone{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
  document.head.appendChild(style);
});
