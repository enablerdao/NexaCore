use clap::{Parser, Subcommand};
use log::{info, error};
use std::path::PathBuf;
use std::process;

#[derive(Parser)]
#[clap(name = "NexaCore")]
#[clap(about = "Next-generation blockchain with AI integration, sharding, and zk-SNARKs")]
struct Cli {
    #[clap(subcommand)]
    command: Commands,
    
    #[clap(short, long, value_parser, default_value = "config/config.toml")]
    config: PathBuf,
    
    #[clap(short, long, action)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Start a full node
    Node {
        #[clap(short, long, action)]
        validator: bool,
    },
    /// Start a light client
    Client {},
    /// Initialize a new wallet
    InitWallet {
        #[clap(short, long, value_parser)]
        name: String,
    },
}

fn setup_logging(verbose: bool) {
    let env = env_logger::Env::default()
        .filter_or("NEXACORE_LOG", if verbose { "debug" } else { "info" });
    
    env_logger::Builder::from_env(env)
        .format_timestamp_millis()
        .init();
}

fn main() {
    let cli = Cli::parse();
    
    setup_logging(cli.verbose);
    
    info!("Starting NexaCore v0.1.0");
    
    if let Err(e) = nexacore::initialize() {
        error!("Failed to initialize NexaCore: {}", e);
        process::exit(1);
    }
    
    match &cli.command {
        Commands::Node { validator } => {
            info!("Starting node (validator: {})", validator);
            // Start node logic here
        },
        Commands::Client {} => {
            info!("Starting light client");
            // Start client logic here
        },
        Commands::InitWallet { name } => {
            info!("Initializing wallet: {}", name);
            // Wallet initialization logic here
        },
    }
    
    // Set up signal handlers for graceful shutdown
    ctrlc::set_handler(move || {
        info!("Received shutdown signal");
        if let Err(e) = nexacore::shutdown() {
            error!("Error during shutdown: {}", e);
        }
        process::exit(0);
    }).expect("Error setting Ctrl-C handler");
    
    // Keep the main thread alive
    loop {
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}