//! Voting Contract
//! 
//! This contract implements a simple voting system with the following features:
//! - Create proposals
//! - Vote on proposals
//! - Check voting results
//! - Weight votes based on contribution score

// Export contract functions
#[no_mangle]
pub extern "C" fn init() {
    // Initialize contract state
    let owner = env::get_caller();
    storage::write("owner", &owner);
    storage::write("proposal_count", &0u32.to_le_bytes());
}

#[no_mangle]
pub extern "C" fn create_proposal(title: &str, description: &str, options: &[&str], duration: u64) -> u32 {
    // Only owner can create proposals
    let caller = env::get_caller();
    let owner = storage::read("owner");
    
    if caller != String::from_utf8_lossy(&owner).to_string() {
        return 0;
    }
    
    // Get current proposal count
    let proposal_count_bytes = storage::read("proposal_count");
    let mut proposal_count_bytes_array = [0u8; 4];
    proposal_count_bytes_array.copy_from_slice(&proposal_count_bytes[0..4]);
    let proposal_count = u32::from_le_bytes(proposal_count_bytes_array);
    
    // Create new proposal ID
    let proposal_id = proposal_count + 1;
    
    // Get current timestamp
    let now = env::get_timestamp();
    let end_time = now + duration;
    
    // Store proposal data
    let proposal_key = format!("proposal:{}", proposal_id);
    storage::write(&format!("{}:title", proposal_key), title.as_bytes());
    storage::write(&format!("{}:description", proposal_key), description.as_bytes());
    storage::write(&format!("{}:created_at", proposal_key), &now.to_le_bytes());
    storage::write(&format!("{}:end_time", proposal_key), &end_time.to_le_bytes());
    storage::write(&format!("{}:status", proposal_key), "active".as_bytes());
    
    // Store options
    storage::write(&format!("{}:option_count", proposal_key), &(options.len() as u32).to_le_bytes());
    
    for (i, option) in options.iter().enumerate() {
        storage::write(&format!("{}:option:{}:text", proposal_key, i), option.as_bytes());
        storage::write(&format!("{}:option:{}:votes", proposal_key, i), &0u64.to_le_bytes());
    }
    
    // Update proposal count
    storage::write("proposal_count", &proposal_id.to_le_bytes());
    
    // Log proposal creation event
    let mut event_data = Vec::new();
    event_data.extend_from_slice(&proposal_id.to_le_bytes());
    event_data.extend_from_slice(title.as_bytes());
    env::log("ProposalCreated", &event_data);
    
    proposal_id
}

#[no_mangle]
pub extern "C" fn vote(proposal_id: u32, option_index: u32) -> bool {
    // Get caller
    let caller = env::get_caller();
    
    // Check if proposal exists
    let proposal_key = format!("proposal:{}", proposal_id);
    let status = storage::read(&format!("{}:status", proposal_key));
    
    if status != b"active" {
        return false;
    }
    
    // Check if voting period is still active
    let end_time_bytes = storage::read(&format!("{}:end_time", proposal_key));
    let mut end_time_bytes_array = [0u8; 8];
    end_time_bytes_array.copy_from_slice(&end_time_bytes[0..8]);
    let end_time = u64::from_le_bytes(end_time_bytes_array);
    
    let now = env::get_timestamp();
    if now > end_time {
        // Update proposal status to "ended"
        storage::write(&format!("{}:status", proposal_key), "ended".as_bytes());
        return false;
    }
    
    // Check if option index is valid
    let option_count_bytes = storage::read(&format!("{}:option_count", proposal_key));
    let mut option_count_bytes_array = [0u8; 4];
    option_count_bytes_array.copy_from_slice(&option_count_bytes[0..4]);
    let option_count = u32::from_le_bytes(option_count_bytes_array);
    
    if option_index >= option_count {
        return false;
    }
    
    // Check if user has already voted
    let voter_key = format!("{}:voter:{}", proposal_key, caller);
    let has_voted = storage::read(&voter_key).len() > 0;
    
    if has_voted {
        return false;
    }
    
    // Get user's contribution score for vote weight
    let contribution_score = get_contribution_score(&caller);
    let vote_weight = if contribution_score > 0 {
        contribution_score
    } else {
        1 // Minimum weight is 1
    };
    
    // Update vote count for the selected option
    let option_votes_key = format!("{}:option:{}:votes", proposal_key, option_index);
    let option_votes_bytes = storage::read(&option_votes_key);
    let mut option_votes_bytes_array = [0u8; 8];
    option_votes_bytes_array.copy_from_slice(&option_votes_bytes[0..8]);
    let option_votes = u64::from_le_bytes(option_votes_bytes_array);
    
    let new_votes = option_votes + vote_weight as u64;
    storage::write(&option_votes_key, &new_votes.to_le_bytes());
    
    // Mark user as having voted
    storage::write(&voter_key, &option_index.to_le_bytes());
    
    // Log vote event
    let mut event_data = Vec::new();
    event_data.extend_from_slice(&proposal_id.to_le_bytes());
    event_data.extend_from_slice(&option_index.to_le_bytes());
    event_data.extend_from_slice(caller.as_bytes());
    event_data.extend_from_slice(&vote_weight.to_le_bytes());
    env::log("Vote", &event_data);
    
    true
}

#[no_mangle]
pub extern "C" fn get_proposal(proposal_id: u32) -> String {
    let proposal_key = format!("proposal:{}", proposal_id);
    
    // Check if proposal exists
    let title_bytes = storage::read(&format!("{}:title", proposal_key));
    if title_bytes.is_empty() {
        return String::new();
    }
    
    let title = String::from_utf8_lossy(&title_bytes).to_string();
    let description = String::from_utf8_lossy(&storage::read(&format!("{}:description", proposal_key))).to_string();
    let status = String::from_utf8_lossy(&storage::read(&format!("{}:status", proposal_key))).to_string();
    
    let created_at_bytes = storage::read(&format!("{}:created_at", proposal_key));
    let mut created_at_bytes_array = [0u8; 8];
    created_at_bytes_array.copy_from_slice(&created_at_bytes[0..8]);
    let created_at = u64::from_le_bytes(created_at_bytes_array);
    
    let end_time_bytes = storage::read(&format!("{}:end_time", proposal_key));
    let mut end_time_bytes_array = [0u8; 8];
    end_time_bytes_array.copy_from_slice(&end_time_bytes[0..8]);
    let end_time = u64::from_le_bytes(end_time_bytes_array);
    
    let option_count_bytes = storage::read(&format!("{}:option_count", proposal_key));
    let mut option_count_bytes_array = [0u8; 4];
    option_count_bytes_array.copy_from_slice(&option_count_bytes[0..4]);
    let option_count = u32::from_le_bytes(option_count_bytes_array);
    
    let mut options = Vec::new();
    for i in 0..option_count {
        let option_text = String::from_utf8_lossy(&storage::read(&format!("{}:option:{}:text", proposal_key, i))).to_string();
        
        let option_votes_bytes = storage::read(&format!("{}:option:{}:votes", proposal_key, i));
        let mut option_votes_bytes_array = [0u8; 8];
        option_votes_bytes_array.copy_from_slice(&option_votes_bytes[0..8]);
        let option_votes = u64::from_le_bytes(option_votes_bytes_array);
        
        options.push(format!("{{\"text\":\"{}\",\"votes\":{}}}", option_text, option_votes));
    }
    
    format!(
        "{{\"id\":{},\"title\":\"{}\",\"description\":\"{}\",\"status\":\"{}\",\"created_at\":{},\"end_time\":{},\"options\":[{}]}}",
        proposal_id,
        title,
        description,
        status,
        created_at,
        end_time,
        options.join(",")
    )
}

#[no_mangle]
pub extern "C" fn get_proposal_count() -> u32 {
    let proposal_count_bytes = storage::read("proposal_count");
    
    if proposal_count_bytes.is_empty() {
        return 0;
    }
    
    let mut proposal_count_bytes_array = [0u8; 4];
    proposal_count_bytes_array.copy_from_slice(&proposal_count_bytes[0..4]);
    u32::from_le_bytes(proposal_count_bytes_array)
}

#[no_mangle]
pub extern "C" fn has_voted(proposal_id: u32, voter: &str) -> bool {
    let proposal_key = format!("proposal:{}", proposal_id);
    let voter_key = format!("{}:voter:{}", proposal_key, voter);
    
    storage::read(&voter_key).len() > 0
}

#[no_mangle]
pub extern "C" fn end_proposal(proposal_id: u32) -> bool {
    // Only owner can end proposals early
    let caller = env::get_caller();
    let owner = storage::read("owner");
    
    if caller != String::from_utf8_lossy(&owner).to_string() {
        return false;
    }
    
    let proposal_key = format!("proposal:{}", proposal_id);
    let status = storage::read(&format!("{}:status", proposal_key));
    
    if status != b"active" {
        return false;
    }
    
    // Update proposal status to "ended"
    storage::write(&format!("{}:status", proposal_key), "ended".as_bytes());
    
    // Log proposal ended event
    let mut event_data = Vec::new();
    event_data.extend_from_slice(&proposal_id.to_le_bytes());
    env::log("ProposalEnded", &event_data);
    
    true
}

// Helper functions

fn get_contribution_score(address: &str) -> u32 {
    // In a real implementation, this would query the user's contribution score from the blockchain
    // For this example, we'll just return a placeholder value
    
    // Use a hash of the address to generate a pseudo-random score between 1 and 100
    let mut score = 0u32;
    for (i, byte) in address.bytes().enumerate() {
        score = score.wrapping_add((byte as u32) * (i as u32 + 1));
    }
    
    (score % 100) + 1
}

// Environment module (would be provided by the VM)
mod env {
    extern "C" {
        fn get_caller(ptr: i32) -> i32;
        fn get_timestamp() -> i64;
        fn log(topic_ptr: i32, topic_len: i32, data_ptr: i32, data_len: i32) -> i32;
    }
    
    pub fn get_caller() -> String {
        let mut buffer = [0u8; 64];
        let len = unsafe { get_caller(buffer.as_mut_ptr() as i32) };
        
        if len <= 0 {
            return String::new();
        }
        
        String::from_utf8_lossy(&buffer[0..len as usize]).to_string()
    }
    
    pub fn get_timestamp() -> u64 {
        unsafe { get_timestamp() as u64 }
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