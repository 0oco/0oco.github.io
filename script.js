// script.js
const CONFIG = {
    BASE_URL: 'https://zeldvorik.ru/apiv2/api.php',
    IMAGE_FALLBACK: 'https://via.placeholder.com/300x450?text=No+Image'
};

const app = {
    currentPage: 1,
    currentAction: 'trending',
    isSearching: false,

    init() {
        lucide.createIcons();
        this.fetchCategory('trending');
        this.setupEventListeners();
    },

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        let timeout = null;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const query = e.target.value;
                if (query.length > 2) {
                    this.searchContent(query);
                } else if (query.length === 0) {
                    this.fetchCategory('trending');
                }
            }, 600);
        });
    },

    async fetchData(url) {
        try {
            this.showSkeleton();
            const response = await fetch(url);
            const data = await response.json();
            return data.success ? data.items : [];
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    },

    async fetchCategory(action) {
        this.currentAction = action;
        const items = await this.fetchData(`${CONFIG.BASE_URL}?action=${action}&page=1`);
        document.getElementById('section-title').innerText = action.replace('-', ' ').toUpperCase();
        this.renderGrid(items);
        if(action === 'trending') this.renderHero(items[0]);
    },

    async searchContent(query) {
        const items = await this.fetchData(`${CONFIG.BASE_URL}?action=search&q=${query}`);
        document.getElementById('section-title').innerText = `Hasil pencarian: "${query}"`;
        this.renderGrid(items);
    },

    renderHero(item) {
        if(!item) return;
        const container = document.getElementById('hero-container');
        container.innerHTML = `
            <div class="relative h-[70vh] w-full overflow-hidden">
                <img src="${item.poster}" class="w-full h-full object-cover opacity-40">
                <div class="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-transparent to-transparent"></div>
                <div class="absolute bottom-12 left-4 md:left-12 max-w-2xl">
                    <span class="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mb-4 inline-block">TRENDING</span>
                    <h1 class="text-4xl md:text-6xl font-extrabold mb-4">${item.title}</h1>
                    <div class="flex gap-4 mb-6 text-sm text-gray-300">
                        <span>${item.year}</span>
                        <span class="text-yellow-500">★ ${item.rating}</span>
                        <span>${item.type.toUpperCase()}</span>
                    </div>
                    <button onclick="app.showDetail('${item.detailPath}')" class="bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-gray-200 transition flex items-center gap-2">
                        <i data-lucide="play-circle"></i> Tonton Sekarang
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderGrid(items) {
        const grid = document.getElementById('movie-grid');
        grid.innerHTML = items.map(item => `
            <div class="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-900 transition-all duration-300 hover:scale-105" 
                 onclick="app.showDetail('${item.detailPath}')">
                <img src="${item.poster || CONFIG.IMAGE_FALLBACK}" alt="${item.title}" class="aspect-[2/3] w-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <h3 class="font-bold text-sm leading-tight">${item.title}</h3>
                    <div class="flex justify-between items-center mt-2 text-[10px] text-gray-300">
                        <span>${item.year}</span>
                        <span class="bg-yellow-500/20 text-yellow-500 px-1.5 rounded">★ ${item.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    async showDetail(detailPath) {
        const modal = document.getElementById('detail-modal');
        const body = document.getElementById('modal-body');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        body.innerHTML = '<div class="flex justify-center items-center h-screen"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600"></div></div>';

        try {
            const response = await fetch(`${CONFIG.BASE_URL}?action=detail&detailPath=${detailPath}`);
            const data = await response.json();
            const detail = data.item;

            body.innerHTML = `
                <div class="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
                    <div class="lg:w-1/3">
                        <img src="${detail.poster}" class="w-full rounded-2xl shadow-2xl">
                    </div>
                    <div class="lg:w-2/3">
                        <h2 class="text-4xl md:text-5xl font-black mb-4">${detail.title}</h2>
                        <div class="flex flex-wrap gap-4 mb-6">
                            <span class="text-yellow-500 flex items-center gap-1 font-bold">★ ${detail.rating}</span>
                            <span class="text-gray-400">${detail.year}</span>
                            <span class="border border-gray-600 px-2 py-0.5 rounded text-xs">${detail.type}</span>
                        </div>
                        <p class="text-gray-300 leading-relaxed mb-8">${detail.description || 'Tidak ada deskripsi tersedia.'}</p>
                        
                        <div class="mb-10">
                            <h4 class="text-xl font-bold mb-4">Player</h4>
                            <iframe src="${detail.playerUrl}" allowfullscreen></iframe>
                        </div>

                        ${detail.seasons ? this.renderEpisodes(detail.seasons) : ''}
                    </div>
                </div>
            `;
            lucide.createIcons();
        } catch (error) {
            body.innerHTML = `<p class="text-center">Gagal memuat detail konten.</p>`;
        }
    },

    renderEpisodes(seasons) {
        return seasons.map(s => `
            <div class="mb-6">
                <h5 class="text-lg font-bold mb-3 text-red-500">${s.seasonName}</h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    ${s.episodes.map(ep => `
                        <button onclick="app.updatePlayer('${ep.url}')" class="bg-gray-800 hover:bg-red-600 p-3 rounded text-sm transition text-left">
                            ${ep.episodeName}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    updatePlayer(url) {
        const iframe = document.querySelector('iframe');
        iframe.src = url;
        iframe.scrollIntoView({ behavior: 'smooth' });
    },

    closeModal() {
        document.getElementById('detail-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        document.getElementById('modal-body').innerHTML = '';
    },

    showSkeleton() {
        const grid = document.getElementById('movie-grid');
        grid.innerHTML = Array(10).fill(0).map(() => `
            <div class="aspect-[2/3] w-full rounded-xl skeleton"></div>
        `).join('');
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => app.init());