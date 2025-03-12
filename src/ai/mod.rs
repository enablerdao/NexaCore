pub mod optimizer;
pub mod debugger;

use log::{info, error};

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing AI components...");
    
    // Initialize transaction optimizer
    optimizer::initialize()?;
    
    // Initialize smart contract debugger
    debugger::initialize()?;
    
    info!("AI components initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down AI components...");
    
    // Shutdown in reverse order
    debugger::shutdown()?;
    optimizer::shutdown()?;
    
    info!("AI components shutdown complete");
    Ok(())
}