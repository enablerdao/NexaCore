// NexaCore固有のJavaScript機能

document.addEventListener('DOMContentLoaded', function() {
    // 特徴セクションのアニメーション
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        card.classList.add('scroll-reveal');
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // ロードマップのアニメーション
    const roadmapItems = document.querySelectorAll('.roadmap-item');
    
    roadmapItems.forEach((item) => {
        item.classList.add('scroll-reveal');
    });
    
    // AIデモのインタラクティブな要素
    const aiSection = document.querySelector('#technology');
    
    if (aiSection) {
        const aiTitle = aiSection.querySelector('h3:contains("AI統合アーキテクチャ")');
        
        if (aiTitle) {
            const demoButton = document.createElement('button');
            demoButton.textContent = 'AIデモを見る';
            demoButton.className = 'bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 ml-4 text-sm focus:outline-none';
            
            aiTitle.appendChild(demoButton);
            
            demoButton.addEventListener('click', function() {
                // AIデモのモーダルを表示
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                modal.innerHTML = `
                    <div class="bg-gray-800 p-6 rounded-lg max-w-2xl w-full">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold">NexaCore AI最適化デモ</h3>
                            <button class="text-gray-400 hover:text-white focus:outline-none" id="close-modal">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div class="mb-4">
                            <p class="text-gray-300 mb-4">このデモでは、AIがネットワークトラフィックを分析し、最適なルーティングを提案する様子を示しています。</p>
                            <div class="bg-gray-900 p-4 rounded">
                                <pre class="text-green-400 text-sm overflow-x-auto">
// ネットワーク最適化デモ
Analyzing network traffic...
Detected congestion in Shard #3
Rerouting transactions to Shard #5
Optimizing validator assignments...
Performance improved by 27%
                                </pre>
                            </div>
                        </div>
                        <div class="text-right">
                            <button class="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 focus:outline-none" id="close-demo">閉じる</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                document.getElementById('close-modal').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
                
                document.getElementById('close-demo').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
            });
        }
    }
});