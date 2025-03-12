pub mod block;
pub mod transaction;
pub mod consensus;
pub mod shard;
pub mod state;

use log::{info, error};

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing core components...");
    
    // Initialize blockchain state
    state::initialize()?;
    
    // Initialize sharding system
    shard::initialize()?;
    
    // Initialize consensus engine
    consensus::initialize()?;
    
    info!("Core components initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down core components...");
    
    // Shutdown in reverse order
    consensus::shutdown()?;
    shard::shutdown()?;
    state::shutdown()?;
    
    info!("Core components shutdown complete");
    Ok(())
}