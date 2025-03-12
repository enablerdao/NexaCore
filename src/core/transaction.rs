use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionType {
    Transfer,
    SmartContract,
    ShardCrossing,
    StakeDeposit,
    StakeWithdraw,
    ContributionReport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInput {
    pub previous_tx: String,     // Hash of the previous transaction
    pub index: u32,              // Index in the previous transaction's outputs
    pub script_sig: String,      // Signature script (proves ownership)
    pub amount: u64,             // Amount of tokens
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionOutput {
    pub address: String,         // Recipient address
    pub amount: u64,             // Amount of tokens
    pub script_pubkey: String,   // Public key script (defines spending conditions)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub version: u32,
    pub tx_type: TransactionType,
    pub inputs: Vec<TransactionInput>,
    pub outputs: Vec<TransactionOutput>,
    pub timestamp: u64,
    pub lock_time: u64,          // Block height or timestamp when tx can be included
    pub shard_id: u16,           // Shard where this transaction belongs
    pub data: Vec<u8>,           // Additional data (e.g., for smart contracts)
    pub hash: String,            // Transaction hash
    pub signatures: Vec<String>, // Signatures from all required parties
    pub privacy_proof: Option<String>, // zk-SNARK proof for private transactions
}

impl Transaction {
    pub fn new(
        tx_type: TransactionType,
        inputs: Vec<TransactionInput>,
        outputs: Vec<TransactionOutput>,
        shard_id: u16,
        data: Vec<u8>,
        lock_time: u64,
    ) -> Self {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        let mut tx = Transaction {
            version: 1,
            tx_type,
            inputs,
            outputs,
            timestamp,
            lock_time,
            shard_id,
            data,
            hash: String::new(), // Will be calculated
            signatures: Vec::new(),
            privacy_proof: None,
        };
        
        tx.hash = tx.calculate_hash();
        tx
    }
    
    pub fn calculate_hash(&self) -> String {
        // Create a copy without the hash and signatures for hashing
        let hash_tx = Transaction {
            version: self.version,
            tx_type: self.tx_type.clone(),
            inputs: self.inputs.clone(),
            outputs: self.outputs.clone(),
            timestamp: self.timestamp,
            lock_time: self.lock_time,
            shard_id: self.shard_id,
            data: self.data.clone(),
            hash: String::new(),
            signatures: Vec::new(),
            privacy_proof: self.privacy_proof.clone(),
        };
        
        let serialized = serde_json::to_string(&hash_tx).unwrap();
        let mut hasher = Sha256::new();
        hasher.update(serialized.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }
    
    pub fn sign(&mut self, private_keys: &[&[u8]]) -> Result<(), Box<dyn std::error::Error>> {
        // Clear existing signatures
        self.signatures.clear();
        
        // In a real implementation, this would use ed25519 or similar to sign the transaction hash
        // For simplicity, we're just using placeholders
        for (i, _key) in private_keys.iter().enumerate() {
            self.signatures.push(format!("sig-{}-{}", i, self.hash));
        }
        
        Ok(())
    }
    
    pub fn verify_signatures(&self, public_keys: &[&[u8]]) -> bool {
        // In a real implementation, this would verify each signature using the corresponding public key
        // For simplicity, we're just using placeholder checks
        if self.signatures.len() != public_keys.len() {
            return false;
        }
        
        for (i, _) in self.signatures.iter().enumerate() {
            if self.signatures[i] != format!("sig-{}-{}", i, self.hash) {
                return false;
            }
        }
        
        true
    }
    
    pub fn add_privacy_proof(&mut self, proof: String) {
        self.privacy_proof = Some(proof);
    }
    
    pub fn verify_privacy_proof(&self) -> bool {
        // In a real implementation, this would verify the zk-SNARK proof
        // For simplicity, we're just checking if it exists
        self.privacy_proof.is_some()
    }
    
    pub fn is_valid(&self) -> bool {
        // Check that the hash is correct
        if self.hash != self.calculate_hash() {
            return false;
        }
        
        // Check that there are inputs and outputs
        if self.inputs.is_empty() || self.outputs.is_empty() {
            return false;
        }
        
        // Check that the total output amount doesn't exceed the total input amount
        let total_input: u64 = self.inputs.iter().map(|input| input.amount).sum();
        let total_output: u64 = self.outputs.iter().map(|output| output.amount).sum();
        
        if total_output > total_input {
            return false;
        }
        
        // For private transactions, verify the privacy proof
        if matches!(self.tx_type, TransactionType::Transfer) && self.privacy_proof.is_some() {
            if !self.verify_privacy_proof() {
                return false;
            }
        }
        
        // Additional validation would be performed in a real implementation
        
        true
    }
}