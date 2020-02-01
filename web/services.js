

import {hash} from "./utils"

const NS = `/api`;
const session = {
    id: null,
    secret: null
}

export const unauthenticate = () => {
    session.id = null;
    session.secret = null;
}

export const authenticate = ({id, secret}) => {
    session.id = id;
    session.secret = secret;
}

export const checkSession = ({id, secret}) => {
    const token = generateToken({id, secret});

    return get('test-token', false, {token})
        .then(({success}) => {
            return success;
        });
}

export const generateToken = (auth = session) => {
    const time = Date.now();

    return `${auth.id}|${time}|${hash(auth.id + time + auth.secret)}`;
}

export const querify = (obj) => {
    const queryComponents = [];

    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) {
            throw new Error('Query string value cannot be null or undefined');
        }

        queryComponents.push(`${key}=${encodeURIComponent(value)}`);
    }

    return queryComponents.join('&');
}

export const get = (subPath, token = true, data = {}) => {
    const path = `${NS}/${subPath}`;
    const queryString = querify(data);
    const url =
      (queryString.length > 0) ?
        `${path}?${queryString}` :
        path;
    
    return new Promise((win, fail) => {
        const xhr = new XMLHttpRequest();

        xhr.responseType = 'json';

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    win(xhr.response);
                } else {
                    fail(new Error(`Invalid XHR response: ${xhr.status}`));
                }
            }
        }

        xhr.open('GET', url, true);

        if (token) {
            xhr.setRequestHeader("Authorization", generateToken());
        }

        xhr.send();
    });
}

export const post = (subPath, token = true, data = {}) => {
    const url = `${NS}/${subPath}`;
    
    return new Promise((win, fail) => {
        const xhr = new XMLHttpRequest();

        xhr.responseType = 'json';

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    win(xhr.response);
                } else {
                    fail(new Error(`Invalid XHR response: ${xhr.status}`));
                }
            }
        }

        xhr.open('POST', url, true);

        xhr.setRequestHeader("Content-type", "application/json");

        if (token) {
            xhr.setRequestHeader("Authorization", generateToken());
        }

        xhr.send(JSON.stringify(data));
    });
}