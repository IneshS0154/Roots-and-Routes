/**
 * receiptPdf.js
 * Generates and downloads a styled PDF receipt using the browser's print dialog.
 * No external library required — pure HTML/CSS rendered via a popup window.
 */

export function generateReceipt({ orderId, customer, items, paymentMethod, deliveryAddress, total, deliveryFee = 150, date }) {
  const formattedDate = date
    ? new Date(date).toLocaleString('en-LK', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('en-LK', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const subtotal = Number(total) - deliveryFee;

  const itemRows = items.map(item => `
    <tr>
      <td>${item.name}${item.is_organic ? ' <span class="organic">🌿 Organic</span>' : ''}</td>
      <td>${item.farmer_name || '—'}</td>
      <td>${item.quantity} ${item.unit}</td>
      <td>LKR ${Number(item.price || item.unit_price).toLocaleString()}</td>
      <td>LKR ${(Number(item.price || item.unit_price) * Number(item.quantity)).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt – ORD-${String(orderId).padStart(4,'0')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #4f7942; padding-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 800; color: #4f7942; }
    .brand span { font-size: 11px; font-weight: 500; color: #666; display: block; margin-top: 2px; }
    .receipt-info { text-align: right; }
    .receipt-info h2 { font-size: 18px; color: #4f7942; font-weight: 800; }
    .receipt-info p { color: #555; font-size: 12px; margin-top: 2px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-box { background: #f8faf7; border: 1px solid #e5e9e4; border-radius: 8px; padding: 12px 14px; }
    .info-box .label { font-size: 10px; color: #888; font-weight: 600; text-transform: uppercase; margin-bottom: 3px; }
    .info-box .value { font-weight: 700; font-size: 13px; color: #1a1a1a; }
    .info-box .sub { font-size: 11px; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #4f7942; }
    thead th { color: white; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    tbody tr { border-bottom: 1px solid #eee; }
    tbody tr:nth-child(even) { background: #fafdf9; }
    tbody td { padding: 10px 12px; font-size: 12px; vertical-align: middle; }
    .organic { font-size: 10px; background: #d1fae5; color: #065f46; padding: 1px 5px; border-radius: 4px; font-weight: 600; }
    .totals { display: flex; flex-direction: column; align-items: flex-end; margin-top: 16px; gap: 4px; }
    .totals .row { display: flex; gap: 48px; justify-content: flex-end; font-size: 12px; }
    .totals .row .label { color: #666; min-width: 100px; text-align: right; }
    .totals .row .amount { font-weight: 600; min-width: 100px; text-align: right; }
    .totals .total-row { border-top: 2px solid #4f7942; padding-top: 8px; margin-top: 4px; }
    .totals .total-row .label { font-weight: 800; font-size: 14px; color: #1a1a1a; }
    .totals .total-row .amount { font-weight: 900; font-size: 14px; color: #4f7942; }
    .payment-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
                     background: ${paymentMethod === 'card' ? '#dbeafe' : '#fef3c7'}; color: ${paymentMethod === 'card' ? '#1d4ed8' : '#92400e'}; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; color: #aaa; font-size: 10px; line-height: 1.7; }
    .verified-stamp { display: inline-block; border: 2px solid #4f7942; border-radius: 6px; padding: 4px 12px; color: #4f7942; font-weight: 800; font-size: 11px; margin-top: 12px; letter-spacing: 0.1em; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      🌿 Roots &amp; Routes
      <span>Farm-to-Table Marketplace · Sri Lanka</span>
    </div>
    <div class="receipt-info">
      <h2>PAYMENT RECEIPT</h2>
      <p>#ORD-${String(orderId).padStart(4,'0')}</p>
      <p>${formattedDate}</p>
    </div>
  </div>

  <div class="section info-grid">
    <div class="info-box">
      <div class="label">Customer</div>
      <div class="value">${customer?.name || '—'}</div>
      <div class="sub">${customer?.email || ''}</div>
    </div>
    <div class="info-box">
      <div class="label">Delivery Address</div>
      <div class="value" style="font-size:12px;font-weight:500;">${deliveryAddress || '—'}</div>
    </div>
    <div class="info-box">
      <div class="label">Payment Method</div>
      <div class="value"><span class="payment-badge">${paymentMethod === 'card' ? '💳 Card Payment' : '💵 Cash on Delivery'}</span></div>
      <div class="sub" style="margin-top:6px;">Status: <strong>${paymentMethod === 'card' ? 'Paid' : 'Payable on Delivery'}</strong></div>
    </div>
    <div class="info-box" style="display:flex;align-items:center;justify-content:center;background:#f0faf0;border-color:#b6dbb0;">
      <div style="text-align:center;">
        <div class="verified-stamp">✓ ORDER CONFIRMED</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Order Items</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Farmer</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    <div class="totals">
      <div class="row"><span class="label">Subtotal</span><span class="amount">LKR ${subtotal.toLocaleString()}</span></div>
      <div class="row"><span class="label">Delivery Fee</span><span class="amount">LKR ${deliveryFee.toLocaleString()}</span></div>
      <div class="row total-row"><span class="label">Total Amount</span><span class="amount">LKR ${Number(total).toLocaleString()}</span></div>
    </div>
  </div>

  <div class="footer">
    Thank you for supporting local farmers through Roots &amp; Routes!<br/>
    For support contact us at support@rootsroutes.com<br/>
    This is a computer-generated receipt. No signature required.
  </div>

  <script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=820,height=1000');
  if (!printWindow) {
    alert('Please allow pop-ups to download the receipt.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
