document.addEventListener('DOMContentLoaded', () => {
    // --- Chatbot Page Logic ---
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        // const ideaButton = document.getElementById('idea-button'); // Removed

        // const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`; // 추후 구현

        // Gemini API 호출 함수 비활성화 (추후 구현)
        // const callGeminiAPI = async (userPrompt, systemPrompt) => { ... };

        // 시스템 프롬프트 로드 함수 비활성화 (추후 구현)
        // const getSystemPrompt = async () => { ... };

        // 로그인 모달 관련 변수 및 함수 비활성화 (추후 구현)
        // const loginModalOverlay = document.getElementById('loginModalOverlay');
        // const closeLoginModalBtn = document.getElementById('closeLoginModal');
        // const googleLoginBtn = document.querySelector('.social-login-btn.google');
        // const showLoginModal = () => { ... };
        // const hideLoginModal = () => { ... };

        // API 호출 함수 비활성화 (추후 구현)
        // const proceedWithApiCall = async (messageText) => { ... };

        const handleSendMessage = async () => {
            const messageText = chatInput.value.trim();
            if (messageText === '') return;

            appendMessage('user', messageText);
            chatInput.value = '';
            
            // 짧은 딜레이 후 main.html로 이동
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
        };

        // 로그인 모달 관련 코드 제거
        // const handleLoginChoice = (e) => { ... }
        // closeLoginModalBtn.addEventListener('click', hideLoginModal);
        // googleLoginBtn.addEventListener('click', handleLoginChoice);

        // handleGetIdea function removed - functionality moved to send button

        const appendMessage = (sender, text) => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', sender);
            const icon = sender === 'bot' ? 'fa-plane-departure' : 'fa-user';
            
            if (sender === 'bot') {
                // AI 메시지는 타이핑 애니메이션으로 표시
                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.innerHTML = `<i class="fa-solid ${icon}"></i>`;
                
                const textElement = document.createElement('p');
                textElement.className = 'typing-text';
                
                messageDiv.appendChild(avatar);
                messageDiv.appendChild(textElement);
                chatMessages.appendChild(messageDiv);
                
                // 타이핑 애니메이션 실행
                typeText(textElement, text);
            } else {
                // 사용자 메시지는 자연스럽게 등장
                messageDiv.innerHTML = `<div class="avatar"><i class="fa-solid ${icon}"></i></div><p>${text}</p>`;
                messageDiv.style.opacity = '0';
                messageDiv.style.transform = 'translateY(20px)';
                chatMessages.appendChild(messageDiv);
                
                // 자연스러운 등장 애니메이션
                setTimeout(() => {
                    messageDiv.style.transition = 'all 0.4s ease-out';
                    messageDiv.style.opacity = '1';
                    messageDiv.style.transform = 'translateY(0)';
                }, 100);
            }
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        const typeText = (element, text, speed = 50) => {
            let i = 0;
            element.textContent = '';
            
            const typeInterval = setInterval(() => {
                element.textContent += text.charAt(i);
                i++;
                
                // 스크롤을 계속 하단으로 유지
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                if (i >= text.length) {
                    clearInterval(typeInterval);
                    // 타이핑 완료 후 입력창에 텍스트 자동 입력 시작
                    setTimeout(() => {
                        startInputSequence();
                    }, 1000);
                }
            }, speed);
        };
        
        const startInputSequence = () => {
            const userExamples = [
                "도쿄 2박3일 가고싶어!",
                "제주도로 힐링여행?",
                "부산 맛집투어 어때?",
                "오사카 쇼핑여행!"
            ];
            
            const randomExample = userExamples[Math.floor(Math.random() * userExamples.length)];
            
            // 입력창에 텍스트 타이핑 애니메이션
            typeIntoInput(randomExample);
        };
        
        const typeIntoInput = (text, speed = 100) => {
            let i = 0;
            chatInput.value = '';
            chatInput.focus();
            
            const inputTypeInterval = setInterval(() => {
                chatInput.value += text.charAt(i);
                i++;
                
                if (i >= text.length) {
                    clearInterval(inputTypeInterval);
                    // 입력 완료 후 전송 버튼 클릭 효과
                    setTimeout(() => {
                        animateSendButton();
                    }, 800);
                }
            }, speed);
        };
        
        const animateSendButton = () => {
            // 전송 버튼 클릭 애니메이션
            sendButton.style.transform = 'scale(0.9)';
            sendButton.style.background = '#ff5252';
            
            setTimeout(() => {
                sendButton.style.transform = 'scale(1)';
                sendButton.style.background = '#FF6B6B';
                
                // 데모용 사용자 메시지 출력 (실제 전송 로직 없이)
                setTimeout(() => {
                    addUserExampleMessage();
                    // 입력창은 비우지 않음 - 실제 사용자가 다시 사용할 수 있도록
                }, 200);
            }, 150);
        };
        
        const addUserExampleMessage = () => {
            // 현재 입력창의 텍스트를 사용자 메시지로 출력
            const messageText = chatInput.value.trim();
            
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'user', 'example-message');
            messageDiv.innerHTML = `<div class="avatar"><i class="fa-solid fa-user"></i></div><p>${messageText}</p>`;
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px) scale(0.95)';
            
            chatMessages.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0) scale(1)';
            }, 200);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        // 타이핑 인디케이터 관련 함수 비활성화 (추후 구현)
        // const showTypingIndicator = () => { ... };
        // const hideTypingIndicator = () => { ... };

        sendButton.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleSendMessage();
            }
        });
        // ideaButton event listener removed
        
        // 페이지 로드 시 빈 화면에서 시작해서 동적으로 대화 생성
        const startConversation = () => {
            // 2초 후 AI 메시지 등장
            setTimeout(() => {
                appendMessage('bot', '어디로 여행 가시나요? 🌍');
            }, 2000);
        };
        
        // 페이지 로드 후 대화 시작
        startConversation();
    }

    // --- Main Page (main.html) Logic ---
    const pagesWrapper = document.getElementById('pagesWrapper');
    if (pagesWrapper) {
        const installGuideOverlay = document.getElementById('installGuideOverlay');
        const closeGuideBtn = document.getElementById('closeGuideBtn');
        const installNowBtn = document.getElementById('installNowBtn');
        const skipInstallBtn = document.getElementById('skipInstallBtn');

        if (installGuideOverlay) {
            const hasSeenInstallGuide = localStorage.getItem('macau-install-guide-seen');
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isInStandaloneMode = window.navigator.standalone === true;

            if (!isInStandaloneMode && !hasSeenInstallGuide) {
                setTimeout(() => {
                    installGuideOverlay.classList.add('show');
                }, 1000);
            }

            closeGuideBtn.addEventListener('click', () => hideInstallGuide());
            skipInstallBtn.addEventListener('click', () => hideInstallGuide());

            installNowBtn.addEventListener('click', () => {
                hideInstallGuide();
                if (isIOS) {
                    alert('📱 하단의 공유 버튼을 눌러 "홈 화면에 추가"를 선택해주세요!');
                } else {
                    alert('📱 브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요!');
                }
            });

            installGuideOverlay.addEventListener('click', (e) => {
                if (e.target === installGuideOverlay) {
                    hideInstallGuide();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && installGuideOverlay.classList.contains('show')) {
                    hideInstallGuide();
                }
            });

            function hideInstallGuide() {
                installGuideOverlay.classList.remove('show');
                localStorage.setItem('macau-install-guide-seen', 'true');
            }

            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
            });

            if (!isIOS) {
                installNowBtn.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        hideInstallGuide();
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        deferredPrompt = null;
                    }
                });
            }
        }

        const dayTabs = document.querySelectorAll('.day-tab');
        const indicatorDots = document.querySelectorAll('.indicator-dot');
        const swipeHint = document.getElementById('swipeHint');
        
        const pageNames = ['info', 'day1', 'day2', 'day3', 'day4', 'budget'];
        let currentPage = 0;
        const totalPages = 6;

        const pageFiles = [
            'pages/info.html',
            'pages/day1.html',
            'pages/day2.html',
            'pages/day3.html',
            'pages/day4.html',
            'pages/budget.html'
        ];

        const loadedPages = new Set();

        async function loadPageContent(pageIndex) {
            if (loadedPages.has(pageIndex)) return;

            const pageElement = document.getElementById(`page-${pageIndex}`);
            if (!pageElement) return;

            try {
                const response = await fetch(pageFiles[pageIndex]);
                if (response.ok) {
                    const content = await response.text();
                    pageElement.innerHTML = content;
                    loadedPages.add(pageIndex);
                    initAllSliders();
                    initImagePopup();
                    initLocationButtons();
                } else {
                    pageElement.innerHTML = '<div class="error">페이지를 불러올 수 없습니다.</div>';
                }
            } catch (error) {
                pageElement.innerHTML = '<div class="error">페이지 로딩 중 오류가 발생했습니다.</div>';
            }
        }

        async function preloadAdjacentPages(pageIndex) {
            await loadPageContent(pageIndex);
            if (pageIndex > 0) {
                loadPageContent(pageIndex - 1);
            }
            if (pageIndex < pageFiles.length - 1) {
                loadPageContent(pageIndex + 1);
            }
        }

        async function updatePage(pageIndex) {
            currentPage = Math.max(0, Math.min(5, pageIndex));
            const translateX = -currentPage * (100 / 6);
            pagesWrapper.style.transform = `translateX(${translateX}%)`;
            
            dayTabs.forEach((tab, index) => {
                tab.classList.toggle('active', index === currentPage);
            });
            
            indicatorDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentPage);
            });

            await preloadAdjacentPages(currentPage);
        }

        updatePage(0);

        dayTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => updatePage(index));
        });

        indicatorDots.forEach((dot, index) => {
            dot.addEventListener('click', () => updatePage(index));
        });

        let startX, startY, currentX, isDragging, isHorizontalSwipe;
        pagesWrapper.addEventListener('touchstart', (e) => {
            if (e.target.closest('.place-images')) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = false;
            isHorizontalSwipe = false;
        });

        pagesWrapper.addEventListener('touchmove', (e) => {
            if (e.target.closest('.place-images')) return;
            if (isDragging) {
                currentX = e.touches[0].clientX;
                e.preventDefault();
                return;
            }
            const currentY = e.touches[0].clientY;
            currentX = e.touches[0].clientX;
            const deltaX = Math.abs(startX - currentX);
            const deltaY = Math.abs(startY - currentY);
            if (deltaX > deltaY && deltaX > 10) {
                isHorizontalSwipe = true;
                isDragging = true;
                e.preventDefault();
            }
        });

        pagesWrapper.addEventListener('touchend', (e) => {
            if (e.target.closest('.place-images')) return;
            if (!isDragging || !isHorizontalSwipe) return;
            isDragging = false;
            isHorizontalSwipe = false;
            const deltaX = startX - currentX;
            const threshold = 50;
            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0 && currentPage < 5) {
                    updatePage(currentPage + 1);
                } else if (deltaX < 0 && currentPage > 0) {
                    updatePage(currentPage - 1);
                }
            }
        });

        let startMouseY = 0;
        let isMouseHorizontalDrag = false;
        pagesWrapper.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startMouseY = e.clientY;
            isDragging = false;
            isMouseHorizontalDrag = false;
            pagesWrapper.style.cursor = 'grabbing';
        });

        pagesWrapper.addEventListener('mousemove', (e) => {
            if (isDragging && isMouseHorizontalDrag) {
                currentX = e.clientX;
                return;
            }
            if (!isDragging && !isMouseHorizontalDrag) {
                const deltaX = Math.abs(startX - e.clientX);
                const deltaY = Math.abs(startMouseY - e.clientY);
                if (deltaX > deltaY && deltaX > 10) {
                    isMouseHorizontalDrag = true;
                    isDragging = true;
                    currentX = e.clientX;
                }
            }
        });

        pagesWrapper.addEventListener('mouseup', () => {
            if (!isDragging || !isMouseHorizontalDrag) {
                pagesWrapper.style.cursor = 'grab';
                return;
            }
            isDragging = false;
            isMouseHorizontalDrag = false;
            pagesWrapper.style.cursor = 'grab';
            const deltaX = startX - currentX;
            const threshold = 50;
            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0 && currentPage < 5) {
                    updatePage(currentPage + 1);
                } else if (deltaX < 0 && currentPage > 0) {
                    updatePage(currentPage - 1);
                }
            }
        });

        pagesWrapper.addEventListener('mouseleave', () => {
            isDragging = false;
            pagesWrapper.style.cursor = 'grab';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPage > 0) {
                updatePage(currentPage - 1);
            } else if (e.key === 'ArrowRight' && currentPage < 5) {
                updatePage(currentPage + 1);
            }
        });

        if (swipeHint) {
            setTimeout(() => {
                swipeHint.classList.add('show');
                setTimeout(() => {
                    swipeHint.classList.remove('show');
                }, 3000);
            }, 2000);
        }

        if ('caches' in window) {
            window.addEventListener('load', () => {
                caches.open('macau-travel-v1').then(cache => {
                    cache.add(window.location.href);
                    pageFiles.forEach(file => cache.add(file));
                }).catch(err => {});
            });
        }

        let sliderStates = {};

        function initSlider(sliderId) {
            if (!sliderStates[sliderId]) {
                sliderStates[sliderId] = {
                    currentSlide: 0,
                    totalSlides: document.querySelectorAll(`#${sliderId} .place-images-slider img`).length
                };
            }
        }

        function showSlide(sliderId, slideIndex) {
            initSlider(sliderId);
            const slider = document.getElementById(sliderId);
            if (!slider) return;
            const sliderTrack = slider.querySelector('.place-images-slider');
            const dots = slider.querySelectorAll('.place-images-dot');
            const counter = slider.querySelector('.place-images-counter');
            const totalSlides = sliderStates[sliderId].totalSlides;
            slideIndex = Math.max(0, Math.min(slideIndex, totalSlides - 1));
            sliderStates[sliderId].currentSlide = slideIndex;
            sliderTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === slideIndex);
            });
            if (counter) {
                counter.textContent = `${slideIndex + 1}/${totalSlides}`;
            }
        }

        window.nextSlide = nextSlide;
        window.prevSlide = prevSlide;
        window.showSlide = showSlide;

        function nextSlide(sliderId) {
            initSlider(sliderId);
            const { currentSlide, totalSlides } = sliderStates[sliderId];
            const next = currentSlide + 1 >= totalSlides ? 0 : currentSlide + 1;
            showSlide(sliderId, next);
        }

        function prevSlide(sliderId) {
            initSlider(sliderId);
            const { currentSlide, totalSlides } = sliderStates[sliderId];
            const prev = currentSlide - 1 < 0 ? totalSlides - 1 : currentSlide - 1;
            showSlide(sliderId, prev);
        }

        function initAllSliders() {
            const sliders = document.querySelectorAll('.place-images');
            sliders.forEach(slider => {
                if (slider.id) {
                    initSlider(slider.id);
                    showSlide(slider.id, 0);
                }
            });
        }

        function initImagePopup() {
            const images = document.querySelectorAll('.place-images-slider img');
            images.forEach(img => {
                img.removeEventListener('click', handleImageClick);
                img.addEventListener('click', handleImageClick);
            });
        }

        function handleImageClick(e) {
            const img = e.target;
            const popupOverlay = document.getElementById('imagePopupOverlay');
            const popupImg = document.getElementById('popupImage');
            const popupTitle = document.getElementById('popupTitle');
            const popupDescription = document.getElementById('popupDescription');
            if (popupOverlay && popupImg) {
                popupImg.src = img.src;
                popupImg.alt = img.alt;
                if (popupTitle) popupTitle.textContent = img.alt || '여행 사진';
                if (popupDescription) popupDescription.textContent = '클릭하거나 ESC 키를 눌러 닫기';
                popupOverlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeImagePopup() {
            const popupOverlay = document.getElementById('imagePopupOverlay');
            if (popupOverlay) {
                popupOverlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        }

        const popupOverlay = document.getElementById('imagePopupOverlay');
        const popupClose = document.getElementById('popupClose');
        if (popupClose) {
            popupClose.addEventListener('click', closeImagePopup);
        }
        if (popupOverlay) {
            popupOverlay.addEventListener('click', (e) => {
                if (e.target === popupOverlay) {
                    closeImagePopup();
                }
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeImagePopup();
            }
        });

        function openGoogleMaps(query) {
            const encodedQuery = encodeURIComponent(query);
            const googleMapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;
            window.open(googleMapsUrl, '_blank');
        }

        function initLocationButtons() {
            const locationButtons = document.querySelectorAll('.map-btn');
            locationButtons.forEach(btn => {
                const originalHref = btn.getAttribute('href');
                if (originalHref && originalHref.includes('maps.google.com')) {
                    btn.removeAttribute('href');
                    btn.style.cursor = 'pointer';
                    const coordMatch = originalHref.match(/q=([^&]+)/);
                    if (coordMatch) {
                        const coords = coordMatch[1];
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            openGoogleMaps(coords);
                        });
                    }
                }
                const locationText = btn.textContent.trim().replace('📍', '').trim();
                if (locationText && !btn.hasAttribute('href')) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        openGoogleMaps(locationText + ' 마카오');
                    });
                }
            });
        }
    }
});