/**
 * Manual Input UI Components
 * 사용자 수동 입력을 위한 UI 컴포넌트들
 */

class ManualInputUI {
    constructor(storageManager) {
        this.storage = storageManager;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createModalContainer();
    }

    // 모달 컨테이너 생성
    createModalContainer() {
        if (document.getElementById('modal-container')) return;

        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        modalContainer.className = 'fixed inset-0 z-50 hidden';
        modalContainer.innerHTML = `
            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm modal-overlay"></div>
            <div class="fixed inset-0 flex items-center justify-center p-4">
                <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                    <!-- 모달 내용이 여기에 동적으로 삽입됩니다 -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);

        // 오버레이 클릭시 모달 닫기
        modalContainer.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 교통편 정보 추가/수정 버튼
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-transport-btn')) {
                this.showTransportModal();
            }
            
            if (e.target.matches('.setup-budget-btn')) {
                this.showBudgetSetupModal();
            }
            
            if (e.target.matches('.add-todo-category-btn')) {
                this.showTodoCategoryModal();
            }
        });

        // 스토리지 업데이트 이벤트 리스너
        window.addEventListener('pwaStorageUpdate', (e) => {
            this.handleStorageUpdate(e.detail);
        });
    }

    // 교통편 정보 입력 모달
    showTransportModal() {
        const currentTransport = this.storage.getTransportInfo();
        
        const modalContent = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-slate-800">교통편 정보</h2>
                    <button class="close-modal-btn text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="transport-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">교통수단</label>
                        <select id="transport-type" class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            <option value="">선택하세요</option>
                            <option value="항공편" ${currentTransport.label === '항공편' ? 'selected' : ''}>항공편</option>
                            <option value="기차" ${currentTransport.label === '기차' ? 'selected' : ''}>기차</option>
                            <option value="버스" ${currentTransport.label === '버스' ? 'selected' : ''}>버스</option>
                            <option value="자가용" ${currentTransport.label === '자가용' ? 'selected' : ''}>자가용</option>
                            <option value="기타" ${currentTransport.label === '기타' ? 'selected' : ''}>기타</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">경로 정보</label>
                        <input type="text" id="transport-route" 
                               placeholder="예: 인천공항 → 마카오공항" 
                               value="${currentTransport.route || ''}"
                               class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">출발/도착 시간</label>
                        <textarea id="transport-schedule" 
                                  placeholder="예: 출발 09:00 / 도착 12:30"
                                  rows="3"
                                  class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">${currentTransport.schedule || ''}</textarea>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="button" class="close-modal-btn flex-1 py-3 px-4 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                            취소
                        </button>
                        <button type="submit" class="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium">
                            저장
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.showModal(modalContent);
        
        // 폼 제출 처리
        document.getElementById('transport-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransportSubmit();
        });
    }

    // 예산 설정 모달
    showBudgetSetupModal() {
        const currentBudget = this.storage.getBudgetInfo();
        
        const modalContent = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-slate-800">예산 설정</h2>
                    <button class="close-modal-btn text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="budget-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">총 예산</label>
                        <div class="relative">
                            <input type="number" id="total-budget" 
                                   placeholder="1000000" 
                                   value="${currentBudget.total || ''}"
                                   class="w-full p-3 pr-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-slate-700">카테고리별 예산 (선택사항)</h3>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-slate-500 mb-1">숙박비</label>
                                <input type="number" id="budget-accommodation" 
                                       value="${currentBudget.breakdown?.accommodation || ''}"
                                       class="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-500 mb-1">식비</label>
                                <input type="number" id="budget-meals" 
                                       value="${currentBudget.breakdown?.meals || ''}"
                                       class="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-500 mb-1">교통비</label>
                                <input type="number" id="budget-transport" 
                                       value="${currentBudget.breakdown?.transport || ''}"
                                       class="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-500 mb-1">관광/활동비</label>
                                <input type="number" id="budget-activities" 
                                       value="${currentBudget.breakdown?.activities || ''}"
                                       class="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="button" class="close-modal-btn flex-1 py-3 px-4 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                            취소
                        </button>
                        <button type="submit" class="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium">
                            저장
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.showModal(modalContent);
        
        // 폼 제출 처리
        document.getElementById('budget-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBudgetSubmit();
        });
    }

    // 할일 카테고리 추가 모달
    showTodoCategoryModal() {
        const modalContent = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-slate-800">새 준비물 카테고리</h2>
                    <button class="close-modal-btn text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="todo-category-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">카테고리 이름</label>
                        <input type="text" id="category-name" 
                               placeholder="예: 수영용품, 등산용품, 아이용품" 
                               class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">첫 번째 항목 (선택사항)</label>
                        <input type="text" id="first-item" 
                               placeholder="예: 수영복, 등산화, 기저귀" 
                               class="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="button" class="close-modal-btn flex-1 py-3 px-4 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                            취소
                        </button>
                        <button type="submit" class="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium">
                            추가
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.showModal(modalContent);
        
        // 폼 제출 처리
        document.getElementById('todo-category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTodoCategorySubmit();
        });
    }

    // 교통편 정보 저장
    handleTransportSubmit() {
        const transportType = document.getElementById('transport-type').value;
        const route = document.getElementById('transport-route').value;
        const schedule = document.getElementById('transport-schedule').value;

        if (!transportType) {
            alert('교통수단을 선택해주세요.');
            return;
        }

        const transportData = {
            label: transportType,
            route: route,
            schedule: schedule
        };

        this.storage.setTransportInfo(transportData);
        this.closeModal();
        this.showToast('교통편 정보가 저장되었습니다.');
    }

    // 예산 정보 저장
    handleBudgetSubmit() {
        const totalBudget = document.getElementById('total-budget').value;
        
        if (!totalBudget || totalBudget <= 0) {
            alert('총 예산을 입력해주세요.');
            return;
        }

        // 총 예산 저장
        this.storage.setBudgetTotal(totalBudget);

        // 카테고리별 예산 저장 (선택사항)
        const budgetInfo = this.storage.getBudgetInfo();
        budgetInfo.breakdown = {
            accommodation: parseInt(document.getElementById('budget-accommodation').value) || 0,
            meals: parseInt(document.getElementById('budget-meals').value) || 0,
            transport: parseInt(document.getElementById('budget-transport').value) || 0,
            activities: parseInt(document.getElementById('budget-activities').value) || 0
        };

        // 업데이트된 예산 저장
        const key = this.storage.storagePrefix + 'budget';
        localStorage.setItem(key, JSON.stringify(budgetInfo));

        this.closeModal();
        this.showToast('예산이 설정되었습니다.');
    }

    // 할일 카테고리 추가
    handleTodoCategorySubmit() {
        const categoryName = document.getElementById('category-name').value.trim();
        const firstItem = document.getElementById('first-item').value.trim();

        if (!categoryName) {
            alert('카테고리 이름을 입력해주세요.');
            return;
        }

        this.storage.addTodoCategory(categoryName);
        
        if (firstItem) {
            this.storage.addTodoItem(categoryName, firstItem);
        }

        this.closeModal();
        this.showToast('새 카테고리가 추가되었습니다.');
    }

    // 모달 표시
    showModal(content) {
        const modalContainer = document.getElementById('modal-container');
        const modalContent = modalContainer.querySelector('.modal-content');
        
        modalContent.innerHTML = content;
        modalContainer.classList.remove('hidden');
        
        // 모달 닫기 버튼 이벤트
        modalContent.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        // ESC 키로 모달 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // 모달 닫기
    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.classList.add('hidden');
    }

    // 토스트 메시지 표시
    showToast(message, type = 'success') {
        // 기존 토스트 제거
        const existingToast = document.getElementById('toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 translate-x-full`;
        
        if (type === 'success') {
            toast.classList.add('bg-green-500', 'text-white');
        } else if (type === 'error') {
            toast.classList.add('bg-red-500', 'text-white');
        }
        
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 애니메이션
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 스토리지 업데이트 처리
    handleStorageUpdate(detail) {
        // UI 업데이트가 필요한 경우 여기서 처리
        if (detail.type === 'transport') {
            this.updateTransportUI(detail.data);
        } else if (detail.type === 'budget') {
            this.updateBudgetUI(detail.data);
        } else if (detail.type === 'todo') {
            this.updateTodoUI(detail.data);
        }
    }

    // UI 업데이트 메서드들
    updateTransportUI(transportData) {
        // 교통편 정보 UI 업데이트 로직
        console.log('Transport updated:', transportData);
    }

    updateBudgetUI(budgetData) {
        // 예산 정보 UI 업데이트 로직
        console.log('Budget updated:', budgetData);
    }

    updateTodoUI(todoData) {
        // 할일 정보 UI 업데이트 로직
        console.log('Todo updated:', todoData);
    }
}

// 전역에서 사용할 수 있도록 설정
window.ManualInputUI = ManualInputUI;