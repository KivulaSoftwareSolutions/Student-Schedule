// server.js
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

// ---- Daily Block Rotation (Mon–Thu fixed, Fri TBD later) ----
function getDayBlocks() {
  const today = new Date();
  const weekday = today.getDay(); // 0 Sun, 1 Mon, ... 5 Fri

  switch (weekday) {
    case 1: return ["A", "B", "C", "D"]; // Monday
    case 2: return ["B", "C", "D", "A"]; // Tuesday
    case 3: return ["C", "D", "A", "B"]; // Wednesday
    case 4: return ["D", "A", "B", "C"]; // Thursday
    case 5: return ["A", "B", "C", "D"]; // Friday (temporary – rotation later)
    default: return []; // Weekend = no classes
  }
}

// ---- Bell Schedule (Lunch has NO BLOCK!) ----
const schedule = [
  { block: "A", name: "1st Morning Class",  start: "09:20", end: "10:40" },
  { block: "B", name: "2nd Morning Class",  start: "10:45", end: "11:55" },
  { block: "Lunch",  name: "Lunch",              start: "12:00", end: "12:40" }, // ✅ no block!
  { block: "C", name: "1st Afternoon Class",start: "12:40", end: "14:05" },
  { block: "D", name: "2nd Afternoon Class",start: "14:10", end: "15:25" }
];

// Convert 24h time to minutes from midnight
function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ✅ /api/schedule — returns today's classes (with correct block order)
app.get("/api/schedule", (req, res) => {
  const blockOrder = getDayBlocks();

  const sorted = schedule.map(item => {
    if (!item.block) return item; // lunch stays untouched
    return { ...item, block: blockOrder[["A","B","C","D"].indexOf(item.block)] };
  });

  res.json(sorted);
});

// ✅ /api/current-block — tells what block is happening right now
app.get("/api/current-block", (req, res) => {
  const now = (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  const blockOrder = getDayBlocks();

  const currentBlock = schedule.find(item => {
    if (!item.block) return false; // ✅ ignore lunch / no-block items
    const start = toMinutes(item.start);
    const end = toMinutes(item.end);
    return now >= start && now <= end;
  });

  if (!currentBlock) {
    return res.json({ message: "No current class" });
  }

  const blockLetter = blockOrder[["A","B","C","D"].indexOf(currentBlock.block)];

  res.json({
    block: blockLetter,
    name: currentBlock.name,
    start: currentBlock.start,
    end: currentBlock.end
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
