
import vuex from "vuex"
import {states} from "./login"

const store = new vuex.Store({
    state: {
        session: null,

        user: null,

        loggedInStatus: states.INDETERMINATE
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

        startSession(ctxt, {session, user}) {
            ctxt.dispatch('setLoggedInStatus', states.LOGGED_IN);

            ctxt.commit('SET_SESSION', session, user);
        },

        endSession(ctxt) {
            ctxt.dispatch('setLoggedInStatus', states.LOGGED_OUT);

            ctxt.commit('UNSET_SESSION');
        },

        setLoggedInStatus(ctxt, status) {
            ctxt.commit('SET_LOGGED_IN_STATUS', status);
        }
    }
});

export default store;
