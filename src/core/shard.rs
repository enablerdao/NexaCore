use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use log::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use crate::core::block::Block;
use crate::core::transaction::Transaction;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShardInfo {
    pub shard_id: u16,
    pub name: String,
    pub validator_count: u32,
    pub transaction_count: u64,
    pub block_count: u64,
    pub creation_time: u64,
    pub last_block_time: u64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossShardTransaction {
    pub tx_hash: String,
    pub source_shard: u16,
    pub target_shard: u16,
    pub status: CrossShardStatus,
    pub creation_time: u64,
    pub completion_time: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CrossShardStatus {
    Pending,
    SourceConfirmed,
    TargetConfirmed,
    Completed,
    Failed,
}

#[derive(Debug)]
pub struct ShardingEngine {
    shards: HashMap<u16, ShardInfo>,
    node_shard_assignments: HashMap<String, u16>, // Node address -> shard_id
    cross_shard_transactions: HashMap<String, CrossShardTransaction>,
    max_shards: u16,
    min_validators_per_shard: u32,
    shard_rebalance_threshold: f64, // Load imbalance threshold to trigger rebalancing
}

impl ShardingEngine {
    pub fn new(max_shards: u16, min_validators_per_shard: u32, shard_rebalance_threshold: f64) -> Self {
        let mut engine = ShardingEngine {
            shards: HashMap::new(),
            node_shard_assignments: HashMap::new(),
            cross_shard_transactions: HashMap::new(),
            max_shards,
            min_validators_per_shard,
            shard_rebalance_threshold,
        };
        
        // Create the genesis shard (shard 0)
        engine.create_shard("Genesis".to_string());
        
        engine
    }
    
    pub fn create_shard(&mut self, name: String) -> u16 {
        let next_id = self.get_next_shard_id();
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        let shard = ShardInfo {
            shard_id: next_id,
            name,
            validator_count: 0,
            transaction_count: 0,
            block_count: 0,
            creation_time: now,
            last_block_time: now,
            is_active: true,
        };
        
        self.shards.insert(next_id, shard.clone());
        info!("Created new shard: {} (ID: {})", shard.name, shard.shard_id);
        
        next_id
    }
    
    fn get_next_shard_id(&self) -> u16 {
        let mut next_id = 0;
        while self.shards.contains_key(&next_id) && next_id < self.max_shards {
            next_id += 1;
        }
        
        if next_id >= self.max_shards {
            panic!("Maximum number of shards reached");
        }
        
        next_id
    }
    
    pub fn assign_node_to_shard(&mut self, node_address: String, shard_id: u16) -> Result<(), String> {
        if !self.shards.contains_key(&shard_id) {
            return Err(format!("Shard {} does not exist", shard_id));
        }
        
        // Update the node's shard assignment
        self.node_shard_assignments.insert(node_address.clone(), shard_id);
        
        // Update the shard's validator count
        if let Some(shard) = self.shards.get_mut(&shard_id) {
            shard.validator_count += 1;
        }
        
        debug!("Assigned node {} to shard {}", node_address, shard_id);
        Ok(())
    }
    
    pub fn get_node_shard(&self, node_address: &str) -> Option<u16> {
        self.node_shard_assignments.get(node_address).cloned()
    }
    
    pub fn get_shard_info(&self, shard_id: u16) -> Option<ShardInfo> {
        self.shards.get(&shard_id).cloned()
    }
    
    pub fn get_all_shards(&self) -> Vec<ShardInfo> {
        self.shards.values().cloned().collect()
    }
    
    pub fn determine_transaction_shard(&self, tx: &Transaction) -> u16 {
        // If the transaction already has a shard_id, use it
        if tx.shard_id != 0 {
            return tx.shard_id;
        }
        
        // For new transactions, assign based on a simple hash of the first input address
        // In a real implementation, this would use a more sophisticated algorithm
        if !tx.inputs.is_empty() {
            let input_hash = tx.inputs[0].previous_tx.clone();
            let hash_bytes = input_hash.as_bytes();
            let hash_sum: u32 = hash_bytes.iter().map(|&b| b as u32).sum();
            let shard_count = self.shards.len() as u16;
            
            if shard_count > 0 {
                return (hash_sum % shard_count as u32) as u16;
            }
        }
        
        // Default to shard 0 (genesis shard)
        0
    }
    
    pub fn register_cross_shard_transaction(
        &mut self,
        tx_hash: String,
        source_shard: u16,
        target_shard: u16,
    ) -> Result<(), String> {
        if !self.shards.contains_key(&source_shard) {
            return Err(format!("Source shard {} does not exist", source_shard));
        }
        
        if !self.shards.contains_key(&target_shard) {
            return Err(format!("Target shard {} does not exist", target_shard));
        }
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        let cross_tx = CrossShardTransaction {
            tx_hash: tx_hash.clone(),
            source_shard,
            target_shard,
            status: CrossShardStatus::Pending,
            creation_time: now,
            completion_time: None,
        };
        
        self.cross_shard_transactions.insert(tx_hash.clone(), cross_tx);
        debug!("Registered cross-shard transaction {} from shard {} to shard {}", 
               tx_hash, source_shard, target_shard);
        
        Ok(())
    }
    
    pub fn update_cross_shard_transaction_status(
        &mut self,
        tx_hash: &str,
        new_status: CrossShardStatus,
    ) -> Result<(), String> {
        if let Some(tx) = self.cross_shard_transactions.get_mut(tx_hash) {
            tx.status = new_status.clone();
            
            if new_status == CrossShardStatus::Completed || new_status == CrossShardStatus::Failed {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .expect("Time went backwards")
                    .as_secs();
                tx.completion_time = Some(now);
            }
            
            debug!("Updated cross-shard transaction {} status to {:?}", tx_hash, new_status);
            Ok(())
        } else {
            Err(format!("Cross-shard transaction {} not found", tx_hash))
        }
    }
    
    pub fn get_cross_shard_transaction(&self, tx_hash: &str) -> Option<CrossShardTransaction> {
        self.cross_shard_transactions.get(tx_hash).cloned()
    }
    
    pub fn get_pending_cross_shard_transactions(&self, shard_id: u16) -> Vec<CrossShardTransaction> {
        self.cross_shard_transactions
            .values()
            .filter(|tx| {
                (tx.source_shard == shard_id && tx.status == CrossShardStatus::Pending) ||
                (tx.target_shard == shard_id && tx.status == CrossShardStatus::SourceConfirmed)
            })
            .cloned()
            .collect()
    }
    
    pub fn update_shard_stats(&mut self, shard_id: u16, new_block: &Block) -> Result<(), String> {
        if let Some(shard) = self.shards.get_mut(&shard_id) {
            shard.block_count += 1;
            shard.transaction_count += new_block.transactions.len() as u64;
            shard.last_block_time = new_block.header.timestamp;
            
            debug!("Updated stats for shard {}: {} blocks, {} transactions", 
                   shard_id, shard.block_count, shard.transaction_count);
            Ok(())
        } else {
            Err(format!("Shard {} not found", shard_id))
        }
    }
    
    pub fn check_rebalance_needed(&self) -> bool {
        if self.shards.len() <= 1 {
            return false;
        }
        
        // Calculate average load per shard
        let total_txs: u64 = self.shards.values().map(|s| s.transaction_count).sum();
        let avg_txs = total_txs as f64 / self.shards.len() as f64;
        
        // Check if any shard exceeds the rebalance threshold
        for shard in self.shards.values() {
            let load_ratio = shard.transaction_count as f64 / avg_txs;
            if load_ratio > (1.0 + self.shard_rebalance_threshold) {
                debug!("Shard {} exceeds rebalance threshold: load ratio {:.2}", 
                       shard.shard_id, load_ratio);
                return true;
            }
        }
        
        false
    }
    
    pub fn rebalance_shards(&mut self) -> Result<(), String> {
        info!("Rebalancing shards...");
        
        // In a real implementation, this would use a sophisticated algorithm to:
        // 1. Identify overloaded shards
        // 2. Create new shards if needed
        // 3. Reassign nodes to balance the load
        // 4. Plan and execute the migration of state
        
        // For this example, we'll just create a new shard if we're below the max
        if self.shards.len() < self.max_shards as usize {
            let new_shard_id = self.create_shard(format!("Shard-{}", self.shards.len()));
            
            // Reassign some nodes to the new shard
            let overloaded_shards: Vec<u16> = self.shards
                .values()
                .filter(|s| s.validator_count > self.min_validators_per_shard)
                .map(|s| s.shard_id)
                .collect();
            
            if !overloaded_shards.is_empty() {
                // Find nodes to reassign
                let mut nodes_to_reassign: Vec<String> = Vec::new();
                for (node, &shard_id) in &self.node_shard_assignments {
                    if overloaded_shards.contains(&shard_id) {
                        nodes_to_reassign.push(node.clone());
                        if nodes_to_reassign.len() >= self.min_validators_per_shard as usize {
                            break;
                        }
                    }
                }
                
                // Reassign nodes to the new shard
                for node in nodes_to_reassign {
                    self.assign_node_to_shard(node, new_shard_id)?;
                }
                
                info!("Created new shard {} and reassigned nodes during rebalancing", new_shard_id);
            }
        } else {
            warn!("Maximum number of shards reached, cannot rebalance by creating new shards");
        }
        
        Ok(())
    }
}

// Global sharding engine instance
lazy_static::lazy_static! {
    static ref SHARDING_ENGINE: Arc<Mutex<Option<ShardingEngine>>> = Arc::new(Mutex::new(None));
}

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing sharding engine...");
    
    let engine = ShardingEngine::new(
        256,    // Maximum number of shards
        3,      // Minimum validators per shard
        0.3,    // Rebalance threshold (30% imbalance)
    );
    
    let mut sharding_engine = SHARDING_ENGINE.lock().unwrap();
    *sharding_engine = Some(engine);
    
    info!("Sharding engine initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down sharding engine...");
    
    let mut sharding_engine = SHARDING_ENGINE.lock().unwrap();
    *sharding_engine = None;
    
    info!("Sharding engine shutdown complete");
    Ok(())
}

pub fn get_engine() -> Arc<Mutex<Option<ShardingEngine>>> {
    SHARDING_ENGINE.clone()
}