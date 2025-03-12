use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use log::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use ed25519_dalek::{Keypair, PublicKey, SecretKey, Signer, Verifier};
use rand::rngs::OsRng;
use sha2::{Sha256, Digest};

// Wallet management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletInfo {
    pub name: String,
    pub address: String,
    pub public_key: String,
    pub encrypted_private_key: String,
    pub created_at: u64,
    pub last_used: u64,
}

pub struct WalletManager {
    wallets: HashMap<String, WalletInfo>, // address -> wallet info
    active_wallet: Option<String>,        // currently active wallet address
    encryption_key: Option<[u8; 32]>,     // encryption key for private keys
}

impl WalletManager {
    pub fn new() -> Self {
        WalletManager {
            wallets: HashMap::new(),
            active_wallet: None,
            encryption_key: None,
        }
    }
    
    pub fn set_encryption_key(&mut self, password: &str) -> Result<(), String> {
        // Derive encryption key from password
        let mut hasher = Sha256::new();
        hasher.update(password.as_bytes());
        let result = hasher.finalize();
        
        let mut key = [0u8; 32];
        key.copy_from_slice(&result);
        
        self.encryption_key = Some(key);
        
        debug!("Encryption key set");
        Ok(())
    }
    
    pub fn create_wallet(&mut self, name: &str) -> Result<String, String> {
        if self.encryption_key.is_none() {
            return Err("Encryption key not set".to_string());
        }
        
        // Generate a new keypair
        let mut csprng = OsRng;
        let keypair = Keypair::generate(&mut csprng);
        
        // Generate address from public key
        let address = self.public_key_to_address(&keypair.public);
        
        // Check if wallet with this address already exists
        if self.wallets.contains_key(&address) {
            return Err(format!("Wallet with address {} already exists", address));
        }
        
        // Encrypt private key
        let encrypted_private_key = self.encrypt_private_key(&keypair.secret, self.encryption_key.unwrap())?;
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        // Create wallet info
        let wallet_info = WalletInfo {
            name: name.to_string(),
            address: address.clone(),
            public_key: hex::encode(keypair.public.as_bytes()),
            encrypted_private_key,
            created_at: now,
            last_used: now,
        };
        
        // Add to wallets
        self.wallets.insert(address.clone(), wallet_info);
        
        // Set as active wallet if none is active
        if self.active_wallet.is_none() {
            self.active_wallet = Some(address.clone());
        }
        
        info!("Created new wallet: {} ({})", name, address);
        
        Ok(address)
    }
    
    pub fn import_wallet(&mut self, name: &str, private_key: &[u8]) -> Result<String, String> {
        if self.encryption_key.is_none() {
            return Err("Encryption key not set".to_string());
        }
        
        // Create keypair from private key
        let secret = match SecretKey::from_bytes(private_key) {
            Ok(secret) => secret,
            Err(e) => return Err(format!("Invalid private key: {}", e)),
        };
        
        let public = match PublicKey::from(&secret) {
            Ok(public) => public,
            Err(e) => return Err(format!("Invalid private key: {}", e)),
        };
        
        // Generate address from public key
        let address = self.public_key_to_address(&public);
        
        // Check if wallet with this address already exists
        if self.wallets.contains_key(&address) {
            return Err(format!("Wallet with address {} already exists", address));
        }
        
        // Encrypt private key
        let encrypted_private_key = self.encrypt_private_key(&secret, self.encryption_key.unwrap())?;
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        // Create wallet info
        let wallet_info = WalletInfo {
            name: name.to_string(),
            address: address.clone(),
            public_key: hex::encode(public.as_bytes()),
            encrypted_private_key,
            created_at: now,
            last_used: now,
        };
        
        // Add to wallets
        self.wallets.insert(address.clone(), wallet_info);
        
        // Set as active wallet if none is active
        if self.active_wallet.is_none() {
            self.active_wallet = Some(address.clone());
        }
        
        info!("Imported wallet: {} ({})", name, address);
        
        Ok(address)
    }
    
    pub fn set_active_wallet(&mut self, address: &str) -> Result<(), String> {
        if !self.wallets.contains_key(address) {
            return Err(format!("Wallet with address {} not found", address));
        }
        
        self.active_wallet = Some(address.to_string());
        
        // Update last used timestamp
        if let Some(wallet) = self.wallets.get_mut(address) {
            wallet.last_used = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs();
        }
        
        debug!("Set active wallet: {}", address);
        
        Ok(())
    }
    
    pub fn get_active_wallet(&self) -> Option<WalletInfo> {
        if let Some(address) = &self.active_wallet {
            self.wallets.get(address).cloned()
        } else {
            None
        }
    }
    
    pub fn get_wallet(&self, address: &str) -> Option<WalletInfo> {
        self.wallets.get(address).cloned()
    }
    
    pub fn get_all_wallets(&self) -> Vec<WalletInfo> {
        self.wallets.values().cloned().collect()
    }
    
    pub fn sign_message(&self, message: &[u8]) -> Result<Vec<u8>, String> {
        let active_wallet = match self.get_active_wallet() {
            Some(wallet) => wallet,
            None => return Err("No active wallet".to_string()),
        };
        
        if self.encryption_key.is_none() {
            return Err("Encryption key not set".to_string());
        }
        
        // Decrypt private key
        let private_key = self.decrypt_private_key(&active_wallet.encrypted_private_key, self.encryption_key.unwrap())?;
        
        // Create keypair
        let secret = match SecretKey::from_bytes(&private_key) {
            Ok(secret) => secret,
            Err(e) => return Err(format!("Invalid private key: {}", e)),
        };
        
        let public_bytes = match hex::decode(&active_wallet.public_key) {
            Ok(bytes) => bytes,
            Err(e) => return Err(format!("Invalid public key: {}", e)),
        };
        
        let public = match PublicKey::from_bytes(&public_bytes) {
            Ok(public) => public,
            Err(e) => return Err(format!("Invalid public key: {}", e)),
        };
        
        let keypair = Keypair {
            secret,
            public,
        };
        
        // Sign message
        let signature = keypair.sign(message);
        
        Ok(signature.to_bytes().to_vec())
    }
    
    pub fn verify_signature(&self, address: &str, message: &[u8], signature: &[u8]) -> Result<bool, String> {
        let wallet = match self.get_wallet(address) {
            Some(wallet) => wallet,
            None => return Err(format!("Wallet with address {} not found", address)),
        };
        
        let public_bytes = match hex::decode(&wallet.public_key) {
            Ok(bytes) => bytes,
            Err(e) => return Err(format!("Invalid public key: {}", e)),
        };
        
        let public = match PublicKey::from_bytes(&public_bytes) {
            Ok(public) => public,
            Err(e) => return Err(format!("Invalid public key: {}", e)),
        };
        
        let sig = match ed25519_dalek::Signature::from_bytes(signature) {
            Ok(sig) => sig,
            Err(e) => return Err(format!("Invalid signature: {}", e)),
        };
        
        // Verify signature
        match public.verify(message, &sig) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }
    
    fn public_key_to_address(&self, public_key: &PublicKey) -> String {
        // Generate address from public key
        // In a real implementation, this would use a more sophisticated algorithm
        // For this example, we'll just hash the public key
        
        let mut hasher = Sha256::new();
        hasher.update(public_key.as_bytes());
        let result = hasher.finalize();
        
        format!("0x{}", hex::encode(&result[0..20]))
    }
    
    fn encrypt_private_key(&self, private_key: &SecretKey, encryption_key: [u8; 32]) -> Result<String, String> {
        // In a real implementation, this would use proper encryption
        // For this example, we'll just XOR the private key with the encryption key
        
        let mut encrypted = [0u8; 32];
        for i in 0..32 {
            encrypted[i] = private_key.as_bytes()[i] ^ encryption_key[i];
        }
        
        Ok(hex::encode(encrypted))
    }
    
    fn decrypt_private_key(&self, encrypted_private_key: &str, encryption_key: [u8; 32]) -> Result<Vec<u8>, String> {
        // In a real implementation, this would use proper decryption
        // For this example, we'll just XOR the encrypted key with the encryption key
        
        let encrypted = match hex::decode(encrypted_private_key) {
            Ok(bytes) => bytes,
            Err(e) => return Err(format!("Invalid encrypted private key: {}", e)),
        };
        
        if encrypted.len() != 32 {
            return Err("Invalid encrypted private key length".to_string());
        }
        
        let mut decrypted = vec![0u8; 32];
        for i in 0..32 {
            decrypted[i] = encrypted[i] ^ encryption_key[i];
        }
        
        Ok(decrypted)
    }
}

// Global wallet manager instance
lazy_static::lazy_static! {
    static ref WALLET_MANAGER: Arc<Mutex<Option<WalletManager>>> = Arc::new(Mutex::new(None));
}

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing wallet manager...");
    
    let wallet_manager = WalletManager::new();
    
    let mut manager = WALLET_MANAGER.lock().unwrap();
    *manager = Some(wallet_manager);
    
    info!("Wallet manager initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down wallet manager...");
    
    let mut manager = WALLET_MANAGER.lock().unwrap();
    *manager = None;
    
    info!("Wallet manager shutdown complete");
    Ok(())
}

pub fn get_manager() -> Arc<Mutex<Option<WalletManager>>> {
    WALLET_MANAGER.clone()
}