use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::core::transaction::Transaction;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockHeader {
    pub version: u32,
    pub previous_hash: String,
    pub merkle_root: String,
    pub timestamp: u64,
    pub shard_id: u16,
    pub difficulty: u32,
    pub nonce: u64,
    pub validator: String,
    pub contribution_score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub header: BlockHeader,
    pub transactions: Vec<Transaction>,
    pub hash: String,
    pub signature: String,
}

impl Block {
    pub fn new(
        previous_hash: String,
        transactions: Vec<Transaction>,
        shard_id: u16,
        validator: String,
        contribution_score: u32,
    ) -> Self {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        let merkle_root = Self::calculate_merkle_root(&transactions);
        
        let mut header = BlockHeader {
            version: 1,
            previous_hash,
            merkle_root,
            timestamp,
            shard_id,
            difficulty: 0, // Will be set based on network conditions
            nonce: 0,      // Will be set during mining/validation
            validator,
            contribution_score,
        };
        
        let hash = Self::calculate_hash(&header);
        
        Block {
            header,
            transactions,
            hash,
            signature: String::new(), // Will be set by validator
        }
    }
    
    pub fn calculate_hash(header: &BlockHeader) -> String {
        let serialized = serde_json::to_string(header).unwrap();
        let mut hasher = Sha256::new();
        hasher.update(serialized.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }
    
    pub fn calculate_merkle_root(transactions: &[Transaction]) -> String {
        if transactions.is_empty() {
            return hex::encode([0u8; 32]);
        }
        
        let mut hashes: Vec<String> = transactions
            .iter()
            .map(|tx| tx.hash.clone())
            .collect();
        
        while hashes.len() > 1 {
            let mut new_hashes = Vec::new();
            
            for chunk in hashes.chunks(2) {
                let mut hasher = Sha256::new();
                if chunk.len() == 2 {
                    hasher.update(chunk[0].as_bytes());
                    hasher.update(chunk[1].as_bytes());
                } else {
                    hasher.update(chunk[0].as_bytes());
                    hasher.update(chunk[0].as_bytes()); // Duplicate the last hash if odd number
                }
                let result = hasher.finalize();
                new_hashes.push(hex::encode(result));
            }
            
            hashes = new_hashes;
        }
        
        hashes[0].clone()
    }
    
    pub fn sign(&mut self, private_key: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
        // In a real implementation, this would use ed25519 or similar to sign the block hash
        // For simplicity, we're just using a placeholder
        self.signature = format!("signed-{}", self.hash);
        Ok(())
    }
    
    pub fn verify_signature(&self) -> bool {
        // In a real implementation, this would verify the signature using the validator's public key
        // For simplicity, we're just using a placeholder check
        self.signature == format!("signed-{}", self.hash)
    }
    
    pub fn is_valid(&self, previous_block: &Block) -> bool {
        // Check that the previous hash matches
        if self.header.previous_hash != previous_block.hash {
            return false;
        }
        
        // Check that the timestamp is greater than the previous block
        if self.header.timestamp <= previous_block.header.timestamp {
            return false;
        }
        
        // Verify the merkle root
        let calculated_merkle_root = Self::calculate_merkle_root(&self.transactions);
        if calculated_merkle_root != self.header.merkle_root {
            return false;
        }
        
        // Verify the block hash
        let calculated_hash = Self::calculate_hash(&self.header);
        if calculated_hash != self.hash {
            return false;
        }
        
        // Verify the signature
        if !self.verify_signature() {
            return false;
        }
        
        true
    }
}