const router = require("express").Router();

// Storage for commands
let commands = {
  esp1: [],
  esp2: [],
  esp3: [],
  esp4: [],
};

// Storage for the latest light states from each ESP32
let lightStates = {
  esp1: Array(17).fill(false),
  esp2: Array(4).fill(false),
  esp3: Array(17).fill(false),
  esp4: Array(20).fill(false),
};

const getRelayState = () => {
  return {
    esp1: Array(17).fill("off"),
    esp2: Array(4).fill("off"),
    esp3: Array(17).fill("off"),
    esp4: Array(20).fill("off"),
  };
};

let relayState = getRelayState();

const controlRelay = (req, res) => {
  try {
    const { action, floor, table } = req.body;

    console.log("Received request body:", req.body);

    // Validasi input
    if (typeof action !== "string" || (action !== "on" && action !== "off")) {
      console.log("Invalid action:", action);
      return res.status(400).send("Invalid action");
    }

    if (typeof floor !== "number" || floor < 1 || floor > 3) {
      console.log("Invalid floor:", floor);
      return res.status(400).send("Invalid floor");
    }

    if (typeof table !== "string" || !/^0[0-9]{2}$/.test(table)) {
      console.log("Invalid table format:", table);
      return res.status(400).send("Invalid table format");
    }

    let esp;
    let tableNumber = parseInt(table, 10) - 1;

    // Tentukan ESP32 dan sesuaikan nomor meja
    if (floor === 1) {
      if (tableNumber >= 0 && tableNumber < 17) {
        esp = "esp1";
      } else if (tableNumber >= 17 && tableNumber < 21) {
        esp = "esp2";
        tableNumber -= 17; // Kurangi 17 sebelum cek rentang

        // Periksa rentang tableNumber setelah pengurangan
        if (tableNumber < 0 || tableNumber >= 4) {
          console.log("Table number out of range for ESP32-2:", tableNumber);
          return res.status(400).send("Table number out of range for ESP32-2");
        }
      } else {
        console.log("Table number out of range for floor 1:", tableNumber);
        return res.status(400).send("Table number out of range for floor 1");
      }
    } else if (floor === 2 && tableNumber >= 0 && tableNumber < 17) {
      esp = "esp3";
    } else if (floor === 3 && tableNumber >= 0 && tableNumber < 20) {
      esp = "esp4";
    } else {
      console.log(`Table number out of range for floor ${floor}:`, tableNumber);
      return res
        .status(400)
        .send(`Table number out of range for floor ${floor}`);
    }

    // Balik logika perintah (karena relay NC)
    let relayAction = action === "on" ? "off" : "on";

    // Periksa apakah relay sudah dalam status yang diminta
    if (relayState[esp][tableNumber] === relayAction) {
      console.log(`Relay ${table} on floor ${floor} is already ${action}`);
      return res
        .status(200)
        .send(`Relay ${table} on floor ${floor} is already ${action}`);
    }

    // Tambahkan perintah ke antrian
    commands[esp].push({
      action: relayAction,
      table: tableNumber + 1,
      floor: floor,
    });

    // Perbarui status relay dan lampu
    relayState[esp][tableNumber] = relayAction;
    lightStates[esp][tableNumber] = relayAction === "on";

    console.log(`Command for table ${table} on floor ${floor} has been queued`);
    res.send(`Command for table ${table} on floor ${floor} has been queued`);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
};

const pollRelay = (req, res) => {
  try {
    const esp = req.params.esp;
    if (!commands[esp]) {
      console.log("Invalid ESP32 identifier:", esp);
      return res.status(400).send("Invalid ESP32 identifier");
    }

    const commandList = commands[esp];
    commands[esp] = [];
    res.json(commandList);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
};

// Route to receive light status updates from ESP32s
router.post("/status/:esp", (req, res) => {
  try {
    const espId = req.params.esp;
    const receivedStates = req.body.states;

    if (
      lightStates[espId] &&
      lightStates[espId].length === receivedStates.length
    ) {
      lightStates[espId] = receivedStates;
      console.log(`Light states for ${espId} updated:`, lightStates[espId]);
      res.status(200).send("Light status received");
    } else {
      console.error(`Error updating light states for ${espId}: Invalid data`);
      res.status(400).send("Invalid data");
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
});

// Route to get the latest light status
router.post("/light-status", (req, res) => {
  try {
    const floor = req.body.floor;
    console.log("Received request for floor:", floor);

    if (typeof floor !== "string" || !/^[1-3]$/.test(floor)) {
      console.log("Invalid floor:", floor);
      return res.status(400).send("Invalid floor");
    }

    let startTable, endTable;
    switch (floor) {
      case "1":
        startTable = 1;
        endTable = 21;
        break;
      case "2":
        startTable = 1;
        endTable = 17;
        break;
      case "3":
        startTable = 1;
        endTable = 20;
        break;
      default:
        return res.status(400).send("Invalid floor");
    }

    const filteredStates = [];
    for (let tableNumber = startTable; tableNumber <= endTable; tableNumber++) {
      let esp, tableIndex;
      if (tableNumber >= 1 && tableNumber <= 17) {
        esp = "esp1";
        tableIndex = tableNumber - 1;
      } else if (tableNumber >= 18 && tableNumber <= 21) {
        esp = "esp2";
        tableIndex = tableNumber - 18;
      } else if (tableNumber >= 22 && tableNumber <= 38) {
        esp = "esp3";
        tableIndex = tableNumber - 22;
      } else if (tableNumber >= 39 && tableNumber <= 58) {
        esp = "esp4";
        tableIndex = tableNumber - 39;
      } else {
        continue;
      }

      filteredStates.push({
        table: `00${tableNumber}`.slice(-3),
        light: lightStates[esp][tableIndex] ? "on" : "off",
      });
    }

    console.log("Sending light status:", filteredStates);
    res.json(filteredStates);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
});

// --- Rute untuk relay controller ---
router.post("/relay", controlRelay);
router.get("/poll/:esp", pollRelay);

module.exports = { controlRelay, pollRelay, router };
