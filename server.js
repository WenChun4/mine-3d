const express = require("express");
const path = require("path");
const fs = require('fs');
const cfg = require("dotenv");

cfg.config();
const app = express();
const PORT = process.env.REACT_APP_PORT || 3008;

// static files
app.use(express.static(path.join(__dirname, "build")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔒 CORS restriction
/*
app.use((req, res, next) => {
    const allowedOrigin = `${process.env.REACT_APP_IMJS_AUTH_CLIENT_URI}`;
    if (req.headers.origin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    next();
});
*/

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
