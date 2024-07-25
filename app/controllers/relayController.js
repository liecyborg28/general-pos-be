// relayController.js

// Storage for commands
let commands = {
  esp1: [],
  esp2: [],
  esp3: [],
};

const getRelayState = () => {
  return {
    esp1: Array(17).fill("off"),
    esp2: Array(4).fill("off"), // Adjusted for tables 18 to 21
    esp3: Array(18).fill("off"),
  };
};

let relayState = getRelayState();

const controlRelay = (req, res) => {
  try {
    const { action, floor, table } = req.body;

    console.log("Received request body:", req.body);

    if (typeof action !== "string" || (action !== "on" && action !== "off")) {
      console.log("Invalid action:", action);
      return res.status(400).send("Invalid action");
    }

    if (typeof floor !== "number" || floor < 1 || floor > 2) {
      console.log("Invalid floor:", floor);
      return res.status(400).send("Invalid floor");
    }

    if (typeof table !== "string" || !/^0[0-9]{2}$/.test(table)) {
      console.log("Invalid table:", table);
      return res.status(400).send("Invalid table");
    }

    let esp;
    const tableNumber = parseInt(table, 10) - 1;

    if (floor === 1) {
      if (tableNumber >= 0 && tableNumber < 17) {
        esp = "esp1";
      } else if (tableNumber >= 17 && tableNumber < 21) {
        esp = "esp2";
      } else {
        console.log("Table number out of range for floor 1:", tableNumber);
        return res.status(400).send("Table number out of range for floor 1");
      }
    } else if (floor === 2 && tableNumber >= 0 && tableNumber < 18) {
      esp = "esp3";
    } else {
      console.log("Table number out of range for floor 2:", tableNumber);
      return res.status(400).send("Table number out of range for floor 2");
    }

    if (relayState[esp][tableNumber] === action) {
      console.log(`Relay ${table} on floor ${floor} is already ${action}`);
      return res
        .status(200)
        .send(`Relay ${table} on floor ${floor} is already ${action}`);
    }

    commands[esp].push({ action, table: tableNumber, floor: floor });
    relayState[esp][tableNumber] = action;

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

module.exports = { controlRelay, pollRelay };
