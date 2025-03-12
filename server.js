const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/extract", async (req, res) => {
    const embedUrl = req.query.url;
    if (!embedUrl) return res.status(400).json({ error: "Missing embed URL" });

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            "User-Agent": "Mozilla/5.0 (Android)",
            "Referer": "https://hdstream4u.com/",
        });

        await page.goto(embedUrl, { waitUntil: "networkidle2", timeout: 30000 });

        let m3u8Url = null;
        page.on("response", async (response) => {
            const url = response.url();
            if (url.includes(".m3u8")) {
                m3u8Url = url;
            }
        });

        await page.waitForTimeout(5000); // Wait for JS to load
        await browser.close();

        if (m3u8Url) {
            return res.json({ m3u8: m3u8Url });
        } else {
            return res.status(404).json({ error: "M3U8 URL not found" });
        }
    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
