const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const {
    CronJob
} = require('cron');
require('dotenv').config();

//Cronjob
const cron = process.env.CRON || '1-59/2 * * * *';
const cron2 = process.env.CRON2 || '*/2 * * * *';

const usernames = process.env.USERNAMES.split(' ');
const passwords = process.env.PASSWORDS.split(' ');

console.log('Server started');

setTimeout(function worker() {
    console.log("Restarting app...");
    process.exit()

}, process.env.NUM_MILLI_SECONDS || 5 * 60 * 1000);

const headerSchema = new mongoose.Schema({
    headers: {},
    type: String
});

let job = new CronJob(cron2, async () => {
    console.log(new Date().toString());
    let url = 'https://open.spotify.com/album/21jF5jlMtzo94wbxmJ18aa'

    //Connect to database
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.MONGODB);

    const Headers = mongoose.model('headers', headerSchema);

    //Start headless browser
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

    //check every response
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
                const myHeader = {
                    headers: headers,
                    type: 'spotify'
                }
                await Headers.findOneAndUpdate({
                    'type': 'spotify'
                }, myHeader);
                console.log('Headers updated: Webplayer!');
                page.close();
                mongoose.connection.close();
            }
        } catch (e){
        };
    });
});

let jobChart = new CronJob(cron, async () => {
    try {
        console.log(new Date().toString());
        let url = 'https://charts.spotify.com/home'

        //Connect to database
        mongoose.set('strictQuery', false);
        mongoose.connect(process.env.MONGODB);

        const Headers = mongoose.model('headers', headerSchema);

        //Start headless browser
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(120000); 
        await page.goto(url, {
            waitUntil: 'load'
        });
        
        await page.click('div.ButtonInner-sc-14ud5tc-0.iMWZgy.encore-bright-accent-set');
        await page.waitForNavigation();

        const usernameInput = await page.$('#login-username');
        const passwordInput = await page.$('#login-password');
        let userindex = Math.floor(Math.random() * usernames.length)
        await usernameInput.type(usernames[userindex]);
        await passwordInput.type(passwords[userindex]);

        await page.click('#login-button');
        await page.waitForNavigation();

        await page.goto('https://charts.spotify.com/charts/view/regional-global-daily/latest', {
            waitUntil: 'load'
        });

        // check every response
        const responseTimeout = setTimeout(() => {
            console.log('Response timeout reached, closing page...');
            browser.close();
        }, 90000); // 30-second timeout

        page.on('response', async (response) => {
            clearTimeout(responseTimeout);
            try {
                let d = await response.json();
                //look for specific response
                if (('chartNavigationFilters') in d && ('countryFilters' in d) && ('displayChart' in d) && ('entries' in d)) {
                    let headers = await response.request().headers();
                    const myHeader = {
                        headers: headers,
                        type: 'spotify-chart'
                    }
                    await Headers.findOneAndUpdate({
                        'type': 'spotify-chart'
                    }, myHeader);
                    console.log('Headers updated: Chart!');
                    await browser.close();
                    mongoose.connection.close();
                    process.exit();
                };
            } catch(e) {
                
            };
        });

    } catch(e) {
        console.log(e);
    };
});

// jobChart.start();
// job.start();

const scrapeChart = async () => {
    try {
        console.log(new Date().toString());
        let url = 'https://charts.spotify.com/home'

        //Connect to database
        mongoose.set('strictQuery', false);
        mongoose.connect(process.env.MONGODB);

        const Headers = mongoose.model('headers', headerSchema);

        //Start headless browser
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(120000); 
        await page.goto(url, {
            waitUntil: 'load'
        });
        
        await page.click('div.ButtonInner-sc-14ud5tc-0.iMWZgy.encore-bright-accent-set');
        await page.waitForNavigation();

        const usernameInput = await page.$('#login-username');
        const passwordInput = await page.$('#login-password');
        let userindex = Math.floor(Math.random() * usernames.length)
        await usernameInput.type(usernames[userindex]);
        await passwordInput.type(passwords[userindex]);

        await page.click('#login-button');
        await page.waitForNavigation();

        await page.goto('https://charts.spotify.com/charts/view/regional-global-daily/latest', {
            waitUntil: 'load'
        });

        // check every response
        const responseTimeout = setTimeout(() => {
            console.log('Response timeout reached, closing page...');
            browser.close();
        }, 90000); // 30-second timeout

        page.on('response', async (response) => {
            clearTimeout(responseTimeout);
            try {
                let d = await response.json();
                //look for specific response
                if (('chartNavigationFilters') in d && ('countryFilters' in d) && ('displayChart' in d) && ('entries' in d)) {
                    let headers = await response.request().headers();
                    const myHeader = {
                        headers: headers,
                        type: 'spotify-chart'
                    }
                    await Headers.findOneAndUpdate({
                        'type': 'spotify-chart'
                    }, myHeader);
                    console.log('Headers updated: Chart!');
                    await browser.close();
                    mongoose.connection.close();
                    process.exit();
                };
            } catch(e) {
                
            };
        });

    } catch(e) {
        console.log(e);
    };
};

scrapeChart()