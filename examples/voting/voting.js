// Voting Contract Frontend

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
    name: 'create_proposal',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'options', type: 'string[]' },
      { name: 'duration', type: 'uint64' }
    ],
    outputs: [{ type: 'uint32' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'vote',
    inputs: [
      { name: 'proposal_id', type: 'uint32' },
      { name: 'option_index', type: 'uint32' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'get_proposal',
    inputs: [{ name: 'proposal_id', type: 'uint32' }],
    outputs: [{ type: 'string' }],
    stateMutability: 'view'
  },
  {
    name: 'get_proposal_count',
    inputs: [],
    outputs: [{ type: 'uint32' }],
    stateMutability: 'view'
  },
  {
    name: 'has_voted',
    inputs: [
      { name: 'proposal_id', type: 'uint32' },
      { name: 'voter', type: 'string' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view'
  },
  {
    name: 'end_proposal',
    inputs: [{ name: 'proposal_id', type: 'uint32' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  }
];

// Contract address (would be set after deployment)
const contractAddress = '0xcontract987654321';

// Create contract instance
const contract = nexacore.contract(contractABI, contractAddress);

// UI Elements
const connectButton = document.getElementById('connect-wallet');
const proposalForm = document.getElementById('proposal-form');
const proposalTitle = document.getElementById('proposal-title');
const proposalDescription = document.getElementById('proposal-description');
const proposalOptions = document.getElementById('proposal-options');
const proposalDuration = document.getElementById('proposal-duration');
const addOptionButton = document.getElementById('add-option');
const proposalsList = document.getElementById('proposals-list');
const proposalDetails = document.getElementById('proposal-details');
const voteForm = document.getElementById('vote-form');
const resultDiv = document.getElementById('result');

// Connect wallet
connectButton.addEventListener('click', async () => {
  try {
    const accounts = await nexacore.connect();
    resultDiv.innerHTML = `Connected: ${accounts[0]}`;
    
    // Enable forms after connection
    proposalForm.classList.remove('disabled');
    
    // Load proposals
    loadProposals();
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// Add option to proposal
addOptionButton.addEventListener('click', () => {
  const optionsContainer = document.getElementById('options-container');
  const optionIndex = optionsContainer.children.length;
  
  const optionDiv = document.createElement('div');
  optionDiv.className = 'option-input';
  
  const optionInput = document.createElement('input');
  optionInput.type = 'text';
  optionInput.name = `option-${optionIndex}`;
  optionInput.placeholder = `Option ${optionIndex + 1}`;
  optionInput.required = true;
  
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-option';
  removeButton.textContent = 'Remove';
  removeButton.onclick = () => optionsContainer.removeChild(optionDiv);
  
  optionDiv.appendChild(optionInput);
  optionDiv.appendChild(removeButton);
  optionsContainer.appendChild(optionDiv);
});

// Create proposal
proposalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  try {
    const title = proposalTitle.value;
    const description = proposalDescription.value;
    const duration = BigInt(proposalDuration.value * 60 * 60); // Convert hours to seconds
    
    // Get options
    const optionsContainer = document.getElementById('options-container');
    const optionInputs = optionsContainer.querySelectorAll('input[type="text"]');
    const options = Array.from(optionInputs).map(input => input.value);
    
    if (options.length < 2) {
      throw new Error('At least 2 options are required');
    }
    
    const proposalId = await contract.create_proposal(title, description, options, duration);
    
    resultDiv.innerHTML = `Proposal created successfully! ID: ${proposalId}`;
    
    // Reset form
    proposalForm.reset();
    optionsContainer.innerHTML = '';
    
    // Reload proposals
    loadProposals();
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
});

// Load proposals
async function loadProposals() {
  try {
    const count = await contract.get_proposal_count();
    
    proposalsList.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
      const proposalJson = await contract.get_proposal(i);
      const proposal = JSON.parse(proposalJson);
      
      const proposalItem = document.createElement('div');
      proposalItem.className = 'proposal-item';
      proposalItem.innerHTML = `
        <h3>${proposal.title}</h3>
        <p class="status ${proposal.status}">${proposal.status}</p>
        <button class="view-proposal" data-id="${proposal.id}">View Details</button>
      `;
      
      proposalsList.appendChild(proposalItem);
      
      // Add event listener to view button
      proposalItem.querySelector('.view-proposal').addEventListener('click', () => {
        viewProposal(proposal.id);
      });
    }
  } catch (error) {
    resultDiv.innerHTML = `Error loading proposals: ${error.message}`;
  }
}

// View proposal details
async function viewProposal(proposalId) {
  try {
    const proposalJson = await contract.get_proposal(proposalId);
    const proposal = JSON.parse(proposalJson);
    
    // Format dates
    const createdDate = new Date(proposal.created_at * 1000).toLocaleString();
    const endDate = new Date(proposal.end_time * 1000).toLocaleString();
    
    // Check if user has voted
    const accounts = await nexacore.getAccounts();
    const hasVoted = await contract.has_voted(proposalId, accounts[0]);
    
    // Calculate total votes
    const totalVotes = proposal.options.reduce((sum, option) => sum + option.votes, 0);
    
    // Generate options HTML with vote percentages
    const optionsHtml = proposal.options.map((option, index) => {
      const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(2) : 0;
      
      return `
        <div class="option">
          <div class="option-header">
            <span class="option-text">${option.text}</span>
            <span class="option-votes">${option.votes} votes (${percentage}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${percentage}%"></div>
          </div>
          ${!hasVoted && proposal.status === 'active' ? 
            `<button class="vote-button" data-proposal="${proposalId}" data-option="${index}">Vote</button>` : 
            ''}
        </div>
      `;
    }).join('');
    
    // Generate proposal details HTML
    proposalDetails.innerHTML = `
      <div class="proposal-header">
        <h2>${proposal.title}</h2>
        <span class="status ${proposal.status}">${proposal.status}</span>
      </div>
      <p class="description">${proposal.description}</p>
      <div class="proposal-meta">
        <p>Created: ${createdDate}</p>
        <p>Ends: ${endDate}</p>
        <p>Total Votes: ${totalVotes}</p>
      </div>
      <div class="options-container">
        ${optionsHtml}
      </div>
      ${proposal.status === 'active' && accounts[0] === await getOwner() ? 
        `<button id="end-proposal" data-id="${proposalId}">End Proposal</button>` : 
        ''}
    `;
    
    // Show proposal details
    proposalDetails.style.display = 'block';
    
    // Add event listeners to vote buttons
    const voteButtons = proposalDetails.querySelectorAll('.vote-button');
    voteButtons.forEach(button => {
      button.addEventListener('click', () => {
        vote(button.dataset.proposal, button.dataset.option);
      });
    });
    
    // Add event listener to end proposal button
    const endButton = document.getElementById('end-proposal');
    if (endButton) {
      endButton.addEventListener('click', () => {
        endProposal(proposalId);
      });
    }
  } catch (error) {
    resultDiv.innerHTML = `Error loading proposal details: ${error.message}`;
  }
}

// Vote on a proposal
async function vote(proposalId, optionIndex) {
  try {
    const success = await contract.vote(parseInt(proposalId), parseInt(optionIndex));
    
    if (success) {
      resultDiv.innerHTML = 'Vote cast successfully!';
      
      // Reload proposal details
      viewProposal(proposalId);
    } else {
      resultDiv.innerHTML = 'Vote failed. You may have already voted or the proposal has ended.';
    }
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
}

// End a proposal early
async function endProposal(proposalId) {
  try {
    const success = await contract.end_proposal(parseInt(proposalId));
    
    if (success) {
      resultDiv.innerHTML = 'Proposal ended successfully!';
      
      // Reload proposal details
      viewProposal(proposalId);
      
      // Reload proposals list
      loadProposals();
    } else {
      resultDiv.innerHTML = 'Failed to end proposal. You may not be the owner or the proposal has already ended.';
    }
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
}

// Get contract owner
async function getOwner() {
  // In a real implementation, this would query the contract
  // For this example, we'll just return a placeholder
  return '0xowner123456789';
}

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
            case 'create_proposal':
              return 1;
            case 'vote':
              return true;
            case 'get_proposal':
              return JSON.stringify({
                id: args[0],
                title: 'Example Proposal',
                description: 'This is an example proposal description.',
                status: 'active',
                created_at: Math.floor(Date.now() / 1000) - 3600,
                end_time: Math.floor(Date.now() / 1000) + 86400,
                options: [
                  { text: 'Option 1', votes: 10 },
                  { text: 'Option 2', votes: 5 },
                  { text: 'Option 3', votes: 3 }
                ]
              });
            case 'get_proposal_count':
              return 3;
            case 'has_voted':
              return false;
            case 'end_proposal':
              return true;
            default:
              return null;
          }
        };
      }
      
      return instance;
    }
  };
}