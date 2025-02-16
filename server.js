const express = require("express");
const path = require("path");
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// static files
app.use(express.static(path.join(__dirname, "build")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  test api
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from API' });
});

// 🚀 **api1：Get game history data (JSON)**
app.get('/api/data', (req, res) => {
    const {difficulty} = req.query;  // query parameters
    const data_file = path.join(__dirname, `game_Gecord_${difficulty}.json`);

    if(fs.existsSync(data_file) === false) {
        return res.json([]);
    }

    fs.readFile(data_file, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: `Can not read data, ${err}`});
        }
        res.json(JSON.parse(data));
    });
});

// 🚀 **api2: Write game history data to (JSON)**
app.post('/api/data', (req, res) => {
    const {difficulty} = req.query;  // query parameters
    const data_file = path.join(__dirname, `game_Gecord_${difficulty}.json`);
    const newData = req.body;  // read data from body
    if (!newData) {
        return res.status(400).json({ error: 'No data received' });
    }

    console.log(newData);

    fs.writeFile(data_file, JSON.stringify(newData, null, 2), {encoding: 'utf8'}, (err) => {
        if (err) {
            return res.status(500).json({ error: `Can not write data, ${data_file}, ${newData}, ${JSON.stringify(newData, null, 2)}` });
        }
        res.json({ message: `Data saved, ${data_file}, ${newData}, ${JSON.stringify(newData, null, 2)}` });
    });
});

// React router
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
