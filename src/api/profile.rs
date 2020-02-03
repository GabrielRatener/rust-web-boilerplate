
use diesel;
use diesel::prelude::*;
use rocket::{post, get, State, Request};
use rocket::http::{Cookies, Cookie, SameSite};
use rocket_contrib::json;
use rocket_contrib::json::{Json, JsonValue};

use crate::config::AppConfig;
use crate::database::DbConn;
use crate::models::user::{NewUser, UserModel};
use crate::responses::{
    conflict, created, ok, unauthorized, unprocessable_entity, APIResponse,
};
use crate::schema::users;
use crate::schema::users::dsl::*;
use crate::validation::user::{UserLogin, UserSignup};

use crate::tokens::{AuthToken, generate_auth_token, verify_auth_token};


#[get("/get-profile")]
pub fn get_profile(user: UserModel) -> APIResponse {
    
    ok().data(json!({
        "success": true,
        "user": user
    }))
}
