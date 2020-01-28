use dotenv::dotenv;
use std::env;
use rocket_contrib::serve::StaticFiles;

fn main() -> Result<(), String> {
    dotenv().ok();

    let config_name = env::var("CONFIG_ENV").expect("CONFIG must be set");
    let rocket = rust_web_boilerplate::rocket_factory(&config_name)?;
    let static_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/public");

    rocket
        .mount("/", StaticFiles::from(static_dir))
        .launch();

    Ok(())
}
