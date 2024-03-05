import puppeteer from "puppeteer";
import pool from './db.js';

export const getSpotifyToken = async (req,res) => {
    try{
        let url = 'https://open.spotify.com/album/21jF5jlMtzo94wbxmJ18aa'

        // Start headless browser
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: 'load'
        });

        // check every response
        let responseTimeoutReached = false;
        const responseTimeout = setTimeout(() => {
            console.log('Response timeout reached, closing page...');
            page.close();
            responseTimeoutReached = true;
        }, 30000); // 30-second timeout

        // check every response
        page.on('response', async (response) => {
            if (responseTimeoutReached) {
                return;
            }
            clearTimeout(responseTimeout);
            try {
                let d = await response.json();

                //look for specific response
                if ('name' in d.data.albumUnion.tracks.items[0].track) {

                    let headers = await response.request().headers();
                    console.log('Header found');
                    const client_token = headers['client-token'];
                    const bearer_token = headers['authorization'];

                    try {
                        await pool.query('SELECT * FROM spotify_tokens WHERE type=$1', ['WEB']);

                        await pool.query('DELETE FROM spotify_tokens WHERE type=$1', ['WEB']);
                        await pool.query('INSERT INTO spotify_tokens (type, client_token, bearer_token) VALUES ($1, $2, $3)', ['WEB', client_token, bearer_token]);
                    } catch (error) {
                        await pool.query('INSERT INTO spotify_tokens (type, client_token, bearer_token) VALUES ($1, $2, $3)', ['WEB', client_token, bearer_token]);
                    }
                    console.log('Token scraped!');

                    await page.close();
                    res.send('Success!')
                    process.exit();

                }
            } catch (e) {};
        });
    } catch(e){
        console.error(e);
        res.send('Error: ' + e)
        process.exit();
    }
    
}
