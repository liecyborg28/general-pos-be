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
  PAYMENT_METHOD: {
    CASH: {
      value: "cash",
      en: "Cash",
      id: "Tunai",
    },
    DEBIT: {
      value: "debit",
      en: "Debit Card",
      id: "Kartu Debit",
    },
    QRIS: {
      value: "QRIS",
      en: "QRIS",
      id: "QRIS",
    },
    ENTERTAIN: {
      value: "entertain",
      en: "Entertain",
      id: "Hiburan",
    },
    TRANSFER: {
      value: "transfer",
      en: "Bank Tranfer",
      id: "Transfer Bank",
    },
  },
};
