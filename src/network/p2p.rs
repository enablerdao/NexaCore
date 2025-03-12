use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant};
use log::{info, warn, error, debug};
use serde::{Serialize, Deserialize};
use tokio::sync::mpsc;
use libp2p::{
    core::upgrade,
    floodsub::{self, Floodsub, FloodsubEvent},
    identity,
    mdns::{Mdns, MdnsEvent},
    swarm::{NetworkBehaviourEventProcess, Swarm, SwarmBuilder},
    NetworkBehaviour, PeerId, Transport,
};
use crate::core::block::Block;
use crate::core::transaction::Transaction;

// Message types for P2P communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    NewBlock(Block),
    NewTransaction(Transaction),
    BlockRequest {
        block_hash: String,
        requester: String,
    },
    BlockResponse {
        block: Block,
        responder: String,
    },
    TransactionRequest {
        tx_hash: String,
        requester: String,
    },
    TransactionResponse {
        transaction: Transaction,
        responder: String,
    },
    PeerAnnounce {
        peer_id: String,
        shard_id: u16,
        address: String,
        port: u16,
    },
    ShardSync {
        shard_id: u16,
        from_block: u64,
        to_block: u64,
    },
}

// Network behavior combining Floodsub and mDNS
#[derive(NetworkBehaviour)]
#[behaviour(event_process = true)]
struct NexaCoreBehaviour {
    floodsub: Floodsub,
    mdns: Mdns,
    
    #[behaviour(ignore)]
    response_sender: mpsc::UnboundedSender<Message>,
}

impl NetworkBehaviourEventProcess<FloodsubEvent> for NexaCoreBehaviour {
    fn inject_event(&mut self, event: FloodsubEvent) {
        if let FloodsubEvent::Message(message) = event {
            if let Ok(msg) = serde_json::from_slice::<Message>(&message.data) {
                debug!("Received message: {:?} from {:?}", msg, message.source);
                
                // Forward the message to the handler
                if let Err(e) = self.response_sender.send(msg) {
                    error!("Error forwarding message: {}", e);
                }
            } else {
                warn!("Received invalid message from {:?}", message.source);
            }
        }
    }
}

impl NetworkBehaviourEventProcess<MdnsEvent> for NexaCoreBehaviour {
    fn inject_event(&mut self, event: MdnsEvent) {
        match event {
            MdnsEvent::Discovered(peers) => {
                for (peer, addr) in peers {
                    debug!("mDNS discovered peer: {} at {}", peer, addr);
                    self.floodsub.add_node_to_partial_view(peer);
                }
            }
            MdnsEvent::Expired(peers) => {
                for (peer, addr) in peers {
                    debug!("mDNS expired peer: {} at {}", peer, addr);
                    self.floodsub.remove_node_from_partial_view(&peer);
                }
            }
        }
    }
}

// P2P network manager
pub struct P2PManager {
    local_peer_id: PeerId,
    swarm: Swarm<NexaCoreBehaviour>,
    known_peers: HashMap<PeerId, PeerInfo>,
    subscribed_topics: HashSet<String>,
    message_sender: mpsc::UnboundedSender<Message>,
    message_receiver: mpsc::UnboundedReceiver<Message>,
    shard_id: u16,
}

#[derive(Debug, Clone)]
struct PeerInfo {
    peer_id: PeerId,
    shard_id: u16,
    address: String,
    port: u16,
    last_seen: Instant,
}

impl P2PManager {
    pub async fn new(shard_id: u16) -> Result<Self, Box<dyn std::error::Error>> {
        // Create a random keypair for this node
        let local_key = identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(local_key.public());
        info!("Local peer ID: {}", local_peer_id);
        
        // Create a channel for handling messages
        let (message_sender, message_receiver) = mpsc::unbounded_channel();
        let (response_sender, _) = mpsc::unbounded_channel();
        
        // Create a transport
        let transport = libp2p::development_transport(local_key).await?;
        
        // Create a Floodsub topic for the shard
        let shard_topic = floodsub::Topic::new(format!("nexacore-shard-{}", shard_id));
        let global_topic = floodsub::Topic::new("nexacore-global");
        
        // Create a Swarm to manage peers and events
        let mut behaviour = NexaCoreBehaviour {
            floodsub: Floodsub::new(local_peer_id),
            mdns: Mdns::new(Default::default()).await?,
            response_sender,
        };
        
        // Subscribe to the topics
        behaviour.floodsub.subscribe(shard_topic);
        behaviour.floodsub.subscribe(global_topic);
        
        let swarm = SwarmBuilder::new(transport, behaviour, local_peer_id)
            .executor(Box::new(|fut| {
                tokio::spawn(fut);
            }))
            .build();
        
        let mut subscribed_topics = HashSet::new();
        subscribed_topics.insert(format!("nexacore-shard-{}", shard_id));
        subscribed_topics.insert("nexacore-global".to_string());
        
        Ok(P2PManager {
            local_peer_id,
            swarm,
            known_peers: HashMap::new(),
            subscribed_topics,
            message_sender,
            message_receiver,
            shard_id,
        })
    }
    
    pub async fn start(&mut self, listen_addr: String) -> Result<(), Box<dyn std::error::Error>> {
        // Listen on the provided address
        let addr = listen_addr.parse()?;
        Swarm::listen_on(&mut self.swarm, addr)?;
        info!("P2P network listening on {}", listen_addr);
        
        // Announce ourselves to the network
        self.announce_peer().await?;
        
        // Start the main event loop
        self.run().await?;
        
        Ok(())
    }
    
    async fn run(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        loop {
            tokio::select! {
                event = self.swarm.select_next_some() => {
                    debug!("Swarm event: {:?}", event);
                }
                msg = self.message_receiver.recv() => {
                    if let Some(msg) = msg {
                        self.handle_message(msg).await?;
                    } else {
                        // Channel closed, exit the loop
                        break;
                    }
                }
            }
        }
        
        Ok(())
    }
    
    async fn handle_message(&mut self, msg: Message) -> Result<(), Box<dyn std::error::Error>> {
        match msg {
            Message::NewBlock(block) => {
                // Process new block
                debug!("Received new block: {}", block.hash);
                // Forward to appropriate handlers
            }
            Message::NewTransaction(tx) => {
                // Process new transaction
                debug!("Received new transaction: {}", tx.hash);
                // Forward to appropriate handlers
            }
            Message::BlockRequest { block_hash, requester } => {
                // Handle block request
                debug!("Received block request for {}", block_hash);
                // Fetch block and respond
            }
            Message::BlockResponse { block, responder } => {
                // Process block response
                debug!("Received block response from {}", responder);
                // Forward block to appropriate handlers
            }
            Message::TransactionRequest { tx_hash, requester } => {
                // Handle transaction request
                debug!("Received transaction request for {}", tx_hash);
                // Fetch transaction and respond
            }
            Message::TransactionResponse { transaction, responder } => {
                // Process transaction response
                debug!("Received transaction response from {}", responder);
                // Forward transaction to appropriate handlers
            }
            Message::PeerAnnounce { peer_id, shard_id, address, port } => {
                // Process peer announcement
                debug!("Received peer announcement: {} (shard {})", peer_id, shard_id);
                // Add to known peers
                self.add_peer(peer_id, shard_id, address, port).await?;
            }
            Message::ShardSync { shard_id, from_block, to_block } => {
                // Process shard sync request
                debug!("Received shard sync request for shard {}: blocks {}-{}", 
                       shard_id, from_block, to_block);
                // Handle shard synchronization
            }
        }
        
        Ok(())
    }
    
    async fn announce_peer(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let announce_msg = Message::PeerAnnounce {
            peer_id: self.local_peer_id.to_string(),
            shard_id: self.shard_id,
            address: "127.0.0.1".to_string(), // In a real implementation, this would be the actual IP
            port: 8000, // In a real implementation, this would be the actual port
        };
        
        self.broadcast_message(&announce_msg, "nexacore-global").await?;
        
        Ok(())
    }
    
    async fn add_peer(&mut self, peer_id_str: String, shard_id: u16, address: String, port: u16) -> Result<(), Box<dyn std::error::Error>> {
        let peer_id = PeerId::from_str(&peer_id_str)?;
        
        // Skip if it's our own peer ID
        if peer_id == self.local_peer_id {
            return Ok(());
        }
        
        // Add to known peers
        let peer_info = PeerInfo {
            peer_id,
            shard_id,
            address,
            port,
            last_seen: Instant::now(),
        };
        
        self.known_peers.insert(peer_id, peer_info.clone());
        
        // Subscribe to the peer's shard topic if it's different from ours
        if shard_id != self.shard_id {
            let shard_topic = format!("nexacore-shard-{}", shard_id);
            if !self.subscribed_topics.contains(&shard_topic) {
                let topic = floodsub::Topic::new(&shard_topic);
                self.swarm.behaviour_mut().floodsub.subscribe(topic);
                self.subscribed_topics.insert(shard_topic);
                debug!("Subscribed to new shard topic for shard {}", shard_id);
            }
        }
        
        debug!("Added peer {} (shard {}) at {}:{}", peer_id, shard_id, address, port);
        
        Ok(())
    }
    
    pub async fn broadcast_message(&mut self, msg: &Message, topic: &str) -> Result<(), Box<dyn std::error::Error>> {
        let json = serde_json::to_string(msg)?;
        let topic = floodsub::Topic::new(topic);
        
        self.swarm.behaviour_mut().floodsub.publish(topic, json.as_bytes());
        debug!("Broadcasted message to topic {}", topic);
        
        Ok(())
    }
    
    pub async fn broadcast_block(&mut self, block: &Block) -> Result<(), Box<dyn std::error::Error>> {
        let msg = Message::NewBlock(block.clone());
        
        // Broadcast to the block's shard topic
        let shard_topic = format!("nexacore-shard-{}", block.header.shard_id);
        self.broadcast_message(&msg, &shard_topic).await?;
        
        // Also broadcast to the global topic
        self.broadcast_message(&msg, "nexacore-global").await?;
        
        info!("Broadcasted new block {} to the network", block.hash);
        
        Ok(())
    }
    
    pub async fn broadcast_transaction(&mut self, tx: &Transaction) -> Result<(), Box<dyn std::error::Error>> {
        let msg = Message::NewTransaction(tx.clone());
        
        // Broadcast to the transaction's shard topic
        let shard_topic = format!("nexacore-shard-{}", tx.shard_id);
        self.broadcast_message(&msg, &shard_topic).await?;
        
        // Also broadcast to the global topic
        self.broadcast_message(&msg, "nexacore-global").await?;
        
        debug!("Broadcasted new transaction {} to the network", tx.hash);
        
        Ok(())
    }
    
    pub async fn request_block(&mut self, block_hash: &str) -> Result<(), Box<dyn std::error::Error>> {
        let msg = Message::BlockRequest {
            block_hash: block_hash.to_string(),
            requester: self.local_peer_id.to_string(),
        };
        
        // Broadcast to the global topic
        self.broadcast_message(&msg, "nexacore-global").await?;
        
        debug!("Requested block {} from the network", block_hash);
        
        Ok(())
    }
    
    pub async fn request_transaction(&mut self, tx_hash: &str) -> Result<(), Box<dyn std::error::Error>> {
        let msg = Message::TransactionRequest {
            tx_hash: tx_hash.to_string(),
            requester: self.local_peer_id.to_string(),
        };
        
        // Broadcast to the global topic
        self.broadcast_message(&msg, "nexacore-global").await?;
        
        debug!("Requested transaction {} from the network", tx_hash);
        
        Ok(())
    }
    
    pub async fn request_shard_sync(&mut self, shard_id: u16, from_block: u64, to_block: u64) -> Result<(), Box<dyn std::error::Error>> {
        let msg = Message::ShardSync {
            shard_id,
            from_block,
            to_block,
        };
        
        // Broadcast to the specific shard topic
        let shard_topic = format!("nexacore-shard-{}", shard_id);
        self.broadcast_message(&msg, &shard_topic).await?;
        
        info!("Requested sync for shard {} from block {} to {}", shard_id, from_block, to_block);
        
        Ok(())
    }
    
    pub fn get_peer_count(&self) -> usize {
        self.known_peers.len()
    }
    
    pub fn get_peers_by_shard(&self, shard_id: u16) -> Vec<PeerInfo> {
        self.known_peers.values()
            .filter(|p| p.shard_id == shard_id)
            .cloned()
            .collect()
    }
    
    pub fn get_local_peer_id(&self) -> String {
        self.local_peer_id.to_string()
    }
    
    pub fn get_shard_id(&self) -> u16 {
        self.shard_id
    }
}

// Global P2P manager instance
lazy_static::lazy_static! {
    static ref P2P_MANAGER: Arc<Mutex<Option<P2PManager>>> = Arc::new(Mutex::new(None));
}

pub fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    info!("Initializing P2P network...");
    
    // In a real implementation, this would create and start the P2P manager
    // For this example, we'll just set up the placeholder
    
    info!("P2P network initialized successfully");
    Ok(())
}

pub fn shutdown() -> Result<(), Box<dyn std::error::Error>> {
    info!("Shutting down P2P network...");
    
    let mut p2p_manager = P2P_MANAGER.lock().unwrap();
    *p2p_manager = None;
    
    info!("P2P network shutdown complete");
    Ok(())
}

pub fn get_manager() -> Arc<Mutex<Option<P2PManager>>> {
    P2P_MANAGER.clone()
}