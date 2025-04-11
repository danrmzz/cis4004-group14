# cis4004-group14 README

## Step 1
Download MysqlWorkbench(https://dev.mysql.com/downloads/workbench/) and Node.js(https://nodejs.org/en) The MySQL80 service will need to be running for the app to work.

## Step 2
Download the .zip from github containing all the files and folders we have provided, then extract it.

## Step 3
Create a .env file using the template below with your own keys in the main directory where app.js is located. (.env cannot be included in the github as it contains API keys that should not be shared with the public.)

.env file:

ALPHA_VANTAGE_API_KEY= [Insert your API key here]

FIREBASE_API_KEY=[Insert your API key here]

FIREBASE_AUTH_DOMAIN=[Insert your API key here]

FIREBASE_PROJECT_ID=[Insert your API key here]

FIREBASE_STORAGE_BUCKET=[Insert your API key here]

FIREBASE_MESSAGING_SENDER_ID=[Insert your API key here]

FIREBASE_APP_ID=[Insert your API key here]

FIREBASE_MEASUREMENT_ID=[Insert your API key here]

### Database Configuration
DB_HOST=localhost

DB_USER=root

DB_PASSWORD=1234

DB_NAME=financial_dashboard

DB_PORT=3306


## Step 4
Open Windows PowerShell or Terminal if on Mac

## Step 5
Use cd or dir commands to find the main directory containing app.js

## Step 6
Run npm install and then npm start

## Step 7
Open your browser and navigate to the web app. PowerShell or Terminal output will show the URL that takes you to the website. (typically http://localhost:3000/)

## Step 8
You should now be at our main landing page which will ask you to log in or sign up. 


# USE OF AI DECLARATION

## Claude AI was used sparingly on the back-end, primarily with debugging. This was incredibly helpful when the back-end team was stuck trying to connect MySQL and the stock API together with the web app and transferring data from the API to the database.
## Unfortunately the prompts used for AI were lost. I (Maxwell Williamson) ran out of chat length when using it to study for my CGS exam and had to delete my old chats. I was unaware prompts were required for submission. No other student in the group used AI. Prompts I can remember were 'Can you help me figure out why I am receiving this error? I am trying to connect a MySQL database to a web app project.' and 'Can you help me figure out why I am receiving this error? I am trying to make use of AlphaVantage Stock API and connect it to my web app project and SQL database.'




