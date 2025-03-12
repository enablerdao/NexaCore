//! Simple Payment Contract
//! 
//! This is a basic payment contract that allows users to deposit, withdraw, and transfer tokens.

// Export contract functions
#[no_mangle]
pub extern "C" fn init() {
    // Initialize contract state
    let owner = env::get_caller();
    storage::write("owner", &owner);
    storage::write("total_supply", &0u64.to_le_bytes());
}

#[no_mangle]
pub extern "C" fn deposit() {
    // Get caller and value
    let caller = env::get_caller();
    let value = env::get_value();
    
    // Update balance
    let current_balance = get_balance(&caller);
    let new_balance = current_balance + value;
    set_balance(&caller, new_balance);
    
    // Update total supply
    let total_supply = get_total_supply();
    set_total_supply(total_supply + value);
    
    // Log deposit event
    let mut event_data = Vec::new();
    event_data.extend_from_slice(&caller.as_bytes());
    event_data.extend_from_slice(&value.to_le_bytes());
    env::log("Deposit", &event_data);
}

#[no_mangle]
pub extern "C" fn withdraw(amount: u64) -> bool {
    // Get caller
    let caller = env::get_caller();
    
    // Check balance
    let current_balance = get_balance(&caller);
    if current_balance < amount {
        return false;
    }
    
    // Update balance
    let new_balance = current_balance - amount;
    set_balance(&caller, new_balance);
    
    // Update total supply
    let total_supply = get_total_supply();
    set_total_supply(total_supply - amount);
    
    // Transfer tokens to caller
    env::transfer(&caller, amount);
    
    // Log withdraw event
    let mut event_data = Vec::new();
    event_data.extend_from_slice(&caller.as_bytes());
    event_data.extend_from_slice(&amount.to_le_bytes());
    env::log("Withdraw", &event_data);
    
    true
}

#[no_mangle]
pub extern "C" fn transfer(to: &str, amount: u64) -> bool {
    // Get caller
    let caller = env::get_caller();
    
    // Check balance
    let current_balance = get_balance(&caller);
    if current_balance < amount {
        return false;
    }
    
    // Update sender balance
    let new_sender_balance = current_balance - amount;
    set_balance(&caller, new_sender_balance);
    
    // Update recipient balance
    let current_recipient_balance = get_balance(to);
    let new_recipient_balance = current_recipient_balance + amount;
    set_balance(to, new_recipient_balance);
    
    // Log transfer event
    let mut event_data = Vec::new();
    event_data.extend_from_slice(&caller.as_bytes());
    event_data.extend_from_slice(&to.as_bytes());
    event_data.extend_from_slice(&amount.to_le_bytes());
    env::log("Transfer", &event_data);
    
    true
}

#[no_mangle]
pub extern "C" fn balance_of(address: &str) -> u64 {
    get_balance(address)
}

#[no_mangle]
pub extern "C" fn total_supply() -> u64 {
    get_total_supply()
}

// Helper functions

fn get_balance(address: &str) -> u64 {
    let key = format!("balance:{}", address);
    let balance_bytes = storage::read(&key);
    
    if balance_bytes.is_empty() {
        0
    } else {
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&balance_bytes[0..8]);
        u64::from_le_bytes(bytes)
    }
}

fn set_balance(address: &str, balance: u64) {
    let key = format!("balance:{}", address);
    storage::write(&key, &balance.to_le_bytes());
}

fn get_total_supply() -> u64 {
    let total_supply_bytes = storage::read("total_supply");
    
    if total_supply_bytes.is_empty() {
        0
    } else {
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&total_supply_bytes[0..8]);
        u64::from_le_bytes(bytes)
    }
}

fn set_total_supply(total_supply: u64) {
    storage::write("total_supply", &total_supply.to_le_bytes());
}

// Environment module (would be provided by the VM)
mod env {
    extern "C" {
        fn get_caller(ptr: i32) -> i32;
        fn get_value() -> i64;
        fn log(topic_ptr: i32, topic_len: i32, data_ptr: i32, data_len: i32) -> i32;
        fn transfer(to_ptr: i32, to_len: i32, amount: i64) -> i32;
    }
    
    pub fn get_caller() -> String {
        let mut buffer = [0u8; 64];
        let len = unsafe { get_caller(buffer.as_mut_ptr() as i32) };
        
        if len <= 0 {
            return String::new();
        }
        
        String::from_utf8_lossy(&buffer[0..len as usize]).to_string()
    }
    
    pub fn get_value() -> u64 {
        unsafe { get_value() as u64 }
    }
    
    pub fn log(topic: &str, data: &[u8]) {
        unsafe {
            log(
                topic.as_ptr() as i32,
                topic.len() as i32,
                data.as_ptr() as i32,
                data.len() as i32,
            );
        }
    }
    
    pub fn transfer(to: &str, amount: u64) {
        unsafe {
            transfer(
                to.as_ptr() as i32,
                to.len() as i32,
                amount as i64,
            );
        }
    }
}

// Storage module (would be provided by the VM)
mod storage {
    extern "C" {
        fn storage_read(key_ptr: i32, key_len: i32) -> i32;
        fn storage_write(key_ptr: i32, key_len: i32, value_ptr: i32, value_len: i32) -> i32;
    }
    
    pub fn read(key: &str) -> Vec<u8> {
        let result = unsafe {
            storage_read(
                key.as_ptr() as i32,
                key.len() as i32,
            )
        };
        
        if result <= 0 {
            return Vec::new();
        }
        
        // In a real implementation, this would read from a return buffer
        // For this example, we'll just return a placeholder
        vec![0, 0, 0, 0, 0, 0, 0, 0]
    }
    
    pub fn write(key: &str, value: &[u8]) {
        unsafe {
            storage_write(
                key.as_ptr() as i32,
                key.len() as i32,
                value.as_ptr() as i32,
                value.len() as i32,
            );
        }
    }
}