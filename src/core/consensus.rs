use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use log::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use crate::core::block::Block;
use crate::core::transaction::Transaction;

// Adaptive Proof of Contribution (APoC) consensus algorithm

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorInfo {
    pub address: String,
    pub stake_amount: u64,
    pub computation_power: u32,
    pub contribution_score: u32,
    pub last_validation_time: u64,
    pub total_validated_blocks: u64,
}

#[derive(Debug)]
pub struct ConsensusEngine {
    validators: HashMap<String, ValidatorInfo>,
    active_validators: Vec<String>,
    current_epoch: u64,
    epoch_length: u64, // Number of blocks per epoch
    min_stake: u64,
    target_block_time: u64, // Target time between blocks in seconds
    difficulty: u32,
}

impl ConsensusEngine {
    pub fn new(min_stake: u64, epoch_length: u64, target_block_time: u64) -> Self {
        ConsensusEngine {
            validators: HashMap::new(),
            active_validators: Vec::new(),
            current_epoch: 0,
            epoch_length,
            min_stake,
            target_block_time,
            difficulty: 1000, // Initial difficulty
        }
    }
    
    pub fn register_validator(&mut self, address: String, stake_amount: u64, computation_power: u32) -> Result<(), String> {
        if stake_amount < self.min_stake {
            return Err(format!("Stake amount {} is below minimum {}", stake_amount, self.min_stake));
        }
        
        let validator = ValidatorInfo {
            address: address.clone(),
            stake_amount,
            computation_power,
            contribution_score: 0, // Initial score
            last_validation_time: 0,
            total_validated_blocks: 0,
        };
        
        self.validators.insert(address.clone(), validator);
        debug!("Registered validator: {}", address);
        
        // Update active validators list
        self.update_active_validators();
        
        Ok(())
    }
    
    pub fn update_validator_stake(&mut self, address: &str, new_stake: u64) -> Result<(), String> {
        if let Some(validator) = self.validators.get_mut(address) {
            if new_stake < self.min_stake {
                return Err(format!("New stake amount {} is below minimum {}", new_stake, self.min_stake));
            }
            
            validator.stake_amount = new_stake;
            debug!("Updated stake for validator {}: {}", address, new_stake);
            
            // Update active validators list
            self.update_active_validators();
            
            Ok(())
        } else {
            Err(format!("Validator {} not found", address))
        }
    }
    
    pub fn update_contribution_score(&mut self, address: &str, contribution: u32) -> Result<(), String> {
        if let Some(validator) = self.validators.get_mut(address) {
            validator.contribution_score += contribution;
            debug!("Updated contribution score for validator {}: +{} (total: {})", 
                   address, contribution, validator.contribution_score);
            
            // Update active validators list
            self.update_active_validators();
            
            Ok(())
        } else {
            Err(format!("Validator {} not found", address))
        }
    }
    
    fn update_active_validators(&mut self) {
        // Sort validators by a weighted combination of stake, computation power, and contribution score
        let mut weighted_validators: Vec<(String, u64)> = self.validators
            .iter()
            .map(|(addr, info)| {
                // Weight formula: 50% stake + 25% computation + 25% contribution
                let weight = (info.stake_amount / 2) + 
                             (info.computation_power as u64 * 1000 / 4) + 
                             (info.contribution_score as u64 * 1000 / 4);
                (addr.clone(), weight)
            })
            .collect();
        
        // Sort by weight in descending order
        weighted_validators.sort_by(|a, b| b.1.cmp(&a.1));
        
        // Take top validators (in a real implementation, this would be a configurable parameter)
        let max_validators = 100;
        self.active_validators = weighted_validators
            .into_iter()
            .take(max_validators)
            .map(|(addr, _)| addr)
            .collect();
        
        info!("Updated active validators list: {} validators", self.active_validators.len());
    }
    
    pub fn select_validator(&self, block_height: u64) -> Option<String> {
        if self.active_validators.is_empty() {
            warn!("No active validators available");
            return None;
        }
        
        // Use a deterministic selection based on block height
        // This ensures all nodes will select the same validator
        let index = (block_height % self.active_validators.len() as u64) as usize;
        let selected = self.active_validators[index].clone();
        
        debug!("Selected validator for block {}: {}", block_height, selected);
        Some(selected)
    }
    
    pub fn validate_block(&mut self, block: &Block, previous_block: &Block) -> bool {
        // Check basic block validity
        if !block.is_valid(previous_block) {
            error!("Block validation failed: invalid block structure");
            return false;
        }
        
        // Check that the validator is authorized
        if !self.active_validators.contains(&block.header.validator) {
            error!("Block validation failed: unauthorized validator {}", block.header.validator);
            return false;
        }
        
        // Check that the contribution score matches our records
        if let Some(validator) = self.validators.get(&block.header.validator) {
            if validator.contribution_score != block.header.contribution_score {
                error!("Block validation failed: contribution score mismatch for validator {}", 
                       block.header.validator);
                return false;
            }
        } else {
            error!("Block validation failed: validator {} not found", block.header.validator);
            return false;
        }
        
        // Validate all transactions in the block
        for tx in &block.transactions {
            if !tx.is_valid() {
                error!("Block validation failed: invalid transaction {}", tx.hash);
                return false;
            }
        }
        
        // Update validator statistics
        if let Some(validator) = self.validators.get_mut(&block.header.validator) {
            validator.last_validation_time = block.header.timestamp;
            validator.total_validated_blocks += 1;
        }
        
        // Check if we need to start a new epoch
        let block_height = previous_block.header.timestamp / self.target_block_time + 1;
        if block_height % self.epoch_length == 0 {
            self.start_new_epoch();
        }
        
        // Adjust difficulty if needed
        self.adjust_difficulty(block.header.timestamp - previous_block.header.timestamp);
        
        true
    }
    
    fn start_new_epoch(&mut self) {
        self.current_epoch += 1;
        info!("Starting new epoch: {}", self.current_epoch);
        
        // Update active validators for the new epoch
        self.update_active_validators();
    }
    
    fn adjust_difficulty(&mut self, block_time: u64) {
        // Simple difficulty adjustment algorithm
        // If blocks are coming too quickly, increase difficulty
        // If blocks are coming too slowly, decrease difficulty
        if block_time < self.target_block_time {
            self.difficulty = (self.difficulty * 110) / 100; // Increase by 10%
        } else if block_time > self.target_block_time * 2 {
            self.difficulty = (self.difficulty * 90) / 100; // Decrease by 10%
        }
        
        debug!("Adjusted difficulty to: {}", self.difficulty);
    }
    
    pub fn get_current_difficulty(&self) -> u32 {
        self.difficulty
    }
}

// Global consensus engine instance
lazy_static::lazy_static! {
    static ref CONSENSUS_ENGINE: Arc<Mutex<Option<ConsensusEngine>>> = Arc::new(Mutex::new(None));
}

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing consensus engine...");
    
    let engine = ConsensusEngine::new(
        1000,     // Minimum stake
        100,      // Epoch length (blocks)
        30,       // Target block time (seconds)
    );
    
    let mut consensus_engine = CONSENSUS_ENGINE.lock().unwrap();
    *consensus_engine = Some(engine);
    
    info!("Consensus engine initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down consensus engine...");
    
    let mut consensus_engine = CONSENSUS_ENGINE.lock().unwrap();
    *consensus_engine = None;
    
    info!("Consensus engine shutdown complete");
    Ok(())
}

pub fn get_engine() -> Arc<Mutex<Option<ConsensusEngine>>> {
    CONSENSUS_ENGINE.clone()
}