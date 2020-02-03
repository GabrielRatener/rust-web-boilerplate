// TODO: Silence this until diesel 1.4.
// See https://github.com/diesel-rs/diesel/issues/1785#issuecomment-422579609.
#![allow(proc_macro_derive_resolution_fallback)]

use std::fmt;

use argon2rs::argon2i_simple;
// use chrono::{Duration, NaiveDateTime, Utc};
use diesel::pg::PgConnection;
use diesel::prelude::*;
// use diesel::result::Error as DieselError;
use rand::distributions::Alphanumeric;
use rand::{Rng, thread_rng};
// use ring::constant_time::verify_slices_are_equal;
use serde_derive::{Deserialize, Serialize};
use uuid::Uuid;

use crate::schema::users;
use crate::tokens;
use crate::schema::users::dsl::*;


const SALT_LENGTH : usize = 12;

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, AsChangeset)]
#[table_name = "users"]
pub struct UserModel {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub phone: String,

    #[serde(skip_serializing)]
    pub password_hash: Vec<u8>,
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser {
    pub email: String,
    pub name: String,
    pub phone: String,
    pub password_hash: Vec<u8>,
}

impl fmt::Display for UserModel {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "<User {email}>", email = self.email)
    }
}

impl UserModel {
    /// Hash `password` using argon2 and return it.
    pub fn make_password_hash(password: &str) -> Vec<u8> {
        let salt : String =
            thread_rng()
                .sample_iter(&Alphanumeric)
                .take(SALT_LENGTH)
                .collect();

        let salt_vec = salt.as_bytes().to_vec();

        let hash = argon2i_simple(password, salt.as_str()).to_vec();

        [&salt_vec[..], &hash[..]].concat()
    }

    /// Verify that `candidate_password` matches the stored password.
    pub fn verify_password(&self, candidate_password: &str) -> bool {
        let hash = self.password_hash[SALT_LENGTH..].to_vec();
        let salt_vec = self.password_hash[..SALT_LENGTH].to_vec();
        let salt_string = String::from_utf8(salt_vec).unwrap();
        
        hash == argon2i_simple(candidate_password, salt_string.as_str()).to_vec()
    }

    /// Get a `User` from a login token.
    ///
    /// A login token has this format:
    ///     <user uuid>:<auth token>
    /// 
    pub fn get_user_from_login_token(token: &str, db: &PgConnection) -> Option<UserModel> {

        let token = tokens::AuthToken::from_string(String::from(token));

        if let Some(user_id_string) = tokens::authenticate_token(&token) {
            let user_id = Uuid::parse_str(user_id_string.as_str())
                .unwrap_or_default();

            let user_query = users.find(user_id).first::<UserModel>(&*db).optional();

            if let Ok(Some(user)) = user_query {
                Some(user)
            } else {
                None
            }
        } else {
            None
        }
    }
}
