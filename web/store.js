
import vuex from "vuex"

import * as service from "./service"

export const INDETERMINATE = 1;
export const LOGGED_OUT = 2;
export const LOGGED_IN = 3;

export const waitForLogin = () => {
    if (store.state.loggedInStatus === INDETERMINATE) {
        return new Promise((win, fail) => {
            loginQueue.push({win, fail});
        });
    } else {
        return new Promise((win, fail) => {
            if (store.state.loggedInStatus === LOGGED_IN) {
                win();
            } else {
                fail();
            }
        });
    }
}

const loginQueue = [];

const store = new vuex.Store({
    state: {
        session: null,

        user: null,

        loggedInStatus: INDETERMINATE
    },

    mutations: {
        SET_SESSION(state, session, user) {
            state.session = session;
            state.user = user;
        },

        UNSET_SESSION(state) {
            state.session = null;
            state.user = null;
        },

        SET_LOGGED_IN_STATUS(state, status) {
            state.loggedInStatus = status;
        },
    },

    getters: {
        loggedIn(state) {
            return state.user !== null;
        }
    },

    actions: {
        _startSession(ctxt, {session, user}) {
            ctxt.dispatch('_setLoggedInStatus', LOGGED_IN);

            localStorage.setItem('session', JSON.stringify(session));
            localStorage.setItem('user', JSON.stringify(user));

            ctxt.commit('SET_SESSION', session, user);

            service.authenticate(session);
        },

        _endSession(ctxt) {
            ctxt.dispatch('_setLoggedInStatus', LOGGED_OUT);

            localStorage.removeItem('session');
            localStorage.removeItem('user');

            ctxt.commit('UNSET_SESSION');

            service.unauthenticate();
        },

        _setLoggedInStatus(ctxt, status) {
            if (status !== INDETERMINATE) {
                const dequeued = loginQueue.splice(0);

                ctxt.commit('SET_LOGGED_IN_STATUS', status);

                dequeued.forEach(({win, fail}) => {
                    if (status === LOGGED_IN) {
                        win();
                    } else {
                        fail();
                    }
                });
            }
        },

        logIn(ctxt, params) {
            return service.post('login', false, params)
                .then(({err, session, user}) => {
                    if (err) {
                        return {err, success: false};
                    } else {
                        ctxt.dispatch('_startSession', {session, user});

                        return {err: null, success: true};
                    }
                });
        },

        logOut(ctxt) {
            // TODO: Tell server to delete session...

            ctxt.dispatch('_endSession');
        },

        signUp(ctxt, params) {
            return service.post('signup', false, params)
                .then(({err, session, user}) => {

                    if (err) {
                        return {err, success: false};
                    } else {
                        ctxt.dispatch('_startSession', {session, user});

                        return {err: null, success: true};
                    }
                });
        },

        attemptAutoLogin(ctxt) {
            const sessionJSON = localStorage.getItem('session');

            if (sessionJSON) {
                const session = JSON.parse(sessionJSON);
                const user = JSON.parse(localStorage.getItem('user'));

                return service.checkSession(session)
                    .then((success) => {

                        if (success) {
                            ctxt.dispatch('_startSession', {session, user});
                        } else {
                            ctxt.dispatch('_endSession');
                        }

                        return success;
                    }, (err) => {
                        ctxt.dispatch('_endSession');

                        return false;
                    });

                // TODO: Implement...
            } else {
                ctxt.dispatch('_setLoggedInStatus', LOGGED_OUT);

                return Promise.resolve(false);
            }
        }
    }
});

export default store;
