pub mod vm;
pub mod compiler;

use log::{info, error};

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing smart contract engine...");
    
    // Initialize virtual machine
    vm::initialize()?;
    
    // Initialize compiler
    compiler::initialize()?;
    
    info!("Smart contract engine initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down smart contract engine...");
    
    // Shutdown in reverse order
    compiler::shutdown()?;
    vm::shutdown()?;
    
    info!("Smart contract engine shutdown complete");
    Ok(())
}