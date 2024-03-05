from .models import *
from playwright.sync_api import sync_playwright, Playwright


def scrape_spotify_chart_token():
    try:
        credentials = get_random_credentials()
        if not credentials:
            raise Exception('Could not get spotify credentials')
        with sync_playwright() as p:
            iphone_13 = p.devices['iPhone 13']
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(bypass_csp=True, **iphone_13, screen={'width':1080, 'height': 720})
            
            page = context.new_page()

            url = 'https://accounts.spotify.com/en-GB/login?continue=https%3A%2F%2Fcharts.spotify.com/login'
            page.goto(url)

             # Find the username and password input fields by their IDs
            page.wait_for_selector('#login-username', timeout=5000)
            username_input = page.locator('#login-username')
            password_input = page.locator('#login-password')

            # Input the username and password (replace with actual credentials)
            username_input.type(credentials.email)
            password_input.type(credentials.password)

            # Perform the login
            login_button = page.locator('#login-button')
            login_button.click()

            # Wait for the login to complete 
            page.wait_for_url('https://charts.spotify.com/charts/overview/global')

            # Navigate to the target URL
            target_url = 'https://charts.spotify.com/charts/view/regional-global-daily/latest'
            page.goto(target_url)
            page.wait_for_url(target_url)
            # Listen for responses

            with page.expect_request('https://charts-spotify-com-service.spotify.com/auth/v0/charts/regional-global-daily/latest') as req:
                request = req.value
                browser.close()
                print(request.headers['authorization'])
                return request.headers['authorization'], (None, 200)
                
    except Exception as e:
        print('excpetion')
        try:
            browser.close()
        except:
            return None, (str(e), 400)
        print(e)
        return None, (str(e), 400)