use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use log::{info, warn, error, debug};
use wasmi::{
    Engine, Linker, Module, Store, Caller, Extern, Func, 
    AsContextMut, Memory, MemoryType, Limits, Value, ValType,
};
use crate::core::state::{self, StateManager};

// Smart contract execution context
pub struct ContractContext {
    pub contract_address: String,
    pub caller_address: String,
    pub value: u64,
    pub gas_limit: u64,
    pub gas_used: u64,
    pub return_data: Vec<u8>,
    pub logs: Vec<ContractLog>,
    pub shard_id: u16,
}

// Contract event log
pub struct ContractLog {
    pub address: String,
    pub topics: Vec<String>,
    pub data: Vec<u8>,
}

// WebAssembly VM for executing smart contracts
pub struct WasmVM {
    engine: Engine,
    memory_cache: HashMap<String, Memory>,
    module_cache: HashMap<String, Module>,
}

impl WasmVM {
    pub fn new() -> Self {
        WasmVM {
            engine: Engine::default(),
            memory_cache: HashMap::new(),
            module_cache: HashMap::new(),
        }
    }
    
    pub fn execute_contract(
        &mut self,
        contract_code: &[u8],
        function_name: &str,
        args: &[Value],
        context: &mut ContractContext,
    ) -> Result<Vec<Value>, String> {
        debug!("Executing contract {} function {}", context.contract_address, function_name);
        
        // Get the state manager for the contract's shard
        let state_manager = match state::get_state_manager(context.shard_id) {
            Some(manager) => manager,
            None => return Err(format!("State manager for shard {} not found", context.shard_id)),
        };
        
        // Create a module from the contract code
        let module = match self.get_or_create_module(&context.contract_address, contract_code) {
            Ok(module) => module,
            Err(e) => return Err(format!("Failed to create module: {}", e)),
        };
        
        // Create a store
        let mut store = Store::new(&self.engine, context);
        
        // Create a linker with host functions
        let mut linker = Linker::new(&self.engine);
        
        // Add host functions to the linker
        self.register_host_functions(&mut linker, &state_manager)?;
        
        // Instantiate the module
        let instance = match linker.instantiate(&mut store, &module) {
            Ok(instance) => instance.start(&mut store),
            Err(e) => return Err(format!("Failed to instantiate module: {}", e)),
        };
        
        // Get the exported function
        let func = match instance {
            Ok(instance) => {
                match instance.get_export(&store, function_name) {
                    Some(Extern::Func(func)) => func,
                    Some(_) => return Err(format!("Export {} is not a function", function_name)),
                    None => return Err(format!("Function {} not found in contract", function_name)),
                }
            },
            Err(e) => return Err(format!("Failed to start instance: {}", e)),
        };
        
        // Call the function
        match func.call(&mut store, args, &mut []) {
            Ok(results) => {
                debug!("Contract execution successful");
                Ok(results.to_vec())
            },
            Err(e) => Err(format!("Function call failed: {}", e)),
        }
    }
    
    fn get_or_create_module(&mut self, contract_address: &str, code: &[u8]) -> Result<Module, String> {
        if let Some(module) = self.module_cache.get(contract_address) {
            return Ok(module.clone());
        }
        
        // Compile the module
        let module = match Module::new(&self.engine, code) {
            Ok(module) => module,
            Err(e) => return Err(format!("Failed to compile module: {}", e)),
        };
        
        // Cache the module
        self.module_cache.insert(contract_address.to_string(), module.clone());
        
        Ok(module)
    }
    
    fn register_host_functions(&self, linker: &mut Linker<ContractContext>, state_manager: &Arc<Mutex<StateManager>>) -> Result<(), String> {
        // Register memory
        let memory_ty = MemoryType::new(Limits::new(1, Some(100))).unwrap();
        linker.define("env", "memory", Memory::new(&self.engine, memory_ty).unwrap())
            .map_err(|e| format!("Failed to define memory: {}", e))?;
        
        // Storage functions
        linker.func_wrap("env", "storage_read", move |mut caller: Caller<'_, ContractContext>, key_ptr: i32, key_len: i32| -> i32 {
            let memory = match caller.get_export("memory") {
                Some(Extern::Memory(mem)) => mem,
                _ => return -1,
            };
            
            // Read key from memory
            let mut key_bytes = vec![0u8; key_len as usize];
            if memory.read(&caller, key_ptr as usize, &mut key_bytes).is_err() {
                return -1;
            }
            
            let key = match String::from_utf8(key_bytes) {
                Ok(k) => k,
                Err(_) => return -1,
            };
            
            // Get contract address from context
            let contract_address = caller.data().contract_address.clone();
            
            // Get account from state
            let state_manager_lock = match state_manager.lock() {
                Ok(lock) => lock,
                Err(_) => return -1,
            };
            
            let account = match state_manager_lock.get_account(&contract_address) {
                Some(acc) => acc,
                None => return -1,
            };
            
            // Get value from storage
            let value = match account.storage.get(&key) {
                Some(val) => val.clone(),
                None => return 0,
            };
            
            // Write value to return data
            caller.data_mut().return_data = value;
            
            1
        }).map_err(|e| format!("Failed to define storage_read: {}", e))?;
        
        linker.func_wrap("env", "storage_write", move |mut caller: Caller<'_, ContractContext>, key_ptr: i32, key_len: i32, value_ptr: i32, value_len: i32| -> i32 {
            let memory = match caller.get_export("memory") {
                Some(Extern::Memory(mem)) => mem,
                _ => return -1,
            };
            
            // Read key from memory
            let mut key_bytes = vec![0u8; key_len as usize];
            if memory.read(&caller, key_ptr as usize, &mut key_bytes).is_err() {
                return -1;
            }
            
            let key = match String::from_utf8(key_bytes) {
                Ok(k) => k,
                Err(_) => return -1,
            };
            
            // Read value from memory
            let mut value_bytes = vec![0u8; value_len as usize];
            if memory.read(&caller, value_ptr as usize, &mut value_bytes).is_err() {
                return -1;
            }
            
            // Get contract address from context
            let contract_address = caller.data().contract_address.clone();
            
            // Update gas used
            caller.data_mut().gas_used += (key_len + value_len) as u64 * 10; // 10 gas per byte
            
            // Check gas limit
            if caller.data().gas_used > caller.data().gas_limit {
                return -2; // Out of gas
            }
            
            // In a real implementation, this would update the contract's storage in the state
            
            1
        }).map_err(|e| format!("Failed to define storage_write: {}", e))?;
        
        // Blockchain functions
        linker.func_wrap("env", "get_caller", move |mut caller: Caller<'_, ContractContext>, ptr: i32| -> i32 {
            let memory = match caller.get_export("memory") {
                Some(Extern::Memory(mem)) => mem,
                _ => return -1,
            };
            
            let caller_address = caller.data().caller_address.clone();
            
            // Write caller address to memory
            if memory.write(&caller, ptr as usize, caller_address.as_bytes()).is_err() {
                return -1;
            }
            
            caller_address.len() as i32
        }).map_err(|e| format!("Failed to define get_caller: {}", e))?;
        
        linker.func_wrap("env", "get_value", move |caller: Caller<'_, ContractContext>| -> i64 {
            caller.data().value as i64
        }).map_err(|e| format!("Failed to define get_value: {}", e))?;
        
        // Logging functions
        linker.func_wrap("env", "log", move |mut caller: Caller<'_, ContractContext>, topic_ptr: i32, topic_len: i32, data_ptr: i32, data_len: i32| -> i32 {
            let memory = match caller.get_export("memory") {
                Some(Extern::Memory(mem)) => mem,
                _ => return -1,
            };
            
            // Read topic from memory
            let mut topic_bytes = vec![0u8; topic_len as usize];
            if memory.read(&caller, topic_ptr as usize, &mut topic_bytes).is_err() {
                return -1;
            }
            
            let topic = match String::from_utf8(topic_bytes) {
                Ok(t) => t,
                Err(_) => return -1,
            };
            
            // Read data from memory
            let mut data_bytes = vec![0u8; data_len as usize];
            if memory.read(&caller, data_ptr as usize, &mut data_bytes).is_err() {
                return -1;
            }
            
            // Create log entry
            let log = ContractLog {
                address: caller.data().contract_address.clone(),
                topics: vec![topic],
                data: data_bytes,
            };
            
            // Add to logs
            caller.data_mut().logs.push(log);
            
            // Update gas used
            caller.data_mut().gas_used += (topic_len + data_len) as u64 * 5; // 5 gas per byte
            
            // Check gas limit
            if caller.data().gas_used > caller.data().gas_limit {
                return -2; // Out of gas
            }
            
            1
        }).map_err(|e| format!("Failed to define log: {}", e))?;
        
        Ok(())
    }
}

// Global VM instance
lazy_static::lazy_static! {
    static ref WASM_VM: Arc<Mutex<Option<WasmVM>>> = Arc::new(Mutex::new(None));
}

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing WebAssembly VM...");
    
    let vm = WasmVM::new();
    
    let mut wasm_vm = WASM_VM.lock().unwrap();
    *wasm_vm = Some(vm);
    
    info!("WebAssembly VM initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down WebAssembly VM...");
    
    let mut wasm_vm = WASM_VM.lock().unwrap();
    *wasm_vm = None;
    
    info!("WebAssembly VM shutdown complete");
    Ok(())
}

pub fn get_vm() -> Arc<Mutex<Option<WasmVM>>> {
    WASM_VM.clone()
}

// Helper function to execute a contract
pub fn execute_contract(
    contract_address: &str,
    contract_code: &[u8],
    function_name: &str,
    args: &[Value],
    caller_address: &str,
    value: u64,
    gas_limit: u64,
    shard_id: u16,
) -> Result<(Vec<Value>, Vec<u8>, Vec<ContractLog>, u64), String> {
    let mut context = ContractContext {
        contract_address: contract_address.to_string(),
        caller_address: caller_address.to_string(),
        value,
        gas_limit,
        gas_used: 0,
        return_data: Vec::new(),
        logs: Vec::new(),
        shard_id,
    };
    
    let vm_arc = get_vm();
    let mut vm_lock = vm_arc.lock().unwrap();
    
    if let Some(vm) = vm_lock.as_mut() {
        let result = vm.execute_contract(contract_code, function_name, args, &mut context)?;
        Ok((result, context.return_data, context.logs, context.gas_used))
    } else {
        Err("WebAssembly VM not initialized".to_string())
    }
}