
import {unique} from "./utils"
import store from "./store"
import * as services from "./services"

const createSession = (user = null, token = null) => {
    return {
        user,
        token
    }
}

const loginQueue = [];

const session = {
    ...createSession() // create null session
}

export const states = {
    INDETERMINATE: unique(),
    LOGGED_OUT: unique(),
    LOGGED_IN: unique()
}

export const token = () => {
    return session.token;
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


    localStorage.removeItem('user');

    store.dispatch('endSession');

    Object.assign(session, createSession()); // remove session
}

export const authenticate = (user, token) => {

    localStorage.setItem('user', JSON.stringify(user));

    store.dispatch('startSession', {user});

    Object.assign(session, createSession(user, token));
}

// export const checkSession = ({id, secret}) => {
//     return services.get('auth/test-token', true, {})
//         .then(({success}) => {
//             return success;
//         });
// }

export const logIn = (params) => {
    return services.post('auth/login', false, params)
        .then(({err, token, user}) => {
            if (err) {
                return {err, success: false};
            } else {
                authenticate(user, token);

                return {err: null, success: true};
            }
        });
}

export const logOut = () => {
    // TODO: Tell server to delete session...

    unauthenticate();
}

export const signUp = (params) => {
    return services.post('auth/signup', false, params)
        .then(({err, token, user}) => {

            if (err) {
                return {err, success: false};
            } else {
                authenticate(user, token);

                return {err: null, success: true};
            }
        });
}

// export const attemptAutoLogin = () => {

//     if (sessionJSON) {
//         const user = JSON.parse(localStorage.getItem('user'));

//         return checkSession(session)
//             .then((success) => {

//                 if (success) {
//                     authenticate(user, session);
//                 } else {
//                     unauthenticate();
//                 }

//                 return success;
//             }, (err) => {

//                 unauthenticate();

//                 return false;
//             });

//         // TODO: Implement...
//     } else {
//         unauthenticate();

//         return Promise.resolve(false);
//     }
// }

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
    // if (localStorage.getItem('user')) {
    //     attemptAutoLogin()
    //         .then((success) => {
    //             setLoggedInStatus(success ? states.LOGGED_IN : states.LOGGED_OUT);
    //         });
    // } else {
    //     setLoggedInStatus(states.LOGGED_OUT);
    // }

    setLoggedInStatus(states.LOGGED_OUT);
}
