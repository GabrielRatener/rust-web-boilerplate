
use uuid::Uuid;
use std::default;

use jwt::{Header, Registered, Token};
use crypto::sha2::Sha256;

static AUTH_SECRET: &'static str = "blablaksdf";

pub fn verify_auth_token(token: String) -> bool {
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
