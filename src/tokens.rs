
use uuid::Uuid;
use std::default;

use jwt::{Header, Registered, Token};
use crypto::sha2::Sha256;

use rocket::Outcome;
use rocket::http::Status;
use rocket::request::{self, Request, FromRequest};

static AUTH_SECRET: &'static str = "blablaksdf";
static AUTH_OFFSET : usize = "Bearer ".len();


pub struct AuthToken(String);

#[derive(Debug)]
pub enum AuthError {
    Missing,
    Invalid
}

pub fn verify_auth_token(token: &String) -> bool {
    let verification =
        Token::<Header, Registered>::parse(token.as_str()).unwrap();
    
    let secret = AUTH_SECRET.as_bytes();

    verification.verify(&secret, Sha256::new())
}

pub fn generate_auth_token(user_id: Uuid) -> String {

    let claims = Registered {
        sub: Some(user_id.to_string()),
        ..Default::default()
    };

    let header : Header = Default::default();
    let token = Token::new(header, claims);
    let jwt = token.signed(AUTH_SECRET.as_bytes(), Sha256::new());

    format!("{}", jwt.unwrap())
}

pub fn authenticate_token(token: &String) -> Option<String> {

    if verify_auth_token(token) {
        let verification =
            Token::<Header, Registered>::parse(token.as_str())
                .unwrap();

        verification.claims.sub
    } else {
        None
    }
}

fn is_valid_key(key: &str) -> bool {
    key[..7] == *"Bearer "
}

impl AuthToken {
    pub fn to_string_ptr(&self) -> &String {
        &self.0
    }
}

impl<'a, 'r> FromRequest<'a, 'r> for AuthToken {
    type Error = AuthError;

    fn from_request(request: &'a Request<'r>) -> request::Outcome<Self, Self::Error> {

        let auth_headers: Vec<_> = request.headers().get("authorization").collect();
        
        match auth_headers.len() {
            0 => Outcome::Failure((Status::BadRequest, AuthError::Missing)),

            1 if is_valid_key(auth_headers[0])
              => Outcome::Success(AuthToken(auth_headers[0][7..].to_string())),

            1 => Outcome::Failure((Status::BadRequest, AuthError::Invalid)),
            _ => Outcome::Failure((Status::BadRequest, AuthError::Invalid))
        }
    }
}