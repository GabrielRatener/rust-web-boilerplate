
import {hash, unique} from "./utils"
import store from "./store"
import * as services from "./services"

const session = {
    id: null,
    secret: null,
    user: null
}

const loginQueue = [];

export const states = {
    INDETERMINATE: unique(),
    LOGGED_OUT: unique(),
    LOGGED_IN: unique()
}

export const waitForLogin = () => {
    if (store.state.loggedInStatus === states.INDETERMINATE) {
        return new Promise((win, fail) => {
            loginQueue.push({win, fail});
        });
    } else {
        return new Promise((win, fail) => {
            if (store.state.loggedInStatus === states.LOGGED_IN) {
                win();
            } else {
                fail();
            }
        });
    }
}

export const unauthenticate = () => {
    session.id = null;
    session.secret = null;
    session.user = null;

    localStorage.removeItem('session');
    localStorage.removeItem('user');

    store.dispatch('endSession');
}

export const authenticate = (user, {id, secret}) => {


    session.id = id;
    session.secret = secret;
    session.user = user;

    localStorage.setItem('session', JSON.stringify({id, secret}));
    localStorage.setItem('user', JSON.stringify(user));

    store.dispatch('startSession', {user, session: {id, secret}});
}

export const checkSession = ({id, secret}) => {
    const token = generateToken({id, secret});

    return services.get('test-token', false, {token})
        .then(({success}) => {
            return success;
        });
}

export const generateToken = (auth = session) => {
    const time = Date.now();

    return `${auth.id}|${time}|${hash(auth.id + time + auth.secret)}`;
}

export const logIn = (params) => {
    return services.post('login', false, params)
        .then(({err, session, user}) => {
            if (err) {
                return {err, success: false};
            } else {
                authenticate(user, session);

                return {err: null, success: true};
            }
        });
}

export const logOut = () => {
    // TODO: Tell server to delete session...

    unauthenticate();
}

export const signUp = (params) => {
    return services.post('signup', false, params)
        .then(({err, session, user}) => {

            if (err) {
                return {err, success: false};
            } else {
                authenticate(user, session);

                return {err: null, success: true};
            }
        });
}

export const attemptAutoLogin = () => {
    const sessionJSON = localStorage.getItem('session');

    if (sessionJSON) {
        const session = JSON.parse(sessionJSON);
        const user = JSON.parse(localStorage.getItem('user'));

        return checkSession(session)
            .then((success) => {

                if (success) {
                    authenticate(user, session);
                } else {
                    unauthenticate();
                }

                return success;
            }, (err) => {

                unauthenticate();

                return false;
            });

        // TODO: Implement...
    } else {
        unauthenticate();

        return Promise.resolve(false);
    }
}

export const setLoggedInStatus = (status) => {
    if (status === states.INDETERMINATE) {

        throw new Error('Cannot set status to indeterminate!');
    } else {
        const dequeued = loginQueue.splice(0);

        store.dispatch('setLoggedInStatus', status);

        dequeued.forEach(({win, fail}) => {
            if (status === states.LOGGED_IN) {
                win();
            } else {
                fail();
            }
        });
    }
}

export const resolveLoggedInStatus = () => {
    if (localStorage.getItem('session') && localStorage.getItem('user')) {
        attemptAutoLogin()
            .then((success) => {
                setLoggedInStatus(success ? states.LOGGED_IN : states.LOGGED_OUT);
            });
    } else {
        setLoggedInStatus(states.LOGGED_OUT);
    }
}
