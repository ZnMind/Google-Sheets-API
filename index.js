const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listMajors(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        //spreadsheetId: '1ucKnXyESaXhR3SxezsZ740MzSz5tf-pkNg5GRtz27e0',
        range: 'Class Data!A2:E',
    });
    const rows = res.data.values;
    if (!rows || rows.length === 0) {
        console.log('No data found.');
        return;
    }
    console.log('Name, Gender, Major:');
    rows.forEach((row) => {
        // Print columns A and E, which correspond to indices 0 and 4.
        console.log(`${row[0]}, ${row[1]}, ${row[4]}`);
    });
}

//Example implementing excel formulas into cells
var user;
var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]
var values = [
    ["DMann"],
    ["Fibonacci", "Sequence"],
    ["Sheets API", "Example", "Writing", "Columns & Rows"],
    [0, 1],
    [1]
]
for(let i = 0; i < alphabet.length - 1; i++) {
    let string = `=${alphabet[i]}4+${alphabet[i + 1]}4`
    values[3].push(string)
}
for(let j = 0; j < 15; j++) {
    let string = `=A${j + 4}+A${j + 5}`
    values.push([string])
}
console.log(values)

async function postData() {
    user = await authorize();
    await updateValParams(user, '1ucKnXyESaXhR3SxezsZ740MzSz5tf-pkNg5GRtz27e0', 'Example!A1', 'USER_ENTERED', values)
}

async function updateValParams(auth, spreadsheetId, range, valueInputOption, values) {
    const sheets = google.sheets({ version: 'v4', auth });
    const resource = {
        values,
    };
    
    try {
        const result = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption,
            resource,
        })
        
        console.log('%d cells updated.', result.data.updatedCells);
        return result;
    } catch(err) {
        throw err;
    }
}

postData();
authorize().then(listMajors).catch(console.error);