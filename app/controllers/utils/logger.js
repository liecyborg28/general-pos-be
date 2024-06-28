const winston = require('winston'); //Menggunakan Winston

const logger = winston.createLogger({
  level: 'info', // Level log yang ingin dicatat
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Atau format lain seperti winston.format.simple()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }), // Log error ke file
    new winston.transports.File({ filename: 'combined.log' }), // Log semua level ke file
  ],
});

// Tambahkan transport untuk console jika ingin menampilkan log di console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;