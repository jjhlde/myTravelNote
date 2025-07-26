/**
 * Todo 기능
 */

export function executeTodoScript() {
    console.log('Todo script execution started');
    
    const userCategoriesContainer = document.getElementById('macau-user-categories');
    const newTodoInput = document.getElementById('macau-new-todo-item');
    const addTodoBtn = document.getElementById('macau-add-todo-btn');
    const newCategoryInput = document.getElementById('macau-new-category-name');
    const addCategoryBtn = document.getElementById('macau-add-category-btn');
    
    console.log('DOM 요소들:', {
        userCategoriesContainer: !!userCategoriesContainer,
        newTodoInput: !!newTodoInput,
        addTodoBtn: !!addTodoBtn,
        newCategoryInput: !!newCategoryInput,
        addCategoryBtn: !!addCategoryBtn
    });
    
    // 점 세개 버튼이 있는지 확인
    setTimeout(() => {
        const menuButtons = document.querySelectorAll('.macau-todo-menu-btn');
        console.log('Found menu buttons:', menuButtons.length);
        menuButtons.forEach((btn, index) => {
            console.log(`Button ${index}:`, btn, 'Text:', btn.dataset.text);
        });
    }, 500);

    // 사용자 추가 카테고리 관리
    let userCategories = JSON.parse(localStorage.getItem('macao_todo_categories') || '{"기타": []}');

    // 체크박스 상태 저장
    function saveCheckboxStates() {
        const checkboxes = document.querySelectorAll('.macau-todo-checkbox');
        const states = {};
        checkboxes.forEach((checkbox, index) => {
            const todoItem = checkbox.closest('.macau-todo-item');
            const todoText = todoItem.querySelector('.macau-todo-text').textContent;
            states[todoText] = checkbox.checked;
            
            // 완료 상태 시각적 표시
            if (checkbox.checked) {
                todoItem.classList.add('completed');
            } else {
                todoItem.classList.remove('completed');
            }
        });
        localStorage.setItem('macao_todo_states', JSON.stringify(states));
    }

    // 기본 준비물 텍스트 저장
    function saveBasicItemTexts() {
        const basicTexts = {};
        document.querySelectorAll('.macau-todo-category .macau-todo-item .macau-todo-text').forEach((textElement, index) => {
            const originalTexts = [
                '여권 및 항공편 티켓', '숙소 바우처 출력 또는 저장', '마카오 파타카 환전', '해외 데이터 로밍 또는 유심',
                '날씨에 맞는 옷차림 (여름옷, 우산)', '편한 신발 (많이 걸을 예정)', '개인 세면용품', '상비약 (두통약, 소화제 등)',
                '기저귀, 물티슈, 휴대용 변기 커버', '아이 전용 상비약 (해열제, 체온계, 밴드)', '아이가 좋아하는 간식과 장난감', '유모차 또는 아기띠',
                '스마트폰 충전기', '보조배터리', '카메라 (또는 스마트폰으로 대체)', '멀티 어댑터 (해외용 플러그)',
                '자외선 차단제 (강한 햇볕 대비)', '수영복 및 수건 (리조트 데크)', '우산 또는 우비 (우기 대비)'
            ];
            if (index < originalTexts.length) {
                basicTexts[originalTexts[index]] = textElement.textContent;
            }
        });
        localStorage.setItem('macao_basic_texts', JSON.stringify(basicTexts));
    }

    // 기본 준비물 텍스트 복원
    function restoreBasicItemTexts() {
        const basicTexts = JSON.parse(localStorage.getItem('macao_basic_texts') || '{}');
        document.querySelectorAll('.macau-todo-category .macau-todo-item .macau-todo-text').forEach((textElement, index) => {
            const originalTexts = [
                '여권 및 항공편 티켓', '숙소 바우처 출력 또는 저장', '마카오 파타카 환전', '해외 데이터 로밍 또는 유심',
                '날씨에 맞는 옷차림 (여름옷, 우산)', '편한 신발 (많이 걸을 예정)', '개인 세면용품', '상비약 (두통약, 소화제 등)',
                '기저귀, 물티슈, 휴대용 변기 커버', '아이 전용 상비약 (해열제, 체온계, 밴드)', '아이가 좋아하는 간식과 장난감', '유모차 또는 아기띠',
                '스마트폰 충전기', '보조배터리', '카메라 (또는 스마트폰으로 대체)', '멀티 어댑터 (해외용 플러그)',
                '자외선 차단제 (강한 햇볕 대비)', '수영복 및 수건 (리조트 데크)', '우산 또는 우비 (우기 대비)'
            ];
            if (index < originalTexts.length && basicTexts[originalTexts[index]]) {
                textElement.textContent = basicTexts[originalTexts[index]];
            }
        });
    }

    // 삭제된 기본 준비물 복원
    function restoreDeletedBasicItems() {
        const deletedItems = JSON.parse(localStorage.getItem('macao_deleted_basic_items') || '[]');
        deletedItems.forEach(deletedText => {
            // 해당 텍스트를 가진 항목을 찾아서 숨기기
            const todoItems = document.querySelectorAll('.macau-todo-item');
            todoItems.forEach(item => {
                const textElement = item.querySelector('.macau-todo-text');
                if (textElement && textElement.textContent === deletedText) {
                    item.style.display = 'none';
                }
            });
        });
    }

    // 체크박스 상태 복원
    function restoreCheckboxStates() {
        const states = JSON.parse(localStorage.getItem('macao_todo_states') || '{}');
        const checkboxes = document.querySelectorAll('.macau-todo-checkbox');
        checkboxes.forEach(checkbox => {
            const todoItem = checkbox.closest('.macau-todo-item');
            const todoText = todoItem.querySelector('.macau-todo-text').textContent;
            if (states[todoText] !== undefined) {
                checkbox.checked = states[todoText];
                if (checkbox.checked) {
                    todoItem.classList.add('completed');
                }
            }
        });
    }

    // 새 준비물 추가 함수
    function addNewTodoItem() {
        console.log('추가 버튼 클릭됨');
        const inputValue = newTodoInput.value.trim();
        console.log('입력값:', inputValue);
        
        if (inputValue) {
            if (!userCategories['기타']) {
                userCategories['기타'] = [];
                console.log('기타 카테고리 새로 생성');
            }
            const newItem = {
                text: inputValue,
                done: false,
                id: Date.now()
            };
            userCategories['기타'].push(newItem);
            localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
            console.log('저장된 카테고리:', userCategories);
            console.log('기타 카테고리 항목들:', userCategories['기타']);
            
            // 렌더링 및 상태 복원
            renderUserCategories();
            setTimeout(() => {
                restoreCheckboxStates();
                console.log('카테고리 렌더링 및 체크박스 상태 복원 완료');
            }, 50);
            
            newTodoInput.value = '';
            
            // 성공 피드백
            showToast('준비물이 추가되었습니다! 🎉');
        } else {
            // 입력값이 없을 때 피드백
            showToast('준비물 이름을 입력해주세요.');
            newTodoInput.focus();
        }
    }

    // 새 준비물 추가 (클릭)
    addTodoBtn?.addEventListener('click', addNewTodoItem);
    
    // 새 준비물 추가 (Enter 키)
    newTodoInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewTodoItem();
        }
    });

    // 새 카테고리 추가 함수
    function addNewCategory() {
        console.log('카테고리 추가 버튼 클릭됨');
        const categoryName = newCategoryInput.value.trim();
        console.log('카테고리명:', categoryName);
        
        if (categoryName) {
            if (!userCategories[categoryName]) {
                userCategories[categoryName] = [];
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                console.log('새 카테고리 저장됨:', userCategories);
                
                // 렌더링 및 상태 복원
                renderUserCategories();
                setTimeout(() => {
                    restoreCheckboxStates();
                    console.log('카테고리 렌더링 완료');
                }, 50);
                
                newCategoryInput.value = '';
                showToast(`"${categoryName}" 카테고리가 추가되었습니다! 📁`);
            } else {
                showToast('이미 존재하는 카테고리입니다.');
                newCategoryInput.focus();
            }
        } else {
            showToast('카테고리 이름을 입력해주세요.');
            newCategoryInput.focus();
        }
    }

    // 새 카테고리 추가 (클릭)
    addCategoryBtn?.addEventListener('click', addNewCategory);
    
    // 새 카테고리 추가 (Enter 키)
    newCategoryInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewCategory();
        }
    });

    // 사용자 카테고리 렌더링
    function renderUserCategories() {
        if (!userCategoriesContainer) {
            console.error('userCategoriesContainer를 찾을 수 없습니다');
            return;
        }
        
        console.log('렌더링할 카테고리들:', userCategories);
        console.log('카테고리 개수:', Object.keys(userCategories).length);
        
        userCategoriesContainer.innerHTML = Object.keys(userCategories).map(categoryName => `
            <div class="tips-section macau-user-category" data-category="${categoryName}">
                <div class="macau-category-header">
                    <div class="tips-title">📝 ${categoryName}</div>
                    <div class="macau-category-actions">
                        <button class="macau-action-btn delete macau-delete-category-btn" data-category="${categoryName}">삭제</button>
                    </div>
                </div>
                <div class="macau-todo-category">
                    ${userCategories[categoryName].map(item => `
                        <div class="macau-todo-item ${item.done ? 'completed' : ''}" data-id="${item.id}">
                            <label class="macau-todo-label">
                                <input type="checkbox" class="macau-todo-checkbox" ${item.done ? 'checked' : ''}>
                                <span class="macau-todo-text">${item.text}</span>
                            </label>
                            <div class="macau-todo-menu-wrapper">
                                <button class="macau-todo-menu-btn" data-category="${categoryName}" data-id="${item.id}">⋯</button>
                                <div class="macau-todo-menu-dropdown" data-category="${categoryName}" data-id="${item.id}">
                                    <div class="macau-menu-item macau-edit-todo-btn" data-category="${categoryName}" data-id="${item.id}">✏️ 수정</div>
                                    <div class="macau-menu-item macau-delete-todo-btn" data-category="${categoryName}" data-id="${item.id}">🗑️ 삭제</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    <div class="macau-add-todo-section">
                        <input type="text" placeholder="이 카테고리에 항목 추가" class="macau-todo-input macau-category-item-input" data-category="${categoryName}">
                        <button class="macau-add-btn macau-add-to-category-btn" data-category="${categoryName}">추가</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('렌더링 완료. HTML 길이:', userCategoriesContainer.innerHTML.length);
        console.log('렌더링된 HTML 미리보기:', userCategoriesContainer.innerHTML.substring(0, 200) + '...');
    }

    // 메뉴 토글 함수
    function toggleMenu(menuBtn) {
        console.log('toggleMenu called with:', menuBtn);
        const dropdown = menuBtn.nextElementSibling;
        console.log('dropdown found:', dropdown);
        const isOpen = dropdown.classList.contains('show');
        console.log('dropdown is open:', isOpen);
        
        // 모든 메뉴 닫기
        document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
            menu.classList.remove('show');
        });
        
        // 클릭한 메뉴만 토글
        if (!isOpen) {
            console.log('Adding show class to dropdown');
            dropdown.classList.add('show');
        }
    }

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.macau-todo-menu-wrapper')) {
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // 모든 클릭 이벤트 디버깅
    document.addEventListener('click', (e) => {
        console.log('Click detected on:', e.target, 'Classes:', e.target.className);
    });

    // 이벤트 위임으로 동적 버튼 처리
    document.addEventListener('click', (e) => {
        // 점 세개 메뉴 버튼 클릭
        if (e.target.classList.contains('macau-todo-menu-btn')) {
            e.stopPropagation();
            console.log('Menu button clicked:', e.target);
            toggleMenu(e.target);
            return;
        }
        
        // 카테고리별 항목 추가
        if (e.target.classList.contains('macau-add-to-category-btn')) {
            const categoryName = e.target.dataset.category;
            const input = document.querySelector(`.macau-category-item-input[data-category="${categoryName}"]`);
            console.log('카테고리별 항목 추가 클릭:', categoryName, input?.value);
            
            if (input && input.value.trim()) {
                const newItem = {
                    text: input.value.trim(),
                    done: false,
                    id: Date.now()
                };
                userCategories[categoryName].push(newItem);
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                console.log('카테고리에 항목 추가됨:', categoryName, newItem);
                
                renderUserCategories();
                setTimeout(() => {
                    restoreCheckboxStates();
                    console.log('카테고리별 항목 추가 후 렌더링 완료');
                }, 50);
                
                showToast(`"${categoryName}"에 항목이 추가되었습니다! ✅`);
            } else {
                showToast('항목 이름을 입력해주세요.');
                input?.focus();
            }
        }

        // 준비물 삭제
        if (e.target.classList.contains('macau-delete-todo-btn')) {
            const categoryName = e.target.dataset.category;
            const itemId = parseInt(e.target.dataset.id);
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            if (confirm('이 항목을 삭제하시겠습니까?')) {
                userCategories[categoryName] = userCategories[categoryName].filter(item => item.id !== itemId);
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
                restoreCheckboxStates();
            }
        }

        // 준비물 편집
        if (e.target.classList.contains('macau-edit-todo-btn')) {
            const categoryName = e.target.dataset.category;
            const itemId = parseInt(e.target.dataset.id);
            const item = userCategories[categoryName].find(item => item.id === itemId);
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            const newText = prompt('항목 수정:', item.text);
            if (newText && newText.trim()) {
                item.text = newText.trim();
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
                restoreCheckboxStates();
            }
        }

        // 카테고리 삭제
        if (e.target.classList.contains('macau-delete-category-btn')) {
            const categoryName = e.target.dataset.category;
            if (confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
                delete userCategories[categoryName];
                localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                renderUserCategories();
            }
        }

        // 기본 준비물 수정 기능
        if (e.target.classList.contains('macau-edit-basic-btn')) {
            const text = e.target.dataset.text;
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            const newText = prompt('항목 수정:', text);
            if (newText && newText.trim()) {
                // 해당 텍스트 요소 찾아서 업데이트
                const textElement = e.target.closest('.macau-todo-item').querySelector('.macau-todo-text');
                textElement.textContent = newText.trim();
                
                // 버튼의 data-text도 업데이트
                const menuBtn = e.target.closest('.macau-todo-menu-wrapper').querySelector('.macau-todo-menu-btn');
                menuBtn.dataset.text = newText.trim();
                e.target.dataset.text = newText.trim();
                
                // 같은 드롭다운의 삭제 버튼도 업데이트
                const deleteBtn = e.target.parentElement.querySelector('.macau-delete-basic-btn');
                if (deleteBtn) {
                    deleteBtn.dataset.text = newText.trim();
                }
                
                // 기본 준비물 텍스트와 체크박스 상태 저장
                saveBasicItemTexts();
                saveCheckboxStates();
            }
        }

        // 기본 준비물 삭제 기능
        if (e.target.classList.contains('macau-delete-basic-btn')) {
            const text = e.target.dataset.text;
            
            // 메뉴 닫기
            document.querySelectorAll('.macau-todo-menu-dropdown').forEach(menu => {
                menu.classList.remove('show');
            });
            
            if (confirm(`"${text}" 항목을 삭제하시겠습니까?`)) {
                // 해당 todo-item 전체를 숨김 처리
                const todoItemElement = e.target.closest('.macau-todo-item');
                todoItemElement.style.display = 'none';
                
                // 삭제된 항목 리스트에 추가하여 영구 저장
                let deletedItems = JSON.parse(localStorage.getItem('macao_deleted_basic_items') || '[]');
                if (!deletedItems.includes(text)) {
                    deletedItems.push(text);
                    localStorage.setItem('macao_deleted_basic_items', JSON.stringify(deletedItems));
                }
                
                // 체크박스 상태도 업데이트
                saveCheckboxStates();
            }
        }
    });

    // 체크박스 상태 변경 감지
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('macau-todo-checkbox')) {
            saveCheckboxStates();
            
            // 사용자 추가 항목의 체크박스 상태도 저장
            if (e.target.closest('#macau-user-categories')) {
                const itemElement = e.target.closest('[data-id]');
                if (itemElement) {
                    const categoryElement = e.target.closest('[data-category]');
                    const categoryName = categoryElement.dataset.category;
                    const itemId = parseInt(itemElement.dataset.id);
                    const item = userCategories[categoryName].find(item => item.id === itemId);
                    if (item) {
                        item.done = e.target.checked;
                        localStorage.setItem('macao_todo_categories', JSON.stringify(userCategories));
                    }
                }
            }
        }
    });

    // Enter 키로 항목 추가
    newTodoInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodoBtn.click();
        }
    });

    newCategoryInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategoryBtn.click();
        }
    });

    // 카테고리별 입력창에서 Enter 키
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('macau-category-item-input')) {
            const categoryButton = e.target.nextElementSibling;
            if (categoryButton) {
                categoryButton.click();
            }
        }
    });

    // 토스트 메시지 표시 함수
    function showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.todo-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `todo-toast todo-toast-${type}`;
        toast.textContent = message;
        
        // 토스트 스타일
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#6B7280',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: '600',
            zIndex: '10000',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            opacity: '0',
            transform: 'translateX(-50%) translateY(20px)'
        });
        
        document.body.appendChild(toast);
        
        // 애니메이션
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 초기 로드
    console.log('초기 로드 시작');
    console.log('초기 userCategories:', userCategories);
    renderUserCategories();
    restoreBasicItemTexts(); // 기본 준비물 텍스트 복원
    setTimeout(() => {
        restoreDeletedBasicItems(); // 삭제된 기본 준비물 복원
        restoreCheckboxStates();
        console.log('초기 로드 완료');
    }, 100);
    
    console.log('Todo script execution completed');
}

export function setTodoExecutor(executor) {
    // navigation.js에서 호출하는 함수 등록
    console.log('Todo executor set');
}

export function destroyTodo() {
    console.log('Todo system destroyed');
}