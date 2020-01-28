
const {floor, random} = Math;

export const LOWERCASE = `abcdefghijklmnopqrstuvwxyz`;
export const UPPERCASE = LOWERCASE.toUpperCase();
export const ALPHABET = `${LOWERCASE}${UPPERCASE}`;
export const NUMERIC = `0123456789`;
export const ALPHANUMERIC = `${NUMERIC}${ALPHABET}`;

export const randomString = (length = 10, alphabet = ALPHANUMERIC) => {
    let string = '';

    for (let i = 0; i < length; i++) {
        const char = alphabet[floor(alphabet.length * random())];

        string += char;
    }

    return string;
}

export {hash} from "./sha256"
