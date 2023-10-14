module.exports = {
  STATUS: [
    { value: "pending", en: "Pending", id: "Menunggu Pembayaran" },
    {
      value: "completed",
      en: "Completed",
      id: "Pembayaran Selesai",
    },
    {
      value: "canceled",
      en: "Canceled",
      id: "Pembayaran Dibatalkan",
    },
  ],
  ORDER_STATUS: [
    { value: "pending", en: "Pending", id: "Menunggu Pembayaran" },
    { value: "queued", en: "Queued", id: "Dalam Antrian" },
    { value: "ongoing", en: "Ongoing", id: "Sedang Diproses" },
    { value: "completed", en: "Completed", id: "Pesanan Selesai" },
    { value: "canceled", en: "Canceled", id: "Pesanan Dibatalkan" },
  ],
  PAYMENT_METHOD: [
    {
      value: "cash",
      en: "Cash",
      id: "Tunai",
    },
    {
      value: "debit",
      en: "Debit Card",
      id: "Kartu Debit",
    },
    {
      value: "QRIS",
      en: "QRIS",
      id: "QRIS",
    },
    {
      value: "entertain",
      en: "Entertain",
      id: "Hiburan",
    },
    {
      value: "transfer",
      en: "Bank Transfer",
      id: "Transfer Bank",
    },
    {
      value: "edc",
      en: "EDC Machine",
      id: "Mesin EDC",
    },
  ],
  DISCOUNTS: [
    {
      title: "Promo Ayam Bawang 1",
      amount: 5000,
    },
    {
      title: "Promo Ayam Bawang 2",
      amount: 2000,
    },
  ],
};
