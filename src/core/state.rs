use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use log::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use crate::core::block::Block;
use crate::core::transaction::{Transaction, TransactionOutput};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub address: String,
    pub balance: u64,
    pub nonce: u64,
    pub code: Vec<u8>,          // Smart contract code (if any)
    pub storage: HashMap<String, Vec<u8>>, // Smart contract storage
    pub stake_amount: u64,      // Amount staked for validation
    pub contribution_score: u32, // Contribution score for APoC
    pub last_updated: u64,      // Timestamp of last update
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UTXO {
    pub tx_hash: String,
    pub output_index: u32,
    pub amount: u64,
    pub owner: String,
    pub is_spent: bool,
    pub created_at: u64,
    pub spent_at: Option<u64>,
}

#[derive(Debug)]
pub struct StateManager {
    // Account-based state (for smart contracts and staking)
    accounts: HashMap<String, Account>,
    
    // UTXO-based state (for regular transactions)
    utxos: HashMap<String, UTXO>, // Key: tx_hash:output_index
    
    // Block metadata
    blocks: HashMap<String, BlockMetadata>, // Key: block_hash
    
    // Chain state
    current_height: u64,
    best_block_hash: String,
    
    // Shard-specific state
    shard_id: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockMetadata {
    pub hash: String,
    pub height: u64,
    pub timestamp: u64,
    pub tx_count: usize,
    pub size: usize,
    pub validator: String,
}

impl StateManager {
    pub fn new(shard_id: u16) -> Self {
        StateManager {
            accounts: HashMap::new(),
            utxos: HashMap::new(),
            blocks: HashMap::new(),
            current_height: 0,
            best_block_hash: String::new(),
            shard_id,
        }
    }
    
    pub fn apply_block(&mut self, block: &Block) -> Result<(), String> {
        debug!("Applying block {} to state", block.hash);
        
        // Create block metadata
        let metadata = BlockMetadata {
            hash: block.hash.clone(),
            height: self.current_height + 1,
            timestamp: block.header.timestamp,
            tx_count: block.transactions.len(),
            size: serde_json::to_string(block).unwrap().len(),
            validator: block.header.validator.clone(),
        };
        
        // Apply each transaction
        for tx in &block.transactions {
            self.apply_transaction(tx)?;
        }
        
        // Update block metadata
        self.blocks.insert(block.hash.clone(), metadata);
        
        // Update chain state
        self.current_height += 1;
        self.best_block_hash = block.hash.clone();
        
        debug!("Block {} applied successfully, new height: {}", block.hash, self.current_height);
        Ok(())
    }
    
    pub fn apply_transaction(&mut self, tx: &Transaction) -> Result<(), String> {
        debug!("Applying transaction {} to state", tx.hash);
        
        // Check if transaction belongs to this shard
        if tx.shard_id != self.shard_id {
            return Err(format!("Transaction {} belongs to shard {}, not {}", 
                              tx.hash, tx.shard_id, self.shard_id));
        }
        
        // Mark inputs as spent
        for input in &tx.inputs {
            let utxo_key = format!("{}:{}", input.previous_tx, input.index);
            
            if let Some(utxo) = self.utxos.get_mut(&utxo_key) {
                if utxo.is_spent {
                    return Err(format!("UTXO {}:{} is already spent", input.previous_tx, input.index));
                }
                
                utxo.is_spent = true;
                utxo.spent_at = Some(tx.timestamp);
            } else {
                return Err(format!("UTXO {}:{} not found", input.previous_tx, input.index));
            }
        }
        
        // Create new UTXOs for outputs
        for (i, output) in tx.outputs.iter().enumerate() {
            let utxo_key = format!("{}:{}", tx.hash, i);
            
            let utxo = UTXO {
                tx_hash: tx.hash.clone(),
                output_index: i as u32,
                amount: output.amount,
                owner: output.address.clone(),
                is_spent: false,
                created_at: tx.timestamp,
                spent_at: None,
            };
            
            self.utxos.insert(utxo_key, utxo);
            
            // Update account balance
            self.update_account_balance(&output.address, output.amount, true)?;
        }
        
        // Handle special transaction types
        match tx.tx_type {
            crate::core::transaction::TransactionType::SmartContract => {
                // Deploy or call smart contract
                self.handle_smart_contract(tx)?;
            },
            crate::core::transaction::TransactionType::StakeDeposit => {
                // Handle staking
                self.handle_stake_deposit(tx)?;
            },
            crate::core::transaction::TransactionType::StakeWithdraw => {
                // Handle unstaking
                self.handle_stake_withdraw(tx)?;
            },
            crate::core::transaction::TransactionType::ContributionReport => {
                // Update contribution score
                self.handle_contribution_report(tx)?;
            },
            _ => {
                // Regular transfer transaction, already handled above
            }
        }
        
        debug!("Transaction {} applied successfully", tx.hash);
        Ok(())
    }
    
    fn update_account_balance(&mut self, address: &str, amount: u64, is_credit: bool) -> Result<(), String> {
        let account = self.accounts.entry(address.to_string())
            .or_insert_with(|| Account {
                address: address.to_string(),
                balance: 0,
                nonce: 0,
                code: Vec::new(),
                storage: HashMap::new(),
                stake_amount: 0,
                contribution_score: 0,
                last_updated: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .expect("Time went backwards")
                    .as_secs(),
            });
        
        if is_credit {
            account.balance += amount;
        } else {
            if account.balance < amount {
                return Err(format!("Insufficient balance for account {}", address));
            }
            account.balance -= amount;
        }
        
        account.last_updated = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        Ok(())
    }
    
    fn handle_smart_contract(&mut self, tx: &Transaction) -> Result<(), String> {
        // In a real implementation, this would:
        // 1. Parse the contract code from tx.data
        // 2. Validate the code
        // 3. Deploy the contract or execute the function call
        // 4. Update the state accordingly
        
        // For this example, we'll just store the contract code in the account
        if !tx.outputs.is_empty() {
            let contract_address = &tx.outputs[0].address;
            
            let account = self.accounts.entry(contract_address.to_string())
                .or_insert_with(|| Account {
                    address: contract_address.to_string(),
                    balance: 0,
                    nonce: 0,
                    code: Vec::new(),
                    storage: HashMap::new(),
                    stake_amount: 0,
                    contribution_score: 0,
                    last_updated: tx.timestamp,
                });
            
            account.code = tx.data.clone();
            account.last_updated = tx.timestamp;
            
            debug!("Deployed smart contract to address {}", contract_address);
        }
        
        Ok(())
    }
    
    fn handle_stake_deposit(&mut self, tx: &Transaction) -> Result<(), String> {
        if tx.outputs.is_empty() {
            return Err("Stake deposit transaction has no outputs".to_string());
        }
        
        let staker_address = &tx.outputs[0].address;
        let stake_amount = tx.outputs[0].amount;
        
        let account = self.accounts.entry(staker_address.to_string())
            .or_insert_with(|| Account {
                address: staker_address.to_string(),
                balance: 0,
                nonce: 0,
                code: Vec::new(),
                storage: HashMap::new(),
                stake_amount: 0,
                contribution_score: 0,
                last_updated: tx.timestamp,
            });
        
        account.stake_amount += stake_amount;
        account.last_updated = tx.timestamp;
        
        debug!("Added stake of {} for account {}", stake_amount, staker_address);
        Ok(())
    }
    
    fn handle_stake_withdraw(&mut self, tx: &Transaction) -> Result<(), String> {
        if tx.inputs.is_empty() {
            return Err("Stake withdraw transaction has no inputs".to_string());
        }
        
        // Assume the first input is from the staker
        let staker_address = tx.inputs[0].script_sig.clone(); // In a real implementation, this would be properly extracted
        let withdraw_amount = tx.inputs[0].amount;
        
        if let Some(account) = self.accounts.get_mut(&staker_address) {
            if account.stake_amount < withdraw_amount {
                return Err(format!("Insufficient stake for account {}", staker_address));
            }
            
            account.stake_amount -= withdraw_amount;
            account.last_updated = tx.timestamp;
            
            debug!("Withdrew stake of {} for account {}", withdraw_amount, staker_address);
            Ok(())
        } else {
            Err(format!("Account {} not found", staker_address))
        }
    }
    
    fn handle_contribution_report(&mut self, tx: &Transaction) -> Result<(), String> {
        // Parse contribution data from tx.data
        // In a real implementation, this would validate the contribution proof
        
        if tx.inputs.is_empty() {
            return Err("Contribution report transaction has no inputs".to_string());
        }
        
        let contributor_address = tx.inputs[0].script_sig.clone(); // In a real implementation, this would be properly extracted
        
        // Simple parsing of contribution score from data
        if tx.data.len() < 4 {
            return Err("Invalid contribution data".to_string());
        }
        
        let contribution_score = u32::from_le_bytes([
            tx.data[0], tx.data[1], tx.data[2], tx.data[3]
        ]);
        
        let account = self.accounts.entry(contributor_address.clone())
            .or_insert_with(|| Account {
                address: contributor_address.clone(),
                balance: 0,
                nonce: 0,
                code: Vec::new(),
                storage: HashMap::new(),
                stake_amount: 0,
                contribution_score: 0,
                last_updated: tx.timestamp,
            });
        
        account.contribution_score += contribution_score;
        account.last_updated = tx.timestamp;
        
        debug!("Updated contribution score for account {}: +{}", contributor_address, contribution_score);
        Ok(())
    }
    
    pub fn get_account(&self, address: &str) -> Option<Account> {
        self.accounts.get(address).cloned()
    }
    
    pub fn get_utxo(&self, tx_hash: &str, output_index: u32) -> Option<UTXO> {
        let key = format!("{}:{}", tx_hash, output_index);
        self.utxos.get(&key).cloned()
    }
    
    pub fn get_unspent_utxos_for_address(&self, address: &str) -> Vec<UTXO> {
        self.utxos.values()
            .filter(|utxo| utxo.owner == address && !utxo.is_spent)
            .cloned()
            .collect()
    }
    
    pub fn get_block_metadata(&self, block_hash: &str) -> Option<BlockMetadata> {
        self.blocks.get(block_hash).cloned()
    }
    
    pub fn get_current_height(&self) -> u64 {
        self.current_height
    }
    
    pub fn get_best_block_hash(&self) -> String {
        self.best_block_hash.clone()
    }
    
    pub fn get_shard_id(&self) -> u16 {
        self.shard_id
    }
}

// Global state manager instances (one per shard)
lazy_static::lazy_static! {
    static ref STATE_MANAGERS: Arc<RwLock<HashMap<u16, Arc<Mutex<StateManager>>>>> = 
        Arc::new(RwLock::new(HashMap::new()));
}

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing state management system...");
    
    // Initialize state manager for genesis shard (0)
    let genesis_state_manager = StateManager::new(0);
    
    let mut state_managers = STATE_MANAGERS.write().unwrap();
    state_managers.insert(0, Arc::new(Mutex::new(genesis_state_manager)));
    
    info!("State management system initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down state management system...");
    
    let mut state_managers = STATE_MANAGERS.write().unwrap();
    state_managers.clear();
    
    info!("State management system shutdown complete");
    Ok(())
}

pub fn get_state_manager(shard_id: u16) -> Option<Arc<Mutex<StateManager>>> {
    let state_managers = STATE_MANAGERS.read().unwrap();
    state_managers.get(&shard_id).cloned()
}

pub fn create_state_manager(shard_id: u16) -> Result<(), Box<dyn std::error::Error>> {
    let mut state_managers = STATE_MANAGERS.write().unwrap();
    
    if state_managers.contains_key(&shard_id) {
        return Err(format!("State manager for shard {} already exists", shard_id).into());
    }
    
    let state_manager = StateManager::new(shard_id);
    state_managers.insert(shard_id, Arc::new(Mutex::new(state_manager)));
    
    info!("Created state manager for shard {}", shard_id);
    Ok(())
}