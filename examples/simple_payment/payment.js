// Simple Payment Contract Frontend

// Initialize NexaCore client
const nexacore = new NexaCore({
  rpcUrl: 'http://localhost:8545',
  networkId: 1,
});

// Contract ABI (would be generated from the contract)
const contractABI = [
  {
    name: 'init',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'deposit',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint64' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'string' },
      { name: 'amount', type: 'uint64' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'balance_of',
    inputs: [{ name: 'address', type: 'string' }],
    outputs: [{ type: 'uint64' }],
    stateMutability: 'view'
  },
  {
    name: 'total_supply',
    inputs: [],
    outputs: [{ type: 'uint64' }],
    stateMutability: 'view'
  }
];

// Contract address (would be set after deployment)
const contractAddress = '0xcontract123456789';

// Create contract instance
const contract = nexacore.contract(contractABI, contractAddress);

// UI Elements
const connectButton = document.getElementById('connect-wallet');
const depositButton = document.getElementById('deposit');
const withdrawButton = document.getElementById('withdraw');
const transferButton = document.getElementById('transfer');
const balanceButton = document.getElementById('check-balance');
const totalSupplyButton = document.getElementById('total-supply');
const amountInput = document.getElementById('amount');
const recipientInput = document.getElementById('recipient');
const resultDiv = document.getElementById('result');

// Connect wallet
connectButton.addEventListener('click', async () => {
  try {
    const accounts = await nexacore.connect();
    resultDiv.innerHTML = `Connected: ${accounts[0]}`;
    
    // Enable buttons after connection
    depositButton.disabled = false;
    withdrawButton.disabled = false;
    transferButton.disabled = false;
    balanceButton.disabled = false;
    totalSupplyButton.disabled = false;
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// Deposit tokens
depositButton.addEventListener('click', async () => {
  try {
    const amount = BigInt(amountInput.value);
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    const tx = await contract.deposit({
      value: amount,
    });
    
    resultDiv.innerHTML = `Deposit successful! Transaction: ${tx.hash}`;
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// Withdraw tokens
withdrawButton.addEventListener('click', async () => {
  try {
    const amount = BigInt(amountInput.value);
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    const success = await contract.withdraw(amount);
    
    if (success) {
      resultDiv.innerHTML = 'Withdrawal successful!';
    } else {
      resultDiv.innerHTML = 'Withdrawal failed. Insufficient balance?';
    }
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// Transfer tokens
transferButton.addEventListener('click', async () => {
  try {
    const amount = BigInt(amountInput.value);
    const recipient = recipientInput.value;
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!recipient) {
      throw new Error('Recipient address is required');
    }
    
    const success = await contract.transfer(recipient, amount);
    
    if (success) {
      resultDiv.innerHTML = `Transfer successful! Sent ${amount} tokens to ${recipient}`;
    } else {
      resultDiv.innerHTML = 'Transfer failed. Insufficient balance?';
    }
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// Check balance
balanceButton.addEventListener('click', async () => {
  try {
    const address = recipientInput.value || (await nexacore.getAccounts())[0];
    
    const balance = await contract.balance_of(address);
    
    resultDiv.innerHTML = `Balance of ${address}: ${balance} tokens`;
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// Check total supply
totalSupplyButton.addEventListener('click', async () => {
  try {
    const totalSupply = await contract.total_supply();
    
    resultDiv.innerHTML = `Total Supply: ${totalSupply} tokens`;
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// NexaCore client mock (would be provided by the NexaCore SDK)
function NexaCore(config) {
  let accounts = [];
  
  return {
    connect: async function() {
      // Simulate wallet connection
      accounts = ['0xuser123456789'];
      return accounts;
    },
    
    getAccounts: async function() {
      return accounts;
    },
    
    contract: function(abi, address) {
      // Create contract instance with methods from ABI
      const instance = {};
      
      for (const method of abi) {
        instance[method.name] = async function(...args) {
          console.log(`Calling ${method.name} with args:`, args);
          
          // Simulate contract call
          switch (method.name) {
            case 'deposit':
              return { hash: '0xtx123456789' };
            case 'withdraw':
              return true;
            case 'transfer':
              return true;
            case 'balance_of':
              return 1000n;
            case 'total_supply':
              return 10000n;
            default:
              return null;
          }
        };
      }
      
      return instance;
    }
  };
}