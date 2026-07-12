import { formatCurrency } from '@/utils/format';

let BluetoothEscposPrinter: any = null;
try {
  BluetoothEscposPrinter = require('@vardrz/react-native-bluetooth-escpos-printer').BluetoothEscposPrinter;
} catch (e) {
  console.warn("BluetoothEscposPrinter not available.", e);
}

export const printReceipt = async (order: any, storeName: string = 'Tres Bros Caffè') => {
  if (!BluetoothEscposPrinter) {
    throw new Error("Modul printer tidak tersedia.");
  }

  try {
    const ALIGN = BluetoothEscposPrinter.ALIGN || { LEFT: 0, CENTER: 1, RIGHT: 2 };
    
    // Initialize printer
    await BluetoothEscposPrinter.printerInit();

    // 1. Header
    await BluetoothEscposPrinter.printText("\n", {});
    await BluetoothEscposPrinter.printText(`${storeName}\n`, {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });
    await BluetoothEscposPrinter.printText("POS & KDS System\n", {});
    await BluetoothEscposPrinter.printText("--------------------------------\n", {}); // 32 chars width (58mm)
    
    // 2. Metadata (Order Details)
    const dateStr = new Date(order.createdAt).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await BluetoothEscposPrinter.printText(`No. Antrean: #${order.queueNumber || order.QueueNumber}\n`, { fonttype: 1 });
    await BluetoothEscposPrinter.printText(`No. Pesanan: ${order.orderNumber || order.OrderNumber}\n`, {});
    await BluetoothEscposPrinter.printText(`Tanggal    : ${dateStr}\n`, {});
    if (order.customerName) {
      await BluetoothEscposPrinter.printText(`Pelanggan  : ${order.customerName}\n`, {});
    }
    await BluetoothEscposPrinter.printText(`Metode     : ${order.paymentMethod}\n`, {});
    await BluetoothEscposPrinter.printText("--------------------------------\n", {});

    // 3. Columns: Menu Item (16 chars), Qty (4 chars), Subtotal Price (12 chars)
    await BluetoothEscposPrinter.printColumn([16, 4, 12], [ALIGN.LEFT, ALIGN.CENTER, ALIGN.RIGHT], ["MENU", "QTY", "TOTAL"], {});
    await BluetoothEscposPrinter.printText("--------------------------------\n", {});

    const items = order.items || [];
    for (const item of items) {
      const productName = item.product?.name || `Item ${item.productId}`;
      const qtyStr = `${item.quantity}x`;
      const priceStr = formatCurrency(item.price * item.quantity).replace('Rp', '').trim();
      
      if (productName.length > 16) {
        await BluetoothEscposPrinter.printText(`${productName}\n`, {});
        await BluetoothEscposPrinter.printColumn([16, 4, 12], [ALIGN.LEFT, ALIGN.CENTER, ALIGN.RIGHT], ["", qtyStr, priceStr], {});
      } else {
        await BluetoothEscposPrinter.printColumn([16, 4, 12], [ALIGN.LEFT, ALIGN.CENTER, ALIGN.RIGHT], [productName, qtyStr, priceStr], {});
      }
      
      if (item.notes) {
        await BluetoothEscposPrinter.printText(` * Catatan: ${item.notes}\n`, {});
      }
    }
    await BluetoothEscposPrinter.printText("--------------------------------\n", {});

    // 4. Totals & Checkout Details
    const printRow = async (label: string, val: string) => {
      await BluetoothEscposPrinter.printColumn([18, 14], [ALIGN.LEFT, ALIGN.RIGHT], [label, val], {});
    };

    const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    await printRow("Subtotal", formatCurrency(subtotal));

    if (order.discountAmount > 0) {
      await printRow("Diskon", `-${formatCurrency(order.discountAmount)}`);
    }

    // Default 11% Tax if enabled in order
    if (order.taxAmount > 0) {
      await printRow("Pajak (11%)", formatCurrency(order.taxAmount));
    } else if (order.taxAmount === undefined && order.totalAmount > subtotal) {
      // Calculate diff as tax fallback
      const taxFallback = order.totalAmount - subtotal + (order.discountAmount || 0);
      if (taxFallback > 0) {
        await printRow("Pajak (11%)", formatCurrency(taxFallback));
      }
    }

    const finalTotal = order.totalAmount;
    await printRow("Total Akhir", formatCurrency(finalTotal));
    
    await BluetoothEscposPrinter.printText("--------------------------------\n", {});

    // 5. Footer & Feeding Paper
    await BluetoothEscposPrinter.printText("Terima Kasih Atas Kunjungan Anda\n", {});
    await BluetoothEscposPrinter.printText("     Tres Bros Caffè App     \n", {});
    await BluetoothEscposPrinter.printText("\n\n", {});
    
    await BluetoothEscposPrinter.printAndFeed(3);
    
  } catch (error) {
    console.error("Printing operation error:", error);
    throw error;
  }
};
