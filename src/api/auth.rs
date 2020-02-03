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

/// Log the user in and return a response with an auth token.
///
/// Return UNAUTHORIZED in case the user can't be found or if the password is incorrect.
#[post("/login", data = "<user_in>", format = "application/json")]
pub fn login(
    user_in: Json<UserLogin>,
    app_config: State<AppConfig>,
    db: DbConn,
    mut cookies: Cookies,
) -> Result<APIResponse, APIResponse> {
    let user_q = users
        .filter(email.eq(&user_in.email))
        .first::<UserModel>(&*db)
        .optional()?;

    // For privacy reasons, we'll not provide the exact reason for failure here (although this
    // could probably be timing attacked to find out whether users exist or not.
    let user =
        user_q.ok_or_else(|| unauthorized().message("Username or password incorrect."))?;

    if !user.verify_password(user_in.password.as_str()) {
        return Err(unauthorized().message("Username or password incorrect."));
    } else {
        let session_token = generate_auth_token(user.id);

        // create session
        cookies.add(session_token.as_cookie());

        Ok(ok().data(json!({
            "success": true,
            "user": user
        })))
    }
}

/// Register a new user using email and password.
///
/// Return CONFLICT is a user with the same email already exists.
#[post("/signup", data = "<user>", format = "application/json")]
pub fn signup(
    user: Result<UserSignup, JsonValue>,
    db: DbConn,
    mut cookies: Cookies
) -> Result<APIResponse, APIResponse> {
    let user_data = user.map_err(unprocessable_entity)?;

    let new_password_hash = UserModel::make_password_hash(user_data.password.as_str());
    let new_user = NewUser {
        email: user_data.email.clone(),
        name: user_data.name.clone(),
        phone: user_data.phone.clone(),
        password_hash: new_password_hash,
    };

    let insert_result = diesel::insert_into(users::table)
        .values(&new_user)
        .get_result::<UserModel>(&*db);
    if let Err(diesel::result::Error::DatabaseError(
        diesel::result::DatabaseErrorKind::UniqueViolation,
        _,
    )) = insert_result
    {
        Ok(ok().data(json!({
            "success": false
        })))
    } else {
        let user = insert_result?;
        let session_token = generate_auth_token(user.id);
    
        cookies.add(session_token.as_cookie());

        Ok(ok().data(json!({
            "success": true,
            "user": user
        })))
    }
}

#[get("/verify-session")]
pub fn verify_session(cookies: Cookies) -> APIResponse {

    ok().data(json!({
        "success": match cookies.get("session-token") {

            Some(cookie) => {

                let token_string = String::from(cookie.value());

                println!("token {}", token_string);

                let token = AuthToken::from_string(token_string);

                verify_auth_token(&token)
            }
            None => false
        }
    }))
}

#[post("/logout")]
pub fn logout(mut cookies: Cookies) -> APIResponse {

    cookies.remove(Cookie::named("session-token"));

    ok().data(json!({
        "success": true
    }))
}