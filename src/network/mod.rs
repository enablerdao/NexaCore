pub mod p2p;
pub mod rpc;

use log::{info, error};

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing network components...");
    
    // Initialize P2P networking
    p2p::initialize()?;
    
    // Initialize RPC server
    rpc::initialize()?;
    
    info!("Network components initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down network components...");
    
    // Shutdown in reverse order
    rpc::shutdown()?;
    p2p::shutdown()?;
    
    info!("Network components shutdown complete");
    Ok(())
}