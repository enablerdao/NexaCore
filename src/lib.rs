pub mod core;
pub mod network;
pub mod smartcontracts;
pub mod ai;
pub mod wallets;

use log::{info, error};

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing NexaCore blockchain...");
    
    // Initialize core components
    core::initialize()?;
    
    // Initialize network
    network::initialize()?;
    
    // Initialize smart contract engine
    smartcontracts::initialize()?;
    
    // Initialize AI components
    ai::initialize()?;
    
    // Initialize wallet system
    wallets::initialize()?;
    
    info!("NexaCore blockchain initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down NexaCore blockchain...");
    
    // Shutdown in reverse order of initialization
    wallets::shutdown()?;
    ai::shutdown()?;
    smartcontracts::shutdown()?;
    network::shutdown()?;
    core::shutdown()?;
    
    info!("NexaCore blockchain shutdown complete");
    Ok(())
}