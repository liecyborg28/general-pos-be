module.exports = {
  STATUS: {
    PENDING: { value: "pending", en: "Pending", id: "Menunggu Pembayaran" },
    COMPLETED: {
      value: "completed",
      en: "Completed",
      id: "Pembayaran Selesai",
    },
    CANCELED: {
      value: "canceled",
      en: "Canceled",
      id: "Pembayaran Dibatalkan",
    },
  },
  ORDER_STATUS: {
    PENDING: { value: "pending", en: "Pending", id: "Menunggu Pembayaran" },
    QUEUED: { value: "queued", en: "Queued", id: "Dalam Antrian" },
    ONGOING: { value: "ongoing", en: "Ongoing", id: "Sedang Diproses" },
    COMPLETED: { value: "completed", en: "Completed", id: "Pesanan Selesai" },
    CANCELED: { value: "canceled", en: "Canceled", id: "Pesanan Dibatalkan" },
  },
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
    // {
    //   value: "entertain",
    //   en: "Entertain",
    //   id: "Hiburan",
    // },
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
  PROMO: [
    {
      type: "fixAmount",
      title: {
        en: "Tetap",
        id: "Fix Amount",
      },
    },
    {
      type: "persentage",
      title: {
        en: "Persen",
        id: "Persentage",
      },
    },
  ],
  RULES: {
    TAX: {
      title: "PPN",
      fixAmount: null,
      persentage: 0.1,
    },
    CHARGE: {
      title: "charge",
      fixAmount: null,
      persentage: 0,
      // persentage: 0.04,
    },
  },
};
