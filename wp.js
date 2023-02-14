// WordPress functions

import dotenv from 'dotenv'; // https://www.npmjs.com/package/dotenv
import FormData from 'form-data'; // https://www.npmjs.com/package/form-data
import https from 'https';
import process from 'process';

dotenv.config();

const AUTH = process.env.WP_USERNAME + ':' + process.env.WP_PASSWORD;

const URL = process.env.WP_URL;
const URL_POSTS = URL + '/wp-json/wp/v2/posts';
const URL_TAGS = URL + '/wp-json/wp/v2/tags';
const URL_CATEGORIES = URL + '/wp-json/wp/v2/categories';
const URL_MEDIA = URL + '/wp-json/wp/v2/media';

// HTTP GET
async function get(url) {
    console.log('get ' + url);
    return new Promise((resolve) => {
        let responseBody = '';
        const options = {};
        https.get(url, options, response => {
            response.on('data', chunk => responseBody += chunk);
            response.on('end', () => {
                resolve([response, JSON.parse(responseBody)]);
            });
        });
    });
}

async function getMany(url) {
    const MAX_PAGE = 2;
    const bodies = [];
    for (let page = 1; page <= MAX_PAGE; page += 1) {
        const [response, body] = await get(url + '?per_page=100&page=' + page);
        if (response.statusCode !== 200) {
            break;
        }
        bodies.push(body);
        if (body.length < 100) {
            break;
        }
    }
    // responses?
    return bodies.flat();
}

// HTTP POST
async function post(url, data) {
    console.log('post ' + url);
    const requestBody = JSON.stringify(data);
    return new Promise((resolve) => {
        let responseBody = '';
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
            auth: AUTH,
            method: 'POST',
        };
        const request = https.request(url, options, response => {
            response.on('data', chunk => responseBody += chunk);
            response.on('end', () => {
                resolve([response, JSON.parse(responseBody)]);
            });
        });
        request.write(requestBody);
        request.end();
    });
}

async function postImage(url, title, filename, media) {
    console.log('post ' + url);
    return new Promise((resolve) => {
        let responseBody = '';
        const form = new FormData();
        form.append('title', title);
        form.append('file', media, filename);
        const data = form.getBuffer();
        const options = {
            headers: {
                'Content-Type': form.getHeaders()['content-type'],
                'Content-Length': data.length,
            },
            auth: AUTH,
            method: 'POST',
        };
        const request = https.request(url, options, response => {
            response.on('data', chunk => responseBody += chunk);
            response.on('end', () => {
                resolve([response, responseBody]);
            });
        });
        request.write(data);
        request.end();
    });
}

// https://developer.wordpress.org/rest-api/reference/posts/

// fetch all stories which are currently available
export async function postList() {
    const [response, body] = await get(URL_POSTS + '?per_page=100&page=1');
    return body;
}

// title: string
export async function postCreate(title) {
    const [response, body] = await post(URL_POSTS, { title: title, status: 'publish' });
    // TODO for body.id
    //console.log(body);
}

// id: integer
// content: string
// tags: array of integers
export async function postUpdate(id, content, tags) {
    const [response, body] = await post(URL_POSTS + '/' + id, { content: content, tags: tags, status: 'publish' });
    //console.log(body);
}

// https://developer.wordpress.org/rest-api/reference/tags/

export async function tagList() {
    const body = await getMany(URL_TAGS);
    //assert(res.statusCode === 200);
    return body;
}

// name: string
export async function tagCreate(name) {
    const [response, body] = await post(URL_TAGS, { name: name });
    //assert(res.statusCode === 201);
}

// https://developer.wordpress.org/rest-api/reference/categories/

export async function categoryList() {
    const [response, body] = await get(URL_CATEGORIES);
    return body;
}

// https://developer.wordpress.org/rest-api/reference/media/

export async function mediaList() {
    const body = await getMany(URL_MEDIA);
    return body;
}

export async function mediaCreate(title, filename, media) {
    const [response, body] = await postImage(URL_MEDIA, title, filename, media);
}
